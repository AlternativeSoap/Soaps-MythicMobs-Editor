-- ============================================
-- DEBUG: Why is auth.uid() returning NULL?
-- ============================================

-- Check if auth schema exists
SELECT EXISTS (
    SELECT FROM information_schema.schemata 
    WHERE schema_name = 'auth'
);

-- Check if auth.users table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
);

-- Check if you have any users in auth.users
SELECT COUNT(*) as user_count FROM auth.users;

-- Check if the auth.uid() function exists
SELECT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'uid'
);

-- Try getting your user from auth.users directly
SELECT id, email, created_at 
FROM auth.users 
LIMIT 5;

-- Check if owner_id in templates matches any user in auth.users
SELECT 
    t.id as template_id,
    t.owner_id,
    u.id as auth_user_id,
    u.email,
    t.owner_id = u.id as ids_match
FROM templates t
LEFT JOIN auth.users u ON t.owner_id = u.id
LIMIT 5;

-- ============================================
-- NUCLEAR OPTION: Disable RLS completely
-- ============================================
-- If auth.uid() fundamentally doesn't work, you'll need to either:
-- 1. Fix the JWT configuration (contact Supabase support)
-- 2. Disable RLS and handle security in application layer
-- 3. Use service_role key instead of anon key (less secure)

-- Uncomment to disable RLS temporarily:
-- ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Or create a permissive policy that doesn't use auth.uid():
-- This is ONLY for testing - very insecure!
/*
DROP POLICY IF EXISTS "temp_allow_all" ON templates;
CREATE POLICY "temp_allow_all"
  ON templates
  FOR ALL
  USING (true)
  WITH CHECK (true);
*/
