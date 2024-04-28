import { defineNuxtPlugin, useNuxtApp } from "#app";
import { ofetch } from "ofetch";

export default defineNuxtPlugin(async () => {
  console.log("auth fetch plugin");
  const { state } = useNuxtApp().$auth;

  const authFetch = $fetch.create({
    headers: {
      Authorization: state.value.loggedIn ? state.value.token : "",
    },
  });

  return {
    provide: {
      authFetch,
    }
  };
});
