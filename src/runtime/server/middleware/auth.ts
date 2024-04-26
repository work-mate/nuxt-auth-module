import type { H3Event } from "h3";
import { defineEventHandler, getCookie } from "h3";
import { useRuntimeConfig } from "#imports";
import { getAuthClient } from "../utils/client";
import type { AuthProvider } from "../../providers/AuthProvider";

export default defineEventHandler(async (event) => {
  const cookiesNames = useRuntimeConfig().auth.cookiesNames;

  const accessToken = getCookie(event, cookiesNames.accessToken) || "";
  const refreshToken = getCookie(event, cookiesNames.refreshToken) || "";
  const provider = getCookie(event, cookiesNames.authProvider) || "";

  const authClient = getAuthClient();
  authClient.setTokens(provider, { accessToken, refreshToken });

  event.context.auth = authClient;
});

// type Slice<T extends Array<unknown>> = T extends [infer _A, ...infer B]
//   ? B
//   : never;

declare module "h3" {
  interface H3EventContext {
    auth: AuthProvider;
  }
}
