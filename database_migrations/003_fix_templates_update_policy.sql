-- ============================================
-- Fix Templates Table UPDATE Policy
-- ============================================
-- This script fixes the RLS policy for UPDATE operations on templates table
-- Run this in Supabase SQL Editor

-- OPTION 1: Temporarily disable RLS to test if that's the issue
-- Uncomment this line to test:
-- ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Fix the UPDATE policy properly
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Templates are publicly viewable" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Recreate all policies with proper clauses

-- Policy 1: Anyone can view non-deleted templates
CREATE POLICY "Templates are publicly viewable"
  ON templates
  FOR SELECT
  USING (deleted = false);

-- Policy 2: Authenticated users can create templates
CREATE POLICY "Users can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy 3: Users can update their own templates (including soft delete)
-- This allows updating ANY field as long as you own the template
CREATE POLICY "Users can update own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Users can delete their own templates (hard delete - rarely used)
CREATE POLICY "Users can delete own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Verify policies were created correctly
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'templates'
ORDER BY policyname;
