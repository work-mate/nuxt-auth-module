import {
  computed,
  defineNuxtPlugin,
  navigateTo,
  readonly,
  useRequestEvent,
  useRoute,
  useRuntimeConfig,
  useState
} from "#imports";
import { ofetch } from "ofetch";
import { SupportedAuthProvider } from "../models.mjs";
export default defineNuxtPlugin(async () => {
  const state = useState("auth", () => ({
    loggedIn: false,
    user: null
  }));
  const route = useRoute();
  const tokenNames = useState(
    "auth:tokenNames",
    () => null
  );
  if (import.meta.server) {
    const auth = useRequestEvent().context.auth;
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
          provider: tokens.provider
        };
      } catch (e) {
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
  function doesPageRequireAuth() {
    if (route.meta.middleware) {
      if (typeof route.meta.middleware == "string") {
        if (route.meta.middleware == "auth")
          return true;
        else if (route.meta.middleware == "auth-guest")
          return false;
      } else if (Array.isArray(route.meta.middleware)) {
        if (route.meta.middleware.some((el) => el == "auth"))
          return true;
        else if (route.meta.middleware.some((el) => el == "auth-guest"))
          return false;
      }
    }
    if (useRuntimeConfig().public.auth.global) {
      return !!(route.meta.auth ?? true);
    }
    return false;
  }
  async function fetchUserDataWithToken() {
    const response = await ofetch("/api/auth/user", {
      headers: {
        Accept: "application/json"
      }
    });
    return response;
  }
  async function login(provider, data = {}, redirectTo) {
    const expectUrlFromProviders = [SupportedAuthProvider.GITHUB];
    if (state.value.loggedIn) {
      return {
        message: "User already logged in"
      };
    }
    let redirectUrl = redirectTo;
    if (!redirectTo) {
      redirectUrl = useRoute().query.redirect?.toString();
    }
    const body = {
      provider,
      ...data
    };
    if (redirectUrl) {
      body.redirectUrl = redirectUrl;
    }
    const response = await ofetch(
      "/api/auth/login",
      {
        method: "POST",
        body
      }
    );
    if (expectUrlFromProviders.some((el) => el == provider)) {
      if (!response.url)
        return Promise.reject({ message: "Login failed" });
      const isExternal = /^https?:\/\//.test(response.url);
      await navigateTo(response.url, {
        external: isExternal
      });
      return Promise.resolve({
        message: `Redirecting to login url for provider "${provider}"`
      });
    }
    const tokens = response.tokens;
    const user = await fetchUserDataWithToken();
    state.value = {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      provider: tokens.provider,
      tokenType: tokens.tokenType,
      loggedIn: true,
      user: user.user
    };
    if (!doesPageRequireAuth()) {
      navigateTo(
        redirectUrl || useRuntimeConfig().public.auth.redirects.redirectIfLoggedIn
      );
    }
    return {
      message: "Login successful",
      tokens
    };
  }
  async function logout(redirectTo) {
    if (!state.value.loggedIn) {
      return {
        message: "User not logged in"
      };
    }
    const response = await ofetch("/api/auth/logout", {
      method: "POST"
    });
    state.value = { loggedIn: false, user: null };
    if (doesPageRequireAuth()) {
      navigateTo(
        redirectTo || useRuntimeConfig().public.auth.redirects.redirectIfNotLoggedIn
      );
    }
    return response;
  }
  async function refreshUser() {
    if (!state.value.loggedIn) {
      throw {
        message: "User not logged in"
      };
    }
    const response = await fetchUserDataWithToken();
    state.value = {
      ...state.value,
      user: response.user
    };
  }
  async function refreshTokens() {
    if (!state.value.loggedIn) {
      return {
        message: "User not logged in"
      };
    }
    return ofetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        Accept: "application/json"
      }
    }).then((res) => {
      if (!state.value.loggedIn)
        return;
      state.value = {
        ...state.value,
        token: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken
      };
    });
  }
  return {
    provide: {
      auth: {
        loggedIn: computed(() => state.value.loggedIn),
        tokenNames: readonly(tokenNames),
        user: computed(() => state.value.user),
        token: computed(
          () => state.value.loggedIn ? state.value.token : void 0
        ),
        refreshToken: computed(
          () => state.value.loggedIn ? state.value.refreshToken : void 0
        ),
        provider: computed(
          () => state.value.loggedIn ? state.value.provider : void 0
        ),
        tokenType: computed(
          () => state.value.loggedIn ? state.value.tokenType : void 0
        ),
        login,
        logout,
        refreshUser,
        refreshTokens
      }
    }
  };
});
