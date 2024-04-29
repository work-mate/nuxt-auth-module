import { defineNuxtPlugin, useNuxtApp, useRuntimeConfig } from "#app";
import type { $Fetch } from "ofetch";

export default defineNuxtPlugin(async () => {
  const { state } = useNuxtApp().$auth;
  const authConfig = useRuntimeConfig().public.auth;

  return {
    provide: {
      getAuthFetch: () => {
        return $fetch.create({
          baseURL: authConfig.apiClient.baseURL,
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
