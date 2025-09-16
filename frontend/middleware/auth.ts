import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
import { useAuthStore } from '../stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  // If not authenticated yet, try to initialize auth state first
  if (!authStore.isAuthenticated) {
    try {
      await authStore.initAuth()
    } catch {
      // ignore and proceed to redirect check
    }
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
