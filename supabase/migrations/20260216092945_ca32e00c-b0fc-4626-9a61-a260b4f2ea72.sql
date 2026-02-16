
-- Fix: Remove overly permissive policies on daily_views (track_daily_view is SECURITY DEFINER and bypasses RLS)
DROP POLICY IF EXISTS "Anyone can insert daily views" ON public.daily_views;
DROP POLICY IF EXISTS "System can update daily views" ON public.daily_views;
