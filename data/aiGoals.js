// AI Goal Selectors from MythicMobs wiki
// Determines what mobs want to "do"
// Reference: https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Mobs/Custom-AI

const AI_GOALS = {
  // All Mobs
  ALL_MOBS: [
    {
      goal: 'clear',
      aliases: ['reset'],
      description: 'Removes the AI from the mob. Always use this first when customizing AI.',
      category: 'All Mobs',
      priority: 0,
      icon: 'eraser',
      important: true
    },
    {
      goal: 'breakdoors',
      aliases: [],
      description: 'Causes the mob to break down doors it runs into',
      category: 'All Mobs',
      priority: 1,
      icon: 'door-open'
    },
    {
      goal: 'eatgrass',
      aliases: [],
      description: 'Makes the mob occasionally eat grass (sheep behavior)',
      category: 'All Mobs',
      priority: 5,
      icon: 'seedling'
    },
    {
      goal: 'float',
      aliases: ['swim'],
      description: 'Makes the mob swim in water instead of sinking',
      category: 'All Mobs',
      priority: 0,
      icon: 'water'
    },
    {
      goal: 'lookatplayers',
      aliases: [],
      description: 'The mob will look at nearby players',
      category: 'All Mobs',
      priority: 8,
      icon: 'eye'
    },
    {
      goal: 'LookAtTarget',
      aliases: [],
      description: 'The mob will look at its current target',
      category: 'All Mobs',
      priority: 7,
      icon: 'bullseye'
    },
    {
      goal: 'opendoor',
      aliases: ['opendoors'],
      description: 'The mob will open doors it runs into and close them behind it',
      category: 'All Mobs',
      priority: 2,
      icon: 'door-closed'
    },
    {
      goal: 'randomlookaround',
      aliases: ['lookaround'],
      description: 'The mob will randomly look around when idle',
      category: 'All Mobs',
      priority: 8,
      icon: 'search'
    },
    {
      goal: 'gotospawnlocation',
      aliases: ['gotospawn'],
      description: 'Mob will pathfind back to its spawn location',
      category: 'All Mobs',
      priority: 3,
      icon: 'home'
    },
    {
      goal: 'doNothing',
      aliases: [],
      description: 'Causes the mob to do nothing if conditions are met',
      category: 'All Mobs',
      premium: true,
      priority: 0,
      icon: 'pause',
      params: ['conditions']
    }
  ],
  
  // Creatures Only
  CREATURES: [
    {
      goal: 'meleeattack',
      aliases: [],
      description: 'Causes the mob to move to and melee-attack its target',
      category: 'Creatures',
      priority: 2,
      icon: 'fist-raised',
      important: true
    },
    {
      goal: 'movetowardstarget',
      aliases: [],
      description: 'Causes the mob to move towards its target without attacking',
      category: 'Creatures',
      priority: 3,
      icon: 'walking'
    },
    {
      goal: 'randomstroll',
      aliases: [],
      description: 'The mob will randomly walk around when idle',
      category: 'Creatures',
      priority: 7,
      icon: 'shoe-prints',
      important: true
    },
    {
      goal: 'restrictsun',
      aliases: [],
      description: 'Will prevent the mob from entering sunlight (undead behavior)',
      category: 'Creatures',
      priority: 2,
      icon: 'sun'
    },
    {
      goal: 'fleeplayers',
      aliases: ['runfromplayers'],
      description: 'Causes the mob to run away from players',
      category: 'Creatures',
      priority: 1,
      icon: 'running'
    },
    {
      goal: 'fleegolems',
      aliases: ['runfromgolems'],
      description: 'Causes the mob to avoid Iron Golems',
      category: 'Creatures',
      priority: 1,
      icon: 'robot'
    },
    {
      goal: 'fleevillagers',
      aliases: ['runfromvillagers'],
      description: 'Causes the mob to avoid villagers',
      category: 'Creatures',
      priority: 1,
      icon: 'user'
    },
    {
      goal: 'fleewolf',
      aliases: ['runfromwolves'],
      description: 'Causes the mob to avoid wolves',
      category: 'Creatures',
      priority: 1,
      icon: 'dog'
    },
    {
      goal: 'fleefaction',
      aliases: ['runfromfaction'],
      description: 'Causes the mob to avoid entities in a given faction',
      category: 'Creatures',
      priority: 1,
      icon: 'users-slash',
      params: ['faction']
    },
    {
      goal: 'fleesun',
      aliases: [],
      description: 'The mob will hide in the shade when the sun is out',
      category: 'Creatures',
      priority: 2,
      icon: 'cloud-sun'
    },
    {
      goal: 'fleeConditional',
      aliases: ['fleeIf'],
      description: 'Causes the mob to flee based on provided conditions. Safe speed required for distances > 5',
      category: 'Creatures',
      premium: true,
      priority: 1,
      icon: 'running',
      params: ['conditions', 'speed', 'distance']
    },
    {
      goal: 'spiderattack',
      aliases: [],
      description: 'Uses the spider attack behavior (leaping)',
      category: 'Creatures',
      priority: 2,
      icon: 'spider'
    },
    {
      goal: 'zombieattack',
      aliases: [],
      description: 'Zombie-style melee attack with arms raised',
      category: 'Creatures',
      priority: 2,
      icon: 'disease'
    },
    {
      goal: 'leapattarget',
      aliases: [],
      description: 'Makes the mob leap at its target',
      category: 'Creatures',
      priority: 4,
      icon: 'arrow-up'
    },
    {
      goal: 'movethroughvillage',
      aliases: [],
      description: 'Makes the mob move through villages following paths',
      category: 'Creatures',
      priority: 5,
      icon: 'city'
    },
    {
      goal: 'movetoblock',
      aliases: [],
      description: 'Makes the mob go towards a specific type of block',
      category: 'Creatures',
      priority: 5,
      icon: 'cube',
      params: ['blockType']
    },
    {
      goal: 'movetolava',
      aliases: [],
      description: 'Makes the mob move towards lava (strider behavior)',
      category: 'Creatures',
      priority: 5,
      icon: 'fire'
    },
    {
      goal: 'movetowater',
      aliases: [],
      description: 'Makes the mob move towards water',
      category: 'Creatures',
      priority: 5,
      icon: 'water'
    },
    {
      goal: 'movetowardsrestriction',
      aliases: [],
      description: 'Move towards Restriction Point (e.g., village for Villager)',
      category: 'Creatures',
      priority: 4,
      icon: 'map-marker'
    },
    {
      goal: 'MoveWithinDistanceOfTarget',
      aliases: [],
      description: 'Moves towards the target to be within a certain range',
      category: 'Creatures',
      priority: 3,
      icon: 'expand-arrows-alt',
      params: ['distance']
    },
    {
      goal: 'MoveTowardsTargetConditional',
      aliases: [],
      description: 'Paths to an entity that checks some conditions',
      category: 'Creatures',
      priority: 3,
      icon: 'route',
      params: ['conditions']
    },
    {
      goal: 'FollowRoute',
      aliases: ['followpath'],
      description: 'Makes the mob follow a specific path, one time only',
      category: 'Creatures',
      priority: 4,
      icon: 'route',
      params: ['path']
    },
    {
      goal: 'patrol',
      aliases: ['patrolroute'],
      description: 'Makes the mob patrol between specified locations',
      category: 'Creatures',
      priority: 4,
      icon: 'map-signs',
      params: ['x1,y1,z1;x2,y2,z2;...']
    },
    {
      goal: 'gotolocation',
      aliases: ['goto'],
      description: 'Makes the mob go to the specified location. FollowRange must be > distance',
      category: 'Creatures',
      priority: 4,
      icon: 'location-arrow',
      params: ['x,y,z']
    },
    {
      goal: 'gotoowner',
      aliases: [],
      description: 'Makes the mob move towards its owner when beyond distance (default 5)',
      category: 'Creatures',
      priority: 4,
      icon: 'user-friends',
      params: ['distance']
    },
    {
      goal: 'gotoparent',
      aliases: [],
      description: 'Makes the mob move towards its parent mob',
      category: 'Creatures',
      priority: 4,
      icon: 'sitemap'
    },
    {
      goal: 'Panic',
      aliases: ['panicWhenOnFire'],
      description: 'Run around panicking when on fire and look for water',
      category: 'Creatures',
      priority: 1,
      icon: 'fire-alt'
    },
    {
      goal: 'randomFly',
      aliases: [],
      description: 'Fly around randomly (for flying mobs)',
      category: 'Creatures',
      priority: 7,
      icon: 'dove'
    },
    {
      goal: 'randomNod',
      aliases: [],
      description: 'Makes the mob randomly nod its head',
      category: 'Creatures',
      priority: 8,
      icon: 'head-side'
    },
    {
      goal: 'horrified',
      aliases: [],
      description: 'Run around frantically in panic',
      category: 'Creatures',
      priority: 1,
      icon: 'exclamation-triangle'
    }
  ],
  
  // Animals Only
  ANIMALS: [
    {
      goal: 'breed',
      aliases: [],
      description: 'Causes the mob to be able to breed with other mobs',
      category: 'Animals',
      priority: 5,
      icon: 'heart'
    }
  ],
  
  // Creepers Only
  CREEPERS: [
    {
      goal: 'creeperswell',
      aliases: ['creeperexplode'],
      description: 'Make a creeper want to explode on its target',
      category: 'Creepers',
      priority: 2,
      icon: 'bomb'
    }
  ],
  
  // Ranged Entities Only
  RANGED: [
    {
      goal: 'rangedattack',
      aliases: ['arrowattack'],
      description: 'A basic ranged/projectile attack',
      category: 'Ranged',
      priority: 2,
      icon: 'crosshairs'
    },
    {
      goal: 'bowattack',
      aliases: ['bowshoot', 'bowmaster'],
      description: 'An advanced bow attack with aiming behavior',
      category: 'Ranged',
      priority: 2,
      icon: 'bow-arrow'
    }
  ],
  
  // Piglins and Pillagers Only
  PIGLINS_PILLAGERS: [
    {
      goal: 'crossbowAttack',
      aliases: [],
      description: 'Attack with a crossbow (pillager/piglin style)',
      category: 'Piglins/Pillagers',
      priority: 2,
      icon: 'bullseye'
    }
  ]
};

// AI Goal Presets - Common configurations
const AI_GOAL_PRESETS = {
  passive: {
    name: 'Passive',
    description: 'Mob does nothing, just stands there',
    icon: 'pause-circle',
    goals: ['clear']
  },
  wanderer: {
    name: 'Wanderer',
    description: 'Mob walks around randomly and looks around',
    icon: 'shoe-prints',
    goals: ['clear', 'randomstroll', 'randomlookaround']
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Standard melee attacker that wanders when idle',
    icon: 'fist-raised',
    goals: ['clear', 'meleeattack', 'randomstroll', 'randomlookaround']
  },
  ranged: {
    name: 'Ranged Attacker',
    description: 'Uses ranged attacks and keeps distance',
    icon: 'crosshairs',
    goals: ['clear', 'rangedattack', 'randomstroll', 'randomlookaround']
  },
  coward: {
    name: 'Coward',
    description: 'Runs away from players',
    icon: 'running',
    goals: ['clear', 'fleeplayers', 'randomstroll', 'randomlookaround']
  },
  guardian: {
    name: 'Guardian',
    description: 'Returns to spawn location when no target',
    icon: 'shield-alt',
    goals: ['clear', 'meleeattack', 'gotospawnlocation', 'randomlookaround']
  }
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
