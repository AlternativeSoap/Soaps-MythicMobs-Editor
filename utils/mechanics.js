/**
 * Comprehensive MythicMobs Mechanics Database (Legacy/Reference)
 * Based on official MythicMobs wiki documentation
 * NOTE: This is the old mechanics list kept for reference.
 * The active mechanics system is in data/mechanics.js
 */

const MECHANICS_DATA_LEGACY = {
    DAMAGE: [
        { name: 'damage', description: 'Deals damage to target', params: ['amount'] },
        { name: 'baseDamage', description: 'Deals base damage with modifiers', params: ['multiplier'] },
        { name: 'percentDamage', description: 'Deals damage as % of target max health', params: ['percent'] },
        { name: 'damageMult', description: 'Multiplies next damage dealt', params: ['multiplier', 'duration'] },
        { name: 'shoot', description: 'Shoots a projectile at target', params: ['projectile', 'velocity'] },
        { name: 'ignite', description: 'Sets target on fire', params: ['ticks'] },
        { name: 'explosion', description: 'Creates explosion at location', params: ['yield', 'fire'] },
        { name: 'blow', description: 'Knocks back target', params: ['velocity'] },
        { name: 'suicide', description: 'Kills the caster', params: [] }
    ],
    EFFECTS: [
        { name: 'particles', description: 'Spawns particle effects', params: ['particle', 'amount', 'speed', 'hSpread', 'vSpread'] },
        { name: 'particleLine', description: 'Draws particle line between points', params: ['particle', 'fromLocation', 'toLocation'] },
        { name: 'particleRing', description: 'Creates ring of particles', params: ['particle', 'radius', 'points'] },
        { name: 'particleOrbital', description: 'Particles orbit around target', params: ['particle', 'radius', 'speed'] },
        { name: 'sound', description: 'Plays sound effect', params: ['sound', 'volume', 'pitch'] },
        { name: 'effect', description: 'Applies potion effect', params: ['type', 'duration', 'amplifier'] },
        { name: 'potion', description: 'Applies potion effect (legacy)', params: ['type', 'duration', 'level'] },
        { name: 'particleBox', description: 'Creates particle box', params: ['particle', 'fromLocation', 'toLocation'] },
        { name: 'particleSphere', description: 'Creates particle sphere', params: ['particle', 'radius', 'density'] }
    ],
    MOVEMENT: [
        { name: 'velocity', description: 'Applies velocity to target', params: ['x', 'y', 'z', 'mode'] },
        { name: 'leap', description: 'Makes target leap', params: ['velocity', 'angle'] },
        { name: 'teleport', description: 'Teleports target to location', params: ['location'] },
        { name: 'teleportTo', description: 'Teleports to target', params: [] },
        { name: 'dash', description: 'Dashes forward', params: ['speed', 'mode'] },
        { name: 'lunge', description: 'Lunges at target', params: ['velocity'] },
        { name: 'pull', description: 'Pulls target toward caster', params: ['velocity'] },
        { name: 'throw', description: 'Throws target', params: ['velocity'] },
        { name: 'jump', description: 'Makes entity jump', params: ['velocity'] },
        { name: 'spring', description: 'Spring jump effect', params: ['velocity'] }
    ],
    PROJECTILE: [
        { name: 'projectile', description: 'Shoots customizable projectile', params: ['onTick', 'onHit', 'onEnd', 'velocity', 'interval'] },
        { name: 'missile', description: 'Shoots homing missile', params: ['onTick', 'onHit', 'velocity', 'turns'] },
        { name: 'volley', description: 'Shoots multiple projectiles', params: ['amount', 'spread', 'velocity'] },
        { name: 'barrage', description: 'Rapid fire projectiles', params: ['amount', 'delay', 'spread'] },
        { name: 'orbital', description: 'Creates orbiting projectile', params: ['onTick', 'radius', 'speed'] }
    ],
    SUMMON: [
        { name: 'summon', description: 'Summons a mob', params: ['type', 'amount', 'radius'] },
        { name: 'summonArea', description: 'Summons mob in area', params: ['type', 'amount', 'radius'] },
        { name: 'spawn', description: 'Spawns entity at location', params: ['type'] },
        { name: 'mount', description: 'Mounts target on entity', params: [] },
        { name: 'dismount', description: 'Dismounts rider', params: [] }
    ],
    CONTROL: [
        { name: 'delay', description: 'Delays next mechanic', params: ['ticks'] },
        { name: 'cast', description: 'Casts another skill', params: ['skill'] },
        { name: 'trigger', description: 'Triggers skill on target', params: ['skill'] },
        { name: 'skill', description: 'Executes skill', params: ['skill'] },
        { name: 'aura', description: 'Creates persistent aura effect', params: ['onTick', 'duration', 'interval'] },
        { name: 'cancelEvent', description: 'Cancels triggering event', params: [] },
        { name: 'consume', description: 'Consumes charges', params: ['charges'] },
        { name: 'chain', description: 'Chains to nearby entities', params: ['amount', 'radius'] },
        { name: 'chainMissile', description: 'Chaining missile', params: ['bounces', 'radius'] }
    ],
    VISUAL: [
        { name: 'message', description: 'Sends message to target', params: ['message'] },
        { name: 'sendActionMessage', description: 'Sends action bar message', params: ['message'] },
        { name: 'sendTitle', description: 'Sends title to player', params: ['title', 'subtitle', 'fadeIn', 'stay', 'fadeOut'] },
        { name: 'toast', description: 'Shows toast notification', params: ['message', 'icon'] },
        { name: 'blockWave', description: 'Creates block wave effect', params: ['material', 'radius', 'velocity'] },
        { name: 'lightning', description: 'Strikes lightning', params: ['damage'] }
    ],
    MODIFICATION: [
        { name: 'heal', description: 'Heals target', params: ['amount'] },
        { name: 'feed', description: 'Feeds target player', params: ['amount'] },
        { name: 'oxygen', description: 'Gives oxygen to target', params: ['amount'] },
        { name: 'shield', description: 'Creates damage shield', params: ['amount', 'duration'] },
        { name: 'setHealth', description: 'Sets health to value', params: ['amount'] },
        { name: 'modifyDamage', description: 'Modifies damage dealt', params: ['multiplier'] },
        { name: 'setLevel', description: 'Sets mob level', params: ['level'] },
        { name: 'disguise', description: 'Disguises mob', params: ['type'] },
        { name: 'undisguise', description: 'Removes disguise', params: [] }
    ],
    WORLD: [
        { name: 'command', description: 'Executes command', params: ['command'] },
        { name: 'dropItem', description: 'Drops item at location', params: ['item', 'amount'] },
        { name: 'closeInventory', description: 'Closes inventory', params: [] },
        { name: 'setBlock', description: 'Sets block at location', params: ['material', 'location'] },
        { name: 'setBlockType', description: 'Changes block type', params: ['material'] },
        { name: 'fill', description: 'Fills area with blocks', params: ['material', 'radius'] },
        { name: 'blockMask', description: 'Creates block mask', params: ['material', 'radius', 'duration'] },
        { name: 'weather', description: 'Changes weather', params: ['type', 'duration'] }
    ],
    ADVANCED: [
        { name: 'raytrace', description: 'Performs raytrace', params: ['range', 'onHit', 'onTick'] },
        { name: 'raytraceToBlock', description: 'Raytrace to block', params: ['range'] },
        { name: 'setScore', description: 'Sets scoreboard score', params: ['objective', 'value'] },
        { name: 'addScore', description: 'Adds to scoreboard score', params: ['objective', 'value'] },
        { name: 'giveItem', description: 'Gives item to player', params: ['item', 'amount'] },
        { name: 'takeItem', description: 'Takes item from player', params: ['item', 'amount'] },
        { name: 'setGravity', description: 'Sets gravity state', params: ['enabled'] },
        { name: 'setGliding', description: 'Sets gliding state', params: ['enabled'] },
        { name: 'setAI', description: 'Toggles AI', params: ['enabled'] }
    ]
};

const ALL_MECHANICS_LEGACY = Object.values(MECHANICS_DATA_LEGACY).flat();

const MECHANIC_CATEGORIES_LEGACY = Object.keys(MECHANICS_DATA_LEGACY);

// Legacy export for backward compatibility
const Mechanics = {
    DAMAGE: MECHANICS_DATA_LEGACY.DAMAGE.map(m => m.name),
    EFFECTS: MECHANICS_DATA_LEGACY.EFFECTS.map(m => m.name),
    MOVEMENT: MECHANICS_DATA_LEGACY.MOVEMENT.map(m => m.name),
    PROJECTILE: MECHANICS_DATA_LEGACY.PROJECTILE.map(m => m.name),
    SUMMON: MECHANICS_DATA_LEGACY.SUMMON.map(m => m.name),
    SPECIAL: [...MECHANICS_DATA_LEGACY.CONTROL.map(m => m.name), ...MECHANICS_DATA_LEGACY.VISUAL.map(m => m.name)]
};

window.Mechanics = Mechanics;
// Note: MECHANICS_DATA is now in data/mechanics.js (new system)
// This file kept for backward compatibility only
window.ALL_MECHANICS_LEGACY = ALL_MECHANICS_LEGACY;
window.MECHANIC_CATEGORIES_LEGACY = MECHANIC_CATEGORIES_LEGACY;
