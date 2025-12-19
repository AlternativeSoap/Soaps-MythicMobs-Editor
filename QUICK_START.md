# Multi-Section Templates - Quick Reference

## 🚀 Current Status: 85% Complete - Ready for Migration

### ✅ What's Done
- Database schema ready
- Template Editor with multi-section UI
- Template Selector with structure badges
- Skill Builder with multi-section handling
- Migration scripts ready to execute

### 📋 Next: Execute Migration (10 minutes)

---

## Quick Start (Copy-Paste Commands)

### 1️⃣ Database Setup (Supabase SQL Editor)
```sql
-- Add new columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS structure_type TEXT DEFAULT 'multi-line' 
CHECK (structure_type IN ('single', 'multi-line', 'multi-section'));

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_templates_structure_type ON templates(structure_type);
CREATE INDEX IF NOT EXISTS idx_templates_is_official ON templates(is_official);
```

### 2️⃣ Migration Execution (Browser Console)
```javascript
// Get admin user
const user = window.authManager.getCurrentUser();
console.log('User ID:', user.id);

// Run migration (~30-60 seconds)
const results = await window.templateMigration.migrateAll(user.id);
console.log(`✅ Migrated: ${results.success.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

// Verify
const verification = await window.templateMigration.verify();
console.log('Total templates:', verification.totalTemplates);
console.log('Structure types:', verification.structureTypes);
```

### 3️⃣ Verification
```javascript
// Load templates
const templates = await window.templateManager.getAllTemplates();
console.log(`Loaded ${templates.length} templates`);

// Test one
const sample = templates[0];
console.log('Sample:', sample.name, sample.structure_type, sample.is_official);
```

---

## 📚 Documentation Files

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Complete step-by-step migration instructions
- **[TESTING_INSTRUCTIONS.md](TESTING_INSTRUCTIONS.md)** - Comprehensive testing checklist
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - Detailed progress tracking

---

## 🎯 What You'll See After Migration

### Template Selector
- 🎯 **Green badge** = Single line template
- 📋 **Blue badge** = Multi-line template (e.g., "3 lines")
- 📚 **Purple badge** = Multi-section template (e.g., "2 sections")
- 👑 **Gold badge** = Official template

### Applying Multi-Section Templates

**In Skill Context:**
```
Modal appears with choices:
┌─────────────────────────────────────┐
│ Insert Multi-Section Template       │
├─────────────────────────────────────┤
│ Template: Boss Fight Phases         │
│ 3 sections • 12 total lines         │
│                                     │
│ Sections:                           │
│ 📚 PhaseOne (3 lines)               │
│ 📚 PhaseTwo (5 lines)               │
│ 📚 PhaseThree (4 lines)             │
│                                     │
│ [Insert as Separate Sections]      │
│ [Merge Into Current Section]       │
└─────────────────────────────────────┘
```

**Separate Sections** → Creates 3 new skills: "PhaseOne", "PhaseTwo", "PhaseThree"  
**Merge** → Adds all 12 lines to current skill

---

## 🎨 New Features at a Glance

### Template Editor
- **Structure Type Selector**: Switch between Single/Multi-Line/Multi-Section
- **Section Cards**: Add/remove sections with name validation
- **YAML Import/Export**: Full metadata preservation
- **Official Checkbox**: Mark templates as official (admin only)

### Template Selector  
- **Visual Badges**: Instantly see template complexity
- **Official Badge**: Curated templates stand out
- **Structure Tooltips**: Hover for details

### Skill Builder
- **Smart Insertion**: Context-aware options (skill vs mob)
- **Section Preview**: See what you're inserting
- **Unique Naming**: Auto-handles name conflicts

---

## ⚠️ Important Notes

1. **Backup First**: Migration is mostly irreversible (rollback available but creates duplicates)
2. **Admin Required**: Must be logged in as admin to run migration
3. **One-Time Operation**: Only run migration once
4. **Test First**: Use verification commands before UI testing
5. **Keep skillTemplates.js**: Don't delete until after full testing

---

## 🐛 If Something Goes Wrong

### Rollback Migration
```javascript
const deleted = await window.templateMigration.rollback();
console.log(`Rolled back ${deleted} templates`);
```

### Check Component Status
```javascript
console.log('Status:', {
  templateManager: !!window.templateManager ? '✅' : '❌',
  templateMigration: !!window.templateMigration ? '✅' : '❌',
  supabaseClient: !!window.supabaseClient ? '✅' : '❌',
  authManager: !!window.authManager ? '✅' : '❌'
});
```

### Verify Database Schema
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'templates' 
AND column_name IN ('structure_type', 'is_official');
```

---

## ✅ Success Checklist

- [ ] Database columns added
- [ ] Logged in as admin
- [ ] Migration executed (results.success.length ≈ 200)
- [ ] Verification passed (totalTemplates ≈ 200)
- [ ] Templates visible in UI with badges
- [ ] Can apply templates successfully
- [ ] Multi-section modal works in skill context
- [ ] No console errors

---

## 🎉 After Migration

1. **Test extensively** using [TESTING_INSTRUCTIONS.md](TESTING_INSTRUCTIONS.md)
2. **Remove script tag** from index.html (after testing):
   ```html
   <!-- <script src="data/skillTemplates.js"></script> -->
   ```
3. **Delete hardcoded file** (after verification)
4. **Update documentation** for users
5. **Celebrate** 🎊 You now have a database-backed template system!

---

## 📞 Need Help?

- Check console for errors
- Review [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed troubleshooting
- Verify all prerequisites met
- Try rollback and re-run if needed

---

**Ready to migrate?** Start with Step 1 above! 🚀
