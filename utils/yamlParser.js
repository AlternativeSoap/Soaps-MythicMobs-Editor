/**
 * YAML Parser - Parses MythicMobs YAML to JavaScript objects
 * Enhanced to support Phase 1 nested structures
 */
class YAMLParser {
    parse(yamlString, type) {
        try {
            const lines = yamlString.split('\n');
            const result = this.parseLines(lines);
            
            // Post-process to convert to proper mob structure
            if (type === 'mob') {
                return this.convertToMob(result);
            }
            
            return result;
        } catch (error) {
            console.error('YAML parsing error:', error);
            return null;
        }
    }
    
    parseLines(lines) {
        const stack = [{ indent: -2, obj: {} }];
        let currentArray = null;
        let arrayIndent = -1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim() || line.trim().startsWith('#')) continue;
            
            const indent = line.search(/\S/);
            const trimmed = line.trim();
            
            // Handle array items
            if (trimmed.startsWith('- ')) {
                const value = trimmed.substring(2).trim();
                
                // Determine if we're in an array context
                if (!currentArray || indent !== arrayIndent) {
                    // Pop stack to correct level
                    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                        stack.pop();
                    }
                    
                    const parent = stack[stack.length - 1].obj;
                    const lastKey = stack[stack.length - 1].lastKey;
                    
                    if (lastKey && !Array.isArray(parent[lastKey])) {
                        parent[lastKey] = [];
                    }
                    currentArray = parent[lastKey];
                    arrayIndent = indent;
                }
                
                if (currentArray) {
                    currentArray.push(value);
                }
                continue;
            }
            
            // Reset array context if indent changes
            if (indent < arrayIndent) {
                currentArray = null;
                arrayIndent = -1;
            }
            
            // Handle key-value pairs
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex === -1) continue;
            
            const key = trimmed.substring(0, colonIndex).trim();
            const valueStr = trimmed.substring(colonIndex + 1).trim();
            
            // Pop stack to correct indent level
            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }
            
            const current = stack[stack.length - 1].obj;
            
            // If no value, this is a nested object
            if (!valueStr) {
                current[key] = {};
                stack.push({ indent, obj: current[key], lastKey: key });
            } else {
                // Parse value
                current[key] = this.parseValue(valueStr);
                stack[stack.length - 1].lastKey = key;
            }
        }
        
        return stack[0].obj;
    }
    
    parseValue(str) {
        // Remove quotes
        if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
            return str.slice(1, -1);
        }
        
        // Parse boolean
        if (str === 'true') return true;
        if (str === 'false') return false;
        
        // Parse number
        if (!isNaN(str) && str !== '') {
            return parseFloat(str);
        }
        
        return str;
    }
    
    convertToMob(parsed) {
        const mob = {};
        
        // Get the mob name (first key)
        const mobName = Object.keys(parsed)[0];
        if (!mobName) return null;
        
        const mobData = parsed[mobName];
        mob.name = mobName;
        
        // Direct fields
        if (mobData.Type) mob.type = mobData.Type.toUpperCase();
        if (mobData.Display) mob.display = mobData.Display;
        if (mobData.Health !== undefined) mob.health = mobData.Health;
        if (mobData.Damage !== undefined) mob.damage = mobData.Damage;
        if (mobData.Armor !== undefined) mob.armor = mobData.Armor;
        if (mobData.Despawn !== undefined) mob.despawn = String(mobData.Despawn);
        
        // Phase 1: Faction & Template
        if (mobData.Faction) mob.faction = mobData.Faction;
        if (mobData.Template) mob.template = mobData.Template;
        
        // Phase 1: BossBar
        if (mobData.BossBar && typeof mobData.BossBar === 'object') {
            mob.bossBar = {
                enabled: mobData.BossBar.Enabled || false,
                title: mobData.BossBar.Title || '[name]',
                range: mobData.BossBar.Range || 50,
                color: mobData.BossBar.Color || 'PURPLE',
                style: mobData.BossBar.Style || 'SOLID',
                createFog: mobData.BossBar.CreateFog || false,
                darkenSky: mobData.BossBar.DarkenSky || false,
                playMusic: mobData.BossBar.PlayMusic || false
            };
        }
        
        // Phase 1: Equipment
        if (mobData.Equipment && Array.isArray(mobData.Equipment)) {
            mob.equipment = {};
            mobData.Equipment.forEach(line => {
                // Parse: "ITEM_NAME SLOT" or "ITEM_NAME{attrs} SLOT"
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    const slot = parts[parts.length - 1];
                    const item = parts.slice(0, -1).join(' ');
                    mob.equipment[slot] = item;
                }
            });
        }
        
        // Phase 1: DamageModifiers
        if (mobData.DamageModifiers && typeof mobData.DamageModifiers === 'object') {
            mob.damageModifiers = mobData.DamageModifiers;
        }
        
        // Phase 1: KillMessages
        if (mobData.KillMessages && Array.isArray(mobData.KillMessages)) {
            mob.killMessages = mobData.KillMessages;
        }
        
        // Phase 2: AIGoalSelectors
        if (mobData.AIGoalSelectors && Array.isArray(mobData.AIGoalSelectors)) {
            mob.aiGoalSelectors = mobData.AIGoalSelectors.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    priority: parseInt(parts[0]) || 0,
                    name: parts[1],
                    params: parts.slice(2).join(' ') || undefined
                };
            });
        }
        
        // Phase 2: AITargetSelectors
        if (mobData.AITargetSelectors && Array.isArray(mobData.AITargetSelectors)) {
            mob.aiTargetSelectors = mobData.AITargetSelectors.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    priority: parseInt(parts[0]) || 0,
                    name: parts[1],
                    params: parts.slice(2).join(' ') || undefined
                };
            });
        }
        
        // Phase 2: Modules
        if (mobData.Modules && typeof mobData.Modules === 'object') {
            mob.modules = {
                threatTable: mobData.Modules.ThreatTable || false,
                immunityTable: mobData.Modules.ImmunityTable || false
            };
        }
        
        // Phase 3: Level Modifiers
        if (mobData.LevelModifiers && typeof mobData.LevelModifiers === 'object') {
            mob.levelModifiers = {
                health: parseFloat(mobData.LevelModifiers.Health) || 0,
                damage: parseFloat(mobData.LevelModifiers.Damage) || 0,
                power: parseFloat(mobData.LevelModifiers.Power) || 0,
                armor: parseFloat(mobData.LevelModifiers.Armor) || 0,
                knockbackResistance: parseFloat(mobData.LevelModifiers.KnockbackResistance) || 0,
                movementSpeed: parseFloat(mobData.LevelModifiers.MovementSpeed) || 0
            };
        }
        
        // Options
        if (mobData.Options && typeof mobData.Options === 'object') {
            Object.entries(mobData.Options).forEach(([key, value]) => {
                const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
                mob[lowerKey] = value;
            });
        }
        
        // DisplayOptions
        if (mobData.DisplayOptions && typeof mobData.DisplayOptions === 'object') {
            Object.entries(mobData.DisplayOptions).forEach(([key, value]) => {
                const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
                mob[lowerKey] = value;
            });
        }
        
        // Phase 4: Skills
        if (mobData.Skills && Array.isArray(mobData.Skills)) {
            mob.skills = mobData.Skills.map(skill => {
                const parts = skill.trim().split(/\s+/);
                return {
                    name: parts[0],
                    trigger: parts[1] || '~onAttack',
                    cooldown: parts[2] ? parseFloat(parts[2]) : 0,
                    mechanics: [],
                    conditions: []
                };
            });
        }
        
        // Phase 4: Drops
        if (mobData.Drops && Array.isArray(mobData.Drops)) {
            mob.drops = mobData.Drops.map(drop => this.parseDrop(drop));
        }

        // Phase 4.5: DropOptions
        if (mobData.DropOptions && typeof mobData.DropOptions === 'object') {
            mob.dropOptions = this.parseDropOptions(mobData.DropOptions);
        }
        
        return mob;
    }

    /**
     * Parse a single drop line with all attributes
     */
    parseDrop(dropLine) {
        if (!dropLine || typeof dropLine !== 'string') {
            return { type: 'nothing', amount: '1', chance: '1.0' };
        }

        const drop = {
            type: 'item',
            attributes: {},
            inlineAttributes: {},
            fancyAttributes: {}
        };

        // Extract curly brace attributes first (could be multiple sets)
        let mainPart = dropLine.trim();
        const attributeMatches = [];
        let match;
        const attrRegex = /{([^}]+)}/g;
        
        while ((match = attrRegex.exec(dropLine)) !== null) {
            attributeMatches.push({
                full: match[0],
                content: match[1],
                index: match.index
            });
        }

        // Remove all attribute blocks to get the base line
        attributeMatches.reverse().forEach(m => {
            mainPart = mainPart.substring(0, m.index) + mainPart.substring(m.index + m.full.length);
        });

        // Parse the base parts (item/type amount chance)
        const parts = mainPart.trim().split(/\s+/);
        const baseName = parts[0];
        const amount = parts[1] || '1';
        const chance = parts[2] || '1.0';

        // Determine drop type
        if (baseName === 'exp') {
            drop.type = 'exp';
            drop.amount = amount;
            drop.chance = chance;
        } else if (baseName === 'mythicmob') {
            drop.type = 'mythicmob';
            drop.amount = amount;
            drop.chance = chance;
            // Parse attributes
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'mcmmo-exp') {
            drop.type = 'mcmmo-exp';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'money') {
            drop.type = 'money';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'cmd') {
            drop.type = 'command';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'mmoitems') {
            drop.type = 'mmoitems';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'itemvariable') {
            drop.type = 'itemvariable';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'nothing') {
            drop.type = 'nothing';
            drop.amount = amount;
            drop.chance = chance;
        } else if (baseName.includes(':')) {
            // Vanilla loot table (minecraft:table_name)
            drop.type = 'vanillaLootTable';
            drop.table = baseName;
            drop.amount = amount;
            drop.chance = chance;
        } else {
            // Item or MythicItem
            // Check if it's uppercase (likely vanilla item) or has attributes
            const isVanillaItem = baseName === baseName.toUpperCase() || attributeMatches.length > 0;
            
            if (isVanillaItem && attributeMatches.length > 0) {
                // Vanilla item with inline attributes
                drop.type = 'item';
                drop.item = baseName;
                drop.amount = amount;
                drop.chance = chance;
                
                // Parse attributes - could be inline (display, enchants) or fancy (itemglow, etc.)
                attributeMatches.forEach(attrMatch => {
                    const attrs = this.parseAttributes(attrMatch.content);
                    // Categorize attributes
                    this.categorizeAttributes(attrs, drop);
                });
            } else {
                // MythicItem
                drop.type = 'mythicitem';
                drop.item = baseName;
                drop.amount = amount;
                drop.chance = chance;
                
                // Parse fancy attributes for mythicitem
                if (attributeMatches.length > 0) {
                    attributeMatches.forEach(attrMatch => {
                        const attrs = this.parseAttributes(attrMatch.content);
                        this.categorizeAttributes(attrs, drop);
                    });
                }
            }
        }

        return drop;
    }

    /**
     * Parse attributes from curly brace content {key=value;key2=value2}
     */
    parseAttributes(attrString) {
        const attributes = {};
        if (!attrString) return attributes;

        // Split by semicolon, but respect quotes
        const parts = [];
        let current = '';
        let inQuotes = false;
        let escaping = false;

        for (let i = 0; i < attrString.length; i++) {
            const char = attrString[i];
            
            if (escaping) {
                current += char;
                escaping = false;
                continue;
            }

            if (char === '\\\\') {
                escaping = true;
                continue;
            }

            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === ';' && !inQuotes) {
                if (current.trim()) parts.push(current.trim());
                current = '';
                continue;
            }

            current += char;
        }
        if (current.trim()) parts.push(current.trim());

        // Parse each key=value pair
        parts.forEach(part => {
            const eqIndex = part.indexOf('=');
            if (eqIndex > 0) {
                const key = part.substring(0, eqIndex).trim();
                let value = part.substring(eqIndex + 1).trim();
                
                // Remove quotes from value if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }

                // Convert boolean strings
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                // Convert numbers
                else if (!isNaN(value) && value !== '') value = parseFloat(value);

                attributes[key] = value;
            }
        });

        return attributes;
    }

    /**
     * Categorize attributes into inline, fancy, or type-specific
     */
    categorizeAttributes(attrs, drop) {
        const inlineAttrKeys = ['name', 'lore', 'color', 'CustomModelData', 'enchants', 
                                'skullTexture', 'skullOwner', 'hideflags', 'unbreakable',
                                'potioneffects', 'potioncolor', 'nbt'];
        const fancyAttrKeys = ['lootsplosion', 'hologramname', 'itemglow', 'itemglowcolor',
                               'itembeam', 'itembeamcolor', 'itemvfx', 'vfxmaterial',
                               'vfxdata', 'vfxmodel', 'vfxcolor', 'clientsidedrops', 'fortune',
                               'hn', 'ls']; // Shorthand versions

        for (const [key, value] of Object.entries(attrs)) {
            if (inlineAttrKeys.includes(key)) {
                drop.inlineAttributes[key] = value;
            } else if (fancyAttrKeys.includes(key)) {
                // Convert shorthand
                if (key === 'hn') drop.fancyAttributes['hologramname'] = value;
                else if (key === 'ls') drop.fancyAttributes['lootsplosion'] = value;
                else drop.fancyAttributes[key] = value;
            } else {
                // Type-specific attributes (like mythicmob type, velocity, etc.)
                drop.attributes[key] = value;
            }
        }
    }

    /**
     * Parse DropOptions section
     */
    parseDropOptions(dropOptionsData) {
        const dropOptions = {
            DropMethod: dropOptionsData.DropMethod || 'VANILLA'
        };

        // General options
        if (dropOptionsData.ShowDeathChatMessage !== undefined) {
            dropOptions.ShowDeathChatMessage = dropOptionsData.ShowDeathChatMessage;
        }
        if (dropOptionsData.ShowDeathHologram !== undefined) {
            dropOptions.ShowDeathHologram = dropOptionsData.ShowDeathHologram;
        }
        if (dropOptionsData.PerPlayerDrops !== undefined) {
            dropOptions.PerPlayerDrops = dropOptionsData.PerPlayerDrops;
        }
        if (dropOptionsData.ClientSideDrops !== undefined) {
            dropOptions.ClientSideDrops = dropOptionsData.ClientSideDrops;
        }
        if (dropOptionsData.Lootsplosion !== undefined) {
            dropOptions.Lootsplosion = dropOptionsData.Lootsplosion;
        }
        if (dropOptionsData.HologramItemNames !== undefined) {
            dropOptions.HologramItemNames = dropOptionsData.HologramItemNames;
        }

        // Visual defaults
        if (dropOptionsData.ItemGlowByDefault !== undefined) {
            dropOptions.ItemGlowByDefault = dropOptionsData.ItemGlowByDefault;
        }
        if (dropOptionsData.ItemBeamByDefault !== undefined) {
            dropOptions.ItemBeamByDefault = dropOptionsData.ItemBeamByDefault;
        }
        if (dropOptionsData.ItemVFXByDefault !== undefined) {
            dropOptions.ItemVFXByDefault = dropOptionsData.ItemVFXByDefault;
        }

        // ItemVFX settings - handle as nested object
        if (dropOptionsData.ItemVFX && typeof dropOptionsData.ItemVFX === 'object') {
            dropOptions.ItemVFX = {
                Material: dropOptionsData.ItemVFX.Material,
                Model: dropOptionsData.ItemVFX.Model
            };
        }

        // Other options
        if (dropOptionsData.RequiredDamagePercent !== undefined) {
            dropOptions.RequiredDamagePercent = dropOptionsData.RequiredDamagePercent;
        }
        if (dropOptionsData.HologramTimeout !== undefined) {
            dropOptions.HologramTimeout = dropOptionsData.HologramTimeout;
        }

        // Messages - handle as arrays
        if (dropOptionsData.HologramMessage) {
            if (Array.isArray(dropOptionsData.HologramMessage)) {
                dropOptions.HologramMessage = dropOptionsData.HologramMessage;
            } else if (typeof dropOptionsData.HologramMessage === 'string') {
                // If it's a single string, convert to array
                dropOptions.HologramMessage = [dropOptionsData.HologramMessage];
            }
        }
        if (dropOptionsData.ChatMessage) {
            if (Array.isArray(dropOptionsData.ChatMessage)) {
                dropOptions.ChatMessage = dropOptionsData.ChatMessage;
            } else if (typeof dropOptionsData.ChatMessage === 'string') {
                // If it's a single string, convert to array
                dropOptions.ChatMessage = [dropOptionsData.ChatMessage];
            }
        }

        return dropOptions;
    }

    /**
     * Parse a droptable
     */
    parseDropTable(droptableData, name) {
        const droptable = {
            name: name,
            tableType: 'normal',
            config: {},
            conditions: [],
            triggerConditions: [],
            drops: []
        };

        // Configuration
        if (droptableData.TotalItems !== undefined) {
            droptable.config.TotalItems = droptableData.TotalItems;
        }
        if (droptableData.MinItems !== undefined) {
            droptable.config.MinItems = droptableData.MinItems;
        }
        if (droptableData.MaxItems !== undefined) {
            droptable.config.MaxItems = droptableData.MaxItems;
        }
        if (droptableData.BonusLevelItems !== undefined) {
            droptable.config.BonusLevelItems = droptableData.BonusLevelItems;
        }
        if (droptableData.BonusLuckItems !== undefined) {
            droptable.config.BonusLuckItems = droptableData.BonusLuckItems;
        }

        // Conditions
        if (droptableData.Conditions && Array.isArray(droptableData.Conditions)) {
            droptable.conditions = this.parseConditions(droptableData.Conditions);
        }

        // TriggerConditions
        if (droptableData.TriggerConditions && Array.isArray(droptableData.TriggerConditions)) {
            droptable.triggerConditions = this.parseConditions(droptableData.TriggerConditions);
        }

        // Drops
        if (droptableData.Drops && Array.isArray(droptableData.Drops)) {
            droptable.drops = droptableData.Drops.map(drop => {
                const parsedDrop = this.parseDrop(drop);
                
                // Check if this is equipment droptable (has slot in drop line)
                const parts = drop.trim().split(/\s+/);
                const lastPart = parts[parts.length - 1];
                if (['HEAD', 'CHEST', 'LEGS', 'FEET', 'HAND', 'OFFHAND'].includes(lastPart)) {
                    parsedDrop.slot = lastPart;
                    droptable.tableType = 'equipment';
                }
                
                return parsedDrop;
            });
        }

        return droptable;
    }
    
    /**
     * Parse condition strings from YAML into ConditionEditor format
     * @param {Array} conditionStrings - Array of condition strings from YAML
     * @returns {Array} Array of condition objects for ConditionEditor
     */
    parseConditions(conditionStrings) {
        if (!conditionStrings || !Array.isArray(conditionStrings)) return [];
        if (!window.ConditionHelpers) {
            // Fallback: return as simple strings if ConditionHelpers not available
            return conditionStrings;
        }
        
        return conditionStrings.map(conditionStr => {
            try {
                // Try to parse using ConditionHelpers
                const parsed = window.ConditionHelpers.parseCondition(conditionStr);
                
                if (parsed && parsed.conditionId) {
                    // Find the condition definition
                    const condition = window.ConditionHelpers.findCondition(parsed.conditionId);
                    
                    if (condition) {
                        return {
                            condition: condition,
                            attributes: parsed.attributes || {},
                            action: parsed.action || 'true',
                            syntax: conditionStr
                        };
                    }
                }
                
                // Fallback: keep as string if can't parse
                return conditionStr;
            } catch (error) {
                console.warn('Failed to parse condition:', conditionStr, error);
                return conditionStr;
            }
        });
    }

    /**
     * Parse item data from YAML object to item structure
     */
    parseItem(itemData, name) {
        if (!itemData) return null;

        const item = {
            internalName: name,
            Id: itemData.Id || itemData.Material || 'STONE',
            Display: itemData.Display || '',
            Amount: itemData.Amount || 1,
            Lore: [],
            Enchantments: [],
            Attributes: {},
            PotionEffects: [],
            Options: {},
            Hide: [],
            NBT: {},
            BannerLayers: [],
            Firework: {},
            Trim: {},
            Book: {},
            Skills: []
        };

        // Parse Lore
        if (itemData.Lore && Array.isArray(itemData.Lore)) {
            item.Lore = itemData.Lore.map(line => String(line));
        }

        // Parse Enchantments
        if (itemData.Enchantments) {
            if (Array.isArray(itemData.Enchantments)) {
                item.Enchantments = itemData.Enchantments.map(ench => {
                    const enchStr = String(ench);
                    // Normalize legacy enchantment names
                    if (window.EnchantmentData?.normalizeName) {
                        // Split enchantment into name and level
                        const parts = enchStr.includes(':') ? enchStr.split(':') : enchStr.split(' ');
                        const enchName = parts[0].trim();
                        const enchLevel = parts.slice(1).join(' ').trim() || '1';
                        
                        // Normalize the name
                        const normalizedName = window.EnchantmentData.normalizeName(enchName);
                        
                        return `${normalizedName} ${enchLevel}`;
                    }
                    return enchStr;
                });
            } else if (typeof itemData.Enchantments === 'object') {
                // Handle object format: { DURABILITY: 1, PROTECTION: 3 }
                item.Enchantments = Object.entries(itemData.Enchantments).map(([type, level]) => {
                    const normalizedName = window.EnchantmentData?.normalizeName ? 
                        window.EnchantmentData.normalizeName(type) : type.toUpperCase();
                    return `${normalizedName} ${level}`;
                });
            } else {
                // Single enchantment as string
                const enchStr = String(itemData.Enchantments);
                const parts = enchStr.split(' ');
                const enchName = parts[0];
                const enchLevel = parts.slice(1).join(' ') || '1';
                const normalizedName = window.EnchantmentData?.normalizeName ? 
                    window.EnchantmentData.normalizeName(enchName) : enchName.toUpperCase();
                item.Enchantments = [`${normalizedName} ${enchLevel}`];
            }
        }

        // Parse Attributes (slot-based)
        if (itemData.Attributes && typeof itemData.Attributes === 'object') {
            Object.entries(itemData.Attributes).forEach(([slot, attrs]) => {
                if (Array.isArray(attrs)) {
                    item.Attributes[slot] = attrs.map(attr => {
                        const parts = String(attr).split(' ');
                        return {
                            type: parts[0] || '',
                            amount: parseFloat(parts[1]) || 0,
                            operation: parts[2] || 'ADD'
                        };
                    });
                }
            });
        }

        // Parse Potion Effects
        if (itemData.PotionEffects && Array.isArray(itemData.PotionEffects)) {
            item.PotionEffects = itemData.PotionEffects.map(effect => String(effect));
        }

        // Parse Options
        if (itemData.Options && typeof itemData.Options === 'object') {
            item.Options = { ...itemData.Options };
        }

        // Parse simple properties
        if (itemData.CustomModelData !== undefined) {
            item.CustomModelData = parseInt(itemData.CustomModelData);
        }

        if (itemData.Durability !== undefined) {
            item.Durability = parseInt(itemData.Durability);
        }

        if (itemData.MaxDurability !== undefined) {
            item.MaxDurability = parseInt(itemData.MaxDurability);
        }

        if (itemData.Color) {
            item.Color = String(itemData.Color);
        }

        // Parse Banner Layers
        if (itemData.BannerLayers && Array.isArray(itemData.BannerLayers)) {
            item.BannerLayers = itemData.BannerLayers.map(layer => String(layer));
        }

        // Parse Firework
        if (itemData.Firework && typeof itemData.Firework === 'object') {
            item.Firework = {
                power: itemData.Firework.Power || itemData.Firework.power || 1,
                colors: Array.isArray(itemData.Firework.Colors) ? itemData.Firework.Colors.map(c => String(c)) : 
                        Array.isArray(itemData.Firework.colors) ? itemData.Firework.colors.map(c => String(c)) : [],
                fadeColors: Array.isArray(itemData.Firework.FadeColors) ? itemData.Firework.FadeColors.map(c => String(c)) : 
                           Array.isArray(itemData.Firework.fadeColors) ? itemData.Firework.fadeColors.map(c => String(c)) : [],
                trail: itemData.Firework.Trail || itemData.Firework.trail || false,
                flicker: itemData.Firework.Flicker || itemData.Firework.flicker || false
            };
        }

        // Parse Hide flags
        if (itemData.Hide && Array.isArray(itemData.Hide)) {
            item.Hide = itemData.Hide.map(flag => String(flag));
        }

        // Parse NBT
        if (itemData.NBT && typeof itemData.NBT === 'object') {
            item.NBT = { ...itemData.NBT };
        }

        // Parse Trim
        if (itemData.Trim && typeof itemData.Trim === 'object') {
            item.Trim = {
                material: itemData.Trim.Material || itemData.Trim.material || '',
                pattern: itemData.Trim.Pattern || itemData.Trim.pattern || ''
            };
        }

        // Parse Book
        if (itemData.Book && typeof itemData.Book === 'object') {
            item.Book = {
                title: itemData.Book.Title || itemData.Book.title || '',
                author: itemData.Book.Author || itemData.Book.author || '',
                pages: Array.isArray(itemData.Book.Pages) ? itemData.Book.Pages.map(p => String(p)) :
                       Array.isArray(itemData.Book.pages) ? itemData.Book.pages.map(p => String(p)) : []
            };
        }

        // Parse Skills (Crucible)
        if (itemData.Skills && Array.isArray(itemData.Skills)) {
            item.Skills = itemData.Skills.map(skill => String(skill));
        }

        return item;
    }
}

window.YAMLParser = YAMLParser;
