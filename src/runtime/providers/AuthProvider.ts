import { logger } from "@nuxt/kit";
import { SupportedAuthProvider, type AuthLoginData, type AuthProviderInterface } from "../models";
import type { LocalAuthProvider } from "./LocalAuthProvider";

export type AuthProviderContructorOptions = {
  providers: Record<string, AuthProviderInterface>;
  defaultProviderKey?: string;
};
export class AuthProvider {
  private providers: Record<string, AuthProviderInterface>;
  private defaultProviderKey: string;

  constructor({ providers, defaultProviderKey }: AuthProviderContructorOptions) {
    this.providers = providers;
    this.defaultProviderKey = defaultProviderKey || "local";

    if(!this.providers[this.defaultProviderKey]){
      const providerKeys = Object.keys(this.providers);
      if(providerKeys.length) {
        this.defaultProviderKey = providerKeys[0];
      }
    }
  }

  public provider(providerKey: string): AuthProviderInterface {
    const p = this.providers[providerKey];

    if (!p) {
      const message = `AuthProvider:: Cannot find provider with the key "${providerKey}"`;
      logger.error(message);
      throw new Error(message);
    }

    return p;
  }// end method provider

  public local(): LocalAuthProvider {
    return this.provider(SupportedAuthProvider.LOCAL) as unknown as LocalAuthProvider;
  }// end method local

  private defaultProvider(): AuthProviderInterface {
    let p = this.providers[this.defaultProviderKey];

    if(!p) {
      const message = `AuthProvider:: You must set up at least one provider`;
      logger.error(message);
      throw new Error(message);
    }

    return p;
  }// end method defaultProvider

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
}//end class AuthProvider
