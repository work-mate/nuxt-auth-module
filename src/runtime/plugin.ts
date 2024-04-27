import { defineNuxtPlugin, shallowRef, useRequestEvent, useState } from "#imports";
import type { AuthState } from "./models";

export default defineNuxtPlugin((nuxtApp) => {
  const state = useState<AuthState>('auth', shallowRef);
  if (import.meta.server) {
    const auth = useRequestEvent()!.context.auth
    // console.log("Request event")
    // console.log(`auth.getMessage()`)
    // console.log(requestEveent)
    // const isLoggedIn = await kinde.isAuthenticated()
    // state.value = isLoggedIn
    //   ? { loggedIn: true, user: await kinde.getUserProfile() }
    //   : { loggedIn: false, user: null }
  }

  return {
    provide: {
      auth: state.value,
    },
  }
});
