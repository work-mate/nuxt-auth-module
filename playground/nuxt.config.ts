import { LocalAuthProvider } from "../src/module";

export default defineNuxtConfig({
  modules: ['../src/module'],
  auth: {
    secretKey: "some-secret-key",
    providers: {
      local: LocalAuthProvider.create({}),
    }
  },
  devtools: { enabled: true }
})
