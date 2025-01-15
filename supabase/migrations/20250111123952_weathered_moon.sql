/*
  # Add updated_at field and admin authentication

  1. Changes
    - Add updated_at field to orders table
    - Add policy for admin users to update orders
  2. Security
    - Enable RLS for orders table updates by admin users
*/

-- Add updated_at field
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update policy for admin users
CREATE POLICY "Allow admin users to update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('admin@example.com'));

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();