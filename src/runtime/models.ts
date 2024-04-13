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
}
