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

// Drop types that support inline ITEM attributes (name, lore, enchants, skullTexture, etc.)
// Only vanilla items support these - e.g., DIAMOND_SWORD{name="...";lore="...";enchants=...}
const INLINE_ITEM_SUPPORTED = ['item'];

// Drop types that support fancy drop attributes (lootsplosion, hologramname, itemvfx, etc.)
// Only MythicItems support these visual effects
const INLINE_FANCY_SUPPORTED = ['item'];

// Drop types that don't support fancy attributes at all
const NO_FANCY_SUPPORT = ['exp', 'mcmmo-exp', 'money', 'command', 'nothing', 'vanillaLootTable', 'itemvariable', 'mythicmob', 'mmoitems'];

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
            window.notificationModal?.alert(
                'Drop types not loaded yet. Please wait a moment and try again.',
                'warning',
                'Loading Drop Types'
            );
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
        
        // Store reference for data collection
        this._currentEditingDrop = drop;
        
        // Create modal - streamlined design
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content drop-editor-modal-v2">
                <div class="drop-modal-header">
                    <h3><i class="fas fa-box"></i> ${index !== null ? 'Edit' : 'Add'} Drop</h3>
                    <button class="modal-close" id="close-mobdrop-editor">&times;</button>
                </div>
                
                <div class="drop-modal-body">
                    ${this.renderDropTypeChips(drop)}
                    
                    <div id="drop-config-container">
                        ${this.renderDropContent(drop)}
                    </div>
                </div>
                
                <div class="drop-modal-footer">
                    <div class="yaml-preview-inline">
                        <code id="yaml-preview-code">${this.escapeHtml(this.generateYAMLPreview(drop, (window.DROP_TYPES || []).find(t => t.id === drop.type)))}</code>
                        <button class="copy-btn" id="copy-yaml-btn" title="Copy"><i class="fas fa-copy"></i></button>
                    </div>
                    <div class="footer-actions">
                        <button class="btn btn-ghost" id="cancel-mobdrop-btn">Cancel</button>
                        <button class="btn btn-primary" id="save-mobdrop-btn">
                            <i class="fas fa-save"></i> ${index !== null ? 'Save' : 'Add'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.attachDropEditorListeners(modal, drop, index);
        
        // Initialize item dropdown after modal is in DOM
        setTimeout(() => this.initializeItemDropdown(), 50);
    }
    
    renderDropTypeChips(drop) {
        return `
            <div class="drop-type-row">
                ${(window.DROP_TYPES || []).map(type => `
                    <button class="drop-chip ${drop.type === type.id ? 'active' : ''}" 
                            data-type="${type.id}" title="${type.description}">
                        <i class="fas fa-${type.icon}"></i>
                        <span>${type.name}</span>
                    </button>
                `).join('')}
            </div>
            <input type="hidden" id="mobdrop-type-select" value="${drop.type}">
        `;
    }
    
    // Alias for compatibility
    renderDropTypeSelector(drop) { return this.renderDropTypeChips(drop); }
    
    renderDropTabs(drop) {
        // V2 design uses collapsible sections instead of tabs - return empty
        return '';
    }
    
    renderDropConfigurationTabs(drop) {
        return this.renderDropContent(drop);
    }
    
    renderDropContent(drop) {
        const dropType = (window.DROP_TYPES || []).find(t => t.id === drop.type) || (window.DROP_TYPES || [])[0];
        const supportsInline = INLINE_ITEM_SUPPORTED.includes(drop.type);
        const supportsFancy = !NO_FANCY_SUPPORT.includes(drop.type);
        
        if (!dropType || !dropType.fields) {
            return '<div class="alert alert-warning">Drop configuration not loaded.</div>';
        }
        
        let html = '<div class="drop-config-v2">';
        
        // Core fields row - always visible, compact
        html += this.renderCoreFieldsRow(drop, dropType);
        
        // Type-specific options (if any attributes exist) - collapsible, start EXPANDED
        if (dropType.attributes && dropType.attributes.length > 0) {
            html += this.renderOptionsAccordion(drop, dropType, 'type-options', 
                `<i class="fas fa-sliders-h"></i> ${dropType.name} Options`, 
                dropType.attributes, 'attributes', '', true);
        }
        
        // Item Styling section (only for items) - collapsible
        if (supportsInline && window.INLINE_ITEM_ATTRIBUTES) {
            const allInlineAttrs = INLINE_ITEM_ATTRIBUTES.flatMap(c => c.attributes);
            html += this.renderOptionsAccordion(drop, dropType, 'styling', 
                `<i class="fas fa-palette"></i> Item Styling`, 
                allInlineAttrs, 'inlineAttributes', 'name, lore, enchants');
        }
        
        // Visual Effects section (only for item type)
        if (supportsFancy && drop.type === 'item' && window.FANCY_DROP_ATTRIBUTES) {
            const allFancyAttrs = FANCY_DROP_ATTRIBUTES.flatMap(c => c.attributes);
            html += this.renderOptionsAccordion(drop, dropType, 'effects', 
                `<i class="fas fa-sparkles"></i> Visual Effects`, 
                allFancyAttrs, 'fancyAttributes', 'lootsplosion, glow');
        }
        
        html += '</div>';
        return html;
    }
    
    renderCoreFieldsRow(drop, dropType) {
        let html = '<div class="core-row">';
        
        // Primary field first (like mob type for mythicmob)
        if (dropType.basicFields && dropType.basicFields.length > 0) {
            dropType.basicFields.forEach(field => {
                const value = drop.attributes && drop.attributes[field.name];
                html += this.renderCoreField(field, value, 'attributes', true);
            });
        }
        
        // Main fields (item selector, amount, chance)
        dropType.fields.forEach(field => {
            const value = field.name === 'amount' ? drop.amount : 
                         field.name === 'chance' ? drop.chance :
                         field.name === 'table' ? drop.table :
                         drop.item;
            
            html += this.renderCoreField(field, value, null, field.required);
        });
        
        html += '</div>';
        return html;
    }
    
    renderCoreField(field, value, namespace = null, isRequired = false) {
        const fieldId = namespace ? `drop-${namespace}-${field.name}` : `drop-${field.name}`;
        const dataAttr = namespace ? `data-namespace="${namespace}"` : '';
        
        // Width class based on field importance
        let widthClass = 'core-field';
        if (field.name === 'amount' || field.name === 'chance') {
            widthClass = 'core-field narrow';
        } else if (field.name === 'item' || field.name === 'command' || field.name === 'table' || field.name === 'type' || field.name === 'variable') {
            widthClass = 'core-field wide';
        }
        
        let html = `<div class="${widthClass}" ${dataAttr} data-field="${field.name}">`;
        html += `<label>${field.label}${isRequired ? '<span class="req">*</span>' : ''}</label>`;
        
        // Special handling for item field with dropdown
        if (field.name === 'item' && !namespace) {
            html += `<div class="item-combo">`;
            html += `<div id="${fieldId}" class="item-dropdown-slot"></div>`;
            html += `<input type="text" class="core-input sub" id="${fieldId}-custom" 
                    value="${value || ''}" placeholder="or type custom...">`;
            html += `</div>`;
            
            this._pendingItemDropdown = {
                containerId: fieldId,
                value: value,
                customInputId: `${fieldId}-custom`
            };
        } else {
            switch(field.type) {
                case 'number':
                    html += `<input type="number" class="core-input" id="${fieldId}" 
                            value="${value !== undefined && value !== '' ? value : (field.default || '')}" 
                            placeholder="${field.placeholder || ''}"
                            ${field.min !== undefined ? `min="${field.min}"` : ''}
                            ${field.max !== undefined ? `max="${field.max}"` : ''}
                            ${field.step !== undefined ? `step="${field.step}"` : ''}>`;
                    break;
                case 'boolean':
                    html += `<label class="core-toggle">
                            <input type="checkbox" id="${fieldId}" ${value ? 'checked' : ''}>
                            <span class="toggle-track"></span>
                        </label>`;
                    break;
                default:
                    html += `<input type="text" class="core-input" id="${fieldId}" 
                            value="${value || ''}" placeholder="${field.placeholder || ''}">`;
            }
        }
        
        html += '</div>';
        return html;
    }
    
    renderOptionsAccordion(drop, dropType, sectionId, title, attributes, namespace, subtitle = '', startExpanded = false) {
        const hasValues = attributes.some(attr => {
            const val = namespace === 'attributes' ? drop.attributes?.[attr.name] :
                       namespace === 'inlineAttributes' ? drop.inlineAttributes?.[attr.name] :
                       drop.fancyAttributes?.[attr.name];
            return val !== undefined && val !== '' && val !== false;
        });
        
        // Start expanded if has values OR if explicitly requested
        const isExpanded = hasValues || startExpanded;
        
        let html = `
            <div class="accordion ${hasValues ? 'has-values' : ''} ${isExpanded ? 'expanded' : ''}" data-section="${sectionId}">
                <div class="accordion-header">
                    <div class="accordion-title">
                        ${title}
                        ${subtitle ? `<small>${subtitle}</small>` : ''}
                        ${hasValues ? '<span class="has-data-badge">●</span>' : ''}
                    </div>
                    <i class="fas fa-chevron-down accordion-arrow"></i>
                </div>
                <div class="accordion-body">
                    <div class="options-flow">
        `;
        
        attributes.forEach(attr => {
            const value = namespace === 'attributes' ? drop.attributes?.[attr.name] :
                         namespace === 'inlineAttributes' ? drop.inlineAttributes?.[attr.name] :
                         drop.fancyAttributes?.[attr.name];
            html += this.renderOptionItem(attr, value, namespace);
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
        return html;
    }
    
    renderOptionItem(attr, value, namespace) {
        const fieldId = `drop-${namespace}-${attr.name}`;
        
        // Boolean fields render differently
        if (attr.type === 'boolean') {
            return `
                <div class="option-item toggle-item" data-namespace="${namespace}" data-field="${attr.name}">
                    <span class="option-name">${attr.label}</span>
                    <label class="core-toggle">
                        <input type="checkbox" id="${fieldId}" ${value ? 'checked' : ''}>
                        <span class="toggle-track"></span>
                    </label>
                </div>
            `;
        }
        
        let inputHtml;
        if (attr.type === 'textarea') {
            inputHtml = `<textarea class="option-input" id="${fieldId}" rows="1" 
                        placeholder="${attr.placeholder || ''}">${value || ''}</textarea>`;
        } else if (attr.type === 'number') {
            inputHtml = `<input type="number" class="option-input" id="${fieldId}" 
                        value="${value || ''}" placeholder="${attr.placeholder || ''}"
                        ${attr.min !== undefined ? `min="${attr.min}"` : ''}
                        ${attr.max !== undefined ? `max="${attr.max}"` : ''}>`;
        } else {
            inputHtml = `<input type="text" class="option-input" id="${fieldId}" 
                        value="${value || ''}" placeholder="${attr.placeholder || ''}">`;
        }
        
        return `
            <div class="option-item" data-namespace="${namespace}" data-field="${attr.name}">
                <label>${attr.label}${attr.required ? '<span class="req">*</span>' : ''}</label>
                ${inputHtml}
            </div>
        `;
    }

    // Legacy compatibility methods
    renderConfigTab(drop, dropType) { return this.renderDropContent(drop); }
    renderCompactField(field, value, namespace, isPrimary) { return this.renderCoreField(field, value, namespace, isPrimary); }
    renderBasicTab(drop, dropType) { return ''; }
    renderBasicField(field, value, namespace) { return this.renderCoreField(field, value, namespace); }
    renderAttributesTab(drop, dropType) { return ''; }
    renderInlineTab(drop, dropType) { return ''; }
    renderFancyTab(drop, dropType) { return ''; }
    
    generateYAMLPreview(drop, dropType) {
        // MythicMobs drop format: - type{key=value;key=value} amount chance
        // No space between type and curly braces, semicolon separator inside braces
        
        let yaml = '- ';
        const amount = drop.amount || '1';
        const chance = drop.chance || '1';
        
        // Collect all attributes for this drop type
        const collectAttrs = (obj, skipKeys = []) => {
            const attrs = [];
            if (obj) {
                Object.entries(obj).forEach(([key, value]) => {
                    if (skipKeys.includes(key)) return;
                    if (value === '' || value === false || value === null || value === undefined) return;
                    
                    // Handle attribute key name mapping for shorthand
                    let attrKey = key;
                    if (key === 'onSurface') attrKey = 'os';
                    if (key === 'yRadiusUpOnly') attrKey = 'yro';
                    if (key === 'ascaster') attrKey = 'ac';
                    if (key === 'astrigger') attrKey = 'at';
                    if (key === 'asop') attrKey = 'op';
                    if (key === 'sendmessage') attrKey = 'sm';
                    if (key === 'unidentified') attrKey = 'u';
                    
                    if (typeof value === 'boolean') {
                        attrs.push(`${attrKey}=true`);
                    } else if (typeof value === 'string' && value.includes('\n')) {
                        attrs.push(`${attrKey}=${value.split('\n').join('|')}`);
                    } else {
                        attrs.push(`${attrKey}=${value}`);
                    }
                });
            }
            return attrs;
        };
        
        switch(drop.type) {
            case 'item': {
                // Format: - ITEM_NAME{attrs} amount chance
                const item = drop.item || '???';
                const attrs = [
                    ...collectAttrs(drop.attributes),
                    ...collectAttrs(drop.inlineAttributes),
                    ...collectAttrs(drop.fancyAttributes)
                ];
                yaml += item;
                if (attrs.length > 0) yaml += `{${attrs.join(';')}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            case 'mythicmob': {
                // Format: - mythicmob{type=MOB;level=5;os=true} amount chance
                const mobType = drop.attributes?.type || '???';
                const attrs = [`type=${mobType}`, ...collectAttrs(drop.attributes, ['type'])];
                yaml += `mythicmob{${attrs.join(';')}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            case 'exp':
                // Format: - exp amount chance
                yaml += `exp ${amount} ${chance}`;
                break;
                
            case 'mcmmo-exp':
                // Format: - mcmmo-exp amount chance
                yaml += `mcmmo-exp ${amount} ${chance}`;
                break;
                
            case 'money': {
                // Format: - money{sm=false} amount chance
                const attrs = collectAttrs(drop.attributes);
                yaml += 'money';
                if (attrs.length > 0) yaml += `{${attrs.join(';')}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            case 'command': {
                // Format: - cmd{c="COMMAND";ac=true} amount chance
                const cmd = drop.attributes?.command || '???';
                const attrs = [`c="${cmd}"`, ...collectAttrs(drop.attributes, ['command'])];
                yaml += `cmd{${attrs.join(';')}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            case 'mmoitems': {
                // Format: - mmoitems{type=TYPE;id=ID;u=true} amount chance
                const mmoType = drop.attributes?.type || 'SWORD';
                const mmoId = drop.attributes?.id || 'EXAMPLE_ITEM';
                const attrs = [`type=${mmoType}`, `id=${mmoId}`, ...collectAttrs(drop.attributes, ['type', 'id'])];
                yaml += `mmoitems{${attrs.join(';')}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            case 'vanillaLootTable': {
                // Format: - vanillaLootTable{table=minecraft:chests/simple_dungeon} amount chance
                const table = drop.table || 'minecraft:chests/simple_dungeon';
                yaml += `vanillaLootTable{table=${table}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            case 'itemvariable': {
                // Format: - itemvariable{var=caster.storeditem} amount chance
                const varName = drop.attributes?.variable || 'caster.storeditem';
                yaml += `itemvariable{var=${varName}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            case 'nothing':
                // Format: - nothing chance
                yaml += `nothing ${chance}`;
                break;
                
            case 'droptable': {
                // Format: - droptable{table=TableName} amount chance
                const dropTableName = drop.table || drop.item || 'TableName';
                yaml += `droptable{table=${dropTableName}}`;
                yaml += ` ${amount} ${chance}`;
                break;
            }
            
            default: {
                const item = drop.item || drop.type || '???';
                yaml += `${item} ${amount} ${chance}`;
            }
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
        
        // Drop type chips (v2 selector) - support both old and new class names
        modal.querySelectorAll('.drop-chip, .drop-type-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const typeId = chip.dataset.type;
                
                // Update selection (support both class names)
                modal.querySelectorAll('.drop-chip, .drop-type-chip').forEach(c => {
                    c.classList.remove('active', 'selected');
                });
                chip.classList.add('active');
                
                // Update hidden input
                const typeSelect = modal.querySelector('#mobdrop-type-select');
                if (typeSelect) typeSelect.value = typeId;
                
                // Update drop type
                drop.type = typeId;
                
                // Re-render content
                const container = modal.querySelector('#drop-config-container');
                if (container) {
                    container.innerHTML = this.renderDropContent(drop);
                }
                
                // Re-attach listeners
                this.attachFieldListeners(modal);
                this.attachAccordionListeners(modal);
                this.attachLivePreviewListeners(modal);
                
                // Initialize item dropdown if item type
                if (typeId === 'item') {
                    setTimeout(() => this.initializeItemDropdown(), 50);
                }
                
                // Update preview immediately
                this.updatePersistentPreview(modal);
            });
        });
        
        // Field listeners
        this.attachFieldListeners(modal);
        
        // Accordion listeners (v2 collapsible sections)
        this.attachAccordionListeners(modal);
        
        // Live preview updates
        this.attachLivePreviewListeners(modal);
        
        // Copy YAML button
        const copyBtn = modal.querySelector('#copy-yaml-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const yamlCode = modal.querySelector('#yaml-preview-code');
                if (yamlCode) {
                    navigator.clipboard.writeText(yamlCode.textContent).then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                        }, 1500);
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
                    'config': 'Configuration',
                    'basic': 'Configuration',
                    'attributes': 'Type Attributes',
                    'inline': 'Item Styling',
                    'fancy': 'Visual Effects'
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
        // Use the current editing drop for preview
        const drop = this._currentEditingDrop || this.collectDropData(modal);
        const dropType = DROP_TYPES.find(t => t.id === drop.type);
        const yaml = this.generateYAMLPreview(drop, dropType);
        
        const yamlPreview = modal.querySelector('#yaml-preview-code');
        if (yamlPreview) {
            yamlPreview.textContent = yaml;
        }
    }
    
    attachCollapsibleListeners(modal) {
        // Old collapsible trigger pattern
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
        
        // New config section header pattern
        modal.querySelectorAll('.config-section-header[data-collapsible]').forEach(header => {
            header.addEventListener('click', () => {
                const sectionId = header.dataset.collapsible;
                const body = modal.querySelector(`#${sectionId}-section-body`);
                const indicator = header.querySelector('.collapse-indicator');
                
                if (body) {
                    body.classList.toggle('hidden');
                    header.classList.toggle('collapsed');
                }
            });
        });
    }
    
    // V2 accordion listeners for new design
    attachAccordionListeners(modal) {
        modal.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.closest('.accordion');
                if (accordion) {
                    accordion.classList.toggle('expanded');
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
        
        if (itemCustom) {
            itemCustom.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value && this._currentEditingDrop) {
                    this._currentEditingDrop.item = value;
                }
                // Update preview immediately
                this.updatePersistentPreview(modal);
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
                    // Sync core fields to _currentEditingDrop
                    if (this._currentEditingDrop) {
                        const amountInput = modal.querySelector('#drop-amount');
                        const chanceInput = modal.querySelector('#drop-chance');
                        const tableInput = modal.querySelector('#drop-table');
                        const itemCustom = modal.querySelector('#drop-item-custom');
                        
                        if (amountInput) this._currentEditingDrop.amount = amountInput.value;
                        if (chanceInput) this._currentEditingDrop.chance = chanceInput.value;
                        if (tableInput) this._currentEditingDrop.table = tableInput.value;
                        if (itemCustom && itemCustom.value.trim()) {
                            this._currentEditingDrop.item = itemCustom.value.trim();
                        }
                        
                        // Sync attributes
                        modal.querySelectorAll('[data-namespace="attributes"]').forEach(group => {
                            const fieldName = group.dataset.field;
                            const inp = group.querySelector('input, select, textarea');
                            if (inp) {
                                const value = inp.type === 'checkbox' ? inp.checked : inp.value;
                                if (value !== '' && value !== false) {
                                    this._currentEditingDrop.attributes[fieldName] = value;
                                } else {
                                    delete this._currentEditingDrop.attributes[fieldName];
                                }
                            }
                        });
                    }
                    
                    this.updatePersistentPreview(modal);
                }, 150);
            };
            
            if (input.type === 'checkbox') {
                input.addEventListener('change', updatePreview);
            } else {
                input.addEventListener('input', updatePreview);
            }
        });
        
        // Also update on drop type change
        modal.querySelectorAll('.drop-type-chip').forEach(chip => {
            const originalHandler = chip.onclick;
            chip.addEventListener('click', () => {
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
        
        // Collect basic fields (both old .form-group style and new .basic-field-card style)
        dropType.fields.forEach(field => {
            let input = modal.querySelector(`#drop-${field.name}`);
            
            // For item field, check SearchableDropdown value or custom input
            if (field.name === 'item') {
                const customInput = modal.querySelector(`#drop-${field.name}-custom`);
                const customValue = customInput ? customInput.value.trim() : '';
                // Try to get value from SearchableDropdown instance
                let dropdownValue = '';
                if (this._currentEditingDrop?.item) {
                    dropdownValue = this._currentEditingDrop.item;
                }
                // Custom input takes priority if filled
                const value = customValue || dropdownValue;
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
        
        // Collect attributes (from both .form-group and .basic-field-card with namespace)
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
        
        // Collect inline attributes (from both .form-group and .inline-attr-card)
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
                // Update the YAML preview
                const modal = document.querySelector('.drop-editor-modal-v2')?.closest('.modal-overlay');
                if (modal) {
                    this.updatePersistentPreview(modal);
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
