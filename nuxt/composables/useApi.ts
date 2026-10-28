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

  return {
    get<T>(path: string, query?: Record<string, string | number | undefined | null>) {
      const params: Record<string, string | number> = {}
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (value !== undefined && value !== null && value !== '') params[key] = value
        }
      }
      return $fetch<T>(url(path), { query: params, headers: headers() })
    },
    post<T>(path: string, body?: unknown) {
      return $fetch<T>(url(path), { method: 'POST', body, headers: headers() })
    },
  }
}
