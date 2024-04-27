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
  setTokens(token: AccessTokens): void;
  getTokens(): AccessTokens;
}

export type AuthUser = { name: string; profilePicture: string };
export type AuthState =
  | { loggedIn: true; user: AuthUser }
  | { loggedIn: false; user: null };


export type ErrorResponse = {
  message: string;
  data?: Record<string, string[]>,
}
