-- ============================================
-- FINAL FIX for Templates RLS
-- ============================================
-- This should finally fix the UPDATE policy issue
-- The problem: WITH CHECK was too strict for soft deletes

-- First, re-enable RLS if you disabled it
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Templates are publicly viewable" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Policy 1: Public read access for non-deleted templates
CREATE POLICY "Templates are publicly viewable"
  ON templates
  FOR SELECT
  USING (deleted = false);

-- Policy 2: Authenticated users can create templates
CREATE POLICY "Users can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id 
    AND deleted = false
  );

-- Policy 3: Users can update their own templates
-- Simplified: Just check that the owner_id matches and hasn't changed
CREATE POLICY "Users can update own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (owner_id = auth.uid());

-- Policy 4: Hard delete (optional, rarely used)
CREATE POLICY "Users can delete own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Verify the policies
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'templates'
ORDER BY cmd, policyname;

-- Test query (should show your templates)
SELECT id, name, owner_id, deleted 
FROM templates 
WHERE owner_id = auth.uid()
LIMIT 5;
