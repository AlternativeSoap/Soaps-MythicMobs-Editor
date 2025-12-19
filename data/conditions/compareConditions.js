/**
 * MythicMobs Compare Conditions
 * Conditions that check comparisons between entities or locations
 * Based on official MythicMobs documentation
 */

const COMPARE_CONDITIONS = [
    {
        id: 'boundingBoxesOverlap',
        name: 'Bounding Boxes Overlap',
        category: 'Combat',
        type: 'compare',
        description: 'Checks if the caster\'s BoundingBox overlaps with the target\'s',
        aliases: ['bbsoverlap'],
        attributes: [
            {
                name: 'shiftforward',
                aliases: ['so', 'forwardoffset', 'fo', 'forward', 'f'],
                type: 'number',
                required: false,
                default: 0.0,
                description: 'The forward offset of the caster\'s BoundingBox',
                placeholder: '0.0',
                validation: 'number'
            }
        ],
        examples: [
            'boundingBoxesOverlap false'
        ]
    },
    {
        id: 'cuboid',
        name: 'Cuboid',
        category: 'Location',
        type: 'compare',
        description: 'Whether the target is within a cuboid that has location1 and location2 as opposite vertices',
        aliases: ['incuboid'],
        attributes: [
            {
                name: 'location1',
                aliases: ['loc1', 'l1', 'a'],
                type: 'text',
                required: true,
                description: 'x,y,z coordinates for the 1st point',
                placeholder: '100,64,100',
                validation: 'coordinates'
            },
            {
                name: 'location2',
                aliases: ['loc2', 'l2', 'b'],
                type: 'text',
                required: true,
                description: 'x,y,z coordinates for the 2nd point',
                placeholder: '150,80,150',
                validation: 'coordinates'
            },
            {
                name: 'relative',
                aliases: ['r'],
                type: 'boolean',
                required: false,
                default: false,
                description: 'Whether or not the coordinates should be relative to the caster',
                validation: 'boolean'
            }
        ],
        examples: [
            'cuboid{location1=x,y,z;location2=x,y,z;relative=true} true'
        ]
    },
    {
        id: 'distance',
        name: 'Distance',
        category: 'Combat',
        type: 'compare',
        description: 'Whether the distance between the caster and target is within the given range. Can be a single number, a ranged value (20to40), or >10 <5, etc.',
        aliases: [],
        attributes: [
            {
                name: 'distance',
                aliases: ['d'],
                type: 'range',
                required: true,
                description: 'The distance to match',
                placeholder: '<20',
                validation: 'number_range'
            }
        ],
        examples: [
            'distance{d=<2} true',
            'distance{d=10-20} true'
        ]
    },
    {
        id: 'distanceFromLocation',
        name: 'Distance From Location',
        category: 'Combat',
        type: 'compare',
        description: 'Whether the distance between the target and a specified location is within a certain range',
        aliases: [],
        attributes: [
            {
                name: 'x',
                aliases: [],
                type: 'number',
                required: false,
                default: 0,
                description: 'The x component of the location',
                placeholder: '10',
                validation: 'number'
            },
            {
                name: 'y',
                aliases: [],
                type: 'number',
                required: false,
                default: 0,
                description: 'The y component of the location',
                placeholder: '20',
                validation: 'number'
            },
            {
                name: 'z',
                aliases: [],
                type: 'number',
                required: false,
                default: 0,
                description: 'The z component of the location',
                placeholder: '30',
                validation: 'number'
            },
            {
                name: 'world',
                aliases: ['w'],
                type: 'text',
                required: false,
                default: '',
                description: 'The world of the location. Defaults to the world of the target',
                placeholder: 'world',
                validation: 'text'
            },
            {
                name: 'distance',
                aliases: ['d'],
                type: 'range',
                required: true,
                description: 'The distance from the specified location to check against',
                placeholder: '<20',
                validation: 'number_range'
            }
        ],
        examples: [
            'distanceFromLocation{x=10;y=20;z=30;distance=<20} true'
        ]
    },
    {
        id: 'distanceFromSpawn',
        name: 'Distance From Spawn',
        category: 'Combat',
        type: 'compare',
        description: 'Whether the distance from the world\'s spawn point to the target is within the given range',
        aliases: [],
        attributes: [
            {
                name: 'distance',
                aliases: ['d'],
                type: 'range',
                required: true,
                description: 'The distance to match',
                placeholder: '<100',
                validation: 'number_range'
            }
        ],
        examples: [
            'distancefromspawn{d=<100} true',
            'distancefromspawn{d=>50} true'
        ]
    },
    {
        id: 'distanceFromTrackedLocation',
        name: 'Distance From Tracked Location',
        category: 'Combat',
        type: 'compare',
        description: 'Checks if the distance between the caster and its tracked location is within the specified values',
        aliases: ['distanceFromTL'],
        attributes: [
            {
                name: 'distance',
                aliases: ['d'],
                type: 'range',
                required: true,
                description: 'The values to check for. Can be a range.',
                placeholder: '5',
                validation: 'number_range'
            }
        ],
        examples: [
            'DistanceFromTrackedLocation{d=5} true',
            'DistanceFromTrackedLocation{d=2to10} true'
        ]
    },
    {
        id: 'fieldOfView',
        name: 'Field of View',
        category: 'Combat',
        type: 'compare',
        description: 'Tests if the target is within the given angle from where the caster is looking',
        aliases: ['infieldofview', 'fov'],
        attributes: [
            {
                name: 'angle',
                aliases: ['a'],
                type: 'number',
                required: false,
                default: 90,
                description: 'The angle of the FOV to check in',
                placeholder: '90',
                validation: 'number'
            },
            {
                name: 'rotation',
                aliases: ['r'],
                type: 'number',
                required: false,
                default: 0,
                description: 'Rotates the FOV to check in',
                placeholder: '0',
                validation: 'number'
            }
        ],
        examples: [
            'fieldofview{angle=90} false',
            'fieldofview{angle=90} true'
        ]
    },
    {
        id: 'facing',
        name: 'Facing',
        category: 'Combat',
        type: 'compare',
        description: 'Tests if the target entity is facing towards the caster. Supports a tolerance modifier to allow for slight inaccuracies',
        aliases: [],
        attributes: [
            {
                name: 'tolerance',
                aliases: ['t'],
                type: 'number',
                required: false,
                default: 0.35,
                description: 'The tolerance for facing direction check',
                placeholder: '0.35',
                validation: 'number'
            }
        ],
        examples: [
            'facing{t=0.5} true'
        ]
    },
    {
        id: 'lookingAt',
        name: 'Looking At',
        category: 'Location',
        type: 'compare',
        description: 'Checks if the caster is looking directly at the target entity',
        aliases: [],
        attributes: [],
        examples: [
            'lookingat true'
        ]
    },
    {
        id: 'owner',
        name: 'Owner',
        category: 'Entity Type',
        type: 'compare',
        description: 'Checks if the target mob is owned by the caster',
        aliases: [],
        attributes: [],
        examples: [
            'owner true'
        ]
    },
    {
        id: 'ownerIsOnline',
        name: 'Owner Is Online',
        category: 'Entity Type',
        type: 'compare',
        description: 'Checks if the owner of the target mob is online',
        aliases: [],
        attributes: [],
        examples: [
            'ownerisonline true'
        ]
    },
    {
        id: 'sameWorld',
        name: 'Same World',
        category: 'Location',
        type: 'compare',
        description: 'Checks if the caster and target are in the same world',
        aliases: [],
        attributes: [],
        examples: [
            'sameworld true'
        ]
    },
    {
        id: 'isCaster',
        name: 'Is Caster',
        category: 'Entity Type',
        type: 'compare',
        description: 'Checks if the target is the caster of the skill',
        aliases: [],
        attributes: [],
        examples: [
            'isCaster true'
        ]
    },
    {
        id: 'isParent',
        name: 'Is Parent',
        category: 'Entity Type',
        type: 'compare',
        description: 'Checks if the target entity is the parent of the caster',
        aliases: ['parent'],
        attributes: [],
        examples: [
            'isparent true',
            'parent true'
        ]
    },
    {
        id: 'isSibling',
        name: 'Is Sibling',
        category: 'Entity Type',
        type: 'compare',
        description: 'Checks if the target is a sibling of the caster',
        aliases: ['sibling'],
        attributes: [],
        examples: [
            'IsSibling true',
            'sibling true'
        ]
    },
    {
        id: 'xDiff',
        name: 'X Diff',
        category: 'Combat',
        type: 'compare',
        description: 'Checks the difference in X between the targeted entity and the caster',
        aliases: [],
        attributes: [
            {
                name: 'difference',
                aliases: ['diff', 'd'],
                type: 'range',
                required: true,
                description: 'The X difference to check',
                placeholder: '>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'xDiff{diff=>5} true'
        ]
    },
    {
        id: 'yDiff',
        name: 'Y Diff',
        category: 'Combat',
        type: 'compare',
        description: 'Checks the difference in Y between the targeted entity and the caster',
        aliases: [],
        attributes: [
            {
                name: 'difference',
                aliases: ['diff', 'd'],
                type: 'range',
                required: true,
                description: 'The Y difference to check',
                placeholder: '>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'yDiff{diff=>5} true'
        ]
    },
    {
        id: 'zDiff',
        name: 'Z Diff',
        category: 'Combat',
        type: 'compare',
        description: 'Checks the difference in Z between the targeted entity and the caster',
        aliases: [],
        attributes: [
            {
                name: 'difference',
                aliases: ['diff', 'd'],
                type: 'range',
                required: true,
                description: 'The Z difference to check',
                placeholder: '>5',
                validation: 'number_range'
            }
        ],
        examples: [
            'zDiff{diff=>5} true'
        ]
    }
];

// Export
window.COMPARE_CONDITIONS = COMPARE_CONDITIONS;
// Loaded silently
