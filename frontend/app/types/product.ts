export interface Product {
  id: string | number
  name: string
  price: string
  // Old/new price
  priceOld?: string
  price_old?: string
  percent?: string
  brand?: string
  category?: string
  img?: string
  rating?: string
  // Flash sale count like "12/100"
  flashSaleCount?: string
  flash_sale_count?: string | null
  sold?: string
  // Boolean flags (camelCase + snake_case)
  isFlashSale?: boolean
  is_flash_sale?: boolean
  isNew?: boolean
  is_new?: boolean
  isLoan?: boolean
  is_loan?: boolean
  isOnline?: boolean
  is_online?: boolean
  isUpComming?: boolean
  isUpcoming?: boolean
  is_upcoming?: boolean
  link?: string
  // Timestamps (camelCase + snake_case)
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  tags?: string[]
}

export interface Category {
  id: number
  name: string
  link: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  pageSize?: number
}

export interface ProductListParams {
  page?: number
  pageSize?: number
  category?: string
  brand?: string
  isFlashSale?: boolean
  isNew?: boolean
}

export interface SearchParams {
  q: string
  page?: number
  pageSize?: number
}
