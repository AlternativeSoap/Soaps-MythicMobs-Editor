-- ============================================
-- MythicMobs Editor - Templates Table Setup
-- ============================================
-- This script creates the templates table with all required indexes and RLS policies
-- Run this in Supabase SQL Editor

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
  data JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mob', 'skill')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1
);

-- ============================================
-- INDEXES
-- ============================================

-- Index on owner_id for fast user template queries
CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON templates(owner_id);

-- Index on type for filtering by mob/skill
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

-- GIN index on tags array for tag-based searches
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);

-- Combined index for efficient queries on active templates by type
CREATE INDEX IF NOT EXISTS idx_templates_deleted_type ON templates(deleted, type) WHERE deleted = false;

-- Index on created_at for sorting by newest/oldest
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);

-- Index on name for text search
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on templates table
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Templates are publicly viewable" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Policy 1: Anyone can view non-deleted templates (public read access)
CREATE POLICY "Templates are publicly viewable"
  ON templates
  FOR SELECT
  USING (deleted = false);

-- Policy 2: Authenticated users can create templates (must set owner_id to their own user ID)
CREATE POLICY "Users can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy 3: Users can only update their own templates
CREATE POLICY "Users can update own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Users can only delete their own templates (soft delete by setting deleted = true)
CREATE POLICY "Users can delete own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;

-- Create trigger to auto-update updated_at on row updates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VALIDATION
-- ============================================

-- Verify the table was created
SELECT 
  'Table created successfully' as status,
  COUNT(*) as initial_row_count 
FROM templates;

-- Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'templates'
ORDER BY indexname;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'templates';

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'templates'
ORDER BY policyname;

-- ============================================
-- SAMPLE TEST DATA (Optional - comment out for production)
-- ============================================

-- Uncomment below to insert test templates
/*
-- Note: Replace 'YOUR_USER_ID_HERE' with an actual user UUID from auth.users
INSERT INTO templates (owner_id, name, description, data, type, tags) VALUES
(
  'YOUR_USER_ID_HERE',
  'Test Fire Strike',
  'A basic fire attack that ignites the target and deals damage over time',
  '{
    "skillLines": ["- ignite{ticks=100} @Target ~onAttack", "- damage{a=10} @Target ~onAttack"],
    "triggers": ["~onAttack"],
    "conditions": [],
    "category": "combat",
    "icon": "🔥",
    "difficulty": "easy"
  }'::jsonb,
  'mob',
  ARRAY['fire', 'damage', 'combat']
),
(
  'YOUR_USER_ID_HERE',
  'Healing Aura',
  'Creates a healing aura that restores health to nearby players every second',
  '{
    "skillLines": ["- heal{a=5} @PlayersInRadius{r=10}"],
    "triggers": [],
    "conditions": [],
    "category": "healing",
    "icon": "💚",
    "difficulty": "easy"
  }'::jsonb,
  'skill',
  ARRAY['healing', 'aura', 'support']
);
*/

-- ============================================
-- CLEANUP (Optional - for development only)
-- ============================================

-- Uncomment below to completely remove the templates table and start fresh
/*
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS templates CASCADE;
*/
