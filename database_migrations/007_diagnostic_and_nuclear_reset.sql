-- ============================================
-- DIAGNOSTIC: Check Current State
-- ============================================
-- Run this to see what's actually in your database

-- 1. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'templates';

-- 2. List ALL policies (might have duplicates)
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'templates'
ORDER BY policyname;

-- 3. Check your auth status
SELECT 
  auth.uid() as my_user_id,
  auth.role() as my_role;

-- 4. Check one of your templates directly
SELECT 
  id,
  owner_id,
  name,
  deleted,
  auth.uid() = owner_id as i_own_this
FROM templates
WHERE id = '5a555052-2c03-4a4e-8a87-8a5520f06108';

-- ============================================
-- If you see duplicate policies or wrong policies above,
-- run this NUCLEAR option to completely reset:
-- ============================================

-- Drop EVERY policy (even ones we might not know about)
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'templates'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON templates', pol.policyname);
  END LOOP;
END $$;

-- Now create fresh policies with the simplest possible setup
CREATE POLICY "select_policy"
  ON templates
  FOR SELECT
  USING (deleted = false);

CREATE POLICY "insert_policy"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "update_policy"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (true);

CREATE POLICY "delete_policy"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Verify the new policies
SELECT policyname, cmd, qual::text, with_check::text
FROM pg_policies 
WHERE tablename = 'templates';
