-- ══════════════════════════════════════════════════════
-- Fix: Add missing columns to articles table
-- Run this in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════

-- Add scheduled_at column if not exists
ALTER TABLE public.articles 
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL;

-- Add featured_image_position if not exists
ALTER TABLE public.articles 
  ADD COLUMN IF NOT EXISTS featured_image_position text DEFAULT 'center center';

-- Add article_number if not exists  
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS article_number bigint;

-- Add custom_author_name if not exists
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS custom_author_name text;

-- Add meta_title / meta_description if not exists
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS meta_description text;

-- Refresh schema cache (important!)
NOTIFY pgrst, 'reload schema';

-- Done ✅
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;
