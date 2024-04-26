import {
  SupportedAuthProvider,
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
  private activeProviderKey: string;
  private tokens: AccessTokens = {
    accessToken: "",
    refreshToken: "",
  };

  constructor({
    providers,
    defaultProviderKey,
  }: AuthProviderContructorOptions) {
    this.providers = providers;
    const providerKey = defaultProviderKey || "local"
    this.setDefaultProvider(providerKey);
    this.activeProviderKey = providerKey;
  }

  public setDefaultProvider(providerKey: string) {
    this.activeProviderKey = providerKey;

    if (!this.providers[providerKey]) {
      throw new Error(`AuthProvider:: Cannot find provider with the key "${providerKey}"`);
    }

    this.activeProviderKey = providerKey;
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


  setTokens(provider: string, tokens: AccessTokens) {
    this.provider(provider).setTokens(tokens);
    this.tokens = tokens;
  } //end setAuthCookies

  getMessage(): string {
    return `Tokens: ${JSON.stringify(this.tokens)}`;
  }


  // private defaultProvider(): AuthProviderInterface {
  //   let p = this.providers[this.activeProviderKey];

  //   if (!p) {
  //     const message = `AuthProvider:: You must set up at least one provider`;
  //     throw new Error(message);
  //   }

  //   return p;
  // } // end method defaultProvider
} //end class AuthProvider
