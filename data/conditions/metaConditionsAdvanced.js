/**
 * MythicMobs Meta Conditions (Part 2)
 * Advanced meta conditions for checking game state and variables
 * Based on official MythicMobs documentation
 */

const META_CONDITIONS_ADVANCED = [
    {
        id: 'lastSignal',
        name: 'Last Signal',
        category: 'Meta',
        type: 'meta',
        description: 'Matches the last signal received by the target mob',
        aliases: [],
        attributes: [
            {
                name: 'signal',
                aliases: ['s'],
                type: 'text',
                required: false,
                default: 'DEFAULT',
                description: 'The signal to match',
                placeholder: 'fireCannonShot',
                validation: 'text'
            }
        ],
        examples: [
            'lastsignal{s=fireCannonShot} true'
        ]
    },
    {
        id: 'lightLevelFromBlocks',
        name: 'Light Level From Blocks',
        category: 'Meta',
        type: 'meta',
        description: 'Tests the light level originating from light-emitting blocks at the target location',
        aliases: ['blocklightlevel'],
        attributes: [
            {
                name: 'level',
                aliases: ['l'],
                type: 'range',
                required: false,
                default: '0',
                description: 'The light level range to match (0-15)',
                placeholder: '>10',
                validation: 'number_range'
            }
        ],
        examples: [
            'lightlevelfromblocks{l=10} true',
            'lightlevelfromblocks{l=>10} true',
            'lightlevelfromblocks{l=1to10} true'
        ]
    },
    {
        id: 'lineOfSightFromOrigin',
        name: 'Line Of Sight From Origin',
        category: 'Meta',
        type: 'meta',
        description: 'Tests if the target is within line of sight of the origin of the metaskill',
        aliases: ['inlineofsightfromorigin'],
        attributes: [],
        examples: [
            'lineofsightfromorigin true'
        ]
    },
    {
        id: 'livingInRadius',
        name: 'Living In Radius',
        category: 'Meta',
        type: 'meta',
        description: 'Matches a range to how many living entities are in the given radius',
        aliases: [],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '1',
                description: 'The amount to check for',
                placeholder: '<5',
                validation: 'number_range'
            },
            {
                name: 'radius',
                aliases: ['r'],
                type: 'number',
                required: false,
                default: 5,
                description: 'The radius of the search',
                placeholder: '10',
                validation: 'number'
            }
        ],
        examples: [
            'livinginradius{a=<5;r=10} true'
        ]
    },
    {
        id: 'localDifficulty',
        name: 'Local Difficulty',
        category: 'Meta',
        type: 'meta',
        description: 'Tests the difficulty scale at the target location',
        aliases: [],
        attributes: [
            {
                name: 'difficulty',
                aliases: ['diff', 'd'],
                type: 'range',
                required: true,
                description: 'The difficulty range to check',
                placeholder: '=>0',
                validation: 'number_range'
            }
        ],
        examples: [
            'localdifficulty{d=>0} true'
        ]
    },
    {
        id: 'lunarPhase',
        name: 'Lunar Phase',
        category: 'Meta',
        type: 'meta',
        description: 'Checks for the current lunar phase (0=Full Moon, 1=Waning Gibbous, 2=Third Quarter, 3=Waning Crescent, 4=New Moon, 5=Waxing Crescent, 6=First Quarter, 7=Waxing Gibbous)',
        aliases: [],
        attributes: [
            {
                name: 'phases',
                aliases: ['p', 'phase'],
                type: 'text',
                required: false,
                default: '0',
                description: 'The lunar phase number(s) to check for. Can be a list',
                placeholder: '0',
                options: ['0', '1', '2', '3', '4', '5', '6', '7'],
                validation: 'text'
            }
        ],
        examples: [
            'lunarphase{p=0} true',
            'lunarphase{p=0,2,4,6} true'
        ]
    },
    {
        id: 'materialIsOnCooldown',
        name: 'Material Is On Cooldown',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target player\'s specified material is on cooldown',
        aliases: ['materialCooldown', 'matCooldown'],
        attributes: [
            {
                name: 'material',
                aliases: ['mat', 'm'],
                type: 'text',
                required: false,
                default: 'enderpearl',
                description: 'The material to check for',
                placeholder: 'STONE',
                validation: 'material'
            }
        ],
        examples: [
            'materialIsOnCooldown{mat=STONE} true'
        ]
    },
    {
        id: 'metaskillCondition',
        name: 'Metaskill Condition',
        category: 'Meta',
        type: 'meta',
        description: 'Casts a Metaskill that will determine if the condition should check or not. The called Metaskill needs to use the DetermineCondition mechanic',
        aliases: ['skillcondition'],
        attributes: [
            {
                name: 'skill',
                aliases: ['s'],
                type: 'text',
                required: true,
                description: 'The metaskill to call',
                placeholder: 'metaskillcondition_check',
                validation: 'text'
            }
        ],
        examples: [
            'metaskillcondition{skill=metaskillcondition_check} true'
        ]
    },
    {
        id: 'mobsInChunk',
        name: 'Mobs In Chunk',
        category: 'Meta',
        type: 'meta',
        description: 'Matches a range to how many mobs are in the target location\'s chunk',
        aliases: [],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '0',
                description: 'The number range to match',
                placeholder: '1to5',
                validation: 'number_range'
            }
        ],
        examples: [
            'mobsinchunk{a=1to5} true',
            'mobsinchunk{a=<5} true'
        ]
    },
    {
        id: 'mobsInWorld',
        name: 'Mobs In World',
        category: 'Meta',
        type: 'meta',
        description: 'Matches a range to how many mobs are in the target world',
        aliases: [],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '0',
                description: 'The number range to match',
                placeholder: '20to50',
                validation: 'number_range'
            }
        ],
        examples: [
            'mobsinworld{a=20to50} true',
            'mobsinworld{a=<50} true'
        ]
    },
    {
        id: 'mobsNearOrigin',
        name: 'Mobs Near Origin',
        category: 'Meta',
        type: 'meta',
        description: 'Matches a range to how many mobs are in the given radius around the origin',
        aliases: [],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '1',
                description: 'The amount of mobs to match. Can be a range',
                placeholder: '=>5',
                validation: 'number_range'
            },
            {
                name: 'radius',
                aliases: ['r'],
                type: 'number',
                required: false,
                default: 5,
                description: 'The radius in which to match mobs',
                placeholder: '10',
                validation: 'number'
            },
            {
                name: 'types',
                aliases: ['type', 't'],
                type: 'text',
                required: false,
                default: '',
                description: 'The mob types to match. Can be a list',
                placeholder: 'ExampleMob,Boss',
                validation: 'text'
            }
        ],
        examples: [
            'mobsnearorigin{type=ExampleMob,SuperDuperStrongMob;r=10;amount=>5} true'
        ]
    },
    {
        id: 'mobSize',
        name: 'Mob Size',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the size of an entity that can have its size changed (Slimes, Magma Cubes, and Phantoms)',
        aliases: ['size'],
        attributes: [
            {
                name: 'size',
                aliases: ['s'],
                type: 'range',
                required: true,
                description: 'The size range to check',
                placeholder: '=>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'size{s=>5} true'
        ]
    },
    {
        id: 'moist',
        name: 'Moist',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target block of farmland is hydrated',
        aliases: ['ismoist'],
        attributes: [],
        examples: [
            'ismoist true'
        ]
    },
    {
        id: 'moistureLevel',
        name: 'Moisture Level',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target farmland block has the specified level of hydration (0=not hydrated, 1-6=losing hydration, 7=fully hydrated)',
        aliases: ['moistureness', 'moistness'],
        attributes: [
            {
                name: 'l',
                aliases: ['moistness', 'm'],
                type: 'range',
                required: true,
                description: 'The level of hydration to check for',
                placeholder: '3',
                validation: 'number_range'
            }
        ],
        examples: [
            'moisturelevel{l=3} true',
            'moistureness{l=1to6} true'
        ]
    },
    {
        id: 'motionX',
        name: 'Motion X',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the X motion of the target entity against a range',
        aliases: ['motx'],
        attributes: [
            {
                name: 'velocity',
                aliases: ['v'],
                type: 'range',
                required: true,
                description: 'The velocity to check for',
                placeholder: '<1',
                validation: 'number_range'
            }
        ],
        examples: [
            'motionx{v=<1} true'
        ]
    },
    {
        id: 'motionY',
        name: 'Motion Y',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the Y motion of the target entity against a range',
        aliases: ['moty'],
        attributes: [
            {
                name: 'velocity',
                aliases: ['v'],
                type: 'range',
                required: true,
                description: 'The velocity to check for',
                placeholder: '<1',
                validation: 'number_range'
            }
        ],
        examples: [
            'motiony{v=<1} true'
        ]
    },
    {
        id: 'motionZ',
        name: 'Motion Z',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the Z motion of the target entity against a range',
        aliases: ['motz'],
        attributes: [
            {
                name: 'velocity',
                aliases: ['v'],
                type: 'range',
                required: true,
                description: 'The velocity to check for',
                placeholder: '<1',
                validation: 'number_range'
            }
        ],
        examples: [
            'motionz{v=<1} true'
        ]
    },
    {
        id: 'moving',
        name: 'Moving',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target has a velocity greater than zero',
        aliases: ['ismoving'],
        attributes: [
            {
                name: 'exact',
                aliases: ['e'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'If the check should be exact or approximated',
                validation: 'boolean'
            }
        ],
        examples: [
            'moving true'
        ]
    },
    {
        id: 'mythicPack',
        name: 'MythicPack',
        category: 'Meta',
        type: 'meta',
        description: 'Check if a Pack with the specified id is present on the server',
        aliases: ['pack', 'haspack'],
        attributes: [
            {
                name: 'packid',
                aliases: ['pack', 'id', 'p'],
                type: 'text',
                required: true,
                description: 'The pack id to check for',
                placeholder: 'ThePackId',
                validation: 'text'
            }
        ],
        examples: [
            'mythicpack{p="ThePackId"} true'
        ]
    },
    {
        id: 'mythicPackVersion',
        name: 'MythicPack Version',
        category: 'Meta',
        type: 'meta',
        description: 'Check if a Pack with the specified id is present on the server with the specified version',
        aliases: ['packversion', 'packversionis'],
        attributes: [
            {
                name: 'packid',
                aliases: ['pack', 'id', 'p'],
                type: 'text',
                required: true,
                description: 'The Pack id to check for',
                placeholder: 'ThePackId',
                validation: 'text'
            },
            {
                name: 'packversion',
                aliases: ['packV', 'version', 'v'],
                type: 'text',
                required: true,
                description: 'The version to check for',
                placeholder: '1.2.3',
                validation: 'text'
            }
        ],
        examples: [
            'packversion{p="ThePackId",v="1.2.3"} true'
        ]
    },
    {
        id: 'mythicPackVersionGreater',
        name: 'MythicPack Version Greater',
        category: 'Meta',
        type: 'meta',
        description: 'Check if a Pack with the specified id is present on the server with a version that is either greater or equal to the specified one',
        aliases: ['packversiongreater', 'packversionisgreater'],
        attributes: [
            {
                name: 'packid',
                aliases: ['pack', 'id', 'p'],
                type: 'text',
                required: true,
                description: 'The Pack id to check for',
                placeholder: 'ThePackId',
                validation: 'text'
            },
            {
                name: 'packversion',
                aliases: ['packV', 'version', 'v'],
                type: 'text',
                required: true,
                description: 'The version to check for',
                placeholder: '1.2.3',
                validation: 'text'
            }
        ],
        examples: [
            'packversiongreater{p="ThePackId";v="1.2.3"} true'
        ]
    },
    {
        id: 'name',
        name: 'Name',
        category: 'Meta',
        type: 'meta',
        description: 'Checks against the name of the target entity',
        aliases: ['castername'],
        attributes: [
            {
                name: 'name',
                aliases: ['n'],
                type: 'text',
                required: false,
                default: 'Ashijin',
                description: 'The name to check against',
                placeholder: 'Ashijin',
                validation: 'text'
            }
        ],
        examples: [
            'name{n=Ashijin} true'
        ]
    },
    {
        id: 'offGCD',
        name: 'Off GCD',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target mob has an active Global Cooldown',
        aliases: [],
        attributes: [],
        examples: [
            'offgcd true'
        ]
    },
    {
        id: 'originDistanceFromPin',
        name: 'Origin Distance From Pin',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the @origin is within a certain distance of a specified pin',
        aliases: [],
        attributes: [
            {
                name: 'pin',
                aliases: ['p'],
                type: 'text',
                required: true,
                description: 'The pin to check against',
                placeholder: 'example_pin',
                validation: 'text'
            },
            {
                name: 'distance',
                aliases: ['d'],
                type: 'range',
                required: true,
                description: 'The distance to check against. Can be a range',
                placeholder: '=>10',
                validation: 'number_range'
            }
        ],
        examples: [
            'originDistanceFromPin{pin=example_pin;d=>10} true'
        ]
    },
    {
        id: 'originLocation',
        name: 'Origin Location',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the origin is at a given location',
        aliases: [],
        attributes: [
            {
                name: 'location',
                aliases: ['loc', 'l', 'c'],
                type: 'text',
                required: false,
                default: '',
                description: 'The location to match, written as x,y,z',
                placeholder: '10,20,30',
                validation: 'coordinates'
            },
            {
                name: 'x',
                aliases: [],
                type: 'number',
                required: false,
                default: 0,
                description: 'The x coordinate (ignored if location is set)',
                placeholder: '0',
                validation: 'number'
            },
            {
                name: 'y',
                aliases: [],
                type: 'number',
                required: false,
                default: 0,
                description: 'The y coordinate (ignored if location is set)',
                placeholder: '0',
                validation: 'number'
            },
            {
                name: 'z',
                aliases: [],
                type: 'number',
                required: false,
                default: 0,
                description: 'The z coordinate (ignored if location is set)',
                placeholder: '0',
                validation: 'number'
            },
            {
                name: 'exact',
                aliases: ['e'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether to match the location exactly',
                validation: 'boolean'
            }
        ],
        examples: [
            'originLocation{loc=10,20,30} true'
        ]
    },
    {
        id: 'outside',
        name: 'Outside',
        category: 'Meta',
        type: 'meta',
        description: 'If the target has open sky above them',
        aliases: [],
        attributes: [],
        examples: [
            'outside true'
        ]
    }
];

// Export
window.META_CONDITIONS_ADVANCED = META_CONDITIONS_ADVANCED;
console.log('✅ Meta Conditions (Part 2) loaded:', META_CONDITIONS_ADVANCED.length, 'conditions');
