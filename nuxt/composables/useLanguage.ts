export type AppLanguage = 'en' | 'id'

const storageKey = 'susiair-language'

export function useLanguage() {
  const language = useState<AppLanguage>('app-language', () => 'en')

  function apply() {
    if (!import.meta.client) return
    document.documentElement.lang = language.value
    localStorage.setItem(storageKey, language.value)
  }

  onMounted(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved === 'en' || saved === 'id') language.value = saved
    apply()
  })

  watch(language, apply)

  return { language }
}
