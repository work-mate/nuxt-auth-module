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
  },
  token: {
    type: string,
    maxAge: number,
    cookiesNames: {
      accessToken: string;
      refreshToken: string;
      authProvider: string;
    };
  }
}

type ModuleProvidersOptions = {
  local?: LocalAuthInitializerOptions,
}

type LocalAuthInitializerOptions = {
  endpoints?: {
    signIn?: {
      path?: string;
      method?:
        | "GET"
        | "HEAD"
        | "PATCH"
        | "POST"
        | "PUT"
        | "DELETE"
        | "CONNECT"
        | "OPTIONS"
        | "TRACE"
        | "get"
        | "head"
        | "patch"
        | "post"
        | "put"
        | "delete"
        | "connect"
        | "options"
        | "trace";
      tokenKey?: string;
      body?: {
        principal?: string;
        password?: string;
      };
    };
    signOut?: { path: string; method: string } | false;
    signUp?: { path?: string; method?: string } | false;
    user?: { path: string; userKey: string } | false;
  };
}

```

## Usage
#### composables

```ts
const {
  state, login, logout, refreshUser
} = useAuth();

// state is of type AuthState
type AuthState =
  | { loggedIn: true; user: any; token: string; refreshToken?: string }
  | { loggedIn: false; user: null }
```

#### Logging in
```ts
const {
  login
} = useAuth();

// to login
login("local", {
  principal,
  password,
})
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



