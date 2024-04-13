export default defineNuxtConfig({
  modules: ['../src/module'],
  auth: {
    secretKey: "some-secret-key",
  },
  devtools: { enabled: true }
})
