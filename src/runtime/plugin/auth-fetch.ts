import { defineNuxtPlugin, useNuxtApp, useRuntimeConfig } from "#app";
import { ofetch, type $Fetch } from "ofetch";

export default defineNuxtPlugin(async () => {
  const { loggedIn, token } = useNuxtApp().$auth;
  const authConfig = useRuntimeConfig().public.auth;

  const authFetch = $fetch.create({
    baseURL: authConfig.apiClient.baseURL,
    retry: 1,
    retryStatusCodes: [401],
    onRequest({ options }) {
      const headerAddition = {
        Authorization: loggedIn.value && token.value ? token.value : "",
      };

      if (!options.headers) {
        options.headers = headerAddition;
      } else {
        options.headers = {
          ...options.headers,
          ...headerAddition,
        };
      }
    },
    async onResponseError({response}) {
      if (response.status === 401) {
        await ofetch("/api/auth/refresh", {
          headers: {
            Accept: "application/json",
          },
        });
      }
    }
  });

  return {
    provide: {
      authFetch,
    },
  };
});

declare module "#app" {
  interface NuxtApp {
    $authFetch: $Fetch;
  }
}
