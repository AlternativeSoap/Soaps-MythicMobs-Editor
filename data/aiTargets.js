// AI Target Selectors from MythicMobs wiki
// Determines what mobs target/attack
// Reference: https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Mobs/Custom-AI

const AI_TARGETS = {
  // All Creatures
  ALL_CREATURES: [
    {
      target: 'clear',
      aliases: ['reset'],
      description: 'Removes all AI targets from the mob. Always use this first.',
      category: 'All Creatures',
      priority: 0,
      icon: 'eraser',
      important: true
    },
    {
      target: 'hurtbytarget',
      aliases: ['attacker', 'damager'],
      description: 'Targets whatever attacks/damages the mob (retaliation)',
      category: 'All Creatures',
      priority: 1,
      icon: 'shield-alt',
      important: true
    },
    {
      target: 'monsters',
      aliases: ['monster'],
      description: 'Targets all hostile monsters',
      category: 'All Creatures',
      priority: 2,
      icon: 'skull'
    },
    {
      target: 'players',
      aliases: ['player'],
      description: 'Targets all players',
      category: 'All Creatures',
      priority: 2,
      icon: 'user',
      important: true
    },
    {
      target: 'villagers',
      aliases: ['villager'],
      description: 'Targets all villagers',
      category: 'All Creatures',
      priority: 2,
      icon: 'user-tie'
    },
    {
      target: 'irongolem',
      aliases: ['iron_golems', 'iron_golem', 'golems'],
      description: 'Targets Iron Golems',
      category: 'All Creatures',
      priority: 2,
      icon: 'robot'
    },
    {
      target: 'nearestConditionalTarget',
      aliases: ['nearestConditional', 'nearestIf'],
      description: 'Targets the nearest entity that meets provided conditions',
      category: 'All Creatures',
      premium: true,
      priority: 2,
      icon: 'filter',
      params: ['conditions']
    },
    {
      target: 'OwnerAttacker',
      aliases: ['ownerHurtBy', 'ownerHurtByTarget', 'ownerDamager'],
      description: 'Targets whatever attacks the mob\'s owner',
      category: 'All Creatures',
      priority: 1,
      icon: 'user-shield'
    },
    {
      target: 'OwnerTarget',
      aliases: ['ownerAttack', 'ownerhurt'],
      description: 'Targets whatever the mob\'s owner attacks',
      category: 'All Creatures',
      priority: 1,
      icon: 'user-tag'
    },
    {
      target: 'ParentHurtBy',
      aliases: ['parentHurtByTarget', 'parentDamager', 'parentAttacker'],
      description: 'Targets the entity that attacks the mob\'s parent',
      category: 'All Creatures',
      priority: 1,
      icon: 'sitemap'
    },
    {
      target: 'ParentTarget',
      aliases: ['parentHurt', 'parentAttack'],
      description: 'Targets the entity being hit by the caster\'s parent',
      category: 'All Creatures',
      priority: 1,
      icon: 'project-diagram'
    }
  ],
  
  // Faction Support
  FACTION_TARGETS: [
    {
      target: 'NearestOtherFaction',
      aliases: ['OtherFaction'],
      description: 'Targets ANY entities that are in a different faction',
      category: 'Faction Support',
      priority: 2,
      icon: 'users-slash'
    },
    {
      target: 'NearestOtherFactionMonsters',
      aliases: ['OtherFactionMonsters'],
      description: 'Targets any monsters that are in a different faction',
      category: 'Faction Support',
      priority: 2,
      icon: 'skull-crossbones'
    },
    {
      target: 'SpecificFaction',
      aliases: [],
      description: 'Targets any entities that are in the given faction',
      category: 'Faction Support',
      priority: 2,
      icon: 'users',
      params: ['faction_name']
    },
    {
      target: 'SpecificFactionMonsters',
      aliases: [],
      description: 'Targets any monsters that are in the given faction',
      category: 'Faction Support',
      priority: 2,
      icon: 'skull',
      params: ['faction_name']
    }
  ]
};

// AI Target Presets - Common configurations
const AI_TARGET_PRESETS = {
  none: {
    name: 'No Targets',
    description: 'Mob targets nothing',
    icon: 'ban',
    targets: ['clear']
  },
  hostile: {
    name: 'Hostile to Players',
    description: 'Targets players on sight',
    icon: 'user-slash',
    targets: ['clear', 'players']
  },
  defensive: {
    name: 'Defensive',
    description: 'Only targets attackers (retaliation)',
    icon: 'shield-alt',
    targets: ['clear', 'hurtbytarget']
  },
  guardian: {
    name: 'Guardian',
    description: 'Defends owner by targeting their attackers',
    icon: 'user-shield',
    targets: ['clear', 'OwnerAttacker', 'OwnerTarget']
  },
  monster_hunter: {
    name: 'Monster Hunter',
    description: 'Targets all hostile monsters',
    icon: 'skull-crossbones',
    targets: ['clear', 'monsters']
  },
  faction_enemy: {
    name: 'Faction Enemy',
    description: 'Targets entities from other factions',
    icon: 'users-slash',
    targets: ['clear', 'NearestOtherFaction']
  }
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
