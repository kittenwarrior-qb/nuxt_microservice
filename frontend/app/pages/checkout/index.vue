<template>
  <div class="max-w-[1200px] mx-auto px-4 py-6">
    <h1 class="text-2xl font-semibold mb-4">Thanh toán</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Customer Info -->
      <div class="md:col-span-2 bg-white rounded-lg border p-4 space-y-4">
        <h2 class="text-lg font-medium">Thông tin giao hàng</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Số điện thoại</label>
            <input v-model.trim="form.phone" type="tel" class="w-full border rounded px-3 py-2" placeholder="09xx xxx xxx" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Địa chỉ</label>
            <input v-model.trim="form.address" type="text" class="w-full border rounded px-3 py-2" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
          </div>
        </div>

        <div class="pt-2">
          <h3 class="text-lg font-medium mb-2">Phương thức thanh toán</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 p-3 border rounded cursor-pointer">
              <input type="radio" value="zalopay" v-model="paymentMethod" />
              <span>ZaloPay (Sandbox QR)</span>
            </label>
            <label class="flex items-center gap-2 p-3 border rounded cursor-pointer">
              <input type="radio" value="cod" v-model="paymentMethod" />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </label>
          </div>
        </div>

        <!-- ZaloPay Result Panel -->
        <Transition name="fade">
          <div v-if="zlp.data" class="mt-3 p-3 border rounded bg-gray-50">
            <p class="text-sm text-gray-600 mb-2">Đơn hàng đã được tạo trên ZaloPay (sandbox).</p>
            <div class="space-y-2">
              <div v-if="zlp.data.qr_code">
                <img :src="zlp.data.qr_code" alt="ZaloPay QR" class="w-56 h-56 object-contain border rounded bg-white" />
              </div>
              <div v-else class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                <p class="mb-1">Chưa nhận được QR/Link thanh toán từ ZaloPay.</p>
                <p v-if="zlp.data.return_message">Thông báo: {{ zlp.data.return_message }}</p>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <a v-if="zlp.data.order_url" :href="zlp.data.order_url" target="_blank" rel="noopener" class="text-blue-600 hover:underline text-sm">Mở cổng thanh toán</a>
                <span v-if="zlp.app_trans_id" class="text-xs text-gray-500">Mã giao dịch: {{ zlp.app_trans_id }}</span>
                <button type="button" class="text-xs px-2 py-1 border rounded hover:bg-gray-50" @click="retryCreate">Thử lại</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Order Summary -->
      <div class="bg-white rounded-lg border p-4 h-max sticky top-4">
        <h2 class="text-lg font-medium mb-3">Đơn hàng</h2>

        <div v-if="cartStore.isEmpty" class="text-sm text-gray-500 mb-3">Giỏ hàng trống</div>

        <div v-else class="space-y-3 max-h-[280px] overflow-auto pr-2">
          <div v-for="item in cartStore.items" :key="item.id" class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <img :src="item.img" class="w-12 h-12 object-contain" :alt="item.name || 'product'" />
              <div>
                <p class="text-sm line-clamp-1">{{ item.name }}</p>
                <p class="text-xs text-gray-500">x{{ item.quantity }}</p>
              </div>
            </div>
            <div class="text-sm font-medium text-red-600">{{ formatPrice(parsePrice(item.price) * item.quantity) }}</div>
          </div>
        </div>

        <div class="border-t mt-3 pt-3 space-y-1">
          <div class="flex justify-between text-sm">
            <span>Tạm tính</span>
            <span>{{ formatPrice(subtotal) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Phí vận chuyển</span>
            <span>Miễn phí</span>
          </div>
          <div class="flex justify-between text-base font-semibold">
            <span>Tổng thanh toán</span>
            <span class="text-red-600">{{ formatPrice(total) }}</span>
          </div>
        </div>

        <button
          class="mt-4 w-full bg-[#198754] text-white py-2 rounded-lg disabled:opacity-50"
          :disabled="cartStore.isEmpty || processing"
          @click="handlePay"
        >
          {{ processing ? 'Đang xử lý...' : (paymentMethod === 'zalopay' ? 'Thanh toán ZaloPay (Sandbox)' : 'Đặt hàng (COD)') }}
        </button>

        <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const cartStore = useCartStore()

onMounted(() => {
  cartStore.initializeCart()
})

const form = reactive({
  phone: '',
  address: ''
})
const paymentMethod = ref<'zalopay' | 'cod'>('zalopay')
const processing = ref(false)
const error = ref('')

interface ZaloPayCreateResponse {
  return_code: number
  return_message: string
  order_url?: string
  qr_code?: string
  zp_trans_token?: string
}

interface CreateResult {
  success: boolean
  data: ZaloPayCreateResponse
  app_trans_id: string
}

const zlp = reactive<{ data: ZaloPayCreateResponse | null; app_trans_id?: string }>({ data: null })

const parsePrice = (price: string) => parseFloat((price || '0').toString().replace(/[^\d]/g, '')) || 0
const subtotal = computed(() => cartStore.items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0))
const total = computed(() => subtotal.value)
const formatPrice = (n: number) => n.toLocaleString('vi-VN') + 'đ'

const validate = () => {
  if (!form.phone || !form.address) {
    error.value = 'Vui lòng nhập số điện thoại và địa chỉ.'
    return false
  }
  error.value = ''
  return true
}

const handlePay = async () => {
  if (!validate()) return
  processing.value = true
  try {
    if (paymentMethod.value === 'cod') {
      // Demo: chỉ hiển thị thông báo
      alert('Đặt hàng COD thành công (demo).')
      cartStore.clearCart()
      return
    }

    if (total.value < 1000) {
      throw new Error('Giá trị đơn hàng tối thiểu là 1.000đ để tạo ZaloPay (sandbox).')
    }

    // Build items for ZaloPay
    const items = cartStore.items.map(i => ({ id: i.id, name: i.name, price: parsePrice(i.price), quantity: i.quantity }))

    // Call server API to create ZaloPay order (sandbox)
    const res = await $fetch<CreateResult>('/api/zalopay/create', {
      method: 'POST',
      body: {
        amount: total.value,
        description: 'Thanh toan don hang TGDD (sandbox)',
        items,
        appUser: 'tgdd_web_user'
      }
    })

    if (!res?.success) throw new Error('Tạo đơn ZaloPay thất bại')
    zlp.data = res.data
    zlp.app_trans_id = res.app_trans_id

    // Open payment page if available
    if (zlp.data.order_url && import.meta.client) {
      window.open(zlp.data.order_url, '_blank')
    }
  } catch (e: unknown) {
    console.error('ZaloPay checkout error:', e)
    let message = 'Có lỗi xảy ra khi tạo đơn ZaloPay'
    if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
      message = (e as { message: string }).message
    }
    error.value = message
  } finally {
    processing.value = false
  }
}

const retryCreate = () => {
  zlp.data = null
  error.value = ''
  handlePay()
}

useHead({ title: 'Thanh toán - ZaloPay Sandbox' })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
