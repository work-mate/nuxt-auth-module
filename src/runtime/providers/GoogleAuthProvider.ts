import type { AuthUser, ModuleOptions } from "../../module";
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

  /**
   * Verifies the authentication state received from the client.
   *
   * @param {string} state - The authentication state received from the client.
   * @param {ModuleOptions} config - The module options.
   * @returns {GoogleAuthState} The verified authentication state.
   * @throws {Error} If the Google auth provider is not configured.
   */
  static verifyAuthState(
    state: string,
    config: ModuleOptions,
  ): GoogleAuthState {
    // Check if the Google auth provider is configured
    if (!config.providers.google) {
      throw new Error("Google auth provider not configured");
    }

    // Verify the authentication state using the provided hashing secret
    return jwt.verify(
      state,
      config.providers.google.HASHING_SECRET,
    ) as GoogleAuthState;
  } // end function verifyAuthState

  /**
   * Retrieves access tokens from the Google API using the authorization code and
   * configuration.
   *
   * @param {AuthConfig} authConfig - The authentication configuration.
   * @param {string} code - The authorization code.
   * @param {ModuleOptions} config - The module options.
   * @returns {Promise<{ tokens: AccessTokens }>} A promise that resolves to the
   * access tokens.
   * @throws {Error} If the Google auth provider is not configured.
   */
  static getTokens(
    authConfig: AuthConfig,
    code: string,
    config: ModuleOptions,
  ): Promise<{ tokens: AccessTokens }> {
    // Check if the Google auth provider is configured
    if (!config.providers.google) {
      throw new Error("Google auth provider not configured");
    }

    // Construct the form data for the API request
    const formData = new FormData();
    formData.set("client_id", config.providers.google.CLIENT_ID);
    formData.set("client_secret", config.providers.google.CLIENT_SECRET);
    formData.set("code", code);
    formData.set("grant_type", "authorization_code");
    formData.set(
      "redirect_uri",
      `${authConfig.baseURL}/api/auth/callback/google`,
    );

    // Send the API request and return the access tokens
    return ofetch(`https://oauth2.googleapis.com/token`, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
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

  /**
   * Generates the login URL for the Google auth provider.
   *
   * @param {AuthConfig} authConfig - The auth configuration.
   * @param {GoogleAuthLoginData} [authData] - Optional data for the login.
   * @returns {Promise<{ url: string }>} The login URL.
   */
  async login(
    authConfig: AuthConfig,
    authData?: GoogleAuthLoginData,
  ): Promise<{ url: string }> {
    // Create URL search params for the request
    const params = new URLSearchParams();

    // Set the client ID and generate a state for the request
    const authState: GoogleAuthState = {
      redirectUrl: authData?.redirectUrl,
    };
    const state = jwt.sign(authState, this.options.HASHING_SECRET, {
      expiresIn: "1h",
    });

    // Set the redirect URI for the request
    const redirectUri = `${authConfig.baseURL}/api/auth/callback/google`;

    // Set the parameters for the request
    params.set("client_id", this.options.CLIENT_ID);
    params.set("response_type", "code");
    params.set("state", state);
    params.set("access_type", "offline");
    params.set("redirect_uri", redirectUri);

    // Set the scopes for the request if provided
    if (this.options.SCOPES) {
      params.set("scope", this.options.SCOPES);
    }

    // Return the login URL
    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  } //end method login

  /**
   * Refreshes the access token using the refresh token.
   *
   * @param {AccessTokens} tokens - The access tokens.
   * @return {Promise<{ tokens: AccessTokens }>} The refreshed access tokens.
   * @throws {Error} If no refresh token is found.
   */
  refreshTokens(tokens: AccessTokens): Promise<{ tokens: AccessTokens }> {
    // Create a new FormData object
    const formData = new FormData();

    // Get the refresh token from the tokens
    const refreshToken = tokens.refreshToken;

    // Throw an error if no refresh token is found
    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    // Set the form data parameters for the request
    formData.set("client_id", this.options.CLIENT_ID);
    formData.set("client_secret", this.options.CLIENT_SECRET);
    formData.set("grant_type", "refresh_token");
    formData.set("refresh_token", refreshToken);

    // Send a POST request to the Google OAuth2 token endpoint
    return ofetch(`https://oauth2.googleapis.com/token`, {
      method: "POST",
      body: formData,
    }).then((res) => {
      // Create the new access tokens with the refreshed token and provider name
      const tokens = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token || refreshToken,
        tokenType: res.token_type,
        provider: GoogleAuthProvider.getProviderName(),
      };

      // Return the new access tokens
      return { tokens };
    });
  }

  /**
   * Fetches user data from the Google OAuth2 API.
   *
   * @param {any} tokens - The access tokens.
   * @return {Promise<{ user: AuthUser }>} The user data.
   */
  async fetchUserData(tokens: any): Promise<{ user: AuthUser }> {
    // Send a GET request to the Google OAuth2 userinfo endpoint
    // with the access token in the Authorization header
    const response = await ofetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
        },
      },
    );

    // Return the user data
    return {
      user: response,
    };
  } // end method fetchUserData

  /**
   * Logs out the user by revoking the access token.
   *
   * @param {AccessTokens} tokens - The access tokens of the user.
   * @return {Promise<any>} - A promise that resolves when the logout is complete.
   */
  async logout(tokens: AccessTokens): Promise<any> {
    // Create URL search parameters with the access token
    const params = new URLSearchParams();
    params.set("token", tokens.accessToken);

    // Construct the URL to revoke the access token
    const url = `https://oauth2.googleapis.com/revoke?${params.toString()}`;

    // Send a POST request to the URL with the access token in the request body
    return ofetch(url, {
      method: "POST",
    });
  } // end method logout

  validateRequestBody(): boolean {
    return true;
  } // end method validateRequestBody
} // end class GoogleAuthProvider
