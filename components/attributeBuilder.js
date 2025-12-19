/**
 * AttributeBuilder.js
 * Component for building and managing attributes with aliases and dropdown configurations
 * Used in Admin Panel for creating/editing mechanics, triggers, conditions, and targeters
 */

class AttributeBuilder {
    constructor() {
        this.attributes = [];
        this.nextId = 1;
        this.container = null;
        this.onChange = null; // Callback when attributes change
    }

    /**
     * Initialize with existing attributes
     * @param {Array} attributes - Array of attribute objects
     */
    fromJSON(attributes) {
        this.attributes = (attributes || []).map((attr, index) => ({
            id: this.nextId++,
            name: attr.name || '',
            value: attr.value || '',
            type: attr.type || 'string',
            aliases: Array.isArray(attr.aliases) ? [...attr.aliases] : [],
            description: attr.description || '',
            required: attr.required || false,
            dropdown: attr.dropdown || null
        }));
        return this;
    }

    /**
     * Export attributes to JSON format
     * @returns {Array} - Array of attribute objects without internal IDs
     */
    toJSON() {
        return this.attributes.map(attr => ({
            name: attr.name,
            value: attr.value,
            type: attr.type,
            aliases: attr.aliases,
            description: attr.description,
            required: attr.required,
            dropdown: attr.dropdown
        }));
    }

    /**
     * Add a new attribute
     * @param {Object} attr - Optional attribute object
     * @returns {Object} - The newly added attribute
     */
    addAttribute(attr = null) {
        const newAttr = attr || {
            id: this.nextId++,
            name: '',
            value: '',
            type: 'string',
            aliases: [],
            description: '',
            required: false,
            dropdown: null
        };
        
        if (!newAttr.id) {
            newAttr.id = this.nextId++;
        }
        
        this.attributes.push(newAttr);
        this.notifyChange();
        return newAttr;
    }

    /**
     * Remove an attribute by ID
     * @param {number} id - The attribute ID
     */
    removeAttribute(id) {
        this.attributes = this.attributes.filter(a => a.id !== id);
        this.notifyChange();
    }

    /**
     * Get attribute by ID
     * @param {number} id - The attribute ID
     * @returns {Object|null} - The attribute object or null
     */
    getAttribute(id) {
        return this.attributes.find(a => a.id === id) || null;
    }

    /**
     * Update attribute property
     * @param {number} id - The attribute ID
     * @param {string} prop - The property name
     * @param {any} value - The new value
     */
    updateAttribute(id, prop, value) {
        const attr = this.getAttribute(id);
        if (attr) {
            attr[prop] = value;
            this.notifyChange();
        }
    }

    /**
     * Add an alias to an attribute
     * @param {number} attrId - The attribute ID
     * @param {string} alias - The alias to add
     */
    addAlias(attrId, alias) {
        const attr = this.getAttribute(attrId);
        if (attr && alias && alias.trim() !== '') {
            const trimmedAlias = alias.trim();
            if (!attr.aliases.includes(trimmedAlias)) {
                attr.aliases.push(trimmedAlias);
                this.notifyChange();
            }
        }
    }

    /**
     * Remove an alias from an attribute
     * @param {number} attrId - The attribute ID
     * @param {string} alias - The alias to remove
     */
    removeAlias(attrId, alias) {
        const attr = this.getAttribute(attrId);
        if (attr) {
            attr.aliases = attr.aliases.filter(a => a !== alias);
            this.notifyChange();
        }
    }

    /**
     * Set dropdown configuration for an attribute
     * @param {number} attrId - The attribute ID
     * @param {Object} dropdownConfig - The dropdown configuration
     */
    setDropdown(attrId, dropdownConfig) {
        const attr = this.getAttribute(attrId);
        if (attr) {
            attr.dropdown = dropdownConfig;
            this.notifyChange();
        }
    }

    /**
     * Move attribute up in the list
     * @param {number} id - The attribute ID
     */
    moveUp(id) {
        const index = this.attributes.findIndex(a => a.id === id);
        if (index > 0) {
            [this.attributes[index - 1], this.attributes[index]] = 
            [this.attributes[index], this.attributes[index - 1]];
            this.notifyChange();
            this.render();
        }
    }

    /**
     * Move attribute down in the list
     * @param {number} id - The attribute ID
     */
    moveDown(id) {
        const index = this.attributes.findIndex(a => a.id === id);
        if (index < this.attributes.length - 1 && index >= 0) {
            [this.attributes[index], this.attributes[index + 1]] = 
            [this.attributes[index + 1], this.attributes[index]];
            this.notifyChange();
            this.render();
        }
    }

    /**
     * Validate all attributes
     * @returns {Object} - Validation result with isValid flag and errors array
     */
    validate() {
        const errors = [];
        const namesSeen = new Set();

        this.attributes.forEach((attr, index) => {
            if (!attr.name || attr.name.trim() === '') {
                errors.push(`Attribute at position ${index + 1} is missing a name`);
            } else {
                // Check for duplicate names
                if (namesSeen.has(attr.name.toLowerCase())) {
                    errors.push(`Duplicate attribute name: "${attr.name}"`);
                }
                namesSeen.add(attr.name.toLowerCase());
            }

            // Check for duplicate aliases within the same attribute
            const aliasesSeen = new Set();
            attr.aliases.forEach(alias => {
                if (aliasesSeen.has(alias.toLowerCase())) {
                    errors.push(`Duplicate alias "${alias}" in attribute "${attr.name}"`);
                }
                aliasesSeen.add(alias.toLowerCase());
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Notify change callback
     */
    notifyChange() {
        if (typeof this.onChange === 'function') {
            this.onChange(this.toJSON());
        }
    }

    /**
     * Render the attribute builder UI
     * @param {HTMLElement} container - The container element
     */
    render(container) {
        if (container) {
            this.container = container;
        }
        
        if (!this.container) return;

        const attributesHTML = this.attributes.length > 0 
            ? this.attributes.map(attr => this.renderAttribute(attr)).join('')
            : `<div class="attribute-empty-state">
                <i class="fas fa-sliders-h"></i>
                <p><strong>No attributes yet</strong></p>
                <p>Click "Add Attribute" below to define attributes for this item</p>
               </div>`;

        this.container.innerHTML = `
            <div class="attribute-builder">
                <div class="attribute-list" id="attributeList">
                    ${attributesHTML}
                </div>
                <button type="button" class="btn btn-secondary" id="btnAddAttribute">
                    <i class="fas fa-plus"></i> Add Attribute
                </button>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Render a single attribute
     * @param {Object} attr - The attribute object
     * @returns {string} - HTML string
     */
    renderAttribute(attr) {
        return `
            <div class="attribute-item" data-attr-id="${attr.id}">
                <div class="attribute-header">
                    <input type="text" 
                           class="form-input attr-name" 
                           placeholder="Attribute name (e.g., radius)" 
                           value="${this.escapeHtml(attr.name)}"
                           data-attr-id="${attr.id}">
                    <div class="attribute-actions">
                        <button type="button" class="btn-icon" title="Move up" data-action="moveUp" data-attr-id="${attr.id}">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button type="button" class="btn-icon" title="Move down" data-action="moveDown" data-attr-id="${attr.id}">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button type="button" class="btn-icon btn-danger" title="Remove" data-action="remove" data-attr-id="${attr.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="attribute-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Default Value</label>
                            <input type="text" 
                                   class="form-input attr-value" 
                                   placeholder="Default value" 
                                   value="${this.escapeHtml(attr.value)}"
                                   data-attr-id="${attr.id}">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select class="form-select attr-type" data-attr-id="${attr.id}">
                                <option value="string" ${attr.type === 'string' ? 'selected' : ''}>String</option>
                                <option value="number" ${attr.type === 'number' ? 'selected' : ''}>Number</option>
                                <option value="boolean" ${attr.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                                <option value="dropdown" ${attr.type === 'dropdown' ? 'selected' : ''}>Dropdown</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" 
                               class="form-input attr-description" 
                               placeholder="Description of what this attribute does" 
                               value="${this.escapeHtml(attr.description)}"
                               data-attr-id="${attr.id}">
                    </div>

                    <div class="form-group">
                        <label>Aliases</label>
                        <div class="alias-tags" data-attr-id="${attr.id}">
                            ${attr.aliases.map(alias => `
                                <span class="tag">
                                    ${this.escapeHtml(alias)}
                                    <button type="button" class="tag-remove" data-action="removeAlias" data-attr-id="${attr.id}" data-alias="${this.escapeHtml(alias)}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </span>
                            `).join('')}
                        </div>
                        <div class="input-with-btn">
                            <input type="text" 
                                   class="form-input alias-input" 
                                   placeholder="Add alias (e.g., r, maxr)" 
                                   data-attr-id="${attr.id}">
                            <button type="button" class="btn btn-sm btn-secondary" data-action="addAlias" data-attr-id="${attr.id}">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>

                    <div class="form-check">
                        <input type="checkbox" 
                               class="form-checkbox attr-required" 
                               id="required_${attr.id}" 
                               data-attr-id="${attr.id}"
                               ${attr.required ? 'checked' : ''}>
                        <label for="required_${attr.id}">Required attribute</label>
                    </div>

                    ${attr.type === 'dropdown' ? this.renderDropdownConfig(attr) : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render dropdown configuration section
     * @param {Object} attr - The attribute object
     * @returns {string} - HTML string
     */
    renderDropdownConfig(attr) {
        const dropdown = attr.dropdown || {};
        return `
            <div class="dropdown-config">
                <h4>Dropdown Configuration</h4>
                <div class="form-group">
                    <label>Dropdown Type</label>
                    <select class="form-select dropdown-type" data-attr-id="${attr.id}">
                        <option value="item" ${dropdown.type === 'item' ? 'selected' : ''}>Minecraft Items</option>
                        <option value="mob" ${dropdown.type === 'mob' ? 'selected' : ''}>Mob Types</option>
                        <option value="particle" ${dropdown.type === 'particle' ? 'selected' : ''}>Particles</option>
                        <option value="sound" ${dropdown.type === 'sound' ? 'selected' : ''}>Sounds</option>
                        <option value="block" ${dropdown.type === 'block' ? 'selected' : ''}>Blocks</option>
                        <option value="enchantment" ${dropdown.type === 'enchantment' ? 'selected' : ''}>Enchantments</option>
                        <option value="custom" ${dropdown.type === 'custom' ? 'selected' : ''}>Custom Options</option>
                    </select>
                </div>
                <div class="form-check">
                    <input type="checkbox" 
                           class="form-checkbox dropdown-multiple" 
                           id="multiple_${attr.id}" 
                           data-attr-id="${attr.id}"
                           ${dropdown.multiple ? 'checked' : ''}>
                    <label for="multiple_${attr.id}">Allow multiple selection</label>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to rendered elements
     */
    attachEventListeners() {
        // Add attribute button
        const addBtn = document.getElementById('btnAddAttribute');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addAttribute();
                this.render();
            });
        }

        // Attribute actions (remove, move up, move down)
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const attrId = parseInt(btn.dataset.attrId);
                
                switch (action) {
                    case 'remove':
                        this.removeAttribute(attrId);
                        this.render();
                        break;
                    case 'moveUp':
                        this.moveUp(attrId);
                        break;
                    case 'moveDown':
                        this.moveDown(attrId);
                        break;
                    case 'addAlias':
                        const aliasInput = document.querySelector(`.alias-input[data-attr-id="${attrId}"]`);
                        if (aliasInput && aliasInput.value.trim()) {
                            this.addAlias(attrId, aliasInput.value.trim());
                            aliasInput.value = '';
                            this.render();
                        }
                        break;
                    case 'removeAlias':
                        const alias = btn.dataset.alias;
                        this.removeAlias(attrId, alias);
                        this.render();
                        break;
                }
            });
        });

        // Attribute name changes
        document.querySelectorAll('.attr-name').forEach(input => {
            input.addEventListener('input', (e) => {
                const attrId = parseInt(input.dataset.attrId);
                this.updateAttribute(attrId, 'name', input.value);
            });
        });

        // Attribute value changes
        document.querySelectorAll('.attr-value').forEach(input => {
            input.addEventListener('input', (e) => {
                const attrId = parseInt(input.dataset.attrId);
                this.updateAttribute(attrId, 'value', input.value);
            });
        });

        // Attribute type changes
        document.querySelectorAll('.attr-type').forEach(select => {
            select.addEventListener('change', (e) => {
                const attrId = parseInt(select.dataset.attrId);
                this.updateAttribute(attrId, 'type', select.value);
                this.render(); // Re-render to show/hide dropdown config
            });
        });

        // Attribute description changes
        document.querySelectorAll('.attr-description').forEach(input => {
            input.addEventListener('input', (e) => {
                const attrId = parseInt(input.dataset.attrId);
                this.updateAttribute(attrId, 'description', input.value);
            });
        });

        // Required checkbox changes
        document.querySelectorAll('.attr-required').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const attrId = parseInt(checkbox.dataset.attrId);
                this.updateAttribute(attrId, 'required', checkbox.checked);
            });
        });

        // Alias input - add on Enter key
        document.querySelectorAll('.alias-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const attrId = parseInt(input.dataset.attrId);
                    if (input.value.trim()) {
                        this.addAlias(attrId, input.value.trim());
                        input.value = '';
                        this.render();
                    }
                }
            });
        });

        // Dropdown type changes
        document.querySelectorAll('.dropdown-type').forEach(select => {
            select.addEventListener('change', (e) => {
                const attrId = parseInt(select.dataset.attrId);
                const attr = this.getAttribute(attrId);
                if (attr) {
                    if (!attr.dropdown) attr.dropdown = {};
                    attr.dropdown.type = select.value;
                    this.notifyChange();
                }
            });
        });

        // Dropdown multiple checkbox
        document.querySelectorAll('.dropdown-multiple').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const attrId = parseInt(checkbox.dataset.attrId);
                const attr = this.getAttribute(attrId);
                if (attr) {
                    if (!attr.dropdown) attr.dropdown = {};
                    attr.dropdown.multiple = checkbox.checked;
                    this.notifyChange();
                }
            });
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {any} unsafe - The unsafe string
     * @returns {string} - The escaped string
     */
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Get the total number of attributes
     * @returns {number} - The count
     */
    getCount() {
        return this.attributes.length;
    }

    /**
     * Clear all attributes
     */
    clear() {
        this.attributes = [];
        this.nextId = 1;
        this.notifyChange();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttributeBuilder;
}
