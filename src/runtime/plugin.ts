import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin((nuxtApp) => {
  console.log("Plugin injected by my-moduasdfadsfasfle!");

  return {
    provide: {
      auth: { runner: "Something is here also" },
    },
  };
});
