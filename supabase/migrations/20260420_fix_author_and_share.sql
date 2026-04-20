-- Add custom author name to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS custom_author_name TEXT;

-- Fix share_tracking table to use UUID for article_id if it's currently TEXT
-- First, check if we need to convert it (this is a bit tricky in pure SQL without knowing current state, 
-- but we'll try to make it robust)

DO $$ 
BEGIN
    -- Check if article_id is text and needs to be UUID
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'share_tracking' 
        AND column_name = 'article_id' 
        AND data_type = 'text'
    ) THEN
        -- We might have slugs in there, so we'll truncate the table to avoid cast errors 
        -- since it's just tracking data and we want a clean start with UUIDs
        TRUNCATE TABLE public.share_tracking;
        ALTER TABLE public.share_tracking ALTER COLUMN article_id TYPE UUID USING article_id::UUID;
    END IF;
END $$;

-- Ensure share_tracking has proper RLS
ALTER TABLE public.share_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert share tracking" ON public.share_tracking;
CREATE POLICY "Anyone can insert share tracking"
ON public.share_tracking FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view share tracking" ON public.share_tracking;
CREATE POLICY "Admins can view share tracking"
ON public.share_tracking FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor_in_chief'::app_role));
