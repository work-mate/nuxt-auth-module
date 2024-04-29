import { defineNuxtPlugin, useNuxtApp } from "#app";
import type { $Fetch } from "ofetch";

export default defineNuxtPlugin(async () => {
  console.log("auth fetch plugin");
  const { state } = useNuxtApp().$auth;

  return {
    provide: {
      getAuthFetch: () => {
        return $fetch.create({
          headers: {
            Authorization: state.value.loggedIn ? state.value.token : "",
          },
        })
      },
    }
  };
});

declare module '#app' {
  interface NuxtApp {
    $getAuthFetch (): $Fetch,
  }
}
