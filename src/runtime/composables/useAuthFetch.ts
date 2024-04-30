import { type AsyncData, type FetchResult, type UseFetchOptions } from "#app";
export type _Transform<Input = any, Output = any> = (input: Input) => Output | Promise<Output>;
export type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T : T extends Record<string, any> ? keyof T extends K[number] ? T : K[number] extends never ? T : Pick<T, K[number]> : T;
export type KeysOf<T> = Array<T extends T ? keyof T extends string ? keyof T : never : never>;
export type KeyOfRes<Transform extends _Transform> = KeysOf<ReturnType<Transform>>;
import { type Ref, useFetch, useNuxtApp, } from "#imports";
import type { FetchError} from "ofetch";
import type { NitroFetchRequest, AvailableRouterMethod as _AvailableRouterMethod } from 'nitropack';

type AvailableRouterMethod<R extends NitroFetchRequest> = _AvailableRouterMethod<R> | Uppercase<_AvailableRouterMethod<R>>;

export default function useAuthFetch<
  ResT = void,
  ErrorT = FetchError,
  ReqT extends NitroFetchRequest = NitroFetchRequest,
  Method extends AvailableRouterMethod<ReqT> = ResT extends void
    ? "get" extends AvailableRouterMethod<ReqT>
      ? "get"
      : AvailableRouterMethod<ReqT>
    : AvailableRouterMethod<ReqT>,
  _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
  DataT = _ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null
>(
  req: Ref<ReqT> | ReqT | (() => ReqT),
  options?: UseFetchOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | null> {
  const $authFetch = useNuxtApp().$authFetch;

  return useFetch(req, {
    key: `auth:${req};options:${btoa(JSON.stringify(options))}`,
    ...options,
    $fetch: $authFetch,
  });
}
