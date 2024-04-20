import { useRuntimeConfig } from "#app";
import { AuthProvider } from "../providers/AuthProvider"

let authClient: AuthProvider;

export const getAuthClient = (): AuthProvider => {
  if(authClient) return authClient;

  const config = useRuntimeConfig().auth;

  authClient = new AuthProvider({
    providers: config.providers,
    defaultProviderKey: config.defaultProvider || "local",
  })

  return authClient;
}//end
