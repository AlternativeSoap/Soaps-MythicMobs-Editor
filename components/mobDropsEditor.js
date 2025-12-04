/**
 * MobDropsEditor Component
 * Complete drops editor supporting all MythicMobs drop types
 */

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
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                const displayName = this.getDropDisplayName(this.drops[index]);
                if (confirm(`Delete drop "${displayName}"?`)) {
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
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content drop-editor-modal large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-box"></i> ${index !== null ? 'Edit' : 'Add'} Drop</h3>
                    <button class="modal-close" id="close-mobdrop-editor">&times;</button>
                </div>
                <div class="modal-body">
                    ${this.renderDropTypeSelector(drop)}
                    <div id="drop-config-container">
                        ${this.renderDropConfiguration(drop)}
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
    }
    
    renderDropTypeSelector(drop) {
        return `
            <div class="form-group">
                <label class="form-label">
                    <i class="fas fa-layer-group"></i> Drop Type
                </label>
                <select class="form-select" id="mobdrop-type-select">
                    ${(window.DROP_TYPES || []).map(type => `
                        <option value="${type.id}" ${drop.type === type.id ? 'selected' : ''}>
                            ${type.name} - ${type.description}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }
    
    renderDropConfiguration(drop) {
        const dropType = (window.DROP_TYPES || []).find(t => t.id === drop.type) || (window.DROP_TYPES || [])[0];
        let html = '<div class="drop-config-sections">';
        
        // Safety check
        if (!dropType || !dropType.fields) {
            html += '<div class="alert alert-warning">Drop configuration not loaded. Please refresh the page.</div>';
            html += '</div>';
            return html;
        }
        
        // Basic fields
        html += '<div class="config-section">';
        html += '<h4><i class="fas fa-sliders"></i> Basic Configuration</h4>';
        
        dropType.fields.forEach(field => {
            const value = field.name === 'amount' ? drop.amount : 
                         field.name === 'chance' ? drop.chance :
                         field.name === 'table' ? drop.table :
                         drop.item;
            
            html += this.renderField(field, value);
        });
        html += '</div>';
        
        // Type-specific attributes
        if (dropType.attributes && dropType.attributes.length > 0) {
            html += '<div class="config-section collapsible">';
            html += `<h4 class="collapsible-trigger"><i class="fas fa-cogs"></i> ${dropType.name} Attributes <i class="fas fa-chevron-down"></i></h4>`;
            html += '<div class="collapsible-card-body" style="display:none;">';
            
            dropType.attributes.forEach(attr => {
                const value = drop.attributes[attr.name];
                html += this.renderField(attr, value, 'attributes');
            });
            
            html += '</div></div>';
        }
        
        // Inline item attributes (for vanilla items)
        if (drop.type === 'item') {
            html += '<div class="config-section collapsible">';
            html += '<h4 class="collapsible-trigger"><i class="fas fa-palette"></i> Inline Item Attributes <i class="fas fa-chevron-down"></i></h4>';
            html += '<div class="collapsible-card-body" style="display:none;">';
            html += '<p class="help-text">Add display name, lore, enchantments, and other attributes directly to the item</p>';
            
            (window.INLINE_ITEM_ATTRIBUTES || []).forEach(category => {
                html += `<div class="attribute-category"><strong>${category.category}</strong></div>`;
                category.attributes.forEach(attr => {
                    const value = drop.inlineAttributes[attr.name];
                    html += this.renderField(attr, value, 'inlineAttributes');
                });
            });
            
            html += '</div></div>';
        }
        
        // Fancy drop attributes (for all drop types)
        html += '<div class="config-section collapsible">';
        html += '<h4 class="collapsible-trigger"><i class="fas fa-sparkles"></i> Fancy Drop Attributes <i class="fas fa-chevron-down"></i></h4>';
        html += '<div class="collapsible-card-body" style="display:none;">';
        html += '<p class="help-text">Visual effects and special behaviors for this drop (requires DropMethod: FANCY)</p>';
        
        (window.FANCY_DROP_ATTRIBUTES || []).forEach(category => {
            html += `<div class="attribute-category"><strong>${category.category}</strong></div>`;
            category.attributes.forEach(attr => {
                const value = drop.fancyAttributes[attr.name];
                html += this.renderField(attr, value, 'fancyAttributes');
            });
        });
        
        html += '</div></div>';
        
        html += '</div>';
        return html;
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
        
        // Drop type change - re-render configuration
        const typeSelect = modal.querySelector('#mobdrop-type-select');
        typeSelect?.addEventListener('change', (e) => {
            drop.type = e.target.value;
            const container = modal.querySelector('#drop-config-container');
            container.innerHTML = this.renderDropConfiguration(drop);
            this.attachCollapsibleListeners(modal);
        });
        
        // Collapsible sections
        this.attachCollapsibleListeners(modal);
        
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
                    alert(`${field.label} is required`);
                    return;
                }
            }
            
            // Check type-specific required attributes
            if (dropType.attributes) {
                for (const attr of dropType.attributes.filter(a => a.required)) {
                    if (!newDrop.attributes[attr.name] || newDrop.attributes[attr.name].trim() === '') {
                        alert(`${attr.label} is required for ${dropType.name}`);
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
            const input = modal.querySelector(`#drop-${field.name}`);
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
