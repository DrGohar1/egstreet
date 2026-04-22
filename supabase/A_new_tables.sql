-- ═══════════════════════════════════════════════════
-- PART A: إنشاء الجداول الجديدة
-- شغّل ده الأول  →  New Query → RUN
-- ═══════════════════════════════════════════════════

-- saved_articles
CREATE TABLE IF NOT EXISTS saved_articles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id  UUID        NOT NULL REFERENCES articles(id)   ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_select" ON saved_articles;
DROP POLICY IF EXISTS "saved_insert" ON saved_articles;
DROP POLICY IF EXISTS "saved_delete" ON saved_articles;
CREATE POLICY "saved_select" ON saved_articles FOR SELECT USING  (user_id = auth.uid());
CREATE POLICY "saved_insert" ON saved_articles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete" ON saved_articles FOR DELETE USING  (user_id = auth.uid());

-- share_tracking
CREATE TABLE IF NOT EXISTS share_tracking (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID        REFERENCES articles(id) ON DELETE CASCADE,
  platform    TEXT        NOT NULL,
  user_ip     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "share_insert" ON share_tracking;
DROP POLICY IF EXISTS "share_read"   ON share_tracking;
CREATE POLICY "share_insert" ON share_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "share_read"   ON share_tracking FOR SELECT USING (auth.uid() IS NOT NULL);

-- automation_logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type               TEXT        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'success',
  message            TEXT,
  articles_processed INT                  DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auto_logs" ON automation_logs;
CREATE POLICY "auto_logs" ON automation_logs USING (auth.uid() IS NOT NULL);

-- media
CREATE TABLE IF NOT EXISTS media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT        NOT NULL,
  filename    TEXT,
  size        INT,
  type        TEXT,
  uploaded_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_read"  ON media;
DROP POLICY IF EXISTS "media_write" ON media;
CREATE POLICY "media_read"  ON media FOR SELECT USING (true);
CREATE POLICY "media_write" ON media FOR ALL    USING (auth.uid() IS NOT NULL);
