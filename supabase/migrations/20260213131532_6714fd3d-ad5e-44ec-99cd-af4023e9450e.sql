
-- Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'editor_in_chief', 'journalist', 'ads_manager');
CREATE TYPE public.article_status AS ENUM ('draft', 'pending_review', 'published', 'archived');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Has role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User roles policies (after function exists)
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'editor_in_chief'::app_role)
);

-- Articles
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id),
  author_id UUID REFERENCES auth.users(id),
  status article_status NOT NULL DEFAULT 'draft',
  is_breaking BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are publicly readable" ON public.articles FOR SELECT USING (
  status = 'published' OR (auth.uid() IS NOT NULL AND (
    author_id = auth.uid() OR
    public.has_role(auth.uid(), 'super_admin'::app_role) OR
    public.has_role(auth.uid(), 'editor_in_chief'::app_role)
  ))
);
CREATE POLICY "Journalists can insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (
    public.has_role(auth.uid(), 'journalist'::app_role) OR
    public.has_role(auth.uid(), 'editor_in_chief'::app_role) OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);
CREATE POLICY "Authors and editors can update articles" ON public.articles FOR UPDATE TO authenticated USING (
  author_id = auth.uid() OR
  public.has_role(auth.uid(), 'editor_in_chief'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);
CREATE POLICY "Super admins can delete articles" ON public.articles FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Site settings
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are publicly readable" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Super admins can manage settings" ON public.site_settings FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed categories
INSERT INTO public.categories (name_ar, name_en, slug, sort_order) VALUES
  ('أخبار مصر', 'Egypt News', 'egypt', 1),
  ('أخبار العالم', 'World News', 'world', 2),
  ('سياسة', 'Politics', 'politics', 3),
  ('اقتصاد', 'Economy', 'economy', 4),
  ('رياضة', 'Sports', 'sports', 5),
  ('تكنولوجيا', 'Technology', 'tech', 6),
  ('ثقافة وفنون', 'Culture & Arts', 'culture', 7),
  ('رأي', 'Opinion', 'opinion', 8);

-- Seed settings
INSERT INTO public.site_settings (key, value) VALUES
  ('font_family', 'Cairo'),
  ('font_size_base', '16'),
  ('site_name_ar', 'جريدة الشارع المصري'),
  ('site_name_en', 'EgStreet News'),
  ('language', 'ar');
