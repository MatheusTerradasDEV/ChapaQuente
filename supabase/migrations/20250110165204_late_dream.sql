/*
  # Allow anonymous orders

  1. Changes
    - Update RLS policies for orders and order_items tables to allow anonymous users
    - Remove user_id requirement from orders table
  
  2. Security
    - Enable public access for order creation
    - Maintain read access for created orders
*/

-- Remove user_id foreign key and make it nullable
ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Update orders policies
DROP POLICY IF EXISTS "Users can read their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

CREATE POLICY "Allow public to create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read orders"
  ON orders FOR SELECT
  TO public
  USING (true);

-- Update order_items policies
DROP POLICY IF EXISTS "Users can read their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

CREATE POLICY "Allow public to create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read order items"
  ON order_items FOR SELECT
  TO public
  USING (true);