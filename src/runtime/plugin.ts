import {
  defineNuxtPlugin,
  shallowRef,
  useRequestEvent,
  useState,
} from "#imports";
import type { AuthState, SupportedAuthProvider } from "./models";
import type { AccessTokens } from "./providers/AuthProvider";

export default defineNuxtPlugin(async (nuxtApp) => {
  const state = useState<AuthState>("auth", shallowRef);
  if (import.meta.server) {
    const auth = useRequestEvent()!.context.auth;
    const isLoggedIn = await auth.isAuthenticated();
    const tokens = await auth.getTokens();

    if (isLoggedIn) {
      state.value = {
        loggedIn: true,
        user: {
          name: "Oyinbo David",
          profilePicture: "https://i.pravatar.cc/300",
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } else {
      state.value = { loggedIn: false, user: null };
    }
  }

  async function fetchUserData() {}

  async function login(
    provider: string | SupportedAuthProvider,
    data: Record<string, string> = {}
  ) {
    const response: { tokens: AccessTokens } = await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        provider,
        ...data,
      },
    });

    const tokens = response.tokens;

    state.value = {
      ...state.value,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      loggedIn: true,
      user: {
        name: "Oyinbo David",
        profilePicture: "https://i.pravatar.cc/300",
      }
    };

    // await fetchUserData();

    return response;
  }

  async function logout() {
    const response = await $fetch("/api/auth/logout", {
      method: "POST",
    });

    state.value = { loggedIn: false, user: null };

    return response;
  }

  return {
    provide: {
      auth: {
        state,
        login,
        logout,
      },
    },
  };
});
