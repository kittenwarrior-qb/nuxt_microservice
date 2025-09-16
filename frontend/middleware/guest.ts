 import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
 import { useAuthStore } from '../stores/auth'

 export default defineNuxtRouteMiddleware(() => {
   const authStore = useAuthStore()
   
   if (authStore.isAuthenticated) {
     return navigateTo('/dashboard')
   }
 })
