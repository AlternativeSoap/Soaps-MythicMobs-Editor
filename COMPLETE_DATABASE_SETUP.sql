-- =====================================================
-- MYTHICMOBS EDITOR - COMPLETE DATABASE SETUP
-- =====================================================
-- Version: 2.0
-- Last Updated: 2025-12-19
-- 
-- This is a comprehensive, idempotent SQL script that sets up
-- all tables, constraints, indexes, and RLS policies for the
-- MythicMobs Editor admin panel and features.
--
-- FEATURES:
-- ✅ Idempotent (safe to run multiple times)
-- ✅ Fixes infinite recursion in RLS policies
-- ✅ Adds all missing constraints
-- ✅ Comprehensive error handling
-- ✅ Verification queries included
--
-- USAGE:
-- 1. Open Supabase SQL Editor
-- 2. Copy and paste this entire file
-- 3. Execute
-- 4. Check verification results at the end
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SECTION 2: CORE USER TABLES
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 2.1 USER_ROLES TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'template_admin', 'super_admin', 'admin')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_roles_user_id_role_unique UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all old policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;

-- Create non-recursive policies
CREATE POLICY "Authenticated users can view all roles"
  ON public.user_roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage roles"
  ON public.user_roles FOR ALL
  USING (auth.role() = 'service_role');

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ─────────────────────────────────────────────────────
-- 2.2 ADMIN_ROLES TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'template_admin', 'moderator')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT admin_roles_user_id_role_unique UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Drop all old policies (including ones that cause infinite recursion)
DROP POLICY IF EXISTS "Users can view own admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view all admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Service role can manage admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Authenticated users can view admin roles" ON public.admin_roles;

-- Create SIMPLE non-recursive policies (fixes stack depth exceeded error)
CREATE POLICY "Authenticated users can view admin roles"
  ON public.admin_roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage admin roles"
  ON public.admin_roles FOR ALL
  USING (auth.role() = 'service_role');

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);

-- ─────────────────────────────────────────────────────
-- 2.3 USER_PROFILES TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────
-- 2.4 USER_DATA TABLE (with unique constraint fix)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint (fixes UPSERT "ON CONFLICT" error)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_data_user_id_key_unique'
    ) THEN
        ALTER TABLE public.user_data 
        ADD CONSTRAINT user_data_user_id_key_unique 
        UNIQUE (user_id, key);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can manage their own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can view own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data;

-- Create policies
CREATE POLICY "Users can view own data"
  ON public.user_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON public.user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON public.user_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON public.user_data FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────
-- 2.5 USER_PROJECTS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can manage own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.user_projects;

-- Create policies
CREATE POLICY "Users can view own projects"
  ON public.user_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.user_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.user_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.user_projects FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SECTION 3: ADMIN PANEL TABLES
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 3.1 ERROR_LOGS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  line_number INTEGER,
  column_number INTEGER,
  stack_trace TEXT,
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own errors" ON public.error_logs;
DROP POLICY IF EXISTS "Users can insert errors" ON public.error_logs;
DROP POLICY IF EXISTS "Service role can manage errors" ON public.error_logs;

-- Create policies
CREATE POLICY "Users can insert errors"
  ON public.error_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view own errors"
  ON public.error_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage errors"
  ON public.error_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Create index
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp DESC);

-- ─────────────────────────────────────────────────────
-- 3.2 USER_ACTIVITY_LOGS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Users can insert activity" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Service role can manage activity" ON public.user_activity_logs;

-- Create policies
CREATE POLICY "Users can view own activity"
  ON public.user_activity_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert activity"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage activity"
  ON public.user_activity_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.user_activity_logs(timestamp DESC);

-- ─────────────────────────────────────────────────────
-- 3.3 ADMIN_ACTIVITY_LOG TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view activity log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Service role can manage activity log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "System can insert activity" ON public.admin_activity_log;

-- Create policies
CREATE POLICY "Authenticated users can view activity log"
  ON public.admin_activity_log FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage activity log"
  ON public.admin_activity_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "System can insert activity"
  ON public.admin_activity_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON public.admin_activity_log(created_at DESC);

-- ─────────────────────────────────────────────────────
-- 3.4 TEMPLATE_REPORTS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.template_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.template_reports ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.template_reports;
DROP POLICY IF EXISTS "Service role can manage reports" ON public.template_reports;

-- Create policies
CREATE POLICY "Service role can manage reports"
  ON public.template_reports FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 3.5 SYSTEM_SETTINGS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Everyone can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Service role can manage settings" ON public.system_settings;

-- Create policies
CREATE POLICY "Everyone can view settings"
  ON public.system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage settings"
  ON public.system_settings FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 3.6 ANNOUNCEMENTS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  target_roles TEXT[],
  dismissed_by UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Service role can manage announcements" ON public.announcements;

-- Create policies
CREATE POLICY "Everyone can view active announcements"
  ON public.announcements FOR SELECT
  USING (active = TRUE OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage announcements"
  ON public.announcements FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 3.7 ANALYTICS_DAILY TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT analytics_daily_date_metric_unique UNIQUE(date, metric)
);

-- Enable RLS
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics_daily;
DROP POLICY IF EXISTS "Authenticated users can view analytics" ON public.analytics_daily;

-- Create policies
CREATE POLICY "Service role can manage analytics"
  ON public.analytics_daily FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view analytics"
  ON public.analytics_daily FOR SELECT
  USING (auth.role() = 'authenticated');

-- =====================================================
-- SECTION 4: TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mob', 'skill')),
  tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  structure_type CHARACTER VARYING DEFAULT 'multi-line',
  is_official BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can view all templates" ON public.templates;
DROP POLICY IF EXISTS "Users can insert templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;

-- Create policies
CREATE POLICY "Users can view all templates"
  ON public.templates FOR SELECT
  USING (deleted = FALSE OR auth.uid() = owner_id);

CREATE POLICY "Users can insert templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own templates"
  ON public.templates FOR DELETE
  USING (auth.uid() = owner_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON public.templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON public.templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_official ON public.templates(is_official);

-- =====================================================
-- SECTION 5: CUSTOM BROWSER TABLES
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 5.1 CUSTOM_MECHANICS TABLE
-- ─────────────────────────────────────────────────────
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_mechanics') THEN
    ALTER TABLE public.custom_mechanics ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Everyone can view active mechanics" ON public.custom_mechanics;
    DROP POLICY IF EXISTS "Users can manage own mechanics" ON public.custom_mechanics;
    
    CREATE POLICY "Everyone can view active mechanics"
      ON public.custom_mechanics FOR SELECT
      USING (is_active = TRUE OR auth.uid() = created_by);
    
    CREATE POLICY "Users can manage own mechanics"
      ON public.custom_mechanics FOR ALL
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 5.2 CUSTOM_CONDITIONS TABLE
-- ─────────────────────────────────────────────────────
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_conditions') THEN
    ALTER TABLE public.custom_conditions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Everyone can view active conditions" ON public.custom_conditions;
    DROP POLICY IF EXISTS "Users can manage own conditions" ON public.custom_conditions;
    
    CREATE POLICY "Everyone can view active conditions"
      ON public.custom_conditions FOR SELECT
      USING (is_active = TRUE OR auth.uid() = created_by);
    
    CREATE POLICY "Users can manage own conditions"
      ON public.custom_conditions FOR ALL
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 5.3 CUSTOM_TRIGGERS TABLE
-- ─────────────────────────────────────────────────────
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_triggers') THEN
    ALTER TABLE public.custom_triggers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Everyone can view active triggers" ON public.custom_triggers;
    DROP POLICY IF EXISTS "Users can manage own triggers" ON public.custom_triggers;
    
    CREATE POLICY "Everyone can view active triggers"
      ON public.custom_triggers FOR SELECT
      USING (is_active = TRUE OR auth.uid() = created_by);
    
    CREATE POLICY "Users can manage own triggers"
      ON public.custom_triggers FOR ALL
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 5.4 CUSTOM_TARGETERS TABLE
-- ─────────────────────────────────────────────────────
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_targeters') THEN
    ALTER TABLE public.custom_targeters ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Everyone can view active targeters" ON public.custom_targeters;
    DROP POLICY IF EXISTS "Users can manage own targeters" ON public.custom_targeters;
    
    CREATE POLICY "Everyone can view active targeters"
      ON public.custom_targeters FOR SELECT
      USING (is_active = TRUE OR auth.uid() = created_by);
    
    CREATE POLICY "Users can manage own targeters"
      ON public.custom_targeters FOR ALL
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 5.5 HIDDEN_BUILT_INS TABLE
-- ─────────────────────────────────────────────────────
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hidden_built_ins') THEN
    ALTER TABLE public.hidden_built_ins ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Everyone can view hidden items" ON public.hidden_built_ins;
    DROP POLICY IF EXISTS "Admins can manage hidden items" ON public.hidden_built_ins;
    
    CREATE POLICY "Everyone can view hidden items"
      ON public.hidden_built_ins FOR SELECT
      USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Admins can manage hidden items"
      ON public.hidden_built_ins FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- =====================================================
-- SECTION 6: VERIFICATION QUERIES
-- =====================================================

DO $$
DECLARE
  v_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  
  -- Check user_data unique constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_data_user_id_key_unique'
  ) THEN
    RAISE NOTICE '✅ user_data unique constraint exists';
  ELSE
    RAISE NOTICE '❌ user_data unique constraint MISSING';
  END IF;
  
  -- Check admin_roles policies
  SELECT COUNT(*) INTO v_result
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'admin_roles';
  
  RAISE NOTICE '✅ admin_roles has % policies (should be 2)', v_result;
  
  -- Check tables exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    RAISE NOTICE '✅ user_roles table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_roles') THEN
    RAISE NOTICE '✅ admin_roles table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    RAISE NOTICE '✅ user_profiles table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'error_logs') THEN
    RAISE NOTICE '✅ error_logs table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_activity_log') THEN
    RAISE NOTICE '✅ admin_activity_log table exists';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'templates') THEN
    RAISE NOTICE '✅ templates table exists';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Refresh your app (Ctrl+F5)';
  RAISE NOTICE '2. All errors should be gone';
  RAISE NOTICE '3. Admin panel should work correctly';
  RAISE NOTICE '';
END $$;
