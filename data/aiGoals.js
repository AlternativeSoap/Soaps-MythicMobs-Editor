// AI Goal Selectors from MythicMobs wiki
// Determines what mobs want to "do"

const AI_GOALS = {
  // All Mobs
  ALL_MOBS: [
    {
      goal: 'clear',
      aliases: ['reset'],
      description: 'Removes the AI from the mob',
      category: 'All Mobs',
      priority: 0
    },
    {
      goal: 'breakdoors',
      aliases: [],
      description: 'Causes the mob to break down doors it runs into',
      category: 'All Mobs',
      priority: 1
    },
    {
      goal: 'eatgrass',
      aliases: [],
      description: 'Makes the mob occasionally eat grass',
      category: 'All Mobs',
      priority: 5
    },
    {
      goal: 'float',
      aliases: ['swim'],
      description: 'Makes the mob swim in water',
      category: 'All Mobs',
      priority: 0
    },
    {
      goal: 'lookatplayers',
      aliases: [],
      description: 'The mob will look at nearby players',
      category: 'All Mobs',
      priority: 8
    },
    {
      goal: 'LookAtTarget',
      aliases: [],
      description: 'The mob will look at its target',
      category: 'All Mobs',
      priority: 7
    },
    {
      goal: 'opendoor',
      aliases: ['opendoors'],
      description: 'The mob will open doors it runs into and close the door behind it',
      category: 'All Mobs',
      priority: 2
    },
    {
      goal: 'randomlookaround',
      aliases: ['lookaround'],
      description: 'The mob will randomly look around',
      category: 'All Mobs',
      priority: 8
    },
    {
      goal: 'gotospawnlocation',
      aliases: ['gotospawn'],
      description: 'Mob will pathfind to its spawn location',
      category: 'All Mobs',
      priority: 3
    },
    {
      goal: 'doNothing',
      aliases: [],
      description: 'Causes the mob to do nothing if conditions are met (Premium only)',
      category: 'All Mobs',
      premium: true,
      priority: 0
    }
  ],
  
  // Creatures Only
  CREATURES: [
    {
      goal: 'meleeattack',
      aliases: [],
      description: 'Causes the mob to move to and melee-attack its target',
      category: 'Creatures',
      priority: 2
    },
    {
      goal: 'movetowardstarget',
      aliases: [],
      description: 'Causes the mob to move towards its target',
      category: 'Creatures',
      priority: 3
    },
    {
      goal: 'randomstroll',
      aliases: [],
      description: 'The mob will randomly walk around',
      category: 'Creatures',
      priority: 7
    },
    {
      goal: 'restrictsun',
      aliases: [],
      description: 'Will prevent the mob from entering sunlight',
      category: 'Creatures',
      priority: 2
    },
    {
      goal: 'fleeplayers',
      aliases: ['runfromplayers'],
      description: 'Causes the mob to avoid Players',
      category: 'Creatures',
      priority: 1
    },
    {
      goal: 'fleegolems',
      aliases: ['runfromgolems'],
      description: 'Causes the mob to avoid Iron Golems',
      category: 'Creatures',
      priority: 1
    },
    {
      goal: 'fleevillagers',
      aliases: ['runfromvillagers'],
      description: 'Causes the mob to avoid villagers',
      category: 'Creatures',
      priority: 1
    },
    {
      goal: 'fleewolf',
      aliases: ['runfromwolves'],
      description: 'Causes the mob to avoid wolves',
      category: 'Creatures',
      priority: 1
    },
    {
      goal: 'fleefaction',
      aliases: ['runfromfaction'],
      description: 'Causes the mob to avoid entities in a given faction',
      category: 'Creatures',
      priority: 1,
      params: ['faction']
    },
    {
      goal: 'fleesun',
      aliases: [],
      description: 'The mob will hide in the shade when the sun it out',
      category: 'Creatures',
      priority: 2
    },
    {
      goal: 'fleeConditional',
      aliases: ['fleeIf'],
      description: 'Causes the mob to flee based on provided conditions (Premium only)',
      category: 'Creatures',
      premium: true,
      priority: 1,
      params: ['conditions']
    },
    {
      goal: 'spiderattack',
      aliases: [],
      description: 'Uses the attack a spider would',
      category: 'Creatures',
      priority: 2
    },
    {
      goal: 'zombieattack',
      aliases: [],
      description: 'Zombie melee attack',
      category: 'Creatures',
      priority: 2
    },
    {
      goal: 'leapattarget',
      aliases: [],
      description: 'Makes the mob leap at its target',
      category: 'Creatures',
      priority: 4
    },
    {
      goal: 'movethroughvillage',
      aliases: [],
      description: 'Makes the mob move through villages',
      category: 'Creatures',
      priority: 5
    },
    {
      goal: 'movetoblock',
      aliases: [],
      description: 'Makes the mob go towards a specific type of block',
      category: 'Creatures',
      priority: 5,
      params: ['blockType']
    },
    {
      goal: 'movetolava',
      aliases: [],
      description: 'Makes the mob move towards lava',
      category: 'Creatures',
      priority: 5
    },
    {
      goal: 'movetowater',
      aliases: [],
      description: 'Makes the mob move towards water',
      category: 'Creatures',
      priority: 5
    },
    {
      goal: 'movetowardsrestriction',
      aliases: [],
      description: 'Make a mob move towards its "Restriction Point"',
      category: 'Creatures',
      priority: 4
    },
    {
      goal: 'MoveWithinDistanceOfTarget',
      aliases: [],
      description: 'Moves towards the target to be within a certain range',
      category: 'Creatures',
      priority: 3,
      params: ['distance']
    },
    {
      goal: 'FollowRoute',
      aliases: ['followpath'],
      description: 'Makes the mob follow a specific path, one time only',
      category: 'Creatures',
      priority: 4,
      params: ['path']
    },
    {
      goal: 'patrol',
      aliases: ['patrolroute'],
      description: 'Makes the mob patrol between the specified locations',
      category: 'Creatures',
      priority: 4,
      params: ['x1,y1,z1;x2,y2,z2;...']
    },
    {
      goal: 'gotolocation',
      aliases: ['goto'],
      description: 'Makes the mob go to the specified location',
      category: 'Creatures',
      priority: 4,
      params: ['x,y,z']
    },
    {
      goal: 'gotoowner',
      aliases: [],
      description: 'Makes the mob move towards its owner when beyond a certain distance',
      category: 'Creatures',
      priority: 4,
      params: ['distance']
    },
    {
      goal: 'gotoparent',
      aliases: [],
      description: 'Makes the mob move towards its parent mob',
      category: 'Creatures',
      priority: 4
    },
    {
      goal: 'Panic',
      aliases: ['panicWhenOnFire'],
      description: 'Run around panicking when on fire and look for water',
      category: 'Creatures',
      priority: 1
    },
    {
      goal: 'randomFly',
      aliases: [],
      description: 'Fly around randomly',
      category: 'Creatures',
      priority: 7
    },
    {
      goal: 'randomNod',
      aliases: [],
      description: 'Makes the mob randomly nod its head',
      category: 'Creatures',
      priority: 8
    },
    {
      goal: 'horrified',
      aliases: [],
      description: 'Run around frantically',
      category: 'Creatures',
      priority: 1
    }
  ],
  
  // Animals Only
  ANIMALS: [
    {
      goal: 'breed',
      aliases: [],
      description: 'Causes the mob to be able to breed with other mobs',
      category: 'Animals',
      priority: 5
    }
  ],
  
  // Creepers Only
  CREEPERS: [
    {
      goal: 'creeperswell',
      aliases: ['creeperexplode'],
      description: 'Make a creeper want to explode on its target',
      category: 'Creepers',
      priority: 2
    }
  ],
  
  // Ranged Entities Only
  RANGED: [
    {
      goal: 'rangedattack',
      aliases: ['arrowattack'],
      description: 'A basic ranged/projectile attack',
      category: 'Ranged',
      priority: 2
    },
    {
      goal: 'bowattack',
      aliases: ['bowshoot', 'bowmaster'],
      description: 'An advanced bow attack',
      category: 'Ranged',
      priority: 2
    }
  ],
  
  // Piglins and Pillagers Only
  PIGLINS_PILLAGERS: [
    {
      goal: 'crossbowAttack',
      aliases: [],
      description: 'Attack with a crossbow',
      category: 'Piglins/Pillagers',
      priority: 2
    }
  ]
};

// Flatten all goals into a single array
const ALL_AI_GOALS = [
  ...AI_GOALS.ALL_MOBS,
  ...AI_GOALS.CREATURES,
  ...AI_GOALS.ANIMALS,
  ...AI_GOALS.CREEPERS,
  ...AI_GOALS.RANGED,
  ...AI_GOALS.PIGLINS_PILLAGERS
];

// Categories for filtering
const AI_GOAL_CATEGORIES = [
  'All Mobs',
  'Creatures',
  'Animals',
  'Creepers',
  'Ranged',
  'Piglins/Pillagers'
];
