/**
 * Vanilla Minecraft Mob Stats Database
 * Based on Minecraft Java Edition 1.20+ (Normal Difficulty)
 * 
 * Health: MaxHealth attribute value
 * Damage: Attack damage range (min-max for Normal difficulty)
 */

const VANILLA_MOB_STATS = {
    // ==================== HOSTILE MOBS ====================
    
    // Overworld Hostile
    "ZOMBIE": {
        health: 20,
        damage: { min: 2.5, max: 3.5 }
    },
    "HUSK": {
        health: 20,
        damage: { min: 2.5, max: 3.5 }
    },
    "DROWNED": {
        health: 20,
        damage: { min: 2.5, max: 3.5 }
    },
    "ZOMBIE_VILLAGER": {
        health: 20,
        damage: { min: 2.5, max: 3.5 }
    },
    "SKELETON": {
        health: 20,
        damage: { min: 2, max: 4 }
    },
    "STRAY": {
        health: 20,
        damage: { min: 2, max: 4 }
    },
    "BOGGED": {
        health: 16,
        damage: { min: 2, max: 4 } // Arrows inflict poison
    },
    "CREEPER": {
        health: 20,
        damage: { min: 43, max: 43 } // Explosion damage
    },
    "BREEZE": {
        health: 30,
        damage: { min: 1, max: 3 } // Wind charge projectile
    },
    "SPIDER": {
        health: 16,
        damage: { min: 2, max: 2 }
    },
    "CAVE_SPIDER": {
        health: 12,
        damage: { min: 2, max: 2 }
    },
    "ENDERMAN": {
        health: 40,
        damage: { min: 4.5, max: 7 }
    },
    "WITCH": {
        health: 26,
        damage: { min: 3, max: 3 } // Splash potions
    },
    "SLIME": {
        health: 16,
        damage: { min: 2, max: 4 }
    },
    "SILVERFISH": {
        health: 8,
        damage: { min: 1, max: 1 }
    },
    "ENDERMITE": {
        health: 8,
        damage: { min: 2, max: 2 }
    },
    "GUARDIAN": {
        health: 30,
        damage: { min: 4, max: 6 }
    },
    "ELDER_GUARDIAN": {
        health: 80,
        damage: { min: 5, max: 8 }
    },
    "PHANTOM": {
        health: 20,
        damage: { min: 4, max: 6 }
    },
    "VEX": {
        health: 14,
        damage: { min: 5.5, max: 9 }
    },
    "VINDICATOR": {
        health: 24,
        damage: { min: 7.5, max: 13 }
    },
    "EVOKER": {
        health: 24,
        damage: { min: 6, max: 6 }
    },
    "PILLAGER": {
        health: 24,
        damage: { min: 3, max: 5 }
    },
    "RAVAGER": {
        health: 100,
        damage: { min: 7, max: 12 }
    },
    
    // Nether Hostile
    "BLAZE": {
        health: 20,
        damage: { min: 4, max: 6 }
    },
    "GHAST": {
        health: 10,
        damage: { min: 6, max: 17 } // Fireball explosion
    },
    "MAGMA_CUBE": {
        health: 16,
        damage: { min: 4, max: 6 }
    },
    "ZOMBIFIED_PIGLIN": {
        health: 20,
        damage: { min: 5, max: 8.5 }
    },
    "PIGLIN": {
        health: 16,
        damage: { min: 5, max: 5 }
    },
    "PIGLIN_BRUTE": {
        health: 50,
        damage: { min: 7.5, max: 13 }
    },
    "HOGLIN": {
        health: 40,
        damage: { min: 2.5, max: 6 }
    },
    "ZOGLIN": {
        health: 40,
        damage: { min: 3, max: 6 }
    },
    "WITHER_SKELETON": {
        health: 20,
        damage: { min: 5, max: 8 }
    },
    
    // End Hostile
    "SHULKER": {
        health: 30,
        damage: { min: 4, max: 4 }
    },
    
    // ==================== NEUTRAL MOBS ====================
    
    "WOLF": {
        health: 8, // Wild: 8, Tamed: 20
        damage: { min: 3, max: 4 }
    },
    "POLAR_BEAR": {
        health: 30,
        damage: { min: 4, max: 6 }
    },
    "BEE": {
        health: 10,
        damage: { min: 2, max: 2 }
    },
    "IRON_GOLEM": {
        health: 100,
        damage: { min: 4.75, max: 7.5 }
    },
    "LLAMA": {
        health: 15,
        damage: { min: 1, max: 1 }
    },
    "TRADER_LLAMA": {
        health: 15,
        damage: { min: 1, max: 1 }
    },
    "PANDA": {
        health: 20,
        damage: { min: 4, max: 6 }
    },
    "DOLPHIN": {
        health: 10,
        damage: { min: 2.5, max: 3 }
    },
    "SPIDER_JOCKEY": {
        health: 16,
        damage: { min: 2, max: 4 }
    },
    "GOAT": {
        health: 10,
        damage: { min: 1, max: 2 }
    },
    
    // ==================== PASSIVE MOBS ====================
    
    "COW": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "MOOSHROOM": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "PIG": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "SHEEP": {
        health: 8,
        damage: { min: 0, max: 0 }
    },
    "CHICKEN": {
        health: 4,
        damage: { min: 0, max: 0 }
    },
    "RABBIT": {
        health: 3,
        damage: { min: 0, max: 0 }
    },
    "BAT": {
        health: 6,
        damage: { min: 0, max: 0 }
    },
    "SQUID": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "GLOW_SQUID": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "COD": {
        health: 3,
        damage: { min: 0, max: 0 }
    },
    "SALMON": {
        health: 3,
        damage: { min: 0, max: 0 }
    },
    "PUFFERFISH": {
        health: 3,
        damage: { min: 0, max: 0 }
    },
    "TROPICAL_FISH": {
        health: 3,
        damage: { min: 0, max: 0 }
    },
    "AXOLOTL": {
        health: 14,
        damage: { min: 2, max: 2 }
    },
    "TURTLE": {
        health: 30,
        damage: { min: 0, max: 0 }
    },
    "OCELOT": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "CAT": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "PARROT": {
        health: 6,
        damage: { min: 0, max: 0 }
    },
    "VILLAGER": {
        health: 20,
        damage: { min: 0, max: 0 }
    },
    "WANDERING_TRADER": {
        health: 20,
        damage: { min: 0, max: 0 }
    },
    
    // Horses and related
    "HORSE": {
        health: 15, // Varies 15-30
        damage: { min: 0, max: 0 }
    },
    "DONKEY": {
        health: 15,
        damage: { min: 0, max: 0 }
    },
    "MULE": {
        health: 15,
        damage: { min: 0, max: 0 }
    },
    "SKELETON_HORSE": {
        health: 15,
        damage: { min: 0, max: 0 }
    },
    "ZOMBIE_HORSE": {
        health: 15,
        damage: { min: 0, max: 0 }
    },
    
    // Other passive
    "SNOW_GOLEM": {
        health: 4,
        damage: { min: 0, max: 0 }
    },
    "STRIDER": {
        health: 20,
        damage: { min: 0, max: 0 }
    },
    "FOX": {
        health: 10,
        damage: { min: 2, max: 2 }
    },
    "FROG": {
        health: 10,
        damage: { min: 0, max: 0 }
    },
    "TADPOLE": {
        health: 6,
        damage: { min: 0, max: 0 }
    },
    "ALLAY": {
        health: 20,
        damage: { min: 0, max: 0 }
    },
    "CAMEL": {
        health: 32,
        damage: { min: 0, max: 0 }
    },
    "SNIFFER": {
        health: 14,
        damage: { min: 0, max: 0 }
    },
    "ARMADILLO": {
        health: 12,
        damage: { min: 0, max: 0 }
    },
    
    // ==================== BOSS MOBS ====================
    
    "ENDER_DRAGON": {
        health: 200,
        damage: { min: 10, max: 15 }
    },
    "WITHER": {
        health: 300,
        damage: { min: 5, max: 8 }
    },
    "WARDEN": {
        health: 500,
        damage: { min: 16, max: 30 }
    },
    
    // ==================== SPECIAL/UTILITY ====================
    
    "ARMOR_STAND": {
        health: 20,
        damage: { min: 0, max: 0 }
    },
    "GIANT": {
        health: 100,
        damage: { min: 26, max: 50 }
    },
    "ILLUSIONER": {
        health: 32,
        damage: { min: 2, max: 5 }
    },
    
    // ==================== NEW 1.21.10 MOBS ====================
    
    "COPPER_GOLEM": {
        health: 20,
        damage: { min: 0, max: 0 } // Non-combat mob, presses buttons
    },
    "MANNEQUIN": {
        health: 20,
        damage: { min: 0, max: 0 } // Display entity, no combat
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.VANILLA_MOB_STATS = VANILLA_MOB_STATS;
}
