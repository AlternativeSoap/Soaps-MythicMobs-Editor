/**
 * Mob Variables Editor - UI component for managing mob-level variables
 * Allows adding, editing, and removing variables directly on mobs
 * Part of Phase 5 of the Variable System Implementation
 */

const MobVariablesEditor = {
    // Current mob being edited
    currentMob: null,
    
    // Container element
    container: null,
    
    // Callback when variables change
    onChangeCallback: null,
    
    /**
     * Initialize the editor in a container
     * @param {HTMLElement} container - The container element
     * @param {Object} mob - The mob data object
     * @param {Function} onChange - Callback when variables change
     */
    init(container, mob, onChange) {
        this.container = container;
        this.currentMob = mob;
        this.onChangeCallback = onChange;
        
        // Ensure variables object exists
        if (!this.currentMob.Variables) {
            this.currentMob.Variables = {};
        }
        
        this.render();
    },
    
    /**
     * Render the variables editor
     */
    render() {
        if (!this.container) return;
        
        const variables = this.currentMob.Variables || {};
        const variableEntries = Object.entries(variables);
        
        this.container.innerHTML = `
            <div class="mob-variables-editor">
                <div class="variables-header">
                    <div class="header-left">
                        <i class="fas fa-database"></i>
                        <h4>Variables</h4>
                        <span class="variable-count">${variableEntries.length}</span>
                    </div>
                    <div class="header-actions">
                        <button type="button" class="btn-add-variable" title="Add Variable">
                            <i class="fas fa-plus"></i> Add Variable
                        </button>
                    </div>
                </div>
                
                <div class="variables-content ${variableEntries.length === 0 ? 'empty' : ''}">
                    ${variableEntries.length === 0 
                        ? this.renderEmptyState() 
                        : this.renderVariablesList(variableEntries)
                    }
                </div>
                
                <div class="variables-help">
                    <details>
                        <summary><i class="fas fa-question-circle"></i> Variable Syntax Help</summary>
                        <div class="help-content">
                            <p>Variables can have type prefixes for non-string values:</p>
                            <ul>
                                <li><code>int/value</code> - Integer numbers (default: 0)</li>
                                <li><code>float/value</code> - Decimal numbers (default: 0)</li>
                                <li><code>long/value</code> - Large whole numbers (default: 0)</li>
                                <li><code>double/value</code> - Large decimals (default: 0)</li>
                                <li><code>string/value</code> - Text (default: empty)</li>
                                <li><code>boolean/value</code> - True/False (default: false)</li>
                                <li><code>vector/x,y,z</code> - 3D vector (default: 0,0,0)</li>
                                <li><code>list/value</code> - Ordered list (default: empty)</li>
                                <li><code>set/value</code> - Unique set (default: empty)</li>
                                <li><code>map/value</code> - Key-value pairs (default: empty)</li>
                            </ul>
                            <p>Access mob variables with: <code>&lt;caster.var.name&gt;</code></p>
                            <p><em>Tip: When setting Lists or Sets with an empty string (""), the variable will be truly empty instead of containing one empty element.</em></p>
                        </div>
                    </details>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    },
    
    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="variables-empty">
                <i class="fas fa-database"></i>
                <p>No variables defined</p>
                <small>Add variables to track data on this mob</small>
            </div>
        `;
    },
    
    /**
     * Render the list of variables
     * @param {Array} entries - Array of [name, value] pairs
     */
    renderVariablesList(entries) {
        return `
            <div class="variables-list">
                ${entries.map(([name, value]) => this.renderVariableItem(name, value)).join('')}
            </div>
        `;
    },
    
    /**
     * Render a single variable item
     * @param {string} name - Variable name
     * @param {*} value - Variable value
     */
    renderVariableItem(name, value) {
        const { type, displayValue } = this.parseVariableValue(value);
        const typeInfo = this.getTypeInfo(type);
        
        return `
            <div class="variable-item" data-name="${this.escapeHtml(name)}">
                <div class="variable-info">
                    <div class="variable-type-icon" style="color: ${typeInfo.color}" title="${typeInfo.name}">
                        <i class="fas ${typeInfo.icon}"></i>
                    </div>
                    <div class="variable-details">
                        <span class="variable-name">${this.escapeHtml(name)}</span>
                        <span class="variable-value">${this.escapeHtml(displayValue)}</span>
                    </div>
                </div>
                <div class="variable-actions">
                    <button type="button" class="btn-edit-variable" title="Edit Variable">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn-delete-variable" title="Delete Variable">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Parse a variable value to extract type and display value
     * @param {*} value - The raw value
     * @returns {Object} - { type, displayValue }
     */
    parseVariableValue(value) {
        if (typeof value === 'number') {
            return {
                type: Number.isInteger(value) ? 'INTEGER' : 'FLOAT',
                displayValue: String(value)
            };
        }
        
        if (typeof value === 'boolean') {
            return {
                type: 'BOOLEAN',
                displayValue: value ? 'true' : 'false'
            };
        }
        
        const strValue = String(value);
        
        // Check for type prefixes
        const typePrefixes = {
            'int/': 'INTEGER',
            'float/': 'FLOAT',
            'long/': 'LONG',
            'double/': 'DOUBLE',
            'string/': 'STRING',
            'boolean/': 'BOOLEAN',
            'set/': 'SET',
            'list/': 'LIST',
            'map/': 'MAP',
            'location/': 'LOCATION',
            'vector/': 'VECTOR',
            'time/': 'TIME',
            'skill/': 'METASKILL',
            'item/': 'ITEM'
        };

        for (const [prefix, type] of Object.entries(typePrefixes)) {
            if (strValue.startsWith(prefix)) {
                return {
                    type: type,
                    displayValue: strValue.substring(prefix.length)
                };
            }
        }
        
        // Check for location format (world,x,y,z)
        if (/^[\w]+,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*/.test(strValue)) {
            return {
                type: 'LOCATION',
                displayValue: strValue
            };
        }
        
        // Check for vector format (x,y,z - 3 numbers separated by commas)
        if (/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/.test(strValue)) {
            return {
                type: 'VECTOR',
                displayValue: strValue
            };
        }

        // Default to string
        return {
            type: 'STRING',
            displayValue: strValue
        };
    },
    
    /**
     * Get type info for display
     * @param {string} type - Type ID
     */
    /**
     * Default values for each variable type.
     * When setting a new variable without a value, these defaults are used.
     * - All numeric types default to 0
     * - Strings, Lists, Sets and Maps default to empty
     * - Booleans default to "false"
     * - Vectors default to "0,0,0"
     */
    getDefaultValue(type) {
        const defaults = {
            'INTEGER': 0,
            'FLOAT': 0.0,
            'LONG': 0,
            'DOUBLE': 0.0,
            'STRING': '',
            'BOOLEAN': false,
            'VECTOR': '0,0,0',
            'LIST': '',
            'SET': '',
            'MAP': '',
            'LOCATION': '',
            'TIME': '',
            'METASKILL': '[]',
            'ITEM': 'AIR'
        };
        return defaults[type] !== undefined ? defaults[type] : '';
    },

    getTypeInfo(type) {
        const typeMap = {
            'INTEGER': { name: 'Integer', icon: 'fa-hashtag', color: '#3b82f6' },
            'FLOAT': { name: 'Float', icon: 'fa-percentage', color: '#8b5cf6' },
            'LONG': { name: 'Long', icon: 'fa-clock', color: '#06b6d4' },
            'DOUBLE': { name: 'Double', icon: 'fa-calculator', color: '#14b8a6' },
            'STRING': { name: 'String', icon: 'fa-font', color: '#22c55e' },
            'BOOLEAN': { name: 'Boolean', icon: 'fa-toggle-on', color: '#10b981' },
            'SET': { name: 'Set', icon: 'fa-tags', color: '#ec4899' },
            'LIST': { name: 'List', icon: 'fa-list', color: '#f97316' },
            'MAP': { name: 'Map', icon: 'fa-database', color: '#a855f7' },
            'LOCATION': { name: 'Location', icon: 'fa-map-marker-alt', color: '#ef4444' },
            'VECTOR': { name: 'Vector', icon: 'fa-arrows-alt', color: '#6366f1' },
            'TIME': { name: 'Time', icon: 'fa-hourglass-half', color: '#84cc16' },
            'METASKILL': { name: 'MetaSkill', icon: 'fa-bolt', color: '#9333ea' },
            'ITEM': { name: 'Item', icon: 'fa-cube', color: '#78716c' }
        };
        
        return typeMap[type] || typeMap['STRING'];
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Add variable button
        this.container.querySelector('.btn-add-variable')?.addEventListener('click', () => {
            this.showAddDialog();
        });
        
        // Edit buttons
        this.container.querySelectorAll('.btn-edit-variable').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.closest('.variable-item').dataset.name;
                this.showEditDialog(name);
            });
        });
        
        // Delete buttons
        this.container.querySelectorAll('.btn-delete-variable').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.closest('.variable-item').dataset.name;
                this.deleteVariable(name);
            });
        });
    },
    
    /**
     * Show the add variable dialog
     */
    showAddDialog() {
        // Use VariableBuilder if available
        if (typeof VariableBuilder !== 'undefined') {
            VariableBuilder.open({
                mode: 'create',
                scope: 'CASTER',
                onSave: (result) => {
                    this.addVariable(result.name, result.value, result.type);
                }
            });
        } else {
            // Fallback to simple prompt
            this.showSimpleAddDialog();
        }
    },
    
    /**
     * Show simple add dialog (fallback)
     */
    showSimpleAddDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'variable-dialog-overlay';
        dialog.innerHTML = `
            <div class="variable-dialog">
                <div class="variable-dialog-header">
                    <h3><i class="fas fa-plus"></i> Add Variable</h3>
                    <button class="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="variable-dialog-body">
                    <div class="form-group">
                        <label>Variable Name</label>
                        <input type="text" id="new-var-name" placeholder="e.g., damage_counter" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="new-var-type">
                            <option value="int">Integer</option>
                            <option value="float">Float</option>
                            <option value="long">Long</option>
                            <option value="double">Double</option>
                            <option value="string" selected>String</option>
                            <option value="boolean">Boolean</option>
                            <option value="vector">Vector</option>
                            <option value="list">List</option>
                            <option value="set">Set</option>
                            <option value="map">Map</option>
                            <option value="location">Location</option>
                        </select>
                        <span class="help-text" id="new-var-type-hint">Default: empty string</span>
                    </div>
                    <div class="form-group">
                        <label>Initial Value</label>
                        <input type="text" id="new-var-value" placeholder="e.g., 0" autocomplete="off">
                    </div>
                </div>
                <div class="variable-dialog-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-add">Add Variable</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Default value hints per type
        const typeDefaults = {
            'int': '0', 'float': '0.0', 'long': '0', 'double': '0.0',
            'string': 'empty string', 'boolean': 'false', 'vector': '0,0,0',
            'list': 'empty', 'set': 'empty', 'map': 'empty', 'location': 'empty'
        };
        
        // Update hint and placeholder when type changes
        const typeSelect = dialog.querySelector('#new-var-type');
        const hintEl = dialog.querySelector('#new-var-type-hint');
        const valueInput = dialog.querySelector('#new-var-value');
        
        typeSelect.addEventListener('change', () => {
            const t = typeSelect.value;
            hintEl.textContent = `Default: ${typeDefaults[t] || 'empty'}`;
            valueInput.placeholder = typeDefaults[t] || '';
        });
        
        // Focus name input
        setTimeout(() => {
            dialog.querySelector('#new-var-name').focus();
        }, 50);
        
        // Event handlers
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('.btn-cancel').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('.btn-add').addEventListener('click', () => {
            const name = dialog.querySelector('#new-var-name').value.trim();
            const type = dialog.querySelector('#new-var-type').value;
            const value = dialog.querySelector('#new-var-value').value;
            
            if (!name) {
                dialog.querySelector('#new-var-name').focus();
                return;
            }
            
            this.addVariable(name, value, type.toUpperCase());
            dialog.remove();
        });
        
        // Close on overlay click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    },
    
    /**
     * Show edit variable dialog
     * @param {string} name - Variable name to edit
     */
    showEditDialog(name) {
        const currentValue = this.currentMob.Variables[name];
        const { type, displayValue } = this.parseVariableValue(currentValue);
        
        // Use VariableBuilder if available
        if (typeof VariableBuilder !== 'undefined') {
            VariableBuilder.open({
                mode: 'edit',
                name: name,
                scope: 'CASTER',
                type: type,
                value: displayValue,
                onSave: (result) => {
                    // Delete old if name changed
                    if (result.name !== name) {
                        delete this.currentMob.Variables[name];
                    }
                    this.addVariable(result.name, result.value, result.type);
                }
            });
        } else {
            // Fallback to simple dialog
            this.showSimpleEditDialog(name, type, displayValue);
        }
    },
    
    /**
     * Show simple edit dialog (fallback)
     */
    showSimpleEditDialog(name, type, value) {
        const dialog = document.createElement('div');
        dialog.className = 'variable-dialog-overlay';
        dialog.innerHTML = `
            <div class="variable-dialog">
                <div class="variable-dialog-header">
                    <h3><i class="fas fa-edit"></i> Edit Variable</h3>
                    <button class="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="variable-dialog-body">
                    <div class="form-group">
                        <label>Variable Name</label>
                        <input type="text" id="edit-var-name" value="${this.escapeHtml(name)}" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="edit-var-type">
                            <option value="int" ${type === 'INTEGER' ? 'selected' : ''}>Integer</option>
                            <option value="float" ${type === 'FLOAT' ? 'selected' : ''}>Float</option>
                            <option value="long" ${type === 'LONG' ? 'selected' : ''}>Long</option>
                            <option value="double" ${type === 'DOUBLE' ? 'selected' : ''}>Double</option>
                            <option value="string" ${type === 'STRING' ? 'selected' : ''}>String</option>
                            <option value="boolean" ${type === 'BOOLEAN' ? 'selected' : ''}>Boolean</option>
                            <option value="vector" ${type === 'VECTOR' ? 'selected' : ''}>Vector</option>
                            <option value="list" ${type === 'LIST' ? 'selected' : ''}>List</option>
                            <option value="set" ${type === 'SET' ? 'selected' : ''}>Set</option>
                            <option value="map" ${type === 'MAP' ? 'selected' : ''}>Map</option>
                            <option value="location" ${type === 'LOCATION' ? 'selected' : ''}>Location</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Value</label>
                        <input type="text" id="edit-var-value" value="${this.escapeHtml(value)}" autocomplete="off">
                    </div>
                </div>
                <div class="variable-dialog-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-save">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Focus value input
        setTimeout(() => {
            dialog.querySelector('#edit-var-value').focus();
        }, 50);
        
        // Event handlers
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('.btn-cancel').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('.btn-save').addEventListener('click', () => {
            const newName = dialog.querySelector('#edit-var-name').value.trim();
            const newType = dialog.querySelector('#edit-var-type').value;
            const newValue = dialog.querySelector('#edit-var-value').value;
            
            if (!newName) {
                dialog.querySelector('#edit-var-name').focus();
                return;
            }
            
            // Delete old if name changed
            if (newName !== name) {
                delete this.currentMob.Variables[name];
            }
            
            this.addVariable(newName, newValue, newType.toUpperCase());
            dialog.remove();
        });
        
        // Close on overlay click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    },
    
    /**
     * Add or update a variable
     * @param {string} name - Variable name
     * @param {string} value - Variable value
     * @param {string} type - Variable type
     */
    addVariable(name, value, type) {
        if (!name) return;
        
        // Apply default value if no value provided
        // When setting a new variable without a value, use the type's default
        const effectiveValue = (value === undefined || value === null || value === '') 
            ? this.getDefaultValue(type) 
            : value;
        
        // Handle Lists/Sets: empty string "" means truly empty (not a single empty element)
        let formattedValue = effectiveValue;
        
        switch (type) {
            case 'INTEGER':
            case 'INT':
                if (!/^-?\d+$/.test(effectiveValue)) {
                    formattedValue = `int/${effectiveValue}`;
                } else {
                    formattedValue = parseInt(effectiveValue) || 0;
                }
                break;
                
            case 'FLOAT':
                if (!/^-?\d+\.?\d*$/.test(effectiveValue)) {
                    formattedValue = `float/${effectiveValue}`;
                } else {
                    formattedValue = parseFloat(effectiveValue) || 0.0;
                }
                break;

            case 'LONG':
                if (!/^-?\d+$/.test(effectiveValue)) {
                    formattedValue = `long/${effectiveValue}`;
                } else {
                    formattedValue = `long/${parseInt(effectiveValue) || 0}`;
                }
                break;

            case 'DOUBLE':
                if (!/^-?\d+\.?\d*$/.test(effectiveValue)) {
                    formattedValue = `double/${effectiveValue}`;
                } else {
                    formattedValue = `double/${parseFloat(effectiveValue) || 0.0}`;
                }
                break;
                
            case 'BOOLEAN':
                // Default to false per MythicMobs update
                formattedValue = (effectiveValue === 'true' || effectiveValue === true);
                break;

            case 'VECTOR':
                // Default to 0,0,0 per MythicMobs update
                formattedValue = effectiveValue || '0,0,0';
                if (!formattedValue.match(/^-?\d/)) {
                    formattedValue = `vector/${formattedValue}`;
                }
                break;

            case 'LIST':
                // Empty string means truly empty list (not single empty element)
                formattedValue = (effectiveValue === '' || effectiveValue === '""') ? '' : `list/${effectiveValue}`;
                break;

            case 'SET':
                // Empty string means truly empty set (not single empty element)
                formattedValue = (effectiveValue === '' || effectiveValue === '""') ? '' : `set/${effectiveValue}`;
                break;

            case 'MAP':
                formattedValue = effectiveValue ? `map/${effectiveValue}` : '';
                break;

            case 'LOCATION':
                formattedValue = effectiveValue ? effectiveValue : '';
                break;
                
            default:
                // String - keep as is, defaults to empty
                formattedValue = effectiveValue;
        }
        
        // Update mob data
        this.currentMob.Variables[name] = formattedValue;
        
        // Register with VariableManager
        if (typeof VariableManager !== 'undefined') {
            VariableManager.registerVariable({
                name: name,
                scope: 'CASTER',
                type: type,
                defaultValue: value,
                source: {
                    type: 'mob',
                    location: this.currentMob.internalName || 'Unknown Mob'
                }
            });
        }
        
        // Trigger change callback
        this.triggerChange();
        
        // Re-render
        this.render();
    },
    
    /**
     * Delete a variable
     * @param {string} name - Variable name to delete
     */
    deleteVariable(name) {
        if (!confirm(`Delete variable "${name}"?`)) return;
        
        delete this.currentMob.Variables[name];
        
        // Trigger change callback
        this.triggerChange();
        
        // Re-render
        this.render();
    },
    
    /**
     * Trigger the change callback
     */
    triggerChange() {
        if (this.onChangeCallback) {
            this.onChangeCallback(this.currentMob.Variables);
        }
    },
    
    /**
     * Get all variables
     * @returns {Object} - Variables object
     */
    getVariables() {
        return this.currentMob.Variables || {};
    },
    
    /**
     * Set all variables
     * @param {Object} variables - Variables object
     */
    setVariables(variables) {
        this.currentMob.Variables = variables || {};
        this.render();
    },
    
    /**
     * Escape HTML entities
     */
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    
    /**
     * Export variables to YAML format
     * @returns {string} - YAML string
     */
    exportToYAML() {
        const variables = this.currentMob.Variables || {};
        const entries = Object.entries(variables);
        
        if (entries.length === 0) {
            return '';
        }
        
        let yaml = 'Variables:\n';
        for (const [name, value] of entries) {
            const formattedValue = typeof value === 'string' 
                ? `"${value.replace(/"/g, '\\"')}"` 
                : value;
            yaml += `  ${name}: ${formattedValue}\n`;
        }
        
        return yaml;
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobVariablesEditor;
}
