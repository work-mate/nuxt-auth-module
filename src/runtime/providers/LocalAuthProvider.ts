import defu from "defu";
import type {
  AuthLoginData,
  AuthProviderInterface,
  ErrorResponse,
  HttpMethod,
} from "../models";
import type { AccessTokens } from "./AuthProvider";
import type { DeepRequired } from "~/src/module";
import { getRecursiveProperty } from "../helpers";
import { ofetch } from "ofetch";
import type { ModuleOptions } from "@nuxt/schema";

export interface LocalAuthLoginData extends AuthLoginData {
  principal: string;
  password: string;
}

export type LocalAuthInitializerOptions = {
  endpoints?: {
    signIn?: {
      path?: string;
      method?: HttpMethod;
      tokenKey?: string;
      refreshTokenKey?: string;
      body?: {
        principal?: string;
        password?: string;
      };
    };
    signOut?: { path: string; method: HttpMethod } | false;
    signUp?: { path?: string; method?: HttpMethod } | false;
    user?: { path: string; userKey: string } | false;
    refreshToken?: {
      path: string;
      method: HttpMethod;
      tokenKey: string;
      refreshTokenKey: string;
      body: {
        token: string;
        refreshToken: string;
      }
    } | false;
  };
};

export class LocalAuthProvider implements AuthProviderInterface {
  private options: DeepRequired<LocalAuthInitializerOptions>;
  private config: ModuleOptions;
  static defaultOptions: DeepRequired<LocalAuthInitializerOptions> = {
    endpoints: {
      signIn: {
        path: "/signin",
        method: "POST",
        tokenKey: "token",
        refreshTokenKey: "refresh_token",
        body: {
          principal: "username",
          password: "password",
        },
      },
      signOut: false,
      signUp: false,
      user: false,
      refreshToken: false,
    },
  };

  constructor(options: LocalAuthInitializerOptions, config: ModuleOptions) {
    this.config = config;
    this.options = defu(
      options,
      LocalAuthProvider.defaultOptions
    ) as DeepRequired<LocalAuthInitializerOptions>;
  }

  static getProviderName(): string {
    return "local";
  }

  static create(options: LocalAuthInitializerOptions, config: ModuleOptions): LocalAuthProvider {
    return new LocalAuthProvider(options, config);
  }

  async login(authData: LocalAuthLoginData): Promise<{ tokens: AccessTokens }> {
    const url = this.options.endpoints.signIn.path;
    const method = this.options.endpoints.signIn.method;
    const principal = this.options.endpoints.signIn.body.principal;
    const password = this.options.endpoints.signIn.body.password;
    const tokenKey = this.options.endpoints.signIn.tokenKey;
    const refreshTokenKey = this.options.endpoints.signIn.refreshTokenKey;
    const body = {
      [principal]: authData.principal,
      [password]: authData.password,
    };

    return ofetch(url, {
      method,
      body,
      headers: {
        Accept: "application/json",
      },
    }).then((res) => {
      let token = res;
      if(tokenKey)
        token = getRecursiveProperty(res, tokenKey);

      let refreshToken = "";
      if(refreshTokenKey)
        refreshToken = getRecursiveProperty(res, refreshTokenKey);

      const accessTokens: AccessTokens = {
        accessToken: token,
        refreshToken: refreshToken || "",
        provider: LocalAuthProvider.getProviderName(),
        tokenType: this.config.token.type,
      };

      return { tokens: accessTokens };
    });
  }

  async fetchUserData(tokens: AccessTokens): Promise<{ user: any }> {
    if(!this.options.endpoints.user) return { user: null };
    const url =  this.options.endpoints.user.path;
    const method = "GET";
    const userKey = this.options.endpoints.user.userKey;
    const accessToken = tokens.tokenType ? `${tokens.tokenType} ${tokens.accessToken}` : tokens.accessToken;

    return ofetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: accessToken,
      },
    }).then((res) => {
      let user = res;
      if (userKey) user = getRecursiveProperty(res, userKey);

      return { user };
    });
  }

  async logout(tokens: AccessTokens): Promise<any> {
    if(!this.options.endpoints.signOut) return;

    const url =  this.options.endpoints.signOut.path;
    const method = this.options.endpoints.signOut.method;

    const accessToken = tokens.tokenType ? `${tokens.tokenType} ${tokens.accessToken}` : tokens.accessToken;

    return ofetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: accessToken,
      },
    });
  }

  /**
   * @throws {ErrorResponse}
   * @returns {boolean}
   */
  validateRequestBody(body: Record<string, any>): boolean {
    const error = {
      message: "Invalid request body: principal and password required",
      data: {} as Record<string, string[]>,
    } satisfies ErrorResponse;

    if (!body.principal) {
      error.data["principal"] = ["principal is required"];
    }

    if (!body.password) {
      error.data["password"] = ["password is required"];
    }

    if (Object.keys(error.data).length > 0) {
      throw error;
    }

    return true;
  }

  async refreshTokens(tokens: AccessTokens): Promise<{tokens: AccessTokens}> {
    if(!this.options.endpoints.refreshToken) return Promise.reject("refreshToken not configured");

    const url = this.options.endpoints.refreshToken.path;
    const method = this.options.endpoints.refreshToken.method;
    const tokenKey = this.options.endpoints.refreshToken.tokenKey;
    const refreshTokenKey = this.options.endpoints.refreshToken.refreshTokenKey;
    const tokenBodyKey = this.options.endpoints.refreshToken.body.token;
    const refreshTokenBodyKey = this.options.endpoints.refreshToken.body.refreshToken;

    const body = {
      [tokenBodyKey]: tokens.accessToken,
      [refreshTokenBodyKey]: (tokens.refreshToken || ""),
    };

    return ofetch(url, {
      method,
      ...(method == "GET" ? {
        query: body,
      } : {
        body,
      }),
      headers: {
        Accept: "application/json",
      },
    }).then((res) => {
      let token = res;
      if(tokenKey)
        token = getRecursiveProperty(res, tokenKey);

      let refreshToken = "";
      if(refreshTokenKey)
        refreshToken = getRecursiveProperty(res, refreshTokenKey);

      const accessTokens: AccessTokens = {
        accessToken: token,
        refreshToken: refreshToken || tokens.refreshToken || "",
        provider: LocalAuthProvider.getProviderName(),
        tokenType: this.config.token.type,
      };

      return { tokens: accessTokens };
    });
  }
}
