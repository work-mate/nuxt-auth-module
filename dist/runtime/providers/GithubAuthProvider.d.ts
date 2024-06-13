import type { ModuleOptions } from "~/src/module";
import type { AuthConfig, AuthLoginData, AuthProviderInterface } from "../models";
import type { AccessTokens } from "./AuthProvider";
export type GithubAuthInitializerOptions = {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    HASHING_SECRET: string;
    SCOPES?: string;
};
export interface GithubAuthLoginData extends AuthLoginData {
    redirectUrl?: string;
}
export declare class GithubAuthProvider implements AuthProviderInterface {
    private options;
    constructor(options: GithubAuthInitializerOptions);
    static getProviderName(): string;
    static verifyGithubState(state: string, config: ModuleOptions): boolean;
    static getTokens(code: string, config: ModuleOptions): Promise<{
        tokens: AccessTokens;
    }>;
    static create(options: GithubAuthInitializerOptions): GithubAuthProvider;
    login(authConfig: AuthConfig, authData?: GithubAuthLoginData): Promise<{
        url: string;
    }>;
    refreshTokens(tokens: AccessTokens): Promise<{
        tokens: AccessTokens;
    }>;
    fetchUserData(tokens: any): Promise<{
        user: any;
    }>;
    logout(): Promise<any>;
    validateRequestBody(): boolean;
}
