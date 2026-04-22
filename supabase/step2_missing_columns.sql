-- PART 2: Add missing columns to existing tables
-- Run this second

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS meta_title        TEXT,
  ADD COLUMN IF NOT EXISTS meta_description  TEXT;

ALTER TABLE breaking_news
  ADD COLUMN IF NOT EXISTS slug TEXT;
