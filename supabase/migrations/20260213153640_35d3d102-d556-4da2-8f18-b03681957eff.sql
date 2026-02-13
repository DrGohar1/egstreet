
-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can subscribe
CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Admins can view subscribers
CREATE POLICY "Admins can view subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor_in_chief'::app_role));

-- Admins can manage subscribers
CREATE POLICY "Admins can manage subscribers"
ON public.newsletter_subscribers
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Storage bucket for site assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Anyone can view site assets
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Admins can upload site assets
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor_in_chief'::app_role)));

-- Admins can update site assets
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor_in_chief'::app_role)));

-- Admins can delete site assets
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor_in_chief'::app_role)));
