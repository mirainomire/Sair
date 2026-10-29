const maxAge = 60 * 60 * 24 * 7

export function useAuthToken(readonly: true): Readonly<Ref<string | null>>
export function useAuthToken(readonly?: false): Ref<string | null>
export function useAuthToken(readonly = false) {
  const options = {
    path: '/',
    sameSite: 'strict',
    secure: !import.meta.dev,
    maxAge,
  } as const
  return readonly
    ? useCookie<string | null>('susiair_token', { ...options, readonly: true })
    : useCookie<string | null>('susiair_token', { ...options, readonly: false })
}
