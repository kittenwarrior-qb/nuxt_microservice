<template>
  <div class="cart-body max-w-[600px] mx-auto bg-white rounded p-4 mt-10">
    <!-- Empty cart state -->
    <div v-if="cartStore.isEmpty" class="p-6 text-center text-gray-600">
      Giỏ hàng trống
    </div>

    <!-- Cart items -->
    <div v-else class="space-y-4">
      <div v-for="item in cartStore.items" :key="item.id">
        <div class="product-item flex items-center gap-4 rounded-lg p-4">
          <div>
            <img
              :src="item.img"
              :alt="item.name || 'product'"
              class="w-[80px] h-[80px] object-contain"
            />
          </div>

          <div class="w-full">
            <div class="flex justify-between">
              <p class="text-[14px]">{{ item.name }}</p>
              <div>
                <p class="text-[14px] text-[#dd2f2c]">
                  {{ formatPrice(Number(item.price)) }}
                </p>
                <p v-if="item.priceOld" class="line-through text-[#8894a7] text-[13px]">
                  {{ item.priceOld }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-5">
          <button
            @click="handleRemove(item.id)"
            class="text-[12px] text-[#6e6e6e]"
          >
            Xóa
          </button>
          <div class="flex flex-col items-end gap-2">
            <div class="flex items-center border border-gray-200 rounded">
              <button
                @click="handleQuantityChange(item.id, item.quantity - 1)"
                class="px-2 text-gray-600 hover:text-black"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                :value="item.quantity"
                @input="handleQuantityInput(item.id, $event)"
                class="w-12 text-center border-none outline-none"
              />
              <button
                @click="handleQuantityChange(item.id, item.quantity + 1)"
                class="px-2 text-gray-600 hover:text-black"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart summary -->
      <div class="flex mt-6 pt-4 justify-between">
        <p class="text-[14px]">
          Tạm tính ({{ cartStore.totalQuantity }} sản phẩm):
        </p>
        <p class="text-[14px]">
          {{ cartStore.formatPrice(cartStore.totalPrice) }}
        </p>
      </div>

      <!-- Checkout button -->
      <NuxtLink
        to="/checkout"
        :state="{
          total: cartStore.totalPrice,
          products: cartStore.items
        }"
      >
        <button class="bg-[#FC7600] w-full text-white px-6 py-2 rounded-lg font-medium">
          Đặt hàng
        </button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const cartStore = useCartStore()

// Initialize cart on component mount
onMounted(() => {
  cartStore.initializeCart()
})

// Handle item removal
const handleRemove = (id: number) => {
  cartStore.removeItem(id)
}

// Handle quantity change via buttons
const handleQuantityChange = (id: number, quantity: number) => {
  if (quantity <= 0) return
  cartStore.updateQuantity(id, quantity)
}

// Handle quantity change via input
const handleQuantityInput = (id: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const quantity = Number(target.value)
  if (quantity > 0) {
    cartStore.updateQuantity(id, quantity)
  }
}

// Format price helper
const formatPrice = (price: number) => {
  return price.toLocaleString('vi-VN') + 'đ'
}

// Set page meta
useHead({
  title: 'Giỏ hàng - Thế Giới Di Động'
})
</script>