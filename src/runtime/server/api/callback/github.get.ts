import { useRuntimeConfig } from "#app";
import {
  defineEventHandler,
  getQuery,
} from "h3";

import jwt from "jsonwebtoken";
import { GithubAuthProvider } from "~/src/runtime/providers/GithubAuthProvider";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code;
  const state = String(query.state);

  const isStateValid = GithubAuthProvider.verifyGithubState(state, useRuntimeConfig().auth);

  return {
  }
});
