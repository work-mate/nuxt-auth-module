import { defineEventHandler } from "h3";

import { getAuthClient } from "../utils/client";
import { AuthProvider, type AccessTokens } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

type AuthContext = {
  isAuthenticated: () => Promise<boolean>;
  getUserProfile: () => Promise<any>;
  getTokens: () => Promise<AccessTokens>;
}

export default defineEventHandler(async (event) => {
  const authClient = getAuthClient();

  const authConfig = useRuntimeConfig().auth;
  const tokens = AuthProvider.getTokensFromEvent(event, authConfig);

  event.context.auth = {
    isAuthenticated: async () => {
      return !!tokens.accessToken;
    },
    getUserProfile: async () => {
    },
    getTokens: async () => {
      return tokens;
    }
  }
});

// type Slice<T extends Array<unknown>> = T extends [infer _A, ...infer B]
//   ? B
//   : never;

declare module "h3" {
  interface H3EventContext {
    auth: AuthContext;
  }
}
