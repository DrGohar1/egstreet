
-- =========================================
-- نظام الصلاحيات الكامل — EG Street News
-- =========================================

-- 1. جدول الأدوار المخصصة (قابلة للتسمية)
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,           -- اسم الدور (مثلاً: محرر أول، مصور، إلخ)
  slug        TEXT NOT NULL UNIQUE,           -- slug (مثلاً: editor_chief)
  description TEXT,
  color       TEXT DEFAULT '#6B7280',         -- لون للعرض
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الصلاحيات
CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id     UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission  TEXT NOT NULL,  -- مثلاً: articles.create, articles.publish, users.manage
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission)
);

-- 3. إضافة أعمدة للـ profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS role_id             UUID REFERENCES public.custom_roles(id),
  ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_admin            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_by          UUID;

-- 4. الأدوار الافتراضية
INSERT INTO public.custom_roles (name, slug, description, color) VALUES
  ('مدير عام',        'super_admin',  'صلاحيات كاملة', '#DC2626'),
  ('محرر',            'editor',       'نشر وتعديل المقالات', '#2563EB'),
  ('كاتب',            'author',       'كتابة المقالات فقط', '#16A34A'),
  ('مراسل',           'reporter',     'إضافة أخبار', '#D97706'),
  ('مصور',            'photographer', 'رفع الصور والميديا', '#7C3AED')
ON CONFLICT (slug) DO NOTHING;

-- 5. الصلاحيات الافتراضية لكل دور
DO $$
DECLARE
  v_super UUID; v_editor UUID; v_author UUID; v_reporter UUID;
BEGIN
  SELECT id INTO v_super    FROM public.custom_roles WHERE slug='super_admin';
  SELECT id INTO v_editor   FROM public.custom_roles WHERE slug='editor';
  SELECT id INTO v_author   FROM public.custom_roles WHERE slug='author';
  SELECT id INTO v_reporter FROM public.custom_roles WHERE slug='reporter';

  -- super_admin: كل الصلاحيات
  INSERT INTO public.permissions (role_id, permission) VALUES
    (v_super, 'articles.create'), (v_super, 'articles.edit'), (v_super, 'articles.delete'),
    (v_super, 'articles.publish'), (v_super, 'users.manage'), (v_super, 'users.create'),
    (v_super, 'roles.manage'), (v_super, 'settings.manage'), (v_super, 'categories.manage'),
    (v_super, 'comments.manage'), (v_super, 'analytics.view'), (v_super, 'media.upload')
  ON CONFLICT DO NOTHING;

  -- editor
  INSERT INTO public.permissions (role_id, permission) VALUES
    (v_editor, 'articles.create'), (v_editor, 'articles.edit'), (v_editor, 'articles.publish'),
    (v_editor, 'comments.manage'), (v_editor, 'analytics.view'), (v_editor, 'media.upload')
  ON CONFLICT DO NOTHING;

  -- author
  INSERT INTO public.permissions (role_id, permission) VALUES
    (v_author, 'articles.create'), (v_author, 'articles.edit'), (v_author, 'media.upload')
  ON CONFLICT DO NOTHING;

  -- reporter
  INSERT INTO public.permissions (role_id, permission) VALUES
    (v_reporter, 'articles.create'), (v_reporter, 'media.upload')
  ON CONFLICT DO NOTHING;
END $$;

-- 6. Function: تحقق من صلاحية معينة
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_has BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
    JOIN public.permissions pm ON pm.role_id = pr.role_id
    WHERE pr.user_id = p_user_id AND pm.permission = p_permission
  ) INTO v_has;
  RETURN v_has;
END; $$;

-- 7. RLS
ALTER TABLE public.custom_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "roles_public_read"   ON public.custom_roles FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "perms_public_read"   ON public.permissions   FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "roles_admin_manage"  ON public.custom_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND is_admin=TRUE));
CREATE POLICY IF NOT EXISTS "perms_admin_manage"  ON public.permissions  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND is_admin=TRUE));
