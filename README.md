# 🎮 Soaps MythicMobs Editor v2

A comprehensive, browser-based editor for creating and managing MythicMobs configurations with a beautiful dark purple interface.

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 📦 Pack System
- **Multiple Packs**: Organize your mobs, skills, and items into separate packs
- **File Tree**: Visual file browser with folder structure
- **Quick Actions**: Create new mobs, skills, and items with one click
- **Auto-save**: Your work is automatically saved to browser storage

### 🧟 Mob Editor
- **Visual Form**: Edit mob properties with user-friendly inputs
- **Entity Types**: Choose from all Minecraft entity types
- **Combat Stats**: Configure health, damage, armor, speed, and range
- **Skills & Drops**: Attach skills and configure drop tables
- **Live Preview**: See YAML output in real-time

### ⚔️ Skill Editor
- **Mechanic Tree**: Visual representation of skill mechanics
- **Triggers**: Configure when skills activate (~onAttack, ~onTimer, etc.)
- **Conditions**: Add conditions for skill execution
- **Cooldowns**: Set skill cooldown times

### 💎 Item Editor
- **Material Selector**: Choose from all Minecraft materials
- **Display & Lore**: Customize item appearance
- **Enchantments**: Add and configure enchantments
- **Options**: Set unbreakable, hide flags, and more

### 🎨 User Interface
- **Dark Purple Theme**: Easy on the eyes with glassmorphism effects
- **Three-Panel Layout**: File tree | Editor | YAML Preview
- **Responsive Design**: Works on desktop and tablet screens
- **Keyboard Shortcuts**: Speed up your workflow

### 💾 Export & Import
- **YAML Export**: Export individual files or entire packs
- **Pack Export**: Download packs as ZIP files (coming soon)
- **Validation**: Automatic validation with warnings and errors

## 🚀 Getting Started

### Installation

1. **Download** or clone this repository
2. **Open** `index.html` in a modern web browser
3. **Start creating!** No server or installation required

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### First Steps

1. **Create a Pack**
   - Click the "+" button next to "Packs" in the sidebar
   - Enter a pack name (e.g., "MyCustomMobs")
   - Your first pack is created!

2. **Create Your First Mob**
   - Click "New Mob" in the pack folder
   - Fill in the mob details:
     - **Internal Name**: lowercase_with_underscores (e.g., `fire_golem`)
     - **Display Name**: Use `&` codes for colors (e.g., `&4&lFire Golem`)
     - **Entity Type**: Choose the base Minecraft mob
     - **Stats**: Configure health, damage, armor, etc.
   - Click **Save** or press `Ctrl+S`

3. **Create a Skill**
   - Click "New Skill" in the pack folder
   - Add mechanics with the "Add Mechanic" button
   - Configure triggers (e.g., `~onAttack`, `~onTimer:20`)
   - Save your skill

4. **Export Your Work**
   - Right-click a file in the tree and select "Export"
   - Or use `Ctrl+E` to export the current file
   - Copy the YAML and paste it into your MythicMobs plugin folder

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+S` | Save Current File |
| `Ctrl+N` | Create New Mob |
| `Ctrl+Alt+N` | Create New Skill |
| `Ctrl+Shift+N` | Create New Item |
| `Ctrl+E` | Export Current File |
| `Ctrl+Z` | Undo (coming soon) |
| `Ctrl+Y` | Redo (coming soon) |

## 📁 File Structure

```
Soaps Mythicmobs Editor v2/
├── index.html              # Main application entry
├── README.md               # This file
├── styles/
│   ├── main.css           # Core theme and layout
│   ├── components.css     # Reusable UI components
│   └── editor.css         # Editor-specific styles
├── app.js                 # Core application controller
├── components/
│   ├── storageManager.js  # localStorage wrapper
│   ├── packManager.js     # Pack system management
│   ├── fileManager.js     # File operations
│   ├── mobEditor.js       # Mob configuration UI
│   ├── skillEditor.js     # Skill configuration UI
│   ├── itemEditor.js      # Item configuration UI
│   ├── commandPalette.js  # Quick actions palette
│   ├── displayNameBuilder.js # Display name utilities
│   └── mechanicBrowser.js # Mechanic database browser
├── utils/
│   ├── yamlParser.js      # YAML parsing
│   ├── yamlExporter.js    # YAML export formatting
│   ├── validators.js      # Configuration validation
│   ├── editorHistory.js   # Undo/redo system
│   ├── collapsibleManager.js # UI collapse handler
│   ├── helpers.js         # Utility functions
│   ├── mechanics.js       # Mechanics database
│   ├── conditions.js      # Conditions database
│   ├── triggers.js        # Triggers database
│   ├── targeters.js       # Targeters database
│   ├── mobTypes.js        # Entity types
│   └── materials.js       # Minecraft materials
└── data/
    ├── mobData.js         # Mob defaults and templates
    └── templates.js       # Pre-built examples
```

## 🎨 Color Codes Reference

Use Minecraft color codes in display names and lore:

| Code | Color | Code | Color |
|------|-------|------|-------|
| `&0` | Black | `&8` | Dark Gray |
| `&1` | Dark Blue | `&9` | Blue |
| `&2` | Dark Green | `&a` | Green |
| `&3` | Dark Aqua | `&b` | Aqua |
| `&4` | Dark Red | `&c` | Red |
| `&5` | Dark Purple | `&d` | Light Purple |
| `&6` | Gold | `&e` | Yellow |
| `&7` | Gray | `&f` | White |
| `&l` | **Bold** | `&n` | Underline |
| `&o` | *Italic* | `&k` | Obfuscated |
| `&m` | ~~Strikethrough~~ | `&r` | Reset |

**Example**: `&4&lFire &6&lGolem` = **<span style="color:darkred">Fire</span> <span style="color:gold">Golem</span>**

## 📚 MythicMobs Basics

### Mob Configuration

```yaml
SkeletonKing:
  Type: SKELETON
  Display: '&6&lSkeleton King'
  Health: 200
  Damage: 15
  Armor: 10
  Skills:
  - SummonMinions{amt=3} ~onCombat
  Drops:
  - gold_ingot 1-3 0.5
```

### Skill Configuration

```yaml
Fireball:
  Cooldown: 5
  Mechanics:
  - projectile{onTick=FireballParticles;onHit=FireballDamage;v=2}
```

### Item Configuration

```yaml
MagicSword:
  Id: DIAMOND_SWORD
  Display: '&b&lMagic Sword'
  Lore:
  - '&7A blade infused with magic'
  Enchantments:
  - SHARPNESS:5
  - UNBREAKING:3
```

## 🔧 Advanced Features

### Display Name Builder
Use the display name builder (coming soon) to create gradient text effects:
- **Gradient**: Smooth color transitions
- **Rainbow**: Multi-color effects
- **Custom**: Combine colors and formats

### Mechanic Browser
Search and browse all available MythicMobs mechanics (coming soon):
- **Categories**: Damage, Effects, Movement, Projectile, etc.
- **Examples**: See example configurations
- **Documentation**: Built-in parameter reference

### Pack Export
Export entire packs as ZIP files ready to upload to your server (coming soon).

## 💡 Tips & Tricks

1. **Use Beginner Mode** if you're new to MythicMobs - it simplifies the UI
2. **Name Files Carefully** - Use lowercase and underscores (e.g., `fire_golem`)
3. **Save Often** - Press `Ctrl+S` frequently (auto-save helps too!)
4. **Check YAML Preview** - The right panel shows your output in real-time
5. **Validate Before Export** - Look for validation warnings and fix them
6. **Test in-game** - Always test your mobs on a test server first

## 🐛 Troubleshooting

### My changes aren't saving
- Check if auto-save is enabled (should see toast notifications)
- Manually save with `Ctrl+S`
- Check browser console for errors (F12)

### YAML export looks wrong
- Ensure all required fields are filled
- Check validation warnings (yellow) and errors (red)
- Verify entity type and material names are correct

### Application won't load
- Make sure you're using a modern browser
- Check browser console for errors
- Try clearing browser cache and reloading

### Lost my packs
- Data is stored in browser localStorage
- Don't clear browser data if you want to keep your work
- Export your packs regularly as backups

## 📦 Data Storage

All your work is saved in your browser's localStorage:
- **Persistent**: Data survives browser restarts
- **Local**: Data stays on your computer
- **Per-browser**: Each browser has separate storage

**⚠️ Important**: Clearing browser data will delete your packs! Export regularly as backups.

## 🤝 Contributing

Want to improve the editor? Contributions are welcome!

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - Feel free to use and modify for your projects.

## 🙏 Credits

- **MythicMobs**: Developed by Mythic Team
- **Font Awesome**: Icon library
- **JSZip**: ZIP file creation
- **Google Fonts**: Inter and JetBrains Mono fonts

## 📞 Support

- **Discord**: Join the MythicMobs community
- **Documentation**: [MythicMobs Wiki](https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/home)
- **Issues**: Report bugs on the repository

---

**Made with 💜 for the MythicMobs community**

*Happy mob creating!*
