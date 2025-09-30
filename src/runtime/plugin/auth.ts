import {
  clearNuxtData,
  computed,
  defineNuxtPlugin,
  navigateTo,
  readonly,
  useRequestEvent,
  useRoute,
  useRuntimeConfig,
  useState,
  type ComputedRef,
  type Ref,
} from "#imports";
import { ofetch } from "ofetch";
import {
  SupportedAuthProvider,
  type AuthState,
  type AuthUser,
} from "../models";
import type {
  AccessTokens,
  AccessTokensNames,
} from "../providers/AuthProvider";

export type AuthPlugin = {
  loggedIn: ComputedRef<boolean>;
  user: ComputedRef<AuthUser | null | undefined>;
  token: ComputedRef<string | undefined>;
  refreshToken: ComputedRef<string | undefined>;
  tokenType: ComputedRef<string | undefined>;
  provider: ComputedRef<string | undefined>;
  tokenNames: Readonly<Ref<AccessTokensNames | null>>;
  login: (
    provider: string | SupportedAuthProvider,
    data?: Record<string, string>,
    redirectTo?: string,
  ) => Promise<
    | {
        tokens: AccessTokens;
      }
    | {
        message: string;
      }
  >;
  logout: (redirectTo?: string) => Promise<unknown>;
  refreshUser: () => Promise<void>;
  refreshTokens: () => Promise<void>;
};

export default defineNuxtPlugin(async () => {
  const state = useState<AuthState>("auth", () => ({
    loggedIn: false,
    user: null,
  }));
  const route = useRoute();
  const tokenNames = useState<AccessTokensNames | null>(
    "auth:tokenNames",
    () => null,
  );

  if (import.meta.server) {
    const auth = useRequestEvent()!.context.auth;
    const isLoggedIn = await auth.isAuthenticated();
    const tokens = await auth.getTokens();
    tokenNames.value = auth.getTokenNames();

    if (isLoggedIn) {
      try {
        const userResponse = await auth.getUser();
        state.value = {
          loggedIn: true,
          user: userResponse.user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: tokens.tokenType,
          provider: tokens.provider,
        };
      } catch (e: any) {
        const statusCodes = [];

        if (typeof e.statusCode == "number") {
          statusCodes.push(e.statusCode);
        } else if (Array.isArray(e.statusCode)) {
          statusCodes.push(...e.statusCode);
        }

        if (statusCodes.some((el) => el == e.statusCode)) {
          await auth.logout();
        }
      }
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
  function doesPageRequireAuth(): boolean {
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

  /**
   * Fetches the user data from the server using the user's access token.
   *
   * This function is used to fetch the user data after the user has been
   * authenticated. The user's access token is automatically added to the
   * request headers.
   *
   * @returns {Promise<{ user: AuthUser }>} The user data returned by the server
   */
  async function fetchUserDataWithToken(): Promise<{ user: AuthUser }> {
    /**
     * Fetches the user data from the server using the user's access token.
     *
     * @returns {Promise<{ user: AuthUser }>} The user data returned by the server
     */
    const response: { user: AuthUser } = await ofetch("/api/auth/user", {
      headers: {
        Accept: "application/json",
      },
    });

    return response;
  }

  /**
   * Logs in the user with the given provider and data.
   *
   * @param {string | SupportedAuthProvider} provider - The provider to use
   * @param {Record<string, string>} data - The form data to send to the server
   * @param {string} [redirectTo] - The path to redirect to after logging in
   *
   * @returns {Promise<{message: string, tokens?: AccessTokens}>} The server response
   *
   * @throws {ErrorResponse} If the user is already logged in
   */
  async function login(
    provider: string | SupportedAuthProvider,
    data: Record<string, string> = {},
    redirectTo?: string,
  ): Promise<{ message: string; tokens?: AccessTokens }> {
    const expectUrlFromProviders = [
      SupportedAuthProvider.GITHUB,
      SupportedAuthProvider.GOOGLE,
    ];

    if (state.value.loggedIn) {
      return {
        message: "User already logged in",
      };
    }

    let redirectUrl = redirectTo;
    if (!redirectTo) {
      redirectUrl = useRoute().query.redirect?.toString();
    }

    const body = {
      provider,
      ...data,
    } as Record<string, any>;

    if (redirectUrl) {
      body.redirectUrl = redirectUrl;
    }

    const response: { tokens: AccessTokens; url?: string } = await ofetch(
      "/api/auth/login",
      {
        method: "POST",
        body,
      },
    );

    if (expectUrlFromProviders.some((el) => el == provider)) {
      if (!response.url) return Promise.reject({ message: "Login failed" });

      const isExternal = /^https?:\/\//.test(response.url);

      await navigateTo(response.url, {
        external: isExternal,
      });

      return Promise.resolve({
        message: `Redirecting to login url for provider "${provider}"`,
      });
    }

    const tokens = response.tokens;

    const user: { user: AuthUser } = await fetchUserDataWithToken();

    state.value = {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      provider: tokens.provider,
      tokenType: tokens.tokenType,
      loggedIn: true,
      user: user.user,
    };

    // Clear all useFetch cache after successful login
    // This ensures cached data is refetched with new authentication context
    clearNuxtData();

    if (!doesPageRequireAuth()) {
      navigateTo(
        redirectUrl ||
          useRuntimeConfig().public.auth.redirects.redirectIfLoggedIn,
      );
    }

    return {
      message: "Login successful",
      tokens,
    };
  }

  /**
   * Logs out the current user.
   *
   * @returns The server response
   *
   * @throws {ErrorResponse} If the user was not logged in
   */
  async function logout(redirectTo?: string): Promise<unknown> {
    if (!state.value.loggedIn) {
      return {
        message: "User not logged in",
      };
    }

    const response = await ofetch("/api/auth/logout", {
      method: "POST",
    });

    state.value = { loggedIn: false, user: null };

    // Clear all useFetch cache after logout
    // This ensures cached authenticated data is removed
    clearNuxtData();

    if (doesPageRequireAuth()) {
      navigateTo(
        redirectTo ||
          useRuntimeConfig().public.auth.redirects.redirectIfNotLoggedIn,
      );
    }

    return response;
  }

  /**
   * Refreshes the current user's data from the API.
   *
   * @throws {ErrorResponse} If the user was not logged in
   *
   * @returns {Promise<void>}
   */
  async function refreshUser(): Promise<void> {
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

  async function refreshTokens() {
    if (!state.value.loggedIn) {
      return {
        message: "User not logged in",
      };
    }
    return ofetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }).then((res: { tokens: AccessTokens }) => {
      if (!state.value.loggedIn) return;

      state.value = {
        ...state.value,
        token: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      };
    });
  }

  return {
    provide: {
      auth: {
        loggedIn: computed(() => state.value.loggedIn),
        tokenNames: readonly(tokenNames),
        user: computed(() => state.value.user),
        token: computed(() =>
          state.value.loggedIn ? state.value.token : undefined,
        ),
        refreshToken: computed(() =>
          state.value.loggedIn ? state.value.refreshToken : undefined,
        ),
        provider: computed(() =>
          state.value.loggedIn ? state.value.provider : undefined,
        ),
        tokenType: computed(() =>
          state.value.loggedIn ? state.value.tokenType : undefined,
        ),
        login,
        logout,
        refreshUser,
        refreshTokens,
      } as AuthPlugin,
    },
  };
});

declare module "#app" {
  interface NuxtApp {
    $auth: AuthPlugin;
  }
}
