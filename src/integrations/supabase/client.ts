// Supabase client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://neojditfucitnovcfspw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lb2pkaXRmdWNpdG5vdmNmc3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzgxNDgsImV4cCI6MjA5MjExNDE0OH0.blzJAGGj0ggCNnL46ZayHx0UhjQNJkfX6PncGNXIcgU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
