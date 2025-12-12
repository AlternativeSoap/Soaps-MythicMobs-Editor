-- ============================================
-- FINAL FIX: Use JWT Claims Directly
-- ============================================
-- The issue: auth.uid() works in SQL editor but not from REST API
-- Solution: Use auth.jwt() to read JWT claims directly

-- Drop all existing policies
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

-- Create policies using JWT claims (works from REST API)
CREATE POLICY "templates_select_policy"
  ON templates
  FOR SELECT
  USING (deleted = false);

CREATE POLICY "templates_insert_policy"
  ON templates
  FOR INSERT
  WITH CHECK (
    auth.jwt() IS NOT NULL
    AND owner_id = (auth.jwt() ->> 'sub')::uuid
  );

CREATE POLICY "templates_update_policy"
  ON templates
  FOR UPDATE
  USING (owner_id = (auth.jwt() ->> 'sub')::uuid)
  WITH CHECK (owner_id = (auth.jwt() ->> 'sub')::uuid);

CREATE POLICY "templates_delete_policy"
  ON templates
  FOR DELETE
  USING (owner_id = (auth.jwt() ->> 'sub')::uuid);

-- Verify policies
SELECT 
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'templates'
ORDER BY policyname;

-- Test: This should return your user ID from JWT
-- (Will be null in SQL editor, but should work from REST API)
SELECT (auth.jwt() ->> 'sub')::text as user_id_from_jwt;
