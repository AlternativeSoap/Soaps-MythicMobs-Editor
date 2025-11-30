/**
 * Drop Types Configuration
 * Defines all available drop types and their attributes for MythicMobs
 */

const DROP_TYPES = [
    {
        id: 'item',
        name: 'Minecraft Item',
        description: 'Drop a vanilla Minecraft item with optional inline attributes',
        icon: 'cube',
        hasInlineAttributes: true,
        fields: [
            { name: 'item', label: 'Item Material', type: 'text', required: true, placeholder: 'DIAMOND' },
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1 or 1-3' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'mythicitem',
        name: 'MythicItem',
        description: 'Drop a MythicMobs custom item',
        icon: 'wand-magic-sparkles',
        attributes: [
            { name: 'level', label: 'Item Level', type: 'number', description: 'Level of the item' },
            { name: 'lootsplosion', label: 'Lootsplosion', type: 'boolean', description: 'Enable lootsplosion effect' },
            { name: 'itemvfx', label: 'Item VFX', type: 'boolean', description: 'Enable item VFX' },
            { name: 'itemvfxmaterial', label: 'VFX Material', type: 'text', description: 'Material for item VFX' },
            { name: 'vfxdata', label: 'VFX Data', type: 'number', description: 'Custom model data for VFX' },
            { name: 'vfxcolor', label: 'VFX Color', type: 'text', description: 'Color of the VFX (hex or name)' },
            { name: 'hologramname', label: 'Hologram Name', type: 'boolean', description: 'Show hologram name' },
            { name: 'clientsidedrops', label: 'Client Side', type: 'boolean', description: 'Client-side drops' },
            { name: 'itemglowcolor', label: 'Glow Color', type: 'text', description: 'Item glow color' },
            { name: 'itembeamcolor', label: 'Beam Color', type: 'text', description: 'Beam color' },
            { name: 'billboarding', label: 'Billboard', type: 'text', description: 'Billboarding mode' },
            { name: 'brightness', label: 'Brightness', type: 'number', description: 'Brightness level' }
        ],
        fields: [
            { name: 'item', label: 'MythicItem Name', type: 'text', required: true, placeholder: 'SuperCoolItem' },
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1 or 1-3' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'mythicmob',
        name: 'MythicMob',
        description: 'Spawn a MythicMob as a drop',
        icon: 'dragon',
        attributes: [
            { name: 'type', label: 'Mob Type', type: 'text', required: true, description: 'MythicMob type or vanilla entity' },
            { name: 'amount', label: 'Amount', type: 'number', default: 1, description: 'Number of mobs to spawn' },
            { name: 'level', label: 'Level', type: 'number', default: 0, description: 'Level of the mob' },
            { name: 'radius', label: 'Radius', type: 'number', default: 0, description: 'Spawn radius around target' },
            { name: 'yRadius', label: 'Y Radius', type: 'number', description: 'Override Y component of radius' },
            { name: 'yRadiusUpOnly', label: 'Y Radius Up Only', type: 'boolean', description: 'Y spread only upward' },
            { name: 'velocity', label: 'Velocity', type: 'number', default: 0, description: 'Initial velocity/force' },
            { name: 'yvelocity', label: 'Y Velocity', type: 'number', description: 'Y-axis velocity only' },
            { name: 'onSurface', label: 'On Surface', type: 'boolean', description: 'Spawn only on solid blocks' }
        ],
        fields: [
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'exp',
        name: 'Experience',
        description: 'Drop vanilla Minecraft experience points',
        icon: 'star',
        fields: [
            { name: 'amount', label: 'XP Amount', type: 'text', required: true, default: '10', placeholder: '10 or 100-600' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'mcmmo-exp',
        name: 'McMMO Experience',
        description: 'Give McMMO experience to the player',
        icon: 'chart-line',
        fields: [
            { name: 'amount', label: 'McMMO XP', type: 'text', required: true, default: '20', placeholder: '20' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'money',
        name: 'Money (Vault)',
        description: 'Give currency from Vault plugin',
        icon: 'coins',
        attributes: [
            { name: 'sendmessage', label: 'Send Message', type: 'boolean', default: true, description: 'Send preconfigured message to player' }
        ],
        fields: [
            { name: 'amount', label: 'Money Amount', type: 'text', required: true, default: '100', placeholder: '100' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'command',
        name: 'Command',
        description: 'Execute a console command',
        icon: 'terminal',
        attributes: [
            { name: 'command', label: 'Command', type: 'text', required: true, description: 'Command to execute (without /)' },
            { name: 'ascaster', label: 'As Caster', type: 'boolean', description: 'Execute as the mob dropping it' },
            { name: 'astrigger', label: 'As Trigger', type: 'boolean', description: 'Execute as the trigger entity' },
            { name: 'asop', label: 'As OP', type: 'boolean', description: 'Execute with full permissions' }
        ],
        fields: [
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'mmoitems',
        name: 'MMOItems',
        description: 'Drop an item from MMOItems plugin',
        icon: 'hammer',
        attributes: [
            { name: 'type', label: 'Item Type', type: 'text', required: true, description: 'MMOItems type (SWORD, ARMOR, etc.) - MUST BE CAPITALS' },
            { name: 'id', label: 'Item ID', type: 'text', required: true, description: 'MMOItems ID - MUST BE CAPITALS' },
            { name: 'unidentified', label: 'Unidentified Chance', type: 'number', description: 'Chance to be unidentified (0.0-1.0)' }
        ],
        fields: [
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'vanillaLootTable',
        name: 'Vanilla Loot Table',
        description: 'Drop items from vanilla loot tables or datapacks',
        icon: 'table',
        fields: [
            { name: 'table', label: 'Loot Table', type: 'text', required: true, placeholder: 'minecraft:chests/simple_dungeon' },
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'itemvariable',
        name: 'Item Variable',
        description: 'Drop an item from a stored variable',
        icon: 'box-archive',
        attributes: [
            { name: 'variable', label: 'Variable Name', type: 'text', required: true, description: 'Scope and name (e.g., caster.stolenitem)' }
        ],
        fields: [
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'nothing',
        name: 'Nothing',
        description: 'Drop nothing (useful for weighted droptables)',
        icon: 'ban',
        fields: [
            { name: 'chance', label: 'Weight/Chance', type: 'number', default: '1.0', min: 0, step: 0.01 }
        ]
    }
];

// Inline item attributes for vanilla items
const INLINE_ITEM_ATTRIBUTES = [
    {
        category: 'Display',
        attributes: [
            { name: 'name', label: 'Display Name', type: 'text', placeholder: 'Dark Leather' },
            { name: 'lore', label: 'Lore', type: 'textarea', placeholder: 'Line 1|Line 2' },
            { name: 'color', label: 'Leather Color', type: 'text', placeholder: 'BLACK or #FF5500' },
            { name: 'CustomModelData', label: 'Custom Model Data', type: 'number', placeholder: '1' }
        ]
    },
    {
        category: 'Enchantments',
        attributes: [
            { name: 'enchants', label: 'Enchantments', type: 'text', placeholder: 'SHARPNESS:5,UNBREAKING:3' }
        ]
    },
    {
        category: 'Player Head',
        attributes: [
            { name: 'skullTexture', label: 'Skull Texture', type: 'textarea', placeholder: 'Base64 texture value' },
            { name: 'skullOwner', label: 'Skull Owner', type: 'text', placeholder: 'PlayerName' }
        ]
    },
    {
        category: 'Flags',
        attributes: [
            { name: 'hideflags', label: 'Hide Flags', type: 'number', placeholder: '127' },
            { name: 'unbreakable', label: 'Unbreakable', type: 'boolean' }
        ]
    },
    {
        category: 'Potion',
        attributes: [
            { name: 'potioneffects', label: 'Potion Effects', type: 'text', placeholder: 'SPEED:1:30,STRENGTH:2:20' },
            { name: 'potioncolor', label: 'Potion Color', type: 'text', placeholder: '#FF5500' }
        ]
    },
    {
        category: 'NBT',
        attributes: [
            { name: 'nbt', label: 'Custom NBT', type: 'textarea', placeholder: '{CustomTag:1}' }
        ]
    }
];

// Fancy drop attributes (per-drop)
const FANCY_DROP_ATTRIBUTES = [
    {
        category: 'Visual Effects',
        attributes: [
            { name: 'lootsplosion', label: 'Lootsplosion', type: 'boolean', description: 'Drop moves outward when generated' },
            { name: 'hologramname', label: 'Hologram Name', type: 'boolean', description: 'Display hologram with item name' },
            { name: 'itemglow', label: 'Item Glow', type: 'boolean', description: 'Make item glow' },
            { name: 'itemglowcolor', label: 'Glow Color', type: 'text', placeholder: 'GOLD or #FFD700', description: 'Color of the glow' },
            { name: 'itembeam', label: 'Item Beam', type: 'boolean', description: 'Generate particle beam above item' },
            { name: 'itembeamcolor', label: 'Beam Color', type: 'text', placeholder: 'BLUE or #0055FF', description: 'Color of the beam' }
        ]
    },
    {
        category: 'Item VFX',
        attributes: [
            { name: 'itemvfx', label: 'Enable Item VFX', type: 'boolean', description: 'Enable visual effects on drop' },
            { name: 'vfxmaterial', label: 'VFX Material', type: 'text', placeholder: 'POTION', description: 'Material for VFX' },
            { name: 'vfxdata', label: 'VFX Data', type: 'number', placeholder: '21', description: 'Custom model data' },
            { name: 'vfxmodel', label: 'VFX Item Model', type: 'text', placeholder: 'custom:model', description: 'Item model (1.21.3+)' },
            { name: 'vfxcolor', label: 'VFX Color', type: 'text', placeholder: '#55ff55', description: 'Color of the VFX' }
        ]
    },
    {
        category: 'Other',
        attributes: [
            { name: 'clientsidedrops', label: 'Client Side', type: 'boolean', description: 'Only visible to player' },
            { name: 'fortune', label: 'Fortune Multiplier', type: 'number', placeholder: '1.5', description: 'Fortune enchant multiplier' }
        ]
    }
];

// Equipment slots for equipment droptables
const EQUIPMENT_SLOTS = [
    { id: 'HEAD', name: 'Head/Helmet', icon: 'user-helmet-safety' },
    { id: 'CHEST', name: 'Chest/Chestplate', icon: 'vest' },
    { id: 'LEGS', name: 'Legs/Leggings', icon: 'socks' },
    { id: 'FEET', name: 'Feet/Boots', icon: 'boot' },
    { id: 'HAND', name: 'Main Hand', icon: 'hand-fist' },
    { id: 'OFFHAND', name: 'Off Hand', icon: 'hand' }
];

window.DROP_TYPES = DROP_TYPES;
window.INLINE_ITEM_ATTRIBUTES = INLINE_ITEM_ATTRIBUTES;
window.FANCY_DROP_ATTRIBUTES = FANCY_DROP_ATTRIBUTES;
window.EQUIPMENT_SLOTS = EQUIPMENT_SLOTS;

console.log('✅ Drop Types loaded:', DROP_TYPES.length, 'types');
console.log('Drop type IDs:', DROP_TYPES.map(t => t.id));
