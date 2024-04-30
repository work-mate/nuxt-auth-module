import {
  abortNavigation,
  createError,
  defineNuxtRouteMiddleware,
  navigateTo,
  useNuxtApp,
  useRuntimeConfig,
} from '#imports'


/**
 * AuthGuest middleware.
 *
 * This middleware redirects the user to the home page if they are logged in.
 *
 * @example
 * definePageMeta({
 *  middleware: ["auth-guest"],
 * });
 */
export default defineNuxtRouteMiddleware(function authGuest() {
  const {loggedIn} = useNuxtApp().$auth;
  const config = useRuntimeConfig().public.auth;

  if (loggedIn.value) {
    const redirectIfLoggedIn = config.redirects.redirectIfLoggedIn;

    if (!redirectIfLoggedIn) {
      if (import.meta.server) {
        return createError({
          statusCode: 401,
          message: 'This page is only accessible to guests',
        })
      }
      return abortNavigation();
    } else {
      return navigateTo(redirectIfLoggedIn);
    }
  }
})

