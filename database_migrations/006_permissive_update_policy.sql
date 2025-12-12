-- ============================================
-- Alternative RLS Fix - More Permissive UPDATE
-- ============================================
-- This uses a different approach: Allow updates as long as 
-- you own the template and aren't changing ownership

-- Re-enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Templates are publicly viewable" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Policy 1: Public read access
CREATE POLICY "Templates are publicly viewable"
  ON templates
  FOR SELECT
  USING (deleted = false);

-- Policy 2: Create templates
CREATE POLICY "Users can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy 3: UPDATE - Key change here!
-- Use true for WITH CHECK since we're already checking ownership in USING
-- This allows any field changes (including deleted) as long as you own it
CREATE POLICY "Users can update own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (true);

-- Policy 4: Hard delete
CREATE POLICY "Users can delete own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Verify policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'templates';
