# Supabase Schema Documentation for MythicMobs Editor

## Overview

This document provides a comprehensive analysis of the Supabase database schema used in the MythicMobs Editor application. It includes:
1. Current tables and their usage in code
2. Issues and inconsistencies found
3. Proposed new tables for planned features
4. RPC functions and views needed
5. RLS (Row Level Security) policies recommendations

---

## Current Database Tables

### 1. `templates`

**Purpose:** Stores user-created mob and skill templates

**Columns (from code analysis):**
- `id` - UUID primary key
- `owner_id` - UUID, references auth.users
- `name` - VARCHAR
- `description` - TEXT
- `type` - VARCHAR ('mob' or 'skill')
- `tags` - TEXT[] (array)
- `structure_type` - VARCHAR
- `is_official` - BOOLEAN
- `data` - JSONB (sections, skillLines, triggers, conditions, category, icon, difficulty)
- `deleted` - BOOLEAN (soft delete)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Files that use this table:**
- [templateManager.js](components/templateManager.js) - CRUD operations (lines 107, 145, 191, 219, 269, 307)
- [templateMigration.js](components/templateMigration.js) - Migration logic (lines 146, 213)
- [adminPanelEnhanced.js](components/adminPanelEnhanced.js) - Admin management

**RPC Function:** `delete_template(template_id)` - Secure deletion function

---

### 2. `user_profiles`

**Purpose:** Extended user profile data linked to auth.users

**Columns:**
- `id` - UUID primary key (same as auth.users id)
- `email` - VARCHAR
- `display_name` - VARCHAR
- `avatar_url` - TEXT
- `bio` - TEXT
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Files that use this table:**
- [userProfileManager.js](components/userProfileManager.js) - Profile CRUD (lines 26, 52)
- [adminPanelEnhanced.js](components/adminPanelEnhanced.js) - User lookup
- [adminManager.js](components/adminManager.js) - User lookup for role assignment (line 178)

---

### 3. `user_data`

**Purpose:** Stores user pack data and preferences (localStorage backup in cloud)

**Columns:**
- `id` - UUID primary key
- `user_id` - UUID, references auth.users
- `pack_data` - JSONB
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Files that use this table:**
- [supabaseClient.js](components/supabaseClient.js) - Sync operations (lines 112, 183, 219, 254)
- [authManager.js](components/authManager.js) - Data management (lines 186, 193, 210)

---

### 4. `admin_roles`

**Purpose:** Defines admin permissions for users

**Columns:**
- `id` - UUID primary key
- `user_id` - UUID, references auth.users
- `role` - VARCHAR ('super_admin', 'admin', 'moderator')
- `granted_by` - UUID
- `granted_at` - TIMESTAMP
- `permissions` - JSONB (custom permissions object)

**Files that use this table:**
- [adminPanelEnhanced.js](components/adminPanelEnhanced.js) - Role management
- [adminManager.js](components/adminManager.js) - Role CRUD (lines 131, 195, 236)

---

### 5. `admin_activity_log`

**Purpose:** Audit log for admin actions

**Columns:**
- `id` - UUID primary key
- `admin_id` - UUID
- `action` - VARCHAR
- `target_type` - VARCHAR
- `target_id` - UUID
- `details` - JSONB
- `created_at` - TIMESTAMP

**Files that use this table:**
- [adminManager.js](components/adminManager.js) - Logging (lines 265, 328)

---

### 6. `user_activity_logs`

**Purpose:** Track user activity for analytics

**Columns:**
- `id` - UUID primary key
- `user_id` - UUID
- `activity_type` - VARCHAR
- `details` - JSONB
- `created_at` - TIMESTAMP

**Files that use this table:**
- [adminPanelEnhanced.js](components/adminPanelEnhanced.js) - Activity display

---

### 7. `error_logs`

**Purpose:** Client-side error logging for debugging

**Columns:**
- `id` - UUID primary key
- `user_id` - UUID (nullable)
- `error_message` - TEXT
- `error_stack` - TEXT
- `component` - VARCHAR
- `context` - JSONB
- `url` - TEXT
- `user_agent` - TEXT
- `created_at` - TIMESTAMP

**Files that use this table:**
- [errorLogger.js](utils/errorLogger.js) - Error logging (line 84)

---

### 8. `custom_mechanics`

**Purpose:** User-submitted custom mechanics

**Columns:**
- `id` - UUID primary key
- `name` - VARCHAR
- `aliases` - TEXT[]
- `category` - VARCHAR
- `description` - TEXT
- `attributes` - JSONB
- `examples` - TEXT[]
- `created_by` - UUID
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Files that use this table:**
- [browserDataMerger.js](components/browserDataMerger.js) - Merge with built-ins (line 53)
- [browserAdminManager.js](components/browserAdminManager.js) - Admin CRUD

---

### 9. `custom_conditions`

**Purpose:** User-submitted custom conditions

**Same structure as custom_mechanics**

**Files that use this table:**
- [browserDataMerger.js](components/browserDataMerger.js)
- [browserAdminManager.js](components/browserAdminManager.js)

---

### 10. `custom_triggers`

**Purpose:** User-submitted custom triggers

**Same structure as custom_mechanics**

**Files that use this table:**
- [browserDataMerger.js](components/browserDataMerger.js)
- [browserAdminManager.js](components/browserAdminManager.js)

---

### 11. `custom_targeters`

**Purpose:** User-submitted custom targeters

**Same structure as custom_mechanics**

**Files that use this table:**
- [browserDataMerger.js](components/browserDataMerger.js)
- [browserAdminManager.js](components/browserAdminManager.js)

---

### 12. `hidden_built_ins`

**Purpose:** Track which built-in items should be hidden from browsers

**Columns:**
- `id` - UUID primary key
- `item_type` - VARCHAR ('mechanic', 'condition', 'trigger', 'targeter')
- `item_id` - VARCHAR (the built-in item's ID)
- `hidden_by` - UUID
- `hidden_at` - TIMESTAMP

**Files that use this table:**
- [browserDataMerger.js](components/browserDataMerger.js) - Hide filtering (lines 63, 131, 200, 267)
- [browserAdminManager.js](components/browserAdminManager.js) - Hide/unhide operations (lines 179, 191, 212, 225)

---

## Views

### `official_templates_view` (NEEDS TO BE CREATED)

**Purpose:** View for approved/official templates

**Referenced in:**
- [adminManager.js](components/adminManager.js#L350) - `getOfficialTemplates()`

**Suggested Definition:**
```sql
CREATE OR REPLACE VIEW official_templates_view AS
SELECT 
    t.*,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar
FROM templates t
LEFT JOIN user_profiles up ON t.owner_id = up.id
WHERE t.is_official = true 
  AND t.deleted = false
ORDER BY t.updated_at DESC;
```

---

## RPC Functions

### `delete_template(template_id UUID)`

**Purpose:** Securely delete a template with ownership validation

**Current Implementation (assumed):**
```sql
CREATE OR REPLACE FUNCTION delete_template(template_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_owner UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    SELECT owner_id INTO template_owner
    FROM templates
    WHERE id = template_id AND deleted = false;
    
    IF template_owner IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Template not found');
    END IF;
    
    IF template_owner != current_user_id THEN
        -- Check if user is admin
        IF NOT EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = current_user_id 
            AND role IN ('super_admin', 'admin')
        ) THEN
            RETURN json_build_object('success', false, 'error', 'Not authorized');
        END IF;
    END IF;
    
    UPDATE templates
    SET deleted = true, updated_at = NOW()
    WHERE id = template_id;
    
    RETURN json_build_object('success', true);
END;
$$;
```

---

## Issues Found in Codebase

### Critical Issues

1. **❌ `official_templates_view` does not exist**
   - Location: [adminManager.js#L350](components/adminManager.js#L350)
   - Impact: `getOfficialTemplates()` will fail
   - Fix: Create the view (see SQL above)

2. **✅ FIXED: `window.supabase` vs `window.supabaseClient`**
   - Multiple files were using wrong variable name
   - Fixed in: triggerBrowser.js, mechanicBrowser.js, conditionBrowser.js, targeterBrowser.js, browserSingletonManager.js, errorLogger.js

3. **✅ FIXED: Invalid join query in templateManager.js**
   - Was trying to join `owner:owner_id(email)` without FK relationship
   - Removed the join, now queries separately if needed

4. **✅ FIXED: adminManager.js querying `auth.users`**
   - Was trying to query `auth.users` which is not accessible client-side
   - Changed to query `user_profiles` table instead

### Warnings

1. **⚠️ No indexes defined in code analysis**
   - Recommend adding indexes for frequently queried columns

2. **⚠️ Missing cascade rules**
   - What happens to templates when user is deleted?
   - What happens to admin_roles when user is deleted?

---

## Proposed New Tables for Planned Features

### 1. `template_ratings` (NEW)

**Purpose:** Allow users to rate templates (1-5 stars) with optional review comments

```sql
CREATE TABLE template_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_comment TEXT, -- Optional review text
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(template_id, user_id) -- One rating per user per template
);

-- Add average rating to templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Function to update template rating stats
CREATE OR REPLACE FUNCTION update_template_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE templates
    SET 
        average_rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM template_ratings
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM template_ratings
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        )
    WHERE id = COALESCE(NEW.template_id, OLD.template_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON template_ratings
FOR EACH ROW EXECUTE FUNCTION update_template_rating_stats();

-- RLS
ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
    ON template_ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can rate templates"
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

### 2. `template_comments` (NEW)

**Purpose:** Allow users to comment on templates

```sql
CREATE TABLE template_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES template_comments(id) ON DELETE CASCADE, -- For replies
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false, -- Soft delete for threaded comments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment count to templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_template_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE templates
        SET comment_count = comment_count + 1
        WHERE id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false) THEN
        UPDATE templates
        SET comment_count = GREATEST(0, comment_count - 1)
        WHERE id = COALESCE(NEW.template_id, OLD.template_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR UPDATE OR DELETE ON template_comments
FOR EACH ROW EXECUTE FUNCTION update_template_comment_count();

-- Indexes
CREATE INDEX idx_comments_template ON template_comments(template_id);
CREATE INDEX idx_comments_user ON template_comments(user_id);
CREATE INDEX idx_comments_parent ON template_comments(parent_id);

-- RLS
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
```

---

### 2b. `comment_votes` (NEW)

**Purpose:** Allow users to upvote/downvote comments

```sql
CREATE TABLE comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES template_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 = downvote, 1 = upvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id) -- One vote per user per comment
);

-- Add vote counts to template_comments
ALTER TABLE template_comments ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE template_comments ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;
ALTER TABLE template_comments ADD COLUMN IF NOT EXISTS vote_score INTEGER DEFAULT 0;

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 1 THEN
            UPDATE template_comments
            SET upvotes = upvotes + 1, vote_score = vote_score + 1
            WHERE id = NEW.comment_id;
        ELSE
            UPDATE template_comments
            SET downvotes = downvotes + 1, vote_score = vote_score - 1
            WHERE id = NEW.comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 1 THEN
            UPDATE template_comments
            SET upvotes = GREATEST(0, upvotes - 1), vote_score = vote_score - 1
            WHERE id = OLD.comment_id;
        ELSE
            UPDATE template_comments
            SET downvotes = GREATEST(0, downvotes - 1), vote_score = vote_score + 1
            WHERE id = OLD.comment_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.vote_type != NEW.vote_type THEN
        -- Vote changed from up to down or vice versa
        IF NEW.vote_type = 1 THEN
            UPDATE template_comments
            SET upvotes = upvotes + 1, downvotes = GREATEST(0, downvotes - 1), vote_score = vote_score + 2
            WHERE id = NEW.comment_id;
        ELSE
            UPDATE template_comments
            SET upvotes = GREATEST(0, upvotes - 1), downvotes = downvotes + 1, vote_score = vote_score - 2
            WHERE id = NEW.comment_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_votes
AFTER INSERT OR UPDATE OR DELETE ON comment_votes
FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();

-- Indexes
CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user ON comment_votes(user_id);

-- RLS
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
    ON comment_votes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can vote"
    ON comment_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own votes"
    ON comment_votes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
    ON comment_votes FOR DELETE
    USING (auth.uid() = user_id);
```

---

### 3. `template_downloads` (NEW)

**Purpose:** Track template downloads/usage statistics

```sql
CREATE TABLE template_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
    ip_hash VARCHAR(64), -- Hashed IP for anonymous tracking
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add download count to templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Function to update download count
CREATE OR REPLACE FUNCTION update_template_download_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE templates
    SET download_count = download_count + 1
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_download_count
AFTER INSERT ON template_downloads
FOR EACH ROW EXECUTE FUNCTION update_template_download_count();

-- Indexes
CREATE INDEX idx_downloads_template ON template_downloads(template_id);
CREATE INDEX idx_downloads_user ON template_downloads(user_id);
CREATE INDEX idx_downloads_date ON template_downloads(downloaded_at);

-- RLS (only admins can view download logs, counts are public via templates table)
ALTER TABLE template_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view download logs"
    ON template_downloads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert download record"
    ON template_downloads FOR INSERT
    WITH CHECK (true);
```

---

### 4. `template_approval_queue` (NEW)

**Purpose:** Manage template submissions for official status

```sql
CREATE TABLE template_approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'revision_requested')),
    reviewer_id UUID REFERENCES auth.users(id),
    reviewer_notes TEXT,
    submitter_notes TEXT, -- Why they think it should be official
    revision_count INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(template_id) -- One submission per template
);

-- Indexes
CREATE INDEX idx_approval_status ON template_approval_queue(status);
CREATE INDEX idx_approval_submitted ON template_approval_queue(submitted_at);

-- RLS
ALTER TABLE template_approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
    ON template_approval_queue FOR SELECT
    USING (auth.uid() = submitted_by);

CREATE POLICY "Admins can view all submissions"
    ON template_approval_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can submit templates"
    ON template_approval_queue FOR INSERT
    WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can update submissions"
    ON template_approval_queue FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid()
        )
    );
```

---

### 5. `user_collections` (NEW)

**Purpose:** Allow users to organize templates into collections/folders

```sql
CREATE TABLE user_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    color VARCHAR(7), -- Hex color for UI
    icon VARCHAR(50), -- Icon identifier
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    notes TEXT, -- Personal notes about this template
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(collection_id, template_id)
);

-- Indexes
CREATE INDEX idx_collections_user ON user_collections(user_id);
CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_collection_items_template ON collection_items(template_id);

-- RLS
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
    ON user_collections FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own collections"
    ON user_collections FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own collection items and public"
    ON collection_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_collections uc
            WHERE uc.id = collection_items.collection_id
            AND (uc.user_id = auth.uid() OR uc.is_public = true)
        )
    );

CREATE POLICY "Users can manage own collection items"
    ON collection_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_collections uc
            WHERE uc.id = collection_items.collection_id
            AND uc.user_id = auth.uid()
        )
    );
```

---

## Updated Templates Table Schema

Add these columns to the existing `templates` table:

```sql
-- Add new columns for enhanced features
ALTER TABLE templates ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Indexes for the new columns and common queries
CREATE INDEX IF NOT EXISTS idx_templates_owner ON templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_official ON templates(is_official) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_templates_deleted ON templates(deleted) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_templates_rating ON templates(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_templates_downloads ON templates(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created ON templates(created_at DESC);
```

---

## Official Templates View (Updated)

```sql
CREATE OR REPLACE VIEW official_templates_view AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.type,
    t.tags,
    t.structure_type,
    t.data,
    t.average_rating,
    t.rating_count,
    t.comment_count,
    t.download_count,
    t.created_at,
    t.updated_at,
    t.approved_at,
    t.approved_by,
    up.id as owner_id,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar,
    approver.display_name as approver_name
FROM templates t
LEFT JOIN user_profiles up ON t.owner_id = up.id
LEFT JOIN user_profiles approver ON t.approved_by = approver.id
WHERE t.is_official = true 
  AND t.deleted = false
ORDER BY t.approved_at DESC NULLS LAST;
```

---

## RLS Policies for Existing Tables

### templates

```sql
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-deleted templates
CREATE POLICY "Public templates are viewable"
    ON templates FOR SELECT
    USING (deleted = false);

-- Only authenticated users can create
CREATE POLICY "Authenticated users can create templates"
    ON templates FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Owners can update their templates
CREATE POLICY "Owners can update templates"
    ON templates FOR UPDATE
    USING (auth.uid() = owner_id);

-- Admins can update any template (for moderation)
CREATE POLICY "Admins can update any template"
    ON templates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );
```

---

## Summary of Changes Needed

### Immediate Fixes
1. ✅ Create `official_templates_view`

### New Tables to Create
1. `template_ratings` - Rating system
2. `template_comments` - Comment system
3. `template_downloads` - Download tracking
4. `template_approval_queue` - Approval workflow
5. `user_collections` - Personal collections
6. `collection_items` - Collection membership

### Schema Modifications
1. Add columns to `templates` table (rating, comments, downloads, approval)
2. Add indexes for performance
3. Set up RLS policies

### RPC Functions to Create
1. `rate_template(template_id, rating)` - Rate a template
2. `submit_for_approval(template_id, notes)` - Submit for official status
3. `review_submission(queue_id, status, notes)` - Admin review action
4. `track_download(template_id)` - Record a download

---

## Migration Order

Execute in this order to avoid dependency issues:

1. Add columns to `templates` table
2. Create `template_ratings` table + triggers
3. Create `template_comments` table + triggers
4. Create `template_downloads` table + triggers
5. Create `template_approval_queue` table
6. Create `user_collections` table
7. Create `collection_items` table
8. Create `official_templates_view`
9. Apply RLS policies
10. Create RPC functions
11. Create indexes

---

## GPT Prompt for Schema Cleanup

Use this prompt with GPT to generate the complete SQL migration:

```
I have a Supabase project for a MythicMobs Editor application. 

Current tables:
- templates, user_profiles, user_data, admin_roles, admin_activity_log, user_activity_logs, error_logs, custom_mechanics, custom_conditions, custom_triggers, custom_targeters, hidden_built_ins

I need you to:

1. Create a migration that adds these new features:
   - Template rating system (1-5 stars)
   - Template comments with replies
   - Download/usage tracking
   - Approval workflow for official templates
   - User collections/folders for organizing templates

2. Add these columns to the templates table:
   - average_rating, rating_count, comment_count, download_count
   - approved_at, approved_by

3. Create the `official_templates_view` view

4. Set up proper RLS policies for all tables

5. Create triggers to maintain counts automatically

6. Create necessary indexes for performance

7. Create RPC functions for:
   - Secure template deletion
   - Rating submission
   - Approval workflow
   - Download tracking

Generate the complete SQL migration file with proper error handling and idempotent statements (using IF NOT EXISTS where possible).
```
