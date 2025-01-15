/*
  # Update admin authentication policies

  1. Changes
    - Add admin role to auth.users
    - Update policies for admin access
  2. Security
    - Enable proper RLS for admin users
    - Add policies for admin operations
*/

-- Create an admin role type
CREATE TYPE user_role AS ENUM ('admin', 'customer');

-- Add role column to auth.users (if not exists)
DO $$ 
BEGIN
  ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'customer';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Update policies for admin access
DROP POLICY IF EXISTS "Allow admin users to update orders" ON orders;

CREATE POLICY "Allow admin users to update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Add policy for admin to read all orders
CREATE POLICY "Allow admin users to read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );