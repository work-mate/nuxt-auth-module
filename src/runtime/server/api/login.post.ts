import {
  defineEventHandler,
  sendRedirect,
  getQuery,
  readBody,
  setResponseStatus,
} from "h3";
import { SupportedAuthProvider, type ErrorResponse } from "../../models";
import { getAuthClient } from "../utils/client";
import { AuthProvider } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

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
  const responseData = {};

  let authProvider = authClient.provider(provider);

  if (provider == SupportedAuthProvider.LOCAL) {
    authProvider = authClient.local();
  }

  try {
    authProvider.validateRequestBody(body);
  } catch (e: any) {
    setResponseStatus(event, 400);
    return e;
  }

  const result = await authProvider.login(body);

  AuthProvider.setProviderTokensToCookies(
    event,
    useRuntimeConfig().auth,
    provider,
    result.tokens
  );

  return responseData;
});
