-- ═══════════════════════════════════════════════════════════════════════
-- Supabase Setup — Run this ONCE in Supabase SQL Editor
-- Project: neojditfucitnovcfspw | egst.vercel.app
-- ═══════════════════════════════════════════════════════════════════════

-- ── STEP 1: Fix the app_role enum (add missing values if needed) ──────
-- The current enum already has: super_admin, editor_in_chief, journalist, ads_manager
-- Only run the ALTER if you need to add more values:
-- ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'viewer';
-- NOTE: Do NOT add 'developer' unless needed — keep it as super_admin

-- ── STEP 2: Profiles table ────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ── STEP 3: user_roles table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  user_id    UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role NOT NULL DEFAULT 'journalist',
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin can manage user_roles" ON user_roles;
CREATE POLICY "super_admin can manage user_roles"
ON user_roles FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ── STEP 4: role_permissions table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  id         BIGSERIAL PRIMARY KEY,
  role       app_role NOT NULL,
  permission TEXT     NOT NULL,
  UNIQUE(role, permission)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin can manage role_permissions" ON role_permissions;
CREATE POLICY "super_admin can manage role_permissions"
ON role_permissions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Authenticated users can read permissions" ON role_permissions;
CREATE POLICY "Authenticated users can read permissions"
ON role_permissions FOR SELECT TO authenticated
USING (true);

-- ── STEP 5: Default permissions seed ─────────────────────────────────
INSERT INTO role_permissions (role, permission) VALUES
  ('super_admin',     'articles'),   ('super_admin',     'categories'),
  ('super_admin',     'tags'),        ('super_admin',     'breaking'),
  ('super_admin',     'media'),       ('super_admin',     'ads'),
  ('super_admin',     'analytics'),  ('super_admin',     'users'),
  ('super_admin',     'settings'),   ('super_admin',     'permissions'),
  ('editor_in_chief', 'articles'),   ('editor_in_chief', 'categories'),
  ('editor_in_chief', 'tags'),        ('editor_in_chief', 'breaking'),
  ('editor_in_chief', 'media'),       ('editor_in_chief', 'analytics'),
  ('journalist',      'articles'),   ('journalist',      'categories'),
  ('journalist',      'tags'),        ('journalist',      'media'),
  ('ads_manager',     'ads'),         ('ads_manager',     'media'),
  ('ads_manager',     'analytics')
ON CONFLICT DO NOTHING;

-- ── STEP 6: Supabase Storage bucket ──────────────────────────────────
-- Go to: Supabase Dashboard > Storage > New Bucket
-- Name: media | Public: ✓ enabled | Max size: 10MB

-- After creating bucket, run these policies:
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1] OR
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role='super_admin'));

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1] OR
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=auth.uid() AND ur.role='super_admin'));

-- ── STEP 7: Give yourself super_admin ────────────────────────────────
-- Replace YOUR_USER_ID with your actual UUID from auth.users
-- INSERT INTO user_roles (user_id, role, permissions)
-- VALUES ('YOUR_USER_ID', 'super_admin', '{"articles":true,"categories":true,"tags":true,"breaking":true,"media":true,"ads":true,"analytics":true,"users":true,"settings":true,"permissions":true}')
-- ON CONFLICT (user_id) DO UPDATE SET role='super_admin';
