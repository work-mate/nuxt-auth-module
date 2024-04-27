import {
  defineEventHandler,
} from "h3";
import { AuthProvider } from "../../providers/AuthProvider";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  AuthProvider.deleteProviderTokensFromCookies(
    event,
    useRuntimeConfig().auth
  );

  return {
    message: "Logout successful",
  }
});
