-- Supabase Database Schema for MythicMobs Editor
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- =====================================================
-- Table 1: user_data (for settings and preferences)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_data_user_key ON user_data(user_id, key);
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access their own data (including anonymous)
CREATE POLICY "Users can access their own data"
    ON user_data
    FOR ALL
    USING (true)  -- Allow all for anonymous users
    WITH CHECK (true);

-- =====================================================
-- Table 2: user_projects (for pack/project data)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_name TEXT NOT NULL DEFAULT 'Untitled Pack',
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for user_projects
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_updated ON user_projects(user_id, updated_at DESC);

-- Enable RLS for user_projects
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- Policy for user_projects (users can only access their own projects)
CREATE POLICY "Users can access their own projects"
    ON user_projects
    FOR ALL
    USING (true)  -- Allow all for anonymous users
    WITH CHECK (true);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_user_data_updated_at
    BEFORE UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant access to anonymous users
GRANT ALL ON user_data TO anon;
GRANT ALL ON user_data TO authenticated;

COMMENT ON TABLE user_data IS 'Stores user pack data and editor settings for MythicMobs Editor';
COMMENT ON COLUMN user_data.user_id IS 'User identifier (authenticated user ID or anonymous session ID)';
COMMENT ON COLUMN user_data.key IS 'Data key (e.g., "packs", "settings")';
COMMENT ON COLUMN user_data.value IS 'JSON data stored for this key';
