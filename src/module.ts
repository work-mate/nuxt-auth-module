import {
  defineNuxtModule,
  createResolver,
  logger,
  addImportsDir,
  installModule,
} from "@nuxt/kit";
import type { AuthProviderInterface } from "./runtime/models";
import defu from "defu";
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

    nuxt.options.runtimeConfig.auth = defu(nuxt.options.runtimeConfig?.auth || {}, options);

    // const { setOptions } = useOptionsStore();
    // setOptions(options);
    // console.log("options")
    // console.log(options)

    console.log(options)

    await installModule("@pinia/nuxt").catch((e) => {
      logger.error("Unable to install pinia: \n install pinia and @pinia/nuxt");
      throw e;
    });

    const resolver = createResolver(import.meta.url);

    addImportsDir(resolver.resolve("runtime/composables"));

    logger.success("@workmate/nuxt-auth:: successfully installed");
  },
});
