import {
  abortNavigation,
  createError,
  defineNuxtRouteMiddleware,
  useNuxtApp,
} from '#imports'

export default defineNuxtRouteMiddleware(() => {
  const {state} = useNuxtApp().$auth

  if (state.value.loggedIn) {
    if (import.meta.server) {
      return createError({
        statusCode: 401,
        message: 'This page is only accessible to guests',
      })
    }
    return abortNavigation();
  }
})
