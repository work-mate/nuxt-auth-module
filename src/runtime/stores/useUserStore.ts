import { defineStore } from "pinia";
import { computed, useCookie } from "#imports";

export const useUserStore = defineStore("workmate-auth-user", () => {
  const userToken = useCookie("auth:user", {
    maxAge: 60 * 60,
  });

  const user = computed<any | undefined>(() => {
    if (!userToken.value) return undefined;

    try {
      return JSON.parse(userToken.value)
    } catch (_) {
      return undefined;
    }
  });

  function setUser(value: any) {
    userToken.value = JSON.stringify(value);
  }

  return {
    user,
    setUser,
  };
});
