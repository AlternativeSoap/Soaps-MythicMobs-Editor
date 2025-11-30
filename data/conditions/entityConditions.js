/**
 * MythicMobs Entity Conditions (Part 1)
 * Conditions that check properties of entities
 * Based on official MythicMobs documentation
 */

const ENTITY_CONDITIONS = [
    {
        id: 'altitude',
        name: 'Altitude',
        category: 'Entity',
        type: 'entity',
        description: 'Tests how far above the ground the target entity is',
        aliases: ['heightfromsurface'],
        attributes: [
            {
                name: 'height',
                aliases: ['altitude', 'a', 'h'],
                type: 'range',
                required: true,
                description: 'The height range to check',
                placeholder: '3-5',
                validation: 'number_range'
            },
            {
                name: 'maxHeight',
                aliases: ['mH'],
                type: 'number',
                required: false,
                default: 30,
                description: 'Limits the maximum height this condition can check for',
                placeholder: '30'
            }
        ],
        examples: [
            'altitude{h=3-5} true',
            'altitude{a=>10;mH=50} true'
        ]
    },
    {
        id: 'blocking',
        name: 'Blocking',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target player is blocking with a shield',
        aliases: ['isblocking'],
        attributes: [],
        examples: [
            'blocking true',
            'isblocking false'
        ]
    },
    {
        id: 'burning',
        name: 'Burning',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity is burning/on fire',
        aliases: ['isburning', 'isonfire'],
        attributes: [],
        examples: [
            'burning true',
            'isburning false'
        ]
    },
    {
        id: 'charged',
        name: 'Charged',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target creeper is charged',
        aliases: ['ischarged', 'creepercharged'],
        attributes: [],
        examples: [
            'charged true',
            'creepercharged true'
        ]
    },
    {
        id: 'children',
        name: 'Children',
        category: 'Entity',
        type: 'entity',
        description: 'Tests how many children the caster has',
        aliases: [],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '1',
                description: 'The amount of children to check for. Can accept ranged values',
                placeholder: '>2',
                validation: 'number_range'
            }
        ],
        examples: [
            'children{a=>2} true',
            'children{amount=1-5} true'
        ]
    },
    {
        id: 'color',
        name: 'Color',
        category: 'Entity',
        type: 'entity',
        description: 'Checks the color of Sheeps, Shulkers, Cats, Parrots, Horses, Llamas, and TraderLlamas',
        aliases: ['clr'],
        attributes: [
            {
                name: 'color',
                aliases: ['clr', 'c'],
                type: 'text',
                required: true,
                default: 'WHITE',
                description: 'The color to check for',
                placeholder: 'RED',
                options: ['WHITE', 'ORANGE', 'MAGENTA', 'LIGHT_BLUE', 'YELLOW', 'LIME', 'PINK', 'GRAY', 'LIGHT_GRAY', 'CYAN', 'PURPLE', 'BLUE', 'BROWN', 'GREEN', 'RED', 'BLACK']
            }
        ],
        examples: [
            'color{c=RED} true',
            'clr{color=BLUE} true'
        ]
    },
    {
        id: 'crouching',
        name: 'Crouching',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target player is crouching/sneaking',
        aliases: ['iscrouching', 'sneaking', 'issneaking'],
        attributes: [],
        examples: [
            'crouching true',
            'sneaking true'
        ]
    },
    {
        id: 'entityType',
        name: 'Entity Type',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the entity type of the target is the specified one. Accepts Spigot entity types',
        aliases: ['mobtype'],
        attributes: [
            {
                name: 'type',
                aliases: ['types', 't'],
                type: 'text',
                required: true,
                description: 'A list of entity types to match (comma-separated)',
                placeholder: 'ZOMBIE,SKELETON',
                validation: 'entity_type'
            }
        ],
        examples: [
            'entitytype{t=ZOMBIE} true',
            'entitytype{types=WITCH,SKELETON} true',
            'mobtype{t=PLAYER} true'
        ]
    },
    {
        id: 'fallSpeed',
        name: 'Fall Speed',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the fall speed of the target is within the given range',
        aliases: ['fallingspeed'],
        attributes: [
            {
                name: 'speed',
                aliases: ['s'],
                type: 'range',
                required: true,
                description: 'The velocity to match',
                placeholder: '>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'fallspeed{s=>5} true',
            'fallingspeed{speed=1-10} true'
        ]
    },
    {
        id: 'faction',
        name: 'Faction',
        category: 'Entity',
        type: 'entity',
        description: 'Tests for the target\'s faction',
        aliases: [],
        attributes: [
            {
                name: 'faction',
                aliases: ['f'],
                type: 'text',
                required: true,
                description: 'The faction to check for',
                placeholder: 'Undead',
                validation: 'text'
            }
        ],
        examples: [
            'faction{faction=Undead} true',
            'faction{f=Players} true'
        ]
    },
    {
        id: 'gliding',
        name: 'Gliding',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity is gliding with elytra',
        aliases: ['isgliding'],
        attributes: [],
        examples: [
            'gliding true',
            'isgliding false'
        ]
    },
    {
        id: 'globalScore',
        name: 'Global Score',
        category: 'Entity',
        type: 'entity',
        description: 'Checks a global scoreboard value (the value associated with the fake player GLOBAL)',
        aliases: ['scoreglobal'],
        attributes: [
            {
                name: 'objective',
                aliases: ['obj', 'o'],
                type: 'text',
                required: true,
                description: 'The scoreboard objective',
                placeholder: 'KillCount',
                validation: 'text'
            },
            {
                name: 'value',
                aliases: ['val', 'v'],
                type: 'range',
                required: true,
                description: 'The value to match',
                placeholder: '>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'globalscore{o=KillCount;value=5} true',
            'scoreglobal{obj=Test;v=>10} true'
        ]
    },
    {
        id: 'hasAI',
        name: 'Has AI',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity has its AI enabled',
        aliases: [],
        attributes: [],
        examples: [
            'hasAI true',
            'hasAI false'
        ]
    },
    {
        id: 'hasAura',
        name: 'Has Aura',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity has the given aura',
        aliases: ['hasbuff', 'hasdebuff'],
        attributes: [
            {
                name: 'aura',
                aliases: ['auraname', 'b', 'buff', 'buffname', 'debuff', 'debuffname', 'n', 'name'],
                type: 'text',
                required: true,
                description: 'The name of the aura to check for',
                placeholder: 'firedebuff',
                validation: 'text'
            }
        ],
        examples: [
            'hasaura{aura=firedebuff} true',
            'hasbuff{name=speedbuff} true'
        ]
    },
    {
        id: 'hasAuraStacks',
        name: 'Has Aura Stacks',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target has the given range of stacks from an aura',
        aliases: ['hasbuffstacks', 'hasdebuffstacks', 'aurastacks', 'buffstacks', 'debuffstacks'],
        attributes: [
            {
                name: 'aura',
                aliases: ['auraname', 'b', 'buff', 'buffname', 'debuff', 'debuffname', 'n', 'name'],
                type: 'text',
                required: true,
                description: 'The name of the aura to check for',
                placeholder: 'firedebuff',
                validation: 'text'
            },
            {
                name: 'stacks',
                aliases: ['s'],
                type: 'range',
                required: false,
                default: '1',
                description: 'The number/range of stacks to check for',
                placeholder: '>3',
                validation: 'number_range'
            }
        ],
        examples: [
            'hasaurastacks{n=firedebuff;s=>3} true',
            'aurastacks{aura=poison;stacks=1-5} true'
        ]
    },
    {
        id: 'hasAuraType',
        name: 'Has Aura Type',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity has the given aura type/group',
        aliases: ['hasbufftype', 'hasdebufftype'],
        attributes: [
            {
                name: 'auragroup',
                aliases: ['auratype', 'group', 'type', 't', 'g'],
                type: 'text',
                required: true,
                description: 'The aura type to check for',
                placeholder: 'Curse',
                validation: 'text'
            }
        ],
        examples: [
            'hasAuraType{type=Curse} true',
            'hasbufftype{group=Blessing} true'
        ]
    },
    {
        id: 'hasCurrency',
        name: 'Has Currency',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target has the given amount of Vault currency/money',
        aliases: ['hasmoney'],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: true,
                description: 'The amount of currency',
                placeholder: '>1000',
                validation: 'number_range'
            }
        ],
        examples: [
            'hascurrency{a=1000} true',
            'hasmoney{amount=>500} true'
        ]
    },
    {
        id: 'hasEnchantment',
        name: 'Has Enchantment',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity\'s equipped item has an enchantment',
        aliases: ['hasEnchant'],
        attributes: [
            {
                name: 'enchantment',
                aliases: ['type', 'ench', 'e', 't'],
                type: 'text',
                required: false,
                default: 'ANY',
                description: 'The enchantment to test for',
                placeholder: 'DAMAGE_ALL',
                validation: 'enchantment'
            },
            {
                name: 'level',
                aliases: ['lvl', 'l'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'The level to test for',
                placeholder: '>3',
                validation: 'number_range'
            }
        ],
        examples: [
            'hasenchantment{e=DAMAGE_ALL;l=>3} true',
            'hasEnchant{type=PROTECTION;level=4} true'
        ]
    },
    {
        id: 'hasGravity',
        name: 'Has Gravity',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target mob has gravity enabled',
        aliases: ['gravity'],
        attributes: [],
        examples: [
            'hasgravity true',
            'gravity false'
        ]
    },
    {
        id: 'hasItem',
        name: 'Has Item',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target player has the given number of given material in inventory',
        aliases: [],
        attributes: [
            {
                name: 'item',
                aliases: ['i', 'material', 'm', 'type', 't', 'mat', 'types'],
                type: 'text',
                required: true,
                description: 'The item to check for (supports vanilla, MythicMobs, MMOItems)',
                placeholder: 'DIAMOND',
                validation: 'item_matcher'
            },
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'The amount to check for',
                placeholder: '1-10',
                validation: 'number_range'
            },
            {
                name: 'strict',
                aliases: ['exact', 'e'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether the matcher should more strictly match the target item',
                validation: 'boolean'
            },
            {
                name: 'vanillaonly',
                aliases: ['vanilla'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether the matched item can only be a vanilla one',
                validation: 'boolean'
            }
        ],
        examples: [
            'hasitem{i=DIAMOND;amount=5} true',
            'hasitem{material=mmoitems.SWORD.CUTLASS;a=1to10} true'
        ]
    },
    {
        id: 'hasOffhand',
        name: 'Has Offhand',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity has something in the offhand',
        aliases: ['offhand'],
        attributes: [],
        examples: [
            'hasoffhand true',
            'offhand false'
        ]
    },
    {
        id: 'hasOwner',
        name: 'Has Owner',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target mob has an owner (Player ownership is cleared on logout)',
        aliases: [],
        attributes: [],
        examples: [
            'hasowner true',
            'hasowner false'
        ]
    },
    {
        id: 'hasParent',
        name: 'Has Parent',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target mob has a parent',
        aliases: [],
        attributes: [],
        examples: [
            'hasparent true',
            'hasparent false'
        ]
    },
    {
        id: 'hasPassenger',
        name: 'Has Passenger',
        category: 'Entity',
        type: 'entity',
        description: 'Checks if the target entity has a passenger riding it',
        aliases: [],
        attributes: [],
        examples: [
            'hasPassenger true',
            'hasPassenger false'
        ]
    },
    {
        id: 'hasPermission',
        name: 'Has Permission',
        category: 'Entity',
        type: 'entity',
        description: 'Tests if the target player has a permission',
        aliases: ['permission'],
        attributes: [
            {
                name: 'permission',
                aliases: ['p'],
                type: 'text',
                required: true,
                description: 'The permission to check for',
                placeholder: 'permission.node.here',
                validation: 'text'
            }
        ],
        examples: [
            'haspermission{p=essentials.fly} true',
            'permission{permission=admin.access} true'
        ]
    }
];

// Export
window.ENTITY_CONDITIONS = ENTITY_CONDITIONS;
console.log('✅ Entity Conditions (Part 1) loaded:', ENTITY_CONDITIONS.length, 'conditions');
