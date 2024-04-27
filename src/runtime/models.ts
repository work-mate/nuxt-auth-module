import type { AccessTokens } from "./providers/AuthProvider";

export enum SupportedAuthProvider {
  LOCAL = "local",
}

export interface AuthLoginData {}

export interface AuthProviderInterface {
  name: string;
  login(authData?: AuthLoginData): Promise<unknown>;
  isLoggedIn(): boolean;
  getUserData?(): Promise<unknown | null>;
  fetchUserData?(): Promise<void>;
  logout(): Promise<void>;
  /**
   * @throws {ErrorResponse}
   * @returns {boolean}
   */
  validateRequestBody(body: Record<string, any>): boolean;
}

export type AuthUser = { name: string; profilePicture: string };
export type AuthState =
  | { loggedIn: true; user: AuthUser }
  | { loggedIn: false; user: null };

export interface ErrorResponse {
  message: string;
  data?: Record<string, string[]>;
};
