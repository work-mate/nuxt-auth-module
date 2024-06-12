import {
  abortNavigation,
  createError,
  defineNuxtRouteMiddleware,
  navigateTo,
  useCookie,
  useNuxtApp,
  useRuntimeConfig,
} from "#imports";

//@ts-ignore
export const authMiddleware: RouteMiddleware = () => {
  const { loggedIn, logout, tokenNames } = useNuxtApp().$auth;
  const config = useRuntimeConfig().public.auth;

  console.log("AuthModdleware");

  if (!loggedIn.value) {
    const redirectIfNotLoggedIn = config.redirects.redirectIfNotLoggedIn;

    if (!redirectIfNotLoggedIn) {
      if (import.meta.server) {
        return createError({
          statusCode: 401,
          message: "You must be logged in to access this page",
        });
      }

      return abortNavigation();
    } else {
      return navigateTo(redirectIfNotLoggedIn);
    }
  } else if (tokenNames.value) {
    const accessToken = useCookie(tokenNames.value.accessToken);
    const authProvider = useCookie(tokenNames.value.authProvider);
    console.log(tokenNames.value);
    if (!accessToken.value || !authProvider.value) {
      console.log("From Auth moddleware");
      console.log(accessToken.value);
      logout();
    }
  }
};

/**
 * Auth middleware.
 *
 * This middleware redirects the user to the login page if they are not logged in.
 *
 * @example
 * definePageMeta({
 *  middleware: ["auth"],
 * });
 */
export default defineNuxtRouteMiddleware((...params) => {
  return authMiddleware(...params);
});
