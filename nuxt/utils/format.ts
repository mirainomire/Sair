export function errorText(error: unknown) {
  const data = (error as { data?: { message?: string | string[] } })?.data
  if (Array.isArray(data?.message)) return data.message.join(' ')
  if (typeof data?.message === 'string') return data.message
  return 'The service could not be reached. Check your connection, then try again.'
}
