import {
  SupportedAuthProvider,
  type AuthLoginData,
  type AuthProviderInterface,
} from "../models";
import type { LocalAuthProvider } from "./LocalAuthProvider";

export type AuthProviderContructorOptions = {
  providers: Record<string, AuthProviderInterface>;
  defaultProviderKey?: string;
};

export type AccessTokens = {
  accessToken: string;
  refreshToken?: string;
};
export class AuthProvider {
  private providers: Record<string, AuthProviderInterface>;
  private defaultProviderKey: string;
  private tokens: AccessTokens = {
    accessToken: "",
    refreshToken: "",
  };

  constructor({
    providers,
    defaultProviderKey,
  }: AuthProviderContructorOptions) {
    this.providers = providers;
    this.defaultProviderKey = defaultProviderKey || "local";

    if (!this.providers[this.defaultProviderKey]) {
      const providerKeys = Object.keys(this.providers);
      if (providerKeys.length) {
        this.defaultProviderKey = providerKeys[0];
      }
    }
  }

  public provider(providerKey: string): AuthProviderInterface {
    const p = this.providers[providerKey];

    if (!p) {
      const message = `AuthProvider:: Cannot find provider with the key "${providerKey}"`;
      throw new Error(message);
    }

    return p;
  } // end method provider

  public local(): LocalAuthProvider {
    return this.provider(
      SupportedAuthProvider.LOCAL
    ) as unknown as LocalAuthProvider;
  } // end method local

  private defaultProvider(): AuthProviderInterface {
    let p = this.providers[this.defaultProviderKey];

    if (!p) {
      const message = `AuthProvider:: You must set up at least one provider`;
      throw new Error(message);
    }

    return p;
  } // end method defaultProvider

  setTokens(provider: string, tokens: AccessTokens) {
    this.provider(provider).setTokens(tokens);
    this.tokens = tokens;
  } //end setAuthCookies

  getMessage(): string {
    return `Tokens: ${JSON.stringify(this.tokens)}`;
  }

  // public login(authData?: AuthLoginData): Promise<any> {
  //   return this.defaultProvider().login(authData);
  // }

  // isLoggedIn(): boolean {
  //   return this.defaultProvider().isLoggedIn();
  // }

  // getUserData(): Promise<unknown | null> {
  //   return this.defaultProvider().getUserData();
  // }
  // fetchUserData(): Promise<void> {
  //   return this.defaultProvider().fetchUserData();
  // }
  // logout(): Promise<void> {
  //   return this.defaultProvider().logout();
  // }
} //end class AuthProvider
