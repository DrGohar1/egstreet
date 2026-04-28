-- ════════════════════════════════════════════════
--  FINAL SECURITY HARDENING — RLS + Policies
-- ════════════════════════════════════════════════

-- ── 1. Enable RLS on critical tables ──
ALTER TABLE public.articles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements  ENABLE ROW LEVEL SECURITY;

-- ── 2. Helper: is_admin() ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin','editor_in_chief')
  );
$$;

-- ── 3. Helper: get_my_role() ──
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ── 4. ARTICLES policies ──
DROP POLICY IF EXISTS "articles_public_read"  ON public.articles;
DROP POLICY IF EXISTS "articles_auth_write"   ON public.articles;
DROP POLICY IF EXISTS "articles_admin_all"    ON public.articles;

CREATE POLICY "articles_public_read" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "articles_journalist_write" ON public.articles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    get_my_role() IN ('super_admin','editor_in_chief','journalist')
  );

CREATE POLICY "articles_own_update" ON public.articles
  FOR UPDATE USING (
    author_id = auth.uid() OR is_admin()
  );

CREATE POLICY "articles_admin_delete" ON public.articles
  FOR DELETE USING (is_admin());

-- ── 5. CATEGORIES — public read, admin write ──
DROP POLICY IF EXISTS "categories_public_read"  ON public.categories;
DROP POLICY IF EXISTS "categories_admin_write"  ON public.categories;

CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (is_admin());

-- ── 6. PAGES — public read active, admin write ──
DROP POLICY IF EXISTS "pages_public_read"  ON public.pages;
DROP POLICY IF EXISTS "pages_admin_write"  ON public.pages;

CREATE POLICY "pages_public_read" ON public.pages
  FOR SELECT USING (is_active = true);

CREATE POLICY "pages_admin_write" ON public.pages
  FOR ALL USING (is_admin());

-- ── 7. SITE_SETTINGS — public read, super_admin write ──
DROP POLICY IF EXISTS "settings_public_read"  ON public.site_settings;
DROP POLICY IF EXISTS "settings_admin_write"  ON public.site_settings;

CREATE POLICY "settings_public_read" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "settings_super_admin_write" ON public.site_settings
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── 8. USER_ROLES — only super_admin can manage ──
DROP POLICY IF EXISTS "roles_self_read"   ON public.user_roles;
DROP POLICY IF EXISTS "roles_admin_all"   ON public.user_roles;

CREATE POLICY "roles_self_read" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR get_my_role() = 'super_admin');

CREATE POLICY "roles_super_admin_write" ON public.user_roles
  FOR ALL USING (get_my_role() = 'super_admin');

-- ── 9. SUBSCRIBERS — auth users read, anyone insert ──
DROP POLICY IF EXISTS "subscribers_insert"    ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_read" ON public.subscribers;

CREATE POLICY "subscribers_anyone_insert" ON public.subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "subscribers_admin_read" ON public.subscribers
  FOR SELECT USING (is_admin());

CREATE POLICY "subscribers_admin_delete" ON public.subscribers
  FOR DELETE USING (is_admin());

-- ── 10. COMMENTS ──
DROP POLICY IF EXISTS "comments_public_read"  ON public.comments;
DROP POLICY IF EXISTS "comments_insert"       ON public.comments;
DROP POLICY IF EXISTS "comments_admin_manage" ON public.comments;

CREATE POLICY "comments_approved_read" ON public.comments
  FOR SELECT USING (is_approved = true OR is_admin());

CREATE POLICY "comments_anyone_insert" ON public.comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "comments_admin_manage" ON public.comments
  FOR ALL USING (is_admin());

-- ── 11. TAGS ──
DROP POLICY IF EXISTS "tags_public" ON public.tags;
CREATE POLICY "tags_public_read"  ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_admin_write"  ON public.tags FOR ALL    USING (is_admin());

-- ── 12. ADVERTISEMENTS ──
DROP POLICY IF EXISTS "ads_public_read"  ON public.advertisements;
DROP POLICY IF EXISTS "ads_admin_write"  ON public.advertisements;

CREATE POLICY "ads_active_read" ON public.advertisements
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "ads_admin_write" ON public.advertisements
  FOR ALL USING (
    get_my_role() IN ('super_admin','editor_in_chief','ads_manager')
  );

-- ── 13. Verify ──
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;
