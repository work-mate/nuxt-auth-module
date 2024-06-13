import { useRuntimeConfig } from "#imports";
import { defineEventHandler, getQuery, sendRedirect } from "h3";
import { GithubAuthProvider } from "../../../providers/GithubAuthProvider.mjs";
import { AuthProvider } from "../../../providers/AuthProvider.mjs";
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = String(query.code);
  const state = String(query.state);
  const config = useRuntimeConfig().auth;
  const isStateValid = GithubAuthProvider.verifyGithubState(state, config);
  if (!isStateValid) {
    const params = new URLSearchParams();
    params.set("error_message", "Unable to login with the GitHub provider");
    await sendRedirect(event, `/login?${params.toString()}`, 302);
    return;
  }
  const { tokens } = await GithubAuthProvider.getTokens(code, config);
  AuthProvider.setProviderTokensToCookies(event, config, tokens);
  await sendRedirect(
    event,
    query.redirect?.toString() || config.redirects.redirectIfLoggedIn || "/",
    302
  );
});
