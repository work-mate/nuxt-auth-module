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
import { google } from "googleapis";

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
    authConfig: AuthConfig,
    code: string,
    config: ModuleOptions,
  ): Promise<{ tokens: AccessTokens }> {
    if (!config.providers.google)
      throw new Error("Google auth provider not configured");

    const formData = new FormData();
    formData.set("client_id", config.providers.google.CLIENT_ID);
    formData.set("client_secret", config.providers.google.CLIENT_SECRET);
    formData.set("code", code);
    formData.set("grant_type", "authorization_code");

    formData.set(
      "redirect_uri",
      `${authConfig.baseURL}/api/auth/callback/google`,
    );

    return ofetch(`https://oauth2.googleapis.com/token`, {
      method: "POST",
      body: formData,
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
    params.set("response_type", "code");
    params.set(
      "state",
      jwt.sign(authState, this.options.HASHING_SECRET, {
        expiresIn: "1h",
      }),
    );
    params.set("access_type", "offline");
    params.set(
      "redirect_uri",
      `${authConfig.baseURL}/api/auth/callback/google`,
    );

    if (this.options.SCOPES) {
      params.set("scope", this.options.SCOPES);
    }

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  } //end method login``

  //TODO: Implement refresh tokens for google
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
    const response = await ofetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
        },
      },
    );

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
