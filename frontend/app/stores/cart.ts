import { defineStore } from 'pinia'
import { CartService, type CartItem } from '~/services/cart.service'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const isLoading = ref(false)

  // Initialize cart from localStorage on client side
  const initializeCart = () => {
    if (import.meta.client) {
      items.value = CartService.getCart()
    }
  }

  // Add item to cart
  const addItem = (product: Omit<CartItem, 'quantity'>) => {
    const updatedCart = CartService.addToCart(product)
    items.value = updatedCart
  }

  // Remove item from cart
  const removeItem = (productId: number) => {
    const updatedCart = CartService.removeFromCart(productId)
    items.value = updatedCart
  }

  // Update item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    const updatedCart = CartService.updateQuantity(productId, quantity)
    items.value = updatedCart
  }

  // Clear entire cart
  const clearCart = () => {
    CartService.clearCart()
    items.value = []
  }

  // Computed properties
  const totalQuantity = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
      const priceStr = item.price.toString().replace(/[đ₫\s,]/g, '')
      const price = parseFloat(priceStr) || 0
      return total + (price * item.quantity)
    }, 0)
  })

  const isEmpty = computed(() => items.value.length === 0)

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ'
  }

  return {
    // State
    items: readonly(items),
    isLoading: readonly(isLoading),
    
    // Actions
    initializeCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Getters
    totalQuantity,
    totalPrice,
    isEmpty,
    formatPrice
  }
})
