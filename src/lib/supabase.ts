import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Settings = {
  id: number;
  banner_image: string;
};

export type Tables = {
  categories: Category[];
  products: Product[];
  orders: Order[];
  settings: Settings[];
};