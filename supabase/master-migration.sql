-- ══════════════════════════════════════════════════════════════════
-- MASTER MIGRATION — egstreet.news
-- Run this ONCE in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ╔══════════════════════════════╗
-- ║  1. Extensions               ║
-- ╚══════════════════════════════╝
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ╔══════════════════════════════╗
-- ║  2. Articles — Add Columns   ║
-- ╚══════════════════════════════╝
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS scheduled_at          timestamptz    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS featured_image_position text          DEFAULT 'center center',
  ADD COLUMN IF NOT EXISTS custom_author_name    text           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meta_title            text           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meta_description      text           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_breaking           boolean        DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured           boolean        DEFAULT false,
  ADD COLUMN IF NOT EXISTS article_number        bigint         DEFAULT NULL;

-- ╔══════════════════════════════╗
-- ║  3. Profiles — Add Columns   ║
-- ╚══════════════════════════════╝
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active             boolean        DEFAULT true,
  ADD COLUMN IF NOT EXISTS must_change_password  boolean        DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone                 text           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email                 text           DEFAULT NULL;

-- Sync email from auth.users into profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- ╔══════════════════════════════╗
-- ║  4. user_permissions         ║
-- ╚══════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission  text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, permission)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_perms"      ON public.user_permissions;
DROP POLICY IF EXISTS "super_admin_all_perms" ON public.user_permissions;
CREATE POLICY "users_own_perms" ON public.user_permissions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "super_admin_all_perms" ON public.user_permissions
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ));
GRANT ALL ON public.user_permissions TO authenticated;

-- ╔══════════════════════════════╗
-- ║  5. media                    ║
-- ╚══════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.media (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name   text        NOT NULL,
  file_path   text        NOT NULL,
  file_url    text        NOT NULL,
  file_type   text        NOT NULL DEFAULT 'image',
  file_size   bigint      DEFAULT 0,
  width       int         DEFAULT NULL,
  height      int         DEFAULT NULL,
  alt_text    text        DEFAULT NULL,
  caption     text        DEFAULT NULL,
  folder      text        DEFAULT 'general',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_auth_read"   ON public.media;
DROP POLICY IF EXISTS "media_auth_insert" ON public.media;
DROP POLICY IF EXISTS "media_auth_delete" ON public.media;
CREATE POLICY "media_auth_read"   ON public.media FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_auth_insert" ON public.media FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "media_auth_delete" ON public.media FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','editor_in_chief')
  ));
GRANT ALL ON public.media TO authenticated;

-- ╔══════════════════════════════╗
-- ║  6. user_roles RLS           ║
-- ╚══════════════════════════════╝
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_read"  ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin" ON public.user_roles;
CREATE POLICY "user_roles_read"  ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin" ON public.user_roles
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
GRANT ALL ON public.user_roles TO authenticated;

-- ╔══════════════════════════════╗
-- ║  7. profiles RLS             ║
-- ╚══════════════════════════════╝
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin"    ON public.profiles;
CREATE POLICY "profiles_own"      ON public.profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_admin"    ON public.profiles
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
GRANT ALL ON public.profiles TO authenticated;

-- ╔══════════════════════════════╗
-- ║  8. Supabase Storage Bucket  ║
-- ╚══════════════════════════════╝
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets', 'site-assets', true,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

DROP POLICY IF EXISTS "site_assets_read"   ON storage.objects;
DROP POLICY IF EXISTS "site_assets_upload" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_delete" ON storage.objects;
CREATE POLICY "site_assets_read"   ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "site_assets_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');
CREATE POLICY "site_assets_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets');

-- ╔══════════════════════════════╗
-- ║  9. RPC — admin_delete_user  ║
-- ╚══════════════════════════════╝
DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'غير مصرح بالوصول';
  END IF;
  DELETE FROM user_permissions WHERE user_id = p_user_id;
  DELETE FROM user_roles        WHERE user_id = p_user_id;
  DELETE FROM profiles          WHERE id = p_user_id;
  DELETE FROM auth.users        WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- ╔══════════════════════════════╗
-- ║  10. RPC — admin_update_user ║
-- ╚══════════════════════════════╝
DROP FUNCTION IF EXISTS public.admin_update_user(uuid,text,text,text,text,text,boolean,boolean);
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id        uuid,
  p_display_name   text    DEFAULT NULL,
  p_username       text    DEFAULT NULL,
  p_phone          text    DEFAULT NULL,
  p_role           text    DEFAULT NULL,
  p_new_password   text    DEFAULT NULL,
  p_is_active      boolean DEFAULT NULL,
  p_must_change_pw boolean DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'غير مصرح بالوصول';
  END IF;
  UPDATE profiles SET
    display_name         = COALESCE(p_display_name, display_name),
    username             = COALESCE(p_username, username),
    phone                = COALESCE(p_phone, phone),
    is_active            = COALESCE(p_is_active, is_active),
    must_change_password = COALESCE(p_must_change_pw, must_change_password)
  WHERE id = p_user_id;
  IF p_role IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role) VALUES (p_user_id, p_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  IF p_new_password IS NOT NULL AND p_new_password <> '' THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_user TO authenticated;

-- ╔══════════════════════════════╗
-- ║  11. Trigger: sync profile   ║
-- ╚══════════════════════════════╝
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    is_active    = true;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ╔══════════════════════════════╗
-- ║  12. Refresh schema cache    ║
-- ╚══════════════════════════════╝
NOTIFY pgrst, 'reload schema';

-- ╔══════════════════════════════╗
-- ║  13. Verify                  ║
-- ╚══════════════════════════════╝
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c2 WHERE c2.table_name = t.table_name AND c2.table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
