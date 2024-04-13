import {
  defineNuxtModule,
  createResolver,
  logger,
  addImportsDir,
  installModule,
  addTypeTemplate,
} from "@nuxt/kit";
import type { AuthProviderInterface } from "./runtime/models";
import defu from "defu";
import { AuthProvider } from "./runtime/providers/AuthProvider";
export { LocalAuthProvider } from "./runtime/providers/LocalAuthProvider";

// Module options TypeScript interface definition
export interface ModuleOptions {
  providers: Record<string, AuthProviderInterface>;
  secretKey?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@workmate/nuxt-auth",
    configKey: "auth",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {
    providers: {},
  },
  async setup(options, nuxt) {
    logger.log("@workmate/nuxt-auth:: installing module");

    const $runner = new AuthProvider({
      providers: options.providers,
      defaultProviderKey: "local",
    });


    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      auth: {
        $runner,
      }
    });

    await installModule("@pinia/nuxt").catch((e) => {
      logger.error("Unable to install pinia: \n install pinia and @pinia/nuxt");
      throw e;
    });

    const resolver = createResolver(import.meta.url);

    addImportsDir(resolver.resolve("runtime/composables"));

    logger.success("@workmate/nuxt-auth:: successfully installed");
  },
});

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // Add your custom properties here
    auth: {
      $runner: AuthProvider,
    }
  }
}

