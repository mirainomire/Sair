export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('susiair_token')
  if (to.path === '/login') {
    if (token.value) return navigateTo('/')
    return
  }
  if (!token.value) return navigateTo('/login')
})
