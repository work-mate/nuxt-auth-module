import { defineNuxtPlugin, shallowRef, useRequestEvent, useState } from "#imports";
import type { AuthState, SupportedAuthProvider } from "./models";

export default defineNuxtPlugin((nuxtApp) => {
  const state = useState<AuthState>('auth', shallowRef);
  if (import.meta.server) {
    const auth = useRequestEvent()!.context.auth
    // console.log("Request event")
    // console.log(`auth.getMessage()`)
    // console.log(requestEveent)
    // const isLoggedIn = await kinde.isAuthenticated()
    // state.value = isLoggedIn
    //   ? { loggedIn: true, user: await kinde.getUserProfile() }
    //   : { loggedIn: false, user: null }
  }

  async function login(provider: string | SupportedAuthProvider, data: Record<string, string> = {}) {
    return $fetch("/api/auth/login", {
      method: "POST",
      body: {
        provider,
        ...data
      }
    });
  }

  async function logout() {
    return $fetch("/api/auth/logout", {
      method: "POST",
    });
  }

  return {
    provide: {
      auth: {
        state: state.value,
        login,
        logout
      }
    },
  }
});
