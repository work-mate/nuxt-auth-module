# Auth Module Simplification Plan

---

## Change 1 — Open Login Body + Server-Plugin Schema Registration

### Problem

`LocalAuthLoginData` locked callers to `principal` + `password`. Config had `endpoints.signIn.body.{ principal, password }` to remap field names. Rigid, unnecessary abstraction — callers should own their payload.

Validation also needed an API change: schemas can't ride along in `nuxt.config` because Nuxt 4 runs Nitro in a **separate worker process** (confirmed via `.nuxt/nitro.json` socketPath). Zod schemas aren't JSON-serializable, so `runtimeConfig` strips them, and module-level state in the Nuxt process is invisible to the Nitro worker. Schemas must be registered inside the worker.

### What changed

**Removed entirely:**

- `LocalAuthLoginData` interface (was in [src/runtime/providers/LocalAuthProvider.ts](src/runtime/providers/LocalAuthProvider.ts))
- `AuthLoginData` base interface (was in [src/runtime/models.ts](src/runtime/models.ts))
- `endpoints.signIn.body` config section
- `defaultOptions.endpoints.signIn.body`
- Hard-coded `principal`/`password` checks in `validateRequestBody`
- Dead `schema?: ZodType` fields on `signIn` and `signUp` endpoint option types

**New API — `defineAuthEndpointSchemas`:**

Schemas are now declared in a Nitro server plugin. Both the plugin and `LocalAuthProvider.validateRequestBody` execute in the same Nitro worker, so they share a plain module-level `Map` in [src/runtime/endpoint-schemas.ts](src/runtime/endpoint-schemas.ts). The helper is auto-imported by the module via `addServerImports`, so user plugins don't need an explicit import path.

```typescript
// playground/server/plugins/auth-schemas.ts
import { z } from "zod";

export default defineNitroPlugin(() => {
  defineAuthEndpointSchemas({
    signIn: z.object({
      email_address: z.email(),
      password: z.string().min(8),
    }),
  });
});
```

```typescript
// src/runtime/providers/LocalAuthProvider.ts — validateRequestBody
validateRequestBody(body: Record<string, any>): boolean {
  const schema = endpointSchemas.get("signIn");
  if (!schema) return true;
  const result = schema.safeParse(body);
  if (!result.success) {
    throw {
      message: "Invalid request body",
      data: flattenError(result.error).fieldErrors,
    } satisfies ErrorResponse;
  }
  return true;
}
```

Same pattern extends to `signUp` and any future endpoint — just add another key under `defineAuthEndpointSchemas({...})`.

**Updated:**

- `AuthProviderInterface.login` signature ([src/runtime/models.ts](src/runtime/models.ts)): `authData?: Record<string, any>`
- `LocalAuthProvider.login` body construction: strip `provider` key, spread rest directly

  ```typescript
  const { provider: _, ...body } = authData as Record<string, any>;
  // pass body to ofetch
  ```

- Plugin `$auth.login()` signature widened from `Record<string, string>` to `Record<string, any>`

**Files touched:**

- [src/runtime/endpoint-schemas.ts](src/runtime/endpoint-schemas.ts) — new module-level Map + `defineAuthEndpointSchemas` export
- [src/runtime/providers/LocalAuthProvider.ts](src/runtime/providers/LocalAuthProvider.ts) — drop `LocalAuthLoginData`, `body` config, dead `schema` option fields; reads from `endpointSchemas`
- [src/module.ts](src/module.ts) — register `defineAuthEndpointSchemas` as a server auto-import; no longer attempts to extract schemas from options
- [src/runtime/models.ts](src/runtime/models.ts)
- [src/runtime/providers/GithubAuthProvider.ts](src/runtime/providers/GithubAuthProvider.ts) (import cleanup)
- [src/runtime/providers/GoogleAuthProvider.ts](src/runtime/providers/GoogleAuthProvider.ts) (import cleanup)
- [src/runtime/plugin/auth.ts](src/runtime/plugin/auth.ts) (type widening)
- [playground/nuxt.config.ts](playground/nuxt.config.ts) (remove `body` config and inline `schema`)
- [playground/server/plugins/auth-schemas.ts](playground/server/plugins/auth-schemas.ts) — new file demonstrating `defineAuthEndpointSchemas`
- [playground/server/api/auth/login/password.post.ts](playground/server/api/auth/login/password.post.ts) (use generic body fields)
- [playground/components/TestNavigations.vue](playground/components/TestNavigations.vue) (pass fields directly, no `principal` key)

---

## Change 2 — Zod Schema for AuthUser

### Problem

`AuthUser` is an empty interface (`models.ts:30`). No runtime validation of user data from API. No TypeScript inference of actual user shape.

### Approach

Add `zod` as a dependency. Module options accept a Zod schema; `AuthUser` is inferred from it.

**Module option (nuxt.config.ts usage):**

```typescript
import { z } from "zod";

auth: {
  userSchema: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
  });
}
```

**Type inference:**

```typescript
// module.ts — generic on schema
export interface ModuleOptions<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  userSchema?: TSchema;
  // ...
}

// AuthUser becomes z.infer<TSchema>
export type AuthUser<TSchema extends z.ZodTypeAny = z.ZodObject<any>> =
  z.infer<TSchema>;
```

**Runtime validation** — in `fetchUserData` of each provider, after extracting user object:

```typescript
if (this.userSchema) {
  return { user: this.userSchema.parse(user) };
}
return { user };
```

**Files touched:**

- `package.json` — add `zod`
- `src/runtime/models.ts` — update `AuthUser` type
- `src/module.ts` — add `userSchema` to `ModuleOptions`
- `src/runtime/providers/LocalAuthProvider.ts` — validate in `fetchUserData`
- `src/runtime/providers/GithubAuthProvider.ts` — same
- `src/runtime/providers/GoogleAuthProvider.ts` — same
- `src/runtime/providers/AuthProvider.ts` — thread schema through constructor

---

## Suggested Additional Simplifications

### 3 — Flatten endpoint config

Current nesting is verbose. Proposal — shorthand strings for simple cases:

```typescript
// before
signIn: { path: '/api/login', method: 'POST', tokenKey: 'data.token' }

// after (string shorthand = POST, tokenKey defaults to 'token')
signIn: '/api/login'
// or full object when needed
signIn: { path: '/api/login', tokenKey: 'data.token' }
```

`defu` already handles partial merge — just add string-detection logic in provider constructor.

### 4 — Remove `tokenType` from per-provider config

Currently `tokenType` lives in `ModuleOptions.token.type` (global). No provider needs to override it individually. Already global — remove any per-provider duplication and always read from `this.config.token.type`.

### 5 — Single `defaultProvider` auto-inference

If only one provider is configured, skip requiring `defaultProvider` — infer it automatically. Only require explicit config when multiple providers exist.

### 6 — Remove `AccessTokensNames` type

`AccessTokensNames` (`AuthProvider.ts:18-23`) is a near-duplicate of `AccessTokens` with renamed keys. Used only for cookie key naming. Replace with a `getCookieNames()` helper that derives names from `AccessTokens` shape — no separate type needed.

---

## File Inventory

| File                                                       | Changes                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [src/runtime/models.ts](src/runtime/models.ts)             | Remove `AuthLoginData`, update `AuthUser` to Zod-inferred                            |
| [src/runtime/providers/LocalAuthProvider.ts](src/runtime/providers/LocalAuthProvider.ts) | Drop `LocalAuthLoginData`, `body` config, open login body; reads schema from `endpointSchemas` |
| [src/runtime/endpoint-schemas.ts](src/runtime/endpoint-schemas.ts) | New: module-level Map + `defineAuthEndpointSchemas` helper                          |
| [src/runtime/providers/AuthProvider.ts](src/runtime/providers/AuthProvider.ts) | Thread `userSchema`, remove `AccessTokensNames`                          |
| [src/runtime/providers/GithubAuthProvider.ts](src/runtime/providers/GithubAuthProvider.ts) | Import cleanup, Zod user validation                                   |
| [src/runtime/providers/GoogleAuthProvider.ts](src/runtime/providers/GoogleAuthProvider.ts) | Same                                                                  |
| [src/module.ts](src/module.ts)                             | Add `userSchema` to `ModuleOptions`; auto-infer `defaultProvider`; `addServerImports` for `defineAuthEndpointSchemas` |
| [src/runtime/plugin/auth.ts](src/runtime/plugin/auth.ts)   | Widen login param type                                                               |
| [src/runtime/server/api/login.post.ts](src/runtime/server/api/login.post.ts) | No change (already generic)                                        |
| [playground/nuxt.config.ts](playground/nuxt.config.ts)     | Remove `body` config and inline `schema`; add `userSchema` example                   |
| [playground/server/plugins/auth-schemas.ts](playground/server/plugins/auth-schemas.ts) | New: registers schemas via `defineAuthEndpointSchemas`                  |
| [playground/components/TestNavigations.vue](playground/components/TestNavigations.vue) | Pass fields directly                                                    |
| [package.json](package.json)                               | Add `zod`                                                                            |

---

## Stage 3 — Documentation Update (Nuxt 4)

### Problem

`src/module.ts` declares `compatibility: { nuxt: ">=3.0.0" }` but `package.json` already requires `@nuxt/kit ^4.1.2`, `@nuxt/schema ^4.1.2`, `nuxt ^4.1.2`. Module only works on Nuxt 4. README says "Nuxt 3 & 4" — that's incorrect.

### What changes

**`src/module.ts`** — fix compatibility declaration:

```typescript
compatibility: {
  nuxt: "^4.0.0",
}
```

**`README.md`** — update throughout:

- Header: "Auth module for Nuxt 4 server apps"
- Installation section: note minimum Nuxt version is 4.0
- Add a "Nuxt 4 Compatibility" callout section
- Update config examples to reflect Change 1 (no `body` config) and Change 2 (Zod `userSchema`)
- Remove or mark deprecated the `body: { principal, password }` config docs

**`CHANGELOG.md`** — add entry for this release describing all changes.

**`AGENTS.md`** — remove outdated principal/password config notes.

### Files touched

| File            | Change                                   |
| --------------- | ---------------------------------------- |
| `src/module.ts` | Fix `compatibility.nuxt` to `^4.0.0`     |
| `README.md`     | Nuxt 4 only, new config API, Zod example |
| `CHANGELOG.md`  | Release entry                            |
| `AGENTS.md`     | Remove outdated config notes             |

---

## Stage 4 — Test Plan

### Current state

One E2E test (`test/basic.test.ts`) — only verifies module boots. Zero functional coverage. Framework: Vitest + `@nuxt/test-utils` (full SSR E2E).

### Test structure

Add a `test/fixtures/auth/` fixture (Nuxt app with auth module configured) to support functional E2E tests.

```
test/
  basic.test.ts              ← keep (boot smoke test)
  fixtures/
    basic/                   ← keep
    auth/                    ← new: full auth fixture app
      nuxt.config.ts
      server/api/            ← mock login/user/refresh endpoints
  local-auth.test.ts         ← new
  middleware.test.ts          ← new
  composables.test.ts         ← new
  token.test.ts               ← new
  zod-schema.test.ts          ← new (after Change 2)
```

### Test cases

#### `local-auth.test.ts` — LocalAuthProvider

| Test                                                                           | Scenario          |
| ------------------------------------------------------------------------------ | ----------------- |
| POST `/api/auth/login` with valid creds → 200 + sets cookies                   | Happy path        |
| POST `/api/auth/login` missing `provider` → 400                                | Validation        |
| POST `/api/auth/login` arbitrary extra fields forwarded to external API        | Change 1          |
| POST `/api/auth/login` with schema registered via `defineAuthEndpointSchemas` + invalid body → 400 + field errors | Schema validation |
| POST `/api/auth/logout` → clears auth cookies                                  | Logout            |
| GET `/api/auth/user` with valid token → returns user                           | User fetch        |
| GET `/api/auth/user` with no token → 401                                       | Unauthenticated   |
| POST `/api/auth/refresh` with valid refresh token → new tokens in cookies      | Token refresh     |
| POST `/api/auth/refresh` with expired token → 401                              | Refresh failure   |

#### `middleware.test.ts` — Route middleware

| Test                                                         | Scenario                |
| ------------------------------------------------------------ | ----------------------- |
| Protected route without token → redirect to login            | `auth` middleware       |
| Protected route with valid token → renders page              | `auth` middleware pass  |
| Guest route with valid token → redirect away                 | `auth-guest` middleware |
| Global middleware attaches `event.context.auth`              | Server middleware       |
| `event.context.auth.isAuthenticated()` returns correct value | Context API             |

#### `composables.test.ts` — useAuth, useAuthFetch

| Test                                              | Scenario          |
| ------------------------------------------------- | ----------------- |
| `$auth.loggedIn` is false before login            | Initial state     |
| `$auth.loggedIn` is true after login              | Post-login state  |
| `$auth.user` matches user API response            | User data         |
| `$auth.logout()` clears state + cookies           | Logout composable |
| `useAuthFetch` auto-attaches Authorization header | Fetch interceptor |
| `useAuthFetch` retries after token refresh on 401 | Refresh flow      |

#### `token.test.ts` — Token management

| Test                                                      | Scenario        |
| --------------------------------------------------------- | --------------- |
| Tokens stored as cookies with correct names               | Cookie naming   |
| Token expiry respected in cookie `maxAge`                 | Cookie lifetime |
| `getTokensFromEvent` reads correct cookies                | Read tokens     |
| `deleteProviderTokensFromCookies` clears all auth cookies | Cleanup         |

#### `zod-schema.test.ts` — Zod user schema (after Change 2)

| Test                                                          | Scenario                     |
| ------------------------------------------------------------- | ---------------------------- |
| Valid user response passes schema → typed user object         | Happy path                   |
| Invalid user response (missing required field) → server error | Schema violation             |
| No schema provided → user returned as-is (no validation)      | Backward compat              |
| TypeScript: `$auth.user.value` infers schema type             | Type inference (build check) |

### Vitest config

Add `vitest.config.ts` at root:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30_000,
    coverage: {
      include: ["src/runtime/**"],
      reporter: ["text", "lcov"],
    },
  },
});
```

---

## Verification (all stages)

1. Playground login with arbitrary body fields (no `principal`/`password` keys) reaches external API.
2. Login with schema registered via [playground/server/plugins/auth-schemas.ts](playground/server/plugins/auth-schemas.ts) + invalid body → 400 with field-level errors from `flattenError`.
3. `userSchema.parse()` throws on bad user response — server returns 500 with schema error.
4. TypeScript: `$auth.user.value.email` resolves to `string` (not `any`) when schema provided.
5. Single-provider config works without `defaultProvider`.
6. `npm test` passes all new tests.
7. README examples match actual module API.
