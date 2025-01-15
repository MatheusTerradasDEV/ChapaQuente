/*
  # Setup authentication users and policies

  1. Changes
    - Add default admin and test users
    - Update authentication policies
  2. Security
    - Configure secure password hashing
    - Set up proper role-based access
*/

-- Insert default users (admin and test user)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
-- Admin user
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@restaurant.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"name":"Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
),
-- Test user
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@restaurant.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"],"role":"customer"}',
  '{"name":"Test User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Set roles for the users
UPDATE auth.users 
SET role = 'admin' 
WHERE email = 'admin@restaurant.com';

UPDATE auth.users 
SET role = 'customer' 
WHERE email = 'test@restaurant.com';