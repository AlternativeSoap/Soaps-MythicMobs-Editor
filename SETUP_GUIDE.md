# Multi-Section Template System - Setup & Migration Guide

## 🚀 Quick Start

### Step 1: Update Database Schema

1. Go to your Supabase project SQL Editor
2. Run the updated migration file:
   ```sql
   -- File: database_migrations/002_create_templates_table.sql
   -- This adds structure_type and is_official columns
   ```
3. Verify the columns were added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'templates';
   ```

### Step 2: Load New Components

The following files have been added to your project:
- ✅ `components/templateImportExport.js` - YAML import/export functionality
- ✅ `components/templateMigration.js` - Migration script for hardcoded templates
- ✅ `IMPLEMENTATION_STATUS.md` - Detailed implementation status

These are already added to `index.html` and will load automatically.

### Step 3: Test Core Functionality

Open browser console and test:

```javascript
// 1. Test structure detection
const testTemplate = {
  sections: [
    { name: 'TestSkill', lines: ['- damage{a=10} @Target'] }
  ]
};
const structureInfo = window.templateManager.detectStructureType(testTemplate);
console.log('Structure:', structureInfo);
// Expected: { type: 'single', sectionCount: 1, lineCount: 1 }

// 2. Test section name validation
const validation = window.templateManager.validateSectionName('My_Skill_1');
console.log('Validation:', validation);
// Expected: { valid: true }

// 3. Test invalid name
const invalidValidation = window.templateManager.validateSectionName('123Invalid');
console.log('Invalid:', invalidValidation);
// Expected: { valid: false, error: '...' }
```

---

## 📦 Migrate Hardcoded Templates

### Prerequisites
- Must be logged in as admin/system user
- Templates table must exist with new columns
- `skillTemplates.js` must still be loaded

### Migration Steps

```javascript
// 1. Login as admin (if not already)
await window.authManager.signIn('your-admin-email@example.com', 'your-password');

// 2. Get your user ID
const currentUser = window.authManager.getCurrentUser();
console.log('Admin User ID:', currentUser.id);
// ⚠️ SAVE THIS ID - you'll need it to manage official templates

// 3. Create migration instance
const migration = new TemplateMigration(
  window.supabaseClient,
  window.authManager,
  window.templateManager
);

// 4. Run migration (this will take 30-60 seconds)
console.log('🚀 Starting migration...');
const results = await migration.migrateAll(currentUser.id);

// 5. Check results
console.log('✅ Success:', results.success);
console.log('❌ Failed:', results.failed);
if (results.errors.length > 0) {
  console.log('Errors:', results.errors);
}

// 6. Verify templates in database
const verification = await migration.verify();
console.log('📊 Verification:', verification);
// Expected: ~200 templates with proper structure types

// 7. Test loading templates
const templates = await window.templateManager.getAllTemplates();
console.log(`Loaded ${templates.length} templates`);
```

### Rollback (if needed)

If something goes wrong:

```javascript
// ⚠️ WARNING: This deletes all official templates!
const deletedCount = await migration.rollback();
console.log(`Deleted ${deletedCount} templates`);

// Then you can re-run the migration
```

---

## 🧪 Testing Import/Export

### Test YAML Export

```javascript
// 1. Get a template
const templates = await window.templateManager.getAllTemplates();
const testTemplate = templates[0];

// 2. Create import/export instance
const importExport = new TemplateImportExport(window.templateManager);

// 3. Export to YAML
const yaml = importExport.exportToYAML(testTemplate);
console.log('YAML Output:');
console.log(yaml);

// 4. Download as file
importExport.downloadAsYAML(testTemplate);
// Should download a .yml file

// 5. Copy to clipboard
await importExport.copyToClipboard(testTemplate);
console.log('✅ YAML copied to clipboard!');
```

### Test YAML Import

```javascript
const importExport = new TemplateImportExport(window.templateManager);

// Method 1: Import from file
importExport.importFromFile(
  (templateData) => {
    console.log('✅ Imported template:', templateData);
    // You can now create this template:
    // await window.templateManager.createTemplate(templateData);
  },
  (error) => {
    console.error('❌ Import failed:', error);
  }
);

// Method 2: Import from clipboard (paste YAML first)
try {
  const templateData = await importExport.importFromClipboard();
  console.log('✅ Imported from clipboard:', templateData);
} catch (error) {
  console.error('❌ Failed:', error);
}
```

---

## 🎨 UI Components Status

### ✅ Completed
- Database schema with new columns
- TemplateManager with section support
- Import/Export utility (full YAML support)
- Migration script

### 🚧 In Progress
- TemplateEditor (needs multi-section UI)
- TemplateSelector (needs structure badges)
- SkillBuilderEditor (needs section insertion logic)
- YAML Preview Modal (needs creation)

### ❌ Not Started
- Admin panel for managing official templates
- Structure type filter in template selector
- Multi-section insertion prompt
- Comprehensive testing suite

---

## 🔧 Admin Features

### Mark Template as Official

```javascript
// 1. Get template ID (from template selector or database)
const templateId = 'your-template-uuid';

// 2. Update to mark as official (requires admin)
await window.templateManager.updateTemplate(templateId, {
  is_official: true
});

console.log('✅ Template marked as official');
```

### Query Official Templates

```javascript
// Get all official templates
const { data } = await window.supabaseClient
  .from('templates')
  .select('*')
  .eq('is_official', true)
  .eq('deleted', false);

console.log(`Found ${data.length} official templates`);
```

---

## 📝 Creating Multi-Section Templates

### Example: Create Multi-Section Template

```javascript
const multiSectionTemplate = {
  name: 'Epic Boss Phases',
  description: 'Three-phase boss with escalating difficulty',
  type: 'skill',
  sections: [
    {
      name: 'PhaseOne',
      lines: [
        '- damage{a=10} @Target',
        '- message{m="Phase 1!"} @PIR{r=20}'
      ]
    },
    {
      name: 'PhaseTwo',
      lines: [
        '- damage{a=20} @Target',
        '- summon{type=ZOMBIE;amount=2} @Self',
        '- message{m="Phase 2 - Reinforcements!"} @PIR{r=20}'
      ]
    },
    {
      name: 'PhaseThree',
      lines: [
        '- damage{a=30} @EntitiesInRadius{r=5}',
        '- effect:particles{p=explosion_large;a=50} @Self',
        '- message{m="Final Phase!"} @PIR{r=20}'
      ]
    }
  ],
  tags: ['boss', 'multi-phase', 'advanced'],
  category: 'combat',
  icon: '👑',
  difficulty: 'advanced'
};

// Create it
await window.templateManager.createTemplate(multiSectionTemplate);
console.log('✅ Multi-section template created!');
```

---

## 🐛 Troubleshooting

### Issue: "Column does not exist: structure_type"
**Solution:** Run the database migration SQL script in Supabase

### Issue: "SKILL_TEMPLATES is not defined"
**Solution:** Make sure `data/skillTemplates.js` is still loaded in `index.html` until migration is complete

### Issue: Migration fails with permission errors
**Solution:** Ensure you're logged in as admin and the user ID has proper permissions

### Issue: Templates not showing structure badges
**Solution:** TemplateSelector UI updates not yet implemented (see IMPLEMENTATION_STATUS.md)

---

## 🎯 Next Steps

1. **Run Database Migration** ✅ (You are here)
2. **Test Core Functionality** ✅
3. **Run Template Migration** ⏳
4. **Update UI Components** (TemplateEditor, TemplateSelector)
5. **Test Everything**
6. **Delete skillTemplates.js** (after confirming migration success)

---

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify database schema is updated
3. Confirm user is logged in with proper permissions
4. Review `IMPLEMENTATION_STATUS.md` for current progress
5. Check Supabase logs for database errors

---

*Ready to revolutionize your template system! 🚀*
