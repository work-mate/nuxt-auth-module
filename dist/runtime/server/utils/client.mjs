import { useRuntimeConfig } from "#imports";
import { AuthProvider } from "../../providers/AuthProvider.mjs";
import { LocalAuthProvider } from "../../providers/LocalAuthProvider.mjs";
import { GithubAuthProvider } from "../../providers/GithubAuthProvider.mjs";
let authClient;
export const getAuthClient = () => {
  if (authClient) {
    return authClient;
  }
  const config = useRuntimeConfig().auth;
  const providers = {};
  if (config.providers.local) {
    providers.local = LocalAuthProvider.create(config.providers.local, config);
  }
  if (config.providers.github) {
    providers.github = GithubAuthProvider.create(config.providers.github);
  }
  authClient = new AuthProvider({
    /**
     * The available auth providers from Nuxt runtime config
     */
    providers,
    /**
     * The default provider key to use from Nuxt runtime config,
     * or fallback to "local" if not specified
     */
    defaultProviderKey: config.defaultProvider || "local",
    config
  });
  return authClient;
};
