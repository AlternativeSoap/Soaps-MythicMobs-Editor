/**
 * Power System Data
 * Based on MythicMobs wiki documentation
 * Power affects SKILL mechanics, not base mob stats
 * Used primarily with Level Modifiers to scale skill potency
 */

const POWER_SCALING = {
    basedamage: {
        mechanic: 'basedamage',
        attribute: 'multiplier',
        formula: 'damage = multiplier * power',
        description: 'Skill damage scales directly with power'
    },
    damage: {
        mechanic: 'damage',
        attribute: 'amount',
        formula: 'damage = amount * power',
        description: 'Skill damage scales directly with power'
    },
    consume: {
        mechanic: 'consume',
        attribute: 'damage/heal',
        formula: 'value = value * power',
        description: 'Consume damage/heal scales with power'
    },
    leap: {
        mechanic: 'leap',
        attribute: 'velocity',
        formula: 'velocity = velocity * (1 + power * 0.1)',
        description: 'Leap velocity increases by 10% per power'
    },
    projectile: {
        mechanic: 'projectile',
        attribute: 'velocity/maxrange',
        formula: 'value = value * power',
        description: 'Projectile attributes scale with power'
    },
    missile: {
        mechanic: 'missile',
        attribute: 'velocity/maxrange',
        formula: 'value = value * power',
        description: 'Missile attributes scale with power'
    }
};

const POWER_CONFIG = {
    min: 0,
    max: 100,
    default: 1,
    description: 'Power level for skill mechanics scaling (use with Level Modifiers for best results)',
    warning: 'Power only affects specific skill mechanics, not base mob stats'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        POWER_SCALING,
        POWER_CONFIG
    };
}
