import type { AsyncDataOptions, MultiWatchSources } from 'nuxt/app'

function isUnauthorized(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = (error as { statusCode?: number; status?: number }).statusCode ?? (error as { status?: number }).status
  return status === 401
}

/**
 * Wraps Nuxt async data for protected screens. It keeps the page-level loading
 * contract in one place and turns an expired token into a clean login redirect.
 */
export async function useAuthedAsyncData<T>(
  key: string | (() => string),
  handler: () => Promise<T>,
  options?: Pick<AsyncDataOptions<T>, 'watch' | 'lazy'> & { watch?: MultiWatchSources },
) {
  const token = useAuthToken(true)
  const result = await useAsyncData(key, handler, options)
  if (import.meta.client && isUnauthorized(result.error.value)) {
    if (token.value) await result.refresh()
    if (isUnauthorized(result.error.value)) {
      useAuthToken().value = null
      clearNuxtData()
      await nextTick()
      await navigateTo('/login')
    }
  }
  return result
}
