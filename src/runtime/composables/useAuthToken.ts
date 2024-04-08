import { storeToRefs } from "pinia";
import { useTokenStore } from "../stores/useTokenStore";
import { readonly } from "#imports";

export default function useAuthToken() {
  const {token} = storeToRefs(useTokenStore());

  return readonly(token);
}
