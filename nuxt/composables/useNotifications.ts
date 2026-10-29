/**
 * Stores notification preferences locally until a push-notification service is
 * available. Keeping this behind a composable gives the UI one consistent
 * contract and makes it straightforward to connect to the API later.
 */
export type NotificationSettings = {
  rosterChanges: boolean
  documentDueSoon: boolean
  flightHourLimits: boolean
}

const storageKey = 'susiair-notification-settings'
const defaults: NotificationSettings = {
  rosterChanges: true,
  documentDueSoon: true,
  flightHourLimits: true,
}

export function useNotifications() {
  const settings = useState<NotificationSettings>('notification-settings', () => ({ ...defaults }))

  function persist() {
    if (import.meta.client) localStorage.setItem(storageKey, JSON.stringify(settings.value))
  }

  onMounted(() => {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Partial<NotificationSettings>
      settings.value = {
        rosterChanges: parsed.rosterChanges ?? defaults.rosterChanges,
        documentDueSoon: parsed.documentDueSoon ?? defaults.documentDueSoon,
        flightHourLimits: parsed.flightHourLimits ?? defaults.flightHourLimits,
      }
    } catch {
      settings.value = { ...defaults }
    }
  })

  watch(settings, persist, { deep: true })

  return { settings }
}
