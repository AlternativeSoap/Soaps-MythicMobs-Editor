-- =====================================================
-- MythicMobs Editor - Complete Database Schema
-- =====================================================
-- This is the complete, consolidated database schema
-- Run this in your Supabase SQL Editor to set up everything
-- Last Updated: December 16, 2025
-- =====================================================

-- =====================================================
-- 1. USER DATA TABLES
-- =====================================================

-- User settings and preferences
CREATE TABLE IF NOT EXISTS user_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,  -- TEXT to support both UUID and anonymous IDs
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- User projects/packs
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

-- =====================================================
-- 2. TEMPLATES SYSTEM
-- =====================================================

-- Templates table (mob/skill templates)
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
    data JSONB NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mob', 'skill')),
    tags TEXT[] DEFAULT '{}',
    structure_type TEXT NOT NULL DEFAULT 'multi-line' CHECK (structure_type IN ('single', 'multi-line', 'multi-section')),
    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 1
);

-- =====================================================
-- 3. ADMIN SYSTEM
-- =====================================================

-- Admin roles
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'template_admin', 'moderator')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, role)
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'template', 'user', 'role'
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES
-- =====================================================

-- User Data Indexes
CREATE INDEX IF NOT EXISTS idx_user_data_user_key ON user_data(user_id, key);
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- User Projects Indexes
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_updated ON user_projects(user_id, updated_at DESC);

-- Templates Indexes
CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_deleted_type ON templates(deleted, type) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
CREATE INDEX IF NOT EXISTS idx_templates_structure_type ON templates(structure_type);
CREATE INDEX IF NOT EXISTS idx_templates_is_official ON templates(is_official) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_templates_approved_by ON templates(approved_by);

-- Admin Indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_target ON admin_activity_log(target_type, target_id);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access" ON user_data;
DROP POLICY IF EXISTS "Allow all access" ON user_projects;
DROP POLICY IF EXISTS "Templates are publicly viewable" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
DROP POLICY IF EXISTS "Admins can view all admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON admin_roles;
DROP POLICY IF EXISTS "Template admins can view roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
DROP POLICY IF EXISTS "System can insert activity log" ON admin_activity_log;

-- User Data Policies (open access for anonymous users)
CREATE POLICY "Allow all access"
    ON user_data FOR ALL TO public
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access"
    ON user_projects FOR ALL TO public
    USING (true) WITH CHECK (true);

-- Templates Policies
CREATE POLICY "Templates are publicly viewable"
    ON templates FOR SELECT
    USING (deleted = false);

CREATE POLICY "Users can create templates"
    ON templates FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own templates"
    ON templates FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own templates"
    ON templates FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

-- Admin Roles Policies
CREATE POLICY "Admins can view all admin roles"
    ON admin_roles FOR SELECT
    USING (
        auth.uid() IN (SELECT user_id FROM admin_roles)
    );

CREATE POLICY "Super admins can manage all roles"
    ON admin_roles FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_roles WHERE role = 'super_admin'
        )
    );

-- Admin Activity Log Policies
CREATE POLICY "Admins can view activity log"
    ON admin_activity_log FOR SELECT
    USING (
        auth.uid() IN (SELECT user_id FROM admin_roles)
    );

CREATE POLICY "System can insert activity log"
    ON admin_activity_log FOR INSERT
    WITH CHECK (
        admin_user_id = auth.uid() AND
        auth.uid() IN (SELECT user_id FROM admin_roles)
    );

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Validate official template creation
CREATE OR REPLACE FUNCTION validate_official_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_official = true THEN
        IF NOT EXISTS (
            SELECT 1 FROM admin_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'template_admin')
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can create official templates';
        END IF;
        
        NEW.approved_by := auth.uid();
        NEW.approved_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.is_official = true AND OLD.is_official = false THEN
        INSERT INTO admin_activity_log (
            admin_user_id, action, target_type, target_id, details
        ) VALUES (
            auth.uid(), 'approve_template', 'template', NEW.id,
            jsonb_build_object(
                'template_name', NEW.name,
                'template_type', NEW.type,
                'previous_official', OLD.is_official
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = user_uuid AND role = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's highest admin role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM admin_roles
    WHERE user_id = user_uuid
    ORDER BY 
        CASE role
            WHEN 'super_admin' THEN 3
            WHEN 'template_admin' THEN 2
            WHEN 'moderator' THEN 1
            ELSE 0
        END DESC
    LIMIT 1;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP TRIGGER IF EXISTS trigger_validate_official_template ON templates;
DROP TRIGGER IF EXISTS trigger_log_template_approval ON templates;

-- Auto-update timestamps
CREATE TRIGGER update_user_data_updated_at
    BEFORE UPDATE ON user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Template validation and logging
CREATE TRIGGER trigger_validate_official_template
    BEFORE INSERT OR UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION validate_official_template();

CREATE TRIGGER trigger_log_template_approval
    AFTER UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

-- =====================================================
-- 8. VIEWS
-- =====================================================

-- View: Admin users with details
CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
    ar.id, ar.user_id, u.email, ar.role, ar.granted_by,
    granter.email as granted_by_email, ar.granted_at, ar.notes
FROM admin_roles ar
JOIN auth.users u ON u.id = ar.user_id
LEFT JOIN auth.users granter ON granter.id = ar.granted_by
ORDER BY 
    CASE ar.role
        WHEN 'super_admin' THEN 3
        WHEN 'template_admin' THEN 2
        WHEN 'moderator' THEN 1
    END DESC, ar.granted_at DESC;

-- View: Recent admin activity
CREATE OR REPLACE VIEW admin_activity_recent AS
SELECT 
    aal.id, u.email as admin_email, aal.action,
    aal.target_type, aal.target_id, aal.details, aal.created_at
FROM admin_activity_log aal
JOIN auth.users u ON u.id = aal.admin_user_id
ORDER BY aal.created_at DESC LIMIT 100;

-- View: Official templates with approver info
CREATE OR REPLACE VIEW official_templates_view AS
SELECT 
    t.id, t.name, t.type, t.data->>'category' as category,
    t.structure_type, t.owner_id, creator.email as created_by_email,
    approver.email as approved_by_email, t.approved_at, t.created_at
FROM templates t
JOIN auth.users creator ON creator.id = t.owner_id
LEFT JOIN auth.users approver ON approver.id = t.approved_by
WHERE t.is_official = true
ORDER BY t.approved_at DESC;

-- =====================================================
-- 9. PERMISSIONS
-- =====================================================

-- Grant access to anonymous and authenticated users
GRANT ALL ON user_data TO anon, authenticated;
GRANT ALL ON user_projects TO anon, authenticated;
GRANT SELECT ON templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON templates TO authenticated;
GRANT SELECT ON admin_roles TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;
GRANT SELECT ON admin_users_view TO authenticated;
GRANT SELECT ON admin_activity_recent TO authenticated;
GRANT SELECT ON official_templates_view TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE user_data IS 'Stores user pack data and editor settings';
COMMENT ON TABLE user_projects IS 'Stores user projects/packs';
COMMENT ON TABLE templates IS 'Mob and skill templates (official and community)';
COMMENT ON TABLE admin_roles IS 'Admin role assignments';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for admin actions';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

/*
=============================================================
POST-INSTALLATION STEPS:
=============================================================

1. CREATE FIRST SUPER ADMIN:
   
   -- Find your user ID
   SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';
   
   -- Grant super_admin role (replace USER_ID with actual UUID)
   INSERT INTO admin_roles (user_id, role, granted_by, notes)
   VALUES (
       'USER_ID_HERE',
       'super_admin',
       'USER_ID_HERE',
       'Initial super admin'
   );

2. VERIFY INSTALLATION:

   -- Check tables
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('user_data', 'user_projects', 'templates', 'admin_roles', 'admin_activity_log');
   
   -- Check RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND rowsecurity = true;
   
   -- Check policies
   SELECT tablename, policyname FROM pg_policies 
   WHERE schemaname = 'public';

=============================================================
*/
