-- ============================================================
-- EgStreet Complete Migration v2 — Fixed SQL Syntax
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. TAGS
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL, name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tags" ON public.tags;
CREATE POLICY "Public read tags" ON public.tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage tags" ON public.tags;
CREATE POLICY "Admin manage tags" ON public.tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('super_admin','editor_in_chief')));

-- 2. ARTICLE_CATEGORIES
CREATE TABLE IF NOT EXISTS public.article_categories (
  article_id  UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read article_categories" ON public.article_categories;
CREATE POLICY "Public read article_categories" ON public.article_categories FOR SELECT USING (true);

-- 3. ARTICLE_TAGS
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read article_tags" ON public.article_tags;
CREATE POLICY "Public read article_tags" ON public.article_tags FOR SELECT USING (true);

-- 4. BREAKING_NEWS
CREATE TABLE IF NOT EXISTS public.breaking_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_ar TEXT NOT NULL, text_en TEXT,
  link TEXT, is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read breaking" ON public.breaking_news;
CREATE POLICY "Public read breaking" ON public.breaking_news FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin manage breaking" ON public.breaking_news;
CREATE POLICY "Admin manage breaking" ON public.breaking_news FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('super_admin','editor_in_chief','journalist')));
INSERT INTO public.breaking_news (text_ar, text_en, is_active, priority)
VALUES ('مرحباً بكم في جريدة الشارع المصري', 'Welcome to EgStreet News', true, 1)
ON CONFLICT DO NOTHING;

-- 5. ADVERTISEMENTS
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, image_url TEXT, link_url TEXT,
  position TEXT DEFAULT 'sidebar',
  is_active BOOLEAN DEFAULT true,
  impressions INTEGER DEFAULT 0, clicks INTEGER DEFAULT 0,
  start_date DATE, end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ads" ON public.advertisements;
CREATE POLICY "Public read ads" ON public.advertisements FOR SELECT USING (is_active = true);

-- 6. SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL, name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Insert subscriber" ON public.subscribers;
CREATE POLICY "Insert subscriber" ON public.subscribers FOR INSERT WITH CHECK (true);

-- 7. PAGES
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL, title_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  content_ar TEXT, content_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read pages" ON public.pages;
CREATE POLICY "Public read pages" ON public.pages FOR SELECT USING (is_active = true);
INSERT INTO public.pages (title_ar, title_en, slug, content_ar, is_active) VALUES
  ('من نحن','About Us','about','<p>جريدة الشارع المصري — صحافة تضرم عقلك</p>',true),
  ('اتصل بنا','Contact Us','contact','<p>تواصل معنا عبر البريد الإلكتروني</p>',true),
  ('سياسة الخصوصية','Privacy Policy','privacy','<p>نحن نحترم خصوصيتك</p>',true)
ON CONFLICT (slug) DO NOTHING;

-- 8. ARTICLE_SAVES
CREATE TABLE IF NOT EXISTS public.article_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);
ALTER TABLE public.article_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User manage saves" ON public.article_saves;
CREATE POLICY "User manage saves" ON public.article_saves FOR ALL USING (auth.uid() = user_id);

-- 9. DAILY_VIEWS
CREATE TABLE IF NOT EXISTS public.daily_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  country_code TEXT DEFAULT 'EG',
  city TEXT,
  view_count INTEGER DEFAULT 1,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.daily_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service insert daily_views" ON public.daily_views;
CREATE POLICY "Service insert daily_views" ON public.daily_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read daily_views" ON public.daily_views;
CREATE POLICY "Admin read daily_views" ON public.daily_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('super_admin','editor_in_chief')));
CREATE UNIQUE INDEX IF NOT EXISTS daily_views_date_country_idx ON public.daily_views(view_date, country_code);

-- 10. VISITOR_LOGS
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT, country_code TEXT DEFAULT 'EG',
  city TEXT, page_path TEXT DEFAULT '/',
  device_type TEXT DEFAULT 'desktop',
  browser TEXT DEFAULT 'Other',
  referrer TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service insert visitor_logs" ON public.visitor_logs;
CREATE POLICY "Service insert visitor_logs" ON public.visitor_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read visitor_logs" ON public.visitor_logs;
CREATE POLICY "Admin read visitor_logs" ON public.visitor_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('super_admin','editor_in_chief')));

-- 11. Extra columns on articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tags_cache TEXT[];

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_time ON public.visitor_logs(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_country ON public.visitor_logs(country_code);
CREATE INDEX IF NOT EXISTS idx_daily_views_date ON public.daily_views(view_date DESC);

-- VERIFY
SELECT
  (SELECT COUNT(*) FROM public.tags) AS tags,
  (SELECT COUNT(*) FROM public.breaking_news) AS breaking_news,
  (SELECT COUNT(*) FROM public.pages) AS pages,
  (SELECT COUNT(*) FROM public.daily_views) AS daily_views,
  (SELECT COUNT(*) FROM public.visitor_logs) AS visitor_logs,
  (SELECT COUNT(*) FROM public.subscribers) AS subscribers,
  (SELECT COUNT(*) FROM public.advertisements) AS advertisements,
  (SELECT COUNT(*) FROM public.article_saves) AS article_saves,
  'Migration Complete!' AS status;
