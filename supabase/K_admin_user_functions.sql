-- ═══════════════════════════════════════════════════
--  admin_delete_user — حذف يوزر من auth + public tables
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- only super_admin can call this
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحية حذف المستخدمين';
  END IF;

  -- Delete public data first
  DELETE FROM public.user_roles  WHERE user_id = p_user_id;
  DELETE FROM public.profiles    WHERE user_id = p_user_id;
  DELETE FROM public.saved_articles WHERE user_id = p_user_id;
  DELETE FROM public.comments    WHERE author_id = p_user_id;

  -- Delete from auth (requires SECURITY DEFINER with postgres role)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════
--  admin_update_password — تغيير باسورد يوزر
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_update_password(p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'ليس لديك صلاحية تغيير كلمات المرور';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_password(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
