import { useNuxtApp, useRuntimeConfig } from "#app";
import type { SupportedAuthProvider } from "../models";

export default function useAuth() {
  async function login(provider: string | SupportedAuthProvider, data: Record<string, string> = {}) {
    return $fetch("/api/auth/login", {
      method: "POST",
      body: {
        provider,
        ...data
      }
    });
  }

  return {
    state: useNuxtApp().$auth,
    login,
  };
}
