import { defineEventHandler, setResponseStatus } from "h3";
import { getAuthClient } from "../utils/client";
import { useRuntimeConfig } from "#imports";
import { AuthProvider } from "../../providers/AuthProvider";
import type { ErrorResponse } from "../../models";

export default defineEventHandler(async (event) => {
  const authConfig = useRuntimeConfig().auth;
  const authClient = getAuthClient();
  const providerKey = AuthProvider.getProviderKeyFromEvent(event, authConfig);

  if (!providerKey) {
    setResponseStatus(event, 401);
    return {
      message: "provider is required",
      data: { provider: ["provider is required"] },
    } satisfies ErrorResponse;
  }

  const provider = authClient.provider(providerKey);
  if (!provider || !provider.refreshTokens) {
    setResponseStatus(event, 400);
    return {
      message: "refresh tokens is not implemented for this provider",
    } satisfies ErrorResponse;
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
