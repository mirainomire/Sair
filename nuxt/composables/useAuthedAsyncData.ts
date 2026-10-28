import type { AsyncDataOptions, MultiWatchSources } from 'nuxt/app'

function isUnauthorized(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = (error as { statusCode?: number; status?: number }).statusCode ?? (error as { status?: number }).status
  return status === 401
}

export async function useAuthedAsyncData<T>(
  key: string | (() => string),
  handler: () => Promise<T>,
  options?: Pick<AsyncDataOptions<T>, 'watch'> & { watch?: MultiWatchSources },
) {
  const token = useAuthToken(true)
  const result = await useAsyncData(key, handler, options)
  if (import.meta.client && isUnauthorized(result.error.value) && token.value) {
    await result.refresh()
  }
  return result
}
