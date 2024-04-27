import {
  abortNavigation,
  createError,
  defineNuxtRouteMiddleware,
  navigateTo,
  useNuxtApp,
  useRuntimeConfig,
} from "#imports";

//@ts-ignore
export const authMiddleware: RouteMiddleware = () => {
  const { state } = useNuxtApp().$auth;
  const config = useRuntimeConfig().public.auth;

  if (!state.value.loggedIn) {
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
  }
}


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
  return authMiddleware(...params)
});
