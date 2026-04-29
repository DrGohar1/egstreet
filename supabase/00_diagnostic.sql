-- شغّل الأول — عشان نشوف إيه عندك
SELECT c.table_name, c.column_name, c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('user_roles','user_permissions','profiles','articles','media','site_settings')
ORDER BY c.table_name, c.ordinal_position;