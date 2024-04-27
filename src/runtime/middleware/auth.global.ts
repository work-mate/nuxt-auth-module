import {
  abortNavigation,
  createError,
  defineNuxtRouteMiddleware,
  navigateTo,
  useNuxtApp,
  useRuntimeConfig,
} from '#imports'
import { authMiddleware } from './auth';


export default defineNuxtRouteMiddleware((...params) => {
  const [to] = params;
  // Check if user has auth middleware
  if(to.meta.middleware) {
    if(to.meta.middleware == 'auth' || to.meta.middleware == 'auth-guest') {
      return;
    }
    else if(Array.isArray(to.meta.middleware) && to.meta.middleware) {
      if(to.meta.middleware.some(el => el == 'auth' || el == 'auth-guest')) {
        return;
      }
    }
  }

  const authMeta = to.meta.auth ?? true;
  console.log("Auth:::::: ", authMeta)

  if(!authMeta) return;

    return authMiddleware(...params);
})

