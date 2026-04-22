-- ═══════════════════════════════════════════════════
-- PART B: إضافة الأعمدة الناقصة
-- شغّل ده تاني  →  New Query → RUN
-- ═══════════════════════════════════════════════════

-- articles: SEO columns
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- breaking_news: slug + title
ALTER TABLE breaking_news
  ADD COLUMN IF NOT EXISTS slug  TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT;

-- comments: missing columns
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS likes       INT         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT now();
