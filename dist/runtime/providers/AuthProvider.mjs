import { getCookie, setCookie, deleteCookie } from "h3";
export class AuthProvider {
  /**
   * @type {Record<string, AuthProviderInterface>}
   */
  providers;
  /**
   * @type {ModuleOptions}
   */
  config;
  /**
   * @param {AuthProviderContructorOptions} options
   */
  constructor({
    providers,
    defaultProviderKey,
    config
  }) {
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
  provider(providerKey) {
    const p = this.providers[providerKey];
    if (!p) {
      const message = `AuthProvider:: Cannot find provider with the key "${providerKey}"`;
      throw new Error(message);
    }
    return p;
  }
  // end method provider
  /**
   * Returns tokens from event
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   * @return {AccessTokens}
   */
  static getTokensFromEvent(event, authConfig) {
    const cookiesNames = authConfig.token.cookiesNames;
    const accessToken = getCookie(event, cookiesNames.accessToken) || "";
    const refreshToken = getCookie(event, cookiesNames.refreshToken) || "";
    const tokenType = getCookie(event, cookiesNames.tokenType) || "";
    const provider = getCookie(event, cookiesNames.authProvider) || "";
    return { accessToken, refreshToken, tokenType, provider };
  }
  /**
   * Returns token names
   * @return {AccessTokensNames}
   */
  getTokenNames() {
    return this.config.token.cookiesNames;
  }
  /**
   * Returns provider key from event
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   * @return {string}
   */
  static getProviderKeyFromEvent(event, authConfig) {
    const cookiesNames = authConfig.token.cookiesNames;
    return getCookie(event, cookiesNames.authProvider) || "";
  }
  /**
   * Sets provider tokens to cookies
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   * @param {AccessTokens} tokens
   */
  static setProviderTokensToCookies(event, authConfig, tokens) {
    const cookiesNames = authConfig.token.cookiesNames;
    const maxAge = authConfig.token.maxAge;
    const options = {
      expires: new Date(Date.now() + maxAge)
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
    setCookie(event, cookiesNames.authProvider, tokens.provider, options);
    setCookie(event, cookiesNames.tokenType, tokens.tokenType, options);
  }
  /**
   * Deletes provider tokens from cookies
   * @param {H3Event} event
   * @param {ModuleOptions} authConfig
   */
  static deleteProviderTokensFromCookies(event, authConfig) {
    const cookiesNames = authConfig.token.cookiesNames;
    deleteCookie(event, cookiesNames.accessToken);
    deleteCookie(event, cookiesNames.refreshToken);
    deleteCookie(event, cookiesNames.tokenType);
    deleteCookie(event, cookiesNames.authProvider);
  }
  /**
   * Returns user from event
   * @param {H3Event} event
   * @return {Promise<{user: any}>}
   */
  async getUserFromEvent(event) {
    const emptyUser = { user: null };
    const tokens = AuthProvider.getTokensFromEvent(event, this.config);
    if (!tokens.provider)
      return emptyUser;
    const provider = this.provider(tokens.provider);
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
  async logoutFromEvent(event) {
    const logout = async () => {
      const tokens = AuthProvider.getTokensFromEvent(event, this.config);
      if (!tokens.provider)
        return;
      const provider = this.provider(tokens.provider);
      if (!provider) {
        return;
      }
      await provider.logout(tokens);
    };
    const response = {
      message: "Logout successful"
    };
    try {
      await logout();
    } catch (error) {
      response.remote_error = error;
    }
    AuthProvider.deleteProviderTokensFromCookies(event, this.config);
    return response;
  }
  // end method logoutFromEvent
  async refreshTokensFromEvent(event) {
    const tokens = AuthProvider.getTokensFromEvent(event, this.config);
    if (!tokens.provider) {
      return Promise.reject("provider is required");
    }
    const provider = this.provider(tokens.provider);
    if (!provider || !provider.refreshTokens) {
      return Promise.reject(
        "refresh tokens is not implemented for this provider"
      );
    }
    return provider.refreshTokens(tokens);
  }
  //end method refreshTokensFromEvent
}
