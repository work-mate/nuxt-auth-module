import { loginSchemas, type LoginData } from "#auth-schemas";
import useAuth from "./useAuth";

export default function useAuthLogin() {
  const auth = useAuth();

  return {
    localLogin: (opts: LoginData["local"], redirectTo?: string) => {
      const validated = loginSchemas.local
        ? (loginSchemas.local.parse(opts) as Record<string, any>)
        : (opts as Record<string, any>);

      return auth.login("local", validated, redirectTo);
    },
    googleLogin: (opts: LoginData["google"] = {}, redirectTo?: string) =>
      auth.login("google", opts, redirectTo),
    githubLogin: (opts: LoginData["github"] = {}, redirectTo?: string) =>
      auth.login("github", opts, redirectTo),
  };
}
