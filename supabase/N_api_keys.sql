-- إضافة أعمدة API keys في site_settings
INSERT INTO public.site_settings (key, value) VALUES
  ('newsapi_key',     ''),
  ('gnews_key',       ''),
  ('mediastack_key',  '')
ON CONFLICT (key) DO NOTHING;

-- تحقق
SELECT key, 
  CASE WHEN value = '' THEN '⚠️ فارغ' ELSE '✅ مضبوط' END as status
FROM public.site_settings 
WHERE key IN ('newsapi_key','gnews_key','mediastack_key');
