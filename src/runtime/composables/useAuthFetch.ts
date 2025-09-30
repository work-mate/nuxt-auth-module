import { useFetch, useNuxtApp } from "#imports";

// Re-export the parameter types from useFetch for consistency
type UseFetchReturn<T> = ReturnType<typeof useFetch<T>>;
type UseFetchOptions<T> = Parameters<typeof useFetch<T>>[1];
type UseFetchRequest = Parameters<typeof useFetch>[0];

/**
 * Authenticated version of useFetch that automatically includes auth tokens
 * 
 * This function delegates to useFetch with the same signature and behavior,
 * but uses the authenticated $authFetch instance for automatic token handling.
 * 
 * @param request - Same as useFetch: URL string, ref, or function
 * @param options - Same options as useFetch  
 * @returns Same return type as useFetch
 */
export default function useAuthFetch<T = unknown>(
  request: UseFetchRequest,
  options?: UseFetchOptions<T>
): UseFetchReturn<T> {
  const { $authFetch } = useNuxtApp();

  // Generate a unique key for caching
  const baseKey = typeof request === 'string' 
    ? request 
    : typeof request === 'function' 
      ? 'dynamic-request'
      : 'ref-request';

  // Include serialized options in key for proper cache differentiation
  const optionsKey = options ? `;options:${btoa(JSON.stringify(options))}` : '';

  // Delegate to useFetch with auth-specific configuration
  return useFetch(request, {
    key: `auth:${baseKey}${optionsKey}`,
    ...options,
    // Override $fetch with our authenticated version
    // Type assertion needed due to complex Nuxt internal type constraints
    $fetch: $authFetch as any,
  }) as UseFetchReturn<T>;
}
