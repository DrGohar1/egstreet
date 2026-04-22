-- ════════════════════════════════════════════════════════
--  USER MANAGEMENT SYSTEM — Advanced
--  شغّل في SQL Editor لو محتاجه
-- ════════════════════════════════════════════════════════

-- إضافة أعمدة إضافية لـ profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN     DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count  INT         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes        TEXT;

-- جدول activity_logs: سجل نشاط المستخدمين
CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  action     TEXT        NOT NULL,
  details    JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "actlog_admin" ON activity_logs;
CREATE POLICY "actlog_admin" ON activity_logs USING (auth.uid() IS NOT NULL);

-- Function: تحديث last_login تلقائياً
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
    SET last_login  = now(),
        login_count = COALESCE(login_count, 0) + 1
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- function: is_admin - لفحص صلاحيات المستخدم
CREATE OR REPLACE FUNCTION is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = uid
      AND role IN ('admin','super_admin','editor')
  );
$$;

-- function: get_user_role - جلب دور المستخدم
CREATE OR REPLACE FUNCTION get_user_role(uid UUID DEFAULT auth.uid())
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = uid LIMIT 1),
    'reader'
  );
$$;
