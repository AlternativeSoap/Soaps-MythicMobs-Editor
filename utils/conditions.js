/**
 * Comprehensive MythicMobs Conditions Database
 * Based on official MythicMobs wiki documentation
 */

const CONDITIONS_DATA = {
    ENTITY: [
        { name: 'entityType', description: 'Checks entity type', params: ['types'] },
        { name: 'health', description: 'Checks health value/percentage', params: ['amount', 'mode'] },
        { name: 'healthPercent', description: 'Checks health percentage', params: ['percent'] },
        { name: 'inBlock', description: 'Checks if in block type', params: ['material'] },
        { name: 'inCombat', description: 'Checks if in combat', params: [] },
        { name: 'stance', description: 'Checks mob stance', params: ['stance'] },
        { name: 'hasAura', description: 'Checks for aura', params: ['auraName'] },
        { name: 'burning', description: 'Checks if on fire', params: [] },
        { name: 'frozen', description: 'Checks if frozen', params: [] },
        { name: 'gliding', description: 'Checks if gliding', params: [] },
        { name: 'hasgravity', description: 'Checks gravity state', params: [] },
        { name: 'haspotioneffect', description: 'Checks potion effect', params: ['type', 'level'] },
        { name: 'mounted', description: 'Checks if riding', params: [] },
        { name: 'owner', description: 'Checks if owned by target', params: [] }
    ],
    LOCATION: [
        { name: 'biome', description: 'Checks biome type', params: ['biomes'] },
        { name: 'light', description: 'Checks light level', params: ['level'] },
        { name: 'lightLevel', description: 'Checks block light level', params: ['level'] },
        { name: 'skylight', description: 'Checks sky light level', params: ['level'] },
        { name: 'height', description: 'Checks Y coordinate', params: ['y'] },
        { name: 'distance', description: 'Checks distance to target', params: ['distance'] },
        { name: 'region', description: 'Checks WorldGuard region', params: ['region'] },
        { name: 'altitude', description: 'Checks altitude', params: ['min', 'max'] },
        { name: 'inregion', description: 'Checks if in region', params: ['region'] },
        { name: 'onBlock', description: 'Checks block beneath', params: ['material'] },
        { name: 'blockType', description: 'Checks block at location', params: ['material'] }
    ],
    WORLD: [
        { name: 'time', description: 'Checks world time', params: ['time'] },
        { name: 'weather', description: 'Checks weather type', params: ['type'] },
        { name: 'playersInRadius', description: 'Checks player count nearby', params: ['radius', 'amount'] },
        { name: 'mobsInRadius', description: 'Checks mob count nearby', params: ['radius', 'amount'] },
        { name: 'thunder', description: 'Checks if thundering', params: [] },
        { name: 'raining', description: 'Checks if raining', params: [] },
        { name: 'worldTime', description: 'Checks world time', params: ['min', 'max'] },
        { name: 'outside', description: 'Checks if outside', params: [] }
    ],
    PLAYER: [
        { name: 'permission', description: 'Checks player permission', params: ['permission'] },
        { name: 'level', description: 'Checks player level', params: ['level'] },
        { name: 'experience', description: 'Checks player XP', params: ['amount'] },
        { name: 'money', description: 'Checks economy balance', params: ['amount'] },
        { name: 'wearing', description: 'Checks equipped item', params: ['item', 'slot'] },
        { name: 'hasItem', description: 'Checks inventory for item', params: ['item', 'amount'] },
        { name: 'holding', description: 'Checks held item', params: ['item'] },
        { name: 'offhand', description: 'Checks offhand item', params: ['item'] },
        { name: 'food', description: 'Checks food level', params: ['level'] },
        { name: 'gameMode', description: 'Checks game mode', params: ['mode'] },
        { name: 'sneaking', description: 'Checks if sneaking', params: [] },
        { name: 'sprinting', description: 'Checks if sprinting', params: [] },
        { name: 'blocking', description: 'Checks if blocking', params: [] },
        { name: 'flying', description: 'Checks if flying', params: [] }
    ],
    FACTION: [
        { name: 'faction', description: 'Checks faction', params: ['faction'] },
        { name: 'sameFaction', description: 'Checks if same faction', params: [] },
        { name: 'notSameFaction', description: 'Checks if different faction', params: [] },
        { name: 'factionSize', description: 'Checks faction member count', params: ['amount'] }
    ],
    SCORE: [
        { name: 'score', description: 'Checks scoreboard score', params: ['objective', 'value'] },
        { name: 'hasTag', description: 'Checks entity tag', params: ['tag'] },
        { name: 'worldScore', description: 'Checks world score', params: ['objective', 'value'] },
        { name: 'variableInRange', description: 'Checks variable range', params: ['variable', 'min', 'max'] },
        { name: 'variableEquals', description: 'Checks variable value', params: ['variable', 'value'] }
    ]
};

const ALL_CONDITIONS = Object.values(CONDITIONS_DATA).flat();

const CONDITION_CATEGORIES = Object.keys(CONDITIONS_DATA);

// Legacy export for backward compatibility
const Conditions = {
    ENTITY: CONDITIONS_DATA.ENTITY.map(c => c.name),
    LOCATION: CONDITIONS_DATA.LOCATION.map(c => c.name),
    WORLD: CONDITIONS_DATA.WORLD.map(c => c.name),
    PLAYER: CONDITIONS_DATA.PLAYER.map(c => c.name)
};

window.Conditions = Conditions;
window.CONDITIONS_DATA = CONDITIONS_DATA;
window.ALL_CONDITIONS = ALL_CONDITIONS;
window.CONDITION_CATEGORIES = CONDITION_CATEGORIES;
