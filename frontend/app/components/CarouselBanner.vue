<template>
  <div class="max-w-[1200px] mx-auto my-4 rounded-lg overflow-hidden">
    <div class="relative">
      <!-- Carousel container -->
      <div 
        class="flex transition-transform duration-500 ease-in-out"
        :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
      >
        <div 
          v-for="(group, idx) in slides" 
          :key="idx" 
          class="w-full flex-shrink-0"
        >
          <div class="flex gap-4 w-full">
            <img
              v-for="(img, j) in group"
              :key="j"
              :src="img"
              :alt="`banner-${idx}-${j}`"
              :class="[
                'w-1/2 h-[200px] md:h-[200px] object-cover',
                j === 0 ? 'rounded-l-lg' : '',
                j === group.length - 1 ? 'rounded-r-lg' : ''
              ]"
            />
          </div>
        </div>
      </div>

      <!-- Navigation arrows -->
      <button
        @click="prevSlide"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
      >
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      
      <button
        @click="nextSlide"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
      >
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>

      <!-- Dots indicator -->
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <button
          v-for="(slide, idx) in slides"
          :key="idx"
          @click="goToSlide(idx)"
          :class="[
            'w-3 h-3 rounded-full transition-all duration-200',
            currentSlide === idx ? 'bg-white' : 'bg-white/50'
          ]"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// Import banner images
import Banner1 from '/banner/banner1.png'
import Banner2 from '/banner/banner2.png'
import Banner3 from '/banner/banner3.png'
import Banner4 from '/banner/banner4.png'
import Banner5 from '/banner/banner5.png'

const images = [Banner1, Banner2, Banner3, Banner4, Banner5, Banner1, Banner2, Banner3, Banner4, Banner5]

const chunkArray = (arr: string[], size: number): string[][] => {
  const result: string[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

const slides = chunkArray(images, 2)
const currentSlide = ref(0)
let autoplayInterval: NodeJS.Timeout | null = null

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

const prevSlide = () => {
  currentSlide.value = currentSlide.value === 0 ? slides.length - 1 : currentSlide.value - 1
}

const goToSlide = (index: number) => {
  currentSlide.value = index
}

const stopAutoplay = () => {
  if (autoplayInterval) {
    clearInterval(autoplayInterval)
    autoplayInterval = null
  }
}

onUnmounted(() => {
  stopAutoplay()
})
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
