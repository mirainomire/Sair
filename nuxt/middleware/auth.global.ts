export default defineNuxtRouteMiddleware((to) => {
  const token = useAuthToken(true)
  if (to.path === '/login') {
    if (token.value) return navigateTo('/')
    return
  }
  if (!token.value) return navigateTo('/login')
})
