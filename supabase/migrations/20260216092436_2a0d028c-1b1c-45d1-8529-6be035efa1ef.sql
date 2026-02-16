
-- 1. Comments system
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_article ON public.comments(article_id);
CREATE INDEX idx_comments_status ON public.comments(status);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are public" ON public.comments
FOR SELECT USING (
  status = 'approved' 
  OR auth.uid() = user_id 
  OR has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'editor_in_chief'::app_role)
);

CREATE POLICY "Auth users can comment" ON public.comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can moderate comments" ON public.comments
FOR UPDATE USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'editor_in_chief'::app_role)
);

CREATE POLICY "Admins can delete comments" ON public.comments
FOR DELETE USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'editor_in_chief'::app_role)
  OR auth.uid() = user_id
);

-- 2. Daily analytics tracking
CREATE TABLE public.daily_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(article_id, view_date)
);

ALTER TABLE public.daily_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read daily views" ON public.daily_views
FOR SELECT USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'editor_in_chief'::app_role)
);

CREATE POLICY "Anyone can insert daily views" ON public.daily_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update daily views" ON public.daily_views
FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.track_daily_view(p_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO daily_views (article_id, view_date, view_count)
  VALUES (p_article_id, CURRENT_DATE, 1)
  ON CONFLICT (article_id, view_date)
  DO UPDATE SET view_count = daily_views.view_count + 1;
END;
$$;

-- 4. Static pages
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT,
  content_en TEXT,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are publicly readable" ON public.pages
FOR SELECT USING (
  is_published = true 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can manage pages" ON public.pages
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_pages_updated_at 
BEFORE UPDATE ON public.pages 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.pages (slug, title_ar, title_en, content_ar, content_en) VALUES
('about', 'من نحن', 'About Us', '<h2>جريدة الشارع المصري</h2><p>منصة إخبارية مصرية مستقلة تهدف لنقل الأخبار بشفافية ومصداقية.</p>', '<h2>EgStreet News</h2><p>An independent Egyptian news platform committed to transparent and credible journalism.</p>'),
('privacy', 'سياسة الخصوصية', 'Privacy Policy', '<h2>سياسة الخصوصية</h2><p>نحن نحترم خصوصيتك ونحمي بياناتك الشخصية وفقاً للمعايير الدولية.</p>', '<h2>Privacy Policy</h2><p>We respect your privacy and protect your personal data according to international standards.</p>'),
('contact', 'اتصل بنا', 'Contact Us', '<h2>تواصل معنا</h2><p>نسعد بتواصلكم معنا عبر البريد الإلكتروني أو مواقع التواصل الاجتماعي.</p>', '<h2>Contact Us</h2><p>We are happy to hear from you via email or social media.</p>');

-- 8. Tags system
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.article_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, tag_id)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are publicly readable" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON public.tags 
FOR ALL USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'editor_in_chief'::app_role)
);

CREATE POLICY "Article tags are publicly readable" ON public.article_tags FOR SELECT USING (true);
CREATE POLICY "Authors and editors can manage article tags" ON public.article_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM articles a 
    WHERE a.id = article_tags.article_id 
    AND (
      a.author_id = auth.uid() 
      OR has_role(auth.uid(), 'editor_in_chief'::app_role) 
      OR has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);

-- 5. Full text search index
CREATE INDEX IF NOT EXISTS idx_articles_title_fts ON public.articles USING gin(to_tsvector('simple', coalesce(title, '')));

-- 10. Author profiles - add index for author pages
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
