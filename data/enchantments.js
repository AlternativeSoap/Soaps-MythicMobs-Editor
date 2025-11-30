/**
 * Minecraft Enchantments Data
 * All available enchantments from Spigot API
 */

const ENCHANTMENTS = [
    // Armor Enchantments
    { id: 'PROTECTION', name: 'Protection', maxLevel: 4, category: 'Armor', description: 'Reduces most damage' },
    { id: 'FIRE_PROTECTION', name: 'Fire Protection', maxLevel: 4, category: 'Armor', description: 'Reduces fire damage' },
    { id: 'FEATHER_FALLING', name: 'Feather Falling', maxLevel: 4, category: 'Boots', description: 'Reduces fall damage' },
    { id: 'BLAST_PROTECTION', name: 'Blast Protection', maxLevel: 4, category: 'Armor', description: 'Reduces explosion damage' },
    { id: 'PROJECTILE_PROTECTION', name: 'Projectile Protection', maxLevel: 4, category: 'Armor', description: 'Reduces projectile damage' },
    { id: 'RESPIRATION', name: 'Respiration', maxLevel: 3, category: 'Helmet', description: 'Extends underwater breathing' },
    { id: 'AQUA_AFFINITY', name: 'Aqua Affinity', maxLevel: 1, category: 'Helmet', description: 'Faster mining underwater' },
    { id: 'THORNS', name: 'Thorns', maxLevel: 3, category: 'Armor', description: 'Damages attackers' },
    { id: 'DEPTH_STRIDER', name: 'Depth Strider', maxLevel: 3, category: 'Boots', description: 'Faster underwater movement' },
    { id: 'FROST_WALKER', name: 'Frost Walker', maxLevel: 2, category: 'Boots', description: 'Freezes water under feet' },
    { id: 'SOUL_SPEED', name: 'Soul Speed', maxLevel: 3, category: 'Boots', description: 'Faster on soul sand/soil' },
    { id: 'SWIFT_SNEAK', name: 'Swift Sneak', maxLevel: 3, category: 'Leggings', description: 'Faster sneaking' },
    
    // Weapon Enchantments
    { id: 'SHARPNESS', name: 'Sharpness', maxLevel: 5, category: 'Sword', description: 'Increases damage' },
    { id: 'SMITE', name: 'Smite', maxLevel: 5, category: 'Sword', description: 'Increases damage to undead' },
    { id: 'BANE_OF_ARTHROPODS', name: 'Bane of Arthropods', maxLevel: 5, category: 'Sword', description: 'Increases damage to arthropods' },
    { id: 'KNOCKBACK', name: 'Knockback', maxLevel: 2, category: 'Sword', description: 'Increases knockback' },
    { id: 'FIRE_ASPECT', name: 'Fire Aspect', maxLevel: 2, category: 'Sword', description: 'Sets target on fire' },
    { id: 'LOOTING', name: 'Looting', maxLevel: 3, category: 'Sword', description: 'Increases mob loot' },
    { id: 'SWEEPING_EDGE', name: 'Sweeping Edge', maxLevel: 3, category: 'Sword', description: 'Increases sweeping damage' },
    
    // Tool Enchantments
    { id: 'EFFICIENCY', name: 'Efficiency', maxLevel: 5, category: 'Tool', description: 'Faster mining' },
    { id: 'SILK_TOUCH', name: 'Silk Touch', maxLevel: 1, category: 'Tool', description: 'Mines blocks intact' },
    { id: 'FORTUNE', name: 'Fortune', maxLevel: 3, category: 'Tool', description: 'Increases block drops' },
    
    // Bow Enchantments
    { id: 'POWER', name: 'Power', maxLevel: 5, category: 'Bow', description: 'Increases arrow damage' },
    { id: 'PUNCH', name: 'Punch', maxLevel: 2, category: 'Bow', description: 'Increases arrow knockback' },
    { id: 'FLAME', name: 'Flame', maxLevel: 1, category: 'Bow', description: 'Flaming arrows' },
    { id: 'INFINITY', name: 'Infinity', maxLevel: 1, category: 'Bow', description: 'Infinite arrows' },
    
    // Fishing Rod Enchantments
    { id: 'LUCK_OF_THE_SEA', name: 'Luck of the Sea', maxLevel: 3, category: 'Fishing Rod', description: 'Increases fishing luck' },
    { id: 'LURE', name: 'Lure', maxLevel: 3, category: 'Fishing Rod', description: 'Faster fishing' },
    
    // Trident Enchantments
    { id: 'LOYALTY', name: 'Loyalty', maxLevel: 3, category: 'Trident', description: 'Returns when thrown' },
    { id: 'IMPALING', name: 'Impaling', maxLevel: 5, category: 'Trident', description: 'Increases damage to aquatic mobs' },
    { id: 'RIPTIDE', name: 'Riptide', maxLevel: 3, category: 'Trident', description: 'Propels player when thrown' },
    { id: 'CHANNELING', name: 'Channeling', maxLevel: 1, category: 'Trident', description: 'Summons lightning' },
    
    // Crossbow Enchantments
    { id: 'MULTISHOT', name: 'Multishot', maxLevel: 1, category: 'Crossbow', description: 'Shoots 3 arrows' },
    { id: 'QUICK_CHARGE', name: 'Quick Charge', maxLevel: 3, category: 'Crossbow', description: 'Faster reload' },
    { id: 'PIERCING', name: 'Piercing', maxLevel: 4, category: 'Crossbow', description: 'Arrows pierce entities' },
    
    // Universal Enchantments
    { id: 'MENDING', name: 'Mending', maxLevel: 1, category: 'All', description: 'Repairs with XP' },
    { id: 'UNBREAKING', name: 'Unbreaking', maxLevel: 3, category: 'All', description: 'Increases durability' },
    { id: 'VANISHING_CURSE', name: 'Curse of Vanishing', maxLevel: 1, category: 'All', description: 'Disappears on death' },
    { id: 'BINDING_CURSE', name: 'Curse of Binding', maxLevel: 1, category: 'Armor', description: 'Cannot be removed' },
    
    // 1.20+ Enchantments
    { id: 'WIND_BURST', name: 'Wind Burst', maxLevel: 3, category: 'Mace', description: 'Creates wind burst on hit' },
    { id: 'DENSITY', name: 'Density', maxLevel: 5, category: 'Mace', description: 'Increases fall damage' },
    { id: 'BREACH', name: 'Breach', maxLevel: 4, category: 'Mace', description: 'Reduces armor effectiveness' }
];

window.EnchantmentData = {
    ENCHANTMENTS,
    
    /**
     * Get enchantment by ID
     */
    getEnchantment(id) {
        return ENCHANTMENTS.find(e => e.id === id);
    },
    
    /**
     * Get enchantments by category
     */
    getByCategory(category) {
        return ENCHANTMENTS.filter(e => e.category === category || e.category === 'All');
    },
    
    /**
     * Get all categories
     */
    getCategories() {
        return [...new Set(ENCHANTMENTS.map(e => e.category))];
    }
};

console.log('✅ Enchantments loaded:', ENCHANTMENTS.length, 'enchantments');
