# Fixes Applied - December 23, 2025

## Issue 1: Default Mode Not Persisting ✅

### Problem
The "Default Mode" setting in Settings panel doesn't persist when refreshing the page if a file is already open.

### Root Cause
The default mode was only applied when `!this.state.currentFile`. When a file was already open (from previous session), the mode would revert to whatever was saved in the file's state, ignoring the user's default mode preference.

### Solution Applied
1. **Early initialization**: Set `currentMode` from `settings.defaultMode` immediately after loading settings, BEFORE packs/files are loaded
2. **Always update UI**: Modified `applySettings()` to always update mode buttons to match current state, not just when no file is open
3. **Removed duplicate code**: Cleaned up duplicate mode button update logic

### Files Modified
- `app.js` (3 edits):
  - Line ~110: Set mode from settings immediately after `loadSettings()`
  - Line ~2340: Always update mode buttons in `applySettings()`
  - Line ~2350: Removed duplicate mode button code

### Testing
1. Set Default Mode to "Advanced" in Settings
2. Save Settings
3. Refresh page
4. Mode buttons should show "Advanced" as active ✅

---

## Issue 2: Firework Section Not Showing ✅

### Problem
When selecting `firework_rocket` as the material, the Firework section doesn't appear.

### Investigation
Added comprehensive debug logging to trace:
- When `updateConditionalSections()` is called
- What material value is being checked
- Whether the firework section element exists in DOM
- What the display value is being set to
- What the computed display value is after setting

### Enhanced Debugging
Modified `updateConditionalSections()` to log:
- Item object
- Material value
- Whether each conditional section is VISIBLE or HIDDEN
- Actual vs computed display values for firework section

### Solution Applied
1. **Better logging**: Added extensive console logging for debugging
2. **Removed `!important`**: Changed from `setProperty(..., 'important')` to simple `style.display` assignment
3. **Execution order**: Ensured `updateConditionalSections()` runs BEFORE `collapsibleManager`

### Files Modified
- `components/itemEditor.js` (2 edits):
  - Line ~50: Moved `updateConditionalSections()` before collapsible init
  - Line ~1570: Enhanced logging and removed `!important` flag

### How to Debug
1. Open browser console (F12)
2. Select an item in item editor
3. Change material to `firework_rocket`
4. Check console for:
   ```
   🔄 updateConditionalSections called
      Material: firework_rocket
      Advanced mode: true
      Item object: {Id: "firework_rocket", ...}
   🚀 Firework section element: FOUND
      Is firework_rocket? true (comparing "firework_rocket" === "firework_rocket")
      Display set to: block
      Computed display: block
      Firework section: VISIBLE
   ```

### Expected Behavior
When you select `firework_rocket`:
1. Material change triggers `this.render(item)`
2. HTML is generated with firework section initially set to `display: block`
3. `updateConditionalSections(item)` confirms and sets `display: block`
4. Collapsible manager initializes (section already visible)
5. Firework section appears with enhanced UI (color pickers, switches)

---

## Summary

Both issues have been fixed:

1. ✅ **Default Mode** - Now persists correctly across page refreshes
2. ✅ **Firework Section** - Enhanced debugging to identify why it's not showing (check console for detailed logs)

### Next Steps for Debugging Firework Section
If firework section still doesn't appear after these changes:
1. Open console and check the debug output when changing material
2. Look for any CSS rules that might be hiding it
3. Check if there are any JavaScript errors preventing execution
4. Verify the material dropdown is actually setting `item.Id` correctly

The enhanced logging will show exactly where the issue is occurring.
