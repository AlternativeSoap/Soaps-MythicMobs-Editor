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
                        <button class="btn btn-outline btn-danger" id="delete-item" title="Delete this item">
                            <i class="fas fa-trash"></i> Delete
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
                            <small class="form-hint" id="item-name-sanitized" style="color: var(--accent-primary); display: none;"></small>
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
                    <!-- Display Name Section -->
                    <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="item-display" class="form-label" style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 8px;">
                                <i class="fas fa-tag" style="color: #6366f1;"></i>
                                Display Name
                            </label>
                            <input 
                                type="text" 
                                id="item-display" 
                                class="form-input" 
                                value="${item?.Display || ''}"
                                placeholder="&6&lLegendary Sword"
                                style="font-size: 14px;"
                            >
                            <small class="form-hint" style="margin-top: 6px; display: block;">
                                <i class="fas fa-info-circle" style="color: #6366f1; margin-right: 4px;"></i>
                                Supports color codes (&amp;a, &amp;l, etc.) and formatting
                            </small>
                        </div>
                    </div>

                    <!-- Lore Section -->
                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <span style="display: flex; align-items: center; gap: 8px; font-weight: 600;">
                                <i class="fas fa-scroll" style="color: #8b5cf6;"></i>
                                Lore Lines
                                ${loreLines.length > 0 ? `<span style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${loreLines.length}</span>` : ''}
                            </span>
                        </label>
                        <small class="form-hint" style="margin-bottom: 12px; display: block;">
                            <i class="fas fa-info-circle" style="color: #8b5cf6; margin-right: 4px;"></i>
                            Item description lines shown in the tooltip
                        </small>
                        <div id="item-lore-list" class="list-editor">
                            ${loreLines.map((line, index) => `
                                <div class="list-item" data-index="${index}" style="margin-bottom: 8px;">
                                    <span style="color: var(--text-tertiary); font-size: 12px; margin-right: 8px; min-width: 20px; text-align: right;">${index + 1}.</span>
                                    <input 
                                        type="text" 
                                        class="form-input lore-line" 
                                        value="${line}"
                                        placeholder="&7Enter lore text..."
                                        style="flex: 1;"
                                    >
                                    <button type="button" class="btn-icon btn-danger remove-lore" data-index="${index}" title="Remove line">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                            <button type="button" class="add-item-btn add-lore-btn" style="width: 100%; margin-top: 8px;">
                                <i class="fas fa-plus-circle"></i>
                                <span>Add Lore Line</span>
                            </button>
                        </div>
                    </div>

                    <!-- Visual Properties Section -->
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 16px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 16px;">
                            <i class="fas fa-wand-magic-sparkles" style="color: #10b981;"></i>
                            Visual Properties
                        </label>
                        
                        <div class="grid-2" style="gap: 16px;">
                            <!-- Color -->
                            <div class="form-group" id="item-color-group" style="display: none; margin-bottom: 0;">
                                <label for="item-color" class="form-label" style="font-size: 13px; font-weight: 500;">
                                    <i class="fas fa-palette" style="color: #10b981; margin-right: 6px;"></i>
                                    Color (RGB)
                                </label>
                                <div class="color-picker-container" style="display: flex; gap: 8px;">
                                    <input 
                                        type="text" 
                                        id="item-color" 
                                        class="form-input" 
                                        value="${item?.Color || ''}"
                                        placeholder="255,128,0"
                                        style="flex: 1;"
                                    >
                                    <select id="item-color-preset" class="form-select" style="flex: 1;">
                                        <option value="">Presets</option>
                                        ${window.ItemOptions?.PREDEFINED_COLORS.map(color => `
                                            <option value="${color.rgb}">${color.name}</option>
                                        `).join('') || ''}
                                    </select>
                                </div>
                                <small class="form-hint" style="margin-top: 6px;">For leather armor, potions, banners</small>
                            </div>

                            <!-- Durability -->
                            <div class="form-group" id="item-durability-group" style="margin-bottom: 0;">
                                <label for="item-durability" class="form-label" style="font-size: 13px; font-weight: 500;">
                                    <i class="fas fa-heart-crack" style="color: #ef4444; margin-right: 6px;"></i>
                                    Durability
                                </label>
                                <input 
                                    type="number" 
                                    id="item-durability" 
                                    class="form-input" 
                                    value="${item?.Durability || ''}"
                                    min="0"
                                    placeholder="Current value"
                                >
                                <small class="form-hint" style="margin-top: 6px;">Current durability value</small>
                            </div>

                            <!-- Max Durability -->
                            <div class="form-group" id="item-max-durability-group" style="margin-bottom: 0;">
                                <label for="item-max-durability" class="form-label" style="font-size: 13px; font-weight: 500;">
                                    <i class="fas fa-shield-halved" style="color: #3b82f6; margin-right: 6px;"></i>
                                    Max Durability
                                </label>
                                <input 
                                    type="number" 
                                    id="item-max-durability" 
                                    class="form-input" 
                                    value="${item?.MaxDurability || ''}"
                                    min="1"
                                    placeholder="Override max"
                                >
                                <small class="form-hint" style="margin-top: 6px;">Override maximum durability</small>
                            </div>
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
                        <button type="button" class="add-item-btn add-enchantment-btn">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Enchantment</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attributes Section (Slot-based with tabs) - Enhanced UX
     */
    generateAttributesSection(item) {
        const attributes = item?.Attributes || {};
        const slots = window.ItemOptions?.ATTRIBUTE_SLOTS || [];
        const attributeTypes = window.ItemOptions?.ATTRIBUTE_TYPES || [];
        const operations = window.ItemOptions?.ATTRIBUTE_OPERATIONS || [];
        
        // Count total attributes across all slots
        const totalAttributes = Object.values(attributes).reduce((sum, slotAttrs) => {
            return sum + (Array.isArray(slotAttrs) ? slotAttrs.length : 0);
        }, 0);
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-chart-line"></i> Attributes
                        ${totalAttributes > 0 ? `<span class="card-badge">${totalAttributes}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: start; gap: 10px;">
                            <i class="fas fa-info-circle" style="color: #3b82f6; margin-top: 2px;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #3b82f6;">How Attributes Work:</strong>
                                <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.875rem; color: var(--text-secondary);">
                                    <li><strong>ADD</strong> - Adds to base value (e.g., +5 damage)</li>
                                    <li><strong>MULTIPLY_BASE</strong> - Multiplies base value before additions (e.g., ×1.2 = +20%)</li>
                                    <li><strong>MULTIPLY_TOTAL</strong> - Multiplies final value after all additions</li>
                                    <li>Values can be numbers (5), percentages (10%), or ranges (-1to2)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="tabs-container">
                        <div class="tabs-header">
                            ${slots.map((slot, index) => {
                                const slotColors = {
                                    'MainHand': '#ef4444',
                                    'OffHand': '#3b82f6',
                                    'Head': '#f59e0b',
                                    'Chest': '#10b981',
                                    'Legs': '#8b5cf6',
                                    'Feet': '#ec4899'
                                };
                                const slotColor = slotColors[slot.id] || '#6b7280';
                                const rawSlotAttributes = attributes[slot.id] || [];
                                const slotAttrCount = Array.isArray(rawSlotAttributes) ? rawSlotAttributes.length : 0;
                                
                                return `
                                    <button 
                                        type="button" 
                                        class="tab-btn ${index === 0 ? 'active' : ''}" 
                                        data-slot="${slot.id}"
                                        title="${slot.description}"
                                        style="border-bottom: 3px solid ${slotColor}; position: relative;"
                                    >
                                        ${slot.name}
                                        ${slotAttrCount > 0 ? `<span class="badge" style="background: ${slotColor}; margin-left: 6px; font-size: 0.7rem;">${slotAttrCount}</span>` : ''}
                                    </button>
                                `;
                            }).join('')}
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
                                            <button type="button" class="add-item-btn add-attribute-btn" data-slot="${slot.id}">
                                                <i class="fas fa-plus-circle"></i>
                                                <span>Add Attribute</span>
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
     * Generate single attribute item HTML with enhanced UX
     */
    generateAttributeItem(slot, attr, index, attributeTypes, operations) {
        // Support both numeric amounts and range strings like "-1to2"
        const amountValue = attr?.amount !== undefined ? attr.amount : 0;
        
        // Get slot color for visual indicator
        const slotColors = {
            'MainHand': '#ef4444',
            'OffHand': '#3b82f6',
            'Head': '#f59e0b',
            'Chest': '#10b981',
            'Legs': '#8b5cf6',
            'Feet': '#ec4899'
        };
        const slotColor = slotColors[slot] || '#6b7280';
        
        // Get operation icon and color
        const operationStyles = {
            'ADD': { icon: '+', color: '#10b981', label: 'Add' },
            'MULTIPLY_BASE': { icon: '×', color: '#3b82f6', label: 'Multiply' },
            'MULTIPLY_TOTAL': { icon: '⊗', color: '#8b5cf6', label: 'Multiply Total' }
        };
        const currentOp = operationStyles[attr?.operation] || operationStyles['ADD'];
        
        // Show preview of attribute effect
        let previewText = '';
        if (attr?.type && attr?.amount !== undefined && attr?.amount !== '') {
            const typeName = attributeTypes.find(t => t.id === attr.type)?.name || attr.type;
            previewText = `<span class="attribute-preview" style="color: ${currentOp.color};">${currentOp.icon} ${typeName}: ${amountValue}</span>`;
        }
        
        return `
            <div class="list-item attribute-item" data-index="${index}" style="border-left: 3px solid ${slotColor}; padding-left: 12px; background: linear-gradient(to right, ${slotColor}08, transparent);">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <select class="form-select attribute-type" required style="font-weight: 500;">
                        <option value="">Select Attribute...</option>
                        ${attributeTypes.map(type => `
                            <option value="${type.id}" ${attr?.type === type.id || attr?.type?.toUpperCase() === type.id?.toUpperCase() ? 'selected' : ''} title="${type.description}">
                                ${type.name}
                            </option>
                        `).join('')}
                    </select>
                    ${previewText ? `<div style="font-size: 0.75rem; margin-left: 4px;">${previewText}</div>` : ''}
                </div>
                <input 
                    type="text" 
                    class="form-input attribute-amount" 
                    value="${amountValue}"
                    placeholder="Amount (e.g., 5, 10%, or -1to2)"
                    title="Enter a number, percentage (10%), or range (-1to2)"
                    required
                    style="text-align: center; font-weight: 600;"
                >
                <select class="form-select attribute-operation" required>
                    <option value="">Operation...</option>
                    ${operations.map(op => {
                        const opStyle = operationStyles[op.id] || { icon: '', color: '#6b7280' };
                        return `
                            <option value="${op.id}" ${attr?.operation === op.id || attr?.operation?.toUpperCase() === op.id?.toUpperCase() ? 'selected' : ''} title="${op.description}">
                                ${opStyle.icon} ${op.name}
                            </option>
                        `;
                    }).join('')}
                </select>
                <button type="button" class="btn-icon btn-danger remove-attribute" data-slot="${slot}" data-index="${index}" title="Remove this attribute">
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
                        <button type="button" class="add-item-btn add-potion-effect-btn">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Potion Effect</span>
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
        const hideFlags = window.ItemOptions?.HIDE_FLAGS || [];
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-cog"></i> Options
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    
                    <!-- Boolean Options -->
                    <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <span style="display: flex; align-items: center; gap: 8px; font-weight: 600;">
                                <i class="fas fa-toggle-on" style="color: #3b82f6;"></i>
                                Toggle Settings
                                <span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${booleanOptions.length}</span>
                            </span>
                        </label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; background: rgba(255, 255, 255, 0.5); padding: 12px; border-radius: 6px;">
                            ${booleanOptions.map(opt => `
                                <label class="checkbox-label-enhanced" title="${opt.description}">
                                    <input 
                                        type="checkbox" 
                                        id="option-${opt.id}" 
                                        ${options[opt.id] === true ? 'checked' : ''}
                                    >
                                    <span class="checkbox-custom"></span>
                                    <span class="checkbox-text">${opt.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Number Options -->
                    <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, transparent 100%); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 16px;">
                            <i class="fas fa-hashtag" style="color: #f97316;"></i>
                            Numeric Settings
                            <span style="background: rgba(249, 115, 22, 0.15); color: #f97316; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${numberOptions.length}</span>
                        </label>
                        <div class="grid-2" style="gap: 16px;">
                            ${numberOptions.map(opt => `
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label for="option-${opt.id}" class="form-label" style="font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-${opt.id === 'RepairCost' ? 'wrench' : 'layer-group'}" style="color: #f97316;"></i>
                                        ${opt.name}
                                    </label>
                                    <input 
                                        type="number" 
                                        id="option-${opt.id}" 
                                        class="form-input" 
                                        value="${options[opt.id] !== undefined ? options[opt.id] : opt.default}"
                                        min="${opt.min}"
                                        ${opt.max ? `max="${opt.max}"` : ''}
                                        style="font-weight: 600; font-size: 14px;"
                                    >
                                    <small class="form-hint" style="margin-top: 6px;">
                                        <i class="fas fa-info-circle" style="color: #f97316; margin-right: 4px;"></i>
                                        ${opt.description || ''}
                                    </small>
                                    ${opt.warning ? `
                                        <div style="background: #fff3cd; border-left: 3px solid #ffc107; padding: 10px 12px; margin-top: 10px; border-radius: 4px; font-size: 12px; color: #856404; display: flex; align-items: start; gap: 8px;">
                                            <i class="fas fa-exclamation-triangle" style="color: #f59e0b; margin-top: 2px;"></i>
                                            <span>${opt.warning}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Text Options (Collapsible) -->
                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; cursor: pointer;" id="text-options-toggle">
                            <span style="display: flex; align-items: center; gap: 8px; font-weight: 600;">
                                <i class="fas fa-keyboard" style="color: #8b5cf6;"></i>
                                Advanced Text Settings
                                <span style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${textOptions.length}</span>
                            </span>
                            <i class="fas fa-chevron-down" id="text-options-chevron" style="color: #8b5cf6; transition: transform 0.2s;"></i>
                        </label>
                        <small class="form-hint" style="margin-bottom: 12px; display: block;">
                            <i class="fas fa-info-circle" style="color: #8b5cf6; margin-right: 4px;"></i>
                            Click to show/hide advanced options (rarely used)
                        </small>
                        <div id="text-options-content" style="display: none; margin-top: 12px;">
                            <div class="grid-2" style="gap: 16px;">
                                ${textOptions.map(opt => `
                                    <div class="form-group" id="option-${opt.id}-group" style="margin-bottom: 0;">
                                        <label for="option-${opt.id}" class="form-label" style="font-size: 13px; font-weight: 500;">
                                            <i class="fas fa-text-height" style="color: #8b5cf6; margin-right: 6px;"></i>
                                            ${opt.name}
                                        </label>
                                        <input 
                                            type="text" 
                                            id="option-${opt.id}" 
                                            class="form-input" 
                                            value="${options[opt.id] || ''}"
                                            placeholder="Optional"
                                        >
                                        <small class="form-hint" style="margin-top: 6px;">${opt.description}</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Hide Flags -->
                    <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 16px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 12px;">
                            <i class="fas fa-eye-slash" style="color: #ef4444;"></i>
                            Visibility Controls
                            <span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${hideFlags.length}</span>
                        </label>
                        <small class="form-hint" style="margin-bottom: 12px; display: block;">
                            <i class="fas fa-info-circle" style="color: #ef4444; margin-right: 4px;"></i>
                            Hide specific information from item tooltip
                        </small>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; background: rgba(255, 255, 255, 0.5); padding: 12px; border-radius: 6px;">
                            ${hideFlags.map(flag => `
                                <label class="checkbox-label-enhanced" title="${flag.description}">
                                    <input 
                                        type="checkbox" 
                                        class="hide-flag-checkbox" 
                                        data-flag="${flag.id}"
                                        ${(item?.Hide || []).includes(flag.id) ? 'checked' : ''}
                                    >
                                    <span class="checkbox-custom"></span>
                                    <span class="checkbox-text">${flag.name}</span>
                                </label>
                            `).join('')}
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
                        <button type="button" class="add-item-btn add-banner-layer-btn">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Banner Layer</span>
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
                                <button type="button" class="add-item-btn add-nbt-btn">
                                    <i class="fas fa-plus-circle"></i>
                                    <span>Add NBT Tag</span>
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
                                <button type="button" class="add-item-btn add-skill-btn">
                                    <i class="fas fa-plus-circle"></i>
                                    <span>Add Skill</span>
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
        
        document.getElementById('delete-item')?.addEventListener('click', () => {
            this.deleteItem();
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
                let newName = e.target.value;
                
                // Show sanitization preview if needed
                const sanitizedName = this.editor.sanitizeInternalName(newName);
                const sanitizedHint = document.getElementById('item-name-sanitized');
                if (sanitizedHint && sanitizedName !== newName && newName.trim()) {
                    sanitizedHint.textContent = `Will be saved as: ${sanitizedName}`;
                    sanitizedHint.style.display = 'block';
                } else if (sanitizedHint) {
                    sanitizedHint.style.display = 'none';
                }
                
                // Apply sanitization
                item.internalName = sanitizedName;
                document.querySelector('.item-name').textContent = sanitizedName || 'New Item';
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
        this.attachOptionsHandlers(item);
        this.initializeAttributeTabs();
    }
    
    /**
     * Attach options handlers (collapsible text options)
     */
    attachOptionsHandlers(item) {
        // Toggle text options section
        const textOptionsToggle = document.getElementById('text-options-toggle');
        const textOptionsContent = document.getElementById('text-options-content');
        const textOptionsChevron = document.getElementById('text-options-chevron');
        
        if (textOptionsToggle && textOptionsContent && textOptionsChevron) {
            textOptionsToggle.addEventListener('click', () => {
                const isHidden = textOptionsContent.style.display === 'none';
                textOptionsContent.style.display = isHidden ? 'block' : 'none';
                textOptionsChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }
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
    async addNewSection() {
        let newName = await this.editor.showPrompt('New Item', 'Enter name for new item:');
        if (!newName || newName.trim() === '') return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
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
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'item');
        }
    }
    
    /**
     * Duplicate the current item within the same file
     */
    async duplicateItem() {
        let newName = await this.editor.showPrompt('Duplicate Item', 'Enter name for duplicated item:', this.currentItem.internalName + '_copy');
        if (!newName || newName.trim() === '') return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
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
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'item');
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
    async renameItem() {
        let newName = await this.editor.showPrompt('Rename Item', 'Enter new name for item:', this.currentItem.internalName);
        if (!newName || newName.trim() === '' || newName.trim() === this.currentItem.internalName) return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
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
     * Delete the current item
     */
    async deleteItem() {
        const confirmed = await this.editor.showConfirmDialog(
            'Delete Item',
            `Delete item "${this.currentItem.internalName}"? This cannot be undone.`,
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
        
        const itemName = this.currentItem.internalName;
        
        // Remove from entries
        parentFile.entries = parentFile.entries.filter(e => e.id !== this.currentItem.id);
        
        // Update pack tree
        this.editor.packManager.updateFileContainer(parentFile.id, 'item');
        
        // Show success message
        this.editor.showToast(`Item "${itemName}" deleted`, 'success');
        this.editor.markDirty();
        
        // Navigate to appropriate view
        if (parentFile.entries.length > 0) {
            this.editor.openFile(parentFile.entries[0], 'item');
        } else {
            this.editor.openFile(parentFile, 'item');
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
                const newIndex = item.Enchantments.length;
                item.Enchantments.push('SHARPNESS 1');
                
                // Add new enchantment row directly to DOM instead of full re-render
                const enchantmentsList = window.EnchantmentData?.ENCHANTMENTS || [];
                const newRow = document.createElement('div');
                newRow.className = 'list-item enchantment-item';
                newRow.dataset.index = newIndex;
                newRow.innerHTML = `
                    <select class="form-select enchantment-type">
                        <option value="">Select Enchantment...</option>
                        ${enchantmentsList.map(e => `
                            <option value="${e.id}" ${e.id === 'SHARPNESS' ? 'selected' : ''}>
                                ${e.name} (Max: ${e.maxLevel})
                            </option>
                        `).join('')}
                    </select>
                    <input 
                        type="text" 
                        class="form-input enchantment-level" 
                        value="1"
                        placeholder="Level (e.g., 3 or 1to5)"
                        title="Enter a level number or range like 1to5"
                    >
                    <button type="button" class="btn-icon btn-danger remove-enchantment" data-index="${newIndex}" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Insert before the add button
                addBtn.parentElement.insertBefore(newRow, addBtn);
                
                // Attach event listeners to new row
                const typeSelect = newRow.querySelector('.enchantment-type');
                const levelInput = newRow.querySelector('.enchantment-level');
                const removeBtn = newRow.querySelector('.remove-enchantment');
                
                [typeSelect, levelInput].forEach(el => {
                    el.addEventListener('change', () => {
                        const type = typeSelect.value;
                        const level = levelInput.value || 1;
                        if (type) {
                            item.Enchantments[newIndex] = `${type} ${level}`;
                            this.editor.markDirty();
                            this.editor.updateYAMLPreview();
                        }
                    });
                });
                
                removeBtn.addEventListener('click', () => {
                    item.Enchantments.splice(newIndex, 1);
                    window.collapsibleManager.saveStates();
                    this.render(item);
                });
                
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
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
                        this.editor.updateYAMLPreview();
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
                const newIndex = item.Attributes[slot].length;
                item.Attributes[slot].push({ type: 'Damage', amount: 0, operation: 'ADD' });
                
                // Add new attribute row directly to DOM instead of full re-render
                const attributeTypes = window.ItemOptions?.ATTRIBUTE_TYPES || [];
                const operations = window.ItemOptions?.ATTRIBUTE_OPERATIONS || [];
                const newRow = document.createElement('div');
                newRow.className = 'list-item attribute-item';
                newRow.dataset.index = newIndex;
                newRow.innerHTML = `
                    <select class="form-select attribute-type" required>
                        <option value="">Select Type...</option>
                        ${attributeTypes.map(type => `
                            <option value="${type.id}" ${type.id === 'Damage' ? 'selected' : ''} title="${type.description}">
                                ${type.name}
                            </option>
                        `).join('')}
                    </select>
                    <input 
                        type="text" 
                        class="form-input attribute-amount" 
                        value="0"
                        placeholder="Amount (e.g., 5 or -1to2)"
                        title="Enter a number or range like -1to2"
                        required
                    >
                    <select class="form-select attribute-operation" required>
                        <option value="">Operation...</option>
                        ${operations.map(op => `
                            <option value="${op.id}" ${op.id === 'ADD' ? 'selected' : ''} title="${op.description}">
                                ${op.name}
                            </option>
                        `).join('')}
                    </select>
                    <button type="button" class="btn-icon btn-danger remove-attribute" data-slot="${slot}" data-index="${newIndex}" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Find the attribute list for this slot and insert before the add button
                const attributeList = e.target.closest('.attribute-list');
                attributeList.insertBefore(newRow, btn);
                
                // Attach event listeners to new row
                const typeSelect = newRow.querySelector('.attribute-type');
                const amountInput = newRow.querySelector('.attribute-amount');
                const operationSelect = newRow.querySelector('.attribute-operation');
                const removeBtn = newRow.querySelector('.remove-attribute');
                
                [typeSelect, amountInput, operationSelect].forEach(input => {
                    input.addEventListener('change', (e) => {
                        const prop = e.target.classList.contains('attribute-type') ? 'type' :
                                     e.target.classList.contains('attribute-amount') ? 'amount' : 'operation';
                        if (!item.Attributes[slot][newIndex]) return;
                        item.Attributes[slot][newIndex][prop] = e.target.value;
                        this.editor.markDirty();
                        this.editor.updateYAMLPreview();
                    });
                });
                
                removeBtn.addEventListener('click', () => {
                    item.Attributes[slot].splice(newIndex, 1);
                    if (item.Attributes[slot].length === 0) {
                        delete item.Attributes[slot];
                    }
                    window.collapsibleManager.saveStates();
                    this.render(item);
                });
                
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
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
                        this.editor.updateYAMLPreview();
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
     * Update NBT list without full re-render
     */
    updateNBTList(item) {
        const container = document.getElementById('item-nbt-list');
        if (!container) return;
        
        const nbtTags = item?.NBT || {};
        const entries = Object.entries(nbtTags);
        
        // Update list content
        const nbtItemsHTML = entries.map(([key, value], index) => `
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
        `).join('');
        
        container.innerHTML = nbtItemsHTML + `
            <button type="button" class="add-item-btn add-nbt-btn">
                <i class="fas fa-plus-circle"></i>
                <span>Add NBT Tag</span>
            </button>
        `;
        
        // Update badge count in header
        const header = container.closest('.card').querySelector('.card-title');
        const badge = header?.querySelector('.card-badge');
        const count = entries.length;
        
        if (count > 0) {
            if (badge) {
                badge.textContent = count;
            } else {
                const icon = header?.querySelector('.collapse-icon');
                if (icon) {
                    icon.insertAdjacentHTML('beforebegin', `<span class="card-badge">${count}</span>`);
                }
            }
        } else if (badge) {
            badge.remove();
        }
        
        // Reattach handlers
        this.attachNBTHandlers(item);
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
                this.editor.markDirty();
                // Use partial update instead of full render
                this.updateNBTList(item);
            });
        }

        document.querySelectorAll('.remove-nbt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nbtItem = e.currentTarget.closest('.nbt-item');
                const key = nbtItem.querySelector('.nbt-key').value;
                delete item.NBT[key];
                this.editor.markDirty();
                // Use partial update instead of full render
                this.updateNBTList(item);
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
                    // Use partial update instead of full render
                    this.updateNBTList(item);
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
                    categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : (window.MINECRAFT_ITEM_CATEGORIES || null),
                    items: !window.getCombinedItemCategories && !window.MINECRAFT_ITEM_CATEGORIES ? MINECRAFT_ITEMS : null,
                    useIcons: true,
                    storageKey: 'item-material',
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

// Loaded silently
window.ItemEditor = ItemEditor;
