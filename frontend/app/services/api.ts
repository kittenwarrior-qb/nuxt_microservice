import type { Product, Category, ProductListParams, SearchParams } from '~/types/product'

class ApiService {
  private baseURL: string

  constructor(baseURL?: string) {
    // Get API base URL from runtime config or fallback to provided baseURL
    if (import.meta.client && !baseURL) {
      const config = useRuntimeConfig()
      this.baseURL = config.public.apiBaseUrl || 'http://localhost:3001/api/v1'
    } else {
      this.baseURL = baseURL || 'http://localhost:3001/api/v1'
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure we have a full URL
    const url = this.baseURL.startsWith('http') 
      ? `${this.baseURL}${endpoint}`
      : `${this.baseURL}${endpoint}`
    
    console.log('Making API request to:', url)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    // Add auth token if available (only in browser context)
    if (import.meta.client) {
      const token = useCookie('auth-token')
      if (token.value) {
        headers['Authorization'] = `Bearer ${token.value}`
      }
    }

    try {
      // Use native fetch to avoid Nuxt routing interference
      const response = await fetch(url, {
        method: (options.method as 'GET' | 'POST' | 'PUT' | 'DELETE') || 'GET',
        headers,
        body: options.body,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json() as T
    } catch (error) {
      console.error('API request failed:', error)
      throw new Error(`API Error: ${error}`)
    }
  }

  // Products API
  async getProducts(params: ProductListParams = {}): Promise<Product[]> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString())
    if (params.category) searchParams.append('category', params.category)
    if (params.brand) searchParams.append('brand', params.brand)
    if (params.isFlashSale !== undefined) searchParams.append('is_flash_sale', params.isFlashSale.toString())
    if (params.isNew !== undefined) searchParams.append('is_new', params.isNew.toString())

    const queryString = searchParams.toString()
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`
    
    return this.request<Product[]>(endpoint)
  }

  async getProduct(id: string | number): Promise<Product> {
    return this.request<Product>(`/products/${id}`)
  }

  async searchProducts(params: SearchParams): Promise<Product[]> {
    const searchParams = new URLSearchParams()
    searchParams.append('q', params.q)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString())

    return this.request<Product[]>(`/products/search?${searchParams.toString()}`)
  }

  // Product suggestions for header search (Elasticsearch-backed)
  async suggestProducts(q: string, limit = 8): Promise<Pick<Product, 'id' | 'name' | 'price' | 'brand' | 'category' | 'img'>[]> {
    const searchParams = new URLSearchParams()
    searchParams.append('q', q)
    searchParams.append('limit', String(limit))
    return this.request(`/search/suggest?${searchParams.toString()}`)
  }

  async getFlashSaleProducts(page = 1, pageSize = 10): Promise<Product[]> {
    return this.request<Product[]>(`/products/flash-sale?page=${page}&pageSize=${pageSize}`)
  }

  async getNewProducts(page = 1, pageSize = 10): Promise<Product[]> {
    return this.request<Product[]>(`/products/new?page=${page}&pageSize=${pageSize}`)
  }

  // Categories API
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories')
  }

  async getCategory(id: number): Promise<Category> {
    return this.request<Category>(`/categories/${id}`)
  }

  async getCategoryProducts(id: number, page = 1, pageSize = 10): Promise<Product[]> {
    return this.request<Product[]>(`/categories/${id}/products?page=${page}&pageSize=${pageSize}`)
  }

  // Convenience method for getting products by category key (matching your TAB_CATEGORIES)
  async getProductsByKey(key: string): Promise<Product[]> {
    switch (key) {
      case 'flashsale':
        return this.getFlashSaleProducts()
      case 'new':
        return this.getNewProducts()
      default: {
        // Check if key is a brand name (case-insensitive)
        const brandNames = ['apple', 'samsung', 'xiaomi', 'oppo', 'vivo', 'huawei', 'oneplus', 'realme', 'nokia', 'sony', 'lg', 'asus', 'hp', 'dell', 'lenovo', 'acer', 'macbook', 'ipad', 'iphone']
        
        if (brandNames.includes(key.toLowerCase())) {
          // Search by brand name, capitalize first letter for API
          const brandName = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
          return this.getProducts({ brand: brandName, pageSize: 12 })
        } else {
          // For other keys, search by category name
          return this.getProducts({ category: key, pageSize: 12 })
        }
      }
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health')
  }
}

// Export class for custom instances
export { ApiService }
