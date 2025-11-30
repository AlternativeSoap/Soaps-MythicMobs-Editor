# Smart Skill Line Groups - Visual Reference

## UI Components

### 1. Toolbar
```
┌─────────────────────────────────────────────────────────┐
│ [📋 Grouped View] │ 3 groups detected                   │
└─────────────────────────────────────────────────────────┘
```

### 2. Collapsed Group
```
┌────────────────────────────────────────────────────────────┐
│ ▶ 🎯 PROJECTILE SKILL │ 4 lines │ 💡 2 │ [📋] [🗑️]       │ ← Purple gradient header
└────────────────────────────────────────────────────────────┘
```

### 3. Expanded Group with Suggestions
```
┌────────────────────────────────────────────────────────────┐
│ ▼ 🎯 PROJECTILE SKILL │ 4 lines │ 💡 2 │ [📋] [🗑️]       │
├────────────────────────────────────────────────────────────┤
│ 💡 Suggestions:                                            │
│   ⚠️ Add onHit callback for impact effect [Add]           │
│   ℹ️ Consider adding onEnd for timeout effect [Add]       │
├────────────────────────────────────────────────────────────┤
│ │─ [P] ✅ - projectile{onTick=Fire-Tick;v=8} [✏️][📋][🗑️]│ ← Parent line
│ │─ ✅ - effect:particles{p=flame} @origin [✏️][📋][🗑️]    │ ← Child line
│ │─ ⚠️ - damage{a=INVALID} @target [✏️][📋][🗑️]           │ ← Child with warning
└────────────────────────────────────────────────────────────┘
```

### 4. Multiple Groups
```
┌─ 🎯 PROJECTILE SKILL ─┐  ← Group 1
│ [P] Projectile line   │
│  ├─ onTick callback   │
│  └─ onHit callback    │
└───────────────────────┘

┌─ 🔮 AURA SKILL ───────┐  ← Group 2
│ [P] Aura line         │
│  ├─ onTick callback   │
│  └─ onEnd callback    │
└───────────────────────┘

┌─ Ungrouped Lines ────┐  ← Ungrouped
│ - standalone line    │
│ - another line       │
└──────────────────────┘
```

## Interaction Guide

### Click Actions
| Element | Click Action | Result |
|---------|-------------|---------|
| Group Header | Click | Toggle collapse/expand |
| ▼/▶ Icon | Click | Toggle collapse/expand |
| [📋] in header | Click | Duplicate entire group |
| [🗑️] in header | Click | Delete entire group (with confirmation) |
| [Add] button | Click | Add suggested line to group |
| [📋 Grouped View] | Click | Toggle between grouped/flat view |
| Line card | Drag | Reorder (in flat view) |
| [✏️] on line | Click | Edit that specific line |

### Visual Indicators
| Symbol | Meaning |
|--------|---------|
| 🎯 | Projectile group |
| 🔮 | Aura/buff group |
| ⚡ | Reactive skill group |
| 🔗 | Chain skill group |
| ✨ | Cast skill group |
| 📦 | Generic callback group |
| [P] | Parent skill (has callbacks) |
| ✅ | Valid skill line |
| ❌ | Error in skill line |
| ⚠️ | Warning in skill line |
| 💡 | Has suggestions |
| │─ | Connection line (child of parent) |

### Suggestion Types
| Color | Severity | Meaning |
|-------|----------|---------|
| 🔴 Red | Missing | Required callback is missing |
| 🟠 Orange | Recommended | Common pattern, strongly suggested |
| 🔵 Blue | Optional | Enhancement opportunity |

## Keyboard Shortcuts (Planned)
| Shortcut | Action |
|----------|--------|
| `Ctrl+G` | Toggle grouped view |
| `Ctrl+Shift+D` | Duplicate focused group |
| `Delete` | Delete focused group/line |
| `Ctrl+E` | Expand all groups |
| `Ctrl+Shift+E` | Collapse all groups |

## Pattern Examples

### Ice Bolt (Projectile + 2 Callbacks)
```
Group Type: 🎯 Projectile
Members: 3 lines
Callbacks: onTick, onHit

[P] - projectile{onTick=IceBolt-Tick;onHit=IceBolt-Hit;v=8}
 ├─ - effect:particles{p=snowballpoof;amount=20} @origin
 └─ - damage{a=10} @target
     - potion{type=SLOW;duration=100;lvl=2}
```

### Shield Aura (Aura + 2 Callbacks)
```
Group Type: 🔮 Aura
Members: 2 lines
Callbacks: onTick

[P] - aura{onTick=Shield-Tick;duration=200;interval=20}
 └─ - effect:particles{p=enchantmenttable;amount=5} @origin
     - potion{type=DAMAGE_RESISTANCE;duration=40;lvl=1}
```

### Meteor Strike (Projectile + 3 Callbacks)
```
Group Type: 🎯 Projectile
Members: 4 lines
Callbacks: onTick, onEnd

[P] - projectile{type=METEOR;onTick=Meteor-Tick;onEnd=Meteor-End;v=10}
 ├─ - effect:particles{p=flame;amount=30} @origin
 └─ - damage{a=50;i=true} @EntitiesInRadius{r=5}
     - effect:explosion{yield=2} @origin
```

## Color Scheme

### Group Colors
- **Header Gradient**: Purple (#8b5cf6 → #a78bfa)
- **Border**: Purple (#8b5cf6)
- **Parent Left Border**: Lighter Purple (#a78bfa), 4px
- **Child Left Border**: Standard Purple (#8b5cf6), 3px
- **Connection Line**: Purple (#8b5cf6), 2px, 50% opacity

### Suggestion Colors
- **Missing**: Red border-left (#dc2626)
- **Recommended**: Orange border-left (#f59e0b)
- **Optional**: Blue border-left (#3b82f6)
- **Badge**: Yellow background (#ffc107)

### State Colors
- **Valid**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#dc2626)
- **Collapsed**: 70% opacity

## Responsive Behavior

### Desktop (> 1024px)
- Full toolbar with text labels
- All group actions visible
- Suggestions panel expanded
- Connection lines visible

### Tablet (768px - 1024px)
- Compact toolbar
- Icon-only group actions
- Suggestions panel visible
- Connection lines visible

### Mobile (< 768px)
- Minimal toolbar
- Essential actions only
- Suggestions collapsed by default
- Simplified connection indicators

## Animation Details

### Transitions
- **Group Expand/Collapse**: 200ms ease
- **Button Hover**: 150ms ease
- **Border Glow**: 150ms ease
- **Badge Scale**: 150ms ease

### Effects
- **Group Hover**: Purple glow shadow
- **Button Hover**: Scale 1.1, brightness +10%
- **Collapse**: Max-height 1000px → 0, opacity 1 → 0
- **Expand**: Max-height 0 → 1000px, opacity 0 → 1

## Accessibility

### ARIA Labels
- Group headers: `role="button" aria-expanded="true/false"`
- Toggle buttons: `aria-label="Toggle group"`
- Action buttons: `aria-label="Duplicate group" / "Delete group"`
- Suggestions: `role="alert" aria-live="polite"`

### Keyboard Navigation
- Tab through groups and buttons
- Space/Enter to toggle groups
- Arrow keys to navigate members
- Delete key on focused elements

### Screen Readers
- Announces group type and member count
- Reads suggestion messages
- Alerts on group operations
- Describes parent/child relationships

---

**Quick Reference Card**
```
┌─────────────────────────────────────┐
│ Smart Skill Line Groups             │
├─────────────────────────────────────┤
│ 🎯 Projectile  🔮 Aura  ⚡ Reactive  │
│ 🔗 Chain      ✨ Cast  📦 Callback  │
├─────────────────────────────────────┤
│ Click header → Toggle collapse      │
│ Click [📋] → Duplicate group        │
│ Click [🗑️] → Delete group           │
│ Click [Add] → Insert suggestion     │
│ Click [📋 View] → Toggle flat list  │
├─────────────────────────────────────┤
│ 💡 = Has suggestions                │
│ [P] = Parent skill                  │
│ │─ = Child of parent                │
└─────────────────────────────────────┘
```
