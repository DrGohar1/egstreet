
-- ① أضف عمود username لو مش موجود
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- ② Index سريع على username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- ③ Function: login بـ username + password
CREATE OR REPLACE FUNCTION public.login_with_username(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_result JSON;
BEGIN
  -- جيب الإيميل من الـ username
  SELECT email INTO v_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(p_username)
  LIMIT 1;

  IF v_email IS NULL THEN
    RETURN json_build_object('error', 'اسم المستخدم غير موجود');
  END IF;

  RETURN json_build_object('email', v_email);
END;
$$;

-- ④ Function: تغيير الباسورد من داخل الحساب
CREATE OR REPLACE FUNCTION public.admin_update_username(p_user_id UUID, p_new_username TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_exists INT;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM public.profiles
  WHERE LOWER(username) = LOWER(p_new_username) AND user_id != p_user_id;
  IF v_exists > 0 THEN
    RETURN json_build_object('error', 'اسم المستخدم مستخدم بالفعل');
  END IF;
  UPDATE public.profiles SET username = p_new_username WHERE user_id = p_user_id;
  RETURN json_build_object('success', true);
END;
$$;

-- ⑤ RLS: فقط الـ owner يقدر يحدّث username/password بتاعه
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (TRUE);
