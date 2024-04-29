import {
  useFetch,
  useNuxtApp,
  type AsyncData,
  type UseFetchOptions,
} from "#app";

import { type Ref } from "#imports";

export default function useAuthFetch<DataT, ErrorT>(
  req: string | Request | Ref<string | Request> | (() => string | Request),
  options?: Omit<UseFetchOptions<DataT>, "$fetch">
): Promise<AsyncData<DataT, ErrorT>> {
  const $authFetch = useNuxtApp().$getAuthFetch();

  return useFetch(req, {
    ...options,
    $fetch: $authFetch,
  }) as unknown as Promise<AsyncData<DataT, ErrorT>>;
}
