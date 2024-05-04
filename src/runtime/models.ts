import type { AccessTokens } from "./providers/AuthProvider";

export enum SupportedAuthProvider {
  LOCAL = "local",
}

export interface AuthLoginData {}

export interface AuthProviderInterface {
  name: string;
  login(authData?: AuthLoginData): Promise<{tokens: AccessTokens}>;
  fetchUserData?(tokens: AccessTokens): Promise<{user: any}>;
  logout(tokens: AccessTokens): Promise<void>;
  refreshTokens?(tokens: AccessTokens, tokenType: string): Promise<{tokens: AccessTokens}>;
  /**
   * @throws {ErrorResponse}
   * @returns {boolean}
   */
  validateRequestBody(body: Record<string, any>): boolean;
}

export type AuthUser = { name: string; profilePicture: string };
export type AuthState = { loggedIn: boolean; user?: null; token?: string; refreshToken?: string }

export interface ErrorResponse {
  message: string;
  data?: Record<string, string[]>;
}

export type HttpMethod = "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE";
