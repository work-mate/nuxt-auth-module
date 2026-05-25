import useAuth from "./useAuth";

export default function useAuthToken() {
  const auth = useAuth();

  return {
    token: auth.token,
    refreshToken: auth.refreshToken,
    tokenType: auth.tokenType,
    tokenNames: auth.tokenNames,
    provider: auth.provider,
    refreshTokens: auth.refreshTokens,
  };
}
