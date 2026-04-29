-- ══════════════════════════════════════════════════════════════
-- Article Number Auto-Increment (starting from 10001)
-- Run in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Create sequence starting from 10001
CREATE SEQUENCE IF NOT EXISTS article_number_seq START WITH 10001 INCREMENT BY 1;

-- Set existing articles that don't have numbers
UPDATE articles 
SET article_number = nextval('article_number_seq')
WHERE article_number IS NULL;

-- Auto-assign on insert (trigger)
CREATE OR REPLACE FUNCTION public.set_article_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.article_number IS NULL THEN
    NEW.article_number := nextval('article_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_number ON public.articles;
CREATE TRIGGER trg_article_number
  BEFORE INSERT ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_article_number();

-- Also add "pending" to allowed status values (if using enum)
-- ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'pending';

-- Check result
SELECT id, title, article_number FROM articles ORDER BY article_number LIMIT 10;
