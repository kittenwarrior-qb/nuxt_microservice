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
        class="text-white text-xs  bg-[#FFD400] h-[44px]"
      >
      <div class="max-w-[1200px] mx-auto">
        <img class="w-full" src="//cdnv2.tgdd.vn/mwg-static/tgdd/Banner/b4/59/b45940d7746f137d6b2dfd2268f02607.png" alt="Banner">
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

            <div class="flex items-center bg-white rounded-full shadow-sm flex-1 w-full lg:max-w-[415px] h-[40px] px-3 transition-all duration-300 relative">
              <img src="/icons/search_icon.png" width="17" height="17" alt="search">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Bạn tìm gì..."
                class="outline-none h-full bg-transparent flex-1 px-3 placeholder-orange-400 text-sm placeholder:text-sm transition-all duration-300"
                @input="onSearchInput"
                @keyup.enter="handleEnterKey"
                @keydown.down.prevent="moveHighlight(1)"
                @keydown.up.prevent="moveHighlight(-1)"
              >
              <!-- Suggestions Dropdown (Desktop) -->
              <div
                v-if="showSuggestions && suggestions.length > 0"
                class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-auto"
              >
                <ul>
                  <li
                    v-for="(item, idx) in suggestions"
                    :key="item.id ?? item.name + idx"
                    @mousedown.prevent="selectSuggestion(item)"
                    :class="[
                      'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50',
                      highlightedIndex === idx ? 'bg-gray-100' : ''
                    ]"
                  >
                    <img v-if="item.img" :src="item.img" alt="thumb" class="w-8 h-8 object-cover rounded" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm truncate">{{ item.name }}</p>
                      <p v-if="item.brand || item.category" class="text-xs text-gray-500 truncate">
                        {{ [item.brand, item.category].filter(Boolean).join(' • ') }}
                      </p>
                    </div>
                    <span v-if="item.price" class="text-xs text-gray-600 whitespace-nowrap">{{ item.price }}</span>
                  </li>
                </ul>
                <button
                  class="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 border-t"
                  @mousedown.prevent="goToFullSearch"
                >
                  Xem tất cả kết quả cho "{{ searchQuery }}"
                </button>
              </div>
            </div>

            <!-- User Actions -->
            <div class="flex items-center gap-2">
              <NuxtLink
                v-if="!isAuthenticated"
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
                class="relative flex items-center gap-2 rounded-full py-2 px-2 transition-all duration-300"
              >
                <!-- Toggle user menu from icon; username hidden when sticky -->
                <button
                  class="flex items-center gap-2 hover:bg-[#ffee99] rounded-full py-1 px-2"
                  @click.stop="userMenuOpen = !userMenuOpen"
                >
                  <img src="/icons/user_icon.png" width="17" height="17" alt="user" class="w-6 h-6">
                  <span
                    class="text-sm hidden md:block transition-all duration-300"
                  >
                    {{ displayName }}
                  </span>
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                  @click.stop
                >
                  <div class="px-3 py-2 text-sm text-gray-700 border-b border-gray-100 truncate">
                    {{ displayName }}
                  </div>
                  <button
                    class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    @click="handleLogout"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>

              <NuxtLink
                to="/cart"
                class="relative flex items-center gap-1 cursor-pointer hover:bg-[#ffee99] rounded-full py-2 px-2 transition-all duration-300"
              >
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
                    'absolute left-[14px] top-[-9] px-1 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center transition-all duration-300',
                  ]"
                >
                  {{ cartQuantity }}
                </span>
              </NuxtLink>
            </div>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <LocationSelector />
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
                  v-if="!isAuthenticated"
                  to="/login"
                  class="flex items-center gap-1 cursor-pointer hover:bg-[#ffee99] rounded-full py-1 px-2 transition-all duration-300"
                >
                  <img src="/icons/user_icon.png" alt="user" width="20" height="20" class="">
                </NuxtLink>
                
                <div
                  v-else
                  class="flex items-center gap-2 hover:bg-[#ffee99] rounded-full py-1 px-2 transition-all duration-300"
                >
                  <img src="/icons/user_icon.png" width="20" height="20" alt="user" class="w-5 h-5">
                  <button
                    class="text-xs text-blue-700 hover:underline"
                    @click="handleLogout"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Search Row: Menu + Search + Cart -->
            <div class="flex items-center gap-2 mb-2">
              <button class="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
                <img src="/icons/menu_icon.png" width="20" height="20" alt="menu">
              </button>
              
              <div class="flex items-center bg-white rounded-full shadow-sm flex-1 h-[40px] px-3 relative">
                <img src="/icons/search_icon.png" width="17" height="17" alt="search">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Bạn tìm gì..."
                  class="outline-none h-full bg-transparent flex-1 px-3 placeholder-orange-400 text-sm placeholder:text-sm"
                  @input="onSearchInput"
                  @keyup.enter="handleEnterKey"
                  @keydown.down.prevent="moveHighlight(1)"
                  @keydown.up.prevent="moveHighlight(-1)"
                >
                <!-- Suggestions Dropdown (Mobile) -->
                <div
                  v-if="showSuggestions && suggestions.length > 0"
                  class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-auto"
                >
                  <ul>
                    <li
                      v-for="(item, idx) in suggestions"
                      :key="item.id ?? item.name + idx"
                      @mousedown.prevent="selectSuggestion(item)"
                      :class="[
                        'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50',
                        highlightedIndex === idx ? 'bg-gray-100' : ''
                      ]"
                    >
                      <img v-if="item.img" :src="item.img" alt="thumb" class="w-8 h-8 object-cover rounded" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm truncate">{{ item.name }}</p>
                        <p v-if="item.brand || item.category" class="text-xs text-gray-500 truncate">
                          {{ [item.brand, item.category].filter(Boolean).join(' • ') }}
                        </p>
                      </div>
                      <span v-if="item.price" class="text-xs text-gray-600 whitespace-nowrap">{{ item.price }}</span>
                    </li>
                  </ul>
                  <button
                    class="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 border-t"
                    @mousedown.prevent="goToFullSearch"
                  >
                    Xem tất cả kết quả cho "{{ searchQuery }}"
                  </button>
                </div>
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
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from "../stores/auth";
import { storeToRefs } from 'pinia'
import { ApiService } from '../services/api'

const authStore = useAuthStore()
const { isAuthenticated, userDisplayName } = storeToRefs(authStore)

const searchQuery = ref("");
// Suggestion state
type SuggestItem = { id?: string | number; name: string; price?: string; brand?: string; category?: string; img?: string }
const suggestions = ref<SuggestItem[]>([])
const showSuggestions = ref(false)
const highlightedIndex = ref(-1)
let suggestTimeout: ReturnType<typeof setTimeout> | null = null
const api = new ApiService()
const activeCategory = ref<number | null>(null);
const showLocationModal = ref(false);
const cartStore = useCartStore();
const cartQuantity = computed(() => cartStore.totalQuantity);
const displayName = computed(() => userDisplayName.value)
const isSticky = ref(false);
const stickyHeaderHeight = ref(0);
const currentSlide = ref(0);
const userMenuOpen = ref(false);


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

const fetchSuggestions = async () => {
  const q = searchQuery.value.trim()
  if (!q) {
    suggestions.value = []
    showSuggestions.value = false
    highlightedIndex.value = -1
    return
  }
  try {
    const data = await api.suggestProducts(q, 8)
    suggestions.value = data
    showSuggestions.value = data.length > 0
    highlightedIndex.value = data.length > 0 ? 0 : -1
  } catch (e) {
    console.error('Failed to fetch suggestions', e)
    suggestions.value = []
    showSuggestions.value = false
    highlightedIndex.value = -1
  }
}

const onSearchInput = () => {
  if (suggestTimeout) clearTimeout(suggestTimeout)
  suggestTimeout = setTimeout(fetchSuggestions, 250)
}

const moveHighlight = (delta: number) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return
  const len = suggestions.value.length
  highlightedIndex.value = (highlightedIndex.value + delta + len) % len
}

const selectSuggestion = (item: SuggestItem) => {
  showSuggestions.value = false
  if (item?.id != null) {
    navigateTo(`/detail/${item.id}`)
  } else if (item?.name) {
    navigateTo(`/search?q=${encodeURIComponent(item.name)}`)
  }
}

const goToFullSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return
  showSuggestions.value = false
  navigateTo(`/search?q=${encodeURIComponent(q)}`)
}

const handleEnterKey = () => {
  if (showSuggestions.value && highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
    const item = suggestions.value[highlightedIndex.value]
    if (!item) return
    selectSuggestion(item)
  } else {
    goToFullSearch()
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    await navigateTo('/login')
  } catch {
    // no-op; errors are handled in the store
  }
}

const closeDropdowns = () => {
  activeCategory.value = null;
  userMenuOpen.value = false;
  showSuggestions.value = false;
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
  // Initialize cart store to load data from localStorage
  cartStore.initializeCart();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdowns);
  window.removeEventListener("scroll", handleScroll);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  if (suggestTimeout) {
    clearTimeout(suggestTimeout)
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
