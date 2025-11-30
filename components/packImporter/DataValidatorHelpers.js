/**
 * DataValidatorHelpers.js - Part 2
 * Helper methods for DataValidator
 */

// Extend DataValidator with helper methods
Object.assign(DataValidator.prototype, {

    /**
     * Valid Minecraft entity types
     * Includes all vanilla Minecraft entities plus common aliases
     */
    VALID_ENTITY_TYPES: [
        // Hostile mobs
        'ZOMBIE', 'SKELETON', 'SPIDER', 'CAVE_SPIDER', 'CREEPER', 'ENDERMAN',
        'WITCH', 'SLIME', 'MAGMA_CUBE', 'BLAZE', 'GHAST', 'ZOMBIFIED_PIGLIN',
        'HOGLIN', 'PIGLIN', 'PIGLIN_BRUTE', 'WITHER_SKELETON', 'STRAY', 'HUSK',
        'DROWNED', 'PHANTOM', 'SILVERFISH', 'ENDERMITE', 'VINDICATOR', 'EVOKER',
        'VEX', 'PILLAGER', 'RAVAGER', 'GUARDIAN', 'ELDER_GUARDIAN', 'SHULKER',
        'ZOGLIN', 'WARDEN', 'BOGGED', 'BREEZE',
        // Passive/neutral mobs
        'PIG', 'COW', 'SHEEP', 'CHICKEN', 'RABBIT', 'HORSE', 'DONKEY', 'MULE',
        'LLAMA', 'TRADER_LLAMA', 'CAT', 'OCELOT', 'WOLF', 'PARROT', 'BAT',
        'COD', 'SALMON', 'TROPICAL_FISH', 'PUFFERFISH', 'SQUID', 'GLOW_SQUID',
        'DOLPHIN', 'TURTLE', 'POLAR_BEAR', 'PANDA', 'FOX', 'BEE', 'MOOSHROOM',
        'STRIDER', 'AXOLOTL', 'GOAT', 'FROG', 'TADPOLE', 'CAMEL', 'SNIFFER',
        'ARMADILLO', 'VILLAGER', 'WANDERING_TRADER', 'IRON_GOLEM', 'SNOW_GOLEM',
        'ALLAY', 'ZOMBIE_VILLAGER', 'ENDER_DRAGON', 'WITHER',
        // Display entities and markers
        'ARMOR_STAND', 'ITEM_DISPLAY', 'BLOCK_DISPLAY', 'TEXT_DISPLAY',
        'INTERACTION', 'MARKER',
        // Special entities
        'ENDER_CRYSTAL', 'END_CRYSTAL', 'AREA_EFFECT_CLOUD',
        'EXPERIENCE_ORB', 'FALLING_BLOCK', 'ITEM', 'ARROW', 'SPECTRAL_ARROW',
        'TRIDENT', 'FIREBALL', 'SMALL_FIREBALL', 'DRAGON_FIREBALL', 'WITHER_SKULL',
        'EGG', 'ENDER_PEARL', 'EYE_OF_ENDER', 'SNOWBALL', 'FIREWORK_ROCKET',
        'TNT', 'PRIMED_TNT', 'MINECART', 'BOAT', 'FISHING_BOBBER', 'LIGHTNING_BOLT',
        'LEASH_KNOT', 'PAINTING', 'ITEM_FRAME', 'GLOW_ITEM_FRAME',
        // Legacy/alias names that MythicMobs accepts
        'SNOWMAN', 'MUSHROOM_COW', 'ZOMBIE_PIGMAN', 'PIG_ZOMBIE',
        'GIANT', 'ILLUSIONER', 'ZOMBIE_HORSE', 'SKELETON_HORSE',
        // Baby variants (MythicMobs special types)
        'BABY_ZOMBIE', 'BABY_DROWNED', 'BABY_HUSK', 'BABY_VILLAGER',
        'BABY_ZOMBIFIED_PIGLIN', 'BABY_PIGLIN', 'BABY_HOGLIN', 'BABY_ZOGLIN'
    ],

    /**
     * Valid Minecraft biomes
     */
    VALID_BIOMES: [
        'OCEAN', 'DEEP_OCEAN', 'WARM_OCEAN', 'LUKEWARM_OCEAN', 'COLD_OCEAN',
        'FROZEN_OCEAN', 'DEEP_LUKEWARM_OCEAN', 'DEEP_COLD_OCEAN', 'DEEP_FROZEN_OCEAN',
        'MUSHROOM_FIELDS', 'PLAINS', 'SUNFLOWER_PLAINS', 'SNOWY_PLAINS', 'ICE_SPIKES',
        'DESERT', 'SWAMP', 'MANGROVE_SWAMP', 'FOREST', 'FLOWER_FOREST', 'BIRCH_FOREST',
        'DARK_FOREST', 'OLD_GROWTH_BIRCH_FOREST', 'OLD_GROWTH_PINE_TAIGA',
        'OLD_GROWTH_SPRUCE_TAIGA', 'TAIGA', 'SNOWY_TAIGA', 'SAVANNA', 'SAVANNA_PLATEAU',
        'WINDSWEPT_HILLS', 'WINDSWEPT_GRAVELLY_HILLS', 'WINDSWEPT_FOREST',
        'WINDSWEPT_SAVANNA', 'JUNGLE', 'SPARSE_JUNGLE', 'BAMBOO_JUNGLE', 'BADLANDS',
        'ERODED_BADLANDS', 'WOODED_BADLANDS', 'MEADOW', 'CHERRY_GROVE', 'GROVE',
        'SNOWY_SLOPES', 'FROZEN_PEAKS', 'JAGGED_PEAKS', 'STONY_PEAKS', 'RIVER',
        'FROZEN_RIVER', 'BEACH', 'SNOWY_BEACH', 'STONY_SHORE', 'DRIPSTONE_CAVES',
        'LUSH_CAVES', 'DEEP_DARK', 'PALE_GARDEN', 'NETHER_WASTES', 'CRIMSON_FOREST',
        'WARPED_FOREST', 'SOUL_SAND_VALLEY', 'BASALT_DELTAS', 'THE_END',
        'SMALL_END_ISLANDS', 'END_MIDLANDS', 'END_HIGHLANDS', 'END_BARRENS', 'THE_VOID'
    ],

    /**
     * Valid color codes
     */
    VALID_COLOR_CODES: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f', 'k', 'l', 'm', 'n', 'o', 'r',
        'A', 'B', 'C', 'D', 'E', 'F', 'K', 'L', 'M', 'N', 'O', 'R'],

    /**
     * Check if entity type is valid
     */
    isValidEntityType(type) {
        if (!type) return { valid: false, suggestion: 'Specify an entity type' };
        
        const upperType = type.toUpperCase();
        
        if (this.VALID_ENTITY_TYPES.includes(upperType)) {
            return { valid: true };
        }

        // Try to find similar
        const similar = this.findSimilar(upperType, this.VALID_ENTITY_TYPES);
        return {
            valid: false,
            suggestion: similar ? `Did you mean '${similar}'?` : 'Check the entity type name'
        };
    },

    /**
     * Check if biome is valid
     */
    isValidBiome(biome) {
        if (!biome) return false;
        return this.VALID_BIOMES.includes(biome.toUpperCase());
    },

    /**
     * Check if material is valid (basic check)
     */
    isValidMaterial(material) {
        if (!material) return false;
        // Basic validation - check it looks like a material name
        return /^[A-Z_]+$/i.test(material);
    },

    /**
     * Check if item is a vanilla item
     * MythicMobs is case-insensitive, so 'bow', 'BOW', 'Bow' are all valid vanilla items
     */
    isVanillaItem(item) {
        if (!item) return false;
        // Vanilla items are letters and underscores only (case-insensitive)
        // Examples: DIAMOND_SWORD, bow, Golden_Apple
        return /^[A-Za-z_]+$/.test(item);
    },

    /**
     * Validate color codes in a string
     */
    validateColorCodes(text) {
        if (!text || typeof text !== 'string') return null;
        
        const colorCodeRegex = /&([^&])/g;
        let match;
        const invalidCodes = [];
        
        while ((match = colorCodeRegex.exec(text)) !== null) {
            if (!this.VALID_COLOR_CODES.includes(match[1]) && match[1] !== '#') {
                invalidCodes.push(match[0]);
            }
        }

        if (invalidCodes.length > 0) {
            return `Invalid color codes: ${invalidCodes.join(', ')}`;
        }
        return null;
    },

    /**
     * Extract skill references from a skill line
     * Handles multiple patterns:
     * - skill{s=SkillName} or skill{s=SkillName;param=value}
     * - metaskill{s=SkillName}
     * - onTick=SkillName, onHit=SkillName, onStart=SkillName, onEnd=SkillName
     * - castinstead SkillName (condition action)
     * - randomskill{skills=Skill1,Skill2 10,Skill3 5}
     * - [ - SkillName ] inline skills
     */
    extractSkillReferences(skillLine) {
        const refs = [];
        if (!skillLine || typeof skillLine !== 'string') return refs;

        // Match skill{s=SkillName} or skill{s=SkillName;param=value}
        // Extract only the skill name, not additional parameters
        const skillPattern = /skill\{(?:s|skill)=([^;}]+)/gi;
        let match;
        
        while ((match = skillPattern.exec(skillLine)) !== null) {
            refs.push(match[1].trim());
        }

        // Match metaskill{s=SkillName}
        const metaPattern = /metaskill\{(?:s|skill)=([^;}]+)/gi;
        while ((match = metaPattern.exec(skillLine)) !== null) {
            refs.push(match[1].trim());
        }

        // Match onTick=SkillName, onHit=SkillName, onStart=SkillName, onEnd=SkillName
        // These are used in projectile, orbital, totem mechanics
        const callbackPattern = /(?:onTick|onHit|onStart|onEnd|onBounce|onInteract)=([a-zA-Z_][a-zA-Z0-9_-]*)/gi;
        while ((match = callbackPattern.exec(skillLine)) !== null) {
            refs.push(match[1].trim());
        }

        // Match castinstead SkillName (condition action)
        const castInsteadPattern = /castinstead\s+([a-zA-Z_][a-zA-Z0-9_-]*)/gi;
        while ((match = castInsteadPattern.exec(skillLine)) !== null) {
            refs.push(match[1].trim());
        }

        // Match orelsecast SkillName (condition action)
        const orElseCastPattern = /orelsecast\s+([a-zA-Z_][a-zA-Z0-9_-]*)/gi;
        while ((match = orElseCastPattern.exec(skillLine)) !== null) {
            refs.push(match[1].trim());
        }

        // Match randomskill{skills=Skill1,Skill2 10,Skill3 5}
        // Skills can have optional weights after a space
        const randomSkillPattern = /randomskill\{skills?=([^}]+)\}/gi;
        while ((match = randomSkillPattern.exec(skillLine)) !== null) {
            const skillList = match[1];
            // Split by comma and extract skill names (ignore weights)
            const skills = skillList.split(',');
            for (const skillEntry of skills) {
                // Remove weight (number after space) and trim
                const skillName = skillEntry.trim().split(/\s+/)[0];
                if (skillName && /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(skillName)) {
                    refs.push(skillName);
                }
            }
        }

        // Match [ - SkillName ] inline skills
        const inlinePattern = /\[\s*-\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*\]/g;
        while ((match = inlinePattern.exec(skillLine)) !== null) {
            refs.push(match[1].trim());
        }

        return refs;
    },

    /**
     * Extract droptable reference from a drop line
     * ONLY handles explicit droptable mechanic patterns:
     * - droptable{dt=TableName} or droptable{table=TableName}
     * 
     * NOTE: Simple uppercase names like "CreeperHead 1 0.05" are custom ITEM drops,
     * NOT droptable references. Custom item drops use: ItemName Amount Chance
     */
    extractDropTableReference(dropLine) {
        if (!dropLine || typeof dropLine !== 'string') return null;

        // Match droptable{dt=TableName} or droptable{table=TableName}
        // This is the ONLY way to reference a droptable in MythicMobs drops
        const dtPattern = /droptable\{(?:dt|table)=([^;}]+)/i;
        const match = dropLine.match(dtPattern);
        if (match) return match[1].trim();

        // NOTE: Do NOT treat uppercase names as droptable references!
        // In MythicMobs Drops array:
        // - "CreeperHead 1 0.05" = Custom item drop (item name, amount, chance)
        // - "droptable{dt=MyTable}" = DropTable reference
        // - "gold 100-200" = Currency drop
        // - "exp 50-100" = Experience drop

        return null;
    },

    /**
     * Extract item reference from a drop line
     * Handles patterns:
     * - ItemName Amount Chance (e.g., "CreeperHead 1 0.05")
     * - ItemName Amount (e.g., "DiamondSword 1")
     * Returns null for vanilla items, droptable references, and special drops (gold, exp, etc.)
     */
    extractItemReference(dropLine) {
        if (!dropLine || typeof dropLine !== 'string') return null;

        const trimmed = dropLine.replace(/^-\s*/, '').trim();
        
        // Skip droptable references
        if (trimmed.toLowerCase().startsWith('droptable{')) return null;
        
        // Skip special drop types (money/currency, exp, skillapi exp, etc.)
        const specialDrops = ['gold', 'money', 'exp', 'experience', 'skillapi', 'mcmmo', 'heroesexp', 'championexp'];
        const firstWord = trimmed.split(/[\s{]/)[0].toLowerCase();
        if (specialDrops.includes(firstWord)) return null;
        
        // Match custom item drop: ItemName [Amount] [Chance]
        // Custom items typically start with uppercase (PascalCase or UPPER_CASE)
        const itemMatch = trimmed.match(/^([A-Z][a-zA-Z0-9_]*)(?:\s|$)/);
        if (itemMatch) {
            const itemName = itemMatch[1];
            // Skip if it looks like a vanilla material (all uppercase with underscores is usually vanilla)
            // But allow it - we'll check against defined items AND vanilla items
            return itemName;
        }

        return null;
    },

    /**
     * Validate a skill line
     */
    validateSkillLine(skillLine, index) {
        const result = {
            valid: true,
            issues: [],
            skillRefs: []
        };

        if (!skillLine || typeof skillLine !== 'string') {
            result.valid = false;
            result.issues.push({
                type: 'INVALID_SKILL_LINE',
                severity: 'warning',
                message: 'Empty or invalid skill line',
                suggestion: 'Add a valid skill line'
            });
            return result;
        }

        const line = skillLine.replace(/^-\s*/, '').trim();

        // Extract skill references
        result.skillRefs = this.extractSkillReferences(skillLine);

        // Check for common mechanics
        const mechanicMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_:]*)/);
        if (mechanicMatch) {
            const mechanic = mechanicMatch[1].toLowerCase();
            
            // Check for known mechanics
            const knownMechanics = this.getKnownMechanics();
            if (!knownMechanics.includes(mechanic) && !mechanic.includes(':')) {
                result.issues.push({
                    type: 'UNKNOWN_MECHANIC',
                    severity: 'info',
                    message: `Unknown mechanic: ${mechanic}`,
                    suggestion: 'Check if the mechanic name is correct'
                });
            }
        }

        // Check for targeters
        const targeterMatch = line.match(/@([a-zA-Z]+)/);
        if (targeterMatch) {
            const targeter = targeterMatch[1].toLowerCase();
            const knownTargeters = this.getKnownTargeters();
            if (!knownTargeters.includes(targeter)) {
                result.issues.push({
                    type: 'UNKNOWN_TARGETER',
                    severity: 'info',
                    message: `Unknown targeter: @${targeter}`,
                    suggestion: 'Check if the targeter name is correct'
                });
            }
        }

        // Check for balanced braces
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            result.valid = false;
            result.issues.push({
                type: 'UNBALANCED_BRACES',
                severity: 'critical',
                message: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
                suggestion: 'Check for missing { or }'
            });
        }

        return result;
    },

    /**
     * Validate a condition
     * MythicMobs conditions can have multiple formats:
     * - conditionname
     * - conditionname{params}
     * - conditionname{params} action
     * - conditionname action  
     * - !conditionname (negated)
     * - ( condition1 && condition2 ) (inline conditions)
     */
    validateCondition(condition) {
        if (!condition || typeof condition !== 'string') {
            return { valid: false, message: 'Empty condition', suggestion: 'Add a valid condition' };
        }

        const line = condition.replace(/^-\s*/, '').trim();
        
        // Skip empty lines
        if (!line) {
            return { valid: false, message: 'Empty condition', suggestion: 'Add a valid condition' };
        }
        
        // Handle inline conditions with parentheses: ( condition1 && condition2 )
        if (line.startsWith('(') || line.includes('&&') || line.includes('||')) {
            return { valid: true }; // Inline conditions are complex, accept them
        }
        
        // Extract condition name - can be negated with ! and followed by {params}, space, or end
        // Examples: "night", "!day", "health{h=>50}", "health{h=>50} cast SKILL", "stance aggressive"
        const condMatch = line.match(/^(!)?([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (!condMatch) {
            return { valid: false, message: 'Invalid condition format', suggestion: 'Use format: - conditionname or - conditionname{params}' };
        }

        const condName = condMatch[2].toLowerCase();
        const knownConditions = this.getKnownConditions();
        
        if (!knownConditions.includes(condName)) {
            return {
                valid: true, // Don't fail, just warn
                message: `Unknown condition: ${condName}`,
                suggestion: 'Check if the condition name is correct'
            };
        }

        return { valid: true };
    },

    /**
     * Validate a mob option
     */
    validateMobOption(option, value) {
        const knownOptions = [
            'MovementSpeed', 'FollowRange', 'AttackSpeed', 'KnockbackResistance',
            'PreventOtherDrops', 'PreventRandomEquipment', 'PreventSunburn',
            'Silent', 'NoAI', 'NoDamageTicks', 'Persistent', 'Invincible',
            'Collidable', 'Glowing', 'Invisible', 'ApplyInvisibility',
            'AlwaysShowName', 'ShowHealth', 'PreventMobKillDrops',
            'PreventLeashing', 'PreventRename', 'PreventTransformation',
            'PreventItemPickup', 'PreventSilverfish', 'PreventTeleportation',
            'CanPickupItems', 'PreventExperienceOrbs', 'PassthroughDamage'
        ];

        const lowerOption = option.toLowerCase();
        const matchedOption = knownOptions.find(o => o.toLowerCase() === lowerOption);
        
        if (!matchedOption) {
            return {
                valid: true, // Don't fail on unknown options
                message: `Unknown option: ${option}`,
                suggestion: 'Check if the option name is correct'
            };
        }

        return { valid: true };
    },

    /**
     * Validate an enchantment
     * MythicMobs supports multiple formats:
     * - ENCHANTMENT:LEVEL (e.g., "SHARPNESS:5")
     * - ENCHANTMENT LEVEL (e.g., "SHARPNESS 5")
     * - ENCHANTMENT:MIN-MAX (e.g., "SHARPNESS:1-5")
     * - ENCHANTMENT MIN-MAX (e.g., "SHARPNESS 1-5")
     * - ENCHANTMENT MINtoMAX (e.g., "PROTECTION 1to3") - MythicMobs range format
     * - ENCHANTMENT:MINtoMAX (e.g., "PROTECTION:1to3")
     */
    validateEnchantment(enchantment) {
        if (!enchantment || typeof enchantment !== 'string') {
            return { valid: false, message: 'Empty enchantment', suggestion: 'Use format: ENCHANTMENT:LEVEL' };
        }

        const line = enchantment.replace(/^-\s*/, '').trim();
        
        // Try colon format first: ENCHANT:LEVEL or ENCHANT:MIN-MAX or ENCHANT:MINtoMAX
        if (line.includes(':')) {
            const parts = line.split(':');
            if (parts.length === 2) {
                const [name, levelPart] = parts;
                const trimmedLevel = levelPart.trim();
                // Level can be: number, range with dash (1-5), or range with 'to' (1to5)
                if (/^\d+(-\d+)?$/.test(trimmedLevel) || /^\d+to\d+$/i.test(trimmedLevel)) {
                    return { valid: true };
                }
            }
        }
        
        // Try space format: ENCHANT LEVEL or ENCHANT MIN-MAX or ENCHANT MINtoMAX
        // Pattern: EnchantmentName followed by space and level/range
        const spaceMatch = line.match(/^([A-Za-z_]+)\s+(\d+(?:-\d+|to\d+)?)$/i);
        if (spaceMatch) {
            return { valid: true };
        }
        
        // Just enchantment name (level defaults to 1)
        if (/^[A-Za-z_]+$/.test(line)) {
            return { valid: true };
        }

        return { valid: false, message: 'Invalid format', suggestion: 'Use format: ENCHANTMENT:LEVEL or ENCHANTMENT LEVEL or ENCHANTMENT MINtoMAX' };
    },

    /**
     * Validate a drop entry
     */
    validateDrop(drop) {
        if (!drop || typeof drop !== 'string') {
            return { valid: false, message: 'Empty drop', suggestion: 'Add a valid drop entry' };
        }

        const line = drop.replace(/^-\s*/, '').trim();
        let itemRef = null;

        // Check for mythicitem
        const mythicMatch = line.match(/mythicitem\{(?:i|item)=([^}]+)\}/i);
        if (mythicMatch) {
            itemRef = mythicMatch[1].trim();
        }

        // Check for known drop types
        const knownTypes = ['exp', 'gold', 'money', 'skillapi-exp', 'mcmmo-exp', 'heroesexp', 'mythicitem', 'cmd', 'command'];
        const typeMatch = line.match(/^([a-zA-Z_-]+)/);
        
        if (typeMatch) {
            const dropType = typeMatch[1].toLowerCase();
            if (!knownTypes.includes(dropType) && !dropType.includes(':')) {
                // Could be a simple droptable reference
                itemRef = typeMatch[1];
            }
        }

        return { valid: true, itemRef };
    },

    /**
     * Get list of known mechanics
     */
    getKnownMechanics() {
        return [
            // Core mechanics
            'skill', 'metaskill', 'damage', 'basedamage', 'percentdamage', 'hit',
            'heal', 'healpercent', 'feed', 'potion', 'potionclear', 'effect',
            
            // Messages
            'message', 'actionmessage', 'titlemessage', 'bossbarmessage', 'sendtitle',
            'sendactionmessage', 'sendtoast', 'jsonmessage', 'randommessage', 'speak', 'log',
            
            // Commands
            'command', 'sudocommand', 'sudoskill',
            
            // Blocks
            'setblock', 'setblocktype', 'breakblock', 'breakblockandgiveitem', 'blockwave',
            'blockmask', 'blockunmask', 'blockphysics', 'blockdestabilize', 'bonemeal',
            'pushblock', 'pushbutton', 'setblockopen', 'fillchest',
            
            // Particles & Effects
            'particle', 'particles', 'particleline', 'particlering', 'particlesphere',
            'particlebox', 'particletornado', 'particleorbital', 'particlewave',
            'sound', 'playsound', 'playblockbreaksound',
            'lightning', 'fakelightning', 'ignite', 'extinguish', 'explosion', 'fakeexplosion',
            'flames', 'ender', 'smoke', 'firework', 'geyser',
            
            // Movement
            'teleport', 'throw', 'pull', 'push', 'forcepull', 'velocity', 'directionalvelocity',
            'leap', 'lunge', 'jump', 'disengage', 'propel', 'recoil',
            
            // Mount mechanics
            'mount', 'mountme', 'mounttarget', 'dismount', 'remount', 'ejectpassenger',
            
            // Speed/Movement modifiers
            'modifytargetspeed', 'modifyspeed', 'setspeed', 'stun', 'freeze',
            
            // Spawning
            'summon', 'spawn', 'remove', 'activatespawner',
            
            // Projectiles
            'projectile', 'orbital', 'missile', 'totem', 'ray', 'raytrace', 'raytraceto',
            'shoot', 'shootfireball', 'shootskull', 'shootpotion', 'shootarrow',
            'shootshulkerbullet', 'shoottrident', 'volley', 'arrowvolley', 'atom',
            
            // Variables & Signals
            'signal', 'setvariable', 'variableadd', 'variablesubtract', 'variablemultiply',
            'delay', 'cancelevent',
            
            // Threat
            'modifythreat', 'threat', 'settarget', 'cleartarget', 'taunt', 'rally',
            
            // Auras
            'aura', 'cancelaura', 'auraremove',
            
            // Skills
            'chain', 'randomskill', 'variableskill', 'cast',
            
            // Triggers
            'onshoot', 'ondamaged', 'onattack',
            
            // Items
            'equip', 'equipcopy', 'giveitem', 'takeitem', 'consumeitem', 'consume',
            'dropitem', 'itemspray', 'giveitemfromslot', 'giveitemfromtarget',
            'removehelditem', 'consumeslot', 'pickupitem',
            
            // Entity state
            'setlevel', 'setfaction', 'setnbt', 'removenbt', 'sethealth', 'setmaxhealth',
            'setname', 'setgravity', 'setai', 'resetai', 'setcollidable', 'setgliding',
            'setgamemode', 'setmobcolor', 'setinteractionsize',
            
            // Scores
            'modifyscore', 'modifyglobalscore', 'modifytargetscore', 'modifymobscore',
            'setglobalscore', 'setmobscore',
            
            // Visual
            'hologram', 'glow', 'disguise', 'undisguise', 'disguisetarget', 'disguisemodify',
            'hide', 'blackscreen', 'bloodyscreen', 'displaytransformation',
            'playanimation', 'armanimation', 'animatearmorstand', 'posearmorstand',
            
            // Rotation/Looking
            'look', 'setrotation', 'faceposition', 'rotatetowards', 'matchrotation',
            
            // Damage modification
            'modifydamage', 'ignitepercent', 'setfire', 'shield',
            
            // Boss mechanics
            'barcreate', 'barremove', 'barset', 'bossborder',
            
            // Misc
            'prison', 'swap', 'goto', 'bouncy', 'decapitate', 'goatram',
            'saddle', 'addtrade', 'opentrades', 'closeinventory',
            'oxygen', 'time', 'weather', 'sendresourcepack',
            'setowner', 'removeowner', 'setleashholder',
            
            // Beams
            'enderbeam', 'guardianbeam',
            
            // Ender Dragon
            'enderdragonresetcrystals', 'enderdragonsetphase', 'enderdragonsetrespawnphase', 'enderdragonspawnportal', 'setdragonpodium',
            
            // Currency
            'currencygive', 'currencytake',
            
            // Experience
            'clearexperience', 'clearexperiencelevels', 'giveexperiencelevels', 'takeexperiencelevels',
            
            // AI
            'runaigoalselector', 'runaitargetselector',
            
            // Chunks/World
            'setchunkforceloaded', 'fawepaste', 'movepin',
            
            // Raider
            'setraiderpatrolblock', 'setraiderpatrolleader',
            
            // Cooldowns
            'setitemgroupcooldown', 'setmaterialcooldown',
            
            // Display entities
            'setdisplayentityitem',
            
            // Attributes
            'attribute', 'attributemodifier',
            
            // Debug
            'printtree',
            
            // Additional mechanics from MythicMobs
            'fakeexplode', 'setstance', 'settargetscore', 'damagepercent', 'suicide',
            'shieldbreak', 'modifyprojectile', 'setcolor', 'spin', 'teleportto', 'title',
            'sendsubtitle', 'actionbar', 'setpathfindingmalus', 'setvisible', 'setinvisible',
            'spring', 'pulltowards', 'dash', 'lunge', 'charge', 'smash', 'slam',
            'onblockbreak', 'onblockplace', 'onpress', 'onrelease', 'onswing',
            'doppleganger', 'setparent', 'setchild', 'setsibling',
            'shootegg', 'shootenderpearl', 'shootsnowball', 'shootwitherhead',
            'barrage', 'beam', 'ray', 'raycast', 'raytrace',
            'explosion', 'createexplosion', 'primeexplosion',
            'setvar', 'delvar', 'varmath', 'variablemath',
            'setowner', 'clearowner', 'setparent', 'clearparent',
            'speak', 'say', 'tellraw', 'broadcast',
            'potion', 'potioneffect', 'removepotioneffect',
            'give', 'take', 'drop', 'spawn',
            'damagearmor', 'damagedurability', 'repairarmor', 'repairdurability',
            'cancelskill', 'break', 'return', 'stop', 'end',
            'setbaby', 'setadult', 'setsize', 'setscale',
            'oninteract', 'onmount', 'ondismount', 'onspawn', 'ondeath',
            'trackedlocation', 'setlocationvariable', 'settargetvariable',
            'bonfire', 'vortex', 'tornado', 'wave', 'meteor', 'comet',
            'shockwave', 'groundslam', 'groundpound',
            'shootitem', 'shootprojectile', 'shootentity',
            'navigate', 'pathfind', 'moveto', 'walkto', 'runto',
            'setpose', 'animate', 'setanimation', 'stopanimation'
        ];
    },

    /**
     * Get list of known targeters
     */
    getKnownTargeters() {
        return [
            // Single Entity
            'self', 'caster', 'boss', 'mob', 'target', 't', 'trigger',
            'nearestplayer', 'nearestentity', 'wolfowner', 'owner', 'parent', 'summoner',
            'mount', 'father', 'mother', 'passenger', 'playerbyname', 'uniqueidentifier',
            'vehicle', 'interactionlastattacker', 'interactionlastinteract',
            'dad', 'daddy', 'mom', 'mommy', 'rider', 'uuid', 'lastattacker', 'lastinteract',
            
            // Multi Entity
            'livingincone', 'livinginworld', 'notlivingnearorigin', 'nonlivingnearorigin', 'nlno',
            'playersinradius', 'pir', 'mobsinradius', 'mir', 'entitiesinradius', 'eir',
            'entitiesinring', 'eirr', 'entitiesinringnearorigin', 'erno',
            'playersinworld', 'playersonserver', 'playersinring', 'pring', 'playersnearorigin', 'pno',
            'trackedplayers', 'tracked', 'mobsnearorigin', 'entitiesnearorigin', 'eno', 'nearorigin',
            'children', 'child', 'summons', 'siblings', 'sibling', 'brothers', 'sisters',
            'itemsnearorigin', 'ino', 'itemsinradius', 'iir',
            'livingentitiesinradius', 'lir', 'livinginradius', 'allinradius',
            'livingentitiesinline', 'lil', 'entitiesinline', 'eil', 'playersinline', 'pil',
            'entitiesnearby', 'nearbyentities',
            'entitiesincone', 'eic', 'livingentitiesincone', 'leic', 'playersincone',
            'eiw', 'allinworld', 'livingentitiesinworld', 'entitiesinworld',
            
            // Threat Table
            'threattable', 'tt', 'threattargets', 'threattableplayers', 'ttp', 'playersinthreattable',
            'randomthreattarget', 'rtt', 'threattablerandomtarget',
            'randomthreattargetlocation', 'rttl',
            
            // Single Location
            'selflocation', 'sloc', 'casterlocation', 'bosslocation', 'moblocation',
            'selfeylelocation', 'eyedirection', 'castereylelocation', 'bosseylelocation', 'mobeylelocation',
            'forward', 'floc', 'projectileforward',
            'targetlocation', 'tloc', 'targetloc', 'tl',
            'targetpredictedlocation', 'targetpredictedloc', 'tpl', 'predictedtargetlocation',
            'triggerlocation',
            'origin', 'source', 'location', 'loc', 'l',
            'spawnlocation', 'casterspawnlocation', 'casterspawn',
            'variablelocation', 'varlocation',
            'ownerlocation', 'parentlocation', 'summonerlocation',
            'projectilelocation', 'trackedlocation', 'obstructingblock',
            'targetblock', 'neareststructure', 'highestblock',
            'playerlocationbyname', 'specificplayerlocation',
            'forwardwall', 'playerlocatonsinradius', 'locationradius', 'plir', 'plr',
            'pin',
            
            // Multi Location
            'ring', 'randomringpoint', 'cone', 'sphere', 'rectangle', 'line',
            'randomlocationsnearorigin', 'rloc', 'rlo', 'rlno',
            'randomlocationsnearcaster', 'randomlocationnearcaster', 'rlnc',
            'randomlocationneartarget', 'randomlocationsneartarget', 'randomlocationsneartargets', 'rlnt',
            'blocksnearorigin', 'bloc', 'bno', 'blocksinradius', 'bir',
            'ringaroundorigin', 'ringorigin', 'rao',
            'livinginline', 'entitiesinline', 'leil',
            'livingneartargetlocation', 'lntl', 'entl', 'ent',
            
            // Meta targeters
            'targetedentity', 'targetedlocation',
            'pet', 'spawner', 'world', 'none'
        ];
    },

    /**
     * Get list of known conditions
     */
    getKnownConditions() {
        return [
            'night', 'day', 'dawn', 'dusk', 'sunny', 'raining', 'thundering',
            'incombat', 'inlava', 'inwater', 'onground', 'inside', 'outside',
            'burning', 'frozen', 'gliding', 'sneaking', 'sprinting', 'swimming',
            'flying', 'sleeping', 'standing', 'crouching', 'mounted', 'holding',
            'wearing', 'health', 'mobsinradius', 'playersinradius', 'distance',
            'distancefromspawn', 'heightabove', 'heightbelow', 'yaw', 'pitch',
            'biome', 'world', 'region', 'cuboid', 'worldtime', 'lunarphase',
            'level', 'faction', 'samefaction', 'targetwithin', 'targetnotwithin',
            'score', 'variable', 'variableequals', 'variableisset', 'variableinrange',
            'permission', 'chance', 'haspotioneffect', 'hasaura', 'isgod', 'isfrozen',
            'isburning', 'isleashed', 'isgliding', 'isflying', 'cansee', 'lineofsight',
            'entitytype', 'mobtype', 'name', 'owner', 'ownerisplayer', 'ownerismob'
        ];
    },

    /**
     * Find similar string in array (Levenshtein distance)
     */
    findSimilar(str, array) {
        let minDist = Infinity;
        let closest = null;
        
        for (const item of array) {
            const dist = this.levenshteinDistance(str.toLowerCase(), item.toLowerCase());
            if (dist < minDist && dist <= 3) {
                minDist = dist;
                closest = item;
            }
        }
        
        return closest;
    },

    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    },

    /**
     * Calculate summary statistics
     */
    calculateSummary(results) {
        for (const fileResult of results.validationResults) {
            for (const entry of fileResult.entries) {
                results.summary.totalEntries++;
                
                const hasCritical = entry.issues.some(i => i.severity === 'critical');
                const hasWarning = entry.issues.some(i => i.severity === 'warning');
                
                if (hasCritical) {
                    results.summary.entriesWithErrors++;
                } else if (hasWarning) {
                    results.summary.entriesWithWarnings++;
                } else {
                    results.summary.validEntries++;
                }

                for (const issue of entry.issues) {
                    if (issue.severity === 'critical') {
                        results.summary.criticalErrors++;
                    } else if (issue.severity === 'warning') {
                        results.summary.warnings++;
                    } else {
                        results.summary.info++;
                    }
                }
            }

            // Count file-level issues
            for (const issue of fileResult.fileIssues) {
                if (issue.severity === 'critical') {
                    results.summary.criticalErrors++;
                } else if (issue.severity === 'warning') {
                    results.summary.warnings++;
                } else {
                    results.summary.info++;
                }
            }
        }
    },

    /**
     * Analyze cross-references
     */
    analyzeCrossReferences(results) {
        // All references
        results.crossReferences.allReferences.skills = [...this.crossReferences.skills];
        results.crossReferences.allReferences.items = [...this.crossReferences.items];
        results.crossReferences.allReferences.mobs = [...this.crossReferences.mobs];
        results.crossReferences.allReferences.droptables = [...this.crossReferences.droptables];

        // Resolved references
        for (const skill of this.crossReferences.skills) {
            if (this.definedEntities.skills.has(skill)) {
                results.crossReferences.resolvedReferences.skills.push(skill);
            } else {
                results.crossReferences.missingReferences.skills.push({
                    name: skill,
                    referencedBy: this.findReferencedBy(results, 'skills', skill)
                });
            }
        }

        for (const item of this.crossReferences.items) {
            if (this.definedEntities.items.has(item) || this.isVanillaItem(item)) {
                results.crossReferences.resolvedReferences.items.push(item);
            } else {
                results.crossReferences.missingReferences.items.push({
                    name: item,
                    referencedBy: this.findReferencedBy(results, 'items', item)
                });
            }
        }

        for (const mob of this.crossReferences.mobs) {
            if (this.definedEntities.mobs.has(mob)) {
                results.crossReferences.resolvedReferences.mobs.push(mob);
            } else {
                results.crossReferences.missingReferences.mobs.push({
                    name: mob,
                    referencedBy: this.findReferencedBy(results, 'mobs', mob)
                });
            }
        }

        for (const dt of this.crossReferences.droptables) {
            if (this.definedEntities.droptables.has(dt)) {
                results.crossReferences.resolvedReferences.droptables.push(dt);
            } else {
                results.crossReferences.missingReferences.droptables.push({
                    name: dt,
                    referencedBy: this.findReferencedBy(results, 'droptables', dt)
                });
            }
        }
    },

    /**
     * Find which entries reference a given entity
     */
    findReferencedBy(results, type, name) {
        const referencedBy = [];
        
        for (const fileResult of results.validationResults) {
            for (const entry of fileResult.entries) {
                if (entry.crossReferences[type]?.includes(name)) {
                    referencedBy.push({
                        entry: entry.name,
                        file: fileResult.relativePath
                    });
                }
            }
        }

        return referencedBy;
    }
});
