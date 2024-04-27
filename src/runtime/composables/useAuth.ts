import { useNuxtApp } from "#app";

export default function useAuth() {
  return useNuxtApp().$auth;
}
