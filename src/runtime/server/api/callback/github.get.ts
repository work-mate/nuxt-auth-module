import { useRuntimeConfig } from "#imports";
import {
  defineEventHandler,
  getQuery,
  sendRedirect,
} from "h3";
import { GithubAuthProvider } from "../../../providers/GithubAuthProvider";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = String(query.code);
  const state = String(query.state);

  const isStateValid = GithubAuthProvider.verifyGithubState(state, useRuntimeConfig().auth);

  if(!isStateValid) {
    const params = new URLSearchParams();
    params.set("error_message", "Unable to login with the GitHub provider");

    await sendRedirect(event, `/login?${params.toString()}`, 302);
    return;
  }

  const tokens = await GithubAuthProvider.getTokens(code, useRuntimeConfig().auth);


  console.log("===================GITHUB TOKENS =============")
  console.log(tokens)
});
