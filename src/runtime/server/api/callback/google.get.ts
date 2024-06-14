import { useRuntimeConfig } from "#imports";
import {
  defineEventHandler,
  getQuery,
  sendRedirect,
  getRequestHost,
  getRequestProtocol,
} from "h3";
import { AuthProvider } from "../../../providers/AuthProvider";
import {
  GoogleAuthProvider,
  type GoogleAuthState,
} from "../../../providers/GoogleAuthProvider";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = String(query.code);
  const state = String(query.state);
  const config = useRuntimeConfig().auth;

  let authState: GoogleAuthState;
  try {
    authState = GoogleAuthProvider.verifyAuthState(state, config);
  } catch (e: any) {
    const params = new URLSearchParams();
    params.set("error_message", e.message || "Invalid request state");
    await sendRedirect(
      event,
      `${config.redirects.redirectIfNotLoggedIn}?${params.toString()}`,
      302,
    );
    return;
  }

  if (query.error) {
    const params = new URLSearchParams();
    params.set(
      "error_message",
      query.error.toString() || "Unable to login with the Google provider",
    );

    await sendRedirect(
      event,
      `${config.redirects.redirectIfNotLoggedIn}?${params.toString()}`,
      302,
    );
    return;
  }

  const { tokens } = await GoogleAuthProvider.getTokens(
    {
      baseURL: `${getRequestProtocol(event)}://${getRequestHost(event)}`,
    },
    code,
    config,
  );

  AuthProvider.setProviderTokensToCookies(event, config, tokens);

  await sendRedirect(
    event,
    authState.redirectUrl || config.redirects.redirectIfLoggedIn || "/",
    302,
  );
});
