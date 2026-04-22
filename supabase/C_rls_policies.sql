-- ═══════════════════════════════════════════════════
-- PART C: RLS Policies على الجداول الموجودة
-- شغّل ده تالت  →  New Query → RUN
-- ═══════════════════════════════════════════════════

-- articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "arts_read"  ON articles;
DROP POLICY IF EXISTS "arts_write" ON articles;
CREATE POLICY "arts_read"  ON articles FOR SELECT
  USING (status = 'published' OR auth.uid() IS NOT NULL);
CREATE POLICY "arts_write" ON articles FOR ALL
  USING (auth.uid() IS NOT NULL);

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cats_read"  ON categories;
DROP POLICY IF EXISTS "cats_write" ON categories;
CREATE POLICY "cats_read"  ON categories FOR SELECT USING (true);
CREATE POLICY "cats_write" ON categories FOR ALL    USING (auth.uid() IS NOT NULL);

-- breaking_news
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bn_read"  ON breaking_news;
DROP POLICY IF EXISTS "bn_write" ON breaking_news;
CREATE POLICY "bn_read"  ON breaking_news FOR SELECT USING (true);
CREATE POLICY "bn_write" ON breaking_news FOR ALL    USING (auth.uid() IS NOT NULL);

-- profiles  ← user_id موجود هنا فعلاً ✅
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prof_read"  ON profiles;
DROP POLICY IF EXISTS "prof_write" ON profiles;
CREATE POLICY "prof_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "prof_write" ON profiles FOR ALL    USING (user_id = auth.uid());

-- user_roles  ← user_id موجود هنا فعلاً ✅
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_read"  ON user_roles;
DROP POLICY IF EXISTS "roles_write" ON user_roles;
CREATE POLICY "roles_read"  ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "roles_write" ON user_roles FOR ALL    USING (auth.uid() IS NOT NULL);

-- site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_read"  ON site_settings;
DROP POLICY IF EXISTS "settings_write" ON site_settings;
CREATE POLICY "settings_read"  ON site_settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON site_settings FOR ALL    USING (auth.uid() IS NOT NULL);

-- subscribers  ← مفيش user_id هنا ✅
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_insert" ON subscribers;
DROP POLICY IF EXISTS "sub_read"   ON subscribers;
DROP POLICY IF EXISTS "sub_write"  ON subscribers;
CREATE POLICY "sub_insert" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_read"   ON subscribers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sub_write"  ON subscribers FOR ALL    USING (auth.uid() IS NOT NULL);

-- pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pages_read"  ON pages;
DROP POLICY IF EXISTS "pages_write" ON pages;
CREATE POLICY "pages_read"  ON pages FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "pages_write" ON pages FOR ALL USING (auth.uid() IS NOT NULL);

-- comments  ← author_id مش user_id ✅
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "com_read"   ON comments;
DROP POLICY IF EXISTS "com_insert" ON comments;
DROP POLICY IF EXISTS "com_admin"  ON comments;
CREATE POLICY "com_read"   ON comments FOR SELECT
  USING (is_approved = true OR auth.uid() IS NOT NULL);
CREATE POLICY "com_insert" ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "com_admin"  ON comments FOR ALL
  USING (auth.uid() IS NOT NULL);
