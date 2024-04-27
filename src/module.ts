import {
  defineNuxtModule,
  createResolver,
  logger,
  addImportsDir,
  installModule,
  addTypeTemplate,
  addPlugin,
  addServerHandler,
  addRouteMiddleware,
} from "@nuxt/kit";
import type { AuthProviderInterface } from "./runtime/models";
import defu from "defu";
import type { LocalAuthInitializerOptions, LocalAuthProvider } from "./runtime/providers/LocalAuthProvider";
export { LocalAuthProvider } from "./runtime/providers/LocalAuthProvider";
export { AuthProvider } from "./runtime/providers/AuthProvider";

export type ModuleProvidersOptions = {
  local?: LocalAuthInitializerOptions,
  // [key: string]: AuthProviderInterface
}

export type DeepRequired<T> = Required<{
  [P in keyof T]: T[P] extends object | undefined ? DeepRequired<Required<T[P]>> : T[P];
}>;

export interface ModuleOptions {
  providers: ModuleProvidersOptions;
  defaultProvider?: string;
  redirects: {
    redirectIfNotLoggedIn: string;
    redirectIfLoggedIn: string;
  },
  token: {
    type: "Bearer",
    maxAge: number,
    cookiesNames: {
      accessToken: string;
      refreshToken: string;
      authProvider: string;
    };
  }
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
    providers: {},
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
      }
    }
  },
  async setup(options, nuxt) {
    logger.log("@workmate/nuxt-auth:: installing module");
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.auth = defu(
      nuxt.options.runtimeConfig.auth,
      options
    );

    nuxt.options.runtimeConfig.public.auth = defu(
      nuxt.options.runtimeConfig.public.auth,
      {
        redirects: options.redirects,
      }
    );

    await installModule("@pinia/nuxt").catch((e) => {
      logger.error("Unable to install pinia: \n install pinia and @pinia/nuxt");
      throw e;
    });

    addImportsDir(resolver.resolve("runtime/composables"));
    addPlugin(resolver.resolve("./runtime/plugin"));

    addServerHandler({
      middleware: true,
      handler: resolver.resolve("./runtime/server/middleware/auth"),
    });

    addServerHandler({
      route: '/api/auth/login',
      handler: resolver.resolve('./runtime/server/api/login.post'),
    })

    addServerHandler({
      route: '/api/auth/logout',
      handler: resolver.resolve('./runtime/server/api/logout.post'),
    })

    addServerHandler({
      route: '/api/auth/user',
      handler: resolver.resolve('./runtime/server/api/user'),
    })

    addRouteMiddleware({
      name: 'auth',
      path: resolver.resolve('./runtime/middleware/auth'),
    })

    addRouteMiddleware({
      name: 'auth-guest',
      path: resolver.resolve('./runtime/middleware/auth-guest'),
    })

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
    }
  }
}
