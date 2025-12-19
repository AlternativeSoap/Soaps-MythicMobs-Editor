/**
 * RandomSpawn Editor - Handles random spawn configuration
 */
class RandomSpawnEditor {
    constructor(editor) {
        this.editor = editor;
        this.isMultiTypeMode = false;
        this.initializeConstants();
    }
    
    initializeConstants() {
        // All vanilla Minecraft entities organized by category
        this.VANILLA_ENTITIES = {
            hostile: [
                'zombie', 'skeleton', 'spider', 'cave_spider', 'creeper', 'enderman', 'witch',
                'slime', 'magma_cube', 'blaze', 'ghast', 'zombified_piglin', 'hoglin', 'piglin',
                'piglin_brute', 'wither_skeleton', 'stray', 'husk', 'drowned', 'phantom',
                'silverfish', 'endermite', 'vindicator', 'evoker', 'vex', 'pillager', 'ravager',
                'guardian', 'elder_guardian', 'shulker', 'zoglin', 'warden', 'bogged', 'breeze'
            ],
            passive: [
                'pig', 'cow', 'sheep', 'chicken', 'rabbit', 'horse', 'donkey', 'mule',
                'llama', 'trader_llama', 'cat', 'ocelot', 'wolf', 'parrot', 'bat',
                'cod', 'salmon', 'tropical_fish', 'pufferfish', 'squid', 'glow_squid',
                'dolphin', 'turtle', 'polar_bear', 'panda', 'fox', 'bee', 'mooshroom',
                'strider', 'axolotl', 'glow_squid', 'goat', 'frog', 'tadpole', 'camel',
                'sniffer', 'armadillo'
            ],
            neutral: [
                'zombified_piglin', 'spider', 'cave_spider', 'enderman', 'iron_golem',
                'polar_bear', 'llama', 'wolf', 'bee', 'panda', 'dolphin', 'trader_llama'
            ],
            boss: ['ender_dragon', 'wither'],
            other: [
                'villager', 'wandering_trader', 'snow_golem', 'allay', 'zombie_villager'
            ]
        };
        
        // All 64 Minecraft biomes organized by dimension
        this.BIOMES = {
            overworld: [
                'ocean', 'deep_ocean', 'warm_ocean', 'lukewarm_ocean', 'cold_ocean',
                'frozen_ocean', 'deep_lukewarm_ocean', 'deep_cold_ocean', 'deep_frozen_ocean',
                'mushroom_fields', 'plains', 'sunflower_plains', 'snowy_plains', 'ice_spikes',
                'desert', 'swamp', 'mangrove_swamp', 'forest', 'flower_forest', 'birch_forest',
                'dark_forest', 'old_growth_birch_forest', 'old_growth_pine_taiga', 
                'old_growth_spruce_taiga', 'taiga', 'snowy_taiga', 'savanna', 'savanna_plateau',
                'windswept_hills', 'windswept_gravelly_hills', 'windswept_forest', 
                'windswept_savanna', 'jungle', 'sparse_jungle', 'bamboo_jungle', 'badlands',
                'eroded_badlands', 'wooded_badlands', 'meadow', 'cherry_grove', 'grove',
                'snowy_slopes', 'frozen_peaks', 'jagged_peaks', 'stony_peaks', 'river',
                'frozen_river', 'beach', 'snowy_beach', 'stony_shore', 'dripstone_caves',
                'lush_caves', 'deep_dark', 'pale_garden'
            ],
            nether: ['nether_wastes', 'crimson_forest', 'warped_forest', 'soul_sand_valley', 'basalt_deltas'],
            end: ['the_end', 'small_end_islands', 'end_midlands', 'end_highlands', 'end_barrens'],
            void: ['the_void']
        };
        
        // All Minecraft structures
        this.STRUCTURES = {
            overworld_underground: [
                'ancient_city', 'mineshaft', 'mineshaft_mesa', 'stronghold', 'buried_treasure', 'trial_chambers', 'trail_ruins'
            ],
            overworld_surface: [
                'desert_pyramid', 'igloo', 'jungle_pyramid', 'pillager_outpost', 'swamp_hut', 
                'village_desert', 'village_plains', 'village_savanna', 'village_snowy', 'village_taiga',
                'woodland_mansion'
            ],
            overworld_water: [
                'ocean_ruin_cold', 'ocean_ruin_warm', 'shipwreck', 'shipwreck_beached', 'monument'
            ],
            overworld_any: [
                'ruined_portal', 'ruined_portal_desert', 'ruined_portal_jungle', 'ruined_portal_mountain',
                'ruined_portal_ocean', 'ruined_portal_swamp'
            ],
            nether: [
                'fortress', 'bastion_remnant', 'nether_fossil', 'ruined_portal_nether'
            ],
            end: [
                'end_city'
            ]
        };
        
        // All 44 SpawnReason values from Bukkit API
        this.SPAWN_REASONS = [
            'NATURAL', 'JOCKEY', 'SPAWNER', 'TRIAL_SPAWNER', 'EGG', 'SPAWNER_EGG', 'BUCKET',
            'LIGHTNING', 'BUILD_SNOWMAN', 'BUILD_IRONGOLEM', 'BUILD_COPPERGOLEM', 'BUILD_WITHER',
            'VILLAGE_DEFENSE', 'VILLAGE_INVASION', 'BREEDING', 'SLIME_SPLIT', 'REINFORCEMENTS',
            'NETHER_PORTAL', 'DISPENSE_EGG', 'INFECTION', 'CURED', 'OCELOT_BABY', 
            'SILVERFISH_BLOCK', 'MOUNT', 'TRAP', 'ENDER_PEARL', 'SHOULDER_ENTITY', 'DROWNED',
            'SHEARED', 'EXPLOSION', 'RAID', 'PATROL', 'BEEHIVE', 'PIGLIN_ZOMBIFIED', 'SPELL',
            'FROZEN', 'METAMORPHOSIS', 'DUPLICATION', 'COMMAND', 'ENCHANTMENT', 'POTION_EFFECT',
            'REANIMATE', 'CUSTOM', 'DEFAULT'
        ];
        
        this.ACTION_OPTIONS = [
            { value: 'ADD', label: 'ADD - MythicMobs spawning in addition to vanilla' },
            { value: 'REPLACE', label: 'REPLACE - Replace vanilla spawns (requires Minecraft spawning enabled)' },
            { value: 'DENY', label: 'DENY - Prevent vanilla spawns' },
            { value: 'SCALE', label: 'SCALE - (Upcoming feature)', disabled: true }
        ];
    }
    
    render(spawn) {
        const editorPanel = document.getElementById('randomspawn-editor-view');
        if (!editorPanel) return;
        
        // Store reference
        this.currentSpawn = spawn;
        
        // Check if this is a file container
        if (spawn._isFileContainer) {
            this.renderFileContainer(spawn, editorPanel);
            return;
        }
        
        // Determine if multi-type mode
        this.isMultiTypeMode = spawn.Types && Array.isArray(spawn.Types) && spawn.Types.length > 0;
        
        // Check mode
        const isAdvanced = this.editor.state.currentMode === 'advanced';
        
        editorPanel.innerHTML = `
            <div class="editor-header">
                <h2>
                    <i class="fas fa-map-marked-alt"></i>
                    RandomSpawn Editor
                    <span class="item-name">${spawn.name}</span>
                    <span class="mode-badge ${isAdvanced ? 'advanced' : 'beginner'}">${isAdvanced ? 'Advanced' : 'Beginner'} Mode</span>
                </h2>
                <div class="editor-actions">
                    <div class="action-group secondary-actions">
                        <button class="btn btn-outline" id="duplicate-randomspawn-btn" title="Create a copy of this spawn">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline" id="rename-randomspawn-btn" title="Rename this spawn">
                            <i class="fas fa-pen"></i> Rename
                        </button>
                        <button class="btn btn-outline btn-danger" id="delete-randomspawn-btn" title="Delete this spawn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-secondary" id="new-randomspawn-btn" title="Add a new spawn to this file">
                            <i class="fas fa-plus"></i> New Section
                        </button>
                    </div>
                    <button class="btn btn-primary" id="save-randomspawn">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            <div class="editor-content" id="randomspawn-form-view">
                <!-- Basic Configuration -->
                <div class="card collapsible-card">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-cog"></i> Basic Configuration
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <div class="form-group full-width">
                            <label class="form-label">Internal Name <span class="required">*</span></label>
                            <input type="text" class="form-input" id="spawn-name" value="${spawn.name}" placeholder="my_spawn">
                            <small class="form-hint">Unique identifier for this spawn</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="form-label">Action <span class="required">*</span></label>
                            <select class="form-input" id="spawn-action">
                                ${this.ACTION_OPTIONS.map(opt => `
                                    <option value="${opt.value}" ${spawn.Action === opt.value ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''}>
                                        ${opt.label}
                                    </option>
                                `).join('')}
                            </select>
                            <small class="form-hint">How this spawn interacts with vanilla spawning</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="form-label">
                                <input type="checkbox" id="type-mode-toggle" ${this.isMultiTypeMode ? 'checked' : ''}>
                                Enable Multi-Type Spawning (with weights)
                            </label>
                            <small class="form-hint">Allow multiple mob types to spawn with different probabilities</small>
                        </div>
                        
                        <div id="single-type-container" style="${this.isMultiTypeMode ? 'display: none;' : ''}">
                            <div class="form-group full-width">
                                <label class="form-label">Mob Type <span class="required">*</span></label>
                                <div class="entity-selector">
                                    <input type="text" class="form-input" id="spawn-type-search" value="${spawn.Type || ''}" placeholder="Search or select entity..." autocomplete="off">
                                    <div id="entity-dropdown" class="entity-dropdown" style="display: none;">
                                        ${this.renderEntityDropdown()}
                                    </div>
                                </div>
                                <small class="form-hint">Select custom MythicMob or vanilla Minecraft entity</small>
                            </div>
                        </div>
                        
                        <div id="multi-type-container" style="${this.isMultiTypeMode ? '' : 'display: none;'}">
                            <div class="form-group full-width">
                                <label class="form-label">Mob Types with Weights <span class="required">*</span></label>
                                <div id="types-list">
                                    ${this.renderTypesList(spawn.Types || [])}
                                </div>
                                <div class="entity-selector" style="margin-top: 10px;">
                                    <div class="grid-2" style="gap: 10px;">
                                        <input type="text" class="form-input" id="new-type-search" placeholder="Search or select entity..." autocomplete="off">
                                        <input type="number" class="form-input" id="new-type-weight" placeholder="Weight" value="100" min="1">
                                    </div>
                                    <div id="multi-entity-dropdown" class="entity-dropdown" style="display: none;">
                                        ${this.renderEntityDropdown()}
                                    </div>
                                </div>
                                <button class="btn btn-secondary" id="add-type-btn" style="margin-top: 10px;">
                                    <i class="fas fa-plus"></i> Add Type
                                </button>
                                <small class="form-hint">Higher weights = more likely to spawn. Format: "MobName 100"</small>
                            </div>
                        </div>
                        
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Level</label>
                                <input type="number" class="form-input" id="spawn-level" value="${spawn.Level || 1}" min="1" placeholder="1">
                                <small class="form-hint">Mob level (min: 1)</small>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Chance</label>
                                <input type="number" class="form-input" id="spawn-chance" value="${spawn.Chance || 0.1}" step="0.01" min="0" max="1" placeholder="0.1">
                                <small class="form-hint">Spawn probability (0-1)</small>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Priority</label>
                                <input type="number" class="form-input" id="spawn-priority" value="${spawn.Priority || 1}" placeholder="1">
                                <small class="form-hint">Higher priority = evaluated first</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Location Settings -->
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-map-marked-alt"></i> Location Settings
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <div class="form-group full-width">
                            <label class="form-label">Worlds</label>
                            <div id="worlds-tags" class="tags-container">
                                ${this.renderTags(spawn.Worlds || [], 'world')}
                            </div>
                            <div class="input-group">
                                <input type="text" class="form-input" id="new-world" placeholder="world_name">
                                <button class="btn btn-secondary" id="add-world-btn">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                            <small class="form-hint">Leave empty for all worlds</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="form-label">Biomes</label>
                            <div id="biomes-tags" class="tags-container">
                                ${this.renderTags(spawn.Biomes || [], 'biome')}
                            </div>
                            <div class="biome-selector">
                                <input type="text" class="form-input" id="biome-search" placeholder="Search biomes...">
                                <div id="biome-dropdown" class="biome-dropdown" style="display: none;">
                                    ${this.renderBiomeDropdown()}
                                </div>
                            </div>
                            <small class="form-hint">Leave empty for all biomes. Click to select from list.</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="form-label">Spawn Reason</label>
                            <select class="form-input" id="spawn-reason">
                                ${this.SPAWN_REASONS.map(reason => `
                                    <option value="${reason}" ${spawn.Reason === reason ? 'selected' : ''}>${reason}</option>
                                `).join('')}
                            </select>
                            <small class="form-hint">What triggers this spawn</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="form-label">Position Type</label>
                            <div class="radio-group">
                                <label>
                                    <input type="radio" name="position-type" value="LAND" ${!spawn.PositionType || spawn.PositionType === 'LAND' ? 'checked' : ''}>
                                    LAND
                                </label>
                                <label>
                                    <input type="radio" name="position-type" value="SEA" ${spawn.PositionType === 'SEA' ? 'checked' : ''}>
                                    SEA
                                </label>
                            </div>
                            <small class="form-hint">Restrict spawning to land or sea</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="form-label">Structures</label>
                            <div id="structures-tags" class="tags-container">
                                ${this.renderTags(spawn.Structures || [], 'structure')}
                            </div>
                            <div class="structure-selector">
                                <input type="text" class="form-input" id="structure-search" placeholder="Search structures...">
                                <div id="structure-dropdown" class="structure-dropdown" style="display: none;">
                                    ${this.renderStructureDropdown()}
                                </div>
                            </div>
                            <small class="form-hint">Leave empty for all structures. Click to select from list.</small>
                        </div>
                    </div>
                </div>
                
                <!-- Advanced Options (Advanced Only) -->
                ${isAdvanced ? `
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-sliders-h"></i> Advanced Options
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <div class="form-group full-width">
                            <label class="form-label">
                                <input type="checkbox" id="spawn-worldscaling" ${spawn.UseWorldScaling ? 'checked' : ''}>
                                Use World Scaling
                            </label>
                            <small class="form-hint">Use world difficulty scaling for mob level</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="form-label">Cooldown (seconds)</label>
                            <input type="number" class="form-input" id="spawn-cooldown" value="${spawn.Cooldown || 0}" min="0" placeholder="0">
                            <small class="form-hint">Time between spawns (0 = no cooldown)</small>
                        </div>
                    </div>
                </div>
                
                <!-- Conditions -->
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-filter"></i> Conditions
                            ${spawn.Conditions && spawn.Conditions.length ? `<span class="count-badge">${spawn.Conditions.length}</span>` : ''}
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <p class="help-text">Conditions that determine when and where this mob can spawn</p>
                        <div class="condition-list-container" id="conditions-list">
                            ${this.renderConditionList(spawn.Conditions || [])}
                        </div>
                        <button class="btn btn-primary btn-sm" id="btnBrowseConditions" style="margin-top: 10px;">
                            <i class="fas fa-search"></i> Browse Conditions
                        </button>
                    </div>
                </div>
                ` : ''}
                
            </div>
        `;
        
        this.attachEventHandlers(spawn);
        this.editor.updateYAMLPreview();
    }
    
    renderTypesList(types) {
        if (!types || types.length === 0) return '<p style="color: #888;">No types added yet</p>';
        
        return types.map((type, index) => {
            const parts = type.split(' ');
            const name = parts[0];
            const weight = parts[1] || '100';
            return `
                <div class="tag" data-index="${index}">
                    ${name} <span style="opacity: 0.7;">(${weight})</span>
                    <i class="fas fa-times" onclick="window.randomSpawnEditor.removeType(${index})"></i>
                </div>
            `;
        }).join('');
    }
    
    renderTags(items, type) {
        if (!items || items.length === 0) return '';
        
        return items.map((item, index) => `
            <div class="tag" data-index="${index}" data-type="${type}">
                ${item}
                <i class="fas fa-times" onclick="window.randomSpawnEditor.removeTag('${type}', ${index})"></i>
            </div>
        `).join('');
    }
    
    renderBiomeDropdown() {
        let html = '';
        for (const [dimension, biomes] of Object.entries(this.BIOMES)) {
            html += `<div class="biome-group">
                <div class="biome-group-header">${dimension.toUpperCase()}</div>`;
            biomes.forEach(biome => {
                html += `
                    <div class="biome-option" data-biome="${biome}">
                        <label>
                            <input type="checkbox" value="${biome}">
                            ${biome}
                        </label>
                    </div>
                `;
            });
            html += '</div>';
        }
        return html;
    }
    
    renderStructureDropdown() {
        let html = '';
        const categoryNames = {
            overworld_underground: 'OVERWORLD - UNDERGROUND',
            overworld_surface: 'OVERWORLD - SURFACE',
            overworld_water: 'OVERWORLD - WATER',
            overworld_any: 'OVERWORLD - ANY LOCATION',
            nether: 'THE NETHER',
            end: 'THE END'
        };
        
        for (const [category, structures] of Object.entries(this.STRUCTURES)) {
            html += `<div class="structure-group">
                <div class="structure-group-header">${categoryNames[category]}</div>`;
            structures.forEach(structure => {
                html += `
                    <div class="structure-option" data-structure="${structure}">
                        <label>
                            <input type="checkbox" value="${structure}">
                            ${structure}
                        </label>
                    </div>
                `;
            });
            html += '</div>';
        }
        return html;
    }
    
    renderEntityDropdown() {
        let html = '';
        
        // Custom MythicMobs section
        const customMobs = this.getCustomMobs();
        if (customMobs.length > 0) {
            html += `<div class="entity-group">
                <div class="entity-group-header"><i class="fas fa-skull" style="margin-right: 5px;"></i>CUSTOM MYTHICMOBS</div>`;
            customMobs.forEach(mob => {
                html += `
                    <div class="entity-option" data-entity="${mob}" data-type="custom">
                        <i class="fas fa-dragon" style="color: #9b59b6; margin-right: 5px;"></i>${mob}
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Vanilla entities sections
        for (const [category, entities] of Object.entries(this.VANILLA_ENTITIES)) {
            const icons = {
                hostile: 'fa-skull-crossbones',
                passive: 'fa-dove',
                neutral: 'fa-paw',
                boss: 'fa-crown',
                other: 'fa-users'
            };
            html += `<div class="entity-group">
                <div class="entity-group-header"><i class="fas ${icons[category]}" style="margin-right: 5px;"></i>VANILLA - ${category.toUpperCase()}</div>`;
            entities.forEach(entity => {
                html += `
                    <div class="entity-option" data-entity="${entity}" data-type="vanilla">
                        <i class="fas fa-cube" style="color: #3498db; margin-right: 5px;"></i>${entity}
                    </div>
                `;
            });
            html += '</div>';
        }
        
        return html;
    }
    
    getCustomMobs() {
        try {
            if (!this.editor || !this.editor.packManager) return [];
            
            const activePack = this.editor.packManager.activePack;
            if (!activePack || !activePack.mobs) return [];
            
            // New file-based structure: pack.mobs is an array of files, each with entries
            const allMobs = [];
            
            // Check if using new file-based structure
            if (Array.isArray(activePack.mobs) && activePack.mobs.length > 0) {
                if (activePack.mobs[0].entries !== undefined) {
                    // New structure: iterate through files and their entries
                    activePack.mobs.forEach(file => {
                        if (file.entries && Array.isArray(file.entries)) {
                            file.entries.forEach(mob => {
                                if (mob.internalName) {
                                    allMobs.push(mob.internalName);
                                } else if (mob.name) {
                                    allMobs.push(mob.name);
                                }
                            });
                        }
                    });
                } else {
                    // Legacy flat structure
                    activePack.mobs.forEach(mob => {
                        if (mob.internalName) {
                            allMobs.push(mob.internalName);
                        } else if (mob.name) {
                            allMobs.push(mob.name);
                        }
                    });
                }
            }
            
            return allMobs.filter(name => name).sort();
        } catch (error) {
            console.warn('Could not load custom mobs:', error);
            return [];
        }
    }
    
    attachEventHandlers(spawn) {
        window.randomspawnEditor = this;
        window.randomSpawnEditor = this;
        
        // Browse Conditions button
        document.getElementById('btnBrowseConditions')?.addEventListener('click', () => {
            this.openConditionBrowser();
        });
        
        // New section button (add new spawn to current file)
        document.getElementById('new-randomspawn-btn')?.addEventListener('click', () => {
            this.addNewSection();
        });
        
        // Duplicate button
        document.getElementById('duplicate-randomspawn-btn')?.addEventListener('click', () => {
            this.duplicateRandomSpawn();
        });
        
        // Rename button
        document.getElementById('rename-randomspawn-btn')?.addEventListener('click', () => {
            this.renameRandomSpawn();
        });
        
        document.getElementById('delete-randomspawn-btn')?.addEventListener('click', () => {
            this.deleteRandomSpawn();
        });
        
        // Save button
        document.getElementById('save-randomspawn')?.addEventListener('click', async () => {
            await this.save();
        });
        
        // Type mode toggle
        document.getElementById('type-mode-toggle')?.addEventListener('change', (e) => {
            this.isMultiTypeMode = e.target.checked;
            document.getElementById('single-type-container').style.display = this.isMultiTypeMode ? 'none' : '';
            document.getElementById('multi-type-container').style.display = this.isMultiTypeMode ? '' : 'none';
            this.updateFormDataToFile();
            this.editor.markDirty();
        });
        
        // Entity dropdown for single type
        const entitySearch = document.getElementById('spawn-type-search');
        const entityDropdown = document.getElementById('entity-dropdown');
        
        entitySearch?.addEventListener('focus', () => {
            entityDropdown.style.display = 'block';
        });
        
        entitySearch?.addEventListener('input', (e) => {
            this.filterEntities(e.target.value, 'entity-dropdown');
        });
        
        entityDropdown?.addEventListener('click', (e) => {
            const option = e.target.closest('.entity-option');
            if (option) {
                const entity = option.dataset.entity;
                entitySearch.value = entity;
                entityDropdown.style.display = 'none';
                this.updateFormDataToFile();
                this.editor.markDirty();
            }
        });
        
        // Entity dropdown for multi type
        const multiEntitySearch = document.getElementById('new-type-search');
        const multiEntityDropdown = document.getElementById('multi-entity-dropdown');
        
        multiEntitySearch?.addEventListener('focus', () => {
            multiEntityDropdown.style.display = 'block';
        });
        
        multiEntitySearch?.addEventListener('input', (e) => {
            this.filterEntities(e.target.value, 'multi-entity-dropdown');
        });
        
        multiEntityDropdown?.addEventListener('click', (e) => {
            const option = e.target.closest('.entity-option');
            if (option) {
                const entity = option.dataset.entity;
                multiEntitySearch.value = entity;
                multiEntityDropdown.style.display = 'none';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.entity-selector')) {
                entityDropdown.style.display = 'none';
                multiEntityDropdown.style.display = 'none';
            }
        });
        
        // Add type button
        document.getElementById('add-type-btn')?.addEventListener('click', () => {
            this.addType();
        });
        
        // Add world button
        document.getElementById('add-world-btn')?.addEventListener('click', () => {
            this.addTag('world');
        });
        
        // Biome search
        const biomeSearch = document.getElementById('biome-search');
        const biomeDropdown = document.getElementById('biome-dropdown');
        
        biomeSearch?.addEventListener('focus', () => {
            biomeDropdown.style.display = 'block';
            this.updateSelectedBiomes();
        });
        
        biomeSearch?.addEventListener('input', (e) => {
            this.filterBiomes(e.target.value);
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.biome-selector') && !e.target.closest('.structure-selector')) {
                biomeDropdown.style.display = 'none';
                structureDropdown.style.display = 'none';
            }
        });
        
        // Biome checkboxes
        biomeDropdown?.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.toggleBiome(e.target.value, e.target.checked);
            }
        });
        
        // Structure search
        const structureSearch = document.getElementById('structure-search');
        const structureDropdown = document.getElementById('structure-dropdown');
        
        structureSearch?.addEventListener('focus', () => {
            this.positionDropdown(structureSearch, structureDropdown);
            structureDropdown.style.display = 'block';
            this.updateSelectedStructures();
        });
        
        // Reposition on window resize
        window.addEventListener('resize', () => {
            if (structureDropdown?.style.display === 'block') {
                this.positionDropdown(structureSearch, structureDropdown);
            }
        });
        
        // Reposition on scroll
        const scrollContainer = document.querySelector('.editor-content');
        scrollContainer?.addEventListener('scroll', () => {
            if (structureDropdown?.style.display === 'block') {
                this.positionDropdown(structureSearch, structureDropdown);
            }
        }, { passive: true });
        
        structureSearch?.addEventListener('input', (e) => {
            this.filterStructures(e.target.value);
        });
        
        // Structure checkboxes
        structureDropdown?.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.toggleStructure(e.target.value, e.target.checked);
            }
        });
        
        // Input changes
        const inputs = document.querySelectorAll('#randomspawn-form-view input, #randomspawn-form-view select, #randomspawn-form-view textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateFormDataToFile();
                this.editor.markDirty();
            });
            input.addEventListener('change', () => {
                this.updateFormDataToFile();
                this.editor.markDirty();
            });
        });
        
        // Initialize collapsible cards - ensure DOM is ready
        setTimeout(() => {
            window.collapsibleManager.initializeCollapsible();
        }, 0);
    }
    
    addType() {
        const searchInput = document.getElementById('new-type-search');
        const weightInput = document.getElementById('new-type-weight');
        
        const name = searchInput.value.trim();
        const weight = parseInt(weightInput.value) || 100;
        
        if (!name) {
            this.editor.showAlert('Please select or enter a mob type', 'warning', 'Missing Mob Type');
            return;
        }
        
        const typesList = document.getElementById('types-list');
        const currentTypes = this.getCurrentTypes();
        currentTypes.push(`${name} ${weight}`);
        
        typesList.innerHTML = this.renderTypesList(currentTypes);
        searchInput.value = '';
        weightInput.value = '100';
        
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    filterEntities(search, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        const options = dropdown.querySelectorAll('.entity-option');
        const searchLower = search.toLowerCase();
        
        options.forEach(option => {
            const entity = option.dataset.entity;
            if (entity.toLowerCase().includes(searchLower)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
        
        // Show/hide group headers based on visible options
        const groups = dropdown.querySelectorAll('.entity-group');
        groups.forEach(group => {
            const visibleOptions = group.querySelectorAll('.entity-option[style=""], .entity-option:not([style])');
            group.style.display = visibleOptions.length > 0 ? '' : 'none';
        });
    }
    
    removeType(index) {
        const types = this.getCurrentTypes();
        types.splice(index, 1);
        document.getElementById('types-list').innerHTML = this.renderTypesList(types);
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    getCurrentTypes() {
        const tags = document.querySelectorAll('#types-list .tag');
        return Array.from(tags).map(tag => {
            const text = tag.textContent.trim();
            // Extract name and weight from "Name (weight)" format
            const match = text.match(/^(.+?)\s*\((\d+)\)/);
            if (match) {
                return `${match[1].trim()} ${match[2]}`;
            }
            return text;
        });
    }
    
    addTag(type) {
        const input = document.getElementById(`new-${type}`);
        const value = input.value.trim();
        
        if (!value) return;
        
        const container = document.getElementById(`${type}s-tags`);
        const currentTags = this.getTagValues(type);
        currentTags.push(value);
        
        container.innerHTML = this.renderTags(currentTags, type);
        input.value = '';
        
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    removeTag(type, index) {
        const tags = this.getTagValues(type);
        tags.splice(index, 1);
        document.getElementById(`${type}s-tags`).innerHTML = this.renderTags(tags, type);
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    getTagValues(type) {
        const tags = document.querySelectorAll(`#${type}s-tags .tag`);
        return Array.from(tags).map(tag => tag.textContent.trim());
    }
    
    filterBiomes(search) {
        const options = document.querySelectorAll('.biome-option');
        const searchLower = search.toLowerCase();
        
        options.forEach(option => {
            const biome = option.dataset.biome;
            if (biome.toLowerCase().includes(searchLower)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
    }
    
    updateSelectedBiomes() {
        const selected = this.getTagValues('biome');
        const checkboxes = document.querySelectorAll('#biome-dropdown input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected.includes(checkbox.value);
        });
    }
    
    toggleBiome(biome, checked) {
        const container = document.getElementById('biomes-tags');
        const currentBiomes = this.getTagValues('biome');
        
        if (checked && !currentBiomes.includes(biome)) {
            currentBiomes.push(biome);
        } else if (!checked) {
            const index = currentBiomes.indexOf(biome);
            if (index > -1) currentBiomes.splice(index, 1);
        }
        
        container.innerHTML = this.renderTags(currentBiomes, 'biome');
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    positionDropdown(input, dropdown) {
        const rect = input.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownMaxHeight = 300;
        
        // Calculate available space below and above
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Position horizontally
        let left = rect.left;
        let width = Math.min(rect.width, viewportWidth - rect.left - 20); // Leave 20px margin from right edge
        
        // If dropdown would go off the right edge, align it to the right edge
        if (left + width > viewportWidth - 20) {
            left = Math.max(20, viewportWidth - width - 20);
        }
        
        dropdown.style.left = `${left}px`;
        dropdown.style.width = `${width}px`;
        
        // Position vertically - prefer below, but flip above if not enough space
        if (spaceBelow >= dropdownMaxHeight || spaceBelow >= spaceAbove) {
            // Show below
            dropdown.style.top = `${rect.bottom + 2}px`;
            dropdown.style.bottom = 'auto';
            dropdown.style.maxHeight = `${Math.min(dropdownMaxHeight, spaceBelow - 10)}px`;
        } else {
            // Show above
            dropdown.style.bottom = `${viewportHeight - rect.top + 2}px`;
            dropdown.style.top = 'auto';
            dropdown.style.maxHeight = `${Math.min(dropdownMaxHeight, spaceAbove - 10)}px`;
        }
    }
    
    filterStructures(search) {
        const options = document.querySelectorAll('.structure-option');
        const searchLower = search.toLowerCase();
        
        options.forEach(option => {
            const structure = option.dataset.structure;
            if (structure.toLowerCase().includes(searchLower)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
        
        // Show/hide group headers based on visible options
        const groups = document.querySelectorAll('.structure-group');
        groups.forEach(group => {
            const visibleOptions = group.querySelectorAll('.structure-option:not([style*="display: none"])');
            group.style.display = visibleOptions.length > 0 ? '' : 'none';
        });
    }
    
    updateSelectedStructures() {
        const selected = this.getTagValues('structure');
        const checkboxes = document.querySelectorAll('#structure-dropdown input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected.includes(checkbox.value);
        });
    }
    
    toggleStructure(structure, checked) {
        const container = document.getElementById('structures-tags');
        const currentStructures = this.getTagValues('structure');
        
        if (checked && !currentStructures.includes(structure)) {
            currentStructures.push(structure);
        } else if (!checked) {
            const index = currentStructures.indexOf(structure);
            if (index > -1) currentStructures.splice(index, 1);
        }
        
        container.innerHTML = this.renderTags(currentStructures, 'structure');
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    /**
     * Render condition list as interactive cards
     */
    renderConditionList(conditions) {
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
            return '<p class="empty-state" style="color: var(--text-secondary); font-style: italic; margin: 10px 0;">📋<br>No conditions added yet. Click "Browse Conditions" to add.</p>';
        }
        
        return conditions.map((cond, index) => {
            const { conditionStr, action, actionParam } = this.parseCondition(cond);
            const actionDisplay = actionParam ? `${action} ${actionParam}` : action;
            
            return `
                <div class="condition-item" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    margin-bottom: 8px;
                ">
                    <code style="flex: 1; font-size: 0.9em;">${this.escapeHtml(conditionStr)}</code>
                    <button class="btn-sm" onclick="window.randomspawnEditor.toggleConditionAction(${index})" title="Click to toggle true/false" style="
                        padding: 4px 8px;
                        background: ${action === 'true' ? '#10b98144' : action === 'false' ? '#ef444444' : '#3b82f644'};
                        border: 1px solid ${action === 'true' ? '#10b981' : action === 'false' ? '#ef4444' : '#3b82f6'};
                        border-radius: 4px;
                        font-size: 0.85em;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${this.escapeHtml(actionDisplay)}</button>
                    <button class="btn-icon" onclick="window.randomspawnEditor.editCondition(${index})" title="Edit condition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="window.randomspawnEditor.removeCondition(${index})" title="Remove condition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Parse condition string to extract condition and action
     */
    parseCondition(conditionStr) {
        if (!conditionStr) return { conditionStr: '', action: 'true', actionParam: null };
        
        let str = conditionStr.trim();
        if (str.startsWith('- ')) str = str.substring(2);
        
        const actionMatch = str.match(/\s+(true|false|power|cast|castinstead|orElseCast|cancel)(?:\s+(.+))?$/);
        
        if (actionMatch) {
            const conditionPart = str.substring(0, actionMatch.index);
            const action = actionMatch[1];
            const actionParam = actionMatch[2] || null;
            return { conditionStr: conditionPart, action, actionParam };
        }
        
        return { conditionStr: str, action: 'true', actionParam: null };
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Open condition browser
     */
    openConditionBrowser() {
        if (!window.conditionBrowser) {
            if (typeof ConditionBrowser === 'undefined') {
                this.editor.showToast('Condition Browser not loaded', 'error');
                return;
            }
            window.conditionBrowser = new ConditionBrowser();
        }
        
        const spawn = this.editor.state.currentFile;
        if (!spawn) return;
        
        window.conditionBrowser.open({
            usageMode: 'yaml',
            context: 'Conditions',
            onSelect: (result) => {
                if (!result || !result.conditionString) {
                    return;
                }
                
                const action = result.action || 'true';
                const actionParam = result.actionParam || '';
                const conditionEntry = actionParam 
                    ? `${result.conditionString} ${action} ${actionParam}`
                    : `${result.conditionString} ${action}`;
                
                if (!spawn.Conditions) {
                    spawn.Conditions = [];
                }
                
                spawn.Conditions.push(conditionEntry);
                this.refreshConditionList();
                this.updateFormDataToFile();
                this.editor.markDirty();
                this.editor.showToast('Condition added', 'success');
            }
        });
    }
    
    /**
     * Refresh condition list display
     */
    refreshConditionList() {
        const spawn = this.editor.state.currentFile;
        if (!spawn) return;
        
        const container = document.getElementById('conditions-list');
        if (container) {
            container.innerHTML = this.renderConditionList(spawn.Conditions || []);
        }
        
        // Update count badge
        const badge = document.querySelector('.card-title .count-badge');
        if (badge) {
            const count = spawn.Conditions?.length || 0;
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    /**
     * Toggle condition action between true/false
     */
    toggleConditionAction(index) {
        const spawn = this.editor.state.currentFile;
        if (!spawn || !spawn.Conditions || !spawn.Conditions[index]) return;
        
        const { conditionStr, action, actionParam } = this.parseCondition(spawn.Conditions[index]);
        const newAction = action === 'true' ? 'false' : 'true';
        const newCondition = actionParam 
            ? `${conditionStr} ${newAction} ${actionParam}`
            : `${conditionStr} ${newAction}`;
        
        spawn.Conditions[index] = newCondition;
        this.refreshConditionList();
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    /**
     * Edit a condition
     */
    editCondition(index) {
        const spawn = this.editor.state.currentFile;
        if (!spawn || !spawn.Conditions || !spawn.Conditions[index]) return;
        
        // TODO: Implement edit functionality if needed
        this.editor.showToast('Edit via Browse Conditions for now', 'info');
    }
    
    /**
     * Remove a condition
     */
    removeCondition(index) {
        const spawn = this.editor.state.currentFile;
        if (!spawn || !spawn.Conditions) return;
        
        spawn.Conditions.splice(index, 1);
        this.refreshConditionList();
        this.updateFormDataToFile();
        this.editor.markDirty();
        this.editor.showToast('Condition removed', 'success');
    }
    
    updateFormDataToFile() {
        const data = this.collectFormData();
        const file = this.editor.state.currentFile;
        
        if (file) {
            const oldName = file.name;
            Object.assign(file, data);
            this.editor.updateYAMLPreview();
            // Refresh file tree if name changed
            if (oldName !== data.name) {
                this.editor.packManager.renderPackTree();
            }
        }
    }
    
    async save() {
        const data = this.collectFormData();
        const file = this.editor.state.currentFile;
        
        if (!file) return;
        
        const saveBtn = document.getElementById('save-randomspawn');
        const originalHTML = saveBtn?.innerHTML;
        
        try {
            // Show saving state
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
            
            Object.assign(file, data);
            
            // Mark dirty and use the main save system
            this.editor.markDirty();
            await this.editor.saveCurrentFile();
        } finally {
            // Restore button state
            if (saveBtn && originalHTML) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHTML;
            }
        }
    }
    
    collectFormData() {
        const data = {
            name: document.getElementById('spawn-name')?.value || '',
            Action: document.getElementById('spawn-action')?.value || 'ADD',
            Level: parseInt(document.getElementById('spawn-level')?.value) || 1,
            Chance: parseFloat(document.getElementById('spawn-chance')?.value) || 0.1,
            Priority: parseInt(document.getElementById('spawn-priority')?.value) || 1,
            UseWorldScaling: document.getElementById('spawn-worldscaling')?.checked || false,
            Worlds: this.getTagValues('world'),
            Biomes: this.getTagValues('biome'),
            Reason: document.getElementById('spawn-reason')?.value || 'NATURAL',
            PositionType: document.querySelector('input[name="position-type"]:checked')?.value || 'LAND',
            Cooldown: parseInt(document.getElementById('spawn-cooldown')?.value) || 0,
            Structures: this.getTagValues('structure'),
            Conditions: this.conditionsEditor ? this.conditionsEditor.getConditions() : []
        };
        
        // Handle Type vs Types
        if (this.isMultiTypeMode) {
            data.Types = this.getCurrentTypes();
            delete data.Type;
        } else {
            data.Type = document.getElementById('spawn-type-search')?.value || '';
            delete data.Types;
        }
        
        return data;
    }
    
    /**
     * Add a new spawn section to the current file
     */
    async addNewSection() {
        let newName = await this.editor.showPrompt('New Spawn', 'Enter name for new spawn:');
        if (!newName || newName.trim() === '') return;
        newName = this.editor.sanitizeInternalName(newName);
        
        // Find the parent file for the current spawn
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A spawn with that name already exists in this file', 'error');
            return;
        }
        
        // Create new spawn with defaults
        const newSpawn = {
            id: 'randomspawn-' + Date.now(),
            name: newName.trim(),
            Action: 'ADD',
            Type: 'ZOMBIE',
            Chance: 0.1,
            Worlds: [],
            Biomes: []
        };
        
        // Add to parent file's entries
        parentFile.entries.push(newSpawn);
        
        // Open the new spawn
        newSpawn._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(newSpawn, 'randomspawn');
        this.editor.showToast(`Created new spawn "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'randomspawn');
        }
    }
    
    /**
     * Duplicate the current spawn within the same file
     */
    async duplicateRandomSpawn() {
        const file = this.editor.state.currentFile;
        if (!file) {
            this.editor.showToast('No spawn is currently loaded to duplicate.', 'error');
            return;
        }
        
        let newName = await this.editor.showPrompt('Duplicate Spawn', 'Enter name for duplicated spawn:', file.name + '_copy');
        if (!newName || newName.trim() === '') return;
        newName = this.editor.sanitizeInternalName(newName);
        
        // Find the parent file for the current spawn
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A spawn with that name already exists in this file', 'error');
            return;
        }
        
        // Create a deep copy
        const newSpawn = typeof structuredClone !== 'undefined' ? structuredClone(file) : JSON.parse(JSON.stringify(file));
        newSpawn.name = newName.trim();
        newSpawn.id = 'randomspawn-' + Date.now();
        delete newSpawn._parentFile;
        
        // Add to parent file's entries
        parentFile.entries.push(newSpawn);
        
        // Open the new spawn
        newSpawn._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(newSpawn, 'randomspawn');
        this.editor.showToast(`Duplicated spawn as "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'randomspawn');
        }
    }
    
    /**
     * Find the parent file for the current spawn
     */
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.randomspawns) return null;
        
        const currentSpawn = this.editor.state.currentFile;
        
        // Check if _parentFile reference exists
        if (currentSpawn._parentFile) {
            return pack.randomspawns.find(f => f.id === currentSpawn._parentFile.id);
        }
        
        // Search all files for this spawn
        for (const file of pack.randomspawns) {
            if (file.entries && file.entries.some(e => e.id === currentSpawn.id)) {
                return file;
            }
        }
        
        return null;
    }
    
    /**
     * Rename the current spawn
     */
    async renameRandomSpawn() {
        const file = this.editor.state.currentFile;
        if (!file) {
            this.editor.showToast('No spawn is currently loaded to rename.', 'error');
            return;
        }
        
        let newName = await this.editor.showPrompt('Rename Spawn', 'Enter new name for the spawn:', file.name);
        if (!newName || newName.trim() === '' || newName.trim() === file.name) return;
        newName = this.editor.sanitizeInternalName(newName);
        
        // Find the parent file for the current spawn
        const parentFile = this.findParentFile();
        
        // Check if name already exists in this file
        if (parentFile && parentFile.entries.some(e => e.name === newName.trim() && e.id !== file.id)) {
            this.editor.showToast('A spawn with that name already exists in this file', 'error');
            return;
        }
        
        const oldName = file.name;
        file.name = newName.trim();
        
        // Update the UI
        this.render(file);
        this.editor.showToast(`Renamed spawn from "${oldName}" to "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.render();
        }
    }
    
    /**
     * Delete the current spawn
     */
    async deleteRandomSpawn() {
        const file = this.editor.state.currentFile;
        if (!file) {
            this.editor.showToast('No spawn is currently loaded to delete.', 'error');
            return;
        }
        
        const confirmed = await this.editor.showConfirmDialog(
            'Delete Spawn',
            `Delete spawn "${file.name}"? This cannot be undone.`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        // Find parent file
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        const spawnName = file.name;
        
        // Remove from entries
        parentFile.entries = parentFile.entries.filter(e => e.id !== file.id);
        
        // Update pack tree
        this.editor.packManager.updateFileContainer(parentFile.id, 'randomspawn');
        
        // Show success message
        this.editor.showToast(`Spawn "${spawnName}" deleted`, 'success');
        this.editor.markDirty();
        
        // Navigate to appropriate view
        if (parentFile.entries.length > 0) {
            this.editor.openFile(parentFile.entries[0], 'randomspawn');
        } else {
            this.editor.openFile(parentFile, 'randomspawn');
        }
    }
    
    renderFileContainer(fileContainer, container) {
        container.innerHTML = `
            <div class="file-container-view">
                <div class="file-container-header">
                    <i class="fas fa-file-code" style="font-size: 4rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <h2>${fileContainer._fileName}</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        This file contains ${fileContainer._file.entries.length} spawn(s)
                    </p>
                </div>
                <div class="file-container-actions">
                    <button class="btn btn-primary btn-large" id="add-spawn-to-file">
                        <i class="fas fa-plus"></i> Add New RandomSpawn to this File
                    </button>
                </div>
                <div class="file-container-info" style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 0.5rem;">
                    <p style="margin: 0; color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> 
                        Click on a spawn in the file tree to edit it, or click the button above to add a new spawn to this file.
                    </p>
                </div>
            </div>
        `;
        document.getElementById('add-spawn-to-file')?.addEventListener('click', () => {
            this.addNewSection();
        });
    }
    
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.randomspawns) return null;
        if (this.currentSpawn._isFileContainer) {
            return this.currentSpawn._file;
        }
        if (this.currentSpawn._parentFile) {
            return pack.randomspawns.find(f => f.id === this.currentSpawn._parentFile.id);
        }
        for (const file of pack.randomspawns) {
            if (file.entries && file.entries.some(e => e.id === this.currentSpawn.id)) {
                return file;
            }
        }
        return null;
    }
    
    /**
     * Render condition list as interactive cards
     */
    renderConditionList(conditions) {
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
            return '<p class="empty-state" style="color: var(--text-secondary); font-style: italic; margin: 10px 0;">📋<br>No conditions added yet. Click "Browse Conditions" to add.</p>';
        }
        
        return conditions.map((cond, index) => {
            const { conditionStr, action, actionParam } = this.parseCondition(cond);
            const actionDisplay = actionParam ? `${action} ${actionParam}` : action;
            
            return `
                <div class="condition-item" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    margin-bottom: 8px;
                ">
                    <code style="flex: 1; font-size: 0.9em;">${this.escapeHtml(conditionStr)}</code>
                    <button class="btn-sm" onclick="window.randomspawnEditor.toggleConditionAction(${index})" title="Click to toggle true/false" style="
                        padding: 4px 8px;
                        background: ${action === 'true' ? '#10b98144' : action === 'false' ? '#ef444444' : '#3b82f644'};
                        border: 1px solid ${action === 'true' ? '#10b981' : action === 'false' ? '#ef4444' : '#3b82f6'};
                        border-radius: 4px;
                        font-size: 0.85em;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${this.escapeHtml(actionDisplay)}</button>
                    <button class="btn-icon" onclick="window.randomspawnEditor.editCondition(${index})" title="Edit condition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="window.randomspawnEditor.removeCondition(${index})" title="Remove condition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Parse condition string to extract condition and action
     */
    parseCondition(conditionStr) {
        if (!conditionStr) return { conditionStr: '', action: 'true', actionParam: null };
        
        let str = conditionStr.trim();
        if (str.startsWith('- ')) str = str.substring(2);
        
        const actionMatch = str.match(/\s+(true|false|power|cast|castinstead|orElseCast|cancel)(?:\s+(.+))?$/);
        
        if (actionMatch) {
            const conditionPart = str.substring(0, actionMatch.index);
            const action = actionMatch[1];
            const actionParam = actionMatch[2] || null;
            return { conditionStr: conditionPart, action, actionParam };
        }
        
        return { conditionStr: str, action: 'true', actionParam: null };
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Open condition browser
     */
    openConditionBrowser() {
        if (!window.conditionBrowser) {
            if (typeof ConditionBrowser === 'undefined') {
                this.editor.showToast('Condition Browser not loaded', 'error');
                return;
            }
            window.conditionBrowser = new ConditionBrowser();
        }
        
        const spawn = this.editor.state.currentFile;
        if (!spawn) return;
        
        window.conditionBrowser.open({
            usageMode: 'yaml',
            context: 'Conditions',
            onSelect: (result) => {
                if (!result || !result.conditionString) {
                    return;
                }
                
                const action = result.action || 'true';
                const actionParam = result.actionParam || '';
                const conditionEntry = actionParam 
                    ? `${result.conditionString} ${action} ${actionParam}`
                    : `${result.conditionString} ${action}`;
                
                if (!spawn.Conditions) {
                    spawn.Conditions = [];
                }
                
                spawn.Conditions.push(conditionEntry);
                this.refreshConditionList();
                this.updateFormDataToFile();
                this.editor.markDirty();
                this.editor.showToast('Condition added', 'success');
            }
        });
    }
    
    /**
     * Refresh condition list display
     */
    refreshConditionList() {
        const spawn = this.editor.state.currentFile;
        if (!spawn) return;
        
        const container = document.getElementById('conditions-list');
        if (container) {
            container.innerHTML = this.renderConditionList(spawn.Conditions || []);
        }
        
        // Update count badge
        const badge = document.querySelector('.card-title .count-badge');
        if (badge) {
            const count = spawn.Conditions?.length || 0;
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    /**
     * Toggle condition action between true/false
     */
    toggleConditionAction(index) {
        const spawn = this.editor.state.currentFile;
        if (!spawn || !spawn.Conditions || !spawn.Conditions[index]) return;
        
        const { conditionStr, action, actionParam } = this.parseCondition(spawn.Conditions[index]);
        const newAction = action === 'true' ? 'false' : 'true';
        const newCondition = actionParam 
            ? `${conditionStr} ${newAction} ${actionParam}`
            : `${conditionStr} ${newAction}`;
        
        spawn.Conditions[index] = newCondition;
        this.refreshConditionList();
        this.updateFormDataToFile();
        this.editor.markDirty();
    }
    
    /**
     * Edit a condition
     */
    editCondition(index) {
        const spawn = this.editor.state.currentFile;
        if (!spawn || !spawn.Conditions || !spawn.Conditions[index]) return;
        
        // TODO: Implement edit functionality if needed
        this.editor.showToast('Edit via Browse Conditions for now', 'info');
    }
    
    /**
     * Remove a condition
     */
    removeCondition(index) {
        const spawn = this.editor.state.currentFile;
        if (!spawn || !spawn.Conditions) return;
        
        spawn.Conditions.splice(index, 1);
        this.refreshConditionList();
        this.updateFormDataToFile();
        this.editor.markDirty();
        this.editor.showToast('Condition removed', 'success');
    }
}

window.RandomSpawnEditor = RandomSpawnEditor;
