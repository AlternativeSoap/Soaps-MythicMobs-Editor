// AI Target Selectors from MythicMobs wiki
// Determines what mobs target/attack

const AI_TARGETS = {
  // All Creatures
  ALL_CREATURES: [
    {
      target: 'clear',
      aliases: ['reset'],
      description: 'Removes all AI targets from the mob',
      category: 'All Creatures',
      priority: 0
    },
    {
      target: 'attacker',
      aliases: [],
      description: 'Target whatever last attacked the mob',
      category: 'All Creatures',
      priority: 1
    },
    {
      target: 'damager',
      aliases: [],
      description: 'Target whatever last damaged the mob',
      category: 'All Creatures',
      priority: 1
    },
    {
      target: 'hurtbytarget',
      aliases: [],
      description: 'Target whatever attacks the mob (will retaliate)',
      category: 'All Creatures',
      priority: 1
    },
    {
      target: 'nearestplayer',
      aliases: [],
      description: 'Target the nearest player',
      category: 'All Creatures',
      priority: 2
    },
    {
      target: 'players',
      aliases: [],
      description: 'Target any players',
      category: 'All Creatures',
      priority: 2
    },
    {
      target: 'randomtarget',
      aliases: [],
      description: 'Target a random nearby entity',
      category: 'All Creatures',
      priority: 2
    }
  ],
  
  // Faction Support
  FACTION_TARGETS: [
    {
      target: 'monsters',
      aliases: [],
      description: 'Target any monsters',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'villagers',
      aliases: [],
      description: 'Target any villagers',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'golems',
      aliases: [],
      description: 'Target any iron golems',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'OtherFaction',
      aliases: [],
      description: 'Target entities from other factions',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'OtherFactionMobs',
      aliases: [],
      description: 'Target mobs from other factions',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'OtherFactionPlayers',
      aliases: [],
      description: 'Target players from other factions',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'SpecificFaction',
      aliases: [],
      description: 'Target entities in a specific faction',
      category: 'Faction Support',
      priority: 2,
      params: ['faction_name']
    },
    {
      target: 'SpecificFactionMobs',
      aliases: [],
      description: 'Target mobs in a specific faction',
      category: 'Faction Support',
      priority: 2,
      params: ['faction_name']
    },
    {
      target: 'SpecificFactionPlayers',
      aliases: [],
      description: 'Target players in a specific faction',
      category: 'Faction Support',
      priority: 2,
      params: ['faction_name']
    },
    {
      target: 'NotSpecificFaction',
      aliases: [],
      description: 'Target entities NOT in a specific faction',
      category: 'Faction Support',
      priority: 2,
      params: ['faction_name']
    },
    {
      target: 'OtherFactionMonsters',
      aliases: [],
      description: 'Target monsters from other factions',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'otherfactionmonsters',
      aliases: [],
      description: 'Target any monsters that are not in the same faction',
      category: 'Faction Support',
      priority: 2
    },
    {
      target: 'SpecificFactionMonsters',
      aliases: [],
      description: 'Target any monsters that are in the given faction',
      category: 'Faction Support',
      priority: 2,
      params: ['faction_name']
    }
  ]
};

// Flatten all targets into a single array
const ALL_AI_TARGETS = [
  ...AI_TARGETS.ALL_CREATURES,
  ...AI_TARGETS.FACTION_TARGETS
];

// Categories for filtering
const AI_TARGET_CATEGORIES = [
  'All Creatures',
  'Faction Support'
];
