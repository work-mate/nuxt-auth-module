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

  async login(): Promise<{ url: string }> {
    const params = new URLSearchParams();
    params.set("client_id", this.options.CLIENT_ID);
    // params.set("scope", "user:email");
    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`
    }
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
