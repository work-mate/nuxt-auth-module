import { loginSchemas, type LoginData } from "#auth-schemas";
import useAuth from "./useAuth";

export default function useAuthLogin() {
  const auth = useAuth();

  return {
    local: (opts: LoginData["local"], redirectTo?: string) => {
      const validated = loginSchemas.local
        ? (loginSchemas.local.parse(opts) as Record<string, any>)
        : (opts as Record<string, any>);
      return auth.login("local", validated, redirectTo);
    },
    google: (opts: LoginData["google"] = {}, redirectTo?: string) =>
      auth.login("google", opts, redirectTo),
    github: (opts: LoginData["github"] = {}, redirectTo?: string) =>
      auth.login("github", opts, redirectTo),
  };
}
