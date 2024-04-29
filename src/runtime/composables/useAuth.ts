import { useNuxtApp } from "#app";
import type { AuthPlugin } from "../plugin/auth";

export default function useAuth(): AuthPlugin {
  return useNuxtApp().$auth;
}
