# Auth Module Simplification Plan

---

## Change 1 — Open Login Body + Build-Time Schema Pipeline ✅ DONE

### Problem

`LocalAuthLoginData` locked callers to `principal` + `password`. Zod schemas can't be passed via `runtimeConfig` (Nuxt 4 runs Nitro in a separate worker; schemas aren't JSON-serializable). Callers should own their payload shape.

### What was built

**Approach:** schemas are defined in `nuxt.config.ts` per-provider, converted to JSON Schema at build time by `src/schema-utils.ts`, and written to a virtual `#auth-schemas` module. Both the Nuxt client and Nitro worker import from that module, reconstructing Zod schemas via `z.fromJSONSchema()`. No Nitro server plugin needed.

**New config API (`playground/nuxt.config.ts`):**

```typescript
import { z } from "zod";

auth: {
  providers: {
    local: {
      schemas: {
        login: z.object({ email_address: z.email(), password: z.string().min(8) }),
        user: z.object({ id: z.string(), email: z.email(), name: z.string().optional() }),
      },
      endpoints: { ... },
    },
    github: { schemas: { user: userSchema }, ... },
    google: { schemas: { user: userSchema }, ... },
  }
}
```

**Key files added/changed:**

| File | Role |
| ---- | ---- |
| [src/schema-utils.ts](src/schema-utils.ts) | Build-time: collect schemas from provider options, convert to JSON Schema, strip from serializable options, render `#auth-schemas` runtime + type files |
| [src/runtime/auth-schemas.ts](src/runtime/auth-schemas.ts) | Internal nested Map (provider → key → ZodType) + `defineAuthSchemas()` used by generated runtime |
| `#auth-schemas` (generated) | Auto-generated virtual module exporting `loginSchemas` and `userSchemas` keyed by provider |
| [src/runtime/composables/useAuthLogin.ts](src/runtime/composables/useAuthLogin.ts) | New composable with typed `local()`, `github()`, `google()` login functions using `LoginData` type |
| [src/runtime/providers/LocalAuthProvider.ts](src/runtime/providers/LocalAuthProvider.ts) | `validateRequestBody` reads `loginSchemas.local`; `fetchUserData` reads `userSchemas.local`; `LocalAuthLoginData` removed; open body (`Record<string, any>`) |
| [src/runtime/providers/GithubAuthProvider.ts](src/runtime/providers/GithubAuthProvider.ts) | `fetchUserData` reads `userSchemas.github` |
| [src/runtime/providers/GoogleAuthProvider.ts](src/runtime/providers/GoogleAuthProvider.ts) | `fetchUserData` reads `userSchemas.google` |
| [src/module.ts](src/module.ts) | Runs `collectSchemas`, writes `auth-schemas.gen.mjs` + `.d.ts` via `addTemplate`, sets `#auth-schemas` alias for both Nuxt and Nitro, strips schemas before `runtimeConfig` |
| [src/runtime/models.ts](src/runtime/models.ts) | `AuthUser` widened; `AuthLoginData` removed |
| [src/runtime/plugin/auth.ts](src/runtime/plugin/auth.ts) | Login param type widened |

**Generated type file exports:**

```typescript
// #auth-schemas (types)
export type LoginData = {
  local: { email_address: string; password: string };
  github: { redirectUrl?: string };
  google: { redirectUrl?: string };
};
export type UserDataByProvider = {
  local: { id: string; email: string; name?: string };
  github: { id: string; email: string; name?: string };
  google: { id: string; email: string; name?: string };
};
```

**`useAuthLogin` usage:**

```typescript
const { local } = useAuthLogin();
// local() is typed as (opts: LoginData["local"], redirectTo?: string) => ...
await local({ email_address: "me@example.com", password: "secret123" });
```

---

## Change 2 — Zod User Schema Validation ✅ DONE

Covered by the same pipeline as Change 1. Per-provider `schemas.user` is converted to JSON Schema at build time, reconstructed at runtime in `#auth-schemas`, and used in each provider's `fetchUserData`:

```typescript
// All three providers follow this pattern:
const schema = userSchemas.local; // | .github | .google
if (!schema) return { user };
const result = schema.safeParse(user);
if (!result.success) throw { message: "Invalid user response", data: flattenError(result.error).fieldErrors };
return { user: result.data };
```

---

## Stage 3 — Documentation Update ⬜ TODO

### Problem

README still references `principal`/`password` body config and `defineAuthEndpointSchemas` server plugin — neither is part of the actual implementation.

### What to change

**`README.md`** — update throughout:
- Config examples: use `schemas.login`/`schemas.user` per-provider instead of old `body: { principal, password }`
- Add `useAuthLogin` composable docs
- Remove `defineAuthEndpointSchemas` server plugin (not shipped)

**`CHANGELOG.md`** — add release entry for all changes.

**`AGENTS.md`** — remove outdated principal/password config notes.

### Files

| File | Change |
| ---- | ------ |
| `README.md` | New schema config API; `useAuthLogin` docs; remove stale examples |
| `CHANGELOG.md` | Release entry |
| `AGENTS.md` | Remove stale config notes |

---

## Stage 4 — Test Plan ⬜ TODO

### Current state

One E2E test (`test/basic.test.ts`) — only verifies module boots. Framework: Vitest + `@nuxt/test-utils`.

### Test structure

```
test/
  basic.test.ts              ← keep (boot smoke test)
  fixtures/
    basic/                   ← keep
    auth/                    ← new: full auth fixture app
      nuxt.config.ts
      server/api/            ← mock login/user/refresh endpoints
  local-auth.test.ts         ← new
  middleware.test.ts         ← new
  composables.test.ts        ← new
  token.test.ts              ← new
  schema.test.ts             ← new (covers login + user schema validation)
```

### Test cases

#### `local-auth.test.ts`

| Test | Scenario |
| ---- | -------- |
| POST `/api/auth/login` valid creds → 200 + sets cookies | Happy path |
| POST `/api/auth/login` missing `provider` → 400 | Validation |
| POST `/api/auth/login` arbitrary extra fields forwarded | Open body |
| POST `/api/auth/login` invalid body (schema) → 400 + field errors | Schema validation |
| POST `/api/auth/logout` → clears cookies | Logout |
| GET `/api/auth/user` valid token → returns user | User fetch |
| GET `/api/auth/user` no token → 401 | Unauthenticated |
| POST `/api/auth/refresh` valid refresh token → new tokens | Token refresh |
| POST `/api/auth/refresh` expired token → 401 | Refresh failure |

#### `schema.test.ts`

| Test | Scenario |
| ---- | -------- |
| Valid login body passes schema → forwarded | Happy path |
| Invalid login body → 400 + `fieldErrors` | Schema rejection |
| Valid user response passes schema → typed user | User schema pass |
| Invalid user response (missing field) → server error | User schema fail |
| No schema configured → body forwarded as-is | No schema |
| TypeScript: `LoginData["local"]` infers schema shape | Type check |

#### `middleware.test.ts`

| Test | Scenario |
| ---- | -------- |
| Protected route without token → redirect to login | `auth` middleware |
| Protected route with valid token → renders | `auth` pass |
| Guest route with valid token → redirect away | `auth-guest` |
| `event.context.auth.isAuthenticated()` correct | Context API |

#### `composables.test.ts`

| Test | Scenario |
| ---- | -------- |
| `$auth.loggedIn` false before login | Initial state |
| `$auth.loggedIn` true after login | Post-login |
| `$auth.user` matches user API response | User data |
| `$auth.logout()` clears state + cookies | Logout |
| `useAuthFetch` attaches Authorization header | Fetch interceptor |
| `useAuthFetch` retries after refresh on 401 | Refresh flow |
| `useAuthLogin.local()` validates with `loginSchemas.local` | Composable schema |

#### `token.test.ts`

| Test | Scenario |
| ---- | -------- |
| Tokens stored as cookies with correct names | Cookie naming |
| Token expiry respected in cookie `maxAge` | Cookie lifetime |
| `getTokensFromEvent` reads correct cookies | Read tokens |
| `deleteProviderTokensFromCookies` clears all | Cleanup |

---

## Verification (all stages)

1. Playground login with `{ email_address, password }` (no `principal` key) works end-to-end.
2. Invalid login body → 400 with `fieldErrors` from `flattenError`.
3. Bad user API response → server error with schema field errors.
4. TypeScript: `useAuthLogin().local()` param infers `{ email_address: string; password: string }`.
5. `npm test` passes all new tests.
7. README examples match actual module API.
