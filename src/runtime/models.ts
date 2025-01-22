import type { AccessTokens } from "./providers/AuthProvider";

export enum SupportedAuthProvider {
  LOCAL = "local",
  GITHUB = "github",
  GOOGLE = "google",
}

export interface AuthLoginData {}

export interface AuthConfig {
  baseURL: string;
}

export interface AuthProviderInterface {
  login(
    authConfig: AuthConfig,
    authData?: AuthLoginData,
  ): Promise<{ tokens?: AccessTokens; url?: string }>;
  fetchUserData?(tokens: AccessTokens): Promise<{ user: AuthUser | null }>;
  logout(tokens: AccessTokens): Promise<void>;
  refreshTokens?(tokens: AccessTokens): Promise<{ tokens: AccessTokens }>;
  /**
   * @throws {ErrorResponse}
   * @returns {boolean}
   */
  validateRequestBody(body: Record<string, any>): boolean;
}

export interface AuthUser {}

export type AuthState =
  | { loggedIn: false; user: null }
  | {
      loggedIn: true;
      user: AuthUser;
      token: string;
      refreshToken?: string;
      tokenType: string;
      provider: string;
    };

export interface ErrorResponse {
  message: string;
  data?: Record<string, string[]>;
}

export type HttpMethod =
  | "GET"
  | "HEAD"
  | "PATCH"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE";
