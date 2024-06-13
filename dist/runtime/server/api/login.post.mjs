import {
  defineEventHandler,
  getRequestHost,
  getRequestProtocol,
  readBody,
  setResponseStatus
} from "h3";
import { getAuthClient } from "../utils/client.mjs";
import { AuthProvider } from "../../providers/AuthProvider.mjs";
import { useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event)}`;
  const body = await readBody(event);
  const authConfig = useRuntimeConfig().auth;
  const provider = body.provider;
  if (!provider) {
    setResponseStatus(event, 400);
    const error = {
      message: "provider is required",
      data: {
        provider: ["provider is required"]
      }
    };
    return error;
  }
  const authClient = getAuthClient();
  const authProvider = authClient.provider(provider);
  try {
    authProvider.validateRequestBody(body);
  } catch (e) {
    setResponseStatus(event, 400);
    return e;
  }
  const { tokens, url } = await authProvider.login({ baseURL }, body);
  if (tokens) {
    AuthProvider.setProviderTokensToCookies(event, authConfig, tokens);
  }
  return {
    tokens,
    url
  };
});
