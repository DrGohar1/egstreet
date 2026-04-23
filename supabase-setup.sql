-- ═══════════════════════════════════════════════════════════
-- Supabase Storage Setup: Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Create 'media' bucket (run via Supabase Dashboard or API)
-- Go to: Storage > New Bucket > name: "media", public: true

-- 2. RLS Policies for the media bucket:

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public read access to all files in media bucket
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);

-- 3. Make sure RLS is enabled on storage.objects (it is by default)

-- ═══════════════════════════════════════════════════════════
-- Profiles table avatar column (if not already exists)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- ═══════════════════════════════════════════════════════════
-- user_roles table (if not already exists)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin can manage user_roles"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('developer', 'super_admin')
  )
);

CREATE POLICY "Users can read own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- role_permissions table (global permissions matrix)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS role_permissions (
  id BIGSERIAL PRIMARY KEY,
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  UNIQUE(role, permission)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin can manage role_permissions"
ON role_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('developer', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can read permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════
-- Default permissions seed data
-- ═══════════════════════════════════════════════════════════
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
