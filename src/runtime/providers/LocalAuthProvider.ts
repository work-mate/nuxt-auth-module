import type { AuthLoginData, AuthProviderInterface } from "../models";
import type { AccessTokens } from "./AuthProvider";

export interface LocalAuthLoginData extends AuthLoginData {
  principal: string;
  password: string;
}

export type LocalAuthInitializerOptions = {
  secret: string;
  endpoints?: {
    signIn?: { path?: string; method?: string };
    signOut?: { path?: string; method?: string } | false;
    signUp?: { path?: string; method?: string };
    getSession?: { path?: string; method?: string };
  };
  token?: {
    signInResponseTokenPointer?: string;
    type?: string;
    cookieName?: string;
    headerName?: string;
    maxAgeInSeconds?: number;
  };
};

export class LocalAuthProvider implements AuthProviderInterface {
  name: string = "local";
  tokens: AccessTokens = {
    accessToken: "",
    refreshToken: "",
  };

  login(authData: LocalAuthLoginData): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  isLoggedIn(): boolean {
    throw new Error("Method not implemented.");
  }

  getUserData?(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  fetchUserData?(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  logout(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  setTokens(tokens: AccessTokens): void {
    this.tokens = tokens;
  }

  getTokens(): AccessTokens {
    return this.tokens;
  }

  static create(options: LocalAuthInitializerOptions): LocalAuthProvider {
    return new LocalAuthProvider();
  }
}
