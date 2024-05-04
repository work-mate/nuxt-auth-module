import { type AuthProviderInterface } from "../models";
import { getCookie, setCookie, deleteCookie, type H3Event } from "h3";
import type { ModuleOptions } from "@nuxt/schema";

export type AuthProviderContructorOptions = {
  providers: Record<string, AuthProviderInterface>;
  defaultProviderKey?: string;
  config: ModuleOptions;
};

export type AccessTokens = {
  accessToken: string;
  refreshToken?: string;
};

export class AuthProvider {
  /**
   * @type {Record<string, AuthProviderInterface>}
   */
  private providers: Record<string, AuthProviderInterface>;

  /**
   * @type {ModuleOptions}
   */
  private config: ModuleOptions;

  /**
   * @param {AuthProviderContructorOptions} options
   */
  constructor({
    providers,
    defaultProviderKey,
    config,
  }: AuthProviderContructorOptions) {
    this.config = config;
    this.providers = providers;
    let providerKey = defaultProviderKey || "local";

    if (!this.providers[providerKey]) {
      const providerKeys = Object.keys(this.providers);
      if (providerKeys.length) {
        providerKey = providerKeys[0];
      }
    }
  }

  /**
   * Returns auth provider
   * @param {string} providerKey
   * @return {AuthProviderInterface}
   */
  public provider(providerKey: string): AuthProviderInterface {
    const p = this.providers[providerKey];

    if (!p) {
      const message = `AuthProvider:: Cannot find provider with the key "${providerKey}"`;
      throw new Error(message);
    }

    return p;
  } // end method provider

  /**
   * Returns tokens from event
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   * @return {AccessTokens}
   */
  static getTokensFromEvent(
    event: H3Event,
    authConfig: ModuleOptions
  ): AccessTokens {
    const cookiesNames = authConfig.token.cookiesNames;
    const accessToken = getCookie(event, cookiesNames.accessToken) || "";
    const refreshToken = getCookie(event, cookiesNames.refreshToken) || "";

    return { accessToken, refreshToken };
  }

  /**
   * Returns provider key from event
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   * @return {string}
   */
  static getProviderKeyFromEvent(
    event: H3Event,
    authConfig: ModuleOptions
  ): string {
    const cookiesNames = authConfig.token.cookiesNames;
    return getCookie(event, cookiesNames.authProvider) || "";
  }

  /**
   * Sets provider tokens to cookies
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   * @param {string} provider
   * @param {AccessTokens} tokens
   */
  static setProviderTokensToCookies(
    event: H3Event,
    authConfig: ModuleOptions,
    provider: string,
    tokens: AccessTokens
  ) {
    const cookiesNames = authConfig.token.cookiesNames;
    const maxAge = authConfig.token.maxAge;
    const options = {
      expires: new Date(Date.now() + maxAge),
    };

    setCookie(
      event,
      cookiesNames.accessToken,
      tokens.accessToken || "",
      options
    );
    setCookie(
      event,
      cookiesNames.refreshToken,
      tokens.refreshToken || "",
      options
    );
    setCookie(event, cookiesNames.authProvider, provider, options);
  }

  /**
   * Deletes provider tokens from cookies
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   */
  static deleteProviderTokensFromCookies(
    event: H3Event,
    authConfig: ModuleOptions
  ) {
    const cookiesNames = authConfig.token.cookiesNames;
    deleteCookie(event, cookiesNames.accessToken);
    deleteCookie(event, cookiesNames.refreshToken);
    deleteCookie(event, cookiesNames.authProvider);
  }

  /**
   * Returns user from event
   * @param {H3Event} event
   * @return {Promise<{user: any}>}
   */
  async getUserFromEvent(event: H3Event): Promise<{ user: any }> {
    const emptyUser = { user: null };

    const tokens = AuthProvider.getTokensFromEvent(event, this.config);

    const providerKey = AuthProvider.getProviderKeyFromEvent(
      event,
      this.config
    );
    if (!providerKey) return emptyUser;

    const provider = this.provider(providerKey);
    if (!provider || !provider.fetchUserData) {
      return emptyUser;
    }

    return await provider.fetchUserData(tokens);
  }

  /**
   * Logout from event
   * @param {H3Event} event - h3 event
   * @return {Promise<{message: string, remote_error?: any}>}
   */
  async logoutFromEvent(event: H3Event): Promise<{
    message: string;
    remote_error?: any;
  }> {
    /**
     * Logout function
     * @return {Promise<void>}
     */
    const logout = async (): Promise<void> => {
      const providerKey = AuthProvider.getProviderKeyFromEvent(
        event,
        this.config
      );
      if (!providerKey) return;

      const provider = this.provider(providerKey);
      if (!provider) {
        return;
      }

      const tokens = AuthProvider.getTokensFromEvent(event, this.config);

      await provider.logout(tokens);
    };

    const response = {
      message: "Logout successful",
    } as {
      message: string;
      remote_error?: any;
    };

    try {
      await logout();
    } catch (error) {
      response.remote_error = error;
    }

    AuthProvider.deleteProviderTokensFromCookies(event, this.config);

    return response;
  } // end method logoutFromEvent

  async refreshTokensFromEvent(
    event: H3Event
  ): Promise<{ tokens: AccessTokens }> {
    const tokens = AuthProvider.getTokensFromEvent(event, this.config);

    const providerKey = AuthProvider.getProviderKeyFromEvent(
      event,
      this.config
    );
    if (!providerKey) {
      return Promise.reject("provider is required");
    }

    const provider = this.provider(providerKey);
    if (!provider || !provider.refreshTokens) {
      return Promise.reject(
        "refresh tokens is not implemented for this provider"
      );
    }

    await provider
      .refreshTokens(tokens, this.config.token.type)
      .then((newTokens) => {
        AuthProvider.setProviderTokensToCookies(
          event,
          this.config,
          providerKey,
          newTokens.tokens,
        );
      })
      .catch((error) => {
        AuthProvider.deleteProviderTokensFromCookies(event, this.config);
        return Promise.reject(error);
      });

    return Promise.resolve({ tokens });
  } //end method refreshTokensFromEvent
} //end class AuthProvider
