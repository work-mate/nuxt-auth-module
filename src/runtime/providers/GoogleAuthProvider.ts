import type { ModuleOptions } from "~/src/module";
import {
  SupportedAuthProvider,
  type AuthConfig,
  type AuthLoginData,
  type AuthProviderInterface,
} from "../models";
import jwt from "jsonwebtoken";
import { ofetch } from "ofetch";
import type { AccessTokens } from "./AuthProvider";

export type GoogleAuthInitializerOptions = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  HASHING_SECRET: string;
  SCOPES?: string;
};

export interface GoogleAuthLoginData extends AuthLoginData {
  redirectUrl?: string;
}

export type GoogleAuthState = {
  redirectUrl?: string;
};

export class GoogleAuthProvider implements AuthProviderInterface {
  private options: GoogleAuthInitializerOptions;

  constructor(options: GoogleAuthInitializerOptions) {
    this.options = options;
  } // end constructor method

  static getProviderName(): string {
    return SupportedAuthProvider.GOOGLE;
  }

  static verifyAuthState(
    state: string,
    config: ModuleOptions,
  ): GoogleAuthState {
    if (!config.providers.google)
      throw new Error("Google auth provider not configured");

    return jwt.verify(
      state,
      config.providers.google.HASHING_SECRET,
    ) as GoogleAuthState;
  } // end function verifyAuthState

  static getTokens(
    code: string,
    config: ModuleOptions,
  ): Promise<{ tokens: AccessTokens }> {
    if (!config.providers.google)
      throw new Error("Google auth provider not configured");

    return ofetch(`https://github.com/login/oauth/access_token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "application/json",
      },
      params: {
        client_id: config.providers.google.CLIENT_ID,
        client_secret: config.providers.google.CLIENT_SECRET,
        code,
      },
    }).then((res) => {
      const tokens = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        tokenType: res.token_type,
        provider: GoogleAuthProvider.getProviderName(),
      };

      return { tokens };
    });
  }

  static create(options: GoogleAuthInitializerOptions): GoogleAuthProvider {
    return new GoogleAuthProvider(options);
  }

  async login(
    authConfig: AuthConfig,
    authData?: GoogleAuthLoginData,
  ): Promise<{ url: string }> {
    const params = new URLSearchParams();
    const authState: GoogleAuthState = {
      redirectUrl: authData?.redirectUrl,
    };

    params.set("client_id", this.options.CLIENT_ID);
    params.set("response_type", "token");
    params.set(
      "state",
      jwt.sign(authState, this.options.HASHING_SECRET, {
        expiresIn: "1h",
      }),
    );

    if (this.options.SCOPES) {
      params.set("scope", this.options.SCOPES);
    }

    params.set(
      "redirect_uri",
      `${authConfig.baseURL}/api/auth/callback/google`,
    );

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  } //end method login``

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
        provider: GoogleAuthProvider.getProviderName(),
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

  async logout(): Promise<any> {
    return Promise.resolve();
  } // end method logout

  validateRequestBody(): boolean {
    return true;
  } // end method validateRequestBody
} // end class GoogleAuthProvider
