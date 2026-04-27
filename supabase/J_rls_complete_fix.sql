-- ════════════════════════════════════════════════════════════
--  الشارع المصري — RLS FIX الشامل
--  يعدّي أي policy موجودة ويعيد بناءها بشكل صحيح
-- ════════════════════════════════════════════════════════════

-- ═══ Helper: دالة is_admin ═══
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin','editor_in_chief','journalist','ads_manager','moderator')
  );
$$;

-- ═══ 1. site_settings ═══
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_read"       ON public.site_settings;
DROP POLICY IF EXISTS "settings_write"      ON public.site_settings;
DROP POLICY IF EXISTS "settings_insert"     ON public.site_settings;
DROP POLICY IF EXISTS "settings_update"     ON public.site_settings;
DROP POLICY IF EXISTS "settings_delete"     ON public.site_settings;

CREATE POLICY "settings_read"   ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "settings_insert" ON public.site_settings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "settings_update" ON public.site_settings
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "settings_delete" ON public.site_settings
  FOR DELETE USING (public.is_admin());

-- ═══ 2. articles ═══
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "arts_read"  ON public.articles;
DROP POLICY IF EXISTS "arts_write" ON public.articles;
DROP POLICY IF EXISTS "arts_insert" ON public.articles;
DROP POLICY IF EXISTS "arts_update" ON public.articles;
DROP POLICY IF EXISTS "arts_delete" ON public.articles;

CREATE POLICY "arts_read"   ON public.articles
  FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "arts_insert" ON public.articles
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "arts_update" ON public.articles
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "arts_delete" ON public.articles
  FOR DELETE USING (public.is_admin());

-- ═══ 3. breaking_news ═══
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bn_read"   ON public.breaking_news;
DROP POLICY IF EXISTS "bn_write"  ON public.breaking_news;
DROP POLICY IF EXISTS "bn_insert" ON public.breaking_news;
DROP POLICY IF EXISTS "bn_update" ON public.breaking_news;
DROP POLICY IF EXISTS "bn_delete" ON public.breaking_news;

CREATE POLICY "bn_read"   ON public.breaking_news FOR SELECT USING (true);
CREATE POLICY "bn_insert" ON public.breaking_news FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "bn_update" ON public.breaking_news FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "bn_delete" ON public.breaking_news FOR DELETE USING (public.is_admin());

-- ═══ 4. categories ═══
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cats_read"   ON public.categories;
DROP POLICY IF EXISTS "cats_write"  ON public.categories;
DROP POLICY IF EXISTS "cats_insert" ON public.categories;
DROP POLICY IF EXISTS "cats_update" ON public.categories;
DROP POLICY IF EXISTS "cats_delete" ON public.categories;

CREATE POLICY "cats_read"   ON public.categories FOR SELECT USING (true);
CREATE POLICY "cats_insert" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "cats_update" ON public.categories FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cats_delete" ON public.categories FOR DELETE USING (public.is_admin());

-- ═══ 5. pages ═══
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pages_read"   ON public.pages;
DROP POLICY IF EXISTS "pages_write"  ON public.pages;
DROP POLICY IF EXISTS "pages_insert" ON public.pages;
DROP POLICY IF EXISTS "pages_update" ON public.pages;
DROP POLICY IF EXISTS "pages_delete" ON public.pages;

CREATE POLICY "pages_read"   ON public.pages FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "pages_insert" ON public.pages FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "pages_update" ON public.pages FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "pages_delete" ON public.pages FOR DELETE USING (public.is_admin());

-- ═══ 6. profiles ═══
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prof_read"   ON public.profiles;
DROP POLICY IF EXISTS "prof_write"  ON public.profiles;
DROP POLICY IF EXISTS "prof_insert" ON public.profiles;
DROP POLICY IF EXISTS "prof_update" ON public.profiles;

CREATE POLICY "prof_read"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "prof_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prof_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
-- super_admin can read all
CREATE POLICY "prof_admin_all" ON public.profiles FOR ALL
  USING (public.is_admin());

-- ═══ 7. user_roles ═══
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_read"   ON public.user_roles;
DROP POLICY IF EXISTS "roles_write"  ON public.user_roles;
DROP POLICY IF EXISTS "roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "roles_delete" ON public.user_roles;

CREATE POLICY "roles_read"   ON public.user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "roles_insert" ON public.user_roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "roles_update" ON public.user_roles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "roles_delete" ON public.user_roles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- ═══ 8. role_permissions ═══
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rp_read"   ON public.role_permissions;
DROP POLICY IF EXISTS "rp_write"  ON public.role_permissions;
DROP POLICY IF EXISTS "rp_insert" ON public.role_permissions;
DROP POLICY IF EXISTS "rp_delete" ON public.role_permissions;

CREATE POLICY "rp_read"   ON public.role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rp_insert" ON public.role_permissions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "rp_delete" ON public.role_permissions FOR DELETE USING (public.is_admin());

-- ═══ 9. subscribers ═══
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_insert" ON public.subscribers;
DROP POLICY IF EXISTS "sub_read"   ON public.subscribers;
DROP POLICY IF EXISTS "sub_write"  ON public.subscribers;

CREATE POLICY "sub_insert" ON public.subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_read"   ON public.subscribers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sub_delete" ON public.subscribers FOR DELETE USING (public.is_admin());

-- ═══ 10. comments ═══
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "com_read"   ON public.comments;
DROP POLICY IF EXISTS "com_insert" ON public.comments;
DROP POLICY IF EXISTS "com_admin"  ON public.comments;
DROP POLICY IF EXISTS "com_update" ON public.comments;

CREATE POLICY "com_read"   ON public.comments FOR SELECT
  USING (is_approved = true OR public.is_admin());
CREATE POLICY "com_insert" ON public.comments FOR INSERT
  WITH CHECK (true);
CREATE POLICY "com_update" ON public.comments FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "com_delete" ON public.comments FOR DELETE
  USING (public.is_admin());

-- ═══ 11. advertisements ═══
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advertisements') THEN
    EXECUTE 'ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "ads_read"   ON public.advertisements';
    EXECUTE 'DROP POLICY IF EXISTS "ads_write"  ON public.advertisements';
    EXECUTE 'DROP POLICY IF EXISTS "ads_insert" ON public.advertisements';
    EXECUTE $p$CREATE POLICY "ads_read"   ON public.advertisements FOR SELECT USING (is_active = true OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY "ads_insert" ON public.advertisements FOR INSERT WITH CHECK (public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY "ads_update" ON public.advertisements FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY "ads_delete" ON public.advertisements FOR DELETE USING (public.is_admin())$p$;
  END IF;
END $$;

-- ═══════════════════════════════════════════════
-- 12. STORAGE POLICIES — site-assets bucket
-- ═══════════════════════════════════════════════

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets', 'site-assets', true,
  5242880,  -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/x-icon']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Drop old storage policies
DROP POLICY IF EXISTS "site_assets_read"    ON storage.objects;
DROP POLICY IF EXISTS "site_assets_upload"  ON storage.objects;
DROP POLICY IF EXISTS "site_assets_update"  ON storage.objects;
DROP POLICY IF EXISTS "site_assets_delete"  ON storage.objects;
DROP POLICY IF EXISTS "assets_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "assets_admin_write"  ON storage.objects;
DROP POLICY IF EXISTS "assets_admin_delete" ON storage.objects;

-- Anyone can read public assets
CREATE POLICY "assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

-- Authenticated admins can upload
CREATE POLICY "assets_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-assets'
    AND public.is_admin()
  );

-- Authenticated admins can update/replace
CREATE POLICY "assets_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'site-assets'
    AND public.is_admin()
  );

-- Authenticated admins can delete
CREATE POLICY "assets_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'site-assets'
    AND public.is_admin()
  );

-- ═══════════════════════════════════════════════
-- 13. STORAGE POLICIES — media bucket (صور المقالات)
-- ═══════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true,
  10485760,  -- 10MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4']
) ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

DROP POLICY IF EXISTS "media_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "media_admin_upload"  ON storage.objects;
DROP POLICY IF EXISTS "media_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "media_admin_delete"  ON storage.objects;

CREATE POLICY "media_public_read"  ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND public.is_admin());
CREATE POLICY "media_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media' AND public.is_admin());
CREATE POLICY "media_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND public.is_admin());

-- ═══ تحديث Schema Cache ═══
NOTIFY pgrst, 'reload schema';

-- ═══ تحقق ═══
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('site_settings','articles','breaking_news','categories','pages')
ORDER BY tablename, cmd;
