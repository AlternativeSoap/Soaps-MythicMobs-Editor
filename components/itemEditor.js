/**
 * Item Editor Component
 * Handles editing of MythicMobs item configurations
 */
class ItemEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentItem = null;
    }

    /**
     * Render the item editor with the given item data
     */
    render(item) {
        this.currentItem = item;
        console.log('📦 Rendering item:', item?.internalName || 'New Item');

        const container = document.getElementById('item-editor-view');
        if (!container) {
            console.error('❌ Item editor container not found');
            return;
        }
        
        if (item._isFileContainer) {
            this.renderFileContainer(item, container);
            return;
        }

        container.innerHTML = this.generateItemEditorHTML(item);
        this.attachEventHandlers(item);
        window.collapsibleManager.initializeCollapsible();
        window.collapsibleManager.restoreStates();
        this.updateConditionalSections(item);
    }

    /**
     * Generate the complete HTML for the item editor
     */
    generateItemEditorHTML(item) {
        const isAdvanced = this.editor.state.currentMode === 'advanced';
        
        return `
            <div class="editor-header">
                <h2>
                    <i class="fas fa-cube"></i>
                    Item Editor
                    <span class="item-name">${item?.internalName || 'New Item'}</span>
                    <span class="mode-badge ${isAdvanced ? 'advanced' : 'beginner'}">${isAdvanced ? 'Advanced' : 'Beginner'} Mode</span>
                </h2>
                <div class="editor-actions">
                    <div class="action-group secondary-actions">
                        <button class="btn btn-outline" id="duplicate-item" title="Create a copy of this item">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline" id="rename-item" title="Rename this item">
                            <i class="fas fa-pen"></i> Rename
                        </button>
                        <button class="btn btn-secondary" id="new-item" title="Add a new item to this file">
                            <i class="fas fa-plus"></i> New Section
                        </button>
                    </div>
                    <button class="btn btn-primary" id="save-item">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>

            <div class="editor-content">
                ${this.generateBasicInfoSection(item)}
                ${this.generateAppearanceSection(item)}
                ${this.generateEnchantmentsSection(item)}
                ${this.generateAttributesSection(item)}
                ${this.generatePotionEffectsSection(item)}
                ${this.generateOptionsSection(item)}
                ${this.generateBannerLayersSection(item)}
                ${this.generateFireworkSection(item)}
                ${isAdvanced ? this.generateNBTSection(item) : ''}
                ${isAdvanced ? this.generateAdvancedSection(item) : ''}
            </div>
        `;
    }


    /**
     * Basic Info Section (Always visible, expanded by default)
     */
    generateBasicInfoSection(item) {
        return `
            <div class="card collapsible-card">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-info-circle"></i> Basic Information
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Internal Name <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="item-internal-name" 
                                class="form-input" 
                                value="${item?.internalName || ''}"
                                placeholder="my_custom_sword"
                                required
                            >
                            <small class="form-hint">Unique identifier for this item</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Material (Id) <span class="required">*</span></label>
                            <div id="item-material-dropdown"></div>
                            <small class="form-hint">Minecraft material type - Search for items</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Amount</label>
                            <input 
                                type="number" 
                                id="item-amount" 
                                class="form-input" 
                                value="${item?.Amount || 1}"
                                min="1"
                                max="64"
                            >
                            <small class="form-hint">Stack size (1-64)</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Custom Model Data</label>
                            <input 
                                type="number" 
                                id="item-custom-model-data" 
                                class="form-input" 
                                value="${item?.CustomModelData || ''}"
                                min="0"
                            >
                            <small class="form-hint">For custom resource packs</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Appearance Section
     */
    generateAppearanceSection(item) {
        const loreLines = item?.Lore || [];
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-palette"></i> Appearance
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group full-width">
                            <label for="item-display" class="form-label">Display Name</label>
                            <input 
                                type="text" 
                                id="item-display" 
                                class="form-input" 
                                value="${item?.Display || ''}"
                                placeholder="&6&lLegendary Sword"
                            >
                            <small class="form-hint">Supports color codes (&amp;a, &amp;l, etc.)</small>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">Lore</label>
                            <small class="form-hint">Item description lines</small>
                            <div id="item-lore-list" class="list-editor">
                                ${loreLines.map((line, index) => `
                                    <div class="list-item" data-index="${index}">
                                        <input 
                                            type="text" 
                                            class="form-input lore-line" 
                                            value="${line}"
                                            placeholder="&7Enter lore text..."
                                        >
                                        <button type="button" class="btn-icon btn-danger remove-lore" data-index="${index}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')}
                                <button type="button" class="btn-secondary add-lore-btn">
                                    <i class="fas fa-plus"></i> Add Lore Line
                                </button>
                            </div>
                        </div>

                        <div class="form-group" id="item-color-group" style="display: none;">
                            <label for="item-color" class="form-label">Color (RGB)</label>
                            <div class="color-picker-container">
                                <input 
                                    type="text" 
                                    id="item-color" 
                                    class="form-input" 
                                    value="${item?.Color || ''}"
                                    placeholder="255,128,0"
                                >
                                <select id="item-color-preset" class="form-select">
                                    <option value="">Custom Color</option>
                                    ${window.ItemOptions?.PREDEFINED_COLORS.map(color => `
                                        <option value="${color.rgb}">${color.name}</option>
                                    `).join('') || ''}
                                </select>
                            </div>
                            <small class="form-hint">For leather armor, banners, etc.</small>
                        </div>

                        <div class="form-group" id="item-durability-group">
                            <label for="item-durability" class="form-label">Durability</label>
                            <input 
                                type="number" 
                                id="item-durability" 
                                class="form-input" 
                                value="${item?.Durability || ''}"
                                min="0"
                            >
                            <small class="form-hint">Current durability value</small>
                        </div>

                        <div class="form-group" id="item-max-durability-group">
                            <label for="item-max-durability" class="form-label">Max Durability</label>
                            <input 
                                type="number" 
                                id="item-max-durability" 
                                class="form-input" 
                                value="${item?.MaxDurability || ''}"
                                min="1"
                            >
                            <small class="form-hint">Override maximum durability</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    /**
     * Enchantments Section
     */
    generateEnchantmentsSection(item) {
        const enchantments = item?.Enchantments || [];
        const enchantmentsList = window.EnchantmentData?.ENCHANTMENTS || [];
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-star"></i> Enchantments
                        ${enchantments.length > 0 ? `<span class="card-badge">${enchantments.length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div id="item-enchantments-list" class="list-editor">
                        ${enchantments.map((ench, index) => {
                            // Parse enchantment - handle formats like "PROTECTION 1to3", "SHARPNESS:5", or {type, level} objects
                            let enchName, enchLevel;
                            
                            if (typeof ench === 'object' && ench !== null) {
                                // Object format: { type: "PROTECTION", level: 3 }
                                enchName = ench.type || ench.name || '';
                                enchLevel = String(ench.level || '1');
                            } else if (typeof ench === 'string') {
                                if (ench.includes(':')) {
                                    const parts = ench.split(':');
                                    enchName = parts[0].trim();
                                    enchLevel = parts[1]?.trim() || '1';
                                } else {
                                    const parts = ench.split(' ');
                                    enchName = parts[0];
                                    enchLevel = parts.slice(1).join(' ') || '1';
                                }
                            } else {
                                enchName = '';
                                enchLevel = '1';
                            }
                            return `
                                <div class="list-item enchantment-item" data-index="${index}">
                                    <select class="form-select enchantment-type">
                                        <option value="">Select Enchantment...</option>
                                        ${enchantmentsList.map(e => `
                                            <option value="${e.id}" ${e.id === enchName || e.id.toUpperCase() === enchName.toUpperCase() ? 'selected' : ''}>
                                                ${e.name} (Max: ${e.maxLevel})
                                            </option>
                                        `).join('')}
                                    </select>
                                    <input 
                                        type="text" 
                                        class="form-input enchantment-level" 
                                        value="${enchLevel}"
                                        placeholder="Level (e.g., 3 or 1to5)"
                                        title="Enter a level number or range like 1to5"
                                    >
                                    <button type="button" class="btn-icon btn-danger remove-enchantment" data-index="${index}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                        <button type="button" class="btn-secondary add-enchantment-btn">
                            <i class="fas fa-plus"></i> Add Enchantment
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attributes Section (Slot-based with tabs)
     */
    generateAttributesSection(item) {
        const attributes = item?.Attributes || {};
        const slots = window.ItemOptions?.ATTRIBUTE_SLOTS || [];
        const attributeTypes = window.ItemOptions?.ATTRIBUTE_TYPES || [];
        const operations = window.ItemOptions?.ATTRIBUTE_OPERATIONS || [];
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-chart-line"></i> Attributes
                        ${Object.keys(attributes).length > 0 ? `<span class="card-badge">${Object.keys(attributes).length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="tabs-container">
                        <div class="tabs-header">
                            ${slots.map((slot, index) => `
                                <button 
                                    type="button" 
                                    class="tab-btn ${index === 0 ? 'active' : ''}" 
                                    data-slot="${slot.id}"
                                    title="${slot.description}"
                                >
                                    ${slot.name}
                                </button>
                            `).join('')}
                        </div>
                        <div class="tabs-content">
                            ${slots.map((slot, index) => {
                                const rawSlotAttributes = attributes[slot.id] || [];
                                // Normalize attributes: handle both array format and object format
                                const slotAttributes = this.normalizeSlotAttributes(rawSlotAttributes);
                                return `
                                    <div class="tab-panel ${index === 0 ? 'active' : ''}" data-slot="${slot.id}">
                                        <div class="attribute-list" data-slot="${slot.id}">
                                            ${slotAttributes.map((attr, attrIndex) => this.generateAttributeItem(slot.id, attr, attrIndex, attributeTypes, operations)).join('')}
                                            <button type="button" class="btn-secondary add-attribute-btn" data-slot="${slot.id}">
                                                <i class="fas fa-plus"></i> Add Attribute
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Normalize slot attributes from various formats to array format
     * Handles: 
     *   - Array: [{type, amount, operation}] (already correct)
     *   - Object: { Armor: '-1to2 ADD', Health: '5 ADD' } (from YAML import)
     */
    normalizeSlotAttributes(slotData) {
        if (!slotData) return [];
        
        // If already an array, return as-is
        if (Array.isArray(slotData)) {
            return slotData;
        }
        
        // If object format (from YAML), convert to array
        if (typeof slotData === 'object') {
            return Object.entries(slotData).map(([attrName, attrValue]) => {
                // Parse value like "-1to2 ADD" or "5 MULTIPLY_BASE"
                let amount = attrValue;
                let operation = 'ADD';
                
                if (typeof attrValue === 'string') {
                    const parts = attrValue.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        amount = parts.slice(0, -1).join(' ');
                        operation = parts[parts.length - 1];
                    } else {
                        amount = parts[0];
                    }
                }
                
                return {
                    type: attrName,
                    amount: amount,
                    operation: operation
                };
            });
        }
        
        return [];
    }

    /**
     * Generate single attribute item HTML
     */
    generateAttributeItem(slot, attr, index, attributeTypes, operations) {
        // Support both numeric amounts and range strings like "-1to2"
        const amountValue = attr?.amount !== undefined ? attr.amount : 0;
        
        return `
            <div class="list-item attribute-item" data-index="${index}">
                <select class="form-select attribute-type" required>
                    <option value="">Select Type...</option>
                    ${attributeTypes.map(type => `
                        <option value="${type.id}" ${attr?.type === type.id || attr?.type?.toUpperCase() === type.id?.toUpperCase() ? 'selected' : ''} title="${type.description}">
                            ${type.name}
                        </option>
                    `).join('')}
                </select>
                <input 
                    type="text" 
                    class="form-input attribute-amount" 
                    value="${amountValue}"
                    placeholder="Amount (e.g., 5 or -1to2)"
                    title="Enter a number or range like -1to2"
                    required
                >
                <select class="form-select attribute-operation" required>
                    <option value="">Operation...</option>
                    ${operations.map(op => `
                        <option value="${op.id}" ${attr?.operation === op.id || attr?.operation?.toUpperCase() === op.id?.toUpperCase() ? 'selected' : ''} title="${op.description}">
                            ${op.name}
                        </option>
                    `).join('')}
                </select>
                <button type="button" class="btn-icon btn-danger remove-attribute" data-slot="${slot}" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    /**
     * Potion Effects Section (Conditional: only for potions)
     */
    generatePotionEffectsSection(item) {
        const potionEffects = item?.PotionEffects || [];
        const effects = window.PotionEffectData?.POTION_EFFECTS || [];
        
        return `
            <div class="card collapsible-card collapsed" id="potion-effects-section" style="display: none;">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-flask"></i> Potion Effects
                        ${potionEffects.length > 0 ? `<span class="card-badge">${potionEffects.length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div id="item-potion-effects-list" class="list-editor">
                        ${potionEffects.map((effect, index) => {
                            const parts = effect.split(' ');
                            const effectType = parts[0];
                            const duration = parts[1] || 600;
                            const amplifier = parts[2] || 0;
                            return `
                                <div class="list-item potion-effect-item" data-index="${index}">
                                    <select class="form-select potion-effect-type">
                                        <option value="">Select Effect...</option>
                                        ${effects.map(e => `
                                            <option value="${e.id}" ${e.id === effectType ? 'selected' : ''} title="${e.description}">
                                                ${e.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <input 
                                        type="number" 
                                        class="form-input potion-duration" 
                                        value="${duration}"
                                        min="1"
                                        placeholder="Duration (ticks)"
                                    >
                                    <input 
                                        type="number" 
                                        class="form-input potion-amplifier" 
                                        value="${amplifier}"
                                        min="0"
                                        placeholder="Level"
                                    >
                                    <button type="button" class="btn-icon btn-danger remove-potion-effect" data-index="${index}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                        <button type="button" class="btn-secondary add-potion-effect-btn">
                            <i class="fas fa-plus"></i> Add Effect
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Options Section (Boolean, Number, Text options)
     */
    generateOptionsSection(item) {
        const options = item?.Options || {};
        const booleanOptions = window.ItemOptions?.BOOLEAN_OPTIONS || [];
        const numberOptions = window.ItemOptions?.NUMBER_OPTIONS || [];
        const textOptions = window.ItemOptions?.TEXT_OPTIONS || [];
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-cog"></i> Options
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group full-width">
                            <label class="form-label">Boolean Options</label>
                            <div class="checkbox-grid">
                                ${booleanOptions.map(opt => `
                                    <label class="checkbox-label" title="${opt.description}">
                                        <input 
                                            type="checkbox" 
                                            id="option-${opt.id}" 
                                            ${options[opt.id] === true ? 'checked' : ''}
                                        >
                                        <span>${opt.name}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        ${numberOptions.map(opt => `
                            <div class="form-group">
                                <label for="option-${opt.id}" class="form-label">${opt.name}</label>
                                <input 
                                    type="number" 
                                    id="option-${opt.id}" 
                                    class="form-input" 
                                    value="${options[opt.id] !== undefined ? options[opt.id] : opt.default}"
                                    min="${opt.min}"
                                    ${opt.max ? `max="${opt.max}"` : ''}
                                >
                                <small class="form-hint">${opt.description || ''}</small>
                            </div>
                        `).join('')}

                        ${textOptions.map(opt => `
                            <div class="form-group" id="option-${opt.id}-group" style="display: none;">
                                <label for="option-${opt.id}" class="form-label">${opt.name}</label>
                                <input 
                                    type="text" 
                                    id="option-${opt.id}" 
                                    class="form-input" 
                                    value="${options[opt.id] || ''}"
                                >
                                <small class="form-hint">${opt.description}</small>
                            </div>
                        `).join('')}

                        <div class="form-group full-width">
                            <label class="form-label">Hide Flags</label>
                            <small class="form-hint">Hide information from tooltip</small>
                            <div class="checkbox-grid">
                                ${window.ItemOptions?.HIDE_FLAGS.map(flag => `
                                    <label class="checkbox-label" title="${flag.description}">
                                        <input 
                                            type="checkbox" 
                                            class="hide-flag-checkbox" 
                                            data-flag="${flag.id}"
                                            ${(item?.Hide || []).includes(flag.id) ? 'checked' : ''}
                                        >
                                        <span>${flag.name}</span>
                                    </label>
                                `).join('') || ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Banner Layers Section (Conditional: only for banners/shields)
     */
    generateBannerLayersSection(item) {
        const bannerLayers = item?.BannerLayers || [];
        const patterns = window.BannerPatternData?.BANNER_PATTERNS || [];
        const colors = window.BannerPatternData?.BANNER_COLORS || [];
        
        return `
            <div class="card collapsible-card collapsed" id="banner-layers-section" style="display: none;">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-flag"></i> Banner Layers
                        ${bannerLayers.length > 0 ? `<span class="card-badge">${bannerLayers.length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div id="item-banner-layers-list" class="list-editor">
                        ${bannerLayers.map((layer, index) => {
                            const parts = layer.split(' ');
                            const color = parts[0];
                            const pattern = parts[1];
                            return `
                                <div class="list-item banner-layer-item" data-index="${index}">
                                    <select class="form-select banner-color">
                                        <option value="">Select Color...</option>
                                        ${colors.map(c => `
                                            <option value="${c}" ${c === color ? 'selected' : ''}>${c}</option>
                                        `).join('')}
                                    </select>
                                    <select class="form-select banner-pattern">
                                        <option value="">Select Pattern...</option>
                                        ${patterns.map(p => `
                                            <option value="${p.id}" ${p.id === pattern ? 'selected' : ''} title="${p.description}">
                                                ${p.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <button type="button" class="btn-icon btn-danger remove-banner-layer" data-index="${index}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                        <button type="button" class="btn-secondary add-banner-layer-btn">
                            <i class="fas fa-plus"></i> Add Layer
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Firework Section (Conditional: only for firework items)
     */
    generateFireworkSection(item) {
        const firework = item?.Firework || {};
        
        return `
            <div class="card collapsible-card collapsed" id="firework-section" style="display: none;">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-rocket"></i> Firework
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label for="firework-power" class="form-label">Power</label>
                            <input 
                                type="number" 
                                id="firework-power" 
                                class="form-input" 
                                value="${firework.power || 1}"
                                min="0"
                                max="4"
                            >
                            <small class="form-hint">Flight duration (0-4)</small>
                        </div>

                        <div class="form-group full-width">
                            <label for="firework-colors" class="form-label">Colors</label>
                            <input 
                                type="text" 
                                id="firework-colors" 
                                class="form-input" 
                                value="${(firework.colors || []).join(', ')}"
                                placeholder="255,0,0, 0,255,0"
                            >
                            <small class="form-hint">RGB colors, comma-separated (e.g., "255,0,0, 0,255,0")</small>
                        </div>

                        <div class="form-group full-width">
                            <label for="firework-fade-colors" class="form-label">Fade Colors</label>
                            <input 
                                type="text" 
                                id="firework-fade-colors" 
                                class="form-input" 
                                value="${(firework.fadeColors || []).join(', ')}"
                                placeholder="128,128,128"
                            >
                            <small class="form-hint">RGB colors to fade to</small>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="firework-trail"
                                    ${firework.trail ? 'checked' : ''}
                                >
                                <span>Trail</span>
                            </label>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    id="firework-flicker"
                                    ${firework.flicker ? 'checked' : ''}
                                >
                                <span>Flicker</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * NBT Section
     */
    generateNBTSection(item) {
        const nbtTags = item?.NBT || {};
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-code"></i> NBT Tags
                        ${Object.keys(nbtTags).length > 0 ? `<span class="card-badge">${Object.keys(nbtTags).length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="nbt-editor">
                        <div class="form-group">
                            <label class="form-label">Custom NBT Tags</label>
                            <small class="form-hint">Advanced: Use type prefixes (int:, str:, double:, etc.)</small>
                            <div id="item-nbt-list" class="list-editor">
                                ${Object.entries(nbtTags).map(([key, value], index) => `
                                    <div class="list-item nbt-item" data-index="${index}">
                                        <input 
                                            type="text" 
                                            class="form-input nbt-key" 
                                            value="${key}"
                                            placeholder="Tag name"
                                        >
                                        <input 
                                            type="text" 
                                            class="form-input nbt-value" 
                                            value="${value}"
                                            placeholder="Value (use prefix: int:10, str:text)"
                                        >
                                        <button type="button" class="btn-icon btn-danger remove-nbt" data-index="${index}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')}
                                <button type="button" class="btn-secondary add-nbt-btn">
                                    <i class="fas fa-plus"></i> Add NBT Tag
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Advanced Section (Trim, Book, Skills)
     */
    generateAdvancedSection(item) {
        const trim = item?.Trim || {};
        const book = item?.Book || {};
        const skills = item?.Skills || [];
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-graduation-cap"></i> Advanced
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label for="trim-material" class="form-label">Trim Material</label>
                            <select id="trim-material" class="form-select">
                                <option value="">None</option>
                                ${window.ItemOptions?.TRIM_MATERIALS.map(mat => `
                                    <option value="${mat}" ${trim.material === mat ? 'selected' : ''}>${mat}</option>
                                `).join('') || ''}
                            </select>
                            <small class="form-hint">Armor trim material (1.20+)</small>
                        </div>

                        <div class="form-group">
                            <label for="trim-pattern" class="form-label">Trim Pattern</label>
                            <select id="trim-pattern" class="form-select">
                                <option value="">None</option>
                                ${window.ItemOptions?.TRIM_PATTERNS.map(pat => `
                                    <option value="${pat}" ${trim.pattern === pat ? 'selected' : ''}>${pat}</option>
                                `).join('') || ''}
                            </select>
                            <small class="form-hint">Armor trim pattern (1.20+)</small>
                        </div>

                        <div class="form-group full-width">
                            <label for="book-title" class="form-label">Book Title</label>
                            <input 
                                type="text" 
                                id="book-title" 
                                class="form-input" 
                                value="${book.title || ''}"
                                placeholder="My Book Title"
                            >
                            <small class="form-hint">For written books</small>
                        </div>

                        <div class="form-group full-width">
                            <label for="book-author" class="form-label">Book Author</label>
                            <input 
                                type="text" 
                                id="book-author" 
                                class="form-input" 
                                value="${book.author || ''}"
                                placeholder="Author Name"
                            >
                            <small class="form-hint">For written books</small>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">Book Pages</label>
                            <textarea 
                                id="book-pages" 
                                class="form-input" 
                                rows="4"
                                placeholder="Page 1 content&#10;Page 2 content&#10;..."
                            >${(book.pages || []).join('\n')}</textarea>
                            <small class="form-hint">One page per line</small>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">Skills (Crucible)</label>
                            <small class="form-hint">Format: ~onConsume @trigger skill_name</small>
                            <div id="item-skills-list" class="list-editor">
                                ${skills.map((skill, index) => `
                                    <div class="list-item skill-item" data-index="${index}">
                                        <input 
                                            type="text" 
                                            class="form-input skill-line" 
                                            value="${skill}"
                                            placeholder="~onConsume @trigger my_skill"
                                        >
                                        <button type="button" class="btn-icon btn-danger remove-skill" data-index="${index}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')}
                                <button type="button" class="btn-secondary add-skill-btn">
                                    <i class="fas fa-plus"></i> Add Skill
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize collapsible sections
     */

    /**
     * Update visibility of conditional sections based on material type
     */
    updateConditionalSections(item) {
        const material = item?.Id?.toLowerCase() || '';
        
        const potionSection = document.getElementById('potion-effects-section');
        if (potionSection) {
            const isPotionItem = material.includes('potion') || material.includes('tipped_arrow');
            potionSection.style.display = isPotionItem ? 'block' : 'none';
        }
        
        const bannerSection = document.getElementById('banner-layers-section');
        if (bannerSection) {
            const isBannerItem = material.includes('banner') || material.includes('shield');
            bannerSection.style.display = isBannerItem ? 'block' : 'none';
        }
        
        const fireworkSection = document.getElementById('firework-section');
        if (fireworkSection) {
            const isFireworkItem = material.includes('firework');
            fireworkSection.style.display = isFireworkItem ? 'block' : 'none';
        }
        
        const colorGroup = document.getElementById('item-color-group');
        if (colorGroup) {
            const isColorableItem = material.includes('leather_') || material.includes('banner') || material.includes('shield');
            colorGroup.style.display = isColorableItem ? 'block' : 'none';
        }
        
        const playerGroup = document.getElementById('option-Player-group');
        const skinGroup = document.getElementById('option-SkinTexture-group');
        if (playerGroup && skinGroup) {
            const isPlayerHead = material === 'player_head';
            playerGroup.style.display = isPlayerHead ? 'block' : 'none';
            skinGroup.style.display = isPlayerHead ? 'block' : 'none';
        }
    }

    /**
     * Attach all event handlers (Part 1 - Basic handlers)
     */
    attachEventHandlers(item) {
        // Save button
        document.getElementById('save-item')?.addEventListener('click', () => {
            this.saveItem(item);
        });
        
        // New section button (add new item to current file)
        document.getElementById('new-item')?.addEventListener('click', () => {
            this.addNewSection();
        });
        
        // Duplicate item button
        document.getElementById('duplicate-item')?.addEventListener('click', () => {
            this.duplicateItem();
        });
        
        // Rename item button
        document.getElementById('rename-item')?.addEventListener('click', () => {
            this.renameItem();
        });
        
        const materialSelect = document.getElementById('item-material');
        if (materialSelect) {
            materialSelect.addEventListener('change', (e) => {
                item.Id = e.target.value;
                this.updateConditionalSections(item);
                this.editor.markDirty();
            });
        }

        const internalNameInput = document.getElementById('item-internal-name');
        if (internalNameInput) {
            internalNameInput.addEventListener('input', (e) => {
                item.internalName = e.target.value;
                document.querySelector('.item-name').textContent = e.target.value || 'New Item';
                this.syncToFile();
                this.editor.markDirty();
                // Refresh file tree to show updated name
                this.editor.packManager.renderPackTree();
            });
        }

        this.attachLoreHandlers(item);
        this.attachEnchantmentHandlers(item);
        this.attachAttributeHandlers(item);
        this.attachPotionEffectHandlers(item);
        this.attachBannerLayerHandlers(item);
        this.attachNBTHandlers(item);
        this.attachSkillHandlers(item);
        this.attachBasicInputHandlers(item);
        this.initializeAttributeTabs();
    }
    
    /**
     * Initialize attribute tabs functionality
     */
    initializeAttributeTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slot = e.target.dataset.slot;
                const tabsContainer = e.target.closest('.tabs-container');
                
                tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                tabsContainer.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tabsContainer.querySelector(`.tab-panel[data-slot="${slot}"]`).classList.add('active');
            });
        });
    }

    /**
     * Attach lore handlers
     */
    syncToFile() {
        // Sync currentItem data to state.currentFile for live preview
        if (this.currentItem && this.editor.state.currentFile) {
            Object.assign(this.editor.state.currentFile, this.currentItem);
        }
    }
    
    saveItem(item) {
        if (!item.internalName) {
            this.editor.showToast('Please enter an internal name', 'error');
            return;
        }
        if (!item.Id) {
            this.editor.showToast('Please select a material', 'error');
            return;
        }
        
        // Sync data before saving
        this.syncToFile();
        
        // Save through editor
        if (this.editor && this.editor.saveCurrentFile) {
            this.editor.saveCurrentFile();
        }
    }
    
    /**
     * Add a new item section to the current file
     */
    addNewSection() {
        const newName = prompt('Enter name for new item:');
        if (!newName || newName.trim() === '') return;
        
        // Find the parent file for the current item
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => (e.internalName || e.name) === newName.trim())) {
            this.editor.showToast('An item with that name already exists in this file', 'error');
            return;
        }
        
        // Create new item with defaults
        const newItem = {
            id: 'item-' + Date.now(),
            internalName: newName.trim(),
            material: 'DIAMOND_SWORD'
        };
        
        // Add to parent file's entries
        parentFile.entries.push(newItem);
        
        // Open the new item
        newItem._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(newItem, 'item');
        this.editor.showToast(`Created new item "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.renderPackTree();
        }
    }
    
    /**
     * Duplicate the current item within the same file
     */
    duplicateItem() {
        const newName = prompt('Enter name for duplicated item:', this.currentItem.internalName + '_copy');
        if (!newName || newName.trim() === '') return;
        
        // Find the parent file for the current item
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => (e.internalName || e.name) === newName.trim())) {
            this.editor.showToast('An item with that name already exists in this file', 'error');
            return;
        }
        
        // Create a deep copy of the item
        const duplicatedItem = typeof structuredClone !== 'undefined' ? structuredClone(this.currentItem) : JSON.parse(JSON.stringify(this.currentItem));
        duplicatedItem.internalName = newName.trim();
        duplicatedItem.id = 'item-' + Date.now();
        delete duplicatedItem._parentFile;
        
        // Add to parent file's entries
        parentFile.entries.push(duplicatedItem);
        
        // Open the new item
        duplicatedItem._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(duplicatedItem, 'item');
        this.editor.showToast(`Duplicated item as "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.renderPackTree();
        }
    }
    
    /**
     * Find the parent file for the current item
     */
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.items) return null;
        
        // Check if _parentFile reference exists
        if (this.currentItem._parentFile) {
            return pack.items.find(f => f.id === this.currentItem._parentFile.id);
        }
        
        // Search all files for this item
        for (const file of pack.items) {
            if (file.entries && file.entries.some(e => e.id === this.currentItem.id)) {
                return file;
            }
        }
        
        return null;
    }
    
    /**
     * Rename the current item
     */
    renameItem() {
        const newName = prompt('Enter new name for item:', this.currentItem.internalName);
        if (!newName || newName.trim() === '' || newName.trim() === this.currentItem.internalName) return;
        
        // Check if name already exists
        const pack = this.editor.state.currentPack;
        if (pack && pack.items) {
            const existing = pack.items.find(i => i.internalName === newName.trim() && i.id !== this.currentItem.id);
            if (existing) {
                this.editor.showToast('An item with that name already exists', 'error');
                return;
            }
        }
        
        const oldName = this.currentItem.internalName;
        this.currentItem.internalName = newName.trim();
        
        // Update the UI
        this.render(this.currentItem);
        this.attachEventHandlers(this.currentItem);
        this.editor.showToast(`Renamed item from "${oldName}" to "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.render();
        }
    }

    /**
     * Attach lore handlers
     */
    attachLoreHandlers(item) {
        const addBtn = document.querySelector('.add-lore-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!item.Lore) item.Lore = [];
                item.Lore.push('');
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        }

        document.querySelectorAll('.remove-lore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                item.Lore.splice(index, 1);
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.lore-line').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.closest('.list-item').dataset.index);
                item.Lore[index] = e.target.value;
                this.editor.markDirty();
            });
        });
    }

    /**
     * Attach enchantment handlers
     */
    attachEnchantmentHandlers(item) {
        const addBtn = document.querySelector('.add-enchantment-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!item.Enchantments) item.Enchantments = [];
                item.Enchantments.push('SHARPNESS 1');
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        }

        document.querySelectorAll('.remove-enchantment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                item.Enchantments.splice(index, 1);
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.enchantment-item').forEach(enchItem => {
            const index = parseInt(enchItem.dataset.index);
            const typeSelect = enchItem.querySelector('.enchantment-type');
            const levelInput = enchItem.querySelector('.enchantment-level');
            
            [typeSelect, levelInput].forEach(el => {
                el.addEventListener('change', () => {
                    const type = typeSelect.value;
                    const level = levelInput.value || 1;
                    if (type) {
                        item.Enchantments[index] = `${type} ${level}`;
                        this.editor.markDirty();
                    }
                });
            });
        });
    }

    /**
     * Attach attribute handlers
     */
    attachAttributeHandlers(item) {
        document.querySelectorAll('.add-attribute-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slot = e.target.dataset.slot;
                if (!item.Attributes) item.Attributes = {};
                if (!item.Attributes[slot]) item.Attributes[slot] = [];
                item.Attributes[slot].push({ type: '', amount: 0, operation: 'ADD' });
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.remove-attribute').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slot = e.currentTarget.dataset.slot;
                const index = parseInt(e.currentTarget.dataset.index);
                item.Attributes[slot].splice(index, 1);
                if (item.Attributes[slot].length === 0) {
                    delete item.Attributes[slot];
                }
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.attribute-item').forEach(attrItem => {
            const slot = attrItem.closest('.tab-panel').dataset.slot;
            const index = parseInt(attrItem.dataset.index);
            
            ['type', 'amount', 'operation'].forEach(prop => {
                const input = attrItem.querySelector(`.attribute-${prop}`);
                if (input) {
                    input.addEventListener('change', (e) => {
                        // Ensure attributes exist as array for this slot
                        if (!item.Attributes) item.Attributes = {};
                        if (!Array.isArray(item.Attributes[slot])) {
                            item.Attributes[slot] = this.normalizeSlotAttributes(item.Attributes[slot]);
                        }
                        if (!item.Attributes[slot][index]) return;
                        // Keep amount as string to preserve range values like "-1to2"
                        item.Attributes[slot][index][prop] = e.target.value;
                        this.editor.markDirty();
                    });
                }
            });
        });
    }

    /**
     * Attach potion effect handlers
     */
    attachPotionEffectHandlers(item) {
        const addBtn = document.querySelector('.add-potion-effect-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!item.PotionEffects) item.PotionEffects = [];
                item.PotionEffects.push('SPEED 600 0');
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        }

        document.querySelectorAll('.remove-potion-effect').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                item.PotionEffects.splice(index, 1);
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.potion-effect-item').forEach(effectItem => {
            const index = parseInt(effectItem.dataset.index);
            const typeSelect = effectItem.querySelector('.potion-effect-type');
            const durationInput = effectItem.querySelector('.potion-duration');
            const amplifierInput = effectItem.querySelector('.potion-amplifier');
            
            [typeSelect, durationInput, amplifierInput].forEach(el => {
                el.addEventListener('change', () => {
                    const type = typeSelect.value;
                    const duration = durationInput.value || 600;
                    const amplifier = amplifierInput.value || 0;
                    if (type) {
                        item.PotionEffects[index] = `${type} ${duration} ${amplifier}`;
                        this.editor.markDirty();
                    }
                });
            });
        });
    }

    /**
     * Attach banner layer handlers
     */
    attachBannerLayerHandlers(item) {
        const addBtn = document.querySelector('.add-banner-layer-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!item.BannerLayers) item.BannerLayers = [];
                item.BannerLayers.push('WHITE BASE');
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        }

        document.querySelectorAll('.remove-banner-layer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                item.BannerLayers.splice(index, 1);
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.banner-layer-item').forEach(layerItem => {
            const index = parseInt(layerItem.dataset.index);
            const colorSelect = layerItem.querySelector('.banner-color');
            const patternSelect = layerItem.querySelector('.banner-pattern');
            
            [colorSelect, patternSelect].forEach(el => {
                el.addEventListener('change', () => {
                    const color = colorSelect.value;
                    const pattern = patternSelect.value;
                    if (color && pattern) {
                        item.BannerLayers[index] = `${color} ${pattern}`;
                        this.editor.markDirty();
                    }
                });
            });
        });
    }

    /**
     * Attach NBT handlers
     */
    attachNBTHandlers(item) {
        const addBtn = document.querySelector('.add-nbt-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!item.NBT) item.NBT = {};
                const newKey = `custom_tag_${Object.keys(item.NBT).length + 1}`;
                item.NBT[newKey] = 'str:value';
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        }

        document.querySelectorAll('.remove-nbt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nbtItem = e.currentTarget.closest('.nbt-item');
                const key = nbtItem.querySelector('.nbt-key').value;
                delete item.NBT[key];
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.nbt-item').forEach(nbtItem => {
            const keyInput = nbtItem.querySelector('.nbt-key');
            const valueInput = nbtItem.querySelector('.nbt-value');
            const originalKey = keyInput.value;
            
            keyInput.addEventListener('change', (e) => {
                const newKey = e.target.value;
                if (newKey !== originalKey && item.NBT[originalKey]) {
                    item.NBT[newKey] = item.NBT[originalKey];
                    delete item.NBT[originalKey];
                    this.editor.markDirty();
                    window.collapsibleManager.saveStates();
                    this.render(item);
                }
            });
            
            valueInput.addEventListener('input', (e) => {
                item.NBT[keyInput.value] = e.target.value;
                this.editor.markDirty();
            });
        });
    }

    /**
     * Attach skill handlers
     */
    attachSkillHandlers(item) {
        const addBtn = document.querySelector('.add-skill-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!item.Skills) item.Skills = [];
                item.Skills.push('~onConsume @trigger my_skill');
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        }

        document.querySelectorAll('.remove-skill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                item.Skills.splice(index, 1);
                window.collapsibleManager.saveStates();
                this.render(item);
            });
        });

        document.querySelectorAll('.skill-line').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.closest('.list-item').dataset.index);
                item.Skills[index] = e.target.value;
                this.editor.markDirty();
            });
        });
    }

    /**
     * Attach handlers for all basic inputs
     */
    attachBasicInputHandlers(item) {
        // Initialize material dropdown - always recreate to ensure correct item reference
        setTimeout(() => {
            const container = document.getElementById('item-material-dropdown');
            if (container && MINECRAFT_ITEMS) {
                // Always create a new dropdown to ensure correct item binding
                // Clear container first
                container.innerHTML = '';
                window.itemMaterialDropdown = new SearchableDropdown('item-material-dropdown', {
                    items: MINECRAFT_ITEMS,
                    placeholder: 'Search materials...',
                    value: item.Id || '',
                    onSelect: (value) => {
                        item.Id = value;
                        this.syncToFile();
                        this.editor.markDirty();
                    }
                });
            }
        }, 100);

        const simpleFields = [
            { id: 'item-display', prop: 'Display' },
            { id: 'item-amount', prop: 'Amount', type: 'number' },
            { id: 'item-custom-model-data', prop: 'CustomModelData', type: 'number' },
            { id: 'item-color', prop: 'Color' },
            { id: 'item-durability', prop: 'Durability', type: 'number' },
            { id: 'item-max-durability', prop: 'MaxDurability', type: 'number' },
            { id: 'option-RepairCost', prop: 'Options.RepairCost', type: 'number' },
            { id: 'option-StackSize', prop: 'Options.StackSize', type: 'number' },
            { id: 'option-ItemModel', prop: 'Options.ItemModel' },
            { id: 'option-Player', prop: 'Options.Player' },
            { id: 'option-SkinTexture', prop: 'Options.SkinTexture' },
            { id: 'trim-material', prop: 'Trim.material' },
            { id: 'trim-pattern', prop: 'Trim.pattern' },
            { id: 'book-title', prop: 'Book.title' },
            { id: 'book-author', prop: 'Book.author' },
            { id: 'firework-power', prop: 'Firework.power', type: 'number' }
        ];

        simpleFields.forEach(({ id, prop, type }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = type === 'number' ? (e.target.value ? parseFloat(e.target.value) : undefined) : e.target.value;
                    this.setNestedProperty(item, prop, value);
                    this.syncToFile();
                    this.editor.markDirty();
                });
            }
        });

        const colorPreset = document.getElementById('item-color-preset');
        if (colorPreset) {
            colorPreset.addEventListener('change', (e) => {
                if (e.target.value) {
                    document.getElementById('item-color').value = e.target.value;
                    item.Color = e.target.value;
                    this.syncToFile();
                    this.editor.markDirty();
                }
            });
        }

        const booleanOptions = window.ItemOptions?.BOOLEAN_OPTIONS || [];
        booleanOptions.forEach(opt => {
            const checkbox = document.getElementById(`option-${opt.id}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    if (!item.Options) item.Options = {};
                    item.Options[opt.id] = e.target.checked;
                    this.syncToFile();
                    this.editor.markDirty();
                });
            }
        });

        document.querySelectorAll('.hide-flag-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (!item.Hide) item.Hide = [];
                const flag = e.target.dataset.flag;
                if (e.target.checked) {
                    if (!item.Hide.includes(flag)) item.Hide.push(flag);
                } else {
                    item.Hide = item.Hide.filter(f => f !== flag);
                }
                this.editor.markDirty();
            });
        });

        const bookPages = document.getElementById('book-pages');
        if (bookPages) {
            bookPages.addEventListener('input', (e) => {
                if (!item.Book) item.Book = {};
                item.Book.pages = e.target.value.split('\n').filter(p => p.trim());
                this.editor.markDirty();
            });
        }

        const fireworkColors = document.getElementById('firework-colors');
        if (fireworkColors) {
            fireworkColors.addEventListener('input', (e) => {
                if (!item.Firework) item.Firework = {};
                item.Firework.colors = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                this.editor.markDirty();
            });
        }

        const fireworkFadeColors = document.getElementById('firework-fade-colors');
        if (fireworkFadeColors) {
            fireworkFadeColors.addEventListener('input', (e) => {
                if (!item.Firework) item.Firework = {};
                item.Firework.fadeColors = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                this.editor.markDirty();
            });
        }

        const fireworkTrail = document.getElementById('firework-trail');
        if (fireworkTrail) {
            fireworkTrail.addEventListener('change', (e) => {
                if (!item.Firework) item.Firework = {};
                item.Firework.trail = e.target.checked;
                this.editor.markDirty();
            });
        }

        const fireworkFlicker = document.getElementById('firework-flicker');
        if (fireworkFlicker) {
            fireworkFlicker.addEventListener('change', (e) => {
                if (!item.Firework) item.Firework = {};
                item.Firework.flicker = e.target.checked;
                this.editor.markDirty();
            });
        }
    }

    /**
     * Set nested property using dot notation
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        
        if (value === undefined || value === '') {
            delete current[keys[keys.length - 1]];
        } else {
            current[keys[keys.length - 1]] = value;
        }
    }

    /**
     * Collect form data and update the item object
     */
    collectFormData() {
        return this.currentItem;
    }
    
    /**
     * Render file container view (when YML file is selected)
     */
    renderFileContainer(fileContainer, container) {
        container.innerHTML = `
            <div class="file-container-view">
                <div class="file-container-header">
                    <i class="fas fa-file-code" style="font-size: 4rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <h2>${fileContainer._fileName}</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        This file contains ${fileContainer._file.entries.length} item(s)
                    </p>
                </div>
                <div class="file-container-actions">
                    <button class="btn btn-primary btn-large" id="add-item-to-file">
                        <i class="fas fa-plus"></i> Add New Item to this File
                    </button>
                </div>
                <div class="file-container-info" style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 0.5rem;">
                    <p style="margin: 0; color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> 
                        Click on an item in the file tree to edit it, or click the button above to add a new item to this file.
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('add-item-to-file')?.addEventListener('click', () => {
            this.addNewSection();
        });
    }
    
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.items) return null;
        
        if (this.currentItem._isFileContainer) {
            return this.currentItem._file;
        }
        
        if (this.currentItem._parentFile) {
            return pack.items.find(f => f.id === this.currentItem._parentFile.id);
        }
        
        for (const file of pack.items) {
            if (file.entries && file.entries.some(e => e.id === this.currentItem.id)) {
                return file;
            }
        }
        
        return null;
    }
}

console.log('✅ Item Editor loaded');
window.ItemEditor = ItemEditor;
