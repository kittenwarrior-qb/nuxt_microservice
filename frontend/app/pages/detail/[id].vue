<template>
  <div class="max-w-[1200px] mx-auto pt-5 px-4">
    <!-- Loading state -->
    <div v-if="pending" class="p-6 text-center">Đang tải...</div>
    
    <!-- Error state -->
    <div v-else-if="error" class="p-6 text-center text-red-600">
      Không tìm thấy sản phẩm
    </div>

    <!-- Product detail -->
    <div v-else-if="product">
      <!-- Breadcrumb -->
      <nav class="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <NuxtLink to="/" class="hover:text-blue-600">Trang chủ</NuxtLink>
        <span>></span>
        <span>{{ product.brand }}</span>
        <span>></span>
        <span class="text-gray-900">{{ product.name }}</span>
      </nav>

      <div class="flex flex-col md:flex-row gap-6 mt-3">
        <!-- Product Image -->
        <div class="w-full md:w-1/2">
          <div class="rounded-lg overflow-hidden bg-white border">
            <img
              :src="product.img"
              :alt="product.name || 'product'"
              class="w-full h-auto object-contain p-4"
            />
          </div>
        </div>

        <!-- Product Info -->
        <div class="flex-1 space-y-4">
          <h1 class="text-2xl font-semibold">{{ product.name }}</h1>

          <!-- Rating -->
          <div v-if="product.rating" class="flex items-center gap-2">
            <div class="flex items-center">
              <span class="text-yellow-400 text-lg">★</span>
              <span class="ml-1 text-sm">{{ product.rating }}</span>
            </div>
            <span v-if="product.sold" class="text-sm text-gray-500">
              ({{ product.sold }} đánh giá)
            </span>
          </div>

          <!-- Price -->
          <div class="flex items-center gap-3">
            <span class="text-2xl font-bold text-red-600">
              {{ formatPrice(product.price) }}
            </span>
            <span v-if="product.price_old || product.priceOld" class="line-through text-gray-500">
              {{ formatPrice(product.price_old || product.priceOld || '') }}
            </span>
            <span v-if="product.percent" class="text-green-600 font-medium">
              {{ product.percent }}
            </span>
          </div>

          <!-- Product Details -->
          <div class="space-y-2">
            <p class="text-gray-700">
              <strong>Hãng:</strong> {{ product.brand }}
            </p>
            <p class="text-gray-700">
              <strong>Danh mục:</strong> {{ product.category }}
            </p>
          </div>

          <!-- Tags -->
          <div v-if="product.tags?.length" class="flex flex-wrap gap-2">
            <span
              v-for="(tag, index) in product.tags"
              :key="index"
              class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Product Features -->
          <div class="flex flex-wrap gap-2">
            <span v-if="product.is_new || product.isNew" class="bg-red-500 text-white text-xs px-2 py-1 rounded">
              Mẫu mới
            </span>
            <span v-if="product.is_loan || product.isLoan" class="bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Trả góp 0%
            </span>
            <span v-if="product.is_online || product.isOnline" class="bg-purple-500 text-white text-xs px-2 py-1 rounded">
              Chỉ bán online
            </span>
            <span v-if="product.is_flash_sale || product.isFlashSale" class="bg-orange-500 text-white text-xs px-2 py-1 rounded">
              Flash Sale
            </span>
          </div>

          <!-- Flash Sale Info -->
          <div v-if="product.flash_sale_count" class="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔥</span>
              <span class="text-sm font-medium text-orange-700">
                {{ product.flash_sale_count }}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 mt-6">
            <button
              @click="handleAddToCart"
              class="px-6 py-3 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
              :disabled="isAddingToCart"
            >
              {{ isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ' }}
            </button>
            <button
              @click="handleBuyNow"
              class="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              :disabled="isAddingToCart"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/product'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const productId = computed(() => Number(route.params.id))
const isAddingToCart = ref(false)

// Fetch product data
const config = useRuntimeConfig()
const { data: product, pending, error } = await useFetch<Product>(`${config.public.apiBaseUrl}/products/${productId.value}`)

// Format price helper
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

// Add to cart handler
const handleAddToCart = async () => {
  if (!product.value || isAddingToCart.value) return
  
  isAddingToCart.value = true
  
  try {
    cartStore.addItem({
      id: Number(product.value.id),
      name: product.value.name || '',
      price: product.value.price || '0',
      priceOld: product.value.price_old || product.value.priceOld,
      img: product.value.img || ''
    })
    
    // Show success notification
    await nextTick()
    alert('Đã thêm vào giỏ hàng!')
  } catch (error) {
    console.error('Error adding to cart:', error)
    alert('Có lỗi xảy ra khi thêm vào giỏ hàng')
  } finally {
    isAddingToCart.value = false
  }
}

// Buy now handler
const handleBuyNow = async () => {
  if (!product.value || isAddingToCart.value) return
  
  isAddingToCart.value = true
  
  try {
    cartStore.addItem({
      id: Number(product.value.id),
      name: product.value.name || '',
      price: product.value.price || '0',
      priceOld: product.value.price_old || product.value.priceOld,
      img: product.value.img || ''
    })
    
    await nextTick()
    await router.push('/cart')
  } catch (error) {
    console.error('Error in buy now:', error)
    alert('Có lỗi xảy ra')
  } finally {
    isAddingToCart.value = false
  }
}

// Set page meta
useHead({
  title: computed(() => product.value?.name ? `${product.value.name} - Thế Giới Di Động` : 'Chi tiết sản phẩm - Thế Giới Di Động'),
  meta: [
    { name: 'description', content: computed(() => product.value?.name || 'Chi tiết sản phẩm') }
  ]
})

// Handle 404
if (error && !pending) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Không tìm thấy sản phẩm'
  })
}
</script>
