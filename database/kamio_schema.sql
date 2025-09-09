-- KAMIO E-Commerce Database Schema
-- MySQL Database Schema for Custom Apparel Platform

CREATE DATABASE IF NOT EXISTS kamio_db;
USE kamio_db;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS custom_designs;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email(255)),
    INDEX idx_users_role (role(10))
);

-- Categories table
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categories_slug (slug(255)),
    INDEX idx_categories_primary (is_primary)
);

-- Products table
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    category_id VARCHAR(36),
    images JSON,
    sizes JSON,
    colors JSON,
    inventory INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_slug (slug(255)),
    INDEX idx_products_category (category_id),
    INDEX idx_products_active (is_active),
    INDEX idx_products_created (created_at)
);

-- Cart items table
CREATE TABLE cart_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    product_id VARCHAR(36),
    quantity INT NOT NULL DEFAULT 1,
    size TEXT,
    color TEXT,
    custom_design JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_cart_user (user_id),
    INDEX idx_cart_product (product_id)
);

-- Orders table
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    status TEXT NOT NULL DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL,
    items JSON NOT NULL,
    shipping_address JSON NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status(20)),
    INDEX idx_orders_payment (payment_status(20)),
    INDEX idx_orders_created (created_at)
);

-- Custom designs table
CREATE TABLE custom_designs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    name TEXT NOT NULL,
    design JSON NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_designs_user (user_id),
    INDEX idx_designs_created (created_at)
);

-- Insert sample categories
INSERT INTO categories (name, slug, description, image, is_primary) VALUES
('Cricket', 'cricket', 'High-quality cricket apparel', '/attached_assets/cricket%20jersey_1757357415580.png', true),
('Football', 'football', 'High-quality football apparel', '/attached_assets/fotball%20jersey%20image_1757357415582.png', true),
('E-Sports', 'esports', 'High-quality esports apparel', '/attached_assets/esports%20kamio_1757357415581.png', true),
('Marathon', 'marathon', 'High-quality marathon apparel', '/attached_assets/marathon%20jersey%20ksmio_1757357415582.png', true),
('Cycling', 'cycling', 'High-quality cycling apparel', '/attached_assets/cyclist_1757357415581.png', true),
('Bikers', 'bikers', 'High-quality biker apparel', '/attached_assets/biker%20jersy%20kamio_1757357415580.jfif', true),
('Custom Flags', 'custom-flags', 'High-quality custom flags', '/attached_assets/KAMIO%20FLAGS_1757366547552.png', false),
('Corporate Gifts', 'corporate-gifts', 'High-quality corporate gifts', '/attached_assets/GIFT%20ITEM%20KAMIO_1757366547551.png', false),
('Corporate Uniforms', 'corporate-uniforms', 'High-quality corporate uniforms', '/attached_assets/uniform%20kamio_1757366547552.png', false),
('Stickers', 'stickers', 'High-quality stickers', '/attached_assets/STICKERS%20KAMIO_1757366547552.png', false);

-- Insert sample admin user
INSERT INTO users (email, password, name, role) VALUES 
('admin@kamio.com', '$2a$10$K8BhUYIVJGxO9qM0P5A0E.YnqSrxU0hBPGWLHK9TyGJv7A3FW8gAm', 'Kamio Admin', 'admin');
-- Password for admin user is: admin123456

-- Insert sample products
INSERT INTO products (name, slug, description, price, original_price, category_id, images, sizes, colors, inventory) 
SELECT 
    'Custom Cricket Jersey',
    'custom-cricket-jersey',
    'Professional quality cricket jersey with customization options',
    2499.00,
    2999.00,
    id,
    JSON_ARRAY('/api/placeholder/300/400'),
    JSON_ARRAY('XS', 'S', 'M', 'L', 'XL', 'XXL'),
    JSON_ARRAY('White', 'Navy Blue', 'Royal Blue', 'Red', 'Green'),
    50
FROM categories WHERE slug = 'cricket'
LIMIT 1;

INSERT INTO products (name, slug, description, price, original_price, category_id, images, sizes, colors, inventory) 
SELECT 
    'Football Team Jersey',
    'football-team-jersey',
    'High-performance football jersey perfect for teams and individuals',
    1999.00,
    2499.00,
    id,
    JSON_ARRAY('/api/placeholder/300/400'),
    JSON_ARRAY('XS', 'S', 'M', 'L', 'XL', 'XXL'),
    JSON_ARRAY('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
    75
FROM categories WHERE slug = 'football'
LIMIT 1;

INSERT INTO products (name, slug, description, price, original_price, category_id, images, sizes, colors, inventory) 
SELECT 
    'Gaming Jersey Pro',
    'gaming-jersey-pro',
    'Professional esports jersey with moisture-wicking fabric',
    1799.00,
    2299.00,
    id,
    JSON_ARRAY('/api/placeholder/300/400'),
    JSON_ARRAY('S', 'M', 'L', 'XL', 'XXL'),
    JSON_ARRAY('Black', 'Purple', 'Orange', 'Cyan', 'Pink'),
    30
FROM categories WHERE slug = 'esports'
LIMIT 1;

-- Create indexes for performance
CREATE INDEX idx_users_email_lookup ON users (email(191));
CREATE INDEX idx_categories_slug_lookup ON categories (slug(191));
CREATE INDEX idx_products_slug_lookup ON products (slug(191));

-- Show table structure
SHOW TABLES;