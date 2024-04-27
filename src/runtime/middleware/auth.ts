import {
  abortNavigation,
  createError,
  defineNuxtRouteMiddleware,
  useNuxtApp,
} from '#imports'

export default defineNuxtRouteMiddleware(() => {
  const {state} = useNuxtApp().$auth

  if (!state.value.loggedIn) {
    if (import.meta.server) {
      return createError({
        statusCode: 401,
        message: 'You must be logged in to access this page',
      })
    }
    return abortNavigation()
  }
})
