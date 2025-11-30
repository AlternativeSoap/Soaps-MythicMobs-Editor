/**
 * Vanilla Mob Types that can be overridden
 * Based on MythicMobs wiki documentation
 */

const VANILLA_MOBS = {
    HOSTILE: [
        { type: 'ZOMBIE', name: 'Zombie', description: 'Basic undead mob' },
        { type: 'SKELETON', name: 'Skeleton', description: 'Ranged undead mob with bow' },
        { type: 'CREEPER', name: 'Creeper', description: 'Explosive mob' },
        { type: 'SPIDER', name: 'Spider', description: 'Climbing hostile arthropod' },
        { type: 'CAVE_SPIDER', name: 'Cave Spider', description: 'Smaller poisonous spider' },
        { type: 'ENDERMAN', name: 'Enderman', description: 'Teleporting tall mob from The End' },
        { type: 'ZOMBIE_PIGMAN', name: 'Zombie Pigman', description: 'Neutral Nether mob (Legacy)' },
        { type: 'ZOMBIFIED_PIGLIN', name: 'Zombified Piglin', description: 'Neutral Nether mob' },
        { type: 'BLAZE', name: 'Blaze', description: 'Flying fire-shooting Nether mob' },
        { type: 'GHAST', name: 'Ghast', description: 'Large floating Nether mob with fireballs' },
        { type: 'WITCH', name: 'Witch', description: 'Potion-throwing hostile mob' },
        { type: 'SLIME', name: 'Slime', description: 'Bouncing cube mob' },
        { type: 'MAGMA_CUBE', name: 'Magma Cube', description: 'Nether version of slime' },
        { type: 'SILVERFISH', name: 'Silverfish', description: 'Small bug from stone blocks' },
        { type: 'ENDERMITE', name: 'Endermite', description: 'Small hostile arthropod' },
        { type: 'GUARDIAN', name: 'Guardian', description: 'Ocean monument aquatic mob' },
        { type: 'ELDER_GUARDIAN', name: 'Elder Guardian', description: 'Boss variant of guardian' },
        { type: 'SHULKER', name: 'Shulker', description: 'Levitation-inflicting End mob' },
        { type: 'VEX', name: 'Vex', description: 'Small flying mob summoned by evokers' },
        { type: 'VINDICATOR', name: 'Vindicator', description: 'Axe-wielding illager' },
        { type: 'EVOKER', name: 'Evoker', description: 'Spell-casting illager' },
        { type: 'PILLAGER', name: 'Pillager', description: 'Crossbow-wielding illager' },
        { type: 'RAVAGER', name: 'Ravager', description: 'Large beast used by illagers' },
        { type: 'PHANTOM', name: 'Phantom', description: 'Flying undead mob from insomnia' },
        { type: 'DROWNED', name: 'Drowned', description: 'Underwater zombie variant' },
        { type: 'HUSK', name: 'Husk', description: 'Desert zombie variant' },
        { type: 'STRAY', name: 'Stray', description: 'Ice plains skeleton variant' },
        { type: 'WITHER_SKELETON', name: 'Wither Skeleton', description: 'Nether fortress skeleton variant' },
        { type: 'PIGLIN', name: 'Piglin', description: 'Gold-loving Nether mob' },
        { type: 'PIGLIN_BRUTE', name: 'Piglin Brute', description: 'Aggressive piglin variant' },
        { type: 'HOGLIN', name: 'Hoglin', description: 'Hostile beast from Nether' },
        { type: 'ZOGLIN', name: 'Zoglin', description: 'Zombified hoglin' },
        { type: 'WARDEN', name: 'Warden', description: 'Blind powerful mob from Deep Dark' }
    ],
    PASSIVE: [
        { type: 'COW', name: 'Cow', description: 'Farm animal providing milk and beef' },
        { type: 'PIG', name: 'Pig', description: 'Farm animal providing pork' },
        { type: 'SHEEP', name: 'Sheep', description: 'Farm animal providing wool' },
        { type: 'CHICKEN', name: 'Chicken', description: 'Farm animal providing eggs and meat' },
        { type: 'RABBIT', name: 'Rabbit', description: 'Small hopping animal' },
        { type: 'HORSE', name: 'Horse', description: 'Rideable animal' },
        { type: 'DONKEY', name: 'Donkey', description: 'Rideable pack animal' },
        { type: 'MULE', name: 'Mule', description: 'Horse-donkey hybrid' },
        { type: 'LLAMA', name: 'Llama', description: 'Spitting pack animal' },
        { type: 'PARROT', name: 'Parrot', description: 'Tameable flying bird' },
        { type: 'BAT', name: 'Bat', description: 'Flying cave creature' },
        { type: 'OCELOT', name: 'Ocelot', description: 'Wild cat from jungle' },
        { type: 'SQUID', name: 'Squid', description: 'Aquatic ink-producing mob' },
        { type: 'MUSHROOM_COW', name: 'Mooshroom', description: 'Mushroom-covered cow' },
        { type: 'VILLAGER', name: 'Villager', description: 'Trading NPC' },
        { type: 'TURTLE', name: 'Turtle', description: 'Aquatic reptile' },
        { type: 'COD', name: 'Cod', description: 'Small fish' },
        { type: 'SALMON', name: 'Salmon', description: 'Fish that swims upstream' },
        { type: 'PUFFERFISH', name: 'Pufferfish', description: 'Poisonous fish' },
        { type: 'TROPICAL_FISH', name: 'Tropical Fish', description: 'Colorful fish variant' },
        { type: 'DOLPHIN', name: 'Dolphin', description: 'Intelligent aquatic mammal' },
        { type: 'PANDA', name: 'Panda', description: 'Bamboo-eating bear' },
        { type: 'FOX', name: 'Fox', description: 'Sneaky forest creature' },
        { type: 'BEE', name: 'Bee', description: 'Pollinating insect' },
        { type: 'STRIDER', name: 'Strider', description: 'Lava-walking Nether mob' },
        { type: 'AXOLOTL', name: 'Axolotl', description: 'Aquatic salamander' },
        { type: 'GOAT', name: 'Goat', description: 'Mountain animal that rams' },
        { type: 'GLOW_SQUID', name: 'Glow Squid', description: 'Luminescent squid' },
        { type: 'ALLAY', name: 'Allay', description: 'Item-collecting fairy mob' },
        { type: 'FROG', name: 'Frog', description: 'Amphibian from swamps' },
        { type: 'TADPOLE', name: 'Tadpole', description: 'Baby frog' },
        { type: 'CAMEL', name: 'Camel', description: 'Desert riding animal' },
        { type: 'SNIFFER', name: 'Sniffer', description: 'Ancient mob that finds seeds' },
        { type: 'ARMADILLO', name: 'Armadillo', description: 'Rolling defensive creature' }
    ],
    NEUTRAL: [
        { type: 'WOLF', name: 'Wolf', description: 'Tameable canine' },
        { type: 'POLAR_BEAR', name: 'Polar Bear', description: 'Arctic predator' },
        { type: 'IRON_GOLEM', name: 'Iron Golem', description: 'Village protector' },
        { type: 'SNOW_GOLEM', name: 'Snow Golem', description: 'Snowball-throwing construct' },
        { type: 'SPIDER', name: 'Spider', description: 'Becomes hostile in light' },
        { type: 'CAVE_SPIDER', name: 'Cave Spider', description: 'Smaller poisonous variant' },
        { type: 'ENDERMAN', name: 'Enderman', description: 'Aggressive when looked at' },
        { type: 'PIGLIN', name: 'Piglin', description: 'Attacks without gold armor' },
        { type: 'ZOMBIFIED_PIGLIN', name: 'Zombified Piglin', description: 'Neutral until provoked' }
    ],
    BOSSES: [
        { type: 'ENDER_DRAGON', name: 'Ender Dragon', description: 'The End dimension boss' },
        { type: 'WITHER', name: 'Wither', description: 'Three-headed flying boss' },
        { type: 'ELDER_GUARDIAN', name: 'Elder Guardian', description: 'Ocean monument mini-boss' },
        { type: 'WARDEN', name: 'Warden', description: 'Deep Dark mini-boss' }
    ]
};

const VANILLA_MOB_CATEGORIES = ['HOSTILE', 'PASSIVE', 'NEUTRAL', 'BOSSES'];

// Flatten all mobs into a single array for easier searching
const ALL_VANILLA_MOBS = [
    ...VANILLA_MOBS.HOSTILE,
    ...VANILLA_MOBS.PASSIVE,
    ...VANILLA_MOBS.NEUTRAL,
    ...VANILLA_MOBS.BOSSES
].reduce((acc, mob) => {
    // Remove duplicates (some mobs appear in multiple categories)
    if (!acc.find(m => m.type === mob.type)) {
        acc.push(mob);
    }
    return acc;
}, []);

// Export to window for browser usage
window.VANILLA_MOBS = VANILLA_MOBS;
window.ALL_VANILLA_MOBS = ALL_VANILLA_MOBS;
window.VANILLA_MOB_CATEGORIES = VANILLA_MOB_CATEGORIES;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VANILLA_MOBS,
        ALL_VANILLA_MOBS,
        VANILLA_MOB_CATEGORIES
    };
}
