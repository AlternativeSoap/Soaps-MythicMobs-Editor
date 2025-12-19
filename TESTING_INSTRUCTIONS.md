# Multi-Section Template System - Testing Instructions

**Last Updated:** December 13, 2025  
**Version:** 1.0  
**Status:** ✅ Ready for Testing

---

## 🎯 Prerequisites

Before testing, ensure:
- ✅ Database schema migration has been run (see Step 1)
- ✅ You're logged in as an admin user (for official template marking)
- ✅ Browser console is open (F12) for verification commands
- ✅ All files are saved and refreshed in browser

---

## 📋 Testing Phases

### Phase 1: Database Setup ⚙️

#### Step 1.1: Run Database Migration

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `database_migrations/002_create_templates_table.sql`
4. Execute the SQL
5. Verify columns were added:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'templates' 
AND column_name IN ('structure_type', 'is_official');
```

**Expected Result:**
```
structure_type | text | 'multi-line'::text
is_official    | boolean | false
```

#### Step 1.2: Verify Indices

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'templates' 
AND indexname LIKE '%structure%' OR indexname LIKE '%official%';
```

**Expected Result:**
- `idx_templates_structure_type`
- `idx_templates_is_official`

---

### Phase 2: Core Functionality Testing 🧪

#### Test 2.1: Structure Type Detection

Open browser console and run:

```javascript
// Test single-line template
const singleTemplate = {
  sections: [
    { name: 'TestSkill', lines: ['- damage{a=10} @Target'] }
  ]
};
const result1 = window.templateManager.detectStructureType(singleTemplate);
console.log('Single:', result1);
// Expected: { type: 'single', sectionCount: 1, lineCount: 1 }

// Test multi-line template
const multiLineTemplate = {
  sections: [
    { 
      name: 'TestSkill', 
      lines: [
        '- damage{a=10} @Target',
        '- heal{a=5} @Self',
        '- message{msg="Test"} @Target'
      ] 
    }
  ]
};
const result2 = window.templateManager.detectStructureType(multiLineTemplate);
console.log('Multi-line:', result2);
// Expected: { type: 'multi-line', sectionCount: 1, lineCount: 3 }

// Test multi-section template
const multiSectionTemplate = {
  sections: [
    { name: 'PhaseOne', lines: ['- damage{a=10} @Target'] },
    { name: 'PhaseTwo', lines: ['- damage{a=20} @Target', '- summon{type=ZOMBIE} @Self'] }
  ]
};
const result3 = window.templateManager.detectStructureType(multiSectionTemplate);
console.log('Multi-section:', result3);
// Expected: { type: 'multi-section', sectionCount: 2, lineCount: 3 }
```

**✅ Pass Criteria:** All three outputs match expected results

#### Test 2.2: Section Name Validation

```javascript
// Valid names
console.log('Valid names:');
console.log(window.templateManager.validateSectionName('MySkill'));
// Expected: { valid: true }

console.log(window.templateManager.validateSectionName('My_Skill_123'));
// Expected: { valid: true }

console.log(window.templateManager.validateSectionName('_PrivateSkill'));
// Expected: { valid: true }

// Invalid names
console.log('\nInvalid names:');
console.log(window.templateManager.validateSectionName('123Invalid'));
// Expected: { valid: false, error: '...' }

console.log(window.templateManager.validateSectionName('My-Skill!'));
// Expected: { valid: false, error: '...' }

console.log(window.templateManager.validateSectionName('X'));
// Expected: { valid: false, error: '...' } (too short)
```

**✅ Pass Criteria:** Valid names pass, invalid names fail with error messages

#### Test 2.3: Create Multi-Section Template

```javascript
// Login first (if not already logged in)
const user = window.authManager.getCurrentUser();
console.log('Current user:', user);

// Create test template
const testTemplate = {
  name: 'Test Multi-Section Template',
  description: 'Testing multi-section functionality with phases',
  type: 'skill',
  category: 'combat',
  difficulty: 'advanced',
  icon: '⚔️',
  tags: ['test', 'combat', 'multi-section'],
  sections: [
    { 
      name: 'PhaseOne', 
      lines: [
        '- damage{a=10} @Target',
        '- message{msg="Phase 1 activated!"} @Target'
      ] 
    },
    { 
      name: 'PhaseTwo', 
      lines: [
        '- damage{a=20} @Target',
        '- summon{type=ZOMBIE;amount=2} @Self',
        '- heal{a=5} @Self'
      ] 
    },
    { 
      name: 'PhaseThree', 
      lines: [
        '- damage{a=30} @Target',
        '- lightning @Target'
      ] 
    }
  ],
  is_official: false
};

const created = await window.templateManager.createTemplate(testTemplate);
console.log('Created template:', created);
console.log('Template ID:', created.id);
```

**✅ Pass Criteria:** Template created successfully with ID returned

#### Test 2.4: Load and Verify Template

```javascript
// Load all templates
const allTemplates = await window.templateManager.getAllTemplates();
console.log(`Loaded ${allTemplates.length} templates`);

// Find our test template
const testTemp = allTemplates.find(t => t.name === 'Test Multi-Section Template');
console.log('Found test template:', testTemp);

// Verify structure
console.log('Structure type:', testTemp.structure_type);
// Expected: 'multi-section'

console.log('Sections:', testTemp.sections);
// Expected: Array with 3 sections

console.log('Section names:', testTemp.sections.map(s => s.name));
// Expected: ['PhaseOne', 'PhaseTwo', 'PhaseThree']
```

**✅ Pass Criteria:** Template loads correctly with all sections intact

---

### Phase 3: Template Editor UI Testing 🎨

#### Test 3.1: Structure Type Selector

1. **Open Template Editor:**
   - Navigate to Skill Editor
   - Click "Add Skill Line" button (bottom left)
   - Click "Use Template" option
   - Click "Create New Template" button in template selector

2. **Test Structure Buttons:**
   - Should see three buttons: 🎯 Single Line, 📋 Multi-Line, 📚 Multi-Section
   - Click "📋 Multi-Line" → Should be selected (blue border)
   - Click "📚 Multi-Section" → Should show section cards below
   - Click "🎯 Single Line" → Should hide sections, show single input

**✅ Pass Criteria:** All three modes work correctly

#### Test 3.2: Multi-Section UI

1. **Switch to Multi-Section Mode:**
   - Click "📚 Multi-Section" button

2. **Add Sections:**
   - Should see "Add Section" button
   - Click it → New section card appears
   - Section card should have:
     - Section name input (placeholder: "SectionName")
     - Lines textarea (placeholder: "- mechanic{...}")
     - Remove button (red X)

3. **Test Section Management:**
   - Add 2 more sections (total 3)
   - Enter names: "Intro", "Main", "Outro"
   - Enter lines in each section
   - Remove middle section → Should be deleted
   - Add section again → Should appear at bottom

**✅ Pass Criteria:** Can add/remove sections, inputs work correctly

#### Test 3.3: Section Name Validation

1. **Test Valid Names:**
   - Enter "MySkill_1" → Should not show error
   - Enter "Attack_Phase" → Should not show error

2. **Test Invalid Names:**
   - Enter "123Invalid" → Should show red border/error
   - Enter "My Skill" (with space) → Should show error
   - Enter "X" → Should show error (too short)

**✅ Pass Criteria:** Validation errors appear immediately

#### Test 3.4: Import/Export Buttons

1. **Test YAML Preview:**
   - Fill in template data (name, description, sections)
   - Click "YAML" button
   - Should see modal with formatted YAML
   - Check structure looks correct
   - Click "Copy" → Should copy to clipboard
   - Close modal (X or ESC)

2. **Test Export:**
   - Click "Export" button
   - Should download .yml file
   - Open file in text editor
   - Verify YAML format and metadata comments

3. **Test Import:**
   - Edit the exported .yml file (change a line)
   - Click "Import" button
   - Select the edited file
   - Form should populate with imported data
   - Verify changes appear

**✅ Pass Criteria:** Import/export works, YAML is valid

#### Test 3.5: Official Template Checkbox

1. **Check Visibility:**
   - When logged out → Checkbox should be hidden
   - When logged in as user → Checkbox should be visible
   - When logged in as admin → Checkbox should be visible

2. **Test Functionality:**
   - Check "Mark as Official" checkbox
   - Save template
   - Reload template → Checkbox should still be checked
   - Template should have `is_official: true` in database

**✅ Pass Criteria:** Admin can mark templates as official

---

### Phase 4: Template Selector Testing 🏷️

#### Test 4.1: Structure Type Badges

1. **Open Template Selector:**
   - Click "Add Skill Line" → "Use Template"

2. **Verify Badge Display:**
   - Single-line templates: 🎯 "Single Line" badge (green)
   - Multi-line templates: 📋 "X lines" badge (blue)
   - Multi-section templates: 📚 "X sections" badge (purple)

3. **Test Hover Tooltips:**
   - Hover over structure badge
   - Should show tooltip with details:
     - "Single Line" → "One skill line"
     - "3 lines" → "One section with 3 lines"
     - "2 sections" → "2 sections, 8 total lines"

**✅ Pass Criteria:** All badges show correct type and color

#### Test 4.2: Official Template Badge

1. **Create Official Template:**
   - Create new template
   - Check "Mark as Official"
   - Save

2. **Verify Badge:**
   - Open template selector
   - Find your template
   - Should see 👑 "Official" badge (gold color)
   - Badge should be prominent (near name)

3. **Test in Both Views:**
   - Grid view → Badge appears on card
   - List view → Badge appears in title

**✅ Pass Criteria:** Official badge displays correctly

#### Test 4.3: Badge Colors and Styling

1. **Check Colors:**
   - Structure badges use theme colors
   - Official badge has gold gradient
   - Badges are readable on card background

2. **Check Responsiveness:**
   - Resize browser window
   - Badges should remain visible and readable
   - No overlapping text

**✅ Pass Criteria:** All badges look professional and readable

---

### Phase 5: Skill Builder Editor Testing 🎯

#### Test 5.1: Single/Multi-Line Template Insertion

1. **Open Skill Editor:**
   - Create or edit a skill

2. **Test Single-Line Template:**
   - Click "Add Skill Line" → "Use Template"
   - Select a single-line template
   - Should insert line immediately
   - No modal should appear

3. **Test Multi-Line Template:**
   - Click "Add Skill Line" → "Use Template"
   - Select a multi-line template (e.g., "5 lines")
   - Should insert all lines immediately
   - No modal should appear

**✅ Pass Criteria:** Single and multi-line templates insert directly

#### Test 5.2: Multi-Section Template in Skill Context

1. **Create/Edit a Skill:**
   - Open Skill Editor
   - Create new skill or edit existing

2. **Select Multi-Section Template:**
   - Click "Add Skill Line" → "Use Template"
   - Select template with multiple sections (e.g., your test template)
   - **Modal should appear** with two options

3. **Verify Modal Contents:**
   - Shows template name and description
   - Shows section count and total line count
   - Lists all sections with individual line counts:
     - 📚 PhaseOne (2 lines)
     - 📚 PhaseTwo (3 lines)
     - 📚 PhaseThree (2 lines)
   - Shows two buttons:
     - "Insert as Separate Sections" (blue)
     - "Merge Into Current Section" (gray)

4. **Test "Insert as Separate Sections":**
   - Click the button
   - Should create 3 new skill entries in left sidebar
   - Skill names: "PhaseOne", "PhaseTwo", "PhaseThree"
   - Each skill should have its lines
   - Current skill should switch to "PhaseOne"
   - Should show success toast

5. **Test Duplicate Name Handling:**
   - Use the same template again
   - Click "Insert as Separate Sections"
   - New skills should be named: "PhaseOne_1", "PhaseTwo_1", "PhaseThree_1"

6. **Test "Merge Into Current Section":**
   - Select the multi-section template again
   - Click "Merge Into Current Section"
   - All 7 lines should be added to current skill
   - Lines should be in order (Phase1 → Phase2 → Phase3)

**✅ Pass Criteria:** Both insertion modes work correctly in skill context

#### Test 5.3: Multi-Section Template in Mob Context

1. **Open Mob Editor:**
   - Create or edit a mob
   - Navigate to Skills section

2. **Select Multi-Section Template:**
   - Click "Add Skill Line" → "Use Template"
   - Select multi-section template
   - **Modal should appear** with ONE option

3. **Verify Modal:**
   - Shows template info
   - Shows section list
   - Only shows "Merge Into Skill Lines" button
   - No "Insert as Separate Sections" button (mob files are flat)

4. **Test Merge:**
   - Click "Merge Into Skill Lines"
   - All lines should be added to mob's skills array
   - Should close modal
   - Should show success toast

**✅ Pass Criteria:** Merge-only option in mob context

#### Test 5.4: Modal Interactions

1. **Test Close Behaviors:**
   - Open multi-section modal
   - Press ESC key → Should close
   - Click outside modal → Should close (if implemented)
   - Click X button → Should close

2. **Test Visual Feedback:**
   - Hover over buttons → Should show hover state
   - Click button → Should show loading state (if implemented)
   - After insertion → Should show success notification

**✅ Pass Criteria:** Modal is user-friendly and responsive

---

### Phase 6: Migration Testing 🚀

#### Test 6.1: Pre-Migration Check

```javascript
// Check if hardcoded templates still loaded
console.log('Hardcoded templates:', typeof SKILL_TEMPLATES !== 'undefined' ? 'YES' : 'NO');
// Expected: YES (before migration)

// Check current database templates
const { data: existingTemplates, count } = await window.supabaseClient
  .from('templates')
  .select('*', { count: 'exact' })
  .eq('deleted', false);

console.log(`Existing templates in DB: ${count || existingTemplates.length}`);
// Expected: 0 or very few (user-created only)
```

**✅ Pass Criteria:** Hardcoded templates exist, DB has few/no templates

#### Test 6.2: Execute Migration

```javascript
// Get admin user
const user = window.authManager.getCurrentUser();
if (!user) {
  alert('Please log in as admin first!');
} else {
  console.log('Admin User ID:', user.id);
  console.log('Admin Email:', user.email);
  
  // Run migration (this may take 30-60 seconds)
  console.log('🚀 Starting migration...');
  console.log('This will migrate ~200 templates from skillTemplates.js to database');
  console.log('Please wait...');
  
  const startTime = Date.now();
  const results = await window.templateMigration.migrateAll(user.id);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n✅ Migration completed in ${duration}s`);
  console.log('Results:', results);
  console.log(`  - Successful: ${results.success.length}`);
  console.log(`  - Failed: ${results.failed.length}`);
  
  if (results.errors.length > 0) {
    console.error('Errors:', results.errors);
  }
}
```

**✅ Pass Criteria:** 
- Migration completes without errors
- ~200 templates migrated successfully
- Failed array is empty

#### Test 6.3: Verify Migration Results

```javascript
// Check migration status
const verification = await window.templateMigration.verify();
console.log('Verification Results:', verification);
console.log(`  - Total templates: ${verification.totalTemplates}`);
console.log(`  - Official templates: ${verification.officialTemplates}`);
console.log(`  - Structure type distribution:`, verification.structureTypes);
console.log(`  - Categories:`, verification.categories);

// Expected structure types distribution (approximate):
// - single: 50-100 templates
// - multi-line: 100-150 templates
// - multi-section: 0-10 templates (if any complex ones exist)
```

**✅ Pass Criteria:** ~200 official templates, variety of structure types

#### Test 6.4: Test Migrated Templates

```javascript
// Load all templates
const templates = await window.templateManager.getAllTemplates();
console.log(`Total templates: ${templates.length}`);

// Check sample templates
const sampleTemplate = templates.find(t => t.name === 'Basic Attack');
console.log('Sample template:', sampleTemplate);
console.log('  - Structure type:', sampleTemplate.structure_type);
console.log('  - Is official:', sampleTemplate.is_official);
console.log('  - Sections:', sampleTemplate.sections);
```

**✅ Pass Criteria:** Templates load correctly, have proper structure types

#### Test 6.5: UI Verification After Migration

1. **Open Template Selector:**
   - Should see ~200 templates
   - All should have structure badges
   - All should have official badges (gold crown)

2. **Test Applying Templates:**
   - Select 5-10 random templates
   - Apply to skills/mobs
   - Verify lines insert correctly

3. **Check Console:**
   - No errors during template loading
   - No errors during template application

**✅ Pass Criteria:** All templates work in UI, no errors

---

### Phase 7: Post-Migration Cleanup 🧹

#### Test 7.1: Verify Before Deletion

```javascript
// Final verification before deleting hardcoded file
const finalCheck = await window.templateManager.getAllTemplates();
console.log('Final template count:', finalCheck.length);

// Check a few random templates work
const randomTemplates = finalCheck.slice(0, 5);
for (const template of randomTemplates) {
  console.log(`Testing template: ${template.name}`);
  console.log('  - Structure:', template.structure_type);
  console.log('  - Sections:', template.sections.length);
  console.log('  - Lines:', template.sections.reduce((sum, s) => sum + s.lines.length, 0));
}
```

**✅ Pass Criteria:** All templates accessible and functional

#### Test 7.2: Remove Hardcoded File Reference

1. **Open index.html**
2. **Find and delete line:**
   ```html
   <script src="data/skillTemplates.js"></script>
   ```
3. **Save file**
4. **Refresh browser**
5. **Test in console:**
   ```javascript
   console.log('SKILL_TEMPLATES exists?', typeof SKILL_TEMPLATES !== 'undefined');
   // Expected: false
   
   // Templates should still load from database
   const templates = await window.templateManager.getAllTemplates();
   console.log(`Templates loaded from DB: ${templates.length}`);
   // Expected: ~200
   ```

**✅ Pass Criteria:** App works without skillTemplates.js

#### Test 7.3: Delete File

1. **Navigate to `data/` folder**
2. **Delete `skillTemplates.js`**
3. **Refresh browser**
4. **Verify no errors:**
   - Open console
   - Should see no 404 errors for skillTemplates.js
   - App should function normally

**✅ Pass Criteria:** No errors after file deletion

---

### Phase 8: Regression Testing 🔄

#### Test 8.1: Backward Compatibility

1. **Test Old Format Templates:**
   - If any templates exist with old `skillLines` format
   - They should still work
   - Auto-convert to `sections` format on load

2. **Test Mixed Formats:**
   - Database should have both formats
   - All should display correctly
   - All should apply correctly

**✅ Pass Criteria:** Old templates work without errors

#### Test 8.2: Edge Cases

1. **Empty Template:**
   - Try creating template with no lines
   - Should show validation error

2. **Invalid Section Name:**
   - Try section name starting with number
   - Should show error immediately

3. **Very Long Template:**
   - Create template with 50+ lines
   - Should load and display correctly
   - Performance should be acceptable

4. **Special Characters:**
   - Test template with special chars in description
   - Should escape properly in YAML
   - Should not break display

**✅ Pass Criteria:** All edge cases handled gracefully

#### Test 8.3: Performance

1. **Template Loading:**
   - Load template selector
   - Should render all ~200 templates in < 2 seconds

2. **Template Search/Filter:**
   - Type in search box
   - Results should filter immediately

3. **Template Application:**
   - Apply template to skill/mob
   - Should insert in < 500ms

**✅ Pass Criteria:** No noticeable lag

---

## 📊 Testing Summary Checklist

Use this checklist to track your testing progress:

### Database & Core
- [ ] Database migration executed successfully
- [ ] Structure type detection works correctly
- [ ] Section name validation works correctly
- [ ] Can create multi-section templates programmatically

### Template Editor UI
- [ ] Structure type selector works (3 modes)
- [ ] Can add/remove sections
- [ ] Section name validation shows errors
- [ ] YAML preview displays correctly
- [ ] Import/Export YAML works
- [ ] Official checkbox visible to admins

### Template Selector
- [ ] Structure badges display correctly (colors/icons)
- [ ] Official badges display on official templates
- [ ] Tooltips show detailed info
- [ ] Both grid and list views work

### Skill Builder Editor
- [ ] Single-line templates insert directly
- [ ] Multi-line templates insert directly
- [ ] Multi-section modal appears in skill context
- [ ] "Separate Sections" creates new skills
- [ ] "Merge" combines all lines
- [ ] Mob context only shows merge option
- [ ] Modal interactions work (ESC, click outside)

### Migration
- [ ] Migration executed without errors
- [ ] ~200 templates migrated successfully
- [ ] All templates have correct structure types
- [ ] All migrated templates are marked official
- [ ] Templates load and display in UI
- [ ] Can apply migrated templates

### Cleanup
- [ ] Hardcoded file reference removed from index.html
- [ ] skillTemplates.js file deleted
- [ ] App works without hardcoded file
- [ ] No console errors

### Regression
- [ ] Backward compatibility maintained
- [ ] Edge cases handled
- [ ] Performance is acceptable
- [ ] No broken features

---

## 🐛 Bug Reporting

If you encounter issues during testing:

1. **Document the Issue:**
   - What were you doing?
   - What did you expect?
   - What actually happened?
   - Any console errors?

2. **Capture Debug Info:**
   ```javascript
   // Run this in console when issue occurs
   console.log('Debug Info:');
   console.log('Current User:', window.authManager.getCurrentUser());
   console.log('Template Manager:', window.templateManager);
   console.log('Last Error:', window.lastError);
   ```

3. **Check Browser Console:**
   - Look for red errors
   - Copy full error message and stack trace

4. **Test in Different Context:**
   - Does it happen in skill editor?
   - Does it happen in mob editor?
   - Does it happen with different templates?

---

## ✅ Testing Complete

Once all checkboxes are marked:
- System is ready for production use
- Multi-section templates fully functional
- Migration successful
- No critical bugs remain

**Next Steps:**
- Update user documentation
- Create tutorial video/GIF
- Announce new feature to users
- Monitor for issues in production
