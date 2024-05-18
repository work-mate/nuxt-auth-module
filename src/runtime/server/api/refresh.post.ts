import { defineEventHandler } from "h3";
import { getAuthClient } from "../utils/client";
import { useRuntimeConfig } from "#imports";
import { AuthProvider } from "../../providers/AuthProvider";

export default defineEventHandler(async (event) => {
  const authConfig = useRuntimeConfig().auth;
  const authClient = getAuthClient();
  const providerKey = AuthProvider.getProviderKeyFromEvent(event, authConfig);

  if (!providerKey) {
    return Promise.reject("provider is required");
  }

  const provider = authClient.provider(providerKey);
  if (!provider || !provider.refreshTokens) {
    return Promise.reject(
      "refresh tokens is not implemented for this provider"
    );
  }

  const { tokens } = await authClient
    .refreshTokensFromEvent(event)
    .then(({ tokens }) => {
      AuthProvider.setProviderTokensToCookies(
        event,
        authConfig,
        tokens
      );

      return {
        tokens,
      };
    });

  return {
    tokens,
  };
});
