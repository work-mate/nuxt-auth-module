import {
  defineNuxtPlugin,
  navigateTo,
  shallowRef,
  useRequestEvent,
  useRoute,
  useRuntimeConfig,
  useState,
} from "#imports";
import type { AuthState, SupportedAuthProvider } from "./models";
import type { AccessTokens } from "./providers/AuthProvider";

export default defineNuxtPlugin(async () => {
  const state = useState<AuthState>("auth", shallowRef);
  const route = useRoute();

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

  /**
   * Determine if the current page requires authentication
   *
   * If the page has a middleware that requires authentication, or if the global middleware is set
   * in the Nuxt config and the page is set to require auth, then this function will return true.
   *
   * @returns {boolean} true if the current page requires authentication, false otherwise
   */
  function doesPageRequireAuth() {
    console.log("doesPageRequireAuth");
    console.log("route.meta: ", route.meta);
    // Check if the page has the "auth" middleware declared
    if (route.meta.middleware) {
      // If the page has the "auth" middleware, return true
      if (typeof route.meta.middleware == "string") {
        if (route.meta.middleware == "auth") return true;
        else if (route.meta.middleware == "auth-guest") return false;
      }

      // If the page has an array of middleware, check if it includes "auth"
      else if (Array.isArray(route.meta.middleware)) {
        if (route.meta.middleware.some((el) => el == "auth")) return true;
        else if (route.meta.middleware.some((el) => el == "auth-guest"))
          return false;
      }
    }

    // If the global middleware is enabled and the page is set to require auth, return true
    if (useRuntimeConfig().public.auth.global) {
      // If the page has the auth property set to true, or if it is undefined, return true
      return !!(route.meta.auth ?? true);
    }

    return false;
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
    data: Record<string, string> = {},
    redirectTo?: string
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

    if (!doesPageRequireAuth()) {
      console.log(useRuntimeConfig().public.auth.redirects.redirectIfLoggedIn);
      navigateTo(
        redirectTo ||
          useRuntimeConfig().public.auth.redirects.redirectIfLoggedIn
      );
    }

    return response;
  }

  /**
   * Logs out the current user.
   *
   * @returns The server response
   *
   * @throws {ErrorResponse} If the user was not logged in
   */
  async function logout(redirectTo?: string) {
    if (!state.value.loggedIn) {
      return {
        message: "User not logged in",
      };
    }

    const response = await $fetch("/api/auth/logout", {
      method: "POST",
    });

    state.value = { loggedIn: false, user: null };

    if (doesPageRequireAuth()) {
      navigateTo(
        redirectTo ||
          useRuntimeConfig().public.auth.redirects.redirectIfNotLoggedIn
      );
    }

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
    };
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
