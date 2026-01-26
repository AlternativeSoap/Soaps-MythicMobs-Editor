# Import/Export System Improvements

## Overview
This document outlines the improvements made to the pack import/export functionality based on user feedback.

## Completed Improvements

### 1. ✅ Fixed Blank Import Menu for Single Folder Selection

**Problem**: When importing only a single MythicMobs folder (e.g., just the "Skills" folder), the import menu would show blank because the system didn't recognize it as a valid pack structure.

**Solution**:
- Added new folder type detection: `'single-folder'`
- Updated `PackImporterCore.detectFolderTypeFromFiles()` to check if the selected folder name matches a MythicMobs folder name (case-insensitive)
- Updated `PackFolderScanner.detectFolderType()` to handle the File System Access API case
- Modified `scanFromFiles()` to create a temporary pack structure when a single folder is detected
- The imported folder is wrapped in a pack named `"Imported {FolderName}"` with only that folder populated

**Files Modified**:
- `components/packImporter/PackImporterCore.js` (lines 399-440, 467-530)
- `components/packImporter/PackFolderScanner.js` (lines 77-120, scan method)

**How it Works**:
1. User selects just "Skills" folder
2. System detects folder name matches "Skills" (case-insensitive)
3. Creates pack structure: `{ name: "Imported Skills", folders: { Skills: {...}, Mobs: {empty}, Items: {empty}, ... } }`
4. Import proceeds normally with validation and preview

---

### 2. ✅ Added Critical Error Validation Before Export

**Problem**: Users could export packs with critical configuration errors (missing required fields, invalid YAML structure) that would cause MythicMobs to fail loading the pack.

**Solution**:
- Created `validatePackForExport()` function in PackManager
- Validates all mobs, skills, items, and droptables before export
- Distinguishes between **critical errors** (prevent export) and **warnings** (allow export with confirmation)

**Critical Errors** (prevent export):
- Mobs: Missing MobType/Type AND missing Template
- Skills: Missing or invalid Skills array
- Items: Missing Material/Id
- Any entity: Invalid YAML structure

**Warnings** (allow export with confirmation):
- Missing references (unused skills, mobs, items)
- Invalid entity types (may be mod entities)
- Other non-critical validation issues

**Files Modified**:
- `components/packManager.js` (lines 3324-3520)

**User Experience**:
1. **Critical Errors Found**: Shows error dialog with list of issues, prevents export
2. **Warnings Found**: Shows warning dialog with first 10 issues, allows user to "Export Anyway" or "Cancel"
3. **No Issues**: Export proceeds immediately

---

### 3. ✅ Refined Error Categorization

**Implementation**: The validation system now properly categorizes errors:

**Critical Errors** (severity: 'critical'):
- Missing required fields (MobType, Material, Skills array)
- Invalid YAML structure
- Syntax errors that prevent parsing

**Warnings** (severity: 'warning'):
- Missing cross-references (skill/mob/item not found)
- Invalid entity types (may be from mods)
- Invalid color codes
- Invalid numeric values (negative health, etc.)

**Informational** (severity: 'info'):
- Color code suggestions
- Best practice recommendations
- Unused entities (not shown as critical)

**Files Using This System**:
- `components/packImporter/DataValidator.js` (existing validation logic)
- `components/packManager.js` (new export validation)

---

## Remaining Tasks (Not Yet Implemented)

### 4. ⏳ File-Level Selection Checkboxes

**Goal**: Allow users to select/deselect individual YAML files during import

**Planned Implementation**:
- Add checkboxes to each file in the import preview
- Modify `ImportPreviewUI.renderFolderTree()` to include file checkboxes
- Track selected files in `ImportPreviewUI.selectedFiles` Set
- Filter files during import based on selection

### 5. ⏳ Section-Level Selection Within YAML Files

**Goal**: Allow users to select/deselect individual mobs/skills/items within a YAML file

**Planned Implementation**:
- Make files expandable in preview to show individual entries
- Add checkboxes for each entry (mob, skill, item, etc.)
- Track selections at entry level
- Import only selected entries from each file

### 6. ⏳ Inline Error Editor

**Goal**: Allow users to edit and fix errors directly in the import preview

**Planned Implementation**:
- Add "Edit" button next to errors in issue list
- Show modal with YAML editor for the problematic entry
- Allow users to fix YAML and re-validate
- Update preview with corrected data

---

## Technical Details

### New Folder Type: 'single-folder'

The import system now supports three folder types:

1. **'single-pack'**: Folder containing Mobs/, Skills/, Items/ subfolders
2. **'packs-folder'**: Folder containing multiple pack subfolders
3. **'single-folder'** (NEW): A single MythicMobs folder (e.g., just "Skills")

### Validation Architecture

```
Export Flow:
1. User clicks "Export Pack"
2. validatePackForExport(pack) runs
3. Collects all defined entities (skills, mobs, items, droptables)
4. Validates each entity type:
   - Check required fields
   - Check YAML structure
   - Check cross-references
5. Categorize issues as critical vs warnings
6. Show dialog:
   - Critical errors → Block export
   - Warnings → Allow with confirmation
   - No issues → Proceed
7. Export pack to ZIP
```

### Error Severity Levels

| Severity | Description | User Action |
|----------|-------------|-------------|
| `critical` | Prevents MythicMobs from loading | Must fix before export |
| `warning` | May cause runtime issues | Can export with warning |
| `info` | Suggestions and best practices | No action needed |

---

## Testing Recommendations

### Test Case 1: Single Folder Import
1. Create a folder with only YAML files (no subfolders)
2. Name it "Skills"
3. Import the folder
4. Verify: Import preview shows "Imported Skills" pack
5. Verify: Only Skills folder is populated

### Test Case 2: Export with Critical Errors
1. Create mob without MobType or Template
2. Try to export pack
3. Verify: Error dialog appears listing issues
4. Verify: Export is blocked

### Test Case 3: Export with Warnings
1. Create mob referencing non-existent skill
2. Try to export pack
3. Verify: Warning dialog appears
4. Verify: Can choose "Export Anyway" or "Cancel"

---

## Future Enhancements

1. **Bulk Error Fixing**: Add "Fix All" button for common issues
2. **Auto-Fix Suggestions**: Automatically suggest fixes for known patterns
3. **Export Validation Report**: Generate detailed HTML/PDF report of validation results
4. **Import Merge Conflicts**: Handle conflicts when importing entities with same names
5. **Selective Export**: Allow exporting only selected files/entities
6. **Export Templates**: Save export configurations for reuse

---

## Change Log

### 2024 - Version 1.1
- ✅ Added single folder import support
- ✅ Added export validation with critical error blocking
- ✅ Refined error categorization system
- ⏳ File-level selection (planned)
- ⏳ Section-level selection (planned)
- ⏳ Inline error editor (planned)

---

## Notes for Developers

- All validation logic is centralized in `DataValidator.js`
- Export validation reuses similar patterns but is simpler (no cross-pack references)
- The `'single-folder'` type is handled consistently in both File System Access API and fallback modes
- Error messages are user-friendly and include suggestions for fixes
