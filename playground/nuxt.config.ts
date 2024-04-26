import { LocalAuthProvider } from "../src/module";

export default defineNuxtConfig({
  modules: ['../src/module'],
  auth: {
    providers: {
      local: LocalAuthProvider.create({
        secret: "This is another secret"
      }),
    }
  },
  devtools: { enabled: true }
})
