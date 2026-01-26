/**
 * Particle Types Data
 * Maps all Minecraft particle types to their DataType requirements
 * Based on: https://hub.spigotmc.org/javadocs/spigot/org/bukkit/Particle.html
 */

const PARTICLE_TYPES = {
    // Categorized for organized dropdown UI (as array for easy iteration)
    categories: [
        {
            name: 'Common Effects',
            particles: ['flame', 'smoke', 'large_smoke', 'cloud', 'explosion', 'explosion_emitter',
                'flash', 'heart', 'note', 'poof', 'portal']
        },
        {
            name: 'Magic & Enchanting',
            particles: ['enchant', 'spell_mob_ambient', 'entity_effect', 'witch', 'dragon_breath',
                'end_rod', 'totem_of_undying', 'effect', 'instant_effect']
        },
        {
            name: 'Combat & Damage',
            particles: ['crit', 'enchanted_hit', 'damage_indicator', 'sweep_attack', 'sonic_boom',
                'explosion', 'explosion_emitter']
        },
        {
            name: 'Water & Liquid',
            particles: ['rain', 'splash', 'bubble', 'bubble_pop', 'bubble_column_up', 'current_down',
                'dripping_water', 'falling_water', 'landing_water', 'fishing', 'nautilus',
                'underwater', 'dolphin', 'dripping_dripstone_water', 'falling_dripstone_water']
        },
        {
            name: 'Fire & Lava',
            particles: ['flame', 'small_flame', 'soul_fire_flame', 'soul', 'lava',
                'dripping_lava', 'falling_lava', 'landing_lava', 'dripping_obsidian_tear',
                'falling_obsidian_tear', 'landing_obsidian_tear', 'dripping_dripstone_lava',
                'falling_dripstone_lava']
        },
        {
            name: 'Colored Particles',
            particles: ['dust', 'dust_color_transition', 'spell_mob_ambient', 'entity_effect']
        },
        {
            name: 'Block & Item',
            particles: ['block', 'block_dust', 'block_crumble', 'falling_dust', 'block_marker', 
                'item', 'item_slime', 'item_snowball']
        },
        {
            name: 'Nature & Plants',
            particles: ['cherry_leaves', 'pale_oak_leaves', 'tinted_leaves', 'spore_blossom_air',
                'falling_spore_blossom', 'mycelium', 'composter', 'dripping_honey',
                'falling_honey', 'landing_honey', 'falling_nectar', 'warped_spore',
                'crimson_spore', 'ash', 'white_ash']
        },
        {
            name: 'Weather & Sky',
            particles: ['rain', 'snowflake', 'cloud', 'white_smoke', 'gust', 'gust_emitter_small',
                'gust_emitter_large', 'small_gust']
        },
        {
            name: 'Sculk & Deep Dark',
            particles: ['sculk_charge', 'sculk_charge_pop', 'sculk_soul', 'shriek', 'vibration']
        },
        {
            name: 'Trial Chambers',
            particles: ['trial_spawner_detection', 'trial_spawner_detection_ominous', 'vault_connection',
                'trial_omen', 'ominous_spawning']
        },
        {
            name: 'Redstone & Technical',
            particles: ['dust_pillar', 'dust_plume', 'scrape', 'wax_on', 'wax_off', 'electric_spark',
                'light', 'barrier', 'suspended_depth', 'glow', 'reverse_portal']
        },
        {
            name: 'Mobs & Entities',
            particles: ['angry_villager', 'happy_villager', 'elder_guardian', 'squid_ink',
                'glow_squid_ink', 'egg_crack', 'infested', 'spit', 'sneeze', 'raid_omen']
        },
        {
            name: 'Campfires & Smoke',
            particles: ['campfire_cosy_smoke', 'campfire_signal_smoke', 'smoke', 'large_smoke',
                'white_smoke']
        },
        {
            name: 'Miscellaneous',
            particles: ['firework', 'slime', 'item_slime', 'item_snowball', 'dripping_dripstone_lava',
                'dripping_dripstone_water', 'falling_dripstone_lava', 'falling_dripstone_water',
                'copper_fire_flame', 'trail']
        }
    ],

    // DataType mapping for each particle
    dataTypes: {
        // === ItemStack DataType (requires material - items only) ===
        'item': {
            dataType: 'ItemStack',
            requiresMaterial: true,
            materialType: 'item',
            description: 'Item crack particle - requires item material'
        },
        'item_slime': {
            dataType: 'ItemStack',
            requiresMaterial: true,
            materialType: 'item',
            description: 'Slime item particle'
        },
        'item_snowball': {
            dataType: 'ItemStack',
            requiresMaterial: true,
            materialType: 'item',
            description: 'Snowball item particle'
        },

        // === BlockData DataType (requires material - blocks only) ===
        'block': {
            dataType: 'BlockData',
            requiresMaterial: true,
            materialType: 'block',
            description: 'Block crack particle - requires block material'
        },
        'block_dust': {
            dataType: 'BlockData',
            requiresMaterial: true,
            materialType: 'block',
            description: 'Block dust particle'
        },
        'block_marker': {
            dataType: 'BlockData',
            requiresMaterial: true,
            materialType: 'block',
            description: 'Block marker particle (invisible block outline)'
        },
        'falling_dust': {
            dataType: 'BlockData',
            requiresMaterial: true,
            materialType: 'block',
            description: 'Falling dust from block'
        },
        'dust_pillar': {
            dataType: 'BlockData',
            requiresMaterial: true,
            materialType: 'block',
            description: 'Dust pillar effect'
        },

        // === MaterialData DataType (legacy - requires material) ===
        'block_crumble': {
            dataType: 'MaterialData',
            requiresMaterial: true,
            materialType: 'block',
            description: 'Block crumbling particle (legacy)'
        },

        // === Color DataType (requires color only) ===
        'entity_effect': {
            dataType: 'Color',
            requiresColor: true,
            description: 'Colored entity effect particle'
        },

        // === DustOptions DataType (requires color + size) ===
        'dust': {
            dataType: 'DustOptions',
            requiresColor: true,
            requiresSize: true,
            description: 'Colored dust particle with customizable size'
        },

        // === DustTransition DataType (requires color + color2 + size) ===
        'dust_color_transition': {
            dataType: 'DustTransition',
            requiresColor: true,
            requiresColor2: true,
            requiresSize: true,
            description: 'Dust particle that transitions between two colors'
        },

        // === Spell DataType (requires color + power) ===
        'spell_mob_ambient': {
            dataType: 'Spell',
            requiresColor: true,
            requiresPower: true,
            description: 'Ambient spell particle with color and power'
        },

        // === Simple Particles (no extra data) ===
        'angry_villager': { dataType: null, description: 'Angry villager particle' },
        'ash': { dataType: null, description: 'Ash particle from soul campfire' },
        'barrier': { dataType: null, description: 'Barrier block particle' },
        'bubble': { dataType: null, description: 'Water bubble particle' },
        'bubble_column_up': { dataType: null, description: 'Bubble column (upward)' },
        'bubble_pop': { dataType: null, description: 'Bubble popping particle' },
        'campfire_cosy_smoke': { dataType: null, description: 'Cosy campfire smoke' },
        'campfire_signal_smoke': { dataType: null, description: 'Signal campfire smoke' },
        'cherry_leaves': { dataType: null, description: 'Cherry leaves particle' },
        'cloud': { dataType: null, description: 'Cloud particle' },
        'composter': { dataType: null, description: 'Composter particle' },
        'copper_fire_flame': { dataType: null, description: 'Copper fire flame' },
        'crit': { dataType: null, description: 'Critical hit particle' },
        'crimson_spore': { dataType: null, description: 'Crimson spore particle' },
        'current_down': { dataType: null, description: 'Downward current particle' },
        'damage_indicator': { dataType: null, description: 'Damage indicator particle' },
        'dolphin': { dataType: null, description: 'Dolphin splash particle' },
        'dragon_breath': { dataType: null, description: 'Dragon breath particle' },
        'dripping_dripstone_lava': { dataType: null, description: 'Lava dripping from dripstone' },
        'dripping_dripstone_water': { dataType: null, description: 'Water dripping from dripstone' },
        'dripping_honey': { dataType: null, description: 'Honey dripping particle' },
        'dripping_lava': { dataType: null, description: 'Lava dripping particle' },
        'dripping_obsidian_tear': { dataType: null, description: 'Crying obsidian tear dripping' },
        'dripping_water': { dataType: null, description: 'Water dripping particle' },
        'dust_plume': { dataType: null, description: 'Dust plume particle' },
        'effect': { dataType: null, description: 'Generic effect particle' },
        'egg_crack': { dataType: null, description: 'Egg cracking particle' },
        'elder_guardian': { dataType: null, description: 'Elder Guardian appearance effect' },
        'electric_spark': { dataType: null, description: 'Electric spark particle' },
        'enchant': { dataType: null, description: 'Enchantment table particle' },
        'enchanted_hit': { dataType: null, description: 'Enchanted weapon hit particle' },
        'end_rod': { dataType: null, description: 'End rod particle' },
        'explosion': { dataType: null, description: 'Explosion particle' },
        'explosion_emitter': { dataType: null, description: 'Large explosion particle' },
        'falling_dripstone_lava': { dataType: null, description: 'Lava falling from dripstone' },
        'falling_dripstone_water': { dataType: null, description: 'Water falling from dripstone' },
        'falling_honey': { dataType: null, description: 'Honey falling particle' },
        'falling_lava': { dataType: null, description: 'Lava falling particle' },
        'falling_nectar': { dataType: null, description: 'Nectar falling from flowers' },
        'falling_obsidian_tear': { dataType: null, description: 'Crying obsidian tear falling' },
        'falling_spore_blossom': { dataType: null, description: 'Spore blossom falling particle' },
        'falling_water': { dataType: null, description: 'Water falling particle' },
        'firework': { dataType: null, description: 'Firework explosion particle' },
        'fishing': { dataType: null, description: 'Fishing particle' },
        'flame': { dataType: null, description: 'Flame particle' },
        'flash': { dataType: null, description: 'Flash particle' },
        'glow': { dataType: null, description: 'Glow particle' },
        'glow_squid_ink': { dataType: null, description: 'Glow squid ink particle' },
        'gust': { dataType: null, description: 'Gust particle' },
        'gust_emitter_large': { dataType: null, description: 'Large gust emitter' },
        'gust_emitter_small': { dataType: null, description: 'Small gust emitter' },
        'happy_villager': { dataType: null, description: 'Happy villager particle' },
        'heart': { dataType: null, description: 'Heart particle' },
        'infested': { dataType: null, description: 'Infested block particle' },
        'instant_effect': { dataType: null, description: 'Instant effect particle' },
        'landing_honey': { dataType: null, description: 'Honey landing particle' },
        'landing_lava': { dataType: null, description: 'Lava landing particle' },
        'landing_obsidian_tear': { dataType: null, description: 'Crying obsidian tear landing' },
        'large_smoke': { dataType: null, description: 'Large smoke particle' },
        'lava': { dataType: null, description: 'Lava pop particle' },
        'light': { dataType: null, description: 'Light particle' },
        'mycelium': { dataType: null, description: 'Mycelium particle' },
        'nautilus': { dataType: null, description: 'Nautilus particle' },
        'note': { dataType: null, description: 'Musical note particle' },
        'ominous_spawning': { dataType: null, description: 'Ominous spawning particle' },
        'pale_oak_leaves': { dataType: null, description: 'Pale oak leaves particle' },
        'poof': { dataType: null, description: 'Poof particle' },
        'portal': { dataType: null, description: 'Portal particle' },
        'raid_omen': { dataType: null, description: 'Raid omen particle' },
        'rain': { dataType: null, description: 'Rain particle' },
        'reverse_portal': { dataType: null, description: 'Reverse portal particle' },
        'scrape': { dataType: null, description: 'Scraping particle' },
        'sculk_charge': { dataType: null, description: 'Sculk charge particle' },
        'sculk_charge_pop': { dataType: null, description: 'Sculk charge pop particle' },
        'sculk_soul': { dataType: null, description: 'Sculk soul particle' },
        'shriek': { dataType: null, description: 'Warden shriek particle' },
        'small_flame': { dataType: null, description: 'Small flame particle' },
        'small_gust': { dataType: null, description: 'Small gust particle' },
        'smoke': { dataType: null, description: 'Smoke particle' },
        'sneeze': { dataType: null, description: 'Sneeze particle' },
        'snowflake': { dataType: null, description: 'Snowflake particle' },
        'sonic_boom': { dataType: null, description: 'Warden sonic boom particle' },
        'soul': { dataType: null, description: 'Soul particle' },
        'soul_fire_flame': { dataType: null, description: 'Soul fire flame particle' },
        'spit': { dataType: null, description: 'Llama spit particle' },
        'splash': { dataType: null, description: 'Splash particle' },
        'spore_blossom_air': { dataType: null, description: 'Spore blossom air particle' },
        'squid_ink': { dataType: null, description: 'Squid ink particle' },
        'suspended_depth': { dataType: null, description: 'Suspended depth particle' },
        'sweep_attack': { dataType: null, description: 'Sweep attack particle' },
        'tinted_leaves': { dataType: null, description: 'Tinted leaves particle' },
        'totem_of_undying': { dataType: null, description: 'Totem activation particle' },
        'trail': { 
            dataType: 'Trail', 
            description: 'NEW 5.11.0: Trail particle with customizable color, duration, and source targeter',
            requiresColor: true,
            attributes: {
                color: { type: 'color', default: '#FFFFFF', description: 'Trail color (hex format)' },
                duration: { type: 'number', default: 20, description: 'Duration of the trail in ticks' },
                source: { type: 'targeter', default: '@Self', description: 'Source targeter for the trail origin' }
            }
        },
        'trial_omen': { dataType: null, description: 'Trial omen particle' },
        'trial_spawner_detection': { dataType: null, description: 'Trial spawner detection' },
        'trial_spawner_detection_ominous': { dataType: null, description: 'Ominous trial spawner detection' },
        'underwater': { dataType: null, description: 'Underwater particle' },
        'vault_connection': { dataType: null, description: 'Vault connection particle' },
        'vibration': { dataType: null, description: 'Sculk vibration particle' },
        'warped_spore': { dataType: null, description: 'Warped spore particle' },
        'wax_off': { dataType: null, description: 'Wax off particle' },
        'wax_on': { dataType: null, description: 'Wax on particle' },
        'white_ash': { dataType: null, description: 'White ash particle' },
        'white_smoke': { dataType: null, description: 'White smoke particle' },
        'witch': { dataType: null, description: 'Witch particle' }
    },

    /**
     * Get particle data by type
     */
    getParticleData(particleType) {
        return this.dataTypes[particleType.toLowerCase()] || null;
    },

    /**
     * Get all particles of a specific DataType
     */
    getParticlesByDataType(dataType) {
        return Object.entries(this.dataTypes)
            .filter(([_, data]) => data.dataType === dataType)
            .map(([name, _]) => name);
    },

    /**
     * Check if particle requires specific attribute
     */
    requiresAttribute(particleType, attribute) {
        const data = this.getParticleData(particleType);
        if (!data) return false;
        
        switch (attribute) {
            case 'material': return data.requiresMaterial;
            case 'color': return data.requiresColor;
            case 'color2': return data.requiresColor2;
            case 'size': return data.requiresSize;
            case 'power': return data.requiresPower;
            default: return false;
        }
    },

    /**
     * Get material type for particle (block or item)
     */
    getMaterialType(particleType) {
        const data = this.getParticleData(particleType);
        return data?.materialType || null;
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.PARTICLE_TYPES = PARTICLE_TYPES;
    window.ParticleTypes = PARTICLE_TYPES; // Also export as ParticleTypes for consistency
}
