
-- Create junction table for many-to-many articles <-> categories
CREATE TABLE public.article_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, category_id)
);

-- Enable RLS
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Article categories are publicly readable"
ON public.article_categories FOR SELECT
USING (true);

-- Authenticated users with roles can manage
CREATE POLICY "Authors and editors can manage article categories"
ON public.article_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.id = article_id
    AND (a.author_id = auth.uid() OR has_role(auth.uid(), 'editor_in_chief') OR has_role(auth.uid(), 'super_admin'))
  )
);

-- Migrate existing category_id data to the new junction table
INSERT INTO public.article_categories (article_id, category_id)
SELECT id, category_id FROM public.articles WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable realtime for the junction table
ALTER PUBLICATION supabase_realtime ADD TABLE public.article_categories;
