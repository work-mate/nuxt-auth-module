import defu from "defu";
import type { DeepRequired, ModuleOptions } from "~/src/module";
import type { AuthProviderInterface } from "../models";
import jwt from "jsonwebtoken";
import { ofetch } from "ofetch";
import type { AccessTokens } from "./AuthProvider";

export type GithubAuthInitializerOptions = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  HASHING_SECRET: string;
  SCOPES?: string;
};

export class GithubAuthProvider implements AuthProviderInterface {
  private options: GithubAuthInitializerOptions;

  constructor(options: GithubAuthInitializerOptions) {
    this.options = options;
  } // end constructor method

  static getProviderName(): string {
    return "github";
  }

  static verifyGithubState(state: string, config: ModuleOptions): boolean {
    try {
      jwt.verify(state, config.providers.github?.HASHING_SECRET || "secret");
      return true;
    } catch (e) {
      return false;
    }
  }

  static getTokens(
    code: string,
    config: ModuleOptions
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

  async login(): Promise<{ url: string }> {
    const params = new URLSearchParams();
    params.set("client_id", this.options.CLIENT_ID);
    params.set(
      "state",
      jwt.sign({}, this.options.HASHING_SECRET || "secret", { expiresIn: "1h" })
    );

    if (this.options.SCOPES) {
      params.set("scope", this.options.SCOPES);
    }

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    };
  }

  refreshTokens(tokens: AccessTokens): Promise<{ tokens: AccessTokens }> {
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

  async fetchUserData(tokens: any): Promise<{ user: any }> {
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

  async logout(tokens: any): Promise<any> {
    return Promise.reject("GithubAuthProvider is not implemented");
  } // end method logout

  validateRequestBody(body: Record<string, any>): boolean {
    return true;
  } // end method validateRequestBody
} // end class GithubAuthProvider
