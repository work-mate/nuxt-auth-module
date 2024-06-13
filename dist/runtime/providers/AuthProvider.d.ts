import { type AuthProviderInterface } from "../models";
import { type H3Event } from "h3";
import type { ModuleOptions } from "@nuxt/schema";
export type AuthProviderContructorOptions = {
    providers: Record<string, AuthProviderInterface>;
    defaultProviderKey?: string;
    config: ModuleOptions;
};
export type AccessTokens = {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    provider: string;
};
export type AccessTokensNames = {
    accessToken: string;
    refreshToken?: string;
    authProvider: string;
    tokenType: string;
};
export declare class AuthProvider {
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
    static getTokensFromEvent(event: H3Event, authConfig: ModuleOptions): AccessTokens;
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
    static getProviderKeyFromEvent(event: H3Event, authConfig: ModuleOptions): string;
    /**
     * Sets provider tokens to cookies
     * @param {H3Event} event
     * @param {ModuleOptions} authConfig
     * @param {AccessTokens} tokens
     */
    static setProviderTokensToCookies(event: H3Event, authConfig: ModuleOptions, tokens: AccessTokens): void;
    /**
     * Deletes provider tokens from cookies
     * @param {H3Event} event
     * @param {ModuleOptions} authConfig
     */
    static deleteProviderTokensFromCookies(event: H3Event, authConfig: ModuleOptions): void;
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
