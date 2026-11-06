import {
  createError,
  defineEventHandler,
  getRequestHost,
  getRequestProtocol,
  readBody,
  setResponseStatus,
} from "h3";
import { FetchError } from "ofetch";
import { type ErrorResponse } from "../../models";
import { getAuthClient } from "../utils/client";
import { AuthProvider } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event)}`;

  // redirectUrl is transport for the post-login redirect: the client plugin
  // adds it and the OAuth providers consume it. It is not a credential, so
  // it stays out of the provider's request-body validation.
  const { provider, redirectUrl, ...body } = await readBody(event);
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

  let loginResult;
  try {
    loginResult = await authProvider.login({ baseURL }, { ...body, redirectUrl });
  } catch (e: any) {
    // An upstream rejection (wrong credentials, a rate limit) must reach the
    // client with its own status and message: an unhandled throw renders as
    // a masked "Server Error" in production.
    if (e instanceof FetchError) {
      throw createError({
        statusCode: e.statusCode ?? 502,
        message: e.data?.message ?? "Login failed",
        data: e.data,
      });
    }

    throw e;
  }

  const { tokens, url } = loginResult;

  if (tokens) {
    AuthProvider.setProviderTokensToCookies(event, authConfig, tokens);
  }

  return {
    tokens,
    url,
  };
});
