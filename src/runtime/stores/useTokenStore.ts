import { defineStore } from "pinia";
import {readonly, useCookie} from "#imports"

export const useTokenStore = defineStore("workmate-auth-token", () => {
  const token = useCookie("auth:token");

  function setToken(value: string) {
    token.value = value;
  }

  return {
    token: readonly(token),
    setToken,
  }
});


