import { defineEventHandler } from "h3";

import { getAuthClient } from "../utils/client";
import type { AuthProvider } from "../../providers/AuthProvider";

export default defineEventHandler(async (event) => {
  const authClient = getAuthClient();

  event.context.auth = authClient;
});

// type Slice<T extends Array<unknown>> = T extends [infer _A, ...infer B]
//   ? B
//   : never;

declare module "h3" {
  interface H3EventContext {
    auth: AuthProvider;
  }
}
