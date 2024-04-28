import {
  useAsyncData,
  useFetch,
  useNuxtApp,
  type AsyncData,
  type AsyncDataOptions,
  type NuxtApp,
  type UseFetchOptions,
} from "#app";

import { type Ref} from "#imports";

export default function useAuthAsyncFetch<DataT, DataE>(key: string,
  handler: (nuxtApp?: NuxtApp) => Promise<DataT>,
  options?: AsyncDataOptions<DataT>) {
  useAsyncData("auth", handler, options);
}
