-- Tối ưu search performance cho PostgreSQL
-- Chạy script này để tăng tốc search suggest

-- 1. Enable extensions trước
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Tạo index cho text search
CREATE INDEX IF NOT EXISTS idx_products_search_gin 
ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(category, '')));

-- 3. Tạo index riêng cho từng cột với pg_trgm (cho ILIKE %keyword%)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin(brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category_trgm ON products USING gin(category gin_trgm_ops);

-- 4. Tạo index B-tree cho prefix search (keyword%)
CREATE INDEX IF NOT EXISTS idx_products_name_prefix ON products (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_prefix ON products (brand text_pattern_ops);

-- 4. Kiểm tra số lượng records
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN name IS NOT NULL AND TRIM(name) != '' THEN 1 END) as valid_names
FROM products;
