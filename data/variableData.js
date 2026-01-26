/**
 * MythicMobs Variable System Data
 * Complete definitions for variable types, scopes, operations, and meta keywords
 * Based on official MythicMobs documentation
 * https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Skills/Variables
 */

const VARIABLE_TYPES = [
    {
        id: 'INTEGER',
        name: 'Integer',
        icon: 'fa-hashtag',
        color: '#3b82f6',
        description: 'A whole number with no decimal places. Most common type for counters and damage values.',
        examples: ['0', '42', '-100', '<random.1to10>', '<caster.level>'],
        defaultValue: '0',
        inputType: 'number',
        inputStep: 1,
        supportsMath: true,
        yamlPrefix: 'int/',
        metaKeywords: ['add', 'sub', 'mul', 'div', 'abs', 'toFloat', 'toString']
    },
    {
        id: 'FLOAT',
        name: 'Float',
        icon: 'fa-percentage',
        color: '#8b5cf6',
        description: 'A decimal number for precise values like percentages and multipliers.',
        examples: ['0.5', '1.75', '<caster.hp>', '<caster.php>'],
        defaultValue: '0.0',
        inputType: 'number',
        inputStep: 0.1,
        supportsMath: true,
        yamlPrefix: 'float/',
        metaKeywords: ['add', 'sub', 'mul', 'div', 'abs', 'round', 'precision', 'toInteger', 'toString']
    },
    {
        id: 'LONG',
        name: 'Long',
        icon: 'fa-clock',
        color: '#06b6d4',
        description: 'A large whole number, commonly used for timestamps and epoch time.',
        examples: ['0', '<utils.epoch>', '<utils.epoch.timestamp>'],
        defaultValue: '0',
        inputType: 'number',
        inputStep: 1,
        supportsMath: true,
        yamlPrefix: 'long/',
        metaKeywords: ['add', 'sub', 'mul', 'div', 'abs', 'toTime', 'toString']
    },
    {
        id: 'DOUBLE',
        name: 'Double',
        icon: 'fa-calculator',
        color: '#14b8a6',
        description: 'A large decimal number for high-precision calculations.',
        examples: ['0.0', '3.14159265359', '<caster.l.x.double>'],
        defaultValue: '0.0',
        inputType: 'number',
        inputStep: 0.001,
        supportsMath: true,
        yamlPrefix: 'double/',
        metaKeywords: ['add', 'sub', 'mul', 'div', 'abs', 'round', 'precision', 'toFloat', 'toString']
    },
    {
        id: 'STRING',
        name: 'String',
        icon: 'fa-font',
        color: '#f59e0b',
        description: 'Text values for names, phases, states, and messages.',
        examples: ['idle', 'phase_1', 'yes', '<caster.name>', '&cRed Text'],
        defaultValue: '',
        inputType: 'text',
        supportsMath: false,
        yamlPrefix: '',
        metaKeywords: ['size', 'uppercase', 'lowercase', 'capitalize', 'trim', 'replace', 'contains', 'substring', 'append', 'prepend']
    },
    {
        id: 'BOOLEAN',
        name: 'Boolean',
        icon: 'fa-toggle-on',
        color: '#10b981',
        description: 'True or false values for flags and toggles.',
        examples: ['true', 'false', 'yes', 'no'],
        defaultValue: 'false',
        inputType: 'toggle',
        supportsMath: false,
        yamlPrefix: 'boolean/',
        metaKeywords: ['inverse', 'number', 'yesno', 'union', 'intersection', 'difference']
    },
    {
        id: 'SET',
        name: 'Set',
        icon: 'fa-tags',
        color: '#ec4899',
        description: 'A collection of unique unordered values. Duplicates are automatically removed.',
        examples: ['fire,ice,lightning', '<caster.uuid>'],
        defaultValue: '',
        inputType: 'list',
        supportsMath: false,
        yamlPrefix: 'set/',
        metaKeywords: ['size', 'join', 'contains', 'toList']
    },
    {
        id: 'LIST',
        name: 'List',
        icon: 'fa-list',
        color: '#f97316',
        description: 'An ordered collection of values that can contain duplicates.',
        examples: ['item1,item2,item3', '<target.uuid>'],
        defaultValue: '',
        inputType: 'list',
        supportsMath: false,
        yamlPrefix: 'list/',
        metaKeywords: ['size', 'first', 'last', 'reverse', 'sort', 'shuffle', 'get', 'join', 'contains', 'append', 'prepend', 'remove', 'toSet']
    },
    {
        id: 'MAP',
        name: 'Map',
        icon: 'fa-database',
        color: '#a855f7',
        description: 'Key-value pairs for storing structured data.',
        examples: ['damage=10,speed=1.5', 'phase=1,active=true'],
        defaultValue: '',
        inputType: 'keyvalue',
        supportsMath: false,
        yamlPrefix: 'map/',
        metaKeywords: ['size', 'keys', 'values', 'get']
    },
    {
        id: 'LOCATION',
        name: 'Location',
        icon: 'fa-map-marker-alt',
        color: '#ef4444',
        description: 'A world location with coordinates, yaw, and pitch. Use with setVariableLocation.',
        examples: ['world,100,64,200', '<caster.location>'],
        defaultValue: '',
        inputType: 'location',
        supportsMath: false,
        yamlPrefix: 'location/',
        metaKeywords: ['x', 'y', 'z', 'world', 'yaw', 'pitch', 'coords']
    },
    {
        id: 'VECTOR',
        name: 'Vector',
        icon: 'fa-arrows-alt',
        color: '#6366f1',
        description: 'A 3D direction with X, Y, Z components for movement and forces.',
        examples: ['0,1,0', '1.5,0,-0.5'],
        defaultValue: '0,0,0',
        inputType: 'vector',
        supportsMath: true,
        yamlPrefix: 'vector/',
        metaKeywords: ['x', 'y', 'z', 'normalized', 'length', 'mul', 'div', 'add', 'sub', 'rotate']
    },
    {
        id: 'TIME',
        name: 'Time',
        icon: 'fa-hourglass-half',
        color: '#84cc16',
        description: 'Epoch timestamp for tracking time-based events and cooldowns.',
        examples: ['<utils.epoch>', '<utils.epoch.timestamp>'],
        defaultValue: '<utils.epoch>',
        inputType: 'time',
        supportsMath: false,
        yamlPrefix: 'time/',
        metaKeywords: ['delta', 'formatted', 'duration']
    },
    {
        id: 'METASKILL',
        name: 'MetaSkill',
        icon: 'fa-bolt',
        color: '#9333ea',
        description: 'An inline skill definition that can be executed dynamically.',
        examples: ['[ - damage{a=10} @target ]', '[ - effect:particles ]'],
        defaultValue: '[]',
        inputType: 'skill',
        supportsMath: false,
        yamlPrefix: 'skill/',
        metaKeywords: []
    },
    {
        id: 'ITEM',
        name: 'Item',
        icon: 'fa-cube',
        color: '#78716c',
        description: 'An ItemStack with material, enchantments, lore, and NBT data.',
        examples: ['DIAMOND_SWORD', 'slot:HAND', 'mythic:MySword'],
        defaultValue: 'AIR',
        inputType: 'item',
        supportsMath: false,
        yamlPrefix: 'item/',
        metaKeywords: ['type', 'durability', 'name', 'lore', 'enchants', 'amount', 'withType', 'withName', 'withLore']
    }
];

const VARIABLE_SCOPES = [
    {
        id: 'SKILL',
        name: 'Skill',
        icon: 'fa-bolt',
        color: '#f59e0b',
        prefix: 'skill.',
        description: 'Temporary variable that exists only during the current skill tree execution. Automatically removed when skill completes.',
        persistent: false,
        supportsExpiry: false,
        supportsSave: false,
        examples: [
            'Temporary calculations',
            'Loop counters',
            'Passing data between skill lines',
            'Skill parameters'
        ],
        tips: [
            'Fastest scope - no persistence overhead',
            'Perfect for math calculations within a skill',
            'Cannot be accessed by other skills or skill trees'
        ]
    },
    {
        id: 'CASTER',
        name: 'Caster',
        icon: 'fa-skull',
        color: '#ef4444',
        prefix: 'caster.',
        description: 'Stored on the casting mob until death or despawn. Most common scope for boss mechanics.',
        persistent: true,
        supportsExpiry: true,
        supportsSave: true,
        examples: [
            'Boss phase tracking (phase=1, phase=2)',
            'Damage counters and rage stacks',
            'Ability cooldown tracking',
            'Combo counters'
        ],
        tips: [
            'Survives across multiple skill executions',
            'Can be saved across server restarts with save=true',
            'Duration attribute sets automatic expiry'
        ]
    },
    {
        id: 'TARGET',
        name: 'Target',
        icon: 'fa-crosshairs',
        color: '#10b981',
        prefix: 'target.',
        description: 'Stored on the target entity. Useful for debuffs, marks, and tracking target-specific data.',
        persistent: true,
        supportsExpiry: true,
        supportsSave: true,
        examples: [
            'Debuff stacks on players',
            'Mark targets for special attacks',
            'Track damage dealt to specific targets',
            'Temporary exclusion flags'
        ],
        tips: [
            'Applied to whoever is targeted by the mechanic',
            'Great for DoT tracking and debuff systems',
            'Use with duration for temporary effects'
        ]
    },
    {
        id: 'WORLD',
        name: 'World',
        icon: 'fa-globe',
        color: '#3b82f6',
        prefix: 'world.',
        description: 'Stored per-world. Shared across all entities in that world. Cleared on server restart.',
        persistent: true,
        supportsExpiry: true,
        supportsSave: true,
        examples: [
            'World events (blood moon active)',
            'Day/night cycle tracking',
            'World boss spawned flag',
            'Per-world kill counters'
        ],
        tips: [
            'Shared by all mobs in the same world',
            'Good for world-wide events and states',
            'Cleared when server restarts unless saved'
        ]
    },
    {
        id: 'GLOBAL',
        name: 'Global',
        icon: 'fa-server',
        color: '#9333ea',
        prefix: 'global.',
        description: 'Server-wide storage. Shared across all worlds and entities. Cleared on server restart.',
        persistent: true,
        supportsExpiry: true,
        supportsSave: true,
        examples: [
            'Server-wide boss kill counter',
            'Global event flags',
            'Cross-world data sharing',
            'Server statistics'
        ],
        tips: [
            'Shared by all mobs on the entire server',
            'Use sparingly - accessible everywhere',
            'Great for server-wide achievements and events'
        ]
    }
];

const VARIABLE_OPERATIONS = {
    setVariable: {
        id: 'setvariable',
        name: 'SetVariable',
        aliases: ['var', 'setvar'],
        description: 'Creates or updates a variable with the specified value. The most common variable operation.',
        category: 'meta',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name in scope.name format (e.g., caster.phase)' },
            { name: 'value', alias: ['val'], type: 'string', required: true, description: 'Value to set. Supports placeholders and math expressions.' },
            { name: 'type', alias: ['t'], type: 'variableType', default: 'INTEGER', description: 'Variable type (INTEGER, FLOAT, STRING, etc.)' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope if not specified in var name' },
            { name: 'save', alias: [], type: 'boolean', default: false, description: 'Persist variable across server restarts' },
            { name: 'duration', alias: ['d'], type: 'number', default: 0, description: 'Auto-remove after this many ticks (0 = never)' }
        ],
        defaultTargeter: '@Self',
        examples: [
            { code: '- setvariable{var=caster.phase;value=1;type=INTEGER}', description: 'Set integer phase to 1' },
            { code: '- setvariable{var=caster.damage;value=<random.5to15>;type=INTEGER}', description: 'Random damage value' },
            { code: '- setvariable{var=target.marked;value=true;type=BOOLEAN;duration=100}', description: 'Mark target for 5 seconds' },
            { code: '- setvariable{var=caster.hp_percent;value="<caster.hp> / <caster.mhp>";type=FLOAT}', description: 'Calculate HP percentage' }
        ]
    },
    variableAdd: {
        id: 'variableadd',
        name: 'VariableAdd',
        aliases: ['varadd', 'addvar'],
        description: 'Adds a value to an existing numeric variable.',
        category: 'meta',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name in scope.name format' },
            { name: 'amount', alias: ['a', 'value', 'val'], type: 'number', default: 1, description: 'Amount to add' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope if not specified in var name' }
        ],
        defaultTargeter: '@Self',
        examples: [
            { code: '- variableadd{var=caster.combo;amount=1}', description: 'Increment combo counter' },
            { code: '- variableadd{var=caster.rage;amount=<damage>}', description: 'Add damage dealt to rage' }
        ]
    },
    variableSubtract: {
        id: 'variablesubtract',
        name: 'VariableSubtract',
        aliases: ['varsub', 'subvar'],
        description: 'Subtracts a value from an existing numeric variable.',
        category: 'meta',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name in scope.name format' },
            { name: 'amount', alias: ['a', 'value', 'val'], type: 'number', default: 1, description: 'Amount to subtract' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope if not specified in var name' }
        ],
        defaultTargeter: '@Self',
        examples: [
            { code: '- variablesubtract{var=caster.stacks;amount=1}', description: 'Decrement stack counter' },
            { code: '- variablesubtract{var=caster.mana;amount=25}', description: 'Reduce mana by 25' }
        ]
    },
    variableMath: {
        id: 'variablemath',
        name: 'VariableMath',
        aliases: ['varmath', 'mathvar'],
        description: 'Performs a math equation and stores the result in a variable.',
        category: 'meta',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name to store result' },
            { name: 'equation', alias: ['eq', 'e'], type: 'string', required: true, description: 'Math equation to evaluate' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope if not specified in var name' }
        ],
        defaultTargeter: '@Self',
        examples: [
            { code: '- variablemath{var=caster.damage;equation="<caster.var.base_damage> * 1.5"}', description: 'Calculate boosted damage' },
            { code: '- variablemath{var=caster.hp_percent;equation="(<caster.hp> / <caster.mhp>) * 100"}', description: 'HP as percentage' }
        ]
    },
    setVariableLocation: {
        id: 'setvariablelocation',
        name: 'SetVariableLocation',
        aliases: ['varloc', 'setloc'],
        description: 'Stores the target location in a LOCATION type variable.',
        category: 'meta',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name to store location' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope if not specified in var name' },
            { name: 'save', alias: [], type: 'boolean', default: false, description: 'Persist location across restarts' },
            { name: 'duration', alias: ['d'], type: 'number', default: 0, description: 'Auto-remove after ticks (0 = never)' }
        ],
        defaultTargeter: '@TargetLocation',
        examples: [
            { code: '- setvariablelocation{var=caster.spawn_point} @self', description: 'Store spawn location' },
            { code: '- setvariablelocation{var=caster.target_pos} @target', description: 'Store target position' }
        ]
    },
    variableUnset: {
        id: 'variableunset',
        name: 'VariableUnset',
        aliases: ['varunset', 'unsetvar', 'delvar'],
        description: 'Removes/deletes a variable completely.',
        category: 'meta',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name to remove' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope if not specified in var name' }
        ],
        defaultTargeter: '@Self',
        examples: [
            { code: '- variableunset{var=caster.phase_1}', description: 'Remove phase 1 flag' },
            { code: '- variableunset{var=target.marked}', description: 'Remove mark from target' }
        ]
    },
    variableMove: {
        id: 'variablemove',
        name: 'VariableMove',
        aliases: ['movevar', 'moveVariable'],
        description: 'Moves or copies a variable to a new location/scope.',
        category: 'meta',
        attributes: [
            { name: 'from', alias: ['f'], type: 'string', required: true, description: 'Source variable (scope.name)' },
            { name: 'to', alias: ['t'], type: 'string', required: true, description: 'Target variable (scope.name)' },
            { name: 'removeOld', alias: [], type: 'boolean', default: false, description: 'Remove the source variable' },
            { name: 'createNew', alias: [], type: 'boolean', default: false, description: 'Create new variable at target' },
            { name: 'inheritExpirationTime', alias: [], type: 'boolean', default: true, description: 'Keep expiration time on copy' }
        ],
        defaultTargeter: '@Self',
        examples: [
            { code: '- variablemove{from=caster.item;to=skill.item}', description: 'Move item to skill scope' },
            { code: '- variablemove{from=caster.old;to=caster.new;removeOld=true}', description: 'Rename variable' }
        ]
    },
    variableSkill: {
        id: 'variableskill',
        name: 'VariableSkill',
        aliases: ['vskill', 'skillvar'],
        description: 'Executes a skill stored in a METASKILL variable.',
        category: 'meta',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'skill', 's'], type: 'string', required: true, description: 'Variable containing the skill' },
            { name: 'scope', alias: [], type: 'variableScope', default: '', description: 'Variable scope if not specified' }
        ],
        defaultTargeter: '@Self',
        examples: [
            { code: '- variableskill{var=caster.stored_skill}', description: 'Execute stored skill' },
            { code: '- variableskill{var=skill.dynamic_attack}', description: 'Execute dynamic attack' }
        ]
    }
};

const VARIABLE_CONDITIONS = {
    variableEquals: {
        id: 'variableEquals',
        aliases: ['varEquals', 'varEq'],
        description: 'Checks if a variable equals a specific value.',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name to check' },
            { name: 'value', alias: ['val'], type: 'string', required: true, description: 'Value to compare against' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope' }
        ],
        examples: [
            { code: '- variableEquals{var=caster.phase;value=2}', description: 'Check if phase is 2' },
            { code: '- variableEquals{var=target.marked;value=true}', description: 'Check if target is marked' }
        ]
    },
    variableIsSet: {
        id: 'variableIsSet',
        aliases: ['varIsSet', 'varSet'],
        description: 'Checks if a variable exists/is set.',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name to check' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope' }
        ],
        examples: [
            { code: '- variableIsSet{var=caster.initialized}', description: 'Check if mob initialized' },
            { code: '- variableIsSet{var=target.debuff} false', description: 'Check if no debuff' }
        ]
    },
    variableInRange: {
        id: 'variableInRange',
        aliases: ['varInRange', 'varRange'],
        description: 'Checks if a numeric variable is within a range.',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name to check' },
            { name: 'value', alias: ['val', 'range', 'r'], type: 'string', required: true, description: 'Range in "min to max" or single value format' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope' }
        ],
        examples: [
            { code: '- variableInRange{var=caster.health;value=0 to 50}', description: 'Health between 0-50' },
            { code: '- variableInRange{var=caster.stacks;value=5}', description: 'At least 5 stacks' }
        ]
    },
    variableContains: {
        id: 'variableContains',
        aliases: ['varContains'],
        description: 'Checks if a collection variable (SET/LIST/MAP) contains a value.',
        attributes: [
            { name: 'var', alias: ['variable', 'v', 'name', 'n'], type: 'string', required: true, description: 'Variable name to check' },
            { name: 'value', alias: ['val', 'element', 'e'], type: 'string', required: true, description: 'Value to search for' },
            { name: 'scope', alias: ['s'], type: 'variableScope', default: '', description: 'Variable scope' }
        ],
        examples: [
            { code: '- variableContains{var=caster.buffs;value=fire_resistance}', description: 'Has fire resistance' },
            { code: '- variableContains{var=caster.hit_players;value=<trigger.uuid>}', description: 'Already hit this player' }
        ]
    }
};

// Variable placeholder templates for quick insertion
const VARIABLE_PLACEHOLDERS = {
    caster: '<caster.var.{name}>',
    target: '<target.var.{name}>',
    trigger: '<trigger.var.{name}>',
    skill: '<skill.var.{name}>',
    world: '<world.var.{name}>',
    global: '<global.var.{name}>'
};

// Common variable patterns from real-world usage
const VARIABLE_PATTERNS = [
    {
        id: 'phase_tracking',
        name: 'Phase Tracking',
        description: 'Track boss phases with boolean flags',
        variables: [
            { name: 'phase_1', type: 'STRING', value: 'yes', scope: 'CASTER' },
            { name: 'phase_2', type: 'STRING', value: 'no', scope: 'CASTER' },
            { name: 'phase_3', type: 'STRING', value: 'no', scope: 'CASTER' }
        ],
        skills: [
            '- setvariable{var=caster.phase_1;value="yes";type=STRING}',
            '- variableunset{var=caster.phase_1}',
            '- setvariable{var=caster.phase_2;value="yes";type=STRING}'
        ]
    },
    {
        id: 'damage_counter',
        name: 'Damage Counter',
        description: 'Track and display damage dealt',
        variables: [
            { name: 'hp_before', type: 'FLOAT', value: '<caster.hp>', scope: 'CASTER' },
            { name: 'actual_damage', type: 'INTEGER', value: '0', scope: 'CASTER' }
        ],
        skills: [
            '- setvariable{var=caster.hp_before;value="<caster.hp>";type=FLOAT}',
            '- delay 1',
            '- setvariable{var=caster.actual_damage;value="<caster.var.hp_before> - <caster.hp>";type=INTEGER}'
        ]
    },
    {
        id: 'combo_system',
        name: 'Combo System',
        description: 'Track attack combos with timeout',
        variables: [
            { name: 'combo', type: 'INTEGER', value: '0', scope: 'CASTER' },
            { name: 'combo_timer', type: 'LONG', value: '<utils.epoch>', scope: 'CASTER' }
        ],
        skills: [
            '- variableadd{var=caster.combo;amount=1}',
            '- setvariable{var=caster.combo_timer;value=<utils.epoch>;type=LONG}'
        ]
    },
    {
        id: 'player_scaling',
        name: 'Player Count Scaling',
        description: 'Scale damage based on nearby players',
        variables: [
            { name: 'base_damage', type: 'INTEGER', value: '10', scope: 'CASTER' },
            { name: 'player_mult', type: 'FLOAT', value: '1.0', scope: 'CASTER' },
            { name: 'final_damage', type: 'INTEGER', value: '10', scope: 'CASTER' }
        ],
        skills: [
            '- setvariable{var=caster.player_mult;value="1 + (<caster.tt.size> * 0.1)";type=FLOAT}',
            '- variablemath{var=caster.final_damage;equation="<caster.var.base_damage> * <caster.var.player_mult>"}'
        ]
    },
    {
        id: 'temporary_mark',
        name: 'Temporary Mark',
        description: 'Mark targets temporarily for special handling',
        variables: [
            { name: 'marked', type: 'STRING', value: 'yes', scope: 'TARGET' }
        ],
        skills: [
            '- setvariable{var=target.marked;value="yes";type=STRING;duration=100}',
            '# In conditions:',
            '- variableEquals{var=target.marked;value="yes"}'
        ]
    },
    {
        id: 'health_preservation',
        name: 'Health Preservation',
        description: 'Preserve health percentage across max health changes',
        variables: [
            { name: 'health_percent', type: 'FLOAT', value: '1.0', scope: 'CASTER' }
        ],
        skills: [
            '- setvariable{var=caster.health_percent;value="<caster.hp> / <caster.mhp>";type=FLOAT}',
            '# After max health change:',
            '- sethealth{a="<caster.var.health_percent> * <caster.mhp>"}'
        ]
    }
];

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.VARIABLE_TYPES = VARIABLE_TYPES;
    window.VARIABLE_SCOPES = VARIABLE_SCOPES;
    window.VARIABLE_OPERATIONS = VARIABLE_OPERATIONS;
    window.VARIABLE_CONDITIONS = VARIABLE_CONDITIONS;
    window.VARIABLE_PLACEHOLDERS = VARIABLE_PLACEHOLDERS;
    window.VARIABLE_PATTERNS = VARIABLE_PATTERNS;
}
