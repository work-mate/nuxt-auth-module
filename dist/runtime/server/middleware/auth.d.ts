import { type AccessTokens, type AccessTokensNames } from "../../providers/AuthProvider";
type AuthContext = {
    isAuthenticated: () => Promise<boolean>;
    getUser: () => Promise<{
        user: any;
    }>;
    getTokens: () => Promise<AccessTokens>;
    getTokenNames: () => AccessTokensNames;
    logout: () => Promise<void>;
};
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<void>>;
export default _default;
declare module "h3" {
    interface H3EventContext {
        auth: AuthContext;
    }
}
