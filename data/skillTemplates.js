/**
 * Pre-Made Skill Line Templates
 * Corrected and expanded collection of skill line templates
 * Organized by context (mob vs skill) and category
 * NO internal skill names or "Skills:" - these are pure skill lines
 */

const SKILL_TEMPLATES = {
    mob: {
        combat: [
            // === EASY COMBAT ===
            {
                id: 'mob_melee_damage',
                name: 'Basic Damage',
                description: 'Deals 10 damage on attack',
                skillLine: '- damage{a=10} @Target ~onAttack',
                category: 'combat',
                icon: '⚔️',
                difficulty: 'easy'
            },
            {
                id: 'mob_ignite_attack',
                name: 'Fire Strike',
                description: 'Sets target on fire for 5 seconds',
                skillLine: '- ignite{ticks=100} @Target ~onAttack',
                category: 'combat',
                icon: '🔥',
                difficulty: 'easy'
            },
            {
                id: 'mob_poison_attack',
                name: 'Poison Strike',
                description: 'Poisons target for 10 seconds',
                skillLine: '- potion{type=POISON;duration=200;level=2} @Target ~onAttack',
                category: 'combat',
                icon: '🧪',
                difficulty: 'easy'
            },
            {
                id: 'mob_wither_attack',
                name: 'Wither Strike',
                description: 'Applies wither effect on attack',
                skillLine: '- potion{type=WITHER;duration=100;level=1} @Target ~onAttack',
                category: 'combat',
                icon: '💀',
                difficulty: 'easy'
            },
            {
                id: 'mob_blindness_attack',
                name: 'Blinding Strike',
                description: 'Blinds target for 5 seconds',
                skillLine: '- potion{type=BLINDNESS;duration=100;level=1} @Target ~onAttack',
                category: 'combat',
                icon: '😵',
                difficulty: 'easy'
            },
            {
                id: 'mob_knockback',
                name: 'Knockback Strike',
                description: 'Pushes target back when attacking',
                skillLine: '- throw{v=1.5;vy=0.5} @Target ~onAttack',
                category: 'combat',
                icon: '💨',
                difficulty: 'easy'
            },
            {
                id: 'mob_heal_attack',
                name: 'Life Steal',
                description: 'Heals self when attacking',
                skillLine: '- heal{a=5} @Self ~onAttack',
                category: 'combat',
                icon: '💚',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE COMBAT ===
            {
                id: 'mob_retaliation',
                name: 'Retaliation',
                description: 'Damages attacker when hit',
                skillLine: '- damage{a=5} @Trigger ~onDamaged',
                category: 'combat',
                icon: '⚡',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_arrow_volley',
                name: 'Arrow Volley',
                description: 'Fires 20 arrows at target',
                skillLine: '- arrowvolley{a=20;s=25;v=10;f=50;rd=200} @Target ~onAttack',
                category: 'combat',
                icon: '🏹',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_aoe_damage',
                name: 'Area Explosion',
                description: 'Damages all nearby entities',
                skillLine: '- damage{a=8} @EntitiesInRadius{r=5} ~onDamaged',
                category: 'combat',
                icon: '💥',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_signal_minions',
                name: 'Signal Attack',
                description: 'Signals nearby minions to attack',
                skillLine: '- signal{s=ATTACK} @MobsInRadius{r=10;t=Minion} ~onDamaged',
                category: 'combat',
                icon: '📡',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_leap_attack',
                name: 'Leap Strike',
                description: 'Leaps at target and damages',
                skillLine: '- leap{v=1;vy=1} @Target ~onAttack\n- delay 10\n- damage{a=15} @Target ~onAttack',
                category: 'combat',
                icon: '🦘',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_pull_damage',
                name: 'Pull & Crush',
                description: 'Pulls target close and damages',
                skillLine: '- pull{v=3} @Target ~onAttack\n- delay 5\n- damage{a=12} @Target ~onAttack',
                category: 'combat',
                icon: '🧲',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_chain_hit',
                name: 'Chain Attack',
                description: 'Damages target and nearby enemies',
                skillLine: '- damage{a=10} @Target ~onAttack\n- damage{a=5} @EntitiesInRadius{r=3} ~onAttack',
                category: 'combat',
                icon: '⛓️',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_execute',
                name: 'Execute',
                description: 'Extra damage to low health targets',
                skillLine: '- damage{a=30} @Target ~onAttack ?targethealthbelow{a=30;p=true}',
                category: 'combat',
                icon: '💀',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_critical_strike',
                name: 'Critical Strike',
                description: '20% chance for double damage',
                skillLine: '- damage{a=20} @Target ~onAttack ?chance{c=0.2}',
                category: 'combat',
                icon: '💥',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED COMBAT ===
            {
                id: 'mob_ignite_throw',
                name: 'Burning Toss',
                description: 'Sets on fire and throws',
                skillLine: '- ignite{ticks=200} @Target ~onAttack\n- throw{v=2;vy=1} @Target ~onAttack\n- effect:particles{p=flame;a=30} @Target ~onAttack',
                category: 'combat',
                icon: '🔥',
                difficulty: 'advanced'
            },
            {
                id: 'mob_lightning_warn',
                name: 'Lightning Warning',
                description: 'Strikes lightning with message',
                skillLine: '- lightning @Target ~onAttack\n- message{m="<red>⚡ Lightning Strike!"} @PIR{r=20} ~onAttack',
                category: 'combat',
                icon: '⚡',
                difficulty: 'advanced'
            },
            {
                id: 'mob_charge_attack',
                name: 'Charge Attack',
                description: 'Charges forward dealing damage',
                skillLine: '- lunge{v=2} @Target ~onAttack\n- delay 10\n- damage{a=20} @EntitiesInLine{r=1.5;l=8} ~onAttack\n- effect:particles{p=crit_magic;a=50} @Self ~onAttack',
                category: 'combat',
                icon: '🏃',
                difficulty: 'advanced'
            },
            {
                id: 'mob_shockwave',
                name: 'Shockwave',
                description: 'Circular shockwave with knockback',
                skillLine: '- throw{v=3;vy=1.5} @EntitiesInRadius{r=8} ~onDamaged\n- damage{a=12} @EntitiesInRadius{r=8} ~onDamaged\n- effect:particlering{p=sweep_attack;r=8;a=100} @Self ~onDamaged\n- sound{s=entity.ender_dragon.flap;v=2} @Self ~onDamaged',
                category: 'combat',
                icon: '💫',
                difficulty: 'advanced'
            },
            {
                id: 'mob_rage_mode',
                name: 'Rage Mode',
                description: 'Enrages at low health',
                skillLine: '- potion{type=INCREASE_DAMAGE;duration=200;level=2} @Self ~onDamaged ?healthbelow{a=30;p=true}\n- potion{type=SPEED;duration=200;level=1} @Self ~onDamaged ?healthbelow{a=30;p=true}\n- effect:particles{p=angry_villager;a=20} @Self ~onDamaged ?healthbelow{a=30;p=true}',
                category: 'combat',
                icon: '😠',
                difficulty: 'advanced'
            },
            {
                id: 'mob_vampire_drain',
                name: 'Vampiric Drain',
                description: 'Steals health from target',
                skillLine: '- damage{a=8} @Target ~onAttack\n- heal{a=8} @Self ~onAttack\n- effect:particleline{p=damage_indicator;a=20;db=1;dr=0.1} @Target ~onAttack',
                category: 'combat',
                icon: '🧛',
                difficulty: 'advanced'
            },
            {
                id: 'mob_meteor_strike',
                name: 'Meteor Strike',
                description: 'Shoots fireball at target with explosion',
                skillLine: '- shoot{type=FIREBALL;yield=2;incendiary=false} @Target ~onAttack\n- delay 20\n- damage{a=25} @EntitiesInRadius{r=4} ~onAttack\n- effect:explosion @Target ~onAttack',
                category: 'combat',
                icon: '☄️',
                difficulty: 'advanced'
            },
            {
                id: 'mob_blade_storm',
                name: 'Blade Storm',
                description: 'Spins dealing AoE damage',
                skillLine: '- damage{a=5} @EntitiesInRadius{r=4;repeat=10;repeatInterval=2} ~onAttack\n- effect:particlesphere{p=sweep_attack;r=4;a=100;repeat=10;repeatInterval=2} @Self ~onAttack\n- throw{v=0.5;vy=0.2} @EntitiesInRadius{r=4;repeat=10;repeatInterval=2} ~onAttack',
                category: 'combat',
                icon: '🌪️',
                difficulty: 'advanced'
            },
            {
                id: 'mob_frost_bite',
                name: 'Frost Bite',
                description: 'Slows and damages with cold',
                skillLine: '- damage{a=6} @Target ~onAttack\n- potion{type=SLOW;duration=100;level=2} @Target ~onAttack\n- effect:particles{p=snowflake;a=15} @Target ~onAttack',
                category: 'combat',
                icon: '❄️',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_shield_bash',
                name: 'Shield Bash',
                description: 'Knockback with temporary invulnerability',
                skillLine: '- throw{v=2;vy=1} @Target ~onAttack\n- shield{a=10;d=40} @Self ~onAttack\n- sound{s=item.shield.block;v=1;p=0.8} @Self ~onAttack',
                category: 'combat',
                icon: '🛡️',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_ground_slam',
                name: 'Ground Slam',
                description: 'AoE knockback and damage',
                skillLine: '- damage{a=12} @EntitiesInRadius{r=5} ~onAttack\n- throw{v=1.5;vy=1.2} @EntitiesInRadius{r=5} ~onAttack\n- effect:blockmask{m=CRACKED_STONE_BRICKS;r=5;d=40} @Self ~onAttack',
                category: 'combat',
                icon: '💥',
                difficulty: 'advanced'
            },
            {
                id: 'mob_life_steal',
                name: 'Life Steal',
                description: 'Heals when dealing damage',
                skillLine: '- damage{a=10} @Target ~onAttack\n- heal{a=5} @Self ~onAttack\n- effect:particleline{p=heart;a=10} @Line{to=@Target} ~onAttack',
                category: 'combat',
                icon: '💉',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_chain_attack',
                name: 'Chain Attack',
                description: 'Damage jumps to nearby enemies',
                skillLine: '- damage{a=8} @Target ~onAttack\n- projectile{onTick=mob_chain_tick;i=1;v=10;hnp=true;hs=0.3;vs=0.3} @EIR{r=8;limit=3} ~onAttack',
                category: 'combat',
                icon: '⛓️',
                difficulty: 'advanced'
            },
            {
                id: 'mob_counter_attack',
                name: 'Counter Attack',
                description: 'Reflects damage when hit',
                skillLine: '- damage{a=<trigger.damage>} @Trigger ~onDamaged\n- effect:particles{p=sweep_attack;a=10} @Self ~onDamaged\n- sound{s=entity.player.attack.strong;v=1;p=1.2} @Self ~onDamaged',
                category: 'combat',
                icon: '⚡',
                difficulty: 'advanced'
            },
            {
                id: 'mob_blood_rage',
                name: 'Blood Rage',
                description: 'Gains strength when low HP',
                skillLine: '- potion{type=INCREASE_DAMAGE;duration=200;level=3} @Self ~onTimer:100 ?healthbelow{a=40;p=true}\n- potion{type=SPEED;duration=200;level=2} @Self ~onTimer:100 ?healthbelow{a=40;p=true}',
                category: 'combat',
                icon: '🩸',
                difficulty: 'intermediate'
            },
            {
                id: 'mob_backstab',
                name: 'Backstab',
                description: 'Extra damage from behind',
                skillLine: '- damage{a=20} @Target ~onAttack ?targetnotlookingatme\n- effect:particles{p=crit;a=20} @Target ~onAttack ?targetnotlookingatme',
                category: 'combat',
                icon: '🗡️',
                difficulty: 'advanced'
            },
            {
                id: 'mob_explosive_death',
                name: 'Explosive Death',
                description: 'Explodes on death',
                skillLine: '- explosion{yield=2;fire=false} @Self ~onDeath\n- damage{a=15} @EntitiesInRadius{r=4} ~onDeath\n- effect:particles{p=explosion_large;a=10} @Self ~onDeath',
                category: 'combat',
                icon: '💣',
                difficulty: 'intermediate'
            }
        ],
        
        effects: [
            // === EASY EFFECTS ===
            {
                id: 'effect_flame_trail',
                name: 'Flame Trail',
                description: 'Leaves flame particles',
                skillLine: '- effect:particles{p=flame;a=5;hs=0.2;vs=0.2} @Self ~onTimer:20',
                category: 'effects',
                icon: '🔥',
                difficulty: 'easy'
            },
            {
                id: 'effect_hearts',
                name: 'Heart Particles',
                description: 'Shows heart particles',
                skillLine: '- effect:particles{p=heart;a=3} @Self ~onTimer:40',
                category: 'effects',
                icon: '❤️',
                difficulty: 'easy'
            },
            {
                id: 'effect_sparkle',
                name: 'Sparkle Effect',
                description: 'Sparkles with enchanted particles',
                skillLine: '- effect:particles{p=enchanted_hit;a=10} @Self ~onTimer:30',
                category: 'effects',
                icon: '✨',
                difficulty: 'easy'
            },
            {
                id: 'effect_smoke_puff',
                name: 'Smoke Puff',
                description: 'Puffs of smoke periodically',
                skillLine: '- effect:particles{p=large_smoke;a=8;vy=0.5} @Self ~onTimer:60',
                category: 'effects',
                icon: '💨',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE EFFECTS ===
            {
                id: 'effect_particle_ring',
                name: 'Particle Ring',
                description: 'Circular particle effect',
                skillLine: '- effect:particlering{p=flame;r=3;a=50;y=1} @Self ~onTimer:40',
                category: 'effects',
                icon: '⭕',
                difficulty: 'intermediate'
            },
            {
                id: 'effect_particle_sphere',
                name: 'Particle Sphere',
                description: 'Spherical particle effect',
                skillLine: '- effect:particlesphere{p=enchanted_hit;r=2;a=30} @Self ~onTimer:40',
                category: 'effects',
                icon: '🔮',
                difficulty: 'intermediate'
            },
            {
                id: 'effect_sound_ambient',
                name: 'Ambient Sound',
                description: 'Plays eerie ambient sound',
                skillLine: '- sound{s=ambient.cave;v=0.5;p=0.8} @Self ~onTimer:100',
                category: 'effects',
                icon: '🔊',
                difficulty: 'intermediate'
            },
            {
                id: 'effect_lightning_visual',
                name: 'Visual Lightning',
                description: 'Lightning effect without damage',
                skillLine: '- effect:lightning @Self ~onTimer:80',
                category: 'effects',
                icon: '⚡',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED EFFECTS ===
            {
                id: 'effect_spiral_ascend',
                name: 'Spiral Ascend',
                description: 'Spiral particles going up',
                skillLine: '- effect:particlespiral{p=soul_fire_flame;r=2;ry=5;vy=0.5;a=100;d=80} @Self ~onTimer:100',
                category: 'effects',
                icon: '🌀',
                difficulty: 'advanced'
            },
            {
                id: 'effect_aura_glow',
                name: 'Aura Glow',
                description: 'Glowing aura around mob',
                skillLine: '- effect:particles{p=glow;a=20;hs=1;vs=1;s=0.01} @Self ~onTimer:20',
                category: 'effects',
                icon: '✨',
                difficulty: 'easy'
            },
            {
                id: 'effect_ender_trail',
                name: 'Ender Trail',
                description: 'Portal particles following mob',
                skillLine: '- effect:particles{p=portal;a=10;hs=0.5;vs=0.5} @Self ~onTimer:10',
                category: 'effects',
                icon: '🌌',
                difficulty: 'easy'
            },
            {
                id: 'effect_blood_drip',
                name: 'Blood Drip',
                description: 'Dripping blood particles when low HP',
                skillLine: '- effect:particles{p=block_marker{block=redstone_block};a=5;vy=-0.3} @Self ~onTimer:30 ?healthbelow{a=50;p=true}',
                category: 'effects',
                icon: '🩸',
                difficulty: 'intermediate'
            },
            {
                id: 'effect_orbital_particles',
                name: 'Orbital Particles',
                description: 'Particles orbit around mob',
                skillLine: '- effect:particleorbital{p=enchanted_hit;r=2;a=20;repeat=20;repeatInterval=1} @Self ~onTimer:40',
                category: 'effects',
                icon: '🌌',
                difficulty: 'advanced'
            },
            {
                id: 'effect_particle_line_trail',
                name: 'Particle Trail',
                description: 'Line of particles to target',
                skillLine: '- effect:particleline{p=flame;a=50;db=0.5;dr=0.1} @Target ~onAttack',
                category: 'effects',
                icon: '➖',
                difficulty: 'advanced'
            },
            {
                id: 'effect_explosion_visual',
                name: 'Visual Explosion',
                description: 'Explosion effect without damage',
                skillLine: '- effect:explosion @Self ~onDamaged\n- effect:particles{p=explosion_large;a=10} @Self ~onDamaged\n- sound{s=entity.generic.explode;v=1} @Self ~onDamaged',
                category: 'effects',
                icon: '💥',
                difficulty: 'advanced'
            }
        ],
        
        summons: [
            // === EASY SUMMONS ===
            {
                id: 'summon_basic_minion',
                name: 'Summon Minion',
                description: 'Spawns a friendly zombie',
                skillLine: '- summon{type=ZOMBIE;duration=200} @Self ~onSpawn',
                category: 'summons',
                icon: '🧟',
                difficulty: 'easy'
            },
            {
                id: 'summon_wolf_pack',
                name: 'Wolf Pack',
                description: 'Summons 3 wolves',
                skillLine: '- summon{type=WOLF;amount=3;duration=300} @Self ~onCombat',
                category: 'summons',
                icon: '🐺',
                difficulty: 'easy'
            },
            {
                id: 'summon_skeleton_archer',
                name: 'Skeleton Archer',
                description: 'Summons skeleton with bow',
                skillLine: '- summon{type=SKELETON;duration=200} @Self ~onDamaged',
                category: 'summons',
                icon: '💀',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE SUMMONS ===
            {
                id: 'summon_mythmob',
                name: 'Summon MythicMob',
                description: 'Summons custom MythicMob',
                skillLine: '- summonmob{mob=CustomMinion;amount=2;radius=3} @Self ~onCombat',
                category: 'summons',
                icon: '👾',
                difficulty: 'intermediate'
            },
            {
                id: 'summon_circle',
                name: 'Circle Summon',
                description: 'Summons in a circle pattern',
                skillLine: '- summon{type=ZOMBIE;amount=5;radius=5;yaw=spread} @Self ~onCombat',
                category: 'summons',
                icon: '⭕',
                difficulty: 'intermediate'
            },
            {
                id: 'summon_defend',
                name: 'Defensive Summon',
                description: 'Summons guards when damaged',
                skillLine: '- summon{type=IRON_GOLEM;amount=2;duration=300} @Self ~onDamaged ?chance{c=0.3}',
                category: 'summons',
                icon: '🛡️',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED SUMMONS ===
            {
                id: 'summon_reinforcements',
                name: 'Call Reinforcements',
                description: 'Summons multiple MythicMobs at low health',
                skillLine: '- summonmob{mob=Elite_Guard;amount=2;radius=4;yaw=spread} @Self ~onDamaged ?healthbelow{a=50;p=true}\n- message{m="<red>Reinforcements arrive!"} @PIR{r=20} ~onDamaged ?healthbelow{a=50;p=true}',
                category: 'summons',
                icon: '📯',
                difficulty: 'advanced'
            },
            {
                id: 'summon_necromancy',
                name: 'Necromancy',
                description: 'Raises undead from corpses',
                skillLine: '- summon{type=ZOMBIE;amount=3;radius=5;duration=200} @Self ~onKillPlayer\n- effect:particles{p=soul;a=30} @Self ~onKillPlayer',
                category: 'summons',
                icon: '☠️',
                difficulty: 'advanced'
            },
            {
                id: 'summon_split',
                name: 'Split on Death',
                description: 'Spawns smaller versions on death',
                skillLine: '- summonmob{mob=<caster.name>_Small;amount=2;radius=2} @Self ~onDeath',
                category: 'summons',
                icon: '🪓',
                difficulty: 'advanced'
            },
            {
                id: 'summon_wave',
                name: 'Summon Wave',
                description: 'Summons multiple waves of minions',
                skillLine: '- summon{type=ZOMBIE;amount=3;radius=5} @Self ~onCombat\n- delay 100\n- summon{type=SKELETON;amount=2;radius=5} @Self ~onCombat\n- delay 100\n- summon{type=SPIDER;amount=2;radius=5} @Self ~onCombat',
                category: 'summons',
                icon: '🌊',
                difficulty: 'advanced'
            }
        ],
        
        projectiles: [
            // === EASY PROJECTILES ===
            {
                id: 'proj_simple',
                name: 'Simple Projectile',
                description: 'Basic damage projectile',
                skillLine: '- projectile{onTick=- damage{a=10} @EIR{r=2};v=4;i=1;d=100} @Target ~onAttack',
                category: 'projectiles',
                icon: '🎯',
                difficulty: 'easy'
            },
            {
                id: 'proj_fireball',
                name: 'Fireball',
                description: 'Explosive fire projectile',
                skillLine: '- projectile{onTick=- effect:particles{p=flame;a=10} @origin;onEnd=- damage{a=15} @EIR{r=3};v=3;i=1;d=100} @Target ~onAttack',
                category: 'projectiles',
                icon: '🔥',
                difficulty: 'easy'
            },
            {
                id: 'proj_ice_shard',
                name: 'Ice Shard',
                description: 'Slowing ice projectile',
                skillLine: '- projectile{onTick=- effect:particles{p=snowflake;a=8} @origin;onEnd=- potion{type=SLOW;duration=60;level=2} @EIR{r=2};v=5;i=1;d=80} @Target ~onAttack',
                category: 'projectiles',
                icon: '❄️',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE PROJECTILES ===
            {
                id: 'proj_missile',
                name: 'Homing Missile',
                description: 'Seeks target with flame trail',
                skillLine: '- missile{onTick=- effect:particles{p=flame;a=10} @origin;onEnd=- damage{a=20} @EIR{r=3};v=1.5;i=1;t=15;ht=10;hr=20} @Target ~onAttack',
                category: 'projectiles',
                icon: '🚀',
                difficulty: 'intermediate'
            },
            {
                id: 'proj_multi_shot',
                name: 'Multi-Shot',
                description: 'Fires 3 projectiles in spread',
                skillLine: '- projectile{onEnd=- damage{a=8} @EIR{r=2};v=4;i=1;d=80;hy=-10} @Target ~onAttack\n- projectile{onEnd=- damage{a=8} @EIR{r=2};v=4;i=1;d=80} @Target ~onAttack\n- projectile{onEnd=- damage{a=8} @EIR{r=2};v=4;i=1;d=80;hy=10} @Target ~onAttack',
                category: 'projectiles',
                icon: '🎯',
                difficulty: 'intermediate'
            },
            {
                id: 'proj_bounce',
                name: 'Bouncing Projectile',
                description: 'Bounces off surfaces',
                skillLine: '- projectile{onTick=- effect:particles{p=slime;a=5} @origin;onEnd=- damage{a=12} @EIR{r=2};v=3;i=1;d=100;bounce=3;br=0.8} @Target ~onAttack',
                category: 'projectiles',
                icon: '⚽',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED PROJECTILES ===
            {
                id: 'proj_explosive',
                name: 'Explosive Projectile',
                description: 'Large explosion on impact',
                skillLine: '- projectile{onTick=- effect:particles{p=flame;a=20;s=0;hs=0.2;vs=0.2} @origin;onHit=- damage{a=25} @EIR{r=5};onEnd=- effect:explosion @origin;v=4;i=1;d=200;se=true;sb=true} @Target ~onAttack',
                category: 'projectiles',
                icon: '💣',
                difficulty: 'advanced'
            },
            {
                id: 'proj_chain',
                name: 'Chain Projectile',
                description: 'Splits into multiple on hit',
                skillLine: '- projectile{onHit=- damage{a=10} @PIR{r=3};onEnd=- projectile{onEnd=- damage{a=5} @EIR{r=2};v=3;i=1;d=50} @PIR{r=3;limit=3};v=4;i=1;d=100} @Target ~onAttack',
                category: 'projectiles',
                icon: '⛓️',
                difficulty: 'advanced'
            },
            {
                id: 'proj_vortex',
                name: 'Vortex Projectile',
                description: 'Pulls and damages enemies',
                skillLine: '- projectile{onTick=- pull{v=1} @EIR{r=4};onTick=- damage{a=2} @EIR{r=2};onTick=- effect:particlespiral{p=portal;r=3;a=20} @origin;v=2;i=2;d=100} @Target ~onAttack',
                category: 'projectiles',
                icon: '🌀',
                difficulty: 'advanced'
            },
            {
                id: 'proj_laser',
                name: 'Laser Beam',
                description: 'Continuous damage beam',
                skillLine: '- projectile{onTick=- damage{a=3} @EIR{r=1.5};onTick=- effect:particleline{p=crit_magic;a=30;db=0.3;dr=0.05} @forward{f=1};v=8;i=1;d=80;mr=0} @Target ~onAttack',
                category: 'projectiles',
                icon: '⚡',
                difficulty: 'advanced'
            },
            {
                id: 'proj_scatter_shot',
                name: 'Scatter Shot',
                description: 'Fires projectiles in all directions',
                skillLine: '- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=0;hp=0} @Self ~onAttack\n- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=45;hp=0} @Self ~onAttack\n- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=90;hp=0} @Self ~onAttack\n- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=135;hp=0} @Self ~onAttack\n- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=180;hp=0} @Self ~onAttack\n- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=225;hp=0} @Self ~onAttack\n- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=270;hp=0} @Self ~onAttack\n- projectile{onEnd=- damage{a=6} @EIR{r=2};v=3;i=1;d=60;hy=315;hp=0} @Self ~onAttack',
                category: 'projectiles',
                icon: '💫',
                difficulty: 'advanced'
            },
            {
                id: 'proj_poison_arrow',
                name: 'Poison Arrow',
                description: 'Arrow that poisons target',
                skillLine: '- shoot{type=ARROW;v=4} @Target ~onAttack\n- projectile{onEnd=- potion{type=POISON;duration=100;level=2} @EIR{r=2};v=4;i=1;d=100} @Target ~onAttack',
                category: 'projectiles',
                icon: '🏹',
                difficulty: 'intermediate'
            }
        ],
        
        utility: [
            // === EASY UTILITY ===
            {
                id: 'util_teleport',
                name: 'Teleport',
                description: 'Teleports to target',
                skillLine: '- teleport @Target ~onCombat',
                category: 'utility',
                icon: '🌀',
                difficulty: 'easy'
            },
            {
                id: 'util_message',
                name: 'Send Message',
                description: 'Broadcasts message to nearby players',
                skillLine: '- message{m="<red>Boss spawned!"} @PIR{r=50} ~onSpawn',
                category: 'utility',
                icon: '💬',
                difficulty: 'easy'
            },
            {
                id: 'util_mount',
                name: 'Mount Player',
                description: 'Player rides the mob',
                skillLine: '- mount @Trigger ~onInteract',
                category: 'utility',
                icon: '🐴',
                difficulty: 'easy'
            },
            {
                id: 'util_swap_health',
                name: 'Health Swap',
                description: 'Swaps health with target',
                skillLine: '- swapHealth @Target ~onAttack',
                category: 'utility',
                icon: '💫',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE UTILITY ===
            {
                id: 'util_shield',
                name: 'Damage Shield',
                description: 'Absorbs damage',
                skillLine: '- shield{a=20;d=100} @Self ~onCombat',
                category: 'utility',
                icon: '🛡️',
                difficulty: 'intermediate'
            },
            {
                id: 'util_disguise',
                name: 'Disguise',
                description: 'Changes appearance',
                skillLine: '- disguise{d=PLAYER;pn=Notch} @Self ~onSpawn',
                category: 'utility',
                icon: '🎭',
                difficulty: 'intermediate'
            },
            {
                id: 'util_fly_players',
                name: 'Grant Flight',
                description: 'Allows nearby players to fly',
                skillLine: '- fly{duration=100} @PIR{r=10} @onCombat',
                category: 'utility',
                icon: '🕊️',
                difficulty: 'intermediate'
            },
            {
                id: 'util_prison',
                name: 'Ice Prison',
                description: 'Traps target in ice temporarily',
                skillLine: '- blockwave{m=ICE;r=3;d=60;v=1} @Target ~onAttack\n- freeze{d=60} @Target ~onAttack',
                category: 'utility',
                icon: '🧊',
                difficulty: 'advanced'
            },
            {
                id: 'util_silence',
                name: 'Silence',
                description: 'Prevents target from using skills',
                skillLine: '- silence{d=100} @Target ~onAttack\n- message{m="<dark_purple>You have been silenced!"} @Target ~onAttack',
                category: 'utility',
                icon: '🤐',
                difficulty: 'intermediate'
            },
            {
                id: 'util_disarm',
                name: 'Disarm',
                description: 'Removes target weapon',
                skillLine: '- removeHeldItem @Target ~onAttack\n- effect:particles{p=item_crack{item=iron_sword};a=20} @Target ~onAttack',
                category: 'utility',
                icon: '🗡️',
                difficulty: 'intermediate'
            },
            {
                id: 'util_set_time',
                name: 'Set Time',
                description: 'Changes time for nearby players',
                skillLine: '- time{mode=SET;amount=18000;personal=true} @PIR{r=30} ~onCombat',
                category: 'utility',
                icon: '🕐',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED UTILITY ===
            {
                id: 'util_command_execute',
                name: 'Execute Command',
                description: 'Runs console command',
                skillLine: '- command{c="give <trigger.name> diamond 1";asop=true} @Trigger ~onDeath',
                category: 'utility',
                icon: '⚙️',
                difficulty: 'advanced'
            },
            {
                id: 'util_bar_message',
                name: 'Action Bar Message',
                description: 'Shows message on action bar',
                skillLine: '- actionbarmessage{m="<gold>Boss Health: <&health>/<&maxhealth>";duration=40;repeat=20;repeatInterval=20} @PIR{r=50} ~onCombat',
                category: 'utility',
                icon: '📊',
                difficulty: 'advanced'
            },
            {
                id: 'util_boss_bar',
                name: 'Boss Bar',
                description: 'Shows custom boss bar',
                skillLine: '- bossbar{msg="<red>Elite Boss";color=RED;style=NOTCHED_10;duration=999999} @PIR{r=50} ~onSpawn',
                category: 'utility',
                icon: '📏',
                difficulty: 'advanced'
            },
            {
                id: 'util_gravity_flip',
                name: 'Gravity Flip',
                description: 'Reverses gravity for targets',
                skillLine: '- setgravity{g=-0.08;d=100} @PIR{r=5} ~onAttack',
                category: 'utility',
                icon: '⬆️',
                difficulty: 'advanced'
            },
            {
                id: 'util_cleanse',
                name: 'Cleanse',
                description: 'Removes negative effects',
                skillLine: '- potion{type=CLEAR} @Self ~onTimer:200\n- effect:particles{p=happy_villager;a=20} @Self ~onTimer:200',
                category: 'utility',
                icon: '✨',
                difficulty: 'intermediate'
            },
            {
                id: 'util_phase',
                name: 'Phase Shift',
                description: 'Becomes invulnerable briefly',
                skillLine: '- modifyTargetable{t=false;d=60} @Self ~onDamaged ?chance{c=0.3}\n- potion{type=INVISIBILITY;duration=60;level=1} @Self ~onDamaged ?chance{c=0.3}',
                category: 'utility',
                icon: '👻',
                difficulty: 'advanced'
            },
            {
                id: 'util_taunt',
                name: 'Taunt',
                description: 'Forces nearby enemies to target',
                skillLine: '- taunt{d=100} @MIR{r=10} ~onTimer:100\n- message{m="<red><mob.name> taunts you!"} @MIR{r=10} ~onTimer:100',
                category: 'utility',
                icon: '🎭',
                difficulty: 'intermediate'
            },
            {
                id: 'util_fear',
                name: 'Fear',
                description: 'Forces targets to flee',
                skillLine: '- flee{s=2;d=100;ce=true} @PIR{r=8} ~onCombat\n- message{m="<dark_purple>You are terrified!"} @PIR{r=8} ~onCombat',
                category: 'utility',
                icon: '😱',
                difficulty: 'advanced'
            },
            {
                id: 'util_Rally',
                name: 'Rally Cry',
                description: 'Buffs nearby allies',
                skillLine: '- potion{type=INCREASE_DAMAGE;duration=200;level=1} @MIR{r=10} ~onTimer:200\n- potion{type=DAMAGE_RESISTANCE;duration=200;level=1} @MIR{r=10} ~onTimer:200\n- effect:particlesphere{p=enchanted_hit;r=10;a=50} @Self ~onTimer:200',
                category: 'utility',
                icon: '📯',
                difficulty: 'advanced'
            },
            {
                id: 'util_mark',
                name: 'Mark Target',
                description: 'Marks target for increased damage',
                skillLine: '- setScore{objective=marked;value=1} @Target ~onAttack\n- effect:particles{p=crit_magic;a=30;repeat=100;repeatInterval=10} @Target ~onAttack',
                category: 'utility',
                icon: '🎯',
                difficulty: 'advanced'
            },
            {
                id: 'util_siphon',
                name: 'Mana Siphon',
                description: 'Drains resource from target',
                skillLine: '- removeSkillCooldown{s=all} @Self ~onAttack\n- effect:particleline{p=portal;a=20} @Line{to=@Target} ~onAttack',
                category: 'utility',
                icon: '🔮',
                difficulty: 'advanced'
            },
            {
                id: 'util_weather',
                name: 'Storm Call',
                description: 'Changes weather',
                skillLine: '- weather{type=THUNDER;duration=600} @World ~onCombat\n- message{m="<dark_gray>Storm clouds gather..."} @World ~onCombat',
                category: 'utility',
                icon: '⛈️',
                difficulty: 'advanced'
            },
            {
                id: 'util_levitate',
                name: 'Levitate',
                description: 'Lifts target into air',
                skillLine: '- potion{type=LEVITATION;duration=100;level=3} @Target ~onAttack\n- effect:particles{p=cloud;a=20;vy=0.3} @Target ~onAttack',
                category: 'utility',
                icon: '☁️',
                difficulty: 'intermediate'
            },
            {
                id: 'util_orbital',
                name: 'Orbital Minions',
                description: 'Summons orbiting defenders',
                skillLine: '- orbit{mob=OrbitalDefender;r=3;points=3;duration=200;interval=10} @Self ~onSpawn',
                category: 'utility',
                icon: '🌐',
                difficulty: 'advanced'
            }
        ]
    },
    
    skill: {
        damage: [
            // === EASY DAMAGE ===
            {
                id: 'skill_damage_basic',
                name: 'Basic Damage',
                description: 'Simple damage mechanic',
                skillLine: '- damage{a=10} @Target',
                category: 'damage',
                icon: '⚔️',
                difficulty: 'easy'
            },
            {
                id: 'skill_ignite',
                name: 'Set Fire',
                description: 'Sets target on fire',
                skillLine: '- ignite{ticks=100} @Target',
                category: 'damage',
                icon: '🔥',
                difficulty: 'easy'
            },
            {
                id: 'skill_poison',
                name: 'Poison',
                description: 'Poisons target',
                skillLine: '- potion{type=POISON;duration=100;level=2} @Target',
                category: 'damage',
                icon: '🧪',
                difficulty: 'easy'
            },
            {
                id: 'skill_lightning',
                name: 'Lightning Strike',
                description: 'Strikes with lightning',
                skillLine: '- lightning @Target',
                category: 'damage',
                icon: '⚡',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE DAMAGE ===
            {
                id: 'skill_percent_damage',
                name: 'Percent Damage',
                description: 'Deals 20% max health damage',
                skillLine: '- damage{a=20;m=0;am=20;pi=true} @Target',
                category: 'damage',
                icon: '💯',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_damage_radius',
                name: 'Area Damage',
                description: 'Damages all nearby enemies',
                skillLine: '- damage{a=12} @EntitiesInRadius{r=5;t=MONSTER}',
                category: 'damage',
                icon: '💥',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_wither',
                name: 'Wither Effect',
                description: 'Applies wither to target',
                skillLine: '- potion{type=WITHER;duration=100;level=2} @Target',
                category: 'damage',
                icon: '💀',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED DAMAGE ===
            {
                id: 'skill_execute',
                name: 'Execute',
                description: 'Massive damage to low health targets',
                skillLine: '- damage{a=50} @Target ?targethealthbelow{a=30;p=true}\n- damage{a=10} @Target ?targethealthabove{a=30;p=true}',
                category: 'damage',
                icon: '💀',
                difficulty: 'advanced'
            },
            {
                id: 'skill_chain_lightning',
                name: 'Chain Lightning',
                description: 'Lightning that chains between enemies',
                skillLine: '- lightning @Target\n- delay 5\n- lightning @EntitiesInRadius{r=5;limit=3}\n- delay 5\n- lightning @EntitiesInRadius{r=8;limit=2}',
                category: 'damage',
                icon: '⚡',
                difficulty: 'advanced'
            },
            {
                id: 'skill_damage_over_time',
                name: 'Damage Over Time',
                description: 'Deals damage every second',
                skillLine: '- damage{a=5;repeat=10;repeatInterval=20} @Target',
                category: 'damage',
                icon: '🩸',
                difficulty: 'advanced'
            },
            {
                id: 'skill_combo_strike',
                name: 'Combo Strike',
                description: 'Multi-hit combo attack',
                skillLine: '- damage{a=5} @Target\n- delay 3\n- damage{a=7} @Target\n- delay 3\n- damage{a=10} @Target\n- effect:particles{p=crit;a=20} @Target',
                category: 'damage',
                icon: '🥊',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_ground_pound',
                name: 'Ground Pound',
                description: 'AoE damage with knockback',
                skillLine: '- damage{a=15} @EntitiesInRadius{r=5}\n- throw{v=1;vy=1.5} @EntitiesInRadius{r=5}\n- effect:particlering{p=block_crack{block=stone};r=5;a=100;y=0.1} @Self\n- sound{s=entity.generic.explode;v=1;p=0.8} @Self',
                category: 'damage',
                icon: '💥',
                difficulty: 'advanced'
            },
            {
                id: 'skill_frost_nova',
                name: 'Frost Nova',
                description: 'Freezing AoE that slows and damages',
                skillLine: '- damage{a=8} @EntitiesInRadius{r=6}\n- potion{type=SLOW;duration=100;level=3} @EntitiesInRadius{r=6}\n- effect:particlesphere{p=snowflake;r=6;a=150} @Self\n- sound{s=block.glass.break;v=1;p=0.5} @Self',
                category: 'damage',
                icon: '❄️',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_meteor_shower',
                name: 'Meteor Shower',
                description: 'Multiple fireballs in a pattern',
                skillLine: '- shoot{type=FIREBALL;yield=1} @Target\n- delay 10\n- shoot{type=FIREBALL;yield=1} @Ring{radius=5;points=3}\n- delay 10\n- shoot{type=FIREBALL;yield=1} @Ring{radius=8;points=5}\n- delay 20\n- damage{a=20} @EntitiesInRadius{r=10}',
                category: 'damage',
                icon: '☄️',
                difficulty: 'advanced'
            },
            {
                id: 'skill_bleed',
                name: 'Bleeding Strike',
                description: 'Initial damage plus bleed DoT',
                skillLine: '- damage{a=12} @Target\n- damage{a=2;repeat=10;repeatInterval=20} @Target\n- effect:particles{p=block_marker{block=redstone_block};a=3;vy=-0.2;repeat=10;repeatInterval=20} @Target',
                category: 'damage',
                icon: '🩸',
                difficulty: 'advanced'
            }
        ],
        
        healing: [
            // === EASY HEALING ===
            {
                id: 'skill_heal_basic',
                name: 'Basic Heal',
                description: 'Heals target for 10 HP',
                skillLine: '- heal{a=10} @Target',
                category: 'healing',
                icon: '💚',
                difficulty: 'easy'
            },
            {
                id: 'skill_heal_self',
                name: 'Self Heal',
                description: 'Heals caster',
                skillLine: '- heal{a=5} @Self',
                category: 'healing',
                icon: '❤️',
                difficulty: 'easy'
            },
            {
                id: 'skill_regen',
                name: 'Regeneration',
                description: 'Grants regeneration effect',
                skillLine: '- potion{type=REGENERATION;duration=100;level=2} @Target',
                category: 'healing',
                icon: '💗',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE HEALING ===
            {
                id: 'skill_heal_radius',
                name: 'Area Heal',
                description: 'Heals all nearby allies',
                skillLine: '- heal{a=8} @PlayersInRadius{r=10}',
                category: 'healing',
                icon: '💚',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_heal_percent',
                name: 'Percent Heal',
                description: 'Heals for 20% max health',
                skillLine: '- heal{a=20;m=0;am=20;pi=true} @Target',
                category: 'healing',
                icon: '💯',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_absorption',
                name: 'Absorption Hearts',
                description: 'Grants absorption effect',
                skillLine: '- potion{type=ABSORPTION;duration=200;level=2} @Target',
                category: 'healing',
                icon: '💛',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED HEALING ===
            {
                id: 'skill_heal_over_time',
                name: 'Heal Over Time',
                description: 'Heals gradually',
                skillLine: '- heal{a=2;repeat=15;repeatInterval=20} @Target\n- effect:particles{p=heart;a=3;repeat=15;repeatInterval=20} @Target',
                category: 'healing',
                icon: '💗',
                difficulty: 'advanced'
            },
            {
                id: 'skill_lifesteal',
                name: 'Life Steal',
                description: 'Damages and heals caster',
                skillLine: '- damage{a=15} @Target\n- heal{a=15} @Self',
                category: 'healing',
                icon: '🧛',
                difficulty: 'advanced'
            },
            {
                id: 'skill_revive',
                name: 'Revive',
                description: 'Heals to full if below 20% HP',
                skillLine: '- heal{a=999} @Self ?healthbelow{a=20;p=true}\n- effect:particles{p=totem_of_undying;a=50} @Self ?healthbelow{a=20;p=true}',
                category: 'healing',
                icon: '✨',
                difficulty: 'advanced'
            },
            {
                id: 'skill_healing_circle',
                name: 'Healing Circle',
                description: 'Creates healing zone',
                skillLine: '- heal{a=3;repeat=20;repeatInterval=20} @PlayersInRadius{r=6}\n- effect:particlering{p=heart;r=6;a=50;y=0.5;repeat=20;repeatInterval=20} @Self\n- sound{s=block.beacon.ambient;v=0.5;p=1.5;repeat=20;repeatInterval=20} @Self',
                category: 'healing',
                icon: '⭕',
                difficulty: 'advanced'
            },
            {
                id: 'skill_transfusion',
                name: 'Health Transfusion',
                description: 'Transfers health to ally',
                skillLine: '- damage{a=10;pi=false} @Self\n- heal{a=20} @NearestPlayer{r=10}\n- effect:particleline{p=heart;a=30} @Line{to=@NearestPlayer{r=10}}',
                category: 'healing',
                icon: '💉',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_spring_heal',
                name: 'Healing Spring',
                description: 'Ground-based healing over time',
                skillLine: '- blockwave{m=MOSS_BLOCK;r=4;rs=1;d=100;ifo=true} @Self\n- heal{a=2;repeat=25;repeatInterval=20} @PlayersInRadius{r=4}\n- effect:particles{p=happy_villager;a=5;hs=4;vs=0.5;repeat=25;repeatInterval=20} @Self',
                category: 'healing',
                icon: '🌿',
                difficulty: 'advanced'
            }
        ],
        
        movement: [
            // === EASY MOVEMENT ===
            {
                id: 'skill_teleport_target',
                name: 'Teleport to Target',
                description: 'Teleports to target location',
                skillLine: '- teleport @Target',
                category: 'movement',
                icon: '🌀',
                difficulty: 'easy'
            },
            {
                id: 'skill_leap',
                name: 'Leap',
                description: 'Leaps towards target',
                skillLine: '- leap{v=1;vy=1} @Target',
                category: 'movement',
                icon: '🦘',
                difficulty: 'easy'
            },
            {
                id: 'skill_throw_away',
                name: 'Knockback',
                description: 'Pushes target away',
                skillLine: '- throw{v=2;vy=0.5} @Target',
                category: 'movement',
                icon: '💨',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE MOVEMENT ===
            {
                id: 'skill_pull',
                name: 'Pull Target',
                description: 'Pulls target closer',
                skillLine: '- pull{v=3} @Target',
                category: 'movement',
                icon: '🧲',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_lunge',
                name: 'Lunge Attack',
                description: 'Charges forward',
                skillLine: '- lunge{v=2} @Target',
                category: 'movement',
                icon: '🏃',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_velocity_up',
                name: 'Launch Upward',
                description: 'Launches target into air',
                skillLine: '- throw{v=0;vy=3} @Target',
                category: 'movement',
                icon: '⬆️',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED MOVEMENT ===
            {
                id: 'skill_swap_places',
                name: 'Swap Places',
                description: 'Swaps positions with target',
                skillLine: '- teleportto @Target\n- teleport{l=<caster.l>} @Target',
                category: 'movement',
                icon: '🔄',
                difficulty: 'advanced'
            },
            {
                id: 'skill_blink',
                name: 'Blink',
                description: 'Teleports forward 10 blocks',
                skillLine: '- teleport @Forward{f=10;y=true}\n- effect:particles{p=portal;a=30} @Self',
                category: 'movement',
                icon: '✨',
                difficulty: 'advanced'
            },
            {
                id: 'skill_vortex',
                name: 'Vortex Pull',
                description: 'Pulls all nearby enemies',
                skillLine: '- pull{v=2;repeat=10;repeatInterval=2} @EntitiesInRadius{r=10}\n- effect:particlespiral{p=portal;r=8;a=100;repeat=10;repeatInterval=2} @Self',
                category: 'movement',
                icon: '🌀',
                difficulty: 'advanced'
            },
            {
                id: 'skill_dash',
                name: 'Quick Dash',
                description: 'Rapid forward movement',
                skillLine: '- velocity{mode=SET;x=0;y=0.2;z=0;relative=true} @Self\n- velocity{mode=ADD;x=0;y=0;z=3;relative=true} @Self\n- effect:particles{p=cloud;a=20;hs=0.5;vs=0.3} @Self',
                category: 'movement',
                icon: '💨',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_recall',
                name: 'Recall to Origin',
                description: 'Teleports back to spawn point',
                skillLine: '- teleport @Origin\n- effect:particles{p=portal;a=50} @Origin\n- effect:particles{p=portal;a=50} @Self',
                category: 'movement',
                icon: '🏠',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_whirlwind',
                name: 'Whirlwind Movement',
                description: 'Spinning dash that hits enemies',
                skillLine: '- velocity{mode=ADD;x=0;y=0;z=2;relative=true} @Self\n- damage{a=6;repeat=8;repeatInterval=3} @EntitiesInRadius{r=3}\n- effect:particles{p=sweep_attack;a=10;repeat=8;repeatInterval=3} @Self\n- sound{s=entity.player.attack.sweep;v=1;p=1;repeat=8;repeatInterval=3} @Self',
                category: 'movement',
                icon: '🌪️',
                difficulty: 'advanced'
            }
        ],
        
        buffs: [
            // === EASY BUFFS ===
            {
                id: 'skill_speed',
                name: 'Speed Boost',
                description: 'Increases movement speed',
                skillLine: '- potion{type=SPEED;duration=200;level=2} @Self',
                category: 'buffs',
                icon: '💨',
                difficulty: 'easy'
            },
            {
                id: 'skill_strength',
                name: 'Strength',
                description: 'Increases damage dealt',
                skillLine: '- potion{type=INCREASE_DAMAGE;duration=200;level=1} @Self',
                category: 'buffs',
                icon: '💪',
                difficulty: 'easy'
            },
            {
                id: 'skill_resistance',
                name: 'Damage Resistance',
                description: 'Reduces damage taken',
                skillLine: '- potion{type=DAMAGE_RESISTANCE;duration=200;level=1} @Self',
                category: 'buffs',
                icon: '🛡️',
                difficulty: 'easy'
            },
            {
                id: 'skill_invisibility',
                name: 'Invisibility',
                description: 'Become invisible',
                skillLine: '- potion{type=INVISIBILITY;duration=200;level=1} @Self',
                category: 'buffs',
                icon: '👻',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE BUFFS ===
            {
                id: 'skill_haste',
                name: 'Haste',
                description: 'Increases mining/attack speed',
                skillLine: '- potion{type=FAST_DIGGING;duration=200;level=2} @Self',
                category: 'buffs',
                icon: '⚡',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_jump_boost',
                name: 'Jump Boost',
                description: 'Increases jump height',
                skillLine: '- potion{type=JUMP;duration=200;level=2} @Self',
                category: 'buffs',
                icon: '🦘',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_water_breathing',
                name: 'Water Breathing',
                description: 'Breathe underwater',
                skillLine: '- potion{type=WATER_BREATHING;duration=600;level=1} @Self',
                category: 'buffs',
                icon: '🌊',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_night_vision',
                name: 'Night Vision',
                description: 'See in darkness',
                skillLine: '- potion{type=NIGHT_VISION;duration=600;level=1} @Self',
                category: 'buffs',
                icon: '👁️',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED BUFFS ===
            {
                id: 'skill_buff_combo',
                name: 'Buff Combo',
                description: 'Multiple buffs at once',
                skillLine: '- potion{type=SPEED;duration=200;level=2} @Self\n- potion{type=INCREASE_DAMAGE;duration=200;level=1} @Self\n- potion{type=DAMAGE_RESISTANCE;duration=200;level=1} @Self\n- effect:particles{p=enchanted_hit;a=30} @Self',
                category: 'buffs',
                icon: '✨',
                difficulty: 'advanced'
            },
            {
                id: 'skill_team_buff',
                name: 'Team Buff',
                description: 'Buffs all nearby allies',
                skillLine: '- potion{type=INCREASE_DAMAGE;duration=200;level=1} @PlayersInRadius{r=10}\n- potion{type=SPEED;duration=200;level=1} @PlayersInRadius{r=10}\n- effect:particlesphere{p=enchanted_hit;r=10;a=100} @Self',
                category: 'buffs',
                icon: '👥',
                difficulty: 'advanced'
            },
            {
                id: 'skill_rage_mode',
                name: 'Rage Mode',
                description: 'Powerful buff with drawback',
                skillLine: '- potion{type=INCREASE_DAMAGE;duration=100;level=3} @Self\n- potion{type=SPEED;duration=100;level=2} @Self\n- potion{type=DAMAGE_RESISTANCE;duration=100;level=-2} @Self\n- effect:particles{p=angry_villager;a=50} @Self',
                category: 'buffs',
                icon: '😠',
                difficulty: 'advanced'
            },
            {
                id: 'skill_battle_cry',
                name: 'Battle Cry',
                description: 'AoE team buff with sound',
                skillLine: '- potion{type=INCREASE_DAMAGE;duration=200;level=2} @PlayersInRadius{r=15}\n- potion{type=DAMAGE_RESISTANCE;duration=200;level=1} @PlayersInRadius{r=15}\n- effect:particlesphere{p=flame;r=15;a=200} @Self\n- sound{s=entity.ender_dragon.growl;v=2;p=0.8} @Self\n- message{m="<gold><bold>BATTLE CRY!"} @PlayersInRadius{r=15}',
                category: 'buffs',
                icon: '📯',
                difficulty: 'advanced'
            },
            {
                id: 'skill_blessing',
                name: 'Divine Blessing',
                description: 'Full buff suite for allies',
                skillLine: '- potion{type=REGENERATION;duration=200;level=2} @PlayersInRadius{r=8}\n- potion{type=ABSORPTION;duration=200;level=2} @PlayersInRadius{r=8}\n- potion{type=DAMAGE_RESISTANCE;duration=200;level=1} @PlayersInRadius{r=8}\n- effect:particles{p=enchanted_hit;a=100;hs=8;vs=3} @Self\n- sound{s=block.beacon.power_select;v=1;p=1.5} @Self',
                category: 'buffs',
                icon: '✨',
                difficulty: 'advanced'
            }
        ],
        
        debuffs: [
            // === EASY DEBUFFS ===
            {
                id: 'skill_slow',
                name: 'Slow',
                description: 'Slows target movement',
                skillLine: '- potion{type=SLOW;duration=100;level=2} @Target',
                category: 'debuffs',
                icon: '🐌',
                difficulty: 'easy'
            },
            {
                id: 'skill_weakness',
                name: 'Weakness',
                description: 'Reduces damage dealt',
                skillLine: '- potion{type=WEAKNESS;duration=100;level=2} @Target',
                category: 'debuffs',
                icon: '💔',
                difficulty: 'easy'
            },
            {
                id: 'skill_blindness',
                name: 'Blindness',
                description: 'Blinds target',
                skillLine: '- potion{type=BLINDNESS;duration=100;level=1} @Target',
                category: 'debuffs',
                icon: '😵',
                difficulty: 'easy'
            },
            {
                id: 'skill_hunger',
                name: 'Hunger',
                description: 'Drains target hunger',
                skillLine: '- potion{type=HUNGER;duration=100;level=3} @Target',
                category: 'debuffs',
                icon: '🍗',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE DEBUFFS ===
            {
                id: 'skill_mining_fatigue',
                name: 'Mining Fatigue',
                description: 'Slows mining/attack speed',
                skillLine: '- potion{type=SLOW_DIGGING;duration=100;level=2} @Target',
                category: 'debuffs',
                icon: '⛏️',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_nausea',
                name: 'Nausea',
                description: 'Distorts vision',
                skillLine: '- potion{type=CONFUSION;duration=100;level=1} @Target',
                category: 'debuffs',
                icon: '😵‍💫',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_levitation',
                name: 'Levitation',
                description: 'Floats target upward',
                skillLine: '- potion{type=LEVITATION;duration=60;level=3} @Target',
                category: 'debuffs',
                icon: '⬆️',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED DEBUFFS ===
            {
                id: 'skill_debuff_combo',
                name: 'Debuff Combo',
                description: 'Multiple debuffs at once',
                skillLine: '- potion{type=SLOW;duration=100;level=2} @Target\n- potion{type=WEAKNESS;duration=100;level=2} @Target\n- potion{type=POISON;duration=100;level=1} @Target\n- effect:particles{p=villager_angry;a=30} @Target',
                category: 'debuffs',
                icon: '☠️',
                difficulty: 'advanced'
            },
            {
                id: 'skill_curse',
                name: 'Curse',
                description: 'Long-lasting debuffs',
                skillLine: '- potion{type=SLOW;duration=600;level=1} @Target\n- potion{type=WEAKNESS;duration=600;level=1} @Target\n- potion{type=UNLUCK;duration=600;level=2} @Target\n- effect:particles{p=squid_ink;a=50} @Target',
                category: 'debuffs',
                icon: '🌑',
                difficulty: 'advanced'
            },
            {
                id: 'skill_confusion',
                name: 'Confusion',
                description: 'Nausea and disorientation',
                skillLine: '- potion{type=CONFUSION;duration=100;level=1} @Target\n- effect:particles{p=portal;a=50;hs=1;vs=1} @Target\n- sound{s=entity.enderman.teleport;v=1;p=0.5} @Target',
                category: 'debuffs',
                icon: '😵',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_hex',
                name: 'Hex',
                description: 'Damage vulnerability curse',
                skillLine: '- potion{type=UNLUCK;duration=200;level=3} @Target\n- potion{type=GLOWING;duration=200;level=1} @Target\n- effect:particles{p=squid_ink;a=30;repeat=10;repeatInterval=20} @Target',
                category: 'debuffs',
                icon: '🔮',
                difficulty: 'advanced'
            }
        ],
        
        auras: [
            // === EASY AURAS ===
            {
                id: 'skill_healing_aura',
                name: 'Healing Aura',
                description: 'Heals nearby players over time',
                skillLine: '- aura{auraName=HealingAura;charges=1;chargesPerSecond=0.2;d=100;i=20;onTick=healNearby} @Self',
                category: 'auras',
                icon: '🌟',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_damage_aura',
                name: 'Damage Aura',
                description: 'Damages nearby enemies periodically',
                skillLine: '- aura{auraName=DamageAura;charges=1;chargesPerSecond=0.5;d=100;i=10;onTick=damageNearby} @Self',
                category: 'auras',
                icon: '💥',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_thorns_aura',
                name: 'Thorns Aura',
                description: 'Reflects damage to attackers',
                skillLine: '- aura{auraName=ThornsAura;charges=1;d=100;onHurt=reflectDamage} @Self',
                category: 'auras',
                icon: '🛡️',
                difficulty: 'intermediate'
            }
        ],
        
        examples: [
            // === COMPLETE SKILL EXAMPLES (formerly second 'utility' section) ===
            {
                id: 'skill_message_cast',
                name: 'Cast Message',
                description: 'Announces skill usage',
                skillLine: '- message{m="<gold>Skill activated!"} @Self',
                category: 'utility',
                icon: '💬',
                difficulty: 'easy'
            },
            {
                id: 'skill_sound',
                name: 'Play Sound',
                description: 'Plays sound effect',
                skillLine: '- sound{s=entity.ender_dragon.growl;v=1;p=1} @Self',
                category: 'utility',
                icon: '🔊',
                difficulty: 'easy'
            },
            {
                id: 'skill_give_item',
                name: 'Give Item',
                description: 'Gives item to player',
                skillLine: '- give{i=DIAMOND;a=1} @Self',
                category: 'utility',
                icon: '💎',
                difficulty: 'easy'
            },
            
            // === INTERMEDIATE UTILITY ===
            {
                id: 'skill_clear_threat',
                name: 'Clear Threat',
                description: 'Removes mob aggro',
                skillLine: '- threat{m=0;mode=SET} @Self',
                category: 'utility',
                icon: '😌',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_feed',
                name: 'Feed',
                description: 'Restores hunger',
                skillLine: '- feed{a=10;s=10} @Self',
                category: 'utility',
                icon: '🍖',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_oxygen',
                name: 'Restore Oxygen',
                description: 'Replenishes air underwater',
                skillLine: '- oxygen{a=300} @Self',
                category: 'utility',
                icon: '💨',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_firework',
                name: 'Firework Display',
                description: 'Launches celebratory firework',
                skillLine: '- effect:firework{t=BALL;c=RED,BLUE,GREEN;fade=YELLOW;f=true;trail=true} @Self\n- sound{s=entity.firework_rocket.launch;v=1;p=1} @Self',
                category: 'utility',
                icon: '🎆',
                difficulty: 'intermediate'
            },
            {
                id: 'skill_extinguish',
                name: 'Extinguish Flames',
                description: 'Removes fire from self',
                skillLine: '- extinguish @Self\n- effect:particles{p=smoke_large;a=20} @Self\n- sound{s=block.fire.extinguish;v=1;p=1} @Self',
                category: 'utility',
                icon: '💨',
                difficulty: 'intermediate'
            },
            
            // === ADVANCED UTILITY ===
            {
                id: 'skill_execute_command',
                name: 'Execute Command',
                description: 'Runs console command',
                skillLine: '- command{c="give <caster.name> diamond 1";asop=true} @Self',
                category: 'utility',
                icon: '⚙️',
                difficulty: 'advanced'
            },
            {
                id: 'skill_modify_score',
                name: 'Modify Score',
                description: 'Changes scoreboard value',
                skillLine: '- setScore{objective=kills;value=1;action=ADD} @Self',
                category: 'utility',
                icon: '📊',
                difficulty: 'advanced'
            },
            {
                id: 'skill_bar_message',
                name: 'Action Bar Message',
                description: 'Shows message on action bar',
                skillLine: '- actionbarmessage{m="<gold>Skill Ready!";duration=40} @Self',
                category: 'utility',
                icon: '📝',
                difficulty: 'advanced'
            },
            {
                id: 'skill_thunder_strike',
                name: '⚡ Thunder Strike',
                description: 'Complete: Lightning with damage and effects',
                skillLine: '- message{m="<yellow>⚡ Thunder Strike!"} @Self\n- sound{s=entity.lightning_bolt.thunder;v=2;p=1} @Self\n- lightning @Target\n- damage{a=25} @Target\n- effect:particles{p=electric_spark;a=100;hs=2;vs=3} @Target\n- throw{v=1;vy=2} @Target\n- delay 10\n- potion{type=SLOW;duration=60;level=2} @Target',
                category: 'utility',
                icon: '⚡',
                difficulty: 'advanced'
            },
            {
                id: 'skill_flame_burst',
                name: '🔥 Flame Burst',
                description: 'Complete: AoE fire skill with lingering flames',
                skillLine: '- message{m="<red><bold>FLAME BURST!"} @PlayersInRadius{r=10}\n- sound{s=entity.blaze.shoot;v=1.5;p=0.8} @Self\n- effect:particlesphere{p=flame;r=6;a=200} @Self\n- damage{a=15} @EntitiesInRadius{r=6}\n- ignite{ticks=80} @EntitiesInRadius{r=6}\n- delay 10\n- blockwave{m=FIRE;r=6;d=80;v=1} @Self\n- effect:particles{p=lava;a=50;hs=6;vs=1} @Self',
                category: 'utility',
                icon: '🔥',
                difficulty: 'advanced'
            },
            {
                id: 'skill_holy_nova',
                name: '✨ Holy Nova',
                description: 'Complete: Damage enemies, heal allies',
                skillLine: '- message{m="<white><bold>✨ HOLY NOVA!"} @PlayersInRadius{r=12}\n- sound{s=block.beacon.power_select;v=2;p=1.5} @Self\n- effect:particlesphere{p=enchanted_hit;r=8;a=300} @Self\n- damage{a=20} @EntitiesInRadius{r=8;t=MONSTER}\n- heal{a=15} @PlayersInRadius{r=8}\n- potion{type=REGENERATION;duration=100;level=2} @PlayersInRadius{r=8}\n- effect:particles{p=heart;a=30} @PlayersInRadius{r=8}',
                category: 'utility',
                icon: '✨',
                difficulty: 'advanced'
            },
            {
                id: 'skill_ice_prison',
                name: '🧊 Ice Prison',
                description: 'Complete: Traps and damages target',
                skillLine: '- message{m="<aqua>🧊 Ice Prison!"} @Self\n- sound{s=block.glass.break;v=1;p=0.5} @Self\n- blockwave{m=ICE;r=3;d=80;v=1} @Target\n- blockwave{m=PACKED_ICE;r=2;d=80;v=2} @Target\n- freeze{d=80} @Target\n- damage{a=8;repeat=8;repeatInterval=10} @Target\n- effect:particles{p=snowflake;a=10;repeat=8;repeatInterval=10} @Target\n- potion{type=SLOW;duration=100;level=4} @Target',
                category: 'utility',
                icon: '🧊',
                difficulty: 'advanced'
            },
            {
                id: 'skill_shadow_step',
                name: '👻 Shadow Step',
                description: 'Complete: Teleport behind target with stealth',
                skillLine: '- message{m="<dark_purple>👻 Shadow Step..."} @Self\n- potion{type=INVISIBILITY;duration=40;level=1} @Self\n- effect:particles{p=squid_ink;a=50} @Self\n- sound{s=entity.enderman.teleport;v=1;p=0.8} @Self\n- teleport{spreadh=0;spreadv=0} @Target\n- delay 15\n- damage{a=30} @Target\n- effect:particles{p=crit;a=30} @Target\n- sound{s=entity.player.attack.crit;v=1;p=1} @Self',
                category: 'utility',
                icon: '👻',
                difficulty: 'advanced'
            },
            {
                id: 'skill_dragon_breath',
                name: '🐉 Dragon Breath',
                description: 'Complete: Cone of fire damage and ignite',
                skillLine: '- message{m="<gold><bold>🐉 DRAGON BREATH!"} @PlayersInRadius{r=15}\n- sound{s=entity.ender_dragon.growl;v=2;p=0.7} @Self\n- damage{a=20} @EntitiesInCone{a=45;r=12}\n- ignite{ticks=80} @EntitiesInCone{a=45;r=12}\n- effect:particles{p=dragon_breath;a=200;hs=4;vs=2} @Cone{a=45;r=12;p=30}\n- effect:particles{p=flame;a=100;hs=8;vs=3} @Self',
                category: 'utility',
                icon: '🐉',
                difficulty: 'advanced'
            },
            {
                id: 'skill_earthquake',
                name: '🌋 Earthquake',
                description: 'Complete: Ground slam with waves',
                skillLine: '- message{m="<dark_red><bold>🌋 EARTHQUAKE!"} @PlayersInRadius{r=15}\n- sound{s=entity.generic.explode;v=2;p=0.5} @Self\n- throw{v=0;vy=2} @EntitiesInRadius{r=10}\n- damage{a=18} @EntitiesInRadius{r=10}\n- blockwave{m=CRACKED_STONE_BRICKS;r=10;d=60;v=2} @Self\n- effect:particles{p=block_crack{block=stone};a=200;hs=10;vs=2} @Self\n- delay 20\n- damage{a=10;repeat=5;repeatInterval=10} @EntitiesInRadius{r=10}\n- effect:particlering{p=smoke_large;r=10;a=100;y=0.1;repeat=5;repeatInterval=10} @Self',
                category: 'utility',
                icon: '🌋',
                difficulty: 'advanced'
            },
            {
                id: 'skill_meteor_rain',
                name: '☄️ Meteor Rain',
                description: 'Complete: Multiple fireballs with explosions',
                skillLine: '- message{m="<gold><bold>☄️ METEOR RAIN!"} @PlayersInRadius{r=20}\n- sound{s=entity.wither.spawn;v=2;p=0.8} @Self\n- shoot{type=FIREBALL;yield=2} @Ring{radius=5to12;points=5;repeat=5;repeatInterval=8}\n- delay 40\n- damage{a=25} @EntitiesInRadius{r=15}\n- effect:explosion @RandomLocationsNearCaster{r=12;a=5}\n- sound{s=entity.generic.explode;v=2;p=0.8} @Self',
                category: 'utility',
                icon: '☄️',
                difficulty: 'advanced'
            }
        ]
    },
    
    /**
     * Get all templates for a context
     */
    getAll(context = 'mob') {
        const templates = [];
        const contextData = this[context];
        
        for (const category in contextData) {
            templates.push(...contextData[category]);
        }
        
        return templates;
    },
    
    /**
     * Get templates by category
     */
    getByCategory(context = 'mob', category) {
        return this[context][category] || [];
    },
    
    /**
     * Get all categories for a context
     */
    getAllCategories(context = 'mob') {
        return Object.keys(this[context]);
    },
    
    /**
     * Search templates
     */
    search(context = 'mob', query) {
        const allTemplates = this.getAll(context);
        const lowerQuery = query.toLowerCase();
        
        return allTemplates.filter(template => 
            template.name.toLowerCase().includes(lowerQuery) ||
            template.description.toLowerCase().includes(lowerQuery) ||
            template.skillLine.toLowerCase().includes(lowerQuery) ||
            template.category.toLowerCase().includes(lowerQuery)
        );
    },
    
    /**
     * Get template by ID
     */
    getById(id) {
        for (const context in this) {
            if (typeof this[context] !== 'object') continue;
            
            for (const category in this[context]) {
                const template = this[context][category].find(t => t.id === id);
                if (template) return template;
            }
        }
        return null;
    },
    
    /**
     * Get category icon
     */
    getCategoryIcon(category) {
        const icons = {
            combat: '⚔️',
            damage: '💥',
            effects: '✨',
            summons: '👾',
            projectiles: '🎯',
            utility: '🔧',
            healing: '💚',
            movement: '🏃',
            buffs: '💪',
            debuffs: '🐌',
            auras: '🌟',
            examples: '📚'
        };
        return icons[category] || '📦';
    },
    
    /**
     * Get category display name
     */
    getCategoryDisplayName(category) {
        const names = {
            combat: 'Combat',
            damage: 'Damage',
            effects: 'Effects',
            summons: 'Summons',
            projectiles: 'Projectiles',
            utility: 'Utility',
            healing: 'Healing',
            movement: 'Movement',
            buffs: 'Buffs',
            debuffs: 'Debuffs',
            auras: 'Auras',
            examples: 'Complete Examples'
        };
        return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
    },
    
    /**
     * Check if a template has triggers (for mob files only)
     * @param {Object} template - The template to check
     * @returns {boolean} - True if template has triggers
     */
    hasTrigger(template) {
        if (!template) return false;
        // Check for explicit requiresMobFile flag
        if (template.requiresMobFile === true) return true;
        // Check for trigger patterns in skillLine
        if (template.skillLine && template.skillLine.includes('~on')) return true;
        return false;
    },
    
    /**
     * Get only skill-compatible templates (without triggers)
     * @param {string} context - The context to filter ('mob' or 'skill')
     * @returns {Array} - Array of templates without triggers
     */
    getSkillCompatibleTemplates(context = 'skill') {
        const allTemplates = this.getAll(context);
        return allTemplates.filter(template => !this.hasTrigger(template));
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SKILL_TEMPLATES;
}

// Loaded silently
