<template>
  <header class="bg-[#FFD500] text-black">
    <div
      :class="[
        '',
        isSticky ? 'fixed top-0 left-0 right-0 z-40 shadow-lg' : 'relative',
      ]"
    >
      <!-- Hidden when sticky -->
      <div
        v-show="!isSticky"
        class="text-white text-xs  bg-[#754b01] h-[44px]"
      >
      <div class="max-w-[1200px] mx-auto">
        <img class="w-full" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Banner/da/5c/da5c0c94bd366ce2b9162235b7660b69.png" alt="Banner">
      </div>
      </div>

      <!-- Main Header -->
      <div
        :class="[
          'bg-[#FFD500] max-w-full mx-auto py-2 ',
          isSticky ? 'pb-2' : 'pb-0',
        ]"
      >
        <div class="max-w-[1200px] mx-auto">
          <div class="hidden md:flex justify-between items-center flex-col md:flex-row ">
            <NuxtLink to="/" class="flex-shrink-0">
              <img src="/logo/logo1.png" alt="logo" width="228px" height="40px" class="hidden md:block">
              <img src="/logo/logo3.png" alt="logo" width="30px" height="30px" class="block md:hidden">
            </NuxtLink>

            <div class="flex items-center bg-white rounded-full shadow-sm flex-1 w-full lg:max-w-[415px] h-[40px] px-3 transition-all duration-300">
              <img src="/icons/search_icon.png" width="17" height="17" alt="search">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Bạn tìm gì..."
                class="outline-none h-full bg-transparent flex-1 px-3 placeholder-orange-400 text-sm placeholder:text-sm transition-all duration-300"
                @keyup.enter="handleSearch"
              >
            </div>

            <!-- User Actions -->
            <div class="flex items-center gap-2">
              <NuxtLink
                v-if="!user"
                to="/login"
                class="flex items-center gap-1 cursor-pointer hover:bg-[#ffee99] rounded-full py-2 px-2 transition-all duration-300"
              >
                <img 
                  src="/icons/user_icon.png" 
                  alt="user" 
                  class="w-6 h-6"
                >
                <span
                  class="text-sm hidden md:block transition-all duration-300"
                >
                  Đăng nhập
                </span>
              </NuxtLink>

              <div
                v-else
                class="flex items-center gap-1 cursor-pointer hover:bg-[#ffee99] rounded-full py-2 px-2 transition-all duration-300"
              >
                <img src = "/icons/user_icon.png" width="17" height="17" alt="user" class="w-6 h-6">
                <span
                  v-show="!isSticky"
                  class="text-sm hidden md:block transition-all duration-300"
                >
                  {{ user.username }}
                </span>
              </div>

              <!-- <NuxtLink
                to="/cart"
                class="relative flex items-center gap-1 cursor-pointer hover:bg-[#ffee99] rounded-full py-2 px-2 transition-all duration-300"
              > -->
                <img 
                  src="/icons/cart_icon.png" 
                  alt="cart" 
                  class="w-6 h-6"
                >
                <span
                  class="text-sm hidden md:block transition-all duration-300"
                >
                  Giỏ hàng
                </span>
                <span
                  v-if="cartQuantity > 0"
                  :class="[
                    'absolute bg-red-500 text-white text-xs rounded-full flex items-center justify-center transition-all duration-300',
                  ]"
                >
                  {{ cartQuantity }}
                </span>
              <!-- </NuxtLink> -->
            </div>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <button
                  class="flex items-center gap-1 bg-[#ffe14c] hover:bg-[#FFEE99] rounded-full px-2 h-[42px] lg:w-[300px]"
                  @click="showLocationModal = true"
                >
                  <img src="/icons/location_icon.png" width="17" height="23" alt="location">
                  <p class="text-[14px] translate-y-[2px]">Thành phố Hồ Chí Minh</p>
                </button>
              </div>
            </div>
          </div>

          <div class="block md:hidden">
            <div class="flex justify-between items-center mb-2 gap-3">
              <NuxtLink to="/" class="flex-shrink-0">
                <img src="/logo/logo3.png" alt="logo" width="30px" height="30px">
              </NuxtLink>
              
              <div class="flex items-center gap-2 flex-1">
                <button
                  class="flex items-center gap-1 bg-[#ffe14c] hover:bg-[#FFEE99] rounded-full px-2 h-[32px] w-full"
                  @click="showLocationModal = true"
                >
                  <img src="/icons/location_icon.png" width="14" height="18" alt="location">
                  <p class="text-[12px] truncate">TP.HCM</p>
                </button>
                
                <NuxtLink
                  v-if="!user"
                  to="/login"
                  class="flex items-center gap-1 cursor-pointer hover:bg-[#ffee99] rounded-full py-1 px-2 transition-all duration-300"
                >
                  <img src="/icons/user_icon.png" alt="user" width="20" height="20" class="">
                </NuxtLink>
                
                <div
                  v-else
                  class="flex items-center gap-1 cursor-pointer hover:bg-[#ffee99] rounded-full py-1 px-2 transition-all duration-300"
                >
                  <img src="/icons/user_icon.png" width="20" height="20" alt="user" class="w-5 h-5">
                </div>
              </div>
            </div>
            
            <!-- Search Row: Menu + Search + Cart -->
            <div class="flex items-center gap-2 mb-2">
              <button class="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
                <img src="/icons/menu_icon.png" width="20" height="20" alt="menu">
              </button>
              
              <div class="flex items-center bg-white rounded-full shadow-sm flex-1 h-[40px] px-3">
                <img src="/icons/search_icon.png" width="17" height="17" alt="search">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Bạn tìm gì..."
                  class="outline-none h-full bg-transparent flex-1 px-3 placeholder-orange-400 text-sm placeholder:text-sm"
                  @keyup.enter="handleSearch"
                >
              </div>
              
              <!-- <NuxtLink
                to="/cart"
                class="relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm"
              >
                <img src="/icons/cart_icon.png" alt="cart" class="w-5 h-5">
                <span
                  v-if="cartQuantity > 0"
                  class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                >
                  {{ cartQuantity }}
                </span>
              </NuxtLink> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Hidden when sticky -->
      <nav v-show="!isSticky" class="transition-all duration-300">
        <div class="hidden lg:block max-w-[1210px] mx-auto h-[44px]">
          <div class="flex items-end justify-between">
            <button
              v-for="category in categories"
              :key="category.id"
              class="flex items-center gap-1 rounded-t-xl whitespace-nowrap transition-colors relative mt-[7px] h-[38px] hover:bg-[#FFEE99] px-1"
              @click="toggleCategory(category.id)"
            >
              <img
                :src="category.icon"
                :alt="category.name"
                width="20"
                height="20"
              >
              <span class="text-sm">{{ category.name }}</span>
              <img 
                v-if="category.children" 
                src="/icons/icon_angle-left.png" 
                width="16" 
                height="16" 
                alt="dropdown"
                class="rotate-[-90deg]"
              >

              <div
                v-if="category.children && activeCategory === category.id"
                class="absolute top-full left-0 bg-white shadow-lg rounded-b-lg border border-gray-200 min-w-48 z-50"
              >
                <NuxtLink
                  v-for="child in category.children"
                  :key="child"
                  :to="`/category/${category.id}/${child}`"
                  class="block px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {{ child }}
                </NuxtLink>
              </div>
            </button>
          </div>
        </div>
        
        <div class="block lg:hidden px-4">
          <div class="relative overflow-hidden">
            <div 
              class="flex transition-transform duration-300 ease-in-out"
              :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
            >
              <!-- Slide 1 -->
              <div class="w-full flex-shrink-0 flex justify-between gap-2">
                <button
                  v-for="category in categories.slice(0, 5)"
                  :key="category.id"
                  class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#FFEE99] transition-colors flex-1"
                  @click="toggleCategory(category.id)"
                >
                  <img
                    :src="category.icon"
                    :alt="category.name"
                    width="24"
                    height="24"
                  >
                  <span class="text-xs text-center leading-tight">{{ category.name }}</span>
                </button>
              </div>
              
              <!-- Slide 2 -->
              <div class="w-full flex-shrink-0 flex justify-between gap-2">
                <button
                  v-for="category in categories.slice(5, 10)"
                  :key="category.id"
                  class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#FFEE99] transition-colors flex-1"
                  @click="toggleCategory(category.id)"
                >
                  <img
                    :src="category.icon"
                    :alt="category.name"
                    width="24"
                    height="24"
                  >
                  <span class="text-xs text-center leading-tight">{{ category.name }}</span>
                </button>
              </div>
            </div>
            
            <!-- Carousel Indicators -->
            <div class="flex justify-center gap-2 mt-2">
              <button
                v-for="slide in 2"
                :key="slide"
                class="w-2 h-2 rounded-full transition-colors"
                :class="currentSlide === slide - 1 ? 'bg-orange-500' : 'bg-gray-300'"
                @click="currentSlide = slide - 1"
              />
            </div>
          </div>
        </div>
      </nav>
    </div>

  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const searchQuery = ref("");
const activeCategory = ref<number | null>(null);
const showLocationModal = ref(false);
const cartQuantity = ref(0);
const user = ref<{ username?: string } | null>(null);
const isSticky = ref(false);
const stickyHeaderHeight = ref(0);
const currentSlide = ref(0);


const categories = [
  {
    id: 1,
    name: "Điện thoại",
    icon: "/icons/phone-24x24.png",
  },
  {
    id: 2,
    name: "Laptop",
    icon: "/icons/laptop-24x24.png",
  },
  {
    id: 3,
    name: "Phụ kiện",
    icon: "/icons/accessories-24x24.png",
    children: ["Tai nghe", "Sạc dự phòng", "Ốp lưng", "Cáp sạc"],
  },
  {
    id: 4,
    name: "Smartwatch",
    icon: "/icons/smartwatch-24x24.png",
  },
  {
    id: 5,
    name: "Đồng hồ",
    icon: "/icons/watch-24x24.png",
  },
  {
    id: 6,
    name: "Tablet",
    icon: "/icons/tablet-24x24.png",
  },
  {
    id: 7,
    name: "Máy cũ, Thu cũ",
    icon: "/icons/old-device-24x24.png",
    children: ["iPad", "Samsung Tab", "Xiaomi Pad"],
  },
  {
    id: 8,
    name: "Màn hình, Máy in",
    icon: "/icons/monitor-24x24.png",
    children: ["Màn hình LG", "Màn hình Dell", "Máy in Canon", "Máy in HP"],
  },
  {
    id: 9,
    name: "Sim, Thẻ cào",
    icon: "/icons/sim-24x24.png",
    children: ["Màn hình LG", "Màn hình Dell", "Máy in Canon", "Máy in HP"],
  },
  {
    id: 10,
    name: "Dịch vụ tiện ích",
    icon: "/icons/service-24x24.png",
    children: ["Màn hình LG", "Màn hình Dell", "Máy in Canon", "Máy in HP"],
  },
];

const toggleCategory = (categoryId: number) => {
  activeCategory.value =
    activeCategory.value === categoryId ? null : categoryId;
};

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(searchQuery.value)}`);
  }
};

// const _handleLogout = () => {
//   user.value = null;
// };

const closeDropdowns = () => {
  activeCategory.value = null;
};

// Scroll handler with throttling for performance
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
const handleScroll = () => {
  if (scrollTimeout) return;

  scrollTimeout = setTimeout(() => {
    const scrollY = window.scrollY;
    const threshold = 44; // Scroll threshold in pixels (banner height)

    if (scrollY > threshold && !isSticky.value) {
      isSticky.value = true;
      // Calculate header height for spacer
      const headerElement = document.querySelector("header");
      if (headerElement) {
        stickyHeaderHeight.value = headerElement.offsetHeight;
      }
    } else if (scrollY <= threshold && isSticky.value) {
      isSticky.value = false;
      stickyHeaderHeight.value = 0;
    }

    scrollTimeout = null;
  }, 10); // Throttle to 10ms
};

onMounted(() => {
  document.addEventListener("click", closeDropdowns);
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdowns);
  window.removeEventListener("scroll", handleScroll);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
