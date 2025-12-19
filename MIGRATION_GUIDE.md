# Template Migration Quick-Start Guide

**Purpose:** Migrate ~200 hardcoded templates from `skillTemplates.js` to Supabase database  
**Duration:** ~10 minutes  
**Status:** Ready to execute

---

## 🎯 Prerequisites Checklist

Before starting, ensure:
- [ ] You have admin access to Supabase Dashboard
- [ ] You have admin credentials for the application
- [ ] Browser is open to your application (index.html loaded)
- [ ] Browser console is open (Press F12)
- [ ] You're comfortable running SQL and JavaScript commands

---

## Step 1: Database Schema Migration 📊

### 1.1 Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### 1.2 Execute Schema Migration

Copy and paste this SQL (from `database_migrations/002_create_templates_table.sql`):

```sql
-- Add structure_type column
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS structure_type TEXT DEFAULT 'multi-line' 
CHECK (structure_type IN ('single', 'multi-line', 'multi-section'));

-- Add is_official column
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_templates_structure_type ON templates(structure_type);
CREATE INDEX IF NOT EXISTS idx_templates_is_official ON templates(is_official);

-- Add comments
COMMENT ON COLUMN templates.structure_type IS 'Type of template structure: single line, multi-line, or multi-section';
COMMENT ON COLUMN templates.is_official IS 'Whether this template is officially curated';
```

### 1.3 Verify Schema Changes

Run this verification query:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'templates' 
AND column_name IN ('structure_type', 'is_official')
ORDER BY column_name;
```

**Expected Output:**
```
column_name     | data_type | column_default           | is_nullable
----------------|-----------|--------------------------|------------
is_official     | boolean   | false                    | YES
structure_type  | text      | 'multi-line'::text       | YES
```

✅ If you see both columns, proceed to Step 2

---

## Step 2: Application Login 🔐

### 2.1 Open Your Application

1. Navigate to your application in the browser
2. If not already logged in, click **Sign In**
3. Enter your admin credentials
4. Verify you're logged in (check top-right corner)

### 2.2 Verify Admin Status

Open browser console (F12) and run:

```javascript
const user = window.authManager.getCurrentUser();
console.log('Current User:', user);
console.log('User ID:', user?.id);
console.log('User Email:', user?.email);
```

**Expected Output:**
```
Current User: { id: "...", email: "admin@...", ... }
User ID: uuid-string-here
User Email: admin@example.com
```

✅ Save your User ID - you'll need it in Step 3

---

## Step 3: Pre-Migration Verification 🔍

### 3.1 Check Hardcoded Templates

```javascript
// Verify hardcoded templates exist
console.log('Hardcoded templates loaded?', typeof SKILL_TEMPLATES !== 'undefined');
console.log('Number of hardcoded templates:', SKILL_TEMPLATES?.length || 0);
```

**Expected Output:**
```
Hardcoded templates loaded? true
Number of hardcoded templates: 200 (or similar number)
```

### 3.2 Check Existing Database Templates

```javascript
const { data: existing, count } = await window.supabaseClient
  .from('templates')
  .select('*', { count: 'exact' })
  .eq('deleted', false);

console.log(`Existing templates in database: ${count || existing.length}`);
console.log('Existing templates:', existing);
```

**Expected Output:**
```
Existing templates in database: 0
Existing templates: []
```

(Or a small number if you've created test templates)

### 3.3 Verify Migration Components

```javascript
// Check all required components are loaded
console.log('TemplateManager:', typeof window.templateManager !== 'undefined' ? '✅' : '❌');
console.log('TemplateMigration:', typeof window.templateMigration !== 'undefined' ? '✅' : '❌');
console.log('SupabaseClient:', typeof window.supabaseClient !== 'undefined' ? '✅' : '❌');
console.log('AuthManager:', typeof window.authManager !== 'undefined' ? '✅' : '❌');
```

**Expected Output:**
```
TemplateManager: ✅
TemplateMigration: ✅
SupabaseClient: ✅
AuthManager: ✅
```

✅ If all components loaded, proceed to Step 4

---

## Step 4: Execute Migration 🚀

### 4.1 Start Migration

**IMPORTANT:** This operation will:
- Migrate ~200 templates from `SKILL_TEMPLATES` array to database
- Mark all migrated templates as `is_official = true`
- Take 30-60 seconds to complete
- Cannot be easily undone (use rollback if needed)

```javascript
// Get current user ID
const user = window.authManager.getCurrentUser();
const userId = user.id;

console.log('========================================');
console.log('🚀 STARTING TEMPLATE MIGRATION');
console.log('========================================');
console.log(`Admin User: ${user.email}`);
console.log(`User ID: ${userId}`);
console.log('');
console.log('This will migrate ~200 templates from SKILL_TEMPLATES to database');
console.log('Estimated time: 30-60 seconds');
console.log('Please do not close this window...');
console.log('');

const startTime = Date.now();

// Execute migration
const results = await window.templateMigration.migrateAll(userId);

const duration = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('');
console.log('========================================');
console.log('✅ MIGRATION COMPLETE');
console.log('========================================');
console.log(`Duration: ${duration} seconds`);
console.log(`Successful: ${results.success.length} templates`);
console.log(`Failed: ${results.failed.length} templates`);
console.log('');

if (results.success.length > 0) {
  console.log('✅ Successfully migrated templates:');
  console.log(results.success.slice(0, 5).map(t => `  - ${t.name}`).join('\n'));
  if (results.success.length > 5) {
    console.log(`  ... and ${results.success.length - 5} more`);
  }
}

if (results.failed.length > 0) {
  console.log('');
  console.log('❌ Failed templates:');
  console.log(results.failed);
  console.log('');
  console.log('Errors:');
  console.log(results.errors);
}

console.log('');
console.log('Next step: Run verification (Step 5)');
```

### 4.2 Review Results

**Success Criteria:**
- `results.success.length` should be ~200
- `results.failed.length` should be 0
- No errors in console

**If Migration Failed:**
- Check `results.errors` for error messages
- Verify database connection
- Verify admin permissions
- See "Troubleshooting" section below

---

## Step 5: Verify Migration Results ✅

### 5.1 Run Verification Script

```javascript
console.log('========================================');
console.log('🔍 VERIFICATION');
console.log('========================================');

const verification = await window.templateMigration.verify();

console.log('');
console.log('📊 Migration Statistics:');
console.log(`  Total Templates: ${verification.totalTemplates}`);
console.log(`  Official Templates: ${verification.officialTemplates}`);
console.log(`  User Templates: ${verification.totalTemplates - verification.officialTemplates}`);
console.log('');
console.log('📋 Structure Type Distribution:');
Object.entries(verification.structureTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
console.log('');
console.log('📁 Category Distribution:');
Object.entries(verification.categories).forEach(([category, count]) => {
  console.log(`  ${category}: ${count}`);
});
console.log('');

// Detailed check
const { data: allTemplates } = await window.supabaseClient
  .from('templates')
  .select('id, name, structure_type, is_official')
  .eq('deleted', false)
  .eq('is_official', true)
  .limit(10);

console.log('Sample of migrated templates:');
allTemplates.forEach((t, i) => {
  console.log(`  ${i + 1}. ${t.name} (${t.structure_type})`);
});
```

**Expected Output:**
```
📊 Migration Statistics:
  Total Templates: ~200
  Official Templates: ~200
  User Templates: 0

📋 Structure Type Distribution:
  single: ~50
  multi-line: ~140
  multi-section: ~10

📁 Category Distribution:
  combat: ~80
  utility: ~40
  movement: ~30
  ...

Sample of migrated templates:
  1. Basic Attack (multi-line)
  2. Healing Burst (single)
  3. AoE Damage (multi-line)
  ...
```

### 5.2 Test Template Loading

```javascript
// Test loading templates via TemplateManager
const loadedTemplates = await window.templateManager.getAllTemplates();
console.log('');
console.log('✅ Loaded via TemplateManager:', loadedTemplates.length, 'templates');

// Check a specific template
const sampleTemplate = loadedTemplates.find(t => t.is_official);
console.log('');
console.log('Sample official template:');
console.log('  Name:', sampleTemplate.name);
console.log('  Type:', sampleTemplate.type);
console.log('  Structure:', sampleTemplate.structure_type);
console.log('  Official:', sampleTemplate.is_official);
console.log('  Sections:', sampleTemplate.sections?.length || 0);
console.log('  Lines:', sampleTemplate.sections?.[0]?.lines?.length || 0);
```

**Expected Output:**
```
✅ Loaded via TemplateManager: ~200 templates

Sample official template:
  Name: Basic Attack
  Type: skill
  Structure: multi-line
  Official: true
  Sections: 1
  Lines: 3
```

---

## Step 6: UI Verification 🎨

### 6.1 Test Template Selector

1. Navigate to Skill Editor or Mob Editor
2. Click **"Add Skill Line"** → **"Use Template"**
3. Template Selector should open

**Verify:**
- [ ] ~200 templates visible
- [ ] All templates have structure badges (🎯/📋/📚)
- [ ] All templates have gold "👑 Official" badge
- [ ] Templates load quickly (< 2 seconds)
- [ ] Search works
- [ ] No console errors

### 6.2 Test Template Application

1. Select a random official template
2. Click to apply it

**Verify:**
- [ ] Template applies correctly
- [ ] Lines appear in editor
- [ ] No errors in console
- [ ] Works for both skill and mob contexts

### 6.3 Test Multi-Section Templates (if any)

1. Look for templates with "📚 X sections" badge
2. Click to apply

**In Skill Context:**
- [ ] Modal appears with insertion options
- [ ] "Insert as Separate Sections" creates new skills
- [ ] "Merge Into Current Section" combines lines

**In Mob Context:**
- [ ] Modal shows only merge option
- [ ] Lines are added to mob skills

---

## Step 7: Post-Migration Status 📊

Run this final status check:

```javascript
console.log('========================================');
console.log('📊 FINAL MIGRATION STATUS');
console.log('========================================');
console.log('');
console.log('✅ Database Schema: Updated');
console.log('✅ Templates Migrated: ~200');
console.log('✅ UI Verification: Complete');
console.log('');
console.log('Ready for cleanup? Run Step 8');
```

---

## Step 8: Cleanup (Optional - Do After Testing) 🧹

### ⚠️ WARNING: Only proceed after thorough testing!

Once you've verified everything works:

### 8.1 Remove Script Tag

Open `index.html` and find this line (around line 200-300):

```html
<script src="data/skillTemplates.js"></script>
```

**Delete** or **comment out** this line:

```html
<!-- <script src="data/skillTemplates.js"></script> -->
```

Save the file.

### 8.2 Refresh and Test

1. Refresh browser (Ctrl+F5 / Cmd+Shift+R)
2. Open console
3. Verify templates still load:

```javascript
console.log('SKILL_TEMPLATES exists?', typeof SKILL_TEMPLATES !== 'undefined');
// Expected: false

const templates = await window.templateManager.getAllTemplates();
console.log('Templates from database:', templates.length);
// Expected: ~200
```

### 8.3 Delete Hardcoded File (Final Step)

Once confirmed working without `skillTemplates.js`:

1. Navigate to `data/` folder in file explorer
2. **Delete** `skillTemplates.js`
3. Refresh browser
4. Verify no 404 errors in console
5. Verify templates still load

**✅ Migration complete!**

---

## 🐛 Troubleshooting

### Issue: "Migration failed with errors"

**Check:**
```javascript
console.log('Errors:', results.errors);
```

**Common Causes:**
- Database permission issues → Check RLS policies
- User not admin → Verify user.id is correct
- Network issues → Check Supabase connection

**Solution:**
```javascript
// Try rollback and re-run
await window.templateMigration.rollback();
// Then run migration again
```

### Issue: "Templates not showing in UI"

**Check:**
```javascript
const { data, error } = await window.supabaseClient
  .from('templates')
  .select('*')
  .eq('deleted', false)
  .limit(1);

console.log('Sample template:', data);
console.log('Error:', error);
```

**Common Causes:**
- RLS policies blocking reads → Update policies
- Templates marked as deleted → Check deleted column

**Solution:**
- Check `fix_rls_policies.sql` and ensure read policies allow authenticated users

### Issue: "Duplicate templates after re-running migration"

**Solution:**
```javascript
// Rollback to clean up
const deleted = await window.templateMigration.rollback();
console.log(`Deleted ${deleted} official templates`);

// Wait a moment, then re-run migration
await new Promise(resolve => setTimeout(resolve, 2000));
await window.templateMigration.migrateAll(userId);
```

### Issue: "Console shows SKILL_TEMPLATES undefined"

This is **expected** if you've removed the script tag. Templates should load from database instead:

```javascript
// This is the NEW way (from database)
const templates = await window.templateManager.getAllTemplates();
console.log('Templates:', templates.length);
```

---

## 📋 Migration Checklist

Use this to track your progress:

- [ ] **Step 1:** Database schema migration executed
- [ ] **Step 1:** Schema verification passed
- [ ] **Step 2:** Logged in as admin
- [ ] **Step 2:** User ID retrieved
- [ ] **Step 3:** Pre-migration checks passed
- [ ] **Step 4:** Migration executed successfully
- [ ] **Step 4:** ~200 templates migrated
- [ ] **Step 5:** Verification script passed
- [ ] **Step 5:** Template loading works
- [ ] **Step 6:** Template Selector shows templates
- [ ] **Step 6:** Can apply templates successfully
- [ ] **Step 6:** Multi-section templates work
- [ ] **Step 7:** Final status check complete
- [ ] **Step 8:** Script tag removed (after testing)
- [ ] **Step 8:** Hardcoded file deleted (after testing)
- [ ] **Step 8:** App works without hardcoded file

---

## ✅ Success Criteria

Migration is successful when:
- ✅ ~200 templates exist in database
- ✅ All templates marked as `is_official = true`
- ✅ All templates have correct `structure_type`
- ✅ Templates load in UI with badges
- ✅ Templates can be applied to skills/mobs
- ✅ No console errors
- ✅ App works without `skillTemplates.js` file

---

## 🎉 Next Steps

After successful migration:
1. Test thoroughly (see `TESTING_INSTRUCTIONS.md`)
2. Create user documentation
3. Update `README.md` with new features
4. Consider creating tutorial GIFs
5. Monitor for issues in production

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Review error messages carefully
3. Try rollback and re-migration
4. Check database permissions
5. Verify all components loaded correctly

**Common Commands:**
```javascript
// Get current state
await window.templateMigration.verify();

// Rollback if needed
await window.templateMigration.rollback();

// Check component status
console.log('Components:', {
  templateManager: !!window.templateManager,
  templateMigration: !!window.templateMigration,
  supabaseClient: !!window.supabaseClient,
  authManager: !!window.authManager
});
```
