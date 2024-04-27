import { useRuntimeConfig } from "#imports";
import { AuthProvider } from "../../providers/AuthProvider";
import type { H3Event } from "h3";
import { getCookie } from "h3";

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

  /**
   * Create a new auth client with the config
   */
  authClient = new AuthProvider({
    /**
     * The available auth providers from Nuxt runtime config
     */
    providers: config.providers,
    /**
     * The default provider key to use from Nuxt runtime config,
     * or fallback to "local" if not specified
     */
    defaultProviderKey: config.defaultProvider || "local",
  });

  /**
   * Return the new auth client
   */
  return authClient;
};
