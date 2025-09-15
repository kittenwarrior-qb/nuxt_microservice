-- Initial database setup for TheGioiDiDong
-- This script will be executed when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if it doesn't exist
-- Note: This is handled by POSTGRES_DB environment variable

-- Create schemas for better organization
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA catalog TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA orders TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO postgres;

-- Create initial tables (these will be managed by Sequelize migrations)
-- This is just for reference and initial setup

-- Users table (in auth schema)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON auth.users(is_active);

-- Insert default admin user (password: admin123)
INSERT INTO auth.users (email, password, first_name, last_name, role) 
VALUES (
    'admin@thegioididong.com', 
    '$2a$10$8K1p/a0dCZjQHuQDT.6YdeD5q8QOBVVnqiw5Cd8aBGaMQScLbQ4H6',
    'Admin',
    'User',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Categories table
CREATE TABLE IF NOT EXISTS catalog.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    parent_id UUID REFERENCES catalog.categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS catalog.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    category_id UUID REFERENCES catalog.categories(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    specifications JSONB,
    images JSONB,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON catalog.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON catalog.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON catalog.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON catalog.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON catalog.products USING gin(to_tsvector('english', name));

-- Orders table
CREATE TABLE IF NOT EXISTS orders.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS orders.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES catalog.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON orders.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON orders.order_items(product_id);

-- Sample categories
INSERT INTO catalog.categories (name, slug, description) VALUES
('Smartphones', 'smartphones', 'Mobile phones and accessories'),
('Laptops', 'laptops', 'Laptops and notebooks'),
('Tablets', 'tablets', 'Tablets and e-readers'),
('Audio', 'audio', 'Headphones, speakers, and audio equipment'),
('Accessories', 'accessories', 'Phone cases, chargers, and other accessories')
ON CONFLICT (slug) DO NOTHING;

-- Sample products
INSERT INTO catalog.products (name, slug, sku, price, category_id, brand, description, stock_quantity) 
SELECT 
    'iPhone 15 Pro Max', 
    'iphone-15-pro-max', 
    'IPH15PM001', 
    29990000, 
    c.id, 
    'Apple',
    'Latest iPhone with advanced camera system and A17 Pro chip',
    50
FROM catalog.categories c WHERE c.slug = 'smartphones'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO catalog.products (name, slug, sku, price, category_id, brand, description, stock_quantity) 
SELECT 
    'MacBook Pro 14"', 
    'macbook-pro-14', 
    'MBP14001', 
    52990000, 
    c.id, 
    'Apple',
    'Professional laptop with M3 Pro chip',
    25
FROM catalog.categories c WHERE c.slug = 'laptops'
ON CONFLICT (slug) DO NOTHING;
