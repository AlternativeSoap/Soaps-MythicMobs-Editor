-- ============================================
-- COMPREHENSIVE RLS FIX - Final Solution
-- ============================================
-- The issue: SQL works but JS client doesn't = JWT context problem

-- STEP 1: Check current policy roles
SELECT 
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'templates';

-- STEP 2: Drop ALL policies and recreate without role restrictions
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

-- STEP 3: Create new policies that work with JWT context
-- Key change: No "TO authenticated" - applies to all roles
-- The auth.uid() check is enough security

CREATE POLICY "enable_select_for_all"
  ON templates
  FOR SELECT
  USING (deleted = false);

CREATE POLICY "enable_insert_for_users"
  ON templates
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL 
    AND owner_id = (SELECT auth.uid())
  );

CREATE POLICY "enable_update_for_owners"
  ON templates
  FOR UPDATE
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "enable_delete_for_owners"
  ON templates
  FOR DELETE
  USING ((SELECT auth.uid()) = owner_id);

-- STEP 4: Grant permissions to both anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON templates TO anon, authenticated;

-- STEP 5: Verify the setup
SELECT 
    policyname,
    roles,
    cmd,
    qual::text as using_check,
    with_check::text as with_check
FROM pg_policies
WHERE tablename = 'templates'
ORDER BY cmd, policyname;

-- STEP 6: Test the update (replace with your template ID)
SELECT 
    id,
    owner_id,
    name,
    (SELECT auth.uid()) as current_user,
    (SELECT auth.uid()) = owner_id as can_update
FROM templates
WHERE id = '0eb2488d-42bd-45e8-a852-249bdc47d5a4';
