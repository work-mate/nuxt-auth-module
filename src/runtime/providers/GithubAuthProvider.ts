import defu from "defu";
import type { DeepRequired } from "~/src/module";
import type { AuthProviderInterface } from "../models";

export type GithubAuthInitializerOptions = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
}

export class GithubAuthProvider implements AuthProviderInterface {
  name = "github";

  private options: DeepRequired<GithubAuthInitializerOptions>;

  constructor(options: GithubAuthInitializerOptions) {
    this.options = options;
  }// end constructor method

  static create(options: GithubAuthInitializerOptions): GithubAuthProvider {
    return new GithubAuthProvider(options);
  }

  async login(): Promise<{ tokens: any }> {
    return Promise.reject("GithubAuthProvider is not implemented");
  }


  async fetchUserData(tokens: any): Promise<{ user: any }> {
    return Promise.reject("GithubAuthProvider is not implemented");
  } // end method fetchUserData


  async logout(tokens: any): Promise<any> {
    return Promise.reject("GithubAuthProvider is not implemented");
  } // end method logout

  validateRequestBody(body: Record<string, any>): boolean {
    return true;
  } // end method validateRequestBody
}// end class GithubAuthProvider
