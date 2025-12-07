/**
 * MythicMobs Location Conditions
 * Conditions that check properties of locations
 * Based on official MythicMobs documentation
 */

const LOCATION_CONDITIONS = [
    {
        id: 'biome',
        name: 'Biome',
        category: 'Location',
        type: 'location',
        description: 'Tests if the target is within the given list of biomes. If no namespace is provided, it will default to minecraft:',
        aliases: [],
        attributes: [
            {
                name: 'biome',
                aliases: ['b'],
                type: 'text',
                required: false,
                default: 'minecraft:plains',
                description: 'A list of biomes to check (comma-separated)',
                placeholder: 'minecraft:plains,river',
                validation: 'text'
            },
            {
                name: 'exact',
                aliases: ['e'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether to match the biome exactly',
                validation: 'boolean'
            }
        ],
        examples: [
            'biome{b=minecraft:plains,river} true',
            'biome{b=far_end:void,far_end:warped_marsh} true'
        ]
    },
    {
        id: 'biomeType',
        name: 'Biome Type',
        category: 'Location',
        type: 'location',
        description: 'Tests if the target is within the given list of biome types',
        aliases: ['biomecategory'],
        attributes: [
            {
                name: 'type',
                aliases: ['t'],
                type: 'text',
                required: false,
                default: 'ocean',
                description: 'A list of biome types to check',
                placeholder: 'jungle,ocean',
                options: ['none', 'taiga', 'extreme_hills', 'jungle', 'mesa', 'plains', 'savanna', 'icy', 'the_end', 'beach', 'forest', 'ocean', 'desert', 'river', 'swamp', 'mushroom', 'nether', 'underground', 'mountain'],
                validation: 'biome_type'
            },
            {
                name: 'exact',
                aliases: ['e'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether to match the type exactly',
                validation: 'boolean'
            }
        ],
        examples: [
            'biometype{t=jungle,ocean,extreme_hills} true'
        ]
    },
    {
        id: 'blockType',
        name: 'Block Type',
        category: 'Location',
        type: 'location',
        description: 'Tests if the material type present at the target location is the specified one. Valid for any Spigot material type, wildcards and block tags',
        aliases: ['inblock', 'insideblock'],
        attributes: [
            {
                name: 'types',
                aliases: ['type', 't', 'material', 'mat', 'm', 'block', 'b'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'A list of materials or MMOItem\'s block names to check. Supports wildcards and block tags',
                placeholder: 'dirt',
                validation: 'material'
            }
        ],
        examples: [
            'blocktype{type=dirt} true',
            'blockType{type=#leaves,*_log,redstone_torch[lit=true]} true'
        ]
    },
    {
        id: 'blockTypeInRadius',
        name: 'Block Type In Radius',
        category: 'Location',
        type: 'location',
        description: 'Checks against the amount of specified blocks in a radius around the evaluated location',
        aliases: [],
        attributes: [
            {
                name: 'types',
                aliases: ['type', 't', 'material', 'mat', 'm', 'b', 'block'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'A list of materials to check against',
                placeholder: 'STONE',
                validation: 'material'
            },
            {
                name: 'radius',
                aliases: ['r'],
                type: 'number',
                required: false,
                default: 8,
                description: 'The radius to check',
                placeholder: '8',
                validation: 'number'
            },
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'The amount of blocks to match',
                placeholder: '>10',
                validation: 'number_range'
            }
        ],
        examples: [
            'blockTypeInRadius{type=STONE;amount=>10;radius=3} true'
        ]
    },
    {
        id: 'dawn',
        name: 'Dawn',
        category: 'Location',
        type: 'location',
        description: 'Checks if the time in the world at the target location is dawn, from 22000 to 2000 in-game time',
        aliases: [],
        attributes: [],
        examples: [
            'dawn true'
        ]
    },
    {
        id: 'day',
        name: 'Day',
        category: 'Location',
        type: 'location',
        description: 'Checks if the time in the world at the target location is day, from 2000 to 10000 in-game time',
        aliases: [],
        attributes: [],
        examples: [
            'day true'
        ]
    },
    {
        id: 'dimension',
        name: 'Dimension',
        category: 'Location',
        type: 'location',
        description: 'Checks if the target is within a certain dimension',
        aliases: ['environment'],
        attributes: [
            {
                name: 'dimension',
                aliases: ['d', 'environment', 'env'],
                type: 'text',
                required: false,
                default: 'THE_END',
                description: 'A list of dimensions to check',
                placeholder: 'NORMAL',
                options: ['NORMAL', 'NETHER', 'THE_END'],
                validation: 'dimension'
            }
        ],
        examples: [
            'dimension{d=NORMAL} true'
        ]
    },
    {
        id: 'dusk',
        name: 'Dusk',
        category: 'Location',
        type: 'location',
        description: 'Checks if the time in the world at the target location is dusk, from 14000 to 18000 in-game time',
        aliases: [],
        attributes: [],
        examples: [
            'dusk true'
        ]
    },
    {
        id: 'lightLevel',
        name: 'Light Level',
        category: 'Location',
        type: 'location',
        description: 'Tests the light level at the target location',
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
        id: 'moonPhase',
        name: 'Moon Phase',
        category: 'Location',
        type: 'location',
        description: 'Checks the moon phase in the target location\'s world',
        aliases: [],
        attributes: [
            {
                name: 'phase',
                aliases: ['p'],
                type: 'text',
                required: true,
                description: 'The moon phase to check for',
                placeholder: 'FULL_MOON',
                options: ['FULL_MOON', 'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT', 'NEW_MOON', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS'],
                validation: 'moon_phase'
            }
        ],
        examples: [
            'moonphase{phase=FULL_MOON} true'
        ]
    },
    {
        id: 'night',
        name: 'Night',
        category: 'Location',
        type: 'location',
        description: 'Checks if the time in the world at the target location is night, from 14000 to 22000 in-game time',
        aliases: [],
        attributes: [],
        examples: [
            'night true'
        ]
    },
    {
        id: 'pitch',
        name: 'Pitch',
        category: 'Location',
        type: 'location',
        description: 'Checks the pitch of the target location',
        aliases: [],
        attributes: [
            {
                name: 'pitch',
                aliases: ['p'],
                type: 'range',
                required: true,
                description: 'The pitch value to check for',
                placeholder: '>0',
                validation: 'number_range'
            }
        ],
        examples: [
            'pitch{p=>45} true'
        ]
    },
    {
        id: 'raining',
        name: 'Raining',
        category: 'Location',
        type: 'location',
        description: 'Checks if it\'s raining in the target location\'s world',
        aliases: ['israining'],
        attributes: [],
        examples: [
            'raining true',
            'israining false'
        ]
    },
    {
        id: 'region',
        name: 'Region',
        category: 'Location',
        type: 'location',
        description: 'Checks if the target is within the given WorldGuard region',
        aliases: ['inregion'],
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
        id: 'storm',
        name: 'Storm',
        category: 'Location',
        type: 'location',
        description: 'Checks if there\'s a storm in the target location\'s world',
        aliases: ['thundering', 'isthundering'],
        attributes: [],
        examples: [
            'storm true',
            'thundering false'
        ]
    },
    {
        id: 'sunny',
        name: 'Sunny',
        category: 'Location',
        type: 'location',
        description: 'Checks if the weather is clear in the target location\'s world',
        aliases: ['clear'],
        attributes: [],
        examples: [
            'sunny true',
            'clear true'
        ]
    },
    {
        id: 'worldTime',
        name: 'World Time',
        category: 'Location',
        type: 'location',
        description: 'Checks the target location\'s world time',
        aliases: ['time'],
        attributes: [
            {
                name: 'time',
                aliases: ['t'],
                type: 'range',
                required: true,
                description: 'The world time to check for (0-24000)',
                placeholder: '>12000',
                validation: 'number_range'
            }
        ],
        examples: [
            'worldtime{t=>12000} true',
            'time{time=0-6000} true'
        ]
    },
    {
        id: 'yaw',
        name: 'Yaw',
        category: 'Location',
        type: 'location',
        description: 'Checks the yaw of the target location',
        aliases: [],
        attributes: [
            {
                name: 'yaw',
                aliases: ['y'],
                type: 'range',
                required: true,
                description: 'The yaw value to check for',
                placeholder: '>0',
                validation: 'number_range'
            }
        ],
        examples: [
            'yaw{y=>90} true'
        ]
    }
];

// Export
window.LOCATION_CONDITIONS = LOCATION_CONDITIONS;
// Loaded silently
