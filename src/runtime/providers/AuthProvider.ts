import { SupportedAuthProvider, type AuthProviderInterface } from "../models";
import type { LocalAuthProvider } from "./LocalAuthProvider";
import { getCookie, setCookie, deleteCookie, type H3Event } from "h3";
import type { ModuleOptions } from "@nuxt/schema";

export type AuthProviderContructorOptions = {
  providers: Record<string, AuthProviderInterface>;
  defaultProviderKey?: string;
  config: ModuleOptions;
};

export type AccessTokens = {
  accessToken: string;
  refreshToken?: string;
};
export class AuthProvider {
  private providers: Record<string, AuthProviderInterface>;
  private config: ModuleOptions;

  constructor({
    providers,
    defaultProviderKey,
    config,
  }: AuthProviderContructorOptions) {
    this.config = config;
    this.providers = providers;
    let providerKey = defaultProviderKey || "local";
    // if (!this.providers[providerKey]) {
    //   throw new Error(
    //     `AuthProvider:: Cannot find provider with the key "${providerKey}"`
    //   );
    // }

    // const providerKey = defaultProviderKey || "local";

    if(!this.providers[providerKey]){
      const providerKeys = Object.keys(this.providers);
      if(providerKeys.length) {
        providerKey = providerKeys[0];
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

  static getTokensFromEvent(
    event: H3Event,
    authConfig: ModuleOptions
  ): AccessTokens {
    const cookiesNames = authConfig.token.cookiesNames;
    const accessToken = getCookie(event, cookiesNames.accessToken) || "";
    const refreshToken = getCookie(event, cookiesNames.refreshToken) || "";

    return { accessToken, refreshToken };
  }

  static getProviderKeyFromEvent(
    event: H3Event,
    authConfig: ModuleOptions
  ): string {
    const cookiesNames = authConfig.token.cookiesNames;
    return getCookie(event, cookiesNames.authProvider) || "";
  }

  static setProviderTokensToCookies(
    event: H3Event,
    authConfig: ModuleOptions,
    provider: string,
    tokens: AccessTokens
  ) {
    const cookiesNames = authConfig.token.cookiesNames;
    const maxAge = authConfig.token.maxAge;
    const options = {
      expires: new Date(Date.now() + maxAge),
    };

    setCookie(
      event,
      cookiesNames.accessToken,
      tokens.accessToken || "",
      options
    );
    setCookie(
      event,
      cookiesNames.refreshToken,
      tokens.refreshToken || "",
      options
    );
    setCookie(event, cookiesNames.authProvider, provider, options);
  }

  static deleteProviderTokensFromCookies(
    event: H3Event,
    authConfig: ModuleOptions
  ) {
    const cookiesNames = authConfig.token.cookiesNames;
    deleteCookie(event, cookiesNames.accessToken);
    deleteCookie(event, cookiesNames.refreshToken);
    deleteCookie(event, cookiesNames.authProvider);
  }

  async getUserFromEvent(event: H3Event): Promise<{user: any}> {
    const emptyUser = {user: null};

    const tokens = AuthProvider.getTokensFromEvent(
      event,
      this.config,
    );

    const providerKey = AuthProvider.getProviderKeyFromEvent(event, this.config);
    if(!providerKey) return emptyUser;

    const provider = this.provider(providerKey);
    if(!provider || !provider.fetchUserData) {
      return emptyUser;
    }

    return await provider.fetchUserData(tokens);
  }
} //end class AuthProvider
