/**
 * MythicMobs Meta Conditions (Part 3)
 * Final set of meta conditions for advanced checks
 * Based on official MythicMobs documentation
 */

const META_CONDITIONS_FINAL = [
    {
        id: 'playerKills',
        name: 'Player Kills',
        category: 'Player',
        type: 'meta',
        description: 'Matches how many players the target mob has killed',
        aliases: [],
        attributes: [
            {
                name: 'kills',
                aliases: ['k'],
                type: 'range',
                required: false,
                default: '0',
                description: 'The number range to match',
                placeholder: '=>10',
                validation: 'number_range'
            }
        ],
        examples: [
            'playerkills{k=>10} true'
        ]
    },
    {
        id: 'playerNotWithin',
        name: 'Player Not Within',
        category: 'Combat',
        type: 'meta',
        description: 'Checks if any players are NOT within a radius of the target',
        aliases: ['playersnotwithin'],
        attributes: [
            {
                name: 'distance',
                aliases: ['d'],
                type: 'number',
                required: false,
                default: 0,
                description: 'The radius to check in',
                placeholder: '10',
                validation: 'number'
            }
        ],
        examples: [
            'playernotwithin{d=10} true'
        ]
    },
    {
        id: 'playerWithin',
        name: 'Player Within',
        category: 'Combat',
        type: 'meta',
        description: 'Checks if any players are within a radius of the target',
        aliases: ['playerswithin'],
        attributes: [
            {
                name: 'distance',
                aliases: ['d'],
                type: 'number',
                required: false,
                default: 0,
                description: 'The radius to check in',
                placeholder: '10',
                validation: 'number'
            }
        ],
        examples: [
            'playerwithin{d=10} true'
        ]
    },
    {
        id: 'playersInRadius',
        name: 'Players In Radius',
        category: 'Server & World',
        type: 'meta',
        description: 'Checks how many players are in a radius',
        aliases: ['pir', 'playerInRadius'],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'The given range value to check',
                placeholder: '=>3',
                validation: 'number_range'
            },
            {
                name: 'radius',
                aliases: ['r', 'distance', 'd'],
                type: 'number',
                required: false,
                default: 32,
                description: 'The given radius to check',
                placeholder: '16',
                validation: 'number'
            },
            {
                name: 'ignorespectator',
                aliases: ['is'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether players in spectator mode should be ignored',
                validation: 'boolean'
            }
        ],
        examples: [
            'playersinradius{a=>3;r=16} true'
        ]
    },
    {
        id: 'playersInWorld',
        name: 'Players In World',
        category: 'Server & World',
        type: 'meta',
        description: 'Matches the number of players in the caster\'s world',
        aliases: [],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '0',
                description: 'The number of players to check for. Can be a range',
                placeholder: '=>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'playersInWorld{amount=>5} true'
        ]
    },
    {
        id: 'playersOnline',
        name: 'Players Online',
        category: 'Server & World',
        type: 'meta',
        description: 'Matches the number of players online',
        aliases: ['onlineplayercount', 'onlineplayers'],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '0',
                description: 'The number of players to check for. Can be a range',
                placeholder: '=>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'playersOnline{amount=>5} true'
        ]
    },
    {
        id: 'plugin',
        name: 'Plugin',
        category: 'Server & World',
        type: 'meta',
        description: 'Checks if the specified plugin is running on the server',
        aliases: ['pluginexists', 'hasplugin'],
        attributes: [
            {
                name: 'plugin',
                aliases: ['pl', 'p'],
                type: 'text',
                required: false,
                default: 'MythicMobs',
                description: 'The plugin to check for',
                placeholder: 'ThePluginName',
                validation: 'text'
            }
        ],
        examples: [
            'plugin{p=ThePluginName} true'
        ]
    },
    {
        id: 'premium',
        name: 'Premium',
        category: 'Player',
        type: 'meta',
        description: 'Checks if MythicMobs Premium is running on the server',
        aliases: ['ispremium', 'iscool'],
        attributes: [],
        examples: [
            'premium true'
        ]
    },
    {
        id: 'projectileHasEnded',
        name: 'Projectile Has Ended',
        category: 'Combat',
        type: 'meta',
        description: 'Checks if the calling projectile has ended',
        aliases: [],
        attributes: [],
        examples: [
            'projectilehasended true'
        ]
    },
    {
        id: 'sameFaction',
        name: 'Same Faction',
        category: 'Entity Type',
        type: 'meta',
        description: 'Checks if the target entity is in the same faction as the caster',
        aliases: ['factionsame'],
        attributes: [],
        examples: [
            'samefaction true'
        ]
    },
    {
        id: 'score',
        name: 'Score',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks a scoreboard value of the target entity',
        aliases: [],
        attributes: [
            {
                name: 'objective',
                aliases: ['obj', 'o'],
                type: 'text',
                required: true,
                description: 'The objective',
                placeholder: 'PlayerKills',
                validation: 'text'
            },
            {
                name: 'entry',
                aliases: ['ent', 'e'],
                type: 'text',
                required: true,
                description: 'The entry',
                placeholder: 'Akim91',
                validation: 'text'
            },
            {
                name: 'value',
                aliases: ['val', 'v'],
                type: 'range',
                required: true,
                description: 'The value to match',
                placeholder: '10',
                validation: 'number_range'
            }
        ],
        examples: [
            'score{o=PlayerKills;e=Akim91;v=10} true'
        ]
    },
    {
        id: 'serverIsPaper',
        name: 'Server Is Paper',
        category: 'Server & World',
        type: 'meta',
        description: 'Checks whether the server is running a fork of Paper',
        aliases: ['ispaper'],
        attributes: [],
        examples: [
            'serverispaper true'
        ]
    },
    {
        id: 'serverNMSVersion',
        name: 'Server NMS Version',
        category: 'Server & World',
        type: 'meta',
        description: 'Checks if the server is running a specific Minecraft NMS version',
        aliases: ['servernms', 'nmsversion'],
        attributes: [
            {
                name: 'version',
                aliases: ['sv', 'v'],
                type: 'text',
                required: false,
                default: 'v1_19_R1_2',
                description: 'The NMS version to check for',
                placeholder: 'v1_19_R1',
                validation: 'text'
            }
        ],
        examples: [
            'nmsversion{v="v1_19_R1"} true'
        ]
    },
    {
        id: 'serverVersion',
        name: 'Server Version',
        category: 'Server & World',
        type: 'meta',
        description: 'Checks if the server is running a specific Minecraft version',
        aliases: ['server', 'version'],
        attributes: [
            {
                name: 'version',
                aliases: ['sv', 'v'],
                type: 'text',
                required: false,
                default: '1.19.3',
                description: 'The version to check for',
                placeholder: '1.19.4',
                validation: 'text'
            }
        ],
        examples: [
            'serverversion{v="v1.19.4"} true'
        ]
    },
    {
        id: 'serverVersionAfterOrEqual',
        name: 'Server Version After Or Equal',
        category: 'Server & World',
        type: 'meta',
        description: 'Checks whether the server is after or equal to a specific version',
        aliases: ['serverAfterEq', 'serverAfter', 'versionAfterEq', 'versionAfter'],
        attributes: [
            {
                name: 'version',
                aliases: ['v', 'sv'],
                type: 'text',
                required: false,
                default: '1.19.3',
                description: 'The version to check against',
                placeholder: '1.21.1',
                validation: 'text'
            },
            {
                name: 'inclusive',
                aliases: ['i'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether to check if current version is exactly the specified one',
                validation: 'boolean'
            }
        ],
        examples: [
            'serverAfter{version=1.21.1} false'
        ]
    },
    {
        id: 'serverVersionBefore',
        name: 'Server Version Before',
        category: 'Server & World',
        type: 'meta',
        description: 'Checks whether the server is before a specific version',
        aliases: ['serverBefore', 'versionBefore'],
        attributes: [
            {
                name: 'version',
                aliases: ['v', 'sv'],
                type: 'text',
                required: false,
                default: '1.19.3',
                description: 'The version to check against',
                placeholder: '1.21.1',
                validation: 'text'
            },
            {
                name: 'inclusive',
                aliases: ['i'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether to check if current version is exactly the specified one',
                validation: 'boolean'
            }
        ],
        examples: [
            'serverBefore{version=1.21.1} true'
        ]
    },
    {
        id: 'skillOnCooldown',
        name: 'Skill On Cooldown',
        category: 'Player',
        type: 'meta',
        description: 'Checks if the given skill is in cooldown for the target entity',
        aliases: [],
        attributes: [
            {
                name: 'skill',
                aliases: ['s'],
                type: 'text',
                required: true,
                description: 'The metaskill to check',
                placeholder: 'TestSkill',
                validation: 'text'
            }
        ],
        examples: [
            'skillOnCooldown{skill=TestSkill} true'
        ]
    },
    {
        id: 'spawnReason',
        name: 'Spawn Reason',
        category: 'Entity Type',
        type: 'meta',
        description: 'Checks against the spawn reason of the target(s)',
        aliases: [],
        attributes: [
            {
                name: 'reason',
                aliases: ['r'],
                type: 'text',
                required: true,
                description: 'The reason to check for (any Bukkit spawn reason)',
                placeholder: 'RAID',
                validation: 'spawn_reason'
            }
        ],
        examples: [
            'spawnReason{reason=RAID} true'
        ]
    },
    {
        id: 'sprinting',
        name: 'Sprinting',
        category: 'Entity State',
        type: 'meta',
        description: 'Checks if the target Player is sprinting',
        aliases: ['issprinting'],
        attributes: [],
        examples: [
            'sprinting true'
        ]
    },
    {
        id: 'stance',
        name: 'Stance',
        category: 'Entity State',
        type: 'meta',
        description: 'Checks the stance of the target mob',
        aliases: [],
        attributes: [
            {
                name: 'stance',
                aliases: ['s'],
                type: 'text',
                required: false,
                default: 'DEFAULT',
                description: 'The stance to match',
                placeholder: 'CombatStance',
                validation: 'text'
            },
            {
                name: 'strict',
                aliases: ['str'],
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether to match exactly. If false, checks if stance contains this word',
                validation: 'boolean'
            }
        ],
        examples: [
            'stance{s=CombatStance;str=true} true'
        ]
    },
    {
        id: 'stringEmpty',
        name: 'String Empty',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks if the provided string is empty',
        aliases: ['isEmpty'],
        attributes: [
            {
                name: 'value',
                aliases: ['val', 'v', 'string', 's'],
                type: 'text',
                required: true,
                description: 'The string to check',
                placeholder: '<caster.var.examplevariable>',
                validation: 'text'
            }
        ],
        examples: [
            'stringEmpty{value=<caster.var.examplevariable>} true'
        ]
    },
    {
        id: 'stringNotEmpty',
        name: 'String Not Empty',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks if the provided string is not empty',
        aliases: ['notEmpty'],
        attributes: [
            {
                name: 'value',
                aliases: ['val', 'v', 'string', 's'],
                type: 'text',
                required: true,
                description: 'The string to check',
                placeholder: '<caster.var.examplevariable>',
                validation: 'text'
            }
        ],
        examples: [
            'stringNotEmpty{value=<caster.var.examplevariable>} true'
        ]
    },
    {
        id: 'stringEquals',
        name: 'String Equals',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks if value1 equals value2. Both values can use variables and placeholders',
        aliases: ['stringEq'],
        attributes: [
            {
                name: 'value1',
                aliases: ['val1', 'v1', 'string', 's'],
                type: 'text',
                required: true,
                description: 'The first value',
                placeholder: 'yes!',
                validation: 'text'
            },
            {
                name: 'value2',
                aliases: ['val2', 'v2', 'value', 'val', 'v', 'equals', 'eq', 'e'],
                type: 'text',
                required: true,
                description: 'The second value',
                placeholder: 'yes!',
                validation: 'text'
            }
        ],
        examples: [
            'stringequals{val1="yes!";val2="yes!"} true'
        ]
    },
    {
        id: 'structure',
        name: 'Structure',
        category: 'Location',
        type: 'meta',
        description: 'Matches if the target location is inside of a structure. Supports wildcards and structures from datapacks',
        aliases: [],
        attributes: [
            {
                name: 'structure',
                aliases: ['structures', 's'],
                type: 'text',
                required: false,
                default: 'village',
                description: 'The structure to check for. Can be a list',
                placeholder: 'minecraft:desert_pyramid',
                validation: 'text'
            }
        ],
        examples: [
            'structure{s=minecraft:desert_pyramid} true'
        ]
    },
    {
        id: 'targetInLineOfSight',
        name: 'Target In Line Of Sight',
        category: 'Combat',
        type: 'meta',
        description: 'Tests if the target entity has line of sight to their target',
        aliases: [],
        attributes: [],
        examples: [
            'targetinlineofsight true'
        ]
    },
    {
        id: 'targetNotInLineOfSight',
        name: 'Target Not In Line Of Sight',
        category: 'Combat',
        type: 'meta',
        description: 'Tests if the target doesn\'t have line of sight to their target',
        aliases: [],
        attributes: [],
        examples: [
            'targetnotinlineofsight true'
        ]
    },
    {
        id: 'targetWithin',
        name: 'Target Within',
        category: 'Combat',
        type: 'meta',
        description: 'Tests if the target\'s target is within a certain distance',
        aliases: [],
        attributes: [
            {
                name: 'distance',
                aliases: ['d'],
                type: 'number',
                required: false,
                default: 0,
                description: 'Distance to check',
                placeholder: '10',
                validation: 'number'
            }
        ],
        examples: [
            'targetwithin{d=10} true'
        ]
    },
    {
        id: 'targetNotWithin',
        name: 'Target Not Within',
        category: 'Combat',
        type: 'meta',
        description: 'Tests if the target\'s target is not within a certain distance',
        aliases: [],
        attributes: [
            {
                name: 'distance',
                aliases: ['d'],
                type: 'number',
                required: false,
                default: 0,
                description: 'Distance to check',
                placeholder: '10',
                validation: 'number'
            }
        ],
        examples: [
            'targetnotwithin{d=10} true'
        ]
    },
    {
        id: 'targets',
        name: 'Targets',
        category: 'Combat',
        type: 'meta',
        description: 'Checks if the number of inherited targets from the parent skilltree matches the given range',
        aliases: [],
        attributes: [
            {
                name: 'amount',
                aliases: ['a'],
                type: 'range',
                required: false,
                default: '>0',
                description: 'Range of how many targets to check for',
                placeholder: '>0',
                validation: 'number_range'
            }
        ],
        examples: [
            'targets{a=>0} true',
            'targets{a=0to5} true'
        ]
    },
    {
        id: 'templateType',
        name: 'Template Type',
        category: 'Entity Type',
        type: 'meta',
        description: 'Checks if the target mob extends the specified Template',
        aliases: ['template', 'instanceOf'],
        attributes: [
            {
                name: 'templates',
                aliases: ['template', 't'],
                type: 'text',
                required: true,
                description: 'The template to match. Can be a list',
                placeholder: 'NetherMob,EndMob',
                validation: 'text'
            }
        ],
        examples: [
            'templatetype{template=NetherMob,EndMob} true'
        ]
    },
    {
        id: 'triggerBlockType',
        name: 'Trigger Block Type',
        category: 'Location',
        type: 'meta',
        description: 'Checks against the material type that triggered the skill. Only works with specific Triggers',
        aliases: ['triggeringBlockType'],
        attributes: [
            {
                name: 'types',
                aliases: ['type', 't', 'material', 'mat', 'm', 'block', 'b'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'A list of materials to check against',
                placeholder: 'STONE,DIRT',
                validation: 'material'
            }
        ],
        examples: [
            'triggerblocktype{mat=STONE,DIRT} true'
        ]
    },
    {
        id: 'triggerItemType',
        name: 'Trigger Item Type',
        category: 'Location',
        type: 'meta',
        description: 'Checks against the item material type that triggered the skill. Only works with specific Triggers',
        aliases: ['triggeringItemType'],
        attributes: [
            {
                name: 'types',
                aliases: ['type', 't', 'material', 'mat', 'm', 'items', 'item', 'i'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'A list of materials to check against',
                placeholder: 'STONE,DIRT,STONE_SWORD',
                validation: 'material'
            }
        ],
        examples: [
            'triggeritemtype{mat=STONE,DIRT,STONE_SWORD} true'
        ]
    },
    {
        id: 'variableContains',
        name: 'Variable Contains',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks if the given variable contains a certain value. For Strings, checks if it contains a substring. For Lists/Sets, checks if it contains elements',
        aliases: ['variableContain', 'varContains', 'varContain', 'varCont'],
        attributes: [
            {
                name: 'variable',
                aliases: ['name', 'n', 'var', 'key', 'k'],
                type: 'text',
                required: true,
                description: 'The name of the variable. Can optionally be prefixed with scope',
                placeholder: 'skill.examplelist',
                validation: 'text'
            },
            {
                name: 'scope',
                aliases: ['s'],
                type: 'text',
                required: false,
                default: '',
                description: 'The scope of the variable',
                placeholder: 'skill',
                validation: 'text'
            },
            {
                name: 'compareType',
                aliases: ['compare', 'comp'],
                type: 'text',
                required: false,
                default: 'ALL',
                description: 'The comparison type: ALL, ANY, STARTS_WITH, ENDS_WITH',
                placeholder: 'ALL',
                options: ['ALL', 'ANY', 'STARTS_WITH', 'ENDS_WITH'],
                validation: 'compare_type'
            },
            {
                name: 'value',
                aliases: ['val', 'v'],
                type: 'text',
                required: true,
                description: 'The value of the comparison',
                placeholder: 'hello',
                validation: 'text'
            }
        ],
        examples: [
            'variablecontains{var=skill.examplelist;val=hello} true',
            'variablecontains{var=skill.examplestring;val=pizza} true'
        ]
    },
    {
        id: 'variableEquals',
        name: 'Variable Equals',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks the value of a variable. Value can include placeholders, even from PlaceholderAPI',
        aliases: ['variableeq', 'varequals', 'vareq'],
        attributes: [
            {
                name: 'variable',
                aliases: ['name', 'n', 'var', 'key', 'k'],
                type: 'text',
                required: true,
                description: 'The name of the variable. Can optionally be prefixed with scope',
                placeholder: 'target.heardbear',
                validation: 'text'
            },
            {
                name: 'value',
                aliases: ['val', 'v'],
                type: 'text',
                required: true,
                description: 'The value that the variable must equal',
                placeholder: 'yes',
                validation: 'text'
            },
            {
                name: 'scope',
                aliases: ['s'],
                type: 'text',
                required: false,
                default: '',
                description: 'The scope of the variable',
                placeholder: 'target',
                validation: 'text'
            }
        ],
        examples: [
            'variableEquals{var=target.heardbear;value="yes"} cancel',
            'varEquals{var=global.poison_storm;value="yes"} true'
        ]
    },
    {
        id: 'variableInRange',
        name: 'Variable In Range',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks if the given numeric variable is within a certain range',
        aliases: ['varinrange', 'varrange'],
        attributes: [
            {
                name: 'variable',
                aliases: ['name', 'n', 'var', 'key', 'k'],
                type: 'text',
                required: true,
                description: 'Variable to match, optionally prefixed by a scope',
                placeholder: 'caster.shootsLeft',
                validation: 'text'
            },
            {
                name: 'value',
                aliases: ['val', 'v', 'range', 'r'],
                type: 'range',
                required: true,
                description: 'A number range to match',
                placeholder: '>0',
                validation: 'number_range'
            },
            {
                name: 'scope',
                aliases: ['s'],
                type: 'text',
                required: false,
                default: '',
                description: 'The scope of the variable',
                placeholder: 'caster',
                validation: 'text'
            }
        ],
        examples: [
            'variableInRange{var=caster.shootsLeft;value=>0} castInstead ShootThemUp'
        ]
    },
    {
        id: 'variableIsSet',
        name: 'Variable Is Set',
        category: 'Variables & Data',
        type: 'meta',
        description: 'Checks if the given variable is set',
        aliases: ['varisset', 'varset'],
        attributes: [
            {
                name: 'variable',
                aliases: ['name', 'n', 'var', 'key', 'k'],
                type: 'text',
                required: true,
                description: 'The name of the variable. Can optionally be prefixed with scope',
                placeholder: 'target.dazed',
                validation: 'text'
            },
            {
                name: 'scope',
                aliases: ['s'],
                type: 'text',
                required: false,
                default: '',
                description: 'The scope of the variable',
                placeholder: 'target',
                validation: 'text'
            }
        ],
        examples: [
            'variableisset{var=target.dazed} true'
        ]
    },
    {
        id: 'vehicleIsDead',
        name: 'Vehicle Is Dead',
        category: 'Entity State',
        type: 'meta',
        description: 'Checks if the casters mounted vehicle is dead',
        aliases: [],
        attributes: [],
        examples: [
            'vehicleisdead true'
        ]
    },
    {
        id: 'velocity',
        name: 'Velocity',
        category: 'Entity State',
        type: 'meta',
        description: 'Checks the velocity of the target entity against a range',
        aliases: [],
        attributes: [
            {
                name: 'velocity',
                aliases: ['v'],
                type: 'range',
                required: true,
                description: 'The velocity to check for',
                placeholder: '<3',
                validation: 'number_range'
            }
        ],
        examples: [
            'velocity{v=<3} true'
        ]
    },
    {
        id: 'wearing',
        name: 'Wearing',
        category: 'Player',
        type: 'meta',
        description: 'Checks if the target entity is wearing the selected item. Uses the Item Matcher',
        aliases: ['iswearing', 'wielding', 'iswielding'],
        attributes: [
            {
                name: 'armorslot',
                aliases: ['slot', 's'],
                type: 'text',
                required: false,
                default: 'HEAD',
                description: 'The item slot to check',
                placeholder: 'CHEST',
                options: ['HEAD', 'CHEST', 'LEGS', 'FEET', 'HAND', 'OFFHAND'],
                validation: 'slot'
            },
            {
                name: 'material',
                aliases: ['mat', 'm', 'item', 'i', 't', 'type', 'types'],
                type: 'text',
                required: false,
                default: 'DIRT',
                description: 'A material or MythicItem name to check for',
                placeholder: 'IRON_SWORD',
                validation: 'item_matcher'
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
            'wearing{slot=HAND;m=IRON_SWORD} true',
            'wearing{slot=CHEST;m=mmoitems.TYPE.ID} true'
        ]
    },
    {
        id: 'world',
        name: 'World',
        category: 'Location',
        type: 'meta',
        description: 'Checks the name of the target world',
        aliases: [],
        attributes: [
            {
                name: 'world',
                aliases: ['w'],
                type: 'text',
                required: false,
                default: 'tutorial_world',
                description: 'A list of worlds you wish to check for (comma-separated)',
                placeholder: 'world1,world2',
                validation: 'text'
            }
        ],
        examples: [
            'world{w=tutorial_world} true',
            'world{w=world1,world2} true'
        ]
    }
];

// Export
window.META_CONDITIONS_FINAL = META_CONDITIONS_FINAL;
// Loaded silently
