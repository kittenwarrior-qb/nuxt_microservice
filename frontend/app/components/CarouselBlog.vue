<template>
  <div class="max-w-[1200px] mx-auto my-6 bg-white p-3 rounded-lg">
    <p class="text-[24px] font-bold mb-4">Mạng xã hội thegioididong.com</p>
    
    <div class="relative">
      <div class="overflow-hidden">
        <div 
          class="flex transition-transform duration-300 ease-in-out"
          :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
        >
          <div 
            v-for="(group, idx) in slides" 
            :key="idx"
            class="w-full flex-shrink-0"
          >
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="blog in group"
                :key="blog.id"
                class="rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
                @click="handleBlogClick(blog)"
              >
                <img
                  :src="blog.img"
                  :alt="blog.title"
                  class="w-full h-[150px] object-cover"
                />
                <div class="p-2">
                  <h3 class="text-sm font-semibold line-clamp-2">
                    {{ blog.title }}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- <div class="flex justify-center mt-4 space-x-2">
        <button
          v-for="(_, idx) in slides"
          :key="idx"
          @click="goToSlide(idx)"
          :class="[
            'w-2 h-2 rounded-full transition-colors',
            currentSlide === idx ? 'bg-blue-500' : 'bg-gray-300'
          ]"
        />
      </div> -->
    </div>
    
    <p class="text-center my-3 font-semibold text-blue-500 cursor-pointer hover:underline">
      Xem thêm sản phẩm
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface BlogItem {
  id: number
  title: string
  img: string
}

const currentSlide = ref(0)
let autoplayInterval: NodeJS.Timeout | null = null

const fakeBlogs: BlogItem[] = [
  { 
    id: 1, 
    title: "Những nâng cấp đáng tiền của Galaxy A17 5G nếu so với Galaxy A16 5G là gì?", 
    img: "https://cdnv2.tgdd.vn/mwg-static/tgdd/News/Thumb/1581939/galaxy-a17-5g-26-T638914542921249029.jpg" 
  },
  { 
    id: 2, 
    title: "Bảng giá thay camera iPhone chính hãng uy tín giá tốt mới nhất 2025", 
    img: "https://cdnv2.tgdd.vn/mwg-static/common/Common/bang-gia-thay-camera-iphone-thumb1.jpg" 
  },
  { 
    id: 3, 
    title: "Trên tay nhanh Google Pixel 10 series: Thiết kế cũ, cải tiến mạnh AI, đều dùng chip Tensor G5", 
    img: "https://cdnv2.tgdd.vn/mwg-static/common/News/pixel-10-series-t638913814156700064.jpg" 
  },
  { 
    id: 4, 
    title: "Bảng giá sửa chữa MacBook chính hãng Apple uy tín mới nhất 2025", 
    img: "https://cdnv2.tgdd.vn/mwg-static/common/Common/bang-gia-sua-chua-macbook-thumb1.jpg" 
  },
]

const chunkArray = (arr: BlogItem[], size: number): BlogItem[][] => {
  const result: BlogItem[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

const slides = computed(() => chunkArray(fakeBlogs, 4))

// const goToSlide = (index: number) => {
//   currentSlide.value = index
// }

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
}

const handleBlogClick = (blog: BlogItem) => {
  console.log('Clicked blog:', blog)
  // Handle blog click - navigate to blog detail page
  // Example: navigateTo(`/blog/${blog.id}`)
}

const startAutoplay = () => {
  autoplayInterval = setInterval(() => {
    nextSlide()
  }, 3000) // Change slide every 3 seconds
}

const stopAutoplay = () => {
  if (autoplayInterval) {
    clearInterval(autoplayInterval)
    autoplayInterval = null
  }
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>
