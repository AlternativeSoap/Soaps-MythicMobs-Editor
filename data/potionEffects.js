/**
 * Minecraft Potion Effects Data
 * All available potion effects from Spigot API
 */

const POTION_EFFECTS = [
    // Beneficial Effects
    { id: 'SPEED', name: 'Speed', category: 'Beneficial', color: '7CAFC6', description: 'Increases movement speed' },
    { id: 'SLOWNESS', name: 'Slowness', category: 'Harmful', color: '5A6C81', description: 'Decreases movement speed' },
    { id: 'HASTE', name: 'Haste', category: 'Beneficial', color: 'D9C043', description: 'Increases mining speed' },
    { id: 'MINING_FATIGUE', name: 'Mining Fatigue', category: 'Harmful', color: '4A4217', description: 'Decreases mining speed' },
    { id: 'STRENGTH', name: 'Strength', category: 'Beneficial', color: '932423', description: 'Increases melee damage' },
    { id: 'INSTANT_HEALTH', name: 'Instant Health', category: 'Beneficial', color: 'F82423', description: 'Instantly heals' },
    { id: 'INSTANT_DAMAGE', name: 'Instant Damage', category: 'Harmful', color: '430A09', description: 'Instantly damages' },
    { id: 'JUMP_BOOST', name: 'Jump Boost', category: 'Beneficial', color: '22FF4C', description: 'Increases jump height' },
    { id: 'NAUSEA', name: 'Nausea', category: 'Harmful', color: '551D4A', description: 'Distorts vision' },
    { id: 'REGENERATION', name: 'Regeneration', category: 'Beneficial', color: 'CD5CAB', description: 'Regenerates health' },
    { id: 'RESISTANCE', name: 'Resistance', category: 'Beneficial', color: '99453A', description: 'Reduces damage taken' },
    { id: 'FIRE_RESISTANCE', name: 'Fire Resistance', category: 'Beneficial', color: 'E49A3A', description: 'Immunity to fire' },
    { id: 'WATER_BREATHING', name: 'Water Breathing', category: 'Beneficial', color: '2E5299', description: 'Breathe underwater' },
    { id: 'INVISIBILITY', name: 'Invisibility', category: 'Beneficial', color: '7F8392', description: 'Makes invisible' },
    { id: 'BLINDNESS', name: 'Blindness', category: 'Harmful', color: '1F1F23', description: 'Creates fog' },
    { id: 'NIGHT_VISION', name: 'Night Vision', category: 'Beneficial', color: '1F1FA1', description: 'See in darkness' },
    { id: 'HUNGER', name: 'Hunger', category: 'Harmful', color: '587653', description: 'Depletes food bar' },
    { id: 'WEAKNESS', name: 'Weakness', category: 'Harmful', color: '484D48', description: 'Decreases melee damage' },
    { id: 'POISON', name: 'Poison', category: 'Harmful', color: '4E9331', description: 'Damages over time' },
    { id: 'WITHER', name: 'Wither', category: 'Harmful', color: '352A27', description: 'Wither effect' },
    { id: 'HEALTH_BOOST', name: 'Health Boost', category: 'Beneficial', color: 'F87D23', description: 'Adds extra health' },
    { id: 'ABSORPTION', name: 'Absorption', category: 'Beneficial', color: '2552A5', description: 'Adds absorption hearts' },
    { id: 'SATURATION', name: 'Saturation', category: 'Beneficial', color: 'F82421', description: 'Restores hunger' },
    { id: 'GLOWING', name: 'Glowing', category: 'Neutral', color: '94A061', description: 'Entity glows' },
    { id: 'LEVITATION', name: 'Levitation', category: 'Harmful', color: 'CEFFFF', description: 'Levitates entity' },
    { id: 'LUCK', name: 'Luck', category: 'Beneficial', color: '339900', description: 'Increases luck' },
    { id: 'UNLUCK', name: 'Bad Luck', category: 'Harmful', color: 'C0A44D', description: 'Decreases luck' },
    { id: 'SLOW_FALLING', name: 'Slow Falling', category: 'Beneficial', color: 'F7F8E0', description: 'Slow fall speed' },
    { id: 'CONDUIT_POWER', name: 'Conduit Power', category: 'Beneficial', color: '1DC2D1', description: 'Underwater buffs' },
    { id: 'DOLPHINS_GRACE', name: "Dolphin's Grace", category: 'Beneficial', color: '88A3BE', description: 'Faster swimming' },
    { id: 'BAD_OMEN', name: 'Bad Omen', category: 'Harmful', color: '0B6138', description: 'Triggers raid' },
    { id: 'HERO_OF_THE_VILLAGE', name: 'Hero of the Village', category: 'Beneficial', color: '44FF44', description: 'Discounts from villagers' },
    { id: 'DARKNESS', name: 'Darkness', category: 'Harmful', color: '292929', description: 'Darkens vision' },
    { id: 'TRIAL_OMEN', name: 'Trial Omen', category: 'Harmful', color: '1F5C5C', description: 'Triggers trial spawner' },
    { id: 'RAID_OMEN', name: 'Raid Omen', category: 'Harmful', color: '0B6138', description: 'Triggers raid (1.21+)' },
    { id: 'WIND_CHARGED', name: 'Wind Charged', category: 'Neutral', color: 'CEFFFF', description: 'Wind burst on damage' },
    { id: 'WEAVING', name: 'Weaving', category: 'Neutral', color: 'FFD700', description: 'Releases cobwebs' },
    { id: 'OOZING', name: 'Oozing', category: 'Neutral', color: '32CD32', description: 'Spawns slimes on death' },
    { id: 'INFESTED', name: 'Infested', category: 'Harmful', color: '808080', description: 'Spawns silverfish' }
];

window.PotionEffectData = {
    POTION_EFFECTS,
    
    /**
     * Get effect by ID
     */
    getEffect(id) {
        return POTION_EFFECTS.find(e => e.id === id);
    },
    
    /**
     * Get effects by category
     */
    getByCategory(category) {
        return POTION_EFFECTS.filter(e => e.category === category);
    },
    
    /**
     * Get all categories
     */
    getCategories() {
        return ['Beneficial', 'Harmful', 'Neutral'];
    }
};

// Loaded silently
