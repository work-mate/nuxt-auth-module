import { useRuntimeConfig } from "#imports";
import { AuthProvider } from "../../providers/AuthProvider";
import { LocalAuthProvider } from "../../providers/LocalAuthProvider";
import type { AuthProviderInterface } from "../../models";
import { GithubAuthProvider } from "../../providers/GithubAuthProvider";

let authClient: AuthProvider;

/**
 * Get the auth client singleton
 * @returns {AuthProvider} - The auth client singleton
 */
export const getAuthClient = (): AuthProvider => {
  /**
   * If the auth client is already initialized, return it
   */
  if (authClient) {
    return authClient;
  }

  /**
   * Get the auth config from Nuxt runtime configuration
   */
  const config = useRuntimeConfig().auth;

  const providers: Record<string, AuthProviderInterface> = {};

  if (config.providers.local) {
    providers.local = LocalAuthProvider.create(config.providers.local, config);
  }
  if (config.providers.github) {
    providers.github = GithubAuthProvider.create(config.providers.github);
  }

  /**
   * Create a new auth client with the config
   */
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
    config,
  });

  /**
   * Return the new auth client
   */
  return authClient;
};
