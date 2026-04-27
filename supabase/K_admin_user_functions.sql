-- ═══════════════════════════════════════════════════════
--  K — إدارة المستخدمين: دوال admin_delete_user + admin_update_password
--  شغّل في Supabase → SQL Editor → New Query → RUN
-- ═══════════════════════════════════════════════════════

-- ══ 1. حذف يوزر كامل (profiles + user_roles + auth.users) ══
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN RAISE EXCEPTION 'ليس لديك صلاحية حذف المستخدمين'; END IF;

  DELETE FROM public.user_roles    WHERE user_id = p_user_id;
  DELETE FROM public.profiles      WHERE user_id = p_user_id;
  DELETE FROM public.saved_articles WHERE user_id = p_user_id;
  DELETE FROM public.comments      WHERE author_id = p_user_id;
  DELETE FROM auth.users           WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- ══ 2. تغيير باسورد يوزر ══
CREATE OR REPLACE FUNCTION public.admin_update_password(p_user_id uuid, p_new_password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN RAISE EXCEPTION 'ليس لديك صلاحية تغيير كلمات المرور'; END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
  WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_password(uuid, text) TO authenticated;

-- ══ 3. تحقق ══
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name IN ('admin_delete_user','admin_update_password','admin_create_user','is_admin');

NOTIFY pgrst, 'reload schema';
