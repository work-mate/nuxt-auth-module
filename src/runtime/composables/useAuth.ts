import { useRuntimeConfig } from "#app";
import useAuthToken from "./useAuthToken";
import useAuthUser from "./useAuthUser";

export default function useAuth() {
  return {
    token: useAuthToken(),
    user: useAuthUser(),
  }
}
