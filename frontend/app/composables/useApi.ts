import { ApiService } from '~/services/api'
import type { ProductListParams, SearchParams } from '~/types/product'

export const useApi = () => {
  // Create API service instance with runtime config
  const config = useRuntimeConfig()
  const apiService = new ApiService(config.public.apiBaseUrl as string)
  
  return {
    // Products
    getProducts: (params?: ProductListParams) => apiService.getProducts(params),
    getProduct: (id: string | number) => apiService.getProduct(id),
    searchProducts: (params: SearchParams) => apiService.searchProducts(params),
    getFlashSaleProducts: (page?: number, pageSize?: number) => apiService.getFlashSaleProducts(page, pageSize),
    getNewProducts: (page?: number, pageSize?: number) => apiService.getNewProducts(page, pageSize),
    getProductsByKey: (key: string) => apiService.getProductsByKey(key),
    
    // Categories
    getCategories: () => apiService.getCategories(),
    getCategory: (id: number) => apiService.getCategory(id),
    getCategoryProducts: (id: number, page?: number, pageSize?: number) => apiService.getCategoryProducts(id, page, pageSize),
    
    // Health
    healthCheck: () => apiService.healthCheck()
  }
}
