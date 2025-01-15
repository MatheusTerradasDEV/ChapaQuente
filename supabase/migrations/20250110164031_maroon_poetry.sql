/*
  # Restaurant Online Ordering System Schema

  1. New Tables
    - categories
      - id (uuid, primary key)
      - name (text)
      - slug (text)
      - created_at (timestamp)
    
    - products
      - id (uuid, primary key)
      - category_id (uuid, foreign key)
      - name (text)
      - description (text)
      - price (numeric)
      - image_url (text)
      - available (boolean)
      - created_at (timestamp)
    
    - orders
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - status (text)
      - delivery_type (text)
      - customer_name (text)
      - phone (text)
      - total (numeric)
      - created_at (timestamp)
    
    - order_items
      - id (uuid, primary key)
      - order_id (uuid, foreign key)
      - product_id (uuid, foreign key)
      - quantity (integer)
      - price (numeric)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending',
  delivery_type text NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can read their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Insert sample categories
INSERT INTO categories (name, slug) VALUES
  ('Lanches', 'lanches'),
  ('Bebidas', 'bebidas'),
  ('Porções', 'porcoes'),
  ('Especiais', 'especiais');

-- Insert sample products
INSERT INTO products (category_id, name, description, price, image_url) VALUES
  ((SELECT id FROM categories WHERE slug = 'lanches'), 'X-Burger', 'Hambúrguer artesanal com queijo', 25.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'),
  ((SELECT id FROM categories WHERE slug = 'bebidas'), 'Refrigerante', 'Coca-Cola 350ml', 6.90, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500'),
  ((SELECT id FROM categories WHERE slug = 'porcoes'), 'Batata Frita', 'Porção grande com cheddar e bacon', 29.90, 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500'),
  ((SELECT id FROM categories WHERE slug = 'especiais'), 'Combo Família', '2 hambúrgueres, batata frita e refrigerante', 89.90, 'https://images.unsplash.com/photo-1610614819513-58e34989848b?w=500');