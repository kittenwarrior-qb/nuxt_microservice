-- TGDD Database Import Script for Docker PostgreSQL
-- Create tables in correct order

-- Create categories table first
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    link TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create products table (relaxed schema to fit raw dataset)
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY,
    name TEXT,
    price TEXT,
    price_old TEXT,
    percent TEXT,
    brand TEXT,
    category TEXT,
    img TEXT,
    rating TEXT,
    flash_sale_count TEXT,
    sold TEXT,
    is_flash_sale BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_loan BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    is_upcoming BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create product_tags table with proper foreign key
CREATE TABLE IF NOT EXISTS product_tags (
    id SERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id),
    tag VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clear existing data
DELETE FROM product_tags;
DELETE FROM products;
DELETE FROM categories;

-- Load full dataset from tgdd_import.sql@@
\echo 'Loading full TGDD dataset from tgdd_import.sql'
\i '/docker-entrypoint-initdb.d/tgdd_import.sql'
