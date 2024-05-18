import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { type ErrorResponse } from "../../models";
import { getAuthClient } from "../utils/client";
import { AuthProvider } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const authConfig = useRuntimeConfig().auth;

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

  const authProvider = authClient.provider(provider);

  try {
    authProvider.validateRequestBody(body);
  } catch (e: any) {
    setResponseStatus(event, 400);
    return e;
  }

  const { tokens, url } = await authProvider.login(body);

  if (tokens) {
    AuthProvider.setProviderTokensToCookies(
      event,
      authConfig,
      tokens
    );
  }

  return {
    tokens,
    url,
  };
});
