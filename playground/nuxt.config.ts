import { LocalAuthProvider } from "../src/module";

export default defineNuxtConfig({
  modules: ['../src/module'],
  auth: {
    providers: {
      local: {
        endpoints: {
          signIn: {
            path:  "/auth/login",
          }
        }
      },
    }
  },
  devtools: { enabled: true }
})
