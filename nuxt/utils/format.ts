export function errorText(error: unknown) {
  const data = (error as { data?: { message?: string | string[] } })?.data
  if (Array.isArray(data?.message)) return data.message.join(' ')
  if (typeof data?.message === 'string') return data.message
  return 'The service could not be reached. Check your connection, then try again.'
}

const dutyLabels: Record<string, string> = {
  DTY: 'Flight duty', RLV: 'Leave', SCK: 'Sick leave', TRD: 'Travel day',
  TRX: 'Training', ADM: 'Administration', FER: 'Ferry flight', MED: 'Medical',
  REC: 'Recurrent training', ULV: 'Unpaid leave',
}

export function dutyTitle(code: string) {
  return dutyLabels[code] ?? 'Duty'
}

export function formatUtcDate(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

export function formatUtcMonth(value: string) {
  return formatUtcDate(`${value}-01`, { month: 'long', year: 'numeric' })
}
