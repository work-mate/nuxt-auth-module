import { defineEventHandler } from "h3";

import { getAuthClient } from "../utils/client";
import {
  AuthProvider,
  type AccessTokens,
  type AccessTokensNames,
} from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";
import type { AuthUser } from "../../models";

type AuthContext = {
  isAuthenticated: () => Promise<boolean>;
  getUser: () => Promise<{ user: AuthUser }>;
  getTokens: () => Promise<AccessTokens>;
  getTokenNames: () => AccessTokensNames;
  logout: () => Promise<void>;
};

export default defineEventHandler(async (event) => {
  const authConfig = useRuntimeConfig().auth;
  const authClient = getAuthClient();
  const tokens = AuthProvider.getTokensFromEvent(event, authConfig);

  event.context.auth = {
    isAuthenticated: async () => {
      return !!tokens.accessToken;
    },
    getTokenNames: () => {
      return authClient.getTokenNames();
    },
    getUser: async () => {
      return { user: (await authClient.getUserFromEvent(event)).user };
    },
    getTokens: async () => {
      return tokens;
    },
    logout: async () => {
      AuthProvider.deleteProviderTokensFromCookies(
        event,
        useRuntimeConfig().auth,
      );
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
