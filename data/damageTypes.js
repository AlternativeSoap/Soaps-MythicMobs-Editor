// Damage types from MythicMobs wiki for DamageModifiers
// Values: >1 multiply damage, <1 reduce damage, 0 immune, <0 heal from damage
const DAMAGE_TYPES = [
  {
    type: 'BLOCK_EXPLOSION',
    description: 'Damage caused by being in the area when a block explodes',
    category: 'Explosion'
  },
  {
    type: 'CAMPFIRE',
    description: 'Damage caused when an entity steps on CAMPFIRE or SOUL_CAMPFIRE',
    category: 'Environmental'
  },
  {
    type: 'CONTACT',
    description: 'Damage caused when an entity contacts a block such as a Cactus, Dripstone (Stalagmite) or Berry Bush',
    category: 'Environmental'
  },
  {
    type: 'CRAMMING',
    description: 'Damage caused when an entity is colliding with too many entities due to the maxEntityCramming game rule',
    category: 'Environmental'
  },
  {
    type: 'CUSTOM',
    description: 'Custom damage',
    category: 'Other'
  },
  {
    type: 'DRAGON_BREATH',
    description: 'Damage caused by a dragon breathing fire',
    category: 'Magic'
  },
  {
    type: 'DROWNING',
    description: 'Damage caused by running out of air while in water',
    category: 'Environmental'
  },
  {
    type: 'DRYOUT',
    description: 'Damage caused when an entity that should be in water is not',
    category: 'Environmental'
  },
  {
    type: 'ENTITY_ATTACK',
    description: 'Damage caused when an entity attacks another entity',
    category: 'Combat'
  },
  {
    type: 'ENTITY_EXPLOSION',
    description: 'Damage caused by being in the area when an entity, such as a Creeper, explodes',
    category: 'Explosion'
  },
  {
    type: 'ENTITY_SWEEP_ATTACK',
    description: 'Damage caused when an entity attacks another entity in a sweep attack',
    category: 'Combat'
  },
  {
    type: 'FALL',
    description: 'Damage caused when an entity falls a distance greater than 3 blocks',
    category: 'Environmental'
  },
  {
    type: 'FALLING_BLOCK',
    description: 'Damage caused by being hit by a falling block which deals damage',
    category: 'Environmental'
  },
  {
    type: 'FIRE',
    description: 'Damage caused by direct exposure to fire',
    category: 'Environmental'
  },
  {
    type: 'FIRE_TICK',
    description: 'Damage caused due to burns caused by fire',
    category: 'Environmental'
  },
  {
    type: 'FLY_INTO_WALL',
    description: 'Damage caused when an entity runs into a wall',
    category: 'Environmental'
  },
  {
    type: 'FREEZE',
    description: 'Damage caused from freezing',
    category: 'Environmental'
  },
  {
    type: 'HOT_FLOOR',
    description: 'Damage caused when an entity steps on MAGMA_BLOCK',
    category: 'Environmental'
  },
  {
    type: 'KILL',
    description: 'Damage caused by /kill command',
    category: 'Other'
  },
  {
    type: 'LAVA',
    description: 'Damage caused by direct exposure to lava',
    category: 'Environmental'
  },
  {
    type: 'LIGHTNING',
    description: 'Damage caused by being struck by lightning',
    category: 'Environmental'
  },
  {
    type: 'MAGIC',
    description: 'Damage caused by being hit by a damage potion or spell',
    category: 'Magic'
  },
  {
    type: 'MELTING',
    description: 'Damage caused due to a snowman melting',
    category: 'Environmental'
  },
  {
    type: 'POISON',
    description: 'Damage caused due to an ongoing poison effect',
    category: 'Magic'
  },
  {
    type: 'PROJECTILE',
    description: 'Damage caused when attacked by a projectile',
    category: 'Combat'
  },
  {
    type: 'SONIC_BOOM',
    description: 'Damage caused by the Sonic Boom attack from Warden',
    category: 'Combat'
  },
  {
    type: 'STARVATION',
    description: 'Damage caused by starving due to having an empty hunger bar',
    category: 'Environmental'
  },
  {
    type: 'SUFFOCATION',
    description: 'Damage caused by being put in a block',
    category: 'Environmental'
  },
  {
    type: 'SUICIDE',
    description: 'Damage caused by committing suicide',
    category: 'Other'
  },
  {
    type: 'THORNS',
    description: 'Damage caused in retaliation to another attack by the Thorns enchantment',
    category: 'Magic'
  },
  {
    type: 'VOID',
    description: 'Damage caused by falling into the void',
    category: 'Environmental'
  },
  {
    type: 'WITHER',
    description: 'Damage caused by Wither potion effect',
    category: 'Magic'
  },
  {
    type: 'WORLD_BORDER',
    description: 'Damage caused by the World Border',
    category: 'Environmental'
  }
];

// Group damage types by category for UI
const DAMAGE_TYPE_CATEGORIES = {
  'Combat': ['ENTITY_ATTACK', 'ENTITY_SWEEP_ATTACK', 'PROJECTILE', 'SONIC_BOOM'],
  'Explosion': ['BLOCK_EXPLOSION', 'ENTITY_EXPLOSION'],
  'Environmental': ['CAMPFIRE', 'CONTACT', 'CRAMMING', 'DROWNING', 'DRYOUT', 'FALL', 'FALLING_BLOCK', 'FIRE', 'FIRE_TICK', 'FLY_INTO_WALL', 'FREEZE', 'HOT_FLOOR', 'LAVA', 'LIGHTNING', 'MELTING', 'STARVATION', 'SUFFOCATION', 'VOID', 'WORLD_BORDER'],
  'Magic': ['DRAGON_BREATH', 'MAGIC', 'POISON', 'THORNS', 'WITHER'],
  'Other': ['CUSTOM', 'KILL', 'SUICIDE']
};
