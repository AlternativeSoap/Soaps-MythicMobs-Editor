/**
 * MobDropsEditor Component
 * Complete drops editor supporting all MythicMobs drop types
 */

// Glow colors for itemglowcolor attribute
const GLOW_COLORS = [
    { value: 'AQUA', label: 'Aqua', hex: '#55FFFF' },
    { value: 'BLACK', label: 'Black', hex: '#000000' },
    { value: 'BLUE', label: 'Blue', hex: '#5555FF' },
    { value: 'DARK_BLUE', label: 'Dark Blue', hex: '#0000AA' },
    { value: 'DARK_GREEN', label: 'Dark Green', hex: '#00AA00' },
    { value: 'DARK_GRAY', label: 'Dark Gray', hex: '#555555' },
    { value: 'DARK_RED', label: 'Dark Red', hex: '#AA0000' },
    { value: 'GOLD', label: 'Gold', hex: '#FFAA00' },
    { value: 'GRAY', label: 'Gray', hex: '#AAAAAA' },
    { value: 'GREEN', label: 'Green', hex: '#55FF55' },
    { value: 'LIGHT_PURPLE', label: 'Light Purple', hex: '#FF55FF' },
    { value: 'RED', label: 'Red', hex: '#FF5555' },
    { value: 'WHITE', label: 'White', hex: '#FFFFFF' },
    { value: 'YELLOW', label: 'Yellow', hex: '#FFFF55' }
];

// Drop types that support inline fancy attributes
const INLINE_FANCY_SUPPORTED = ['item', 'mythicmob', 'mmoitems', 'itemvariable'];

// Drop types that don't support fancy attributes at all
const NO_FANCY_SUPPORT = ['exp', 'command'];

class MobDropsEditor {
    constructor(containerId, drops = []) {
        this.container = document.getElementById(containerId);
        this.drops = drops || [];
        this.changeCallback = null;
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="mobdrops-editor">
                <div class="drops-list">
                    ${this.renderDropsList()}
                </div>
                <div class="mobdrops-footer" style="position: sticky; bottom: 0; background: var(--bg-primary); padding: 12px 0; border-top: 1px solid var(--border-primary); z-index: 10;">
                    <button class="btn btn-primary add-drop-btn" id="add-mobdrop-btn" style="width: 100%;">
                        <i class="fas fa-plus"></i> Add Drop
                    </button>
                </div>
            </div>
        `;
    }
    
    renderDropsList() {
        if (this.drops.length === 0) {
            return '<div class="empty-state">No drops configured. Click "Add Drop" to create one.</div>';
        }
        
        return this.drops.map((drop, index) => {
            const dropType = DROP_TYPES.find(t => t.id === drop.type) || DROP_TYPES[0];
            const displayName = this.getDropDisplayName(drop);
            const hasAttributes = drop.attributes && Object.keys(drop.attributes).length > 0;
            const hasInline = drop.inlineAttributes && Object.keys(drop.inlineAttributes).length > 0;
            const hasFancy = drop.fancyAttributes && Object.keys(drop.fancyAttributes).length > 0;
            
            return `
                <div class="drop-item" data-index="${index}">
                    <div class="drop-grip"><i class="fas fa-grip-vertical"></i></div>
                    <div class="drop-info">
                        <div class="drop-item-name">
                            <i class="fas fa-${dropType.icon}"></i>
                            ${displayName}
                            <span class="drop-type-badge ${drop.type}">${dropType.name}</span>
                            ${hasAttributes ? '<span class="badge badge-info" title="Has attributes"><i class="fas fa-cog"></i></span>' : ''}
                            ${hasInline ? '<span class="badge badge-warning" title="Has inline attributes"><i class="fas fa-palette"></i></span>' : ''}
                            ${hasFancy ? '<span class="badge badge-success" title="Has fancy attributes"><i class="fas fa-sparkles"></i></span>' : ''}
                        </div>
                        <div class="drop-details">
                            <span class="drop-amount">Amount: ${drop.amount || '1'}</span>
                            <span class="drop-chance ${this.getChanceClass(drop.chance)}">
                                Chance: ${this.formatChance(drop.chance)}
                            </span>
                        </div>
                    </div>
                    <div class="drop-actions">
                        <button class="btn btn-icon edit-mobdrop-btn" data-index="${index}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon delete-mobdrop-btn" data-index="${index}" title="Delete">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getDropDisplayName(drop) {
        switch(drop.type) {
            case 'exp':
            case 'mcmmo-exp':
            case 'money':
                return drop.amount || drop.item || '?';
            case 'mythicmob':
                return drop.attributes?.type || 'Unknown Mob';
            case 'command':
                const cmd = drop.attributes?.command || 'No command';
                return cmd.length > 30 ? cmd.substring(0, 30) + '...' : cmd;
            case 'mmoitems':
                return `${drop.attributes?.type || '?'}:${drop.attributes?.id || '?'}`;
            case 'vanillaLootTable':
                return drop.table || 'Unknown Table';
            case 'itemvariable':
                return drop.attributes?.variable || 'No variable';
            case 'nothing':
                return 'Nothing';
            default:
                return drop.item || 'Unknown Item';
        }
    }
    
    getChanceClass(chance) {
        const c = parseFloat(chance) || 0;
        if (c >= 1.0) return 'guaranteed';
        if (c >= 0.5) return 'high';
        if (c >= 0.25) return 'medium';
        return 'low';
    }
    
    formatChance(chance) {
        const c = parseFloat(chance) || 0;
        if (c >= 1.0) return '100% (Guaranteed)';
        return `${(c * 100).toFixed(1)}%`;
    }
    
    attachEventListeners() {
        if (!this.container) return;
        
        // Add drop button
        const addBtn = this.container.querySelector('#add-mobdrop-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showDropEditor());
        }
        
        // Edit drop buttons
        this.container.querySelectorAll('.edit-mobdrop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.showDropEditor(index);
            });
        });
        
        // Delete drop buttons
        this.container.querySelectorAll('.delete-mobdrop-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                const displayName = this.getDropDisplayName(this.drops[index]);
                const confirmed = await this.editor.showConfirmDialog('Delete Drop', `Delete drop "${displayName}"?`, 'Delete', 'Cancel');
                if (confirmed) {
                    this.drops.splice(index, 1);
                    this.render();
                    this.attachEventListeners();
                    this.triggerChange();
                }
            });
        });
    }
    
    showDropEditor(index = null) {
        // Check if DROP_TYPES is loaded
        if (!window.DROP_TYPES || window.DROP_TYPES.length === 0) {
            alert('Drop types not loaded yet. Please wait a moment and try again.');
            console.error('DROP_TYPES not loaded:', window.DROP_TYPES);
            return;
        }

        const drop = index !== null ? {...this.drops[index]} : {
            type: 'item',
            item: '',
            amount: '1',
            chance: '1.0',
            attributes: {},
            inlineAttributes: {},
            fancyAttributes: {}
        };
        
        // Ensure nested objects exist
        drop.attributes = drop.attributes || {};
        drop.inlineAttributes = drop.inlineAttributes || {};
        drop.fancyAttributes = drop.fancyAttributes || {};
        
        // Create modal with tabs
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.dataset.currentTab = 'basic';
        modal.innerHTML = `
            <div class="modal-content drop-editor-modal large-modal" style="max-width: 1600px;">
                <div class="modal-header">
                    <div>
                        <h3><i class="fas fa-box"></i> ${index !== null ? 'Edit' : 'Add'} Drop</h3>
                        <div class="breadcrumb">
                            <span id="drop-breadcrumb-text">Configuration</span>
                        </div>
                    </div>
                    <button class="modal-close" id="close-mobdrop-editor">&times;</button>
                </div>
                
                <div class="modal-body">
                    ${this.renderDropTypeSelector(drop)}
                    
                    <div class="drop-editor-tabs">
                        <button class="drop-tab active" data-tab="basic">
                            <i class="fas fa-sliders"></i> Basic
                        </button>
                        <button class="drop-tab" data-tab="attributes">
                            <i class="fas fa-cogs"></i> Attributes
                        </button>
                        <button class="drop-tab" data-tab="inline">
                            <i class="fas fa-tags"></i> Inline
                        </button>
                        <button class="drop-tab" data-tab="fancy">
                            <i class="fas fa-sparkles"></i> Fancy
                        </button>
                    </div>
                    
                    <div id="drop-config-container">
                        ${this.renderDropConfigurationTabs(drop)}
                    </div>
                    
                    <!-- Persistent YAML Preview Section -->
                    <div class="drop-preview-persistent" id="drop-preview-persistent">
                        <div class="preview-header">
                            <h4><i class="fas fa-eye"></i> YAML Preview</h4>
                            <button class="btn btn-outline" id="copy-yaml-btn"><i class="fas fa-copy"></i> Copy</button>
                        </div>
                        <pre class="yaml-preview"><code id="yaml-preview-code">${this.escapeHtml(this.generateYAMLPreview(drop, (window.DROP_TYPES || []).find(t => t.id === drop.type)))}</code></pre>
                        <div class="preview-info">
                            <i class="fas fa-info-circle"></i> This YAML will be added to your Drops section
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-mobdrop-btn">Cancel</button>
                    <button class="btn btn-primary" id="save-mobdrop-btn">
                        <i class="fas fa-save"></i> ${index !== null ? 'Update' : 'Add'} Drop
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.attachDropEditorListeners(modal, drop, index);
        
        // Initialize item dropdown after modal is in DOM
        setTimeout(() => this.initializeItemDropdown(), 50);
    }
    
    renderDropTypeSelector(drop) {
        return `
            <div class="form-group">
                <label class="form-label">
                    <i class="fas fa-layer-group"></i> Drop Type
                </label>
                <div class="drop-type-cards">
                    ${(window.DROP_TYPES || []).map(type => `
                        <div class="drop-type-card ${drop.type === type.id ? 'selected' : ''}" data-type="${type.id}">
                            <i class="fas fa-${type.icon}"></i>
                            <div class="drop-type-info">
                                <strong>${type.name}</strong>
                                <small>${type.description}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <input type="hidden" id="mobdrop-type-select" value="${drop.type}">
            </div>
        `;
    }
    
    renderDropConfigurationTabs(drop) {
        const dropType = (window.DROP_TYPES || []).find(t => t.id === drop.type) || (window.DROP_TYPES || [])[0];
        let html = '<div class="drop-tabs-content">';
        
        if (!dropType || !dropType.fields) {
            html += '<div class="alert alert-warning">Drop configuration not loaded. Please refresh the page.</div>';
            html += '</div>';
            return html;
        }
        
        // Basic Tab
        html += '<div class="drop-tab-content active" data-tab-content="basic">';
        html += this.renderBasicTab(drop, dropType);
        html += '</div>';
        
        // Attributes Tab
        html += '<div class="drop-tab-content" data-tab-content="attributes">';
        html += this.renderAttributesTab(drop, dropType);
        html += '</div>';
        
        // Inline Tab
        html += '<div class="drop-tab-content" data-tab-content="inline">';
        html += this.renderInlineTab(drop, dropType);
        html += '</div>';
        
        // Fancy Tab
        html += '<div class="drop-tab-content" data-tab-content="fancy">';
        html += this.renderFancyTab(drop, dropType);
        html += '</div>';
        
        html += '</div>';
        return html;
    }
    
    renderBasicTab(drop, dropType) {
        let html = '<div class="config-section">';
        html += '<h4><i class="fas fa-sliders"></i> Basic Configuration</h4>';
        
        dropType.fields.forEach(field => {
            const value = field.name === 'amount' ? drop.amount : 
                         field.name === 'chance' ? drop.chance :
                         field.name === 'table' ? drop.table :
                         drop.item;
            
            html += this.renderField(field, value);
        });
        
        // Render basicFields (e.g., mob type for mythicmob drops)
        if (dropType.basicFields && dropType.basicFields.length > 0) {
            dropType.basicFields.forEach(field => {
                const value = drop.attributes && drop.attributes[field.name];
                html += this.renderField(field, value, 'attributes');
            });
        }
        
        html += '</div>';
        return html;
    }
    
    renderAttributesTab(drop, dropType) {
        let html = '<div class="config-section">';
        
        if (dropType.attributes && dropType.attributes.length > 0) {
            html += `<h4><i class="fas fa-cogs"></i> ${dropType.name} Attributes</h4>`;
            html += '<p class="help-text">Type-specific configuration options</p>';
            
            dropType.attributes.forEach(attr => {
                const value = drop.attributes[attr.name];
                html += this.renderField(attr, value, 'attributes');
            });
        } else {
            html += '<div class="empty-state">No type-specific attributes for this drop type.</div>';
        }
        
        html += '</div>';
        return html;
    }
    
    renderInlineTab(drop, dropType) {
        let html = '<div class="config-section">';
        html += '<h4><i class="fas fa-tags"></i> Inline Item Attributes</h4>';
        html += '<p class="help-text">Item-specific attributes like enchantments, lore, etc.</p>';
        
        if (window.INLINE_ITEM_ATTRIBUTES && INLINE_ITEM_ATTRIBUTES.length > 0) {
            INLINE_ITEM_ATTRIBUTES.forEach(category => {
                html += `<div class="attribute-category"><strong>${category.category}</strong></div>`;
                category.attributes.forEach(attr => {
                    const value = drop.inlineAttributes[attr.name];
                    html += this.renderField(attr, value, 'inlineAttributes');
                });
            });
        } else {
            html += '<div class="empty-state">Inline attributes not loaded.</div>';
        }
        
        html += '</div>';
        return html;
    }
    
    renderFancyTab(drop, dropType) {
        let html = '<div class="config-section">';
        html += '<h4><i class="fas fa-sparkles"></i> Fancy Drop Attributes</h4>';
        
        // Check if this drop type supports fancy attributes
        const supportsFancy = INLINE_FANCY_SUPPORTED.includes(drop.type);
        const noFancy = NO_FANCY_SUPPORT.includes(drop.type);
        
        if (noFancy) {
            html += '<div class="alert alert-warning">';
            html += '<i class="fas fa-exclamation-triangle"></i> ';
            html += `This drop type (${dropType.name}) does not support fancy attributes.`;
            html += '</div>';
        } else {
            if (!supportsFancy) {
                html += '<div class="alert alert-info">';
                html += '<i class="fas fa-info-circle"></i> ';
                html += 'Some fancy attributes may not work with this drop type.';
                html += '</div>';
            }
            
            html += '<p class="help-text">Visual effects and special behaviors (requires DropMethod: FANCY at mob level)</p>';
            
            if (window.FANCY_DROP_ATTRIBUTES && FANCY_DROP_ATTRIBUTES.length > 0) {
                FANCY_DROP_ATTRIBUTES.forEach(category => {
                    html += `<div class="attribute-category"><strong>${category.category}</strong></div>`;
                    category.attributes.forEach(attr => {
                        const value = drop.fancyAttributes[attr.name];
                        html += this.renderField(attr, value, 'fancyAttributes');
                    });
                });
            } else {
                html += '<div class="empty-state">Fancy attributes not loaded.</div>';
            }
        }
        
        html += '</div>';
        return html;
    }
    
    generateYAMLPreview(drop, dropType) {
        // Handle different drop types differently
        let yaml = '  - ';
        
        switch(drop.type) {
            case 'item':
                // Format: - ITEM_NAME AMOUNT CHANCE {attributes}
                yaml += drop.item || '???';
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                break;
                
            case 'mythicmob':
                // Format: - mythicmob MOB_TYPE AMOUNT CHANCE {attributes}
                const mobType = drop.attributes?.type || '???';
                yaml += `mythicmob ${mobType}`;
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                break;
                
            case 'exp':
                // Format: - exp AMOUNT CHANCE
                yaml += `exp ${drop.amount || '10'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            case 'mcmmo-exp':
                // Format: - mcmmo-exp AMOUNT CHANCE
                yaml += `mcmmo-exp ${drop.amount || '20'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            case 'money':
                // Format: - money AMOUNT CHANCE {sendmessage=...}
                yaml += `money ${drop.amount || '100'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                break;
                
            case 'command':
                // Format: - cmd{c="COMMAND";ascaster=true} AMOUNT CHANCE
                const cmd = drop.attributes?.command || '???';
                yaml += `cmd{c="${cmd}"`;
                // Add command-specific attributes
                if (drop.attributes?.ascaster) yaml += `;ascaster=true`;
                if (drop.attributes?.astrigger) yaml += `;astrigger=true`;
                if (drop.attributes?.asop) yaml += `;asop=true`;
                yaml += '}';
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            case 'mmoitems':
                // Format: - mmoitems{type=TYPE;id=ID} AMOUNT CHANCE
                const mmoType = drop.attributes?.type || 'SWORD';
                const mmoId = drop.attributes?.id || 'EXAMPLE_ITEM';
                yaml += `mmoitems{type=${mmoType};id=${mmoId}`;
                if (drop.attributes?.unidentified) {
                    yaml += `;unidentified=${drop.attributes.unidentified}`;
                }
                yaml += '}';
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            case 'vanillaLootTable':
                // Format: - vanillaLootTable TABLE_NAME AMOUNT CHANCE
                const table = drop.table || 'minecraft:chests/simple_dungeon';
                yaml += `vanillaLootTable ${table}`;
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            case 'itemvariable':
                // Format: - itemvariable{variable=caster.storeditem} AMOUNT CHANCE
                const varName = drop.attributes?.variable || 'caster.storeditem';
                yaml += `itemvariable{variable=${varName}}`;
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            case 'nothing':
                // Format: - nothing CHANCE
                yaml += 'nothing';
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            case 'droptable':
                // Format: - droptable{table=TableName} AMOUNT CHANCE
                const dropTableName = drop.table || drop.item || 'TableName';
                yaml += `droptable{table=${dropTableName}}`;
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
                return yaml;
                
            default:
                yaml += drop.item || drop.type || '???';
                yaml += ` ${drop.amount || '1'}`;
                yaml += ` ${drop.chance || '1.0'}`;
        }
        
        // Collect all attributes (for item, mythicmob, and money types)
        const attrs = [];
        
        // For mythicmob, add non-type attributes (level, radius, etc.)
        if (drop.type === 'mythicmob' && drop.attributes) {
            Object.entries(drop.attributes).forEach(([key, value]) => {
                // Skip 'type' (already in main syntax) and 'amount' (handled separately)
                if (key !== 'type' && key !== 'amount' && value !== '' && value !== false && value !== null && value !== undefined) {
                    if (typeof value === 'boolean') {
                        if (value) attrs.push(key);
                    } else {
                        attrs.push(`${key}=${value}`);
                    }
                }
            });
        }
        
        // For money type, add sendmessage if not true (true is default)
        if (drop.type === 'money' && drop.attributes?.sendmessage !== undefined) {
            if (!drop.attributes.sendmessage) {
                attrs.push('sendmessage=false');
            }
        }
        
        // For item type, handle type-specific attributes
        if (drop.type === 'item' && drop.attributes) {
            Object.entries(drop.attributes).forEach(([key, value]) => {
                if (value !== '' && value !== false && value !== null && value !== undefined) {
                    if (typeof value === 'boolean') {
                        if (value) attrs.push(key);
                    } else {
                        attrs.push(`${key}=${value}`);
                    }
                }
            });
        }
        
        // Inline attributes (for item type)
        if (drop.inlineAttributes) {
            Object.entries(drop.inlineAttributes).forEach(([key, value]) => {
                if (value !== '' && value !== false && value !== null && value !== undefined) {
                    if (typeof value === 'boolean') {
                        if (value) attrs.push(key);
                    } else {
                        // Handle multiline values
                        if (typeof value === 'string' && value.includes('\n')) {
                            attrs.push(`${key}=${value.split('\n').join('|')}`);
                        } else {
                            attrs.push(`${key}=${value}`);
                        }
                    }
                }
            });
        }
        
        // Fancy attributes
        if (drop.fancyAttributes) {
            Object.entries(drop.fancyAttributes).forEach(([key, value]) => {
                if (value !== '' && value !== false && value !== null && value !== undefined) {
                    if (typeof value === 'boolean') {
                        if (value) attrs.push(key);
                    } else {
                        attrs.push(`${key}=${value}`);
                    }
                }
            });
        }
        
        // Add attributes to YAML
        if (attrs.length > 0) {
            yaml += ` {${attrs.join(',')}}`;
        }
        
        return yaml;
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    

    
    renderField(field, value, namespace = null) {
        const fieldId = namespace ? `drop-${namespace}-${field.name}` : `drop-${field.name}`;
        const dataAttr = namespace ? `data-namespace="${namespace}"` : '';
        
        let html = `<div class="form-group" ${dataAttr} data-field="${field.name}">`;
        html += `<label class="form-label">`;
        html += field.label;
        if (field.required) html += ' <span class="required">*</span>';
        if (field.description) html += ` <span class="help-text">${field.description}</span>`;
        html += `</label>`;
        
        // Special handling for item field - Use SearchableDropdown with MythicMobs + Minecraft items
        if (field.name === 'item' && !namespace) {
            html = `<div class="form-group" data-field="${field.name}">`;
            html += `<label class="form-label">`;
            html += `<i class="fas fa-cube"></i> Item (MythicMobs or Minecraft)`;
            if (field.required) html += ' <span class="required">*</span>';
            html += ` <span class="help-text">Select from your items or Minecraft's item list</span>`;
            html += `</label>`;
            html += `<div id="${fieldId}"></div>`;
            html += `<input type="text" class="form-input" id="${fieldId}-custom" 
                    value="${value || ''}" 
                    placeholder="Or enter custom item name manually" 
                    style="margin-top: 8px;">`;
            html += `</div>`;
            
            // Store the fieldId for initialization after render
            this._pendingItemDropdown = {
                containerId: fieldId,
                value: value,
                customInputId: `${fieldId}-custom`
            };
            
            return html;
        }
        
        // Special handling for glow color field
        if (field.name === 'itemglowcolor' && namespace === 'fancyAttributes') {
            html += `<div style="display: flex; gap: 8px; align-items: center;">`;
            html += `<select class="form-select" id="${fieldId}" style="flex: 1;">`;
            html += `<option value="">-- Select Color --</option>`;
            
            GLOW_COLORS.forEach(color => {
                html += `<option value="${color.value}" ${value === color.value ? 'selected' : ''} 
                        style="background: ${color.hex}; color: ${color.value === 'BLACK' || color.value === 'DARK_BLUE' || color.value === 'DARK_GREEN' || color.value === 'DARK_GRAY' || color.value === 'DARK_RED' ? '#fff' : '#000'};">
                        ${color.label}
                    </option>`;
            });
            
            html += `</select>`;
            html += `<div style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--border-primary); background: ${
                GLOW_COLORS.find(c => c.value === value)?.hex || '#888'
            };" id="${fieldId}-preview"></div>`;
            html += `</div>`;
            html += `<input type="text" class="form-input" id="${fieldId}-custom" 
                    value="${value && !GLOW_COLORS.find(c => c.value === value) ? value : ''}" 
                    placeholder="Or enter custom color (e.g., #FFD700)" 
                    style="margin-top: 8px;">`;
            return html + `</div>`;
        }
        
        switch(field.type) {
            case 'text':
                html += `<input type="text" class="form-input" id="${fieldId}" 
                        value="${value || ''}" 
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}>`;
                break;
                
            case 'number':
                html += `<input type="number" class="form-input" id="${fieldId}" 
                        value="${value || field.default || ''}" 
                        placeholder="${field.placeholder || ''}"
                        ${field.min !== undefined ? `min="${field.min}"` : ''}
                        ${field.max !== undefined ? `max="${field.max}"` : ''}
                        ${field.step !== undefined ? `step="${field.step}"` : ''}
                        ${field.required ? 'required' : ''}>`;
                break;
                
            case 'boolean':
                html += `<label class="checkbox-label">
                        <input type="checkbox" id="${fieldId}" ${value ? 'checked' : ''}>
                        <span>Enable</span>
                    </label>`;
                break;
                
            case 'textarea':
                html += `<textarea class="form-input" id="${fieldId}" rows="3" 
                        placeholder="${field.placeholder || ''}">${value || ''}</textarea>`;
                break;
                
            case 'select':
                html += `<select class="form-select" id="${fieldId}">`;
                field.options.forEach(opt => {
                    html += `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`;
                });
                html += `</select>`;
                break;
        }
        
        html += `</div>`;
        return html;
    }
    
    attachDropEditorListeners(modal, drop, index) {
        // Close modal
        modal.querySelector('#close-mobdrop-editor')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-mobdrop-btn')?.addEventListener('click', () => modal.remove());
        
        // Drop type cards
        modal.querySelectorAll('.drop-type-card').forEach(card => {
            card.addEventListener('click', () => {
                const typeId = card.dataset.type;
                
                // Update selection
                modal.querySelectorAll('.drop-type-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Update hidden input
                const typeSelect = modal.querySelector('#mobdrop-type-select');
                if (typeSelect) typeSelect.value = typeId;
                
                // Update drop type
                drop.type = typeId;
                
                // Re-render configuration tabs
                const container = modal.querySelector('#drop-config-container');
                container.innerHTML = this.renderDropConfigurationTabs(drop);
                
                // Re-attach listeners
                this.attachFieldListeners(modal);
                this.attachTabListeners(modal, drop);
                this.attachLivePreviewListeners(modal);
                
                // Update preview immediately
                this.updatePersistentPreview(modal);
            });
        });
        
        // Tab switching
        this.attachTabListeners(modal, drop);
        
        // Field listeners
        this.attachFieldListeners(modal);
        
        // Live preview updates
        this.attachLivePreviewListeners(modal);
        
        // Copy YAML button
        const copyBtn = modal.querySelector('#copy-yaml-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const yamlPreview = modal.querySelector('.yaml-preview code');
                if (yamlPreview) {
                    const text = yamlPreview.textContent;
                    navigator.clipboard.writeText(text).then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 2000);
                    });
                }
            });
        }
        
        // Save drop
        modal.querySelector('#save-mobdrop-btn')?.addEventListener('click', () => {
            const newDrop = this.collectDropData(modal);
            
            // Validate required fields
            const dropType = DROP_TYPES.find(t => t.id === newDrop.type);
            const requiredFields = dropType.fields.filter(f => f.required);
            
            for (const field of requiredFields) {
                let value;
                if (field.name === 'amount') value = newDrop.amount;
                else if (field.name === 'chance') value = newDrop.chance;
                else if (field.name === 'table') value = newDrop.table;
                else value = newDrop.item;
                
                if (!value || value.trim() === '') {
                    if (this.editor && this.editor.showAlert) {
                        this.editor.showAlert(`${field.label} is required`, 'warning', 'Required Field');
                    }
                    return;
                }
            }
            
            // Check type-specific required attributes
            if (dropType.attributes) {
                for (const attr of dropType.attributes.filter(a => a.required)) {
                    if (!newDrop.attributes[attr.name] || newDrop.attributes[attr.name].trim() === '') {
                        if (this.editor && this.editor.showAlert) {
                            this.editor.showAlert(`${attr.label} is required for ${dropType.name}`, 'warning', 'Required Field');
                        }
                        return;
                    }
                }
            }
            
            if (index !== null) {
                this.drops[index] = newDrop;
            } else {
                this.drops.push(newDrop);
            }
            
            modal.remove();
            this.render();
            this.attachEventListeners();
            this.triggerChange();
        });
    }
    
    attachTabListeners(modal, drop) {
        modal.querySelectorAll('.drop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update tab selection
                modal.querySelectorAll('.drop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update content
                modal.querySelectorAll('.drop-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const targetContent = modal.querySelector(`[data-tab-content="${tabName}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Update breadcrumb
                const breadcrumbText = modal.querySelector('#drop-breadcrumb-text');
                const tabNames = {
                    'basic': 'Basic Configuration',
                    'attributes': 'Type Attributes',
                    'inline': 'Inline Attributes',
                    'fancy': 'Fancy Attributes'
                };
                if (breadcrumbText) {
                    breadcrumbText.textContent = tabNames[tabName] || 'Configuration';
                }
                
                // Store current tab
                modal.dataset.currentTab = tabName;
            });
        });
    }
    
    updatePersistentPreview(modal) {
        const currentDrop = this.collectDropData(modal);
        const dropType = DROP_TYPES.find(t => t.id === currentDrop.type);
        const yaml = this.generateYAMLPreview(currentDrop, dropType);
        
        const yamlPreview = modal.querySelector('#yaml-preview-code');
        if (yamlPreview) {
            yamlPreview.textContent = yaml;
        }
    }
    
    attachCollapsibleListeners(modal) {
        modal.querySelectorAll('.collapsible-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const content = trigger.nextElementSibling;
                const icon = trigger.querySelector('.fa-chevron-down');
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    content.style.display = 'none';
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
    }
    
    attachFieldListeners(modal) {
        // Glow color preview update
        const glowColorSelect = modal.querySelector('#drop-fancyAttributes-itemglowcolor');
        const glowColorPreview = modal.querySelector('#drop-fancyAttributes-itemglowcolor-preview');
        const glowColorCustom = modal.querySelector('#drop-fancyAttributes-itemglowcolor-custom');
        
        if (glowColorSelect && glowColorPreview) {
            glowColorSelect.addEventListener('change', (e) => {
                const color = GLOW_COLORS.find(c => c.value === e.target.value);
                glowColorPreview.style.background = color ? color.hex : '#888';
                if (e.target.value) {
                    glowColorCustom.value = '';
                }
            });
        }
        
        if (glowColorCustom && glowColorPreview) {
            glowColorCustom.addEventListener('input', (e) => {
                const customValue = e.target.value.trim();
                if (customValue) {
                    glowColorPreview.style.background = customValue.startsWith('#') ? customValue : '#888';
                    if (glowColorSelect) glowColorSelect.value = '';
                }
            });
        }
        
        // Item field - sync dropdown and custom input
        const itemSelect = modal.querySelector('#drop-item');
        const itemCustom = modal.querySelector('#drop-item-custom');
        
        if (itemSelect && itemCustom) {
            itemSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    itemCustom.value = '';
                }
            });
            
            itemCustom.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    itemSelect.value = '';
                }
            });
        }
    }
    
    attachLivePreviewListeners(modal) {
        let debounceTimer;
        
        // Get all form inputs
        const inputs = modal.querySelectorAll('#drop-config-container input, #drop-config-container select, #drop-config-container textarea');
        
        inputs.forEach(input => {
            const updatePreview = () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.updatePersistentPreview(modal);
                }, 300); // 300ms debounce
            };
            
            if (input.type === 'checkbox') {
                input.addEventListener('change', updatePreview);
            } else {
                input.addEventListener('input', updatePreview);
            }
        });
        
        // Also update on drop type change
        modal.querySelectorAll('.drop-type-card').forEach(card => {
            const originalHandler = card.onclick;
            card.addEventListener('click', () => {
                setTimeout(() => {
                    this.updatePersistentPreview(modal);
                    // Re-attach live preview listeners to new inputs
                    this.attachLivePreviewListeners(modal);
                }, 50);
            });
        });
    }
    
    collectDropData(modal) {
        const type = modal.querySelector('#mobdrop-type-select').value;
        const dropType = DROP_TYPES.find(t => t.id === type);
        
        const newDrop = {
            type: type,
            item: '',
            amount: '1',
            chance: '1.0',
            attributes: {},
            inlineAttributes: {},
            fancyAttributes: {}
        };
        
        // Collect basic fields
        dropType.fields.forEach(field => {
            let input = modal.querySelector(`#drop-${field.name}`);
            
            // For item field, check custom input if dropdown is empty
            if (field.name === 'item') {
                const customInput = modal.querySelector(`#drop-${field.name}-custom`);
                const selectValue = input ? input.value : '';
                const customValue = customInput ? customInput.value.trim() : '';
                const value = customValue || selectValue;
                newDrop.item = value;
                return;
            }
            
            if (input) {
                const value = field.type === 'boolean' ? input.checked : input.value;
                
                if (field.name === 'amount') {
                    newDrop.amount = value;
                } else if (field.name === 'chance') {
                    newDrop.chance = value;
                } else if (field.name === 'table') {
                    newDrop.table = value;
                } else {
                    newDrop.item = value;
                }
            }
        });
        
        // Collect attributes
        modal.querySelectorAll('[data-namespace="attributes"]').forEach(group => {
            const fieldName = group.dataset.field;
            const input = group.querySelector('input, select, textarea');
            if (input) {
                const value = input.type === 'checkbox' ? input.checked : input.value;
                if (value !== '' && value !== false) {
                    newDrop.attributes[fieldName] = value;
                }
            }
        });
        
        // Collect inline attributes
        modal.querySelectorAll('[data-namespace="inlineAttributes"]').forEach(group => {
            const fieldName = group.dataset.field;
            const input = group.querySelector('input, textarea');
            if (input) {
                const value = input.type === 'checkbox' ? input.checked : input.value;
                if (value !== '' && value !== false) {
                    newDrop.inlineAttributes[fieldName] = value;
                }
            }
        });
        
        // Collect fancy attributes
        modal.querySelectorAll('[data-namespace="fancyAttributes"]').forEach(group => {
            const fieldName = group.dataset.field;
            
            // For glow color, check custom input if dropdown is empty
            if (fieldName === 'itemglowcolor') {
                const select = group.querySelector('select');
                const customInput = group.querySelector('#drop-fancyAttributes-itemglowcolor-custom');
                const selectValue = select ? select.value : '';
                const customValue = customInput ? customInput.value.trim() : '';
                const value = customValue || selectValue;
                if (value) {
                    newDrop.fancyAttributes[fieldName] = value;
                }
                return;
            }
            
            const input = group.querySelector('input, textarea');
            if (input) {
                const value = input.type === 'checkbox' ? input.checked : input.value;
                if (value !== '' && value !== false) {
                    newDrop.fancyAttributes[fieldName] = value;
                }
            }
        });
        
        return newDrop;
    }
    
    initializeItemDropdown() {
        // Check if we have a pending dropdown to initialize
        if (!this._pendingItemDropdown) {
            return;
        }
        
        const { containerId, value, customInputId } = this._pendingItemDropdown;
        const container = document.getElementById(containerId);
        const customInput = document.getElementById(customInputId);
        
        if (!container) {
            console.warn('Item dropdown container not found:', containerId);
            return;
        }
        
        // Get combined categories including MythicMobs items
        const getCombinedCategories = window.getCombinedItemCategories || 
            (() => window.MINECRAFT_ITEM_CATEGORIES || []);
        const categories = getCombinedCategories(true);
        
        // Initialize SearchableDropdown
        const dropdown = new SearchableDropdown(containerId, {
            items: window.MINECRAFT_ITEMS || [],
            categories: categories,
            placeholder: 'Search for an item...',
            storageKey: 'mobdrop-item',
            onSelect: (itemName) => {
                // Update the current editing drop
                if (this._currentEditingDrop) {
                    this._currentEditingDrop.item = itemName;
                }
                // Sync with custom input
                if (customInput) {
                    customInput.value = itemName;
                }
            },
            allowCustom: true
        });
        
        // Set initial value if provided
        if (value) {
            dropdown.setValue(value);
        }
        
        // Sync custom input changes back to dropdown
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                const customValue = e.target.value.trim();
                if (customValue) {
                    dropdown.setValue(customValue);
                    if (this._currentEditingDrop) {
                        this._currentEditingDrop.item = customValue;
                    }
                }
            });
        }
        
        // Store dropdown instance for later access
        this._currentItemDropdown = dropdown;
        
        // Clear pending initialization
        this._pendingItemDropdown = null;
    }
    
    getValue() {
        return this.drops;
    }
    
    setValue(drops) {
        this.drops = drops || [];
        this.render();
        this.attachEventListeners();
    }
    
    onChange(callback) {
        this.changeCallback = callback;
    }
    
    triggerChange() {
        if (this.changeCallback) {
            this.changeCallback(this.drops);
        }
    }
}
