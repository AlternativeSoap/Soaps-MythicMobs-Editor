/**
 * MythicMobs Meta Conditions (Part 1)
 * Conditions that check game state, variables, and server properties
 * Based on official MythicMobs documentation
 */

const META_CONDITIONS = [
    {
        id: 'chance',
        name: 'Chance',
        category: 'Meta',
        type: 'meta',
        description: 'Sets the probability of the metaskill being executed. Chance can range between 0 and 1, with 0 being a 0% chance and 1 being a 100% chance',
        aliases: [],
        attributes: [
            {
                name: 'chance',
                aliases: ['c'],
                type: 'number',
                required: false,
                default: 0.5,
                description: 'The floating value which denotes the chance (0-1)',
                placeholder: '0.3',
                validation: 'number'
            }
        ],
        examples: [
            'chance{chance=0.3} true',
            'chance{c=0.7} false'
        ]
    },
    {
        id: 'compareValues',
        name: 'Compare Values',
        category: 'Meta',
        type: 'meta',
        description: 'Compares two values based on a specified operation. Supports Integers, Floats, Doubles, and Strings (lexicographically). The comparison is made from value1 against value2',
        aliases: ['comparevalue'],
        attributes: [
            {
                name: 'value1',
                aliases: ['val1', 'v1'],
                type: 'text',
                required: true,
                description: 'The first value of the comparison',
                placeholder: '%server_online%',
                validation: 'text'
            },
            {
                name: 'value2',
                aliases: ['val2', 'v2'],
                type: 'text',
                required: true,
                description: 'The second value of the comparison',
                placeholder: '10',
                validation: 'text'
            },
            {
                name: 'operator',
                aliases: ['op'],
                type: 'text',
                required: false,
                default: 'EQUALS',
                description: 'The operator to use: ==, !=, >, <, >=, <=',
                placeholder: '>=',
                options: ['==', 'EQUALS', '!=', 'NOT_EQUALS', '>', 'GREATERTHAN', '<', 'LESSTHAN', '>=', 'GTE', '<=', 'LTE'],
                validation: 'operator'
            },
            {
                name: 'type',
                aliases: ['t'],
                type: 'text',
                required: false,
                default: '',
                description: 'The optional type of the comparison (Integer, Double, String)',
                placeholder: 'Integer',
                validation: 'text'
            }
        ],
        examples: [
            'comparevalues{value1=%server_online%;operator=>=;value2=10} true'
        ]
    },
    {
        id: 'damageAmount',
        name: 'Damage Amount',
        category: 'Meta',
        type: 'meta',
        description: 'Checks for a range of damage the entity took, if the skilltree originated from a onDamaged Trigger or an onDamaged Aura',
        aliases: [],
        attributes: [
            {
                name: 'damageAmount',
                aliases: ['amount', 'a'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'Range of damage to check for',
                placeholder: '>10',
                validation: 'number_range'
            }
        ],
        examples: [
            'damageamount{amount=>10} true'
        ]
    },
    {
        id: 'damageCause',
        name: 'Damage Cause',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the cause of the damage the entity took, if the skilltree originated from a onDamaged Trigger or an onDamaged Aura',
        aliases: [],
        attributes: [
            {
                name: 'damagecause',
                aliases: ['cause', 'c'],
                type: 'text',
                required: false,
                default: 'ENTITY_ATTACK',
                description: 'The damage cause to match',
                placeholder: 'FIRE',
                validation: 'damage_cause'
            }
        ],
        examples: [
            'damagecause{cause=ENTITY_ATTACK} true',
            'damagecause{c=FALL} true'
        ]
    },
    {
        id: 'damageTag',
        name: 'Damage Tag',
        category: 'Meta',
        type: 'meta',
        description: 'Checks whether the damage that caused the current skill tree has a specific tag',
        aliases: ['damagehastag'],
        attributes: [
            {
                name: 'tag',
                aliases: ['t'],
                type: 'text',
                required: true,
                description: 'The tag to check against',
                placeholder: 'WITCHCURSES',
                validation: 'text'
            },
            {
                name: 'value',
                aliases: ['val', 'v', 'b', 'bool', 'boolean'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'If true, checks for presence; if false, checks for absence',
                validation: 'boolean'
            }
        ],
        examples: [
            'damageTag{tag=WITCHCURSES} true'
        ]
    },
    {
        id: 'directionalVelocity',
        name: 'Directional Velocity',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target has a velocity matching the given parameters along X, Y, or Z axis',
        aliases: ['dvelocity'],
        attributes: [
            {
                name: 'x',
                aliases: ['s', 'side'],
                type: 'range',
                required: false,
                default: '',
                description: 'The X velocity. Can be a range',
                placeholder: '<5',
                validation: 'number_range'
            },
            {
                name: 'absx',
                aliases: ['ax', 'abss', 'as'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether to use absolute values for X velocity',
                validation: 'boolean'
            },
            {
                name: 'y',
                aliases: ['up', 'down', 'vertical', 'v'],
                type: 'range',
                required: false,
                default: '',
                description: 'The Y velocity. Can be a range',
                placeholder: '<0',
                validation: 'number_range'
            },
            {
                name: 'absy',
                aliases: ['ay'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether to use absolute values for Y velocity',
                validation: 'boolean'
            },
            {
                name: 'z',
                aliases: ['f', 'forward'],
                type: 'range',
                required: false,
                default: '',
                description: 'The Z velocity. Can be a range',
                placeholder: '>10',
                validation: 'number_range'
            },
            {
                name: 'absz',
                aliases: ['az', 'absf', 'af'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether to use absolute values for Z velocity',
                validation: 'boolean'
            },
            {
                name: 'relative',
                aliases: ['rel'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether to check relative to entity orientation vs world axis',
                validation: 'boolean'
            }
        ],
        examples: [
            'directionalVelocity{y=<0;absx=true} true'
        ]
    },
    {
        id: 'enchantingExperience',
        name: 'Enchanting Experience',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the experience points progress (0-1) towards next level for the target player',
        aliases: ['enchantingExp', 'enchantExperience', 'enchantExp'],
        attributes: [
            {
                name: 'level',
                aliases: ['l', 'amount', 'a'],
                type: 'range',
                required: false,
                default: '0',
                description: 'Experience progress (0=no progress, 1=next level)',
                placeholder: '>0.2',
                validation: 'number_range'
            }
        ],
        examples: [
            'enchantingExperience{l=>0.2} true'
        ]
    },
    {
        id: 'enchantingLevel',
        name: 'Enchanting Level',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the target player\'s experience level',
        aliases: [],
        attributes: [
            {
                name: 'level',
                aliases: ['l'],
                type: 'range',
                required: false,
                default: '0',
                description: 'Range of experience levels to check for',
                placeholder: '<10',
                validation: 'number_range'
            }
        ],
        examples: [
            'EnchantingLevel{l=<10} true'
        ]
    },
    {
        id: 'enderDragonAlive',
        name: 'Ender Dragon Alive',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if there is at least one EnderDragon alive in the world of the targeted location',
        aliases: ['isdragonalive', 'dragonalive'],
        attributes: [],
        examples: [
            'enderdragonalive true'
        ]
    },
    {
        id: 'enderDragonPhase',
        name: 'Ender Dragon Phase',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the phase of the target Ender Dragon entity',
        aliases: ['edragonPhase'],
        attributes: [
            {
                name: 'phase',
                aliases: ['p', 'phases'],
                type: 'text',
                required: true,
                description: 'A list of phases to match (comma-separated)',
                placeholder: 'CIRCLING',
                options: ['CIRCLING', 'CHARGING_PLAYER', 'FLY_TO_PORTAL', 'LEAVE_PORTAL', 'ROAR_BEFORE_ATTACK', 'BREATH_ATTACK', 'SEARCH_FOR_BREATH_ATTACK_TARGET', 'LAND_ON_PORTAL', 'HOVER', 'DYING'],
                validation: 'dragon_phase'
            }
        ],
        examples: [
            'enderdragonphase{phase=CIRCLING} true',
            'enderdragonphase{phases=FLY_TO_PORTAL,LEAVE_PORTAL} true'
        ]
    },
    {
        id: 'entityItemIsSimilar',
        name: 'Entity Item Is Similar',
        category: 'Meta',
        type: 'meta',
        description: 'Tests if the item entity is similar to an itemstack',
        aliases: [],
        attributes: [
            {
                name: 'item',
                aliases: ['i', 'material', 'm', 'mm', 'mythicitem'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'The item to check against',
                placeholder: 'MyCustomItem',
                validation: 'item_matcher'
            }
        ],
        examples: [
            'entityitemissimilar{i=MyCustomItem} true'
        ]
    },
    {
        id: 'entityItemType',
        name: 'Entity Item Type',
        category: 'Meta',
        type: 'meta',
        description: 'Tests the type of the targeted entity item',
        aliases: [],
        attributes: [
            {
                name: 'material',
                aliases: ['mat', 'm', 'type', 'types', 't'],
                type: 'text',
                required: true,
                description: 'A list of items to match',
                placeholder: 'STONE',
                validation: 'material'
            }
        ],
        examples: [
            'entityItemType{m=STONE} true'
        ]
    },
    {
        id: 'entityMaterialType',
        name: 'Entity Material Type',
        category: 'Meta',
        type: 'meta',
        description: 'Tests the material of the targeted entity item',
        aliases: [],
        attributes: [
            {
                name: 'material',
                aliases: ['mat', 'm', 'type', 'types', 't'],
                type: 'text',
                required: true,
                description: 'A list of materials to match',
                placeholder: 'STONE,DIRT',
                validation: 'material'
            }
        ],
        examples: [
            'entityMaterialType{mat=STONE,DIRT} true'
        ]
    },
    {
        id: 'foodLevel',
        name: 'Food Level',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the food amount of the target',
        aliases: ['hunger', 'food', 'hungerlevel'],
        attributes: [
            {
                name: 'amount',
                aliases: ['a', 'food', 'f'],
                type: 'range',
                required: false,
                default: '0',
                description: 'Range of food amount to check for',
                placeholder: '<10',
                validation: 'number_range'
            }
        ],
        examples: [
            'FoodLevel{a=<10} true'
        ]
    },
    {
        id: 'foodSaturation',
        name: 'Food Saturation',
        category: 'Meta',
        type: 'meta',
        description: 'Checks the food saturation amount of the target',
        aliases: ['hungerSaturation'],
        attributes: [
            {
                name: 'amount',
                aliases: ['a', 'food', 'f', 'saturation', 's'],
                type: 'range',
                required: false,
                default: '0',
                description: 'Range of food saturation to check for',
                placeholder: '<1',
                validation: 'number_range'
            }
        ],
        examples: [
            'FoodSaturation{a=<1} true'
        ]
    },
    {
        id: 'gameMode',
        name: 'Game Mode',
        category: 'Meta',
        type: 'meta',
        description: 'Matches the target player\'s gamemode',
        aliases: ['gm'],
        attributes: [
            {
                name: 'mode',
                aliases: ['m'],
                type: 'text',
                required: false,
                default: 'SURVIVAL',
                description: 'The gamemode to match',
                placeholder: 'CREATIVE',
                options: ['SURVIVAL', 'CREATIVE', 'ADVENTURE', 'SPECTATOR'],
                validation: 'gamemode'
            }
        ],
        examples: [
            'gamemode{m=ADVENTURE} true'
        ]
    },
    {
        id: 'hasFreeInventorySlot',
        name: 'Has Free Inventory Slot',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the evaluated entity has a free inventory slot (at all)',
        aliases: [],
        attributes: [],
        examples: [
            'hasfreeinventoryslot true'
        ]
    },
    {
        id: 'inClaim',
        name: 'In Claim',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target location is inside a claim from supported plugins (GriefPrevention, Lands, CrashClaim)',
        aliases: ['nearClaim', 'nearClaims'],
        attributes: [
            {
                name: 'radius',
                aliases: ['r'],
                type: 'number',
                required: false,
                default: 16,
                description: 'The given range to check',
                placeholder: '20',
                validation: 'number'
            }
        ],
        examples: [
            'nearclaim{r=20} false'
        ]
    },
    {
        id: 'isSkill',
        name: 'Is Skill',
        category: 'Meta',
        type: 'meta',
        description: 'Checks whether the specified metaskill exists',
        aliases: ['skillexists'],
        attributes: [
            {
                name: 'name',
                aliases: ['n', 'skill', 's'],
                type: 'text',
                required: true,
                description: 'The metaskill to check the existence of',
                placeholder: 'ExampleMetaSkill',
                validation: 'text'
            }
        ],
        examples: [
            'isSkill{skill=ExampleMetaSkill} true'
        ]
    },
    {
        id: 'isUsingSpyglass',
        name: 'Is Using Spyglass',
        category: 'Meta',
        type: 'meta',
        description: 'If the target player is using a spyglass',
        aliases: ['isScoping'],
        attributes: [],
        examples: [
            'isusingspyglass false'
        ]
    },
    {
        id: 'itemGroupOnCooldown',
        name: 'Item Group On Cooldown',
        category: 'Meta',
        type: 'meta',
        description: 'Checks whether the target player has the specified item group on cooldown',
        aliases: [],
        attributes: [
            {
                name: 'group',
                aliases: ['g'],
                type: 'text',
                required: true,
                description: 'The group to check against',
                placeholder: 'teleportingitems',
                validation: 'text'
            }
        ],
        examples: [
            'ItemGroupOnCooldown{g=teleportingitems} true'
        ]
    },
    {
        id: 'itemIsSimilar',
        name: 'Item Is Similar',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the target player\'s inventory slot holds an item similar to the specified one',
        aliases: ['issimilar', 'similarto'],
        attributes: [
            {
                name: 'item',
                aliases: ['i', 'material', 'm', 'mm', 'mythicitem'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'The item to check for',
                placeholder: 'MyCustomItem',
                validation: 'item_matcher'
            },
            {
                name: 'slot',
                aliases: ['s'],
                type: 'text',
                required: false,
                default: 'HAND',
                description: 'The inventory slot to check (0-35 or equipment slots)',
                placeholder: '0',
                validation: 'slot'
            }
        ],
        examples: [
            'itemissimilar{i=MyCustomItem;slot=0} true'
        ]
    },
    {
        id: 'itemRecharging',
        name: 'Item Recharging',
        category: 'Meta',
        type: 'meta',
        description: 'Checks if the weapon of the target entity is recharging',
        aliases: [],
        attributes: [],
        examples: [
            'itemrecharging true'
        ]
    },
    {
        id: 'itemType',
        name: 'Item Type',
        category: 'Meta',
        type: 'meta',
        description: 'Checks against the material of the item that triggered the skill. Uses the Item Matcher',
        aliases: [],
        attributes: [
            {
                name: 'types',
                aliases: ['type', 't', 'material', 'mat', 'm', 'i', 'item'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'A list of materials to check against',
                placeholder: 'STONE,STONE_SWORD',
                validation: 'material'
            },
            {
                name: 'strict',
                aliases: ['exact', 'e'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether the matcher should more strictly match',
                validation: 'boolean'
            },
            {
                name: 'vanillaonly',
                aliases: ['vanilla'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether the matched item can only be vanilla',
                validation: 'boolean'
            }
        ],
        examples: [
            'itemType{types=STONE,STONE_SWORD} true'
        ]
    }
];

// Export
window.META_CONDITIONS = META_CONDITIONS;
// Loaded silently
