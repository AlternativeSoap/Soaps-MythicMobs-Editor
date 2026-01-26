# 🔧 MythicMobs Variable System - Complete Implementation Plan

> **Project:** Soaps MythicMobs Editor - Variable System Enhancement  
> **Version:** 1.0.0  
> **Created:** January 14, 2026  
> **Status:** ✅ Phases 1-7 Complete - ✅ Phase 8.1-8.2 Complete - Remaining: 8.3-8.5 (Optional)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Variable System Overview](#variable-system-overview)
4. [Implementation Phases](#implementation-phases)
5. [Data Layer Specifications](#data-layer-specifications)
6. [Component Specifications](#component-specifications)
7. [UI/UX Design](#uiux-design)
8. [Meta Keywords Reference](#meta-keywords-reference)
9. [Real-World Usage Patterns](#real-world-usage-patterns)
10. [Enhancement Ideas](#enhancement-ideas)
11. [Progress Tracking](#progress-tracking)
12. [Technical Notes](#technical-notes)

---

## Executive Summary

The Variable System is one of MythicMobs' most powerful but complex features. This implementation plan outlines a comprehensive approach to make variables **accessible, intuitive, and trackable** within Soaps MythicMobs Editor.

### Key Goals
- ✅ Make variable creation **wizard-guided** and **type-aware**
- ✅ Enable **variable tracking** across packs (skills, mobs, droptables)
- ✅ Provide **smart autocomplete** for variable placeholders
- ✅ Support **Mob Variables** section with full UI
- ✅ Include complete **Meta Keywords** documentation and helpers
- ✅ Export proper **YAML** for all variable-related content

---

## Current State Analysis

### ✅ Already Implemented (Basic)

| Feature | File | Status |
|---------|------|--------|
| `setVariable` mechanic | `data/mechanics.js` | ⚠️ Incomplete attributes |
| `variableAdd` mechanic | `data/mechanics.js` | ⚠️ Incomplete attributes |
| `variableSubtract` mechanic | `data/mechanics.js` | ⚠️ Incomplete attributes |
| `variableMath` mechanic | `data/mechanics.js` | ⚠️ Incomplete attributes |
| `setVariableLocation` mechanic | `data/mechanics.js` | ⚠️ Incomplete attributes |
| `variableUnset` mechanic | `data/mechanics.js` | ⚠️ Incomplete attributes |
| `variableMove` mechanic | `data/mechanics.js` | ✅ Complete |
| `variableSkill` mechanic | `data/mechanics.js` | ⚠️ Incomplete attributes |
| `variableEquals` condition | `data/conditions/metaConditionsFinal.js` | ✅ Complete |
| `variableIsSet` condition | `data/conditions/metaConditionsFinal.js` | ✅ Complete |
| `variableInRange` condition | `data/conditions/metaConditionsFinal.js` | ✅ Complete |
| `variableContains` condition | `data/conditions/metaConditionsFinal.js` | ✅ Complete |
| `@VariableLocation` targeter | `data/targeters.js` | ✅ Complete |
| Basic variable placeholders | `data/placeholders.js` | ⚠️ Missing meta keywords |
| Mob `variables` property | `components/mobEditor.js` | ❌ No UI |

### ❌ Missing Components

| Feature | Priority | Description |
|---------|----------|-------------|
| Variable Builder UI | 🔴 High | Wizard for creating variables |
| Variable Browser | 🔴 High | Browse/pick existing pack variables |
| Variable Manager | 🔴 High | Track all variables across pack |
| Mob Variables Editor | 🔴 High | UI for mob-level variables |
| Meta Keywords Reference | 🟡 Medium | Complete documentation for all 100+ keywords |
| Variable YAML Export | 🔴 High | Export Variables section for mobs |
| itemvariable Drop Type | 🟡 Medium | Full implementation in drops |
| Variable Autocomplete | 🟡 Medium | Suggest variables in placeholders |
| Variable Usage Report | 🟢 Low | Show where variables are used |

---

## Variable System Overview

### Variable Types (13 Total)

| Type | Description | Use Case |
|------|-------------|----------|
| `INTEGER` | Whole numbers | Counters, damage values, stacks |
| `FLOAT` | Decimal numbers | Health percentages, multipliers |
| `LONG` | Large whole numbers | Timestamps, large counters |
| `DOUBLE` | Large decimal numbers | Precise calculations |
| `STRING` | Text values | Names, phases, states |
| `BOOLEAN` | true/false | Flags, toggles |
| `SET` | Unique unordered values | Tags, unique IDs |
| `LIST` | Ordered values | Queues, sequences |
| `MAP` | Key-value pairs | Configuration, lookup tables |
| `LOCATION` | World coordinates | Spawn points, saved positions |
| `VECTOR` | 3D direction/magnitude | Movement, forces |
| `TIME` | Epoch timestamps | Cooldowns, timers |
| `METASKILL` | Inline skill definition | Dynamic skills |
| `ITEM` | ItemStack data | Stored items, equipment |

### Variable Scopes (5 Total)

| Scope | Persistence | Description | Example Use |
|-------|-------------|-------------|-------------|
| `SKILL` | Temporary | Current skill tree only | Temp calculations, loop counters |
| `CASTER` | Mob lifetime | On the casting mob | Boss phases, damage tracking |
| `TARGET` | Target lifetime | On the target entity | Debuff stacks, marks |
| `WORLD` | Until restart | Per-world storage | World events, day counters |
| `GLOBAL` | Until restart | Server-wide | Server kills, global events |

### Variable Syntax

```yaml
# Setting a variable
- setvariable{var=caster.damage_counter;value=0;type=INTEGER;save=false;duration=0}

# Shorthand scope prefix
- setvariable{var=caster.damage_counter;value=0}
# Is equivalent to:
- setvariable{var=damage_counter;scope=caster;value=0}

# Reading a variable (placeholder)
<caster.var.damage_counter>

# With fallback
<caster.var.damage_counter|0>

# With meta keywords
<caster.var.damage_counter.add.5>
```

---

## Implementation Phases

### Phase 1: Data Layer Enhancements 📊
**Priority:** 🔴 Critical | **Estimated Time:** 2-3 hours

- [x] **1.1** Create `data/variableData.js` - Complete variable definitions ✅
- [x] **1.2** Update `data/mechanics.js` - Add missing attributes to variable mechanics ✅
- [x] **1.3** Update `data/placeholders.js` - Add complete meta keywords reference ✅
- [x] **1.4** Update `data/dropTypes.js` - Complete itemvariable drop type ✅

### Phase 2: Variable Manager Component 🗂️
**Priority:** 🔴 Critical | **Estimated Time:** 3-4 hours

- [x] **2.1** Create `components/variableManager.js` - Global variable tracking ✅
- [x] **2.2** Implement pack scanning for variable detection ✅
- [x] **2.3** Create variable registry with usage tracking ✅
- [x] **2.4** Add variable suggestion/autocomplete API ✅

### Phase 3: Variable Browser Component 🔍
**Priority:** 🔴 Critical | **Estimated Time:** 4-5 hours

- [x] **3.1** Create `components/variableBrowser.js` - Visual picker modal ✅
- [x] **3.2** Add scope filtering (SKILL, CASTER, TARGET, WORLD, GLOBAL) ✅
- [x] **3.3** Add type filtering and icons ✅
- [x] **3.4** Implement favorites and recent variables ✅
- [x] **3.5** Add quick-insert for placeholders ✅
- [x] **3.6** Create `styles/variableBrowser.css` ✅

### Phase 4: Variable Builder Component 🔧
**Priority:** 🔴 Critical | **Estimated Time:** 5-6 hours

- [x] **4.1** Create `components/variableBuilder.js` - Creation wizard ✅
- [x] **4.2** Implement type selector with visual previews ✅
- [x] **4.3** Implement scope selector with explanations ✅
- [x] **4.4** Create type-specific value builders: ✅
  - [x] 4.4.1 Number types (INTEGER, FLOAT, LONG, DOUBLE) ✅
  - [x] 4.4.2 STRING with color preview ✅
  - [x] 4.4.3 BOOLEAN toggle ✅
  - [x] 4.4.4 SET/LIST editors ✅
  - [x] 4.4.5 MAP key-value editor ✅
  - [x] 4.4.6 LOCATION coordinate picker ✅
  - [x] 4.4.7 VECTOR component editor ✅
  - [x] 4.4.8 TIME with epoch helpers ✅
  - [x] 4.4.9 METASKILL inline editor ✅
  - [x] 4.4.10 ITEM with item selector ✅
- [x] **4.5** Add duration and save toggles ✅
- [x] **4.6** Implement live YAML preview ✅
- [ ] **4.7** Integrate with SkillLineBuilder

### Phase 5: Mob Variables Editor 👹
**Priority:** 🔴 Critical | **Estimated Time:** 3-4 hours

- [x] **5.1** Create `components/mobVariablesEditor.js` ✅
- [x] **5.2** Add collapsible card to mobEditor ✅
- [x] **5.3** Implement add/edit/remove variable UI ✅
- [x] **5.4** Support type prefixes (int/, float/, string/) ✅
- [x] **5.5** Update `utils/yamlExporter.js` for Variables section ✅

### Phase 6: Integration Points 🔗 ✅ COMPLETE
**Priority:** 🟡 High | **Estimated Time:** 4-5 hours

- [x] **6.1** Update `components/skillEditor.js` - Variable awareness ✅
- [x] **6.2** Update `components/skillLineBuilder.js` - Variable Browser button ✅
- [x] **6.3** Update `components/mobDropsEditor.js` - itemvariable Variable Browser ✅
- [x] **6.4** Add Variable Browser button to SkillLineBuilder quick tools ✅
- [x] **6.5** Implement variable placeholder autocomplete ✅

### Phase 7: Meta Keywords Documentation 📚 ✅ COMPLETE
**Priority:** 🟡 High | **Estimated Time:** 2-3 hours

- [x] **7.1** Create comprehensive meta keywords in placeholders.js ✅ (Already complete)
- [x] **7.2** Add meta keyword picker to Variable Browser ✅
- [x] **7.3** Implement keyword chaining preview ✅
- [x] **7.4** Add contextual help for each keyword ✅ (via tooltips and descriptions)

### Phase 8: Polish & Testing ✨
**Priority:** 🟢 Normal | **Estimated Time:** 2-3 hours

- [x] **8.1** Add validation for variable names ✅ (Already in variableBuilder.js)
- [x] **8.2** Implement variable usage report ✅ (Via variableManager.getUsages() and Variable Browser preview)
- [ ] **8.3** Add import/export for variable definitions
- [ ] **8.4** Cross-browser testing
- [ ] **8.5** Performance optimization for large packs

---

## Data Layer Specifications

### `data/variableData.js`

```javascript
/**
 * MythicMobs Variable System Data
 * Complete definitions for variable types, scopes, and operations
 */

const VARIABLE_TYPES = [
    {
        id: 'INTEGER',
        name: 'Integer',
        icon: 'fa-hashtag',
        color: '#3b82f6',
        description: 'A whole number with no decimal places',
        examples: ['0', '42', '-100', '<random.1to10>'],
        defaultValue: '0',
        inputType: 'number',
        inputStep: 1,
        supportsMath: true,
        metaKeywords: ['add', 'sub', 'mul', 'div', 'abs']
    },
    {
        id: 'FLOAT',
        name: 'Float',
        icon: 'fa-percentage',
        color: '#8b5cf6',
        description: 'A decimal number for precise values',
        examples: ['0.5', '1.75', '<caster.hp>'],
        defaultValue: '0.0',
        inputType: 'number',
        inputStep: 0.1,
        supportsMath: true,
        metaKeywords: ['add', 'sub', 'mul', 'div', 'abs', 'round', 'precision']
    },
    // ... all 13 types
];

const VARIABLE_SCOPES = [
    {
        id: 'SKILL',
        name: 'Skill',
        icon: 'fa-bolt',
        color: '#f59e0b',
        description: 'Temporary - exists only during current skill tree execution',
        persistent: false,
        supportsExpiry: false,
        supportsSave: false,
        examples: [
            'Temporary calculations',
            'Loop counters',
            'Skill parameters'
        ]
    },
    {
        id: 'CASTER',
        name: 'Caster',
        icon: 'fa-skull',
        color: '#ef4444',
        description: 'Stored on the casting mob until death or despawn',
        persistent: true,
        supportsExpiry: true,
        supportsSave: true,
        examples: [
            'Boss phase tracking',
            'Damage counters',
            'Rage/combo stacks'
        ]
    },
    // ... all 5 scopes
];

const VARIABLE_OPERATIONS = {
    setVariable: {
        description: 'Create or update a variable',
        attributes: [
            { name: 'var', required: true, description: 'Variable name (scope.name format)' },
            { name: 'value', required: true, description: 'Value to set' },
            { name: 'type', required: false, default: 'INTEGER', description: 'Variable type' },
            { name: 'scope', required: false, description: 'Variable scope (if not in var)' },
            { name: 'save', required: false, default: false, description: 'Persist across restarts' },
            { name: 'duration', required: false, default: 0, description: 'Expiry time in ticks (0=infinite)' }
        ]
    },
    // ... all operations
};

window.VARIABLE_TYPES = VARIABLE_TYPES;
window.VARIABLE_SCOPES = VARIABLE_SCOPES;
window.VARIABLE_OPERATIONS = VARIABLE_OPERATIONS;
```

---

## Component Specifications

### VariableManager (Singleton)

```javascript
class VariableManager {
    constructor() {
        this.variables = new Map(); // scope.name -> VariableDefinition
        this.usages = new Map();    // variable -> [locations]
        this.packContext = null;
    }
    
    // Scan entire pack for variable definitions and usages
    scanPack(pack) { }
    
    // Extract variables from a skill's lines
    extractFromSkill(skill) { }
    
    // Extract variables from mob config
    extractFromMob(mob) { }
    
    // Get all variables by scope
    getByScope(scope) { }
    
    // Get all variables by type
    getByType(type) { }
    
    // Get usage locations for a variable
    getUsages(variableName) { }
    
    // Suggest variables for autocomplete
    suggest(prefix, scope) { }
    
    // Check if variable exists
    exists(scope, name) { }
}
```

### VariableBrowser

```javascript
class VariableBrowser {
    constructor(variableManager) { }
    
    // Open browser modal
    open(options = {}) { }
    
    // Filter by scope
    filterByScope(scope) { }
    
    // Filter by type
    filterByType(type) { }
    
    // Handle variable selection
    onSelect(callback) { }
    
    // Insert placeholder at cursor
    insertPlaceholder(variable) { }
    
    // Insert setVariable mechanic
    insertMechanic(variable) { }
}
```

### VariableBuilder

```javascript
class VariableBuilder {
    constructor() { }
    
    // Open builder wizard
    open(options = {}) { }
    
    // Set initial values
    setDefaults(variable) { }
    
    // Update preview
    updatePreview() { }
    
    // Build the skill line
    buildSkillLine() { }
    
    // Get variable definition object
    getDefinition() { }
}
```

---

## UI/UX Design

### Variable Builder Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔧 Variable Builder                                          [X]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Variable Name: [combo_counter________________]                     │
│  ⚠️ No spaces or special characters                                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ SCOPE (Where does this variable live?)                        │ │
│  │                                                                │ │
│  │  [⚡ SKILL]  [💀 CASTER]  [🎯 TARGET]  [🌍 WORLD]  [🌐 GLOBAL] │ │
│  │   └─ Temporary, current skill only                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ TYPE (What kind of data?)                                     │ │
│  │                                                                │ │
│  │  [# INTEGER]  [% FLOAT]  [📝 STRING]  [✓ BOOLEAN]            │ │
│  │  [📋 LIST]  [🗂️ SET]  [🗺️ MAP]  [📍 LOCATION]                │ │
│  │  [➡️ VECTOR]  [⏰ TIME]  [⚔️ METASKILL]  [📦 ITEM]            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ VALUE                                                         │ │
│  │ [0_____________________________]  [+ Use Placeholder]         │ │
│  │                                                                │ │
│  │ 💡 Tip: Use <random.1to10> for random values                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─── Advanced Options (CASTER scope)────────────────────────────┐ │
│  │ ☐ Save across restarts                                        │ │
│  │ Duration: [0______] ticks (0 = never expires)                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ═══════════════════ Live Preview ═══════════════════════════════  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ - setvariable{var=caster.combo_counter;type=INTEGER;value=0}  │ │
│  │   @self                                                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  [Cancel]                            [Copy] [Add to Queue] [Insert] │
└─────────────────────────────────────────────────────────────────────┘
```

### Variable Browser Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Variable Browser                                          [X]   │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search variables..._______________]  [+ New Variable]          │
│                                                                     │
│ SCOPE: [All] [⚡SKILL] [💀CASTER] [🎯TARGET] [🌍WORLD] [🌐GLOBAL]   │
│ TYPE:  [All] [#INT] [%FLOAT] [📝STR] [✓BOOL] [📋LIST] [🗺️MAP]...   │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ 💀 CASTER Variables (12)                                      │  │
│ │ ├─ #  combo_counter (INTEGER) ─ Value: 0                      │  │
│ │ │   └─ Used in: ARACHNA_ON_ATTACK, ARACHNA_COMBO_FINISHER    │  │
│ │ ├─ #  rage_stacks (INTEGER) ─ Value: 0                        │  │
│ │ │   └─ Used in: ARACHNA_RAGE_BURST, ARACHNA_ON_DAMAGED       │  │
│ │ ├─ #  damage_taken (INTEGER) ─ Value: 0                       │  │
│ │ ├─ %  health_percentage (FLOAT) ─ Calculated                  │  │
│ │ ├─ 📝 phase (STRING) ─ Value: "idle"                          │  │
│ │ └─ #  shadowstrike_dmg (INTEGER) ─ Value: 15                  │  │
│ │                                                                │  │
│ │ 🎯 TARGET Variables (3)                                       │  │
│ │ ├─ 📝 CR_TEMP_EXCLUDE (STRING) ─ Temp flag                    │  │
│ │ ├─ #  debuff_stacks (INTEGER)                                 │  │
│ │ └─ ✓  marked (BOOLEAN)                                        │  │
│ │                                                                │  │
│ │ 🌐 GLOBAL Variables (1)                                       │  │
│ │ └─ #  server_boss_kills (LONG)                                │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ Selected: <caster.var.combo_counter>                               │
├─────────────────────────────────────────────────────────────────────┤
│ [Insert Placeholder] [Insert setVariable] [Insert Condition] [X]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Mob Variables Editor Card

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Variables (4)                                             [▼]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Variables are set automatically when this mob spawns.               │
│                                                                     │
│ ┌─────────────────┬──────────┬─────────────────┬─────────────────┐ │
│ │ Name            │ Type     │ Initial Value   │ Actions         │ │
│ ├─────────────────┼──────────┼─────────────────┼─────────────────┤ │
│ │ phase           │ STRING   │ idle            │ [✎ Edit] [🗑]   │ │
│ │ combo_counter   │ INTEGER  │ 0               │ [✎ Edit] [🗑]   │ │
│ │ health_mult     │ FLOAT    │ 1.5             │ [✎ Edit] [🗑]   │ │
│ │ spawn_time      │ LONG     │ <utils.epoch>   │ [✎ Edit] [🗑]   │ │
│ └─────────────────┴──────────┴─────────────────┴─────────────────┘ │
│                                                                     │
│ [+ Add Variable]                                                    │
│                                                                     │
│ 📋 YAML Preview:                                                    │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ Variables:                                                     │  │
│ │   phase: idle                                                  │  │
│ │   combo_counter: int/0                                         │  │
│ │   health_mult: float/1.5                                       │  │
│ │   spawn_time: long/<utils.epoch>                               │  │
│ └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Meta Keywords Reference

### Universal Meta Keywords
*Apply to ALL variable types*

| Keyword | Output Type | Description | Example |
|---------|-------------|-------------|---------|
| `.cache` | Same | Cache result for subsequent parses | `<caster.var.value.cache>` |
| `.formatted` | STRING | Human-readable format | `<skill.var.time.formatted>` |
| `.toInteger` | INTEGER | Convert to Integer | `<skill.var.text.toInteger>` |
| `.toFloat` | FLOAT | Convert to Float | `<skill.var.num.toFloat>` |
| `.toLong` | LONG | Convert to Long | `<skill.var.num.toLong>` |
| `.toDouble` | DOUBLE | Convert to Double | `<skill.var.num.toDouble>` |
| `.toBoolean` | BOOLEAN | Convert to Boolean | `<skill.var.text.toBoolean>` |
| `.toString` | STRING | Convert to String | `<skill.var.num.toString>` |
| `.toLocation` | LOCATION | Convert to Location | `<skill.var.text.toLocation>` |
| `.toVector` | VECTOR | Convert to Vector | `<skill.var.text.toVector>` |
| `.toList` | LIST | Convert to List | `<skill.var.text.toList>` |
| `.toSet` | SET | Convert to Set | `<skill.var.list.toSet>` |
| `.toMap` | MAP | Convert to Map | `<skill.var.text.toMap>` |
| `.toTime` | TIME | Convert to Time | `<skill.var.num.toTime>` |

### Integer Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.add.{n}` | INTEGER | Add value | `<skill.var.count.add.5>` |
| `.sub.{n}` | INTEGER | Subtract value | `<skill.var.count.sub.1>` |
| `.mul.{n}` | INTEGER | Multiply value | `<skill.var.count.mul.2>` |
| `.div.{n}` | INTEGER | Divide value | `<skill.var.count.div.2>` |
| `.abs` | INTEGER | Absolute value | `<skill.var.count.abs>` |

### Float Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.add.{n}` | FLOAT | Add value | `<skill.var.hp.add.0.5>` |
| `.sub.{n}` | FLOAT | Subtract value | `<skill.var.hp.sub.0.1>` |
| `.mul.{n}` | FLOAT | Multiply value | `<skill.var.hp.mul.1.5>` |
| `.div.{n}` | FLOAT | Divide value | `<skill.var.hp.div.2>` |
| `.abs` | FLOAT | Absolute value | `<skill.var.hp.abs>` |
| `.round` | INTEGER | Round to integer | `<skill.var.hp.round>` |
| `.precision.{n}` | FLOAT | Set decimal precision | `<skill.var.hp.precision.2>` |

### Long Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.add.{n}` | LONG | Add value | `<skill.var.epoch.add.1000>` |
| `.sub.{n}` | LONG | Subtract value | `<skill.var.epoch.sub.500>` |
| `.mul.{n}` | LONG | Multiply value | `<skill.var.epoch.mul.2>` |
| `.div.{n}` | LONG | Divide value | `<skill.var.epoch.div.2>` |
| `.abs` | LONG | Absolute value | `<skill.var.epoch.abs>` |

### Double Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.add.{n}` | DOUBLE | Add value | `<skill.var.precise.add.0.001>` |
| `.sub.{n}` | DOUBLE | Subtract value | `<skill.var.precise.sub.0.001>` |
| `.mul.{n}` | DOUBLE | Multiply value | `<skill.var.precise.mul.1.5>` |
| `.div.{n}` | DOUBLE | Divide value | `<skill.var.precise.div.2>` |
| `.abs` | DOUBLE | Absolute value | `<skill.var.precise.abs>` |
| `.round` | LONG | Round to long | `<skill.var.precise.round>` |
| `.precision.{n}` | DOUBLE | Set decimal precision | `<skill.var.precise.precision.4>` |

### Boolean Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.inverse` | BOOLEAN | Logical NOT | `<skill.var.flag.inverse>` |
| `.number` | INTEGER | 0 or 1 | `<skill.var.flag.number>` |
| `.yesno` | STRING | "yes" or "no" | `<skill.var.flag.yesno>` |
| `.union.{bool}` | BOOLEAN | Logical OR | `<skill.var.a.union.<skill.var.b>>` |
| `.intersection.{bool}` | BOOLEAN | Logical AND | `<skill.var.a.intersection.<skill.var.b>>` |
| `.difference.{bool}` | BOOLEAN | a AND NOT b | `<skill.var.a.difference.<skill.var.b>>` |

### String Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.size` | INTEGER | String length | `<skill.var.name.size>` |
| `.uppercase` | STRING | To uppercase | `<skill.var.name.uppercase>` |
| `.lowercase` | STRING | To lowercase | `<skill.var.name.lowercase>` |
| `.capitalize` | STRING | Capitalize first | `<skill.var.name.capitalize>` |
| `.trim` | STRING | Remove whitespace | `<skill.var.name.trim>` |
| `.replace.{old}.{new}` | STRING | Replace text | `<skill.var.text.replace.hello.bye>` |
| `.remove.{text}` | STRING | Remove text | `<skill.var.text.remove.bad>` |
| `.contains.{text}` | BOOLEAN | Contains check | `<skill.var.text.contains.hello>` |
| `.substring.{start}.{end}` | STRING | Extract portion | `<skill.var.text.substring.0.5>` |
| `.shift.{n}` | STRING | Remove first n chars | `<skill.var.text.shift.3>` |
| `.split.{regex}.{joiner}` | STRING | Split and rejoin | `<skill.var.csv.split.,.->` |
| `.indexof.{text}` | INTEGER | First index of | `<skill.var.text.indexof.x>` |
| `.lastindexof.{text}` | INTEGER | Last index of | `<skill.var.text.lastindexof.x>` |
| `.startswith.{text}` | BOOLEAN | Starts with | `<skill.var.name.startswith.boss_>` |
| `.endswith.{text}` | BOOLEAN | Ends with | `<skill.var.name.endswith._v2>` |
| `.append.{text}` | STRING | Add to end | `<skill.var.msg.append.!>` |
| `.prepend.{text}` | STRING | Add to start | `<skill.var.msg.prepend.Hello >` |
| `.insert.{index}.{text}` | STRING | Insert at position | `<skill.var.msg.insert.5.NEW>` |
| `.regex.{pattern}` | BOOLEAN | Regex match | `<skill.var.text.regex.[0-9]+>` |
| `.{index}` | STRING | Char at index | `<skill.var.text.0>` |

### List Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.size` | INTEGER | Number of elements | `<skill.var.items.size>` |
| `.first` | STRING | First element | `<skill.var.items.first>` |
| `.last` | STRING | Last element | `<skill.var.items.last>` |
| `.reverse` | LIST | Reversed list | `<skill.var.items.reverse>` |
| `.sort` | LIST | Alphabetical sort | `<skill.var.items.sort>` |
| `.sortnum` | LIST | Numerical sort | `<skill.var.nums.sortnum>` |
| `.shuffle` | LIST | Randomize order | `<skill.var.items.shuffle>` |
| `.get.{index}` | STRING | Element at index | `<skill.var.items.get.0>` |
| `.join.{delim}` | STRING | Join elements | `<skill.var.items.join., >` |
| `.contains.{elem}` | BOOLEAN | Contains element | `<skill.var.items.contains.sword>` |
| `.maxnumber` | DOUBLE | Max numeric value | `<skill.var.nums.maxnumber>` |
| `.minnumber` | DOUBLE | Min numeric value | `<skill.var.nums.minnumber>` |
| `.indexof.{val}` | INTEGER | First index of | `<skill.var.items.indexof.x>` |
| `.lastindexof.{val}` | INTEGER | Last index of | `<skill.var.items.lastindexof.x>` |
| `.slice.{from}.{to}` | LIST | Sublist range | `<skill.var.items.slice.2.5>` |
| `.slicefrom.{idx}` | LIST | Sublist from index | `<skill.var.items.slicefrom.3>` |
| `.sliceto.{idx}` | LIST | Sublist to index | `<skill.var.items.sliceto.5>` |
| `.append.{val}` | LIST | Add to end | `<skill.var.items.append.new>` |
| `.prepend.{val}` | LIST | Add to start | `<skill.var.items.prepend.first>` |
| `.insert.{idx}.{val}` | LIST | Insert at position | `<skill.var.items.insert.2.mid>` |
| `.remove.{idx}` | LIST | Remove at index | `<skill.var.items.remove.0>` |
| `.{index}` | STRING | Element at index | `<skill.var.items.3>` |

### Set Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.size` | INTEGER | Number of elements | `<skill.var.tags.size>` |
| `.join.{delim}` | STRING | Join elements | `<skill.var.tags.join., >` |
| `.contains.{elem}` | BOOLEAN | Contains element | `<skill.var.tags.contains.fire>` |

### Map Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.size` | INTEGER | Number of pairs | `<skill.var.config.size>` |
| `.keys` | LIST | All keys | `<skill.var.config.keys>` |
| `.values` | LIST | All values | `<skill.var.config.values>` |
| `.get.{key}` | STRING | Value by key | `<skill.var.config.get.damage>` |
| `.{key}` | STRING | Value by key | `<skill.var.config.damage>` |

### Location Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.x` | DOUBLE | X coordinate | `<skill.var.loc.x>` |
| `.y` | DOUBLE | Y coordinate | `<skill.var.loc.y>` |
| `.z` | DOUBLE | Z coordinate | `<skill.var.loc.z>` |
| `.world` | STRING | World name | `<skill.var.loc.world>` |
| `.yaw` | DOUBLE | Yaw rotation | `<skill.var.loc.yaw>` |
| `.pitch` | DOUBLE | Pitch rotation | `<skill.var.loc.pitch>` |
| `.coords` | LIST | [X, Y, Z] list | `<skill.var.loc.coords>` |

### Vector Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.x` | DOUBLE | X component | `<skill.var.dir.x>` |
| `.y` | DOUBLE | Y component | `<skill.var.dir.y>` |
| `.z` | DOUBLE | Z component | `<skill.var.dir.z>` |
| `.normalized` | VECTOR | Unit vector | `<skill.var.dir.normalized>` |
| `.length` | DOUBLE | Magnitude | `<skill.var.dir.length>` |
| `.mul.{vec}` | VECTOR | Multiply | `<skill.var.dir.mul.2,2,2>` |
| `.div.{vec}` | VECTOR | Divide | `<skill.var.dir.div.2,2,2>` |
| `.add.{vec}` | VECTOR | Add vectors | `<skill.var.dir.add.0,1,0>` |
| `.sub.{vec}` | VECTOR | Subtract vectors | `<skill.var.dir.sub.0,1,0>` |
| `.rotate.{axis}.{angle}` | VECTOR | Rotate | `<skill.var.dir.rotate.y.90>` |

### Time Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.delta.{timestamp}` | INTEGER | Time difference (ms) | `<skill.var.start.delta.<utils.epoch.timestamp>>` |
| `.formatted.{pattern}` | STRING | Formatted datetime | `<skill.var.time.formatted.Z>` |
| `.duration` | STRING | Human duration | `<skill.var.time.duration>` |

### Item Meta Keywords

| Keyword | Output | Description | Example |
|---------|--------|-------------|---------|
| `.withType.{material}` | ITEM | Change material | `<skill.var.item.withType.DIAMOND_SWORD>` |
| `.withDurability.{val}` | ITEM | Set durability | `<skill.var.item.withDurability.100>` |
| `.withMaxDurability.{val}` | ITEM | Set max durability | `<skill.var.item.withMaxDurability.500>` |
| `.withLore.{list}` | ITEM | Set lore lines | `<skill.var.item.withLore.Line1,Line2>` |
| `.withName.{name}` | ITEM | Set display name | `<skill.var.item.withName.&6Epic Sword>` |
| `.withMythicType.{type}` | ITEM | Set mythic type | `<skill.var.item.withMythicType.BanditSword>` |
| `.withEnchants.{map}` | ITEM | Set enchantments | `<skill.var.item.withEnchants.sharpness=5>` |
| `.withCustomData.{ns}.{key}.{val}` | ITEM | Set NBT data | `<skill.var.item.withCustomData.mm.type.special>` |
| `.withAmount.{val}` | ITEM | Set stack size | `<skill.var.item.withAmount.64>` |
| `.withUUID.{uuid}` | ITEM | Set UUID | `<skill.var.item.withUUID.abc-123>` |
| `.withTimestamp.{ts}` | ITEM | Set timestamp | `<skill.var.item.withTimestamp.12345>` |
| `.withCustomModelData.{val}` | ITEM | Set CMD | `<skill.var.item.withCustomModelData.100>` |
| `.withModel.{ns}.{path}` | ITEM | Set item model | `<skill.var.item.withModel.mm.sword_fire>` |
| `.type` | STRING | Get material | `<skill.var.item.type>` |
| `.durability` | INTEGER | Get durability | `<skill.var.item.durability>` |
| `.maxDurability` | INTEGER | Get max durability | `<skill.var.item.maxDurability>` |
| `.lore` | LIST | Get lore lines | `<skill.var.item.lore>` |
| `.name` | STRING | Get display name | `<skill.var.item.name>` |
| `.mythicType` | STRING | Get mythic type | `<skill.var.item.mythicType>` |
| `.enchants` | MAP | Get enchantments | `<skill.var.item.enchants>` |
| `.getCustomData.{ns}.{key}` | STRING | Get NBT value | `<skill.var.item.getCustomData.mm.type>` |
| `.customModelData` | INTEGER | Get CMD | `<skill.var.item.customModelData>` |
| `.model` | STRING | Get item model | `<skill.var.item.model>` |
| `.amount` | INTEGER | Get stack size | `<skill.var.item.amount>` |

---

## Real-World Usage Patterns

### Pattern 1: Phase-Based Variable Initialization
*From: Matriarch Arachna Leader Skills*

```yaml
ARACHNA_LEADER_INIT_VARIABLES_1_2_PLAYERS:
  Skills:
  # State tracking
  - setvariable{var=caster.rage_stacks;value=0;type=INTEGER} @self
  - setvariable{var=caster.combo_counter;value=0;type=INTEGER} @self
  - setvariable{var=caster.blood_frenzy;value=0;type=INTEGER} @self
  - setvariable{var=caster.critical_hp;value=0;type=INTEGER} @self
  - setvariable{var=caster.berserker_mode;value=0;type=INTEGER} @self
  
  # Damage values (scalable per player count)
  - setvariable{var=caster.onattack_dmg;value=3;type=INTEGER} @self
  - setvariable{var=caster.shadowstrike_dmg;value=7;type=INTEGER} @self
  - setvariable{var=caster.venomexplosion_dmg;value=8;type=INTEGER} @self
```

**Key Insight:** Initialize ALL variables at spawn, with different skill sets for different player counts.

### Pattern 2: Damage Calculation with HP Tracking
*From: The Crimson Reaper Skills*

```yaml
CR_DAMAGE_ANNOUNCE:
  Skills:
  # Store HP before damage
  - setvariable{var=caster.CR_HP_BEFORE;value="<caster.hp>";type=FLOAT;duration=10} @self
  - delay 1
  # Calculate actual damage (accounts for armor)
  - setvariable{var=caster.CR_ACTUAL_DAMAGE;value="<caster.var.CR_HP_BEFORE> - <caster.hp>";type=INTEGER;duration=10} @self
  # Display to attacker
  - actionmessage{m="&c⚔ &f<caster.var.CR_ACTUAL_DAMAGE> &4damage dealt! &c⚔"} @trigger
```

**Key Insight:** Store values, delay for processing, then calculate difference.

### Pattern 3: Temporary Exclusion Flag
*From: The Crimson Reaper Skills*

```yaml
CR_DAMAGE_ANNOUNCE_TO_OTHERS:
  Skills:
  # Mark trigger as excluded
  - setvariable{var=target.CR_TEMP_EXCLUDE;value="yes";type=STRING;duration=5} @trigger
  - delay 3
  # Message to everyone EXCEPT trigger
  - message{m="..."} @PIR{radius=50;conditions=[
      - variableEquals{var=target.CR_TEMP_EXCLUDE;value="yes"} false
    ]}
  # Clear flag
  - setvariable{var=target.CR_TEMP_EXCLUDE;value="no";type=STRING} @trigger
```

**Key Insight:** Use target-scoped variables as temporary flags.

### Pattern 4: Phase Transitions with Unset
*From: The Crimson Reaper Skills*

```yaml
CR_SET_PHASE_2:
  Cooldown: 99999
  Skills:
  # Remove old phase
  - variableUnset{var=caster.crimson_reaper_phase_1} @self
  # Set new phase
  - setvariable{var=caster.crimson_reaper_phase_2;type=STRING;value="yes"} @self
  # Load phase-specific variables
  - skill{s=CR_VARIABLES_SET_PHASE_2}
```

**Key Insight:** Use variableUnset to cleanly transition between states.

### Pattern 5: Calculated Values with Math
*From: The Crimson Reaper Skills*

```yaml
CR_VARIABLES_SET_PHASE_1:
  Skills:
  # Simple values
  - setvariable{var=caster.cr_attack;value=12;type=INTEGER} @self
  
  # Calculated with random
  - setvariable{var=caster.cr_mark_trigger;value="2 + <random.0to2>";type=INTEGER} @self
  
  # Duration calculation (seconds to ticks)
  - setvariable{var=caster.cr_shadow_bind;value="4 * 20";type=INTEGER} @self
  
  # Range with random
  - setvariable{var=caster.cr_summon_minions;value=<random.6to12>;type=INTEGER} @self
```

**Key Insight:** Use inline math expressions for dynamic values.

### Pattern 6: Health Percentage Preservation
*From: The Crimson Reaper Skills*

```yaml
CR_ADD_MAX_HEALTH_BUFF:
  Skills:
  # Store current health as percentage
  - setvariable{var=caster.CR_HEALTH_PERCENTAGE;value="<caster.hp> / <caster.mhp>";type=FLOAT} @self
  # Add the buff
  - attributeModifier{attribute=GENERIC_MAX_HEALTH;name=CR_MAX_HEALTH_ADDITION;a=<caster.var.cr_max_health_buff>;op=ADD_NUMBER} @self
  # Restore proportional health
  - sethealth{a="<caster.var.CR_HEALTH_PERCENTAGE> * <caster.mhp>"} @self
```

**Key Insight:** Store percentage before modification, restore after.

### Pattern 7: Condition-Based Variable Checks
*From: Multiple files*

```yaml
# Check if variable equals value
- variableEquals{var=caster.crimson_reaper_phase_1;value="yes"} true

# Check if variable is in range
- variableInRange{var=caster.CR_BUFF_ACTIVE;value=1} true

# Check if variable is set at all
- variableIsSet{var=target.dazed} true

# Inline condition in targeter
@PIR{radius=50;conditions=[
  - variableEquals{var=target.CR_TEMP_EXCLUDE;value="yes"} false
]}
```

---

## Enhancement Ideas

### 🌟 Smart Features

1. **Variable Templates**
   - Pre-built variable sets for common patterns (combo system, phase tracking, damage scaling)
   - One-click import of variable patterns

2. **Variable Inheritance**
   - Template mobs can define variables that child mobs inherit
   - Show inherited vs overridden variables

3. **Variable Validation**
   - Warn when using undefined variables in placeholders
   - Detect type mismatches (using STRING variable with math)

4. **Usage Analytics**
   - Show most-used variables in pack
   - Identify unused/orphaned variables

### 🔗 Integration Ideas

5. **Variable Diff Tool**
   - Compare variables between mobs/skills
   - Identify differences across phases

6. **Variable History**
   - Track changes to variables during editing session
   - Undo/redo for variable modifications

7. **Import from YAML**
   - Paste existing MythicMobs YAML and extract all variables
   - Auto-detect types from usage patterns

### 📊 Visualization Ideas

8. **Variable Flow Diagram**
   - Show how variables flow between skills
   - Highlight read vs write operations

9. **Scope Color Coding**
   - Consistent colors across entire UI
   - SKILL=yellow, CASTER=red, TARGET=blue, WORLD=green, GLOBAL=purple

10. **Type Icons**
    - Unique icons for each variable type
    - Show in autocomplete, browser, everywhere

### 🚀 Advanced Features

11. **Variable Presets per Mob Type**
    - Suggest common variables for bosses, minions, NPCs
    - "This looks like a boss - add phase tracking?"

12. **Smart Placeholder Completion**
    - When typing `<caster.var.`, show all caster variables
    - Show meta keywords after variable name

13. **Batch Variable Operations**
    - Rename variable across entire pack
    - Change scope/type for all usages

---

## Progress Tracking

### Phase 1: Data Layer Enhancements 📊
| Task | Status | Notes |
|------|--------|-------|
| 1.1 Create `data/variableData.js` | ✅ Complete | All 13 types, 5 scopes, operations, conditions, patterns |
| 1.2 Update variable mechanics in `data/mechanics.js` | ✅ Complete | All 8 variable mechanics with full attributes |
| 1.3 Update `data/placeholders.js` with meta keywords | ✅ Complete | Added long, double, set types |
| 1.4 Update `data/dropTypes.js` for itemvariable | ✅ Complete | Enhanced with examples, tips, aliases |

### Phase 2: Variable Manager Component 🗂️
| Task | Status | Notes |
|------|--------|-------|
| 2.1 Create `components/variableManager.js` | ✅ Complete | Singleton with full API |
| 2.2 Implement pack scanning | ✅ Complete | Scans mobs and skills for variables |
| 2.3 Create variable registry | ✅ Complete | Tracks definitions and usages |
| 2.4 Add autocomplete API | ✅ Complete | suggest(), getPlaceholder(), generateSetVariable() |

### Phase 3: Variable Browser Component 🔍
| Task | Status | Notes |
|------|--------|-------|
| 3.1 Create `components/variableBrowser.js` | ✅ Complete | 650+ lines, full modal with filters |
| 3.2 Add scope filtering | ✅ Complete | Filter by SKILL, CASTER, TARGET, WORLD, GLOBAL |
| 3.3 Add type filtering | ✅ Complete | Filter by INTEGER, FLOAT, STRING, BOOLEAN, LIST, LOCATION |
| 3.4 Implement favorites/recent | ✅ Complete | localStorage-based tracking |
| 3.5 Add quick-insert | ✅ Complete | Insert placeholder or setVariable mechanic |
| 3.6 Create `styles/variableBrowser.css` | ✅ Complete | ~500 lines, responsive design |

### Phase 4: Variable Builder Component 🔧
| Task | Status | Notes |
|------|--------|-------|
| 4.1 Create `components/variableBuilder.js` | ✅ Complete | 900+ lines, full wizard modal |
| 4.2 Implement type selector | ✅ Complete | Grouped by category with icons |
| 4.3 Implement scope selector | ✅ Complete | With persistence badges |
| 4.4.1 Number type builders | ✅ Complete | Quick buttons, placeholder chips |
| 4.4.2 STRING builder | ✅ Complete | Color codes, preview |
| 4.4.3 BOOLEAN builder | ✅ Complete | Visual true/false toggle |
| 4.4.4 SET/LIST builders | ✅ Complete | Add/remove items, presets |
| 4.4.5 MAP builder | ✅ Complete | Key-value editor |
| 4.4.6 LOCATION builder | ✅ Complete | Coordinate inputs, placeholders |
| 4.4.7 VECTOR builder | ✅ Complete | XYZ with magnitude, normalize |
| 4.4.8 TIME builder | ✅ Complete | Epoch with "now" button |
| 4.4.9 METASKILL builder | ✅ Complete | Textarea with examples |
| 4.4.10 ITEM builder | ✅ Complete | Item ID with helpers |
| 4.5 Add duration/save toggles | ✅ Complete | Options section |
| 4.6 Implement live preview | ✅ Complete | Tabs for mechanic/placeholder/condition |
| 4.7 Integrate with SkillLineBuilder | ✅ Complete | Context-aware Variable Browser + Builder, keyboard shortcuts |

### Phase 5: Mob Variables Editor 👹
| Task | Status | Notes |
|------|--------|-------|
| 5.1 Create `components/mobVariablesEditor.js` | ✅ Complete | ~450 lines with dialog UI |
| 5.2 Add collapsible card to mobEditor | ✅ Complete | After Equipment section |
| 5.3 Implement add/edit/remove UI | ✅ Complete | Uses VariableBuilder or fallback |
| 5.4 Support type prefixes | ✅ Complete | int/, float/, string/ parsing |
| 5.5 Update yamlExporter.js | ✅ Complete | exportVariablesSection() added |

### Phase 6: Integration Points 🔗
| Task | Status | Notes |
|------|--------|-------|
| 6.1 Update skillEditor.js | ✅ Complete | Variable awareness integrated |
| 6.2 Update skillLineBuilder.js | ✅ Complete | Variable Browser btn, Create Variable btn, context-aware |
| 6.3 Update mobDropsEditor.js | ✅ Complete | itemvariable Variable Browser integration |
| 6.4 Add Variable Browser buttons | ✅ Complete | Quick tools bar + Alt+V keyboard shortcut |
| 6.5 Implement autocomplete | ✅ Complete | skillLineAutocomplete integration |

### Phase 7: Meta Keywords Documentation 📚
| Task | Status | Notes |
|------|--------|-------|
| 7.1 Create comprehensive meta keywords | ✅ Complete | In placeholders.js with all math/string/collection ops |
| 7.2 Add meta keyword picker | ✅ Complete | variableBrowser.js has meta keywords section |
| 7.3 Implement chaining preview | ✅ Complete | Live preview shows chained keywords |
| 7.4 Add contextual help | ✅ Complete | Tooltips and descriptions for each keyword |

### Phase 8: Polish & Testing ✨
| Task | Status | Notes |
|------|--------|-------|
| 8.1 Add validation for variable names | ✅ Complete | variableBuilder.js validateName() method |
| 8.2 Implement usage report | ✅ Complete | variableManager.getUsages() + Browser preview |
| 8.3 Add import/export | ⬜ Not Started | |
| 8.4 Cross-browser testing | ⬜ Not Started | |
| 8.5 Performance optimization | ⬜ Not Started | |

---

## Technical Notes

### Variable Name Validation Rules
- Must not contain spaces
- Must not start with a number
- Allowed characters: `a-z`, `A-Z`, `0-9`, `_`
- Case-sensitive
- Recommended: `snake_case` for readability

### Mob Variables YAML Format
```yaml
MobName:
  Variables:
    # String (default if no prefix)
    phase: idle
    # Integer with prefix
    combo_counter: int/0
    # Float with prefix  
    damage_mult: float/1.5
    # Long with prefix
    spawn_time: long/0
```

### Variable Placeholder Parsing Order
1. Inner placeholders resolved first (nested variables)
2. Variable value retrieved
3. Meta keywords applied left-to-right
4. Fallback value used if undefined

### Performance Considerations
- Variable scanning should be debounced during editing
- Cache variable registry per pack
- Lazy-load meta keyword documentation
- Virtual scroll for large variable lists

---

## Files to Create

| File | Priority | Description |
|------|----------|-------------|
| `data/variableData.js` | 🔴 Critical | Variable types, scopes, operations |
| `components/variableManager.js` | 🔴 Critical | Global variable tracking |
| `components/variableBrowser.js` | 🔴 Critical | Visual picker modal |
| `components/variableBuilder.js` | 🔴 Critical | Creation wizard |
| `components/mobVariablesEditor.js` | 🔴 Critical | Mob variables section |
| `styles/variableBrowser.css` | 🟡 High | Browser styles |
| `styles/variableBuilder.css` | 🟡 High | Builder styles |

## Files to Update

| File | Priority | Changes |
|------|----------|---------|
| `data/mechanics.js` | 🔴 Critical | Complete variable mechanic attributes |
| `data/placeholders.js` | 🔴 Critical | All meta keywords |
| `data/dropTypes.js` | 🟡 High | itemvariable drop type |
| `components/mobEditor.js` | 🔴 Critical | Add Variables section |
| `components/skillLineBuilder.js` | 🟡 High | Variable mechanic handling |
| `components/skillEditor.js` | 🟡 High | Variable browser button |
| `components/mobDropsEditor.js` | 🟡 High | itemvariable support |
| `utils/yamlExporter.js` | 🔴 Critical | Export Variables section |
| `index.html` | 🔴 Critical | Load new scripts |

---

*This document will be updated as implementation progresses.*

**Last Updated:** January 14, 2026
