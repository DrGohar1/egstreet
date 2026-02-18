
-- =============================================
-- 1. Advertisements table
-- =============================================
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'sidebar',
  placement_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads" ON public.advertisements FOR SELECT USING (true);
CREATE POLICY "Admins can manage ads" ON public.advertisements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'ads_manager'))
);

-- =============================================
-- 2. Ad Analytics table
-- =============================================
CREATE TABLE IF NOT EXISTS public.ad_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.advertisements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert ad analytics" ON public.ad_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view ad analytics" ON public.ad_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'ads_manager'))
);

-- Ad RPC functions
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.advertisements SET impressions = impressions + 1 WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.advertisements SET clicks = clicks + 1 WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- 3. Comment Likes table
-- =============================================
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. Saved Articles table
-- =============================================
CREATE TABLE IF NOT EXISTS public.saved_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved" ON public.saved_articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save articles" ON public.saved_articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave articles" ON public.saved_articles FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. Share Tracking table
-- =============================================
CREATE TABLE IF NOT EXISTS public.share_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.share_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert share tracking" ON public.share_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view shares" ON public.share_tracking FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- =============================================
-- 6. Trending Articles (materialized view as table)
-- =============================================
CREATE TABLE IF NOT EXISTS public.trending_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trending_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view trending" ON public.trending_articles FOR SELECT USING (true);
