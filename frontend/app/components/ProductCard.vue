<template>
  <NuxtLink :to="`/detail/${product.id}`" class="block">
    <div class="relative rounded-lg border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-200">
      <div class="relative">
        <img
          :alt="product.name || ''"
          :src="product.img || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6wXPiBTvb6il38hh8Iilsswkc7P1pHx0m4g&s'"
          class="h-[180px] w-full object-contain p-2 hover:translate-y-[-5px] transition-transform duration-200"
        />

        <div class="absolute top-2 left-2 flex gap-2">
          <span v-if="showNewTag" class="bg-red-500 text-white text-xs px-2 py-1 rounded">
            Mẫu mới
          </span>
          <span v-if="product.isLoan" class="bg-blue-500 text-white text-xs px-2 py-1 rounded">
            Trả góp 0%
          </span>
        </div>
      </div>

      <div class="p-4">
        <h3 class="line-clamp-2 font-medium text-sm mb-2">{{ product.name }}</h3>
        
        <div class="space-y-1">
          <p class="font-bold text-[18px] text-[#dd2f2c]">
            {{ formatPrice(product.price) }}
          </p>

          <div v-if="(product.priceOld || product.price_old) && product.percent" class="flex items-center gap-2">
            <p class="line-through text-gray-400 text-sm">
              {{ formatPrice(product.priceOld || product.price_old || '') }}
            </p>
            <p class="text-[#dd2f2c]">({{ product.percent }})</p>
          </div>

          <p v-if="product.rating && product.sold" class="text-sm text-gray-500 flex items-center gap-1">
            <span class="text-yellow-400">★</span> {{ product.rating }} {{ product.sold }}
          </p>
        </div>

        <div v-if="product.tags?.length" class="mt-2 flex flex-wrap gap-1">
          <span v-for="(t, i) in product.tags.slice(0, 4)" :key="i" class="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded">
            {{ t }}
          </span>
        </div>

        <div class="mt-2 flex flex-wrap gap-1">
          <span v-if="isOnline" class="bg-purple-500 text-white text-xs px-2 py-1 rounded">
            Chỉ bán online
          </span>
          <span v-if="product.tags?.includes('exclusive')" class="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
            Độc quyền
          </span>
        </div>

        <div v-if="flashSaleData" class="mt-3 space-y-2">
          <div class="flex items-center gap-2 relative">
            <span class="text-xl absolute left-[-10px] top-[-2px] z-10">🔥</span>
            <div class="relative flex-1">
              <div class="w-full bg-gray-200 rounded-md h-[25px] overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-[#ffbe27] to-[#ff6b35] rounded-md transition-all duration-300"
                  :style="{ width: `${flashSalePercent}%` }"
                ></div>
                <span class="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  Còn {{ flashSaleData.remaining }}/{{ flashSaleData.total }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Product } from '~/types/product'

interface Props {
  product: Product
}

const props = defineProps<Props>()

const parseFlashSale = (str?: string) => {
  if (!str) return null
  const match = str.match(/(\d+)\s*\/\s*(\d+)/)
  if (match && match[1] && match[2]) {
    const remaining = parseInt(match[1], 10)
    const total = parseInt(match[2], 10)
    return { remaining, total }
  }
  return null
}

const showNewTag = computed(() => !!(props.product.isNew || props.product.is_new || props.product.isUpcoming || props.product.is_upcoming))

const isOnline = computed(() => !!(props.product.isOnline || props.product.is_online))

const formatPrice = (price: string | number | undefined) => {
  if (!price) return ''
  
  let numPrice: number = 0
  if (typeof price === 'string') {
    // Remove currency symbols and spaces first
    let cleanPrice = price.replace(/[đ₫\s]/g, '')
    
    // Check if the string contains dots (Vietnamese thousand separators)
    if (cleanPrice.includes('.')) {
      // Count dots to determine format
      const dotCount = (cleanPrice.match(/\./g) || []).length
      
      if (dotCount >= 2) {
        // Multiple dots = Vietnamese format (e.g., "20.190.000")
        cleanPrice = cleanPrice.replace(/\./g, '')
        numPrice = parseInt(cleanPrice, 10)
      } else {
        // Single dot might be decimal point, check position
        const parts = cleanPrice.split('.')
        if (parts[1] && parts[1].length <= 2) {
          // Likely decimal (e.g., "20.50")
          numPrice = parseFloat(cleanPrice)
        } else {
          // Likely thousand separator (e.g., "20.190")
          cleanPrice = cleanPrice.replace(/\./g, '')
          numPrice = parseInt(cleanPrice, 10)
        }
      }
    } else {
      // No dots, remove commas and parse
      cleanPrice = cleanPrice.replace(/,/g, '')
      numPrice = parseInt(cleanPrice, 10)
    }
  } else {
    numPrice = price
  }
  
  return isNaN(numPrice) ? String(price) : numPrice.toLocaleString('vi-VN') + 'đ'
}

const flashSaleData = computed(() => {
  const raw = (props.product.flashSaleCount ?? props.product.flash_sale_count) as string | null | undefined
  if (typeof raw === 'string') return parseFlashSale(raw)
  return null
})

const flashSalePercent = computed(() => {
  if (flashSaleData.value && flashSaleData.value.total > 0) {
    return Math.min(
      100,
      Math.round((flashSaleData.value.remaining / flashSaleData.value.total) * 100)
    )
  }
  return null
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
