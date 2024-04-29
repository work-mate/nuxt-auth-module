import { defineNuxtPlugin, useNuxtApp, useRuntimeConfig } from "#app";
import type { $Fetch } from "ofetch";

export default defineNuxtPlugin(async () => {
  const { state } = useNuxtApp().$auth;
  const authConfig = useRuntimeConfig().public.auth;

  const authFetch = $fetch.create({
    baseURL: authConfig.apiClient.baseURL,
    // headers: {
    //   Authorization: state.value.loggedIn ? state.value.token : "",
    // },
    onRequest({ options }) {
      const headerAddition = {
        Authorization: state.value.loggedIn ? state.value.token : "",
      };

      if (!options.headers) {
        options.headers = headerAddition;
      } else {
        // // Object.assign(options.headers, headerAddition);
        // Object.keys(headerAddition).forEach((key) => {
        //   //@ts-ignore
        //   options.headers[key] = headerAddition[key];
        // });
        options.headers = {
          ...options.headers,
          ...headerAddition,
        };
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
