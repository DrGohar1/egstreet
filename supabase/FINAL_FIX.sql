-- ════════════════════════════════════════════════════════
-- EG STREET NEWS — FINAL FIX SQL
-- شغّل ده كله مرة واحدة في SQL Editor
-- بيضيف بس اللي ناقص فعلاً
-- ════════════════════════════════════════════════════════

-- 1. articles: اعمدة SEO
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 2. breaking_news: slug + title
ALTER TABLE breaking_news
  ADD COLUMN IF NOT EXISTS slug  TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT;

-- 3. saved_articles
CREATE TABLE IF NOT EXISTS saved_articles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, article_id)
);
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS saved_own ON saved_articles;
CREATE POLICY saved_own ON saved_articles
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. share_tracking
CREATE TABLE IF NOT EXISTS share_tracking (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  platform   TEXT NOT NULL,
  user_ip    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS share_insert ON share_tracking;
DROP POLICY IF EXISTS share_read   ON share_tracking;
CREATE POLICY share_insert ON share_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY share_read   ON share_tracking FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. automation_logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type               TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'success',
  message            TEXT,
  articles_processed INT  DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auto_logs ON automation_logs;
CREATE POLICY auto_logs ON automation_logs USING (auth.uid() IS NOT NULL);

-- 6. media
CREATE TABLE IF NOT EXISTS media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  filename    TEXT,
  size        INT,
  type        TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_read  ON media;
DROP POLICY IF EXISTS media_write ON media;
CREATE POLICY media_read  ON media FOR SELECT USING (true);
CREATE POLICY media_write ON media FOR ALL    USING (auth.uid() IS NOT NULL);

-- 7. Trigger: updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. Trigger: auto-create profile on new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
