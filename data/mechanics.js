/**
 * MythicMobs Mechanics Data - COMPLETE DATABASE
 * Comprehensive database of 180+ MythicMobs mechanics with full attributes, aliases, and examples
 * Parsed from official MythicMobs documentation (8386 lines)
 */

// Universal Attributes - Apply to ALL mechanics
const UNIVERSAL_ATTRIBUTES = [
    { name: 'cooldown', alias: ['cd'], type: 'number', default: 0, description: 'Cooldown in seconds (allows decimals)' },
    { name: 'delay', alias: [], type: 'number', default: 0, description: 'Delays execution by set number of ticks' },
    { name: 'repeat', alias: [], type: 'number', default: 0, description: 'How many times to repeat (with repeatInterval=0, becomes executions)' },
    { name: 'repeatInterval', alias: ['repeatI'], type: 'number', default: 0, description: 'Ticks between repetitions' },
    { name: 'targetInterval', alias: ['targetI'], type: 'number', default: 0, description: 'Ticks between target selection' },
    { name: 'origin', alias: [], type: 'targeter', default: '', description: 'Change origin to targeter (Premium)' },
    { name: 'power', alias: [], type: 'number', default: 1, description: 'Power multiplier' },
    { name: 'fromorigin', alias: ['fo', 'sourceisorigin', 'castfromorigin'], type: 'boolean', default: false, description: 'Cast from origin (select mechanics only)' },
    { name: 'targetisorigin', alias: [], type: 'boolean', default: false, description: 'Set target as origin' },
    { name: 'targetcreative', alias: [], type: 'boolean', default: false, description: 'Whether to target creative players' },
    { name: 'splitPower', alias: ['powersplit', 'powersplitbetweentargets'], type: 'boolean', default: false, description: 'Split power between targets' },
    { name: 'faulty', alias: [], type: 'boolean', default: true, description: 'Use old vector formula' },
    { name: 'chance', alias: [], type: 'number', default: 1, description: 'Chance of execution (0.1 = 10%)' },
    { name: 'forcesync', alias: ['sync'], type: 'boolean', default: false, description: 'Force synchronous execution (needed for some mechanics like CancelEvent)' }
];

// Skill Reference Parameters - Parameters that reference other skills
const SKILL_REFERENCE_PARAMS = [
    'onStartSkill', 'onStart', 'oS',
    'onTickSkill', 'onTick', 'oT',
    'onEndSkill', 'onEnd', 'oE',
    'onHitSkill', 'onHit', 'oH',
    'onBounceSkill', 'onBounce',
    'onHitBlockSkill', 'onHitBlock', 'ohb',
    'onInteractSkill', 'onInteract',
    'onstartskill', 'ontickskill', 'onendskill', // lowercase variants
    'skill', 's', 'm', 'meta' // common aliases
];

// Inherited Particle Attributes - Shared by all particle mechanics except base Particle
const INHERITED_PARTICLE_ATTRIBUTES = [
    { name: 'mob', alias: ['m', 't'], type: 'text', default: '', description: 'Entity to spawn as particle (Premium Only)' },
    { name: 'amount', alias: ['count', 'a'], type: 'number', default: 10, description: 'Number of particles to create' },
    { name: 'spread', alias: ['offset'], type: 'number', default: 0, description: 'Vertical spread of particles' },
    { name: 'hspread', alias: ['hs'], type: 'number', default: 'spread', description: 'Horizontal spread of particles' },
    { name: 'vspread', alias: ['vs', 'yspread', 'ys'], type: 'number', default: 'spread', description: 'Y-axis spread of particles' },
    { name: 'xspread', alias: ['xs'], type: 'number', default: 'hSpread', description: 'X-axis spread (overwrites hSpread)' },
    { name: 'zspread', alias: ['zs'], type: 'number', default: 'hSpread', description: 'Z-axis spread (overwrites hSpread)' },
    { name: 'speed', alias: ['s'], type: 'number', default: 0, description: 'Speed of particles (inconsistent with DataTypes)' },
    { name: 'yoffset', alias: ['y'], type: 'number', default: 0, description: 'Y offset from target' },
    { name: 'viewdistance', alias: ['vd'], type: 'number', default: 128, description: 'Distance particles are rendered' },
    { name: 'fromorigin', alias: ['fo'], type: 'boolean', default: false, description: 'Generate particles from origin' },
    { name: 'directional', alias: ['d'], type: 'boolean', default: false, description: 'Use directional travel' },
    { name: 'directionreversed', alias: ['dr'], type: 'boolean', default: false, description: 'Reverse particle direction' },
    { name: 'direction', alias: ['dir'], type: 'text', default: '0,0,0', description: 'Vector direction (x,y,z)' },
    { name: 'fixedyaw', alias: ['yaw'], type: 'number', default: -1111, description: 'Fixed yaw (-1111 = ignored)' },
    { name: 'fixedpitch', alias: ['pitch'], type: 'number', default: -1111, description: 'Fixed pitch (-1111 = ignored)' },
    { name: 'audience', alias: [], type: 'text', default: 'nearby', description: 'Audience of particle effect' },
    { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Particle color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
    { name: 'exactoffsets', alias: ['eo'], type: 'boolean', default: false, description: 'Changes spawn location formula' },
    { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material for block/item particles', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
    { name: 'useEyeLocation', alias: ['uel'], type: 'boolean', default: false, description: 'Base particles on entity eyes' },
    { name: 'forwardoffset', alias: ['startfoffset', 'sfo'], type: 'number', default: 0, description: 'Forward offset from entity' },
    { name: 'sideoffset', alias: ['soffset', 'sso'], type: 'number', default: 0, description: 'Side offset from entity' }
];

const MECHANICS_DATA = {
    // Category definitions
    categories: {
        damage: { name: 'Damage', color: '#ef4444', icon: '⚔️' },
        heal: { name: 'Healing', color: '#10b981', icon: '❤️' },
        movement: { name: 'Movement', color: '#3b82f6', icon: '🏃' },
        effects: { name: 'Effects', color: '#a855f7', icon: '✨' },
        control: { name: 'Control', color: '#f59e0b', icon: '🎮' },
        utility: { name: 'Utility', color: '#06b6d4', icon: '🔧' },
        aura: { name: 'Auras', color: '#8b5cf6', icon: '🔮' },
        projectile: { name: 'Projectiles', color: '#ec4899', icon: '🎯' },
        meta: { name: 'Meta Mechanics', color: '#9333ea', icon: '⚡' }
    },

    // All mechanics with complete metadata (180+ mechanics)
    mechanics: [
        // ═══════════════════════════════════════════════════════════
        // DAMAGE MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'damage',
            name: 'damage',
            aliases: ['d'],
            category: 'damage',
            description: 'Deals damage to the target entity. Supports various damage types and modifiers.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'The amount of damage to deal' },
                { name: 'ignorearmor', alias: ['ia', 'i'], type: 'boolean', default: false, description: 'Whether to ignore armor' },
                { name: 'preventknockback', alias: ['pkb', 'pk'], type: 'boolean', default: false, description: 'Whether to prevent knockback' },
                { name: 'preventimmunity', alias: ['pi'], type: 'boolean', default: false, description: 'Whether to prevent immunity frames' },
                { name: 'damagecause', alias: ['cause', 'type', 't'], type: 'string', default: 'ENTITY_ATTACK', description: 'The damage cause type' }
            ],
            defaultTargeter: '@Target',
            examples: ['- damage{a=10} ', '- damage{amount=20;ia=true} ', '- damage{a=5;pkb=true;pi=true} ']
        },
        {
            id: 'basedamage',
            name: 'basedamage',
            aliases: [],
            category: 'damage',
            description: 'Deals damage based on the mob\'s configured damage value.',
            attributes: [
                { name: 'multiplier', alias: ['m'], type: 'number', default: 1, description: 'Damage multiplier' }
            ],
            defaultTargeter: '@Target',
            examples: ['- basedamage{m=1.5} ']
        },
        {
            id: 'percentdamage',
            name: 'percentdamage',
            aliases: ['perdamage'],
            category: 'damage',
            description: 'Deals damage as a percentage of the target\'s max health.',
            attributes: [
                { name: 'percent', alias: ['p', 'amount', 'a'], type: 'number', default: 0.1, description: 'Percentage of max health (0.1 = 10%)' }
            ],
            defaultTargeter: '@Target',
            examples: ['- percentdamage{p=0.25} ', '- percentdamage{a=0.5} ']
        },
        {
            id: 'hit',
            name: 'hit',
            aliases: ['physicaldamage', 'meleehit'],
            category: 'damage',
            description: 'Simulates a physical hit from the caster. Takes items, enchantments, melee stats, and attribute modifiers into account.',
            attributes: [
                { name: 'multiplier', alias: ['m'], type: 'number', default: 1, description: 'The percentage of damage to deal' },
                { name: 'forceddamage', alias: ['fd', 'forced'], type: 'number', default: 0, description: 'If set, flat damage that will be inflicted' },
                { name: 'triggerskills', alias: ['ts'], type: 'boolean', default: true, description: 'Whether to trigger onAttack related triggers' }
            ],
            defaultTargeter: '@Target',
            examples: ['- hit{m=1.5;ia=true}']
        },
        {
            id: 'explosion',
            name: 'explosion',
            aliases: ['explode'],
            category: 'damage',
            description: 'Creates an explosion at the target location with configurable yield and fire.',
            attributes: [
                { name: 'yield', alias: ['y', 'power'], type: 'number', default: 1, description: 'The power of the explosion' },
                { name: 'blockdamage', alias: ['bd'], type: 'boolean', default: true, description: 'Whether blocks are damaged' },
                { name: 'fire', alias: ['f'], type: 'boolean', default: false, description: 'Whether to set blocks on fire' }
            ],
            defaultTargeter: '@Self',
            examples: ['- explosion{y=4} ', '- explosion{yield=2;bd=false;f=true} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // HEALING MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'heal',
            name: 'heal',
            aliases: ['h'],
            category: 'heal',
            description: 'Heals the targeted entity for the specified value. Can also "overheal" the mob to more than its maximum health.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'The amount to heal the target' },
                { name: 'overheal', alias: ['oh'], type: 'boolean', default: false, description: 'Whether to apply overhealing as additional MaxHealth' },
                { name: 'maxoverheal', alias: ['maxabsorb', 'maxshield', 'mo', 'ma', 'ms'], type: 'number', default: 1, description: 'Maximum amount of overhealing' }
            ],
            defaultTargeter: '@Self',
            examples: ['- heal{amount=10} ', '- heal{a=5;oh=true;mo=20} ', '- heal{amount=20} 0.2']
        },
        {
            id: 'healpercent',
            name: 'healpercent',
            aliases: ['percentheal', 'hp'],
            category: 'heal',
            description: 'Heals the target entity for a percentage of its max-health.',
            attributes: [
                { name: 'multiplier', alias: ['m', 'amount', 'a'], type: 'number', default: 0.1, description: 'Percentage to heal (0.1 = 10%)' },
                { name: 'overheal', alias: ['oh'], type: 'boolean', default: false, description: 'Whether to apply overhealing' }
            ],
            defaultTargeter: '@Self',
            examples: ['- healpercent{m=0.2}', '- healpercent{a=0.5;oh=true} ']
        },
        {
            id: 'feed',
            name: 'feed',
            aliases: [],
            category: 'heal',
            description: 'Feeds the targeted player. Doesn\'t work for other mobs.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'The amount of hunger to restore (1 = half food unit)' },
                { name: 'saturation', alias: ['s'], type: 'number', default: 0, description: 'The amount of saturation to restore' },
                { name: 'overfeed', alias: ['o', 'of'], type: 'boolean', default: false, description: 'Whether to overfeed (excess converts to saturation)' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- feed{amount=10}', '- feed{a=5;s=2;o=true} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // MOVEMENT MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'teleport',
            name: 'teleport',
            aliases: ['tp'],
            category: 'movement',
            description: 'Teleports the caster to the targeted location/entity.',
            attributes: [
                { name: 'spreadh', alias: ['sh', 'r', 'radius'], type: 'number', default: 0, description: 'Horizontal spread of landing location' },
                { name: 'spreadv', alias: ['sv'], type: 'number', default: 0, description: 'Vertical spread of landing location' },
                { name: 'preservepitch', alias: ['pp'], type: 'boolean', default: true, description: 'Whether pitch value should be carried over' },
                { name: 'preserveyaw', alias: ['py'], type: 'boolean', default: true, description: 'Whether yaw value should be carried over' }
            ],
            defaultTargeter: '@Target',
            examples: ['- teleport{spreadh=5;spreadv=0} ', '- tp ']
        },
        {
            id: 'leap',
            name: 'leap',
            aliases: [],
            category: 'movement',
            description: 'Causes the mob to leap through the air at the target with projectile-like trajectory.',
            attributes: [
                { name: 'velocity', alias: ['v'], type: 'number', default: 100, description: 'The max velocity of the leap (use high values 100+)' },
                { name: 'noise', alias: ['n'], type: 'number', default: 0, description: 'Added variance to landing location' }
            ],
            defaultTargeter: '@Target',
            examples: ['- leap{velocity=200} ', '- leap{v=150;n=2} ']
        },
        {
            id: 'throw',
            name: 'throw',
            aliases: [],
            category: 'movement',
            description: 'Throws all targets away from the mob (or origin).',
            attributes: [
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Horizontal velocity of throw' },
                { name: 'velocityy', alias: ['vy', 'yv', 'yvelocity'], type: 'number', default: 1, description: 'Vertical velocity of throw' },
                { name: 'fromorigin', alias: ['fo'], type: 'boolean', default: false, description: 'Whether to throw from origin' }
            ],
            defaultTargeter: '@PlayersInRadius{r=5}',
            examples: ['- throw{velocity=15;velocityY=5} ', '- throw{v=10;vy=3;fo=true} ']
        },
        {
            id: 'velocity',
            name: 'velocity',
            aliases: [],
            category: 'movement',
            description: 'Modifies the velocity of the targeted entity(s). Works on players too.',
            attributes: [
                { name: 'mode', alias: ['m'], type: 'string', default: 'SET', description: 'Operation: SET, ADD, REMOVE, DIVIDE, MULTIPLY' },
                { name: 'velocityx', alias: ['vx', 'x'], type: 'number', default: 1, description: 'Velocity on x-axis' },
                { name: 'velocityy', alias: ['vy', 'y'], type: 'number', default: 1, description: 'Velocity on y-axis' },
                { name: 'velocityz', alias: ['vz', 'z'], type: 'number', default: 1, description: 'Velocity on z-axis' },
                { name: 'relative', alias: ['r'], type: 'boolean', default: false, description: 'If velocity is relative to facing direction' }
            ],
            defaultTargeter: '@Self',
            examples: ['- velocity{m=set;x=0;y=0;z=0}', '- velocity{m=add;y=2;r=true} ']
        },
        {
            id: 'jump',
            name: 'jump',
            aliases: [],
            category: 'movement',
            description: 'Causes the mob to jump with the given velocity.',
            attributes: [
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Velocity of jump (0.75 ≈ 1 block)' }
            ],
            defaultTargeter: '@Self',
            examples: ['- jump{velocity=20}', '- jump{v=0.75} ']
        },
        {
            id: 'lunge',
            name: 'lunge',
            aliases: [],
            category: 'movement',
            description: 'Applies forward directional velocity to the target.',
            attributes: [
                { name: 'velocity', alias: ['v', 'magnitude'], type: 'number', default: 1, description: 'Horizontal velocity forward' },
                { name: 'velocityy', alias: ['vy', 'yv', 'yvelocity'], type: 'number', default: 1, description: 'Vertical velocity' }
            ],
            defaultTargeter: '@Self',
            examples: ['- lunge{velocity=15;velocityY=5} ']
        },
        {
            id: 'pull',
            name: 'pull',
            aliases: [],
            category: 'movement',
            description: 'Pulls all targeted entities towards the caster with velocity scaling by distance.',
            attributes: [
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Base velocity of pull' },
                { name: 'toorigin', alias: ['to'], type: 'boolean', default: false, description: 'Pull towards skill origin' }
            ],
            defaultTargeter: '@Target',
            examples: ['- pull{velocity=10} ', '- pull{v=6;to=true} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // UTILITY MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'skill',
            name: 'skill',
            aliases: ['metaskill', 'meta', 's', '$', '()', 'm', 'mechanics', 'spell'],
            category: 'meta',
            description: 'Executes another MetaSkill. The executed skill will inherit any targets if no targeter is specified.',
            attributes: [
                { name: 'skill', alias: ['s', '$', '()', 'm', 'mechanics', 'meta', 'spell'], type: 'string', default: '', required: true, description: 'The metaskill to execute' },
                { name: 'forcesync', alias: ['sync'], type: 'boolean', default: false, description: 'Force synchronous execution' },
                { name: 'branch', alias: ['b', 'fork', 'f'], type: 'boolean', default: false, description: 'Branch off skilltree' }
            ],
            defaultTargeter: '@Target',
            examples: ['- skill{skill=AnotherSkill} ', '- skill{s=ice_bolt;sync=true}']
        },
        {
            id: 'delay',
            name: 'delay',
            aliases: [],
            category: 'meta',
            description: 'Delays the current skilltree by X ticks. 20 ticks = 1 second.',
            attributes: [
                { name: 'ticks', alias: ['t'], type: 'number', default: 20, description: 'Number of ticks to delay' }
            ],
            defaultTargeter: '',
            examples: ['- delay 60', '- delay 100', '- ignite{ticks=60}\n- delay 60\n- explode']
        },
        {
            id: 'message',
            name: 'message',
            aliases: ['m', 'msg'],
            category: 'utility',
            description: 'Sends a chat message to the target player. Supports color codes and variables.',
            attributes: [
                { name: 'message', alias: ['msg', 'm'], type: 'string', default: '', required: true, description: 'The message to send' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- message{m="<caster.name> uses a skill!"} ', '- message{m="&aHealing!"} ']
        },
        {
            id: 'command',
            name: 'command',
            aliases: [],
            category: 'utility',
            description: 'Executes a command as console or the target player.',
            attributes: [
                { name: 'command', alias: ['c'], type: 'string', default: '', required: true, description: 'The command to execute' },
                { name: 'ascaster', alias: ['ac'], type: 'boolean', default: false, description: 'Execute as caster instead of console' }
            ],
            defaultTargeter: '',
            examples: ['- command{c="give <target.name> diamond 1"}', '- command{c="say Hello";ac=true} ']
        },
        {
            id: 'summon',
            name: 'summon',
            aliases: ['spawnmobs', 'spawnmob'],
            category: 'utility',
            description: 'Summons mobs of the given type around the target.',
            attributes: [
                { name: 'type', alias: ['t', 'mob', 'm'], type: 'string', default: 'SKELETON', description: 'Type of mob (MythicMob or vanilla)' },
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Number of mobs to summon' },
                { name: 'level', alias: ['l'], type: 'number', default: 0, description: 'Level of summoned mob' },
                { name: 'radius', alias: ['r', 'noise', 'n'], type: 'number', default: 0, description: 'Radius around target for spawning' }
            ],
            defaultTargeter: '@Self',
            examples: ['- summon{type=WITHER_SKELETON;amount=5;radius=4} ']
        },
        {
            id: 'remove',
            name: 'remove',
            aliases: ['delete'],
            category: 'utility',
            description: 'Removes the targeted entity from existence. Does not work on players.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- remove{delay=200}', '- remove']
        },
        {
            id: 'signal',
            name: 'signal',
            aliases: ['sendsignal'],
            category: 'utility',
            description: 'Sends a signal to the specified targeter. Used with trigger.',
            attributes: [
                { name: 'signal', alias: ['s'], type: 'string', default: 'ping', description: 'The signal string to send' }
            ],
            defaultTargeter: '@Self',
            examples: ['- signal{s=ATTACK} ']
        },
        {
            id: 'globalcooldown',
            name: 'GlobalCooldown',
            aliases: ['gcd', 'setgcd', 'setglobalcooldown'],
            category: 'utility',
            description: 'Sets caster\'s global cooldown. Use with offgcd condition for shared cooldown across multiple skills.',
            attributes: [
                { name: 'ticks', alias: ['t'], type: 'number', default: 20, description: 'Cooldown duration in ticks' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- gcd{ticks=40}',
                '- globalcooldown{t=100}'
            ]
        },
        {
            id: 'stataura',
            name: 'StatAura',
            aliases: ['statbuff', 'statdebuff'],
            category: 'utility',
            description: 'Applies aura that applies stat to target. Buff multiplied by aura stacks. Inherits all aura attributes.',
            attributes: [
                { name: 'auraName', alias: ['n', 'name'], type: 'string', default: '', description: 'Aura identifier' },
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Duration in ticks' },
                { name: 'stat', alias: ['s'], type: 'string', default: '', required: true, description: 'Stat to apply (e.g., CRITICAL_STRIKE_CHANCE)' },
                { name: 'type', alias: ['t', 'modifier', 'mod', 'm'], type: 'string', default: 'ADDITIVE', description: 'Modifier type: ADDITIVE or COMPOUND_MULTIPLIER' },
                { name: 'value', alias: ['val', 'v'], type: 'number', default: 0, description: 'Value for stat' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- stataura{auraName=critbuff;d=100;stat=CRITICAL_STRIKE_CHANCE;type=COMPOUND_MULTIPLIER;val=2} @self',
                '- statbuff{stat=MOVEMENT_SPEED;type=ADDITIVE;val=0.5;d=200} @self'
            ]
        },
        
        // ═══════════════════════════════════════════════════════════
        // EFFECTS MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'particle',
            name: 'Particle',
            aliases: ['particles', 'effect:particles', 'e:particles', 'e:particle', 'e:p'],
            category: 'effects',
            description: 'Creates a particle effect at the targeted entity or location with smart DataType support.',
            hasSmartParticles: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'amount', alias: ['count', 'a'], type: 'number', default: 10, description: 'Number of particles' },
                { name: 'speed', alias: ['s'], type: 'number', default: 0, description: 'Speed of particles' },
                { name: 'hspread', alias: ['hs'], type: 'number', default: 0, description: 'Horizontal spread' },
                { name: 'vspread', alias: ['vs', 'yspread', 'ys'], type: 'number', default: 0, description: 'Vertical spread' },
                { name: 'yoffset', alias: ['y'], type: 'number', default: 0, description: 'Y offset from target' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } },
                { name: 'color2', alias: ['c2', 'toColor'], type: 'color', default: '#00FF00', description: 'End color (dust_color_transition)', showWhen: { requiresDataType: ['DustTransition'] } },
                { name: 'power', alias: ['pow'], type: 'number', default: 1.0, description: 'Spell power', showWhen: { requiresDataType: ['Spell'] } }
            ],
            defaultTargeter: '@Self',
            examples: ['- particle{p=flame;a=200;hs=1;vs=1;s=5}', '- particle{p=dust;color=#FF0000;size=2}', '- particle{p=block;material=STONE}']
        },
        {
            id: 'sound',
            name: 'sound',
            aliases: ['effect:sound', 'e:sound', 'e:s', 's'],
            category: 'effects',
            description: 'Plays a sound from vanilla game or resource pack.',
            attributes: [
                { name: 'sound', alias: ['s'], type: 'string', default: 'entity.zombie.attack_iron_door', required: true, description: 'Sound to play' },
                { name: 'volume', alias: ['v'], type: 'number', default: 1.0, description: 'Volume (above 1 increases range)' },
                { name: 'pitch', alias: ['p'], type: 'number', default: 1.0, description: 'Pitch (0.01 to 2.0)' }
            ],
            defaultTargeter: '@Self',
            examples: ['- sound{s=entity.enderman.scream} ', '- sound{s=entity.generic.explode;v=2;p=0.5} ']
        },
        {
            id: 'potion',
            name: 'potion',
            aliases: [],
            category: 'effects',
            description: 'Applies a potion effect to the target entity.',
            attributes: [
                { name: 'type', alias: ['t', 'effect'], type: 'string', default: 'SLOW', description: 'Potion effect type' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' },
                { name: 'level', alias: ['lvl', 'l'], type: 'number', default: 0, description: 'Effect level (0 = level 1)' },
                { name: 'hasparticles', alias: ['particles', 'p'], type: 'boolean', default: true, description: 'Show effect particles' }
            ],
            defaultTargeter: '@Self',
            examples: ['- potion{type=SLOW;duration=200;level=4}', '- potion{t=SPEED;d=100;l=1;p=false} ']
        },
        {
            id: 'lightning',
            name: 'lightning',
            aliases: [],
            category: 'effects',
            description: 'Causes a lightning strike at the target entity or location.',
            attributes: [
                { name: 'damage', alias: ['d'], type: 'number', default: 0.01337, description: 'Damage dealt by strike' }
            ],
            defaultTargeter: '@Target',
            examples: ['- lightning', '- lightning{d=6} ']
        },
        {
            id: 'fakelightning',
            name: 'fakelightning',
            aliases: ['effect:lightning', 'e:lightning'],
            category: 'effects',
            description: 'Strikes a fake lightning bolt (cosmetic only, no damage).',
            attributes: [],
            defaultTargeter: '@Target',
            examples: ['- fakelightning ', '- fakelightning ']
        },
        {
            id: 'ignite',
            name: 'ignite',
            aliases: [],
            category: 'effects',
            description: 'Sets the targeted entity on fire.',
            attributes: [
                { name: 'ticks', alias: ['t', 'd', 'duration'], type: 'number', default: 60, description: 'How long target burns (ticks)' }
            ],
            defaultTargeter: '@Target',
            examples: ['- ignite{ticks=100}', '- ignite{t=200} ']
        },
        {
            id: 'extinguish',
            name: 'extinguish',
            aliases: ['removefire'],
            category: 'effects',
            description: 'Removes any fire ticks from the target entity.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- extinguish{delay=2}']
        },
        {
            id: 'sendtitle',
            name: 'sendtitle',
            aliases: ['title'],
            category: 'effects',
            description: 'Displays a title and/or subtitle message to targeted players.',
            attributes: [
                { name: 'title', alias: ['t'], type: 'string', default: '', description: 'Title text' },
                { name: 'subtitle', alias: ['st'], type: 'string', default: '', description: 'Subtitle text' },
                { name: 'duration', alias: ['d'], type: 'number', default: 1, description: 'Display duration (ticks)' },
                { name: 'fadein', alias: ['fi'], type: 'number', default: 1, description: 'Fade-in time (ticks)' },
                { name: 'fadeout', alias: ['fo'], type: 'number', default: 1, description: 'Fade-out time (ticks)' }
            ],
            defaultTargeter: '@PlayersInRadius{r=10}',
            examples: ['- sendtitle{title="Beware!";subtitle="Danger ahead";d=20} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // CONTROL MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'stun',
            name: 'stun',
            aliases: [],
            category: 'control',
            description: 'Holds the target in place temporarily.',
            attributes: [
                { name: 'stopai', alias: ['ai'], type: 'boolean', default: false, description: 'Remove AI while stunned' },
                { name: 'gravity', alias: ['g'], type: 'boolean', default: false, description: 'Remove gravity when stunned' },
                { name: 'facing', alias: ['face', 'f'], type: 'boolean', default: false, description: 'Can rotate/look around' },
                { name: 'duration', alias: ['d'], type: 'number', default: 60, description: 'Stun duration (ticks)' }
            ],
            defaultTargeter: '@Target',
            examples: ['- stun{d=60;f=false} ']
        },
        {
            id: 'settarget',
            name: 'settarget',
            aliases: ['target'],
            category: 'control',
            description: 'Sets the mob\'s target to the target entity.',
            attributes: [],
            defaultTargeter: '@Trigger',
            examples: ['- setTarget']
        },
        {
            id: 'rally',
            name: 'rally',
            aliases: ['callforhelp'],
            category: 'control',
            description: 'Rallies nearby mobs of given types to focus-attack the target.',
            attributes: [
                { name: 'types', alias: ['type', 't'], type: 'string', default: '', description: 'Comma-separated mob types to rally' },
                { name: 'radius', alias: ['r', 'hradius', 'hr'], type: 'number', default: 10, description: 'Radius to search for mobs' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- rally{types=Guard,Knight;radius=30;ot=false} ']
        },
        {
            id: 'taunt',
            name: 'taunt',
            aliases: [],
            category: 'control',
            description: 'Modifies the threat level that the caster holds with target entities.',
            attributes: [
                { name: 'mode', alias: ['m'], type: 'string', default: 'taunt', description: 'How threat is assigned' }
            ],
            defaultTargeter: '@EIR{r=20}',
            examples: ['- taunt ']
        },
        {
            id: 'threat',
            name: 'threat',
            aliases: ['threatchange', 'threatmod'],
            category: 'control',
            description: 'Modifies the mob\'s threat value towards the target. Requires threat tables enabled.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount of threat' },
                { name: 'mode', alias: ['m'], type: 'string', default: 'add', description: 'Mode: add, remove, multiply, divide, set, reset, forcetop' }
            ],
            defaultTargeter: '@NearestPlayer',
            examples: ['- threat{amount=10000}']
        },
        
        // ═══════════════════════════════════════════════════════════
        // AURA MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'aura',
            name: 'aura',
            aliases: ['buff', 'debuff'],
            category: 'meta',
            description: 'Acts as a status effect on the target entity, can trigger other skills over its duration. Auras allow you to create custom status effects (buffs/debuffs).',
            attributes: [
                { name: 'auraname', alias: ['aura', 'b', 'buff', 'buffname', 'debuff', 'debuffname', 'n', 'name'], type: 'string', default: 'UUID', description: 'Optional name, required for aura mechanics & conditions' },
                { name: 'auratype', alias: ['auragroup', 'group', 'type', 'g'], type: 'string', default: '', description: 'The type/group of the aura' },
                { name: 'attachmenttype', alias: ['attachment', 'attach'], type: 'string', default: 'NONE', description: 'Attachment to apply (NONE, MODELENGINE)' },
                { name: 'onstartskill', alias: ['onstart', 'os'], type: 'skillref', default: '', description: 'Metaskill executed when aura starts' },
                { name: 'ontickskill', alias: ['ontick', 'ot'], type: 'skillref', default: '', description: 'Metaskill executed every interval' },
                { name: 'onendskill', alias: ['onend', 'oe'], type: 'skillref', default: '', description: 'Metaskill executed when aura ends' },
                { name: 'showbartimer', alias: ['bartimer', 'bt'], type: 'boolean', default: false, description: 'Display boss bar timer for caster' },
                { name: 'bartimerdisplay', alias: ['bartimertext'], type: 'string', default: '', description: 'Boss bar text (if showBarTimer=true)' },
                { name: 'bartimercolor', alias: [], type: 'string', default: 'RED', description: 'Boss bar color' },
                { name: 'bartimerstyle', alias: [], type: 'string', default: 'SOLID', description: 'Boss bar style' },
                { name: 'charges', alias: ['c'], type: 'number', default: 0, description: 'Charges before fade' },
                { name: 'duration', alias: ['ticks', 't', 'd', 'time'], type: 'number', default: 200, description: 'Duration in ticks' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Tick interval for onTick' },
                { name: 'maxstacks', alias: ['ms'], type: 'number', default: 1, description: 'Max times aura stacks on same entity' },
                { name: 'refreshduration', alias: ['rd'], type: 'boolean', default: true, description: 'Refresh duration when reapplied' },
                { name: 'mergesamecaster', alias: ['msc', 'mc'], type: 'boolean', default: false, description: 'Merge auras from same caster' },
                { name: 'mergeall', alias: ['ma'], type: 'boolean', default: false, description: 'Merge all auras of same name' },
                { name: 'overwritesamecaster', alias: ['osc', 'oc'], type: 'boolean', default: false, description: 'Overwrite auras from same caster' },
                { name: 'overwriteall', alias: ['overwrite', 'ow'], type: 'boolean', default: false, description: 'Overwrite all auras of same name' },
                { name: 'cancelongivedamage', alias: ['cogd'], type: 'boolean', default: false, description: 'Cancel if entity deals damage' },
                { name: 'cancelontakedamage', alias: ['cotd'], type: 'boolean', default: false, description: 'Cancel if entity takes damage' },
                { name: 'cancelondeath', alias: ['cod'], type: 'boolean', default: true, description: 'Cancel if entity dies' },
                { name: 'canceloncasterdeath', alias: ['cocd'], type: 'boolean', default: false, description: 'Cancel if caster dies' },
                { name: 'cancelonteleport', alias: ['cot'], type: 'boolean', default: false, description: 'Cancel if entity teleports' },
                { name: 'cancelonchangeworld', alias: ['cocw'], type: 'boolean', default: false, description: 'Cancel if entity changes worlds' },
                { name: 'cancelonskilluse', alias: ['cosu'], type: 'boolean', default: false, description: 'Cancel if entity uses skill' },
                { name: 'cancelonquit', alias: ['coq'], type: 'boolean', default: true, description: 'Cancel if player logs out' },
                { name: 'doendskillonterminate', alias: ['desot', 'alwaysrunendskill', 'ares'], type: 'boolean', default: true, description: 'Run onEnd when removed by auraremove' },
                { name: 'attachmentmodel', alias: ['attachmodel', 'model'], type: 'string', default: '', description: 'ModelEngine model (if attachmentType=MODELENGINE)' },
                { name: 'attachmentstate', alias: ['attachstate', 'state'], type: 'string', default: '', description: 'ModelEngine state' },
                { name: 'attachmentcolor', alias: ['attachcolor'], type: 'color', default: '', description: 'ModelEngine color' },
                { name: 'attachmentscale', alias: ['attachscale'], type: 'number', default: 1, description: 'ModelEngine scale' },
                { name: 'attachmentviewradius', alias: ['attackviewradius'], type: 'number', default: -1, description: 'ModelEngine view radius' },
                { name: 'attachmentenchanted', alias: ['enchanted'], type: 'boolean', default: false, description: 'ModelEngine enchantment glint' },
                { name: 'attachmentglowing', alias: ['glowing'], type: 'boolean', default: false, description: 'ModelEngine glowing' },
                { name: 'attachmentglowcolor', alias: ['attachglowcolor'], type: 'color', default: '', description: 'ModelEngine glow color' },
                { name: 'attachmentculling', alias: ['culling'], type: 'boolean', default: true, description: 'ModelEngine culling enabled' },
                { name: 'attachmentoffset', alias: ['attachoffset'], type: 'string', default: '0,0,0,0,0', description: 'ModelEngine offset (x,y,z,yaw,pitch)' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- aura{auraName=Retributing_Light;onTick=RetributingLightDamage;interval=10;duration=240} @self',
                '- aura{auraName=fire_shield;onTick=ParticleEffect;charges=5;cancelOnDeath=true}'
            ]
        },
        {
            id: 'ondamaged',
            name: 'ondamaged',
            aliases: [],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when target takes damage. Inherits all aura attributes.',
            attributes: [
                { name: 'onhit', alias: ['ondamagedskill', 'ondamaged', 'od', 'onhitskill', 'oh'], type: 'string', default: '', description: 'Metaskill to execute when damaged' },
                { name: 'cancelevent', alias: ['ce', 'canceldamage'], type: 'boolean', default: false, description: 'Cancel damage event' },
                { name: 'damagesub', alias: ['sub', 's'], type: 'number', default: 0, description: 'Static decrease to damage taken' },
                { name: 'damagemultiplier', alias: ['multiplier', 'm'], type: 'number', default: 1, description: 'Damage multiplier' },
                { name: 'damagemodifiers', alias: ['damagemods', 'damagemod'], type: 'string', default: '', description: 'Damage modifiers (e.g., "FIRE 0.5, MAGIC 0.3")' },
                { name: 'deflectprojectiles', alias: ['deflect', 'reflect'], type: 'boolean', default: false, description: 'Deflect projectiles' },
                { name: 'deflectconditions', alias: ['dconditions'], type: 'string', default: '', description: 'Conditions for projectile deflection' },
                { name: 'moddamagetype', alias: ['damagetype'], type: 'string', default: '', description: 'Damage type filter' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onDamaged{auraName=damageResist;d=200;onHit=Effects;m=0.5}',
                '- onDamaged{auraName=fire_shield;onHit=FireShield;duration=200;charges=5;multiplier=0.5} @self'
            ]
        },
        {
            id: 'onattack',
            name: 'onattack',
            aliases: ['onhit'],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when they damage something. Inherits all aura attributes.',
            attributes: [
                { name: 'onattackskill', alias: ['onattack', 'oa', 'onmelee', 'onhitskill', 'onhit', 'oh'], type: 'string', default: '', description: 'Metaskill to execute on attack' },
                { name: 'cancelevent', alias: ['ce', 'canceldamage', 'cd'], type: 'boolean', default: false, description: 'Cancel attack event' },
                { name: 'damageadd', alias: ['add', 'a'], type: 'number', default: 0, description: 'Static increase to damage dealt' },
                { name: 'damagemultiplier', alias: ['multiplier', 'm'], type: 'number', default: 1, description: 'Damage multiplier' },
                { name: 'moddamagetype', alias: ['damagetype'], type: 'string', default: '', description: 'Damage type to inflict' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onAttack{oH=SuperPunch;cE=true;auraname=MyAura}',
                '- onAttack{auraName=fiery_strikes;onHit=FireStrike;duration=200;charges=5;multiplier=2} @self'
            ]
        },
        
        // ═══════════════════════════════════════════════════════════
        // PROJECTILE MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'projectile',
            name: 'projectile',
            aliases: ['p'],
            category: 'projectile',
            description: 'Fires a meta-projectile that can be decorated with particle/sound effects. Has the most attributes of any mechanic. Other mechanics (Missile, Totem, Orbital) inherit from this. Type can be NORMAL or METEOR.',
            // ATTRIBUTE GROUPS for better organization
            attributeGroups: [
                { id: 'skills', name: '🎯 Skill Events', description: 'Metaskills triggered at different projectile events', collapsed: false },
                { id: 'core', name: '⚙️ Core Settings', description: 'Basic projectile behavior settings', collapsed: false },
                { id: 'position', name: '📍 Position & Offsets', description: 'Starting position and targeting offsets', collapsed: true },
                { id: 'accuracy', name: '🎯 Accuracy & Noise', description: 'Projectile accuracy and randomness settings', collapsed: true },
                { id: 'collision', name: '💥 Collision & Hitting', description: 'What the projectile can hit and collision behavior', collapsed: true },
                { id: 'physics', name: '🌍 Physics & Movement', description: 'Gravity, bouncing, and surface hugging', collapsed: true },
                { id: 'bullet_core', name: '🔫 Bullet Type', description: 'Visual representation of the projectile', collapsed: false },
                { id: 'bullet_arrow', name: '🏹 Arrow Bullet', description: 'Arrow-specific attributes', collapsed: true, showWhen: { attr: 'BulletType', value: 'ARROW' } },
                { id: 'bullet_block', name: '🧱 Block Bullet', description: 'Block-specific attributes', collapsed: true, showWhen: { attr: 'BulletType', values: ['BLOCK', 'SMALLBLOCK'] } },
                { id: 'bullet_item', name: '📦 Item Bullet', description: 'Item-specific attributes', collapsed: true, showWhen: { attr: 'BulletType', value: 'ITEM' } },
                { id: 'bullet_mob', name: '👾 Mob Bullet', description: 'Mob-specific attributes', collapsed: true, showWhen: { attr: 'BulletType', value: 'MOB' } },
                { id: 'bullet_tracking', name: '🎯 Tracking Bullet', description: 'Tracking armor stand attributes', collapsed: true, showWhen: { attr: 'BulletType', values: ['TRACKING', 'REALTRACKING'] } },
                { id: 'bullet_display', name: '🖥️ Display Bullet', description: 'Display entity attributes', collapsed: true, showWhen: { attr: 'BulletType', value: 'DISPLAY' } },
                { id: 'bullet_me', name: '🎨 ModelEngine Bullet', description: 'ModelEngine model attributes', collapsed: true, showWhen: { attr: 'BulletType', value: 'ME' } },
                { id: 'bullet_text', name: '📝 Text Bullet', description: 'Text display attributes', collapsed: true, showWhen: { attr: 'BulletType', value: 'TEXT' } },
                { id: 'advanced', name: '🔧 Advanced', description: 'Advanced and debugging options', collapsed: true }
            ],
            attributes: [
                // ═══ SKILL EVENTS GROUP ═══
                { name: 'onStartSkill', alias: ['onStart', 'oS'], type: 'skillref', default: '', description: 'Metaskill executed when projectile starts at origin', group: 'skills' },
                { name: 'onTickSkill', alias: ['onTick', 'oT', 'm', 'meta', 's', 'skill'], type: 'skillref', default: '', description: 'Metaskill executed every [interval] ticks at origin', group: 'skills' },
                { name: 'onHitSkill', alias: ['onHit', 'oH'], type: 'skillref', default: '', description: 'Metaskill executed when hitting entities. Targets inherited.', group: 'skills' },
                { name: 'onEndSkill', alias: ['onEnd', 'oE'], type: 'skillref', default: '', description: 'Metaskill executed when projectile ends', group: 'skills' },
                { name: 'onBounceSkill', alias: ['onBounce'], type: 'skillref', default: '', description: 'Metaskill executed on bounce (Premium)', group: 'skills' },
                { name: 'onHitBlockSkill', alias: ['onHitBlock', 'ohb'], type: 'skillref', default: '', description: 'Metaskill executed when hitting a block', group: 'skills' },
                { name: 'onInteractSkill', alias: ['onInteract'], type: 'skillref', default: '', description: 'Metaskill executed when projectile is interacted with', group: 'skills' },
                
                // ═══ CORE SETTINGS GROUP ═══
                { name: 'Type', alias: [], type: 'select', default: 'NORMAL', description: 'Projectile spawn behavior', group: 'core',
                    options: [
                        { value: 'NORMAL', label: 'Normal (from caster)' },
                        { value: 'METEOR', label: 'Meteor (from sky)' }
                    ]
                },
                { name: 'Interval', alias: ['int', 'i'], type: 'number', default: 1, description: 'How often projectile updates position (ticks)', group: 'core' },
                { name: 'Duration', alias: ['maxDuration', 'md', 'd'], type: 'number', default: 400, description: 'Max duration projectile persists (ticks)', group: 'core' },
                { name: 'MaxRange', alias: ['mr'], type: 'number', default: 40, description: 'Max range projectile travels (blocks)', group: 'core' },
                { name: 'Velocity', alias: ['v'], type: 'number', default: 5, description: 'Projectile velocity (blocks/second)', group: 'core' },
                { name: 'DeathDelay', alias: ['death', 'dd'], type: 'number', default: 2, description: 'Delay before removing bullet on termination', group: 'core' },
                
                // ═══ POSITION & OFFSETS GROUP ═══
                { name: 'StartYOffset', alias: ['syo'], type: 'number', default: 1, description: 'Y offset from caster spawn point', group: 'position' },
                { name: 'StartFOffset', alias: ['forwardoffset', 'sfo'], type: 'number', default: 1, description: 'Forward offset from caster', group: 'position' },
                { name: 'TargetYOffset', alias: ['tyo', 'targety'], type: 'number', default: 0, description: 'Y offset on target', group: 'position' },
                { name: 'SideOffset', alias: ['soffset', 'so'], type: 'number', default: 0, description: 'Inherited by Start/EndSideOffset', group: 'position' },
                { name: 'StartSideOffset', alias: ['ssoffset', 'sso'], type: 'number', default: 0, description: 'Side offset from caster (uses SideOffset if not set)', group: 'position' },
                { name: 'EndSideOffset', alias: ['endoffset', 'esoffset', 'eso'], type: 'number', default: 0, description: 'Side offset at target (uses SideOffset if not set)', group: 'position' },
                { name: 'startingdirection', alias: ['startingdir', 'startdir', 'sdir'], type: 'string', default: '@Targeted', description: 'Start direction of projectile', group: 'position' },
                { name: 'HorizontalOffset', alias: ['hO'], type: 'number', default: 0, description: 'Rotates horizontal starting velocity 360° axis', group: 'position' },
                { name: 'VerticalOffset', alias: ['vO'], type: 'number', default: 0, description: 'Adds slope to starting direction', group: 'position' },
                { name: 'fromorigin', alias: ['fo'], type: 'boolean', default: false, description: 'Start from origin of mechanic', group: 'position' },
                
                // ═══ ACCURACY & NOISE GROUP ═══
                { name: 'Accuracy', alias: ['ac', 'a'], type: 'number', default: 1, description: 'Projectile accuracy (1=perfect)', group: 'accuracy' },
                { name: 'HorizontalNoise', alias: ['hn'], type: 'number', default: 0, description: 'Horizontal randomness (default: (1-ac)*45)', group: 'accuracy' },
                { name: 'VerticalNoise', alias: ['vn'], type: 'number', default: 0, description: 'Vertical randomness (default: (1-ac)*4.5)', group: 'accuracy' },
                
                // ═══ COLLISION & HITTING GROUP ═══
                { name: 'HorizontalRadius', alias: ['hRadius', 'hR', 'r'], type: 'number', default: 1.25, description: 'Horizontal hit detection radius', group: 'collision' },
                { name: 'VerticalRadius', alias: ['vRadius', 'vR'], type: 'number', default: 1.25, description: 'Vertical hit detection radius', group: 'collision' },
                { name: 'StopAtEntity', alias: ['sE'], type: 'boolean', default: true, description: 'Stop upon hitting targetable entity', group: 'collision' },
                { name: 'StopAtBlock', alias: ['sB'], type: 'boolean', default: true, description: 'Stop upon hitting opaque block', group: 'collision' },
                { name: 'HitSelf', alias: [], type: 'boolean', default: false, description: 'Can hit caster', group: 'collision' },
                { name: 'HitPlayers', alias: ['hp'], type: 'boolean', default: true, description: 'Can hit players', group: 'collision' },
                { name: 'HitNonPlayers', alias: ['hnp'], type: 'boolean', default: false, description: 'Can hit non-player entities', group: 'collision' },
                { name: 'HitTarget', alias: ['ht'], type: 'boolean', default: true, description: 'Can hit mechanic target', group: 'collision' },
                { name: 'HitTargetOnly', alias: ['hto'], type: 'boolean', default: false, description: 'Can only hit mechanic target', group: 'collision' },
                { name: 'ImmuneDelay', alias: ['immune', 'id'], type: 'number', default: 2000, description: 'Hit immunity delay (ms)', group: 'collision' },
                { name: 'hitConditions', alias: ['conditions', 'cond', 'c'], type: 'string', default: '', description: 'Inline conditions for hit detection (Premium)', group: 'collision' },
                { name: 'stopconditions', alias: ['stpcond'], type: 'string', default: '', description: 'Conditions to stop projectile on hit', group: 'collision' },
                { name: 'doEndSkillOnHit', alias: ['esoh'], type: 'boolean', default: true, description: 'Run onEnd when ending by hitting entity', group: 'collision' },
                { name: 'hitTargeter', alias: ['htr'], type: 'string', default: '', description: 'Entity targeter for hit targeting', group: 'collision' },
                
                // ═══ PHYSICS & MOVEMENT GROUP ═══
                { name: 'gravity', alias: ['g'], type: 'number', default: 0, description: 'Gravity (use fractions 0.1-0.2 for low gravity)', group: 'physics' },
                { name: 'Bounces', alias: ['bounce'], type: 'boolean', default: false, description: 'Should projectile bounce (Premium)', group: 'physics' },
                { name: 'BounceVelocity', alias: ['bv'], type: 'number', default: 0.9, description: 'Velocity multiplier on bounce (Premium)', group: 'physics' },
                { name: 'HugSurface', alias: ['hs'], type: 'boolean', default: false, description: 'Move along ground', group: 'physics' },
                { name: 'HugLiquid', alias: ['hugwater', 'huglava'], type: 'boolean', default: false, description: 'Move on liquids when hugSurface=true', group: 'physics' },
                { name: 'HeightFromSurface', alias: ['hfs'], type: 'number', default: 0.5, description: 'Height above surface when hugging', group: 'physics' },
                { name: 'MaxClimbHeight', alias: ['mch'], type: 'number', default: 3, description: 'Max climb height attempts when hugging', group: 'physics' },
                { name: 'MaxDropHeight', alias: ['mdh'], type: 'number', default: 10, description: 'Max drop height attempts when hugging', group: 'physics' },
                { name: 'PowerAffectsRange', alias: ['par'], type: 'boolean', default: true, description: 'Mob power affects range', group: 'physics' },
                { name: 'PowerAffectsVelocity', alias: ['pav'], type: 'boolean', default: true, description: 'Mob power affects velocity', group: 'physics' },
                
                // ═══ BULLET TYPE GROUP ═══
                { name: 'BulletType', alias: ['bullet', 'b'], type: 'select', default: '', description: 'Bullet type determines visual representation', group: 'bullet_core',
                    options: [
                        { value: '', label: '🚫 None (Invisible)' },
                        { value: 'ARROW', label: '🏹 Arrow' },
                        { value: 'BLOCK', label: '🧱 Block' },
                        { value: 'SMALLBLOCK', label: '🔳 Small Block' },
                        { value: 'ITEM', label: '📦 Item/MythicItem' },
                        { value: 'MOB', label: '👾 Mob' },
                        { value: 'TRACKING', label: '🎯 Tracking (Armor Stand)' },
                        { value: 'REALTRACKING', label: '🎯 Real Tracking' },
                        { value: 'DISPLAY', label: '🖥️ Display Entity' },
                        { value: 'ME', label: '🎨 ME (ModelEngine)' },
                        { value: 'TEXT', label: '📝 Text' }
                    ]
                },
                { name: 'bulletforwardoffset', alias: ['bulletfo', 'bulletoffset', 'bfo'], type: 'number', default: 1.8, description: 'Bullet forward offset', group: 'bullet_core' },
                { name: 'bulletYOffset', alias: ['byo'], type: 'number', default: 0, description: 'Bullet Y offset', group: 'bullet_core' },
                
                // ═══ ARROW BULLET GROUP ═══
                { name: 'arrowtype', alias: ['bulletarrowtype'], type: 'select', default: 'NORMAL', description: 'Arrow type', group: 'bullet_arrow',
                    options: [
                        { value: 'NORMAL', label: 'Normal Arrow' },
                        { value: 'SPECTRAL', label: 'Spectral Arrow' },
                        { value: 'TRIDENT', label: 'Trident' }
                    ]
                },
                
                // ═══ BLOCK BULLET GROUP ═══
                { name: 'bulletmaterial', alias: ['material', 'mat'], type: 'string', default: 'STONE', description: 'Bullet material (block/item type or MythicItem)', group: 'bullet_block' },
                { name: 'bulletspin', alias: ['bspin'], type: 'number', default: 0, description: 'Bullet spin rotation', group: 'bullet_block' },
                { name: 'audience', alias: [], type: 'string', default: 'world', description: 'Bullet audience visibility', group: 'bullet_block' },
                
                // ═══ ITEM BULLET GROUP ═══
                { name: 'bulletModel', alias: ['model'], type: 'number', default: 0, description: 'CustomModelData integer (or define on MythicItem)', group: 'bullet_item' },
                { name: 'bulletColor', alias: [], type: 'string', default: '', description: 'Bullet color if applicable', group: 'bullet_item' },
                { name: 'bulletmatchdirection', alias: ['bmd', 'bulletsmall'], type: 'boolean', default: false, description: 'Bullet faces projectile direction', group: 'bullet_item' },
                { name: 'bulletEnchanted', alias: ['enchanted'], type: 'boolean', default: false, description: 'Bullet has enchanted glint', group: 'bullet_item' },
                
                // ═══ MOB BULLET GROUP ═══
                { name: 'mob', alias: ['mobType', 'mm'], type: 'string', default: 'SkeletalKnight', description: 'Mob type for bullet', group: 'bullet_mob' },
                { name: 'bulletKillable', alias: ['bk'], type: 'boolean', default: false, description: 'Allow entities to damage bullet', group: 'bullet_mob' },
                { name: 'bulletForwardOffset', alias: ['bfo'], type: 'number', default: 1.35, description: 'Mob bullet forward offset', group: 'bullet_mob' },
                
                // ═══ TRACKING BULLET GROUP ═══
                { name: 'pitch', alias: [], type: 'number', default: 0, description: 'Pitch rotation (radians)', group: 'bullet_tracking' },
                { name: 'yaw', alias: [], type: 'number', default: 0, description: 'Yaw rotation (radians)', group: 'bullet_tracking' },
                { name: 'roll', alias: [], type: 'number', default: 0, description: 'Roll rotation (radians)', group: 'bullet_tracking' },
                { name: 'rotation', alias: ['rot'], type: 'string', default: '0,0,0', description: 'Rotation in x,y,z format (radians)', group: 'bullet_tracking' },
                { name: 'pitchspeed', alias: ['ps'], type: 'number', default: 0, description: 'Pitch rotation speed', group: 'bullet_tracking' },
                { name: 'yawspeed', alias: ['ys'], type: 'number', default: 0, description: 'Yaw rotation speed', group: 'bullet_tracking' },
                { name: 'rollspeed', alias: ['rs'], type: 'number', default: 0, description: 'Roll rotation speed', group: 'bullet_tracking' },
                { name: 'rotationspeed', alias: ['rotspeed', 'rots'], type: 'string', default: '0,0,0', description: 'Rotation speed in x,y,z format', group: 'bullet_tracking' },
                
                // ═══ DISPLAY BULLET GROUP ═══
                { name: 'bulletscale', alias: ['scale'], type: 'string', default: '0.5,0.5,0.5', description: 'Bullet scale in x,y,z format', group: 'bullet_display' },
                { name: 'bulletyoffset', alias: ['byoffset'], type: 'number', default: 0.2, description: 'Display bullet Y offset', group: 'bullet_display' },
                { name: 'bulletBillboarding', alias: ['bulletBillboard'], type: 'string', default: 'FIXED', description: 'Billboard type for display bullet', group: 'bullet_display' },
                { name: 'bulletbrightness', alias: ['bulletbrightnessblock'], type: 'number', default: -1, description: 'Bullet brightness', group: 'bullet_display' },
                { name: 'bulletbrightnesssky', alias: [], type: 'number', default: -1, description: 'Bullet sky light brightness', group: 'bullet_display' },
                { name: 'bulletCullingDistance', alias: ['bulletViewDistance', 'bulletViewRange'], type: 'number', default: 50, description: 'Visibility range', group: 'bullet_display' },
                { name: 'bulletCullingHeight', alias: ['cullHeight'], type: 'number', default: 0, description: 'Display culling height', group: 'bullet_display' },
                { name: 'bulletCullingWidth', alias: ['cullWidth'], type: 'number', default: 0, description: 'Display culling width', group: 'bullet_display' },
                { name: 'tx', alias: [], type: 'number', default: 0, description: 'Translation on X axis', group: 'bullet_display' },
                { name: 'ty', alias: [], type: 'number', default: 0, description: 'Translation on Y axis', group: 'bullet_display' },
                { name: 'tz', alias: [], type: 'number', default: 0, description: 'Translation on Z axis', group: 'bullet_display' },
                { name: 'translation', alias: ['pos', 'offset'], type: 'string', default: '0,0,0', description: 'Translations in x,y,z format', group: 'bullet_display' },
                { name: 'hideFirstTick', alias: ['hft'], type: 'boolean', default: false, description: 'Hide item on first tick', group: 'bullet_display' },
                { name: 'bulletgen', alias: ['generation', 'bulletgeneration'], type: 'string', default: '', description: 'MythicCrucible generation option', group: 'bullet_display' },
                
                // ═══ MODELENGINE BULLET GROUP ═══
                { name: 'bulletstate', alias: ['state'], type: 'string', default: '', description: 'MEG model state to play', group: 'bullet_me' },
                { name: 'bulletcolor', alias: [], type: 'string', default: '', description: 'Tint of bullet model', group: 'bullet_me' },
                { name: 'bulletGlowing', alias: ['glowing'], type: 'boolean', default: false, description: 'Bullet model glowing', group: 'bullet_me' },
                { name: 'bulletglowcolor', alias: [], type: 'string', default: '', description: 'Glow color if bulletGlowing=true', group: 'bullet_me' },
                { name: 'bulletCulling', alias: ['culling'], type: 'boolean', default: true, description: 'Apply culling to bullet model', group: 'bullet_me' },
                { name: 'bulletViewRadius', alias: [], type: 'number', default: -1, description: 'View distance for bullet (if >0)', group: 'bullet_me' },
                
                // ═══ TEXT BULLET GROUP ═══
                { name: 'bulletText', alias: ['text'], type: 'string', default: '*', description: 'Text to display', group: 'bullet_text' },
                { name: 'bulletBillboard', alias: ['billboard'], type: 'string', default: 'CENTER', description: 'Billboard type for text', group: 'bullet_text' },
                { name: 'forcedBulletRotation', alias: ['forcedRotation'], type: 'string', default: '', description: 'Forced rotation (pitch,yaw,roll format)', group: 'bullet_text' },
                { name: 'bulletRotatesBasedOnDirection', alias: [], type: 'boolean', default: false, description: 'Text rotates with movement', group: 'bullet_text' },
                { name: 'backgroundcolor', alias: ['color'], type: 'string', default: '64,0,0,0', description: 'Background color (ARGB format)', group: 'bullet_text' },
                { name: 'bulletBrightness', alias: ['bulletBrightnessBlock'], type: 'number', default: -1, description: 'Text bullet brightness', group: 'bullet_text' },
                { name: 'bulletBrightnessSky', alias: [], type: 'number', default: -1, description: 'Text bullet sky brightness', group: 'bullet_text' },
                
                // ═══ ADVANCED GROUP ═══
                { name: 'Interactable', alias: [], type: 'boolean', default: false, description: 'Projectile is interactable', group: 'advanced' },
                { name: 'requireLineOfSight', alias: ['rlos', 'los', 'requirelos'], type: 'string', default: 'PLAYERS_ONLY', description: 'Require line-of-sight (true/false/PLAYERS_ONLY)', group: 'advanced' },
                { name: 'highAccuracyMode', alias: ['ham'], type: 'string', default: 'PLAYERS_ONLY', description: 'High accuracy raytracing (true/false/PLAYERS_ONLY)', group: 'advanced' },
                { name: 'drawHitbox', alias: [], type: 'boolean', default: false, description: 'Draw hitbox for debugging', group: 'advanced' },
                { name: 'tickinterpolation', alias: ['interpolation', 'ti'], type: 'number', default: 0, description: 'Additional interpolated points between ticks', group: 'advanced' },
                { name: 'shareSubHitboxCooldown', alias: ['shcd'], type: 'boolean', default: true, description: 'All sub-hitboxes share immune delay', group: 'advanced' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- projectile{oT=Tick;oH=Hit;v=8;i=1;hR=1;vR=1;hnp=true}',
                '- projectile{bulletType=ARROW;arrowType=TRIDENT;v=10;d=200}',
                '- projectile{bulletType=BLOCK;material=STONE;bulletspin=5}',
                '- projectile{bulletType=ITEM;material=DIAMOND;bulletEnchanted=true}',
                '- projectile{bulletType=MOB;mob=SkeletonKing;bulletKillable=false}',
                '- projectile{bulletType=DISPLAY;bulletscale=1,1,1;bulletBillboarding=CENTER}',
                '- projectile{bulletType=TEXT;bulletText=BOOM;backgroundcolor=255,255,0,0}',
                '- projectile{Type=METEOR;gravity=0.1;HeightFromSurface=20}',
                '- projectile{onTick=Particles;onHit=Explosion;Bounces=true;BounceVelocity=0.8}',
                '- projectile{HugSurface=true;HugLiquid=true;HeightFromSurface=1}',
                '- projectile{hitConditions=[ - isMonster true - isFrozen false ]}'
            ]
        },
        {
            id: 'missile',
            name: 'missile',
            aliases: ['mi'],
            category: 'meta',
            description: 'Homing projectile that tracks targets. Inherits ALL projectile attributes including BulletType, offsets, hit detection, and all bullet-specific attributes (ARROW, BLOCK, ITEM, MOB, TRACKING, DISPLAY, ME, TEXT).',
            attributes: [
                { name: 'inertia', alias: ['in', 'intertia'], type: 'number', default: 1.5, description: 'Turning rate (lower = faster turns)' },
                { name: 'ontickskill', alias: ['ontick', 'ot'], type: 'string', default: '', description: 'Metaskill executed each tick' },
                { name: 'onhitskill', alias: ['onhit', 'oh'], type: 'string', default: '', description: 'Metaskill executed on hit' },
                { name: 'onendskill', alias: ['onend', 'oe'], type: 'string', default: '', description: 'Metaskill executed when missile ends' },
                { name: 'onstartskill', alias: ['onstart', 'os'], type: 'string', default: '', description: 'Metaskill executed when missile starts' },
                { name: 'velocity', alias: ['v'], type: 'number', default: 5, description: 'Velocity (blocks/second)' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Update interval (ticks)' },
                { name: 'bounces', alias: ['bounce'], type: 'boolean', default: false, description: 'Should projectile bounce (Premium)' },
                { name: 'bouncevelocity', alias: ['bv'], type: 'number', default: 0.9, description: 'Velocity multiplier on bounce (Premium)' },
                { name: 'startwithparentvelocity', alias: ['swpv', 'spv'], type: 'boolean', default: false, description: 'Start with parent projectile velocity' },
                { name: 'hugsurface', alias: ['hs'], type: 'boolean', default: false, description: 'Move along ground' },
                { name: 'hugliquid', alias: ['hugwater', 'huglava'], type: 'boolean', default: false, description: 'Move on liquids when hugging' },
                { name: 'heightfromsurface', alias: ['hfs'], type: 'number', default: 0.5, description: 'Height above surface when hugging' },
                { name: 'maxclimbheight', alias: ['mch'], type: 'number', default: 3, description: 'Max climb height when hugging' },
                { name: 'maxdropheight', alias: ['mdh'], type: 'number', default: 10, description: 'Max drop height when hugging' },
                { name: 'highaccuracymode', alias: ['ham'], type: 'string', default: 'PLAYERS_ONLY', description: 'High accuracy mode (true/false/PLAYERS_ONLY)' },
                { name: 'hitnonplayers', alias: ['hnp'], type: 'boolean', default: true, description: 'Hit non-player entities' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- missile{ot=Tick;oh=Hit;v=4;i=1;in=0.75}',
                '- missile{ot=Homer_TICK;oh=Homer_HIT;v=4;i=1;hR=1;vR=1;in=0.75}'
            ]
        },
        {
            id: 'shoot',
            name: 'shoot',
            aliases: ['shootprojectile'],
            category: 'meta',
            description: 'Shoots a projectile from the caster with multi-skill support. Inherits damage mechanic attributes.',
            attributes: [
                { name: 'type', alias: ['t'], type: 'string', default: 'arrow', description: 'Projectile type (arrow, trident, splash_potion, etc)' },
                { name: 'damage', alias: ['d', 'amount'], type: 'number', default: 5, description: 'Damage dealt by projectile' },
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Projectile velocity multiplier' },
                { name: 'onTickSkill', alias: ['onTick', 'ot'], type: 'string', default: '', description: 'Metaskill to execute each tick' },
                { name: 'onHitSkill', alias: ['onHit', 'oh'], type: 'string', default: '', description: 'Metaskill to execute on hit' },
                { name: 'onEndSkill', alias: ['onEnd', 'oe'], type: 'string', default: '', description: 'Metaskill to execute when projectile ends' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Tick interval for onTick skill' },
                { name: 'bounce', alias: ['b'], type: 'boolean', default: false, description: 'Can projectile bounce' },
                { name: 'pickup', alias: ['pu'], type: 'boolean', default: false, description: 'Can players pick up projectile' },
                { name: 'expiration', alias: ['exp', 'e'], type: 'number', default: 0, description: 'Ticks until projectile expires' },
                { name: 'accuracy', alias: ['ac'], type: 'number', default: 0, description: 'Accuracy spread (0=perfect)' },
                { name: 'knockback', alias: ['kb'], type: 'number', default: 0, description: 'Knockback amount' },
                { name: 'pierceLevel', alias: ['pierce', 'pl'], type: 'number', default: 0, description: 'Number of entities to pierce' },
                { name: 'verticalOffset', alias: ['vo', 'yoffset'], type: 'number', default: 0, description: 'Vertical spawn offset' },
                { name: 'horizontalOffset', alias: ['ho', 'hOffset'], type: 'number', default: 0, description: 'Horizontal spawn offset' },
                { name: 'forwardOffset', alias: ['fo', 'fOffset'], type: 'number', default: 0, description: 'Forward spawn offset' },
                { name: 'sideOffset', alias: ['so', 'sOffset'], type: 'number', default: 0, description: 'Side spawn offset' },
                { name: 'startSideOffset', alias: ['sso'], type: 'number', default: 0, description: 'Starting side offset' },
                { name: 'startYOffset', alias: ['syo'], type: 'number', default: 0, description: 'Starting Y offset' },
                { name: 'gravity', alias: ['g'], type: 'boolean', default: true, description: 'Projectile affected by gravity' },
                { name: 'adjustVelocity', alias: ['av'], type: 'boolean', default: false, description: 'Adjust velocity toward target' },
                { name: 'calculateFiringAngle', alias: ['cfa'], type: 'boolean', default: false, description: 'Calculate arc angle' },
                { name: 'verticalNoise', alias: ['vn'], type: 'number', default: 0, description: 'Vertical randomness' },
                { name: 'horizontalNoise', alias: ['hn'], type: 'number', default: 0, description: 'Horizontal randomness' },
                { name: 'fromOrigin', alias: ['fo'], type: 'boolean', default: false, description: 'Shoot from origin location' },
                { name: 'potionType', alias: ['pt', 'potion'], type: 'string', default: '', description: 'Potion effect type (for splash potions)' },
                { name: 'potionDuration', alias: ['pd'], type: 'number', default: 100, description: 'Potion effect duration (ticks)' },
                { name: 'potionLevel', alias: ['pl', 'level'], type: 'number', default: 1, description: 'Potion effect level' },
                { name: 'force', alias: ['f'], type: 'boolean', default: false, description: 'Force potion effect' },
                { name: 'potionColor', alias: ['pc', 'color'], type: 'string', default: '', description: 'Potion color (hex)' },
                { name: 'hasParticles', alias: ['particles'], type: 'boolean', default: true, description: 'Show potion particles' },
                { name: 'hasIcon', alias: ['icon'], type: 'boolean', default: true, description: 'Show potion icon' },
                { name: 'ambientParticles', alias: ['ambient', 'ap'], type: 'boolean', default: false, description: 'Ambient potion particles' },
                { name: 'tridentItem', alias: ['ti'], type: 'string', default: '', description: 'Custom trident item' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- shoot{type=ARROW;velocity=5;damage=10}',
                '- shoot{t=arrow;v=4;onTick=Particles;onHit=Explosion;interval=2}',
                '- shoot{type=splash_potion;potionType=poison;potionDuration=200;potionLevel=2}',
                '- shoot{t=trident;d=15;v=3;pierceLevel=3;expiration=200}'
            ]
        },
        {
            id: 'shootfireball',
            name: 'shootfireball',
            aliases: ['fireball'],
            category: 'projectile',
            description: 'Shoots a fireball from the mob towards the target.',
            attributes: [
                { name: 'yield', alias: ['strength', 'y', 's'], type: 'number', default: 1, description: 'Explosion yield' },
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Fireball velocity' },
                { name: 'incendiary', alias: ['i'], type: 'boolean', default: false, description: 'Leaves fire behind' }
            ],
            defaultTargeter: '@Target',
            examples: ['- shootfireball{y=1;v=4} ']
        },
        {
            id: 'volley',
            name: 'volley',
            aliases: [],
            category: 'meta',
            description: 'Launches multiple projectiles in a spread pattern.',
            attributes: [
                { name: 'type', alias: ['t'], type: 'string', default: 'arrow', description: 'Projectile type' },
                { name: 'amount', alias: ['a'], type: 'number', default: 5, description: 'Number of projectiles' },
                { name: 'spread', alias: ['s'], type: 'number', default: 30, description: 'Horizontal spread in degrees' }
            ],
            defaultTargeter: '@Target',
            examples: ['- volley{type=arrow;amount=9;spread=45}']
        },
        {
            id: 'beam',
            name: 'beam',
            aliases: [],
            category: 'meta',
            description: 'Creates a beam of material between the caster and the target that executes skills.',
            attributes: [
                { name: 'onhitskill', alias: ['onhit', 'oh'], type: 'string', default: '', description: 'Metaskill when beam hits entity (not yet supported)' },
                { name: 'ontickskill', alias: ['ontick', 'ot'], type: 'string', default: '', description: 'Metaskill executed each tick' },
                { name: 'duration', alias: ['d'], type: 'number', default: 20, description: 'Duration in ticks' },
                { name: 'tickinterval', alias: ['interval', 'i'], type: 'number', default: 1, description: 'Tick interval' },
                { name: 'material', alias: ['m'], type: 'materialSelect', default: 'END_ROD', description: 'Material of the beam' },
                { name: 'rotationspeed', alias: ['rs'], type: 'number', default: 0, description: 'Rotation speed (degrees/tick)' },
                { name: 'hitradius', alias: ['radius', 'r'], type: 'number', default: 1.0, description: 'Hit radius of beam' },
                { name: 'startyoffset', alias: ['syo'], type: 'number', default: 0, description: 'Starting Y offset from caster' },
                { name: 'endyoffset', alias: ['eyo'], type: 'number', default: 0, description: 'End Y offset from target' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- beam{d=100;rs=2;syo=100} @selflocation',
                '- beam{ontick=BeamTick;duration=60;material=LIGHTNING_ROD;rotationspeed=5}'
            ]
        },
        {
            id: 'chainmissile',
            name: 'chainmissile',
            aliases: ['cmi'],
            category: 'meta',
            description: 'Shoots a chaining homing missile at the target. Premium-Only mechanic! Inherits all Missile attributes.',
            attributes: [
                { name: 'bounces', alias: ['b'], type: 'number', default: 2, description: 'How many times the chain bounces' },
                { name: 'bounceradius', alias: ['bouncerange', 'radius', 'range', 'r'], type: 'number', default: 5, description: 'Bounce range to next target' },
                { name: 'returntocaster', alias: ['return', 'rtc'], type: 'boolean', default: false, description: 'Missile returns to caster' },
                { name: 'bounceconditions', alias: ['conditions', 'cond', 'c'], type: 'string', default: '', description: 'Conditions for bounce target' },
                { name: 'inertia', alias: ['in'], type: 'number', default: 1.5, description: 'Turning rate (lower = faster)' },
                { name: 'ontickskill', alias: ['ontick', 'ot'], type: 'string', default: '', description: 'Metaskill each tick' },
                { name: 'onhitskill', alias: ['onhit', 'oh'], type: 'string', default: '', description: 'Metaskill on hit' },
                { name: 'velocity', alias: ['v'], type: 'number', default: 5, description: 'Velocity' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Update interval' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- chainmissile{bounces=10;r=10;in=1.25;oT=CM_oT;oH=CM_oH;i=1;v=5;hnp=true}',
                '- chainmissile{bounces=5;bounceRadius=8;returnToCaster=true;onTick=ParticleTrail;onHit=Explosion}'
            ]
        },
        {
            id: 'onshoot',
            name: 'onshoot',
            aliases: ['onbowshoot'],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when they shoot with a bow. Inherits all aura attributes.',
            attributes: [
                { name: 'onshootskill', alias: ['onshoot', 'osh', 'onbowshoot', 'onbowshootskill'], type: 'string', default: '', description: 'Metaskill to execute when shooting' },
                { name: 'cancelevent', alias: ['ce'], type: 'boolean', default: false, description: 'Cancel bow shot event' },
                { name: 'forceaspower', alias: ['fap'], type: 'boolean', default: true, description: 'Pass bow force as skill power' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onShoot{auraName=fireball_bow;onShoot=[shootfireball];duration=200;charges=5;cancelEvent=true} @self',
                '- onShoot{onShoot=CustomArrow;d=300;cancelEvent=false}'
            ]
        },
        {
            id: 'onblockbreak',
            name: 'onblockbreak',
            aliases: ['onbreakblock'],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when they break a block. Inherits all aura attributes.',
            attributes: [
                { name: 'onbreakskill', alias: ['onbreak', 'ob'], type: 'string', default: '', description: 'Metaskill to execute when breaking block' },
                { name: 'cancelevent', alias: ['cancel', 'ce'], type: 'boolean', default: false, description: 'Cancel block break event' },
                { name: 'dropitem', alias: ['drop', 'allowdrop'], type: 'boolean', default: true, description: 'Whether broken item drops' },
                { name: 'blocktypes', alias: ['bt', 't', 'material', 'materials', 'm', 'blocks', 'block', 'b'], type: 'string', default: '', description: 'Block types that trigger (use * prefix for tags)' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onBlockBreak{oB=FlameParticlesAtBlock;cE=false;auraname=Fire;d=300;i=1} @self',
                '- onBlockBreak{onBreak=AreaMining;blockTypes=STONE,COBBLESTONE;duration=200}',
                '- onBlockBreak{d=99999;bt=#TORCH,#LIGHT;oB=[addVar{var=caster.lightsBroken;a=1}]}'
            ]
        },
        {
            id: 'onblockplace',
            name: 'onblockplace',
            aliases: ['onplaceblock'],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when they place a block. Inherits all aura attributes.',
            attributes: [
                { name: 'onplaceskill', alias: ['onplace', 'op'], type: 'string', default: '', description: 'Metaskill to execute when placing block' },
                { name: 'cancelevent', alias: ['cancel', 'ce'], type: 'boolean', default: false, description: 'Cancel block place event' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onBlockPlace{op=MidasTouch;auraname=Golden;d=300;i=1} @self',
                '- onBlockPlace{onPlace=ConvertBlocks;duration=200;cancelEvent=false}'
            ]
        },
        {
            id: 'onchat',
            name: 'onchat',
            aliases: ['chatprompt'],
            category: 'meta',
            description: 'Applies an aura on target player that triggers when they chat. Sets <skill.var.input> placeholder. Inherits all aura attributes.',
            attributes: [
                { name: 'onchatskill', alias: ['onchat', 'oc', 'then'], type: 'string', default: '', description: 'Metaskill to execute when player chats' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onChat{onChat=ExampleSkill2;d=200} @PIR{r=20}',
                '- onChat{onChat=ChatResponse;duration=100;auraName=ChatListener} @trigger'
            ]
        },
        {
            id: 'onswing',
            name: 'onswing',
            aliases: ['onleftclick'],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when they swing (left click). Inherits all aura attributes.',
            attributes: [
                { name: 'onswingskill', alias: ['onswing', 'osw'], type: 'string', default: '', description: 'Metaskill to execute on swing/left click' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onSwing{osw=CatchOnFire;auraname=Ignite;d=300;i=1} @self',
                '- onSwing{onSwing=ShootProjectile;duration=200;charges=10}'
            ]
        },
        {
            id: 'oninteract',
            name: 'oninteract',
            aliases: ['onrightclick'],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when right-clicking or interacting with entities. Inherits all aura attributes.',
            attributes: [
                { name: 'oninteractskill', alias: ['oninteract', 'oi', 'onrightclick', 'onrightclickskill'], type: 'string', default: '', description: 'Metaskill to execute on interact/right-click' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onInteract{oi=OpenCustomGUI;auraname=Merchant;d=300} @self',
                '- onInteract{onInteract=InteractSkill;duration=200;charges=5}'
            ]
        },
        {
            id: 'onjump',
            name: 'onjump',
            aliases: [],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when they jump. Paper-only mechanic. Inherits all aura attributes.',
            attributes: [
                { name: 'onjumpskill', alias: ['onjump', 'oj'], type: 'string', default: '', description: 'Metaskill to execute on jump' },
                { name: 'cancelevent', alias: ['cancel', 'ce'], type: 'boolean', default: false, description: 'Cancel jump event' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onJump{oj=DoubleJump;auraname=Bouncy;d=300} @self',
                '- onJump{onJump=JumpBoost;duration=200;cancelEvent=false}'
            ]
        },
        {
            id: 'ondeath',
            name: 'ondeath',
            aliases: [],
            category: 'meta',
            description: 'Applies an aura that triggers a skill when the target dies. Inherits all aura attributes.',
            attributes: [
                { name: 'ondeathskill', alias: ['ondeath', 'od'], type: 'string', default: '', description: 'Metaskill to execute on death' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- onDeath{od=Explosion;auraname=Explosive;d=9999} @self',
                '- onDeath{onDeath=ReviveEffect;duration=600}'
            ]
        },
        
        // ═══════════════════════════════════════════════════════════
        // ADDITIONAL UTILITY MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'randomskill',
            name: 'randomskill',
            aliases: ['rskill', 'randskill'],
            category: 'meta',
            description: 'Executes a random metaskill from the list.',
            attributes: [
                { name: 'skills', alias: ['s'], type: 'string', default: '', required: true, description: 'Comma-separated list of skills' }
            ],
            defaultTargeter: '@Target',
            examples: ['- randomskill{skills=Skill1,Skill2,Skill3} ']
        },
        {
            id: 'variableskill',
            name: 'variableskill',
            aliases: ['varskill'],
            category: 'meta',
            description: 'Executes a skill stored in a variable.',
            attributes: [
                { name: 'var', alias: ['v', 'variable'], type: 'string', default: '', required: true, description: 'Variable containing skill name' }
            ],
            defaultTargeter: '@Target',
            examples: ['- variableSkill{var=caster.skilltouse} ']
        },
        {
            id: 'sudoskill',
            name: 'sudoskill',
            aliases: ['sudo'],
            category: 'meta',
            description: 'Forces the target entity to execute a metaskill as if it\'s the caster.',
            attributes: [
                { name: 'skill', alias: ['s'], type: 'string', default: '', required: true, description: 'Metaskill to execute' }
            ],
            defaultTargeter: '@Target',
            examples: ['- sudoskill{s=FireballSkill} ']
        },
        {
            id: 'foreach',
            name: 'ForEach',
            aliases: [],
            category: 'meta',
            description: 'Executes specified metaskill once for each target separately. Each execution inherits single entity/location as target.',
            attributes: [
                { name: 'skill', alias: ['s', 'm', 'meta'], type: 'string', default: '', required: true, description: 'Metaskill to execute for each target' },
                { name: 'targettype', alias: ['targett', 'tt'], type: 'string', default: 'ALL', description: 'Target type: ALL, ENTITY, or LOCATION' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- foreach{skill=DamageSkill} @PIR{r=10}',
                '- foreach{s=ProcessEntity;tt=ENTITY} @EIR{r=20}'
            ]
        },
        {
            id: 'foreachvalue',
            name: 'ForEachValue',
            aliases: [],
            category: 'meta',
            description: 'Executes metaskill for each value in list/map. Sets <skill.value>, <skill.index>, and <skill.key> (maps only) parameters.',
            attributes: [
                { name: 'skill', alias: ['s', 'm', 'meta'], type: 'string', default: '', required: true, description: 'Metaskill to execute' },
                { name: 'values', alias: ['val', 'v'], type: 'string', default: '', required: true, description: 'List or map formatted string to iterate' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- foreachvalue{skill=ProcessPlayer;values="Steve,Alex,Notch"} @self',
                '- foreachvalue{s=ProcessData;val="key1=val1;key2=val2"} @self'
            ]
        },
        {
            id: 'switch',
            name: 'Switch',
            aliases: [],
            category: 'meta',
            description: 'Tests condition against list of cases. Each case executes different skill based on condition result.',
            attributes: [
                { name: 'uniqueresult', alias: ['unique', 'first'], type: 'boolean', default: true, description: 'Stop after first match' },
                { name: 'condition', alias: [], type: 'string', default: '', required: true, description: 'Condition to test' },
                { name: 'cases', alias: [], type: 'string', default: '', required: true, description: 'List of cases to evaluate' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- switch{condition=entitytype{t=<case>};cases=case SKELETON=[- message{m="Skeleton!"} @Server] case DEFAULT=[- message{m="Other!"} @Server]} @trigger'
            ]
        },
        {
            id: 'wait',
            name: 'Wait',
            aliases: [],
            category: 'meta',
            description: 'Pauses metaskill execution until conditions are met or timeout occurs.',
            attributes: [
                { name: 'conditions', alias: ['cond', 'c', 'until'], type: 'string', default: '', required: true, description: 'Conditions to wait for' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Check interval in ticks' },
                { name: 'timeout', alias: ['timeouttime', 'tt'], type: 'number', default: 200, description: 'Max ticks to wait' },
                { name: 'cancelSkill', alias: ['cancel', 'cs'], type: 'boolean', default: false, description: 'Cancel skill on timeout' },
                { name: 'cancelConditions', alias: ['cc', 'unless'], type: 'string', default: '', description: 'Conditions that cancel wait immediately' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- wait{cond=[- onground];i=1;tt=200}',
                '- wait{cond=[- haspotioneffect{type=REGENERATION}];i=10;tt=600;cs=true}',
                '- wait{cond=[- health{h=>50}];unless=[- stance{stance=combat}];tt=100}'
            ]
        },
        {
            id: 'terminable',
            name: 'Terminable',
            aliases: ['stoppable', 'cancelable', 'exit', 'terminatable'],
            category: 'meta',
            description: 'Creates aura that checks conditions each tick. If met, immediately cancels onStart skill execution.',
            attributes: [
                { name: 'auraName', alias: ['n', 'name'], type: 'string', default: '', description: 'Aura identifier' },
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Duration in ticks' },
                { name: 'terminateconditions', alias: ['conditions', 'cond', 'c'], type: 'string', default: '', required: true, description: 'Conditions to check for termination' },
                { name: 'deep', alias: [], type: 'boolean', default: false, description: 'Also stop parent metaskill' },
                { name: 'onterminate', alias: ['ox'], type: 'string', default: '', description: 'Metaskill on termination' },
                { name: 'onStart', alias: ['os'], type: 'string', default: '', description: 'Metaskill to start' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- terminable{auraName=stun;d=100;conditions=[- health{h=<50}];onStart=[- damage{a=20}];onTerminate=[- message{m="Stopped!"}]} @self'
            ]
        },
        {
            id: 'cancelskill',
            name: 'CancelSkill',
            aliases: ['cancel', 'return'],
            category: 'meta',
            description: 'Cancels execution of the metaskill when triggered. Use with conditions to create conditional exits.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: [
                '- message{m="Hello"} @server',
                '- cancelSkill ?isMonster',
                '- message{m="Not a monster!"} @server'
            ]
        },
        {
            id: 'determinecondition',
            name: 'DetermineCondition',
            aliases: ['detCond'],
            category: 'meta',
            description: 'Determines outcome of metaskill used as condition via MetaskillCondition. Sets boolean return value.',
            attributes: [
                { name: 'determination', alias: ['det'], type: 'boolean', default: true, description: 'Whether condition returns true/false' },
                { name: 'mode', alias: [], type: 'string', default: 'SET', description: 'Operation: SET, OR, AND, NOT' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- determinecondition{determination=true} @self',
                '- detCond{det=false;mode=AND} @self'
            ]
        },
        {
            id: 'followpath',
            name: 'followpath',
            aliases: [],
            category: 'meta',
            description: 'Applies an aura that makes the mob follow a path. Inherits all aura attributes.',
            attributes: [
                { name: 'path', alias: ['p'], type: 'string', default: '', required: true, description: 'Path name to follow' },
                { name: 'onGoalSkill', alias: ['onGoal', 'og'], type: 'string', default: '', description: 'Metaskill to execute on reaching goal' },
                { name: 'tolerance', alias: ['t'], type: 'number', default: 1, description: 'Distance tolerance for waypoint' },
                { name: 'speed', alias: ['s'], type: 'number', default: 1, description: 'Movement speed multiplier' },
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Duration in ticks' },
                { name: 'timeoutDistance', alias: ['td'], type: 'number', default: 20, description: 'Max distance from path before timeout' },
                { name: 'timeoutTime', alias: ['tt'], type: 'number', default: 100, description: 'Ticks before timeout' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- followPath{path=PatrolRoute;onGoal=ReachedEnd;duration=9999} @self',
                '- followPath{p=CirclePath;speed=1.5;tolerance=2}'
            ]
        },
        {
            id: 'formline',
            name: 'formline',
            aliases: [],
            category: 'meta',
            description: 'Applies an aura that moves the mob in a line. Inherits all aura attributes.',
            attributes: [
                { name: 'path', alias: ['p'], type: 'string', default: '', required: true, description: 'Linear path to follow' },
                { name: 'onGoalSkill', alias: ['onGoal', 'og'], type: 'string', default: '', description: 'Metaskill to execute on reaching goal' },
                { name: 'tolerance', alias: ['t'], type: 'number', default: 1, description: 'Distance tolerance for waypoint' },
                { name: 'speed', alias: ['s'], type: 'number', default: 1, description: 'Movement speed multiplier' },
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- formLine{path=StraightLine;onGoal=Finish;duration=200} @self',
                '- formLine{p=LinearPath;speed=2;tolerance=0.5}'
            ]
        },
        {
            id: 'polygon',
            name: 'polygon',
            aliases: [],
            category: 'meta',
            description: 'Executes skills in a polygon pattern around the caster.',
            attributes: [
                { name: 'onPointSkill', alias: ['onPoint', 'op'], type: 'string', default: '', description: 'Metaskill to execute at each point' },
                { name: 'onStarSkill', alias: ['onStar', 'os'], type: 'string', default: '', description: 'Metaskill for star pattern points' },
                { name: 'onEdgeSkill', alias: ['onEdge', 'oe'], type: 'string', default: '', description: 'Metaskill for edge points' },
                { name: 'onHitEntitySkill', alias: ['onHit', 'oh'], type: 'string', default: '', description: 'Metaskill on entity hit' },
                { name: 'points', alias: ['p'], type: 'number', default: 32, description: 'Number of polygon points' },
                { name: 'duration', alias: ['d'], type: 'number', default: 20, description: 'Duration in ticks' },
                { name: 'distanceBetween', alias: ['db'], type: 'number', default: 0.5, description: 'Distance between edge points' },
                { name: 'scale', alias: ['sc'], type: 'number', default: 1, description: 'Size scale multiplier' },
                { name: 'skip', alias: ['sk'], type: 'number', default: 0, description: 'Points to skip for star pattern' },
                { name: 'xOffset', alias: ['xo'], type: 'number', default: 0, description: 'X offset' },
                { name: 'yOffset', alias: ['yo'], type: 'number', default: 0, description: 'Y offset' },
                { name: 'zOffset', alias: ['zo'], type: 'number', default: 0, description: 'Z offset' },
                { name: 'targetXOffset', alias: ['txo'], type: 'number', default: 0, description: 'Target X offset' },
                { name: 'targetYOffset', alias: ['tyo'], type: 'number', default: 0, description: 'Target Y offset' },
                { name: 'targetZOffset', alias: ['tzo'], type: 'number', default: 0, description: 'Target Z offset' },
                { name: 'forwardOffset', alias: ['fo'], type: 'number', default: 0, description: 'Forward offset' },
                { name: 'pitch', alias: ['pi'], type: 'number', default: 0, description: 'Pitch rotation (degrees)' },
                { name: 'yaw', alias: ['ya'], type: 'number', default: 0, description: 'Yaw rotation (degrees)' },
                { name: 'roll', alias: ['ro'], type: 'number', default: 0, description: 'Roll rotation (degrees)' },
                { name: 'rotation', alias: ['rot'], type: 'number', default: 0, description: 'General rotation (degrees)' },
                { name: 'matchCasterDirection', alias: ['mcd'], type: 'boolean', default: false, description: 'Match caster facing direction' },
                { name: 'directionTowardsTarget', alias: ['dtt'], type: 'boolean', default: false, description: 'Face towards target' },
                { name: 'radius', alias: ['r'], type: 'number', default: 5, description: 'Polygon radius' },
                { name: 'fromOrigin', alias: ['from'], type: 'boolean', default: false, description: 'Use origin location' },
                { name: 'hitConditions', alias: ['hc', 'c'], type: 'string', default: '', description: 'Inline hit conditions' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- polygon{onPoint=Particles;points=6;radius=5;duration=40} @self',
                '- polygon{onStar=FireEffect;points=5;skip=2;scale=2}',
                '- polygon{onEdge=LightningBolt;onHit=Damage;distanceBetween=0.3}'
            ]
        },
        {
            id: 'slash',
            name: 'slash',
            aliases: [],
            category: 'meta',
            description: 'Executes skills in a slash/arc pattern.',
            attributes: [
                { name: 'onStartSkill', alias: ['onStart', 'os'], type: 'string', default: '', description: 'Metaskill at slash start' },
                { name: 'onEndSkill', alias: ['onEnd', 'oe'], type: 'string', default: '', description: 'Metaskill at slash end' },
                { name: 'onPointSkill', alias: ['onPoint', 'op'], type: 'string', default: '', description: 'Metaskill at each point' },
                { name: 'onHitEntitySkill', alias: ['onHit', 'oh'], type: 'string', default: '', description: 'Metaskill on entity hit' },
                { name: 'points', alias: ['p'], type: 'number', default: 32, description: 'Number of slash points' },
                { name: 'specificStep', alias: ['ss'], type: 'number', default: 0, description: 'Specific slash step' },
                { name: 'duration', alias: ['d'], type: 'number', default: 20, description: 'Duration in ticks' },
                { name: 'width', alias: ['w'], type: 'number', default: 1, description: 'Slash width' },
                { name: 'height', alias: ['h'], type: 'number', default: 1, description: 'Slash height' },
                { name: 'angle', alias: ['a'], type: 'number', default: 180, description: 'Slash arc angle (degrees)' },
                { name: 'xOffset', alias: ['xo'], type: 'number', default: 0, description: 'X offset' },
                { name: 'yOffset', alias: ['yo'], type: 'number', default: 0, description: 'Y offset' },
                { name: 'zOffset', alias: ['zo'], type: 'number', default: 0, description: 'Z offset' },
                { name: 'forwardOffset', alias: ['fo'], type: 'number', default: 0, description: 'Forward offset' },
                { name: 'targetXOffset', alias: ['txo'], type: 'number', default: 0, description: 'Target X offset' },
                { name: 'targetYOffset', alias: ['tyo'], type: 'number', default: 0, description: 'Target Y offset' },
                { name: 'targetZOffset', alias: ['tzo'], type: 'number', default: 0, description: 'Target Z offset' },
                { name: 'pitch', alias: ['pi'], type: 'number', default: 0, description: 'Pitch rotation (degrees)' },
                { name: 'yaw', alias: ['ya'], type: 'number', default: 0, description: 'Yaw rotation (degrees)' },
                { name: 'roll', alias: ['ro'], type: 'number', default: 0, description: 'Roll rotation (degrees)' },
                { name: 'rotation', alias: ['rot'], type: 'number', default: 0, description: 'General rotation (degrees)' },
                { name: 'matchCasterDirection', alias: ['mcd'], type: 'boolean', default: false, description: 'Match caster facing direction' },
                { name: 'directionTowardsTarget', alias: ['dtt'], type: 'boolean', default: false, description: 'Face towards target' },
                { name: 'radius', alias: ['r'], type: 'number', default: 5, description: 'Slash radius' },
                { name: 'fromOrigin', alias: ['from'], type: 'boolean', default: false, description: 'Use origin location' },
                { name: 'hitConditions', alias: ['hc', 'c'], type: 'string', default: '', description: 'Inline hit conditions' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- slash{onPoint=Particles;angle=90;radius=3;duration=20} @self',
                '- slash{onStart=Sound;onEnd=Explosion;onHit=Damage;width=2;height=1}',
                '- slash{op=FireEffect;angle=180;points=64;r=5}'
            ]
        },
        {
            id: 'setskillcooldown',
            name: 'setskillcooldown',
            aliases: ['ssc', 'setcooldown'],
            category: 'meta',
            description: 'Sets a cooldown on a specific metaskill. Target metaskill needs Cooldown option (can be 0). Use delay 0 if setting cooldown of calling metaskill.',
            attributes: [
                { name: 'skill', alias: ['s'], type: 'string', default: '', required: true, description: 'Metaskill to set cooldown for' },
                { name: 'seconds', alias: ['sec', 'cooldown', 'cd'], type: 'number', default: 0, required: true, description: 'Cooldown duration in seconds' }
            ],
            defaultTargeter: '@Trigger',
            examples: [
                '- setSkillCooldown{s=PowerfulAttack;seconds=30} @trigger',
                '- setSkillCooldown{skill=UltimateAbility;cooldown=60} @self',
                '- delay 0',
                '- setSkillCooldown{s=ThisMetaskill;seconds=10} @trigger'
            ]
        },
        {
            id: 'totem',
            name: 'totem',
            aliases: [],
            category: 'projectile',
            description: 'Static totem projectile that pulses onHit skill on targets within radius. Inherits ALL projectile attributes including BulletType (dropdown), offsets, velocity, hit detection, conditions, and all bullet-specific attributes (ARROW, BLOCK, ITEM, MOB, TRACKING, DISPLAY, ME, TEXT).',
            attributes: [
                { name: 'onTick', alias: ['ot'], type: 'string', default: '', description: 'Metaskill to execute each tick' },
                { name: 'onHit', alias: ['oh'], type: 'string', default: '', description: 'Metaskill to pulse on nearby entities' },
                { name: 'onEnd', alias: ['oe'], type: 'string', default: '', description: 'Metaskill when totem ends' },
                { name: 'charges', alias: ['c'], type: 'number', default: 1, description: 'Number of uses before ending' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Tick interval for onTick skill' },
                { name: 'radius', alias: ['r'], type: 'number', default: 5, description: 'Effect radius' },
                { name: 'yOffset', alias: ['yo'], type: 'number', default: 0, description: 'Vertical offset' },
                { name: 'stopAtEntity', alias: ['sae'], type: 'boolean', default: false, description: 'Stop at entity collision' },
                { name: 'hugSurface', alias: ['hs'], type: 'boolean', default: false, description: 'Hug solid surfaces' },
                { name: 'hugLiquid', alias: ['hl'], type: 'boolean', default: false, description: 'Hug liquid surfaces' },
                { name: 'heightFromSurface', alias: ['hfs'], type: 'number', default: 0.5, description: 'Height above surface' },
                { name: 'faceAwayFromCaster', alias: ['fafc'], type: 'boolean', default: false, description: 'Face away from caster' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- totem{onHit=HealingPulse;charges=10;duration=200;radius=6} @self',
                '- totem{oh=DamageNearby;onTick=Particles;interval=5;r=8;d=300}',
                '- totem{onHit=BuffAllies;hugSurface=true;yOffset=1;charges=5}'
            ]
        },
        {
            id: 'cancelevent',
            name: 'cancelevent',
            aliases: [],
            category: 'meta',
            description: 'Cancels the event that triggered the skill (e.g., block damage from).',
            attributes: [],
            defaultTargeter: '',
            examples: ['- cancelEvent']
        },
        {
            id: 'consume',
            name: 'consume',
            aliases: [],
            category: 'utility',
            description: 'Removes charges from an aura.',
            attributes: [
                { name: 'aura', alias: ['a', 'name', 'auraname'], type: 'string', default: '', required: true, description: 'Name of aura to consume' },
                { name: 'charges', alias: ['c', 'charge'], type: 'number', default: 1, description: 'Number of charges to consume' }
            ],
            defaultTargeter: '@Self',
            examples: ['- consume{aura=MyShield;charges=1} ']
        },
        {
            id: 'giveitem',
            name: 'giveitem',
            aliases: ['give'],
            category: 'utility',
            description: 'Gives an item to the target player.',
            attributes: [
                { name: 'item', alias: ['i'], type: 'string', default: '', required: true, description: 'MythicMobs item or vanilla item' },
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Stack size' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- giveitem{i=diamond;a=5} ']
        },
        {
            id: 'takeitem',
            name: 'takeitem',
            aliases: ['take'],
            category: 'utility',
            description: 'Takes an item from the target player.',
            attributes: [
                { name: 'item', alias: ['i'], type: 'string', default: '', required: true, description: 'Item to take' },
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount to take' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- takeitem{i=diamond;a=5} ']
        },
        {
            id: 'dropitem',
            name: 'dropitem',
            aliases: [],
            category: 'utility',
            description: 'Drops an item at the target location.',
            attributes: [
                { name: 'item', alias: ['i'], type: 'string', default: '', required: true, description: 'Item to drop' },
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount to drop' }
            ],
            defaultTargeter: '@Self',
            examples: ['- dropitem{i=diamond} ']
        },
        {
            id: 'equip',
            name: 'equip',
            aliases: [],
            category: 'utility',
            description: 'Equips an item from target\'s inventory to specified slot.',
            attributes: [
                { name: 'slot', alias: ['s'], type: 'string', default: 'HAND', description: 'Equipment slot' },
                { name: 'material', alias: ['m'], type: 'string', default: '', description: 'Material to equip' }
            ],
            defaultTargeter: '@Self',
            examples: ['- equip{slot=HEAD;material=DIAMOND_HELMET} ']
        },
        {
            id: 'particlebox',
            name: 'ParticleBox',
            aliases: ['effect:particlebox', 'e:pb', 'pb'],
            category: 'effects',
            description: 'Creates a box of particles at the targeted entity or location.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'amount', alias: ['count', 'a'], type: 'number', default: 10, description: 'Number of particles' },
                { name: 'radius', alias: ['r'], type: 'number', default: 5, description: 'Box radius' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@Self',
            examples: ['- particlebox{particle=flame;amount=200;radius=5}', '- particlebox{p=dust;color=#00FF00;size=1.5;radius=3}']
        },
        {
            id: 'particleline',
            name: 'ParticleLine',
            aliases: ['effect:particleline', 'e:pl', 'pl'],
            category: 'effects',
            description: 'Creates a line of particles between origin and target.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'amount', alias: ['count', 'a'], type: 'number', default: 1, description: 'Number of particles per point' },
                { name: 'distanceBetween', alias: ['db'], type: 'number', default: 0.25, description: 'Distance between points' },
                { name: 'fromOrigin', alias: ['fo'], type: 'boolean', default: false, description: 'Draw from origin' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@Target',
            examples: ['- particleline{particle=flame;amount=1;fromOrigin=true}', '- particleline{p=dust;color=#FF00FF;fromOrigin=true}']
        },
        {
            id: 'particlelinehelix',
            name: 'ParticleLineHelix',
            aliases: ['effect:particlelinehelix', 'particlehelixline'],
            category: 'effects',
            description: 'Creates a particle line helix effect.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'amount', alias: ['count', 'a'], type: 'number', default: 1, description: 'Number of particles per point' },
                { name: 'distanceBetween', alias: ['db'], type: 'number', default: 1, description: 'Distance between points' },
                { name: 'helixlength', alias: ['hl'], type: 'number', default: 2, description: 'Helix length' },
                { name: 'helixradius', alias: ['hr'], type: 'number', default: 1, description: 'Helix radius' },
                { name: 'fromOrigin', alias: ['fo'], type: 'boolean', default: false, description: 'Draw from origin' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- particlelinehelix{fo=true;db=0.4;hl=4;hr=0.5}', '- particlelinehelix{p=dust;color=#FFAA00;hl=6}']
        },
        {
            id: 'particlelinering',
            name: 'ParticleLineRing',
            aliases: ['effect:particlelinering', 'particleringline'],
            category: 'effects',
            description: 'Creates a particle line ring.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'amount', alias: ['count', 'a'], type: 'number', default: 1, description: 'Number of particles per point' },
                { name: 'ringpoints', alias: ['rp'], type: 'number', default: 16, description: 'Points in ring' },
                { name: 'ringradius', alias: ['rr'], type: 'number', default: 0.5, description: 'Ring radius' },
                { name: 'fromOrigin', alias: ['fo'], type: 'boolean', default: false, description: 'Draw from origin' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@PIR{r=20;limit=1;sort=RANDOM}',
            examples: ['- particlelinering{p=flame;r=3;rr=1}', '- particlelinering{p=dust;color=#0088FF;rr=2}']
        },
        {
            id: 'particleorbital',
            name: 'ParticleOrbital',
            aliases: ['effect:particleorbital', 'e:particleorbital', 'effect:particlecircle', 'particlecircle', 'e:particlecricle'],
            category: 'effects',
            description: 'Creates orbiting particle effect.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'radius', alias: ['r'], type: 'number', default: 4, description: 'Orbit radius' },
                { name: 'points', alias: ['pts'], type: 'number', default: 20, description: 'Points in circle' },
                { name: 'ticks', alias: ['t'], type: 'number', default: 100, description: 'Duration in ticks' },
                { name: 'interval', alias: ['in', 'i'], type: 'number', default: 10, description: 'Update interval' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@Self',
            examples: ['- particleorbital{r=2;points=16;t=100;i=1;particle=flame}', '- particleorbital{p=dust;color=#00FFFF;r=3}']
        },
        {
            id: 'particlering',
            name: 'ParticleRing',
            aliases: ['effect:particlering', 'e:pr', 'pr'],
            category: 'effects',
            description: 'Creates a ring of particles around target.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'amount', alias: ['count', 'a'], type: 'number', default: 1, description: 'Number of particles per point' },
                { name: 'points', alias: ['pts'], type: 'number', default: 8, description: 'Points in ring' },
                { name: 'radius', alias: ['r'], type: 'number', default: 10, description: 'Ring radius' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@Target',
            examples: ['- particlering{particle=flame;radius=20;points=32;amount=1}', '- particlering{p=entity_effect;color=#FF6600;radius=5}']
        },
        {
            id: 'particlesphere',
            name: 'ParticleSphere',
            aliases: ['effect:particlesphere', 'e:ps', 'ps'],
            category: 'effects',
            description: 'Creates a sphere of particles at target.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'amount', alias: ['count', 'a'], type: 'number', default: 200, description: 'Number of particles' },
                { name: 'radius', alias: ['r'], type: 'number', default: 0, description: 'Sphere radius' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@Self',
            examples: ['- particlesphere{particle=flame;amount=200;radius=5}', '- particlesphere{p=dust;color=#FF0088;amount=100;radius=3}']
        },
        {
            id: 'particletornado',
            name: 'ParticleTornado',
            aliases: ['effect:particletornado', 'e:pt'],
            category: 'effects',
            description: 'Creates a tornado styled particle effect.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'flame', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'maxradius', alias: ['mr'], type: 'number', default: 3, description: 'Max tornado radius' },
                { name: 'height', alias: ['h'], type: 'number', default: 4, description: 'Tornado height' },
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Effect duration' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@Self',
            examples: ['- particletornado{p=flame;mr=1;h=3;d=100}', '- particletornado{p=dust;color=#8800FF;mr=2}']
        },
        {
            id: 'particleequation',
            name: 'ParticleEquation',
            aliases: ['effect:particleequation', 'e:peq', 'peq'],
            category: 'effects',
            description: 'Generates a particle effect based on an equation. DISCLAIMER: This mechanic is a Work In Progress. As such, it is not yet functional, examples are not available, and is not intended to be used.',
            attributes: [
                { name: 'equation', alias: [], type: 'string', default: '0', description: 'The equation to use. Allows the x,y,z variables' },
                { name: 'precision', alias: [], type: 'number', default: 1, description: 'The distance between individual particles' },
                { name: 'tolerance', alias: [], type: 'number', default: 0.1, description: 'Tolerance for floating points errors' },
                { name: 'variables', alias: [], type: 'string', default: '', description: 'A map of variables for the equation expression, like x/y/z are, separated by ; (e.g., variables="h=1;t=2")' }
            ],
            defaultTargeter: '@Self',
            examples: ['- particleequation{equation=x*y;precision=1}']
        },
        {
            id: 'atom',
            name: 'Atom',
            aliases: ['effect:atom', 'e:atom'],
            category: 'effects',
            description: 'Creates an orbiting atom effect.',
            hasSmartParticles: true,
            inheritedParticleAttributes: true,
            attributes: [
                { name: 'particle', alias: ['p'], type: 'particleSelect', default: 'redstone', description: 'Particle type (120+ options)', usesParticleTypes: true },
                { name: 'orbitals', alias: ['o'], type: 'number', default: 2, description: 'Number of orbitals' },
                { name: 'radius', alias: ['r'], type: 'number', default: 4, description: 'Orbit radius' },
                { name: 'ticks', alias: ['t'], type: 'number', default: 1, description: 'Duration in ticks' },
                { name: 'material', alias: ['m', 'mat'], type: 'materialSelect', default: '', description: 'Material (for block/item particles)', showWhen: { requiresDataType: ['ItemStack', 'BlockData', 'MaterialData'] } },
                { name: 'color', alias: ['c'], type: 'color', default: '#FF0000', description: 'Color (hex format)', showWhen: { requiresDataType: ['Color', 'DustOptions', 'DustTransition', 'Spell'] } },
                { name: 'size', alias: ['sz'], type: 'number', default: 1.0, description: 'Particle size', showWhen: { requiresDataType: ['DustOptions', 'DustTransition'] } }
            ],
            defaultTargeter: '@Self',
            examples: ['- atom{particle=flame;orbitals=3;radius=2}', '- atom{p=dust;color=#0099FF;radius=3}']
        },
        
        // ═══════════════════════════════════════════════════════════
        // ADDITIONAL EFFECTS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'hologram',
            name: 'hologram',
            aliases: [],
            category: 'effects',
            description: 'Creates a temporary holographic text display.',
            attributes: [
                { name: 'text', alias: ['t', 'message', 'm'], type: 'string', default: '', required: true, description: 'Text to display' },
                { name: 'duration', alias: ['d'], type: 'number', default: 40, description: 'Duration in ticks' },
                { name: 'yoffset', alias: ['y'], type: 'number', default: 0, description: 'Y offset from target' }
            ],
            defaultTargeter: '@Self',
            examples: ['- hologram{text="&cCritical Hit!";d=40;y=1.5} ']
        },
        {
            id: 'glow',
            name: 'glow',
            aliases: [],
            category: 'effects',
            description: 'Applies a glowing outline effect to target entity.',
            attributes: [
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Glow duration in ticks' },
                { name: 'color', alias: ['c'], type: 'string', default: 'WHITE', description: 'Glow color' }
            ],
            defaultTargeter: '@Target',
            examples: ['- glow{duration=200;color=RED} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // ATTRIBUTE/STAT MODIFICATION
        // ═══════════════════════════════════════════════════════════
        {
            id: 'sethealth',
            name: 'sethealth',
            aliases: ['sethp'],
            category: 'control',
            description: 'Sets the target\'s health to a specific value.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 20, description: 'Health to set' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setHealth{a=1} ']
        },
        {
            id: 'setmaxhealth',
            name: 'setmaxhealth',
            aliases: [],
            category: 'control',
            description: 'Sets the maximum health of the target.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 20, description: 'Max health to set' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setMaxHealth{a=100} ']
        },
        {
            id: 'setname',
            name: 'setname',
            aliases: [],
            category: 'control',
            description: 'Sets the display name of the target entity.',
            attributes: [
                { name: 'name', alias: ['n'], type: 'string', default: '', required: true, description: 'New display name' },
                { name: 'visible', alias: ['v'], type: 'boolean', default: true, description: 'Whether name is visible' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setName{name="&6Boss"} ']
        },
        {
            id: 'setlevel',
            name: 'setlevel',
            aliases: [],
            category: 'control',
            description: 'Sets the MythicMob\'s level.',
            attributes: [
                { name: 'level', alias: ['l'], type: 'number', default: 1, description: 'Level to set' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setLevel{l=10} ']
        },
        {
            id: 'setspeed',
            name: 'setspeed',
            aliases: [],
            category: 'control',
            description: 'Modifies the target\'s movement speed.',
            attributes: [
                { name: 'speed', alias: ['s'], type: 'number', default: 0.7, description: 'Movement speed multiplier' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setSpeed{s=2.0} ']
        },
        {
            id: 'setgravity',
            name: 'setgravity',
            aliases: [],
            category: 'control',
            description: 'Enables or disables gravity for the target.',
            attributes: [
                { name: 'gravity', alias: ['g'], type: 'boolean', default: true, description: 'Enable/disable gravity' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setGravity{g=false} ']
        },
        {
            id: 'setai',
            name: 'setai',
            aliases: [],
            category: 'control',
            description: 'Enables or disables the target\'s AI.',
            attributes: [
                { name: 'ai', alias: ['a'], type: 'boolean', default: true, description: 'Enable/disable AI' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setAI{ai=false} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // WORLD INTERACTION
        // ═══════════════════════════════════════════════════════════
        {
            id: 'setblock',
            name: 'setblock',
            aliases: [],
            category: 'utility',
            description: 'Sets a block at the target location.',
            attributes: [
                { name: 'material', alias: ['type', 't', 'm'], type: 'string', default: 'STONE', description: 'Block type' },
                { name: 'duration', alias: ['d'], type: 'number', default: 0, description: 'Revert after X ticks (0 = permanent)' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setBlock{type=GOLD_BLOCK;d=100} ']
        },
        {
            id: 'fillchest',
            name: 'fillchest',
            aliases: [],
            category: 'utility',
            description: 'Fills a chest at target location with items from a loot table.',
            attributes: [
                { name: 'table', alias: ['t'], type: 'string', default: '', required: true, description: 'MythicMobs loot table' }
            ],
            defaultTargeter: '@Target',
            examples: ['- fillChest{table=TreasureChest} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // DISGUISE & APPEARANCE
        // ═══════════════════════════════════════════════════════════
        {
            id: 'disguise',
            name: 'disguise',
            aliases: [],
            category: 'effects',
            description: 'Disguises the target mob as another entity type (requires LibsDisguises).',
            attributes: [
                { name: 'type', alias: ['t', 'disguise'], type: 'string', default: 'PLAYER', description: 'Disguise type' },
                { name: 'player', alias: ['p'], type: 'string', default: '', description: 'Player name if disguising as player' }
            ],
            defaultTargeter: '@Self',
            examples: ['- disguise{type=CREEPER} ']
        },
        {
            id: 'undisguise',
            name: 'undisguise',
            aliases: [],
            category: 'effects',
            description: 'Removes disguise from target (requires LibsDisguises).',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- undisguise ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // SPECIAL AURA TYPES
        // ═══════════════════════════════════════════════════════════
        {
            id: 'orbital',
            name: 'orbital',
            aliases: [],
            category: 'meta',
            description: 'Creates projectiles orbiting around the target. Inherits ALL projectile attributes including BulletType (dropdown), offsets, velocity, hit detection conditions, and all bullet-specific attributes (ARROW, BLOCK, ITEM, MOB, TRACKING, DISPLAY, ME, TEXT).',
            attributes: [
                { name: 'onTick', alias: ['ot'], type: 'string', default: '', description: 'Metaskill to execute each tick' },
                { name: 'onHit', alias: ['oh'], type: 'string', default: '', description: 'Metaskill to execute on entity hit' },
                { name: 'onEnd', alias: ['oe'], type: 'string', default: '', description: 'Metaskill to execute when orbital ends' },
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Duration in ticks' },
                { name: 'radius', alias: ['r'], type: 'number', default: 4, description: 'Orbit radius' },
                { name: 'points', alias: ['p'], type: 'number', default: 32, description: 'Number of orbital points' },
                { name: 'hitRadius', alias: ['hr'], type: 'number', default: 1, description: 'Horizontal hit detection radius' },
                { name: 'verticalHitRadius', alias: ['vhr'], type: 'number', default: 1, description: 'Vertical hit detection radius' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Tick interval for onTick skill' },
                { name: 'startingPoint', alias: ['sp'], type: 'number', default: 0, description: 'Starting point index' },
                { name: 'tickInterpolation', alias: ['ti'], type: 'boolean', default: true, description: 'Smooth interpolation between ticks' },
                { name: 'rotationX', alias: ['rx', 'rotx'], type: 'number', default: 0, description: 'X-axis rotation in degrees' },
                { name: 'rotationY', alias: ['ry', 'roty'], type: 'number', default: 0, description: 'Y-axis rotation in degrees' },
                { name: 'rotationZ', alias: ['rz', 'rotz'], type: 'number', default: 0, description: 'Z-axis rotation in degrees' },
                { name: 'angularVelocityX', alias: ['avx'], type: 'number', default: 0, description: 'X-axis angular velocity (degrees/tick)' },
                { name: 'angularVelocityY', alias: ['avy'], type: 'number', default: 0, description: 'Y-axis angular velocity (degrees/tick)' },
                { name: 'angularVelocityZ', alias: ['avz'], type: 'number', default: 0, description: 'Z-axis angular velocity (degrees/tick)' },
                { name: 'rotate', alias: ['rot'], type: 'boolean', default: false, description: 'Enable rotation' },
                { name: 'reversed', alias: ['rev'], type: 'boolean', default: false, description: 'Reverse orbital direction' },
                { name: 'offsetX', alias: ['ox'], type: 'number', default: 0, description: 'X offset from caster' },
                { name: 'offsetY', alias: ['oy'], type: 'number', default: 0, description: 'Y offset from caster' },
                { name: 'offsetZ', alias: ['oz'], type: 'number', default: 0, description: 'Z offset from caster' },
                { name: 'hugSurface', alias: ['hs'], type: 'boolean', default: false, description: 'Hug solid surfaces' },
                { name: 'hugLiquid', alias: ['hl'], type: 'boolean', default: false, description: 'Hug liquid surfaces' },
                { name: 'heightFromSurface', alias: ['hfs'], type: 'number', default: 0.5, description: 'Height above surface when hugging' },
                { name: 'maxClimbHeight', alias: ['mch'], type: 'number', default: 0.5, description: 'Max climb height for surface hugging' },
                { name: 'maxDropHeight', alias: ['mdh'], type: 'number', default: 99, description: 'Max drop height for surface hugging' },
                { name: 'bulletType', alias: ['bt'], type: 'string', default: '', description: 'Custom projectile model (ModelEngine)' },
                { name: 'castAsOrbital', alias: ['cao'], type: 'boolean', default: true, description: 'Cast orbital from center or individual points' },
                { name: 'immuneDelay', alias: ['id'], type: 'number', default: 0, description: 'Hit immunity delay in ticks' },
                { name: 'hitPlayers', alias: ['hp'], type: 'boolean', default: true, description: 'Can hit players' },
                { name: 'hitNonPlayers', alias: ['hnp'], type: 'boolean', default: true, description: 'Can hit non-players' },
                { name: 'hitSelf', alias: ['hitself'], type: 'boolean', default: false, description: 'Can hit caster' },
                { name: 'hitConditions', alias: ['hc', 'c'], type: 'string', default: '', description: 'Inline conditions for hit detection' },
                { name: 'stopConditions', alias: ['sc', 'stop'], type: 'string', default: '', description: 'Conditions to stop orbital' },
                { name: 'hitTargeter', alias: ['ht'], type: 'string', default: '', description: 'Targeter for hit detection' },
                { name: 'drawHitbox', alias: ['dh'], type: 'boolean', default: false, description: 'Draw hitbox for debugging' },
                { name: 'shareSubHitboxCooldown', alias: ['sshc'], type: 'boolean', default: true, description: 'Share hit cooldown across orbital points' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- orbital{onTick=ParticleSkill;onHit=DamageSkill;r=4;p=3;d=200}',
                '- orbital{ot=Particles;oh=Damage;r=6;points=8;avx=5;avy=10;rotate=true}',
                '- orbital{onHit=Lightning;radius=5;hitRadius=1.5;hugSurface=true}'
            ]
        },
        {
            id: 'auraremove',
            name: 'auraremove',
            aliases: ['removeaura'],
            category: 'aura',
            description: 'Removes a specific aura from the target by name.',
            attributes: [
                { name: 'aura', alias: ['name', 'auraname'], type: 'string', default: '', required: true, description: 'Name of aura to remove' }
            ],
            defaultTargeter: '@Self',
            examples: ['- auraRemove{aura=MyBuff} ']
        },
        
        // ═══════════════════════════════════════════════════════════
        // SPECIAL META-MECHANICS
        // ═══════════════════════════════════════════════════════════
        {
            id: 'chain',
            name: 'chain',
            aliases: [],
            category: 'meta',
            description: 'Chains a skill between multiple targets. Each bounce the origin entity becomes the bouncing-from entity.',
            attributes: [
                { name: 'onbounce', alias: ['ob', 'm', 'meta', 'onbounceskill', 'ontick', 'ontickskill', 'ot', 's', 'skill'], type: 'string', default: '', required: true, description: 'Metaskill that bounces between targets' },
                { name: 'bounces', alias: ['b', 'jumps', 'j'], type: 'number', default: 5, description: 'Max number of bounces' },
                { name: 'delay', alias: ['d', 'bd', 'bouncedelay', 'i', 'interval'], type: 'number', default: 1, description: 'Delay between bounces (ticks)' },
                { name: 'radius', alias: ['r', 'bounceradius', 'bouncerange', 'range'], type: 'number', default: 5, description: 'Bounce range to next target' },
                { name: 'hitself', alias: ['hs'], type: 'boolean', default: false, description: 'Whether chain affects caster' },
                { name: 'hittarget', alias: ['ht'], type: 'boolean', default: true, description: 'Whether to hit initial target' },
                { name: 'hitplayers', alias: ['hp'], type: 'boolean', default: true, description: 'Whether to bounce to players' },
                { name: 'hitnonplayers', alias: ['hnp'], type: 'boolean', default: false, description: 'Whether to bounce to non-players' },
                { name: 'bounceconditions', alias: ['conditions', 'cond', 'c'], type: 'string', default: '', description: 'Conditions for bounce target' }
            ],
            defaultTargeter: '@Target',
            examples: [
                '- chain{onBounce=LightningStrike;bounces=5;radius=8}',
                '- chain{bounces=5;bounceRadius=10;bounceDelay=1;hitSelf=false;onBounce=[effect:particleline{p=flame;fromOrigin=true}];bounceConditions=[- inlineofsight]}'
            ]
        },
        {
            id: 'cast',
            name: 'cast',
            aliases: [],
            category: 'meta',
            description: 'Cast executes a skill like an RPG spell with casting time. Can be interrupted. Inherits all aura attributes.',
            attributes: [
                { name: 'oncastskill', alias: ['oncast', 'oc'], type: 'string', default: '', description: 'Metaskill if cast finishes successfully' },
                { name: 'oninterruptedskill', alias: ['oninterrupted', 'oninterrupt', 'oi'], type: 'string', default: '', description: 'Metaskill if cast is interrupted' },
                { name: 'onnotargetsskill', alias: ['onnotargets', 'onnotarget', 'ont'], type: 'string', default: '', description: 'Metaskill if no target found' },
                { name: 'ontickskill', alias: ['ontick', 'ot'], type: 'string', default: '', description: 'Metaskill executed each tick during cast' },
                { name: 'onstartskill', alias: ['onstart', 'os'], type: 'string', default: '', description: 'Metaskill when cast starts' },
                { name: 'onendskill', alias: ['onend', 'oe'], type: 'string', default: '', description: 'Metaskill when cast ends (any way)' },
                { name: 'skillname', alias: ['spellname', 'sn'], type: 'string', default: '', description: 'Display name in cast bar' },
                { name: 'showcastbar', alias: ['castbar', 'cb'], type: 'boolean', default: true, description: 'Show cast bar' },
                { name: 'cancelonmove', alias: ['com'], type: 'boolean', default: false, description: 'Cancel if caster moves' },
                { name: 'duration', alias: ['d', 'ticks', 't'], type: 'number', default: 200, description: 'Cast duration in ticks' },
                { name: 'interval', alias: ['i'], type: 'number', default: 1, description: 'Tick interval' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- cast{skillName="&aFrost Blast";duration=40;onCast=FrostBlast-Cast;onTick=FrostBlast-Tick;onInterrupted=FrostBlast-Interrupted} @target',
                '- cast{onTick=DamageEffect;d=200;interval=20}'
            ]
        },
        {
            id: 'raytrace',
            name: 'raytrace',
            aliases: [],
            category: 'utility',
            description: 'Traces a ray from caster and executes skills on entities/blocks hit.',
            attributes: [
                { name: 'onhit', alias: ['oh'], type: 'string', default: '', description: 'Skill on entity hit' },
                { name: 'ontick', alias: ['ot'], type: 'string', default: '', description: 'Skill each tick of ray' },
                { name: 'maxdistance', alias: ['md', 'distance', 'd'], type: 'number', default: 50, description: 'Max ray distance' },
                { name: 'raywidth', alias: ['rw', 'width', 'w'], type: 'number', default: 0.5, description: 'Width of ray hitbox' }
            ],
            defaultTargeter: '@Forward{f=1}',
            examples: ['- raytrace{onHit=DamageSkill;onTick=ParticleEffect;md=30;rw=1}']
        },

        // ═══════════════════════════════════════════════════════════
        // ADDITIONAL HIGH-PRIORITY MECHANICS (Phase 2 Expansion)
        // ═══════════════════════════════════════════════════════════
        
        // Display & Transformation
        {
            id: 'displaytransformation',
            name: 'DisplayTransformation',
            aliases: ['settransformation', 'transformation'],
            category: 'utility',
            description: 'Sets the targeted display entity\'s transformations (translation, scale, rotation).',
            attributes: [
                { name: 'action', alias: ['a'], type: 'string', default: 'SET', description: 'Action: SET, ADD, MULTIPLY, DIVIDE' },
                { name: 'transformationtype', alias: ['transformation', 'type', 'tt'], type: 'string', default: 'TRANSLATION', description: 'Type: TRANSLATION, SCALE, RIGHT_ROTATION, LEFT_ROTATION' },
                { name: 'value', alias: ['val'], type: 'string', default: '0,0,0', description: 'The transformation value (x,y,z)' }
            ],
            defaultTargeter: '@Self',
            examples: ['- displaytransformation{action=set;transformation=translation;value=0,0,1} ', '- displaytransformation{action=MULTIPLY;transformation=LEFT_ROTATION;val=0,0.707,0,0.707} ']
        },
        
        // Currency Mechanics
        {
            id: 'currencygive',
            name: 'currencygive',
            aliases: ['giveCurrency'],
            category: 'utility',
            description: 'Gives money to players. Requires Vault and an economy plugin.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 0, description: 'Amount of money to give' }
            ],
            defaultTargeter: '@PIR{r=20}',
            examples: ['- currencygive{amount=20} ', '- currencygive{a=100} ']
        },
        {
            id: 'currencytake',
            name: 'currencytake',
            aliases: ['takeCurrency'],
            category: 'utility',
            description: 'Takes money from players. Requires Vault and an economy plugin.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 0, description: 'Amount of money to take' }
            ],
            defaultTargeter: '@PIR{r=20}',
            examples: ['- currencytake{amount=20} ', '- currencytake{a=50} ']
        },
        
        // Animal/Mob Specific
        {
            id: 'goatram',
            name: 'GoatRam',
            aliases: [],
            category: 'damage',
            description: 'Causes the casting goat mob to ram the targeted entity. Paper only.',
            attributes: [],
            defaultTargeter: '@trigger',
            examples: ['- goatram', '- goatram ']
        },
        
        // Control Mechanics
        {
            id: 'prison',
            name: 'prison',
            aliases: [],
            category: 'control',
            description: 'Encases target in a temporary prison of blocks.',
            attributes: [
                { name: 'material', alias: ['m', 't', 'type'], type: 'material', default: 'ICE', description: 'Block type for prison' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' },
                { name: 'breakable', alias: ['b'], type: 'boolean', default: false, description: 'Can blocks be broken' }
            ],
            defaultTargeter: '@target',
            examples: ['- prison{material=IRON_BLOCK;duration=200;breakable=true} ', '- prison{m=ICE;d=100} ']
        },
        {
            id: 'printparenttree',
            name: 'PrintParentTree',
            aliases: [],
            category: 'utility',
            description: 'Prints debug information regarding the Metaskill executing the mechanic and its SkillTree',
            attributes: [],
            defaultTargeter: '',
            examples: ['- printParentTree']
        },
        {
            id: 'swap',
            name: 'swap',
            aliases: ['swaplocations'],
            category: 'movement',
            description: 'Swaps the location of the caster and target.',
            attributes: [],
            defaultTargeter: '@target',
            examples: ['- swap ', '- swap ']
        },
        {
            id: 'goto',
            name: 'goto',
            aliases: ['pathto', 'navigateto'],
            category: 'movement',
            description: 'Causes the mob to pathfind to a location.',
            attributes: [
                { name: 'speed', alias: ['s'], type: 'number', default: 1, description: 'Movement speed modifier' },
                { name: 'spreadH', alias: ['sh'], type: 'number', default: 0, description: 'Horizontal spread' },
                { name: 'spreadV', alias: ['sv'], type: 'number', default: 0, description: 'Vertical spread' }
            ],
            defaultTargeter: '@target',
            examples: ['- goto{speed=1;sh=5;sv=5} ', '- goto{s=2} ']
        },
        {
            id: 'mount',
            name: 'mount',
            aliases: ['vehicle'],
            category: 'control',
            description: 'Summons a mob and mounts it as a vehicle.',
            attributes: [
                { name: 'type', alias: ['t', 'mob', 'm'], type: 'string', default: '', description: 'MythicMob type to summon' },
                { name: 'stack', alias: ['s'], type: 'boolean', default: false, description: 'Stack atop existing mounts' }
            ],
            defaultTargeter: '@Self',
            examples: ['- mount{type=UndeadMount} ', '- mount{t=Horse;stack=true} ']
        },
        {
            id: 'mountme',
            name: 'mountme',
            aliases: [],
            category: 'control',
            description: 'Makes the target mount the caster mob.',
            attributes: [],
            defaultTargeter: '@trigger',
            examples: ['- mountme', '- mountme ']
        },
        {
            id: 'mounttarget',
            name: 'mounttarget',
            aliases: [],
            category: 'control',
            description: 'Causes the mob to mount the specified target.',
            attributes: [],
            defaultTargeter: '@trigger',
            examples: ['- mounttarget', '- mounttarget ']
        },
        {
            id: 'dismount',
            name: 'dismount',
            aliases: [],
            category: 'control',
            description: 'Causes the mob to jump off its mount.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- dismount', '- dismount ']
        },
        {
            id: 'look',
            name: 'look',
            aliases: [],
            category: 'control',
            description: 'Causes the entity to look at its target.',
            attributes: [
                { name: 'headOnly', alias: ['ho'], type: 'boolean', default: false, description: 'Only turn head' },
                { name: 'force', alias: ['f'], type: 'boolean', default: false, description: 'Force look (even with no AI)' },
                { name: 'immediately', alias: ['immediate', 'i'], type: 'boolean', default: true, description: 'Turn immediately' }
            ],
            defaultTargeter: '@Target',
            examples: ['- look{headOnly=true;immediately=true} ', '- look{force=true} ']
        },
        {
            id: 'freeze',
            name: 'freeze',
            aliases: [],
            category: 'control',
            description: 'Sets the ticks frozen in powdered snow (1.17+).',
            attributes: [
                { name: 'ticks', alias: ['t', 'duration', 'd'], type: 'number', default: 60, description: 'Ticks frozen' }
            ],
            defaultTargeter: '@trigger',
            examples: ['- freeze{ticks=100}', '- freeze{t=200} ']
        },
        
        // Healing/Shield
        {
            id: 'shield',
            name: 'shield',
            aliases: [],
            category: 'heal',
            description: 'Gives the target entity absorption hearts (shield).',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 20, description: 'Amount of absorption health' },
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Self',
            examples: ['- shield{amount=20;duration=200} ', '- shield{a=10;d=100} ']
        },
        
        // World Mechanics
        {
            id: 'time',
            name: 'Time',
            aliases: ['settime'],
            category: 'utility',
            description: 'Sets the time of day in the world.',
            attributes: [
                { name: 'time', alias: ['t'], type: 'number', default: 0, description: 'Time value (0-24000)' }
            ],
            defaultTargeter: '@World',
            examples: ['- time{t=0} ', '- time{t=18000} ']
        },
        {
            id: 'weather',
            name: 'weather',
            aliases: [],
            category: 'utility',
            description: 'Changes the weather in the world.',
            attributes: [
                { name: 'type', alias: ['t'], type: 'string', default: 'CLEAR', description: 'Weather type: CLEAR, RAIN, THUNDER' },
                { name: 'duration', alias: ['d'], type: 'number', default: 6000, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@World',
            examples: ['- weather{type=RAIN;duration=6000} ', '- weather{t=THUNDER;d=3000} ']
        },
        
        // Items & Inventory
        {
            id: 'removehelditem',
            name: 'removehelditem',
            aliases: ['consumeHeldItem', 'takeHeldItem'],
            category: 'utility',
            description: 'Removes an amount from the caster\'s held item.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount to remove' }
            ],
            defaultTargeter: '@Self',
            examples: ['- removehelditem{amount=1} ', '- removehelditem{a=5} ']
        },
        {
            id: 'consumeslot',
            name: 'consumeslot',
            aliases: ['consumeslotitem'],
            category: 'utility',
            description: 'Removes an item from a specific inventory slot.',
            attributes: [
                { name: 'slot', alias: ['s'], type: 'string', default: 'HAND', description: 'Slot (0-35 or equipment)' },
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount to remove' }
            ],
            defaultTargeter: '@Self',
            examples: ['- consumeslot{slot=0;amount=1} ', '- consumeslot{slot=HAND;a=1} ']
        },
        {
            id: 'decapitate',
            name: 'decapitate',
            aliases: ['dropHead'],
            category: 'utility',
            description: 'Drops a copy of the target player\'s head.',
            attributes: [],
            defaultTargeter: '@trigger',
            examples: ['- decapitate', '- decapitate ']
        },
        
        // Block Mechanics
        {
            id: 'blockdestabilize',
            name: 'blockdestabilize',
            aliases: ['destabilizeBlock', 'destabilizeBlocks'],
            category: 'utility',
            description: 'Turns blocks into falling blocks.',
            attributes: [],
            defaultTargeter: '@BNO{r=5}',
            examples: ['- blockdestabilize ', '- blockdestabilize ']
        },
        {
            id: 'bonemeal',
            name: 'bonemeal',
            aliases: [],
            category: 'utility',
            description: 'Applies a bone meal effect to target blocks.',
            attributes: [
                { name: 'blockFace', alias: ['bf', 'face', 'f'], type: 'string', default: 'UP', description: 'Block face to apply to' }
            ],
            defaultTargeter: '@selflocation',
            examples: ['- bonemeal ', '- bonemeal{bf=UP} ']
        },
        {
            id: 'pushbutton',
            name: 'pushbutton',
            aliases: ['buttonpush'],
            category: 'utility',
            description: 'Pushes a button at the supplied coordinates.',
            attributes: [
                { name: 'x', alias: [], type: 'number', default: 0, description: 'X coordinate' },
                { name: 'y', alias: [], type: 'number', default: 0, description: 'Y coordinate' },
                { name: 'z', alias: [], type: 'number', default: 0, description: 'Z coordinate' },
                { name: 'location', alias: ['loc', 'l'], type: 'string', default: '', description: 'Location (x,y,z)' }
            ],
            defaultTargeter: '@Self',
            examples: ['- pushbutton{x=15;y=67;z=-213} ', '- pushbutton{loc=100,64,100} ']
        },
        
        // Sounds & Effects
        {
            id: 'flames',
            name: 'flames',
            aliases: ['effect:flames', 'e:flames'],
            category: 'effects',
            description: 'Creates flames effect at the location.',
            attributes: [],
            defaultTargeter: '@self',
            examples: ['- flames ', '- flames ']
        },
        {
            id: 'ender',
            name: 'Ender',
            aliases: ['effect:ender', 'e:ender'],
            category: 'effects',
            description: 'Plays the effect of an eye of ender breaking.',
            attributes: [],
            defaultTargeter: '@self',
            examples: ['- ender', '- ender ']
        },
        {
            id: 'smoke',
            name: 'Smoke',
            aliases: ['effect:smoke', 'e:smoke'],
            category: 'effects',
            description: 'Creates a smoke effect.',
            attributes: [],
            defaultTargeter: '@self',
            examples: ['- smoke ', '- smoke ']
        },
        {
            id: 'firework',
            name: 'firework',
            aliases: ['fireworks', 'effect:firework', 'e:firework'],
            category: 'effects',
            description: 'Creates a firework effect.',
            attributes: [
                { name: 'type', alias: ['t'], type: 'string', default: 'BALL', description: 'Type: BALL, BALL_LARGE, BURST, CREEPER, STAR' },
                { name: 'power', alias: ['p', 'duration', 'd'], type: 'number', default: 2, description: 'Flight duration' },
                { name: 'flicker', alias: ['f'], type: 'boolean', default: false, description: 'Add flicker effect' },
                { name: 'trail', alias: ['tr'], type: 'boolean', default: false, description: 'Add trail effect' },
                { name: 'colors', alias: ['color', 'c'], type: 'string', default: '#FFFFFF', description: 'Color (RGB or hex)' }
            ],
            defaultTargeter: '@self',
            examples: ['- firework{t=BALL;d=1;f=true;tr=true} ', '- firework{type=STAR;colors=#FF0000} ']
        },
        
        // Advanced Mechanics
        {
            id: 'disengage',
            name: 'disengage',
            aliases: [],
            category: 'movement',
            description: 'Causes the caster to leap backwards away from target.',
            attributes: [
                { name: 'velocity', alias: ['v', 'magnitude'], type: 'number', default: 1, description: 'Velocity of leap' },
                { name: 'velocityy', alias: ['yvelocity', 'vy', 'yv'], type: 'number', default: 0.01337, description: 'Y velocity' }
            ],
            defaultTargeter: '@trigger',
            examples: ['- disengage', '- disengage{v=2;vy=0.5} ']
        },
        {
            id: 'propel',
            name: 'propel',
            aliases: [],
            category: 'movement',
            description: 'Propels the caster towards the target.',
            attributes: [
                { name: 'velocity', alias: ['magnitude', 'v'], type: 'number', default: 1, description: 'Propel velocity' }
            ],
            defaultTargeter: '@target',
            examples: ['- propel{v=1}', '- propel{velocity=2} ']
        },
        {
            id: 'forcepull',
            name: 'forcepull',
            aliases: [],
            category: 'movement',
            description: 'Teleports all targeted entities near the caster.',
            attributes: [
                { name: 'spread', alias: ['s'], type: 'number', default: 0, description: 'Spread from caster' },
                { name: 'vspread', alias: ['spreadv', 'vs'], type: 'number', default: 0, description: 'Vertical spread' }
            ],
            defaultTargeter: '@EIR{r=30}',
            examples: ['- forcepull{spread=5} ', '- forcepull{s=3;vs=1} ']
        },
        {
            id: 'oxygen',
            name: 'oxygen',
            aliases: [],
            category: 'heal',
            description: 'Gives the target player oxygen.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount of oxygen' }
            ],
            defaultTargeter: '@trigger',
            examples: ['- oxygen{amount=10} ', '- oxygen{a=20} ']
        },
        
        // Mob AI & Behavior
        {
            id: 'cleartarget',
            name: 'ClearTarget',
            aliases: ['resetTarget'],
            category: 'control',
            description: 'Forces the target to reset its current target.',
            attributes: [],
            defaultTargeter: '@self',
            examples: ['- cleartarget', '- cleartarget ']
        },
        {
            id: 'remount',
            name: 'remount',
            aliases: [],
            category: 'control',
            description: 'Causes casting mob to remount the mob it spawned riding.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- remount', '- remount ']
        },
        {
            id: 'ejectpassenger',
            name: 'ejectpassenger',
            aliases: ['eject_passenger'],
            category: 'control',
            description: 'Ejects any passengers riding the mob.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- ejectpassenger', '- ejectpassenger ']
        },
        {
            id: 'activatespawner',
            name: 'activateSpawner',
            aliases: ['spawner'],
            category: 'utility',
            description: 'Activates a MythicMobs spawner.',
            attributes: [
                { name: 'spawner', alias: ['s'], type: 'string', default: '', description: 'The name of the spawner' }
            ],
            defaultTargeter: '@Self',
            examples: ['- activateSpawner{spawner=MySpawner} ']
        },
        {
            id: 'addtrade',
            name: 'AddTrade',
            aliases: ['trade'],
            category: 'utility',
            description: 'Adds a trade to villagers or wandering traders.',
            attributes: [
                { name: 'trade', alias: ['t'], type: 'string', default: '', description: 'Trade configuration' }
            ],
            defaultTargeter: '@Target',
            examples: ['- addTrade{trade=MyTrade} ']
        },
        {
            id: 'animatearmorstand',
            name: 'animateArmorStand',
            aliases: ['armorstandanim'],
            category: 'effects',
            description: 'Animates an armor stand through various poses.',
            attributes: [
                { name: 'head', alias: ['h'], type: 'string', default: '0,0,0', description: 'Head rotation (x,y,z)' },
                { name: 'body', alias: ['b'], type: 'string', default: '0,0,0', description: 'Body rotation (x,y,z)' },
                { name: 'leftarm', alias: ['la'], type: 'string', default: '0,0,0', description: 'Left arm rotation' },
                { name: 'rightarm', alias: ['ra'], type: 'string', default: '0,0,0', description: 'Right arm rotation' }
            ],
            defaultTargeter: '@Self',
            examples: ['- animatearmorstand{head=45,0,0;rightarm=90,0,0} ']
        },
        {
            id: 'armanimation',
            name: 'ArmAnimation',
            aliases: ['armanim'],
            category: 'effects',
            description: 'Makes entities swing their arms.',
            attributes: [
                { name: 'offhand', alias: ['off', 'o'], type: 'boolean', default: false, description: 'Use offhand' }
            ],
            defaultTargeter: '@Self',
            examples: ['- armAnimation{offhand=false} ']
        },
        {
            id: 'arrowvolley',
            name: 'arrowVolley',
            aliases: ['volley'],
            category: 'damage',
            description: 'Fires a volley of arrows at the target.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 20, description: 'Number of arrows' },
                { name: 'spread', alias: ['s'], type: 'number', default: 45, description: 'Spread angle' },
                { name: 'velocity', alias: ['v'], type: 'number', default: 10, description: 'Arrow velocity' },
                { name: 'fireTicks', alias: ['ft'], type: 'number', default: 0, description: 'Fire duration' }
            ],
            defaultTargeter: '@Target',
            examples: ['- arrowvolley{amount=20;spread=25;velocity=10} ']
        },
        {
            id: 'attribute',
            name: 'Attribute',
            aliases: ['attr'],
            category: 'utility',
            description: 'Modifies entity attributes.',
            attributes: [
                { name: 'attribute', alias: ['attr', 'a'], type: 'string', default: 'GENERIC_MAX_HEALTH', description: 'Attribute name' },
                { name: 'amount', alias: ['amt'], type: 'number', default: 1, description: 'Modifier amount' },
                { name: 'operation', alias: ['op'], type: 'string', default: 'ADD', description: 'ADD/MULTIPLY_BASE/MULTIPLY_TOTAL' }
            ],
            defaultTargeter: '@Self',
            examples: ['- attribute{attribute=GENERIC_MAX_HEALTH;amount=20;operation=ADD} ']
        },
        {
            id: 'attributemodifier',
            name: 'AttributeModifier',
            aliases: ['attrmod'],
            category: 'utility',
            description: 'Adds or removes attribute modifiers.',
            attributes: [
                { name: 'attribute', alias: ['attr'], type: 'string', default: '', description: 'Attribute name' },
                { name: 'name', alias: ['n'], type: 'string', default: '', description: 'Modifier name' },
                { name: 'amount', alias: ['a'], type: 'number', default: 0, description: 'Modifier amount' }
            ],
            defaultTargeter: '@Self',
            examples: ['- attributemodifier{attribute=GENERIC_ATTACK_DAMAGE;name=strength_buff;amount=5} ']
        },
        {
            id: 'barcreate',
            name: 'barCreate',
            aliases: ['createbar', 'bossbar'],
            category: 'utility',
            description: 'Creates a boss bar for players.',
            attributes: [
                { name: 'id', alias: ['i'], type: 'string', default: '', description: 'Bar unique ID' },
                { name: 'title', alias: ['t'], type: 'string', default: '', description: 'Bar title text' },
                { name: 'progress', alias: ['p'], type: 'number', default: 1.0, description: 'Progress (0.0 to 1.0)' },
                { name: 'color', alias: ['c'], type: 'string', default: 'WHITE', description: 'Bar color' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- barcreate{id=healthbar;title="Boss Health";progress=1.0;color=RED} ']
        },
        {
            id: 'barremove',
            name: 'barRemove',
            aliases: ['removebar'],
            category: 'utility',
            description: 'Removes a boss bar from players.',
            attributes: [
                { name: 'id', alias: ['i'], type: 'string', default: '', description: 'Bar ID to remove' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- barremove{id=healthbar} ']
        },
        {
            id: 'barset',
            name: 'barSet',
            aliases: ['setbar', 'updatebar'],
            category: 'utility',
            description: 'Updates an existing boss bar.',
            attributes: [
                { name: 'id', alias: ['i'], type: 'string', default: '', description: 'Bar ID' },
                { name: 'title', alias: ['t'], type: 'string', default: '', description: 'New title' },
                { name: 'progress', alias: ['p'], type: 'number', default: 1.0, description: 'New progress value' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- barset{id=healthbar;progress=0.5;color=YELLOW} ']
        },
        {
            id: 'blackscreen',
            name: 'BlackScreen',
            aliases: ['fadescreen'],
            category: 'effects',
            description: 'Fades player\'s screen to/from black.',
            attributes: [
                { name: 'fadein', alias: ['fi'], type: 'number', default: 20, description: 'Fade in duration (ticks)' },
                { name: 'stay', alias: ['s'], type: 'number', default: 20, description: 'Stay duration (ticks)' },
                { name: 'fadeout', alias: ['fo'], type: 'number', default: 20, description: 'Fade out duration (ticks)' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- blackscreen{fadein=10;stay=40;fadeout=10} ']
        },
        {
            id: 'blockmask',
            name: 'BlockMask',
            aliases: ['mask'],
            category: 'effects',
            description: 'Creates fake block overlay (client-side).',
            attributes: [
                { name: 'material', alias: ['m', 'type'], type: 'material', default: 'STONE', description: 'Block material' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' },
                { name: 'radius', alias: ['r'], type: 'number', default: 5, description: 'Effect radius' }
            ],
            defaultTargeter: '@Self',
            examples: ['- blockmask{material=GOLD_BLOCK;duration=200;radius=3} ']
        },
        {
            id: 'blockunmask',
            name: 'BlockUnmask',
            aliases: ['unmask'],
            category: 'effects',
            description: 'Removes a block mask effect.',
            attributes: [
                { name: 'radius', alias: ['r'], type: 'number', default: 5, description: 'Effect radius' }
            ],
            defaultTargeter: '@Self',
            examples: ['- blockunmask{radius=3} ']
        },
        {
            id: 'blockphysics',
            name: 'blockPhysics',
            aliases: ['physics'],
            category: 'utility',
            description: 'Toggles block physics in an area.',
            attributes: [
                { name: 'enable', alias: ['e'], type: 'boolean', default: true, description: 'Enable/disable physics' },
                { name: 'radius', alias: ['r'], type: 'number', default: 5, description: 'Effect radius' }
            ],
            defaultTargeter: '@Self',
            examples: ['- blockphysics{enable=false;radius=10} ']
        },
        {
            id: 'blockwave',
            name: 'BlockWave',
            aliases: ['wave'],
            category: 'effects',
            description: 'Creates a wave of blocks that can damage entities. Can be used visually or with velocity for damage effects.',
            attributes: [
                { name: 'material', alias: ['m'], type: 'material', default: 'DIRT', description: 'Block material' },
                { name: 'duration', alias: ['d'], type: 'number', default: 20, description: 'Duration in ticks' },
                { name: 'radius', alias: ['r'], type: 'number', default: 2, description: 'Wave radius' },
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Wave speed' }
            ],
            defaultTargeter: '@Self',
            examples: ['- blockwave{material=SAND;duration=40;radius=3;velocity=2} ']
        },
        {
            id: 'bloodyscreen',
            name: 'BloodyScreen',
            aliases: ['bloodscreen'],
            category: 'effects',
            description: 'Applies bloody screen overlay.',
            attributes: [
                { name: 'duration', alias: ['d'], type: 'number', default: 20, description: 'Duration in ticks' },
                { name: 'intensity', alias: ['i'], type: 'number', default: 1, description: 'Effect intensity' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- bloodyscreen{duration=40;intensity=2} ']
        },
        {
            id: 'bossborder',
            name: 'bossBorder',
            aliases: ['worldborder'],
            category: 'effects',
            description: 'Creates a world border effect.',
            attributes: [
                { name: 'radius', alias: ['r'], type: 'number', default: 10, description: 'Border radius' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- bossborder{radius=20;duration=200} ']
        },
        {
            id: 'bouncy',
            name: 'Bouncy',
            aliases: ['bounce'],
            category: 'control',
            description: 'Makes entities bouncy when landing.',
            attributes: [
                { name: 'multiplier', alias: ['m'], type: 'number', default: 1, description: 'Bounce strength' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Self',
            examples: ['- bouncy{multiplier=2;duration=200} ']
        },
        {
            id: 'breakblock',
            name: 'breakBlock',
            aliases: ['break'],
            category: 'utility',
            description: 'Breaks blocks at target location.',
            attributes: [
                { name: 'doDrops', alias: ['drops'], type: 'boolean', default: true, description: 'Drop items' },
                { name: 'doEffect', alias: ['effect'], type: 'boolean', default: true, description: 'Show break effect' },
                { name: 'useTool', alias: ['tool'], type: 'boolean', default: false, description: 'Use caster\'s tool' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- breakblock{doDrops=true;doEffect=true} ']
        },
        {
            id: 'breakblockandgiveitem',
            name: 'breakBlockAndGiveItem',
            aliases: ['breakgive'],
            category: 'utility',
            description: 'Breaks block and gives item to player.',
            attributes: [
                { name: 'doEffect', alias: ['effect'], type: 'boolean', default: true, description: 'Show break effect' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- breakBlockAndGiveItem{doEffect=true} ']
        },
        {
            id: 'clearexperience',
            name: 'ClearExperience',
            aliases: ['clearxp', 'clearexp'],
            category: 'utility',
            description: 'Clears all experience from target player.',
            attributes: [],
            defaultTargeter: '@Trigger',
            examples: ['- clearexperience ']
        },
        {
            id: 'clearexperiencelevels',
            name: 'ClearExperienceLevels',
            aliases: ['clearlevels'],
            category: 'utility',
            description: 'Clears experience levels from target player.',
            attributes: [],
            defaultTargeter: '@Trigger',
            examples: ['- clearexperiencelevels ']
        },
        {
            id: 'giveexperiencelevels',
            name: 'GiveExperienceLevels',
            aliases: ['givelevels'],
            category: 'utility',
            description: 'Gives experience levels to target player.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Levels to give' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- giveexperiencelevels{amount=5} ']
        },
        {
            id: 'takeexperiencelevels',
            name: 'TakeExperienceLevels',
            aliases: ['takelevels'],
            category: 'utility',
            description: 'Takes experience levels from target player.',
            attributes: [
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Levels to take' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- takeexperiencelevels{amount=5} ']
        },
        {
            id: 'closeinventory',
            name: 'closeInventory',
            aliases: ['closeinv'],
            category: 'utility',
            description: 'Closes the inventory of target player.',
            attributes: [],
            defaultTargeter: '@Trigger',
            examples: ['- closeinventory ']
        },
        {
            id: 'directionalvelocity',
            name: 'DirectionalVelocity',
            aliases: ['dvelocity'],
            category: 'movement',
            description: 'Applies velocity in a specific direction.',
            attributes: [
                { name: 'velocityX', alias: ['vx', 'x'], type: 'number', default: 0, description: 'X velocity' },
                { name: 'velocityY', alias: ['vy', 'y'], type: 'number', default: 0, description: 'Y velocity' },
                { name: 'velocityZ', alias: ['vz', 'z'], type: 'number', default: 0, description: 'Z velocity' }
            ],
            defaultTargeter: '@Self',
            examples: ['- directionalvelocity{vx=1;vy=2;vz=0} ']
        },
        {
            id: 'disguisetarget',
            name: 'disguiseTarget',
            aliases: ['disguise'],
            category: 'effects',
            description: 'Disguises target as another mob type.',
            attributes: [
                { name: 'disguise', alias: ['d', 'type'], type: 'string', default: '', description: 'Disguise type' }
            ],
            defaultTargeter: '@Self',
            examples: ['- disguisetarget{disguise=ZOMBIE} ']
        },
        {
            id: 'disguisemodify',
            name: 'DisguiseModify',
            aliases: ['modifydisguise'],
            category: 'effects',
            description: 'Modifies an existing disguise.',
            attributes: [
                { name: 'property', alias: ['p'], type: 'string', default: '', description: 'Property to modify' },
                { name: 'value', alias: ['v'], type: 'string', default: '', description: 'New value' }
            ],
            defaultTargeter: '@Self',
            examples: ['- disguisemodify{property=baby;value=true} ']
        },
        {
            id: 'enderbeam',
            name: 'EnderBeam',
            aliases: ['beam'],
            category: 'effects',
            description: 'Creates an ender crystal beam effect.',
            attributes: [
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Target',
            examples: ['- enderbeam{duration=200} ']
        },
        {
            id: 'enderdragonresetcrystals',
            name: 'EnderDragonResetCrystals',
            aliases: ['resetcrystals', 'resetEnderResetCrystals'],
            category: 'utility',
            description: 'Generates the EnderDragon crystals if an enderdragon battle is going on in the target location\'s dimension',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- enderDragonResetCrystals @selflocation ~onDamaged =50%']
        },
        {
            id: 'enderdragonsetphase',
            name: 'EnderDragonSetPhase',
            aliases: ['setdragonphase'],
            category: 'control',
            description: 'Sets ender dragon\'s phase.',
            attributes: [
                { name: 'phase', alias: ['p'], type: 'number', default: 0, description: 'Phase number' }
            ],
            defaultTargeter: '@Self',
            examples: ['- enderdragonsetphase{phase=3} ']
        },
        {
            id: 'enderdragonsetrespawnphase',
            name: 'EnderDragonSetRespawnPhase',
            aliases: ['setrespawnphase'],
            category: 'control',
            description: 'Sets ender dragon\'s respawn phase.',
            attributes: [
                { name: 'phase', alias: ['p'], type: 'number', default: 0, description: 'Respawn phase' }
            ],
            defaultTargeter: '@Self',
            examples: ['- enderdragonsetrespawnphase{phase=2} ']
        },
        {
            id: 'enderdragonspawnportal',
            name: 'EnderDragonSpawnPortal',
            aliases: ['spawnportal', 'spawnEnderDragonPortal'],
            category: 'utility',
            description: 'Generates the portal of the EnderDragon battle',
            attributes: [
                { name: 'withPortals', alias: ['wp', 'p'], type: 'boolean', default: false, description: 'Whether to generate the portal of the EnderDragon battle' }
            ],
            defaultTargeter: '@Self',
            examples: ['- enderDragonSpawnPortal @selflocation']
        },
        {
            id: 'equipcopy',
            name: 'EquipCopy',
            aliases: ['copyequip'],
            category: 'utility',
            description: 'Copies equipment from target to caster.',
            attributes: [
                { name: 'slot', alias: ['s'], type: 'string', default: 'ALL', description: 'Equipment slot' }
            ],
            defaultTargeter: '@Target',
            examples: ['- equipcopy{slot=HAND} ']
        },
        {
            id: 'fakeexplosion',
            name: 'FakeExplosion',
            aliases: ['fakeexplode'],
            category: 'effects',
            description: 'Creates explosion effect without damage.',
            attributes: [
                { name: 'power', alias: ['p'], type: 'number', default: 1, description: 'Explosion power' }
            ],
            defaultTargeter: '@Self',
            examples: ['- fakeexplosion{power=3} ']
        },
        {
            id: 'fawepaste',
            name: 'fawePaste',
            aliases: ['paste'],
            category: 'utility',
            description: 'Pastes a WorldEdit/FAWE schematic.',
            attributes: [
                { name: 'schematic', alias: ['s', 'schem'], type: 'string', default: '', description: 'Schematic name' },
                { name: 'id', alias: ['pasteID'], type: 'string', default: '', description: 'Paste identifier' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- fawepaste{schematic=castle;id=mycastle} ']
        },
        {
            id: 'worldeditreplace',
            name: 'WorldEditReplace',
            aliases: ['weReplace'],
            category: 'utility',
            description: 'Replaces blocks in a region using WorldEdit. Needs a @region or similar targeter. Premium-Only mechanic!',
            attributes: [
                { name: 'from', alias: ['f'], type: 'material', default: 'AIR', description: 'The material to replace' },
                { name: 'to', alias: ['t'], type: 'material', default: 'AIR', description: 'The material to set in place of the replaced one' }
            ],
            defaultTargeter: '@Self',
            examples: ['- worldEditReplace{from=STONE;to=AIR} @Region{min=0,0,0;max=100,100,100;world=resources}']
        },
        {
            id: 'geyser',
            name: 'geyser',
            aliases: [],
            category: 'effects',
            description: 'Creates a water geyser effect.',
            attributes: [
                { name: 'height', alias: ['h'], type: 'number', default: 5, description: 'Geyser height' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Self',
            examples: ['- geyser{height=10;duration=200} ']
        },
        {
            id: 'giveitemfromslot',
            name: 'giveItemFromSlot',
            aliases: ['givefromslot'],
            category: 'utility',
            description: 'Gives item from specific inventory slot.',
            attributes: [
                { name: 'slot', alias: ['s'], type: 'number', default: 0, description: 'Slot number' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- giveitemfromslot{slot=5} ']
        },
        {
            id: 'giveitemfromtarget',
            name: 'giveItemFromTarget',
            aliases: ['givefromtarget'],
            category: 'utility',
            description: 'Gives item from target\'s inventory.',
            attributes: [
                { name: 'slot', alias: ['s'], type: 'number', default: 0, description: 'Slot number' }
            ],
            defaultTargeter: '@Target',
            examples: ['- giveitemfromtarget{slot=0} ']
        },
        {
            id: 'guardianbeam',
            name: 'GuardianBeam',
            aliases: ['gbeam'],
            category: 'effects',
            description: 'Creates a guardian beam effect.',
            attributes: [
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Target',
            examples: ['- guardianbeam{duration=200} ']
        },
        {
            id: 'hide',
            name: 'hide',
            aliases: ['invisible'],
            category: 'effects',
            description: 'Hides entity from players.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- hide ']
        },
        {
            id: 'itemspray',
            name: 'itemSpray',
            aliases: ['spray'],
            category: 'effects',
            description: 'Sprays items in all directions.',
            attributes: [
                { name: 'material', alias: ['m'], type: 'material', default: 'STONE', description: 'Item material' },
                { name: 'amount', alias: ['a'], type: 'number', default: 10, description: 'Number of items' },
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Spray velocity' }
            ],
            defaultTargeter: '@Self',
            examples: ['- itemspray{material=DIAMOND;amount=20;velocity=2} ']
        },
        {
            id: 'jsonmessage',
            name: 'jsonMessage',
            aliases: ['jsonmsg'],
            category: 'utility',
            description: 'Sends JSON formatted message.',
            attributes: [
                { name: 'message', alias: ['m', 'msg'], type: 'string', default: '', description: 'JSON message text' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- jsonmessage{message="<json text>"} ']
        },
        {
            id: 'log',
            name: 'Log',
            aliases: [],
            category: 'utility',
            description: 'Logs a message to console.',
            attributes: [
                { name: 'message', alias: ['m', 'msg'], type: 'string', default: '', description: 'Message to log' }
            ],
            defaultTargeter: '@Self',
            examples: ['- log{message="Skill triggered"} ']
        },
        {
            id: 'matchrotation',
            name: 'MatchRotation',
            aliases: ['matchrot'],
            category: 'control',
            description: 'Matches caster\'s rotation to target.',
            attributes: [],
            defaultTargeter: '@Target',
            examples: ['- matchrotation ']
        },
        {
            id: 'modifydamage',
            name: 'ModifyDamage',
            aliases: ['moddamage'],
            category: 'damage',
            description: 'Modifies damage dealt or taken.',
            attributes: [
                { name: 'multiplier', alias: ['m'], type: 'number', default: 1, description: 'Damage multiplier' },
                { name: 'amount', alias: ['a'], type: 'number', default: 0, description: 'Flat damage modifier' }
            ],
            defaultTargeter: '@Self',
            examples: ['- modifydamage{multiplier=2} ']
        },
        {
            id: 'modifyglobalscore',
            name: 'modifyGlobalScore',
            aliases: ['modglobalscore'],
            category: 'utility',
            description: 'Modifies a global scoreboard score.',
            attributes: [
                { name: 'objective', alias: ['obj'], type: 'string', default: '', description: 'Scoreboard objective' },
                { name: 'score', alias: ['s'], type: 'string', default: '', description: 'Score name' },
                { name: 'operation', alias: ['op'], type: 'string', default: 'ADD', description: 'Operation: ADD, SET, MULTIPLY, etc' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Value to use' }
            ],
            defaultTargeter: '@Self',
            examples: ['- modifyglobalscore{objective=kills;score=total;operation=ADD;value=1}']
        },
        {
            id: 'modifytargetscore',
            name: 'modifyTargetScore',
            aliases: ['modtargetscore'],
            category: 'utility',
            description: 'Modifies target\'s scoreboard score.',
            attributes: [
                { name: 'objective', alias: ['obj'], type: 'string', default: '', description: 'Scoreboard objective' },
                { name: 'operation', alias: ['op'], type: 'string', default: 'ADD', description: 'Operation type' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Value to use' }
            ],
            defaultTargeter: '@Target',
            examples: ['- modifytargetscore{objective=deaths;operation=ADD;value=1} ']
        },
        {
            id: 'modifymobscore',
            name: 'modifyMobScore',
            aliases: ['modmobscore'],
            category: 'utility',
            description: 'Modifies mob\'s internal score.',
            attributes: [
                { name: 'score', alias: ['s'], type: 'string', default: '', description: 'Score name' },
                { name: 'operation', alias: ['op'], type: 'string', default: 'ADD', description: 'Operation type' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Value to use' }
            ],
            defaultTargeter: '@Self',
            examples: ['- modifymobscore{score=counter;operation=ADD;value=1} ']
        },
        {
            id: 'modifyscore',
            name: 'modifyScore',
            aliases: ['modscore'],
            category: 'utility',
            description: 'Modifies scoreboard score.',
            attributes: [
                { name: 'objective', alias: ['obj'], type: 'string', default: '', description: 'Scoreboard objective' },
                { name: 'operation', alias: ['op'], type: 'string', default: 'ADD', description: 'Operation type' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Value to use' }
            ],
            defaultTargeter: '@Target',
            examples: ['- modifyscore{objective=points;operation=SET;value=100} ']
        },
        {
            id: 'opentrades',
            name: 'OpenTrades',
            aliases: ['trade'],
            category: 'utility',
            description: 'Opens trading interface with mob.',
            attributes: [],
            defaultTargeter: '@Trigger',
            examples: ['- opentrades ']
        },
        {
            id: 'opencustommenu',
            name: 'OpenCustomMenu',
            aliases: ['openMenu'],
            category: 'utility',
            description: 'Opens a custom menu. Requires MythicMobs Premium or MythicRPG!',
            attributes: [
                { name: 'menu', alias: ['m'], type: 'string', default: 'default', description: 'The menu to open' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- opencustommenu{m=ExampleMenu} @trigger ~onInteract']
        },
        {
            id: 'pickupitem',
            name: 'PickupItem',
            aliases: ['pickup'],
            category: 'utility',
            description: 'Makes mob pick up item entity.',
            attributes: [],
            defaultTargeter: '@EIR{r=10}',
            examples: ['- pickupitem ']
        },
        {
            id: 'playanimation',
            name: 'PlayAnimation',
            aliases: ['playanim'],
            category: 'effects',
            description: 'Plays entity animation.',
            attributes: [
                { name: 'animation', alias: ['a'], type: 'string', default: '', description: 'Animation name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- playanimation{animation=SWING_MAIN_ARM} ']
        },
        {
            id: 'playblockbreaksound',
            name: 'PlayBlockBreakSound',
            aliases: ['blockbreaksound'],
            category: 'effects',
            description: 'Plays block break sound.',
            attributes: [
                { name: 'material', alias: ['m'], type: 'material', default: 'STONE', description: 'Block type' }
            ],
            defaultTargeter: '@Self',
            examples: ['- playblockbreaksound{material=DIAMOND_BLOCK} ']
        },
        {
            id: 'posearmorstand',
            name: 'PoseArmorStand',
            aliases: ['armorstandpose'],
            category: 'control',
            description: 'Sets armor stand pose.',
            attributes: [
                { name: 'head', alias: ['h'], type: 'string', default: '0,0,0', description: 'Head rotation' },
                { name: 'body', alias: ['b'], type: 'string', default: '0,0,0', description: 'Body rotation' },
                { name: 'leftArm', alias: ['la'], type: 'string', default: '0,0,0', description: 'Left arm rotation' },
                { name: 'rightArm', alias: ['ra'], type: 'string', default: '0,0,0', description: 'Right arm rotation' }
            ],
            defaultTargeter: '@Self',
            examples: ['- posearmorstand{head=45,0,0;rightArm=90,0,0} ']
        },
        {
            id: 'potionclear',
            name: 'PotionClear',
            aliases: ['clearpotions'],
            category: 'heal',
            description: 'Removes all potion effects.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- potionclear ']
        },
        {
            id: 'printtree',
            name: 'PrintTree',
            aliases: [],
            category: 'utility',
            description: 'Prints skill tree to console (debug).',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- printtree ']
        },
        {
            id: 'pushblock',
            name: 'PushBlock',
            aliases: ['blockpush'],
            category: 'utility',
            description: 'Pushes block like piston.',
            attributes: [
                { name: 'direction', alias: ['d'], type: 'string', default: 'UP', description: 'Push direction' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- pushblock{direction=UP} ']
        },
        {
            id: 'raytraceto',
            name: 'RayTraceTo',
            aliases: ['raytrace'],
            category: 'utility',
            description: 'Raytraces to target location.',
            attributes: [
                { name: 'accuracy', alias: ['a'], type: 'number', default: 1, description: 'Raytrace accuracy' }
            ],
            defaultTargeter: '@Forward{f=10}',
            examples: ['- raytraceto{accuracy=0.5} ']
        },
        {
            id: 'randommessage',
            name: 'RandomMessage',
            aliases: ['randmsg'],
            category: 'utility',
            description: 'Sends random message from list.',
            attributes: [
                { name: 'messages', alias: ['m'], type: 'string', default: '', description: 'Pipe-separated messages' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- randommessage{messages="Hello!|Hi there!|Greetings!"} ']
        },
        {
            id: 'recoil',
            name: 'Recoil',
            aliases: [],
            category: 'movement',
            description: 'Knocks back in opposite direction.',
            attributes: [
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Recoil strength' }
            ],
            defaultTargeter: '@Self',
            examples: ['- recoil{velocity=2} ']
        },
        {
            id: 'removeowner',
            name: 'RemoveOwner',
            aliases: ['clearowner'],
            category: 'utility',
            description: 'Removes mob\'s owner.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- removeowner ']
        },
        {
            id: 'resetai',
            name: 'ResetAI',
            aliases: [],
            category: 'control',
            description: 'Resets entity\'s AI.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- resetai ']
        },
        {
            id: 'rotatetowards',
            name: 'RotateTowards',
            aliases: ['rotate'],
            category: 'control',
            description: 'Rotates entity towards target.',
            attributes: [
                { name: 'speed', alias: ['s'], type: 'number', default: 1, description: 'Rotation speed' }
            ],
            defaultTargeter: '@Target',
            examples: ['- rotatetowards{speed=0.5} ']
        },
        {
            id: 'runaigoalselector',
            name: 'RunAIGoalSelector',
            aliases: ['rungoal'],
            category: 'control',
            description: 'Executes AI goal selector.',
            attributes: [
                { name: 'goal', alias: ['g'], type: 'string', default: '', description: 'Goal selector name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- runaigoalselector{goal=MeleeAttack} ']
        },
        {
            id: 'runaitargetselector',
            name: 'RunAITargetSelector',
            aliases: ['runtarget'],
            category: 'control',
            description: 'Executes AI target selector.',
            attributes: [
                { name: 'selector', alias: ['s'], type: 'string', default: '', description: 'Target selector name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- runaitargetselector{selector=NearestPlayer} ']
        },
        {
            id: 'saddle',
            name: 'Saddle',
            aliases: [],
            category: 'utility',
            description: 'Puts saddle on mob.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- saddle ']
        },
        {
            id: 'sendactionmessage',
            name: 'sendActionMessage',
            aliases: ['actionmsg'],
            category: 'utility',
            description: 'Sends action bar message.',
            attributes: [
                { name: 'message', alias: ['m', 'msg'], type: 'string', default: '', description: 'Message text' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- sendactionmessage{message="Boss Phase 2!"} ']
        },
        {
            id: 'sendresourcepack',
            name: 'sendResourcePack',
            aliases: ['resourcepack'],
            category: 'utility',
            description: 'Sends resource pack to player.',
            attributes: [
                { name: 'url', alias: ['u'], type: 'string', default: '', description: 'Resource pack URL' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- sendresourcepack{url="http://example.com/pack.zip"} ']
        },
        {
            id: 'sendtoast',
            name: 'sendToast',
            aliases: ['toast'],
            category: 'utility',
            description: 'Sends toast notification.',
            attributes: [
                { name: 'message', alias: ['m'], type: 'string', default: '', description: 'Toast message' },
                { name: 'icon', alias: ['i'], type: 'material', default: 'DIAMOND', description: 'Toast icon' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- sendtoast{message="Achievement!";icon=DIAMOND} ']
        },
        {
            id: 'setblockopen',
            name: 'SetBlockOpen',
            aliases: ['blockopen'],
            category: 'utility',
            description: 'Opens/closes door or gate block.',
            attributes: [
                { name: 'open', alias: ['o'], type: 'boolean', default: true, description: 'Open state' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- setblockopen{open=true} ']
        },
        {
            id: 'setblocktype',
            name: 'SetBlockType',
            aliases: ['setblock'],
            category: 'utility',
            description: 'Changes block type.',
            attributes: [
                { name: 'material', alias: ['m', 'type'], type: 'material', default: 'STONE', description: 'Block material' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- setblocktype{material=DIAMOND_BLOCK} ']
        },
        {
            id: 'setchunkforceloaded',
            name: 'SetChunkForceLoaded',
            aliases: ['forceload'],
            category: 'utility',
            description: 'Force loads/unloads chunk.',
            attributes: [
                { name: 'loaded', alias: ['l'], type: 'boolean', default: true, description: 'Load state' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- setchunkforceloaded{loaded=true} ']
        },
        {
            id: 'setcollidable',
            name: 'SetCollidable',
            aliases: ['collidable'],
            category: 'control',
            description: 'Sets entity collidable state.',
            attributes: [
                { name: 'collidable', alias: ['c'], type: 'boolean', default: true, description: 'Collidable state' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setcollidable{collidable=false} ']
        },
        {
            id: 'setdragonpodium',
            name: 'SetDragonPodium',
            aliases: ['dragonpodium'],
            category: 'utility',
            description: 'Sets dragon podium location.',
            attributes: [],
            defaultTargeter: '@TargetLocation',
            examples: ['- setdragonpodium ']
        },
        {
            id: 'setgamemode',
            name: 'SetGameMode',
            aliases: ['gamemode'],
            category: 'utility',
            description: 'Sets player\'s game mode.',
            attributes: [
                { name: 'mode', alias: ['m'], type: 'string', default: 'SURVIVAL', description: 'Game mode: SURVIVAL, CREATIVE, ADVENTURE, SPECTATOR' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- setgamemode{mode=CREATIVE} ']
        },
        {
            id: 'setgliding',
            name: 'SetGliding',
            aliases: ['glide'],
            category: 'movement',
            description: 'Sets gliding state (elytra).',
            attributes: [
                { name: 'gliding', alias: ['g'], type: 'boolean', default: true, description: 'Gliding state' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setgliding{gliding=true} ']
        },
        {
            id: 'setglobalscore',
            name: 'SetGlobalScore',
            aliases: ['globalscore'],
            category: 'utility',
            description: 'Sets global scoreboard score.',
            attributes: [
                { name: 'objective', alias: ['obj'], type: 'string', default: '', description: 'Objective name' },
                { name: 'score', alias: ['s'], type: 'string', default: '', description: 'Score name' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Score value' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setglobalscore{objective=kills;score=total;value=100}']
        },
        {
            id: 'setinteractionsize',
            name: 'SetInteractionSize',
            aliases: ['interactionsize'],
            category: 'control',
            description: 'Sets interaction entity size.',
            attributes: [
                { name: 'width', alias: ['w'], type: 'number', default: 1, description: 'Width' },
                { name: 'height', alias: ['h'], type: 'number', default: 1, description: 'Height' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setinteractionsize{width=2;height=3} ']
        },
        {
            id: 'setitemgroupcooldown',
            name: 'SetItemGroupCooldown',
            aliases: ['groupcooldown'],
            category: 'utility',
            description: 'Sets cooldown for item group.',
            attributes: [
                { name: 'group', alias: ['g'], type: 'string', default: '', description: 'Item group' },
                { name: 'ticks', alias: ['t'], type: 'number', default: 20, description: 'Cooldown ticks' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- setitemgroupcooldown{group=weapons;ticks=100} ']
        },
        {
            id: 'setdisplayentityitem',
            name: 'SetDisplayEntityItem',
            aliases: ['displayitem'],
            category: 'utility',
            description: 'Sets display entity\'s item.',
            attributes: [
                { name: 'item', alias: ['i'], type: 'material', default: 'STONE', description: 'Item material' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setdisplayentityitem{item=DIAMOND_SWORD} ']
        },
        {
            id: 'setleashholder',
            name: 'SetLeashHolder',
            aliases: ['leash'],
            category: 'control',
            description: 'Sets entity\'s leash holder.',
            attributes: [],
            defaultTargeter: '@Target',
            examples: ['- setleashholder ']
        },
        {
            id: 'setmaterialcooldown',
            name: 'SetMaterialCooldown',
            aliases: ['materialcooldown'],
            category: 'utility',
            description: 'Sets cooldown for material type.',
            attributes: [
                { name: 'material', alias: ['m'], type: 'material', default: 'STONE', description: 'Material type' },
                { name: 'ticks', alias: ['t'], type: 'number', default: 20, description: 'Cooldown ticks' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- setmaterialcooldown{material=ENDER_PEARL;ticks=100} ']
        },
        {
            id: 'setmobcolor',
            name: 'SetMobColor',
            aliases: ['mobcolor'],
            category: 'effects',
            description: 'Sets mob\'s color (sheep, wolves, etc).',
            attributes: [
                { name: 'color', alias: ['c'], type: 'string', default: 'WHITE', description: 'Color name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setmobcolor{color=RED} ']
        },
        {
            id: 'setmobscore',
            name: 'SetMobScore',
            aliases: ['mobscore'],
            category: 'utility',
            description: 'Sets mob\'s internal score.',
            attributes: [
                { name: 'score', alias: ['s'], type: 'string', default: '', description: 'Score name' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Score value' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setmobscore{score=phase;value=2} ']
        },
        {
            id: 'setraidercanjo inraid',
            name: 'SetRaiderCanJoinRaid',
            aliases: ['setCanJoinRaid'],
            category: 'control',
            description: 'Sets if the target raider entity can join a raid or not',
            attributes: [
                { name: 'bool', alias: ['b', 'can', 'c'], type: 'boolean', default: true, description: 'Whether the entity can join the raid' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setraidercanjo inraid{c=false} @self']
        },
        {
            id: 'setraiderpatrolblock',
            name: 'SetRaiderPatrolBlock',
            aliases: ['patrolblock'],
            category: 'control',
            description: 'Sets raider patrol block location.',
            attributes: [],
            defaultTargeter: '@TargetLocation',
            examples: ['- setraiderpatrolblock ']
        },
        {
            id: 'setraiderpatrolleader',
            name: 'SetRaiderPatrolLeader',
            aliases: ['patrolleader'],
            category: 'control',
            description: 'Sets raider as patrol leader.',
            attributes: [
                { name: 'leader', alias: ['l'], type: 'boolean', default: true, description: 'Leader state' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setraiderpatrolleader{leader=true} ']
        },
        {
            id: 'setfaction',
            name: 'SetFaction',
            aliases: ['faction'],
            category: 'control',
            description: 'Sets mob\'s faction.',
            attributes: [
                { name: 'faction', alias: ['f'], type: 'string', default: '', description: 'Faction name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setfaction{faction=hostile} ']
        },
        {
            id: 'setflying',
            name: 'SetFlying',
            aliases: ['fly'],
            category: 'movement',
            description: 'Sets flying state.',
            attributes: [
                { name: 'flying', alias: ['f'], type: 'boolean', default: true, description: 'Flying state' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setflying{flying=true} ']
        },
        {
            id: 'setnodamageticks',
            name: 'SetNoDamageTicks',
            aliases: ['nodamageticks'],
            category: 'control',
            description: 'Sets invulnerability ticks.',
            attributes: [
                { name: 'ticks', alias: ['t'], type: 'number', default: 0, description: 'Invulnerability duration' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setnodamageticks{ticks=20} ']
        },
        {
            id: 'setowner',
            name: 'SetOwner',
            aliases: ['owner'],
            category: 'control',
            description: 'Sets mob\'s owner.',
            attributes: [],
            defaultTargeter: '@Trigger',
            examples: ['- setowner ']
        },
        {
            id: 'setparent',
            name: 'SetParent',
            aliases: ['parent'],
            category: 'control',
            description: 'Sets mob\'s parent entity.',
            attributes: [],
            defaultTargeter: '@Target',
            examples: ['- setparent ']
        },
        {
            id: 'setpathfindingmalus',
            name: 'SetPathfindingMalus',
            aliases: ['pathmalus'],
            category: 'control',
            description: 'Sets pathfinding malus for block types.',
            attributes: [
                { name: 'type', alias: ['t'], type: 'string', default: '', description: 'Block type' },
                { name: 'malus', alias: ['m'], type: 'number', default: 0, description: 'Malus value' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setpathfindingmalus{type=WATER;malus=10} ']
        },
        {
            id: 'setpitch',
            name: 'SetPitch',
            aliases: ['pitch'],
            category: 'control',
            description: 'Sets entity\'s pitch rotation.',
            attributes: [
                { name: 'pitch', alias: ['p'], type: 'number', default: 0, description: 'Pitch angle' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setpitch{pitch=45} ']
        },
        {
            id: 'setpose',
            name: 'SetPose',
            aliases: ['pose'],
            category: 'control',
            description: 'Sets entity\'s pose.',
            attributes: [
                { name: 'pose', alias: ['p'], type: 'string', default: 'STANDING', description: 'Pose: STANDING, SLEEPING, etc' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setpose{pose=SLEEPING} ']
        },
        {
            id: 'setrotation',
            name: 'SetRotation',
            aliases: ['rotation'],
            category: 'control',
            description: 'Sets entity\'s yaw/pitch rotation.',
            attributes: [
                { name: 'yaw', alias: ['y'], type: 'number', default: 0, description: 'Yaw angle' },
                { name: 'pitch', alias: ['p'], type: 'number', default: 0, description: 'Pitch angle' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setrotation{yaw=90;pitch=45} ']
        },
        {
            id: 'settargetscore',
            name: 'SetTargetScore',
            aliases: ['targetscore'],
            category: 'utility',
            description: 'Sets target\'s scoreboard score.',
            attributes: [
                { name: 'objective', alias: ['obj'], type: 'string', default: '', description: 'Objective name' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Score value' }
            ],
            defaultTargeter: '@Target',
            examples: ['- settargetscore{objective=health;value=100} ']
        },
        {
            id: 'settextdisplay',
            name: 'SetTextDisplay',
            aliases: ['textdisplay'],
            category: 'effects',
            description: 'Sets text display entity content.',
            attributes: [
                { name: 'text', alias: ['t'], type: 'string', default: '', description: 'Display text' }
            ],
            defaultTargeter: '@Self',
            examples: ['- settextdisplay{text="<gold>Boss"} ']
        },
        {
            id: 'settonguetarget',
            name: 'SetTongueTarget',
            aliases: ['tongue'],
            category: 'control',
            description: 'Sets frog tongue target.',
            attributes: [],
            defaultTargeter: '@Target',
            examples: ['- settonguetarget ']
        },
        {
            id: 'setscore',
            name: 'SetScore',
            aliases: ['score'],
            category: 'utility',
            description: 'Sets scoreboard score.',
            attributes: [
                { name: 'objective', alias: ['obj'], type: 'string', default: '', description: 'Objective name' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Score value' }
            ],
            defaultTargeter: '@Target',
            examples: ['- setscore{objective=points;value=100} ']
        },
        {
            id: 'shieldbreak',
            name: 'ShieldBreak',
            aliases: ['breakshield'],
            category: 'damage',
            description: 'Breaks target\'s shield.',
            attributes: [
                { name: 'cooldown', alias: ['cd'], type: 'number', default: 100, description: 'Shield disable ticks' }
            ],
            defaultTargeter: '@Target',
            examples: ['- shieldbreak{cooldown=100} ']
        },
        {
            id: 'shootpotion',
            name: 'ShootPotion',
            aliases: ['potionprojectile'],
            category: 'projectile',
            description: 'Shoots a splash potion.',
            attributes: [
                { name: 'type', alias: ['t'], type: 'string', default: '', description: 'Potion effect type' },
                { name: 'duration', alias: ['d'], type: 'number', default: 100, description: 'Effect duration' },
                { name: 'level', alias: ['l'], type: 'number', default: 1, description: 'Effect level' }
            ],
            defaultTargeter: '@Target',
            examples: ['- shootpotion{type=POISON;duration=200;level=2} ']
        },
        {
            id: 'shootskull',
            name: 'ShootSkull',
            aliases: ['skull'],
            category: 'projectile',
            description: 'Shoots wither skull projectile.',
            attributes: [
                { name: 'charged', alias: ['c'], type: 'boolean', default: false, description: 'Blue charged skull' },
                { name: 'yield', alias: ['y'], type: 'number', default: 1, description: 'Explosion yield' }
            ],
            defaultTargeter: '@Target',
            examples: ['- shootskull{charged=true;yield=3} ']
        },
        {
            id: 'shootshulkerbullet',
            name: 'ShootShulkerBullet',
            aliases: ['shulkerbullet'],
            category: 'projectile',
            description: 'Shoots shulker bullet projectile.',
            attributes: [],
            defaultTargeter: '@Target',
            examples: ['- shootshulkerbullet ']
        },
        {
            id: 'showentity',
            name: 'ShowEntity',
            aliases: ['show'],
            category: 'effects',
            description: 'Makes hidden entity visible.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- showentity ']
        },
        {
            id: 'skybox',
            name: 'Skybox',
            aliases: [],
            category: 'effects',
            description: 'Creates custom skybox effect for player.',
            attributes: [
                { name: 'type', alias: ['t'], type: 'string', default: '', description: 'Skybox type' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- skybox{type=nether} ']
        },
        {
            id: 'smokeswirl',
            name: 'SmokeSwirl',
            aliases: ['swirl'],
            category: 'effects',
            description: 'Creates swirling smoke effect.',
            attributes: [
                { name: 'radius', alias: ['r'], type: 'number', default: 1, description: 'Swirl radius' }
            ],
            defaultTargeter: '@Self',
            examples: ['- smokeswirl{radius=2} ']
        },
        {
            id: 'stealitem',
            name: 'StealItem',
            aliases: ['steal'],
            category: 'utility',
            description: 'Steals item from target inventory.',
            attributes: [
                { name: 'slot', alias: ['s'], type: 'number', default: -1, description: 'Inventory slot (-1 for any)' }
            ],
            defaultTargeter: '@Target',
            examples: ['- stealitem{slot=-1} ']
        },
        {
            id: 'stopsound',
            name: 'StopSound',
            aliases: [],
            category: 'effects',
            description: 'Stops playing sounds for player.',
            attributes: [
                { name: 'sound', alias: ['s'], type: 'string', default: '', description: 'Sound name to stop' }
            ],
            defaultTargeter: '@Trigger',
            examples: ['- stopsound{sound=entity.wither.ambient} ']
        },
        {
            id: 'speak',
            name: 'Speak',
            aliases: ['say'],
            category: 'utility',
            description: 'Makes mob speak in chat.',
            attributes: [
                { name: 'message', alias: ['m', 'msg'], type: 'string', default: '', description: 'Message to speak' },
                { name: 'radius', alias: ['r'], type: 'number', default: 12, description: 'Hearing radius' }
            ],
            defaultTargeter: '@Self',
            examples: ['- speak{message="Face my wrath!";radius=20} ']
        },
        {
            id: 'spin',
            name: 'Spin',
            aliases: ['rotate'],
            category: 'control',
            description: 'Spins entity continuously.',
            attributes: [
                { name: 'speed', alias: ['s'], type: 'number', default: 10, description: 'Rotation speed' },
                { name: 'duration', alias: ['d'], type: 'number', default: 20, description: 'Duration in ticks' }
            ],
            defaultTargeter: '@Self',
            examples: ['- spin{speed=20;duration=100} ']
        },
        {
            id: 'spring',
            name: 'Spring',
            aliases: [],
            category: 'movement',
            description: 'Springs entity into air.',
            attributes: [
                { name: 'velocity', alias: ['v'], type: 'number', default: 1, description: 'Spring velocity' }
            ],
            defaultTargeter: '@Self',
            examples: ['- spring{velocity=2} ']
        },
        {
            id: 'stopusingitem',
            name: 'StopUsingItem',
            aliases: ['stopuse'],
            category: 'control',
            description: 'Stops entity from using item.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- stopusingitem ']
        },
        {
            id: 'suicide',
            name: 'Suicide',
            aliases: ['kill', 'die'],
            category: 'utility',
            description: 'Kills the caster mob.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- suicide ']
        },
        {
            id: 'summonareaeffectcloud',
            name: 'SummonAreaEffectCloud',
            aliases: ['areacloud'],
            category: 'effects',
            description: 'Summons area effect cloud.',
            attributes: [
                { name: 'duration', alias: ['d'], type: 'number', default: 200, description: 'Cloud duration' },
                { name: 'radius', alias: ['r'], type: 'number', default: 3, description: 'Effect radius' }
            ],
            defaultTargeter: '@Self',
            examples: ['- summonareaeffectcloud{duration=300;radius=5} ']
        },
        {
            id: 'swingoffhand',
            name: 'SwingOffhand',
            aliases: ['offhandswing'],
            category: 'effects',
            description: 'Swings offhand arm.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- swingoffhand ']
        },
        {
            id: 'addtag',
            name: 'AddTag',
            aliases: ['tag'],
            category: 'utility',
            description: 'Adds scoreboard tag to entity.',
            attributes: [
                { name: 'tag', alias: ['t'], type: 'string', default: '', description: 'Tag name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- addtag{tag=marked} ']
        },
        {
            id: 'removetag',
            name: 'RemoveTag',
            aliases: ['untag'],
            category: 'utility',
            description: 'Removes scoreboard tag from entity.',
            attributes: [
                { name: 'tag', alias: ['t'], type: 'string', default: '', description: 'Tag name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- removetag{tag=marked} ']
        },
        {
            id: 'togglelever',
            name: 'ToggleLever',
            aliases: ['lever'],
            category: 'utility',
            description: 'Toggles lever block.',
            attributes: [],
            defaultTargeter: '@TargetLocation',
            examples: ['- togglelever ']
        },
        {
            id: 'togglepiston',
            name: 'TogglePiston',
            aliases: ['piston'],
            category: 'utility',
            description: 'Toggles piston block.',
            attributes: [],
            defaultTargeter: '@TargetLocation',
            examples: ['- togglepiston ']
        },
        {
            id: 'togglesitting',
            name: 'ToggleSitting',
            aliases: ['sit'],
            category: 'control',
            description: 'Toggles sitting state.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- togglesitting ']
        },
        {
            id: 'totemofundying',
            name: 'TotemOfUndying',
            aliases: ['totem'],
            category: 'heal',
            description: 'Applies totem of undying effect.',
            attributes: [],
            defaultTargeter: '@Self',
            examples: ['- totemofundying ']
        },
        {
            id: 'tracklocation',
            name: 'TrackLocation',
            aliases: ['track'],
            category: 'utility',
            description: 'Tracks location for later use.',
            attributes: [
                { name: 'name', alias: ['n'], type: 'string', default: '', description: 'Location identifier' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- tracklocation{name=spawn} ']
        },
        {
            id: 'undopaste',
            name: 'UndoPaste',
            aliases: ['undo'],
            category: 'utility',
            description: 'Undoes FAWE paste operation.',
            attributes: [
                { name: 'id', alias: ['pasteID'], type: 'string', default: '', description: 'Paste identifier' }
            ],
            defaultTargeter: '@Self',
            examples: ['- undopaste{id=mycastle} ']
        },
        {
            id: 'variableadd',
            name: 'VariableAdd',
            aliases: ['varadd'],
            category: 'meta',
            description: 'Adds to variable value.',
            attributes: [
                { name: 'var', alias: ['variable', 'v'], type: 'string', default: '', description: 'Variable name' },
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount to add' }
            ],
            defaultTargeter: '@Self',
            examples: ['- variableadd{var=counter;amount=1} ']
        },
        {
            id: 'variablesubtract',
            name: 'VariableSubtract',
            aliases: ['varsub'],
            category: 'meta',
            description: 'Subtracts from variable value.',
            attributes: [
                { name: 'var', alias: ['variable', 'v'], type: 'string', default: '', description: 'Variable name' },
                { name: 'amount', alias: ['a'], type: 'number', default: 1, description: 'Amount to subtract' }
            ],
            defaultTargeter: '@Self',
            examples: ['- variablesubtract{var=counter;amount=1} ']
        },
        {
            id: 'variablemath',
            name: 'VariableMath',
            aliases: ['varmath'],
            category: 'meta',
            description: 'Performs math on variable.',
            attributes: [
                { name: 'var', alias: ['variable', 'v'], type: 'string', default: '', description: 'Variable name' },
                { name: 'equation', alias: ['eq'], type: 'string', default: '', description: 'Math equation' }
            ],
            defaultTargeter: '@Self',
            examples: ['- variablemath{var=health;equation="<caster.var.health> * 2"} ']
        },
        {
            id: 'setvariable',
            name: 'SetVariable',
            aliases: ['var'],
            category: 'meta',
            description: 'Sets variable value.',
            attributes: [
                { name: 'var', alias: ['variable', 'v'], type: 'string', default: '', description: 'Variable name' },
                { name: 'value', alias: ['val'], type: 'string', default: '', description: 'Value to set' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setvariable{var=phase;value=2} ']
        },
        {
            id: 'setvariablelocation',
            name: 'SetVariableLocation',
            aliases: ['varloc'],
            category: 'meta',
            description: 'Sets variable to location.',
            attributes: [
                { name: 'var', alias: ['variable', 'v'], type: 'string', default: '', description: 'Variable name' }
            ],
            defaultTargeter: '@TargetLocation',
            examples: ['- setvariablelocation{var=spawnpoint} ']
        },
        {
            id: 'variableunset',
            name: 'VariableUnset',
            aliases: ['varunset'],
            category: 'meta',
            description: 'Removes/unsets variable.',
            attributes: [
                { name: 'var', alias: ['variable', 'v'], type: 'string', default: '', description: 'Variable name' }
            ],
            defaultTargeter: '@Self',
            examples: ['- variableunset{var=tempdata} ']
        },
        {
            id: 'variablemove',
            name: 'VariableMove',
            aliases: ['moveVariable', 'moveVar', 'varMove'],
            category: 'meta',
            description: 'Moves an already created variable across names and/or registries. Can make two registries reference the same variable.',
            attributes: [
                { name: 'from', alias: [], type: 'string', default: '', required: true, description: 'Variable to move (scope.name format)' },
                { name: 'to', alias: [], type: 'string', default: '', required: true, description: 'Target location (scope.name format)' },
                { name: 'removeOld', alias: [], type: 'boolean', default: false, description: 'Remove from old registry' },
                { name: 'createNew', alias: [], type: 'boolean', default: false, description: 'Create new variable at target' },
                { name: 'inheritExpirationTime', alias: [], type: 'boolean', default: true, description: 'Inherit expiration time if createNew=true' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- setVar{name=caster.item;type=ITEM;value=slot:HAND} @self',
                '- movevariable{from=caster.item;to=skill.item} @self'
            ]
        },
        // Additional mechanics from user packs
        {
            id: 'fakeexplode',
            name: 'FakeExplode',
            aliases: ['fakeexplosion'],
            category: 'visual',
            description: 'Creates a fake explosion visual effect without actually damaging blocks or entities.',
            attributes: [
                { name: 'power', alias: ['p'], type: 'number', default: 4, description: 'Explosion power (visual size)' }
            ],
            defaultTargeter: '@Self',
            examples: ['- fakeexplode{power=4} ']
        },
        {
            id: 'setstance',
            name: 'SetStance',
            aliases: ['stance'],
            category: 'control',
            description: 'Sets the stance of the mob, which can be used in conditions and skill checks.',
            attributes: [
                { name: 'stance', alias: ['s'], type: 'string', default: '', description: 'The stance name to set' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setstance{stance=aggressive} ']
        },
        {
            id: 'damagepercent',
            name: 'DamagePercent',
            aliases: ['percentdamage'],
            category: 'damage',
            description: 'Deals damage as a percentage of the target\'s max health.',
            attributes: [
                { name: 'percent', alias: ['p'], type: 'number', default: 10, description: 'Percentage of max health to damage' }
            ],
            defaultTargeter: '@Target',
            examples: ['- damagepercent{percent=25} ']
        },
        {
            id: 'modifyprojectile',
            name: 'ModifyProjectile',
            aliases: ['projectilemodify'],
            category: 'projectile',
            description: 'Modifies properties of the current projectile, missile, or orbital that activated the mechanic.',
            attributes: [
                { name: 'trait', alias: ['t'], type: 'string', default: 'VELOCITY', description: 'Trait to modify: INERTIA, POWER, VELOCITY, RADIUS, YOFFSET' },
                { name: 'action', alias: ['a'], type: 'string', default: 'MULTIPLY', description: 'Action: ADD, SET, MULTIPLY' },
                { name: 'value', alias: ['v'], type: 'number', default: 0, description: 'Value for modification' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- modifyProjectile{trait=VELOCITY;action=MULTIPLY;value=0.95}',
                '- modifyProjectile{t=POWER;a=ADD;v=5}'
            ]
        },
        {
            id: 'projectilevelocity',
            name: 'ProjectileVelocity',
            aliases: ['pvelocity'],
            category: 'projectile',
            description: 'Modifies velocity of calling projectile or missile. Works like Velocity mechanic but for projectiles.',
            attributes: [
                { name: 'mode', alias: ['m'], type: 'string', default: 'SET', description: 'Operation: SET, ADD, REMOVE, DIVIDE, MULTIPLY' },
                { name: 'velocityx', alias: ['vx', 'x'], type: 'number', default: 1, description: 'X-axis velocity (can be negative)' },
                { name: 'velocityy', alias: ['vy', 'y'], type: 'number', default: 1, description: 'Y-axis velocity (can be negative)' },
                { name: 'velocityz', alias: ['vz', 'z'], type: 'number', default: 1, description: 'Z-axis velocity (can be negative)' },
                { name: 'relative', alias: ['r'], type: 'boolean', default: true, description: 'Relative to projectile facing (z=forward, y=up, x=left/right)' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- projectilevelocity{mode=ADD;vz=0.3}',
                '- pvelocity{mode=MULTIPLY;vx=0.5;vy=0.5;vz=0.5}'
            ]
        },
        {
            id: 'setprojectiledirection',
            name: 'SetProjectileDirection',
            aliases: [],
            category: 'projectile',
            description: 'Sets calling projectile\'s movement direction to given target location.',
            attributes: [
                { name: 'magnitude', alias: ['m'], type: 'number', default: 1, description: 'Change magnitude (1=perfect, <1=interpolated)' }
            ],
            defaultTargeter: '@ProjectileForward',
            examples: [
                '- setprojectiledirection @ProjectileForward{f=10;rot=45}',
                '- setprojectiledirection{m=0.5} @target'
            ]
        },
        {
            id: 'setprojectilebulletmodel',
            name: 'SetProjectileBulletModel',
            aliases: [],
            category: 'projectile',
            description: 'Sets CustomModelData on current projectile\'s bullet. DISPLAY bullet types only.',
            attributes: [
                { name: 'value', alias: ['v', 'model', 'm'], type: 'number', default: 0, description: 'Model number to set' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- setProjectileBulletModel{model=1234}',
                '- setProjectileBulletModel{v=5000}'
            ]
        },
        {
            id: 'endprojectile',
            name: 'EndProjectile',
            aliases: ['terminateProjectile', 'terminateproj', 'endproj', 'stopprojectile', 'stopproj'],
            category: 'projectile',
            description: 'Terminates projectile this mechanic was called from, activating its onEnd skill.',
            attributes: [
                { name: 'conditions', alias: ['condition', 'cond', 'con'], type: 'string', default: '', description: 'Conditions to check before terminating' }
            ],
            defaultTargeter: '@Self',
            examples: [
                '- endprojectile',
                '- endprojectile ?hasaura{auraName=explode}'
            ]
        },
        {
            id: 'setcolor',
            name: 'SetColor',
            aliases: ['color'],
            category: 'visual',
            description: 'Sets the color of a colorable mob like sheep, shulker, or llama.',
            attributes: [
                { name: 'color', alias: ['c'], type: 'string', default: 'WHITE', description: 'Color name (e.g., RED, BLUE, GREEN)' }
            ],
            defaultTargeter: '@Self',
            examples: ['- setcolor{color=RED} ']
        },
        {
            id: 'teleportto',
            name: 'TeleportTo',
            aliases: ['tpto'],
            category: 'movement',
            description: 'Teleports the caster to the target location or entity.',
            attributes: [
                { name: 'spread', alias: ['s'], type: 'number', default: 0, description: 'Random spread around target' }
            ],
            defaultTargeter: '@Target',
            examples: ['- teleportto ', '- teleportto{spread=2} ']
        },
        {
            id: 'title',
            name: 'Title',
            aliases: [],
            category: 'message',
            description: 'Sends a title message to the target player.',
            attributes: [
                { name: 'title', alias: ['t'], type: 'string', default: '', description: 'Main title text' },
                { name: 'subtitle', alias: ['st', 's'], type: 'string', default: '', description: 'Subtitle text' },
                { name: 'fadeIn', alias: ['fi'], type: 'number', default: 10, description: 'Fade in time in ticks' },
                { name: 'stay', alias: [], type: 'number', default: 70, description: 'Stay time in ticks' },
                { name: 'fadeOut', alias: ['fo'], type: 'number', default: 20, description: 'Fade out time in ticks' }
            ],
            defaultTargeter: '@Target',
            examples: ['- title{title="Warning!";subtitle="Boss incoming";fadeIn=10;stay=40;fadeOut=10} ']
        }

        // ═══════════════════════════════════════════════════════════
        // DATABASE: 245+ COMPLETE MECHANICS
        // All mechanics from documentation plus additional user-reported ones
        // Full MythicMobs mechanic coverage achieved 🎉
        // ═══════════════════════════════════════════════════════════
    ],

    /**
     * Get mechanic by name or alias
     */
    getMechanic(name) {
        if (!name) return null;
        const normalized = name.toLowerCase();
        return this.mechanics.find(m => 
            m.name.toLowerCase() === normalized || 
            m.id.toLowerCase() === normalized ||
            m.aliases.some(a => a.toLowerCase() === normalized)
        );
    },

    /**
     * Get all mechanics in a category
     */
    getMechanicsByCategory(category) {
        return this.mechanics.filter(m => m.category === category);
    },

    /**
     * Fuzzy match score (0-1, higher is better)
     * Calculates similarity between search query and target string
     */
    fuzzyScore(query, target) {
        const q = query.toLowerCase();
        const t = target.toLowerCase();
        
        // Exact match = perfect score
        if (t === q) return 1.0;
        
        // Contains exact = high score
        if (t.includes(q)) return 0.9;
        
        // Sequential character match with gaps
        let score = 0;
        let qIndex = 0;
        let lastMatchIndex = -1;
        let consecutiveMatches = 0;
        
        for (let i = 0; i < t.length && qIndex < q.length; i++) {
            if (t[i] === q[qIndex]) {
                score += 1;
                
                // Bonus for consecutive matches
                if (i === lastMatchIndex + 1) {
                    consecutiveMatches++;
                    score += consecutiveMatches * 0.5;
                } else {
                    consecutiveMatches = 0;
                }
                
                // Bonus for matching at word start
                if (i === 0 || t[i-1] === ' ' || t[i-1] === '_') {
                    score += 2;
                }
                
                lastMatchIndex = i;
                qIndex++;
            }
        }
        
        // All characters must match
        if (qIndex < q.length) return 0;
        
        // Normalize by query length
        return score / (q.length * 3);
    },

    /**
     * Search mechanics by query with fuzzy matching and relevance scoring
     * Returns mechanics sorted by relevance
     */
    searchMechanics(query) {
        if (!query) return this.mechanics;
        
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        this.mechanics.forEach(mechanic => {
            let bestScore = 0;
            let matchReason = '';
            
            // Score name match (highest priority)
            const nameScore = this.fuzzyScore(lowerQuery, mechanic.name);
            if (nameScore > bestScore) {
                bestScore = nameScore * 2.0; // Name matches get 2x weight
                matchReason = 'name';
            }
            
            // Score alias matches
            mechanic.aliases.forEach(alias => {
                const aliasScore = this.fuzzyScore(lowerQuery, alias);
                if (aliasScore > bestScore / 2) { // Compare to weighted best
                    bestScore = Math.max(bestScore, aliasScore * 1.5); // Aliases get 1.5x weight
                    matchReason = 'alias';
                }
            });
            
            // Score description match (lower priority)
            if (mechanic.description.toLowerCase().includes(lowerQuery)) {
                const descScore = 0.5; // Fixed moderate score for description matches
                if (descScore > bestScore / 2) {
                    bestScore = Math.max(bestScore, descScore);
                    matchReason = 'description';
                }
            }
            
            // Include if score above threshold
            if (bestScore > 0.3) {
                results.push({
                    mechanic,
                    score: bestScore,
                    matchReason
                });
            }
        });
        
        // Sort by score (descending)
        results.sort((a, b) => b.score - a.score);
        
        return results.map(r => r.mechanic);
    },

    /**
     * Get all available categories with mechanic counts
     */
    getCategorySummary() {
        const summary = {};
        Object.keys(this.categories).forEach(key => {
            summary[key] = {
                ...this.categories[key],
                count: this.getMechanicsByCategory(key).length
            };
        });
        return summary;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MECHANICS_DATA;
}

// Make available globally
window.MECHANICS_DATA = MECHANICS_DATA;
window.INHERITED_PARTICLE_ATTRIBUTES = INHERITED_PARTICLE_ATTRIBUTES;

// Loaded silently
