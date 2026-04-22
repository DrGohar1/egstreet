-- ================================================================
--  EG STREET NEWS  |  MASTER MIGRATION  v3
--  شغّل الملف ده كله مرة واحدة في:
--  Supabase Dashboard -> SQL Editor -> New query -> RUN (Ctrl+Enter)
--  آمن تماماً: كل سطر بيشوف الأول لو موجود ولا لأ
-- ================================================================

-- ─────────────────────────────────────────────────────────────────
-- 1.  ARTICLES  ─  أعمدة SEO الناقصة
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS meta_title        TEXT,
  ADD COLUMN IF NOT EXISTS meta_description  TEXT;

-- ─────────────────────────────────────────────────────────────────
-- 2.  BREAKING_NEWS  ─  أعمدة slug + title الناقصة
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE breaking_news
  ADD COLUMN IF NOT EXISTS slug   TEXT,
  ADD COLUMN IF NOT EXISTS title  TEXT;

-- ─────────────────────────────────────────────────────────────────
-- 3.  SAVED_ARTICLES  ─  جدول جديد
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_articles (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  article_id  UUID         NOT NULL REFERENCES articles(id)    ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_own_select" ON saved_articles;
DROP POLICY IF EXISTS "saved_own_insert" ON saved_articles;
DROP POLICY IF EXISTS "saved_own_delete" ON saved_articles;
CREATE POLICY "saved_own_select" ON saved_articles FOR SELECT USING  (user_id = auth.uid());
CREATE POLICY "saved_own_insert" ON saved_articles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_own_delete" ON saved_articles FOR DELETE USING  (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- 4.  SHARE_TRACKING  ─  جدول جديد
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_tracking (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID         REFERENCES articles(id) ON DELETE CASCADE,
  platform    TEXT         NOT NULL,
  user_ip     TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "share_public_insert" ON share_tracking;
DROP POLICY IF EXISTS "share_admin_select"  ON share_tracking;
CREATE POLICY "share_public_insert" ON share_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "share_admin_select"  ON share_tracking FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 5.  AUTOMATION_LOGS  ─  جدول جديد
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  type                TEXT         NOT NULL,
  status              TEXT         NOT NULL DEFAULT 'success',
  message             TEXT,
  articles_processed  INT                   DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auto_logs_admin" ON automation_logs;
CREATE POLICY "auto_logs_admin" ON automation_logs USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 6.  MEDIA  ─  جدول جديد
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT         NOT NULL,
  filename     TEXT,
  size         INT,
  type         TEXT,
  uploaded_by  UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_public_read"  ON media;
DROP POLICY IF EXISTS "media_admin_write"  ON media;
CREATE POLICY "media_public_read"  ON media FOR SELECT USING (true);
CREATE POLICY "media_admin_write"  ON media FOR ALL    USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 7.  COMMENTS  ─  تأكيد الـ schema (لو الجدول فاضي بيتعمل صح)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID         NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT         NOT NULL,
  parent_id   UUID         REFERENCES comments(id) ON DELETE CASCADE,
  likes       INT                   DEFAULT 0,
  is_approved BOOLEAN               DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_public_read"   ON comments;
DROP POLICY IF EXISTS "comments_auth_insert"   ON comments;
DROP POLICY IF EXISTS "comments_admin_manage"  ON comments;
CREATE POLICY "comments_public_read"  ON comments FOR SELECT USING (is_approved = true OR auth.uid() IS NOT NULL);
CREATE POLICY "comments_auth_insert"  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_admin_manage" ON comments FOR ALL    USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 8.  ADVERTISEMENTS  ─  تأكيد الـ schema
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertisements (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar    TEXT,
  title_en    TEXT,
  image_url   TEXT,
  link_url    TEXT,
  position    TEXT                  DEFAULT 'sidebar',
  is_active   BOOLEAN               DEFAULT true,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  clicks      INT                   DEFAULT 0,
  impressions INT                   DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ads_public_read"   ON advertisements;
DROP POLICY IF EXISTS "ads_admin_write"   ON advertisements;
CREATE POLICY "ads_public_read"  ON advertisements FOR SELECT USING (true);
CREATE POLICY "ads_admin_write"  ON advertisements FOR ALL    USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 9.  AD_ANALYTICS  ─  تأكيد الـ schema
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_analytics (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       UUID         REFERENCES advertisements(id) ON DELETE CASCADE,
  event_type  TEXT         NOT NULL,
  user_ip     TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_anal_public_insert" ON ad_analytics;
DROP POLICY IF EXISTS "ad_anal_admin_read"    ON ad_analytics;
CREATE POLICY "ad_anal_public_insert" ON ad_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "ad_anal_admin_read"    ON ad_analytics FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 10.  TAGS + ARTICLE_TAGS  ─  تأكيد الـ schema
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT  NOT NULL,
  name_en     TEXT,
  slug        TEXT  UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_public_read"  ON tags;
DROP POLICY IF EXISTS "tags_admin_write"  ON tags;
CREATE POLICY "tags_public_read"  ON tags FOR SELECT USING (true);
CREATE POLICY "tags_admin_write"  ON tags FOR ALL    USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id  UUID  NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id      UUID  NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "art_tags_public_read"  ON article_tags;
DROP POLICY IF EXISTS "art_tags_admin_write"  ON article_tags;
CREATE POLICY "art_tags_public_read"  ON article_tags FOR SELECT USING (true);
CREATE POLICY "art_tags_admin_write"  ON article_tags FOR ALL    USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 11.  RLS  ─  باقي الجداول الموجودة
-- ─────────────────────────────────────────────────────────────────

-- articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "arts_public_read"  ON articles;
DROP POLICY IF EXISTS "arts_admin_write"  ON articles;
CREATE POLICY "arts_public_read" ON articles FOR SELECT
  USING (status = 'published' OR auth.uid() IS NOT NULL);
CREATE POLICY "arts_admin_write" ON articles FOR ALL
  USING (auth.uid() IS NOT NULL);

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cats_public_read"  ON categories;
DROP POLICY IF EXISTS "cats_admin_write"  ON categories;
CREATE POLICY "cats_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "cats_admin_write" ON categories FOR ALL    USING (auth.uid() IS NOT NULL);

-- breaking_news
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bn_public_read"   ON breaking_news;
DROP POLICY IF EXISTS "bn_admin_write"   ON breaking_news;
CREATE POLICY "bn_public_read"  ON breaking_news FOR SELECT USING (true);
CREATE POLICY "bn_admin_write"  ON breaking_news FOR ALL    USING (auth.uid() IS NOT NULL);

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prof_public_read"  ON profiles;
DROP POLICY IF EXISTS "prof_own_write"    ON profiles;
CREATE POLICY "prof_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "prof_own_write"   ON profiles FOR ALL    USING (user_id = auth.uid());

-- user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_auth_read"   ON user_roles;
DROP POLICY IF EXISTS "roles_admin_write" ON user_roles;
CREATE POLICY "roles_auth_read"   ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "roles_admin_write" ON user_roles FOR ALL    USING (auth.uid() IS NOT NULL);

-- site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public_read"  ON site_settings;
DROP POLICY IF EXISTS "settings_admin_write"  ON site_settings;
CREATE POLICY "settings_public_read"  ON site_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write"  ON site_settings FOR ALL    USING (auth.uid() IS NOT NULL);

-- subscribers
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_public_insert"  ON subscribers;
DROP POLICY IF EXISTS "sub_admin_read"     ON subscribers;
DROP POLICY IF EXISTS "sub_admin_write"    ON subscribers;
CREATE POLICY "sub_public_insert" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_admin_read"    ON subscribers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sub_admin_write"   ON subscribers FOR ALL    USING (auth.uid() IS NOT NULL);

-- pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pages_public_read"  ON pages;
DROP POLICY IF EXISTS "pages_admin_write"  ON pages;
CREATE POLICY "pages_public_read"  ON pages FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "pages_admin_write"  ON pages FOR ALL USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────
-- 12.  TRIGGERS
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_articles_updated_at ON articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name',
             split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- 13.  DEFAULT SITE SETTINGS
-- ─────────────────────────────────────────────────────────────────
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

-- ================================================================
--  تم بنجاح!
--  المتوقع: "Success. No rows returned."
-- ================================================================
