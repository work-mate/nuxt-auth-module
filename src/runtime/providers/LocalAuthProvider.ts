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
      body?: {
        principal?: string;
        password?: string;
      };
    };
    signOut?: { path: string; method: HttpMethod } | false;
    signUp?: { path?: string; method?: HttpMethod } | false;
    user?: { path: string; userKey: string } | false;
  };
};

export class LocalAuthProvider implements AuthProviderInterface {
  name: string = "local";
  private options: DeepRequired<LocalAuthInitializerOptions>;
  static defaultOptions: DeepRequired<LocalAuthInitializerOptions> = {
    endpoints: {
      signIn: {
        path: "/signin",
        method: "POST",
        tokenKey: "token",
        body: {
          principal: "username",
          password: "password",
        },
      },
      signOut: false,
      signUp: false,
      user: false,
    },
  };

  constructor(options: LocalAuthInitializerOptions) {
    this.options = defu(
      options,
      LocalAuthProvider.defaultOptions
    ) as DeepRequired<LocalAuthInitializerOptions>;
  }

  static create(options: LocalAuthInitializerOptions): LocalAuthProvider {
    return new LocalAuthProvider(options);
  }

  async login(authData: LocalAuthLoginData): Promise<{ tokens: AccessTokens }> {
    const url = this.options.endpoints.signIn.path;
    const method = this.options.endpoints.signIn.method;
    const principal = this.options.endpoints.signIn.body.principal;
    const password = this.options.endpoints.signIn.body.password;
    const tokenKey = this.options.endpoints.signIn.tokenKey;
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
      const token = getRecursiveProperty(res, tokenKey);

      const accessTokens: AccessTokens = {
        accessToken: token,
      };

      return { tokens: accessTokens };
    });
  }

  isLoggedIn(): boolean {
    throw new Error("Method not implemented.");
  }

  getUserData?(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  async fetchUserData(tokens: AccessTokens): Promise<{ user: any }> {
    if(!this.options.endpoints.user) return { user: null };
    const url =  this.options.endpoints.user.path;
    const method = "GET";
    const userKey = this.options.endpoints.user.userKey;

    return ofetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: tokens.accessToken,
      },
    }).then((res) => {
      let user = res;
      if (userKey) user = getRecursiveProperty(res, userKey);

      return { user };
    });
  }

  logout(): Promise<void> {
    throw new Error("Method not implemented.");
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
}
