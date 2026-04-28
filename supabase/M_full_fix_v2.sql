-- ══════════════════════════════════════════════════════
--  M_full_fix_v2.sql — إصلاح صحيح بناءً على بنية الجداول
-- ══════════════════════════════════════════════════════

-- ── 1. إضافة صفحات مفقودة (is_active وليس status) ──
INSERT INTO public.pages (title_ar, title_en, slug, content_ar, is_active)
VALUES
  ('أعلن معنا',        'Advertise',  'advertise', '<h2>إعلن معنا</h2><p>للإعلان تواصل معنا: ads@egstreetnews.com</p>',       true),
  ('الشروط والأحكام', 'Terms',       'terms',     '<h2>الشروط والأحكام</h2><p>باستخدام الموقع توافق على شروط الاستخدام.</p>', true)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. تحديث الصفحات الموجودة بمحتوى أفضل ──
UPDATE public.pages SET
  content_ar = '<h2>جريدة الشارع المصري</h2><p>جريدة إلكترونية مصرية رائدة تقدم أخبار مصر والعالم لحظة بلحظة.</p><p>تأسست لتكون صوت الحدث الحقيقي.</p>'
WHERE slug = 'about';

UPDATE public.pages SET
  content_ar = '<h2>تواصل معنا</h2><ul><li>البريد: info@egstreetnews.com</li><li>للإعلانات: ads@egstreetnews.com</li></ul>'
WHERE slug = 'contact';

-- ── 3. إضافة أقسام مفقودة ──
INSERT INTO public.categories (name_ar, name_en, slug, sort_order, is_active)
VALUES
  ('حوادث',  'Accidents', 'accidents', 8,  true),
  ('صحة',    'Health',    'health',    9,  true),
  ('منوعات', 'Misc',      'misc',      10, true)
ON CONFLICT (slug) DO NOTHING;

-- ── 4. إضافة site_settings مفقودة ──
INSERT INTO public.site_settings (key, value) VALUES
  ('chief_editor_name',    'محمد جوهر'),
  ('chief_editor_title',   'رئيس التحرير'),
  ('newspaper_address',    'القاهرة، جمهورية مصر العربية'),
  ('newspaper_phone',      '+20 10 0000 0000'),
  ('newspaper_email',      'info@egstreetnews.com'),
  ('ads_email',            'ads@egstreetnews.com'),
  ('newsletter_text',      'اشترك واحصل على أبرز الأخبار يومياً على بريدك الإلكتروني'),
  ('weather_city',         'القاهرة'),
  ('facebook_url',         ''),
  ('twitter_url',          ''),
  ('instagram_url',        ''),
  ('youtube_url',          ''),
  ('tiktok_url',           ''),
  ('live_url',             '')
ON CONFLICT (key) DO NOTHING;

-- ── 5. إصلاح user_roles — مسح القديمة وإعادة الربط ──
DELETE FROM public.user_roles;

-- Super Admin: Gohar (عن طريق الإيميل أو الاسم)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email ILIKE '%gohar%'
   OR raw_user_meta_data->>'username' ILIKE '%gohar%'
   OR raw_user_meta_data->>'display_name' ILIKE '%gohar%'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Editor in Chief: محمد (أول يوزر مش super_admin)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'editor_in_chief'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ORDER BY created_at
LIMIT 2
ON CONFLICT (user_id) DO NOTHING;

-- بقية المستخدمين: journalist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'journalist'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ── نتيجة نهائية ──
SELECT 'pages' as جدول, count(*)::text as عدد FROM public.pages
UNION ALL SELECT 'categories', count(*)::text FROM public.categories
UNION ALL SELECT 'user_roles', count(*)::text FROM public.user_roles
UNION ALL SELECT 'site_settings', count(*)::text FROM public.site_settings;
