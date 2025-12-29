/**
 * YAML Exporter - Converts JavaScript objects to MythicMobs YAML
 * Created by: AlternativeSoap
 * https://github.com/AlternativeSoap/Soaps-MythicMobs-Editor
 */
class YAMLExporter {
    export(data, type) {
        const footer = `\n#\n#\n#\n#\n#\n#\n#\n#\n#\n#\n#\n# Made by AlternativeSoap's MythicMob Editor\n# Discord: https://discord.gg/eUFRvyzJua`;
        try {
            const yaml = this.exportWithoutFooter(data, type);
            return yaml + footer;
        } catch (error) {
            console.error('YAML export error:', error);
            return '# Export error';
        }
    }
    
    /**
     * Export without footer (used for pack exports)
     */
    exportWithoutFooter(data, type) {
        try {
            let yaml = '';
            switch (type) {
                case 'mob':
                    yaml = this.exportMob(data);
                    break;
                case 'skill':
                    yaml = this.exportSkill(data);
                    break;
                case 'item':
                    yaml = this.exportItem(data);
                    break;
                case 'droptable':
                    yaml = this.exportDropTable(data);
                    break;
                case 'randomspawn':
                    yaml = this.exportRandomSpawn(data);
                    break;
                default:
                    return '# Unknown type';
            }
            return yaml;
        } catch (error) {
            console.error('YAML export error:', error);
            return '# Export error';
        }
    }
    
    /**
     * Escape special characters in YAML strings
     */
    escapeYamlString(text) {
        if (typeof text !== 'string') return text;
        return text.replace(/'/g, "''");
    }
    
    /**
     * Set the pack context for template resolution
     * @param {Object} pack - The current pack containing all mobs
     */
    setPackContext(pack) {
        this.currentPack = pack;
        // Pre-build a flat lookup map for faster template resolution
        this.mobLookup = new Map();
        if (pack && pack.mobs) {
            pack.mobs.forEach(file => {
                if (file.entries && Array.isArray(file.entries)) {
                    // File-based structure: file.entries = [mob1, mob2, ...]
                    file.entries.forEach(mob => {
                        if (mob.name) {
                            this.mobLookup.set(mob.name, mob);
                        }
                    });
                } else if (file.name) {
                    // Flat structure: file itself is a mob object
                    this.mobLookup.set(file.name, file);
                }
            });
        }
    }
    
    /**
     * Get a template mob by name from the current pack
     * @param {string} templateName - Name of the template mob
     * @returns {Object|null} Template mob data or null
     */
    getTemplateMob(templateName) {
        if (!templateName || !this.mobLookup) return null;
        // Handle comma-separated templates (get first one)
        const firstName = templateName.split(',')[0].trim();
        return this.mobLookup.get(firstName) || null;
    }
    
    /**
     * Check if a value differs from the template value
     */
    valuesDiffer(value, templateValue) {
        // If template has no value, our value is unique
        if (templateValue === undefined || templateValue === null) return true;
        
        // If our value is undefined/null, it's inherited (not different)
        if (value === undefined || value === null) return false;
        
        // For arrays, compare by JSON
        if (Array.isArray(value) && Array.isArray(templateValue)) {
            return JSON.stringify(value) !== JSON.stringify(templateValue);
        }
        
        // For objects, compare by JSON
        if (typeof value === 'object' && typeof templateValue === 'object') {
            return JSON.stringify(value) !== JSON.stringify(templateValue);
        }
        
        // Simple value comparison
        return value !== templateValue;
    }
    
    exportMob(mob) {
        // Check if mob has a template
        const hasTemplate = mob.template && mob.template.trim();
        
        // If using template, use template-aware export (simpler output)
        if (hasTemplate) {
            return this.exportMobWithTemplate(mob);
        }
        
        // Otherwise, use full export
        return this.exportMobFull(mob);
    }
    
    /**
     * Export a mob that uses a template
     * 
     * MythicMobs template behavior:
     * - Child inherits all properties from template
     * - Any property explicitly set on child OVERRIDES the template's value
     * - Skills/Drops/etc. don't merge - they completely replace if defined
     * 
     * So we only export:
     * 1. Template reference (always)
     * 2. Properties that this mob explicitly defines (overrides)
     */
    exportMobWithTemplate(mob) {
        let yaml = `${mob.name}:\n`;
        
        // Always output Template first
        yaml += `  Template: ${mob.template}\n`;
        
        // Export Type ONLY if explicitly set on this mob (overriding template)
        // When mob.type is set, user has unlocked and chosen to override the template's entity type
        if (mob.type && mob.type.trim()) {
            yaml += `  MobType: ${mob.type}\n`;
        }
        
        // Display - only if explicitly set on this mob
        if (mob.display && mob.display.trim()) {
            yaml += `  Display: '${mob.display}'\n`;
        }
        
        // Core stats - only if explicitly set (not inherited defaults)
        // We check if the value exists and isn't empty/default
        if (mob.health !== undefined && mob.health !== '' && mob.health !== null) {
            yaml += `  Health: ${mob.health}\n`;
        }
        if (mob.damage !== undefined && mob.damage !== '' && mob.damage !== null) {
            yaml += `  Damage: ${mob.damage}\n`;
        }
        if (mob.armor !== undefined && mob.armor !== '' && mob.armor !== null && mob.armor !== 0 && mob.armor !== '0') {
            yaml += `  Armor: ${mob.armor}\n`;
        }
        
        // Faction - only if set
        if (mob.faction && mob.faction.trim()) {
            yaml += `  Faction: ${mob.faction}\n`;
        }
        
        // Options - export if any are set
        const optionsYaml = this.buildOptionsSection(mob, null);
        if (optionsYaml) {
            yaml += optionsYaml;
        }
        
        // BossBar - if enabled
        if (mob.bossBar && mob.bossBar.enabled) {
            yaml += this.exportBossBarSection(mob.bossBar);
        }
        
        // Equipment - if any slots set
        if (mob.equipment && Object.keys(mob.equipment).length > 0) {
            const hasEquipment = Object.values(mob.equipment).some(v => v && v.trim());
            if (hasEquipment) {
                yaml += this.exportEquipmentSection(mob.equipment);
            }
        }
        
        // DamageModifiers - if any set
        if (mob.damageModifiers) {
            const hasModifiers = Array.isArray(mob.damageModifiers) ? 
                mob.damageModifiers.length > 0 : 
                Object.keys(mob.damageModifiers).length > 0;
            if (hasModifiers) {
                yaml += this.exportDamageModifiersSection(mob.damageModifiers);
            }
        }
        
        // KillMessages - if any
        if (mob.killMessages && mob.killMessages.length > 0) {
            yaml += this.exportKillMessagesSection(mob.killMessages);
        }
        
        // AIGoalSelectors - if any
        if (mob.aiGoalSelectors && mob.aiGoalSelectors.length > 0) {
            yaml += this.exportAIGoalSelectorsSection(mob.aiGoalSelectors);
        }
        
        // AITargetSelectors - if any
        if (mob.aiTargetSelectors && mob.aiTargetSelectors.length > 0) {
            yaml += this.exportAITargetSelectorsSection(mob.aiTargetSelectors);
        }
        
        // Modules - if any
        if (mob.modules) {
            yaml += this.exportModulesSection(mob.modules);
        }
        
        // LevelModifiers - if any set
        if (mob.levelModifiers && Object.keys(mob.levelModifiers).length > 0) {
            yaml += this.exportLevelModifiersSection(mob.levelModifiers);
        }
        
        // === NEW SECTIONS ===
        
        // Mount - if set
        if (mob.mount && mob.mount.trim()) {
            yaml += `  Mount: ${mob.mount}\n`;
        }
        
        // HealthBar - if enabled
        if (mob.healthBar && mob.healthBar.enabled) {
            yaml += `  HealthBar:\n`;
            yaml += `    Enabled: true\n`;
            if (mob.healthBar.offset !== undefined && mob.healthBar.offset !== 1.45) {
                yaml += `    Offset: ${mob.healthBar.offset}\n`;
            }
        }
        
        // Hearing - if enabled
        if (mob.hearing && mob.hearing.enabled) {
            yaml += `  Hearing:\n`;
            yaml += `    Enabled: true\n`;
        }
        
        // Nameplate - if enabled
        if (mob.nameplate && mob.nameplate.enabled) {
            yaml += `  Nameplate:\n`;
            yaml += `    Enabled: true\n`;
            if (mob.nameplate.offset !== undefined && mob.nameplate.offset !== 1.8) {
                yaml += `    Offset: ${mob.nameplate.offset}\n`;
            }
            if (mob.nameplate.scale && mob.nameplate.scale !== '1,1,1') {
                yaml += `    Scale: ${mob.nameplate.scale}\n`;
            }
            if (mob.nameplate.mounted) {
                yaml += `    Mounted: true\n`;
            }
        }
        
        // Disguise - if configured
        if (mob.disguiseConfig && mob.disguiseConfig.type && mob.disguiseConfig.type.trim()) {
            yaml += `  Disguise: ${mob.disguiseConfig.type}\n`;
        }
        
        // Trades - if any (for villagers)
        if (mob.trades && Object.keys(mob.trades).length > 0) {
            yaml += this.exportTradesSection(mob.trades);
        }
        
        // Skills - if any defined (these OVERRIDE template skills, not merge)
        if (mob.skills && mob.skills.length > 0) {
            yaml += this.exportSkillsSection(mob.skills);
        }
        
        // Drops - if any
        if (mob.drops && mob.drops.length > 0) {
            yaml += this.exportDropsSection(mob.drops);
        }
        
        // DropOptions - if FANCY mode
        if (mob.dropOptions && mob.dropOptions.DropMethod === 'FANCY') {
            yaml += this.exportDropOptions(mob.dropOptions);
        }
        
        // Totem - if configured
        if (mob.totem || mob.Totem) {
            yaml += this.exportTotemSection(mob.totem || mob.Totem);
        }
        
        return yaml;
    }
    
    /**
     * Export a mob without template - full export of all properties
     */
    exportMobFull(mob) {
        // Create field manager to check field applicability
        const fieldManager = new EntityFieldManager();
        const entityType = mob.type || 'ZOMBIE';
        
        // MythicMobs uses MobType, not Type
        const yamlEntityType = entityType;
        
        let yaml = `${mob.name}:\n`;
        yaml += `  MobType: ${yamlEntityType}\n`;
        
        // Helper to check if field should be exported
        const shouldExport = (fieldName, value) => {
            // Skip if value is undefined, null, or empty string (but allow false and 0)
            if (value === undefined || value === null) return false;
            if (value === '' || (typeof value === 'string' && value.trim() === '')) return false;
            
            // Universal fields that apply to all entity types (skip fieldManager check)
            const universalFields = ['Display', 'Health', 'Damage', 'Armor', 'Faction'];
            if (universalFields.includes(fieldName)) return true;
            
            // Skip if field not applicable to this entity type
            if (!fieldManager.shouldShowField(entityType, fieldName)) return false;
            return true;
        };
        
        // === TOP-LEVEL FIELDS (outside Options) ===
        
        // Display
        if (shouldExport('Display', mob.display)) {
            yaml += `  Display: '${mob.display}'\n`;
        }
        
        // Core stats only
        if (shouldExport('Health', mob.health)) {
            yaml += `  Health: ${mob.health}\n`;
        }
        if (shouldExport('Damage', mob.damage)) {
            yaml += `  Damage: ${mob.damage}\n`;
        }
        if (shouldExport('Armor', mob.armor) && mob.armor !== 0 && mob.armor !== '0') {
            yaml += `  Armor: ${mob.armor}\n`;
        }
        
        // Despawn mode
        if (shouldExport('Despawn', mob.despawn)) {
            if (mob.despawn === 'true' || mob.despawn === 'NORMAL') {
                yaml += `  Despawn: true\n`;
            } else if (mob.despawn === 'false' || mob.despawn === 'NEVER') {
                yaml += `  Despawn: false\n`;
            } else {
                yaml += `  Despawn: ${mob.despawn}\n`;
            }
        }
        
        // === PHASE 1: Faction ===
        if (mob.faction && mob.faction.trim()) {
            yaml += `  Faction: ${mob.faction}\n`;
        }
        
        // === BUILD COMPREHENSIVE OPTIONS SECTION ===
        const optionsMap = {};
        
        // Movement & Combat stats (now in Options)
        if (shouldExport('MovementSpeed', mob.movementSpeed)) optionsMap.MovementSpeed = mob.movementSpeed;
        if (shouldExport('FollowRange', mob.followRange)) optionsMap.FollowRange = mob.followRange;
        if (shouldExport('KnockbackResistance', mob.knockbackResistance)) optionsMap.KnockbackResistance = mob.knockbackResistance;
        if (shouldExport('AttackSpeed', mob.attackSpeed)) optionsMap.AttackSpeed = mob.attackSpeed;
        if (shouldExport('MaxCombatDistance', mob.maxCombatDistance)) optionsMap.MaxCombatDistance = mob.maxCombatDistance;
        if (shouldExport('NoDamageTicks', mob.noDamageTicks)) optionsMap.NoDamageTicks = mob.noDamageTicks;
        if (shouldExport('Scale', mob.scale) && mob.scale !== -1) optionsMap.Scale = mob.scale;
        if (shouldExport('ReviveHealth', mob.reviveHealth) && mob.reviveHealth !== -1) optionsMap.ReviveHealth = mob.reviveHealth;
        
        // Universal display & visibility options
        if (shouldExport('AlwaysShowName', mob.alwaysShowName) && mob.alwaysShowName) optionsMap.AlwaysShowName = true;
        if (shouldExport('VisibleByDefault', mob.visibleByDefault) && mob.visibleByDefault === false) optionsMap.VisibleByDefault = false;
        if (shouldExport('Invisible', mob.invisible) && mob.invisible) optionsMap.Invisible = true;
        if (shouldExport('Glowing', mob.glowing) && mob.glowing) optionsMap.Glowing = true;
        if (shouldExport('Silent', mob.silent) && mob.silent) optionsMap.Silent = true;
        if (shouldExport('ShowHealth', mob.showHealth) && mob.showHealth) optionsMap.ShowHealth = true;
        
        // Universal physics & behavior options
        if (shouldExport('NoGravity', mob.noGravity) && mob.noGravity) optionsMap.NoGravity = true;
        if (shouldExport('Collidable', mob.collidable) && mob.collidable === false) optionsMap.Collidable = false;
        if (shouldExport('Interactable', mob.interactable) && mob.interactable) optionsMap.Interactable = true;
        if (shouldExport('LockPitch', mob.lockPitch) && mob.lockPitch) optionsMap.LockPitch = true;
        if (shouldExport('NoAI', mob.noAI) && mob.noAI) optionsMap.NoAI = true;
        
        // Universal combat & damage options
        if (shouldExport('Invincible', mob.invincible) && mob.invincible) optionsMap.Invincible = true;
        if (shouldExport('PreventVanillaDamage', mob.preventVanillaDamage) && mob.preventVanillaDamage) optionsMap.PreventVanillaDamage = true;
        if (shouldExport('PassthroughDamage', mob.passthroughDamage) && mob.passthroughDamage) optionsMap.PassthroughDamage = true;
        if (shouldExport('PreventMobKillDrops', mob.preventMobKillDrops) && mob.preventMobKillDrops) optionsMap.PreventMobKillDrops = true;
        
        // Universal drops & equipment options
        if (shouldExport('PreventOtherDrops', mob.preventOtherDrops) && mob.preventOtherDrops) optionsMap.PreventOtherDrops = true;
        if (shouldExport('PreventRandomEquipment', mob.preventRandomEquipment) && mob.preventRandomEquipment) optionsMap.PreventRandomEquipment = true;
        if (shouldExport('PreventItemPickup', mob.preventItemPickup) && mob.preventItemPickup) optionsMap.PreventItemPickup = true;
        if (shouldExport('PreventLeashing', mob.preventLeashing) && mob.preventLeashing) optionsMap.PreventLeashing = true;
        if (shouldExport('PreventRenaming', mob.preventRenaming) && mob.preventRenaming) optionsMap.PreventRenaming = true;
        
        // Universal special behaviors
        if (shouldExport('PreventSunburn', mob.preventSunburn) && mob.preventSunburn) optionsMap.PreventSunburn = true;
        if (shouldExport('PreventTransformation', mob.preventTransformation) && mob.preventTransformation) optionsMap.PreventTransformation = true;
        if (shouldExport('DigOutOfGround', mob.digOutOfGround) && mob.digOutOfGround) optionsMap.DigOutOfGround = true;
        if (shouldExport('HealOnReload', mob.healOnReload) && mob.healOnReload) optionsMap.HealOnReload = true;
        if (shouldExport('RepeatAllSkills', mob.repeatAllSkills) && mob.repeatAllSkills) optionsMap.RepeatAllSkills = true;
        if (shouldExport('UseThreatTable', mob.useThreatTable) && mob.useThreatTable === false) optionsMap.UseThreatTable = false;
        if (shouldExport('RandomizeProperties', mob.randomizeProperties) && mob.randomizeProperties === false) optionsMap.RandomizeProperties = false;
        
        // Zombie-specific options
        if (shouldExport('PreventJockeyMounts', mob.preventJockeyMounts) && mob.preventJockeyMounts) optionsMap.PreventJockeyMounts = true;
        if (shouldExport('PreventConversion', mob.preventConversion) && mob.preventConversion) optionsMap.PreventConversion = true;
        if (shouldExport('ReinforcementsChance', mob.reinforcementsChance)) optionsMap.ReinforcementsChance = mob.reinforcementsChance;
        
        // Age options
        if (shouldExport('Baby', mob.baby) && mob.baby) optionsMap.Baby = true;
        if (shouldExport('Adult', mob.adult) && mob.adult) optionsMap.Adult = true;
        if (shouldExport('Age', mob.age)) optionsMap.Age = mob.age;
        if (shouldExport('AgeLock', mob.ageLock) && mob.ageLock) optionsMap.AgeLock = true;
        
        // Size options
        if (shouldExport('Size', mob.size)) optionsMap.Size = mob.size;
        if (shouldExport('PreventSlimeSplit', mob.preventSlimeSplit) && mob.preventSlimeSplit) optionsMap.PreventSlimeSplit = true;
        
        // Armor Stand options
        if (shouldExport('Small', mob.small) && mob.small) optionsMap.Small = true;
        if (shouldExport('HasArms', mob.hasArms) && mob.hasArms) optionsMap.HasArms = true;
        if (shouldExport('HasBasePlate', mob.hasBasePlate) && mob.hasBasePlate === false) optionsMap.HasBasePlate = false;
        if (shouldExport('HasGravity', mob.hasGravity) && mob.hasGravity === false) optionsMap.HasGravity = false;
        if (shouldExport('Marker', mob.marker) && mob.marker) optionsMap.Marker = true;
        if (shouldExport('CanMove', mob.canMove) && mob.canMove === false) optionsMap.CanMove = false;
        if (shouldExport('CanTick', mob.canTick) && mob.canTick === false) optionsMap.CanTick = false;
        if (shouldExport('ItemHead', mob.itemHead)) optionsMap.ItemHead = mob.itemHead;
        if (shouldExport('ItemBody', mob.itemBody)) optionsMap.ItemBody = mob.itemBody;
        if (shouldExport('ItemLegs', mob.itemLegs)) optionsMap.ItemLegs = mob.itemLegs;
        if (shouldExport('ItemFeet', mob.itemFeet)) optionsMap.ItemFeet = mob.itemFeet;
        if (shouldExport('ItemHand', mob.itemHand)) optionsMap.ItemHand = mob.itemHand;
        if (shouldExport('ItemOffhand', mob.itemOffhand)) optionsMap.ItemOffhand = mob.itemOffhand;
        
        // Armor Stand Pose options (format: "x,y,z" or "xToy,0,0")
        if (mob.pose) {
            if (shouldExport('pose.head', mob.pose.head) && mob.pose.head) optionsMap.Head = mob.pose.head;
            if (shouldExport('pose.body', mob.pose.body) && mob.pose.body) optionsMap.Body = mob.pose.body;
            if (shouldExport('pose.leftArm', mob.pose.leftArm) && mob.pose.leftArm) optionsMap.LeftArm = mob.pose.leftArm;
            if (shouldExport('pose.rightArm', mob.pose.rightArm) && mob.pose.rightArm) optionsMap.RightArm = mob.pose.rightArm;
            if (shouldExport('pose.leftLeg', mob.pose.leftLeg) && mob.pose.leftLeg) optionsMap.LeftLeg = mob.pose.leftLeg;
            if (shouldExport('pose.rightLeg', mob.pose.rightLeg) && mob.pose.rightLeg) optionsMap.RightLeg = mob.pose.rightLeg;
        }
        
        // Creeper options
        if (shouldExport('ExplosionRadius', mob.explosionRadius)) optionsMap.ExplosionRadius = mob.explosionRadius;
        if (shouldExport('FuseTicks', mob.fuseTicks)) optionsMap.FuseTicks = mob.fuseTicks;
        if (shouldExport('SuperCharged', mob.superCharged) && mob.superCharged) optionsMap.SuperCharged = true;
        if (shouldExport('PreventSuicide', mob.preventSuicide) && mob.preventSuicide) optionsMap.PreventSuicide = true;
        
        // Villager options
        if (shouldExport('Profession', mob.profession)) optionsMap.Profession = mob.profession;
        if (shouldExport('Level', mob.level)) optionsMap.Level = mob.level;
        if (shouldExport('VillagerType', mob.villagerType)) optionsMap.VillagerType = mob.villagerType;
        if (shouldExport('HasTrades', mob.hasTrades) && mob.hasTrades) optionsMap.HasTrades = true;
        
        // Horse options
        if (shouldExport('Saddled', mob.saddled) && mob.saddled) optionsMap.Saddled = true;
        if (shouldExport('Tamed', mob.tamed) && mob.tamed) optionsMap.Tamed = true;
        if (shouldExport('HorseArmor', mob.horseArmor)) optionsMap.HorseArmor = mob.horseArmor;
        if (shouldExport('HorseColor', mob.horseColor)) optionsMap.HorseColor = mob.horseColor;
        if (shouldExport('HorseStyle', mob.horseStyle)) optionsMap.HorseStyle = mob.horseStyle;
        
        // Armadillo options (1.21+)
        if (shouldExport('ScaredState', mob.scaredState) && mob.scaredState) optionsMap.ScaredState = true;
        
        // Write Options section if any exist
        if (Object.keys(optionsMap).length > 0) {
            yaml += `  Options:\n`;
            Object.entries(optionsMap).forEach(([key, value]) => {
                yaml += `    ${key}: ${value}\n`;
            });
        }
        
        // === DISPLAY OPTIONS SECTION (for display entities) ===
        const isDisplayEntity = ['BLOCK_DISPLAY', 'ITEM_DISPLAY', 'TEXT_DISPLAY'].includes(entityType);
        if (isDisplayEntity) {
            const displayOptionsMap = {};
            
            // Base options
            if (shouldExport('ViewRange', mob.viewRange)) displayOptionsMap.ViewRange = mob.viewRange;
            if (shouldExport('Width', mob.width)) displayOptionsMap.Width = mob.width;
            if (shouldExport('Height', mob.height)) displayOptionsMap.Height = mob.height;
            if (shouldExport('ShadowRadius', mob.shadowRadius)) displayOptionsMap.ShadowRadius = mob.shadowRadius;
            if (shouldExport('ShadowStrength', mob.shadowStrength)) displayOptionsMap.ShadowStrength = mob.shadowStrength;
            if (shouldExport('Billboard', mob.billboard)) displayOptionsMap.Billboard = mob.billboard;
            
            // Timing & Interpolation
            if (shouldExport('TeleportDuration', mob.teleportDuration)) displayOptionsMap.TeleportDuration = mob.teleportDuration;
            if (shouldExport('InterpolationDelay', mob.interpolationDelay)) displayOptionsMap.InterpolationDelay = mob.interpolationDelay;
            if (shouldExport('InterpolationDuration', mob.interpolationDuration)) displayOptionsMap.InterpolationDuration = mob.interpolationDuration;
            
            // Brightness & Color
            if (shouldExport('BlockLight', mob.blockLight) && mob.blockLight !== -1) displayOptionsMap.BlockLight = mob.blockLight;
            if (shouldExport('SkyLight', mob.skyLight) && mob.skyLight !== -1) displayOptionsMap.SkyLight = mob.skyLight;
            if (shouldExport('ColorOverride', mob.colorOverride)) displayOptionsMap.ColorOverride = mob.colorOverride;
            
            // Transformations
            if (shouldExport('Translation', mob.translation)) displayOptionsMap.Translation = mob.translation;
            if (shouldExport('Scale', mob.displayScale)) displayOptionsMap.Scale = mob.displayScale;
            if (shouldExport('LeftRotation', mob.leftRotation)) displayOptionsMap.LeftRotation = mob.leftRotation;
            if (shouldExport('RightRotation', mob.rightRotation)) displayOptionsMap.RightRotation = mob.rightRotation;
            
            // Type-specific options
            if (entityType === 'BLOCK_DISPLAY' && shouldExport('Block', mob.block)) {
                displayOptionsMap.Block = mob.block;
            } else if (entityType === 'ITEM_DISPLAY') {
                if (shouldExport('Item', mob.item)) displayOptionsMap.Item = mob.item;
                if (shouldExport('Transform', mob.transform)) displayOptionsMap.Transform = mob.transform;
            } else if (entityType === 'TEXT_DISPLAY') {
                if (shouldExport('Text', mob.text)) displayOptionsMap.Text = mob.text;
                if (shouldExport('Opacity', mob.opacity)) displayOptionsMap.Opacity = mob.opacity;
                if (shouldExport('DefaultBackground', mob.defaultBackground) && mob.defaultBackground) displayOptionsMap.DefaultBackground = true;
                if (shouldExport('BackgroundColor', mob.backgroundColor)) displayOptionsMap.BackgroundColor = mob.backgroundColor;
                if (shouldExport('Alignment', mob.alignment)) displayOptionsMap.Alignment = mob.alignment;
                if (shouldExport('LineWidth', mob.lineWidth)) displayOptionsMap.LineWidth = mob.lineWidth;
                if (shouldExport('Shadowed', mob.shadowed) && mob.shadowed) displayOptionsMap.Shadowed = true;
                if (shouldExport('SeeThrough', mob.seeThrough) && mob.seeThrough) displayOptionsMap.SeeThrough = true;
            }
            
            // Write DisplayOptions section if any exist
            if (Object.keys(displayOptionsMap).length > 0) {
                yaml += `  DisplayOptions:\n`;
                Object.entries(displayOptionsMap).forEach(([key, value]) => {
                    yaml += `    ${key}: ${value}\n`;
                });
            }
        }
        
        // === MANNEQUIN OPTIONS SECTION (for mannequin entities - 1.21.11+) ===
        const isMannequin = entityType === 'MANNEQUIN';
        if (isMannequin) {
            const mannequinOptionsMap = {};
            
            // Boolean options
            if (shouldExport('Immovable', mob.immovable) && mob.immovable) mannequinOptionsMap.Immovable = true;
            if (shouldExport('HideDescription', mob.hideDescription) && mob.hideDescription) mannequinOptionsMap.HideDescription = true;
            
            // String options
            if (shouldExport('Description', mob.description)) mannequinOptionsMap.Description = `"${mob.description}"`;
            if (shouldExport('Player', mob.player)) mannequinOptionsMap.Player = mob.player;
            if (shouldExport('Skin', mob.skin)) mannequinOptionsMap.Skin = mob.skin;
            if (shouldExport('Cape', mob.cape)) mannequinOptionsMap.Cape = mob.cape;
            if (shouldExport('Elytra', mob.elytra)) mannequinOptionsMap.Elytra = mob.elytra;
            
            // Enum options
            if (shouldExport('MainHand', mob.mainHand)) mannequinOptionsMap.MainHand = mob.mainHand;
            if (shouldExport('Pose', mob.pose)) mannequinOptionsMap.Pose = mob.pose;
            if (shouldExport('Model', mob.model)) mannequinOptionsMap.Model = mob.model;
            
            // Write MannequinOptions section if any exist
            if (Object.keys(mannequinOptionsMap).length > 0) {
                yaml += `  MannequinOptions:\n`;
                Object.entries(mannequinOptionsMap).forEach(([key, value]) => {
                    yaml += `    ${key}: ${value}\n`;
                });
            }
        }
        
        // === SPECIAL SECTIONS (always outside Options) ===
        
        // === PHASE 1: BossBar ===
        if (mob.bossBar && mob.bossBar.enabled) {
            yaml += `  BossBar:\n`;
            yaml += `    Enabled: true\n`;
            yaml += `    Title: '${mob.bossBar.title || '[name]'}'\n`;
            yaml += `    Range: ${mob.bossBar.range || 50}\n`;
            yaml += `    Color: ${mob.bossBar.color || 'PURPLE'}\n`;
            yaml += `    Style: ${mob.bossBar.style || 'SOLID'}\n`;
            if (mob.bossBar.createFog) yaml += `    CreateFog: true\n`;
            if (mob.bossBar.darkenSky) yaml += `    DarkenSky: true\n`;
            if (mob.bossBar.playMusic) yaml += `    PlayMusic: true\n`;
        }
        
        // === PHASE 1: Equipment ===
        if (mob.equipment && Object.keys(mob.equipment).length > 0) {
            yaml += `  Equipment:\n`;
            Object.entries(mob.equipment).forEach(([slot, item]) => {
                if (item && item.trim()) {
                    yaml += `  - ${item} ${slot}\n`;
                }
            });
        }
        
        // === PHASE 1: DamageModifiers ===
        if (mob.damageModifiers) {
            // Handle both array format ["TYPE VALUE"] and object format {TYPE: value}
            if (Array.isArray(mob.damageModifiers) && mob.damageModifiers.length > 0) {
                yaml += `  DamageModifiers:\n`;
                mob.damageModifiers.forEach(modifier => {
                    if (typeof modifier === 'string') {
                        // Format: "FALL 0" or "PROJECTILE 0.75"
                        yaml += `  - ${modifier}\n`;
                    }
                });
            } else if (typeof mob.damageModifiers === 'object' && Object.keys(mob.damageModifiers).length > 0) {
                yaml += `  DamageModifiers:\n`;
                Object.entries(mob.damageModifiers).forEach(([type, value]) => {
                    // Output in MythicMobs format: "- TYPE VALUE"
                    yaml += `  - ${type} ${value}\n`;
                });
            }
        }
        
        // === PHASE 1: KillMessages ===
        if (mob.killMessages && mob.killMessages.length > 0) {
            yaml += `  KillMessages:\n`;
            mob.killMessages.forEach(message => {
                if (message && message.trim()) {
                    yaml += `  - '${message}'\n`;
                }
            });
        }
        
        // === PHASE 2: AIGoalSelectors ===
        if (mob.aiGoalSelectors && mob.aiGoalSelectors.length > 0) {
            yaml += `  AIGoalSelectors:\n`;
            mob.aiGoalSelectors.forEach(goal => {
                if (typeof goal === 'string') {
                    // Simple string format like "clear" or "1 meleeattack"
                    yaml += `  - ${goal}\n`;
                } else if (typeof goal === 'object' && goal !== null) {
                    // Object format with priority, name, params
                    yaml += `  - ${goal.priority || 0} ${goal.name || 'unknown'}`;
                    if (goal.params) yaml += ` ${goal.params}`;
                    yaml += `\n`;
                }
            });
        }
        
        // === PHASE 2: AITargetSelectors ===
        if (mob.aiTargetSelectors && mob.aiTargetSelectors.length > 0) {
            yaml += `  AITargetSelectors:\n`;
            mob.aiTargetSelectors.forEach(target => {
                if (typeof target === 'string') {
                    // Simple string format like "clear"
                    yaml += `  - ${target}\n`;
                } else if (typeof target === 'object' && target !== null) {
                    // Object format with priority, name, params
                    yaml += `  - ${target.priority || 0} ${target.name || 'unknown'}`;
                    if (target.params) yaml += ` ${target.params}`;
                    yaml += `\n`;
                }
            });
        }
        
        // === PHASE 2: Modules ===
        if (mob.modules) {
            const threatTable = mob.modules.threatTable || mob.modules.ThreatTable;
            const immunityTable = mob.modules.immunityTable || mob.modules.ImmunityTable;
            if (threatTable || immunityTable) {
                yaml += `  Modules:\n`;
                if (threatTable) yaml += `    ThreatTable: true\n`;
                if (immunityTable) yaml += `    ImmunityTable: true\n`;
            }
        }
        
        // === PHASE 3: Level Modifiers ===
        if (mob.levelModifiers && Object.keys(mob.levelModifiers).length > 0) {
            const lm = mob.levelModifiers;
            const hasValues = Object.values(lm).some(v => v && v !== 0);
            if (hasValues) {
                yaml += `  LevelModifiers:\n`;
                if (lm.health) yaml += `    Health: ${lm.health}\n`;
                if (lm.damage) yaml += `    Damage: ${lm.damage}\n`;
                if (lm.power) yaml += `    Power: ${lm.power}\n`;
                if (lm.armor) yaml += `    Armor: ${lm.armor}\n`;
                if (lm.knockbackResistance) yaml += `    KnockbackResistance: ${lm.knockbackResistance}\n`;
                if (lm.movementSpeed) yaml += `    MovementSpeed: ${lm.movementSpeed}\n`;
            }
        }
        
        // === PHASE 4: Skills ===
        if (mob.skills && mob.skills.length > 0) {
            yaml += `  Skills:\n`;
            mob.skills.forEach(skill => {
                if (typeof skill === 'string') {
                    // Skill is already a formatted string like "skill{} @targeter ~trigger"
                    // Add dash prefix if not present
                    const formattedSkill = skill.startsWith('- ') ? skill : `- ${skill}`;
                    yaml += `  ${formattedSkill}\n`;
                } else if (typeof skill === 'object' && skill !== null) {
                    // Object format with name, trigger, cooldown
                    yaml += `  - ${skill.name || 'unknown'} ${skill.trigger || '~onAttack'}`;
                    if (skill.cooldown && skill.cooldown > 0) {
                        yaml += ` ${skill.cooldown}`;
                    }
                    yaml += `\n`;
                }
            });
        }
        
        // === PHASE 4: Drops ===
        if (mob.drops && mob.drops.length > 0) {
            yaml += `  Drops:\n`;
            mob.drops.forEach(drop => {
                yaml += `  - ${this.exportDrop(drop)}\n`;
            });
        }

        // === PHASE 4.5: DropOptions (only if DropMethod is FANCY) ===
        if (mob.dropOptions && mob.dropOptions.DropMethod === 'FANCY') {
            yaml += this.exportDropOptions(mob.dropOptions);
        }
        
        // === NEW SECTIONS ===
        
        // Mount - if set
        if (mob.mount && mob.mount.trim()) {
            yaml += `  Mount: ${mob.mount}\n`;
        }
        
        // HealthBar - if enabled
        if (mob.healthBar && mob.healthBar.enabled) {
            yaml += `  HealthBar:\n`;
            yaml += `    Enabled: true\n`;
            if (mob.healthBar.offset !== undefined && mob.healthBar.offset !== 1.45) {
                yaml += `    Offset: ${mob.healthBar.offset}\n`;
            }
        }
        
        // Hearing - if enabled
        if (mob.hearing && mob.hearing.enabled) {
            yaml += `  Hearing:\n`;
            yaml += `    Enabled: true\n`;
        }
        
        // Nameplate - if enabled
        if (mob.nameplate && mob.nameplate.enabled) {
            yaml += `  Nameplate:\n`;
            yaml += `    Enabled: true\n`;
            if (mob.nameplate.offset !== undefined && mob.nameplate.offset !== 1.8) {
                yaml += `    Offset: ${mob.nameplate.offset}\n`;
            }
            if (mob.nameplate.scale && mob.nameplate.scale !== '1,1,1') {
                yaml += `    Scale: ${mob.nameplate.scale}\n`;
            }
            if (mob.nameplate.mounted) {
                yaml += `    Mounted: true\n`;
            }
        }
        
        // Disguise - if configured
        if (mob.disguiseConfig && mob.disguiseConfig.type && mob.disguiseConfig.type.trim()) {
            yaml += `  Disguise: ${mob.disguiseConfig.type}\n`;
        }
        
        // Trades - if any (for villagers)
        if (mob.trades && Object.keys(mob.trades).length > 0) {
            yaml += this.exportTradesSection(mob.trades);
        }
        
        // === PHASE 5: Totem (Totem configuration) ===
        if (mob.totem || mob.Totem) {
            const totem = mob.totem || mob.Totem;
            yaml += `  Totem:\n`;
            
            // Head block (required)
            if (totem.Head || totem.head) {
                yaml += `    Head: ${totem.Head || totem.head}\n`;
            } else {
                yaml += `    Head: PLAYER_HEAD\n`; // Default
            }
            
            // Pattern (array of coordinates and blocks)
            if (totem.Pattern && Array.isArray(totem.Pattern) && totem.Pattern.length > 0) {
                yaml += `    Pattern:\n`;
                totem.Pattern.forEach(entry => {
                    yaml += `    - ${entry}\n`;
                });
            }
            
            // Replacement blocks (optional)
            if (totem.Replacement && Array.isArray(totem.Replacement) && totem.Replacement.length > 0) {
                yaml += `    Replacement:\n`;
                totem.Replacement.forEach(entry => {
                    yaml += `    - ${entry}\n`;
                });
            }
        }
        
        return yaml;
    }

    /**
     * Export a single drop with all attributes
     */
    exportDrop(drop) {
        if (!drop || !drop.type) {
            return 'nothing 1 1.0';
        }

        let dropLine = '';
        const amount = drop.amount || '1';
        const chance = drop.chance !== undefined && drop.chance !== null ? drop.chance : '1.0';

        // Build drop line based on type
        switch (drop.type) {
            case 'item':
                dropLine = drop.item || 'STONE';
                // Add inline attributes for vanilla items
                if (drop.inlineAttributes && Object.keys(drop.inlineAttributes).length > 0) {
                    dropLine += this.exportInlineAttributes(drop.inlineAttributes);
                }
                // Add fancy attributes
                if (drop.fancyAttributes && Object.keys(drop.fancyAttributes).length > 0) {
                    dropLine += this.exportFancyAttributes(drop.fancyAttributes);
                }
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'mythicitem':
                dropLine = drop.item || 'MyItem';
                // Add fancy attributes for mythicitem
                if (drop.fancyAttributes && Object.keys(drop.fancyAttributes).length > 0) {
                    dropLine += this.exportFancyAttributes(drop.fancyAttributes);
                }
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'mythicmob':
                dropLine = 'mythicmob';
                if (drop.attributes && Object.keys(drop.attributes).length > 0) {
                    dropLine += this.exportDropAttributes(drop.attributes);
                }
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'exp':
                dropLine = `exp ${drop.amount || '1'} ${chance}`;
                break;

            case 'mcmmo-exp':
                dropLine = 'mcmmo-exp';
                if (drop.attributes && Object.keys(drop.attributes).length > 0) {
                    dropLine += this.exportDropAttributes(drop.attributes);
                }
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'money':
                dropLine = 'money';
                if (drop.attributes && drop.attributes.sendmessage !== undefined) {
                    dropLine += `{sendmessage=${drop.attributes.sendmessage}}`;
                }
                dropLine += ` ${drop.amount || '1'} ${chance}`;
                break;

            case 'command':
                dropLine = 'cmd';
                if (drop.attributes && Object.keys(drop.attributes).length > 0) {
                    dropLine += this.exportDropAttributes(drop.attributes);
                }
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'mmoitems':
                dropLine = 'mmoitems';
                if (drop.attributes && Object.keys(drop.attributes).length > 0) {
                    dropLine += this.exportDropAttributes(drop.attributes);
                }
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'vanillaLootTable':
                dropLine = drop.table || 'minecraft:empty';
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'itemvariable':
                dropLine = 'itemvariable';
                if (drop.attributes && drop.attributes.variable) {
                    dropLine += `{variable=${drop.attributes.variable}}`;
                }
                dropLine += ` ${amount} ${chance}`;
                break;

            case 'nothing':
            default:
                dropLine = `nothing ${amount} ${chance}`;
                break;
        }

        return dropLine;
    }

    /**
     * Export drop attributes in {key=value;key2=value2} format
     */
    exportDropAttributes(attributes) {
        if (!attributes || Object.keys(attributes).length === 0) return '';

        const parts = [];
        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined || value === null || value === '') continue;
            
            // Handle special characters in values (quotes)
            let formattedValue = value;
            if (typeof value === 'string' && (value.includes(' ') || value.includes(';') || value.includes('<'))) {
                formattedValue = `"${value.replace(/"/g, '\\"')}"`;
            }
            parts.push(`${key}=${formattedValue}`);
        }

        return parts.length > 0 ? `{${parts.join(';')}}` : '';
    }

    /**
     * Export inline item attributes for vanilla items
     */
    exportInlineAttributes(attributes) {
        if (!attributes || Object.keys(attributes).length === 0) return '';

        const parts = [];
        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined || value === null || value === '') continue;

            // Handle special formatting
            let formattedValue = value;
            if (typeof value === 'string') {
                // Preserve special characters like <&sq> for single quotes
                if (value.includes(' ') || value.includes(';') || value.includes('<')) {
                    formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                }
            }

            // Handle enchants format (e.g., PROTECTION:4,DURABILITY:3)
            // Handle lore format (newline-separated)
            parts.push(`${key}=${formattedValue}`);
        }

        return parts.length > 0 ? `{${parts.join(';')}}` : '';
    }

    /**
     * Export fancy drop attributes
     */
    exportFancyAttributes(attributes) {
        if (!attributes || Object.keys(attributes).length === 0) return '';

        const parts = [];
        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined || value === null || value === '') continue;

            // Handle boolean values (true → true, false → skip)
            if (typeof value === 'boolean') {
                if (value === true) {
                    parts.push(`${key}=${value}`);
                }
                continue;
            }

            // Handle string values
            let formattedValue = value;
            if (typeof value === 'string' && (value.includes(' ') || value.includes(';'))) {
                formattedValue = `"${value.replace(/"/g, '\\"')}"`;
            }

            parts.push(`${key}=${formattedValue}`);
        }

        return parts.length > 0 ? `{${parts.join(';')}}` : '';
    }

    /**
     * Export DropOptions section (only for FANCY mode)
     */
    exportDropOptions(dropOptions) {
        if (!dropOptions || dropOptions.DropMethod !== 'FANCY') return '';

        let yaml = `  DropOptions:\n`;
        yaml += `    DropMethod: FANCY\n`;

        // General options
        if (dropOptions.ShowDeathChatMessage !== undefined) {
            yaml += `    ShowDeathChatMessage: ${dropOptions.ShowDeathChatMessage}\n`;
        }
        if (dropOptions.ShowDeathHologram !== undefined) {
            yaml += `    ShowDeathHologram: ${dropOptions.ShowDeathHologram}\n`;
        }
        if (dropOptions.PerPlayerDrops !== undefined) {
            yaml += `    PerPlayerDrops: ${dropOptions.PerPlayerDrops}\n`;
        }
        if (dropOptions.ClientSideDrops !== undefined) {
            yaml += `    ClientSideDrops: ${dropOptions.ClientSideDrops}\n`;
        }
        if (dropOptions.Lootsplosion !== undefined) {
            yaml += `    Lootsplosion: ${dropOptions.Lootsplosion}\n`;
        }
        if (dropOptions.HologramItemNames !== undefined) {
            yaml += `    HologramItemNames: ${dropOptions.HologramItemNames}\n`;
        }

        // Visual defaults
        if (dropOptions.ItemGlowByDefault !== undefined) {
            yaml += `    ItemGlowByDefault: ${dropOptions.ItemGlowByDefault}\n`;
        }
        if (dropOptions.ItemBeamByDefault !== undefined) {
            yaml += `    ItemBeamByDefault: ${dropOptions.ItemBeamByDefault}\n`;
        }
        if (dropOptions.ItemVFXByDefault !== undefined) {
            yaml += `    ItemVFXByDefault: ${dropOptions.ItemVFXByDefault}\n`;
        }

        // ItemVFX settings - handle as nested object
        if (dropOptions.ItemVFX && typeof dropOptions.ItemVFX === 'object') {
            yaml += `    ItemVFX:\n`;
            if (dropOptions.ItemVFX.Material !== undefined) {
                yaml += `      Material: ${dropOptions.ItemVFX.Material}\n`;
            }
            if (dropOptions.ItemVFX.Model !== undefined) {
                yaml += `      Model: ${dropOptions.ItemVFX.Model}\n`;
            }
        }

        // Other options
        if (dropOptions.RequiredDamagePercent !== undefined) {
            yaml += `    RequiredDamagePercent: ${dropOptions.RequiredDamagePercent}\n`;
        }
        if (dropOptions.HologramTimeout !== undefined) {
            yaml += `    HologramTimeout: ${dropOptions.HologramTimeout}\n`;
        }

        // Messages - handle as arrays
        if (dropOptions.HologramMessage && Array.isArray(dropOptions.HologramMessage) && dropOptions.HologramMessage.length > 0) {
            yaml += `    HologramMessage:\n`;
            dropOptions.HologramMessage.forEach(line => {
                // Only add non-empty lines
                if (line !== undefined && line !== '') {
                    yaml += `    - '${this.escapeYamlString(line)}'\n`;
                }
            });
        }
        if (dropOptions.ChatMessage && Array.isArray(dropOptions.ChatMessage) && dropOptions.ChatMessage.length > 0) {
            yaml += `    ChatMessage:\n`;
            dropOptions.ChatMessage.forEach(line => {
                // Only add non-empty lines
                if (line !== undefined && line !== '') {
                    yaml += `    - '${this.escapeYamlString(line)}'\n`;
                }
            });
        }

        return yaml;
    }

    // === HELPER METHODS FOR TEMPLATE-AWARE EXPORT ===
    
    /**
     * Build Options section, comparing with template if present
     */
    buildOptionsSection(mob, templateMob) {
        const optionsMap = {};
        
        // Helper to check if option should be included (differs from template)
        const shouldInclude = (key, value, defaultValue = undefined) => {
            if (value === undefined || value === null) return false;
            if (value === defaultValue) return false;
            if (templateMob) {
                // Check if template has different value
                const templateValue = this.getNestedValue(templateMob, key);
                return this.valuesDiffer(value, templateValue);
            }
            return true;
        };
        
        // Movement & Combat stats
        if (shouldInclude('movementSpeed', mob.movementSpeed)) optionsMap.MovementSpeed = mob.movementSpeed;
        if (shouldInclude('followRange', mob.followRange)) optionsMap.FollowRange = mob.followRange;
        if (shouldInclude('knockbackResistance', mob.knockbackResistance)) optionsMap.KnockbackResistance = mob.knockbackResistance;
        if (shouldInclude('attackSpeed', mob.attackSpeed)) optionsMap.AttackSpeed = mob.attackSpeed;
        
        // Display & visibility options
        if (shouldInclude('alwaysShowName', mob.alwaysShowName) && mob.alwaysShowName) optionsMap.AlwaysShowName = true;
        if (shouldInclude('invisible', mob.invisible) && mob.invisible) optionsMap.Invisible = true;
        if (shouldInclude('glowing', mob.glowing) && mob.glowing) optionsMap.Glowing = true;
        if (shouldInclude('silent', mob.silent) && mob.silent) optionsMap.Silent = true;
        
        // Physics & behavior options
        if (shouldInclude('noGravity', mob.noGravity) && mob.noGravity) optionsMap.NoGravity = true;
        if (shouldInclude('noAI', mob.noAI) && mob.noAI) optionsMap.NoAI = true;
        if (shouldInclude('collidable', mob.collidable) && mob.collidable === false) optionsMap.Collidable = false;
        
        // Combat options
        if (shouldInclude('invincible', mob.invincible) && mob.invincible) optionsMap.Invincible = true;
        if (shouldInclude('preventOtherDrops', mob.preventOtherDrops) && mob.preventOtherDrops) optionsMap.PreventOtherDrops = true;
        if (shouldInclude('preventRandomEquipment', mob.preventRandomEquipment) && mob.preventRandomEquipment) optionsMap.PreventRandomEquipment = true;
        
        // Armor stand options
        if (shouldInclude('small', mob.small) && mob.small) optionsMap.Small = true;
        if (shouldInclude('hasArms', mob.hasArms) && mob.hasArms) optionsMap.HasArms = true;
        if (shouldInclude('hasBasePlate', mob.hasBasePlate) && mob.hasBasePlate === false) optionsMap.HasBasePlate = false;
        if (shouldInclude('marker', mob.marker) && mob.marker) optionsMap.Marker = true;
        
        // Armor stand pose options
        if (mob.pose) {
            if (shouldInclude('pose.head', mob.pose.head) && mob.pose.head) optionsMap.Head = mob.pose.head;
            if (shouldInclude('pose.body', mob.pose.body) && mob.pose.body) optionsMap.Body = mob.pose.body;
            if (shouldInclude('pose.leftArm', mob.pose.leftArm) && mob.pose.leftArm) optionsMap.LeftArm = mob.pose.leftArm;
            if (shouldInclude('pose.rightArm', mob.pose.rightArm) && mob.pose.rightArm) optionsMap.RightArm = mob.pose.rightArm;
            if (shouldInclude('pose.leftLeg', mob.pose.leftLeg) && mob.pose.leftLeg) optionsMap.LeftLeg = mob.pose.leftLeg;
            if (shouldInclude('pose.rightLeg', mob.pose.rightLeg) && mob.pose.rightLeg) optionsMap.RightLeg = mob.pose.rightLeg;
        }
        
        if (Object.keys(optionsMap).length === 0) return '';
        
        let yaml = `  Options:\n`;
        Object.entries(optionsMap).forEach(([key, value]) => {
            yaml += `    ${key}: ${value}\n`;
        });
        return yaml;
    }
    
    /**
     * Get a nested value from an object using a key
     */
    getNestedValue(obj, key) {
        if (!obj) return undefined;
        return obj[key];
    }
    
    /**
     * Export BossBar section
     */
    exportBossBarSection(bossBar) {
        if (!bossBar || !bossBar.enabled) return '';
        let yaml = `  BossBar:\n`;
        yaml += `    Enabled: true\n`;
        yaml += `    Title: '${bossBar.title || '[name]'}'\n`;
        yaml += `    Range: ${bossBar.range || 50}\n`;
        yaml += `    Color: ${bossBar.color || 'PURPLE'}\n`;
        yaml += `    Style: ${bossBar.style || 'SOLID'}\n`;
        if (bossBar.createFog) yaml += `    CreateFog: true\n`;
        if (bossBar.darkenSky) yaml += `    DarkenSky: true\n`;
        if (bossBar.playMusic) yaml += `    PlayMusic: true\n`;
        return yaml;
    }
    
    /**
     * Export Equipment section
     */
    exportEquipmentSection(equipment) {
        if (!equipment || Object.keys(equipment).length === 0) return '';
        let yaml = `  Equipment:\n`;
        Object.entries(equipment).forEach(([slot, item]) => {
            if (item && item.trim()) {
                yaml += `  - ${item} ${slot}\n`;
            }
        });
        return yaml;
    }
    
    /**
     * Export DamageModifiers section
     */
    exportDamageModifiersSection(damageModifiers) {
        if (!damageModifiers) return '';
        
        let yaml = '';
        if (Array.isArray(damageModifiers) && damageModifiers.length > 0) {
            yaml = `  DamageModifiers:\n`;
            damageModifiers.forEach(modifier => {
                if (typeof modifier === 'string') {
                    yaml += `  - ${modifier}\n`;
                }
            });
        } else if (typeof damageModifiers === 'object' && Object.keys(damageModifiers).length > 0) {
            yaml = `  DamageModifiers:\n`;
            Object.entries(damageModifiers).forEach(([type, value]) => {
                yaml += `  - ${type} ${value}\n`;
            });
        }
        return yaml;
    }
    
    /**
     * Export KillMessages section
     */
    exportKillMessagesSection(killMessages) {
        if (!killMessages || killMessages.length === 0) return '';
        let yaml = `  KillMessages:\n`;
        killMessages.forEach(message => {
            if (message && message.trim()) {
                yaml += `  - '${message}'\n`;
            }
        });
        return yaml;
    }
    
    /**
     * Export AIGoalSelectors section
     */
    exportAIGoalSelectorsSection(aiGoalSelectors) {
        if (!aiGoalSelectors || aiGoalSelectors.length === 0) return '';
        let yaml = `  AIGoalSelectors:\n`;
        aiGoalSelectors.forEach(goal => {
            if (typeof goal === 'string') {
                yaml += `  - ${goal}\n`;
            } else if (typeof goal === 'object' && goal !== null) {
                yaml += `  - ${goal.priority || 0} ${goal.name || 'unknown'}`;
                if (goal.params) yaml += ` ${goal.params}`;
                yaml += `\n`;
            }
        });
        return yaml;
    }
    
    /**
     * Export AITargetSelectors section
     */
    exportAITargetSelectorsSection(aiTargetSelectors) {
        if (!aiTargetSelectors || aiTargetSelectors.length === 0) return '';
        let yaml = `  AITargetSelectors:\n`;
        aiTargetSelectors.forEach(target => {
            if (typeof target === 'string') {
                yaml += `  - ${target}\n`;
            } else if (typeof target === 'object' && target !== null) {
                yaml += `  - ${target.priority || 0} ${target.name || 'unknown'}`;
                if (target.params) yaml += ` ${target.params}`;
                yaml += `\n`;
            }
        });
        return yaml;
    }
    
    /**
     * Export Modules section
     */
    exportModulesSection(modules) {
        if (!modules) return '';
        const threatTable = modules.threatTable || modules.ThreatTable;
        const immunityTable = modules.immunityTable || modules.ImmunityTable;
        if (!threatTable && !immunityTable) return '';
        
        let yaml = `  Modules:\n`;
        if (threatTable) yaml += `    ThreatTable: true\n`;
        if (immunityTable) yaml += `    ImmunityTable: true\n`;
        return yaml;
    }
    
    /**
     * Export LevelModifiers section
     */
    exportLevelModifiersSection(levelModifiers) {
        if (!levelModifiers || Object.keys(levelModifiers).length === 0) return '';
        const lm = levelModifiers;
        const hasValues = Object.values(lm).some(v => v && v !== 0);
        if (!hasValues) return '';
        
        let yaml = `  LevelModifiers:\n`;
        if (lm.health) yaml += `    Health: ${lm.health}\n`;
        if (lm.damage) yaml += `    Damage: ${lm.damage}\n`;
        if (lm.power) yaml += `    Power: ${lm.power}\n`;
        if (lm.armor) yaml += `    Armor: ${lm.armor}\n`;
        if (lm.knockbackResistance) yaml += `    KnockbackResistance: ${lm.knockbackResistance}\n`;
        if (lm.movementSpeed) yaml += `    MovementSpeed: ${lm.movementSpeed}\n`;
        return yaml;
    }
    
    /**
     * Export Skills section
     */
    exportSkillsSection(skills) {
        if (!skills || skills.length === 0) return '';
        let yaml = `  Skills:\n`;
        skills.forEach(skill => {
            if (typeof skill === 'string') {
                // Add dash prefix if not present
                const formattedSkill = skill.startsWith('- ') ? skill : `- ${skill}`;
                yaml += `  ${formattedSkill}\n`;
            } else if (typeof skill === 'object' && skill !== null) {
                yaml += `  - ${skill.name || 'unknown'} ${skill.trigger || '~onAttack'}`;
                if (skill.cooldown && skill.cooldown > 0) {
                    yaml += ` ${skill.cooldown}`;
                }
                yaml += `\n`;
            }
        });
        return yaml;
    }
    
    /**
     * Export Drops section
     */
    exportDropsSection(drops) {
        if (!drops || drops.length === 0) return '';
        let yaml = `  Drops:\n`;
        drops.forEach(drop => {
            yaml += `  - ${this.exportDrop(drop)}\n`;
        });
        return yaml;
    }
    
    /**
     * Export Totem section
     */
    exportTotemSection(totem) {
        if (!totem) return '';
        let yaml = `  Totem:\n`;
        
        // Head block (required)
        if (totem.Head || totem.head) {
            yaml += `    Head: ${totem.Head || totem.head}\n`;
        } else {
            yaml += `    Head: PLAYER_HEAD\n`; // Default
        }
        
        // Pattern (array of coordinates and blocks)
        if (totem.Pattern && Array.isArray(totem.Pattern) && totem.Pattern.length > 0) {
            yaml += `    Pattern:\n`;
            totem.Pattern.forEach(entry => {
                yaml += `    - ${entry}\n`;
            });
        }
        
        // Replacement blocks (optional)
        if (totem.Replacement && Array.isArray(totem.Replacement) && totem.Replacement.length > 0) {
            yaml += `    Replacement:\n`;
            totem.Replacement.forEach(entry => {
                yaml += `    - ${entry}\n`;
            });
        }
        
        return yaml;
    }
    
    /**
     * Export Trades section for villagers
     */
    exportTradesSection(trades) {
        if (!trades || Object.keys(trades).length === 0) return '';
        
        let yaml = `  Trades:\n`;
        
        Object.entries(trades).forEach(([key, trade]) => {
            yaml += `    ${key}:\n`;
            
            // Item1 (required)
            if (trade.Item1 || trade.item1) {
                yaml += `      Item1: ${trade.Item1 || trade.item1}\n`;
            }
            
            // Item2 (optional)
            if (trade.Item2 || trade.item2) {
                yaml += `      Item2: ${trade.Item2 || trade.item2}\n`;
            }
            
            // Result (required)
            if (trade.Result || trade.result) {
                yaml += `      Result: ${trade.Result || trade.result}\n`;
            }
            
            // MaxUses (optional, default is 10000)
            const maxUses = trade.MaxUses || trade.maxUses;
            if (maxUses && maxUses !== 10000) {
                yaml += `      MaxUses: ${maxUses}\n`;
            }
        });
        
        return yaml;
    }
    
    exportSkill(skill) {
        // NEW: Handle multi-skill structure (skill.skills object)
        if (skill.skills && typeof skill.skills === 'object') {
            let yaml = '';
            for (const [skillName, skillData] of Object.entries(skill.skills)) {
                // Skip null/undefined skill data
                if (!skillData) continue;
                
                yaml += `${skillName}:\n`;
                
                // CancelIfNoTargets (only if false, since true is default)
                if (skillData.cancelIfNoTargets === false) {
                    yaml += `  CancelIfNoTargets: false\n`;
                }
                
                // Cooldown
                if (skillData.cooldown) {
                    yaml += `  Cooldown: ${skillData.cooldown}\n`;
                }
                
                // OnCooldownSkill
                if (skillData.onCooldownSkill) {
                    yaml += `  OnCooldownSkill: ${skillData.onCooldownSkill}\n`;
                }
                
                // FailedConditionsSkill / OnFailSkill
                if (skillData.failedConditionsSkill) {
                    yaml += `  FailedConditionsSkill: ${skillData.failedConditionsSkill}\n`;
                }
                
                // Skill (async execute another skill)
                if (skillData.skill) {
                    yaml += `  Skill: ${skillData.skill}\n`;
                }
                
                // Conditions (check both PascalCase and lowercase)
                const conditions = skillData.Conditions || skillData.conditions;
                if (conditions && conditions.length > 0) {
                    yaml += this.exportConditions(conditions, 'Conditions', 2);
                }
                
                // TargetConditions
                const targetConditions = skillData.TargetConditions || skillData.targetConditions;
                if (targetConditions && targetConditions.length > 0) {
                    yaml += this.exportConditions(targetConditions, 'TargetConditions', 2);
                }
                
                // TriggerConditions
                const triggerConditions = skillData.TriggerConditions || skillData.triggerConditions;
                if (triggerConditions && triggerConditions.length > 0) {
                    yaml += this.exportConditions(triggerConditions, 'TriggerConditions', 2);
                }
                
                // Skills lines (the actual mechanics)
                if (skillData.lines && skillData.lines.length > 0) {
                    yaml += `  Skills:\n`;
                    skillData.lines.forEach(line => {
                        // Add dash prefix if not present (lines are stored without dash)
                        const formattedLine = line.startsWith('- ') ? line : `- ${line}`;
                        yaml += `  ${formattedLine}\n`;
                    });
                }
                
                yaml += '\n'; // Blank line between skills
            }
            return yaml;
        }
        
        // LEGACY/Standard: Single skill format
        let yaml = `${skill.name}:\n`;
        
        // CancelIfNoTargets (only if false, since true is default)
        if (skill.cancelIfNoTargets === false) {
            yaml += `  CancelIfNoTargets: false\n`;
        }
        
        // Cooldown
        if (skill.cooldown) {
            yaml += `  Cooldown: ${skill.cooldown}\n`;
        }
        
        // OnCooldownSkill
        if (skill.onCooldownSkill) {
            yaml += `  OnCooldownSkill: ${skill.onCooldownSkill}\n`;
        }
        
        // FailedConditionsSkill / OnFailSkill
        if (skill.failedConditionsSkill || skill.onFailSkill) {
            yaml += `  FailedConditionsSkill: ${skill.failedConditionsSkill || skill.onFailSkill}\n`;
        }
        
        // Skill (async execute another skill)
        if (skill.skill) {
            yaml += `  Skill: ${skill.skill}\n`;
        }
        
        // Conditions (handle both cases: lowercase and PascalCase)
        const conditions = skill.Conditions || skill.conditions;
        if (conditions && conditions.length > 0) {
            yaml += this.exportConditions(conditions, 'Conditions', 2);
        }
        
        // TargetConditions
        const targetConditions = skill.TargetConditions || skill.targetConditions;
        if (targetConditions && targetConditions.length > 0) {
            yaml += this.exportConditions(targetConditions, 'TargetConditions', 2);
        }
        
        // TriggerConditions
        const triggerConditions = skill.TriggerConditions || skill.triggerConditions;
        if (triggerConditions && triggerConditions.length > 0) {
            yaml += this.exportConditions(triggerConditions, 'TriggerConditions', 2);
        }
        
        // Skills array (new format with Skills capital S)
        if (skill.Skills && skill.Skills.length > 0) {
            yaml += `  Skills:\n`;
            skill.Skills.forEach(line => {
                // Ensure proper formatting
                const formattedLine = line.startsWith('- ') ? line : `- ${line}`;
                yaml += `  ${formattedLine}\n`;
            });
        }
        // Legacy: mechanics array
        else if (skill.mechanics && skill.mechanics.length > 0) {
            yaml += `  Skills:\n`;
            skill.mechanics.forEach(mechanic => {
                yaml += `  - ${mechanic.type}`;
                if (mechanic.params) {
                    const params = Object.entries(mechanic.params)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(';');
                    yaml += `{${params}}`;
                }
                yaml += `\n`;
            });
        }
        
        return yaml;
    }
    
    exportItem(item) {
        if (!item || !item.internalName) return '# Invalid item';

        let yaml = `${item.internalName}:\n`;
        
        // Required: Id (Material)
        if (item.Id) {
            yaml += `  Id: ${item.Id}\n`;
        }
        
        // Basic Properties
        if (item.Display) {
            yaml += `  Display: '${this.escapeYamlString(item.Display)}'\n`;
        }
        
        if (item.Amount && item.Amount !== 1) {
            yaml += `  Amount: ${item.Amount}\n`;
        }
        
        if (item.CustomModelData) {
            yaml += `  CustomModelData: ${item.CustomModelData}\n`;
        }
        
        if (item.Durability !== undefined && item.Durability !== '') {
            yaml += `  Durability: ${item.Durability}\n`;
        }
        
        if (item.MaxDurability) {
            yaml += `  MaxDurability: ${item.MaxDurability}\n`;
        }
        
        // Lore
        if (item.Lore && item.Lore.length > 0) {
            yaml += `  Lore:\n`;
            item.Lore.forEach(line => {
                yaml += `  - '${this.escapeYamlString(line)}'\n`;
            });
        }
        
        // Enchantments
        if (item.Enchantments && item.Enchantments.length > 0) {
            yaml += `  Enchantments:\n`;
            item.Enchantments.forEach(ench => {
                yaml += `  - ${ench}\n`;
            });
        }
        
        // Attributes (slot-based) - MythicMobs format: Type: 'Amount Operation'
        if (item.Attributes && Object.keys(item.Attributes).length > 0) {
            yaml += `  Attributes:\n`;
            Object.entries(item.Attributes).forEach(([slot, attrs]) => {
                // Handle both array format and object format
                if (Array.isArray(attrs) && attrs.length > 0) {
                    yaml += `    ${slot}:\n`;
                    attrs.forEach(attr => {
                        // Format: AttributeType: 'amount operation'
                        yaml += `      ${attr.type}: ${attr.amount} ${attr.operation}\n`;
                    });
                } else if (typeof attrs === 'object' && !Array.isArray(attrs)) {
                    // Object format (raw from import): { Armor: '-1to2 ADD', Health: '5 ADD' }
                    yaml += `    ${slot}:\n`;
                    Object.entries(attrs).forEach(([attrType, attrValue]) => {
                        yaml += `      ${attrType}: ${attrValue}\n`;
                    });
                }
            });
        }
        
        // Potion Effects
        if (item.PotionEffects && item.PotionEffects.length > 0) {
            yaml += `  PotionEffects:\n`;
            item.PotionEffects.forEach(effect => {
                yaml += `  - ${effect}\n`;
            });
        }
        
        // Options
        if (item.Options && Object.keys(item.Options).length > 0) {
            yaml += `  Options:\n`;
            Object.entries(item.Options).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (typeof value === 'boolean') {
                        yaml += `    ${key}: ${value}\n`;
                    } else if (typeof value === 'number') {
                        yaml += `    ${key}: ${value}\n`;
                    } else {
                        yaml += `    ${key}: '${this.escapeYamlString(value)}'\n`;
                    }
                }
            });
        }
        
        // Color (RGB)
        if (item.Color) {
            yaml += `  Color: ${item.Color}\n`;
        }
        
        // Banner Layers
        if (item.BannerLayers && item.BannerLayers.length > 0) {
            yaml += `  BannerLayers:\n`;
            item.BannerLayers.forEach(layer => {
                yaml += `  - ${layer}\n`;
            });
        }
        
        // Firework
        if (item.Firework && Object.keys(item.Firework).length > 0) {
            yaml += `  Firework:\n`;
            if (item.Firework.power !== undefined) {
                yaml += `    Power: ${item.Firework.power}\n`;
            }
            if (item.Firework.colors && item.Firework.colors.length > 0) {
                yaml += `    Colors:\n`;
                item.Firework.colors.forEach(color => {
                    yaml += `    - ${color}\n`;
                });
            }
            if (item.Firework.fadeColors && item.Firework.fadeColors.length > 0) {
                yaml += `    FadeColors:\n`;
                item.Firework.fadeColors.forEach(color => {
                    yaml += `    - ${color}\n`;
                });
            }
            if (item.Firework.trail) {
                yaml += `    Trail: true\n`;
            }
            if (item.Firework.flicker) {
                yaml += `    Flicker: true\n`;
            }
        }
        
        // Hide flags
        if (item.Hide && item.Hide.length > 0) {
            yaml += `  Hide:\n`;
            item.Hide.forEach(flag => {
                yaml += `  - ${flag}\n`;
            });
        }
        
        // NBT Tags
        if (item.NBT && Object.keys(item.NBT).length > 0) {
            yaml += `  NBT:\n`;
            Object.entries(item.NBT).forEach(([key, value]) => {
                yaml += `    ${key}: ${value}\n`;
            });
        }
        
        // Trim (1.20+)
        if (item.Trim && (item.Trim.material || item.Trim.pattern)) {
            yaml += `  Trim:\n`;
            if (item.Trim.material) {
                yaml += `    Material: ${item.Trim.material}\n`;
            }
            if (item.Trim.pattern) {
                yaml += `    Pattern: ${item.Trim.pattern}\n`;
            }
        }
        
        // Book
        if (item.Book && (item.Book.title || item.Book.author || (item.Book.pages && item.Book.pages.length > 0))) {
            yaml += `  Book:\n`;
            if (item.Book.title) {
                yaml += `    Title: '${this.escapeYamlString(item.Book.title)}'\n`;
            }
            if (item.Book.author) {
                yaml += `    Author: '${this.escapeYamlString(item.Book.author)}'\n`;
            }
            if (item.Book.pages && item.Book.pages.length > 0) {
                yaml += `    Pages:\n`;
                item.Book.pages.forEach(page => {
                    yaml += `    - '${this.escapeYamlString(page)}'\n`;
                });
            }
        }
        
        // Skills (Crucible integration)
        if (item.Skills && item.Skills.length > 0) {
            yaml += `  Skills:\n`;
            item.Skills.forEach(skill => {
                // Add dash prefix if not present
                const formattedSkill = skill.startsWith('- ') ? skill : `- ${skill}`;
                yaml += `  ${formattedSkill}\n`;
            });
        }
        
        return yaml;
    }

    /**
     * Export a droptable with configuration, conditions, and drops
     */
    exportDropTable(droptable) {
        if (!droptable || !droptable.name) return '# Invalid droptable';

        let yaml = `${droptable.name}:\n`;

        // Configuration options
        if (droptable.config) {
            if (droptable.config.TotalItems !== undefined && droptable.config.TotalItems !== '') {
                yaml += `  TotalItems: ${droptable.config.TotalItems}\n`;
            }
            if (droptable.config.MinItems !== undefined && droptable.config.MinItems !== '') {
                yaml += `  MinItems: ${droptable.config.MinItems}\n`;
            }
            if (droptable.config.MaxItems !== undefined && droptable.config.MaxItems !== '') {
                yaml += `  MaxItems: ${droptable.config.MaxItems}\n`;
            }
            if (droptable.config.BonusLevelItems !== undefined && droptable.config.BonusLevelItems !== '') {
                yaml += `  BonusLevelItems: ${droptable.config.BonusLevelItems}\n`;
            }
            if (droptable.config.BonusLuckItems !== undefined && droptable.config.BonusLuckItems !== '') {
                yaml += `  BonusLuckItems: ${droptable.config.BonusLuckItems}\n`;
            }
        }

        // Conditions (dropper conditions)
        if (droptable.conditions && droptable.conditions.length > 0) {
            // Check if conditions are objects from ConditionEditor or simple strings
            if (typeof droptable.conditions[0] === 'object' && droptable.conditions[0].condition) {
                yaml += this.exportConditions(droptable.conditions, 'Conditions', 2);
            } else {
                // Legacy format (simple strings)
                yaml += `  Conditions:\n`;
                droptable.conditions.forEach(condition => {
                    yaml += `  - ${condition}\n`;
                });
            }
        }

        // TriggerConditions (killer conditions)
        if (droptable.triggerConditions && droptable.triggerConditions.length > 0) {
            // Check if conditions are objects from ConditionEditor or simple strings
            if (typeof droptable.triggerConditions[0] === 'object' && droptable.triggerConditions[0].condition) {
                yaml += this.exportConditions(droptable.triggerConditions, 'TriggerConditions', 2);
            } else {
                // Legacy format (simple strings)
                yaml += `  TriggerConditions:\n`;
                droptable.triggerConditions.forEach(condition => {
                    yaml += `  - ${condition}\n`;
                });
            }
        }

        // Drops
        if (droptable.drops && droptable.drops.length > 0) {
            yaml += `  Drops:\n`;
            droptable.drops.forEach(drop => {
                // Equipment droptables have special format: ITEM SLOT amount chance
                if (droptable.tableType === 'equipment' && drop.slot) {
                    yaml += `  - ${this.exportDrop(drop)} ${drop.slot}\n`;
                } else {
                    yaml += `  - ${this.exportDrop(drop)}\n`;
                }
            });
        }

        return yaml;
    }
    
    /**
     * Export RandomSpawn configuration
     */
    exportRandomSpawn(spawn) {
        if (!spawn || !spawn.name) return '# Invalid randomspawn';
        
        let yaml = `${spawn.name}:\n`;
        
        // Action (required)
        yaml += `  Action: ${spawn.Action || 'ADD'}\n`;
        
        // Type vs Types (mutually exclusive)
        if (spawn.Types && Array.isArray(spawn.Types) && spawn.Types.length > 0) {
            yaml += `  Types:\n`;
            spawn.Types.forEach(type => {
                yaml += `  - ${type}\n`;
            });
        } else if (spawn.Type) {
            yaml += `  Type: ${spawn.Type}\n`;
        }
        
        // Level
        if (spawn.Level !== undefined && spawn.Level !== null) {
            yaml += `  Level: ${spawn.Level}\n`;
        }
        
        // Chance
        if (spawn.Chance !== undefined && spawn.Chance !== null) {
            yaml += `  Chance: ${spawn.Chance}\n`;
        }
        
        // Priority
        if (spawn.Priority !== undefined && spawn.Priority !== null) {
            yaml += `  Priority: ${spawn.Priority}\n`;
        }
        
        // UseWorldScaling
        if (spawn.UseWorldScaling) {
            yaml += `  UseWorldScaling: true\n`;
        }
        
        // Worlds
        if (spawn.Worlds && spawn.Worlds.length > 0) {
            yaml += `  Worlds:\n`;
            spawn.Worlds.forEach(world => {
                yaml += `  - ${world}\n`;
            });
        }
        
        // Biomes
        if (spawn.Biomes && spawn.Biomes.length > 0) {
            yaml += `  Biomes:\n`;
            spawn.Biomes.forEach(biome => {
                yaml += `  - ${biome}\n`;
            });
        }
        
        // Reason
        if (spawn.Reason && spawn.Reason !== 'NATURAL') {
            yaml += `  Reason: ${spawn.Reason}\n`;
        }
        
        // PositionType
        if (spawn.PositionType && spawn.PositionType !== 'LAND') {
            yaml += `  PositionType: ${spawn.PositionType}\n`;
        }
        
        // Cooldown
        if (spawn.Cooldown && spawn.Cooldown > 0) {
            yaml += `  Cooldown: ${spawn.Cooldown}\n`;
        }
        
        // Structures
        if (spawn.Structures && spawn.Structures.length > 0) {
            yaml += `  Structures:\n`;
            spawn.Structures.forEach(structure => {
                yaml += `  - ${structure}\n`;
            });
        }
        
        // Conditions
        if (spawn.Conditions && spawn.Conditions.length > 0) {
            yaml += this.exportConditions(spawn.Conditions, 'Conditions', 2);
        }
        
        return yaml;
    }
    
    /**
     * Export conditions array to YAML format
     * Handles conditions from ConditionEditor component
     * @param {Array} conditions - Array of condition objects from ConditionEditor
     * @param {String} sectionName - 'Conditions', 'TargetConditions', or 'TriggerConditions'
     * @param {Number} indent - Number of spaces for indentation
     * @returns {String} YAML formatted conditions
     */
    exportConditions(conditions, sectionName = 'Conditions', indent = 2) {
        if (!conditions || conditions.length === 0) return '';
        
        const indentStr = ' '.repeat(indent);
        let yaml = `${indentStr}${sectionName}:\n`;
        
        conditions.forEach(conditionData => {
            // Handle string format (most common from skill editor)
            if (typeof conditionData === 'string') {
                yaml += `${indentStr}- ${conditionData}\n`;
            }
            // Handle object with syntax property
            else if (conditionData.syntax) {
                yaml += `${indentStr}- ${conditionData.syntax}\n`;
            }
            // Fallback: generate syntax from condition data object
            else {
                const syntax = this.generateConditionSyntax(conditionData);
                yaml += `${indentStr}- ${syntax}\n`;
            }
        });
        
        return yaml;
    }
    
    /**
     * Generate condition syntax string from condition data
     * @param {Object} conditionData - Condition object with condition, attributes, action
     * @returns {String} Condition syntax string
     */
    generateConditionSyntax(conditionData) {
        if (!conditionData.condition) return '';
        
        let syntax = conditionData.condition.id;
        
        // Add attributes if present
        if (conditionData.attributes && Object.keys(conditionData.attributes).length > 0) {
            const attrPairs = [];
            
            Object.entries(conditionData.attributes).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    // Find attribute definition to use alias if available
                    const attrDef = conditionData.condition.attributes?.find(a => a.name === key);
                    const attrKey = (attrDef?.aliases && attrDef.aliases.length > 0) ? attrDef.aliases[0] : key;
                    attrPairs.push(`${attrKey}=${value}`);
                }
            });
            
            if (attrPairs.length > 0) {
                syntax += `{${attrPairs.join(';')}}`;
            }
        }
        
        // Add action (default is 'true' if not specified)
        const action = conditionData.action || 'true';
        syntax += ` ${action}`;
        
        return syntax;
    }
}

window.YAMLExporter = YAMLExporter;
