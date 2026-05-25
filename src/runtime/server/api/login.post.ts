import {
  defineEventHandler,
  getRequestHost,
  getRequestProtocol,
  readBody,
  setResponseStatus,
} from "h3";
import { type ErrorResponse } from "../../models";
import { getAuthClient } from "../utils/client";
import { AuthProvider } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event)}`;

  const { provider, ...body } = await readBody(event);
  const authConfig = useRuntimeConfig().auth;

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

  let authProvider;
  try {
    authProvider = authClient.provider(provider);
  } catch (e: any) {
    setResponseStatus(event, 400);
    return {
      message: e.message ?? "Unknown provider",
      data: { provider: [e.message ?? "Unknown provider"] },
    } satisfies ErrorResponse;
  }

  try {
    authProvider.validateRequestBody(body);
  } catch (e: any) {
    setResponseStatus(event, 400);
    return e;
  }

  const { tokens, url } = await authProvider.login({ baseURL }, body);

  if (tokens) {
    AuthProvider.setProviderTokensToCookies(event, authConfig, tokens);
  }

  return {
    tokens,
    url,
  };
});
