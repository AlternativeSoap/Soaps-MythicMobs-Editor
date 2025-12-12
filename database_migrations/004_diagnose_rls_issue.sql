-- ============================================
-- Diagnostic Script for Templates RLS Issues
-- ============================================
-- Run this to check your current setup and identify issues

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename = 'templates';

-- 2. Check all current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive as permissive_policy,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'templates'
ORDER BY policyname;

-- 3. Check your current user ID
SELECT auth.uid() as current_user_id;

-- 4. Check a sample template to see owner_id
SELECT id, owner_id, name, deleted 
FROM templates 
LIMIT 3;

-- 5. Test if policies are working
-- Try to select your own templates (should work)
SELECT COUNT(*) as my_templates_count
FROM templates
WHERE owner_id = auth.uid();

-- ============================================
-- RECOMMENDED FIX
-- ============================================
-- If the above diagnostic shows issues, run this complete reset:

-- Drop all policies
DROP POLICY IF EXISTS "Templates are publicly viewable" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Recreate with proper settings
CREATE POLICY "Templates are publicly viewable"
  ON templates
  FOR SELECT
  USING (deleted = false);

CREATE POLICY "Users can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- If STILL not working, temporarily disable RLS for testing:
-- ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable after testing:
-- ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
