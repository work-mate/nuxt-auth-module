
import type { ModuleOptions } from './module'


declare module '@nuxt/schema' {
  interface NuxtConfig { ['auth']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['auth']?: ModuleOptions }
}

declare module 'nuxt/schema' {
  interface NuxtConfig { ['auth']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['auth']?: ModuleOptions }
}


export type { AuthProvider, DeepRequired, LocalAuthProvider, ModuleOptions, ModuleProvidersOptions, default } from './module'
