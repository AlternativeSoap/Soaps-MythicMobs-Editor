/**
 * Entity Field Mapping - Complete MythicMobs Options
 * Based on official documentation: https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Mobs/Options
 */

// Field groups organized by category
const ENTITY_FIELDS = {
    // === UNIVERSAL OPTIONS (All entities) ===
    UNIVERSAL: [
        'AlwaysShowName', 'AttackSpeed', 'VisibleByDefault', 'Invisible', 'Collidable',
        'DigOutOfGround', 'Despawn', 'FollowRange', 'Glowing', 'HealOnReload',
        'Invincible', 'Interactable', 'LockPitch', 'KnockbackResistance', 'MaxCombatDistance',
        'MovementSpeed', 'NoAI', 'NoDamageTicks', 'NoGravity', 'PassthroughDamage',
        'PreventItemPickup', 'PreventLeashing', 'PreventMobKillDrops', 'PreventOtherDrops',
        'PreventRandomEquipment', 'PreventRenaming', 'PreventSunburn', 'PreventTransformation',
        'PreventVanillaDamage', 'RepeatAllSkills', 'ReviveHealth', 'Scale', 'ShowHealth',
        'Silent', 'UseThreatTable', 'RandomizeProperties',
        // Phase 1 additions
        'Faction', 'Template'
    ],
    
    // === LIVING ENTITIES ===
    LIVING: [
        'Health', 'Damage', 'Armor'
    ],
    
    // === BREEDABLE MOBS ===
    BREEDABLE: [
        'Age', 'AgeLock', 'Adult', 'Baby'
    ],
    
    // === COLORABLE MOBS (Horses, Llamas, Parrots, Sheep, Shulkers, TropicalFish, Wolves) ===
    COLORABLE: [
        'Color'
    ],
    
    // === NEUTRAL ENTITIES (Wolves, Zombie Pigmen) ===
    NEUTRAL: [
        'Angry'
    ],
    
    // === SLIMES & MAGMA CUBES ===
    SLIME: [
        'PreventSlimeSplit', 'Size'
    ],
    
    // === PHANTOMS ===
    PHANTOM: [
        'Size'
    ],
    
    // === RAIDERS ===
    RAIDER: [
        'CanJoinRaid', 'PatrolLeader', 'PatrolSpawnPoint'
    ],
    
    // === TAMEABLE MOBS ===
    TAMEABLE: [
        'Tameable', 'Tamed'
    ],
    
    // === ZOMBIES (all variants) ===
    ZOMBIE: [
        'PreventJockeyMounts', 'PreventConversion', 'ReinforcementsChance'
    ],
    
    // === ARMOR STAND ===
    ARMOR_STAND: [
        'CanMove', 'CanTick', 'HasArms', 'HasBasePlate', 'HasGravity',
        'ItemBody', 'ItemFeet', 'ItemHand', 'ItemOffhand', 'ItemHead', 'ItemLegs',
        'Marker', 'Small', 'Pose'
    ],
    
    // === BEE ===
    BEE: [
        'Anger', 'HasNectar', 'HasStung', 'PreventStingerLoss'
    ],
    
    // === BOAT ===
    BOAT: [
        'BoatType'
    ],
    
    // === CAMEL ===
    CAMEL: [
        'Saddled'
    ],
    
    // === CAT ===
    CAT: [
        'CatType', 'CollarColor'
    ],
    
    // === COW ===
    COW: [
        'Variant'
    ],
    
    // === CHICKEN ===
    CHICKEN: [
        'Jockey', 'Variant'
    ],
    
    // === CREEPER ===
    CREEPER: [
        'ExplosionRadius', 'FuseTicks', 'SuperCharged', 'PreventSuicide'
    ],
    
    // === COPPER GOLEM ===
    COPPER_GOLEM: [
        'WeatheringState', 'Waxed'
    ],
    
    // === ENDERMAN ===
    ENDERMAN: [
        'PreventTeleport', 'HeldBlock'
    ],
    
    // === EXPERIENCE ORB ===
    EXPERIENCE_ORB: [
        'Experience'
    ],
    
    // === FALLING BLOCK ===
    FALLING_BLOCK: [
        'Block', 'BlockData', 'DropsItem', 'HurtsEntities', 
        'ReplaceSpawnLocationBlock', 'UseSpawnLocationType'
    ],
    
    // === FOX ===
    FOX: [
        'FoxType'
    ],
    
    // === FROG ===
    FROG: [
        'FrogType'
    ],
    
    // === GOAT ===
    GOAT: [
        'Screaming'
    ],
    
    // === HOGLIN ===
    HOGLIN: [
        'ImmuneToZombification', 'Huntable'
    ],
    
    // === HORSE ===
    HORSE: [
        'HorseArmor', 'HorseColor', 'Saddled', 'HorseStyle'
    ],
    
    // === DONKEY / MULE ===
    DONKEY: [
        'CarryingChest', 'Saddled'
    ],
    
    // === INTERACTION ===
    INTERACTION: [
        'Height', 'Width', 'Responsive'
    ],
    
    // === IRON GOLEM ===
    IRON_GOLEM: [
        'PlayerCreated'
    ],
    
    // === ITEM ===
    ITEM: [
        'Item', 'Amount', 'CanPickup'
    ],
    
    // === LLAMA ===
    LLAMA: [
        'CarryingChest', 'Color'
    ],
    
    // === MINECART CHEST ===
    MINECART_CHEST: [
        'ChestContents'
    ],
    
    // === PANDA ===
    PANDA: [
        'MainGene', 'HiddenGene'
    ],
    
    // === PARROT ===
    PARROT: [
        'Variant', 'FlyingSpeed'
    ],
    
    // === PIG ===
    PIG: [
        'Saddled', 'Variant'
    ],
    
    // === PIGLIN ===
    PIGLIN: [
        'AbleToHunt', 'ImmuneToZombification'
    ],
    
    // === PIGLIN BRUTE ===
    PIGLIN_BRUTE: [
        'ImmuneToZombification'
    ],
    
    // === RABBIT ===
    RABBIT: [
        'IsKillerBunny', 'RabbitType'
    ],
    
    // === SHEEP ===
    SHEEP: [
        'Sheared'
    ],
    
    // === SILVERFISH ===
    SILVERFISH: [
        'PreventBlockInfection'
    ],
    
    // === SKELETON ===
    SKELETON: [
        'PreventConversion'
    ],
    
    // === SNOW GOLEM ===
    SNOW_GOLEM: [
        'Derp', 'PreventSnowFormation'
    ],
    
    // === TNT ===
    TNT: [
        'FuseTicks', 'ExplosionYield', 'Incendiary'
    ],
    
    // === TROPICAL FISH ===
    TROPICAL_FISH: [
        'Pattern', 'BodyColor', 'PatternColor'
    ],
    
    // === VILLAGER ===
    VILLAGER: [
        'HasTrades', 'Profession', 'VillagerType', 'Level'
    ],
    
    // === WOLF ===
    WOLF: [
        'WolfVariant', 'CollarColor'
    ],
    
    // === ZOMBIE VILLAGER ===
    ZOMBIE_VILLAGER: [
        'Profession'
    ],
    
    // === DISPLAY ENTITIES (1.19.4+) ===
    DISPLAY_BASE: [
        'ViewRange', 'Width', 'Height', 'ShadowRadius', 'ShadowStrength',
        'Billboard', 'TeleportDuration', 'InterpolationDelay', 'InterpolationDuration',
        'ColorOverride', 'BlockLight', 'SkyLight'
    ],
    
    DISPLAY_TRANSFORM: [
        'Translation', 'Scale', 'LeftRotation', 'RightRotation'
    ],
    
    BLOCK_DISPLAY: [
        'Block'
    ],
    
    ITEM_DISPLAY: [
        'Item', 'Transform'
    ],
    
    TEXT_DISPLAY: [
        'Text', 'Opacity', 'DefaultBackground', 'BackgroundColor',
        'Alignment', 'LineWidth', 'Shadowed', 'SeeThrough'
    ]
};

// Entity type to field group mapping
const ENTITY_TYPE_MAPPING = {
    // Hostile Mobs
    'ZOMBIE': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'ZOMBIE'],
    'HUSK': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'ZOMBIE'],
    'DROWNED': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'ZOMBIE'],
    'ZOMBIE_VILLAGER': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'ZOMBIE', 'ZOMBIE_VILLAGER'],
    'SKELETON': ['UNIVERSAL', 'LIVING', 'SKELETON'],
    'WITHER_SKELETON': ['UNIVERSAL', 'LIVING', 'SKELETON'],
    'STRAY': ['UNIVERSAL', 'LIVING', 'SKELETON'],
    'CREEPER': ['UNIVERSAL', 'LIVING', 'CREEPER'],
    'SPIDER': ['UNIVERSAL', 'LIVING', 'NEUTRAL'],
    'CAVE_SPIDER': ['UNIVERSAL', 'LIVING', 'NEUTRAL'],
    'ENDERMAN': ['UNIVERSAL', 'LIVING', 'NEUTRAL', 'ENDERMAN'],
    'BLAZE': ['UNIVERSAL', 'LIVING'],
    'GHAST': ['UNIVERSAL', 'LIVING'],
    'PHANTOM': ['UNIVERSAL', 'LIVING', 'PHANTOM'],
    'WITCH': ['UNIVERSAL', 'LIVING'],
    'VINDICATOR': ['UNIVERSAL', 'LIVING', 'RAIDER'],
    'EVOKER': ['UNIVERSAL', 'LIVING', 'RAIDER'],
    'PILLAGER': ['UNIVERSAL', 'LIVING', 'RAIDER'],
    'RAVAGER': ['UNIVERSAL', 'LIVING', 'RAIDER'],
    'VEX': ['UNIVERSAL', 'LIVING'],
    'SILVERFISH': ['UNIVERSAL', 'LIVING', 'SILVERFISH'],
    'ENDERMITE': ['UNIVERSAL', 'LIVING'],
    'GUARDIAN': ['UNIVERSAL', 'LIVING'],
    'ELDER_GUARDIAN': ['UNIVERSAL', 'LIVING'],
    'SHULKER': ['UNIVERSAL', 'LIVING', 'COLORABLE'],
    'SLIME': ['UNIVERSAL', 'LIVING', 'SLIME'],
    'MAGMA_CUBE': ['UNIVERSAL', 'LIVING', 'SLIME'],
    'PIGLIN': ['UNIVERSAL', 'LIVING', 'PIGLIN'],
    'PIGLIN_BRUTE': ['UNIVERSAL', 'LIVING', 'PIGLIN_BRUTE'],
    'HOGLIN': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'HOGLIN'],
    'ZOGLIN': ['UNIVERSAL', 'LIVING'],
    'ZOMBIFIED_PIGLIN': ['UNIVERSAL', 'LIVING', 'NEUTRAL', 'ZOMBIE'],
    'WARDEN': ['UNIVERSAL', 'LIVING'],
    
    // Passive Mobs
    'COW': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'COW'],
    'MOOSHROOM': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'COW'],
    'SHEEP': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'COLORABLE', 'SHEEP'],
    'PIG': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'PIG'],
    'CHICKEN': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'CHICKEN'],
    'RABBIT': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'RABBIT'],
    'TURTLE': ['UNIVERSAL', 'LIVING', 'BREEDABLE'],
    'BAT': ['UNIVERSAL', 'LIVING'],
    'SQUID': ['UNIVERSAL', 'LIVING'],
    'GLOW_SQUID': ['UNIVERSAL', 'LIVING'],
    'COD': ['UNIVERSAL', 'LIVING'],
    'SALMON': ['UNIVERSAL', 'LIVING'],
    'PUFFERFISH': ['UNIVERSAL', 'LIVING'],
    'TROPICAL_FISH': ['UNIVERSAL', 'LIVING', 'TROPICAL_FISH'],
    'DOLPHIN': ['UNIVERSAL', 'LIVING', 'NEUTRAL'],
    'VILLAGER': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'VILLAGER'],
    'WANDERING_TRADER': ['UNIVERSAL', 'LIVING', 'VILLAGER'],
    
    // Tameable Mobs
    'WOLF': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'NEUTRAL', 'COLORABLE', 'WOLF'],
    'CAT': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'CAT'],
    'OCELOT': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE'],
    'PARROT': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'COLORABLE', 'PARROT'],
    'HORSE': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'HORSE'],
    'DONKEY': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'DONKEY'],
    'MULE': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'DONKEY'],
    'SKELETON_HORSE': ['UNIVERSAL', 'LIVING', 'TAMEABLE', 'HORSE'],
    'ZOMBIE_HORSE': ['UNIVERSAL', 'LIVING', 'TAMEABLE', 'HORSE'],
    'LLAMA': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'LLAMA'],
    'TRADER_LLAMA': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'LLAMA'],
    
    // Neutral Mobs
    'IRON_GOLEM': ['UNIVERSAL', 'LIVING', 'IRON_GOLEM'],
    'SNOW_GOLEM': ['UNIVERSAL', 'LIVING', 'SNOW_GOLEM'],
    'BEE': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'NEUTRAL', 'BEE'],
    'PANDA': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'NEUTRAL', 'PANDA'],
    'POLAR_BEAR': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'NEUTRAL'],
    'FOX': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'FOX'],
    'AXOLOTL': ['UNIVERSAL', 'LIVING', 'BREEDABLE'],
    'GOAT': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'GOAT'],
    'FROG': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'FROG'],
    'TADPOLE': ['UNIVERSAL', 'LIVING'],
    'ALLAY': ['UNIVERSAL', 'LIVING'],
    'CAMEL': ['UNIVERSAL', 'LIVING', 'BREEDABLE', 'TAMEABLE', 'CAMEL'],
    'SNIFFER': ['UNIVERSAL', 'LIVING', 'BREEDABLE'],
    
    // Boss Mobs
    'ENDER_DRAGON': ['UNIVERSAL', 'LIVING'],
    'WITHER': ['UNIVERSAL', 'LIVING'],
    
    // Special Entities
    'ARMOR_STAND': ['UNIVERSAL', 'ARMOR_STAND'],
    'ITEM_FRAME': ['UNIVERSAL'],
    'GLOW_ITEM_FRAME': ['UNIVERSAL'],
    'PAINTING': ['UNIVERSAL'],
    'BOAT': ['UNIVERSAL', 'BOAT'],
    'CHEST_BOAT': ['UNIVERSAL', 'BOAT'],
    'MINECART': ['UNIVERSAL'],
    'MINECART_CHEST': ['UNIVERSAL', 'MINECART_CHEST'],
    'ITEM': ['UNIVERSAL', 'ITEM'],
    'EXPERIENCE_ORB': ['UNIVERSAL', 'EXPERIENCE_ORB'],
    'FALLING_BLOCK': ['UNIVERSAL', 'FALLING_BLOCK'],
    'TNT': ['UNIVERSAL', 'TNT'],
    'INTERACTION': ['UNIVERSAL', 'INTERACTION'],
    'COPPER_GOLEM': ['UNIVERSAL', 'LIVING', 'COPPER_GOLEM'],
    
    // Display Entities (1.19.4+)
    'BLOCK_DISPLAY': ['UNIVERSAL', 'DISPLAY_BASE', 'DISPLAY_TRANSFORM', 'BLOCK_DISPLAY'],
    'ITEM_DISPLAY': ['UNIVERSAL', 'DISPLAY_BASE', 'DISPLAY_TRANSFORM', 'ITEM_DISPLAY'],
    'TEXT_DISPLAY': ['UNIVERSAL', 'DISPLAY_BASE', 'DISPLAY_TRANSFORM', 'TEXT_DISPLAY']
};

// Entity categories for organized UI
const ENTITY_CATEGORIES = {
    'Hostile': [
        'ZOMBIE', 'ZOMBIE_VILLAGER', 'HUSK', 'DROWNED', 
        'SKELETON', 'WITHER_SKELETON', 'STRAY',
        'CREEPER', 'SPIDER', 'CAVE_SPIDER', 'ENDERMAN',
        'BLAZE', 'GHAST', 'PHANTOM', 'WITCH',
        'VINDICATOR', 'EVOKER', 'PILLAGER', 'RAVAGER', 'VEX',
        'ENDERMITE', 'SILVERFISH', 'GUARDIAN', 'ELDER_GUARDIAN',
        'SHULKER', 'SLIME', 'MAGMA_CUBE',
        'PIGLIN', 'PIGLIN_BRUTE', 'HOGLIN', 'ZOGLIN', 'ZOMBIFIED_PIGLIN',
        'WARDEN'
    ],
    'Passive': [
        'COW', 'MOOSHROOM', 'SHEEP', 'PIG', 'CHICKEN', 'RABBIT', 'TURTLE',
        'BAT', 'SQUID', 'GLOW_SQUID',
        'COD', 'SALMON', 'PUFFERFISH', 'TROPICAL_FISH', 'DOLPHIN',
        'VILLAGER', 'WANDERING_TRADER'
    ],
    'Tameable': [
        'WOLF', 'CAT', 'OCELOT', 'PARROT',
        'HORSE', 'DONKEY', 'MULE', 'SKELETON_HORSE', 'ZOMBIE_HORSE',
        'LLAMA', 'TRADER_LLAMA'
    ],
    'Neutral': [
        'IRON_GOLEM', 'SNOW_GOLEM', 'BEE', 'PANDA', 'POLAR_BEAR',
        'FOX', 'AXOLOTL', 'GOAT', 'FROG', 'TADPOLE', 'ALLAY', 'CAMEL', 'SNIFFER'
    ],
    'Bosses': [
        'ENDER_DRAGON', 'WITHER'
    ],
    'Special': [
        'ARMOR_STAND', 'ITEM_FRAME', 'GLOW_ITEM_FRAME', 'PAINTING', 
        'BOAT', 'CHEST_BOAT', 'MINECART', 'MINECART_CHEST',
        'ITEM', 'EXPERIENCE_ORB', 'FALLING_BLOCK', 'TNT', 'INTERACTION', 'COPPER_GOLEM'
    ],
    'Display Entities': [
        'BLOCK_DISPLAY', 'ITEM_DISPLAY', 'TEXT_DISPLAY'
    ]
};

// Default values for different entity types
const ENTITY_DEFAULTS = {
    'ZOMBIE': { health: 20, damage: 3, movementSpeed: 0.23, armor: 2 },
    'HUSK': { health: 20, damage: 3, movementSpeed: 0.23, armor: 2 },
    'DROWNED': { health: 20, damage: 3, movementSpeed: 0.23, armor: 2 },
    'SKELETON': { health: 20, damage: 4, movementSpeed: 0.25 },
    'CREEPER': { health: 20, explosionRadius: 3, fuseTicks: 30 },
    'SPIDER': { health: 16, damage: 2, movementSpeed: 0.3 },
    'ENDERMAN': { health: 40, damage: 7, movementSpeed: 0.3 },
    'ZOMBIE_VILLAGER': { health: 20, damage: 3, movementSpeed: 0.23 },
    'IRON_GOLEM': { health: 100, damage: 15, movementSpeed: 0.25, knockbackResistance: 1.0 },
    'WITHER': { health: 300, damage: 8, armor: 4 },
    'ENDER_DRAGON': { health: 200, damage: 10 },
    'ARMOR_STAND': { small: false, hasArms: false, hasBasePlate: true, marker: false },
    'SLIME': { health: 16, damage: 4, size: 1 },
    'MAGMA_CUBE': { health: 16, damage: 6, size: 1 },
    'PHANTOM': { health: 20, damage: 6, size: 1 },
    'COW': { health: 10, movementSpeed: 0.2 },
    'SHEEP': { health: 8, movementSpeed: 0.23 },
    'PIG': { health: 10, movementSpeed: 0.25 },
    'CHICKEN': { health: 4, movementSpeed: 0.25 },
    'VILLAGER': { health: 20, movementSpeed: 0.5 },
    'WOLF': { health: 8, damage: 4, movementSpeed: 0.3 },
    'HORSE': { health: 30, movementSpeed: 0.225 },
    
    // Display Entities
    'BLOCK_DISPLAY': { 
        viewRange: 1, width: 0, height: 0, shadowRadius: 0, shadowStrength: 1,
        billboard: 'FIXED', teleportDuration: 0, interpolationDelay: 0, interpolationDuration: 0,
        colorOverride: 0, blockLight: -1, skyLight: -1,
        translation: '0,0,0', scale: '1,1,1', leftRotation: '0,0,0,1', rightRotation: '0,0,0,1'
    },
    'ITEM_DISPLAY': { 
        viewRange: 1, width: 0, height: 0, shadowRadius: 0, shadowStrength: 1,
        billboard: 'FIXED', teleportDuration: 0, interpolationDelay: 0, interpolationDuration: 0,
        colorOverride: 0, blockLight: -1, skyLight: -1,
        translation: '0,0,0', scale: '1,1,1', leftRotation: '0,0,0,1', rightRotation: '0,0,0,1',
        transform: 'NONE'
    },
    'TEXT_DISPLAY': { 
        viewRange: 1, width: 0, height: 0, shadowRadius: 0, shadowStrength: 1,
        billboard: 'FIXED', teleportDuration: 0, interpolationDelay: 0, interpolationDuration: 0,
        colorOverride: 0, blockLight: -1, skyLight: -1,
        translation: '0,0,0', scale: '1,1,1', leftRotation: '0,0,0,1', rightRotation: '0,0,0,1',
        text: 'Give This Poor Dude A Text To Display', opacity: 255, defaultBackground: false,
        backgroundColor: 1073741824, alignment: 'CENTER', lineWidth: 200, shadowed: false, seeThrough: false
    }
};

// === PHASE 1: ADVANCED MOB FEATURES ===

// Faction - AI grouping system
const FACTION_CONFIG = {
    type: 'text',
    label: 'Faction',
    description: 'Groups mobs for AI targeting. By default, players with permission faction.(name) are in the faction.',
    placeholder: 'e.g., Monsters, Guards, Goblins',
    category: 'Advanced'
};

// BossBar configuration
const BOSSBAR_CONFIG = {
    enabled: false,
    title: '[name]',
    range: 50,
    color: 'PURPLE',
    style: 'SOLID',
    createFog: false,
    darkenSky: false,
    playMusic: false
};

// Equipment slots (6 slots)
const EQUIPMENT_CONFIG = {
    slots: ['HEAD', 'CHEST', 'LEGS', 'FEET', 'HAND', 'OFFHAND'],
    // Each slot can have: item name, inline attributes, or MMOItems reference
    default: {}
};

// DamageModifiers - damage type multipliers
const DAMAGE_MODIFIERS_CONFIG = {
    // Keys are damage types from DAMAGE_TYPES array
    // Values: >1 multiply, <1 reduce, 0 immune, <0 heal
    default: {}
};

// KillMessages - array of custom death messages
const KILL_MESSAGES_CONFIG = {
    type: 'array',
    label: 'Kill Messages',
    description: 'Custom messages when a player is killed. Use <target.name> and <caster.name> placeholders.',
    placeholder: '<target.name> was slain by <caster.name>',
    default: []
};
