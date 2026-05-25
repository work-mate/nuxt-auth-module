import useAuth from "./useAuth";

export default function useAuthUser() {
  const auth = useAuth();

  return {
    user: auth.user,
    isLoggedIn: auth.isLoggedIn,
    refreshUser: auth.refreshUser,
  };
}
