/**
 * Centralizes browser/server API base resolution and authentication headers.
 * Pages should use this composable instead of calling $fetch directly so SSR,
 * browser navigation, and token handling stay consistent.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const token = useAuthToken(true)
  const base = (import.meta.server ? config.apiBaseServer : config.public.apiBase).replace(/\/$/, '')

  function url(path: string) {
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }

  function headers() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : undefined
  }

  function recordSuccessfulSync() {
    if (import.meta.client) localStorage.setItem('susiair_last_synced_at', new Date().toISOString())
  }

  return {
    get<T>(path: string, query?: Record<string, string | number | undefined | null>) {
      const params: Record<string, string | number> = {}
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (value !== undefined && value !== null && value !== '') params[key] = value
        }
      }
      return $fetch<T>(url(path), { query: params, headers: headers() }).then((response) => {
        recordSuccessfulSync()
        return response
      })
    },
    post<T>(path: string, body?: Record<string, unknown>) {
      return $fetch<T>(url(path), { method: 'POST', body, headers: headers() })
    },
  }
}
