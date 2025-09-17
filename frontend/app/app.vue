<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

useHead({
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: ''
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Helvetica:wght@300;400;500;600;700&display=swap'
    }
  ]
})

onMounted(async () => {
  try {
    await authStore.initAuth()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }
})
</script>

<template>
  <div class="font-helvetica">
    <AppHeader/>
    <NuxtPage />
    <AppFooter/>
  </div>
</template>

<style>
@import '~/assets/css/main.css';

body {
  font-family: 'Helvetica', sans-serif;
  background-color: #F2F4F7;
}
</style>
