import { defineNuxtModule, logger, createResolver, addImportsDir, addPlugin, addServerHandler, addRouteMiddleware } from '@nuxt/kit';
import defu from 'defu';
import { ofetch } from 'ofetch';
import { getCookie, setCookie, deleteCookie } from 'h3';

function getRecursiveProperty(obj, path, separator = ".") {
  const keys = path.split(separator);
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    if (current[keys[i]] === void 0) {
      return void 0;
    }
    current = current[keys[i]];
  }
  return current;
}

class LocalAuthProvider {
  options;
  config;
  static defaultOptions = {
    endpoints: {
      signIn: {
        path: "/signin",
        method: "POST",
        tokenKey: "token",
        refreshTokenKey: "refresh_token",
        body: {
          principal: "username",
          password: "password"
        }
      },
      signOut: false,
      signUp: false,
      user: false,
      refreshToken: false
    }
  };
  constructor(options, config) {
    this.config = config;
    this.options = defu(
      options,
      LocalAuthProvider.defaultOptions
    );
  }
  static getProviderName() {
    return "local";
  }
  static create(options, config) {
    return new LocalAuthProvider(options, config);
  }
  async login(_, authData) {
    const url = this.options.endpoints.signIn.path;
    const method = this.options.endpoints.signIn.method;
    const principal = this.options.endpoints.signIn.body.principal;
    const password = this.options.endpoints.signIn.body.password;
    const tokenKey = this.options.endpoints.signIn.tokenKey;
    const refreshTokenKey = this.options.endpoints.signIn.refreshTokenKey;
    const body = {
      [principal]: authData.principal,
      [password]: authData.password
    };
    return ofetch(url, {
      method,
      body,
      headers: {
        Accept: "application/json"
      }
    }).then((res) => {
      let token = res;
      if (tokenKey)
        token = getRecursiveProperty(res, tokenKey);
      let refreshToken = "";
      if (refreshTokenKey)
        refreshToken = getRecursiveProperty(res, refreshTokenKey);
      const accessTokens = {
        accessToken: token,
        refreshToken: refreshToken || "",
        provider: LocalAuthProvider.getProviderName(),
        tokenType: this.config.token.type
      };
      return { tokens: accessTokens };
    });
  }
  async fetchUserData(tokens) {
    if (!this.options.endpoints.user)
      return { user: null };
    const url = this.options.endpoints.user.path;
    const method = "GET";
    const userKey = this.options.endpoints.user.userKey;
    const accessToken = tokens.tokenType ? `${tokens.tokenType} ${tokens.accessToken}` : tokens.accessToken;
    return ofetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: accessToken
      }
    }).then((res) => {
      let user = res;
      if (userKey)
        user = getRecursiveProperty(res, userKey);
      return { user };
    });
  }
  async logout(tokens) {
    if (!this.options.endpoints.signOut)
      return;
    const url = this.options.endpoints.signOut.path;
    const method = this.options.endpoints.signOut.method;
    const accessToken = tokens.tokenType ? `${tokens.tokenType} ${tokens.accessToken}` : tokens.accessToken;
    return ofetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: accessToken
      }
    });
  }
  /**
   * @throws {ErrorResponse}
   * @returns {boolean}
   */
  validateRequestBody(body) {
    const error = {
      message: "Invalid request body: principal and password required",
      data: {}
    };
    if (!body.principal) {
      error.data["principal"] = ["principal is required"];
    }
    if (!body.password) {
      error.data["password"] = ["password is required"];
    }
    if (Object.keys(error.data).length > 0) {
      throw error;
    }
    return true;
  }
  async refreshTokens(tokens) {
    if (!this.options.endpoints.refreshToken)
      return Promise.reject("refreshToken not configured");
    const url = this.options.endpoints.refreshToken.path;
    const method = this.options.endpoints.refreshToken.method;
    const tokenKey = this.options.endpoints.refreshToken.tokenKey;
    const refreshTokenKey = this.options.endpoints.refreshToken.refreshTokenKey;
    const tokenBodyKey = this.options.endpoints.refreshToken.body.token;
    const refreshTokenBodyKey = this.options.endpoints.refreshToken.body.refreshToken;
    const body = {
      [tokenBodyKey]: tokens.accessToken,
      [refreshTokenBodyKey]: tokens.refreshToken || ""
    };
    return ofetch(url, {
      method,
      ...method == "GET" ? {
        query: body
      } : {
        body
      },
      headers: {
        Accept: "application/json"
      }
    }).then((res) => {
      let token = res;
      if (tokenKey)
        token = getRecursiveProperty(res, tokenKey);
      let refreshToken = "";
      if (refreshTokenKey)
        refreshToken = getRecursiveProperty(res, refreshTokenKey);
      const accessTokens = {
        accessToken: token,
        refreshToken: refreshToken || tokens.refreshToken || "",
        provider: LocalAuthProvider.getProviderName(),
        tokenType: this.config.token.type
      };
      return { tokens: accessTokens };
    });
  }
}

class AuthProvider {
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

const module = defineNuxtModule({
  meta: {
    name: "@workmate/nuxt-auth",
    configKey: "auth",
    compatibility: {
      nuxt: "^3.0.0"
    }
  },
  defaults: {
    global: false,
    providers: {},
    redirects: {
      redirectIfNotLoggedIn: "/login",
      redirectIfLoggedIn: "/"
    },
    apiClient: {
      baseURL: ""
    },
    defaultProvider: "local",
    token: {
      type: "Bearer",
      maxAge: 1e3 * 60 * 60 * 24 * 30,
      cookiesNames: {
        accessToken: "auth:token",
        refreshToken: "auth:refreshToken",
        authProvider: "auth:provider",
        tokenType: "auth:tokenType"
      }
    }
  },
  async setup(options, nuxt) {
    logger.log("@workmate/nuxt-auth:: installing module");
    const resolver = createResolver(import.meta.url);
    nuxt.options.runtimeConfig.auth = defu(
      nuxt.options.runtimeConfig.auth,
      options
    );
    nuxt.options.runtimeConfig.public.auth = defu(
      nuxt.options.runtimeConfig.public.auth,
      {
        redirects: options.redirects,
        global: options.global,
        apiClient: options.apiClient
      }
    );
    addImportsDir(resolver.resolve("runtime/composables"));
    addPlugin(resolver.resolve("./runtime/plugin/auth"));
    addPlugin(resolver.resolve("./runtime/plugin/auth-fetch"), {
      append: true
    });
    addServerHandler({
      middleware: true,
      handler: resolver.resolve("./runtime/server/middleware/auth")
    });
    addServerHandler({
      route: "/api/auth/login",
      handler: resolver.resolve("./runtime/server/api/login.post")
    });
    addServerHandler({
      route: "/api/auth/logout",
      handler: resolver.resolve("./runtime/server/api/logout.post")
    });
    addServerHandler({
      route: "/api/auth/user",
      handler: resolver.resolve("./runtime/server/api/user")
    });
    addServerHandler({
      route: "/api/auth/refresh",
      handler: resolver.resolve("./runtime/server/api/refresh.post")
    });
    if (nuxt.options.runtimeConfig.auth.providers.github) {
      addServerHandler({
        route: "/api/auth/callback/github",
        handler: resolver.resolve("./runtime/server/api/callback/github.get")
      });
    }
    addRouteMiddleware({
      name: "auth",
      path: resolver.resolve("./runtime/middleware/auth")
    });
    addRouteMiddleware({
      name: "auth-guest",
      path: resolver.resolve("./runtime/middleware/auth-guest")
    });
    if (nuxt.options.runtimeConfig.auth.global) {
      addRouteMiddleware({
        name: "auth-global",
        path: resolver.resolve("./runtime/middleware/auth.global"),
        global: true
      });
    }
    logger.success("@workmate/nuxt-auth:: successfully installed");
  }
});

export { AuthProvider, LocalAuthProvider, module as default };
