-- Username Auth Migration
-- Run in: Supabase > SQL Editor

-- 1. Add username column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Index for fast username lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- 3. Disable email confirmation (no email used)
-- In Supabase Dashboard: Auth > Settings > Disable 'Enable email confirmations'

-- 4. RLS: profiles can be read publicly, written by owner
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_public ON profiles;
DROP POLICY IF EXISTS profiles_own ON profiles;
CREATE POLICY profiles_public ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_own ON profiles FOR ALL USING (user_id = auth.uid());

-- 5. Auto-create profile + set username on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uname TEXT;
BEGIN
  uname := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    uname,
    COALESCE(NEW.raw_user_meta_data->>'display_name', uname)
  )
  ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Fix existing profiles: set username from email
UPDATE profiles p
SET username = split_part(u.email, '@', 1)
FROM auth.users u
WHERE p.user_id = u.id AND p.username IS NULL;

-- Done!