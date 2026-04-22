-- PART 3: Fix RLS on existing tables
-- Run this third

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_public   ON profiles;
DROP POLICY IF EXISTS profiles_own      ON profiles;
DROP POLICY IF EXISTS profiles_own_write ON profiles;
CREATE POLICY profiles_public ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_own    ON profiles FOR ALL    USING (user_id = auth.uid());

-- articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS arts_public       ON articles;
DROP POLICY IF EXISTS arts_write        ON articles;
DROP POLICY IF EXISTS articles_public_read ON articles;
DROP POLICY IF EXISTS articles_auth_write  ON articles;
CREATE POLICY arts_public ON articles FOR SELECT
  USING (status = 'published' OR auth.uid() IS NOT NULL);
CREATE POLICY arts_write  ON articles FOR ALL
  USING (auth.uid() IS NOT NULL);

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cats_public ON categories;
DROP POLICY IF EXISTS cats_write  ON categories;
CREATE POLICY cats_public ON categories FOR SELECT USING (true);
CREATE POLICY cats_write  ON categories FOR ALL    USING (auth.uid() IS NOT NULL);

-- breaking_news
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS breaking_public ON breaking_news;
DROP POLICY IF EXISTS breaking_write  ON breaking_news;
CREATE POLICY breaking_public ON breaking_news FOR SELECT USING (true);
CREATE POLICY breaking_write  ON breaking_news FOR ALL    USING (auth.uid() IS NOT NULL);

-- user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS roles_read  ON user_roles;
DROP POLICY IF EXISTS roles_write ON user_roles;
CREATE POLICY roles_read  ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY roles_write ON user_roles FOR ALL    USING (auth.uid() IS NOT NULL);

-- site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS settings_public ON site_settings;
DROP POLICY IF EXISTS settings_write  ON site_settings;
CREATE POLICY settings_public ON site_settings FOR SELECT USING (true);
CREATE POLICY settings_write  ON site_settings FOR ALL    USING (auth.uid() IS NOT NULL);

-- subscribers
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sub_insert ON subscribers;
DROP POLICY IF EXISTS sub_read   ON subscribers;
DROP POLICY IF EXISTS sub_write  ON subscribers;
CREATE POLICY sub_insert ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY sub_read   ON subscribers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY sub_write  ON subscribers FOR ALL    USING (auth.uid() IS NOT NULL);

-- pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pages_public ON pages;
DROP POLICY IF EXISTS pages_write  ON pages;
CREATE POLICY pages_public ON pages FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY pages_write  ON pages FOR ALL
  USING (auth.uid() IS NOT NULL);
