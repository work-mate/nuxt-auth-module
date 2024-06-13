import * as _nuxt_schema from '@nuxt/schema';
import { ModuleOptions as ModuleOptions$1 } from '@nuxt/schema';
import { H3Event } from 'h3';
import { DeepRequired as DeepRequired$1 } from '~/src/module';

type AuthProviderContructorOptions = {
    providers: Record<string, AuthProviderInterface>;
    defaultProviderKey?: string;
    config: ModuleOptions$1;
};
type AccessTokens = {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    provider: string;
};
type AccessTokensNames = {
    accessToken: string;
    refreshToken?: string;
    authProvider: string;
    tokenType: string;
};
declare class AuthProvider {
    /**
     * @type {Record<string, AuthProviderInterface>}
     */
    private providers;
    /**
     * @type {ModuleOptions}
     */
    private config;
    /**
     * @param {AuthProviderContructorOptions} options
     */
    constructor({ providers, defaultProviderKey, config, }: AuthProviderContructorOptions);
    /**
     * Returns auth provider
     * @param {string} providerKey
     * @return {AuthProviderInterface}
     */
    provider(providerKey: string): AuthProviderInterface;
    /**
     * Returns tokens from event
     * @param {H3Event} event
     * @param {ModuleOptions} authConfig
     * @return {AccessTokens}
     */
    static getTokensFromEvent(event: H3Event, authConfig: ModuleOptions$1): AccessTokens;
    /**
     * Returns token names
     * @return {AccessTokensNames}
     */
    getTokenNames(): AccessTokensNames;
    /**
     * Returns provider key from event
     * @param {H3Event} event
     * @param {ModuleOptions} authConfig
     * @return {string}
     */
    static getProviderKeyFromEvent(event: H3Event, authConfig: ModuleOptions$1): string;
    /**
     * Sets provider tokens to cookies
     * @param {H3Event} event
     * @param {ModuleOptions} authConfig
     * @param {AccessTokens} tokens
     */
    static setProviderTokensToCookies(event: H3Event, authConfig: ModuleOptions$1, tokens: AccessTokens): void;
    /**
     * Deletes provider tokens from cookies
     * @param {H3Event} event
     * @param {ModuleOptions} authConfig
     */
    static deleteProviderTokensFromCookies(event: H3Event, authConfig: ModuleOptions$1): void;
    /**
     * Returns user from event
     * @param {H3Event} event
     * @return {Promise<{user: any}>}
     */
    getUserFromEvent(event: H3Event): Promise<{
        user: any;
    }>;
    /**
     * Logout from event
     * @param {H3Event} event - h3 event
     * @return {Promise<{message: string, remote_error?: any}>}
     */
    logoutFromEvent(event: H3Event): Promise<{
        message: string;
        remote_error?: any;
    }>;
    refreshTokensFromEvent(event: H3Event): Promise<{
        tokens: AccessTokens;
    }>;
}

interface AuthLoginData {
}
interface AuthConfig {
    baseURL: string;
}
interface AuthProviderInterface {
    login(authConfig: AuthConfig, authData?: AuthLoginData): Promise<{
        tokens?: AccessTokens;
        url?: string;
    }>;
    fetchUserData?(tokens: AccessTokens): Promise<{
        user: any;
    }>;
    logout(tokens: AccessTokens): Promise<void>;
    refreshTokens?(tokens: AccessTokens): Promise<{
        tokens: AccessTokens;
    }>;
    /**
     * @throws {ErrorResponse}
     * @returns {boolean}
     */
    validateRequestBody(body: Record<string, any>): boolean;
}
type HttpMethod = "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE";

interface LocalAuthLoginData extends AuthLoginData {
    principal: string;
    password: string;
}
type LocalAuthInitializerOptions = {
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
declare class LocalAuthProvider implements AuthProviderInterface {
    private options;
    private config;
    static defaultOptions: DeepRequired$1<LocalAuthInitializerOptions>;
    constructor(options: LocalAuthInitializerOptions, config: ModuleOptions$1);
    static getProviderName(): string;
    static create(options: LocalAuthInitializerOptions, config: ModuleOptions$1): LocalAuthProvider;
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

type GithubAuthInitializerOptions = {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    HASHING_SECRET: string;
    SCOPES?: string;
};

type ModuleProvidersOptions = {
    local?: LocalAuthInitializerOptions;
    github?: GithubAuthInitializerOptions;
};
type DeepRequired<T> = Required<{
    [P in keyof T]: T[P] extends object | undefined ? DeepRequired<Required<T[P]>> : T[P];
}>;
interface ModuleOptions {
    global: boolean;
    providers: ModuleProvidersOptions;
    defaultProvider?: string;
    redirects: {
        redirectIfNotLoggedIn?: string;
        redirectIfLoggedIn?: string;
    };
    apiClient: {
        baseURL: string;
    };
    token: {
        type: string;
        maxAge: number;
        cookiesNames: {
            accessToken: string;
            refreshToken: string;
            authProvider: string;
            tokenType: string;
        };
    };
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions>;

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        auth: ModuleOptions;
    }
    interface PublicRuntimeConfig {
        auth: {
            redirects: ModuleOptions["redirects"];
            global: ModuleOptions["global"];
            apiClient: ModuleOptions["apiClient"];
        };
    }
}

export { AuthProvider, type DeepRequired, LocalAuthProvider, type ModuleOptions, type ModuleProvidersOptions, _default as default };
