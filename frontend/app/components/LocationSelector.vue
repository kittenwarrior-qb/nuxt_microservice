<template>
  <div>
    <!-- Location Button -->
    <button
      @click="openModal"
      class="flex items-center gap-2 bg-[#ffe14c] hover:bg-[#FFEE99] rounded-full px-2 h-[42px] lg:w-[300px] transition-colors"
    >
      <img src="/icons/location_icon.png" alt="Location" class="w-[17px] h-[20px]">
      <p class="text-[14px] translate-y-[2px] truncate max-w-[200px]">
        {{ displayText }}
      </p>
    </button>

    <!-- Modal -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click="closeModal"
    >
      <div
        @click.stop
        class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">Chọn địa chỉ nhận hàng</h2>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <!-- Current Selection Display -->
          <div class="p-3 rounded-md bg-gray-100">
            <p class="text-sm text-gray-500">Địa chỉ đang chọn:</p>
            <p class="font-semibold text-gray-800">
              {{ currentAddressDisplay }}
            </p>
          </div>

          <!-- Address Search -->
          <div>
            <label class="text-sm font-medium mb-1 block">
              Nhập địa chỉ cụ thể
            </label>
            <div class="relative">
              <input
                v-model="searchValue"
                @input="handleSearch"
                type="text"
                placeholder="Nhập địa chỉ để tìm kiếm..."
                class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <!-- Search Results Dropdown -->
              <div
                v-if="searchOptions.length > 0"
                class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10 max-h-48 overflow-y-auto"
              >
                <div
                  v-for="option in searchOptions"
                  :key="option.value"
                  @click="selectAddress(option)"
                  class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  {{ option.value }}
                </div>
              </div>
            </div>
          </div>

          <!-- Province/Ward Selection -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Province Select -->
            <div>
              <label class="text-sm font-medium mb-1 block">
                Tỉnh/Thành phố
              </label>
              <select
                v-model="selectedProvince"
                @change="handleProvinceChange"
                class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn tỉnh/thành phố</option>
                <option
                  v-for="province in provinces"
                  :key="province.code"
                  :value="province.code"
                >
                  {{ province.name }}
                </option>
              </select>
            </div>

            <!-- Ward Select -->
            <div>
              <label class="text-sm font-medium mb-1 block">
                Quận/Huyện/Phường/Xã
              </label>
              <select
                v-model="selectedWard"
                :disabled="!selectedProvince"
                class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Chọn quận/huyện/phường/xã</option>
                <option
                  v-for="ward in sortedWards"
                  :key="ward.code"
                  :value="ward.code"
                >
                  {{ ward.name }} ({{ ward.division_type }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            @click="closeModal"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            @click="confirmSelection"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Interfaces
interface Province {
  code: number
  codename: string
  division_type: string
  name: string
  phone_code: number
}

interface Ward {
  code: number
  codename: string
  division_type: string
  name: string
  province_code: number
}

interface SearchOption {
  value: string
  lat: string
  lon: string
  address?: {
    street?: string
    ward?: string
    district?: string
    province?: string
    country?: string
  }
}

interface AddressDetail {
  formatted: string
  components: Record<string, string>
}

// Reactive state
const isOpen = ref(false)
const provinces = ref<Province[]>([])
const wards = ref<Ward[]>([])
const selectedProvince = ref('')
const selectedWard = ref('')
const searchValue = ref('')
const searchOptions = ref<SearchOption[]>([])
const addressDetail = ref<AddressDetail | null>(null)
const isLoading = ref(false)

// Computed properties for sorted wards
const sortedWards = computed(() => {
  const sorted = [...wards.value];
  return sorted.sort((a, b) => {
    // Sort by division_type first, then by name
    const typeOrder = ['quận', 'huyện', 'thành phố', 'thị xã', 'phường', 'xã', 'thị trấn'];
    const aTypeIndex = typeOrder.indexOf(a.division_type);
    const bTypeIndex = typeOrder.indexOf(b.division_type);
    
    if (aTypeIndex !== bTypeIndex) {
      return aTypeIndex - bTypeIndex;
    }
    
    return a.name.localeCompare(b.name, 'vi');
  });
})

// Search debounce
let searchTimeout: NodeJS.Timeout | null = null

// Computed properties
const displayText = computed(() => {
  if (addressDetail.value?.formatted) {
    return addressDetail.value.formatted.split(',')[0] || 'Thành phố Hồ Chí Minh'
  }
  
  if (searchValue.value.trim()) {
    return searchValue.value.split(',')[0] || 'Thành phố Hồ Chí Minh'
  }
  
  if (selectedWard.value && selectedProvince.value) {
    const ward = sortedWards.value.find(w => w.code.toString() === selectedWard.value)
    const province = provinces.value.find(p => p.code.toString() === selectedProvince.value)
    return `${ward?.name}, ${province?.name}`
  }
  
  if (selectedProvince.value) {
    const province = provinces.value.find(p => p.code.toString() === selectedProvince.value)
    return province?.name || 'Thành phố Hồ Chí Minh'
  }
  
  return 'Thành phố Hồ Chí Minh'
})

const currentAddressDisplay = computed(() => {
  if (addressDetail.value?.formatted) {
    return addressDetail.value.formatted
  }
  
  if (searchValue.value.trim()) {
    return searchValue.value
  }
  
  if (selectedWard.value && selectedProvince.value) {
    const ward = sortedWards.value.find(w => w.code.toString() === selectedWard.value)
    const province = provinces.value.find(p => p.code.toString() === selectedProvince.value)
    return `${ward?.name}, ${province?.name}`
  }
  
  if (selectedProvince.value) {
    const province = provinces.value.find(p => p.code.toString() === selectedProvince.value)
    return province?.name || ''
  }
  
  return 'Chưa chọn'
})

// Methods
const openModal = async () => {
  isOpen.value = true
  await fetchProvinces()
}

const closeModal = () => {
  isOpen.value = false
  searchOptions.value = []
}

const fetchProvinces = async () => {
  try {
    isLoading.value = true
    const config = useRuntimeConfig()
    const response = await fetch(`${config.public.apiBaseUrl}/location/provinces`)
    const data = await response.json()
    provinces.value = data.success ? data.data : []
  } catch (error) {
    console.error('Error fetching provinces:', error)
  } finally {
    isLoading.value = false
  }
}

const handleProvinceChange = async () => {
  selectedWard.value = ''
  addressDetail.value = null
  
  if (!selectedProvince.value) {
    wards.value = []
    return
  }
  
  try {
    const config = useRuntimeConfig()
    const response = await fetch(`${config.public.apiBaseUrl}/location/wards/${selectedProvince.value}`)
    const data = await response.json()
    wards.value = data.success ? data.data : []
    
    // Update search value to province name
    const province = provinces.value.find(p => p.code.toString() === selectedProvince.value)
    if (province) {
      searchValue.value = province.name
    }
  } catch (error) {
    console.error('Error fetching wards:', error)
  }
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(async () => {
    await fetchAddressSearch(searchValue.value)
  }, 500)
}

const fetchAddressSearch = async (keyword: string) => {
  if (!keyword.trim()) {
    searchOptions.value = []
    return
  }
  
  try {
    const config = useRuntimeConfig()
    const response = await fetch(`${config.public.apiBaseUrl}/location/search?q=${encodeURIComponent(keyword)}`)
    const data = await response.json()
    searchOptions.value = data.success ? data.data : []
  } catch (error) {
    console.error('Error searching address:', error)
    searchOptions.value = []
  }
}

const selectAddress = async (option: SearchOption) => {
  searchValue.value = option.value
  searchOptions.value = []
  
  if (option.lat && option.lon) {
    try {
      const config = useRuntimeConfig()
      const response = await fetch(`${config.public.apiBaseUrl}/location/reverse?lat=${option.lat}&lon=${option.lon}`)
      const data = await response.json()
      
      if (data.success) {
        addressDetail.value = {
          formatted: data.data.display_name,
          components: data.data.address
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error)
    }
  }
  
  selectedProvince.value = ''
  selectedWard.value = ''
  wards.value = []
}

const confirmSelection = () => {
  console.log('Selected location:', {
    display: displayText.value,
    formatted: addressDetail.value?.formatted,
    province: selectedProvince.value,
    ward: selectedWard.value,
    searchValue: searchValue.value
  })
  
  closeModal()
}

onMounted(() => {
})
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
