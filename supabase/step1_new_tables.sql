-- PART 1: Create missing tables only
-- Run this first in SQL Editor

-- saved_articles
CREATE TABLE IF NOT EXISTS saved_articles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, article_id)
);
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY saved_own ON saved_articles
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- share_tracking
CREATE TABLE IF NOT EXISTS share_tracking (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  platform   TEXT NOT NULL,
  user_ip    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY share_insert ON share_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY share_read   ON share_tracking FOR SELECT USING (auth.uid() IS NOT NULL);

-- automation_logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type               TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'success',
  message            TEXT,
  articles_processed INT  DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY auto_logs ON automation_logs USING (auth.uid() IS NOT NULL);
