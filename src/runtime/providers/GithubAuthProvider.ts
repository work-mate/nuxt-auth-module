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
};

export class GithubAuthProvider implements AuthProviderInterface {
  name = "github";

  private options: DeepRequired<GithubAuthInitializerOptions>;

  constructor(options: GithubAuthInitializerOptions) {
    this.options = options;
  } // end constructor method

  static verifyGithubState(state: string, config: ModuleOptions): boolean {
    try {
      jwt.verify(
        state,
        config.providers.github?.HASHING_SECRET || "secret"
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  static getTokens(code: string, config: ModuleOptions): Promise<AccessTokens> {
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
    }).then(res => {
      return {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      }
    })
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
    // params.set("scope", "user:email");
    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    };
  }

  async fetchUserData(tokens: any): Promise<{ user: any }> {
    return Promise.reject("GithubAuthProvider is not implemented");
  } // end method fetchUserData

  async logout(tokens: any): Promise<any> {
    return Promise.reject("GithubAuthProvider is not implemented");
  } // end method logout

  validateRequestBody(body: Record<string, any>): boolean {
    return true;
  } // end method validateRequestBody
} // end class GithubAuthProvider
