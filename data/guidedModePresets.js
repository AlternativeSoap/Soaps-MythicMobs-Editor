/**
 * Guided Mode Presets - Pre-built skill configurations for beginners
 * Part of the Guided Mode system for ultra-friendly mob creation
 * 
 * ═══════════════════════════════════════════════════════════════
 * Created by: AlternativeSoap
 * © 2025-2026 AlternativeSoap - All Rights Reserved
 * ═══════════════════════════════════════════════════════════════
 */

const GuidedModePresets = {
    /**
     * Direct Skills - Can be added directly to a mob's Skills section
     * Format: - mechanic{} ~[trigger] [chance]
     */
    direct: [
        {
            id: 'heal_on_damage',
            name: 'Heal on Damage',
            description: 'Heals the mob when it takes damage',
            icon: 'fa-heart',
            color: '#ef4444',
            category: 'defensive',
            difficulty: 'easy',
            options: [
                { id: 'amount', label: 'Heal Amount', type: 'number', default: 10, min: 1, max: 50, step: 1 },
                { id: 'chance', label: 'Trigger Chance', type: 'number', default: 0.3, min: 0.01, max: 1, step: 0.05 }
            ],
            generateLine: (opts) => `- heal{amount=${opts.amount || 10}} @self ~onDamaged ${opts.chance || 0.3}`
        },
        {
            id: 'ignite_attack',
            name: 'Ignite on Attack',
            description: 'Sets enemies on fire when attacking',
            icon: 'fa-fire',
            color: '#f97316',
            category: 'offensive',
            difficulty: 'easy',
            options: [
                { id: 'ticks', label: 'Fire Duration (ticks)', type: 'number', default: 100, min: 20, max: 400, step: 20 }
            ],
            generateLine: (opts) => `- ignite{ticks=${opts.ticks || 100}} @trigger ~onAttack`
        },
        {
            id: 'lightning_timer',
            name: 'Lightning Strike',
            description: 'Periodically strikes nearby players with lightning',
            icon: 'fa-bolt',
            color: '#eab308',
            category: 'offensive',
            difficulty: 'easy',
            options: [
                { id: 'radius', label: 'Radius', type: 'number', default: 10, min: 3, max: 20, step: 1 },
                { id: 'interval', label: 'Interval (ticks)', type: 'number', default: 200, min: 40, max: 600, step: 20 }
            ],
            generateLine: (opts) => `- lightning @EntitiesInRadius{r=${opts.radius || 10};target=players} ~onTimer:${opts.interval || 200}`
        },
        {
            id: 'potion_strength',
            name: 'Strength Buff',
            description: 'Gains strength when spawning',
            icon: 'fa-hand-fist',
            color: '#dc2626',
            category: 'buff',
            difficulty: 'easy',
            options: [
                { id: 'level', label: 'Strength Level', type: 'number', default: 2, min: 1, max: 5, step: 1 },
                { id: 'duration', label: 'Duration (ticks)', type: 'number', default: 999, min: 100, max: 9999, step: 100 }
            ],
            generateLine: (opts) => `- potion{type=STRENGTH;duration=${opts.duration || 999};level=${opts.level || 2};force=true} @self ~onSpawn`
        },
        {
            id: 'potion_speed',
            name: 'Speed Buff',
            description: 'Gains speed when spawning',
            icon: 'fa-person-running',
            color: '#06b6d4',
            category: 'buff',
            difficulty: 'easy',
            options: [
                { id: 'level', label: 'Speed Level', type: 'number', default: 2, min: 1, max: 5, step: 1 },
                { id: 'duration', label: 'Duration (ticks)', type: 'number', default: 999, min: 100, max: 9999, step: 100 }
            ],
            generateLine: (opts) => `- potion{type=SPEED;duration=${opts.duration || 999};level=${opts.level || 2};force=true} @self ~onSpawn`
        },
        {
            id: 'damage_aoe',
            name: 'AOE Damage',
            description: 'Deals damage to nearby players periodically',
            icon: 'fa-burst',
            color: '#ef4444',
            category: 'offensive',
            difficulty: 'easy',
            options: [
                { id: 'amount', label: 'Damage', type: 'number', default: 5, min: 1, max: 20, step: 1 },
                { id: 'radius', label: 'Radius', type: 'number', default: 5, min: 2, max: 15, step: 1 },
                { id: 'interval', label: 'Interval (ticks)', type: 'number', default: 100, min: 20, max: 400, step: 20 }
            ],
            generateLine: (opts) => `- damage{amount=${opts.amount || 5}} @EntitiesInRadius{r=${opts.radius || 5};target=players} ~onTimer:${opts.interval || 100}`
        },
        {
            id: 'throw_player',
            name: 'Throw Player',
            description: 'Throws nearby players into the air on attack',
            icon: 'fa-hand',
            color: '#8b5cf6',
            category: 'offensive',
            difficulty: 'medium',
            options: [
                { id: 'velocity', label: 'Throw Force', type: 'number', default: 2, min: 1, max: 5, step: 0.5 },
                { id: 'velocityY', label: 'Upward Force', type: 'number', default: 1, min: 0.5, max: 3, step: 0.5 }
            ],
            generateLine: (opts) => `- throw{velocity=${opts.velocity || 2};velocityY=${opts.velocityY || 1}} @trigger ~onAttack`
        },
        {
            id: 'pull_player',
            name: 'Pull Player',
            description: 'Pulls the target toward the mob',
            icon: 'fa-magnet',
            color: '#7c3aed',
            category: 'utility',
            difficulty: 'medium',
            options: [
                { id: 'velocity', label: 'Pull Speed', type: 'number', default: 3, min: 1, max: 10, step: 1 }
            ],
            generateLine: (opts) => `- pull{velocity=${opts.velocity || 3}} @target ~onDamaged 0.3`
        },
        {
            id: 'particles_flame',
            name: 'Flame Aura',
            description: 'Surrounds the mob with flame particles',
            icon: 'fa-fire-flame-curved',
            color: '#f97316',
            category: 'visual',
            difficulty: 'easy',
            options: [
                { id: 'amount', label: 'Particle Count', type: 'number', default: 10, min: 5, max: 30, step: 5 },
                { id: 'interval', label: 'Interval (ticks)', type: 'number', default: 5, min: 1, max: 20, step: 1 }
            ],
            generateLine: (opts) => `- particles{p=flame;amount=${opts.amount || 10};hS=0.5;vS=0.5} @self ~onTimer:${opts.interval || 5}`
        },
        {
            id: 'sound_growl',
            name: 'Growl Sound',
            description: 'Plays a menacing sound periodically',
            icon: 'fa-volume-high',
            color: '#6b7280',
            category: 'visual',
            difficulty: 'easy',
            options: [
                { id: 'interval', label: 'Interval (ticks)', type: 'number', default: 200, min: 60, max: 600, step: 20 }
            ],
            generateLine: (opts) => `- sound{s=entity.ravager.roar;v=1.0;p=0.8} @self ~onTimer:${opts.interval || 200}`
        },
        {
            id: 'freeze_attack',
            name: 'Freeze on Attack',
            description: 'Freezes enemies when attacking',
            icon: 'fa-snowflake',
            color: '#06b6d4',
            category: 'offensive',
            difficulty: 'easy',
            options: [
                { id: 'ticks', label: 'Freeze Duration (ticks)', type: 'number', default: 100, min: 20, max: 300, step: 20 }
            ],
            generateLine: (opts) => `- freeze{ticks=${opts.ticks || 100}} @trigger ~onAttack`
        },
        {
            id: 'teleport_behind',
            name: 'Teleport Behind',
            description: 'Teleports behind target on attack chance',
            icon: 'fa-ghost',
            color: '#8b5cf6',
            category: 'utility',
            difficulty: 'medium',
            options: [
                { id: 'chance', label: 'Chance', type: 'number', default: 0.2, min: 0.05, max: 0.5, step: 0.05 }
            ],
            generateLine: (opts) => `- teleport @TargetLocation{f=-2} ~onAttack ${opts.chance || 0.2}`
        }
    ],

    /**
     * Metaskills - Require creating separate skill file(s)
     * Format: - skill{s=skillname} ~[trigger] [chance]
     */
    metaskills: [
        {
            id: 'shadow_revenant_frenzy',
            name: 'Shadow Revenant Frenzy',
            description: 'Below 50% HP, creates a damaging aura that explodes on end, killing the mob',
            icon: 'fa-explosion',
            color: '#7c3aed',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=SHADOW_REVENANT_FRENZY_DETONATION} ~onDamaged 1.0',
            generateSkills: () => ({
                'SHADOW_REVENANT_FRENZY_DETONATION': {
                    Conditions: ['- health{h=<50}'],
                    Skills: ['- aura{aura=SHADOW_REVENANT_FRENZY_DETONATION_AURA;ticks=200;ontickskill=SHADOW_REVENANT_FRENZY_DETONATION_TICK;onendskill=SHADOW_REVENANT_FRENZY_DETONATION_END;interval=20} @self']
                },
                'SHADOW_REVENANT_FRENZY_DETONATION_TICK': {
                    Skills: ['- damage{amount=13} @entitiesInRadius{radius=5;target=players}']
                },
                'SHADOW_REVENANT_FRENZY_DETONATION_END': {
                    Skills: [
                        '- particles{p=explosion_large;amount=1;speed=0;hS=0.5;vS=0.5} @self',
                        '- sound{s=entity.generic.explode;v=1;p=1} @self',
                        '- damage{amount=20} @entitiesInRadius{radius=5;target=players}',
                        '- remove @self'
                    ]
                }
            })
        },
        {
            id: 'crypt_warden_fury',
            name: 'Crypt Warden Shattering Fury',
            description: 'Below 50% HP, gains massive strength and speed buff',
            icon: 'fa-shield-halved',
            color: '#22c55e',
            category: 'buff',
            difficulty: 'medium',
            options: [],
            mobSkillLine: () => '- skill{s=CRYPT_WARDEN_SHATTERING_FURY} ~onDamaged 1.0',
            generateSkills: () => ({
                'CRYPT_WARDEN_SHATTERING_FURY': {
                    Conditions: ['- health{h=<50}'],
                    Skills: ['- aura{aura=CRYPT_WARDEN_SHATTERING_FURY_AURA;ticks=200;onstartskill=CRYPT_WARDEN_SHATTERING_FURY_START;onendskill=CRYPT_WARDEN_SHATTERING_FURY_END} @self']
                },
                'CRYPT_WARDEN_SHATTERING_FURY_START': {
                    Skills: [
                        '- potion{type=STRENGTH;duration=999;level=4;particles=true;force=true} @self',
                        '- potion{type=SPEED;duration=999;level=2;particles=true;force=true} @self'
                    ]
                },
                'CRYPT_WARDEN_SHATTERING_FURY_END': {
                    Skills: [
                        '- potion{type=STRENGTH;duration=1;level=1;particles=true;force=true} @self',
                        '- potion{type=SPEED;duration=1;level=1;particles=true;force=true} @self'
                    ]
                }
            })
        },
        {
            id: 'crypt_guardian_projectile',
            name: 'Crypt Guardian Projectile',
            description: 'Throws sword projectile at distant targets',
            icon: 'fa-location-arrow',
            color: '#6b7280',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=CRYPT_GUARDIAN_PROJECTILE_ATTACK} ~onTimer:100 1.0',
            generateSkills: () => ({
                'CRYPT_GUARDIAN_PROJECTILE_ATTACK': {
                    Conditions: ['- playerwithin{d=3} false'],
                    Skills: [
                        '- potion{type=SLOWNESS;duration=999;level=99;force=true;hasparticles=false} @self',
                        '- delay 10',
                        '- equip{item=AIR:HAND} @self',
                        '- projectile{bulletType=DISPLAY;rollspeed=1;material=IRON_SWORD;bulletmatchdirection=true;onHit=CRYPT_GUARDIAN_PROJECTILE_ATTACK_HIT;v=10;i=1;hR=1.0;vR=1.0;hnp=false;sE=true;mr=25;syo=1.2;tyo=1.4;g=0.04} @target',
                        '- potion{type=SLOWNESS;duration=0;level=0;force=true;hasparticles=false} @self',
                        '- delay 10',
                        '- equip{item=IRON_SWORD:HAND} @self'
                    ]
                },
                'CRYPT_GUARDIAN_PROJECTILE_ATTACK_HIT': {
                    Skills: ['- damage{amount=10;damagecause=PROJECTILE} @target']
                }
            })
        },
        {
            id: 'shadow_walker_potion',
            name: 'Shadow Walker Potion Throw',
            description: 'Throws potion that applies random debuff (weakness/hunger/poison)',
            icon: 'fa-flask',
            color: '#8b5cf6',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=SHADOW_WALKER} ~onTimer:80 1.0',
            generateSkills: () => ({
                'SHADOW_WALKER': {
                    Skills: ['- projectile{bulletType=ITEM;material=POTION;enchanted=true;onTick=SHADOW_WALKER_TICK;onHit=SHADOW_WALKER_HIT;v=8;i=1;hR=1;vR=1;mr=20;g=0.2;syo=1.4;tyo=2.6} @target']
                },
                'SHADOW_WALKER_TICK': {
                    Skills: ['- effect:particles{p=SOUL;amount=1;speed=0;hS=0;vS=0} @origin']
                },
                'SHADOW_WALKER_HIT': {
                    Skills: ['- damage{a=6}', '- skill{s=SHADOW_WALKER_POTION} @target']
                },
                'SHADOW_WALKER_POTION': {
                    Skills: ['- randomskill{skills=SHADOW_WALKER_POTION_WEAKNESS,SHADOW_WALKER_POTION_HUNGER,SHADOW_WALKER_POTION_POISON}']
                },
                'SHADOW_WALKER_POTION_WEAKNESS': {
                    Skills: ['- potion{type=WEAKNESS;duration=200;level=1;force=true;hasparticles=true} @target']
                },
                'SHADOW_WALKER_POTION_HUNGER': {
                    Skills: ['- potion{type=HUNGER;duration=200;level=1;force=true;hasparticles=true} @target']
                },
                'SHADOW_WALKER_POTION_POISON': {
                    Skills: ['- potion{type=POISON;duration=200;level=1;force=true;hasparticles=true} @target']
                }
            })
        },
        {
            id: 'cryptic_marksman_volley',
            name: 'Cryptic Marksman Volley',
            description: 'Fires spectral arrow with cyan particle trail',
            icon: 'fa-bullseye',
            color: '#06b6d4',
            category: 'offensive',
            difficulty: 'medium',
            options: [],
            mobSkillLine: () => '- skill{s=CRYPTIC_MARKSMAN_VOLLEY} ~onTimer:60 1.0',
            generateSkills: () => ({
                'CRYPTIC_MARKSMAN_VOLLEY': {
                    Skills: ['- projectile{bulletType=ARROW;arrowType=SPECTRAL;onHit=CRYPTIC_MARKSMAN_VOLLEY_HIT;onTick=CRYPTIC_MARKSMAN_VOLLEY_TICK;v=12;i=1;hR=1.0;vR=1.0;sE=false;mr=20;syo=1.2;tyo=0.6;g=0.02} @target']
                },
                'CRYPTIC_MARKSMAN_VOLLEY_TICK': {
                    Skills: ['- effect:particles{p=reddust;color=#00fffb;amount=1;speed=0;hS=0;vS=0} @origin']
                },
                'CRYPTIC_MARKSMAN_VOLLEY_HIT': {
                    Skills: ['- damage{amount=10;damagecause=PROJECTILE} @target']
                }
            })
        },
        {
            id: 'terrashock_upheaval',
            name: 'Terrashock Upheaval',
            description: 'Jumps into air, slams down dealing AOE damage and knockback',
            icon: 'fa-mountain',
            color: '#a16207',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=TERRASHOCK_UPHEAVAL} ~onTimer:400 1.0',
            generateSkills: () => ({
                'TERRASHOCK_UPHEAVAL': {
                    Cooldown: 20,
                    Skills: [
                        '- particles{particle=block;m=dirt;speed=0;hS=10;vS=0;a=20;y=0.5;repeat=10;repeatinterval=2} @self',
                        '- sound{s=item.hoe.till;v=1.0;p=1.0} @self',
                        '- potion{t=LEVITATION;d=9999;l=1;force=true;p=false} @self',
                        '- ondamaged{damagetype=FALL;ce=true;t=40} @self',
                        '- jump{velocity=2} @self',
                        '- delay 10',
                        '- leap{velocity=200} @target',
                        '- delay 10',
                        '- jump{velocity=-10} @self',
                        '- potion{t=LEVITATION;d=1;l=1;force=true;p=false} @self',
                        '- delay 10',
                        '- particles{p=explosion_large;amount=1;speed=0;hS=0.5;vS=0.5} @self',
                        '- sound{s=entity.generic.explode;v=1;p=1} @self',
                        '- throw{velocity=20;velocityY=10} @PIR{r=10}',
                        '- damage{amount=5} @PIR{r=10}',
                        '- particles{particle=block;m=dirt;speed=0;hS=10;vS=0;a=20;y=1.0;repeat=3;repeatinterval=1} @self'
                    ]
                }
            })
        },
        {
            id: 'infernal_pyre_barrage',
            name: 'Infernal Pyre Barrage',
            description: 'Rains down fireballs in expanding rings',
            icon: 'fa-fire-flame-curved',
            color: '#dc2626',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=INFERNAL_PYRE_BARRAGE} ~onTimer:600 1.0',
            generateSkills: () => ({
                'INFERNAL_PYRE_BARRAGE': {
                    Cooldown: 20,
                    Skills: [
                        '- potion{t=FIRE_RESISTANCE;d=99999;l=10;force=true;p=false} @self',
                        '- potion{t=SLOWNESS;d=99999;l=10;force=true;p=false} @self',
                        '- particleline{particle=smoke;amount=2;fromOrigin=true} @SelfLocation{y=12}',
                        '- delay 8',
                        '- particles{p=cloud;amount=3;speed=0.2;hS=0.7;vS=0.7} @self',
                        '- sound{s=entity.ghast.scream;v=1.2;p=0.7} @selfLocation{y=12}',
                        '- Aura{auraName=INFERNAL_PYRE_BARRAGE;onTick=INFERNAL_PYRE_METEOR;onEnd=INFERNAL_PYRE_END;interval=60;duration=500} @self',
                        '- delay 60',
                        '- potion{t=FIRE_RESISTANCE;d=1;l=1;force=true;p=false} @self',
                        '- potion{t=SLOWNESS;d=1;l=1;force=true;p=false} @self',
                        '- delay 100'
                    ]
                },
                'INFERNAL_PYRE_METEOR': {
                    Skills: [
                        '- projectile{Type=FIREBALL;onStart=INFERNAL_PYRE_METEOR_START;onTick=INFERNAL_PYRE_METEOR_TICK;onHit=INFERNAL_PYRE_METEOR_HIT;onEnd=INFERNAL_PYRE_METEOR_END;v=8;i=1;hR=1;vR=1;hnp=true;hfs=10;g=0.2} @Ring{radius=3to5;points=5to10;repeat=3;repeatinterval=5} 1.0',
                        '- delay 5',
                        '- projectile{Type=FIREBALL;onStart=INFERNAL_PYRE_METEOR_START;onTick=INFERNAL_PYRE_METEOR_TICK;onHit=INFERNAL_PYRE_METEOR_HIT;onEnd=INFERNAL_PYRE_METEOR_END;v=8;i=1;hR=1;vR=1;hnp=true;hfs=10;g=0.2} @Ring{radius=6to9;points=5to10;repeat=3;repeatinterval=5} 1.0',
                        '- delay 5',
                        '- projectile{Type=FIREBALL;onStart=INFERNAL_PYRE_METEOR_START;onTick=INFERNAL_PYRE_METEOR_TICK;onHit=INFERNAL_PYRE_METEOR_HIT;onEnd=INFERNAL_PYRE_METEOR_END;v=8;i=1;hR=1;vR=1;hnp=true;hfs=10;g=0.2} @Ring{radius=10to15;points=10to20;repeat=3;repeatinterval=5} 1.0'
                    ]
                },
                'INFERNAL_PYRE_METEOR_START': { Skills: ['- sound{s=entity.phantom.flap;v=1.0;p=1.2} @origin'] },
                'INFERNAL_PYRE_METEOR_TICK': { Skills: ['- particles{p=campfire_cosy_smoke;amount=7;speed=0.3;hS=0.3;vS=0.3} @origin', '- sound{s=block.fire.ambient;v=0.7;p=1.3;cooldown=0.2} @origin'] },
                'INFERNAL_PYRE_METEOR_HIT': { Skills: ['- damage{amount=5}', '- ignite{ticks=80}'] },
                'INFERNAL_PYRE_METEOR_END': { Skills: ['- blockmask{m=SOUL_FIRE;r=1;d=50}', '- ignite{ticks=80;repeat=12;repeatinterval=4} @ENO{r=1}', '- damage{amount=5;ia=false;repeat=12;repeatinterval=4} @ENO{r=1}', '- sound{s=block.soul_sand.place;v=1.0;p=0.7} @origin'] },
                'INFERNAL_PYRE_END': { 
                    Skills: [
                        '- potion{t=FIRE_RESISTANCE;d=1;l=1;force=true;p=false} @self',
                        '- potion{t=SLOWNESS;d=1;l=1;force=true;p=false} @self',
                        '- particles{p=explosion_large;amount=1;speed=0;hS=2;vS=2} @self',
                        '- sound{s=entity.generic.explode;v=1;p=1} @self'
                    ] 
                }
            })
        },
        {
            id: 'earthshatter_impact',
            name: 'Earthshatter Colossal Impact',
            description: 'Expanding shockwave dealing massive damage with slowing effect',
            icon: 'fa-hammer',
            color: '#a16207',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=EARTHSHATTER_COLOSSAL_IMPACT} ~onTimer:300 1.0',
            generateSkills: () => ({
                'EARTHSHATTER_COLOSSAL_IMPACT': {
                    Skills: [
                        '- potion{type=SLOW;duration=999;level=20;force=true;p=false;icon=false} @self',
                        '- playanimation{a=0;audience=World} @self',
                        '- fakeexplosion @self',
                        '- particlering{particle=TOTEM;radius=1;points=8;amount=2;hS=1;vS=0;y=0.2} @self',
                        '- particlering{particle=BLOCK_CRACK;m=STONE;radius=1;points=8;amount=2;hS=1;vS=0;y=0.2} @self',
                        '- damage{amount=22;ia=false} @PIR{r=1.0}',
                        '- potion{type=SLOW;duration=60;level=20;force=true;p=false;icon=false} @PIR{r=1.0}',
                        '- delay 2',
                        '- particlering{particle=TOTEM;radius=2;points=12;amount=2;hS=1;vS=0;y=0.2} @self',
                        '- damage{amount=22;ia=false} @PIR{r=2.0}',
                        '- delay 2',
                        '- particlering{particle=TOTEM;radius=3;points=16;amount=2;hS=1;vS=0;y=0.2} @self',
                        '- damage{amount=22;ia=false} @PIR{r=3.0}',
                        '- delay 2',
                        '- particlering{particle=TOTEM;radius=4;points=20;amount=2;hS=1;vS=0;y=0.2} @self',
                        '- damage{amount=22;ia=false} @PIR{r=4.0}',
                        '- delay 2',
                        '- particlering{particle=TOTEM;radius=5;points=24;amount=2;hS=1;vS=0;y=0.2} @self',
                        '- damage{amount=22;ia=false} @PIR{r=5.0}',
                        '- potion{type=SLOW;duration=1;level=1;force=true;p=false;icon=false} @self'
                    ]
                }
            })
        },
        {
            id: 'ironbound_chain',
            name: 'Ironbound Chained Judgment',
            description: 'Chains player, pulls them in and deals damage',
            icon: 'fa-link',
            color: '#6b7280',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=IRONBOUND_WARDEN_CHAINED_JUDGMENT} ~onTimer:200 1.0',
            generateSkills: () => ({
                'IRONBOUND_WARDEN_CHAINED_JUDGMENT': {
                    Skills: [
                        '- potion{type=SLOW;duration=999;level=20;force=true;p=false;icon=false} @self',
                        '- chain{bounces=1;bounceRadius=20;bounceDelay=1;hitSelf=false;hitPlayers=true;hitNonPlayers=false;hitTarget=true;onBounce=[- effect:particleline{p=CRIT_MAGIC;fromOrigin=true;ys=1;yt=1} - pull{velocity=12} - delay 10 - damage{amount=12;ia=true} - potion{type=SLOW;duration=60;level=20;force=true;p=false;icon=false}];bounceConditions=[- inlineofsight];} @target',
                        '- potion{type=SLOW;duration=1;level=1;force=true;p=false;icon=false} @self'
                    ]
                }
            })
        },
        {
            id: 'frostbite_shard',
            name: 'Frostbite Shard Barrage',
            description: 'Fires freezing projectile with weakness debuff',
            icon: 'fa-snowflake',
            color: '#06b6d4',
            category: 'offensive',
            difficulty: 'medium',
            options: [],
            mobSkillLine: () => '- skill{s=FROSTBITE_SHARD_BARRAGE} ~onTimer:80 1.0',
            generateSkills: () => ({
                'FROSTBITE_SHARD_BARRAGE': {
                    Conditions: ['- playerwithin{d=25} true'],
                    Skills: ['- projectile{onStart=FROSTBITE_SHARD_BARRAGE_START;onTick=FROSTBITE_SHARD_BARRAGE_TICK;onHit=FROSTBITE_SHARD_BARRAGE_HIT;v=10;i=1;hR=1;vR=1;syo=1.45;tyo=1;mr=15;sfo=0.5;g=0.05} @Forward{f=15}']
                },
                'FROSTBITE_SHARD_BARRAGE_START': { Skills: ['- sound{s=entity.snow_golem.shoot;p=0.7;v=0.7} @self'] },
                'FROSTBITE_SHARD_BARRAGE_TICK': { Skills: ['- particles{p=FALLING_SPORE_BLOSSOM;amount=3;speed=0.1;hS=0.2;vS=0.1} @origin'] },
                'FROSTBITE_SHARD_BARRAGE_HIT': { Skills: ['- damage{amount=6}', '- freeze{ticks=200}', '- potion{type=WEAKNESS;duration=120;lvl=0}'] }
            })
        },
        {
            id: 'arctic_blizzard',
            name: 'Arctic Blizzard Barrage',
            description: 'Fires triple freezing projectiles in a spread',
            icon: 'fa-icicles',
            color: '#0ea5e9',
            category: 'offensive',
            difficulty: 'hard',
            options: [],
            mobSkillLine: () => '- skill{s=ARCTIC_BLIZZARD_BARRAGE} ~onTimer:100 1.0',
            generateSkills: () => ({
                'ARCTIC_BLIZZARD_BARRAGE': {
                    Conditions: ['- playerwithin{d=25} true'],
                    Skills: [
                        '- projectile{onStart=ARCTIC_BLIZZARD_BARRAGE_START;onTick=ARCTIC_BLIZZARD_BARRAGE_TICK;onHit=ARCTIC_BLIZZARD_BARRAGE_HIT;v=10;i=1;hR=1;vR=1;syo=1.45;tyo=1;mr=13;sfo=0.5;eso=1;g=0.05} @Forward{f=15}',
                        '- projectile{onStart=ARCTIC_BLIZZARD_BARRAGE_START;onTick=ARCTIC_BLIZZARD_BARRAGE_TICK;onHit=ARCTIC_BLIZZARD_BARRAGE_HIT;v=10;i=1;hR=1;vR=1;syo=1.45;tyo=1;mr=15;sfo=0.5;eso=0;g=0.05} @Forward{f=15}',
                        '- projectile{onStart=ARCTIC_BLIZZARD_BARRAGE_START;onTick=ARCTIC_BLIZZARD_BARRAGE_TICK;onHit=ARCTIC_BLIZZARD_BARRAGE_HIT;v=10;i=1;hR=1;vR=1;syo=1.45;tyo=1;mr=13;sfo=0.5;eso=-1;g=0.05} @Forward{f=15}'
                    ]
                },
                'ARCTIC_BLIZZARD_BARRAGE_START': { Skills: ['- sound{s=entity.snowball.throw;p=0.6;v=0.7} @self'] },
                'ARCTIC_BLIZZARD_BARRAGE_TICK': { Skills: ['- particles{p=WHITE_ASH;amount=4;speed=0.07;hS=0.1;vS=0.1} @origin', '- particles{p=ITEM_SNOWBALL;amount=2;speed=0.04;hS=0.05;vS=0.05} @origin'] },
                'ARCTIC_BLIZZARD_BARRAGE_HIT': { Skills: ['- damage{amount=12}', '- freeze{ticks=300}', '- potion{type=WEAKNESS;duration=200;lvl=0}'] }
            })
        },
        {
            id: 'graveyard_brawler',
            name: 'Graveyard Brawler Launch',
            description: 'Throws the nearest player into the air',
            icon: 'fa-hand-back-fist',
            color: '#6b7280',
            category: 'offensive',
            difficulty: 'easy',
            options: [],
            mobSkillLine: () => '- skill{s=GRAVEYARD_BRAWLER_LAUNCH} ~onAttack 0.5',
            generateSkills: () => ({
                'GRAVEYARD_BRAWLER_LAUNCH': {
                    Skills: [
                        '- throw{velocity=18;velocityY=10} @EIR{r=3;target=players,animals;limit=1;sort=NEAREST}',
                        '- particles{p=cloud;amount=8;speed=0.2;hS=0.7;vS=0.7} @EIR{r=3;target=players,animals;limit=1;sort=NEAREST}',
                        '- sound{s=entity.zombie.attack_iron_door;v=1.0;p=0.8} @self'
                    ]
                }
            })
        }
    ],

    /**
     * Mob Templates - Pre-built mob configurations
     */
    mobTemplates: [
        { id: 'basic_melee', name: 'Basic Melee Mob', description: 'Simple melee attacker', icon: 'fa-sword', color: '#6b7280', difficulty: 'easy', defaults: { type: 'ZOMBIE', health: 40, damage: 6, armor: 2 } },
        { id: 'shadow_revenant', name: 'Shadow Revenant', description: 'Exploding suicide bomber mob', icon: 'fa-ghost', color: '#7c3aed', difficulty: 'hard', defaults: { type: 'ZOMBIE', health: 80, damage: 8, armor: 4 }, suggestedSkills: ['shadow_revenant_frenzy'] },
        { id: 'crypt_warden', name: 'Crypt Warden', description: 'Tank that enrages at low HP', icon: 'fa-shield-halved', color: '#22c55e', difficulty: 'medium', defaults: { type: 'ZOMBIE', health: 150, damage: 10, armor: 10 }, suggestedSkills: ['crypt_warden_fury'] },
        { id: 'frost_mage', name: 'Frost Mage', description: 'Ranged caster with ice attacks', icon: 'fa-snowflake', color: '#06b6d4', difficulty: 'medium', defaults: { type: 'SKELETON', health: 60, damage: 4, armor: 2 }, suggestedSkills: ['frostbite_shard', 'arctic_blizzard'] },
        { id: 'infernal_boss', name: 'Infernal Pyre Boss', description: 'Boss that rains fire from above', icon: 'fa-fire', color: '#dc2626', difficulty: 'hard', defaults: { type: 'BLAZE', health: 300, damage: 12, armor: 6 }, suggestedSkills: ['infernal_pyre_barrage'] },
        { id: 'earth_titan', name: 'Earth Titan', description: 'Ground-shaking boss with slam attack', icon: 'fa-mountain', color: '#a16207', difficulty: 'hard', defaults: { type: 'IRON_GOLEM', health: 400, damage: 15, armor: 15 }, suggestedSkills: ['terrashock_upheaval', 'earthshatter_impact'] }
    ],

    categories: {
        offensive: { name: 'Offensive', icon: 'fa-sword', color: '#ef4444', description: 'Damage-dealing abilities' },
        defensive: { name: 'Defensive', icon: 'fa-shield', color: '#22c55e', description: 'Healing and protection' },
        buff: { name: 'Buffs', icon: 'fa-arrow-up', color: '#eab308', description: 'Stat-boosting effects' },
        utility: { name: 'Utility', icon: 'fa-wrench', color: '#3b82f6', description: 'Movement and control' },
        visual: { name: 'Visual Effects', icon: 'fa-sparkles', color: '#f97316', description: 'Particle and sound effects' }
    },

    difficulties: {
        easy: { name: 'Easy', color: '#22c55e', icon: 'fa-circle' },
        medium: { name: 'Medium', color: '#eab308', icon: 'fa-circle-half-stroke' },
        hard: { name: 'Hard', color: '#ef4444', icon: 'fa-circle' }
    },

    getAllSkills() { return [...this.direct, ...this.metaskills]; },
    getSkillById(id) { return this.getAllSkills().find(s => s.id === id); },
    getMobTemplateById(id) { return this.mobTemplates.find(t => t.id === id); },
    getSkillsByCategory(category) { return this.getAllSkills().filter(s => s.category === category); },
    isMetaskill(skillId) { return this.metaskills.some(s => s.id === skillId); }
};

window.GuidedModePresets = GuidedModePresets;
