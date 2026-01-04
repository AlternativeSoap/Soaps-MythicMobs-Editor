# Database Tables Required

Complete list of tables needed for the MythicMobs Editor to work correctly.

---

## 1. `user_profiles`

**Purpose:** Store user display names and extended profile data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Links to Supabase auth |
| `email` | VARCHAR(255) | NOT NULL | User email (synced from auth) |
| `display_name` | VARCHAR(100) | | Public display name |
| `avatar_url` | TEXT | | Profile picture URL |
| `bio` | TEXT | | Short description about the user |
| `website_url` | TEXT | | Personal website link |
| `discord_username` | VARCHAR(100) | | Discord tag for contact |
| `is_public` | BOOLEAN | DEFAULT true | Show profile to other users |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Used by:** `userProfileManager.js`, `adminManager.js`, `adminPanelEnhanced.js`

```sql
-- =============================================
-- TABLE: user_profiles
-- =============================================
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    website_url TEXT,
    discord_username VARCHAR(100),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 2. `user_data`

**Purpose:** Cloud sync for user packs and settings (key-value storage).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | |
| `key` | VARCHAR(255) | NOT NULL | Storage key (e.g., "mythicmobs_packs") |
| `value` | JSONB | | The stored data |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(user_id, key)`

**Used by:** `supabaseClient.js`, `authManager.js`

```sql
-- =============================================
-- TABLE: user_data
-- =============================================
CREATE TABLE user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, key)
);

-- Index for fast lookups
CREATE INDEX idx_user_data_user_key ON user_data(user_id, key);

-- RLS Policies
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
    ON user_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
    ON user_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
    ON user_data FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
    ON user_data FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 3. `templates`

**Purpose:** Store user-created mob and skill templates with statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `owner_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Template creator |
| `name` | VARCHAR(50) | NOT NULL | Template name (3-50 chars) |
| `description` | TEXT | NOT NULL | Template description (10-500 chars) |
| `type` | VARCHAR(20) | NOT NULL | 'mob' or 'skill' |
| `structure_type` | VARCHAR(50) | | 'inline', 'skill', 'multi-skill' |
| `is_official` | BOOLEAN | DEFAULT FALSE | Official/approved template |
| `approval_status` | VARCHAR(20) | DEFAULT 'approved' | 'pending', 'approved', 'rejected' |
| `approved_by` | UUID | REFERENCES auth.users(id) | Admin who approved/rejected |
| `approved_at` | TIMESTAMPTZ | | When template was approved/rejected |
| `rejection_reason` | TEXT | | Reason for rejection (if rejected) |
| `tags` | TEXT[] | DEFAULT '{}' | Searchable tags |
| `data` | JSONB | NOT NULL | Template content (sections, skillLines, triggers, etc.) |
| `deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `view_count` | INTEGER | DEFAULT 0 | Times template was viewed |
| `use_count` | INTEGER | DEFAULT 0 | Times template was used/downloaded |
| `average_rating` | DECIMAL(3,2) | DEFAULT 0 | Average star rating (1-5) |
| `rating_count` | INTEGER | DEFAULT 0 | Number of ratings received |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Used by:** `templateManager.js`, `templateMigration.js`, `adminPanelEnhanced.js`, `adminManager.js`, `templateSelector.js`

```sql
-- =============================================
-- TABLE: templates
-- =============================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('mob', 'skill')),
    structure_type VARCHAR(50),
    is_official BOOLEAN DEFAULT FALSE,
    -- Approval workflow columns
    approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    tags TEXT[] DEFAULT '{}',
    data JSONB NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    -- Statistics columns (auto-updated by triggers)
    view_count INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_owner ON templates(owner_id);
CREATE INDEX idx_templates_type ON templates(type) WHERE deleted = false;
CREATE INDEX idx_templates_official ON templates(is_official) WHERE deleted = false;
CREATE INDEX idx_templates_approval_status ON templates(approval_status) WHERE deleted = false;
-- Statistics indexes for sorting/filtering
CREATE INDEX idx_templates_rating ON templates(average_rating DESC) WHERE deleted = false;
CREATE INDEX idx_templates_views ON templates(view_count DESC) WHERE deleted = false;
CREATE INDEX idx_templates_uses ON templates(use_count DESC) WHERE deleted = false;
CREATE INDEX idx_templates_created ON templates(created_at DESC) WHERE deleted = false;

-- RLS Policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted templates"
    ON templates FOR SELECT
    USING (deleted = false);

CREATE POLICY "Authenticated users can create templates"
    ON templates FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own templates"
    ON templates FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own templates"
    ON templates FOR DELETE
    USING (auth.uid() = owner_id);

-- Function to increment view count (called via RPC)
CREATE OR REPLACE FUNCTION increment_template_view(template_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE templates SET view_count = view_count + 1 WHERE id = template_id AND deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Function to increment use count (called via RPC)
CREATE OR REPLACE FUNCTION increment_template_use(template_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE templates SET use_count = use_count + 1 WHERE id = template_id AND deleted = false;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. `template_ratings`

**Purpose:** Allow users to rate templates (1-5 stars). Auto-updates `average_rating` and `rating_count` on `templates` table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `template_id` | UUID | NOT NULL, REFERENCES templates(id) ON DELETE CASCADE | |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | |
| `rating` | INTEGER | NOT NULL CHECK (rating >= 1 AND rating <= 5) | 1-5 stars |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(template_id, user_id)` - One rating per user per template

**Used by:** `templateSelector.js` (future), `templateManager.js` (future)

```sql
-- =============================================
-- TABLE: template_ratings
-- =============================================
CREATE TABLE template_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(template_id, user_id)
);

-- Indexes
CREATE INDEX idx_template_ratings_template ON template_ratings(template_id);
CREATE INDEX idx_template_ratings_user ON template_ratings(user_id);

-- Function to auto-update template rating stats
CREATE OR REPLACE FUNCTION update_template_rating_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE templates
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
            FROM template_ratings
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM template_ratings
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.template_id, OLD.template_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger fires on INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_update_template_rating_stats
    AFTER INSERT OR UPDATE OR DELETE ON template_ratings
    FOR EACH ROW EXECUTE FUNCTION update_template_rating_stats();

-- RLS Policies
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
    ON template_ratings FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can rate templates"
    ON template_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON template_ratings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
    ON template_ratings FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 5. `user_favorites`

**Purpose:** Cloud-synced favorites (replaces localStorage-only favorites).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | |
| `template_id` | UUID | NOT NULL, REFERENCES templates(id) ON DELETE CASCADE | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(user_id, template_id)` - One favorite per user per template

**Used by:** `templateSelector.js`, `smartFavoritesManager.js`

```sql
-- =============================================
-- TABLE: user_favorites
-- =============================================
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_id)
);

-- Indexes
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_template ON user_favorites(template_id);

-- RLS Policies
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
    ON user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
    ON user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
    ON user_favorites FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 6. `admin_roles`

**Purpose:** Define admin permissions for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | |
| `role` | VARCHAR(50) | NOT NULL | 'super_admin', 'admin', 'moderator', 'content_editor' |
| `granted_by` | UUID | REFERENCES auth.users(id) | Who granted the role |
| `granted_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `notes` | TEXT | | Reason for granting |

**Unique constraint:** `(user_id, role)`

**Used by:** `adminManager.js`, `adminPanelEnhanced.js`

```sql
-- =============================================
-- TABLE: admin_roles
-- =============================================
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'content_editor')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    UNIQUE(user_id, role)
);

-- Index
CREATE INDEX idx_admin_roles_user ON admin_roles(user_id);

-- RLS Policies
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all roles"
    ON admin_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Super admins can insert roles"
    ON admin_roles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete roles"
    ON admin_roles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role = 'super_admin'
        )
    );
```

---

## 7. `admin_activity_log`

**Purpose:** Audit log for admin actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `admin_user_id` | UUID | NOT NULL, REFERENCES auth.users(id) | Admin who performed action |
| `action` | VARCHAR(100) | NOT NULL | Action type (e.g., 'grant_role', 'revoke_role') |
| `target_type` | VARCHAR(50) | | 'user', 'template', etc. |
| `target_id` | VARCHAR(255) | | ID of affected item |
| `details` | JSONB | | Additional action details |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Used by:** `adminManager.js`

```sql
-- =============================================
-- TABLE: admin_activity_log
-- =============================================
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_admin_activity_created ON admin_activity_log(created_at DESC);

-- RLS Policies
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
    ON admin_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can insert activity log"
    ON admin_activity_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid()
        )
    );
```

---

## 8. `user_activity_logs`

**Purpose:** Track user activity for analytics and admin monitoring (includes template deletions).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `user_id` | UUID | REFERENCES auth.users(id) ON DELETE SET NULL | |
| `activity_type` | VARCHAR(100) | NOT NULL | Activity type (e.g., delete_user_template) |
| `details` | JSONB | | Activity details |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | |

**Used by:** `adminPanelEnhanced.js` (analytics), `adminManager.js` (activity log), `templateSelector.js` (deletion tracking)

```sql
-- =============================================
-- TABLE: user_activity_logs
-- =============================================
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_activity_timestamp ON user_activity_logs(timestamp DESC);
CREATE INDEX idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_type ON user_activity_logs(activity_type);

-- RLS Policies
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity"
    ON user_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Authenticated users can log activity"
    ON user_activity_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 9. `error_logs`

**Purpose:** Client-side error logging for debugging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `user_id` | UUID | REFERENCES auth.users(id) ON DELETE SET NULL | |
| `error_type` | VARCHAR(100) | | Error category |
| `message` | TEXT | NOT NULL | Error message |
| `source` | TEXT | | Source file/URL |
| `line` | INTEGER | | Line number |
| `column` | INTEGER | | Column number |
| `stack` | TEXT | | Stack trace |
| `user_agent` | TEXT | | Browser info |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | |

**Used by:** `errorLogger.js`

```sql
-- =============================================
-- TABLE: error_logs
-- =============================================
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type VARCHAR(100),
    message TEXT NOT NULL,
    source TEXT,
    line INTEGER,
    "column" INTEGER,
    stack TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);

-- RLS Policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error logs"
    ON error_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Authenticated users can log errors"
    ON error_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 10. `custom_mechanics`

**Purpose:** Admin-defined custom MythicMobs mechanics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(100) | PRIMARY KEY | Mechanic ID (e.g., 'customFireball') |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `aliases` | TEXT[] | DEFAULT '{}' | Alternative names |
| `item_aliases` | TEXT[] | DEFAULT '{}' | Item-level aliases |
| `category` | VARCHAR(100) | NOT NULL | Category for grouping |
| `description` | TEXT | | What the mechanic does |
| `attributes` | JSONB | DEFAULT '[]' | Array of attribute definitions |
| `examples` | TEXT[] | DEFAULT '{}' | Usage examples |
| `tags` | TEXT[] | DEFAULT '{}' | Searchable tags |
| `dropdown_config` | JSONB | DEFAULT '{}' | Dropdown UI config |
| `default_targeter` | VARCHAR(100) | DEFAULT '@Target' | Default targeter |
| `created_by` | UUID | REFERENCES auth.users(id) | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_by` | UUID | REFERENCES auth.users(id) | |

**Used by:** `browserDataMerger.js`, `browserAdminManager.js`

```sql
-- =============================================
-- TABLE: custom_mechanics
-- =============================================
CREATE TABLE custom_mechanics (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    default_targeter VARCHAR(100) DEFAULT '@Target',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE custom_mechanics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom mechanics"
    ON custom_mechanics FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert custom mechanics"
    ON custom_mechanics FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can update custom mechanics"
    ON custom_mechanics FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can delete custom mechanics"
    ON custom_mechanics FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );
```

---

## 11. `custom_conditions`

**Purpose:** Admin-defined custom MythicMobs conditions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(100) | PRIMARY KEY | Condition ID |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `aliases` | TEXT[] | DEFAULT '{}' | Alternative names |
| `item_aliases` | TEXT[] | DEFAULT '{}' | Item-level aliases |
| `category` | VARCHAR(100) | NOT NULL | Category for grouping |
| `description` | TEXT | | What the condition checks |
| `attributes` | JSONB | DEFAULT '[]' | Array of attribute definitions |
| `examples` | TEXT[] | DEFAULT '{}' | Usage examples |
| `tags` | TEXT[] | DEFAULT '{}' | Searchable tags |
| `dropdown_config` | JSONB | DEFAULT '{}' | Dropdown UI config |
| `created_by` | UUID | REFERENCES auth.users(id) | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_by` | UUID | REFERENCES auth.users(id) | |

**Used by:** `browserDataMerger.js`, `browserAdminManager.js`

```sql
-- =============================================
-- TABLE: custom_conditions
-- =============================================
CREATE TABLE custom_conditions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE custom_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom conditions"
    ON custom_conditions FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert custom conditions"
    ON custom_conditions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can update custom conditions"
    ON custom_conditions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can delete custom conditions"
    ON custom_conditions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );
```

---

## 12. `custom_triggers`

**Purpose:** Admin-defined custom MythicMobs triggers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(100) | PRIMARY KEY | Trigger ID |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `aliases` | TEXT[] | DEFAULT '{}' | Alternative names |
| `item_aliases` | TEXT[] | DEFAULT '{}' | Item-level aliases |
| `category` | VARCHAR(100) | NOT NULL | Category for grouping |
| `description` | TEXT | | When the trigger fires |
| `attributes` | JSONB | DEFAULT '[]' | Array of attribute definitions |
| `examples` | TEXT[] | DEFAULT '{}' | Usage examples |
| `tags` | TEXT[] | DEFAULT '{}' | Searchable tags |
| `dropdown_config` | JSONB | DEFAULT '{}' | Dropdown UI config |
| `has_target` | BOOLEAN | DEFAULT FALSE | If trigger provides a target |
| `target_description` | TEXT | | Target description |
| `placeholders` | TEXT[] | DEFAULT '{}' | Available placeholders |
| `parameters` | JSONB | DEFAULT '{}' | Trigger parameters |
| `created_by` | UUID | REFERENCES auth.users(id) | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_by` | UUID | REFERENCES auth.users(id) | |

**Used by:** `browserDataMerger.js`, `browserAdminManager.js`

```sql
-- =============================================
-- TABLE: custom_triggers
-- =============================================
CREATE TABLE custom_triggers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    has_target BOOLEAN DEFAULT FALSE,
    target_description TEXT,
    placeholders TEXT[] DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE custom_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom triggers"
    ON custom_triggers FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert custom triggers"
    ON custom_triggers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can update custom triggers"
    ON custom_triggers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can delete custom triggers"
    ON custom_triggers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );
```

---

## 13. `custom_targeters`

**Purpose:** Admin-defined custom MythicMobs targeters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(100) | PRIMARY KEY | Targeter ID |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `aliases` | TEXT[] | DEFAULT '{}' | Alternative names |
| `item_aliases` | TEXT[] | DEFAULT '{}' | Item-level aliases |
| `category` | VARCHAR(100) | NOT NULL | Category for grouping |
| `description` | TEXT | | What the targeter selects |
| `attributes` | JSONB | DEFAULT '[]' | Array of attribute definitions |
| `examples` | TEXT[] | DEFAULT '{}' | Usage examples |
| `tags` | TEXT[] | DEFAULT '{}' | Searchable tags |
| `dropdown_config` | JSONB | DEFAULT '{}' | Dropdown UI config |
| `requirements` | TEXT[] | DEFAULT '{}' | Requirements/limitations |
| `created_by` | UUID | REFERENCES auth.users(id) | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_by` | UUID | REFERENCES auth.users(id) | |

**Used by:** `browserDataMerger.js`, `browserAdminManager.js`

```sql
-- =============================================
-- TABLE: custom_targeters
-- =============================================
CREATE TABLE custom_targeters (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE custom_targeters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom targeters"
    ON custom_targeters FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert custom targeters"
    ON custom_targeters FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can update custom targeters"
    ON custom_targeters FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin', 'content_editor')
        )
    );

CREATE POLICY "Admins can delete custom targeters"
    ON custom_targeters FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('super_admin', 'admin')
        )
    );
```

---

## 14. `hidden_built_ins`

**Purpose:** Track which built-in items are hidden from browsers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `item_type` | VARCHAR(50) | NOT NULL | 'mechanic', 'condition', 'trigger', 'targeter' |
| `item_id` | VARCHAR(100) | NOT NULL | Built-in item's ID |
| `hidden_by` | UUID | REFERENCES auth.users(id) | Admin who hid it |
| `hidden_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique constraint:** `(item_type, item_id)`

**Used by:** `browserDataMerger.js`, `browserAdminManager.js`

```sql
-- =============================================
-- TABLE: hidden_built_ins
-- =============================================
CREATE TABLE hidden_built_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('mechanic', 'condition', 'trigger', 'targeter')),
    item_id VARCHAR(100) NOT NULL,
    hidden_by UUID REFERENCES auth.users(id),
    hidden_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(item_type, item_id)
);

-- Index
CREATE INDEX idx_hidden_built_ins_type ON hidden_built_ins(item_type);

-- RLS Policies
ALTER TABLE hidden_built_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hidden items"
    ON hidden_built_ins FOR SELECT
    USING (true);

CREATE POLICY "Super admins can hide items"
    ON hidden_built_ins FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can unhide items"
    ON hidden_built_ins FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role = 'super_admin'
        )
    );
```

---

## 15. `template_comments`

**Purpose:** Allow users to comment on templates with threaded replies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| `template_id` | UUID | NOT NULL, REFERENCES templates(id) ON DELETE CASCADE | Template being commented on |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Comment author |
| `parent_id` | UUID | REFERENCES template_comments(id) ON DELETE CASCADE | Parent comment (for replies) |
| `content` | TEXT | NOT NULL, CHECK (length 1-2000) | Comment text |
| `is_edited` | BOOLEAN | DEFAULT false | Was comment edited |
| `is_deleted` | BOOLEAN | DEFAULT false | Soft delete for threads |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Used by:** `templateManager.js`, `templateSelector.js`

```sql
-- =============================================
-- TABLE: template_comments
-- =============================================
CREATE TABLE template_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES template_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment_count to templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX idx_comments_template ON template_comments(template_id);
CREATE INDEX idx_comments_user ON template_comments(user_id);
CREATE INDEX idx_comments_parent ON template_comments(parent_id);
CREATE INDEX idx_comments_created ON template_comments(created_at DESC);

-- Trigger function to update comment count
CREATE OR REPLACE FUNCTION update_template_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
        UPDATE templates SET comment_count = comment_count + 1 WHERE id = NEW.template_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
        UPDATE templates SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
        UPDATE templates SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.template_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR UPDATE OR DELETE ON template_comments
    FOR EACH ROW EXECUTE FUNCTION update_template_comment_count();

-- RLS Policies
ALTER TABLE template_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted comments"
    ON template_comments FOR SELECT
    USING (is_deleted = false);

CREATE POLICY "Authenticated users can comment"
    ON template_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments"
    ON template_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON template_comments FOR DELETE
    USING (auth.uid() = user_id);
```

---

## Summary Table Count: 15 Tables

| # | Table Name | Required For |
|---|------------|--------------|
| 1 | `user_profiles` | User accounts & display names |
| 2 | `user_data` | Cloud sync for packs/settings |
| 3 | `templates` | Skill/mob template library (with stats columns) |
| 4 | `template_ratings` | ⭐ 1-5 star ratings (auto-updates templates.average_rating) |
| 5 | `user_favorites` | ❤️ Cloud-synced favorites (replaces localStorage) |
| 6 | `admin_roles` | Admin permissions |
| 7 | `admin_activity_log` | Admin audit trail |
| 8 | `user_activity_logs` | Analytics |
| 9 | `error_logs` | Error tracking |
| 10 | `custom_mechanics` | Custom mechanics browser |
| 11 | `custom_conditions` | Custom conditions browser |
| 12 | `custom_triggers` | Custom triggers browser |
| 13 | `custom_targeters` | Custom targeters browser |
| 14 | `hidden_built_ins` | Hide built-in browser items |
| 15 | `template_comments` | 💬 Comment system on templates |

### New Features Enabled:
- ⭐ **Ratings:** Users can rate templates 1-5 stars
- 📊 **Statistics:** view_count, use_count, average_rating on templates
- ❤️ **Cloud Favorites:** Favorites sync across devices (not just localStorage)
- 💬 **Comments:** Users can comment on templates with user profile popups
- 📈 **Popularity Sorting:** Sort by views, uses, or rating

---

## Quick Setup: Run All SQL

> ⚠️ **IMPORTANT:** Run **ONLY** this section below. Do NOT run the individual SQL blocks from sections 1-14 above - they are for reference/documentation only. Running both will cause duplicate errors!

Copy and run this complete script in Supabase SQL Editor:

```sql
-- =============================================
-- COMPLETE DATABASE SETUP SCRIPT
-- MythicMobs Editor - 14 Tables - Run in order
-- =============================================

-- 1. USER_PROFILES
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    website_url TEXT,
    discord_username VARCHAR(100),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. USER_DATA
CREATE TABLE user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, key)
);

CREATE INDEX idx_user_data_user_key ON user_data(user_id, key);
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON user_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON user_data FOR DELETE USING (auth.uid() = user_id);

-- 3. TEMPLATES (with statistics columns)
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('mob', 'skill')),
    structure_type VARCHAR(50),
    is_official BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    data JSONB NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    -- Statistics columns (auto-updated by triggers)
    view_count INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_owner ON templates(owner_id);
CREATE INDEX idx_templates_type ON templates(type) WHERE deleted = false;
CREATE INDEX idx_templates_official ON templates(is_official) WHERE deleted = false;
CREATE INDEX idx_templates_rating ON templates(average_rating DESC) WHERE deleted = false;
CREATE INDEX idx_templates_views ON templates(view_count DESC) WHERE deleted = false;
CREATE INDEX idx_templates_uses ON templates(use_count DESC) WHERE deleted = false;
CREATE INDEX idx_templates_created ON templates(created_at DESC) WHERE deleted = false;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted templates" ON templates FOR SELECT USING (deleted = false);
CREATE POLICY "Authenticated users can create templates" ON templates FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (auth.uid() = owner_id);

-- RPC functions for incrementing counts (call from JS)
CREATE OR REPLACE FUNCTION increment_template_view(template_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE templates SET view_count = view_count + 1 WHERE id = template_id AND deleted = false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_template_use(template_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE templates SET use_count = use_count + 1 WHERE id = template_id AND deleted = false;
END;
$$ LANGUAGE plpgsql;

-- 4. TEMPLATE_RATINGS (auto-updates templates.average_rating)
CREATE TABLE template_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

CREATE INDEX idx_template_ratings_template ON template_ratings(template_id);
CREATE INDEX idx_template_ratings_user ON template_ratings(user_id);

CREATE OR REPLACE FUNCTION update_template_rating_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE templates
    SET 
        average_rating = (SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0) FROM template_ratings WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)),
        rating_count = (SELECT COUNT(*) FROM template_ratings WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.template_id, OLD.template_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_rating_stats
    AFTER INSERT OR UPDATE OR DELETE ON template_ratings
    FOR EACH ROW EXECUTE FUNCTION update_template_rating_stats();

ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON template_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON template_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON template_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON template_ratings FOR DELETE USING (auth.uid() = user_id);

-- 5. USER_FAVORITES (cloud-synced)
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_template ON user_favorites(template_id);
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

-- 6. ADMIN_ROLES
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'content_editor')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, role)
);

CREATE INDEX idx_admin_roles_user ON admin_roles(user_id);

-- Helper functions to check admin status (SECURITY DEFINER avoids infinite recursion in RLS)
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = check_user_id AND role IN ('super_admin', 'admin'));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = check_user_id AND role = 'super_admin');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies use helper functions to avoid recursion
CREATE POLICY "Admins can view all roles" ON admin_roles FOR SELECT
    USING (is_admin(auth.uid()));
CREATE POLICY "Super admins can insert roles" ON admin_roles FOR INSERT
    WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can delete roles" ON admin_roles FOR DELETE
    USING (is_super_admin(auth.uid()));

-- Helper function to check content editor or higher
CREATE OR REPLACE FUNCTION is_content_editor(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = check_user_id AND role IN ('super_admin', 'admin', 'content_editor'));
END;
$$ LANGUAGE plpgsql;

-- Helper function to check any admin role
CREATE OR REPLACE FUNCTION has_any_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql;

-- 7. ADMIN_ACTIVITY_LOG
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_created ON admin_activity_log(created_at DESC);
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log" ON admin_activity_log FOR SELECT
    USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert activity log" ON admin_activity_log FOR INSERT
    WITH CHECK (has_any_admin_role(auth.uid()));

-- 8. USER_ACTIVITY_LOGS
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_timestamp ON user_activity_logs(timestamp DESC);
CREATE INDEX idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_type ON user_activity_logs(activity_type);
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity" ON user_activity_logs FOR SELECT
    USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can log activity" ON user_activity_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 9. ERROR_LOGS
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type VARCHAR(100),
    message TEXT NOT NULL,
    source TEXT,
    line INTEGER,
    "column" INTEGER,
    stack TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error logs" ON error_logs FOR SELECT
    USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can log errors" ON error_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 10. CUSTOM_MECHANICS
CREATE TABLE custom_mechanics (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    default_targeter VARCHAR(100) DEFAULT '@Target',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE custom_mechanics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom mechanics" ON custom_mechanics FOR SELECT USING (true);
CREATE POLICY "Admins can insert custom mechanics" ON custom_mechanics FOR INSERT
    WITH CHECK (is_content_editor(auth.uid()));
CREATE POLICY "Admins can update custom mechanics" ON custom_mechanics FOR UPDATE
    USING (is_content_editor(auth.uid()));
CREATE POLICY "Admins can delete custom mechanics" ON custom_mechanics FOR DELETE
    USING (is_admin(auth.uid()));

-- 11. CUSTOM_CONDITIONS
CREATE TABLE custom_conditions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE custom_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom conditions" ON custom_conditions FOR SELECT USING (true);
CREATE POLICY "Admins can insert custom conditions" ON custom_conditions FOR INSERT
    WITH CHECK (is_content_editor(auth.uid()));
CREATE POLICY "Admins can update custom conditions" ON custom_conditions FOR UPDATE
    USING (is_content_editor(auth.uid()));
CREATE POLICY "Admins can delete custom conditions" ON custom_conditions FOR DELETE
    USING (is_admin(auth.uid()));

-- 12. CUSTOM_TRIGGERS
CREATE TABLE custom_triggers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    has_target BOOLEAN DEFAULT FALSE,
    target_description TEXT,
    placeholders TEXT[] DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE custom_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom triggers" ON custom_triggers FOR SELECT USING (true);
CREATE POLICY "Admins can insert custom triggers" ON custom_triggers FOR INSERT
    WITH CHECK (is_content_editor(auth.uid()));
CREATE POLICY "Admins can update custom triggers" ON custom_triggers FOR UPDATE
    USING (is_content_editor(auth.uid()));
CREATE POLICY "Admins can delete custom triggers" ON custom_triggers FOR DELETE
    USING (is_admin(auth.uid()));

-- 13. CUSTOM_TARGETERS
CREATE TABLE custom_targeters (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    item_aliases TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '[]',
    examples TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    dropdown_config JSONB DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE custom_targeters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom targeters" ON custom_targeters FOR SELECT USING (true);
CREATE POLICY "Admins can insert custom targeters" ON custom_targeters FOR INSERT
    WITH CHECK (is_content_editor(auth.uid()));
CREATE POLICY "Admins can update custom targeters" ON custom_targeters FOR UPDATE
    USING (is_content_editor(auth.uid()));
CREATE POLICY "Admins can delete custom targeters" ON custom_targeters FOR DELETE
    USING (is_admin(auth.uid()));

-- 14. HIDDEN_BUILT_INS
CREATE TABLE hidden_built_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('mechanic', 'condition', 'trigger', 'targeter')),
    item_id VARCHAR(100) NOT NULL,
    hidden_by UUID REFERENCES auth.users(id),
    hidden_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_type, item_id)
);

CREATE INDEX idx_hidden_built_ins_type ON hidden_built_ins(item_type);
ALTER TABLE hidden_built_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hidden items" ON hidden_built_ins FOR SELECT USING (true);
CREATE POLICY "Super admins can hide items" ON hidden_built_ins FOR INSERT
    WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can unhide items" ON hidden_built_ins FOR DELETE
    USING (is_super_admin(auth.uid()));

-- =============================================
-- SETUP COMPLETE! 14 Tables Created
-- =============================================
```

---

## After Setup: Create First Super Admin

After running the SQL above and creating your first user account, run this to make yourself super admin:

```sql
-- Replace 'your-user-id-here' with your actual user UUID from auth.users
INSERT INTO admin_roles (user_id, role, notes)
VALUES ('be6795f9-fad0-482f-9c49-b2466c9551aa', 'super_admin', 'Initial setup');
```

To find your user ID:
```sql
SELECT id, email FROM auth.users;
```

---

## Migration Scripts

### Add Template Approval Workflow (v1.1.0)

If you already have the `templates` table and need to add the approval workflow columns:

```sql
-- =============================================
-- MIGRATION: Add Template Approval Workflow
-- Run this if you have an existing templates table
-- =============================================

-- Add new approval workflow columns
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for approval status filtering
CREATE INDEX IF NOT EXISTS idx_templates_approval_status 
ON templates(approval_status) WHERE deleted = false;

-- Set all existing templates to 'approved' status (they were already live)
UPDATE templates 
SET approval_status = 'approved', 
    approved_at = created_at 
WHERE approval_status IS NULL;

-- Verify the migration
SELECT 
    COUNT(*) as total_templates,
    COUNT(*) FILTER (WHERE approval_status = 'approved') as approved,
    COUNT(*) FILTER (WHERE approval_status = 'pending') as pending,
    COUNT(*) FILTER (WHERE approval_status = 'rejected') as rejected
FROM templates WHERE deleted = false;
```

---

### Add System Settings Table (v1.2.0)

Global system settings stored in database for admin-configurable values.

```sql
-- =============================================
-- TABLE: system_settings
-- Global system settings (admin configurable)
-- =============================================
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for limit checks)
CREATE POLICY "Anyone can view system settings"
    ON system_settings FOR SELECT
    USING (true);

-- Only super admins can modify settings
CREATE POLICY "Super admins can insert settings"
    ON system_settings FOR INSERT
    WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update settings"
    ON system_settings FOR UPDATE
    USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete settings"
    ON system_settings FOR DELETE
    USING (is_super_admin(auth.uid()));

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
    ('maxTemplatesPerUser', '10', 'Maximum number of templates a user can create'),
    ('maxPendingTemplatesPerUser', '3', 'Maximum pending templates per user'),
    ('maxPacksPerUser', '100', 'Maximum packs per user'),
    ('maxPackSize', '50', 'Maximum pack size in MB'),
    ('featureTemplates', 'true', 'Enable template system'),
    ('featureSocialSharing', 'true', 'Enable social sharing'),
    ('featureAnalytics', 'true', 'Enable analytics'),
    ('maintenanceMode', 'false', 'Maintenance mode enabled'),
    ('maintenanceMessage', '"System maintenance in progress..."', 'Maintenance message')
ON CONFLICT (key) DO NOTHING;
```

---

### Add User Notifications Table (v1.2.0)

Notifications for users (template approval/rejection, etc.)

```sql
-- =============================================
-- TABLE: user_notifications
-- User notifications for template status, etc.
-- =============================================
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_user_notifications_created ON user_notifications(created_at DESC);

-- RLS Policies
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON user_notifications FOR SELECT
    USING (auth.uid() = user_id);

-- System/admins can create notifications for any user
CREATE POLICY "Admins can create notifications"
    ON user_notifications FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
    ON user_notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON user_notifications FOR DELETE
    USING (auth.uid() = user_id);
```
