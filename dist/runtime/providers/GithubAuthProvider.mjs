import jwt from "jsonwebtoken";
import { ofetch } from "ofetch";
export class GithubAuthProvider {
  options;
  constructor(options) {
    this.options = options;
  }
  // end constructor method
  static getProviderName() {
    return "github";
  }
  static verifyGithubState(state, config) {
    try {
      jwt.verify(state, config.providers.github?.HASHING_SECRET || "secret");
      return true;
    } catch (e) {
      return false;
    }
  }
  static getTokens(code, config) {
    return ofetch(`https://github.com/login/oauth/access_token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "application/json"
      },
      params: {
        client_id: config.providers.github?.CLIENT_ID,
        client_secret: config.providers.github?.CLIENT_SECRET,
        code
      }
    }).then((res) => {
      const tokens = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        tokenType: res.token_type,
        provider: GithubAuthProvider.getProviderName()
      };
      return { tokens };
    });
  }
  static create(options) {
    return new GithubAuthProvider(options);
  }
  async login(authConfig, authData) {
    const params = new URLSearchParams();
    params.set("client_id", this.options.CLIENT_ID);
    params.set(
      "state",
      jwt.sign({}, this.options.HASHING_SECRET || "secret", {
        expiresIn: "1h"
      })
    );
    if (this.options.SCOPES) {
      params.set("scope", this.options.SCOPES);
    }
    const redirectUriParams = new URLSearchParams();
    if (authData?.redirectUrl) {
      redirectUriParams.set("redirect", encodeURI(authData.redirectUrl));
    }
    const callbackUrl = `${authConfig.baseURL}/api/auth/callback/github?${redirectUriParams.toString()}`;
    params.set("redirect_uri", callbackUrl);
    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`
    };
  }
  refreshTokens(tokens) {
    return ofetch(`https://github.com/login/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "application/json"
      },
      params: {
        client_id: this.options.CLIENT_ID,
        client_secret: this.options.CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken
      }
    }).then((res) => {
      const tokens2 = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        tokenType: res.token_type,
        provider: GithubAuthProvider.getProviderName()
      };
      return { tokens: tokens2 };
    });
  }
  async fetchUserData(tokens) {
    const response = await ofetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `${tokens.tokenType} ${tokens.accessToken}`
      }
    });
    return {
      user: response
    };
  }
  // end method fetchUserData
  async logout() {
    return Promise.resolve();
  }
  // end method logout
  validateRequestBody() {
    return true;
  }
  // end method validateRequestBody
}
