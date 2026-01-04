# Template System Complete Overhaul Plan

## Executive Summary

This document outlines a comprehensive redesign of the template system to support **full entity sections** (not just skill lines) with smart YAML import capabilities. The new system will:

1. Support **Skill Templates** (full skill sections with all settings)
2. Support **Mob Templates** (full mob sections with all settings)
3. Future-ready for **Item, Droptable, Randomspawn, and Pack templates**
4. Provide **smart YAML import** with auto-detection
5. Enable **"Save as Template"** from any editor
6. Show **template selection when creating new sections**

---

## Current State Analysis

### What Exists Now:
- `templateManager.js` - CRUD for templates (stores skill lines/sections)
- `templateSelector.js` - Browser UI (4575 lines, complex)
- `templateWizard.js` - Create templates wizard (1709 lines)
- `templateEditor.js` - Edit existing templates
- Database: `templates` table with `type` column ('mob' or 'skill')

### Current Limitations:
1. Templates only store **skill lines**, not full skill/mob configurations
2. No distinction between "skill template" and "mob template" in browser
3. No "Save as Template" button in editors
4. No template selection when creating new sections
5. Complex filtering that doesn't match the new entity-based approach

---

## New Architecture

### Database Schema Changes

```sql
-- Rename 'type' to 'entity_type' for clarity
ALTER TABLE templates RENAME COLUMN type TO entity_type;

-- Add constraint for supported entity types
ALTER TABLE templates 
ADD CONSTRAINT valid_entity_type 
CHECK (entity_type IN ('skill', 'mob', 'item', 'droptable', 'randomspawn'));

-- Simplify structure_type to just 'single' or 'pack'
ALTER TABLE templates 
DROP CONSTRAINT IF EXISTS valid_structure_type;

ALTER TABLE templates 
ADD CONSTRAINT valid_structure_type 
CHECK (structure_type IN ('single', 'pack'));
```

### Template Data Structure

#### Skill Template (`entity_type: 'skill'`)
```javascript
{
    entity_type: 'skill',
    structure_type: 'single', // or 'pack' for multi-skill
    data: {
        // Full skill section data (from skill editor)
        name: 'FireballSkill',
        cooldown: 5,
        targetoncaster: false,
        // ... all beginner/advanced options
        Skills: [
            '- damage{a=10} @target',
            '- effect:particles{...}'
        ],
        Conditions: ['- day'],
        TargetConditions: [...],
        TriggerConditions: [...]
    }
}
```

#### Mob Template (`entity_type: 'mob'`)
```javascript
{
    entity_type: 'mob',
    structure_type: 'single', // or 'pack' for multi-mob
    data: {
        // Full mob section data (from mob editor)
        Type: 'ZOMBIE',
        Display: '&cFire Zombie',
        Health: 100,
        Damage: 10,
        // ... all beginner/advanced options
        Skills: [
            '- skill{s=FireballSkill} @target ~onTimer:60',
            '- damage{a=5} @target ~onAttack'
        ],
        Equipment: {...},
        Drops: [...],
        AIGoalSelectors: [...],
        AITargetSelectors: [...]
    }
}
```

---

## Component Changes

### 1. templateManager.js Updates

**Changes needed:**
- Rename all `type` references to `entity_type`
- Add methods for saving full entity data:
  - `createSkillTemplate(skillData)` - From skill editor
  - `createMobTemplate(mobData)` - From mob editor
- Update `detectTemplateType()` to analyze full entity structure

```javascript
// New method to save skill section as template
async createFromSkillEditor(skillSection, metadata) {
    return this.createTemplate({
        entity_type: 'skill',
        structure_type: 'single',
        name: metadata.name || skillSection.name,
        description: metadata.description,
        category: metadata.category || this.detectSkillCategory(skillSection),
        data: {
            ...skillSection,  // All skill settings
            _originalName: skillSection.name  // Track original name
        }
    });
}

// New method to save mob section as template
async createFromMobEditor(mobSection, metadata) {
    return this.createTemplate({
        entity_type: 'mob',
        structure_type: 'single',
        name: metadata.name || mobSection.name,
        description: metadata.description,
        category: metadata.category || this.detectMobCategory(mobSection),
        data: {
            ...mobSection,  // All mob settings
            _originalName: mobSection.name
        }
    });
}
```

---

### 2. templateSelector.js Simplification

**Current problems:**
- 4575 lines of complex code
- Too many filter options
- No entity type separation

**New simplified design:**

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Template Browser                          [×]            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┬─────────────┐                             │
│  │   Skills    │    Mobs     │  ← Entity Type Tabs          │
│  └─────────────┴─────────────┘                             │
│                                                             │
│  🔍 [Search templates...              ] [Source ▼]          │
│                                                             │
│  Categories: [All] [Combat] [Support] [Movement] [Utility]  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 Template Grid                                     │   │
│  │                                                      │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │   │
│  │  │ ⚔️     │  │ 🛡️     │  │ 💫     │  │ 🔥     │    │   │
│  │  │Fireball│  │ Shield │  │ Teleport│ │ Burn   │    │   │
│  │  │ Attack │  │  Bash  │  │ Behind │  │ Effect │    │   │
│  │  │        │  │        │  │        │  │        │    │   │
│  │  │[Use]   │  │[Use]   │  │[Use]   │  │[Use]   │    │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Showing 24 templates                              [Close]  │
└─────────────────────────────────────────────────────────────┘
```

**Key simplifications:**
1. **Entity type tabs** at top (Skills | Mobs | Items | etc.)
2. **Single search row** with search + source filter
3. **Category pills** (not dropdown)
4. **Clean card grid** with minimal info
5. **Remove**: View mode toggle, sort controls, comparison mode, batch actions

---

### 3. skillEditor.js - Add "Save as Template" Button

**Add to editor header:**
```javascript
<div class="editor-actions">
    <button class="btn btn-outline" id="save-skill-as-template" title="Save this skill section as a template">
        <i class="fas fa-bookmark"></i> Save as Template
    </button>
    // ... existing buttons
</div>
```

**New method:**
```javascript
async saveAsTemplate() {
    const skillData = this.collectSkillData(); // Get all skill settings
    
    // Show simple modal for metadata
    const metadata = await this.showSaveAsTemplateModal(skillData);
    if (!metadata) return; // User cancelled
    
    try {
        await window.templateManager.createFromSkillEditor(skillData, metadata);
        window.editor.showToast('Template saved successfully!', 'success');
    } catch (error) {
        window.editor.showToast(error.message, 'error');
    }
}
```

---

### 4. mobEditor.js - Add "Save as Template" Button

Same pattern as skillEditor:
```javascript
async saveAsTemplate() {
    const mobData = this.collectMobData(); // Get all mob settings
    
    const metadata = await this.showSaveAsTemplateModal(mobData);
    if (!metadata) return;
    
    try {
        await window.templateManager.createFromMobEditor(mobData, metadata);
        window.editor.showToast('Template saved successfully!', 'success');
    } catch (error) {
        window.editor.showToast(error.message, 'error');
    }
}
```

---

### 5. New Section Creation Flow

**When user clicks "New Section" in skill editor:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✨ Create New Skill Section                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Choose how to start:                                       │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │                     │  │                     │          │
│  │     📝 Blank        │  │   📦 From Template  │          │
│  │                     │  │                     │          │
│  │  Start with an      │  │  Use a pre-made     │          │
│  │  empty skill        │  │  skill template     │          │
│  │                     │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│                                             [Cancel]        │
└─────────────────────────────────────────────────────────────┘
```

If "From Template" is selected → Open template browser (filtered to skills only)

---

### 6. NEW: templateYAMLImporter.js

A new component for smart YAML import (from admin panel).

**Core capabilities:**
1. **File type detection** - Mob file vs Skill file
2. **Context detection** - Triggers present = mob skills
3. **Skill grouping** - By skill{} calls and naming patterns
4. **Component analysis** - Mechanics, targeters, conditions
5. **Duplicate detection** - Compare with existing templates

**Class structure:**
```javascript
class TemplateYAMLImporter {
    constructor(templateManager) {
        this.templateManager = templateManager;
    }
    
    // Step 1: Parse and analyze
    async analyzeFile(yamlContent, fileType = 'auto') {
        const parsed = this.parseYAML(yamlContent);
        const detectedType = fileType === 'auto' ? this.detectFileType(parsed) : fileType;
        
        return {
            fileType: detectedType,
            entries: this.extractEntries(parsed, detectedType),
            components: this.analyzeComponents(parsed),
            suggestedGroups: this.suggestGroupings(parsed),
            warnings: this.checkForIssues(parsed)
        };
    }
    
    // Step 2: Create templates from grouped entries
    async createTemplates(groupedEntries, options) {
        const results = [];
        for (const group of groupedEntries) {
            const template = await this.templateManager.createTemplate({
                entity_type: group.entityType,
                name: group.name,
                description: group.description,
                category: group.category,
                data: group.entityType === 'skill' 
                    ? this.buildSkillTemplateData(group)
                    : this.buildMobTemplateData(group)
            });
            results.push(template);
        }
        return results;
    }
    
    // Detection methods
    detectFileType(parsed) { /* ... */ }
    hasTriggersInSkills(skills) { /* ... */ }
    
    // Grouping methods
    suggestGroupings(parsed) { /* ... */ }
    findSkillCallChains(skills) { /* ... */ }
    findNamingPatterns(names) { /* ... */ }
    
    // Analysis methods
    analyzeComponents(parsed) { /* ... */ }
    extractMechanics(skillLines) { /* ... */ }
    extractTargeters(skillLines) { /* ... */ }
}
```

---

### 7. NEW: templateImportWizard.js

Multi-step wizard UI for YAML import.

**Steps:**
1. **Upload & Analyze** - File upload, auto-detection
2. **Review Analysis** - Show what was found, smart suggestions
3. **Group Skills** - Drag/drop grouping interface
4. **Configure Templates** - Metadata for each template
5. **Final Review** - Duplicate check, confirmation

---

## Files to Create/Modify

### New Files:
1. `components/templateYAMLImporter.js` - Smart YAML import logic
2. `components/templateImportWizard.js` - Import wizard UI
3. `styles/templateImporter.css` - Import wizard styles

### Modified Files:
1. `components/templateManager.js` - Entity type support, new create methods
2. `components/templateSelector.js` - Simplified entity-based browser
3. `components/skillEditor.js` - Save as Template button
4. `components/mobEditor.js` - Save as Template button
5. `components/adminPanelEnhanced.js` - Import from YAML button
6. `components/creationModeSelector.js` - Template option when creating

---

## Implementation Phases

### Phase 1: Database & Core (Day 1)
1. ✅ Apply SQL migrations (entity_type, structure_type)
2. Update templateManager.js for entity_type
3. Add `createFromSkillEditor()` and `createFromMobEditor()` methods

### Phase 2: Save as Template (Day 1-2)
1. Add "Save as Template" button to skillEditor.js
2. Add "Save as Template" button to mobEditor.js
3. Create simple metadata modal for saving

### Phase 3: Template Browser Simplification (Day 2-3)
1. Add entity type tabs (Skills | Mobs)
2. Simplify filters to: Search + Source + Category pills
3. Update card rendering for full entity templates
4. Remove unused features (comparison mode, batch export, etc.)

### Phase 4: Creation Flow (Day 3)
1. Update "New Section" to show blank vs template choice
2. Filter template browser by entity type in context
3. Apply template data to new section

### Phase 5: YAML Import (Day 4-5)
1. Create templateYAMLImporter.js
2. Create templateImportWizard.js
3. Add "Import from YAML" button to admin panel
4. Test full import flow

### Phase 6: Polish & Testing (Day 6)
1. Test all flows end-to-end
2. Fix edge cases
3. Performance optimization

---

## Key Design Principles

1. **Entity-First**: Templates are organized by entity type (skill, mob, item, etc.)
2. **Full Data**: Templates store complete entity configurations, not just skill lines
3. **Smart Defaults**: Auto-detect everything possible, allow manual override
4. **Simple UI**: Remove complexity that isn't essential
5. **Future-Ready**: Design supports items, droptables, randomspawns, packs

---

## Migration Notes

### Existing Templates:
- Old templates with `type: 'skill'` that only have skill lines will still work
- They'll be treated as single-section skill templates
- The `data.Skills` array becomes the skill lines

### Backward Compatibility:
```javascript
// In templateManager.js
processTemplate(rawTemplate) {
    // Handle old format (skill lines only)
    if (rawTemplate.data?.skillLines && !rawTemplate.data?.Skills) {
        rawTemplate.data.Skills = rawTemplate.data.skillLines;
    }
    
    // Ensure entity_type exists (fallback to old 'type')
    rawTemplate.entity_type = rawTemplate.entity_type || rawTemplate.type || 'skill';
    
    return rawTemplate;
}
```

---

## Success Criteria

1. ✅ Can save any skill section as a template (with all settings)
2. ✅ Can save any mob section as a template (with all settings)
3. ✅ Template browser shows entity type tabs
4. ✅ Creating new section shows "blank or template" choice
5. ✅ Can import YAML files as templates via admin panel
6. ✅ Skill templates only appear in skill editor
7. ✅ Mob templates only appear in mob editor
8. ✅ Clean, simple UI with good performance

---

## Questions for User

1. **Remove comparison mode?** It adds complexity - is it used?
2. **Remove batch export?** The YAML import is more useful for admin
3. **Default category pills?** Combat, Support, Movement, Utility, Other?
4. **Pack templates later?** Focus on single-entity templates first?

---

*This plan balances comprehensive functionality with maintainable complexity. The phased approach allows for incremental testing and validation.*
