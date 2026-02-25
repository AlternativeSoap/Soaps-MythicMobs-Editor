/**
 * Spawner Editor Component
 * Editor for MythicMobs Spawner configuration files
 * 
 * IMPORTANT: Spawner files can only be edited when server is stopped.
 * Once loaded by a running server, use in-game commands to edit.
 */

class SpawnerEditor {
    constructor(editor) {
        this.editor = editor;
        this.spawnerData = {};
        this.isInitialized = false;
        this.collapsedSections = this.loadCollapsedSections();
        
        // Initialize data constants
        this.initializeConstants();
    }
    
    /**
     * Load collapsed sections state from localStorage
     */
    loadCollapsedSections() {
        try {
            const saved = localStorage.getItem('spawnerEditorCollapsed');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }
    
    /**
     * Save collapsed sections state to localStorage
     */
    saveCollapsedSections() {
        try {
            localStorage.setItem('spawnerEditorCollapsed', JSON.stringify(this.collapsedSections));
        } catch (e) {
            console.warn('Could not save collapsed sections state:', e);
        }
    }
    
    initializeConstants() {
        // World options - common world names
        this.COMMON_WORLDS = [
            'world',
            'world_nether',
            'world_the_end',
            'spawn',
            'resource',
            'dungeon',
            'arena',
            'hub'
        ];
        
        // Default spawner configuration
        this.DEFAULT_SPAWNER = {
            MobName: '',
            World: 'world',
            SpawnerGroup: '',
            X: 0,
            Y: 64,
            Z: 0,
            Radius: 0,
            RadiusY: 0,
            UseTimer: true,
            MaxMobs: 1,
            MobLevel: 1,
            MobsPerSpawn: 1,
            Cooldown: 0,
            CooldownTimer: 0,
            Warmup: 0,
            WarmupTimer: 0,
            CheckForPlayers: true,
            ActivationRange: 40,
            LeashRange: 32,
            HealOnLeash: false,
            ResetThreatOnLeash: false,
            ShowFlames: false,
            Breakable: false,
            Conditions: [],
            ActiveMobs: 0
        };
        
        // Tooltips/descriptions for each field
        this.FIELD_DESCRIPTIONS = {
            MobName: 'The internal name of the mob to spawn (from your mob configs)',
            World: 'The name of the world where the spawner is located',
            SpawnerGroup: 'Optional group name for managing multiple spawners together',
            X: 'X coordinate of the spawner location',
            Y: 'Y coordinate (height) of the spawner location',
            Z: 'Z coordinate of the spawner location',
            Radius: 'Horizontal radius (in blocks) around the spawner where mobs can spawn',
            RadiusY: 'Vertical radius (in blocks) around the spawner where mobs can spawn',
            UseTimer: 'Whether to use the cooldown/warmup timer system',
            MaxMobs: 'Maximum number of mobs that can be alive from this spawner at once',
            MobLevel: 'Level of the spawned mobs (for scaled mobs)',
            MobsPerSpawn: 'Number of mobs to spawn each time the spawner activates',
            Cooldown: 'Time in seconds between spawn cycles (base value)',
            CooldownTimer: 'Current cooldown timer value (usually managed by server)',
            Warmup: 'Time in seconds before first spawn after activation',
            WarmupTimer: 'Current warmup timer value (usually managed by server)',
            CheckForPlayers: 'Only spawn when a player is within ActivationRange',
            ActivationRange: 'Distance (in blocks) a player must be within to activate spawner',
            LeashRange: 'Maximum distance mobs can travel from spawner before being pulled back',
            HealOnLeash: 'Whether mobs heal when they are leashed back to the spawner',
            ResetThreatOnLeash: 'Whether mob threat/aggro is reset when leashed back',
            ShowFlames: 'Show flame particles at the spawner location',
            Breakable: 'Whether the spawner block can be broken by players',
            Conditions: 'Conditions that must be met for the spawner to activate',
            ActiveMobs: 'Current count of active mobs from this spawner (managed by server)'
        };
    }
    
    /**
     * Render a collapsible card section
     */
    renderCollapsibleCard(id, icon, title, content, defaultCollapsed = false) {
        const isCollapsed = this.collapsedSections[id] ?? defaultCollapsed;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}" data-section-id="${id}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="${icon}"></i> ${title}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    ${content}
                </div>
            </div>
        `;
    }
    
    /**
     * Render the spawner editor interface
     */
    render(spawner = null) {
        this.spawnerData = spawner ? { ...this.DEFAULT_SPAWNER, ...spawner } : { ...this.DEFAULT_SPAWNER };
        
        const container = document.createElement('div');
        container.className = 'spawner-editor';
        
        // Get current mode for badge
        const currentMode = this.editor?.state?.currentMode || 'beginner';
        const modeLabel = currentMode === 'guided' ? 'Guided' : (currentMode === 'advanced' ? 'Advanced' : 'Beginner');
        const modeBadgeClass = currentMode === 'guided' ? 'guided' : (currentMode === 'advanced' ? 'advanced' : 'beginner');
        
        container.innerHTML = `
            <!-- Warning Banner (Non-expandable) -->
            <div class="spawner-warning-compact">
                <div class="warning-icon-small">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="warning-text">
                    <strong>Server Must Be Stopped</strong> - Spawners loaded by a running server can only be edited via in-game commands
                </div>
            </div>
            
            <!-- Editor Header -->
            <div class="editor-header">
                <h2>
                    <i class="fas fa-dungeon"></i>
                    Spawner Editor
                    <span class="spawner-name">${this.escapeHtml(this.spawnerData.SpawnerGroup || this.spawnerData.MobName || 'New Spawner')}</span>
                    <span class="mode-badge ${modeBadgeClass}">${modeLabel} Mode</span>
                </h2>
                <div class="editor-actions">
                    <div class="action-group secondary-actions">
                        <button class="btn btn-outline" id="duplicate-spawner" title="Create a copy of this spawner (Ctrl+D)">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline btn-danger" id="delete-spawner" title="Delete this spawner">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-secondary" id="new-spawner-section" title="Create a new spawner YML file">
                            <i class="fas fa-plus"></i> New YML
                        </button>
                    </div>
                    <button class="btn btn-primary" id="save-spawner" title="Save current file (Ctrl+S)">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>

            <div class="editor-content spawner-editor-content">
                ${this.renderBasicSection()}
                ${this.renderLocationSection()}
                ${this.renderSpawnSettingsSection()}
                ${this.renderTimerSection()}
                ${this.renderBehaviorSection()}
                ${this.renderConditionsSection()}
            </div>
        `;
        
        return container;
    }
    
    /**
     * Render Basic Configuration Section
     */
    renderBasicSection() {
        const content = `
            <div class="form-group mob-picker-section">
                <label class="form-label">
                    Mob Name <span class="required">*</span>
                </label>
                <input type="hidden" id="spawnerMobName" value="${this.escapeHtml(this.spawnerData.MobName || '')}">
                ${this.createEntityPickerHTML('spawnerMobName')}
                <small class="form-hint">The MythicMobs mob type to spawn</small>
            </div>
            
            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">
                        World <span class="required">*</span>
                    </label>
                    <input type="text" class="form-input" id="spawnerWorld" 
                           placeholder="e.g., world" 
                           value="${this.escapeHtml(this.spawnerData.World || 'world')}"
                           list="worldSuggestions">
                    <datalist id="worldSuggestions">
                        ${this.COMMON_WORLDS.map(w => `<option value="${w}">`).join('')}
                    </datalist>
                    <small class="form-hint">Minecraft world name</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        Spawner Group
                    </label>
                    <input type="text" class="form-input" id="spawnerGroup" 
                           placeholder="Optional - group multiple spawners" 
                           value="${this.escapeHtml(this.spawnerData.SpawnerGroup || '')}">
                    <small class="form-hint">Used for batch operations (optional)</small>
                </div>
            </div>
        `;
        
        return this.renderCollapsibleCard('basic', 'fas fa-cog', 'Basic Configuration', content, false);
    }
    
    /**
     * Render Location Section
     */
    renderLocationSection() {
        const content = `
            <div class="coordinate-group">
                <div class="form-group">
                    <label class="form-label">X</label>
                    <input type="number" class="form-input" id="spawnerX" value="${this.spawnerData.X || 0}">
                </div>
                <div class="form-group">
                    <label class="form-label">Y</label>
                    <input type="number" class="form-input" id="spawnerY" value="${this.spawnerData.Y || 64}">
                </div>
                <div class="form-group">
                    <label class="form-label">Z</label>
                    <input type="number" class="form-input" id="spawnerZ" value="${this.spawnerData.Z || 0}">
                </div>
            </div>
            
            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">
                        Spawn Radius
                    </label>
                    <input type="number" class="form-input" id="spawnerRadius" min="0" value="${this.spawnerData.Radius || 0}">
                    <small class="form-hint">Horizontal blocks from spawner</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        Vertical Radius
                    </label>
                    <input type="number" class="form-input" id="spawnerRadiusY" min="0" value="${this.spawnerData.RadiusY || 0}">
                    <small class="form-hint">Vertical blocks from spawner</small>
                </div>
            </div>
        `;
        
        return this.renderCollapsibleCard('location', 'fas fa-map-marker-alt', 'Location & Area', content, false);
    }
    
    /**
     * Render Spawn Settings Section
     */
    renderSpawnSettingsSection() {
        const content = `
            <div class="grid-3">
                <div class="form-group">
                    <label class="form-label">
                        Max Mobs
                    </label>
                    <input type="number" class="form-input" id="spawnerMaxMobs" min="1" value="${this.spawnerData.MaxMobs || 1}">
                    <small class="form-hint">Max alive at once</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        Per Spawn
                    </label>
                    <input type="number" class="form-input" id="spawnerMobsPerSpawn" min="1" value="${this.spawnerData.MobsPerSpawn || 1}">
                    <small class="form-hint">Spawned each cycle</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        Mob Level
                    </label>
                    <input type="number" class="form-input" id="spawnerMobLevel" min="1" value="${this.spawnerData.MobLevel || 1}">
                    <small class="form-hint">For scaled mobs</small>
                </div>
            </div>
        `;
        
        return this.renderCollapsibleCard('spawn', 'fas fa-skull', 'Spawn Settings', content, false);
    }
    
    /**
     * Render Timer Section
     */
    renderTimerSection() {
        const useTimer = this.spawnerData.UseTimer !== false;
        const content = `
            <div class="toggle-row">
                <label class="toggle-label">
                    <input type="checkbox" id="spawnerUseTimer" ${useTimer ? 'checked' : ''}>
                    <span class="toggle-switch"></span>
                    <span class="toggle-text">Enable Timer System</span>
                </label>
                <span class="toggle-hint">Controls spawn cooldown and warmup</span>
            </div>
            
            <div class="timer-fields ${!useTimer ? 'disabled' : ''}" id="timerFieldsContainer">
                <div class="grid-2">
                    <div class="form-group">
                        <label class="form-label">
                            Cooldown
                        </label>
                        <div class="input-with-suffix">
                            <input type="number" class="form-input" id="spawnerCooldown" min="0" value="${this.spawnerData.Cooldown || 0}">
                            <span class="input-suffix">seconds</span>
                        </div>
                        <small class="form-hint">Time between spawns</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Warmup
                        </label>
                        <div class="input-with-suffix">
                            <input type="number" class="form-input" id="spawnerWarmup" min="0" value="${this.spawnerData.Warmup || 0}">
                            <span class="input-suffix">seconds</span>
                        </div>
                        <small class="form-hint">Delay before first spawn</small>
                    </div>
                </div>
            </div>
        `;
        
        return this.renderCollapsibleCard('timer', 'fas fa-clock', 'Timer Settings', content, true);
    }
    
    /**
     * Render Behavior Section (combines activation, leash, and misc)
     */
    renderBehaviorSection() {
        const content = `
            <div class="behavior-subsection">
                <h4 class="subsection-title"><i class="fas fa-bolt"></i> Activation</h4>
                <div class="toggle-row">
                    <label class="toggle-label">
                        <input type="checkbox" id="spawnerCheckForPlayers" ${this.spawnerData.CheckForPlayers !== false ? 'checked' : ''}>
                        <span class="toggle-switch"></span>
                        <span class="toggle-text">Require Player Nearby</span>
                    </label>
                </div>
                <div class="form-group inline-form">
                    <label class="form-label">Activation Range</label>
                    <div class="input-with-suffix compact">
                        <input type="number" class="form-input" id="spawnerActivationRange" min="1" value="${this.spawnerData.ActivationRange || 40}">
                        <span class="input-suffix">blocks</span>
                    </div>
                </div>
            </div>
            
            <div class="behavior-subsection">
                <h4 class="subsection-title"><i class="fas fa-link"></i> Leashing</h4>
                <div class="form-group inline-form">
                    <label class="form-label">Leash Range</label>
                    <div class="input-with-suffix compact">
                        <input type="number" class="form-input" id="spawnerLeashRange" min="0" value="${this.spawnerData.LeashRange || 32}">
                        <span class="input-suffix">blocks</span>
                    </div>
                </div>
                <div class="checkbox-row">
                    <label class="checkbox-label">
                        <input type="checkbox" id="spawnerHealOnLeash" ${this.spawnerData.HealOnLeash ? 'checked' : ''}>
                        <span class="checkbox-box"></span>
                        <span>Heal mob when leashed back</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="spawnerResetThreatOnLeash" ${this.spawnerData.ResetThreatOnLeash ? 'checked' : ''}>
                        <span class="checkbox-box"></span>
                        <span>Reset threat when leashed</span>
                    </label>
                </div>
            </div>
            
            <div class="behavior-subsection">
                <h4 class="subsection-title"><i class="fas fa-eye"></i> Visual & Misc</h4>
                <div class="checkbox-row">
                    <label class="checkbox-label">
                        <input type="checkbox" id="spawnerShowFlames" ${this.spawnerData.ShowFlames ? 'checked' : ''}>
                        <span class="checkbox-box"></span>
                        <span>Show flame particles</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="spawnerBreakable" ${this.spawnerData.Breakable ? 'checked' : ''}>
                        <span class="checkbox-box"></span>
                        <span>Spawner is breakable</span>
                    </label>
                </div>
            </div>
        `;
        
        return this.renderCollapsibleCard('behavior', 'fas fa-sliders-h', 'Behavior & Options', content, true);
    }
    
    /**
     * Render Conditions Section
     */
    renderConditionsSection() {
        const content = `
            <div class="conditions-header">
                <p class="conditions-description">
                    Add conditions to control when the spawner activates. 
                    <a href="https://git.mythiccraft.io/mythiccraft/MythicMobs/-/wikis/Skills/conditions" target="_blank" rel="noopener">
                        View all conditions <i class="fas fa-external-link-alt"></i>
                    </a>
                </p>
                <button type="button" class="btn btn-sm btn-primary" id="addConditionBtn">
                    <i class="fas fa-plus"></i> Browse Conditions
                </button>
            </div>
            
            <div class="conditions-list" id="spawnerConditionsList">
                ${this.renderConditions()}
            </div>
        `;
        
        return this.renderCollapsibleCard('conditions', 'fas fa-filter', 'Spawn Conditions', content, true);
    }
    
    /**
     * Render conditions list
     */
    renderConditions() {
        const conditions = this.spawnerData.Conditions || [];
        
        if (conditions.length === 0) {
            return `
                <div class="conditions-empty">
                    <i class="fas fa-info-circle"></i>
                    <span>No conditions set. Spawner will activate based on player proximity only.</span>
                </div>
            `;
        }
        
        return conditions.map((condition, index) => `
            <div class="condition-item" data-index="${index}">
                <span class="condition-number">${index + 1}</span>
                <div class="condition-display" data-index="${index}" title="Click to edit">
                    <code class="condition-text">${this.escapeHtml(condition)}</code>
                    <button type="button" class="btn btn-icon btn-sm edit-condition" data-index="${index}" title="Edit condition">
                        <i class="fas fa-pen"></i>
                    </button>
                </div>
                <button type="button" class="btn btn-icon btn-danger remove-condition" data-index="${index}" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * Attach event listeners after rendering
     */
    attachEventListeners(container) {
        // Collapsible sections
        container.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.closest('.collapsible-card');
                const sectionId = card?.dataset.sectionId;
                if (card && sectionId) {
                    card.classList.toggle('collapsed');
                    this.collapsedSections[sectionId] = card.classList.contains('collapsed');
                    this.saveCollapsedSections();
                }
            });
        });
        
        // Setup entity picker for mob selection
        this.setupEntityPickerHandlers();
        
        // Refresh MythicMobs category when Basic section is expanded
        const basicCard = container.querySelector('.collapsible-card[data-section-id="basic"]');
        if (basicCard) {
            const header = basicCard.querySelector('.collapsible-header');
            if (header) {
                header.addEventListener('click', () => {
                    setTimeout(() => {
                        if (!basicCard.classList.contains('collapsed')) {
                            this.refreshMythicMobsCategory();
                        }
                    }, 50);
                });
            }
        }
        
        // Add condition button
        container.querySelector('#addConditionBtn')?.addEventListener('click', () => {
            this.addCondition(container);
        });
        
        // Remove condition buttons
        container.querySelectorAll('.remove-condition').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-condition').dataset.index);
                this.removeCondition(index, container);
            });
        });
        
        // Timer checkbox toggle
        const timerCheckbox = container.querySelector('#spawnerUseTimer');
        const timerFieldsContainer = container.querySelector('#timerFieldsContainer');
        
        timerCheckbox?.addEventListener('change', (e) => {
            if (timerFieldsContainer) {
                timerFieldsContainer.classList.toggle('disabled', !e.target.checked);
            }
            this.updateYAMLPreview();
        });
        
        // All form inputs - mark editor as dirty AND update YAML preview
        container.querySelectorAll('input, select, textarea').forEach(input => {
            // Skip the entity search input (handled separately)
            if (input.classList.contains('entity-search-input')) return;
            
            // Use 'input' event for real-time updates on text inputs
            input.addEventListener('input', () => {
                this.updateYAMLPreview();
            });
            
            input.addEventListener('change', () => {
                if (this.editor && typeof this.editor.markDirty === 'function') {
                    this.editor.markDirty();
                }
                this.updateYAMLPreview();
            });
        });
        
        // Save button
        container.querySelector('#save-spawner')?.addEventListener('click', async () => {
            await this.saveSpawner();
        });
        
        // Duplicate button
        container.querySelector('#duplicate-spawner')?.addEventListener('click', async () => {
            await this.duplicateSpawner();
        });
        
        // Delete button
        container.querySelector('#delete-spawner')?.addEventListener('click', async () => {
            await this.deleteSpawner();
        });
        
        // New Section button
        container.querySelector('#new-spawner-section')?.addEventListener('click', async () => {
            await this.addNewSection();
        });
        
        // Initial YAML preview update
        this.updateYAMLPreview();
    }
    
    /**
     * Update the YAML preview panel with current spawner configuration
     */
    updateYAMLPreview() {
        const preview = document.getElementById('yaml-preview-content');
        if (!preview) return;
        
        // Generate YAML from current form state
        const yaml = this.toYAML();
        
        // Only update if content changed
        if (preview.textContent !== yaml) {
            // Set flag to prevent editor from detecting this as manual edit
            if (this.editor) {
                this.editor._updatingPreview = true;
            }
            
            preview.textContent = yaml;
            
            // Store as original content
            if (this.editor) {
                this.editor._originalPreviewContent = yaml;
                this.editor._previewHasManualEdits = false;
                
                // Clear the flag after DOM update
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (this.editor) {
                            this.editor._updatingPreview = false;
                        }
                    });
                });
            }
        }
    }
    
    /**
     * Create entity picker HTML for mob selection
     * Shows MythicMobs from pack + Vanilla entity categories
     */
    createEntityPickerHTML(inputId) {
        // Get custom MythicMobs from the current pack
        const customMobs = this.getCustomMythicMobs();
        
        // Get current value
        const currentValue = this.spawnerData.MobName || '';
        
        // Categorize entities (same as mobEditor)
        const categories = {
            'Hostile': ['ZOMBIE', 'SKELETON', 'SPIDER', 'CAVE_SPIDER', 'CREEPER', 'ENDERMAN', 'WITCH', 'SLIME', 
                       'MAGMA_CUBE', 'BLAZE', 'GHAST', 'ZOMBIFIED_PIGLIN', 'HOGLIN', 'PIGLIN', 'PIGLIN_BRUTE',
                       'WITHER_SKELETON', 'STRAY', 'HUSK', 'DROWNED', 'PHANTOM', 'SILVERFISH', 'ENDERMITE',
                       'VINDICATOR', 'EVOKER', 'VEX', 'PILLAGER', 'RAVAGER', 'GUARDIAN', 'ELDER_GUARDIAN',
                       'SHULKER', 'ZOGLIN', 'WARDEN', 'BOGGED', 'BREEZE'],
            'Passive': ['PIG', 'COW', 'SHEEP', 'CHICKEN', 'RABBIT', 'HORSE', 'DONKEY', 'MULE', 'LLAMA',
                       'TRADER_LLAMA', 'CAT', 'OCELOT', 'WOLF', 'PARROT', 'BAT', 'VILLAGER', 'WANDERING_TRADER',
                       'COD', 'SALMON', 'TROPICAL_FISH', 'PUFFERFISH', 'SQUID', 'GLOW_SQUID', 'DOLPHIN',
                       'TURTLE', 'POLAR_BEAR', 'PANDA', 'FOX', 'BEE', 'MOOSHROOM', 'STRIDER', 'AXOLOTL',
                       'GOAT', 'FROG', 'TADPOLE', 'CAMEL', 'SNIFFER', 'ARMADILLO', 'ALLAY'],
            'Utility': ['IRON_GOLEM', 'SNOW_GOLEM', 'ARMOR_STAND', 'ITEM_DISPLAY', 'BLOCK_DISPLAY',
                       'TEXT_DISPLAY', 'INTERACTION', 'MARKER'],
            'Bosses': ['ENDER_DRAGON', 'WITHER']
        };
        
        // Add MythicMobs category if we have custom mobs (at the top)
        const orderedCategories = {};
        if (customMobs.length > 0) {
            orderedCategories['MythicMobs'] = customMobs;
        }
        Object.assign(orderedCategories, categories);

        return `
            <div class="entity-picker-container" data-input-id="${inputId}">
                <!-- Selected Mob Display -->
                <div class="entity-chips-container" ${currentValue ? '' : 'style="display: none;"'}>
                    <div class="entity-chips">
                        ${currentValue ? `
                            <span class="entity-chip ${customMobs.includes(currentValue) ? 'mythicmob-chip' : ''}">
                                ${customMobs.includes(currentValue) ? '🔮 ' : ''}${this.escapeHtml(currentValue)}
                                <button type="button" class="chip-remove" title="Clear">×</button>
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Entity Search -->
                <div class="entity-search-container">
                    <input type="text" 
                           class="entity-search-input" 
                           placeholder="🔍 Search mobs or type custom mob name and press Enter...">
                    <small class="entity-search-hint">Type any mob name and press <kbd>Enter</kbd> to add</small>
                </div>

                <!-- Entity Browser -->
                <div class="entity-browser">
                    ${Object.entries(orderedCategories).map(([category, entities]) => `
                        <div class="entity-category" data-category="${category}">
                            <div class="entity-category-header">
                                ${category === 'MythicMobs' ? '🔮 ' : ''}${category} (${entities.length})
                            </div>
                            <div class="entity-grid">
                                ${entities.map(entity => `
                                    <button type="button" 
                                            class="entity-item ${category === 'MythicMobs' ? 'mythicmob-item' : ''} ${entity === currentValue ? 'selected' : ''}" 
                                            data-entity="${this.escapeHtml(entity)}">
                                        ${this.escapeHtml(entity)}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Get custom MythicMobs from the current pack
     */
    getCustomMythicMobs() {
        try {
            // Try multiple paths to access packManager
            let packManager = null;
            
            // Path 1: this.editor.packManager
            if (this.editor?.packManager) {
                packManager = this.editor.packManager;
            }
            // Path 2: window.editor.packManager (global editor instance)
            else if (window.editor?.packManager) {
                packManager = window.editor.packManager;
            }
            // Path 3: window.app.packManager (fallback)
            else if (window.app?.packManager) {
                packManager = window.app.packManager;
            }
            
            if (!packManager) {
                return [];
            }
            
            const activePack = packManager.activePack;
            if (!activePack || !activePack.mobs) {
                return [];
            }
            
            const customMobs = [];
            
            // Check if using file-based structure
            if (Array.isArray(activePack.mobs) && activePack.mobs.length > 0) {
                if (activePack.mobs[0].entries !== undefined) {
                    // File-based structure
                    activePack.mobs.forEach(file => {
                        if (file.entries && Array.isArray(file.entries)) {
                            file.entries.forEach(mob => {
                                const mobName = mob.internalName || mob.name;
                                if (mobName) {
                                    customMobs.push(mobName);
                                }
                            });
                        }
                    });
                } else {
                    // Array of mob objects
                    activePack.mobs.forEach(mob => {
                        const mobName = mob.internalName || mob.name;
                        if (mobName) {
                            customMobs.push(mobName);
                        }
                    });
                }
            }
            
            return customMobs.sort();
        } catch (e) {
            console.warn('SpawnerEditor: Could not get custom MythicMobs:', e);
            return [];
        }
    }
    
    /**
     * Setup entity picker event handlers
     */
    setupEntityPickerHandlers() {
        const container = document.querySelector('.entity-picker-container[data-input-id="spawnerMobName"]');
        if (!container) return;

        const hiddenInput = document.getElementById('spawnerMobName');
        const searchInput = container.querySelector('.entity-search-input');
        const chipsContainer = container.querySelector('.entity-chips');
        const chipsWrapper = container.querySelector('.entity-chips-container');
        const entityBrowser = container.querySelector('.entity-browser');

        // Track selected entity
        let selectedEntity = hiddenInput?.value?.trim() || '';

        // Entity item click handler
        container.addEventListener('click', (e) => {
            const entityBtn = e.target.closest('.entity-item');
            if (entityBtn) {
                const entity = entityBtn.dataset.entity;
                selectedEntity = entity;
                if (hiddenInput) hiddenInput.value = entity;
                this.spawnerData.MobName = entity;
                
                // Update chip display
                this.updateEntityChip(chipsContainer, chipsWrapper, entity);
                
                // Update selection state
                container.querySelectorAll('.entity-item').forEach(btn => btn.classList.remove('selected'));
                entityBtn.classList.add('selected');
                
                // Mark dirty and update preview
                if (this.editor && typeof this.editor.markDirty === 'function') {
                    this.editor.markDirty();
                }
                this.updateYAMLPreview();
            }
            
            // Chip remove button
            if (e.target.classList.contains('chip-remove')) {
                selectedEntity = '';
                if (hiddenInput) hiddenInput.value = '';
                this.spawnerData.MobName = '';
                chipsWrapper.style.display = 'none';
                chipsContainer.innerHTML = '';
                container.querySelectorAll('.entity-item').forEach(btn => btn.classList.remove('selected'));
                
                if (this.editor && typeof this.editor.markDirty === 'function') {
                    this.editor.markDirty();
                }
                this.updateYAMLPreview();
            }
        });

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                container.querySelectorAll('.entity-item').forEach(btn => {
                    const matches = btn.dataset.entity.toLowerCase().includes(searchTerm);
                    btn.style.display = matches ? '' : 'none';
                });
                
                // Show/hide categories based on visible items
                container.querySelectorAll('.entity-category').forEach(cat => {
                    const visibleItems = cat.querySelectorAll('.entity-item[style=""], .entity-item:not([style])');
                    cat.style.display = visibleItems.length > 0 ? '' : 'none';
                });
            });
            
            // Press Enter to add custom mob name
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && searchInput.value.trim()) {
                    e.preventDefault();
                    const customName = searchInput.value.trim();
                    selectedEntity = customName;
                    if (hiddenInput) hiddenInput.value = customName;
                    this.spawnerData.MobName = customName;
                    
                    this.updateEntityChip(chipsContainer, chipsWrapper, customName);
                    searchInput.value = '';
                    
                    // Reset search filter
                    container.querySelectorAll('.entity-item').forEach(btn => btn.style.display = '');
                    container.querySelectorAll('.entity-category').forEach(cat => cat.style.display = '');
                    
                    if (this.editor && typeof this.editor.markDirty === 'function') {
                        this.editor.markDirty();
                    }
                    this.updateYAMLPreview();
                }
            });
        }
    }
    
    /**
     * Update the entity chip display
     */
    updateEntityChip(chipsContainer, chipsWrapper, entity) {
        if (!chipsContainer || !chipsWrapper) return;
        
        const customMobs = this.getCustomMythicMobs();
        const isMythicMob = customMobs.includes(entity);
        
        if (entity) {
            chipsWrapper.style.display = '';
            chipsContainer.innerHTML = `
                <span class="entity-chip ${isMythicMob ? 'mythicmob-chip' : ''}">
                    ${isMythicMob ? '🔮 ' : ''}${this.escapeHtml(entity)}
                    <button type="button" class="chip-remove" title="Clear">×</button>
                </span>
            `;
        } else {
            chipsWrapper.style.display = 'none';
            chipsContainer.innerHTML = '';
        }
    }
    
    /**
     * Refresh MythicMobs category in the entity picker
     */
    refreshMythicMobsCategory() {
        const container = document.querySelector('.entity-picker-container[data-input-id="spawnerMobName"]');
        if (!container) return;

        const customMobs = this.getCustomMythicMobs();
        const entityBrowser = container.querySelector('.entity-browser');
        if (!entityBrowser) return;

        // Find or create MythicMobs category
        let mythicCategory = entityBrowser.querySelector('.entity-category[data-category="MythicMobs"]');
        
        if (customMobs.length > 0) {
            const categoryHTML = `
                <div class="entity-category" data-category="MythicMobs">
                    <div class="entity-category-header">
                        🔮 MythicMobs (${customMobs.length})
                    </div>
                    <div class="entity-grid">
                        ${customMobs.map(entity => `
                            <button type="button" 
                                    class="entity-item mythicmob-item ${entity === this.spawnerData.MobName ? 'selected' : ''}" 
                                    data-entity="${this.escapeHtml(entity)}">
                                ${this.escapeHtml(entity)}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            if (mythicCategory) {
                // Update existing category
                mythicCategory.outerHTML = categoryHTML;
            } else {
                // Add new category at the top
                entityBrowser.insertAdjacentHTML('afterbegin', categoryHTML);
            }
        } else if (mythicCategory) {
            // Remove category if no mobs
            mythicCategory.remove();
        }
    }

    /**
     * Browse available mobs (integrates with mob list)
     * @deprecated Use entity picker instead
     */
    browseMobs() {
        // Check if there's a mob selector or pack
        if (this.editor && this.editor.currentPack && this.editor.currentPack.mobs) {
            const mobs = Object.keys(this.editor.currentPack.mobs);
            
            // Create simple mob selector
            const selector = document.createElement('div');
            selector.className = 'quick-mob-selector';
            selector.innerHTML = `
                <div class="quick-selector-overlay">
                    <div class="quick-selector-content">
                        <div class="quick-selector-header">
                            <h3>Select a Mob</h3>
                            <button class="btn-icon close-selector"><i class="fas fa-times"></i></button>
                        </div>
                        <input type="text" class="form-control mob-filter" placeholder="Filter mobs...">
                        <div class="mob-list">
                            ${mobs.length > 0 ? mobs.map(mob => `
                                <div class="mob-option" data-mob="${this.escapeHtml(mob)}">
                                    <i class="fas fa-skull"></i>
                                    <span>${this.escapeHtml(mob)}</span>
                                </div>
                            `).join('') : '<div class="no-mobs">No mobs in current pack</div>'}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(selector);
            
            // Event listeners
            selector.querySelector('.close-selector').addEventListener('click', () => selector.remove());
            selector.querySelector('.quick-selector-overlay').addEventListener('click', (e) => {
                if (e.target.classList.contains('quick-selector-overlay')) {
                    selector.remove();
                }
            });
            
            selector.querySelector('.mob-filter').addEventListener('input', (e) => {
                const filter = e.target.value.toLowerCase();
                selector.querySelectorAll('.mob-option').forEach(opt => {
                    const matches = opt.dataset.mob.toLowerCase().includes(filter);
                    opt.style.display = matches ? '' : 'none';
                });
            });
            
            selector.querySelectorAll('.mob-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const mobInput = document.getElementById('spawnerMobName');
                    if (mobInput) {
                        mobInput.value = opt.dataset.mob;
                        mobInput.dispatchEvent(new Event('change'));
                    }
                    selector.remove();
                });
            });
            
            selector.querySelector('.mob-filter').focus();
        } else {
            // Show toast/notification that no pack is loaded
            this.editor.showToast('Load a pack first to browse available mobs', 'info');
        }
    }
    
    /**
     * Add a new condition via condition browser
     */
    addCondition(container) {
        this.openConditionBrowser(container, null);
    }
    
    /**
     * Open condition browser to add or edit a condition
     */
    openConditionBrowser(container, editIndex = null) {
        // Initialize global condition browser if needed
        if (!window.conditionBrowser) {
            if (typeof ConditionBrowser === 'undefined') {
                if (this.editor && typeof this.editor.showToast === 'function') {
                    this.editor.showToast('Condition Browser not loaded', 'error');
                }
                return;
            }
            window.conditionBrowser = new ConditionBrowser();
        }
        
        window.conditionBrowser.open({
            usageMode: 'yaml',
            context: 'SpawnerConditions',
            onSelect: (result) => {
                if (!result || !result.conditionString) {
                    return;
                }
                
                const action = result.action || 'true';
                const actionParam = result.actionParam || '';
                const conditionEntry = actionParam 
                    ? `${result.conditionString} ${action} ${actionParam}`
                    : `${result.conditionString} ${action}`;
                
                if (!this.spawnerData.Conditions) {
                    this.spawnerData.Conditions = [];
                }
                
                if (editIndex !== null && editIndex >= 0) {
                    // Editing existing condition
                    this.spawnerData.Conditions[editIndex] = conditionEntry;
                } else {
                    // Adding new condition
                    this.spawnerData.Conditions.push(conditionEntry);
                }
                
                // Re-render the condition list
                const conditionsList = container.querySelector('#spawnerConditionsList');
                if (conditionsList) {
                    conditionsList.innerHTML = this.renderConditions();
                    this.reattachConditionListeners(container);
                }
                
                if (this.editor && typeof this.editor.markDirty === 'function') {
                    this.editor.markDirty();
                }
                
                this.updateYAMLPreview();
                
                if (this.editor && typeof this.editor.showToast === 'function') {
                    this.editor.showToast(editIndex !== null ? 'Condition updated' : 'Condition added', 'success');
                }
            }
        });
    }
    
    /**
     * Remove a condition
     */
    removeCondition(index, container) {
        if (this.spawnerData.Conditions && this.spawnerData.Conditions[index] !== undefined) {
            this.spawnerData.Conditions.splice(index, 1);
            
            const conditionsList = container.querySelector('#spawnerConditionsList');
            if (conditionsList) {
                conditionsList.innerHTML = this.renderConditions();
                this.reattachConditionListeners(container);
            }
            
            if (this.editor && typeof this.editor.markDirty === 'function') {
                this.editor.markDirty();
            }
            
            this.updateYAMLPreview();
        }
    }
    
    /**
     * Reattach condition listeners after re-render
     */
    reattachConditionListeners(container) {
        // Remove condition buttons
        container.querySelectorAll('.remove-condition').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-condition').dataset.index);
                this.removeCondition(index, container);
            });
        });
        
        // Edit condition buttons
        container.querySelectorAll('.edit-condition').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.closest('.edit-condition').dataset.index);
                this.openConditionBrowser(container, index);
            });
        });
        
        // Click on condition display to edit
        container.querySelectorAll('.condition-display').forEach(display => {
            display.addEventListener('click', (e) => {
                if (!e.target.closest('.edit-condition')) {
                    const index = parseInt(display.dataset.index);
                    this.openConditionBrowser(container, index);
                }
            });
        });
    }
    
    /**
     * Collect data from form
     */
    collectData() {
        const data = {};
        
        // Basic info
        const mobName = document.getElementById('spawnerMobName')?.value?.trim();
        if (mobName) data.MobName = mobName;
        
        const world = document.getElementById('spawnerWorld')?.value?.trim();
        if (world) data.World = world;
        
        const group = document.getElementById('spawnerGroup')?.value?.trim();
        if (group) data.SpawnerGroup = group;
        
        // Location
        data.X = parseFloat(document.getElementById('spawnerX')?.value) || 0;
        data.Y = parseFloat(document.getElementById('spawnerY')?.value) || 64;
        data.Z = parseFloat(document.getElementById('spawnerZ')?.value) || 0;
        
        const radius = parseInt(document.getElementById('spawnerRadius')?.value);
        if (radius > 0) data.Radius = radius;
        
        const radiusY = parseInt(document.getElementById('spawnerRadiusY')?.value);
        if (radiusY > 0) data.RadiusY = radiusY;
        
        // Spawn settings
        const maxMobs = parseInt(document.getElementById('spawnerMaxMobs')?.value);
        if (maxMobs > 0) data.MaxMobs = maxMobs;
        
        const mobsPerSpawn = parseInt(document.getElementById('spawnerMobsPerSpawn')?.value);
        if (mobsPerSpawn > 1) data.MobsPerSpawn = mobsPerSpawn;
        
        const mobLevel = parseInt(document.getElementById('spawnerMobLevel')?.value);
        if (mobLevel > 1) data.MobLevel = mobLevel;
        
        // Timer settings
        data.UseTimer = document.getElementById('spawnerUseTimer')?.checked ?? true;
        
        const cooldown = parseInt(document.getElementById('spawnerCooldown')?.value);
        if (cooldown > 0) data.Cooldown = cooldown;
        
        const warmup = parseInt(document.getElementById('spawnerWarmup')?.value);
        if (warmup > 0) data.Warmup = warmup;
        
        // Activation settings
        data.CheckForPlayers = document.getElementById('spawnerCheckForPlayers')?.checked ?? true;
        
        const activationRange = parseInt(document.getElementById('spawnerActivationRange')?.value);
        if (activationRange !== 40) data.ActivationRange = activationRange;
        
        // Leash settings
        const leashRange = parseInt(document.getElementById('spawnerLeashRange')?.value);
        if (leashRange !== 32) data.LeashRange = leashRange;
        
        if (document.getElementById('spawnerHealOnLeash')?.checked) {
            data.HealOnLeash = true;
        }
        
        if (document.getElementById('spawnerResetThreatOnLeash')?.checked) {
            data.ResetThreatOnLeash = true;
        }
        
        // Visual settings
        if (document.getElementById('spawnerShowFlames')?.checked) {
            data.ShowFlames = true;
        }
        
        if (document.getElementById('spawnerBreakable')?.checked) {
            data.Breakable = true;
        }
        
        // Conditions - get from spawnerData (managed by condition browser)
        if (this.spawnerData.Conditions && this.spawnerData.Conditions.length > 0) {
            // Filter out empty conditions
            const conditions = this.spawnerData.Conditions.filter(c => c && c.trim());
            if (conditions.length > 0) {
                data.Conditions = conditions;
            }
        }
        
        return data;
    }
    
    /**
     * Generate YAML output
     */
    toYAML() {
        const data = this.collectData();
        
        if (!data.MobName) {
            return '# Error: MobName is required\n';
        }
        
        let yaml = '';
        
        // Create spawner name from mob name or custom
        const spawnerName = data.SpawnerGroup || data.MobName + 'Spawner';
        
        yaml += `${spawnerName}:\n`;
        yaml += `  MobName: ${data.MobName}\n`;
        yaml += `  World: ${data.World || 'world'}\n`;
        
        if (data.SpawnerGroup) {
            yaml += `  SpawnerGroup: ${data.SpawnerGroup}\n`;
        }
        
        yaml += `  X: ${data.X}\n`;
        yaml += `  Y: ${data.Y}\n`;
        yaml += `  Z: ${data.Z}\n`;
        
        if (data.Radius) yaml += `  Radius: ${data.Radius}\n`;
        if (data.RadiusY) yaml += `  RadiusY: ${data.RadiusY}\n`;
        
        yaml += `  UseTimer: ${data.UseTimer}\n`;
        
        if (data.MaxMobs) yaml += `  MaxMobs: ${data.MaxMobs}\n`;
        if (data.MobLevel && data.MobLevel > 1) yaml += `  MobLevel: ${data.MobLevel}\n`;
        if (data.MobsPerSpawn && data.MobsPerSpawn > 1) yaml += `  MobsPerSpawn: ${data.MobsPerSpawn}\n`;
        
        if (data.Cooldown) yaml += `  Cooldown: ${data.Cooldown}\n`;
        if (data.Warmup) yaml += `  Warmup: ${data.Warmup}\n`;
        
        yaml += `  CheckForPlayers: ${data.CheckForPlayers}\n`;
        if (data.ActivationRange) yaml += `  ActivationRange: ${data.ActivationRange}\n`;
        
        if (data.LeashRange) yaml += `  LeashRange: ${data.LeashRange}\n`;
        if (data.HealOnLeash) yaml += `  HealOnLeash: true\n`;
        if (data.ResetThreatOnLeash) yaml += `  ResetThreatOnLeash: true\n`;
        
        if (data.ShowFlames) yaml += `  ShowFlames: true\n`;
        if (data.Breakable) yaml += `  Breakable: true\n`;
        
        if (data.Conditions && data.Conditions.length > 0) {
            yaml += `  Conditions:\n`;
            data.Conditions.forEach(c => {
                yaml += `  - ${c}\n`;
            });
        }
        
        return yaml;
    }
    
    /**
     * Load from YAML data
     */
    fromYAML(yamlData, spawnerName) {
        if (!yamlData) return;
        
        this.spawnerData = { ...this.DEFAULT_SPAWNER };
        
        // Map YAML fields to spawner data
        const fieldMap = {
            'MobName': 'MobName',
            'World': 'World',
            'SpawnerGroup': 'SpawnerGroup',
            'X': 'X',
            'Y': 'Y',
            'Z': 'Z',
            'Radius': 'Radius',
            'RadiusY': 'RadiusY',
            'UseTimer': 'UseTimer',
            'MaxMobs': 'MaxMobs',
            'MobLevel': 'MobLevel',
            'MobsPerSpawn': 'MobsPerSpawn',
            'Cooldown': 'Cooldown',
            'Warmup': 'Warmup',
            'CheckForPlayers': 'CheckForPlayers',
            'ActivationRange': 'ActivationRange',
            'LeashRange': 'LeashRange',
            'HealOnLeash': 'HealOnLeash',
            'ResetThreatOnLeash': 'ResetThreatOnLeash',
            'ShowFlames': 'ShowFlames',
            'Breakable': 'Breakable',
            'Conditions': 'Conditions'
        };
        
        Object.keys(fieldMap).forEach(key => {
            if (yamlData[key] !== undefined) {
                this.spawnerData[fieldMap[key]] = yamlData[key];
            }
        });
    }
    
    /**
     * Save the current spawner
     */
    async saveSpawner() {
        // Validate required fields
        if (!this.spawnerData.MobName) {
            this.editor.showToast('Please enter a Mob Name', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('save-spawner');
        const originalHTML = saveBtn?.innerHTML;
        
        try {
            // Show saving state
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
            
            // Collect form data
            this.collectFormData();
            
            // Get the current spawner file name
            const fileName = this.editor?.state?.currentSpawnerFile;
            if (!fileName) {
                this.editor.showToast('No spawner file is currently open', 'error');
                return;
            }
            
            // Store spawner data in the pack
            if (!this.editor.state.currentPack.spawnerFiles) {
                this.editor.state.currentPack.spawnerFiles = {};
            }
            
            // Save the spawner data to the pack
            this.editor.state.currentPack.spawnerFiles[fileName] = { ...this.spawnerData };
            
            // Also store in global spawner files for persistence
            if (!window.globalSpawnerFiles) {
                window.globalSpawnerFiles = {};
            }
            window.globalSpawnerFiles[fileName] = { ...this.spawnerData };
            
            // Mark file as modified for save-all functionality
            if (!this.editor.state.currentPack.spawners) {
                this.editor.state.currentPack.spawners = [];
            }
            
            // Find or create spawner entry
            let spawnerEntry = this.editor.state.currentPack.spawners.find(s => s.fileName === fileName);
            if (!spawnerEntry) {
                spawnerEntry = {
                    id: `spawner_${Date.now()}`,
                    fileName: fileName,
                    entries: []
                };
                this.editor.state.currentPack.spawners.push(spawnerEntry);
            }
            
            // Update spawner entry
            spawnerEntry.entries = [{ ...this.spawnerData, name: this.spawnerData.SpawnerGroup || this.spawnerData.MobName }];
            spawnerEntry.modified = false;
            spawnerEntry.lastSaved = new Date().toISOString();
            
            // Clear dirty state
            this.editor.state.isDirty = false;
            this.editor.updateSaveStatusIndicator?.();
            
            // Save to storage
            if (this.editor.packManager) {
                await this.editor.packManager.savePackToStorage(this.editor.state.currentPack);
            }
            
            // Update pack tree
            this.editor.packManager?.renderPackTree?.();
            
            this.editor.showToast(`Spawner "${this.spawnerData.SpawnerGroup || this.spawnerData.MobName || fileName}" saved`, 'success');
        } catch (error) {
            console.error('Failed to save spawner:', error);
            this.editor.showToast('Failed to save spawner: ' + error.message, 'error');
        } finally {
            // Restore button state
            if (saveBtn && originalHTML) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHTML;
            }
        }
    }
    
    /**
     * Duplicate the current spawner
     */
    async duplicateSpawner() {
        const currentName = this.spawnerData.SpawnerGroup || this.spawnerData.MobName || 'Spawner';
        
        let newName = await this.editor?.showPrompt?.(
            'Duplicate Spawner', 
            'Enter name for duplicated spawner:',
            currentName + '_copy'
        );
        
        if (!newName || newName.trim() === '') return;
        
        try {
            // Collect current form data
            this.collectFormData();
            
            // Create a deep copy of the spawner data to avoid shared references
            const duplicatedData = structuredClone(this.spawnerData);
            duplicatedData.SpawnerGroup = newName.trim();
            
            // Create new file name
            const newFileName = newName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') + '.yml';
            
            // Store the duplicated spawner
            if (!this.editor.state.currentPack.spawnerFiles) {
                this.editor.state.currentPack.spawnerFiles = {};
            }
            this.editor.state.currentPack.spawnerFiles[newFileName] = duplicatedData;
            
            // Store in global spawner files
            if (!window.globalSpawnerFiles) {
                window.globalSpawnerFiles = {};
            }
            window.globalSpawnerFiles[newFileName] = duplicatedData;
            
            // Mark as dirty
            this.editor.markDirty?.();
            
            // Refresh pack tree
            this.editor.packManager?.renderPackTree?.();
            
            // Open the duplicated spawner
            this.editor.showSpawnerEditor?.(newFileName);
            
            this.editor.showToast(`Duplicated spawner as "${newName}"`, 'success');
        } catch (error) {
            console.error('Failed to duplicate spawner:', error);
            this.editor.showToast('Failed to duplicate spawner: ' + error.message, 'error');
        }
    }
    
    /**
     * Delete the current spawner
     */
    async deleteSpawner() {
        const fileName = this.editor?.state?.currentSpawnerFile;
        const spawnerName = this.spawnerData.SpawnerGroup || this.spawnerData.MobName || fileName;
        
        const confirmed = await this.editor?.showConfirmDialog?.(
            `Are you sure you want to delete "${spawnerName}"? This cannot be undone.`,
            'Delete Spawner',
            [
                { text: 'Delete', value: true, primary: false, danger: true },
                { text: 'Cancel', value: false, primary: true }
            ]
        );
        
        if (!confirmed) return;
        
        try {
            // Remove from pack
            if (this.editor.state.currentPack.spawnerFiles) {
                delete this.editor.state.currentPack.spawnerFiles[fileName];
            }
            
            // Remove from spawners array
            if (this.editor.state.currentPack.spawners) {
                const index = this.editor.state.currentPack.spawners.findIndex(s => s.fileName === fileName);
                if (index !== -1) {
                    this.editor.state.currentPack.spawners.splice(index, 1);
                }
            }
            
            // Remove from global spawner files
            if (window.globalSpawnerFiles) {
                delete window.globalSpawnerFiles[fileName];
            }
            
            // Mark as dirty
            this.editor.markDirty?.();
            
            // Save changes
            if (this.editor.packManager) {
                await this.editor.packManager.savePackToStorage(this.editor.state.currentPack);
            }
            
            // Refresh pack tree
            this.editor.packManager?.renderPackTree?.();
            
            // Go back to dashboard
            this.editor.state.currentSpawnerFile = null;
            this.editor.showDashboard?.();
            
            this.editor.showToast(`Spawner "${spawnerName}" deleted`, 'success');
        } catch (error) {
            console.error('Failed to delete spawner:', error);
            this.editor.showToast('Failed to delete spawner: ' + error.message, 'error');
        }
    }
    
    /**
     * Add a new spawner section (creates a new spawner file)
     */
    async addNewSection() {
        let newName = await this.editor?.showPrompt?.(
            'New Spawner',
            'Enter name for new spawner:',
            'NewSpawner'
        );
        
        if (!newName || newName.trim() === '') return;
        
        try {
            // Sanitize the name
            const sanitizedName = newName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
            const newFileName = sanitizedName + '.yml';
            
            // Check if file already exists
            if (this.editor.state.currentPack.spawnerFiles?.[newFileName] ||
                window.globalSpawnerFiles?.[newFileName]) {
                this.editor.showToast('A spawner with that name already exists', 'error');
                return;
            }
            
            // Create new spawner data
            const newSpawnerData = {
                ...this.DEFAULT_SPAWNER,
                SpawnerGroup: sanitizedName,
                MobName: ''
            };
            
            // Store the new spawner
            if (!this.editor.state.currentPack.spawnerFiles) {
                this.editor.state.currentPack.spawnerFiles = {};
            }
            this.editor.state.currentPack.spawnerFiles[newFileName] = newSpawnerData;
            
            // Store in global spawner files
            if (!window.globalSpawnerFiles) {
                window.globalSpawnerFiles = {};
            }
            window.globalSpawnerFiles[newFileName] = newSpawnerData;
            
            // Mark as dirty
            this.editor.markDirty?.();
            
            // Refresh pack tree
            this.editor.packManager?.renderPackTree?.();
            
            // Open the new spawner
            this.editor.showSpawnerEditor?.(newFileName);
            
            this.editor.showToast(`Spawner "${sanitizedName}" created`, 'success');
        } catch (error) {
            console.error('Failed to create spawner:', error);
            this.editor.showToast('Failed to create spawner: ' + error.message, 'error');
        }
    }
    
    /**
     * Collect form data from the DOM into spawnerData
     */
    collectFormData() {
        // Basic section
        const mobNameInput = document.getElementById('spawnerMobName');
        if (mobNameInput) this.spawnerData.MobName = mobNameInput.value;
        
        const worldInput = document.getElementById('spawnerWorld');
        if (worldInput) this.spawnerData.World = worldInput.value;
        
        const groupInput = document.getElementById('spawnerGroup');
        if (groupInput) this.spawnerData.SpawnerGroup = groupInput.value;
        
        // Location section
        const xInput = document.getElementById('spawnerX');
        if (xInput) this.spawnerData.X = parseFloat(xInput.value) || 0;
        
        const yInput = document.getElementById('spawnerY');
        if (yInput) this.spawnerData.Y = parseFloat(yInput.value) || 64;
        
        const zInput = document.getElementById('spawnerZ');
        if (zInput) this.spawnerData.Z = parseFloat(zInput.value) || 0;
        
        const radiusInput = document.getElementById('spawnerRadius');
        if (radiusInput) this.spawnerData.Radius = parseInt(radiusInput.value) || 0;
        
        const radiusYInput = document.getElementById('spawnerRadiusY');
        if (radiusYInput) this.spawnerData.RadiusY = parseInt(radiusYInput.value) || 0;
        
        // Spawn settings
        const maxMobsInput = document.getElementById('spawnerMaxMobs');
        if (maxMobsInput) this.spawnerData.MaxMobs = parseInt(maxMobsInput.value) || 1;
        
        const mobsPerSpawnInput = document.getElementById('spawnerMobsPerSpawn');
        if (mobsPerSpawnInput) this.spawnerData.MobsPerSpawn = parseInt(mobsPerSpawnInput.value) || 1;
        
        const mobLevelInput = document.getElementById('spawnerMobLevel');
        if (mobLevelInput) this.spawnerData.MobLevel = parseInt(mobLevelInput.value) || 1;
        
        // Timer section
        const useTimerInput = document.getElementById('spawnerUseTimer');
        if (useTimerInput) this.spawnerData.UseTimer = useTimerInput.checked;
        
        const cooldownInput = document.getElementById('spawnerCooldown');
        if (cooldownInput) this.spawnerData.Cooldown = parseInt(cooldownInput.value) || 0;
        
        const warmupInput = document.getElementById('spawnerWarmup');
        if (warmupInput) this.spawnerData.Warmup = parseInt(warmupInput.value) || 0;
        
        // Behavior section
        const checkForPlayersInput = document.getElementById('spawnerCheckForPlayers');
        if (checkForPlayersInput) this.spawnerData.CheckForPlayers = checkForPlayersInput.checked;
        
        const activationRangeInput = document.getElementById('spawnerActivationRange');
        if (activationRangeInput) this.spawnerData.ActivationRange = parseInt(activationRangeInput.value) || 40;
        
        const leashRangeInput = document.getElementById('spawnerLeashRange');
        if (leashRangeInput) this.spawnerData.LeashRange = parseInt(leashRangeInput.value) || 32;
        
        const healOnLeashInput = document.getElementById('spawnerHealOnLeash');
        if (healOnLeashInput) this.spawnerData.HealOnLeash = healOnLeashInput.checked;
        
        const resetThreatInput = document.getElementById('spawnerResetThreat');
        if (resetThreatInput) this.spawnerData.ResetThreatOnLeash = resetThreatInput.checked;
        
        const showFlamesInput = document.getElementById('spawnerShowFlames');
        if (showFlamesInput) this.spawnerData.ShowFlames = showFlamesInput.checked;
        
        const breakableInput = document.getElementById('spawnerBreakable');
        if (breakableInput) this.spawnerData.Breakable = breakableInput.checked;
        
        // Conditions - preserve existing conditions (managed by condition browser cards)
        // Don't overwrite with empty array from non-existent .condition-input elements
        if (!this.spawnerData.Conditions) {
            this.spawnerData.Conditions = [];
        }
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for module usage
if (typeof window !== 'undefined') {
    window.SpawnerEditor = SpawnerEditor;
}
