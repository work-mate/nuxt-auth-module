import { defineEventHandler } from "h3";

import { getAuthClient } from "../utils/client";
import { AuthProvider, type AccessTokens } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

type AuthContext = {
  isAuthenticated: () => Promise<boolean>;
  getUser: () => Promise<{user: any}>;
  getTokens: () => Promise<AccessTokens>;
};

export default defineEventHandler(async (event) => {
  const authConfig = useRuntimeConfig().auth;
  const authClient = getAuthClient();
  const tokens = AuthProvider.getTokensFromEvent(event, authConfig);

  event.context.auth = {
    isAuthenticated: async () => {
      return !!tokens.accessToken;
    },
    getUser: async () => {
      return { user: (await authClient.getUserFromEvent(event)).user };
    },
    getTokens: async () => {
      return tokens;
    },
  };
});

// type Slice<T extends Array<unknown>> = T extends [infer _A, ...infer B]
//   ? B
//   : never;

declare module "h3" {
  interface H3EventContext {
    auth: AuthContext;
  }
}
