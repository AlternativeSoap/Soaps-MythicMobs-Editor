# Changelog

All notable changes to the Soaps MythicMobs Editor will be documented in this file.

## [Unreleased] - 2025-12-12

### Fixed

#### Database & Authentication
- **Fixed template deletion with Supabase RLS** (Security Definer Function approach)
  - Created `delete_template()` PostgreSQL function to bypass RLS issues
  - Function validates authentication and ownership before deletion
  - Disabled RLS on templates table (security handled by function)
  - Template deletion now works reliably from JavaScript client
  - Added proper error handling with JSON responses

#### User Interface
- **Fixed Minecraft item icons** (100+ icon mappings corrected)
  - Fixed spawn egg icons (all 70+ variants now use generic spawn_egg.png for 1.21+)
  - Fixed copper block variants (exposed, weathered, oxidized, waxed)
  - Fixed shulker box icons (all 17 color variants)
  - Fixed coral fan icons (tube, brain, bubble, fire, horn + dead variants)
  - Fixed player and mob heads (skeleton, wither, zombie, creeper, piglin, dragon)
  - Fixed azalea, moss_carpet, chorus_plant, chorus_flower, torchflower
  - Fixed shield icon rendering
  - Moved 50+ items from itemTextureMap to blockTextureItems for correct CDN path

- **Fixed search bar placeholder text overlap**
  - Added `padding-left: 2.5rem` to `.searchable-dropdown-search` input
  - Search icon no longer overlaps with placeholder text

- **Styled delete confirmation modal** to match site design
  - Using custom `notificationModal` component instead of browser confirm()
  - Consistent styling with rest of application
  - Better UX with modal overlay and animations

### Changed

#### Database Migrations
- Created 13 migration files to debug and fix RLS policies
  - Identified root cause: `auth.uid()` returns NULL in REST API context
  - Tested JWT claims approach with `auth.jwt() ->> 'sub'`
  - Final solution: SECURITY DEFINER function with explicit ownership checks
  - All migration files preserved in `/database_migrations` for reference

#### Code Quality
- Added comprehensive logging to `templateManager.deleteTemplate()`
  - Session validation checks
  - User ID verification
  - Access token presence confirmation
- Simplified deletion logic using database function (`.rpc('delete_template')`)
- Removed 46 lines of legacy `<select>` dropdown code from mobDropsEditor

## [Unreleased] - 2025-12-11

### Fixed

#### Skill Templates - Critical Bug Fixes
- **Fixed non-existent `fallingblock` mechanic** (3 templates affected)
  - `mob_meteor_strike`: Replaced with `shoot{type=FIREBALL}` mechanic
  - `skill_meteor_shower`: Now uses `shoot` with `@Ring` targeter pattern
  - `skill_meteor_rain`: Replaced with valid `shoot` mechanic and proper targeters
  
- **Fixed non-existent `@RandomLocation` targeter** (3 templates affected)
  - Replaced with valid `@Ring{radius=...;points=...}` for pattern-based targeting
  - Replaced with `@RandomLocationsNearCaster{r=...;a=...}` for scatter patterns
  
- **Fixed invalid `blockwave` attributes** (4 templates affected)
  - Removed invalid attributes: `rs=`, `rd=`, `ifo=` (do not exist in MythicMobs)
  - Now using only valid attributes: `m=`, `r=`, `d=`, `v=`
  - Fixed templates: `util_prison`, `skill_flame_burst`, `skill_ice_prison`, `skill_earthquake`

- **Simplified `skill_dragon_breath` template**
  - Removed inline `projectile{onTick=...}` mechanics (requires separate metaskills)
  - Replaced with simple cone attack using `@EntitiesInCone` and `@Cone` targeters
  - Now a usable standalone example without external dependencies

- **Fixed "View All Lines" button** in Template Selector
  - Added `e.preventDefault()` to prevent default button behavior
  - Button now properly displays full template preview modal

### Changed

#### Template Improvements
- All skill templates now use only valid MythicMobs mechanics verified against official documentation
- Improved template descriptions for clarity
- Simplified complex examples to be more user-friendly

### Technical Details
- Total templates: 177 (95 mob context + 82 skill context)
- All mechanics validated against `data/mechanics.js`
- All targeters validated against `data/targeters.js`
- No syntax errors or breaking changes

---

## Previous Updates

### Template Library Expansion - 2025-12-10

#### Added
- **29 new mob templates** (66 → 95 templates)
  - Combat: 33 templates (basic attacks, combos, special moves)
  - Effects: 15 templates (particles, sounds, visuals)
  - Summons: 12 templates (minions, reinforcements)
  - Projectiles: 13 templates (arrows, missiles, beams)
  - Utility: 22 templates (teleport, buffs, special mechanics)

- **26+ new skill templates** (57 → 82+ templates)
  - Damage: 16 templates (combos, AoE, DoT)
  - Healing: 13 templates (single target, AoE, HoT)
  - Movement: 12 templates (teleports, dashes, pulls)
  - Buffs: 13 templates (speed, strength, team buffs)
  - Debuffs: 11 templates (slows, poisons, curses)
  - Utility: 18+ templates (complete skills, examples)

- **8 complete skill examples** with full mechanics:
  - ⚡ Thunder Strike - Lightning with damage and effects
  - 🔥 Flame Burst - AoE fire with lingering flames
  - ✨ Holy Nova - Damage enemies, heal allies
  - 🧊 Ice Prison - Trap and damage
  - 👻 Shadow Step - Teleport behind with stealth
  - 🐉 Dragon Breath - Cone of fire damage
  - 🌋 Earthquake - Ground slam with waves
  - ☄️ Meteor Rain - Multiple falling meteors

#### Fixed
- Restored corrupted `skillTemplates.js` file from git
- Added missing `hasTrigger()` helper method
- Fixed template selector defaulting to empty favorites tab
- Improved trigger detection for mob vs skill context filtering

---

*For detailed documentation, see the `/docs` folder.*
