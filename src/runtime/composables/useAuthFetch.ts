import { useFetch, useNuxtApp, unref } from "#imports";

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

  // Generate a stable key to prevent hydration errors
  // Only auto-generate if no key is provided by user
  const autoKey = !options?.key ? generateStableKey(request, options) : undefined;

  // Delegate to useFetch with auth-specific configuration
  return useFetch(request, {
    ...options,
    // Use auto-generated key if no key provided, otherwise use user's key
    ...(autoKey && { key: autoKey }),
    // Override $fetch with our authenticated version
    // Type assertion needed due to complex Nuxt internal type constraints
    $fetch: $authFetch as any,
  }) as UseFetchReturn<T>;
}

/**
 * Generate a stable key for caching that prevents hydration errors
 */
function generateStableKey(request: UseFetchRequest, options?: any): string {
  // Create base key from request
  let baseKey: string;
  
  if (typeof request === 'string') {
    baseKey = request;
  } else if (typeof request === 'function') {
    // For function requests, use a generic key since we can't predict the URL
    baseKey = 'dynamic-request';
  } else {
    // For ref requests, unref it and treat as string
    const unrefedRequest = unref(request);
    baseKey = typeof unrefedRequest === 'string' ? unrefedRequest : 'ref-request';
  }

  // Create a simple hash of critical options that affect the request
  let optionsHash = '';
  if (options) {
    const criticalOptions = {
      method: options.method,
      body: options.body,
      query: options.query,
      headers: options.headers
    };
    
    // Simple hash generation (not cryptographic, just for cache key uniqueness)
    const optionsStr = JSON.stringify(criticalOptions);
    if (optionsStr !== '{}') {
      optionsHash = `:${btoa(optionsStr).slice(0, 50)}`; // Use first 50 chars for brevity
    }
  }

  return `auth:${baseKey}${optionsHash}`;
}
