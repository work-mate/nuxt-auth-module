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
      const userResponse = await auth.getUser();
      state.value = {
        loggedIn: true,
        user: userResponse.user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } else {
      state.value = { loggedIn: false, user: null };
    }
  }

  async function fetchUserDataWithToken(): Promise<{ user: any }> {
    const response: { user: any } = await $fetch("/api/auth/user", {
      headers: {
        Accept: "application/json",
      },
    });

    return response;
  }

  async function login(
    provider: string | SupportedAuthProvider,
    data: Record<string, string> = {}
  ) {
    if (state.value.loggedIn) {
      return {
        message: "User already logged in",
      };
    }

    const response: { tokens: AccessTokens } = await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        provider,
        ...data,
      },
    });

    const tokens = response.tokens;

    const user: { user: any } = await fetchUserDataWithToken();

    state.value = {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      loggedIn: true,
      user: user.user,
    };

    return response;
  }

  async function logout() {
    if (!state.value.loggedIn) {
      return {
        message: "User not logged in",
      };
    }

    const response = await $fetch("/api/auth/logout", {
      method: "POST",
    });

    state.value = { loggedIn: false, user: null };

    return response;
  }

  async function refreshUser() {
    if (!state.value.loggedIn) {
      throw {
        message: "User not logged in",
      };
    }

    const response = await fetchUserDataWithToken();
    state.value = {
      ...state.value,
      user: response.user,
    }
  }

  return {
    provide: {
      auth: {
        state,
        login,
        logout,
        refreshUser,
      },
    },
  };
});
