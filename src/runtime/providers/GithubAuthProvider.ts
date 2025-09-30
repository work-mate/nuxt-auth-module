import type { ModuleOptions } from "../../module";
import {
  SupportedAuthProvider,
  type AuthConfig,
  type AuthLoginData,
  type AuthProviderInterface,
  type AuthUser,
} from "../models";
import jwt from "jsonwebtoken";
import { ofetch } from "ofetch";
import type { AccessTokens } from "./AuthProvider";

export type GithubAuthInitializerOptions = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  HASHING_SECRET: string;
  SCOPES?: string;
};

export interface GithubAuthLoginData extends AuthLoginData {
  redirectUrl?: string;
}

export class GithubAuthProvider implements AuthProviderInterface {
  private options: GithubAuthInitializerOptions;

  constructor(options: GithubAuthInitializerOptions) {
    this.options = options;
  } // end constructor method

  static getProviderName(): string {
    return SupportedAuthProvider.GITHUB;
  }

  static verifyGithubState(state: string, config: ModuleOptions): boolean {
    try {
      jwt.verify(state, config.providers.github?.HASHING_SECRET || "secret");
      return true;
    } catch (_e) {
      return false;
    }
  }

   static async getTokens(
    code: string,
    config: ModuleOptions,
  ): Promise<{ tokens: AccessTokens }> {
    return ofetch(`https://github.com/login/oauth/access_token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "application/json",
      },
      params: {
        client_id: config.providers.github?.CLIENT_ID,
        client_secret: config.providers.github?.CLIENT_SECRET,
        code,
      },
    }).then((res) => {
      const tokens = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        tokenType: res.token_type,
        provider: GithubAuthProvider.getProviderName(),
      };

      return { tokens };
    });
  }

  static create(options: GithubAuthInitializerOptions): GithubAuthProvider {
    return new GithubAuthProvider(options);
  }

  async login(
    authConfig: AuthConfig,
    authData?: GithubAuthLoginData,
  ): Promise<{ url: string }> {
    const params = new URLSearchParams();
    params.set("client_id", this.options.CLIENT_ID);
    params.set(
      "state",
      jwt.sign({}, this.options.HASHING_SECRET || "secret", {
        expiresIn: "1h",
      }),
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
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    };
  }

  async refreshTokens(tokens: AccessTokens): Promise<{ tokens: AccessTokens }> {
    return ofetch(`https://github.com/login/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "application/json",
      },
      params: {
        client_id: this.options.CLIENT_ID,
        client_secret: this.options.CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
      },
    }).then((res) => {
      const tokens = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        tokenType: res.token_type,
        provider: GithubAuthProvider.getProviderName(),
      };

      return { tokens };
    });
  }

  async fetchUserData(tokens: any): Promise<{ user: AuthUser }> {
    const response = await ofetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
      },
    });

    return {
      user: response,
    };
  } // end method fetchUserData

  async logout(): Promise<any> {
    return Promise.resolve();
  } // end method logout

  validateRequestBody(): boolean {
    return true;
  } // end method validateRequestBody
} // end class GithubAuthProvider
