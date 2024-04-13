import { useRuntimeConfig } from "#app";
import useAuthToken from "./useAuthToken";
import useAuthUser from "./useAuthUser";

export default function useAuth() {
  const config = useRuntimeConfig();

  console.log("SecretKey", config?.auth?.secretKey)

  return {
    token: useAuthToken(),
    user: useAuthUser(),
  }
}
