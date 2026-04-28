-- ══════════════════════════════════════════════════════════
--  O_users_system_fix.sql
--  1. تنظيف user_roles من الـ UUIDs الخاطئة
--  2. RPC: create_user, update_user_password, delete_user_full
--  3. RLS fixes
-- ══════════════════════════════════════════════════════════

-- ── 1. مسح user_roles الخاطئة (UUIDs مش موجودة في auth.users) ──
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ── 2. تأكد إن كل مستخدم عنده role ──
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'journalist'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ── 3. ربط profiles بـ auth.users (مزامنة email) ──
-- تأكد إن كل يوزر عنده profile
INSERT INTO public.profiles (id, username, display_name, email, is_active)
SELECT
  u.id,
  split_part(u.email, '@', 1),
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  u.email,
  true
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ── 4. حذف RPC القديمة إن وجدت وإعادة إنشائها ──
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_password(uuid, text);
DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);
DROP FUNCTION IF EXISTS public.admin_get_users();

-- ── 5. RPC: admin_get_users — جلب كل المستخدمين مع الأدوار ──
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id           uuid,
  email        text,
  display_name text,
  username     text,
  avatar_url   text,
  phone        text,
  is_active    boolean,
  must_change_password boolean,
  created_at   timestamptz,
  last_sign_in timestamptz,
  role         text,
  articles_count bigint
) SECURITY DEFINER AS $$
BEGIN
  -- Only super_admin can call this
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(p.display_name, split_part(u.email,'@',1)) as display_name,
    COALESCE(p.username, split_part(u.email,'@',1))     as username,
    p.avatar_url,
    p.phone,
    COALESCE(p.is_active, true)                          as is_active,
    COALESCE(p.must_change_password, false)              as must_change_password,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(r.role, 'journalist')::text                 as role,
    COALESCE(p.articles_count, 0)::bigint                as articles_count
  FROM auth.users u
  LEFT JOIN public.profiles   p ON p.id = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  ORDER BY u.created_at;
END;
$$ LANGUAGE plpgsql;

-- ── 6. RPC: admin_update_user — تحديث بيانات يوزر ──
DROP FUNCTION IF EXISTS public.admin_update_user(uuid, text, text, text, text, text, boolean);
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id    uuid,
  p_display_name text DEFAULT NULL,
  p_username   text DEFAULT NULL,
  p_phone      text DEFAULT NULL,
  p_role       text DEFAULT NULL,
  p_new_password text DEFAULT NULL,
  p_is_active  boolean DEFAULT NULL,
  p_must_change_pw boolean DEFAULT NULL
) RETURNS json SECURITY DEFINER AS $$
DECLARE v_result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update profile
  UPDATE public.profiles SET
    display_name        = COALESCE(p_display_name, display_name),
    username            = COALESCE(p_username, username),
    phone               = COALESCE(p_phone, phone),
    is_active           = COALESCE(p_is_active, is_active),
    must_change_password= COALESCE(p_must_change_pw, must_change_password),
    updated_at          = now()
  WHERE id = p_user_id;

  -- Update role
  IF p_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, p_role)
    ON CONFLICT (user_id) DO UPDATE SET role = p_role;
  END IF;

  -- Update password
  IF p_new_password IS NOT NULL AND length(p_new_password) >= 6 THEN
    UPDATE auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_user_id;
  END IF;

  SELECT json_build_object('success', true, 'user_id', p_user_id) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ── 7. RPC: admin_delete_user — حذف يوزر كامل ──
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS json SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'لا يمكنك حذف حسابك الخاص';
  END IF;

  DELETE FROM public.user_roles  WHERE user_id = p_user_id;
  DELETE FROM public.profiles    WHERE id      = p_user_id;
  DELETE FROM auth.users         WHERE id      = p_user_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ── 8. RPC: admin_toggle_active — تفعيل/تعطيل يوزر ──
DROP FUNCTION IF EXISTS public.admin_toggle_active(uuid, boolean);
CREATE OR REPLACE FUNCTION public.admin_toggle_active(p_user_id uuid, p_active boolean)
RETURNS json SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET is_active = p_active WHERE id = p_user_id;
  -- Also ban/unban in auth
  UPDATE auth.users SET banned_until = CASE WHEN p_active THEN NULL ELSE 'infinity'::timestamptz END
  WHERE id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ── 9. Grant execute to authenticated users ──
GRANT EXECUTE ON FUNCTION public.admin_get_users()        TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid,text,text,text,text,text,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_active(uuid,boolean) TO authenticated;

-- ── نتيجة ──
SELECT 'user_roles synced' as status, count(*)::text as count FROM public.user_roles
UNION ALL SELECT 'profiles synced', count(*)::text FROM public.profiles
UNION ALL SELECT 'auth.users total', count(*)::text FROM auth.users;
