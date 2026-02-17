
-- ==========================================
-- 1. ADVERTISEMENTS SYSTEM (نظام الإعلانات)
-- ==========================================

CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'sidebar', -- 'top', 'sidebar', 'bottom', 'inline'
  placement_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active ads are publicly readable" ON public.advertisements
FOR SELECT USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

CREATE POLICY "Admins can manage ads" ON public.advertisements
FOR ALL USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'ads_manager'::app_role)
);

CREATE INDEX idx_advertisements_position ON public.advertisements(position, placement_order);
CREATE INDEX idx_advertisements_active ON public.advertisements(is_active);

-- Track ad impressions and clicks
CREATE TABLE public.ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'impression' or 'click'
  user_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ad analytics" ON public.ad_analytics
FOR SELECT USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'ads_manager'::app_role)
);

CREATE POLICY "System can insert ad analytics" ON public.ad_analytics
FOR INSERT WITH CHECK (true);

CREATE INDEX idx_ad_analytics_ad ON public.ad_analytics(ad_id);
CREATE INDEX idx_ad_analytics_event ON public.ad_analytics(event_type);

-- ==========================================
-- 2. SAVED ARTICLES / READING LIST (المفضلة)
-- ==========================================

CREATE TABLE public.saved_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved articles" ON public.saved_articles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save articles" ON public.saved_articles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved articles" ON public.saved_articles
FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_saved_articles_user ON public.saved_articles(user_id);
CREATE INDEX idx_saved_articles_article ON public.saved_articles(article_id);

-- ==========================================
-- 3. PUSH NOTIFICATIONS (الإشعارات)
-- ==========================================

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- Notifications log
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_ar TEXT,
  body_en TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- ==========================================
-- 4. ARTICLE METADATA (بيانات المقالات الإضافية)
-- ==========================================

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_featured_homepage BOOLEAN DEFAULT false;

CREATE INDEX idx_articles_featured ON public.articles(is_featured_homepage) WHERE is_featured_homepage = true;

-- ==========================================
-- 5. SOCIAL SHARING TRACKING
-- ==========================================

CREATE TABLE public.share_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'twitter', 'whatsapp', 'telegram', 'email'
  share_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.share_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Share tracking is public" ON public.share_tracking FOR SELECT USING (true);
CREATE POLICY "System can insert share tracking" ON public.share_tracking FOR INSERT WITH CHECK (true);

CREATE INDEX idx_share_tracking_article ON public.share_tracking(article_id);
CREATE INDEX idx_share_tracking_platform ON public.share_tracking(platform);

-- ==========================================
-- 6. TRENDING ARTICLES (المقالات الرائجة)
-- ==========================================

CREATE TABLE public.trending_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id)
);

ALTER TABLE public.trending_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trending articles are public" ON public.trending_articles FOR SELECT USING (true);

CREATE INDEX idx_trending_articles_score ON public.trending_articles(score DESC);

-- ==========================================
-- 7. COMMENT LIKES (إعجابات التعليقات)
-- ==========================================

CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes are public" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON public.comment_likes(user_id);

-- ==========================================
-- 8. UPDATE TRIGGERS
-- ==========================================

CREATE TRIGGER update_advertisements_updated_at 
BEFORE UPDATE ON public.advertisements 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION public.calculate_reading_time(content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  word_count INTEGER;
BEGIN
  word_count := array_length(string_to_array(content, ' '), 1);
  RETURN GREATEST(1, CEIL(word_count::NUMERIC / 200));
END;
$$;

-- Update reading time when article is created or updated
CREATE OR REPLACE FUNCTION public.update_article_reading_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.word_count := array_length(string_to_array(NEW.content, ' '), 1);
    NEW.reading_time_minutes := calculate_reading_time(NEW.content);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_reading_time
BEFORE INSERT OR UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_article_reading_time();

-- Function to update trending articles score
CREATE OR REPLACE FUNCTION public.calculate_trending_score(
  p_article_id UUID
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views INTEGER;
  v_comments INTEGER;
  v_shares INTEGER;
  v_hours_old DECIMAL;
  v_score DECIMAL;
BEGIN
  SELECT COALESCE(views, 0) INTO v_views FROM articles WHERE id = p_article_id;
  SELECT COUNT(*) INTO v_comments FROM comments WHERE article_id = p_article_id AND status = 'approved';
  SELECT COALESCE(SUM(share_count), 0) INTO v_shares FROM share_tracking WHERE article_id = p_article_id;
  SELECT EXTRACT(EPOCH FROM (now() - published_at)) / 3600 INTO v_hours_old FROM articles WHERE id = p_article_id;
  
  v_score := (v_views * 0.5 + v_comments * 2 + v_shares * 1.5) / (v_hours_old + 1);
  
  INSERT INTO trending_articles (article_id, score, calculated_at)
  VALUES (p_article_id, v_score, now())
  ON CONFLICT (article_id)
  DO UPDATE SET score = v_score, calculated_at = now();
  
  RETURN v_score;
END;
$$;
