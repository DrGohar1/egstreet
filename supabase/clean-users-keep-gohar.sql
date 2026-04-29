-- ══════════════════════════════════════════════════════════════
-- Clean users — Keep only "gohar" as super_admin
-- ⚠️ Run in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. See all users first (run this SELECT to confirm before deleting)
SELECT id, email, display_name, username
FROM profiles
ORDER BY created_at;

-- ══════════════════════════════════════════════════════════════
-- 2. Delete ALL other users except gohar
--    Replace 'gohar@egstreet.com' with the actual gohar email
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_gohar_id uuid;
BEGIN
  -- Find gohar user ID
  SELECT id INTO v_gohar_id
  FROM profiles
  WHERE email ILIKE '%gohar%'
     OR username ILIKE '%gohar%'
     OR display_name ILIKE '%gohar%'
  LIMIT 1;

  IF v_gohar_id IS NULL THEN
    RAISE NOTICE 'لم يتم العثور على مستخدم gohar — تحقق من البيانات';
    RETURN;
  END IF;

  RAISE NOTICE 'gohar ID: %', v_gohar_id;

  -- Delete permissions for others
  DELETE FROM user_permissions WHERE user_id != v_gohar_id;

  -- Delete roles for others  
  DELETE FROM user_roles WHERE user_id != v_gohar_id;

  -- Delete profiles for others
  DELETE FROM profiles WHERE id != v_gohar_id;

  -- Delete from auth.users for others
  DELETE FROM auth.users WHERE id != v_gohar_id;

  -- Make sure gohar is super_admin
  INSERT INTO user_roles (user_id, role)
  VALUES (v_gohar_id, 'super_admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

  -- Give gohar ALL permissions
  DELETE FROM user_permissions WHERE user_id = v_gohar_id;
  INSERT INTO user_permissions (user_id, permission)
  SELECT v_gohar_id, unnest(ARRAY[
    'dashboard','articles','articles.write','articles.publish','articles.review','articles.delete',
    'categories','tags','breaking_news','pages',
    'media.upload','media.delete',
    'comments','comments.approve','subscribers',
    'ads','ads.create','ads.delete',
    'analytics',
    'scraper','scraper.run','ai_tools','ai_tools.generate','automation','automation.rules',
    'users','users.create','users.delete','permissions',
    'settings','backup'
  ]::text[]);

  RAISE NOTICE '✅ تم — gohar is now the only super_admin with all permissions';
END;
$$;

-- 3. Verify
SELECT p.id, p.email, p.display_name, r.role
FROM profiles p
LEFT JOIN user_roles r ON r.user_id = p.id;
