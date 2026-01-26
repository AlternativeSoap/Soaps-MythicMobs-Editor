/**
 * Drop Types Configuration
 * Defines all available drop types and their attributes for MythicMobs
 */

const DROP_TYPES = [
    {
        id: 'item',
        name: 'Item',
        description: 'Drop a Minecraft or MythicMobs item',
        icon: 'cube',
        hasInlineAttributes: true,
        attributes: [],
        fields: [
            { name: 'item', label: 'Item', type: 'text', required: true, placeholder: 'diamond_sword or CustomItem' },
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1 or 1-3' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        id: 'mythicmob',
        name: 'MythicMob',
        description: 'Spawn a MythicMob as a drop',
        icon: 'dragon',
        basicFields: [
            { name: 'type', label: 'Mob Type', type: 'text', required: true, description: 'MythicMob internal name or vanilla entity', placeholder: 'SkeletonKing' }
        ],
        attributes: [
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
        description: 'Drop an item stored in an ITEM type variable. The variable must contain a valid ItemStack.',
        icon: 'box-archive',
        attributes: [
            { name: 'var', alias: ['variable', 'v'], label: 'Variable Name', type: 'text', required: true, description: 'Variable in scope.name format (e.g., caster.stolenitem)', placeholder: 'caster.storeditem' }
        ],
        fields: [
            { name: 'amount', label: 'Amount', type: 'text', default: '1', placeholder: '1', description: 'Amount to drop (overrides variable amount)' },
            { name: 'chance', label: 'Drop Chance', type: 'number', default: '1.0', min: 0, max: 1, step: 0.01, description: 'Probability of this drop (0.0 to 1.0)' }
        ],
        examples: [
            '- itemvariable{var=caster.stolenitem} 1 1',
            '- itemvariable{var=target.equipped_weapon} 1 0.5',
            '- itemvariable{var=skill.loot_item} 1 1'
        ],
        tips: [
            'Variable must be ITEM type containing a valid ItemStack',
            'Use setvariable with type=ITEM and value like "slot:HAND" to store items',
            'Supports all variable scopes: SKILL, CASTER, TARGET, WORLD, GLOBAL'
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
            { name: 'lootsplosion', label: 'Lootsplosion', type: 'boolean', aliases: ['lootsplosionenabled', 'ls'], description: 'Drop moves outward when generated' },
            { name: 'hologramname', label: 'Hologram Name', type: 'boolean', aliases: ['hologramnameenabled', 'hn'], description: 'Display hologram with item name' },
            { name: 'itemglow', label: 'Item Glow', type: 'boolean', aliases: ['itemglowenabled', 'ig'], description: 'Make item glow' },
            { name: 'itemglowcolor', label: 'Glow Color', type: 'text', aliases: ['glowcolor', 'gc'], placeholder: 'GOLD or #FFD700', description: 'Color of the glow' },
            { name: 'itembeam', label: 'Item Beam', type: 'boolean', aliases: ['itembeamenabled', 'ib'], description: 'Generate particle beam above item' },
            { name: 'itembeamcolor', label: 'Beam Color', type: 'text', aliases: ['beamcolor', 'bc'], placeholder: 'BLUE or #0055FF', description: 'Color of the beam' }
        ]
    },
    {
        category: 'Item VFX',
        attributes: [
            { name: 'itemvfx', label: 'Enable Item VFX', type: 'boolean', aliases: ['ivfx', 'vfx'], description: 'Enable visual effects on drop' },
            { name: 'vfxmaterial', label: 'VFX Material', type: 'text', aliases: ['vfxmat', 'vfxm'], placeholder: 'POTION', description: 'Material for VFX' },
            { name: 'vfxdata', label: 'VFX Data', type: 'number', aliases: ['vfxd'], placeholder: '21', default: 0, description: 'Custom model data' },
            { name: 'vfxmodel', label: 'VFX Item Model', type: 'text', aliases: ['vfxitemmodel'], placeholder: 'mythic:effects/item_beam_3', description: 'Item model (1.21.3+)' },
            { name: 'vfxcolor', label: 'VFX Color', type: 'text', aliases: ['vfxc', 'color'], placeholder: '#55ff55', description: 'Color of the VFX' },
            { name: 'billboarding', label: 'Billboarding', type: 'text', aliases: ['billboard', 'bill'], placeholder: 'VERTICAL', default: 'VERTICAL', description: 'Billboarding mode for hologram' },
            { name: 'brightness', label: 'Brightness', type: 'number', aliases: ['bright', 'b'], placeholder: '15', default: 0, description: 'Brightness of the hologram' }
        ]
    },
    {
        category: 'Pity System',
        attributes: [
            { name: 'pityModifier', label: 'Pity Modifier', type: 'number', aliases: ['pitymod', 'pmod'], placeholder: '0.1', default: 0.0, description: 'Modifier for pity system' },
            { name: 'resetpity', label: 'Reset Pity', type: 'boolean', aliases: ['resetp', 'rp'], default: false, description: 'Whether pity should be reset on drop' },
            { name: 'pcategory', label: 'Pity Category', type: 'text', aliases: ['pitycategory', 'category'], placeholder: 'DEFAULT', default: 'DEFAULT', description: 'Category for pity tracking' }
        ]
    },
    {
        category: 'Drop Requirements',
        attributes: [
            { name: 'damage', label: 'Min Damage', type: 'number', aliases: ['mindamage', 'min'], placeholder: '100', default: 0.0, description: 'Minimum damage dealt to mob for this drop' },
            { name: 'top', label: 'Leaderboard Position', type: 'number', aliases: ['placement', 'required'], placeholder: '1', description: 'Required position in damage leaderboard' }
        ]
    },
    {
        category: 'Fortune',
        attributes: [
            { name: 'fortune', label: 'Fortune Enabled', type: 'boolean', default: false, description: 'Whether affected by fortune enchant' },
            { name: 'fortuneMod', label: 'Fortune Modifier', type: 'number', aliases: ['fortunemod'], placeholder: '1.5', description: 'How much each fortune level impacts drop amount' }
        ]
    },
    {
        category: 'Other',
        attributes: [
            { name: 'clientsidedrops', label: 'Client Side', type: 'boolean', aliases: ['clientsidedropsenabled', 'csd'], description: 'Only visible to player who killed mob' }
        ]
    }
];

// Equipment slots for equipment droptables
const DROP_EQUIPMENT_SLOTS = [
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
window.DROP_EQUIPMENT_SLOTS = DROP_EQUIPMENT_SLOTS;

if (window.DEBUG_MODE) {
}
