<template>
  <div class="mt-10 max-w-[1200px] mx-auto">
    <h2 class="text-[24px] font-bold mb-4">{{ title }}</h2>
  </div>
    
  <div class="bg-white rounded-2xl max-w-[1200px] mx-auto mt-5" >
    <div class="">
      
      <div v-if="tab" class="bg-white mb-2  rounded-2xl overflow-hidden">
        <div class="flex justify-between overflow-x-auto pb-2 rounded-2xl">
          <button
            v-for="category in TAB_CATEGORIES"
            :key="category.key"
            @click="setActiveKey(category.key)"
            :class="[
              ' whitespace-nowrap transition-colors duration-200 flex items-center justify-center w-full h-[60px] relative',
              activeKey === category.key
                ? 'bg-[#FFF6E3]'
                : ''
            ]"
            :style="activeKey === category.key ? 'box-shadow: inset 0 -2px 0 0 #F79009;' : ''"
          >
            <img 
              v-if="category.img" 
              :src="category.img" 
              :alt="category.name"
              class="h-[38px] w-auto object-contain"
            />
            <span v-else class="text-[14px]">{{ category.name }}</span>
          </button>
        </div>
      </div>

      <div v-if="loading[currentKey]" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <div v-else class="space-y-4">
        <img
          v-if="currentBanner && tab"
          :src="currentBanner"
          class="w-full rounded-lg object-cover p-4 !py-0"
          alt="banner"
        />

        <div v-if="img" class="grid grid-cols-1 md:grid-cols-6 gap-4 p-4">
          <div class="md:col-span-2 flex items-center justify-center">
            <img
              :src="img"
              class="w-full h-full object-cover rounded-lg"
              alt="category"
            />
          </div>

          <div class="md:col-span-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            <ProductCard
              v-for="product in currentProducts.slice(0, 4)"
              :key="product.id"
              :product="product"
            />
          </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
          <ProductCard
            v-for="product in currentProducts.slice(0, 12)"
            :key="product.id"
            :product="product"
          />
        </div>
        <div v-if="!img" class="flex items-center gap-2 justify-center pt-5 pb-7 font-semibold">
          <p class="text-[14px] text-[#2a83e9] text-center">Xem thêm Điện Thoại</p>
          <img src="/icons/icon_angle-left.png" alt="arrow" class="w-4 h-4 rotate-180">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Product } from '~/types/product'
import ProductCard from './ProductCard.vue'
import FlashSaleBanner from '/banner/flashsale.png'

interface Props {
  title: string
  tab?: boolean
  tabKey?: string
  img?: string
}

const props = withDefaults(defineProps<Props>(), {
  tab: true,
  tabKey: 'flashsale',
  img: undefined
})

const TAB_CATEGORIES = [
  {
    key: "flashsale",
    name: "FlashSale",
    img: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/53/d3/53d33414879decc07afd80aedbb6a8e1.png",
    banner: FlashSaleBanner,
  },
  {
    key: "Laptop",
    name: "Laptop",
    img: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/7a/e0/7ae0723d3d978fd4c8a2c77f3bf4bd3a.png",
    banner: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/58/36/5836998ed7813e01f563ed338b3842ed.png",
  },
  {
    key: "Điện thoại",
    name: "Điện thoại",
    banner: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/c8/b7/c8b756baf5f990d065abf3acd1de19f6.png",
  },
  {
    key: "Apple",
    name: "Apple",
    banner: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/5e/79/5e79ee941f32f645f8cb6c3a3147c45b.png",
  },
  {
    key: "AirTag, Vỏ bảo vệ AirTag",
    name: "Laptop",
    banner: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/9d/bd/9dbd33690ceee67cf301f0591c8de17c.png",
  },
  {
    key: "Phụ kiện tablet",
    name: "Phụ kiện",
    banner: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/58/36/5836998ed7813e01f563ed338b3842ed.png",
  },
  {
    key: "Đồng hồ thông minh",
    name: "Đồng hồ",
    banner: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/5b/3a/5b3ab025173bb4b0b90dbd6fd5bbd400.png",
  },
  {
    key: "Máy in",
    name: "PC, Máy in",
    banner: "https://cdnv2.tgdd.vn/mwg-static/common/Campaign/5e/79/5e79ee941f32f645f8cb6c3a3147c45b.png",
  },
]

const activeKey = ref(props.tabKey || 'flashsale')
const products = ref<Record<string, Product[]>>({})
const loading = ref<Record<string, boolean>>({})

const currentKey = computed(() => props.tab ? activeKey.value : (props.tabKey || 'flashsale'))
const currentProducts = computed(() => products.value[currentKey.value] || [])
const currentBanner = computed(() => {
  const category = TAB_CATEGORIES.find(cat => cat.key === currentKey.value)
  return category?.banner
})

const setActiveKey = (key: string) => {
  activeKey.value = key
}

const fetchProducts = async (key: string) => {
  if (products.value[key]) return

  loading.value = { ...loading.value, [key]: true }
  try {
    console.log('Fetching products for key:', key)
    const { getProductsByKey } = useApi()
    const prods = await getProductsByKey(key)
    console.log('Received products:', prods)
    products.value = { ...products.value, [key]: prods }
  } catch (error) {
    console.error('Error fetching products:', error)
    products.value = { ...products.value, [key]: [] }
  } finally {
    loading.value = { ...loading.value, [key]: false }
  }
}

watch(activeKey, (newKey) => {
  if (props.tab) {
    fetchProducts(newKey)
  }
}, { immediate: false })

onMounted(() => {
  if (props.tab) {
    fetchProducts(activeKey.value)
  } else if (props.tabKey) {
    fetchProducts(props.tabKey)
  }
})
</script>

<style scoped>
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
