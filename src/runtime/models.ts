import type { AccessTokens } from "./providers/AuthProvider";

export enum SupportedAuthProvider {
  LOCAL = "local",
}

export interface AuthLoginData {}

export interface AuthProviderInterface {
  name: string;
  login(authData?: AuthLoginData): Promise<{tokens: AccessTokens}>;
  isLoggedIn(): boolean;
  getUserData?(): Promise<unknown | null>;
  fetchUserData?(tokens: AccessTokens): Promise<{user: any}>;
  logout(): Promise<void>;
  /**
   * @throws {ErrorResponse}
   * @returns {boolean}
   */
  validateRequestBody(body: Record<string, any>): boolean;
}

export type AuthUser = { name: string; profilePicture: string };
export type AuthState =
  | { loggedIn: true; user: any; token: string; refreshToken?: string }
  | { loggedIn: false; user: null };

export interface ErrorResponse {
  message: string;
  data?: Record<string, string[]>;
}

export type HttpMethod = "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE";
