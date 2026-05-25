# @workmate/nuxt-auth

![NPM](https://img.shields.io/npm/l/@workmate/nuxt-auth) ![npm](https://img.shields.io/npm/v/@workmate/nuxt-auth) ![GitHub last commit](https://img.shields.io/github/last-commit/work-mate/nuxt-auth-module)

Auth module for Nuxt 3 & 4 apps. Supports local credentials, GitHub OAuth, and Google OAuth with Zod schema validation.

## Providers

| Provider | Key      | Status |
| -------- | -------- | ------ |
| Local    | local    | ✅     |
| GitHub   | github   | ✅     |
| Google   | google   | ✅     |
| Facebook | facebook | 🚧     |
| LinkedIn | linkedin | 🚧     |

## Installation

```bash
npm install @workmate/nuxt-auth zod
# or
yarn add @workmate/nuxt-auth zod
```

Add to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ["@workmate/nuxt-auth"],
});
```

---

## Configuration

```ts
// nuxt.config.ts
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
});

export default defineNuxtConfig({
  modules: ["@workmate/nuxt-auth"],
  auth: {
    global: false,
    defaultProvider: "local",
    redirects: {
      redirectIfNotLoggedIn: "/login",
      redirectIfLoggedIn: "/",
    },
    apiClient: {
      baseURL: "http://localhost:8080",
    },
    token: {
      type: "Bearer",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      cookiesNames: {
        accessToken: "auth:token",
        refreshToken: "auth:refreshToken",
        authProvider: "auth:provider",
        tokenType: "auth:tokenType",
      },
    },
    providers: {
      local: {
        endpoints: {
          signIn: {
            path: "/api/auth/login/password",
            method: "POST",
            tokenKey: "token",
            refreshTokenKey: "refresh_token",
          },
          signOut: { path: "/api/auth/logout", method: "POST" },
          user: { path: "/api/auth/user", userKey: "user" },
          refreshToken: {
            path: "/api/auth/refresh",
            method: "POST",
            tokenKey: "token",
            refreshTokenKey: "refresh_token",
            body: { token: "token", refreshToken: "refresh_token" },
          },
        },
        schemas: {
          login: z.object({
            email_address: z.email(),
            password: z.string().min(8),
          }),
          user: userSchema,
        },
      },

      github: {
        CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
        CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
        HASHING_SECRET: process.env.HASHING_SECRET || "",
        SCOPES: "user repo",
        schemas: { user: userSchema },
      },

      google: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
        HASHING_SECRET: process.env.HASHING_SECRET || "",
        SCOPES:
          "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        schemas: { user: userSchema },
      },
    },
  },
});
```

### Module options reference

```ts
interface ModuleOptions {
  global: boolean;
  defaultProvider?: string;
  redirects: {
    redirectIfNotLoggedIn?: string;
    redirectIfLoggedIn?: string;
  };
  apiClient: {
    baseURL: string;
  };
  token: {
    type: string;
    maxAge: number;
    cookiesNames: {
      accessToken: string;
      refreshToken: string;
      authProvider: string;
      tokenType: string;
    };
  };
  providers: {
    local?: LocalAuthInitializerOptions;
    github?: GithubAuthInitializerOptions;
    google?: GoogleAuthInitializerOptions;
  };
}

type HttpMethod =
  | "GET"
  | "HEAD"
  | "PATCH"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE";

type LocalAuthInitializerOptions = {
  endpoints?: {
    signIn?: {
      path?: string;
      method?: HttpMethod;
      tokenKey?: string;
      refreshTokenKey?: string;
    };
    signOut?: { path: string; method: HttpMethod } | false;
    signUp?: { path?: string; method?: HttpMethod } | false;
    user?: { path: string; userKey: string } | false;
    refreshToken?:
      | {
          path: string;
          method: HttpMethod;
          tokenKey: string;
          refreshTokenKey: string;
          body: { token: string; refreshToken: string };
        }
      | false;
  };
  schemas?: {
    login?: ZodType;
    user?: ZodType;
  };
};

type GithubAuthInitializerOptions = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  HASHING_SECRET: string;
  SCOPES?: string;
  schemas?: { user?: ZodType };
};

type GoogleAuthInitializerOptions = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  HASHING_SECRET: string;
  SCOPES?: string;
  schemas?: { user?: ZodType };
};
```

---

## Server routes

The module registers these routes on your Nuxt server:

| Method | Path                      | Description                           |
| ------ | ------------------------- | ------------------------------------- |
| POST   | /api/auth/login           | Login with any provider               |
| POST   | /api/auth/logout          | Clear session and cookies             |
| GET    | /api/auth/user            | Get the current authenticated user    |
| POST   | /api/auth/refresh         | Refresh access token                  |
| GET    | /api/auth/callback/github | GitHub OAuth callback (if configured) |
| GET    | /api/auth/callback/google | Google OAuth callback (if configured) |

### POST /api/auth/login

```ts
// Request body
{
  provider: string;          // "local" | "github" | "google"
  [key: string]: any;        // provider-specific fields (e.g. email_address, password)
}

// Response — local provider
{
  tokens: {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    provider: string;
  };
}

// Response — OAuth providers
{
  url: string;               // redirect to this URL to begin OAuth flow
}
```

### POST /api/auth/logout

No request body. Clears all auth cookies and calls the provider's logout endpoint if configured.

### GET /api/auth/user

No request body. Reads token from cookies.

```ts
// Response
{
  user: AuthUser | null;
}
```

### POST /api/auth/refresh

No request body. Reads tokens from cookies, calls the provider's refresh endpoint.

```ts
// Response
{
  tokens: {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    provider: string;
  };
}
```

### OAuth callbacks

Add `<base_url>/api/auth/callback/github` and `<base_url>/api/auth/callback/google` as the callback URLs in your OAuth app settings.

---

## Composables

All composables are auto-imported.

### `useAuth()`

Low-level access to the full auth plugin. Prefer the focused composables below for most use cases.

```ts
const {
  isLoggedIn,
  user,
  token,
  refreshToken,
  tokenType,
  provider,
  tokenNames,
  login,
  logout,
  refreshUser,
  refreshTokens,
} = useAuth();

// login(provider, data?, redirectTo?)
await login("local", { email_address: "me@example.com", password: "secret" });
await login("github");

// logout(redirectTo?)
await logout("/login");
```

### `useAuthLogin()`

Typed login functions. The local provider accepts any object — whatever you pass is sent directly to your `signIn` endpoint. If `schemas.login` is configured, the object is validated against it first; if not, it is forwarded as-is. You control the field names.

```ts
const { localLogin, googleLogin, githubLogin } = useAuthLogin();

// localLogin(opts, redirectTo?)
// opts shape comes entirely from your schemas.login Zod schema (or Record<string, any> if no schema)
await localLogin({ email_address: "me@example.com", password: "secret123" });
await localLogin({ username: "alice", pin: "1234" }); // different backend, different fields
await localLogin(
  { email_address: "me@example.com", password: "secret123" },
  "/dashboard",
);

// googleLogin(opts?, redirectTo?)
await googleLogin();
await googleLogin({ redirectUrl: "/dashboard" });

// githubLogin(opts?, redirectTo?)
await githubLogin();
```

### `useAuthUser()`

```ts
const { user, isLoggedIn, refreshUser } = useAuthUser();

// user: ComputedRef<AuthUser | null | undefined>
// isLoggedIn: ComputedRef<boolean>

if (isLoggedIn.value) {
  console.log(user.value);
}

await refreshUser(); // re-fetches user from the server
```

### `useAuthToken()`

```ts
const { token, refreshToken, tokenType, provider, tokenNames, refreshTokens } =
  useAuthToken();

// All values are computed refs
console.log(token.value); // current access token
console.log(provider.value); // "local" | "github" | "google"

await refreshTokens(); // exchange refresh token for new tokens
```

### `useAuthFetch()`

Wrapper around Nuxt's `useFetch` that automatically injects the Authorization header. Retries once on 401 after refreshing tokens.

```ts
const { data, error } = await useAuthFetch("/api/profile");

// Supports all useFetch options
const { data } = await useAuthFetch<User>("/api/profile", {
  method: "POST",
  body: { name: "Alice" },
});
```

---

## Plugins

### `$auth`

The full auth plugin, same as `useAuth()`.

```ts
const { $auth } = useNuxtApp();

if ($auth.isLoggedIn.value) {
  await $auth.logout();
}
```

### `$authFetch`

An `ofetch` instance pre-configured with your `apiClient.baseURL`, the current Authorization header, and automatic token refresh on 401. Use this instead of `$fetch` for authenticated requests.

```ts
const { $authFetch } = useNuxtApp();

const data = await $authFetch("/api/protected");
```

To set the base URL:

```ts
auth: {
  apiClient: {
    baseURL: "http://localhost:8080/v1",
  },
}
```

---

## Middlewares

### Route middleware

Protect a page (requires login):

```ts
// pages/dashboard.vue
definePageMeta({
  middleware: "auth",
});
```

Guest-only page (redirect away if logged in):

```ts
// pages/login.vue
definePageMeta({
  middleware: "auth-guest",
});
```

### Global middleware

Apply auth to all routes:

```ts
// nuxt.config.ts
auth: {
  global: true,
}
```

Opt a page out when global is enabled:

```ts
definePageMeta({
  auth: false,
});
```

Redirects are configured under `auth.redirects`:

- `redirectIfNotLoggedIn` — where `auth` middleware sends unauthenticated users (default: `"/login"`)
- `redirectIfLoggedIn` — where `auth-guest` middleware sends authenticated users (default: `"/"`)

---

## Schema validation

Schemas are defined in `nuxt.config.ts` per provider using Zod 4. They are converted to JSON Schema at build time and reconstructed at runtime — no serialization issues.

```ts
// nuxt.config.ts
import { z } from "zod";

local: {
  schemas: {
    login: z.object({ email_address: z.email(), password: z.string().min(8) }),
    user: z.object({ id: z.string(), email: z.email(), name: z.string().optional() }),
  },
}
```

**`schemas.login`** — the local provider sends whatever object you pass directly to your `signIn` endpoint. There are no fixed field names — use whatever your backend expects (`email_address`, `username`, `phone`, etc.). If `schemas.login` is configured, the body is validated server-side before being forwarded. Invalid bodies return HTTP 400 with field errors:

```json
{
  "message": "Validation error",
  "data": { "email_address": ["Invalid email"] }
}
```

If `schemas.login` is not configured, the body is forwarded as-is with no validation.

**`schemas.user`** — validated server-side when your backend returns user data. Mismatches throw a server error with field-level detail. Optional — omit to skip validation.

TypeScript infers the login payload type from your schema — `localLogin(opts)` is typed as the Zod output of `schemas.login`, or `Record<string, any>` if no schema is set.

---

## Migration: v1 → v2 (breaking changes in v2.0.0)

### Configuration

In v1, `signIn.body` mapped fixed field names (`principal`, `password`) onto the request. In v2 the body is open — you pass any object and it is sent as-is to your endpoint. Remove `signIn.body` entirely and add `schemas.login` to describe the shape your backend expects.

**Before:**

```ts
local: {
  endpoints: {
    signIn: {
      path: "/api/auth/login",
      tokenKey: "token",
      body: {
        principal: "email_address",
        password: "password",
      },
    },
  },
}
```

**After:**

```ts
import { z } from "zod";

local: {
  endpoints: {
    signIn: {
      path: "/api/auth/login",
      tokenKey: "token",
    },
  },
  schemas: {
    login: z.object({
      email_address: z.email(),
      password: z.string().min(8),
    }),
  },
}
```

### Login call

**Before:**

```ts
const { login } = useAuth();
await login("local", { principal: values.email, password: values.password });
```

**After:**

```ts
const { localLogin } = useAuthLogin();
await localLogin({ email_address: values.email, password: values.password });
```

### Peer dependency

Zod 4 is now required (`zod@^4.0.0`). If you were on Zod 3, upgrade:

```bash
npm install zod@^4.0.0
```

`z.toJSONSchema` and `z.fromJSONSchema` do not exist on Zod 3.
