-- Stegerholmen database schema for Supabase
-- Drops legacy tables if present and recreates with the expected schema.

DROP TABLE IF EXISTS sold_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hygraph_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image VARCHAR(255),
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_hygraph_id ON products(hygraph_id);

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hygraph_id VARCHAR(255) UNIQUE,
  sum DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  fullfilled BOOLEAN DEFAULT true,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_time ON sales(time);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_hygraph_id ON sales(hygraph_id);

CREATE TABLE sold_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hygraph_id VARCHAR(255) UNIQUE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sold_items_sale_id ON sold_items(sale_id);
CREATE INDEX idx_sold_items_product_id ON sold_items(product_id);
CREATE INDEX idx_sold_items_hygraph_id ON sold_items(hygraph_id);
