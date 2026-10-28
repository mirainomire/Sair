export default defineNuxtConfig({
  compatibilityDate: '2026-10-27',
  devtools: { enabled: false },
  ssr: true,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/scss/main.scss'],
  runtimeConfig: {
    apiBaseServer: 'http://localhost:3001/api',
    public: {
      apiBase: 'http://localhost:3001/api',
    },
  },
  app: {
    head: {
      title: 'Susi Air',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'Susi Air pilot portal for schedules, documents, and flight hours.',
        },
        { name: 'theme-color', content: '#0E2138' },
        { name: 'robots', content: 'noindex' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Susi Air' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/brand/logo.png' },
        { rel: 'apple-touch-icon', href: '/brand/logo.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
    pageTransition: { name: 'soft' },
    layoutTransition: { name: 'layout' },
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
})
