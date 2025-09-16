<template>
  <div class="max-w-[1200px] mx-auto my-6 bg-white p-4 rounded-lg">
    <p class="text-[24px] font-bold mb-4">Mọi người cũng tìm kiếm</p>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="(tag, index) in tags"
        :key="index"
        class="px-3 py-1 text-sm bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
        @click="handleTagClick(tag)"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const tags = [
  "iPhone 16", "Samsung S24", "Oppo Reno11", "Xiaomi 14", "MacBook Air", 
  "MacBook Pro", "Laptop Gaming", "Dell XPS", "Asus ROG", "HP Pavilion",
  "AirPods Pro", "Sony WH-1000XM5", "Loa Bluetooth", "iPad Pro", "iPad Air",
  "Apple Watch", "Samsung Watch", "Máy ảnh Canon", "Máy ảnh Sony", "GoPro Hero",
  "Máy in Canon", "Máy in HP", "Ổ cứng SSD", "Ổ cứng HDD", "USB 64GB",
  "Chuột Logitech", "Bàn phím cơ", "Tai nghe Gaming", "Ghế công thái học", "Màn hình 4K",
  "iPhone 16", "Samsung S24", "Oppo Reno11", "Xiaomi 14", "MacBook Air", 
  "MacBook Pro", "Laptop Gaming",
  "Dell XPS", "Asus ROG", "HP Pavilion",
  "AirPods Pro", "Sony WH-1000XM5", "Loa Bluetooth", "iPad Pro", "iPad Air"
]

const handleTagClick = (tag: string) => {
  // Handle tag click - you can emit an event or navigate to search results
  console.log('Clicked tag:', tag)
  // Example: navigateTo(`/search?q=${encodeURIComponent(tag)}`)
}
</script>

<style scoped>
/* Add any component-specific styles here if needed */
</style>