import { storeToRefs } from "pinia";
import { useUserStore } from "../stores/useUserStore";
import { readonly } from "#imports";

export default function useAuthUser() {
  const { user } = storeToRefs(useUserStore());

  return readonly(user);
}
