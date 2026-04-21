-- visitor_logs table for IP tracking
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address    TEXT,
  country_code  TEXT,
  city          TEXT,
  page_path     TEXT DEFAULT '/',
  device_type   TEXT DEFAULT 'desktop',
  browser       TEXT DEFAULT 'Other',
  referrer      TEXT,
  visited_at    TIMESTAMPTZ DEFAULT NOW()
);

-- daily_views: add country_code column if not exists
ALTER TABLE public.daily_views ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'EG';
ALTER TABLE public.daily_views ADD COLUMN IF NOT EXISTS city TEXT;

-- Unique constraint for upsert
ALTER TABLE public.daily_views DROP CONSTRAINT IF EXISTS daily_views_date_country_unique;
ALTER TABLE public.daily_views ADD CONSTRAINT daily_views_date_country_unique UNIQUE (view_date, country_code);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON public.visitor_logs (visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_country ON public.visitor_logs (country_code);
CREATE INDEX IF NOT EXISTS idx_daily_views_date ON public.daily_views (view_date DESC);

-- RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admin can read visitor_logs"
  ON public.visitor_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow service_role to insert (via edge function)
CREATE POLICY IF NOT EXISTS "Service role insert visitor_logs"
  ON public.visitor_logs FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.visitor_logs IS 'Tracks visitor IPs, countries, and pages for analytics';
