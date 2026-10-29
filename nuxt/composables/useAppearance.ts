/**
 * Owns user-facing display preferences. The document attributes are used by
 * global SCSS, while useState keeps controls reactive across route changes.
 */
export type AppearanceTheme = 'light' | 'dark'
export type AppearanceTextSize = 'small' | 'normal' | 'large'

const themeKey = 'susiair-theme'
const textSizeKey = 'susiair-text-size'

export function useAppearance() {
  const theme = useState<AppearanceTheme>('appearance-theme', () => 'light')
  const textSize = useState<AppearanceTextSize>('appearance-text-size', () => 'normal')

  function apply() {
    if (!import.meta.client) return
    document.documentElement.dataset.theme = theme.value
    document.documentElement.dataset.textSize = textSize.value
    localStorage.setItem(themeKey, theme.value)
    localStorage.setItem(textSizeKey, textSize.value)
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem(themeKey)
    const savedTextSize = localStorage.getItem(textSizeKey)
    if (savedTheme === 'light' || savedTheme === 'dark') theme.value = savedTheme
    if (savedTextSize === 'small' || savedTextSize === 'normal' || savedTextSize === 'large') textSize.value = savedTextSize
    apply()
  })

  watch([theme, textSize], apply)

  return { theme, textSize }
}
