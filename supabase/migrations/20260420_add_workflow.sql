-- Create article workflow table
CREATE TABLE IF NOT EXISTS public.article_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'facebook', 'twitter', 'telegram', 'whatsapp', 'newsletter'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'scheduled', 'published', 'failed'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_workflow ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage workflow"
ON public.article_workflow FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor_in_chief'::app_role));

CREATE POLICY "Journalists can view workflow"
ON public.article_workflow FOR SELECT
USING (has_role(auth.uid(), 'journalist'::app_role));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_article_workflow_updated_at
BEFORE UPDATE ON public.article_workflow
FOR EACH ROW
EXECUTE FUNCTION update_workflow_updated_at();
