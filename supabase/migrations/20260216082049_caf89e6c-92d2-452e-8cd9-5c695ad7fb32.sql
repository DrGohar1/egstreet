
-- Add views column to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Create index for most-read queries
CREATE INDEX IF NOT EXISTS idx_articles_views ON public.articles(views DESC);

-- Create a function to increment views (avoids race conditions)
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE articles SET views = views + 1 WHERE id = article_id;
END;
$$;
