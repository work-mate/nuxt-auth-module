import {
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { SupportedAuthProvider, type ErrorResponse } from "../../models";
import { getAuthClient } from "../utils/client";
import { AuthProvider, type AccessTokens } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const authConfig = useRuntimeConfig().auth

  const provider = body.provider;

  if (!provider) {
    setResponseStatus(event, 400);
    const error = {
      message: "provider is required",
      data: {
        provider: ["provider is required"],
      },
    } satisfies ErrorResponse;

    return error;
  }

  const authClient = getAuthClient();

  let authProvider = authClient.provider(provider);

  try {
    authProvider.validateRequestBody(body);
  } catch (e: any) {
    setResponseStatus(event, 400);
    return e;
  }

  const { tokens } = await authProvider.login(body);
  const tokenType = authConfig.token.type;
  const tokenTypePrefix = tokenType ? `${tokenType} ` : "";

  const tokensWithType: AccessTokens = {
    accessToken: tokens.accessToken ? `${tokenTypePrefix}${tokens.accessToken}` : "",
    refreshToken: tokens.refreshToken ? `${tokenTypePrefix}${tokens.refreshToken}` : "",
  }

  AuthProvider.setProviderTokensToCookies(
    event,
    authConfig,
    provider,
    tokensWithType
  );

  return {
    tokens: tokensWithType
  };
});
