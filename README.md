<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: My Module
- Package name: my-module
- Description: My new Nuxt module
-->

# Country flags, capitals and currency library

![NPM](https://img.shields.io/npm/l/@workmate/nuxt-auth) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@workmate/nuxt-auth) ![npm](https://img.shields.io/npm/v/@workmate/nuxt-auth) ![Libraries.io dependency status for latest release, scoped npm package](https://img.shields.io/librariesio/release/npm/@workmate/nuxt-auth) ![GitHub last commit](https://img.shields.io/github/last-commit/work-mate/nuxt-auth-module)

<br />
Auth module for Nuxt 3 apps.

## Featured Auth Providers

| Provider      | Provider Key  | Status         |
| ------------- | ------------- | -------------- |
| Local         | local         | :heavy_check_mark: |
| Local Refresh | local_refresh | :x:            |
| Google        | google        | :x:            |
| Github        | github        | :x:            |
| Facebook      | facebook      | :x:            |

<!-- :construction: -->

## Installation

#### Package Manager

```bash
# using npm
npm install --save @workmate/nuxt-auth

# using yarn
yarn add @workmate/nuxt-auth
```

## Setup

### Add to modules

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    "@workmate/nuxt-auth"
  ],
  ...
});
```

### Configure Auth

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@workmate/nuxt-auth"],
  auth: {
    providers: {
      local: {
        endpoints: {
          signIn: {
            path: "/signin",
            method: "POST",
            tokenKey: "token",
            body: {
              principal: "username",
              password: "password",
            },
          },
        },
      },
    },
    global: false,
    redirects: {
      redirectIfNotLoggedIn: "/login",
      redirectIfLoggedIn: "/",
    },
    apiClient: {
      baseURL: "",
    },
    defaultProvider: "local",
    token: {
      type: "Bearer",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      cookiesNames: {
        accessToken: "auth:token",
        refreshToken: "auth:refreshToken",
        authProvider: "auth:provider",
      },
    },
  },
});
```

### Full List of Module Options

```ts
interface ModuleOptions {
  providers: ModuleProvidersOptions;
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
    };
  };
}

type ModuleProvidersOptions = {
  local?: LocalAuthInitializerOptions;
};
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
      body?: {
        principal?: string;
        password?: string;
      };
    };
    signOut?: { path: string; method: HttpMethod } | false;
    signUp?: { path?: string; method?: HttpMethod } | false;
    user?: { path: string; userKey: string } | false;
  };
};
```

## Usage

#### composables

```ts
const { loggedIn,  user, token, refreshToken, login, logout, refreshUser } = useAuth();

// state is of type AuthState
type AuthPlugin = {
  loggedIn: ComputedRef<boolean>;
  user: ComputedRef<any | null | undefined>;
  token: ComputedRef<string | undefined>;
  refreshToken: ComputedRef<string | undefined>;
  login: (
    provider: string | SupportedAuthProvider,
    data?: Record<string, string>,
    redirectTo?: string
  ) => Promise<
    | {
        tokens: AccessTokens;
      }
    | {
        message: string;
      }
  >;
  logout: (redirectTo?: string) => Promise<unknown>;
  refreshUser: () => Promise<void>;
};
```

To use useFetch with the authorization header, use `useAuthFetch`, and instead of using $fetch use $authFetch

```ts
useAuthFetch("/api/auth/melting", options);

// instead of $fetch,
$fetch("/api/auth/melting", options);

// use,
const { $authFetch } = useNuxtApp();
$authFetch("/api/auth/melting", options);
```

to change the base URI of the authFetch client, update the nuxt.config.ts

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  auth: {
    ...
    apiClient: {
      baseURL: "http://localhost:8080/v1",
    },
    ...
  },
})

```

#### Logging in

```ts
const { login } = useAuth();

// to login
login("local", {
  principal,
  password,
});
```

## middlewares

### Route middleware

To protect a page

```ts
// pages/index.vue
definePageMeta({
  middleware: "auth",
});

// or if adding it to a list of middlewares
definePageMeta({
  middleware: [..., "auth", ...],
});
```

To make sure a page is only accessible if you are not logged in. Eg. a login page

```ts
// pages/login.vue
definePageMeta({
  middleware: "auth-guest",
});

// or if adding it to a list of middlewares
definePageMeta({
  middleware: [..., "auth-guest", ...],
});
```

### Global middleware

For a global middleware, set the the `auth.global` to true in the `nuxt.config.ts` file

```ts
export default defineNuxtConfig({
  ...
  auth: {
    global: true,
    ...
  },
})
```

To prevent a page from being protected from auth, set the auth meta to false

```ts
// pages/index.vue
definePageMeta({
  auth: false,
});
```
