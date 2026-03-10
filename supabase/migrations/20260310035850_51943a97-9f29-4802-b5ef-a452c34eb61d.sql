
-- Drop the overlapping permissive SELECT policy that could leak data
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;

-- The "Admins can manage subscribers" ALL policy already covers SELECT for super_admin
-- Add editor_in_chief SELECT access properly within the ALL policy scope
-- Re-create a tighter SELECT-only policy for editor_in_chief
CREATE POLICY "Editors can view subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'editor_in_chief'::app_role));
