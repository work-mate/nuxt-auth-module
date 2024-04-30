import { type AsyncData, type UseFetchOptions } from "#app";

import { type Ref, useFetch , useNuxtApp} from "#imports";

export default function useAuthFetch<DataT, ErrorT>(
  req: string | Request | Ref<string | Request> | (() => string | Request),
  options?: Omit<UseFetchOptions<DataT>, "$fetch">
): Promise<AsyncData<DataT, ErrorT>> {
  const $authFetch = useNuxtApp().$authFetch;

  return useFetch(req, {
    key: `auth:${req};options:${btoa(JSON.stringify(options))}`,
    ...options,
    $fetch: $authFetch,
  }) as unknown as Promise<AsyncData<DataT, ErrorT>>;
}
