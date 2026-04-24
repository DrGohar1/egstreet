-- ═══════════════════════════════════════════════════════════════════════
-- EGSTREET MEGA SQL — Run Once in Supabase SQL Editor
-- Covers: articles, categories, users, settings, SEO, automation,
--         breaking news, push notifications, archive, sitemap, scraper
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. ARTICLES table — full production schema ──────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT        NOT NULL,
  slug              TEXT        UNIQUE NOT NULL,
  excerpt           TEXT,
  content           TEXT,
  featured_image    TEXT,
  status            TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  is_featured       BOOLEAN     DEFAULT false,
  is_breaking       BOOLEAN     DEFAULT false,
  views             INTEGER     DEFAULT 0,
  category_id       UUID        REFERENCES categories(id) ON DELETE SET NULL,
  author_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  custom_author_name TEXT,
  custom_author_image TEXT,
  tags              TEXT[]      DEFAULT '{}',
  meta_title        TEXT,
  meta_description  TEXT,
  meta_keywords     TEXT,
  og_image          TEXT,
  reading_time      INTEGER     DEFAULT 1,
  allow_comments    BOOLEAN     DEFAULT true,
  is_sponsored      BOOLEAN     DEFAULT false,
  source_url        TEXT,
  source_name       TEXT,
  language          TEXT        DEFAULT 'ar',
  published_at      TIMESTAMPTZ,
  scheduled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 1;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS custom_author_image TEXT;

-- ── 2. CATEGORIES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT    NOT NULL,
  name_en     TEXT    NOT NULL,
  slug        TEXT    UNIQUE NOT NULL,
  description TEXT,
  color       TEXT    DEFAULT '#c41e2a',
  icon        TEXT,
  parent_id   UUID    REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  seo_title   TEXT,
  seo_desc    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_desc TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- ── 3. TAGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. ARTICLE_TAGS pivot ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ── 5. BREAKING NEWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS breaking_news (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT    NOT NULL,
  slug       TEXT,
  url        TEXT,
  is_active  BOOLEAN DEFAULT true,
  priority   INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE breaking_news ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE breaking_news ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ── 6. USER ROLES & PERMISSIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        app_role NOT NULL DEFAULT 'journalist',
  permissions JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id         BIGSERIAL PRIMARY KEY,
  role       app_role NOT NULL,
  permission TEXT NOT NULL,
  UNIQUE(role, permission)
);

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own role" ON user_roles;
CREATE POLICY "Users read own role" ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "super_admin manages roles" ON user_roles;
CREATE POLICY "super_admin manages roles" ON user_roles FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role='super_admin'));

DROP POLICY IF EXISTS "Public read permissions" ON role_permissions;
CREATE POLICY "Public read permissions" ON role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "super_admin manages permissions" ON role_permissions;
CREATE POLICY "super_admin manages permissions" ON role_permissions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role='super_admin'));

-- Seed role permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('super_admin','articles'),('super_admin','categories'),('super_admin','tags'),
  ('super_admin','breaking'),('super_admin','media'),('super_admin','ads'),
  ('super_admin','analytics'),('super_admin','users'),('super_admin','settings'),
  ('super_admin','permissions'),('super_admin','backup'),('super_admin','ai'),
  ('editor_in_chief','articles'),('editor_in_chief','categories'),('editor_in_chief','tags'),
  ('editor_in_chief','breaking'),('editor_in_chief','media'),('editor_in_chief','analytics'),
  ('editor_in_chief','backup'),('editor_in_chief','ai'),
  ('journalist','articles'),('journalist','categories'),('journalist','tags'),('journalist','media'),('journalist','ai'),
  ('ads_manager','ads'),('ads_manager','media'),('ads_manager','analytics')
ON CONFLICT DO NOTHING;

-- ── 7. SITE SETTINGS — key/value store ───────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT    UNIQUE NOT NULL,
  value      TEXT    NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON site_settings;
CREATE POLICY "Public read settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "super_admin manage settings" ON site_settings;
CREATE POLICY "super_admin manage settings" ON site_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role IN ('super_admin','editor_in_chief')));

-- Seed default settings
INSERT INTO site_settings (key, value) VALUES
  ('site_name_ar',       'جريدة الشارع المصري'),
  ('site_name_en',       'EgStreet News'),
  ('site_description_ar','جريدة الشارع المصري — أخبار مصر والعالم لحظة بلحظة'),
  ('site_description_en','Egypt Street — Egyptian and Arab news live'),
  ('site_url',           'https://egst.vercel.app'),
  ('logo_url',           ''),
  ('favicon_url',        ''),
  ('og_default_image',   ''),
  ('primary_color',      '3 95% 42%'),
  ('font_family',        'Cairo'),
  ('facebook_url',       ''),
  ('twitter_url',        ''),
  ('youtube_url',        ''),
  ('instagram_url',      ''),
  ('tiktok_url',         ''),
  ('whatsapp_url',       ''),
  ('telegram_url',       ''),
  ('developer_name',     'GoharTech'),
  ('developer_url',      'https://wa.me/201001234567'),
  ('google_analytics',   ''),
  ('google_tag_manager', ''),
  ('adsense_client',     ''),
  ('footer_text_ar',     'جميع الحقوق محفوظة'),
  ('footer_text_en',     'All rights reserved'),
  ('breaking_speed',     '4500'),
  ('articles_per_page',  '12'),
  ('enable_comments',    'true'),
  ('enable_newsletter',  'true'),
  ('maintenance_mode',   'false'),
  ('rss_feeds',          '[]'),
  ('push_vapid_public',  ''),
  ('smtp_host',          ''),
  ('smtp_port',          '587'),
  ('smtp_user',          ''),
  ('smtp_pass',          ''),
  ('smtp_from',          '')
ON CONFLICT (key) DO NOTHING;

-- ── 8. AUTOMATION LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  type               TEXT    NOT NULL,
  status             TEXT    NOT NULL DEFAULT 'success',
  message            TEXT,
  articles_processed INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin reads automation" ON automation_logs;
CREATE POLICY "super_admin reads automation" ON automation_logs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role IN ('super_admin','editor_in_chief')));

-- ── 9. SUBSCRIBERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT    UNIQUE NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  confirmed    BOOLEAN DEFAULT false,
  source       TEXT    DEFAULT 'footer',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'footer';

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone subscribes" ON subscribers;
CREATE POLICY "Anyone subscribes" ON subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "super_admin reads subscribers" ON subscribers;
CREATE POLICY "super_admin reads subscribers" ON subscribers FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role IN ('super_admin','editor_in_chief')));

-- ── 10. COMMENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID    REFERENCES articles(id) ON DELETE CASCADE,
  user_id     UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name  TEXT,
  guest_email TEXT,
  content     TEXT    NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  parent_id   UUID    REFERENCES comments(id) ON DELETE CASCADE,
  likes       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read approved comments" ON comments;
CREATE POLICY "Public read approved comments" ON comments FOR SELECT USING (is_approved = true);
DROP POLICY IF EXISTS "Auth users comment" ON comments;
CREATE POLICY "Auth users comment" ON comments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Guests comment" ON comments;
CREATE POLICY "Guests comment" ON comments FOR INSERT TO anon WITH CHECK (guest_name IS NOT NULL AND guest_email IS NOT NULL);

-- ── 11. ADVERTISEMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertisements (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT    NOT NULL,
  image_url   TEXT,
  target_url  TEXT,
  position    TEXT    NOT NULL DEFAULT 'sidebar' CHECK (position IN ('header','sidebar','article-top','article-bottom','footer','popup')),
  is_active   BOOLEAN DEFAULT true,
  views       INTEGER DEFAULT 0,
  clicks      INTEGER DEFAULT 0,
  start_date  DATE,
  end_date    DATE,
  weight      INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;

-- ── 12. PUSH SUBSCRIPTIONS (Web Push) ────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint    TEXT  UNIQUE NOT NULL,
  p256dh      TEXT  NOT NULL,
  auth_key    TEXT  NOT NULL,
  user_id     UUID  REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone subscribes push" ON push_subscriptions;
CREATE POLICY "Anyone subscribes push" ON push_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "User reads own push" ON push_subscriptions;
CREATE POLICY "User reads own push" ON push_subscriptions FOR SELECT TO authenticated USING (user_id=auth.uid() OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role='super_admin'));

-- ── 13. SAVED ARTICLES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_articles (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage saved" ON saved_articles;
CREATE POLICY "Users manage saved" ON saved_articles FOR ALL TO authenticated USING (user_id=auth.uid());

-- ── 14. PROFILES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username     TEXT UNIQUE,
  bio          TEXT,
  avatar_url   TEXT,
  email        TEXT,
  website      TEXT,
  twitter      TEXT,
  facebook     TEXT,
  articles_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR ALL TO authenticated USING (id=auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Auto-update articles updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- ── 15. ARTICLE VIEWS increment function ─────────────────────────────
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE articles SET views = views + 1 WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 16. TRENDING ARTICLES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trending_articles (
  article_id UUID PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  score      FLOAT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update trending score
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
  INSERT INTO trending_articles (article_id, score, updated_at)
  SELECT id,
    (views * 0.4 + 
     EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / -3600.0 * 0.6
    ) as score,
    NOW()
  FROM articles WHERE status='published' AND published_at > NOW() - INTERVAL '7 days'
  ON CONFLICT (article_id) DO UPDATE 
    SET score=EXCLUDED.score, updated_at=NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 17. RLS for articles, categories, etc. ────────────────────────────
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads published articles" ON articles;
CREATE POLICY "Public reads published articles" ON articles FOR SELECT
USING (status='published' OR auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role IN ('super_admin','editor_in_chief','journalist')));

DROP POLICY IF EXISTS "Journalists manage own articles" ON articles;
CREATE POLICY "Journalists manage own articles" ON articles FOR ALL TO authenticated
USING (author_id=auth.uid() OR
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role IN ('super_admin','editor_in_chief')));

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads categories" ON categories;
CREATE POLICY "Public reads categories" ON categories FOR SELECT USING (is_active=true OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid()));

DROP POLICY IF EXISTS "Admins manage categories" ON categories;
CREATE POLICY "Admins manage categories" ON categories FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role IN ('super_admin','editor_in_chief')));

ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads breaking" ON breaking_news;
CREATE POLICY "Public reads breaking" ON breaking_news FOR SELECT USING (is_active=true);
DROP POLICY IF EXISTS "Admins manage breaking" ON breaking_news;
CREATE POLICY "Admins manage breaking" ON breaking_news FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role IN ('super_admin','editor_in_chief','journalist')));

-- ── 18. STORAGE — media bucket policies ──────────────────────────────
-- Run AFTER creating bucket "media" as public in Dashboard > Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public=true, file_size_limit=10485760;

DROP POLICY IF EXISTS "Auth upload to media" ON storage.objects;
CREATE POLICY "Auth upload to media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='media');

DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media" ON storage.objects FOR SELECT TO public
USING (bucket_id='media');

DROP POLICY IF EXISTS "Auth update media" ON storage.objects;
CREATE POLICY "Auth update media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='media');

DROP POLICY IF EXISTS "Auth delete media" ON storage.objects;
CREATE POLICY "Auth delete media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='media' AND (auth.uid()::text = (storage.foldername(name))[1] OR
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role='super_admin')));

-- ── 19. GIVE YOURSELF super_admin ────────────────────────────────────
-- After running this, go to Supabase > Auth > Users, copy your UUID, then run:
-- INSERT INTO user_roles (user_id, role, permissions)
-- VALUES ('YOUR-UUID-HERE', 'super_admin', '{"articles":true,"categories":true,"tags":true,"breaking":true,"media":true,"ads":true,"analytics":true,"users":true,"settings":true,"permissions":true,"backup":true,"ai":true}')
-- ON CONFLICT (user_id) DO UPDATE SET role='super_admin',
-- permissions='{"articles":true,"categories":true,"tags":true,"breaking":true,"media":true,"ads":true,"analytics":true,"users":true,"settings":true,"permissions":true,"backup":true,"ai":true}';

-- ── DONE ─────────────────────────────────────────────────────────────
-- Verify with:
-- SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
