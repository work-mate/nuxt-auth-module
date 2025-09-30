import { defineNuxtPlugin, useNuxtApp, useRuntimeConfig } from "#app";
import { type $Fetch } from "ofetch";

export default defineNuxtPlugin(async () => {
  const { loggedIn, token, tokenType, refreshTokens, logout } = useNuxtApp().$auth;
  const authConfig = useRuntimeConfig().public.auth;

  const authFetch = $fetch.create({
    baseURL: authConfig.apiClient.baseURL,
    retry: 1,
    retryStatusCodes: [401],
    onRequest({ options }) {
      const accessToken = tokenType.value ? `${tokenType.value} ${token.value}` : token.value;
      const headerAddition = {
        Authorization: loggedIn.value && accessToken ? accessToken : "",
      };

      options.headers = {
        ...(options.headers || {}),
        ...headerAddition,
      };
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        await refreshTokens().catch(async (error) => {
          await logout();
          throw error;
        });
      }
    },
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
