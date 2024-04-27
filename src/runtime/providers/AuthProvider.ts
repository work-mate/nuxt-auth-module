import { SupportedAuthProvider, type AuthProviderInterface } from "../models";
import type { LocalAuthProvider } from "./LocalAuthProvider";
import { getCookie, setCookie, deleteCookie, type H3Event } from "h3";
import type { ModuleOptions } from "@nuxt/schema";

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

  constructor({
    providers,
    defaultProviderKey,
  }: AuthProviderContructorOptions) {
    this.providers = providers;
    const providerKey = defaultProviderKey || "local";
    if (!this.providers[providerKey]) {
      throw new Error(
        `AuthProvider:: Cannot find provider with the key "${providerKey}"`
      );
    }
    this.defaultProviderKey = providerKey;
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

  static getTokensFromEvent(event: H3Event, authConfig: ModuleOptions): AccessTokens {
    const cookiesNames = authConfig.token.cookiesNames;
    const accessToken = getCookie(event, cookiesNames.accessToken) || "";
    const refreshToken = getCookie(event, cookiesNames.refreshToken) || "";

    return { accessToken, refreshToken }
  }

  static getProviderKeyFromEvent(event: H3Event, authConfig: ModuleOptions): string {
    const cookiesNames = authConfig.token.cookiesNames;
    return getCookie(event, cookiesNames.authProvider) || "";
  }

  static setProviderTokensToCookies(event: H3Event, authConfig: ModuleOptions, provider: string, tokens: AccessTokens) {
    const cookiesNames = authConfig.token.cookiesNames;
    const maxAge = authConfig.token.maxAge;
    const options = {
      expires: new Date(Date.now() + maxAge),
    };
    const tokenType = authConfig.token.type;

    setCookie(event, cookiesNames.accessToken, `${tokenType} ${tokens.accessToken}`, options);
    setCookie(event, cookiesNames.refreshToken, `${tokenType} ${tokens.refreshToken || ""}`, options);
    setCookie(event, cookiesNames.authProvider, provider, options);
  }

  static deleteProviderTokensFromCookies(event: H3Event, authConfig: ModuleOptions) {
    const cookiesNames = authConfig.token.cookiesNames;
    deleteCookie(event, cookiesNames.accessToken);
    deleteCookie(event, cookiesNames.refreshToken);
    deleteCookie(event, cookiesNames.authProvider);
  }
} //end class AuthProvider
