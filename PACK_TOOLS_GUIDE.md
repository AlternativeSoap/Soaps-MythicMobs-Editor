# Pack Tools User Guide

## Quick Reference

### Accessing Tools
Click the **🔧 Wrench icon** in the top-right header to open the tools dropdown menu.

---

## 📊 Pack Statistics

**Purpose**: Get comprehensive analytics about your pack

### What It Shows:
- **Overview**: Count of all elements (mobs, skills, items, etc.)
- **Complexity Metrics**: 
  - Average skills per mob
  - Average mechanics per skill
  - Most complex mob/skill identification
- **File Sizes**: Size breakdown by category
- **Health Status**: Overall pack health with warnings
- **Distribution**: Visual chart of content distribution

### When to Use:
- Before sharing/publishing your pack
- After major changes to see impact
- To identify optimization opportunities
- To understand pack structure at a glance

### Export:
Exports comprehensive JSON statistics report.

---

## 🔍 Duplicate Detector

**Purpose**: Find duplicate and similar content

### Detection Types:
1. **Exact Duplicates**: Identical entries (rare)
2. **Similar Content**: ≥90% similarity using advanced algorithm
3. **Case Conflicts**: Names differing only in capitalization

### Tabbed Interface:
- Each type has its own tab
- Similarity percentage shown for similar content
- Empty tabs are disabled

### When to Use:
- Merging multiple packs
- After copy-pasting content
- Cleaning up old/test content
- Before finalizing your pack

### Export:
Exports JSON report with all detected duplicates.

---

## ✅ Pack Validator

**Purpose**: Find and auto-fix errors in your pack

### Validation Checks:
- **References**: Ensures all skill/item/mob references exist
- **Syntax**: Detects empty names and malformed entries
- **Fields**: Validates health, damage, type values

### Auto-Fix Features:
- ☑️ Checkbox selection for individual fixes
- 🎯 "Fix Selected Issues" button
- 🔘 "Select All Auto-fixable" for bulk fixes

### Severity Levels:
- **Errors** 🔴: Must be fixed (red)
- **Warnings** 🟡: Should review (yellow)

### Available Fixes:
- Remove empty entries
- Set default health (20)
- Set default damage (1)
- Set default mob type (ZOMBIE)

### When to Use:
- Before testing in-game
- After manual YAML edits
- When debugging issues
- Before sharing/publishing

### Workflow:
1. Open validator → See issues
2. Check boxes for fixes → Click "Fix Selected"
3. Changes applied → Pack re-validated
4. Repeat until clean ✓

### Export:
Exports JSON validation report.

---

## 📈 Skill Usage Report

**Purpose**: Analyze which skills are actually used

### Statistics:
- **Total Skills**: All skills in pack
- **In Use**: Skills referenced by mobs/other skills
- **Unused**: Orphaned skills (not referenced anywhere)
- **Average Usage**: Mean references per skill

### Reports Include:
1. **Most Used Skills** 🔥: Top 10 with rankings
2. **Least Used Skills** ⬇️: Bottom 10 (but still used)
3. **Unused Skills** 👻: Skills with zero usage
4. **Distribution Chart**: Visual bar chart of top 5

### Usage Details:
Each skill shows:
- Number of mobs using it
- Number of skills using it
- Total usage count

### Recommendations:
- Unused skills highlighted with suggestion to remove
- Helps reduce pack size and complexity

### When to Use:
- Optimizing pack performance
- Identifying dead code
- Understanding skill dependencies
- Before removing skills

### Export:
Exports JSON usage analytics report.

---

## 💾 Backup Manager

**Purpose**: Protect your work with automatic backups

### Features:
- **Auto-Backup**: Every 30 minutes automatically ⏰
- **Manual Backup**: Create on-demand anytime
- **Smart Retention**: Keeps last 10 backups only
- **Restore**: One-click restoration with confirmation
- **Export**: Download backups as JSON or YAML

### Backup Types:
- **Auto** 🕐 (blue): Created automatically every 30 min
- **Manual** 👤 (purple): Created by you via button

### Info Banner Shows:
- Auto-backup frequency (30 minutes)
- Max backups retained (10)
- Current backup count

### Backup Details:
Each backup displays:
- Pack name
- Creation date & time  
- Type (Auto/Manual)

### Actions Per Backup:
- **Restore** 🔄: Load this backup (confirms first)
- **Export** ⬇️: Download as JSON or YAML
- **Delete** 🗑️: Remove this backup

### Storage:
- Uses browser localStorage
- ~10KB per backup
- Total ~100KB for 10 backups
- Survives browser restarts

### When to Use:
- Before major changes (create manual backup)
- Recovery from mistakes (restore older backup)
- Sharing specific version (export to file)
- Archiving milestones (export to JSON/YAML)

### Export Formats:
- **JSON**: Structured data, easy to parse
- **YAML**: Human-readable, native MM format

### Safety Features:
- Confirmation before restore
- Can't delete if it's the only backup
- Auto-backup can't be disabled (always protecting)

---

## Keyboard Shortcuts

- **Ctrl+Shift+D**: Open Dependency Graph directly
- **Click outside dropdown**: Close tools menu
- **Escape**: Close any tool modal (if implemented)

---

## Best Practices

### Before Publishing:
1. ✅ Run **Pack Validator** → Fix all errors
2. 📊 Check **Pack Statistics** → Review metrics
3. 🔍 Run **Duplicate Detector** → Remove duplicates
4. 📈 Review **Skill Usage Report** → Remove unused
5. 💾 Create **Manual Backup** → Archive final version

### During Development:
- Auto-backup runs every 30 min automatically
- Create manual backups before major changes
- Run validator periodically to catch errors early
- Check statistics to monitor pack growth

### Troubleshooting:
- **No pack loaded?** → Select a pack first
- **Auto-fix not working?** → Check if issue is fixable (look for magic icon ✨)
- **Backups not saving?** → Check browser localStorage quota
- **Similar content not detected?** → Might be <90% similar

---

## Tips & Tricks

### Pack Statistics:
- Export report to track pack growth over time
- Compare file sizes when optimizing
- Use health tips to identify issues

### Duplicate Detector:
- 90% similarity catches copy-paste variations
- Case conflicts may be intentional (MyMob vs mymob)
- Review similar content - might be templates vs instances

### Pack Validator:
- Fix errors first, then warnings
- Use "Select All Auto-fixable" for bulk cleanup
- Re-run after manual fixes to verify

### Skill Usage Report:
- Unused skills = dead weight, consider removing
- Most-used skills = critical, test thoroughly
- Least-used skills = might be specialized/niche

### Backup Manager:
- Create manual backup before risky experiments
- Use YAML export for easy reading/sharing
- Export to JSON for programmatic processing
- Auto-backup ensures you never lose >30 min work

---

## FAQ

**Q: How often should I validate my pack?**  
A: After every editing session, before testing, and definitely before publishing.

**Q: What's a good similarity threshold?**  
A: 90% is balanced. Lower finds more (false positives), higher finds less (misses some).

**Q: Can I recover if I restore the wrong backup?**  
A: Yes! Restoration is just loading data - your other backups are still there.

**Q: Do backups sync across devices?**  
A: No, backups are stored locally in browser localStorage (device-specific).

**Q: What happens when I hit 10 backups?**  
A: Oldest backup is automatically deleted when creating #11.

**Q: Can I disable auto-backup?**  
A: No, it's always active to protect your work. Doesn't affect performance.

**Q: Why can't I fix some validation errors?**  
A: Some errors (like missing skill references) require manual fixes - you need to create the skill or remove the reference.

---

**Happy pack building! 🎮✨**
