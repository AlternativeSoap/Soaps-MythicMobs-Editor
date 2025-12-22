/**
 * ImportExecutor.js
 * Execute the actual import process
 */
class ImportExecutor {
    constructor() {
        this.progressCallback = null;
        this.cancelled = false;
    }

    /**
     * Get editor reference (lazy access to avoid initialization order issues)
     */
    get editor() {
        return window.editor;
    }

    /**
     * Execute import for selected packs
     */
    async execute(selectedPackData, options, progressCallback) {
        this.progressCallback = progressCallback;
        this.cancelled = false;

        const results = {
            success: true,
            packs: [],
            totalImported: 0,
            totalSkipped: 0,
            totalFailed: 0,
            placeholdersCreated: [],
            errors: [],
            duration: 0
        };

        const startTime = performance.now();
        
        // Calculate total files for accurate progress
        let totalFiles = 0;
        let processedFiles = 0;
        for (const { parseData } of selectedPackData) {
            if (parseData && parseData.files) {
                totalFiles += parseData.files.length;
            }
        }

        try {
            let packIndex = 0;
            const totalPacks = selectedPackData.length;

            for (const { pack, parseData, validation } of selectedPackData) {
                if (this.cancelled) {
                    results.success = false;
                    results.errors.push({ message: 'Import cancelled by user' });
                    break;
                }

                this.updateProgress({
                    phase: 'importing',
                    packIndex: packIndex + 1,
                    totalPacks,
                    packName: pack.name,
                    currentFile: '',
                    percentage: totalFiles > 0 ? Math.round((processedFiles / totalFiles) * 100) : 0,
                    filesProcessed: processedFiles,
                    totalFiles: totalFiles,
                    message: `Importing pack ${packIndex + 1} of ${totalPacks}: ${pack.name}`
                });

                const packResult = await this.importPack(pack, parseData, validation, options, processedFiles, totalFiles);
                results.packs.push(packResult);
                
                // Update processed files count
                if (parseData && parseData.files) {
                    processedFiles += parseData.files.length;
                }

                results.totalImported += packResult.imported;
                results.totalSkipped += packResult.skipped;
                results.totalFailed += packResult.failed;
                results.placeholdersCreated.push(...packResult.placeholders);
                results.errors.push(...packResult.errors);

                packIndex++;
            }

        } catch (error) {
            console.error('Import error:', error);
            results.success = false;
            results.errors.push({ message: error.message || 'Unknown error' });
        }

        results.duration = performance.now() - startTime;

        return results;
    }

    /**
     * Import a single pack
     */
    async importPack(pack, parseData, validation, options, startFileIndex = 0, totalFiles = 0) {
        const result = {
            packName: pack.name,
            imported: 0,
            skipped: 0,
            failed: 0,
            placeholders: [],
            errors: [],
            entries: {
                mobs: [],
                skills: [],
                items: [],
                droptables: [],
                randomspawns: []
            }
        };

        // Create pack in editor
        if (!this.editor?.packManager) {
            throw new Error('Pack manager not available');
        }
        const editorPack = await this.editor.packManager.createPack(pack.name);
        if (!editorPack) {
            throw new Error(`Failed to create pack: ${pack.name}`);
        }

        // Import packinfo if exists
        if (pack.configFiles?.packinfo?.exists) {
            const packinfoData = this.getPackinfoData(parseData);
            if (packinfoData) {
                editorPack.packinfo = this.convertPackinfo(packinfoData);
                editorPack.name = packinfoData.Name || pack.name;
            }
        }

        // Import each file type with FILE-BASED STRUCTURE
        // Files are stored as: { id, fileName, entries: [...] }
        const fileTypes = [
            { folder: 'Mobs', type: 'mob', collection: 'mobs' },
            { folder: 'Skills', type: 'skill', collection: 'skills' },
            { folder: 'Items', type: 'item', collection: 'items' },
            { folder: 'DropTables', type: 'droptable', collection: 'droptables' },
            { folder: 'RandomSpawns', type: 'randomspawn', collection: 'randomspawns' }
        ];

        console.log('📦 ImportExecutor: parseData structure:', {
            files: parseData.files?.length,
            sampleFiles: parseData.files?.slice(0, 3).map(f => ({
                relativePath: f.relativePath,
                folderType: f.folderType,
                success: f.success,
                entriesCount: f.entries?.length
            }))
        });

        for (const { folder, type, collection } of fileTypes) {
            const files = parseData.files.filter(f => f.folderType === folder);
            console.log(`📂 Folder "${folder}": found ${files.length} files`);
            
            // Ensure collection uses file-based structure
            if (!Array.isArray(editorPack[collection])) {
                editorPack[collection] = [];
            }
            
            let fileIndexInFolder = 0;
            for (const file of files) {
                if (this.cancelled) break;
                
                const currentFileIndex = startFileIndex + fileIndexInFolder;
                const progressPercentage = totalFiles > 0 ? Math.round((currentFileIndex / totalFiles) * 100) : 0;

                this.updateProgress({
                    phase: 'importing',
                    packName: pack.name,
                    currentFile: file.relativePath,
                    filesProcessed: currentFileIndex,
                    totalFiles: totalFiles,
                    percentage: progressPercentage,
                    message: `Processing ${file.relativePath}...`
                });
                
                fileIndexInFolder++;

                // Skip files with parse errors
                if (!file.success) {
                    console.log(`   ⚠️ Skipping ${file.relativePath} - parse error`);
                    if (options?.onParseErrors === 'stop') {
                        result.errors.push({
                            file: file.relativePath,
                            message: 'Parse error - stopped'
                        });
                        break;
                    }
                    result.skipped++;
                    continue;
                }

                // Extract file name from path (e.g., "Skills/Spider Skills.yml" -> "Spider Skills.yml")
                const fileName = file.relativePath.split('/').pop() || file.relativePath;
                
                console.log(`   📄 Processing ${file.relativePath}: ${file.entries?.length || 0} entries`);
                console.log(`      Entry names:`, file.entries?.map(e => e.name) || []);

                // Create file container for this source file
                const fileContainer = {
                    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    fileName: fileName,
                    relativePath: file.relativePath,
                    entries: [],
                    _importMeta: {
                        sourceFile: file.relativePath,
                        importedAt: new Date().toISOString()
                    }
                };

                // Import each entry in the file
                for (const entry of file.entries || []) {
                    try {
                        // Check validation results
                        const entryValidation = this.getEntryValidation(validation, file.relativePath, entry.name);
                        
                        // Skip entries with critical errors
                        if (entryValidation && entryValidation.issues?.some(i => i.severity === 'critical')) {
                            console.log(`      ⛔ Skipping ${entry.name} - critical error`);
                            result.skipped++;
                            continue;
                        }

                        // Skip entries with warnings if option set (default is to import with warnings)
                        if (options?.onWarnings === false && entryValidation && entryValidation.issues?.some(i => i.severity === 'warning')) {
                            console.log(`      ⚠️ Skipping ${entry.name} - has warnings`);
                            result.skipped++;
                            continue;
                        }

                        // Convert and import entry
                        const converted = this.convertEntry(entry, type, file.relativePath);
                        
                        if (converted) {
                            // Check for duplicates within this file container
                            const existsInFile = fileContainer.entries.some(e => 
                                (e.name === converted.name) || (e.internalName === converted.internalName)
                            );
                            
                            // Also check across all files in this collection
                            const existsInCollection = this.findEntryInCollection(editorPack[collection], converted.name, converted.internalName);

                            if (existsInFile || existsInCollection) {
                                console.log(`      🔄 Duplicate found: ${entry.name}`);
                                switch (options?.duplicates) {
                                    case 'skip':
                                        result.skipped++;
                                        continue;
                                    case 'replace':
                                        if (existsInCollection) {
                                            // Replace in existing file
                                            this.replaceEntryInCollection(editorPack[collection], converted);
                                        } else if (existsInFile) {
                                            const index = fileContainer.entries.findIndex(e => 
                                                (e.name === converted.name) || (e.internalName === converted.internalName)
                                            );
                                            if (index >= 0) {
                                                fileContainer.entries[index] = converted;
                                            }
                                        }
                                        break;
                                    case 'rename':
                                        converted.name = converted.name + '_imported';
                                        if (converted.internalName) {
                                            converted.internalName = converted.internalName + '_imported';
                                        }
                                        fileContainer.entries.push(converted);
                                        break;
                                    default:
                                        // Default: skip duplicates
                                        result.skipped++;
                                        continue;
                                }
                            } else {
                                fileContainer.entries.push(converted);
                            }

                            console.log(`      ✅ Imported: ${entry.name} -> ${collection}/${fileName}`);
                            result.imported++;
                            result.entries[collection].push(converted.name || converted.internalName);
                        } else {
                            console.log(`      ❌ Convert failed for: ${entry.name}`);
                            result.failed++;
                        }

                    } catch (error) {
                        console.error(`      ❌ Error importing ${entry.name}:`, error);
                        result.failed++;
                        result.errors.push({
                            file: file.relativePath,
                            entry: entry.name,
                            message: error.message
                        });
                    }
                }

                // Only add file container if it has entries
                if (fileContainer.entries.length > 0) {
                    // Check if a file with this name already exists
                    const existingFileIndex = editorPack[collection].findIndex(f => f.fileName === fileName);
                    if (existingFileIndex >= 0) {
                        // Merge entries into existing file
                        editorPack[collection][existingFileIndex].entries.push(...fileContainer.entries);
                        console.log(`   📁 Merged ${fileContainer.entries.length} entries into existing file: ${fileName}`);
                    } else {
                        editorPack[collection].push(fileContainer);
                        console.log(`   📁 Created file container: ${fileName} with ${fileContainer.entries.length} entries`);
                    }
                }
            }
        }

        // Create placeholders for missing references if option set
        if (options?.missingReferences === 'placeholder' && validation?.crossReferences) {
            const placeholders = this.createPlaceholders(validation.crossReferences, editorPack);
            result.placeholders.push(...placeholders);
        }

        // Save pack
        this.editor.packManager.savePacks();
        
        // Refresh the pack tree UI to show imported content
        this.editor.packManager.renderPackTree();
        
        // Set the newly imported pack as active
        if (editorPack) {
            this.editor.packManager.setActivePack(editorPack);
        }
        
        console.log(`📦 Import complete for ${pack.name}: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`);

        return result;
    }

    /**
     * Get packinfo data from parse results
     */
    getPackinfoData(parseData) {
        const packinfoFile = parseData.files.find(f => f.relativePath === 'packinfo.yml');
        if (packinfoFile && packinfoFile.success && packinfoFile.entries.length > 0) {
            return packinfoFile.entries[0].data;
        }
        return null;
    }

    /**
     * Convert packinfo to editor format
     */
    convertPackinfo(data) {
        return {
            Name: data.Name || 'Imported Pack',
            Version: data.Version || '1.0.0',
            Author: data.Author || 'Unknown',
            Icon: {
                Material: data.Icon?.Material || 'CHEST',
                Model: data.Icon?.Model || '0'
            },
            URL: data.URL || '',
            Description: Array.isArray(data.Description) ? data.Description : 
                         (data.Description ? [data.Description] : ['Imported pack'])
        };
    }

    /**
     * Get validation result for a specific entry
     */
    getEntryValidation(validation, relativePath, entryName) {
        if (!validation) return null;
        
        const fileResult = validation.validationResults.find(f => f.relativePath === relativePath);
        if (!fileResult) return null;

        return fileResult.entries.find(e => e.name === entryName);
    }

    /**
     * Find an entry by name or internalName across all files in a collection
     * (file-based structure: collection = [{ fileName, entries: [...] }, ...])
     */
    findEntryInCollection(collection, name, internalName) {
        if (!collection || !Array.isArray(collection)) return null;
        
        for (const file of collection) {
            if (!file.entries || !Array.isArray(file.entries)) continue;
            
            const entry = file.entries.find(e => 
                (name && e.name === name) || (internalName && e.internalName === internalName)
            );
            if (entry) return { file, entry };
        }
        return null;
    }

    /**
     * Replace an entry in the collection (file-based structure)
     */
    replaceEntryInCollection(collection, newEntry) {
        if (!collection || !Array.isArray(collection)) return false;
        
        for (const file of collection) {
            if (!file.entries || !Array.isArray(file.entries)) continue;
            
            const index = file.entries.findIndex(e => 
                (newEntry.name && e.name === newEntry.name) || 
                (newEntry.internalName && e.internalName === newEntry.internalName)
            );
            if (index >= 0) {
                file.entries[index] = newEntry;
                return true;
            }
        }
        return false;
    }

    /**
     * Convert an entry to editor format based on type
     */
    convertEntry(entry, type, sourceFile) {
        const baseData = {
            id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            _importMeta: {
                sourceFile,
                importedAt: new Date().toISOString()
            }
        };

        switch (type) {
            case 'mob':
                return this.convertMob(entry, baseData);
            case 'skill':
                return this.convertSkill(entry, baseData);
            case 'item':
                return this.convertItem(entry, baseData);
            case 'droptable':
                return this.convertDropTable(entry, baseData);
            case 'randomspawn':
                return this.convertRandomSpawn(entry, baseData);
            default:
                return null;
        }
    }

    /**
     * Convert mob entry
     * 
     * For template-based mobs, we only store properties that are explicitly defined
     * in the YAML. We don't set defaults - those come from the template at runtime.
     */
    convertMob(entry, baseData) {
        const data = entry.data || {};
        const options = data.Options || {};
        const hasTemplate = data.Template && data.Template.trim();
        
        // MythicMobs uses "MobType" not "Type"
        // Only set if explicitly present (template mobs often don't have it)
        const mobType = data.MobType || data.Type || (hasTemplate ? '' : 'ZOMBIE');
        
        // For template-based mobs, only store explicitly defined values
        // For non-template mobs, use defaults
        const result = {
            ...baseData,
            name: entry.name,
            internalName: entry.name,
            template: data.Template || '',
            type: mobType,
            display: data.Display || '',
            // Core stats - only set if explicitly defined or if no template
            health: data.Health !== undefined ? data.Health : (hasTemplate ? undefined : 20),
            damage: data.Damage !== undefined ? data.Damage : (hasTemplate ? undefined : 0),
            armor: data.Armor !== undefined ? data.Armor : (hasTemplate ? undefined : 0),
            // Movement & Combat (from Options or top-level)
            movementSpeed: options.MovementSpeed || data.MovementSpeed || (hasTemplate ? undefined : 0.2),
            followRange: options.FollowRange || data.FollowRange || (hasTemplate ? undefined : 32),
            knockbackResistance: options.KnockbackResistance || data.KnockbackResistance || (hasTemplate ? undefined : 0),
            attackSpeed: options.AttackSpeed || data.AttackSpeed || undefined,
            // Options as top-level properties for editor
            silent: options.Silent || false,
            invisible: options.Invisible || false,
            despawn: data.Despawn !== undefined ? data.Despawn : options.Despawn,
            noAI: options.NoAI || false,
            noGravity: options.NoGravity || false,
            collidable: options.Collidable !== undefined ? options.Collidable : true,
            interactable: options.Interactable || false,
            invincible: options.Invincible || false,
            glowing: options.Glowing || false,
            preventOtherDrops: options.PreventOtherDrops || false,
            preventRandomEquipment: options.PreventRandomEquipment || false,
            preventSunburn: options.PreventSunburn || false,
            preventItemPickup: options.PreventItemPickup || false,
            preventLeashing: options.PreventLeashing || false,
            preventRenaming: options.PreventRenaming || false,
            digOutOfGround: options.DigOutOfGround || false,
            small: options.Small || false,
            hasArms: options.HasArms || false,
            hasBasePlate: options.HasBasePlate !== undefined ? options.HasBasePlate : true,
            hasGravity: options.HasGravity !== undefined ? options.HasGravity : true,
            // Armor Stand Pose options
            pose: {
                head: options.Head || '',
                body: options.Body || '',
                leftArm: options.LeftArm || '',
                rightArm: options.RightArm || '',
                leftLeg: options.LeftLeg || '',
                rightLeg: options.RightLeg || ''
            },
            // Equipment & Skills - only store if explicitly defined
            equipment: this.convertEquipment(data.Equipment),
            skills: this.convertMobSkills(data.Skills),
            drops: data.Drops ? data.Drops.map(dropLine => this.parseDrop(dropLine)) : [],
            // Other sections
            faction: data.Faction || '',
            bossBar: data.BossBar ? this.convertBossBar(data.BossBar) : null,
            aiGoalSelectors: data.AIGoalSelectors || [],
            aiTargetSelectors: data.AITargetSelectors || [],
            damageModifiers: this.convertDamageModifiers(data.DamageModifiers),
            killMessages: data.KillMessages || [],
            modules: data.Modules || {},
            levelModifiers: data.LevelModifiers || {},
            disguise: data.Disguise || null
        };
        
        // Clean up undefined values for template mobs to avoid exporting them
        if (hasTemplate) {
            Object.keys(result).forEach(key => {
                if (result[key] === undefined) {
                    delete result[key];
                }
            });
        }
        
        return result;
    }

    /**
     * Convert equipment data
     */
    convertEquipment(equipment) {
        if (!equipment || typeof equipment !== 'object') return {};
        
        const result = {};
        const slots = ['HAND', 'OFF_HAND', 'HEAD', 'CHEST', 'LEGS', 'FEET'];
        
        for (const slot of slots) {
            if (equipment[slot]) {
                result[slot] = equipment[slot];
            }
        }

        // Also check lowercase
        for (const [key, value] of Object.entries(equipment)) {
            const upperKey = key.toUpperCase();
            if (slots.includes(upperKey) && !result[upperKey]) {
                result[upperKey] = value;
            }
        }

        return result;
    }

    /**
     * Convert mob skills to editor format
     */
    convertMobSkills(skills) {
        if (!skills || !Array.isArray(skills)) return [];
        return skills.map(s => typeof s === 'string' ? s : String(s));
    }

    /**
     * Convert mob options
     */
    convertMobOptions(data) {
        const options = {};
        const booleanOptions = [
            'PreventOtherDrops', 'PreventRandomEquipment', 'PreventSunburn',
            'Silent', 'NoAI', 'NoDamageTicks', 'Persistent', 'Invincible',
            'Collidable', 'Glowing', 'Invisible', 'AlwaysShowName'
        ];

        for (const opt of booleanOptions) {
            if (data[opt] !== undefined) {
                options[opt] = !!data[opt];
            }
        }

        return options;
    }

    /**
     * Convert DamageModifiers from MythicMobs format to editor format
     * MythicMobs format: array of strings like ["FALL 0", "PROJECTILE 0.75"]
     * Editor format: object like { FALL: 0, PROJECTILE: 0.75 }
     */
    convertDamageModifiers(damageModifiers) {
        if (!damageModifiers) return {};
        
        // If already an object, return as-is
        if (typeof damageModifiers === 'object' && !Array.isArray(damageModifiers)) {
            return damageModifiers;
        }
        
        // Convert from array format to object format
        if (Array.isArray(damageModifiers)) {
            const result = {};
            damageModifiers.forEach(modifier => {
                if (typeof modifier === 'string') {
                    // Parse "TYPE VALUE" format, e.g., "FALL 0" or "PROJECTILE 0.75"
                    const parts = modifier.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const type = parts[0].toUpperCase();
                        const value = parseFloat(parts[1]);
                        if (!isNaN(value)) {
                            result[type] = value;
                        }
                    }
                }
            });
            return result;
        }
        
        return {};
    }

    /**
     * Convert boss bar data
     */
    convertBossBar(bossBar) {
        if (!bossBar) return null;
        if (typeof bossBar === 'string') {
            return { enabled: true, title: bossBar };
        }
        return {
            enabled: bossBar.Enabled !== false,
            title: bossBar.Title || '',
            range: bossBar.Range || 64,
            color: bossBar.Color || 'RED',
            style: bossBar.Style || 'SOLID',
            createFog: bossBar.CreateFog || false,
            darkenSky: bossBar.DarkenSky || false,
            playMusic: bossBar.PlayMusic || false
        };
    }

    /**
     * Convert skill entry
     */
    convertSkill(entry, baseData) {
        const data = entry.data || {};

        return {
            ...baseData,
            name: entry.name,
            internalName: entry.name,
            cooldown: data.Cooldown || 0,
            conditions: data.Conditions || [],
            targetConditions: data.TargetConditions || [],
            triggerConditions: data.TriggerConditions || [],
            cancelIfNoTargets: data.CancelIfNoTargets !== undefined ? data.CancelIfNoTargets : true,
            failedConditionsSkill: data.FailedConditionsSkill || data.OnFailSkill || '',
            onCooldownSkill: data.OnCooldownSkill || '',
            skillReference: data.Skill || '',
            Skills: data.Skills || []
        };
    }

    /**
     * Convert item entry
     */
    convertItem(entry, baseData) {
        const data = entry.data || {};

        return {
            ...baseData,
            name: entry.name,
            internalName: entry.name,
            Id: data.Id || data.Material || 'STONE',
            Display: data.Display || '',
            Amount: data.Amount || 1,
            Lore: data.Lore || [],
            Enchantments: this.convertEnchantments(data.Enchantments),
            Attributes: data.Attributes || {},
            PotionEffects: data.PotionEffects || [],
            Options: data.Options || {},
            Hide: data.Hide || [],
            NBT: data.NBT || {},
            BannerLayers: data.BannerLayers || [],
            Firework: data.Firework || {},
            Trim: data.Trim || {},
            Book: data.Book || {},
            Skills: data.Skills || [],
            CustomModelData: data.CustomModelData || data.Model || null,
            Unbreakable: data.Unbreakable || false,
            Color: data.Color || null,
            Group: data.Group || null
        };
    }

    /**
     * Convert enchantments - keep as strings for compatibility with itemEditor
     */
    convertEnchantments(enchantments) {
        if (!enchantments || !Array.isArray(enchantments)) return [];
        
        return enchantments.map(e => {
            let enchStr;
            if (typeof e === 'string') {
                // Already a string like "PROTECTION 1to3" or "SHARPNESS:5"
                // Normalize colon format to space format
                if (e.includes(':')) {
                    const parts = e.split(':');
                    enchStr = `${parts[0].trim()} ${parts[1]?.trim() || '1'}`;
                } else {
                    enchStr = e;
                }
            } else if (typeof e === 'object' && e !== null) {
                // Object format { type, level } - convert to string
                enchStr = `${e.type || e.name || ''} ${e.level || 1}`;
            } else {
                enchStr = String(e);
            }
            
            // Normalize legacy enchantment names (DURABILITY -> UNBREAKING, etc.)
            if (window.EnchantmentData?.normalizeName) {
                const parts = enchStr.split(' ');
                const enchName = parts[0];
                const enchLevel = parts.slice(1).join(' ') || '1';
                const normalizedName = window.EnchantmentData.normalizeName(enchName);
                
                return `${normalizedName} ${enchLevel}`;
            }
            
            return enchStr;
        });
    }

    /**
     * Convert droptable entry
     */
    convertDropTable(entry, baseData) {
        const data = entry.data || {};
        
        // Parse drops into the format expected by MobDropsEditor
        let parsedDrops = [];
        if (data.Drops && Array.isArray(data.Drops)) {
            parsedDrops = data.Drops.map(dropLine => this.parseDrop(dropLine));
        }

        return {
            ...baseData,
            name: entry.name,
            tableType: data.Equipment ? 'equipment' : 'normal',
            config: {
                TotalItems: data.TotalItems,
                MinItems: data.MinItems,
                MaxItems: data.MaxItems,
                BonusLuckItems: data.BonusLuckItems,
                BonusLevelItems: data.BonusLevelItems
            },
            conditions: data.Conditions || [],
            triggerConditions: data.TriggerConditions || [],
            drops: parsedDrops
        };
    }
    
    /**
     * Parse a single drop line into drop object format
     * @param {string} dropLine - Drop line from YAML like "dirt 1to2 0.32"
     * @returns {object} Parsed drop object
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

        // Extract curly brace attributes first
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
        attributeMatches.slice().reverse().forEach(m => {
            mainPart = mainPart.substring(0, m.index) + mainPart.substring(m.index + m.full.length);
        });

        // Parse the base parts (item/type amount chance)
        const parts = mainPart.trim().split(/\s+/);
        const baseName = parts[0] || '';
        const amount = parts[1] || '1';
        const chance = parts[2] || '1.0';

        // Determine drop type based on the first part
        if (baseName === 'exp') {
            drop.type = 'exp';
            drop.amount = amount;
            drop.chance = chance;
        } else if (baseName === 'mythicmob') {
            drop.type = 'mythicmob';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseDropAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'mythicitem' || baseName.toLowerCase() === 'mythicitem') {
            // Explicit mythicitem{i=ItemName} format
            drop.type = 'mythicitem';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                const attrs = this.parseDropAttributes(attributeMatches[0].content);
                // Extract the item name from i= or item= attribute
                drop.item = attrs.i || attrs.item || attrs.I || attrs.Item || '';
                // Store other attributes
                delete attrs.i;
                delete attrs.item;
                delete attrs.I;
                delete attrs.Item;
                drop.attributes = attrs;
            }
        } else if (baseName === 'mcmmo-exp') {
            drop.type = 'mcmmo-exp';
            drop.amount = amount;
            drop.chance = chance;
        } else if (baseName === 'money') {
            drop.type = 'money';
            drop.amount = amount;
            drop.chance = chance;
        } else if (baseName === 'cmd') {
            drop.type = 'command';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseDropAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'mmoitems') {
            drop.type = 'mmoitems';
            drop.amount = amount;
            drop.chance = chance;
            if (attributeMatches.length > 0) {
                drop.attributes = this.parseDropAttributes(attributeMatches[0].content);
            }
        } else if (baseName === 'itemvariable') {
            drop.type = 'itemvariable';
            drop.amount = amount;
            drop.chance = chance;
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
            // Item - check if it's vanilla or mythic
            const isVanillaItem = baseName === baseName.toUpperCase() || attributeMatches.length > 0;
            
            if (isVanillaItem && attributeMatches.length > 0) {
                drop.type = 'item';
                drop.item = baseName;
                drop.amount = amount;
                drop.chance = chance;
                // Parse inline attributes
                attributeMatches.forEach(attrMatch => {
                    const attrs = this.parseDropAttributes(attrMatch.content);
                    Object.assign(drop.inlineAttributes, attrs);
                });
            } else {
                // MythicItem or vanilla item without attributes
                drop.type = baseName === baseName.toUpperCase() ? 'item' : 'mythicitem';
                drop.item = baseName;
                drop.amount = amount;
                drop.chance = chance;
            }
        }

        return drop;
    }
    
    /**
     * Parse drop attribute string like "type=ZOMBIE;level=5"
     */
    parseDropAttributes(attrString) {
        const attrs = {};
        if (!attrString) return attrs;
        
        const pairs = attrString.split(';');
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key && value !== undefined) {
                attrs[key.trim()] = value.trim();
            }
        }
        return attrs;
    }

    /**
     * Convert randomspawn entry
     */
    convertRandomSpawn(entry, baseData) {
        const data = entry.data || {};

        // Handle Worlds - can be string or array in YAML
        let worlds = data.Worlds || [];
        if (typeof worlds === 'string') {
            worlds = [worlds];
        }

        // Handle Biomes - can be string or array
        let biomes = data.Biomes || [];
        if (typeof biomes === 'string') {
            biomes = [biomes];
        }

        return {
            ...baseData,
            name: entry.name,
            internalName: entry.name,
            // Core spawn settings
            Type: data.Type || '',                    // Single mob type
            Types: data.Types || [],                  // Multi-type mode
            Level: data.Level,                        // Optional level
            Chance: data.Chance !== undefined ? data.Chance : 1.0,
            Priority: data.Priority !== undefined ? data.Priority : 0,
            Action: data.Action || 'ADD',
            UseWorldScaling: data.UseWorldScaling || false,
            // Location settings
            Worlds: worlds,
            Biomes: biomes,
            Reason: data.Reason || 'NATURAL',
            PositionType: data.PositionType || 'LAND',
            Structures: data.Structures || [],
            // Advanced settings
            Cooldown: data.Cooldown || 0,
            GenerateRadius: data.GenerateRadius,
            MinDistance: data.MinDistance,
            MaxDistance: data.MaxDistance,
            // Conditions
            Conditions: data.Conditions || []
        };
    }

    /**
     * Create placeholder entries for missing references
     * Uses file-based structure: creates a "_placeholders.yml" file for each type
     */
    createPlaceholders(crossReferences, editorPack) {
        const created = [];

        // Create placeholder skills
        const missingSkills = crossReferences.missingReferences.skills || [];
        if (missingSkills.length > 0) {
            const placeholderFile = {
                id: `placeholder_skills_${Date.now()}`,
                fileName: '_placeholders.yml',
                relativePath: 'Skills/_placeholders.yml',
                entries: [],
                _importMeta: {
                    sourceFile: '_placeholders.yml',
                    importedAt: new Date().toISOString(),
                    isPlaceholderFile: true
                }
            };
            
            for (const missing of missingSkills) {
                const placeholder = {
                    id: `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: missing.name,
                    cooldown: 0,
                    Skills: ['- message{m="Placeholder skill"} @self'],
                    _placeholder: true
                };
                placeholderFile.entries.push(placeholder);
                created.push({ type: 'skill', name: missing.name });
            }
            
            if (placeholderFile.entries.length > 0) {
                editorPack.skills.push(placeholderFile);
            }
        }

        // Create placeholder items
        const missingItems = crossReferences.missingReferences.items || [];
        if (missingItems.length > 0) {
            const placeholderFile = {
                id: `placeholder_items_${Date.now()}`,
                fileName: '_placeholders.yml',
                relativePath: 'Items/_placeholders.yml',
                entries: [],
                _importMeta: {
                    sourceFile: '_placeholders.yml',
                    importedAt: new Date().toISOString(),
                    isPlaceholderFile: true
                }
            };
            
            for (const missing of missingItems) {
                const placeholder = {
                    id: `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    internalName: missing.name,
                    Id: 'STONE',
                    Display: `&7${missing.name} (Placeholder)`,
                    _placeholder: true
                };
                placeholderFile.entries.push(placeholder);
                created.push({ type: 'item', name: missing.name });
            }
            
            if (placeholderFile.entries.length > 0) {
                editorPack.items.push(placeholderFile);
            }
        }

        // Create placeholder droptables
        const missingDroptables = crossReferences.missingReferences.droptables || [];
        if (missingDroptables.length > 0) {
            const placeholderFile = {
                id: `placeholder_droptables_${Date.now()}`,
                fileName: '_placeholders.yml',
                relativePath: 'DropTables/_placeholders.yml',
                entries: [],
                _importMeta: {
                    sourceFile: '_placeholders.yml',
                    importedAt: new Date().toISOString(),
                    isPlaceholderFile: true
                }
            };
            
            for (const missing of missingDroptables) {
                const placeholder = {
                    id: `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: missing.name,
                    tableType: 'normal',
                    drops: [],
                    _placeholder: true
                };
                placeholderFile.entries.push(placeholder);
                created.push({ type: 'droptable', name: missing.name });
            }
            
            if (placeholderFile.entries.length > 0) {
                editorPack.droptables.push(placeholderFile);
            }
        }

        return created;
    }

    /**
     * Update progress
     */
    updateProgress(data) {
        if (this.progressCallback) {
            this.progressCallback(data);
        }
    }

    /**
     * Cancel import
     */
    cancel() {
        this.cancelled = true;
    }
}

window.ImportExecutor = ImportExecutor;
