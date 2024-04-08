import { defineNuxtModule, addPlugin, createResolver, installModule, logger } from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@workmate/nuxt-auth',
    configKey: 'auth',
    compatibility: {
      nuxt: "^3.0.0",
    }
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup (options, nuxt) {
    await installModule("@pinia/nuxt").catch(e => {
      logger.error("Unable to install pinia: \n install pinia and @pinia/nuxt");
      throw e;
    });

    const resolver = createResolver(import.meta.url);

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'));
    logger.log("@workmate/nuxt-auth successfully installed");
  }
})
