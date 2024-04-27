import {
  defineEventHandler,
} from "h3";
import { AuthProvider } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";
import { getAuthClient } from "../utils/client";

export default defineEventHandler(async (event) => {
  const authConfig = useRuntimeConfig().auth;
  const tokens = AuthProvider.getTokensFromEvent(
    event,
    authConfig,
  );

  const providerKey = AuthProvider.getProviderKeyFromEvent(event, authConfig);

  const authClient = getAuthClient();
  const provider = authClient.provider(providerKey);

  if(!provider.fetchUserData) {
    return {
      user: null,
    }
  }

  const result = await provider.fetchUserData(tokens);

  return {
    user: result.user
  }
});
