import type { AuthLoginData, AuthProvider } from "../models";

export interface LocalAuthLoginData extends AuthLoginData {
  principal: string;
  password: string;
}

export class LocalAuthProvider implements AuthProvider {
  name: string = "local";

  login(authData: LocalAuthLoginData): Promise<unknown> {
    throw new Error("Method not implemented.");
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
}
