-- ══════════════════════════════════════
--  إضافة أقسام جديدة
-- ══════════════════════════════════════
INSERT INTO public.categories (name_ar, name_en, slug, description_ar, sort_order, is_active)
VALUES
  ('حوادث',   'Accidents', 'accidents', 'أخبار الحوادث',  8, true),
  ('صحة',     'Health',    'health',    'أخبار الصحة',    9, true),
  ('منوعات',  'Misc',      'misc',      'أخبار متنوعة',  10, true)
ON CONFLICT (slug) DO NOTHING;

-- ══ إضافة صفحات ثابتة ══
INSERT INTO public.pages (title_ar, slug, content_ar, status, show_in_footer)
VALUES
  ('من نحن',           'about',   '<p>جريدة الشارع المصري — صحافة من قلب الحدث</p>', 'published', true),
  ('اتصل بنا',         'contact', '<p>للتواصل: info@egstreetnews.com</p>',            'published', true),
  ('سياسة الخصوصية',  'privacy', '<p>سياسة الخصوصية لجريدة الشارع المصري</p>',       'published', true),
  ('الشروط والأحكام',  'terms',   '<p>الشروط والأحكام لجريدة الشارع المصري</p>',      'published', true),
  ('أعلن معنا',        'advertise','<p>للإعلان معنا تواصل: ads@egstreetnews.com</p>', 'published', true)
ON CONFLICT (slug) DO NOTHING;

SELECT name_ar, slug FROM public.categories ORDER BY sort_order;
SELECT title_ar, slug FROM public.pages WHERE status = 'published' ORDER BY id;
