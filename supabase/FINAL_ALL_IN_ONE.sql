-- ══════════════════════════════════════════════════════════════════
--  FINAL_ALL_IN_ONE.sql  (v3 — FIXED)
--  profiles جدول عنده id (PK خاص) و user_id (FK → auth.users)
-- ══════════════════════════════════════════════════════════════════

-- ════════════════════════════════
--  STEP 1 — تنظيف user_roles
-- ════════════════════════════════
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ════════════════════════════════
--  STEP 2 — مزامنة profiles (الصح)
--  id = UUID جديد، user_id = id من auth.users
-- ════════════════════════════════
INSERT INTO public.profiles (id, user_id, username, display_name, email, is_active)
SELECT
  gen_random_uuid(),
  u.id,
  split_part(u.email, '@', 1),
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1)),
  u.email,
  true
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════
--  STEP 3 — كل يوزر ياخد دور
-- ════════════════════════════════
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'journalist'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ════════════════════════════════
--  STEP 4 — site_settings
-- ════════════════════════════════
INSERT INTO public.site_settings (key, value) VALUES
  ('chief_editor_name',   'محمد جوهر'),
  ('chief_editor_title',  'رئيس التحرير'),
  ('newspaper_address',   'القاهرة، جمهورية مصر العربية'),
  ('newspaper_phone',     '+20 10 0000 0000'),
  ('newspaper_email',     'info@egstreetnews.com'),
  ('ads_email',           'ads@egstreetnews.com'),
  ('newsletter_text',     'اشترك واحصل على أبرز الأخبار يومياً'),
  ('weather_city',        'القاهرة'),
  ('newsapi_key',         ''),
  ('gnews_key',           ''),
  ('mediastack_key',      ''),
  ('facebook_url',        ''),
  ('twitter_url',         ''),
  ('instagram_url',       ''),
  ('youtube_url',         ''),
  ('live_url',            '')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════
--  STEP 5 — صفحات ثابتة
-- ════════════════════════════════
INSERT INTO public.pages (title_ar, title_en, slug, content_ar, is_active) VALUES
  ('من نحن',           'About',     'about',
   '<h2>جريدة الشارع المصري</h2><p>جريدة إلكترونية متخصصة في أخبار مصر والعالم.</p>', true),
  ('اتصل بنا',         'Contact',   'contact',
   '<h2>تواصل معنا</h2><p>البريد: info@egstreetnews.com</p>', true),
  ('أعلن معنا',        'Advertise', 'advertise',
   '<h2>إعلن معنا</h2><p>ads@egstreetnews.com</p>', true),
  ('سياسة الخصوصية',  'Privacy',   'privacy',
   '<h2>سياسة الخصوصية</h2><p>نحن نلتزم بحماية خصوصيتك.</p>', true),
  ('الشروط والأحكام', 'Terms',     'terms',
   '<h2>الشروط والأحكام</h2><p>باستخدامك للموقع توافق على الشروط.</p>', true)
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════
--  STEP 6 — أقسام إضافية
-- ════════════════════════════════
INSERT INTO public.categories (name_ar, name_en, slug, sort_order, is_active) VALUES
  ('حوادث',  'Accidents', 'accidents',  8,  true),
  ('صحة',    'Health',    'health',     9,  true),
  ('منوعات', 'Misc',      'misc',       10, true),
  ('محليات', 'Local',     'local',      11, true)
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════
--  STEP 7 — RPC: admin_get_users
-- ════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id                   uuid,
  email                text,
  display_name         text,
  username             text,
  avatar_url           text,
  phone                text,
  is_active            boolean,
  must_change_password boolean,
  created_at           timestamptz,
  last_sign_in         timestamptz,
  role                 text,
  articles_count       bigint
) SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
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
    COALESCE(p.display_name, split_part(u.email,'@',1))  AS display_name,
    COALESCE(p.username,     split_part(u.email,'@',1))  AS username,
    p.avatar_url,
    p.phone,
    COALESCE(p.is_active,            true)               AS is_active,
    COALESCE(p.must_change_password, false)              AS must_change_password,
    u.created_at,
    u.last_sign_in_at                                    AS last_sign_in,
    COALESCE(r.role, 'journalist')::text                 AS role,
    COALESCE(p.articles_count, 0)::bigint                AS articles_count
  FROM auth.users       u
  LEFT JOIN public.profiles   p ON p.user_id  = u.id
  LEFT JOIN public.user_roles r ON r.user_id  = u.id
  ORDER BY u.created_at ASC;
END;
$$;

-- ════════════════════════════════
--  STEP 8 — RPC: admin_update_user
-- ════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id        uuid,
  p_display_name   text    DEFAULT NULL,
  p_username       text    DEFAULT NULL,
  p_phone          text    DEFAULT NULL,
  p_role           text    DEFAULT NULL,
  p_new_password   text    DEFAULT NULL,
  p_is_active      boolean DEFAULT NULL,
  p_must_change_pw boolean DEFAULT NULL
) RETURNS json SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles SET
    display_name         = COALESCE(p_display_name,   display_name),
    username             = COALESCE(p_username,        username),
    phone                = COALESCE(p_phone,           phone),
    is_active            = COALESCE(p_is_active,       is_active),
    must_change_password = COALESCE(p_must_change_pw,  must_change_password),
    updated_at           = now()
  WHERE user_id = p_user_id;

  IF p_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  IF p_new_password IS NOT NULL AND length(trim(p_new_password)) >= 6 THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_user_id;
  END IF;

  RETURN json_build_object('success', true, 'user_id', p_user_id::text);
END;
$$;

-- ════════════════════════════════
--  STEP 9 — RPC: admin_delete_user
-- ════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS json SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'لا يمكنك حذف حسابك الخاص';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.profiles   WHERE user_id = p_user_id;
  DELETE FROM auth.users        WHERE id      = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ════════════════════════════════
--  STEP 10 — RPC: admin_toggle_active
-- ════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_toggle_active(p_user_id uuid, p_active boolean)
RETURNS json SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
  SET is_active = p_active
  WHERE user_id = p_user_id;

  UPDATE auth.users
  SET banned_until = CASE WHEN p_active THEN NULL ELSE 'infinity'::timestamptz END
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'active', p_active);
END;
$$;

-- ════════════════════════════════
--  STEP 11 — Grant execute
-- ════════════════════════════════
GRANT EXECUTE ON FUNCTION public.admin_get_users()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid,text,text,text,text,text,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_active(uuid,boolean) TO authenticated;

-- ════════════════════════════════
--  ✅ FINAL CHECK — تقرير شامل
-- ════════════════════════════════
SELECT '✅ auth.users'    AS الجدول, count(*)::text AS العدد FROM auth.users
UNION ALL SELECT '✅ profiles',              count(*)::text FROM public.profiles
UNION ALL SELECT '✅ user_roles',            count(*)::text FROM public.user_roles
UNION ALL SELECT '✅ categories',            count(*)::text FROM public.categories
UNION ALL SELECT '✅ pages',                 count(*)::text FROM public.pages
UNION ALL SELECT '✅ site_settings',         count(*)::text FROM public.site_settings
UNION ALL SELECT '✅ articles',              count(*)::text FROM public.articles
UNION ALL SELECT '✅ RPC admin_get_users',
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='admin_get_users')
  THEN 'موجودة ✅' ELSE 'مش موجودة ❌' END
UNION ALL SELECT '✅ RPC admin_delete_user',
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='admin_delete_user')
  THEN 'موجودة ✅' ELSE 'مش موجودة ❌' END
UNION ALL SELECT '✅ RPC admin_update_user',
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='admin_update_user')
  THEN 'موجودة ✅' ELSE 'مش موجودة ❌' END
ORDER BY 1;
