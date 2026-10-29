const maxAge = 60 * 60 * 24 * 7

export function useAuthToken(readonly = false) {
  return useCookie<string | null>('susiair_token', {
    path: '/',
    sameSite: 'strict',
    secure: !import.meta.dev,
    maxAge,
    readonly,
  })
}
