-- ════════════════════════════════════════════════════════
--  EG STREET — New Features SQL
--  شغّل في SQL Editor
-- ════════════════════════════════════════════════════════

-- force_password_change flag في profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes        TEXT;

-- جدول الأدوار المخصصة
CREATE TABLE IF NOT EXISTS custom_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  label_ar    TEXT NOT NULL,
  color       TEXT DEFAULT '#6b7280',
  permissions JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_roles_read"  ON custom_roles;
DROP POLICY IF EXISTS "custom_roles_write" ON custom_roles;
CREATE POLICY "custom_roles_read"  ON custom_roles FOR SELECT USING (true);
CREATE POLICY "custom_roles_write" ON custom_roles FOR ALL USING (auth.uid() IS NOT NULL);

-- إضافة الأدوار الافتراضية
INSERT INTO custom_roles (name, label_ar, color, permissions) VALUES
  ('super_admin', 'سوبر أدمن',  '#dc2626', '["all"]'),
  ('admin',       'أدمن',       '#ea580c', '["articles","categories","users","settings","media","rss","ads"]'),
  ('editor',      'محرر',       '#2563eb', '["articles","categories","media"]'),
  ('author',      'كاتب',       '#16a34a', '["articles_own","media_own"]'),
  ('reader',      'قارئ',       '#6b7280', '[]')
ON CONFLICT (name) DO NOTHING;

-- جدول RSS sources للتحكم الكامل
CREATE TABLE IF NOT EXISTS rss_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT true,
  auto_publish BOOLEAN DEFAULT false,
  last_fetched TIMESTAMPTZ,
  fetch_count  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rss_read"  ON rss_sources;
DROP POLICY IF EXISTS "rss_write" ON rss_sources;
CREATE POLICY "rss_read"  ON rss_sources FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rss_write" ON rss_sources FOR ALL USING (auth.uid() IS NOT NULL);

-- Super Admin: dr@gohar.com
UPDATE user_roles SET role = 'super_admin' WHERE user_id = '50919c52-81ab-4b98-9a25-66cdaa405c16';
UPDATE profiles   SET display_name = 'د. جوهر' WHERE user_id = '50919c52-81ab-4b98-9a25-66cdaa405c16';

-- دالة: فحص force_password_change
CREATE OR REPLACE FUNCTION check_force_password_change(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT force_password_change FROM profiles WHERE user_id = uid LIMIT 1),
    false
  );
$$;
