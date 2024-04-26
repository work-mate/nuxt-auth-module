import { useNuxtApp, useRuntimeConfig } from "#app";

export default function useAuth() {
  return useNuxtApp().$auth;
}
