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
                                <li><code>int/value</code> - Integer numbers</li>
                                <li><code>float/value</code> - Decimal numbers</li>
                                <li><code>string/value</code> - Text (default)</li>
                            </ul>
                            <p>Access mob variables with: <code>&lt;caster.var.name&gt;</code></p>
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
        if (strValue.startsWith('int/')) {
            return {
                type: 'INTEGER',
                displayValue: strValue.substring(4)
            };
        }
        
        if (strValue.startsWith('float/')) {
            return {
                type: 'FLOAT',
                displayValue: strValue.substring(6)
            };
        }
        
        if (strValue.startsWith('string/')) {
            return {
                type: 'STRING',
                displayValue: strValue.substring(7)
            };
        }
        
        // Check for location format (world,x,y,z)
        if (/^[\w]+,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*/.test(strValue)) {
            return {
                type: 'LOCATION',
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
    getTypeInfo(type) {
        const typeMap = {
            'INTEGER': { name: 'Integer', icon: 'fa-hashtag', color: '#3b82f6' },
            'FLOAT': { name: 'Float', icon: 'fa-percentage', color: '#8b5cf6' },
            'STRING': { name: 'String', icon: 'fa-font', color: '#22c55e' },
            'BOOLEAN': { name: 'Boolean', icon: 'fa-toggle-on', color: '#f59e0b' },
            'LOCATION': { name: 'Location', icon: 'fa-map-marker-alt', color: '#06b6d4' }
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
                            <option value="string">String</option>
                            <option value="int">Integer</option>
                            <option value="float">Float</option>
                        </select>
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
                            <option value="string" ${type === 'STRING' ? 'selected' : ''}>String</option>
                            <option value="int" ${type === 'INTEGER' ? 'selected' : ''}>Integer</option>
                            <option value="float" ${type === 'FLOAT' ? 'selected' : ''}>Float</option>
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
        
        // Format value with type prefix if needed
        let formattedValue = value;
        
        switch (type) {
            case 'INTEGER':
            case 'INT':
                // Only add prefix if value is not a pure number
                if (!/^-?\d+$/.test(value)) {
                    formattedValue = `int/${value}`;
                } else {
                    formattedValue = parseInt(value) || 0;
                }
                break;
                
            case 'FLOAT':
            case 'DOUBLE':
                // Only add prefix if value is not a pure number
                if (!/^-?\d+\.?\d*$/.test(value)) {
                    formattedValue = `float/${value}`;
                } else {
                    formattedValue = parseFloat(value) || 0.0;
                }
                break;
                
            case 'BOOLEAN':
                formattedValue = value === 'true' || value === true;
                break;
                
            default:
                // String - keep as is
                formattedValue = value;
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
