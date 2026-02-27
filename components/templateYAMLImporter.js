/**
 * Template YAML Importer - Smart Analysis Engine
 * Intelligently analyzes YAML files, detects patterns, and suggests groupings
 * Updated with comprehensive MythicMobs mechanics, targeters, and triggers
 */
class TemplateYAMLImporter {
    constructor(templateManager) {
        this.templateManager = templateManager;
        
        // ══════════════════════════════════════════════════════════════════════════════
        // COMPLETE MECHANICS DATABASE (245+ mechanics with aliases)
        // ══════════════════════════════════════════════════════════════════════════════
        this.KNOWN_MECHANICS = [
            // Damage mechanics
            'damage', 'd', 'basedamage', 'percentdamage', 'perdamage', 'damagepercent', 'hit', 'physicaldamage', 'meleehit',
            'explosion', 'explode', 'fakeexplosion', 'fakeexplode',
            
            // Healing mechanics
            'heal', 'h', 'healpercent', 'percentheal', 'hp', 'feed', 'shield',
            
            // Movement mechanics
            'teleport', 'tp', 'teleportto', 'tpto', 'leap', 'throw', 'velocity', 'jump', 'lunge', 'pull', 'forcepull',
            'disengage', 'dash', 'propel', 'spring', 'recoil', 'directionalvelocity', 'dvelocity',
            
            // Projectile mechanics
            'projectile', 'p', 'missile', 'mi', 'orbital', 'totem', 'chain', 'chainmissile', 'cmi',
            'shoot', 'shootprojectile', 'shootfireball', 'fireball', 'shootskull', 'skull',
            'shootshulkerbullet', 'shulkerbullet', 'shootpotion', 'potionprojectile',
            'arrowvolley', 'volley', 'beam', 'enderbeam', 'guardianbeam', 'gbeam',
            'ray', 'raytrace', 'raytraceto', 'slash', 'polygon',
            
            // Particle mechanics
            'particle', 'particles', 'effect:particles', 'e:particles', 'e:particle', 'e:p',
            'particleline', 'effect:particleline', 'e:pl', 'pl',
            'particlering', 'effect:particlering', 'e:pr', 'pr',
            'particlesphere', 'effect:particlesphere', 'e:ps', 'ps',
            'particlebox', 'effect:particlebox', 'e:pb', 'pb',
            'particletornado', 'effect:particletornado', 'e:pt',
            'particleorbital', 'effect:particleorbital', 'particlecircle',
            'particleequation', 'effect:particleequation', 'e:peq', 'peq',
            'particlelinehelix', 'particlehelixline', 'particlelinering', 'particleringline',
            'particlewave', 'geyser', 'atom', 'effect:atom', 'e:atom',
            'ender', 'effect:ender', 'e:ender', 'flames', 'effect:flames', 'e:flames',
            'smoke', 'effect:smoke', 'e:smoke', 'smokeswirl', 'swirl',
            
            // Sound mechanics
            'sound', 'effect:sound', 'e:sound', 'e:s', 'stopsound', 'playblockbreaksound', 'blockbreaksound',
            
            // Potion/Effect mechanics
            'potion', 'potionclear', 'clearpotions', 'aura', 'auraremove', 'removeaura',
            'stataura', 'statbuff', 'statdebuff',
            
            // Status effect mechanics
            'stun', 'silence', 'disarm', 'root', 'slow', 'blind', 'fear', 'taunt', 'freeze', 'glow',
            
            // Entity control mechanics
            'settarget', 'cleartarget', 'resettarget', 'setai', 'resetai',
            'setfaction', 'faction', 'setlevel', 'setname', 'sethealth', 'sethp',
            'setmaxhealth', 'setgravity', 'setspeed', 'setcollidable', 'collidable',
            'setflying', 'fly', 'setgliding', 'glide', 'hide', 'invisible', 'showentity', 'show',
            
            // Mount mechanics
            'mount', 'vehicle', 'mountme', 'mounttarget', 'dismount', 'remount', 'ejectpassenger',
            'saddle', 'passenger', 'rider',
            
            // Summon mechanics
            'summon', 'spawnmobs', 'spawnmob', 'remove', 'delete', 'suicide', 'kill', 'die', 'decapitate', 'drophead',
            
            // Message mechanics
            'message', 'm', 'msg', 'speak', 'say', 'sendactionmessage', 'actionmsg',
            'sendtitle', 'title', 'sendtoast', 'toast', 'jsonmessage', 'jsonmsg', 'randommessage', 'randmsg',
            
            // Command mechanics
            'command', 'sudocommand', 'sudoskill', 'sudo',
            
            // Skill mechanics
            'skill', 'metaskill', 'meta', 's', '$', '()', 'mechanics', 'spell',
            'randomskill', 'rskill', 'randskill', 'variableskill', 'varskill',
            'cancelskill', 'cancel', 'return',
            
            // Timing mechanics
            'delay', 'wait', 'repeat', 'foreach', 'foreachvalue',
            
            // Aura/buff mechanics (as mechanics, not triggers)
            'ondamaged', 'onattack', 'onhit', 'ondeath', 'oninteract', 'onrightclick',
            'onshoot', 'onbowshoot', 'onswing', 'onleftclick', 'onblockbreak', 'onbreakblock',
            'onblockplace', 'onplaceblock', 'onjump', 'onchat', 'chatprompt',
            
            // Variable mechanics
            'setvariable', 'var', 'variableadd', 'varadd', 'variablesubtract', 'varsub',
            'variablemath', 'varmath', 'variablemove', 'movevar', 'varmove', 'variableunset', 'varunset',
            'setvariablelocation', 'varloc',
            
            // Score mechanics
            'modifyscore', 'modscore', 'setscore', 'modifyglobalscore', 'modglobalscore', 'setglobalscore', 'globalscore',
            'modifymobscore', 'modmobscore', 'setmobscore', 'mobscore',
            'modifytargetscore', 'modtargetscore', 'settargetscore', 'targetscore',
            
            // Block mechanics
            'setblock', 'setblocktype', 'breakblock', 'break', 'breakblockandgiveitem', 'breakgive',
            'blockmask', 'mask', 'blockunmask', 'unmask', 'blockwave', 'wave',
            'blockdestabilize', 'destabilizeblock', 'blockphysics', 'physics',
            'pushblock', 'blockpush', 'setblockopen', 'blockopen', 'bonemeal',
            
            // World mechanics
            'lightning', 'fakelightning', 'effect:lightning', 'e:lightning',
            'weather', 'time', 'settime', 'activatespawner', 'spawner',
            'setchunkforceloaded', 'forceload', 'fawepaste', 'paste', 'undopaste', 'undo',
            'worldeditreplace', 'wereplace',
            
            // Item mechanics
            'giveitem', 'give', 'takeitem', 'take', 'dropitem', 'equip', 'equipcopy', 'copyequip',
            'giveitemfromslot', 'givefromslot', 'giveitemfromtarget', 'givefromtarget',
            'consume', 'consumeslot', 'consumeslotitem', 'removehelditem', 'consumehelditem', 'takehelditem',
            'stealitem', 'steal', 'pickupitem', 'pickup', 'itemspray', 'spray',
            
            // Cooldown mechanics
            'globalcooldown', 'gcd', 'setgcd', 'setglobalcooldown',
            'setskillcooldown', 'ssc', 'setcooldown',
            'setitemgroupcooldown', 'groupcooldown', 'setmaterialcooldown', 'materialcooldown',
            
            // Disguise mechanics
            'disguise', 'disguisetarget', 'undisguise', 'disguisemodify', 'modifydisguise',
            
            // Signal mechanics
            'signal', 'sendsignal',
            
            // Threat mechanics
            'threat', 'threatchange', 'threatmod', 'rally', 'callforhelp',
            
            // Experience mechanics
            'giveexperiencelevels', 'givelevels', 'takeexperiencelevels', 'takelevels',
            'clearexperience', 'clearxp', 'clearexp', 'clearexperiencelevels', 'clearlevels',
            
            // AI mechanics
            'goto', 'pathto', 'navigateto', 'followpath', 'runaigoalselector', 'rungoal',
            'runaitargetselector', 'runtarget', 'gotonpc', 'walkto', 'lookatplayers',
            
            // Look mechanics
            'look', 'rotatetowards', 'rotate', 'setrotation', 'rotation', 'setpitch', 'pitch',
            'matchrotation', 'matchrot', 'spin',
            
            // Display mechanics
            'hologram', 'blackscreen', 'fadescreen', 'bloodyscreen', 'bloodscreen', 'skybox',
            'displaytransformation', 'settransformation', 'transformation',
            'settextdisplay', 'textdisplay', 'setdisplayentityitem', 'displayitem',
            
            // Armor stand mechanics
            'animatearmorstand', 'armorstandanim', 'posearmorstand', 'armorstandpose', 'setpose', 'pose',
            
            // Animation mechanics
            'armanimation', 'armanim', 'playanimation', 'playanim', 'swingoffhand', 'offhandswing',
            
            // Firework mechanics
            'firework', 'fireworks', 'effect:firework', 'e:firework',
            
            // Tag mechanics
            'addtag', 'tag', 'removetag', 'untag',
            
            // Owner/Parent mechanics
            'setowner', 'owner', 'removeowner', 'clearowner', 'setparent', 'parent',
            
            // Prison mechanics
            'prison', 'bouncy', 'bounce',
            
            // Mob-specific mechanics
            'ignite', 'extinguish', 'removefire', 'oxygen',
            'setleasholder', 'leash', 'settongueTarget', 'tongue',
            'goatram', 'creepercharge', 'enderdragonsphase', 'setdragonphase',
            'enderdragonresetcrystals', 'resetcrystals', 'enderdragonspawnportal', 'spawnportal',
            'setdragonpodium', 'dragonpodium', 'setraidercanjoinraid', 'setcanjoinraid',
            'setraiderpatrolblock', 'patrolblock', 'setraiderpatrolleader', 'patrolleader',
            
            // Inventory mechanics
            'closeinventory', 'closeinv', 'opencustommenu', 'openmenu', 'opentrades', 'trade', 'addtrade',
            
            // Boss bar mechanics
            'barcreate', 'createbar', 'bossbar', 'barremove', 'removebar', 'barset', 'setbar', 'updatebar',
            'bossborder', 'worldborder',
            
            // Resource pack mechanics
            'sendresourcepack', 'resourcepack',
            
            // Misc mechanics
            'cancelevent', 'swap', 'swaplocations', 'tracklocation', 'track',
            'modifydamage', 'moddamage', 'modifyprojectile', 'projectilemodify',
            'projectilevelocity', 'pvelocity', 'endprojectile', 'terminateprojectile', 'endproj', 'stopproj',
            'setprojectilebulletmodel', 'setprojectiledirection',
            'determinecondition', 'detcond', 'switch',
            'setnodamageticks', 'nodamageticks', 'setpathfindingmalus', 'pathmalus',
            'setstance', 'stance', 'togglelever', 'lever', 'togglepiston', 'piston',
            'togglesitting', 'sit', 'stopusingitem', 'stopuse',
            'cast', 'shieldbreak', 'breakshield', 'totemofundying', 'totem',
            'attribute', 'attributemodifier', 'attrmod', 'buff', 'debuff',
            'setinteractionsize', 'interactionsize', 'setmobcolor', 'mobcolor', 'setcolor',
            'setgamemode', 'gamemode', 'log', 'printtree', 'printparenttree',
            'terminable', 'stoppable', 'cancelable', 'exit', 'formline',
            
            // Currency mechanics (MMOCore/AureliumSkills integration)
            'currencygive', 'givecurrency', 'currencytake', 'takecurrency'
        ];
        
        // ══════════════════════════════════════════════════════════════════════════════
        // COMPLETE TARGETERS DATABASE (74+ targeters with aliases)
        // ══════════════════════════════════════════════════════════════════════════════
        this.KNOWN_TARGETERS = [
            // Single Entity Targeters
            '@self', '@caster', '@boss', '@mob',
            '@target', '@t',
            '@trigger',
            '@nearestplayer',
            '@wolfowner', '@owner',
            '@parent', '@summoner',
            '@mount', '@vehicle',
            '@father', '@dad', '@daddy',
            '@mother', '@mom', '@mommy',
            '@passenger', '@rider',
            '@playerbyname', '@specificplayer',
            '@uniqueidentifier', '@uuid',
            '@interactionlastattacker', '@lastattacker',
            '@interactionlastinteract', '@lastinteract',
            
            // Multi Entity Targeters
            '@livingincone', '@entitiesincone', '@livingentitiesincone', '@leic', '@eic',
            '@livinginworld', '@eiw', '@allinworld', '@livingentitiesinworld', '@entitiesinworld',
            '@notlivingnearorigin', '@nonlivingnearorigin', '@nlno',
            '@playersinradius', '@pir',
            '@mobsinradius', '@mir', '@mobs',
            '@entitiesinradius', '@livingentitiesinradius', '@livinginradius', '@allinradius', '@eir', '@entitiesnearby', '@nearbyentities',
            '@entitiesinring', '@eirr',
            '@entitiesinringnearorigin', '@erno',
            '@playersinworld', '@world',
            '@playersonserver', '@server', '@everyone',
            '@playersinring',
            '@playersnearorigin', '@pno',
            '@trackedplayers', '@tracked',
            '@mobsnearorigin',
            '@entitiesnearorigin', '@eno',
            '@children', '@child', '@summons',
            '@siblings', '@sibling', '@brothers', '@sisters',
            '@itemsnearorigin',
            '@itemsinradius', '@iir',
            
            // Threat Table Targeters
            '@threattable', '@tt',
            '@threattableplayers',
            '@randomthreattarget', '@rtt',
            '@randomthreattargetlocation', '@rttl',
            '@highestthreat',
            
            // Single Location Targeters
            '@selflocation', '@casterlocation', '@bosslocation', '@moblocation',
            '@selfeyelocation', '@eyedirection', '@castereyelocation', '@bosseyelocation', '@mobeyelocation',
            '@forward',
            '@projectileforward',
            '@targetlocation', '@targetloc', '@tl',
            '@triggerlocation',
            '@origin', '@source',
            '@location',
            '@spawnlocation',
            '@casterspawnlocation',
            '@variablelocation', '@varlocation',
            '@targetpredictedlocation',
            '@obstructingblock',
            '@targetblock',
            '@neareststructure',
            '@highestblock',
            '@playerlocationbyname',
            '@forwardwall',
            '@ownerlocation',
            '@parentlocation', '@summonerlocation',
            
            // Multi Location Targeters
            '@ring',
            '@cone',
            '@sphere',
            '@rectangle', '@cube', '@cuboid',
            '@line',
            '@randomlocationsnearcaster', '@randomlocations', '@rlnc',
            '@randomlocationsnearorigin', '@rlo', '@randomlocationsorigin', '@rlno',
            '@randomlocationsneartarget', '@rlnt', '@randomlocationsneartargets',
            '@blocksnearorigin', '@bno',
            '@blocksinradius', '@bir',
            '@ringaroundorigin', '@ringorigin', '@rao',
            '@playerlocationsinradius',
            '@spawners',
            '@chunksinweregion',
            
            // Meta Entity Targeters
            '@livinginline', '@entitiesinline', '@livingentitiesinline', '@leil', '@eil',
            '@livingneartargetlocation', '@lntl', '@entl', '@ent',
            '@playersneartargetlocations',
            '@targetedtarget',
            
            // Meta Location Targeters
            '@flooroftargets',
            '@locationsoftargets',
            '@targetedlocation',
            '@blocksinchunk',
            '@blockvein',
            
            // Special Targeters
            '@none',
            '@region'
        ];
        
        // ══════════════════════════════════════════════════════════════════════════════
        // COMPLETE TRIGGERS DATABASE (32+ triggers with aliases)
        // ══════════════════════════════════════════════════════════════════════════════
        this.KNOWN_TRIGGERS = [
            // Combat triggers
            '~oncombat',
            '~onattack',
            '~ondamaged', '~onhurt',
            '~onentercombat',
            '~ondropcombat', '~onleavecombat', '~oncombatdrop', '~onexitcombat',
            '~onchangetarget', '~ontargetchange',
            '~onplayerkill', '~onkillplayer',
            '~onskilluse',
            '~onskilldamage', '~onskillhit', '~onskill_damage',
            
            // Lifecycle triggers
            '~onspawn',
            '~ondespawn', '~ondespawned',
            '~onready', '~onfirstspawn',
            '~onload',
            '~onspawnorload',
            '~ondeath',
            '~onchangeworld', '~onchange_world', '~onworld_change', '~onworldchange',
            '~onrespawn',
            
            // Player interaction triggers
            '~oninteract',
            '~ontame',
            '~onbreed',
            '~ontrade',
            '~onbucket', '~onusebucket', '~onfillbucket', '~onbucketfill', '~onmilk', '~onmilked',
            
            // Timed triggers
            '~ontimer',
            
            // Projectile triggers
            '~onshoot', '~onbowshoot', '~onshootbow',
            '~onbowhit', '~onbow_hit', '~onarrowhit',
            '~onprojectilehit', '~onprojectile_hit', '~ontrident_hit', '~ontridenthit',
            '~onprojectileland', '~onprojectile_land', '~ontridentland',
            '~onprojectilelaunch',
            
            // Special triggers
            '~ondismounted', '~onunmounted',
            '~onexplode',
            '~onprime',
            '~oncreepercharge', '~oncreeper_charge', '~oncharged', '~oncharge',
            '~onteleport',
            '~onhear',
            '~onsignal',
            '~oncritical',
            
            // Block triggers
            '~onswing', '~onleftclick',
            '~onuse', '~onrightclick',
            '~onblockplace', '~onplaceblock',
            '~onblockbreak', '~onbreakblock',
            '~onjump',
            
            // Mob kill trigger
            '~onmobkill', '~onkillmob'
        ];
        
        // ══════════════════════════════════════════════════════════════════════════════
        // MOB-SPECIFIC FIELDS
        // ══════════════════════════════════════════════════════════════════════════════
        this.MOB_FIELDS = [
            'Type', 'Health', 'Damage', 'Armor', 'Display', 'Faction', 'Mount', 'Options',
            'AIGoalSelectors', 'AITargetSelectors', 'Drops', 'DamageModifiers', 'Equipment',
            'KillMessages', 'LevelModifiers', 'Disguise', 'BossBar', 'Hearing', 'Modules',
            'Components', 'Trades', 'Variables', 'Nameplate', 'Model', 'ModelEngine',
            'ShowHealth', 'PreventOtherDrops', 'PreventRandomEquipment', 'PreventSunburn',
            'PreventMobKillDrops', 'PreventRename', 'NoDamageTicks', 'MaxCombatDistance',
            'FollowRange', 'MovementSpeed', 'KnockbackResistance', 'AttackDamage',
            'AttackSpeed', 'FlyingSpeed', 'Display', 'DisplayName'
        ];
        
        // ══════════════════════════════════════════════════════════════════════════════
        // CATEGORY DETECTION KEYWORDS
        // ══════════════════════════════════════════════════════════════════════════════
        this.CATEGORY_KEYWORDS = {
            'combat': ['damage', 'attack', 'strike', 'slash', 'hit', 'hurt', 'kill', 'weapon', 'sword', 'bow', 'projectile', 'shoot', 'missile', 'chain', 'bolt', 'beam'],
            'effects': ['particle', 'sound', 'effect', 'visual', 'display', 'glow', 'aura', 'ring', 'sphere', 'line', 'tornado', 'flame', 'smoke', 'firework'],
            'movement': ['teleport', 'dash', 'leap', 'lunge', 'velocity', 'speed', 'jump', 'fly', 'launch', 'throw', 'pull', 'push', 'disengage', 'propel', 'spring'],
            'support': ['heal', 'buff', 'shield', 'protect', 'defense', 'regen', 'restore', 'guard', 'barrier'],
            'utility': ['message', 'command', 'setblock', 'summon', 'spawn', 'signal', 'variable', 'score', 'tag'],
            'crowd-control': ['stun', 'slow', 'root', 'fear', 'silence', 'blind', 'knockback', 'throw', 'pull', 'freeze', 'taunt', 'disarm'],
            'passive': ['passive', 'timer', 'aura', 'buff', 'regen', 'step', 'drift', 'flight'],
            'boss': ['boss', 'ultimate', 'phase', 'special', 'elite', 'legendary']
        };
        
        // Build lowercase lookup set for faster mechanic checking
        this._mechanicsLower = new Set(this.KNOWN_MECHANICS.map(m => m.toLowerCase()));
        this._targetersLower = new Set(this.KNOWN_TARGETERS.map(t => t.toLowerCase()));
        this._triggersLower = new Set(this.KNOWN_TRIGGERS.map(t => t.toLowerCase()));
        
        // ══════════════════════════════════════════════════════════════════════════════
        // PRE-COMPILED REGEX PATTERNS FOR PERFORMANCE
        // Compiling once instead of per-line saves significant CPU cycles
        // ══════════════════════════════════════════════════════════════════════════════
        
        // Mechanic extraction (first word in line)
        this._regexMechanic = /^-?\s*(\w+)/;
        
        // Skill call extraction
        this._regexSkillCall = /skill\{[^}]*s=([^;}\s]+)/gi;
        
        // Combined callback pattern (instead of 14 separate patterns)
        // Uses named groups for identification
        this._regexCallbacks = /(?:ontick|onhit|onstart|onend|ondamagedskill|onattackskill|onbounce|onhitblock|ohb|oninteract|onstartskill|ontickskill|onendskill|oncooldownskill)=([^;}\s]+)/gi;
        
        // Targeter extraction
        this._regexTargeters = /@(\w+)(?:\{[^}]*\})?/gi;
        
        // Inline conditions
        this._regexConditions = /\?!?(\w+)/gi;
        
        // Triggers
        this._regexTriggers = /~on\w+/gi;
        
        // Combined attribute patterns - matches all common attributes in one pass
        this._regexAttributes = /(?:amount|a|damage|delay|d|duration|velocity|v|repeat|r|radius|level|lvl|l|type|t|interval|i|ticks|cooldown)=(\d+(?:\.\d+)?|\w+)/gi;
        
        // Pre-compiled attribute extraction patterns (still used for specific extraction)
        this._attrPatterns = [
            { regex: /amount=(\d+(?:\.\d+)?)/i, key: 'amount' },
            { regex: /(?:^|[;{])a=(\d+(?:\.\d+)?)/i, key: 'damage' },
            { regex: /damage=(\d+(?:\.\d+)?)/i, key: 'damage' },
            { regex: /delay\s+(\d+)/i, key: 'delay' },
            { regex: /(?:^|[;{])d=(\d+)/i, key: 'duration' },
            { regex: /duration=(\d+)/i, key: 'duration' },
            { regex: /velocity=(\d+(?:\.\d+)?)/i, key: 'velocity' },
            { regex: /(?:^|[;{])v=(\d+(?:\.\d+)?)/i, key: 'velocity' },
            { regex: /repeat=(\d+)/i, key: 'repeat' },
            { regex: /(?:^|[;{])r=(\d+(?:\.\d+)?)/i, key: 'radius' },
            { regex: /radius=(\d+(?:\.\d+)?)/i, key: 'radius' },
            { regex: /level=(\d+)/i, key: 'level' },
            { regex: /lvl=(\d+)/i, key: 'level' },
            { regex: /(?:^|[;{])l=(\d+)/i, key: 'level' },
            { regex: /type=(\w+)/i, key: 'type' },
            { regex: /(?:^|[;{])t=(\w+)/i, key: 'type' },
            { regex: /interval=(\d+)/i, key: 'interval' },
            { regex: /(?:^|[;{])i=(\d+)/i, key: 'interval' },
            { regex: /ticks=(\d+)/i, key: 'ticks' },
            { regex: /cooldown=(\d+(?:\.\d+)?)/i, key: 'cooldown' }
        ];
    }

    /**
     * Main entry point: Parse and analyze YAML content
     */
    analyzeYAML(yamlContent, forcedType = null) {
        try {
            const parsed = jsyaml.load(yamlContent);
            
            if (!parsed || typeof parsed !== 'object') {
                return { success: false, error: 'Invalid YAML structure' };
            }
            
            const fileType = forcedType || this.detectFileType(parsed);
            const skills = this.extractSkills(parsed, fileType);
            
            if (skills.length === 0) {
                const isMobFile = fileType === 'mob';
                return { 
                    success: false, 
                    error: isMobFile 
                        ? 'No valid mobs found in file. Make sure mobs have a Type field or mob-specific fields like Health, Damage, etc.' 
                        : 'No skills found in file. Make sure skills have a "Skills:" array with valid mechanics.'
                };
            }
            
            const analyzedSkills = skills.map(skill => this.analyzeSkill(skill));
            const hasTriggers = analyzedSkills.some(s => s.triggers.length > 0);
            const isMobSourceType = analyzedSkills.some(s => s.sourceType === 'mob');
            const context = (hasTriggers || isMobSourceType) ? 'mob' : 'skill';
            const dependencies = this.buildDependencyGraph(analyzedSkills);
            const namingPatterns = this.detectNamingPatterns(analyzedSkills);
            
            // Grouping using naming patterns + dependencies
            const suggestedGroups = this.generateGroupingSuggestions(analyzedSkills, dependencies, namingPatterns);
            const missingSkills = this.findMissingSkillReferences(analyzedSkills, dependencies);
            const componentStats = this.aggregateComponentStats(analyzedSkills);
            
            return {
                success: true,
                fileType,
                context,
                hasTriggers,
                totalSkills: analyzedSkills.length,
                totalLines: yamlContent.split('\n').length,
                skills: analyzedSkills,
                dependencies,
                namingPatterns,
                suggestedGroups,
                missingSkills,
                componentStats,
                warnings: this.generateWarnings(analyzedSkills, missingSkills, dependencies)
            };
            
        } catch (error) {
            return { success: false, error: `YAML parsing failed: ${error.message}` };
        }
    }
    
    detectFileType(parsed) {
        const keys = Object.keys(parsed);
        let mobFieldCount = 0;
        let skillFieldCount = 0;
        
        for (const key of keys) {
            const section = parsed[key];
            if (!section || typeof section !== 'object') continue;
            
            const sectionKeys = Object.keys(section);
            
            for (const field of this.MOB_FIELDS) {
                if (sectionKeys.includes(field)) mobFieldCount++;
            }
            
            if (sectionKeys.includes('Skills') && Array.isArray(section.Skills)) {
                const firstLine = section.Skills[0];
                if (typeof firstLine === 'string' && this.looksLikeSkillLine(firstLine)) {
                    skillFieldCount++;
                }
            }
            
            if (sectionKeys.includes('Cooldown')) skillFieldCount++;
        }
        
        return (mobFieldCount > skillFieldCount * 2) ? 'mob' : 'skill';
    }

    looksLikeSkillLine(line) {
        if (typeof line !== 'string') return false;
        const trimmed = line.trim();
        const trimmedLower = trimmed.toLowerCase();
        
        // Handle lines starting with '- ' (shouldn't happen after js-yaml parsing, but just in case)
        if (trimmed.startsWith('- ')) {
            return this.looksLikeSkillLine(trimmed.substring(2));
        }
        
        // Check for targeter patterns anywhere in line (strong indicator of skill line)
        if (/@\w+/.test(trimmed)) {
            return true;
        }
        
        // Check for common skill line patterns: mechanic{...} or mechanic ...
        const mechanicMatch = trimmedLower.match(/^(\w+)(?:\{|\s|$)/);
        if (mechanicMatch) {
            const mechanic = mechanicMatch[1].toLowerCase();
            if (this._mechanicsLower.has(mechanic)) {
                return true;
            }
        }
        
        // Check for mechanic with parameters pattern: word{...}
        if (/^\w+\{[^}]*\}/.test(trimmed)) {
            return true;
        }
        
        // Check for common skill keywords
        const skillKeywords = ['damage', 'heal', 'teleport', 'projectile', 'sound', 'particle', 
            'potion', 'delay', 'skill', 'message', 'effect', 'summon', 'aura', 'orbital'];
        for (const keyword of skillKeywords) {
            if (trimmedLower.includes(keyword)) {
                return true;
            }
        }
        
        return false;
    }

    extractSkills(parsed, fileType) {
        const skills = [];
        if (window.DEBUG_MODE) console.log('[YAML Importer] Extracting skills from parsed YAML, fileType:', fileType);
        if (window.DEBUG_MODE) console.log('[YAML Importer] Top-level keys:', Object.keys(parsed).slice(0, 20));
        
        for (const [name, data] of Object.entries(parsed)) {
            // Skip null/undefined entries
            if (data === null || data === undefined) {
                if (window.DEBUG_MODE) console.log(`[YAML Importer] Skipping "${name}" - null or undefined`);
                continue;
            }
            
            // Handle case where data is not an object (could be a direct value)
            if (typeof data !== 'object') {
                if (window.DEBUG_MODE) console.log(`[YAML Importer] Skipping "${name}" - not an object (type: ${typeof data})`);
                continue;
            }
            
            // Check for Skills array (case-insensitive)
            const dataKeys = Object.keys(data);
            const skillsKey = dataKeys.find(k => k.toLowerCase() === 'skills');
            let skillsArray = skillsKey ? data[skillsKey] : null;
            
            // Handle case where Skills might be a single string instead of array
            if (skillsArray && !Array.isArray(skillsArray)) {
                if (typeof skillsArray === 'string') {
                    skillsArray = [skillsArray];
                } else {
                    skillsArray = null;
                }
            }
            
            // Also check for Conditions, Cooldown which indicate a skill definition
            const hasConditions = dataKeys.some(k => k.toLowerCase() === 'conditions');
            const hasCooldown = dataKeys.some(k => k.toLowerCase() === 'cooldown');
            const hasTriggerConditions = dataKeys.some(k => k.toLowerCase() === 'triggerconditions');
            const hasTargetConditions = dataKeys.some(k => k.toLowerCase() === 'targetconditions');
            
            const isLikelySkill = skillsArray || hasConditions || hasCooldown || hasTriggerConditions || hasTargetConditions;
            
            if (fileType === 'mob') {
                // For mob files: Extract full mob configuration as a mob template
                // This preserves all mob fields (Type, Health, Damage, Equipment, etc.)
                const mobConfig = this.extractMobConfig(name, data, dataKeys);
                if (mobConfig) {
                    skills.push({ 
                        name, 
                        data: { Skills: skillsArray || [] }, 
                        sourceType: 'mob', 
                        rawData: data,
                        mobConfig // Full mob configuration
                    });
                    if (window.DEBUG_MODE) console.log(`[YAML Importer] Added mob: ${name} with ${skillsArray?.length || 0} skill lines`);
                }
            } else {
                // For skill files, be more lenient
                if (skillsArray && Array.isArray(skillsArray) && skillsArray.length > 0) {
                    // Copy over other skill properties
                    const normalizedData = { 
                        Skills: skillsArray,
                        Conditions: data.Conditions || data.conditions,
                        TargetConditions: data.TargetConditions || data.targetconditions,
                        TriggerConditions: data.TriggerConditions || data.triggerconditions,
                        Cooldown: data.Cooldown || data.cooldown,
                        OnCooldownSkill: data.OnCooldownSkill || data.oncooldownskill
                    };
                    skills.push({ name, data: normalizedData, sourceType: 'skill-file', rawData: data });
                    if (window.DEBUG_MODE) console.log(`[YAML Importer] Added skill: ${name} with ${skillsArray.length} lines`);
                } else if (isLikelySkill && !skillsArray) {
                    // Skill definition without Skills array - might just have Conditions
                    if (window.DEBUG_MODE) console.log(`[YAML Importer] Found skill-like entry without Skills array: ${name}`);
                }
            }
        }
        
        if (window.DEBUG_MODE) console.log(`[YAML Importer] Total skills extracted: ${skills.length}`);
        return skills;
    }

    /**
     * Extract full mob configuration from parsed YAML data
     * Preserves all MythicMobs mob fields for template storage
     */
    extractMobConfig(name, data, dataKeys) {
        const mobConfig = { internalName: name };
        
        // Extract all known mob fields (case-insensitive)
        for (const field of this.MOB_FIELDS) {
            const foundKey = dataKeys.find(k => k.toLowerCase() === field.toLowerCase());
            if (foundKey && data[foundKey] !== undefined) {
                mobConfig[field] = data[foundKey];
            }
        }
        
        // Also extract Skills array
        const skillsKey = dataKeys.find(k => k.toLowerCase() === 'skills');
        if (skillsKey && data[skillsKey]) {
            mobConfig.Skills = Array.isArray(data[skillsKey]) ? data[skillsKey] : [data[skillsKey]];
        }
        
        // Check for MobType/Type field (required for mobs)
        const hasType = mobConfig.Type || dataKeys.some(k => k.toLowerCase() === 'mobtype');
        if (hasType || dataKeys.some(k => this.MOB_FIELDS.map(f => f.toLowerCase()).includes(k.toLowerCase()))) {
            return mobConfig;
        }
        
        return null;
    }

    analyzeSkill(skill) {
        // Use Sets during analysis for O(1) deduplication, convert to arrays at end
        const analysis = {
            name: skill.name,
            data: skill.data,
            sourceType: skill.sourceType,
            mobConfig: skill.mobConfig || null, // Preserve full mob configuration
            lineCount: 0,
            _mechanicsSet: new Set(),
            _targetersSet: new Set(),
            _conditionsSet: new Set(),
            _triggersSet: new Set(),
            mechanics: [],
            targeters: [],
            conditions: [],
            triggers: [],
            attributes: {},
            skillCalls: [],
            complexity: 'beginner',
            suggestedCategory: 'utility'
        };
        
        const skillLines = skill.data.Skills || [];
        analysis.lineCount = skillLines.length;
        
        for (const line of skillLines) {
            if (typeof line !== 'string') continue;
            this.analyzeSkillLine(line, analysis);
        }
        
        if (skill.data.Conditions) {
            for (const cond of this.extractConditions(skill.data.Conditions)) {
                analysis._conditionsSet.add(cond);
            }
        }
        if (skill.data.TargetConditions) {
            for (const cond of this.extractConditions(skill.data.TargetConditions)) {
                analysis._conditionsSet.add(cond);
            }
        }
        if (skill.data.TriggerConditions) {
            for (const cond of this.extractConditions(skill.data.TriggerConditions)) {
                analysis._conditionsSet.add(cond);
            }
        }
        
        if (skill.data.Cooldown) analysis.attributes['cooldown'] = skill.data.Cooldown;
        if (skill.data.OnCooldownSkill) {
            analysis.skillCalls.push({ skillName: skill.data.OnCooldownSkill, context: 'OnCooldownSkill' });
        }
        
        // Convert Sets to arrays for final output
        analysis.mechanics = Array.from(analysis._mechanicsSet);
        analysis.targeters = Array.from(analysis._targetersSet);
        analysis.conditions = Array.from(analysis._conditionsSet);
        analysis.triggers = Array.from(analysis._triggersSet);
        
        // Clean up temporary Sets
        delete analysis._mechanicsSet;
        delete analysis._targetersSet;
        delete analysis._conditionsSet;
        delete analysis._triggersSet;
        
        analysis.complexity = this.calculateComplexity(analysis);
        analysis.suggestedCategory = this.suggestCategory(analysis);
        
        return analysis;
    }

    /**
     * Analyze a single skill line - OPTIMIZED with pre-compiled regex patterns
     * Uses class-level compiled patterns instead of creating new patterns per line
     */
    analyzeSkillLine(line, analysis) {
        const trimmed = line.trim().toLowerCase();
        
        // Extract mechanic (first word) - using pre-compiled pattern
        const mechanicMatch = trimmed.match(this._regexMechanic);
        if (mechanicMatch) {
            const mechanic = mechanicMatch[1].toLowerCase();
            if (this._mechanicsLower.has(mechanic)) {
                analysis._mechanicsSet.add(mechanic);
            }
        }
        
        // Extract skill{} calls - reset lastIndex for global regex reuse
        this._regexSkillCall.lastIndex = 0;
        let skillMatch;
        while ((skillMatch = this._regexSkillCall.exec(line)) !== null) {
            analysis.skillCalls.push({ skillName: skillMatch[1], context: 'skill-line' });
        }
        
        // OPTIMIZED: Combined callback pattern instead of 14 separate patterns
        // This reduces 14 regex iterations to 1
        this._regexCallbacks.lastIndex = 0;
        let callbackMatch;
        while ((callbackMatch = this._regexCallbacks.exec(line)) !== null) {
            // Extract the callback type from the match
            const fullMatch = callbackMatch[0];
            const contextName = fullMatch.split('=')[0];
            analysis.skillCalls.push({ skillName: callbackMatch[1], context: contextName });
        }
        
        // Targeters - extract all @targeter patterns
        this._regexTargeters.lastIndex = 0;
        let targeterMatch;
        while ((targeterMatch = this._regexTargeters.exec(line)) !== null) {
            const targeter = '@' + targeterMatch[1].toLowerCase();
            analysis._targetersSet.add(targeter);
        }
        
        // Inline conditions (starting with ?)
        this._regexConditions.lastIndex = 0;
        let condMatch;
        while ((condMatch = this._regexConditions.exec(line)) !== null) {
            analysis._conditionsSet.add(condMatch[0].toLowerCase());
        }
        
        // Triggers - using pre-compiled pattern
        this._regexTriggers.lastIndex = 0;
        let triggerMatch;
        while ((triggerMatch = this._regexTriggers.exec(trimmed)) !== null) {
            const triggerLower = triggerMatch[0].toLowerCase();
            if (this._triggersLower.has(triggerLower)) {
                analysis._triggersSet.add(triggerLower);
            }
        }
        
        // Attributes extraction - using pre-compiled patterns array
        for (const { regex, key } of this._attrPatterns) {
            const match = line.match(regex);
            if (match) {
                if (!analysis.attributes[key]) analysis.attributes[key] = [];
                analysis.attributes[key].push(match[1]);
            }
        }
    }

    extractConditions(conditions) {
        const result = [];
        if (Array.isArray(conditions)) {
            for (const cond of conditions) {
                if (typeof cond === 'string') {
                    const match = cond.match(/^-?\s*(\w+)/);
                    if (match) result.push(match[1]);
                }
            }
        }
        return result;
    }

    calculateComplexity(analysis) {
        let score = analysis.lineCount * 2 + analysis.mechanics.length * 3 + 
                    analysis.skillCalls.length * 5 + analysis.conditions.length * 4 + 
                    analysis.triggers.length * 3;
        
        const complexMechanics = ['projectile', 'aura', 'orbital', 'chain', 'totem', 'ray', 'missile'];
        for (const mech of analysis.mechanics) {
            if (complexMechanics.includes(mech)) score += 8;
        }
        
        if (score < 15) return 'beginner';
        if (score < 35) return 'intermediate';
        if (score < 60) return 'advanced';
        return 'expert';
    }

    suggestCategory(analysis) {
        const scores = {};
        
        for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
            scores[category] = 0;
            for (const mechanic of analysis.mechanics) {
                if (keywords.some(kw => mechanic.includes(kw))) scores[category] += 3;
            }
            const nameLower = analysis.name.toLowerCase();
            for (const keyword of keywords) {
                if (nameLower.includes(keyword)) scores[category] += 5;
            }
        }
        
        let bestCategory = 'utility', bestScore = 0;
        for (const [category, score] of Object.entries(scores)) {
            if (score > bestScore) { bestScore = score; bestCategory = category; }
        }
        return bestCategory;
    }

    buildDependencyGraph(analyzedSkills) {
        const graph = { nodes: new Map(), edges: [] };
        
        for (const skill of analyzedSkills) {
            graph.nodes.set(skill.name, { skill, calledBy: [], calls: [] });
        }
        
        for (const skill of analyzedSkills) {
            for (const call of skill.skillCalls) {
                graph.edges.push({ from: skill.name, to: call.skillName, context: call.context });
                
                const sourceNode = graph.nodes.get(skill.name);
                if (sourceNode) sourceNode.calls.push(call.skillName);
                
                const targetNode = graph.nodes.get(call.skillName);
                if (targetNode) targetNode.calledBy.push(skill.name);
            }
        }
        
        return graph;
    }

    detectNamingPatterns(analyzedSkills) {
        const patterns = [];
        const skillNames = analyzedSkills.map(s => s.name);
        const prefixGroups = this.groupByPrefix(skillNames);
        
        for (const [prefix, names] of Object.entries(prefixGroups)) {
            if (names.length >= 2 && prefix.length >= 3) {
                patterns.push({
                    type: 'prefix',
                    pattern: prefix,
                    skills: names,
                    confidence: Math.min(0.9, 0.5 + (names.length * 0.1))
                });
            }
        }
        
        // Case-insensitive suffix patterns
        const suffixPatterns = ['-tick', '-hit', '-start', '-end', '-cooldown', '-effect', '_tick', '_hit', '-projectile', '-cast', '-aura', '-passive'];
        for (const suffix of suffixPatterns) {
            const matching = skillNames.filter(n => n.toLowerCase().endsWith(suffix));
            if (matching.length >= 1) {
                const bases = matching.map(n => n.slice(0, -suffix.length));
                for (const base of bases) {
                    const baseLower = base.toLowerCase();
                    const relatedNames = skillNames.filter(n => {
                        const nLower = n.toLowerCase();
                        return nLower === baseLower || nLower.startsWith(baseLower + '-') || nLower.startsWith(baseLower + '_');
                    });
                    if (relatedNames.length >= 2) {
                        // Check if this pattern wasn't already added
                        const existingPattern = patterns.find(p => 
                            p.type === 'base-with-suffixes' && 
                            p.pattern.toLowerCase() === base.toLowerCase()
                        );
                        if (!existingPattern) {
                            patterns.push({
                                type: 'base-with-suffixes',
                                pattern: base,
                                skills: relatedNames,
                                confidence: 0.85
                            });
                        }
                    }
                }
            }
        }
        
        if (window.DEBUG_MODE) console.log('[YAML Importer] Detected naming patterns:', patterns.length);
        return patterns;
    }

    groupByPrefix(names) {
        const groups = {};
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const prefix = this.commonPrefix(names[i], names[j]);
                if (prefix.length >= 3) {
                    let cleanPrefix = prefix.replace(/[-_]$/, '');
                    if (cleanPrefix.length >= 3) {
                        if (!groups[cleanPrefix]) groups[cleanPrefix] = new Set();
                        groups[cleanPrefix].add(names[i]);
                        groups[cleanPrefix].add(names[j]);
                    }
                }
            }
        }
        for (const key of Object.keys(groups)) groups[key] = Array.from(groups[key]);
        return groups;
    }

    commonPrefix(a, b) {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return a.slice(0, i);
    }

    generateGroupingSuggestions(analyzedSkills, dependencies, namingPatterns) {
        const groups = [];
        const assigned = new Set();
        
        if (window.DEBUG_MODE) console.log('[YAML Importer] generateGroupingSuggestions called with', analyzedSkills.length, 'skills');
        
        // Check if this is a mob file - use different grouping logic
        const isMobFile = analyzedSkills.some(s => s.sourceType === 'mob');
        
        if (isMobFile) {
            // MOB-SPECIFIC GROUPING: Only group mobs if "DUMMY" appears in one name
            // E.g., ZOMBIE_BOMBER + ZOMBIE_BOMBER_DUMMY should be grouped
            // But ZOMBIE_HORDE and ZOMBIE_EXPLOSIVE should NOT be grouped
            const dummyGroups = this.findDummyMobGroups(analyzedSkills);
            for (const group of dummyGroups) {
                groups.push(group);
                group.skills.forEach(s => assigned.add(s.name));
                if (window.DEBUG_MODE) console.log('[YAML Importer] Created DUMMY mob group:', group.suggestedName, 'with', group.skills.length, 'mobs');
            }
            
            // All other mobs are standalone (no grouping by prefix)
            const standalone = analyzedSkills.filter(s => !assigned.has(s.name));
            if (window.DEBUG_MODE) console.log('[YAML Importer] Mob file grouping result: groups=', groups.length, 'standalone=', standalone.length);
            return { groups, standalone, totalGroups: groups.length, totalStandalone: standalone.length };
        }
        
        // SKILL FILE GROUPING (original logic)
        // PRIORITY 0: Detect aura skill systems (main aura + lifecycle callbacks)
        const auraGroups = this.findAuraSkillSystems(analyzedSkills);
        for (const auraGroup of auraGroups) {
            if (auraGroup.skills.length >= 2) {
                groups.push(auraGroup);
                auraGroup.skills.forEach(s => assigned.add(s.name));
                if (window.DEBUG_MODE) console.log('[YAML Importer] Created aura group:', auraGroup.suggestedName, 'with', auraGroup.skills.length, 'skills');
            }
        }
        
        // PRIORITY 1: If ALL remaining skills share a common prefix (like ZOMBIE_BLEEDING, ZOMBIE_BLEEDING-Start, etc.),
        // suggest them as ONE group (only if no aura groups were found)
        const unassignedSkills = analyzedSkills.filter(s => !assigned.has(s.name));
        if (unassignedSkills.length >= 2 && groups.length === 0) {
            const allNames = unassignedSkills.map(s => s.name);
            const commonPrefix = this.findLongestCommonPrefix(allNames);
            if (window.DEBUG_MODE) console.log('[YAML Importer] Common prefix check - names:', allNames, 'prefix:', commonPrefix);
            
            if (commonPrefix && commonPrefix.length >= 3) {
                if (window.DEBUG_MODE) console.log('[YAML Importer] All skills share common prefix:', commonPrefix);
                const group = {
                    type: 'common-prefix-all',
                    reason: `All skills share prefix "${commonPrefix}"`,
                    suggestedName: this.toReadableName(commonPrefix),
                    skills: [...unassignedSkills],
                    confidence: 0.98
                };
                groups.push(group);
                unassignedSkills.forEach(s => assigned.add(s.name));
                if (window.DEBUG_MODE) console.log('[YAML Importer] Created group with', group.skills.length, 'skills, suggestedName:', group.suggestedName);
            }
        }
        
        // PRIORITY 1: Skill call chains (projectile callbacks, etc.)
        const chains = this.findSkillChains(dependencies);
        for (const chain of chains) {
            if (chain.length >= 2) {
                // Only process if at least one skill isn't already assigned
                const unassignedInChain = chain.filter(name => !assigned.has(name));
                if (unassignedInChain.length >= 2) {
                    const groupSkills = chain.map(name => analyzedSkills.find(s => s.name === name)).filter(Boolean);
                    if (groupSkills.length >= 2) {
                        groups.push({
                            type: 'call-chain',
                            reason: 'Linked by skill{} calls',
                            suggestedName: this.suggestGroupName(groupSkills),
                            skills: groupSkills,
                            confidence: 0.95
                        });
                        chain.forEach(name => assigned.add(name));
                    }
                }
            }
        }
        
        // PRIORITY 2: Naming patterns (prefix-based grouping)
        for (const pattern of namingPatterns) {
            const unassignedSkills = pattern.skills
                .filter(name => !assigned.has(name))
                .map(name => analyzedSkills.find(s => s.name === name))
                .filter(Boolean);
            
            if (unassignedSkills.length >= 2) {
                groups.push({
                    type: 'naming-pattern',
                    reason: `Common ${pattern.type}: "${pattern.pattern}"`,
                    suggestedName: pattern.pattern,
                    skills: unassignedSkills,
                    confidence: pattern.confidence
                });
                pattern.skills.forEach(name => assigned.add(name));
            }
        }
        
        const standalone = analyzedSkills.filter(s => !assigned.has(s.name));
        
        if (window.DEBUG_MODE) console.log('[YAML Importer] Final grouping result: groups=', groups.length, 'standalone=', standalone.length);
        groups.forEach((g, i) => console.log(`[YAML Importer] Group ${i}: "${g.suggestedName}" with ${g.skills.length} skills`));
        
        return { groups, standalone, totalGroups: groups.length, totalStandalone: standalone.length };
    }
    
    /**
     * Find longest common prefix among all skill names
     * Returns null if the prefix is too generic (like "CR_" for a namespace)
     */
    findLongestCommonPrefix(names) {
        if (!names || names.length === 0) return '';
        if (names.length === 1) return names[0];
        
        let prefix = names[0];
        for (let i = 1; i < names.length; i++) {
            while (names[i].indexOf(prefix) !== 0) {
                prefix = prefix.slice(0, -1);
                if (prefix.length === 0) return '';
            }
        }
        // Clean trailing dash/underscore
        prefix = prefix.replace(/[-_]$/, '');
        
        // Don't use prefix if it's too short (likely a namespace like CR, MOB, SKILL)
        // or if it's a common short pattern
        if (prefix.length <= 4) {
            if (window.DEBUG_MODE) console.log('[YAML Importer] Prefix too short for full grouping:', prefix);
            return '';
        }
        
        // Don't use prefix if it looks like a namespace (all caps, 2-4 chars followed by underscore)
        // This prevents grouping ALL "CR_*" skills together
        const namespacePattern = /^[A-Z]{2,4}$/;
        if (namespacePattern.test(prefix)) {
            if (window.DEBUG_MODE) console.log('[YAML Importer] Prefix looks like namespace, skipping full grouping:', prefix);
            return '';
        }
        
        return prefix;
    }

    /**
     * Find aura skill systems - main aura skills and their lifecycle callbacks
     * Detects patterns like: SKILL_NAME (with Aura{onStart=SKILL_NAME-Start;onTick=SKILL_NAME-Tick;onEnd=SKILL_NAME-End})
     */
    findAuraSkillSystems(analyzedSkills) {
        const auraGroups = [];
        const skillMap = new Map(analyzedSkills.map(s => [s.name, s]));
        const processed = new Set();
        
        if (window.DEBUG_MODE) console.log('[YAML Importer] findAuraSkillSystems - checking', analyzedSkills.length, 'skills');
        
        for (const skill of analyzedSkills) {
            if (processed.has(skill.name)) continue;
            
            // Check if this skill has aura callbacks
            const auraCallbacks = skill.skillCalls.filter(call => 
                ['onstart', 'ontick', 'onend', 'onstartskill', 'ontickskill', 'onendskill'].includes(call.context.toLowerCase())
            );
            
            if (window.DEBUG_MODE) console.log('[YAML Importer] Skill:', skill.name, '- aura callbacks:', auraCallbacks.length, auraCallbacks.map(c => c.context));
            
            if (auraCallbacks.length > 0) {
                const groupSkills = [skill];
                processed.add(skill.name);
                
                // Find all referenced callback skills
                for (const callback of auraCallbacks) {
                    const callbackSkill = skillMap.get(callback.skillName);
                    if (window.DEBUG_MODE) console.log('[YAML Importer] Looking for callback skill:', callback.skillName, '- found:', !!callbackSkill);
                    if (callbackSkill && !processed.has(callback.skillName)) {
                        groupSkills.push(callbackSkill);
                        processed.add(callback.skillName);
                    }
                }
                
                // Also find skills that match the naming pattern (SKILL-Start, SKILL-Tick, SKILL-End)
                const baseName = skill.name;
                const lifecycleSuffixes = ['-Start', '-Tick', '-End', '-Hit', '-Cooldown', '_Start', '_Tick', '_End'];
                for (const suffix of lifecycleSuffixes) {
                    const expectedName = baseName + suffix;
                    const lifecycleSkill = skillMap.get(expectedName);
                    if (lifecycleSkill && !processed.has(expectedName)) {
                        groupSkills.push(lifecycleSkill);
                        processed.add(expectedName);
                    }
                }
                
                if (groupSkills.length >= 2) {
                    auraGroups.push({
                        type: 'aura-system',
                        reason: `Aura skill with lifecycle callbacks`,
                        suggestedName: this.toReadableName(skill.name),
                        skills: groupSkills,
                        confidence: 0.95
                    });
                }
            }
        }
        
        // Also detect naming pattern groups (SKILL-Start, SKILL-Tick, SKILL-End without explicit aura)
        for (const skill of analyzedSkills) {
            if (processed.has(skill.name)) continue;
            
            // Check if this skill looks like a lifecycle callback
            const lifecycleMatch = skill.name.match(/^(.+?)[-_](Start|Tick|End|Hit|Cooldown)$/i);
            if (lifecycleMatch) {
                const baseName = lifecycleMatch[1];
                const baseSkill = skillMap.get(baseName);
                
                if (baseSkill && !processed.has(baseName)) {
                    // Found a base skill - collect all related lifecycle skills
                    const groupSkills = [baseSkill];
                    processed.add(baseName);
                    
                    const lifecycleSuffixes = ['-Start', '-Tick', '-End', '-Hit', '-Cooldown', '_Start', '_Tick', '_End'];
                    for (const suffix of lifecycleSuffixes) {
                        const expectedName = baseName + suffix;
                        const lifecycleSkill = skillMap.get(expectedName);
                        if (lifecycleSkill && !processed.has(expectedName)) {
                            groupSkills.push(lifecycleSkill);
                            processed.add(expectedName);
                        }
                    }
                    
                    if (groupSkills.length >= 2) {
                        auraGroups.push({
                            type: 'lifecycle-pattern',
                            reason: `Skill with lifecycle callbacks (${lifecycleMatch[2]})`,
                            suggestedName: this.toReadableName(baseName),
                            skills: groupSkills,
                            confidence: 0.92
                        });
                    }
                }
            }
        }
        
        return auraGroups;
    }

    /**
     * Find mob groups based on DUMMY naming pattern
     * Groups mobs like ZOMBIE_BOMBER + ZOMBIE_BOMBER_DUMMY together
     * Does NOT group mobs just because they share a prefix (like ZOMBIE_)
     */
    findDummyMobGroups(analyzedSkills) {
        const groups = [];
        const processed = new Set();
        const mobMap = new Map(analyzedSkills.map(s => [s.name, s]));
        
        if (window.DEBUG_MODE) console.log('[YAML Importer] findDummyMobGroups - checking', analyzedSkills.length, 'mobs');
        
        // Find all DUMMY mobs and group them with their parent
        for (const mob of analyzedSkills) {
            if (processed.has(mob.name)) continue;
            
            const nameUpper = mob.name.toUpperCase();
            
            // Check if this mob has "DUMMY" in its name
            if (nameUpper.includes('DUMMY')) {
                // Find the parent mob by removing DUMMY pattern
                // Patterns: MOB_NAME_DUMMY, MOB_NAME-DUMMY, MOBNAMEDUMMY
                let parentName = mob.name
                    .replace(/_DUMMY$/i, '')
                    .replace(/-DUMMY$/i, '')
                    .replace(/DUMMY$/i, '');
                
                const parentMob = mobMap.get(parentName);
                
                if (parentMob && !processed.has(parentName)) {
                    // Create group with parent + dummy
                    const groupSkills = [parentMob, mob];
                    processed.add(parentName);
                    processed.add(mob.name);
                    
                    // Also check for other DUMMY variants (e.g., MOB_DUMMY_2)
                    for (const [name, otherMob] of mobMap) {
                        if (processed.has(name)) continue;
                        if (name.toUpperCase().startsWith(parentName.toUpperCase()) && 
                            name.toUpperCase().includes('DUMMY')) {
                            groupSkills.push(otherMob);
                            processed.add(name);
                        }
                    }
                    
                    groups.push({
                        type: 'dummy-mob-group',
                        reason: `Mob with DUMMY variant(s)`,
                        suggestedName: this.toReadableName(parentName),
                        skills: groupSkills,
                        confidence: 0.95
                    });
                    
                    if (window.DEBUG_MODE) console.log('[YAML Importer] Created DUMMY group:', parentName, 'with', groupSkills.length, 'mobs');
                }
            }
        }
        
        // Check non-DUMMY mobs for their DUMMY variants
        for (const mob of analyzedSkills) {
            if (processed.has(mob.name)) continue;
            
            const nameUpper = mob.name.toUpperCase();
            if (nameUpper.includes('DUMMY')) continue; // Already processed
            
            // Check if this mob has DUMMY variants
            const dummyVariants = [];
            const possibleDummyNames = [
                mob.name + '_DUMMY',
                mob.name + '-DUMMY',
                mob.name + 'DUMMY'
            ];
            
            for (const dummyName of possibleDummyNames) {
                const dummyMob = mobMap.get(dummyName);
                if (dummyMob && !processed.has(dummyName)) {
                    dummyVariants.push(dummyMob);
                    processed.add(dummyName);
                }
            }
            
            if (dummyVariants.length > 0) {
                const groupSkills = [mob, ...dummyVariants];
                processed.add(mob.name);
                
                groups.push({
                    type: 'dummy-mob-group',
                    reason: `Mob with DUMMY variant(s)`,
                    suggestedName: this.toReadableName(mob.name),
                    skills: groupSkills,
                    confidence: 0.95
                });
                
                if (window.DEBUG_MODE) console.log('[YAML Importer] Created DUMMY group for:', mob.name, 'with', groupSkills.length, 'mobs');
            }
        }
        
        return groups;
    }

    findSkillChains(dependencies) {
        const chains = [];
        const visited = new Set();
        
        const roots = [];
        for (const [name, node] of dependencies.nodes) {
            if (node.calls.length > 0 && node.calledBy.length === 0) roots.push(name);
        }
        
        if (roots.length === 0) {
            const sorted = Array.from(dependencies.nodes.entries())
                .filter(([_, node]) => node.calls.length > 0)
                .sort((a, b) => b[1].calls.length - a[1].calls.length);
            if (sorted.length > 0) roots.push(sorted[0][0]);
        }
        
        for (const root of roots) {
            if (visited.has(root)) continue;
            const chain = [];
            const queue = [root];
            
            while (queue.length > 0) {
                const current = queue.shift();
                if (visited.has(current)) continue;
                visited.add(current);
                
                if (dependencies.nodes.has(current)) {
                    chain.push(current);
                    const node = dependencies.nodes.get(current);
                    for (const called of node.calls) {
                        if (!visited.has(called) && dependencies.nodes.has(called)) queue.push(called);
                    }
                }
            }
            if (chain.length > 0) chains.push(chain);
        }
        
        return chains;
    }

    suggestGroupName(skills) {
        const names = skills.map(s => s.name);
        if (names.length >= 2) {
            let prefix = names[0];
            for (let i = 1; i < names.length; i++) prefix = this.commonPrefix(prefix, names[i]);
            prefix = prefix.replace(/[-_]$/, '');
            if (prefix.length >= 3) return this.toReadableName(prefix);
        }
        return this.toReadableName(names[0].replace(/[-_](Tick|Hit|Start|End|Cooldown)$/i, ''));
    }

    toReadableName(name) {
        if (name === name.toUpperCase()) {
            return name.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
        }
        return name.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim()
            .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    findMissingSkillReferences(analyzedSkills, dependencies) {
        const definedSkills = new Set(analyzedSkills.map(s => s.name));
        const missing = [];
        for (const skill of analyzedSkills) {
            for (const call of skill.skillCalls) {
                // Skip external skill references (skill{s=...} calls)
                // These are references to external skills and should not generate warnings
                if (call.context === 'skill-line') {
                    continue; // External skill call via skill{s=...} - don't warn
                }
                
                if (!definedSkills.has(call.skillName)) {
                    missing.push({ calledSkill: call.skillName, callingSkill: skill.name, context: call.context });
                }
            }
        }
        return missing;
    }

    aggregateComponentStats(analyzedSkills) {
        const stats = { mechanics: {}, targeters: {}, conditions: {}, attributes: {} };
        
        for (const skill of analyzedSkills) {
            for (const mech of skill.mechanics) stats.mechanics[mech] = (stats.mechanics[mech] || 0) + 1;
            for (const targ of skill.targeters) stats.targeters[targ] = (stats.targeters[targ] || 0) + 1;
            for (const cond of skill.conditions) stats.conditions[cond] = (stats.conditions[cond] || 0) + 1;
            for (const [attr, values] of Object.entries(skill.attributes)) {
                stats.attributes[attr] = (stats.attributes[attr] || 0) + values.length;
            }
        }
        
        const sortByCount = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
        
        return {
            mechanics: sortByCount(stats.mechanics),
            targeters: sortByCount(stats.targeters),
            conditions: sortByCount(stats.conditions),
            attributes: sortByCount(stats.attributes)
        };
    }

    generateWarnings(analyzedSkills, missingSkills, dependencies) {
        const warnings = [];
        
        for (const missing of missingSkills) {
            // Provide context about what type of reference is missing
            const contextType = this.getContextType(missing.context);
            warnings.push({
                type: 'missing-reference', severity: 'warning',
                message: `Skill "${missing.callingSkill}" references ${contextType} "${missing.calledSkill}" (${missing.context}) - not found in file`,
                details: missing
            });
        }
        
        for (const skill of analyzedSkills) {
            if (skill.lineCount === 0) {
                warnings.push({
                    type: 'empty-skill', severity: 'info',
                    message: `Skill "${skill.name}" has no skill lines`,
                    details: { skillName: skill.name }
                });
            }
            if (skill.complexity === 'expert' && skill.lineCount > 20) {
                warnings.push({
                    type: 'high-complexity', severity: 'info',
                    message: `Skill "${skill.name}" is highly complex (${skill.lineCount} lines)`,
                    details: { skillName: skill.name, lineCount: skill.lineCount }
                });
            }
        }
        
        return warnings;
    }
    
    /**
     * Get human-readable context type for reference warnings
     */
    getContextType(context) {
        const contextLower = context.toLowerCase();
        if (contextLower.includes('cooldown')) return 'cooldown skill';
        if (contextLower.includes('tick')) return 'tick callback skill';
        if (contextLower.includes('start')) return 'start callback skill';
        if (contextLower.includes('end')) return 'end callback skill';
        if (contextLower.includes('hit')) return 'hit callback skill';
        if (contextLower.includes('bounce')) return 'bounce callback skill';
        if (contextLower.includes('damage')) return 'damage callback skill';
        if (contextLower.includes('attack')) return 'attack callback skill';
        if (contextLower.includes('interact')) return 'interact callback skill';
        return 'skill';
    }

    async checkForDuplicates(templates) {
        if (!this.templateManager) return templates.map(t => ({ template: t, duplicates: [] }));
        
        try {
            const existingTemplates = await this.templateManager.getAllTemplates();
            const results = [];
            
            for (const template of templates) {
                const duplicates = [];
                for (const existing of existingTemplates) {
                    const similarity = this.calculateSimilarity(template, existing);
                    if (similarity > 0.5) {
                        duplicates.push({
                            existing, similarity,
                            differences: this.findDifferences(template, existing)
                        });
                    }
                }
                duplicates.sort((a, b) => b.similarity - a.similarity);
                results.push({ template, duplicates: duplicates.slice(0, 3) });
            }
            return results;
        } catch (error) {
            console.error('Duplicate check failed:', error);
            return templates.map(t => ({ template: t, duplicates: [] }));
        }
    }

    calculateSimilarity(template1, template2) {
        let score = 0, maxScore = 0;
        
        maxScore += 30;
        const name1 = (template1.name || '').toLowerCase();
        const name2 = (template2.name || '').toLowerCase();
        if (name1 === name2) score += 30;
        else if (name1.includes(name2) || name2.includes(name1)) score += 20;
        else score += Math.min(15, this.commonPrefix(name1, name2).length * 3);
        
        maxScore += 20;
        if (template1.category === template2.category) score += 20;
        
        maxScore += 20;
        const sections1 = template1.sections?.length || 1;
        const sections2 = template2.sections?.length || 1;
        if (sections1 === sections2) score += 20;
        else if (Math.abs(sections1 - sections2) <= 1) score += 10;
        
        maxScore += 30;
        const lines1 = this.getTemplateSkillLines(template1);
        const lines2 = this.getTemplateSkillLines(template2);
        if (lines1.length > 0 && lines2.length > 0) {
            const commonLines = lines1.filter(l => lines2.includes(l)).length;
            score += Math.round((commonLines / Math.max(lines1.length, lines2.length)) * 30);
        }
        
        return score / maxScore;
    }

    getTemplateSkillLines(template) {
        const lines = [];
        if (template.skillLines) lines.push(...template.skillLines);
        if (template.sections) {
            for (const section of template.sections) {
                if (section.skillLines) lines.push(...section.skillLines);
            }
        }
        if (template.fullSection?.skillLines) lines.push(...template.fullSection.skillLines);
        return lines;
    }

    findDifferences(template1, template2) {
        const differences = [];
        const sections1 = template1.sections?.length || 1;
        const sections2 = template2.sections?.length || 1;
        if (sections1 !== sections2) differences.push(`Section count: ${sections1} vs ${sections2}`);
        
        const lines1 = this.getTemplateSkillLines(template1);
        const lines2 = this.getTemplateSkillLines(template2);
        if (lines1.length !== lines2.length) differences.push(`Skill lines: ${lines1.length} vs ${lines2.length}`);
        if (template1.category !== template2.category) differences.push(`Category: ${template1.category} vs ${template2.category}`);
        return differences;
    }

    async importTemplates(templateConfigs) {
        const results = { success: [], failed: [], total: templateConfigs.length };
        
        // Track already imported names in this batch to prevent duplicates
        const importedNames = new Set();
        
        for (const config of templateConfigs) {
            try {
                // Skip if we already imported a template with this name in this batch
                const normalizedName = config.name.toLowerCase().trim();
                if (importedNames.has(normalizedName)) {
                    if (window.DEBUG_MODE) console.log(`[YAML Importer] Skipping duplicate template: ${config.name}`);
                    results.failed.push({ name: config.name, error: 'Duplicate template name in batch' });
                    continue;
                }
                importedNames.add(normalizedName);
                
                // Convert sections format: skillLines -> lines for templateManager compatibility
                const normalizedSections = (config.sections || []).map(section => ({
                    name: section.name,
                    lines: section.skillLines || section.lines || [],
                    conditions: section.conditions || [],
                    triggers: section.triggers || [],
                    // Include mob config if present
                    mobConfig: section.mobConfig || null
                }));
                
                // Determine if this is a mob template
                const isMobTemplate = config.context === 'mob' || 
                    config.skills?.some(s => s.sourceType === 'mob') ||
                    config.skills?.some(s => s.mobConfig);
                
                // Extract mob configs from skills for mob templates
                let mobConfigs = null;
                if (isMobTemplate && config.skills) {
                    mobConfigs = config.skills
                        .filter(s => s.mobConfig)
                        .map(s => s.mobConfig);
                }
                
                const templateData = {
                    name: config.name,
                    description: config.description || '',
                    category: config.category || 'utility',
                    difficulty: config.complexity || 'intermediate',
                    tags: config.tags || [],
                    entity_type: isMobTemplate ? 'mob' : 'skill',
                    is_official: config.isOfficial || false,
                    sections: normalizedSections,
                    // Also provide skillLines for single-section templates
                    skillLines: normalizedSections.length === 1 ? normalizedSections[0].lines : 
                                normalizedSections.flatMap(s => s.lines),
                    // Store mob configurations for mob templates
                    mobConfigs: mobConfigs
                };
                
                const created = await this.templateManager.createTemplate(templateData);
                if (created) {
                    results.success.push({ name: config.name, id: created.id, sectionsCount: normalizedSections.length });
                } else {
                    results.failed.push({ name: config.name, error: 'Template creation returned null' });
                }
            } catch (error) {
                results.failed.push({ name: config.name, error: error.message });
            }
        }
        return results;
    }

    buildFullSection(config) {
        const fullSection = { skillLines: [], conditions: [], triggers: [], cooldown: null };
        const skills = config.skills || [];
        
        for (const skill of skills) {
            if (skill.data?.Skills) fullSection.skillLines.push(...skill.data.Skills);
            if (skill.conditions) fullSection.conditions.push(...skill.conditions);
            if (skill.triggers) fullSection.triggers.push(...skill.triggers);
            if (skill.data?.Cooldown && !fullSection.cooldown) fullSection.cooldown = skill.data.Cooldown;
        }
        return fullSection;
    }
}

window.TemplateYAMLImporter = TemplateYAMLImporter;