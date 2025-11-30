/**
 * Item Options and Configuration Data
 * Supports item option fields, hide flags, slots, attributes, and operations
 */

// Hide Flags for items (pre-1.20.5)
const HIDE_FLAGS = [
    { id: 'HIDE_ENCHANTS', name: 'Enchantments', description: 'Hide enchantments from tooltip' },
    { id: 'HIDE_ATTRIBUTES', name: 'Attributes', description: 'Hide attribute modifiers from tooltip' },
    { id: 'HIDE_UNBREAKABLE', name: 'Unbreakable', description: 'Hide unbreakable state from tooltip' },
    { id: 'HIDE_DESTROYS', name: 'Can Destroy', description: 'Hide can destroy information' },
    { id: 'HIDE_PLACED_ON', name: 'Can Place On', description: 'Hide can place on information' },
    { id: 'HIDE_POTION_EFFECTS', name: 'Potion Effects', description: 'Hide potion effects (<1.20.5 only)' },
    { id: 'HIDE_DYE', name: 'Dye', description: 'Hide dye information from leather armor' }
];

// Item attribute slots
const ATTRIBUTE_SLOTS = [
    { id: 'All', name: 'All Slots', description: 'Applies to all equipment slots' },
    { id: 'MainHand', name: 'Main Hand', description: 'Only when held in main hand' },
    { id: 'OffHand', name: 'Off Hand', description: 'Only when held in off hand' },
    { id: 'Head', name: 'Head', description: 'Only when worn on head' },
    { id: 'Chest', name: 'Chest', description: 'Only when worn on chest' },
    { id: 'Legs', name: 'Legs', description: 'Only when worn on legs' },
    { id: 'Feet', name: 'Feet', description: 'Only when worn on feet' }
];

// Attribute types
const ATTRIBUTE_TYPES = [
    { id: 'AttackSpeed', name: 'Attack Speed', description: 'Determines recharge rate of attacks' },
    { id: 'Armor', name: 'Armor', description: 'Amount of armor (1 = 0.5 armor plates)' },
    { id: 'ArmorToughness', name: 'Armor Toughness', description: 'Alters damage reduction of armor' },
    { id: 'Damage', name: 'Attack Damage', description: 'Damage dealt by melee attacks' },
    { id: 'Health', name: 'Max Health', description: 'Maximum health (1 = 0.5 hearts)' },
    { id: 'Luck', name: 'Luck', description: 'Affects loot tables and drops' },
    { id: 'KnockbackResistance', name: 'Knockback Resistance', description: 'Resistance to knockback' },
    { id: 'MovementSpeed', name: 'Movement Speed', description: 'Movement speed modifier' },
    { id: 'MaxAbsorption', name: 'Max Absorption', description: 'Maximum absorption hearts' },
    { id: 'Scale', name: 'Entity Scale', description: 'Size multiplier of entity' },
    { id: 'StepHeight', name: 'Step Height', description: 'Max blocks to step up without jumping' },
    { id: 'JumpHeight', name: 'Jump Height', description: 'Height entity can jump' },
    { id: 'BlockInteractionRange', name: 'Block Interaction Range', description: 'Block reach distance' },
    { id: 'EntityInteractionRange', name: 'Entity Interaction Range', description: 'Entity reach distance' },
    { id: 'BlockBreakSpeed', name: 'Block Break Speed', description: 'Block breaking speed multiplier' },
    { id: 'Gravity', name: 'Gravity', description: 'Gravity affecting entity' },
    { id: 'SafeFallDistance', name: 'Safe Fall Distance', description: 'Fall distance before damage' },
    { id: 'FallDamageMultiplier', name: 'Fall Damage Multiplier', description: 'Fall damage multiplier' }
];

// Attribute operations
const ATTRIBUTE_OPERATIONS = [
    { id: 'ADD', name: 'Add (0)', description: 'Adds or subtracts value to base', aliases: ['0', 'ADD_NUMBER'] },
    { id: 'MULTIPLY_BASE', name: 'Multiply Base (1)', description: 'Multiplies base by sum of modifiers', aliases: ['1', 'ADD_SCALAR'] },
    { id: 'MULTIPLY', name: 'Multiply (2)', description: 'Multiplies all modifier amounts', aliases: ['2', 'MULTIPLY_SCALAR'] }
];

// Predefined colors
const PREDEFINED_COLORS = [
    { id: 'RED', name: 'Red', rgb: '255,0,0' },
    { id: 'BLUE', name: 'Blue', rgb: '0,0,255' },
    { id: 'GREEN', name: 'Green', rgb: '0,255,0' },
    { id: 'YELLOW', name: 'Yellow', rgb: '255,255,0' },
    { id: 'ORANGE', name: 'Orange', rgb: '255,165,0' },
    { id: 'PURPLE', name: 'Purple', rgb: '128,0,128' },
    { id: 'PINK', name: 'Pink', rgb: '255,192,203' },
    { id: 'WHITE', name: 'White', rgb: '255,255,255' },
    { id: 'BLACK', name: 'Black', rgb: '0,0,0' },
    { id: 'GRAY', name: 'Gray', rgb: '128,128,128' },
    { id: 'BROWN', name: 'Brown', rgb: '139,69,19' },
    { id: 'LIME', name: 'Lime', rgb: '0,255,0' },
    { id: 'CYAN', name: 'Cyan', rgb: '0,255,255' },
    { id: 'MAGENTA', name: 'Magenta', rgb: '255,0,255' }
];

// Armor trim materials (1.20+)
const TRIM_MATERIALS = [
    'QUARTZ', 'IRON', 'NETHERITE', 'REDSTONE', 'COPPER', 'GOLD', 
    'EMERALD', 'DIAMOND', 'LAPIS', 'AMETHYST'
];

// Armor trim patterns (1.20+)
const TRIM_PATTERNS = [
    'SENTRY', 'VEX', 'WILD', 'COAST', 'DUNE', 'WAYFINDER', 
    'RAISER', 'SHAPER', 'HOST', 'WARD', 'SILENCE', 'TIDE', 
    'SNOUT', 'RIB', 'EYE', 'SPIRE'
];

// Boolean item options
const BOOLEAN_OPTIONS = [
    { id: 'Repairable', name: 'Repairable', description: 'Allow repair in anvil (false = max repair cost)', default: true },
    { id: 'Unbreakable', name: 'Unbreakable', description: 'Item never loses durability', default: false },
    { id: 'Glint', name: 'Enchantment Glint', description: 'Show enchantment glow effect', default: false },
    { id: 'HideFlags', name: 'Hide All Flags', description: 'Hide all item information flags (<1.20.5)', default: false },
    { id: 'PreventStacking', name: 'Prevent Stacking', description: 'Item cannot stack with similar items', default: false },
    { id: 'GenerateUUID', name: 'Generate UUID', description: 'Apply random UUID on generation', default: false },
    { id: 'GenerateTimestamp', name: 'Generate Timestamp', description: 'Apply unix timestamp on generation', default: false },
    { id: 'FireResistant', name: 'Fire Resistant', description: 'Immune to fire/lava damage', default: false },
    { id: 'Glider', name: 'Glider', description: 'Functions as elytra', default: false }
];

// Number item options
const NUMBER_OPTIONS = [
    { id: 'RepairCost', name: 'Repair Cost', description: 'Anvil repair cost (-1 = vanilla)', default: -1, min: -1 },
    { id: 'StackSize', name: 'Stack Size', description: 'Maximum stack size in inventory', default: 64, min: 1, max: 64 }
];

// Text item options
const TEXT_OPTIONS = [
    { id: 'ItemModel', name: 'Item Model', description: 'Custom item model identifier' },
    { id: 'Player', name: 'Player Head', description: 'IGN for player head texture (heads only)' },
    { id: 'SkinTexture', name: 'Skin Texture', description: 'Base64 texture or hash for player head (heads only)' },
    { id: 'TooltipStyle', name: 'Tooltip Style', description: 'Resource location for custom tooltip background/frame sprites (e.g., minecraft:verycooltooltip references textures/gui/sprites/tooltip/<id>_background and <id>_frame)' }
];

// Export all data
window.ItemOptions = {
    HIDE_FLAGS,
    ATTRIBUTE_SLOTS,
    ATTRIBUTE_TYPES,
    ATTRIBUTE_OPERATIONS,
    PREDEFINED_COLORS,
    TRIM_MATERIALS,
    TRIM_PATTERNS,
    BOOLEAN_OPTIONS,
    NUMBER_OPTIONS,
    TEXT_OPTIONS
};

console.log('✅ Item Options loaded');
