-- ══════════════════════════════════════════════════════
-- MIGRATION v3 — copy each BLOCK separately if error occurs
-- ══════════════════════════════════════════════════════

-- BLOCK 1
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- BLOCK 2: articles columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articles' AND column_name='meta_title') THEN
    ALTER TABLE public.articles ADD COLUMN meta_title text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articles' AND column_name='meta_description') THEN
    ALTER TABLE public.articles ADD COLUMN meta_description text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articles' AND column_name='scheduled_at') THEN
    ALTER TABLE public.articles ADD COLUMN scheduled_at timestamptz DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articles' AND column_name='custom_author_name') THEN
    ALTER TABLE public.articles ADD COLUMN custom_author_name text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articles' AND column_name='is_breaking') THEN
    ALTER TABLE public.articles ADD COLUMN is_breaking boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articles' AND column_name='is_featured') THEN
    ALTER TABLE public.articles ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- BLOCK 3: profiles columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='must_change_password') THEN
    ALTER TABLE public.profiles ADD COLUMN must_change_password boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email text DEFAULT NULL;
  END IF;
END $$;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');

-- BLOCK 4: user_permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "up_all" ON public.user_permissions;
CREATE POLICY "up_all" ON public.user_permissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.user_permissions TO authenticated;

-- BLOCK 5: media
CREATE TABLE IF NOT EXISTS public.media (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name  text        NOT NULL,
  file_path  text        NOT NULL DEFAULT '',
  file_url   text        NOT NULL,
  file_type  text        NOT NULL DEFAULT 'image',
  file_size  bigint      DEFAULT 0,
  width      int         DEFAULT NULL,
  height     int         DEFAULT NULL,
  alt_text   text        DEFAULT NULL,
  caption    text        DEFAULT NULL,
  folder     text        DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_all" ON public.media;
CREATE POLICY "media_all" ON public.media
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.media TO authenticated;

-- BLOCK 6: storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('site-assets', 'site-assets', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;
DROP POLICY IF EXISTS "sa_read"  ON storage.objects;
DROP POLICY IF EXISTS "sa_write" ON storage.objects;
CREATE POLICY "sa_read"  ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "sa_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'site-assets') WITH CHECK (bucket_id = 'site-assets');

-- BLOCK 7: site_settings
INSERT INTO public.site_settings (key, value)
VALUES
  ('adsense_id',''),('adsense_enabled','false'),
  ('facebook_url',''),('twitter_url',''),('whatsapp_url',''),
  ('telegram_url',''),('youtube_url',''),('tiktok_url',''),('instagram_url','')
ON CONFLICT (key) DO NOTHING;

-- BLOCK 8: admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.user_permissions p WHERE p.user_id = p_user_id;
  DELETE FROM public.user_roles       r WHERE r.user_id = p_user_id;
  DELETE FROM public.profiles         pr WHERE pr.id    = p_user_id;
  DELETE FROM auth.users              u  WHERE u.id     = p_user_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- BLOCK 9: admin_update_user
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid, p_display_name text DEFAULT NULL,
  p_username text DEFAULT NULL, p_phone text DEFAULT NULL,
  p_role text DEFAULT NULL, p_new_password text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL, p_must_change_pw boolean DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles pr SET
    display_name         = COALESCE(p_display_name,  pr.display_name),
    username             = COALESCE(p_username,       pr.username),
    phone                = COALESCE(p_phone,          pr.phone),
    is_active            = COALESCE(p_is_active,      pr.is_active),
    must_change_password = COALESCE(p_must_change_pw, pr.must_change_password)
  WHERE pr.id = p_user_id;

  IF p_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, p_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF p_new_password IS NOT NULL AND length(p_new_password) >= 6 THEN
    UPDATE auth.users u
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
    WHERE u.id = p_user_id;
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_update_user TO authenticated;

-- BLOCK 10: new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_user text;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1));
  v_user := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1));
  INSERT INTO public.profiles (id, email, display_name, username, is_active)
  VALUES (NEW.id, NEW.email, v_name, v_user, true)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, is_active = true;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DONE
NOTIFY pgrst, 'reload schema';
SELECT 'Migration v3 complete' AS status;
