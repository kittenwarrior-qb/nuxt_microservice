export interface CartItem {
  id: number;
  name: string;
  price: string;
  priceOld?: string;
  img: string;
  quantity: number;
}

const STORAGE_KEY = 'tgdd_cart';

export const CartService = {
  getCart(): CartItem[] {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  },

  saveCart(cart: CartItem[]): void {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
  },

  addToCart(product: Omit<CartItem, 'quantity'>): CartItem[] {
    const cart = this.getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    this.saveCart(cart);
    return cart;
  },

  removeFromCart(productId: number): CartItem[] {
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    this.saveCart(updatedCart);
    return updatedCart;
  },

  updateQuantity(productId: number, quantity: number): CartItem[] {
    if (quantity <= 0) return this.removeFromCart(productId);
    
    const cart = this.getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
      item.quantity = quantity;
      this.saveCart(cart);
    }
    
    return cart;
  },

  getTotalQuantity(): number {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice(): number {
    const cart = this.getCart();
    return cart.reduce((total, item) => {
      // Remove currency symbols and spaces, but keep decimal points
      const priceStr = item.price.toString().replace(/[đ₫\s,]/g, '');
      const price = parseFloat(priceStr) || 0;
      return total + (price * item.quantity);
    }, 0);
  },

  clearCart(): void {
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
