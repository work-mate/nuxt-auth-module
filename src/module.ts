import {
  defineNuxtModule,
  createResolver,
  logger,
  addImportsDir,
  addPlugin,
  addServerHandler,
  addRouteMiddleware,
} from "@nuxt/kit";
import defu from "defu";
import type { LocalAuthInitializerOptions } from "./runtime/providers/LocalAuthProvider";
import type { GithubAuthInitializerOptions } from "./runtime/providers/GithubAuthProvider";
import type { GoogleAuthInitializerOptions } from "./runtime/providers/GoogleAuthProvider";
export { LocalAuthProvider } from "./runtime/providers/LocalAuthProvider";
export { AuthProvider } from "./runtime/providers/AuthProvider";

export type ModuleProvidersOptions = {
  local?: LocalAuthInitializerOptions;
  github?: GithubAuthInitializerOptions;
  google?: GoogleAuthInitializerOptions;
  // [key: string]: AuthProviderInterface
};

export type DeepRequired<T> = Required<{
  [P in keyof T]: T[P] extends object | undefined
    ? DeepRequired<Required<T[P]>>
    : T[P];
}>;

export interface ModuleOptions {
  global: boolean;
  providers: ModuleProvidersOptions;
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
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@workmate/nuxt-auth",
    configKey: "auth",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  defaults: {
    global: false,
    providers: {},
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
        tokenType: "auth:tokenType",
      },
    },
  },
  async setup(options, nuxt) {
    logger.log("@workmate/nuxt-auth:: installing module");
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.auth = defu(
      nuxt.options.runtimeConfig.auth,
      options,
    );

    nuxt.options.runtimeConfig.public.auth = defu(
      nuxt.options.runtimeConfig.public.auth,
      {
        redirects: options.redirects,
        global: options.global,
        apiClient: options.apiClient,
      },
    );

    addImportsDir(resolver.resolve("runtime/composables"));
    addPlugin(resolver.resolve("./runtime/plugin/auth"));
    addPlugin(resolver.resolve("./runtime/plugin/auth-fetch"), {
      append: true,
    });

    addServerHandler({
      middleware: true,
      handler: resolver.resolve("./runtime/server/middleware/auth"),
    });

    addServerHandler({
      route: "/api/auth/login",
      handler: resolver.resolve("./runtime/server/api/login.post"),
    });

    addServerHandler({
      route: "/api/auth/logout",
      handler: resolver.resolve("./runtime/server/api/logout.post"),
    });

    addServerHandler({
      route: "/api/auth/user",
      handler: resolver.resolve("./runtime/server/api/user"),
    });

    addServerHandler({
      route: "/api/auth/refresh",
      handler: resolver.resolve("./runtime/server/api/refresh.post"),
    });

    if (nuxt.options.runtimeConfig.auth.providers.github) {
      addServerHandler({
        route: "/api/auth/callback/github",
        handler: resolver.resolve("./runtime/server/api/callback/github.get"),
      });
    }

    if (nuxt.options.runtimeConfig.auth.providers.google) {
      addServerHandler({
        route: "/api/auth/callback/google",
        handler: resolver.resolve("./runtime/server/api/callback/google.get"),
      });
    }
    addRouteMiddleware({
      name: "auth",
      path: resolver.resolve("./runtime/middleware/auth"),
    });

    addRouteMiddleware({
      name: "auth-guest",
      path: resolver.resolve("./runtime/middleware/auth-guest"),
    });

    if (nuxt.options.runtimeConfig.auth.global) {
      addRouteMiddleware({
        name: "auth-global",
        path: resolver.resolve("./runtime/middleware/auth.global"),
        global: true,
      });
    }

    logger.success("@workmate/nuxt-auth:: successfully installed");
  },
});

declare module "@nuxt/schema" {
  interface RuntimeConfig {
    auth: ModuleOptions;
  }

  interface PublicRuntimeConfig {
    auth: {
      redirects: ModuleOptions["redirects"];
      global: ModuleOptions["global"];
      apiClient: ModuleOptions["apiClient"];
    };
  }
}
