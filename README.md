# 🎮 Soaps MythicMobs Editor

A powerful, browser-based editor for creating and managing MythicMobs configurations. No installation required - just open and start creating!

**🌐 [Try it now!](https://alternativesoap.github.io/Soaps-MythicMobs-Editor/)**

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

## 🚀 Quick Start

1. **Open the editor** - [Click here to launch](https://alternativesoap.github.io/Soaps-MythicMobs-Editor/)
2. **Create a Pack** - Click "New Pack" button
3. **Create Mobs, Skills & Items** - Use the "+ New" buttons in each folder
4. **Export** - Copy the YAML output to your MythicMobs folder

That's it! No installation, no setup, just start creating.

### 📱 Supported Browsers
✅ Chrome • Firefox • Edge • Safari (latest versions)

## ⌨️ Keyboard Shortcuts

`Ctrl+K` Command Palette • `Ctrl+S` Save • `Ctrl+N` New Mob • `Ctrl+E` Export

## 🎨 Color Codes

Use `&` codes for colored names: `&4&lFire &6Golem` = **Fire Golem** (red + gold)

**Colors**: `&0-9` and `&a-f` • **Formats**: `&l` Bold, `&o` Italic, `&n` Underline

## 📚 Example Configuration

```yaml
# Mob Example
SkeletonKing:
  Type: SKELETON
  Display: '&6&lSkeleton King'
  Health: 200
  Damage: 15
  Armor: 10
  Skills:
  - skill{s=SummonMinions} ~onCombat
  - skill{s=Fireball} ~onTimer:60

# Skill Example
SummonMinions:
  Cooldown: 10
  Skills:
  - summon{type=SKELETON;amount=3;radius=5} @self
  - effect:particles{p=FLAME;a=20;hs=0.5;vs=0.5} @self
  - sound{s=entity.evoker.prepare_summon} @self

# Item Example
MagicSword:
  Id: DIAMOND_SWORD
  Display: '&b&lMagic Sword'
  Lore:
  - '&7A blade forged with ancient magic'
  - '&8Grants bonus damage'
  Enchantments:
  - SHARPNESS 5
  - UNBREAKING 3
```

## 💡 Pro Tips

- **Drag packs** up/down to reorder them in the file tree
- **Auto-save** keeps your work safe - look for toast notifications
- **Export often** as backups (data is stored in browser only)
- **Use validation** - check for warnings before exporting
- **Test in-game** on a test server first

## ⚠️ Important

Your data is saved in browser storage. Clearing browser data will delete your packs! Export regularly as backups.

## 📞 Support & Resources

- 📖 [MythicMobs Wiki](https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/home) - Official documentation
- 🐛 [Report Issues](https://github.com/AlternativeSoap/Soaps-MythicMobs-Editor/issues) - Bug reports & suggestions
- 💬 Join the MythicMobs Discord community

## 📄 License

MIT License • Free to use and modify

---

**Made with 💜 for the MythicMobs community** • *Happy mob creating!*
