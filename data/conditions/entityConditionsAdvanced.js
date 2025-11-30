/**
 * MythicMobs Entity Conditions (Part 2)
 * Advanced entity conditions that check more complex entity properties
 * Based on official MythicMobs documentation
 */

const ENTITY_CONDITIONS_ADVANCED = [
    {
        id: 'hasPotionEffect',
        name: 'Has Potion Effect',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity has a potion effect',
        aliases: ['haspotion'],
        attributes: [
            {
                name: 'type',
                aliases: ['effect', 't', 'e'],
                type: 'text',
                required: true,
                description: 'The potion effect type',
                placeholder: 'SPEED',
                validation: 'potion_effect'
            },
            {
                name: 'level',
                aliases: ['amplifier', 'lvl', 'l', 'a'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'The potion effect level/amplifier',
                placeholder: '>=2',
                validation: 'number_range'
            },
            {
                name: 'duration',
                aliases: ['dur', 'd'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'The remaining duration in ticks',
                placeholder: '>100',
                validation: 'number_range'
            }
        ],
        examples: [
            'haspotioneffect{type=SPEED} true',
            'haspotion{e=POISON;l=>1;d=>100} true'
        ]
    },
    {
        id: 'hasTag',
        name: 'Has Tag',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target has a scoreboard tag',
        aliases: ['scoretag'],
        attributes: [
            {
                name: 'tag',
                aliases: ['t'],
                type: 'text',
                required: true,
                description: 'The tag to check for',
                placeholder: 'special_mob',
                validation: 'text'
            }
        ],
        examples: [
            'hastag{tag=special_mob} true',
            'scoretag{t=elite} true'
        ]
    },
    {
        id: 'health',
        name: 'Health',
        category: 'Entity',
        type: 'entity',
        description: 'Tests the health of the target entity. Supports ranged values',
        aliases: ['hp'],
        attributes: [
            {
                name: 'health',
                aliases: ['h'],
                type: 'range',
                required: true,
                description: 'The health to check for',
                placeholder: '>100',
                validation: 'number_range'
            },
            {
                name: 'includeabsorption',
                aliases: ['abs', 'a'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether to include absorption hearts in health calculation',
                validation: 'boolean'
            }
        ],
        examples: [
            'health{h=>100} true',
            'hp{health=1-50;abs=true} true'
        ]
    },
    {
        id: 'healthPercent',
        name: 'Health Percent',
        category: 'Entity',
        type: 'entity',
        description: 'Checks the target\'s health as a percentage of max health',
        aliases: ['hpp'],
        attributes: [
            {
                name: 'percent',
                aliases: ['p'],
                type: 'range',
                required: true,
                description: 'The health percentage (0-100)',
                placeholder: '<50',
                validation: 'number_range'
            },
            {
                name: 'includeabsorption',
                aliases: ['abs', 'a'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether to include absorption hearts in health calculation',
                validation: 'boolean'
            }
        ],
        examples: [
            'healthpercent{p=<50} true',
            'hpp{percent=>75;abs=true} true'
        ]
    },
    {
        id: 'height',
        name: 'Height',
        category: 'Entity',
        type: 'entity',
        description: 'Checks the height (in blocks) of the entity\'s hitbox',
        aliases: [],
        attributes: [
            {
                name: 'height',
                aliases: ['h'],
                type: 'range',
                required: true,
                description: 'The height to check for',
                placeholder: '>2',
                validation: 'number_range'
            }
        ],
        examples: [
            'height{h=>2} true',
            'height{height=1-3} true'
        ]
    },
    {
        id: 'inBlock',
        name: 'In Block',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target\'s feet are within a certain block type',
        aliases: ['standingIn'],
        attributes: [
            {
                name: 'material',
                aliases: ['m', 'mat', 'materials'],
                type: 'text',
                required: true,
                description: 'The material to check for (comma-separated for multiple)',
                placeholder: 'WATER',
                validation: 'material'
            }
        ],
        examples: [
            'inblock{m=WATER} true',
            'standingIn{materials=LAVA,FIRE} true'
        ]
    },
    {
        id: 'inCombat',
        name: 'In Combat',
        category: 'Entity',
        type: 'entity',
        description: 'Whether the target mob is considered in combat',
        aliases: [],
        attributes: [],
        examples: [
            'incombat true',
            'incombat false'
        ]
    },
    {
        id: 'inRegion',
        name: 'In Region',
        category: 'Entity',
        type: 'entity',
        description: 'If the target is within the given WorldGuard region',
        aliases: ['region'],
        attributes: [
            {
                name: 'region',
                aliases: ['r'],
                type: 'text',
                required: true,
                description: 'The WorldGuard region name',
                placeholder: 'spawn',
                validation: 'text'
            }
        ],
        examples: [
            'inregion{region=spawn} true',
            'region{r=arena} true'
        ]
    },
    {
        id: 'inWater',
        name: 'In Water',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target entity is in water',
        aliases: [],
        attributes: [],
        examples: [
            'inwater true',
            'inwater false'
        ]
    },
    {
        id: 'isChild',
        name: 'Is Child',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target mob is a baby/child variant',
        aliases: ['baby'],
        attributes: [],
        examples: [
            'ischild true',
            'baby true'
        ]
    },
    {
        id: 'isLiving',
        name: 'Is Living',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target entity is a living entity',
        aliases: ['living'],
        attributes: [],
        examples: [
            'isliving true',
            'living false'
        ]
    },
    {
        id: 'isMonster',
        name: 'Is Monster',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target entity is a monster',
        aliases: ['monster'],
        attributes: [],
        examples: [
            'ismonster true',
            'monster true'
        ]
    },
    {
        id: 'isPlayer',
        name: 'Is Player',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target entity is a player',
        aliases: ['player'],
        attributes: [],
        examples: [
            'isplayer true',
            'player false'
        ]
    },
    {
        id: 'isSpawner',
        name: 'Is Spawner',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target MythicMob was spawned by a MythicMobs spawner',
        aliases: ['spawner'],
        attributes: [],
        examples: [
            'isspawner true',
            'spawner false'
        ]
    },
    {
        id: 'isTamed',
        name: 'Is Tamed',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target mob is tamed',
        aliases: ['tamed'],
        attributes: [],
        examples: [
            'istamed true',
            'tamed false'
        ]
    },
    {
        id: 'lastDamageCause',
        name: 'Last Damage Cause',
        category: 'Entity',
        type: 'entity',
        description: 'Tests the target\'s last damage cause',
        aliases: ['ldc'],
        attributes: [
            {
                name: 'cause',
                aliases: ['c', 'causes'],
                type: 'text',
                required: true,
                description: 'The damage cause to check for (comma-separated for multiple)',
                placeholder: 'FIRE',
                validation: 'damage_cause'
            }
        ],
        examples: [
            'lastdamagecause{cause=FIRE} true',
            'ldc{causes=FALL,LAVA} true'
        ]
    },
    {
        id: 'level',
        name: 'Level',
        category: 'Entity',
        type: 'entity',
        description: 'Checks the target MythicMob\'s level',
        aliases: ['lvl', 'mlevel'],
        attributes: [
            {
                name: 'level',
                aliases: ['l'],
                type: 'range',
                required: true,
                description: 'The level to check for',
                placeholder: '>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'level{l=>5} true',
            'mlevel{level=1-10} true'
        ]
    },
    {
        id: 'lightLevel',
        name: 'Light Level',
        category: 'Entity',
        type: 'entity',
        description: 'Tests the light level at the target entity\'s location',
        aliases: ['ll'],
        attributes: [
            {
                name: 'level',
                aliases: ['l'],
                type: 'range',
                required: true,
                description: 'The light level to check for (0-15)',
                placeholder: '<8',
                validation: 'number_range'
            }
        ],
        examples: [
            'lightlevel{l=<8} true',
            'll{level=>12} true'
        ]
    },
    {
        id: 'lineOfSight',
        name: 'Line of Sight',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target entity has line of sight to the caster',
        aliases: ['los'],
        attributes: [],
        examples: [
            'lineofsight true',
            'los false'
        ]
    },
    {
        id: 'looksAtPlayer',
        name: 'Looks At Player',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target entity is looking at a player',
        aliases: [],
        attributes: [],
        examples: [
            'looksatplayer true',
            'looksatplayer false'
        ]
    },
    {
        id: 'mobsInRadius',
        name: 'Mobs In Radius',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target location has a certain amount of mobs in the given radius',
        aliases: ['mir'],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: true,
                description: 'The amount of mobs to check for',
                placeholder: '>5',
                validation: 'number_range'
            },
            {
                name: 'radius',
                aliases: ['r'],
                type: 'number',
                required: false,
                default: 5,
                description: 'The radius to check',
                placeholder: '10',
                validation: 'number'
            },
            {
                name: 'mobtype',
                aliases: ['type', 't'],
                type: 'text',
                required: false,
                default: 'ANY',
                description: 'The type of mob to check for (or ANY)',
                placeholder: 'ZOMBIE',
                validation: 'entity_type'
            }
        ],
        examples: [
            'mobsinradius{a=>5;r=10} true',
            'mir{amount=1-3;radius=5;type=ZOMBIE} true'
        ]
    },
    {
        id: 'mounted',
        name: 'Mounted',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity is riding another entity',
        aliases: ['isRiding'],
        attributes: [],
        examples: [
            'mounted true',
            'isRiding false'
        ]
    },
    {
        id: 'mythicMobType',
        name: 'MythicMob Type',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target is a MythicMob of the given type',
        aliases: ['mobname', 'mm'],
        attributes: [
            {
                name: 'type',
                aliases: ['t', 'name'],
                type: 'text',
                required: true,
                description: 'The MythicMob type to check for (comma-separated for multiple)',
                placeholder: 'SkeletonKing',
                validation: 'text'
            }
        ],
        examples: [
            'mythicmobtype{type=SkeletonKing} true',
            'mobname{name=Boss1,Boss2} true'
        ]
    },
    {
        id: 'notInRegion',
        name: 'Not In Region',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target is NOT within the given WorldGuard region',
        aliases: [],
        attributes: [
            {
                name: 'region',
                aliases: ['r'],
                type: 'text',
                required: true,
                description: 'The WorldGuard region name',
                placeholder: 'spawn',
                validation: 'text'
            }
        ],
        examples: [
            'notinregion{region=spawn} true',
            'notinregion{r=safezone} true'
        ]
    },
    {
        id: 'onBlock',
        name: 'On Block',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the block the target entity is standing on matches the given material',
        aliases: ['standingOn'],
        attributes: [
            {
                name: 'material',
                aliases: ['m', 'mat', 'materials'],
                type: 'text',
                required: true,
                description: 'The material to check for (comma-separated for multiple)',
                placeholder: 'GRASS_BLOCK',
                validation: 'material'
            }
        ],
        examples: [
            'onblock{m=GRASS_BLOCK} true',
            'standingOn{materials=STONE,DIRT} true'
        ]
    },
    {
        id: 'onGround',
        name: 'On Ground',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target entity is standing on solid ground',
        aliases: ['isOnGround'],
        attributes: [],
        examples: [
            'onground true',
            'isOnGround false'
        ]
    }
];

// Export
window.ENTITY_CONDITIONS_ADVANCED = ENTITY_CONDITIONS_ADVANCED;
console.log('✅ Entity Conditions (Part 2) loaded:', ENTITY_CONDITIONS_ADVANCED.length, 'conditions');
