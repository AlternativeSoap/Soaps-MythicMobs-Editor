/**
 * MythicMobs Trigger System Data
 * Complete metadata for all 32 triggers organized by category
 */

const TRIGGERS_DATA = {
    // Category definitions with colors
    categories: {
        combat: { name: 'Combat', color: '#ef4444' },
        lifecycle: { name: 'Lifecycle', color: '#3b82f6' },
        player: { name: 'Player Interaction', color: '#10b981' },
        timed: { name: 'Timed', color: '#a855f7' },
        projectile: { name: 'Projectile', color: '#eab308' },
        special: { name: 'Special Events', color: '#ec4899' },
        communication: { name: 'Communication', color: '#06b6d4' }
    },

    // All triggers with complete metadata
    triggers: [
        // COMBAT CATEGORY
        {
            name: 'onCombat',
            aliases: [],
            category: 'combat',
            description: 'The default trigger if none was used. Executes when the mob deals damage, takes damage, spawns, or dies.',
            hasTarget: true,
            targetDescription: 'The entity involved in the combat event',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onAttack',
            aliases: [],
            category: 'combat',
            description: 'Executes when the mob attacks an entity.',
            hasTarget: true,
            targetDescription: 'The entity that was attacked',
            placeholders: ['<skill.var.damage-amount>', '<skill.var.damage-type>', '<skill.var.damage-cause>'],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onDamaged',
            aliases: ['onHurt'],
            category: 'combat',
            description: 'Executes when the mob takes damage.',
            hasTarget: true,
            targetDescription: 'The entity that dealt the damage',
            placeholders: ['<skill.var.damage-amount>', '<skill.var.damage-type>', '<skill.var.damage-cause>'],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onEnterCombat',
            aliases: [],
            category: 'combat',
            description: 'Executes when the mob enters combat.',
            hasTarget: true,
            targetDescription: 'The entity that made the caster enter combat',
            placeholders: [],
            requirements: ['ThreatTable'],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: { module: 'ThreatTable', value: true }
        },
        {
            name: 'onDropCombat',
            aliases: ['onLeaveCombat', 'onCombatDrop', 'onExitCombat'],
            category: 'combat',
            description: 'Executes when the mob drops combat.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: ['ThreatTable'],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: { module: 'ThreatTable', value: true }
        },
        {
            name: 'onChangeTarget',
            aliases: ['onTargetChange'],
            category: 'combat',
            description: 'Executes when the mob changes target.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: ['ThreatTable'],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: { module: 'ThreatTable', value: true }
        },
        {
            name: 'onPlayerKill',
            aliases: ['onKillPlayer'],
            category: 'combat',
            description: 'Executes when the mob kills a player.',
            hasTarget: true,
            targetDescription: 'The player that has been killed',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onSkillDamage',
            aliases: ['onSkillHit', 'onSkill_Damage'],
            category: 'combat',
            description: 'Executes when the mob deals damage to other entities via a mechanic.',
            hasTarget: true,
            targetDescription: 'The entity that was damaged',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },

        // LIFECYCLE CATEGORY
        {
            name: 'onSpawn',
            aliases: [],
            category: 'lifecycle',
            description: 'Executes when the mob spawns.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onDespawn',
            aliases: ['onDespawned'],
            category: 'lifecycle',
            description: 'Executes when the mob despawns.',
            hasTarget: true,
            targetDescription: 'The caster itself',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onReady',
            aliases: ['onFirstSpawn'],
            category: 'lifecycle',
            description: 'Executes when the mob is ready to spawn from a spawner.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onLoad',
            aliases: [],
            category: 'lifecycle',
            description: 'Executes when the mob is loaded after a server restart.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onSpawnOrLoad',
            aliases: [],
            category: 'lifecycle',
            description: 'Executes when either ~onSpawn or ~onLoad would trigger.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onDeath',
            aliases: [],
            category: 'lifecycle',
            description: 'Executes when the mob dies. Can cancel death event on Paper servers with cancelevent mechanic.',
            hasTarget: true,
            targetDescription: 'The entity that killed the caster',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onChangeWorld',
            aliases: ['onChange_World', 'onWorld_Change', 'onWorldChange'],
            category: 'lifecycle',
            description: 'Executes when the caster changes world.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },

        // PLAYER INTERACTION CATEGORY
        {
            name: 'onInteract',
            aliases: [],
            category: 'player',
            description: 'Executes when a player interacts with, or right-clicks, the mob.',
            hasTarget: true,
            targetDescription: 'The player that interacted with the caster',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onTame',
            aliases: [],
            category: 'player',
            description: 'Executes when the player tames the mob.',
            hasTarget: true,
            targetDescription: 'The player that tamed the mob',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onBreed',
            aliases: [],
            category: 'player',
            description: 'Executes when the mob breeds with another mob. Has @Father and @Mother targeters.',
            hasTarget: true,
            targetDescription: 'The player that made the caster breed',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onTrade',
            aliases: [],
            category: 'player',
            description: 'Executes when the villager trades with a player.',
            hasTarget: true,
            targetDescription: 'The player that traded with the villager',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onBucket',
            aliases: ['onUseBucket', 'onFillBucket', 'onBucketFill', 'onMilk', 'onMilked'],
            category: 'player',
            description: 'Executes when the cow is milked or when an entity is stored in a bucket.',
            hasTarget: true,
            targetDescription: 'The caster itself',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },

        // TIMED CATEGORY
        {
            name: 'onTimer',
            aliases: [],
            category: 'timed',
            description: 'Executes every nth ticks. 20 ticks = 1 second. Does not act relative to spawn time, but to a global clock.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: {
                type: 'number',
                name: 'ticks',
                description: 'Number of ticks between executions (20 ticks = 1 second)',
                required: true,
                validation: (value) => {
                    const num = parseInt(value);
                    return !isNaN(num) && num > 0;
                },
                defaultValue: '20'
            },
            mobTypeRestrictions: [],
            autoEnable: null
        },

        // PROJECTILE CATEGORY
        {
            name: 'onShoot',
            aliases: ['onBowShoot', 'onShootBow'],
            category: 'projectile',
            description: 'Executes when the mob shoots a projectile (arrows, fireballs, etc).',
            hasTarget: true,
            targetDescription: 'The caster',
            placeholders: ['<skill.var.bow-tension>'],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onBowHit',
            aliases: ['onBow_Hit', 'onArrowHit'],
            category: 'projectile',
            description: "Executes when the mob's projectile hits an entity.",
            hasTarget: true,
            targetDescription: 'The entity that has been hit',
            placeholders: ['<skill.var.damage-amount>', '<skill.var.damage-type>', '<skill.var.damage-cause>'],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onProjectileHit',
            aliases: ['onProjectile_Hit', 'onTrident_Hit', 'onTridentHit'],
            category: 'projectile',
            description: "Executes when the mob's special projectile (trident, snowball, wither skull, llama spit, etc) hits an entity.",
            hasTarget: true,
            targetDescription: 'The entity that has been hit',
            placeholders: ['<skill.var.damage-amount>', '<skill.var.damage-type>', '<skill.var.damage-cause>'],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onProjectileLand',
            aliases: ['onProjectile_Land', 'onTridentLand'],
            category: 'projectile',
            description: "Executes when the mob's special projectile lands on the ground without hitting an entity.",
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onDismounted',
            aliases: ['onUnmounted'],
            category: 'special',
            description: 'Executes the skill when the mob is dismounted from (and dismounts the mob).',
            hasTarget: true,
            targetDescription: 'The entity that dismounted the caster',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },

        // SPECIAL EVENTS CATEGORY
        {
            name: 'onExplode',
            aliases: [],
            category: 'special',
            description: 'Executes when the mob explodes. mobGriefing gamerule must be true. Generally works with creepers and TNTs.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onPrime',
            aliases: [],
            category: 'special',
            description: 'Executes when the creeper is primed (e.g. via flint and steel).',
            hasTarget: true,
            targetDescription: 'The caster itself',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: ['CREEPER'],
            autoEnable: null
        },
        {
            name: 'onCreeperCharge',
            aliases: ['onCreeper_Charge', 'onCharged', 'onCharge'],
            category: 'special',
            description: 'Executes when the creeper is charged (by lightning).',
            hasTarget: true,
            targetDescription: 'The caster itself',
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: ['CREEPER'],
            autoEnable: null
        },
        {
            name: 'onTeleport',
            aliases: [],
            category: 'special',
            description: 'Executes when the mob teleports.',
            hasTarget: false,
            targetDescription: null,
            placeholders: [],
            requirements: [],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: null
        },
        {
            name: 'onHear',
            aliases: [],
            category: 'special',
            description: 'Executes when the mob hears a sound, if this feature has been enabled.',
            hasTarget: true,
            targetDescription: 'The entity that generated the sound',
            placeholders: ['<skill.var.volume>', '<skill.var.sound-type>'],
            requirements: ['Hearing'],
            parameters: null,
            mobTypeRestrictions: [],
            autoEnable: { module: 'Hearing', value: { Enabled: true } }
        },

        // COMMUNICATION CATEGORY
        {
            name: 'onSignal',
            aliases: [],
            category: 'communication',
            description: 'Executes when the mob receives a signal from the signal mechanic. Signal must be alphanumeric.',
            hasTarget: true,
            targetDescription: 'The entity that sent the signal',
            placeholders: [],
            requirements: [],
            parameters: {
                type: 'string',
                name: 'signal',
                description: 'The signal name to listen for (alphanumeric). Leave empty to receive all signals.',
                required: false,
                validation: (value) => {
                    if (!value) return true; // Optional
                    return /^[a-zA-Z0-9_]+$/.test(value);
                },
                defaultValue: ''
            },
            mobTypeRestrictions: [],
            autoEnable: null
        }
    ],

    /**
     * Get trigger by name (including aliases)
     */
    getTrigger(name) {
        const normalized = name.toLowerCase();
        return this.triggers.find(t => 
            t.name.toLowerCase() === normalized || 
            t.aliases.some(a => a.toLowerCase() === normalized)
        );
    },

    /**
     * Get all triggers in a category
     */
    getTriggersByCategory(category) {
        return this.triggers.filter(t => t.category === category);
    },

    /**
     * Get triggers compatible with mob type
     */
    getCompatibleTriggers(mobType) {
        if (!mobType) return this.triggers;
        return this.triggers.filter(t => 
            t.mobTypeRestrictions.length === 0 || 
            t.mobTypeRestrictions.includes(mobType.toUpperCase())
        );
    },

    /**
     * Search triggers by query
     */
    searchTriggers(query) {
        if (!query) return this.triggers;
        const lowerQuery = query.toLowerCase();
        return this.triggers.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.aliases.some(a => a.toLowerCase().includes(lowerQuery))
        );
    },

    /**
     * Check if trigger requires specific modules
     */
    checkRequirements(trigger, mobModules) {
        if (!trigger.requirements || trigger.requirements.length === 0) {
            return { satisfied: true, missing: [] };
        }

        const missing = [];
        for (const req of trigger.requirements) {
            if (req === 'ThreatTable' && !mobModules?.ThreatTable) {
                missing.push(req);
            } else if (req === 'Hearing' && !mobModules?.Hearing?.Enabled) {
                missing.push(req);
            }
        }

        return {
            satisfied: missing.length === 0,
            missing: missing
        };
    }
};

// Export to window for browser usage
window.TRIGGERS_DATA = TRIGGERS_DATA;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TRIGGERS_DATA;
}
