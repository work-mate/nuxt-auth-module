import {
  defineNuxtModule,
  createResolver,
  logger,
  addImportsDir,
  installModule,
  addTypeTemplate,
  addPlugin,
  addServerHandler,
} from "@nuxt/kit";
import type { AuthProviderInterface } from "./runtime/models";
import defu from "defu";
export { LocalAuthProvider } from "./runtime/providers/LocalAuthProvider";
export { AuthProvider } from "./runtime/providers/AuthProvider";


export interface ModuleOptions {
  providers: Record<string, AuthProviderInterface>;
  defaultProvider?: string;
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
    defaultProvider: "local",
  },
  async setup(options, nuxt) {
    logger.log("@workmate/nuxt-auth:: installing module");
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.auth = defu(nuxt.options.runtimeConfig.auth, options);

    await installModule("@pinia/nuxt").catch((e) => {
      logger.error("Unable to install pinia: \n install pinia and @pinia/nuxt");
      throw e;
    });

    addImportsDir(resolver.resolve("runtime/composables"));
    addPlugin(resolver.resolve("./runtime/plugin"));

    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/auth'),
    })

    logger.success("@workmate/nuxt-auth:: successfully installed");
  },
});

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    auth: ModuleOptions,
  }
}

