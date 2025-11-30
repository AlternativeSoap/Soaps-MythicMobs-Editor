/**
 * EquipmentEditor - Component for editing MythicMobs Equipment
 * Provides UI for configuring equipment slots with inline attributes
 */

class EquipmentEditor {
    constructor(containerId, mob = null) {
        this.containerId = containerId;
        this.mob = mob || {};
        this.equipment = mob?.equipment || {};
        this.onChangeCallback = null;
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="equipment-editor">
                <div class="equipment-grid">
                    ${EQUIPMENT_SLOTS.map(slot => this.renderSlot(slot)).join('')}
                </div>
                <small class="form-hint mt-2">
                    Supports MythicMobs items, vanilla items, inline attributes, and MMOItems (mmoitems{type=TYPE;id=ID})
                </small>
            </div>
        `;

        this.attachEventListeners();
    }

    renderSlot(slot) {
        const value = this.equipment[slot.id] || '';
        
        return `
            <div class="equipment-slot" data-slot="${slot.id}">
                <div class="equipment-slot-header">
                    <i class="fas fa-${slot.icon}"></i>
                    <span>${slot.name}</span>
                </div>
                <div class="form-group">
                    <input type="text" 
                           id="equipment-${slot.id.toLowerCase()}" 
                           class="form-input equipment-slot-input" 
                           data-slot="${slot.id}"
                           value="${value}" 
                           placeholder="Item name or ID">
                    <button type="button" 
                            class="btn btn-secondary btn-sm equipment-attributes-btn" 
                            data-slot="${slot.id}"
                            ${!value ? 'disabled' : ''}>
                        <i class="fas fa-cog"></i> Attributes
                    </button>
                </div>
                <small class="form-hint">Enter item name or ID</small>
            </div>
        `;
    }

    attachEventListeners() {
        // Input changes
        const inputs = document.querySelectorAll('.equipment-slot-input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const slot = e.target.dataset.slot;
                const value = e.target.value.trim();
                
                if (value) {
                    this.equipment[slot] = value;
                } else {
                    delete this.equipment[slot];
                }

                // Enable/disable attributes button
                const btn = document.querySelector(`.equipment-attributes-btn[data-slot="${slot}"]`);
                if (btn) btn.disabled = !value;

                this.triggerChange();
            });
        });

        // Attributes buttons
        const buttons = document.querySelectorAll('.equipment-attributes-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const slot = e.target.closest('button').dataset.slot;
                this.openAttributesModal(slot);
            });
        });
    }

    openAttributesModal(slot) {
        const currentValue = this.equipment[slot] || '';
        const baseItem = this.extractBaseItem(currentValue);
        const attributes = this.parseInlineAttributes(currentValue);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Item Attributes - ${slot}</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Base Item</label>
                        <input type="text" id="attr-base-item" class="form-input" 
                               value="${baseItem}" placeholder="e.g., DIAMOND_SWORD">
                    </div>

                    <h4 class="mt-3 mb-2">Inline Attributes</h4>
                    
                    <div class="form-row">
                        <div class="form-group" style="flex: 2;">
                            <label class="form-label">Display Name</label>
                            <input type="text" id="attr-name" class="form-input" 
                                   value="${attributes.name || ''}" placeholder="Custom Item Name">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">Custom Model Data</label>
                            <input type="number" id="attr-model" class="form-input" 
                                   value="${attributes.model || ''}" placeholder="100">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Lore</label>
                        <input type="text" id="attr-lore" class="form-input" 
                               value="${attributes.lore || ''}" placeholder="&7Item description">
                        <small class="form-hint">Use & for color codes</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Enchantments</label>
                        <input type="text" id="attr-enchants" class="form-input" 
                               value="${attributes.enchantments || ''}" 
                               placeholder="PROTECTION_ENVIRONMENTAL:4,DURABILITY:3">
                        <small class="form-hint">Format: ENCHANT_NAME:LEVEL,ENCHANT_NAME:LEVEL</small>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Color</label>
                            <input type="text" id="attr-color" class="form-input" 
                                   value="${attributes.color || ''}" placeholder="RED or #FF0000">
                            <small class="form-hint">For leather armor or potions</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Amount</label>
                            <input type="number" id="attr-amount" class="form-input" 
                                   value="${attributes.amount || '1'}" min="1" max="64">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Skull Owner</label>
                        <input type="text" id="attr-skullowner" class="form-input" 
                               value="${attributes.skullowner || ''}" placeholder="Player name">
                        <small class="form-hint">For player heads</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Skull Texture</label>
                        <textarea id="attr-skulltexture" class="form-input" rows="3" 
                                  placeholder="Base64 texture value">${attributes.skulltexture || ''}</textarea>
                        <small class="form-hint">For custom player head textures</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">MMOItems Integration</label>
                        <div class="form-row">
                            <input type="text" id="attr-mmoitems-type" class="form-input" 
                                   placeholder="Type (e.g., SWORD)" style="flex: 1;">
                            <input type="text" id="attr-mmoitems-id" class="form-input" 
                                   placeholder="ID (e.g., RUBY_SWORD)" style="flex: 1;">
                        </div>
                        <small class="form-hint">Leave empty for regular items. Format: mmoitems{type=TYPE;id=ID}</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-save">Apply Attributes</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel')?.addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-save')?.addEventListener('click', () => {
            this.saveAttributes(slot, modal);
            modal.remove();
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    extractBaseItem(itemString) {
        if (!itemString) return '';
        // Check if MMOItems
        if (itemString.startsWith('mmoitems{')) return 'mmoitems';
        // Extract base item name before curly braces
        const match = itemString.match(/^([^{]+)/);
        return match ? match[1].trim() : itemString;
    }

    parseInlineAttributes(itemString) {
        const attrs = {};
        if (!itemString || !itemString.includes('{')) return attrs;

        const match = itemString.match(/\{([^}]+)\}/);
        if (!match) return attrs;

        const attrString = match[1];
        const parts = attrString.split(';');

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                attrs[key.trim()] = value.trim().replace(/^"|"$/g, '');
            }
        });

        return attrs;
    }

    saveAttributes(slot, modal) {
        const baseItem = modal.querySelector('#attr-base-item')?.value.trim();
        if (!baseItem) {
            delete this.equipment[slot];
            document.getElementById(`equipment-${slot.toLowerCase()}`).value = '';
            this.triggerChange();
            return;
        }

        // Check if MMOItems
        const mmoType = modal.querySelector('#attr-mmoitems-type')?.value.trim();
        const mmoId = modal.querySelector('#attr-mmoitems-id')?.value.trim();

        if (mmoType && mmoId) {
            this.equipment[slot] = `mmoitems{type=${mmoType};id=${mmoId}}`;
        } else {
            // Build inline attributes
            const attrs = {};
            
            const name = modal.querySelector('#attr-name')?.value.trim();
            if (name) attrs.name = name;
            
            const lore = modal.querySelector('#attr-lore')?.value.trim();
            if (lore) attrs.lore = lore;
            
            const enchants = modal.querySelector('#attr-enchants')?.value.trim();
            if (enchants) attrs.enchantments = enchants;
            
            const color = modal.querySelector('#attr-color')?.value.trim();
            if (color) attrs.color = color;
            
            const amount = modal.querySelector('#attr-amount')?.value.trim();
            if (amount && amount !== '1') attrs.amount = amount;
            
            const model = modal.querySelector('#attr-model')?.value.trim();
            if (model) attrs.model = model;
            
            const skullowner = modal.querySelector('#attr-skullowner')?.value.trim();
            if (skullowner) attrs.skullowner = skullowner;
            
            const skulltexture = modal.querySelector('#attr-skulltexture')?.value.trim();
            if (skulltexture) attrs.skulltexture = skulltexture;

            // Build final string
            let itemString = baseItem;
            if (Object.keys(attrs).length > 0) {
                const attrParts = Object.entries(attrs).map(([key, value]) => {
                    // Quote values with spaces or special chars
                    const needsQuotes = value.includes(' ') || value.includes('&');
                    return needsQuotes ? `${key}="${value}"` : `${key}=${value}`;
                });
                itemString += `{${attrParts.join(';')}}`;
            }

            this.equipment[slot] = itemString;
        }

        // Update input
        document.getElementById(`equipment-${slot.toLowerCase()}`).value = this.equipment[slot];
        this.triggerChange();
    }

    getValue() {
        return this.equipment;
    }

    setValue(equipment) {
        this.equipment = equipment || {};
        this.render();
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    triggerChange() {
        if (this.onChangeCallback) {
            this.onChangeCallback(this.equipment);
        }
    }
}
