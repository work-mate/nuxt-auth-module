import { useFetch, useNuxtApp } from "#imports";
export default function useAuthFetch(req, options) {
  const $authFetch = useNuxtApp().$authFetch;
  return useFetch(req, {
    key: `auth:${req};options:${btoa(JSON.stringify(options))}`,
    ...options,
    $fetch: $authFetch
  });
}
