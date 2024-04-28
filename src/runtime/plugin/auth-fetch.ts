import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin({
  async setup(nuxtApp) {
    console.log("auth fetch plugin");
    console.log(nuxtApp.$auth)
  }
})
