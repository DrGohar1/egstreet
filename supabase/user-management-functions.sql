-- ══════════════════════════════════════════════════════════════
-- EgStreet — User Management SQL Functions
-- Run this in Supabase SQL Editor (once)
-- ══════════════════════════════════════════════════════════════

-- 1. user_permissions table (if not already created)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin_manage_perms" ON public.user_permissions;
CREATE POLICY "super_admin_manage_perms" ON public.user_permissions
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ));
GRANT ALL ON public.user_permissions TO authenticated;


-- 2. admin_get_users() — returns all users with role + article count
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id              uuid,
  email           text,
  display_name    text,
  username        text,
  avatar_url      text,
  phone           text,
  is_active       boolean,
  must_change_password boolean,
  created_at      timestamptz,
  last_sign_in    timestamptz,
  role            text,
  articles_count  bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super_admin can call this
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح بالوصول';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.email, u.email)::text,
    COALESCE(p.display_name, p.username, '')::text,
    COALESCE(p.username, '')::text,
    p.avatar_url::text,
    p.phone::text,
    COALESCE(p.is_active, true),
    COALESCE(p.must_change_password, false),
    p.created_at,
    u.last_sign_in_at,
    COALESCE(r.role, 'journalist')::text,
    COALESCE(ac.cnt, 0)
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN user_roles r ON r.user_id = p.id
  LEFT JOIN (
    SELECT author_id, COUNT(*) AS cnt FROM articles GROUP BY author_id
  ) ac ON ac.author_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;


-- 3. admin_update_user() — update profile, role, and/or password
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id        uuid,
  p_display_name   text      DEFAULT NULL,
  p_username       text      DEFAULT NULL,
  p_phone          text      DEFAULT NULL,
  p_role           text      DEFAULT NULL,
  p_new_password   text      DEFAULT NULL,
  p_is_active      boolean   DEFAULT NULL,
  p_must_change_pw boolean   DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح بالوصول';
  END IF;

  -- Update profile fields
  UPDATE profiles SET
    display_name       = COALESCE(p_display_name, display_name),
    username           = COALESCE(p_username, username),
    phone              = COALESCE(p_phone, phone),
    is_active          = COALESCE(p_is_active, is_active),
    must_change_password = COALESCE(p_must_change_pw, must_change_password)
  WHERE id = p_user_id;

  -- Update role
  IF p_role IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role) VALUES (p_user_id, p_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  -- Update password via auth.admin
  IF p_new_password IS NOT NULL AND p_new_password <> '' THEN
    UPDATE auth.users SET
      encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user TO authenticated;


-- 4. admin_toggle_active() — enable/disable user
CREATE OR REPLACE FUNCTION public.admin_toggle_active(
  p_user_id uuid,
  p_active  boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح بالوصول';
  END IF;
  UPDATE profiles SET is_active = p_active WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_toggle_active TO authenticated;


-- 5. admin_delete_user() — delete from auth.users (cascades to profiles)
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح بالوصول';
  END IF;
  -- Delete permissions first
  DELETE FROM user_permissions WHERE user_id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE id = p_user_id;
  -- Delete from auth
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;


-- ══ Done! ══
-- After running, test from UserManagement in the admin panel.
-- Make sure pgcrypto extension is enabled:
CREATE EXTENSION IF NOT EXISTS pgcrypto;
