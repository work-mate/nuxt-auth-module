import type { H3Event } from "h3";
import {defineEventHandler} from "h3";
import { useRuntimeConfig } from "#imports";
import { getAuthClient } from "../utils/client";
import type { AuthProvider } from "../../providers/AuthProvider";

type SessionManager = {};
export default defineEventHandler(async (event) => {
  // const  = await createSessionManager(event)
  // const kindeContext = { sessionManager } as Record<string, unknown>
  // const kindeClient = getKindeClient()
  // for (const _key in kindeClient) {
  //   const key = _key as keyof typeof kindeClient
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   kindeContext[key] = (kindeClient[key] as any).bind(kindeClient, sessionManager)
  // }
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // event.context.kinde = kindeContext as any
  event.context.auth = getAuthClient();
});

type Slice<T extends Array<unknown>> = T extends [infer _A, ...infer B]
  ? B
  : never;

declare module "h3" {
  interface H3EventContext {
    auth: AuthProvider;
  }
}
