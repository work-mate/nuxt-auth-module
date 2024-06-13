import { defineEventHandler } from "h3";
import { getAuthClient } from "../utils/client.mjs";
import {
  AuthProvider
} from "../../providers/AuthProvider.mjs";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const authConfig = useRuntimeConfig().auth;
  const authClient = getAuthClient();
  const tokens = AuthProvider.getTokensFromEvent(event, authConfig);
  event.context.auth = {
    isAuthenticated: async () => {
      return !!tokens.accessToken;
    },
    getTokenNames: () => {
      return authClient.getTokenNames();
    },
    getUser: async () => {
      return { user: (await authClient.getUserFromEvent(event)).user };
    },
    getTokens: async () => {
      return tokens;
    },
    logout: async () => {
      AuthProvider.deleteProviderTokensFromCookies(
        event,
        useRuntimeConfig().auth
      );
    }
  };
});
