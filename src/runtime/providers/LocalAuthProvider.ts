import defu from "defu";
import type { AuthLoginData, AuthProviderInterface, ErrorResponse } from "../models";
import type { AccessTokens } from "./AuthProvider";

export interface LocalAuthLoginData extends AuthLoginData {
  principal: string;
  password: string;
}

export type LocalAuthInitializerOptions = {
  endpoints?: {
    signIn: { path?: string; method?: string };
    signOut?: { path?: string; method?: string } | false;
    signUp?: { path?: string; method?: string } | false;
    getSession?: { path?: string; method?: string } | false;
  };
};

export class LocalAuthProvider implements AuthProviderInterface {
  name: string = "local";
  private options: Required<LocalAuthInitializerOptions>;
  static defaultOptions: Required<LocalAuthInitializerOptions> = {
    endpoints: {
      signIn: {
        path:  "/signin",
        method: "GET"
      },
      signOut: false,
      signUp: false,
      getSession: false,
    }
  }

  constructor(options: LocalAuthInitializerOptions) {
    this.options = defu(options, LocalAuthProvider.defaultOptions) as Required<LocalAuthInitializerOptions>;
  }

  static create(options: LocalAuthInitializerOptions): LocalAuthProvider {
    return new LocalAuthProvider(options);
  }



  async login(authData: LocalAuthLoginData): Promise<unknown> {
    const url = this.options.endpoints.signIn.path;

    return {
      token: "This is some value here: " + url,
    }
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

  /**
   * @throws {ErrorResponse}
   * @returns {boolean}
   */
  validateRequestBody(body: Record<string, any>): boolean {
    const error = {
      message: "Invalid request body: principal and password required",
      data: {} as Record<string, string[]>
    } satisfies ErrorResponse

    if(!body.principal) {
      error.data["principal"] = ["principal is required"];
    }

    if(!body.password) {
      error.data["password"] = ["password is required"];
    }

    if(Object.keys(error.data).length > 0) {
      throw error;
    }

    return true;
  }


}
