import type { AuthConfig, AuthLoginData, AuthProviderInterface, HttpMethod } from "../models";
import type { AccessTokens } from "./AuthProvider";
import type { DeepRequired } from "~/src/module";
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
        signOut?: {
            path: string;
            method: HttpMethod;
        } | false;
        signUp?: {
            path?: string;
            method?: HttpMethod;
        } | false;
        user?: {
            path: string;
            userKey: string;
        } | false;
        refreshToken?: {
            path: string;
            method: HttpMethod;
            tokenKey: string;
            refreshTokenKey: string;
            body: {
                token: string;
                refreshToken: string;
            };
        } | false;
    };
};
export declare class LocalAuthProvider implements AuthProviderInterface {
    private options;
    private config;
    static defaultOptions: DeepRequired<LocalAuthInitializerOptions>;
    constructor(options: LocalAuthInitializerOptions, config: ModuleOptions);
    static getProviderName(): string;
    static create(options: LocalAuthInitializerOptions, config: ModuleOptions): LocalAuthProvider;
    login(_: AuthConfig, authData: LocalAuthLoginData): Promise<{
        tokens: AccessTokens;
    }>;
    fetchUserData(tokens: AccessTokens): Promise<{
        user: any;
    }>;
    logout(tokens: AccessTokens): Promise<any>;
    /**
     * @throws {ErrorResponse}
     * @returns {boolean}
     */
    validateRequestBody(body: Record<string, any>): boolean;
    refreshTokens(tokens: AccessTokens): Promise<{
        tokens: AccessTokens;
    }>;
}
