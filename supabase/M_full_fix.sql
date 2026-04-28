-- ══════════════════════════════════════════════════════
--  M_full_fix.sql — إصلاح شامل: roles + pages + settings
-- ══════════════════════════════════════════════════════

-- ── 1. مسح user_roles القديمة الخاطئة ──
DELETE FROM public.user_roles;

-- ── 2. إعادة ربط الأدوار بالـ UIDs الصح من auth.users ──
-- Super Admin: Gohar
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email ILIKE '%gohar%' OR raw_user_meta_data->>'username' ILIKE '%gohar%'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Editor in Chief: محمد (الأكبر uid)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'editor_in_chief'
FROM auth.users
WHERE (raw_user_meta_data->>'display_name' ILIKE '%Mohamed%'
   OR raw_user_meta_data->>'username' ILIKE '%Mohamed%')
AND id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin')
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'editor_in_chief';

-- Journalists: الباقين
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'journalist'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ── 3. إضافة site_settings مفقودة ──
INSERT INTO public.site_settings (key, value) VALUES
  ('chief_editor_name',    'محمد جوهر'),
  ('chief_editor_title',   'رئيس التحرير'),
  ('newspaper_address',    'القاهرة، جمهورية مصر العربية'),
  ('newspaper_phone',      '+20 10 0000 0000'),
  ('newspaper_email',      'info@egstreetnews.com'),
  ('ads_email',            'ads@egstreetnews.com'),
  ('facebook_url',         ''),
  ('twitter_url',          ''),
  ('instagram_url',        ''),
  ('youtube_url',          ''),
  ('tiktok_url',           ''),
  ('whatsapp_url',         ''),
  ('telegram_url',         ''),
  ('newsletter_text',      'اشترك واحصل على أبرز الأخبار يومياً على بريدك الإلكتروني'),
  ('weather_city',         'القاهرة')
ON CONFLICT (key) DO NOTHING;

-- ── 4. إضافة صفحات ثابتة ──
INSERT INTO public.pages (title_ar, slug, content_ar, status)
VALUES
  ('من نحن',           'about',     '<h2>جريدة الشارع المصري</h2><p>جريدة إلكترونية مصرية متخصصة في تقديم أخبار مصر والعالم لحظة بلحظة.</p><p>رئيس التحرير: محمد جوهر</p>', 'published'),
  ('اتصل بنا',         'contact',   '<h2>تواصل معنا</h2><p>البريد الإلكتروني: info@egstreetnews.com</p>', 'published'),
  ('أعلن معنا',        'advertise', '<h2>إعلن معنا</h2><p>للإعلان: ads@egstreetnews.com</p>', 'published'),
  ('سياسة الخصوصية',  'privacy',   '<h2>سياسة الخصوصية</h2><p>جريدة الشارع المصري تلتزم بحماية بيانات مستخدميها.</p>', 'published'),
  ('الشروط والأحكام', 'terms',     '<h2>الشروط والأحكام</h2><p>باستخدام الموقع أنت توافق على شروط الاستخدام.</p>', 'published')
ON CONFLICT (slug) DO NOTHING;

-- ── 5. إضافة أقسام مفقودة ──
INSERT INTO public.categories (name_ar, name_en, slug, sort_order, is_active)
VALUES
  ('حوادث',  'Accidents', 'accidents', 8,  true),
  ('صحة',    'Health',    'health',    9,  true),
  ('منوعات', 'Misc',      'misc',      10, true)
ON CONFLICT (slug) DO NOTHING;

-- ── نتيجة ──
SELECT 'user_roles' as tbl, count(*)::text as rows FROM public.user_roles
UNION ALL SELECT 'pages', count(*)::text FROM public.pages WHERE status='published'
UNION ALL SELECT 'categories', count(*)::text FROM public.categories
UNION ALL SELECT 'site_settings', count(*)::text FROM public.site_settings;
