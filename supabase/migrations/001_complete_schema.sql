-- ════════════════════════════════════════════════════════════
-- EG STREET NEWS — Complete Database Migration v2
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ════════════════════════════════════════════════════════════

-- ── 1. articles: add missing columns ──────────────────────
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS meta_title        TEXT,
  ADD COLUMN IF NOT EXISTS meta_description  TEXT;

-- ── 2. breaking_news: add slug column ─────────────────────
ALTER TABLE breaking_news
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- ── 3. saved_articles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, article_id)
);
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_own" ON saved_articles;
CREATE POLICY "saved_own" ON saved_articles
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. share_tracking ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_tracking (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  user_ip     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "share_insert" ON share_tracking;
CREATE POLICY "share_insert" ON share_tracking FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "share_auth_read" ON share_tracking;
CREATE POLICY "share_auth_read" ON share_tracking FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── 5. automation_logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'success',
  message             TEXT,
  articles_processed  INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auto_logs" ON automation_logs;
CREATE POLICY "auto_logs" ON automation_logs USING (auth.uid() IS NOT NULL);

-- ── 6. comments: full schema ──────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes       INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_read" ON comments;
DROP POLICY IF EXISTS "comments_write" ON comments;
DROP POLICY IF EXISTS "comments_auth_manage" ON comments;
CREATE POLICY "comments_read" ON comments FOR SELECT USING (is_approved = true OR auth.uid() IS NOT NULL);
CREATE POLICY "comments_write" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_auth_manage" ON comments FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 7. advertisements: full schema ────────────────────────
CREATE TABLE IF NOT EXISTS advertisements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar    TEXT,
  title_en    TEXT,
  image_url   TEXT,
  link_url    TEXT,
  position    TEXT DEFAULT 'sidebar',
  is_active   BOOLEAN DEFAULT true,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  clicks      INT DEFAULT 0,
  impressions INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ads_public" ON advertisements;
DROP POLICY IF EXISTS "ads_auth_write" ON advertisements;
CREATE POLICY "ads_public" ON advertisements FOR SELECT USING (true);
CREATE POLICY "ads_auth_write" ON advertisements FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 8. ad_analytics ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID REFERENCES advertisements(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  user_ip     TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_analytics_insert" ON ad_analytics;
DROP POLICY IF EXISTS "ad_analytics_read" ON ad_analytics;
CREATE POLICY "ad_analytics_insert" ON ad_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "ad_analytics_read" ON ad_analytics FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── 9. tags ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    TEXT NOT NULL,
  name_en    TEXT,
  slug       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_public" ON tags;
CREATE POLICY "tags_public" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_auth_write" ON tags FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 10. article_tags ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "article_tags_public" ON article_tags;
CREATE POLICY "article_tags_public" ON article_tags FOR SELECT USING (true);
CREATE POLICY "article_tags_auth_write" ON article_tags FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 11. daily_views ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='daily_views' AND column_name='article_id') THEN
    ALTER TABLE daily_views ADD COLUMN article_id UUID REFERENCES articles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── 12. profiles: public read RLS ─────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_public" ON profiles;
DROP POLICY IF EXISTS "profiles_own_write" ON profiles;
CREATE POLICY "profiles_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_write" ON profiles FOR ALL USING (user_id = auth.uid());

-- ── 13. user_roles RLS ────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_read" ON user_roles;
DROP POLICY IF EXISTS "roles_service_write" ON user_roles;
CREATE POLICY "roles_read" ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "roles_service_write" ON user_roles FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 14. articles RLS ──────────────────────────────────────
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "articles_public_read" ON articles;
DROP POLICY IF EXISTS "articles_auth_write" ON articles;
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);
CREATE POLICY "articles_auth_write" ON articles FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 15. categories RLS ────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cats_public" ON categories;
DROP POLICY IF EXISTS "cats_auth_write" ON categories;
CREATE POLICY "cats_public" ON categories FOR SELECT USING (true);
CREATE POLICY "cats_auth_write" ON categories FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 16. breaking_news RLS ─────────────────────────────────
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "breaking_public" ON breaking_news;
DROP POLICY IF EXISTS "breaking_auth_write" ON breaking_news;
CREATE POLICY "breaking_public" ON breaking_news FOR SELECT USING (true);
CREATE POLICY "breaking_auth_write" ON breaking_news FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 17. site_settings RLS ─────────────────────────────────
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public" ON site_settings;
DROP POLICY IF EXISTS "settings_auth_write" ON site_settings;
CREATE POLICY "settings_public" ON site_settings FOR SELECT USING (true);
CREATE POLICY "settings_auth_write" ON site_settings FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 18. subscribers RLS ───────────────────────────────────
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_insert" ON subscribers;
DROP POLICY IF EXISTS "sub_auth_read" ON subscribers;
CREATE POLICY "sub_insert" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_auth_read" ON subscribers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sub_auth_write" ON subscribers FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 19. pages RLS ─────────────────────────────────────────
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pages_public" ON pages;
DROP POLICY IF EXISTS "pages_auth_write" ON pages;
CREATE POLICY "pages_public" ON pages FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "pages_auth_write" ON pages FOR ALL USING (auth.uid() IS NOT NULL);

-- ── 20. Auto-update trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 21. Auto-create profile on signup ────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 22. Default site_settings ─────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('site_name',         '"الشارع المصري"'),
  ('site_tagline',      '"أخبار مصر لحظة بلحظة"'),
  ('site_url',          '"https://egstreetnews.com"'),
  ('primary_color',     '"#e11d48"'),
  ('articles_per_page', '12'),
  ('enable_comments',   'true'),
  ('enable_newsletter', 'true'),
  ('facebook_url',      '""'),
  ('twitter_url',       '""'),
  ('youtube_url',       '""')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- ✅ Migration complete!
-- ════════════════════════════════════════════════════════════
