/**
 * DataValidator.js - Part 1
 * Validate parsed data against MythicMobs schemas
 */
class DataValidator {
    constructor() {
        this.validationResults = new Map();
        this.crossReferences = {
            skills: new Set(),
            items: new Set(),
            mobs: new Set(),
            droptables: new Set()
        };
        this.definedEntities = {
            skills: new Set(),
            items: new Set(),
            mobs: new Set(),
            droptables: new Set(),
            randomspawns: new Set()
        };
    }

    /**
     * Check if an entity exists in a set (case-insensitive)
     * MythicMobs references are case-insensitive
     */
    hasEntity(entitySet, name) {
        if (!name) return false;
        // First try exact match (faster)
        if (entitySet.has(name)) return true;
        // Then try case-insensitive
        const lowerName = name.toLowerCase();
        for (const entity of entitySet) {
            if (entity.toLowerCase() === lowerName) return true;
        }
        return false;
    }

    /**
     * Get a property value case-insensitively from an object
     * MythicMobs YAML is case-insensitive for keys
     */
    getProperty(obj, key) {
        if (!obj || typeof obj !== 'object') return undefined;
        
        // Try exact match first
        if (obj[key] !== undefined) return obj[key];
        
        // Try case-insensitive match
        const lowerKey = key.toLowerCase();
        for (const k of Object.keys(obj)) {
            if (k.toLowerCase() === lowerKey) {
                return obj[k];
            }
        }
        return undefined;
    }

    /**
     * Check if a property exists case-insensitively
     */
    hasProperty(obj, key) {
        return this.getProperty(obj, key) !== undefined;
    }

    /**
     * Validate all parsed data from a pack
     */
    async validatePack(parsedResults, progressCallback = null) {
        const results = {
            packName: parsedResults.packName,
            validationResults: [],
            summary: {
                totalEntries: 0,
                validEntries: 0,
                entriesWithWarnings: 0,
                entriesWithErrors: 0,
                criticalErrors: 0,
                warnings: 0,
                info: 0
            },
            crossReferences: {
                allReferences: { skills: [], items: [], mobs: [], droptables: [] },
                resolvedReferences: { skills: [], items: [], mobs: [], droptables: [] },
                missingReferences: { skills: [], items: [], mobs: [], droptables: [] }
            }
        };

        // Reset tracking
        this.crossReferences = {
            skills: new Set(),
            items: new Set(),
            mobs: new Set(),
            droptables: new Set()
        };
        this.definedEntities = {
            skills: new Set(),
            items: new Set(),
            mobs: new Set(),
            droptables: new Set(),
            randomspawns: new Set()
        };
        // Track files with parse errors (to provide better context for missing references)
        this.filesWithErrors = {
            skills: [],
            mobs: [],
            items: [],
            droptables: [],
            randomspawns: []
        };

        // First pass: collect all defined entities
        this.collectDefinedEntities(parsedResults);

        // Second pass: validate each file
        let processed = 0;
        const total = parsedResults.files.length;

        for (const file of parsedResults.files) {
            const fileValidation = await this.validateFile(file);
            results.validationResults.push(fileValidation);

            processed++;
            if (progressCallback) {
                progressCallback({
                    current: processed,
                    total: total,
                    currentFile: file.relativePath,
                    percentage: Math.round((processed / total) * 100)
                });
            }
        }

        // Calculate summary and cross-references
        this.calculateSummary(results);
        this.analyzeCrossReferences(results);

        return results;
    }

    /**
     * Collect all defined entity names from parsed results
     */
    collectDefinedEntities(parsedResults) {
        for (const file of parsedResults.files) {
            // Case-insensitive folder type matching
            const folderType = (file.folderType || '').toLowerCase();
            
            // Track files with parse errors for better context in missing reference warnings
            if (!file.success) {
                if (folderType === 'skills') {
                    this.filesWithErrors.skills.push(file.relativePath);
                } else if (folderType === 'mobs') {
                    this.filesWithErrors.mobs.push(file.relativePath);
                } else if (folderType === 'items') {
                    this.filesWithErrors.items.push(file.relativePath);
                } else if (folderType === 'droptables') {
                    this.filesWithErrors.droptables.push(file.relativePath);
                } else if (folderType === 'randomspawns') {
                    this.filesWithErrors.randomspawns.push(file.relativePath);
                }
                continue;
            }
            
            for (const entry of file.entries) {
                // Store names in a case-insensitive manner for lookups
                const entryName = entry.name;
                
                switch (folderType) {
                    case 'mobs':
                        this.definedEntities.mobs.add(entryName);
                        break;
                    case 'skills':
                        this.definedEntities.skills.add(entryName);
                        break;
                    case 'items':
                        this.definedEntities.items.add(entryName);
                        break;
                    case 'droptables':
                        this.definedEntities.droptables.add(entryName);
                        break;
                    case 'randomspawns':
                        this.definedEntities.randomspawns.add(entryName);
                        break;
                }
            }
        }
        
        // Debug: Log collected entities
        console.log('📋 Collected defined entities:', {
            skills: Array.from(this.definedEntities.skills).slice(0, 10),
            items: Array.from(this.definedEntities.items).slice(0, 10),
            mobs: Array.from(this.definedEntities.mobs).slice(0, 10),
            droptables: Array.from(this.definedEntities.droptables).slice(0, 10)
        });
    }

    /**
     * Validate a single file
     */
    async validateFile(file) {
        const result = {
            file: file.file,
            relativePath: file.relativePath,
            folderType: file.folderType,
            entries: [],
            fileIssues: [...file.errors, ...file.warnings]
        };

        if (!file.success) {
            return result;
        }

        for (const entry of file.entries) {
            const entryValidation = this.validateEntry(entry, file.folderType, file.relativePath);
            result.entries.push(entryValidation);
        }

        return result;
    }

    /**
     * Validate a single entry based on its type
     */
    validateEntry(entry, folderType, sourceFile) {
        const result = {
            name: entry.name,
            lineStart: entry.lineStart,
            lineEnd: entry.lineEnd,
            valid: true,
            issues: [],
            crossReferences: {
                skills: [],
                items: [],
                mobs: [],
                droptables: []
            }
        };

        // Case-insensitive folder type matching
        const normalizedFolderType = (folderType || '').toLowerCase();

        switch (normalizedFolderType) {
            case 'mobs':
                this.validateMob(entry, result, sourceFile);
                break;
            case 'skills':
                this.validateSkill(entry, result, sourceFile);
                break;
            case 'items':
                this.validateItem(entry, result, sourceFile);
                break;
            case 'droptables':
                this.validateDropTable(entry, result, sourceFile);
                break;
            case 'randomspawns':
                this.validateRandomSpawn(entry, result, sourceFile);
                break;
        }

        // Determine if valid based on issues
        result.valid = !result.issues.some(i => i.severity === 'critical');

        return result;
    }

    /**
     * Validate a mob entry
     */
    validateMob(entry, result, sourceFile) {
        const data = entry.data || {};

        // Required: MobType OR Type OR Template field (case-insensitive)
        // MythicMobs allows mobs to inherit MobType from a Template
        const mobTypeValue = this.getProperty(data, 'MobType');
        const typeValue = this.getProperty(data, 'Type');
        const templateValue = this.getProperty(data, 'Template');
        const entityType = mobTypeValue || typeValue;
        
        // If mob has Template, it inherits MobType from the template - this is valid
        if (!entityType && !templateValue) {
            result.issues.push({
                field: 'MobType',
                type: 'MISSING_REQUIRED_FIELD',
                severity: 'critical',
                message: 'Missing required field: MobType (or Type or Template)',
                suggestion: 'Add a MobType field (e.g., MobType: ZOMBIE) or use Template to inherit from another mob'
            });
        } else if (entityType) {
            // Validate entity type - must be a vanilla Minecraft entity
            const validType = this.isValidEntityType(entityType);
            if (!validType.valid) {
                result.issues.push({
                    field: mobTypeValue ? 'MobType' : 'Type',
                    value: entityType,
                    type: 'INVALID_ENTITY_TYPE',
                    severity: 'warning',
                    message: `Unknown entity type: ${entityType} (may be valid if using a mod)`,
                    suggestion: validType.suggestion
                });
            }
        } else if (templateValue) {
            // Mob uses Template - validate template reference
            // Template can be a single name or comma-separated list
            const templates = String(templateValue).split(',').map(t => t.trim()).filter(t => t);
            for (const template of templates) {
                result.crossReferences.mobs.push(template);
                this.crossReferences.mobs.add(template);
                
                // Check if template exists in defined mobs (case-insensitive)
                if (!this.hasEntity(this.definedEntities.mobs, template)) {
                    result.issues.push({
                        field: 'Template',
                        value: template,
                        type: 'MISSING_REFERENCE',
                        severity: 'warning',
                        message: `Referenced template mob '${template}' not found in pack`,
                        suggestion: 'Create this mob or check spelling'
                    });
                }
            }
        }

        // Validate Health (case-insensitive)
        const healthValue = this.getProperty(data, 'Health');
        if (healthValue !== undefined && healthValue !== null) {
            if (typeof healthValue !== 'number' || healthValue <= 0) {
                result.issues.push({
                    field: 'Health',
                    value: healthValue,
                    type: 'INVALID_VALUE',
                    severity: 'warning',
                    message: 'Health should be a positive number',
                    suggestion: 'Use a positive number for Health'
                });
            }
        }

        // Validate Damage (case-insensitive)
        const damageValue = this.getProperty(data, 'Damage');
        if (damageValue !== undefined && damageValue !== null) {
            if (typeof damageValue !== 'number' || damageValue < 0) {
                result.issues.push({
                    field: 'Damage',
                    value: damageValue,
                    type: 'INVALID_VALUE',
                    severity: 'warning',
                    message: 'Damage should be a non-negative number',
                    suggestion: 'Use a non-negative number for Damage'
                });
            }
        }

        // Validate Display name (case-insensitive)
        const displayValue = this.getProperty(data, 'Display');
        if (displayValue) {
            const colorCodeIssue = this.validateColorCodes(displayValue);
            if (colorCodeIssue) {
                result.issues.push({
                    field: 'Display',
                    value: displayValue,
                    type: 'INVALID_COLOR_CODE',
                    severity: 'info',
                    message: colorCodeIssue,
                    suggestion: 'Use valid color codes like &a, &b, &c, etc.'
                });
            }
        }

        // Validate Skills references (case-insensitive)
        const skillsValue = this.getProperty(data, 'Skills');
        if (skillsValue && Array.isArray(skillsValue)) {
            for (const skillLine of skillsValue) {
                const skillRefs = this.extractSkillReferences(skillLine);
                for (const ref of skillRefs) {
                    result.crossReferences.skills.push(ref);
                    this.crossReferences.skills.add(ref);
                    
                    // Case-insensitive skill lookup
                    if (!this.hasEntity(this.definedEntities.skills, ref)) {
                        // Check if there are skill files with parse errors
                        let suggestion = 'Create this skill or check spelling';
                        if (this.filesWithErrors.skills.length > 0) {
                            suggestion = `This skill may exist in a file with YAML errors: ${this.filesWithErrors.skills.join(', ')}. Fix those errors first.`;
                        }
                        result.issues.push({
                            field: 'Skills',
                            value: ref,
                            type: 'MISSING_REFERENCE',
                            severity: 'warning',
                            message: `Referenced skill '${ref}' not found`,
                            suggestion: suggestion
                        });
                    }
                }
            }
        }

        // Validate Equipment references (case-insensitive)
        // Equipment can be:
        // 1. Object format: { Head: ItemName, Chest: ItemName, ... }
        // 2. Array format: ["ItemName HEAD", "ItemName CHEST", ...]
        const equipmentValue = this.getProperty(data, 'Equipment');
        if (equipmentValue) {
            if (Array.isArray(equipmentValue)) {
                // Array format: "- ItemName SLOT" or "- ItemName:SLOT"
                for (const equipLine of equipmentValue) {
                    if (typeof equipLine === 'string') {
                        const line = equipLine.replace(/^-\s*/, '').trim();
                        // Format: "ItemName SLOT" or "ItemName:SLOT" - extract just the item name
                        // SLOT can be: HEAD, CHEST, LEGS, FEET, HAND, OFFHAND
                        const slotPattern = /^(.+?)(?:\s+|:)(HEAD|CHEST|LEGS|FEET|HAND|OFFHAND|MAINHAND)$/i;
                        const match = line.match(slotPattern);
                        const itemName = match ? match[1].trim() : line.split(/[\s:]/)[0];
                        
                        if (itemName && !itemName.includes(':')) {
                            // Check if it's a custom item reference (not vanilla)
                            if (!this.isVanillaItem(itemName)) {
                                result.crossReferences.items.push(itemName);
                                this.crossReferences.items.add(itemName);
                                
                                if (!this.hasEntity(this.definedEntities.items, itemName)) {
                                    result.issues.push({
                                        field: 'Equipment',
                                        value: itemName,
                                        type: 'MISSING_REFERENCE',
                                        severity: 'warning',
                                        message: `Referenced item '${itemName}' not found`,
                                        suggestion: 'Create this item or use a vanilla material'
                                    });
                                }
                            }
                        }
                    }
                }
            } else if (typeof equipmentValue === 'object') {
                // Object format: { Head: ItemName, ... }
                for (const [slot, item] of Object.entries(equipmentValue)) {
                    if (typeof item === 'string' && !item.includes(':')) {
                        if (!this.isVanillaItem(item)) {
                            result.crossReferences.items.push(item);
                            this.crossReferences.items.add(item);
                            
                            if (!this.hasEntity(this.definedEntities.items, item)) {
                                result.issues.push({
                                    field: `Equipment.${slot}`,
                                    value: item,
                                    type: 'MISSING_REFERENCE',
                                    severity: 'warning',
                                    message: `Referenced item '${item}' not found`,
                                    suggestion: 'Create this item or use a vanilla material'
                                });
                            }
                        }
                    }
                }
            }
        }

        // Validate Drops references (case-insensitive)
        // Drops can contain:
        // 1. Custom item drops: "ItemName Amount Chance" (e.g., "CreeperHead 1 0.05")
        // 2. DropTable references: "droptable{dt=TableName}" OR just "TableName" (direct reference)
        // 3. Special drops: "gold 100-200", "exp 50-100", etc.
        // 4. Vanilla items: "DIAMOND 1 0.5"
        const dropsValue = this.getProperty(data, 'Drops');
        if (dropsValue && Array.isArray(dropsValue)) {
            for (const drop of dropsValue) {
                // Check for explicit droptable{} syntax
                const dtRef = this.extractDropTableReference(drop);
                if (dtRef) {
                    result.crossReferences.droptables.push(dtRef);
                    this.crossReferences.droptables.add(dtRef);
                    
                    if (!this.hasEntity(this.definedEntities.droptables, dtRef)) {
                        result.issues.push({
                            field: 'Drops',
                            value: dtRef,
                            type: 'MISSING_REFERENCE',
                            severity: 'warning',
                            message: `Referenced droptable '${dtRef}' not found`,
                            suggestion: 'Create this droptable or check spelling'
                        });
                    }
                    continue; // Already handled as droptable
                }
                
                // Check for item/droptable reference (could be either in MythicMobs)
                // In MythicMobs, you can reference a droptable directly by name: "- TierIIDrops"
                const itemRef = this.extractItemReference(drop);
                if (itemRef) {
                    // Skip vanilla items
                    if (this.isVanillaItem(itemRef)) continue;
                    
                    // Check if it's a defined droptable (direct droptable reference)
                    if (this.hasEntity(this.definedEntities.droptables, itemRef)) {
                        result.crossReferences.droptables.push(itemRef);
                        this.crossReferences.droptables.add(itemRef);
                        continue; // Valid droptable reference
                    }
                    
                    // Check if it's a defined custom item
                    if (this.hasEntity(this.definedEntities.items, itemRef)) {
                        result.crossReferences.items.push(itemRef);
                        this.crossReferences.items.add(itemRef);
                        continue; // Valid item reference
                    }
                    
                    // Not found in items or droptables - flag as missing
                    // Could be either an item or droptable, show both options
                    result.crossReferences.items.push(itemRef);
                    this.crossReferences.items.add(itemRef);
                    
                    result.issues.push({
                        field: 'Drops',
                        value: itemRef,
                        type: 'MISSING_REFERENCE',
                        severity: 'warning',
                        message: `Referenced '${itemRef}' not found (could be item or droptable)`,
                        suggestion: 'Create this in Items or DropTables folder, or check spelling'
                    });
                }
            }
        }

        // Validate Options (case-insensitive)
        const optionsValue = this.getProperty(data, 'Options');
        if (optionsValue && typeof optionsValue === 'object') {
            for (const [option, value] of Object.entries(optionsValue)) {
                const optionValid = this.validateMobOption(option, value);
                if (!optionValid.valid) {
                    result.issues.push({
                        field: `Options.${option}`,
                        value: value,
                        type: 'INVALID_OPTION',
                        severity: 'warning',
                        message: optionValid.message,
                        suggestion: optionValid.suggestion
                    });
                }
            }
        }
    }

    /**
     * Validate a skill entry
     * Note: Skills do NOT have a Type field - they only have Skills, Conditions, TargetConditions, Cooldown
     */
    validateSkill(entry, result, sourceFile) {
        const data = entry.data || {};

        // Skills must have either Skills array or Conditions array (or both)
        const hasSkills = this.hasProperty(data, 'Skills');
        const hasConditions = this.hasProperty(data, 'Conditions');
        const hasTargetConditions = this.hasProperty(data, 'TargetConditions');
        
        if (!hasSkills && !hasConditions && !hasTargetConditions) {
            result.issues.push({
                field: 'Skills',
                type: 'MISSING_CONTENT',
                severity: 'info',
                message: 'Skill has no Skills, Conditions, or TargetConditions defined',
                suggestion: 'Add a Skills array with skill mechanics'
            });
        }

        // Validate Cooldown (case-insensitive)
        const cooldownValue = this.getProperty(data, 'Cooldown');
        if (cooldownValue !== undefined) {
            if (typeof cooldownValue !== 'number' || cooldownValue < 0) {
                result.issues.push({
                    field: 'Cooldown',
                    value: cooldownValue,
                    type: 'INVALID_VALUE',
                    severity: 'warning',
                    message: 'Cooldown should be a non-negative number',
                    suggestion: 'Use a non-negative number for Cooldown'
                });
            }
        }

        // Validate Skills (skill lines) - case-insensitive
        const skillsValue = this.getProperty(data, 'Skills');
        if (skillsValue && Array.isArray(skillsValue)) {
            for (let i = 0; i < skillsValue.length; i++) {
                const skillLine = skillsValue[i];
                const lineValidation = this.validateSkillLine(skillLine, i);
                
                if (lineValidation.issues.length > 0) {
                    result.issues.push(...lineValidation.issues.map(issue => ({
                        ...issue,
                        field: `Skills[${i}]`
                    })));
                }

                // Add cross-references and check if skill exists
                result.crossReferences.skills.push(...lineValidation.skillRefs);
                lineValidation.skillRefs.forEach(ref => {
                    this.crossReferences.skills.add(ref);
                    
                    // Check if referenced skill exists (case-insensitive)
                    if (!this.hasEntity(this.definedEntities.skills, ref)) {
                        // Check if there are skill files with parse errors
                        let suggestion = 'Create this skill or check spelling';
                        if (this.filesWithErrors.skills.length > 0) {
                            suggestion = `This skill may exist in a file with YAML errors: ${this.filesWithErrors.skills.join(', ')}. Fix those errors first.`;
                        }
                        result.issues.push({
                            field: `Skills[${i}]`,
                            value: ref,
                            type: 'MISSING_REFERENCE',
                            severity: 'warning',
                            message: `Referenced skill '${ref}' not found`,
                            suggestion: suggestion
                        });
                    }
                });
            }
        }

        // Validate Conditions (case-insensitive)
        const conditionsValue = this.getProperty(data, 'Conditions');
        if (conditionsValue && Array.isArray(conditionsValue)) {
            for (let i = 0; i < conditionsValue.length; i++) {
                const condition = conditionsValue[i];
                const condValidation = this.validateCondition(condition);
                if (!condValidation.valid) {
                    result.issues.push({
                        field: `Conditions[${i}]`,
                        value: condition,
                        type: 'INVALID_CONDITION',
                        severity: 'warning',
                        message: condValidation.message,
                        suggestion: condValidation.suggestion
                    });
                }
            }
        }

        // Validate TargetConditions (case-insensitive)
        const targetConditionsValue = this.getProperty(data, 'TargetConditions');
        if (targetConditionsValue && Array.isArray(targetConditionsValue)) {
            for (let i = 0; i < targetConditionsValue.length; i++) {
                const condition = targetConditionsValue[i];
                const condValidation = this.validateCondition(condition);
                if (!condValidation.valid) {
                    result.issues.push({
                        field: `TargetConditions[${i}]`,
                        value: condition,
                        type: 'INVALID_CONDITION',
                        severity: 'warning',
                        message: condValidation.message,
                        suggestion: condValidation.suggestion
                    });
                }
            }
        }
    }

    /**
     * Validate an item entry
     */
    validateItem(entry, result, sourceFile) {
        const data = entry.data || {};

        // Required: Id field (case-insensitive)
        const idValue = this.getProperty(data, 'Id');
        if (!idValue) {
            result.issues.push({
                field: 'Id',
                type: 'MISSING_REQUIRED_FIELD',
                severity: 'critical',
                message: 'Missing required field: Id (Material)',
                suggestion: 'Add an Id field (e.g., Id: DIAMOND_SWORD)'
            });
        } else {
            // Validate material
            if (!this.isValidMaterial(idValue)) {
                result.issues.push({
                    field: 'Id',
                    value: idValue,
                    type: 'INVALID_MATERIAL',
                    severity: 'warning',
                    message: `Unknown material: ${idValue}`,
                    suggestion: 'Check the material name is a valid Minecraft material'
                });
            }
        }

        // Validate Amount (case-insensitive)
        const amountValue = this.getProperty(data, 'Amount');
        if (amountValue !== undefined) {
            if (typeof amountValue !== 'number' || amountValue < 1 || amountValue > 64) {
                result.issues.push({
                    field: 'Amount',
                    value: amountValue,
                    type: 'INVALID_VALUE',
                    severity: 'warning',
                    message: 'Amount should be between 1 and 64',
                    suggestion: 'Use a number between 1 and 64'
                });
            }
        }

        // Validate Enchantments (case-insensitive)
        const enchantmentsValue = this.getProperty(data, 'Enchantments');
        if (enchantmentsValue && Array.isArray(enchantmentsValue)) {
            for (let i = 0; i < enchantmentsValue.length; i++) {
                const enchant = enchantmentsValue[i];
                const enchantValid = this.validateEnchantment(enchant);
                if (!enchantValid.valid) {
                    result.issues.push({
                        field: `Enchantments[${i}]`,
                        value: enchant,
                        type: 'INVALID_ENCHANTMENT',
                        severity: 'warning',
                        message: enchantValid.message,
                        suggestion: enchantValid.suggestion
                    });
                }
            }
        }

        // Validate Display name (case-insensitive)
        const displayValue = this.getProperty(data, 'Display');
        if (displayValue) {
            const colorCodeIssue = this.validateColorCodes(displayValue);
            if (colorCodeIssue) {
                result.issues.push({
                    field: 'Display',
                    value: displayValue,
                    type: 'INVALID_COLOR_CODE',
                    severity: 'info',
                    message: colorCodeIssue,
                    suggestion: 'Use valid color codes'
                });
            }
        }
    }

    /**
     * Validate a droptable entry
     * Note: DropTables do NOT have a Type field - they have Drops, TotalItems, MinItems, MaxItems, etc.
     */
    validateDropTable(entry, result, sourceFile) {
        const data = entry.data || {};

        // DropTables should have a Drops array
        const dropsValue = this.getProperty(data, 'Drops');
        if (!dropsValue || !Array.isArray(dropsValue) || dropsValue.length === 0) {
            result.issues.push({
                field: 'Drops',
                type: 'MISSING_CONTENT',
                severity: 'info',
                message: 'DropTable has no Drops defined',
                suggestion: 'Add a Drops array with drop entries'
            });
        }

        // Validate Drops (case-insensitive)
        if (dropsValue && Array.isArray(dropsValue)) {
            for (let i = 0; i < dropsValue.length; i++) {
                const drop = dropsValue[i];
                const dropValid = this.validateDrop(drop);
                
                if (!dropValid.valid) {
                    result.issues.push({
                        field: `Drops[${i}]`,
                        value: drop,
                        type: 'INVALID_DROP',
                        severity: 'warning',
                        message: dropValid.message,
                        suggestion: dropValid.suggestion
                    });
                }

                // Check item references
                if (dropValid.itemRef) {
                    result.crossReferences.items.push(dropValid.itemRef);
                    this.crossReferences.items.add(dropValid.itemRef);
                    
                    if (!this.hasEntity(this.definedEntities.items, dropValid.itemRef) && !this.isVanillaItem(dropValid.itemRef)) {
                        result.issues.push({
                            field: `Drops[${i}]`,
                            value: dropValid.itemRef,
                            type: 'MISSING_REFERENCE',
                            severity: 'warning',
                            message: `Referenced item '${dropValid.itemRef}' not found`,
                            suggestion: 'Create this item or check spelling'
                        });
                    }
                }
            }
        }

        // Validate Conditions (case-insensitive)
        const conditionsValue = this.getProperty(data, 'Conditions');
        if (conditionsValue && Array.isArray(conditionsValue)) {
            for (let i = 0; i < conditionsValue.length; i++) {
                const condition = conditionsValue[i];
                const condValid = this.validateCondition(condition);
                if (!condValid.valid) {
                    result.issues.push({
                        field: `Conditions[${i}]`,
                        value: condition,
                        type: 'INVALID_CONDITION',
                        severity: 'warning',
                        message: condValid.message,
                        suggestion: condValid.suggestion
                    });
                }
            }
        }
    }

    /**
     * Validate a randomspawn entry
     * Note: RandomSpawns use Type to reference MythicMob internal names (not vanilla entities)
     * Type can be a single mob name or comma-separated list: Type: MOB1,MOB2,MOB3
     */
    validateRandomSpawn(entry, result, sourceFile) {
        const data = entry.data || {};

        // RandomSpawns use MobType or Type field to reference MythicMob names (NOT vanilla entities)
        // MythicMobs accepts both field names
        const typeValue = this.getProperty(data, 'MobType') || this.getProperty(data, 'Type');
        if (typeValue) {
            // MobType can be comma-separated list of mob names
            const mobNames = String(typeValue).split(',').map(s => s.trim()).filter(s => s);
            
            for (const mobName of mobNames) {
                result.crossReferences.mobs.push(mobName);
                this.crossReferences.mobs.add(mobName);
                
                if (!this.hasEntity(this.definedEntities.mobs, mobName)) {
                    // Check if there are mob files with parse errors
                    let suggestion = 'Create this mob in Mobs folder or check spelling';
                    if (this.filesWithErrors.mobs.length > 0) {
                        suggestion = `This mob may exist in a file with YAML errors: ${this.filesWithErrors.mobs.join(', ')}. Fix those errors first.`;
                    }
                    result.issues.push({
                        field: 'MobType',
                        value: mobName,
                        type: 'MISSING_REFERENCE',
                        severity: 'warning',
                        message: `Referenced MythicMob '${mobName}' not found in pack`,
                        suggestion: suggestion
                    });
                }
            }
        } else {
            result.issues.push({
                field: 'MobType',
                type: 'MISSING_REQUIRED_FIELD',
                severity: 'critical',
                message: 'Missing required field: MobType (or Type)',
                suggestion: 'Add a MobType field with the MythicMob internal name (e.g., MobType: PINATA)'
            });
        }

        // Validate Chance (case-insensitive)
        const chanceValue = this.getProperty(data, 'Chance');
        if (chanceValue !== undefined) {
            if (typeof chanceValue !== 'number' || chanceValue < 0 || chanceValue > 1) {
                result.issues.push({
                    field: 'Chance',
                    value: chanceValue,
                    type: 'INVALID_VALUE',
                    severity: 'warning',
                    message: 'Chance should be between 0 and 1',
                    suggestion: 'Use a decimal between 0.0 and 1.0'
                });
            }
        }

        // Validate Action (case-insensitive)
        const actionValue = this.getProperty(data, 'Action');
        if (actionValue) {
            const validActions = ['ADD', 'REPLACE', 'DENY', 'SCALE'];
            if (!validActions.includes(String(actionValue).toUpperCase())) {
                result.issues.push({
                    field: 'Action',
                    value: actionValue,
                    type: 'INVALID_VALUE',
                    severity: 'warning',
                    message: `Invalid action: ${actionValue}`,
                    suggestion: `Use one of: ${validActions.join(', ')}`
                });
            }
        }

        // Validate Biomes (case-insensitive)
        const biomesValue = this.getProperty(data, 'Biomes');
        if (biomesValue && Array.isArray(biomesValue)) {
            for (let i = 0; i < biomesValue.length; i++) {
                const biome = biomesValue[i];
                if (!this.isValidBiome(biome)) {
                    result.issues.push({
                        field: `Biomes[${i}]`,
                        value: biome,
                        type: 'INVALID_BIOME',
                        severity: 'info',
                        message: `Unknown biome: ${biome}`,
                        suggestion: 'Check the biome name is valid'
                    });
                }
            }
        }
    }
}

window.DataValidator = DataValidator;
