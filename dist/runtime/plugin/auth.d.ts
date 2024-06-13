import { type ComputedRef, type Ref } from "#imports";
import { SupportedAuthProvider } from "../models";
import type { AccessTokens, AccessTokensNames } from "../providers/AuthProvider";
export type AuthPlugin = {
    loggedIn: ComputedRef<boolean>;
    user: ComputedRef<any | null | undefined>;
    token: ComputedRef<string | undefined>;
    refreshToken: ComputedRef<string | undefined>;
    tokenType: ComputedRef<string | undefined>;
    provider: ComputedRef<string | undefined>;
    tokenNames: Readonly<Ref<AccessTokensNames | null>>;
    login: (provider: string | SupportedAuthProvider, data?: Record<string, string>, redirectTo?: string) => Promise<{
        tokens: AccessTokens;
    } | {
        message: string;
    }>;
    logout: (redirectTo?: string) => Promise<unknown>;
    refreshUser: () => Promise<void>;
    refreshTokens: () => Promise<void>;
};
declare const _default: any;
export default _default;
declare module "#app" {
    interface NuxtApp {
        $auth: AuthPlugin;
    }
}
