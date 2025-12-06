-- Fix RLS Policies for user_data table
-- Run this in Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all access" ON user_data;
DROP POLICY IF EXISTS "Users can access their own data" ON user_data;
DROP POLICY IF EXISTS "Enable read access for users" ON user_data;
DROP POLICY IF EXISTS "Enable insert for users" ON user_data;
DROP POLICY IF EXISTS "Enable update for users" ON user_data;
DROP POLICY IF EXISTS "Enable delete for users" ON user_data;

-- Disable RLS temporarily to test
ALTER TABLE user_data DISABLE ROW LEVEL SECURITY;

-- OR keep RLS enabled with permissive policies:
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create separate policies for each operation
CREATE POLICY "Enable SELECT for all users"
    ON user_data
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable INSERT for all users"
    ON user_data
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable UPDATE for all users"
    ON user_data
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable DELETE for all users"
    ON user_data
    FOR DELETE
    TO public
    USING (true);

-- Grant necessary permissions
GRANT ALL ON user_data TO anon;
GRANT ALL ON user_data TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
