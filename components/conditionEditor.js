/**
 * ConditionEditor Component
 * Universal condition editor with search, filtering, and dynamic attribute configuration
 * Supports all 157 MythicMobs conditions across 4 categories
 */

class ConditionEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            mode: options.mode || 'Conditions', // 'Conditions', 'TargetConditions', or 'TriggerConditions'
            conditions: options.conditions || [],
            onChange: options.onChange || (() => {}),
            ...options
        };
        
        this.selectedCategory = 'All';
        this.searchQuery = '';
        this.currentCondition = null;
        this.favorites = this.loadFavorites();
        
        this.render();
    }
    
    loadFavorites() {
        try {
            const saved = localStorage.getItem('conditionFavorites');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveFavorites() {
        try {
            localStorage.setItem('conditionFavorites', JSON.stringify(this.favorites));
        } catch (e) {
            console.error('Failed to save favorites:', e);
        }
    }
    
    toggleFavorite(conditionId) {
        const index = this.favorites.indexOf(conditionId);
        if (index === -1) {
            this.favorites.push(conditionId);
        } else {
            this.favorites.splice(index, 1);
        }
        this.saveFavorites();
        this.updateConditionGrid();
    }
    
    isFavorite(conditionId) {
        return this.favorites.includes(conditionId);
    }
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="condition-editor">
                <div class="condition-editor-header">
                    <h3>${this.options.mode}</h3>
                    <button class="btn-icon btn-add-condition" title="Add Condition">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <!-- Condition List -->
                <div class="condition-list">
                    ${this.renderConditionList()}
                </div>
                
                <!-- Add Condition Modal (hidden by default) -->
                <div id="conditionBrowserModal" class="condition-modal" style="display: none;">
                    <div class="modal-content condition-browser">
                        <div class="modal-header">
                            <h2>Condition Browser</h2>
                            <button class="btn-close">&times;</button>
                        </div>
                        
                        <div class="condition-browser-body">
                            <!-- Search Bar -->
                            <div class="search-bar">
                                <input type="text" 
                                       id="conditionSearch" 
                                       placeholder="Search..." 
                                       class="search-input">
                                <i class="fas fa-search search-icon"></i>
                            </div>
                            
                            <!-- Category Tabs -->
                            <div class="category-tabs">
                                <button class="category-tab" data-category="Favorites">
                                    <i class="fas fa-star"></i> Favorites (${this.favorites?.length || 0})
                                </button>
                                <button class="category-tab active" data-category="All">
                                    All (${window.ALL_CONDITIONS?.length || 0})
                                </button>
                                <button class="category-tab" data-category="Entity">
                                    Entity (${window.CONDITION_CATEGORIES?.Entity?.length || 0})
                                </button>
                                <button class="category-tab" data-category="Location">
                                    Location (${window.CONDITION_CATEGORIES?.Location?.length || 0})
                                </button>
                                <button class="category-tab" data-category="Compare">
                                    Compare (${window.CONDITION_CATEGORIES?.Compare?.length || 0})
                                </button>
                                <button class="category-tab" data-category="Meta">
                                    Meta (${window.CONDITION_CATEGORIES?.Meta?.length || 0})
                                </button>
                            </div>
                            
                            <!-- Condition Grid -->
                            <div class="condition-grid" id="conditionGrid">
                                ${this.renderConditionGrid()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Edit Condition Modal (hidden by default) -->
                <div id="conditionEditModal" class="condition-modal" style="display: none;">
                    <div class="modal-content condition-edit">
                        <div class="modal-header">
                            <h2>Configure Condition</h2>
                            <button class="btn-close">&times;</button>
                        </div>
                        
                        <div class="condition-edit-body" id="conditionEditBody">
                            <!-- Dynamic content populated by showConditionEditor -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderConditionList() {
        if (!this.options.conditions || this.options.conditions.length === 0) {
            return '<div class="empty-state">No conditions added yet. Click + to add a condition.</div>';
        }
        
        return this.options.conditions.map((cond, index) => `
            <div class="condition-item" data-index="${index}">
                <div class="condition-item-content">
                    <div class="condition-syntax">
                        <code>- ${cond.syntax || this.formatConditionSyntax(cond)}</code>
                    </div>
                    <div class="condition-description">
                        ${cond.condition?.description || ''}
                    </div>
                </div>
                <div class="condition-item-actions">
                    <button class="btn-icon btn-edit-condition" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete-condition" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon btn-move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn-icon btn-move-down" title="Move Down" ${index === this.options.conditions.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderConditionGrid() {
        const conditions = this.getFilteredConditions();
        
        if (conditions.length === 0) {
            return '<div class="empty-state">No conditions found matching your search.</div>';
        }
        
        return conditions.map(condition => `
            <div class="condition-card" data-condition-id="${condition.id}">
                <div class="condition-card-header">
                    <h4>${condition.name}</h4>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="btn-icon btn-favorite" data-condition-id="${condition.id}" title="${this.isFavorite(condition.id) ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="${this.isFavorite(condition.id) ? 'fas' : 'far'} fa-star" style="color: ${this.isFavorite(condition.id) ? '#ffc107' : '#666'};"></i>
                        </button>
                        <span class="condition-category-badge">${condition.category}</span>
                    </div>
                </div>
                <div class="condition-card-body">
                    <p class="condition-card-description">${condition.description}</p>
                    ${condition.aliases && condition.aliases.length > 0 ? `
                        <div class="condition-aliases">
                            <strong>Aliases:</strong> ${condition.aliases.join(', ')}
                        </div>
                    ` : ''}
                    ${condition.examples && condition.examples.length > 0 ? `
                        <div class="condition-example">
                            <strong>Example:</strong> <code>${condition.examples[0]}</code>
                        </div>
                    ` : ''}
                </div>
                <div class="condition-card-footer">
                    <button class="btn btn-primary btn-select-condition">Select</button>
                </div>
            </div>
        `).join('');
    }
    
    getFilteredConditions() {
        let conditions = window.ALL_CONDITIONS || [];
        
        // Filter by category
        if (this.selectedCategory === 'Favorites') {
            conditions = conditions.filter(c => this.isFavorite(c.id));
        } else if (this.selectedCategory && this.selectedCategory !== 'All') {
            conditions = conditions.filter(c => c.category === this.selectedCategory);
        }
        
        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            conditions = conditions.filter(c => 
                c.name.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query) ||
                (c.aliases && c.aliases.some(a => a.toLowerCase().includes(query)))
            );
        }
        
        return conditions;
    }
    
    attachEventListeners() {
        // Add condition button
        this.container.querySelector('.btn-add-condition')?.addEventListener('click', () => {
            this.showConditionBrowser();
        });
        
        // Condition list actions (using event delegation)
        this.container.querySelector('.condition-list')?.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            
            const conditionItem = button.closest('.condition-item');
            if (!conditionItem) return;
            
            const index = parseInt(conditionItem.dataset.index);
            
            if (button.classList.contains('btn-edit-condition')) {
                this.editCondition(index);
            } else if (button.classList.contains('btn-delete-condition')) {
                this.deleteCondition(index);
            } else if (button.classList.contains('btn-move-up')) {
                this.moveCondition(index, index - 1);
            } else if (button.classList.contains('btn-move-down')) {
                this.moveCondition(index, index + 1);
            }
        });
        
        // Modal close buttons
        this.container.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        // Search input
        const searchInput = this.container.querySelector('#conditionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.updateConditionGrid();
            });
        }
        
        // Category tabs
        this.container.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedCategory = e.target.dataset.category;
                this.updateConditionGrid();
            });
        });
        
        // Condition selection (using event delegation)
        const conditionGrid = this.container.querySelector('#conditionGrid');
        if (conditionGrid) {
            conditionGrid.addEventListener('click', (e) => {
                // Handle favorite button
                const favoriteBtn = e.target.closest('.btn-favorite');
                if (favoriteBtn) {
                    e.stopPropagation();
                    const conditionId = favoriteBtn.dataset.conditionId;
                    this.toggleFavorite(conditionId);
                    return;
                }
                
                // Handle select button
                const selectBtn = e.target.closest('.btn-select-condition');
                if (selectBtn) {
                    const card = selectBtn.closest('.condition-card');
                    const conditionId = card.dataset.conditionId;
                    const condition = window.ConditionHelpers.findCondition(conditionId);
                    if (condition) {
                        this.selectCondition(condition);
                    }
                }
            });
        }
    }
    
    showConditionBrowser() {
        const modal = this.container.querySelector('#conditionBrowserModal');
        if (modal) {
            modal.style.display = 'flex';
            this.searchQuery = '';
            this.selectedCategory = 'All';
            this.container.querySelector('#conditionSearch').value = '';
            this.container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            this.container.querySelector('.category-tab[data-category="All"]')?.classList.add('active');
            this.updateConditionGrid();
            
            // Add close button handler
            const closeBtn = modal.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                    document.removeEventListener('keydown', this.escapeHandler);
                };
            }
            
            // Add ESC key handler
            this.escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    modal.style.display = 'none';
                    document.removeEventListener('keydown', this.escapeHandler);
                }
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
    }
    
    updateConditionGrid() {
        const grid = this.container.querySelector('#conditionGrid');
        if (grid) {
            grid.innerHTML = this.renderConditionGrid();
        }
    }
    
    selectCondition(condition) {
        // Close browser modal
        this.container.querySelector('#conditionBrowserModal').style.display = 'none';
        
        // Show editor modal
        this.showConditionEditor(condition);
    }
    
    showConditionEditor(condition, editIndex = null) {
        this.currentCondition = condition;
        this.currentEditIndex = editIndex;
        
        const modal = this.container.querySelector('#conditionEditModal');
        const body = this.container.querySelector('#conditionEditBody');
        
        if (!modal || !body) return;
        
        // Get existing values if editing
        const existingValues = editIndex !== null ? this.options.conditions[editIndex] : {};
        
        body.innerHTML = `
            <div class="condition-editor-form">
                <div class="form-group">
                    <label>Condition</label>
                    <div class="condition-name-display">
                        <strong>${condition.name}</strong>
                        <span class="condition-category-badge">${condition.category}</span>
                    </div>
                    <p class="condition-description">${condition.description}</p>
                </div>
                
                ${condition.attributes && condition.attributes.length > 0 ? `
                    <div class="form-section">
                        <h4>Attributes</h4>
                        ${condition.attributes.map(attr => this.renderAttributeField(attr, existingValues.attributes)).join('')}
                    </div>
                ` : ''}
                
                <div class="form-group">
                    <label class="form-label">Action</label>
                    <select id="conditionAction" class="form-select">
                        <option value="true" ${existingValues.action === 'true' || !existingValues.action ? 'selected' : ''}>true - Run if condition met</option>
                        <option value="false" ${existingValues.action === 'false' ? 'selected' : ''}>false - Run if condition NOT met</option>
                        <option value="power" ${existingValues.action?.startsWith('power') ? 'selected' : ''}>power - Multiply skill power</option>
                        <option value="cast" ${existingValues.action?.startsWith('cast ') ? 'selected' : ''}>cast - Cast additional skill</option>
                        <option value="castinstead" ${existingValues.action?.startsWith('castinstead') ? 'selected' : ''}>castinstead - Cast different skill</option>
                        <option value="orelsecast" ${existingValues.action?.startsWith('orElseCast') ? 'selected' : ''}>orElseCast - Cast if condition fails</option>
                        <option value="cancel" ${existingValues.action === 'cancel' ? 'selected' : ''}>cancel - Cancel skill tree</option>
                    </select>
                </div>
                
                <div id="actionParameterField" style="display: none;" class="form-group">
                    <label id="actionParameterLabel" class="form-label">Parameter</label>
                    <input type="text" id="actionParameter" class="form-input" placeholder="Enter value">
                </div>
                
                <div class="form-group">
                    <label>Preview</label>
                    <div class="condition-syntax-preview">
                        <code id="syntaxPreview">- ${condition.id} true</code>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-secondary btn-cancel-condition">Cancel</button>
                    <button class="btn btn-primary btn-save-condition">
                        ${editIndex !== null ? 'Update' : 'Add'} Condition
                    </button>
                </div>
            </div>
        `;
        
        // Attach editor event listeners
        this.attachEditorEventListeners();
        
        // Update preview initially
        this.updateSyntaxPreview();
        
        modal.style.display = 'flex';
    }
    
    renderAttributeField(attr, existingValues = {}) {
        const value = existingValues?.[attr.name] || attr.default || '';
        const inputId = `attr_${attr.name}`;
        
        let inputHtml = '';
        
        if (attr.type === 'boolean') {
            inputHtml = `
                <select id="${inputId}" class="form-select attr-input" data-attr="${attr.name}">
                    <option value="true" ${value === true || value === 'true' ? 'selected' : ''}>true</option>
                    <option value="false" ${value === false || value === 'false' ? 'selected' : ''}>false</option>
                </select>
            `;
        } else if (attr.options && attr.options.length > 0) {
            inputHtml = `
                <select id="${inputId}" class="form-select attr-input" data-attr="${attr.name}">
                    <option value="">Select ${attr.name}...</option>
                    ${attr.options.map(opt => `
                        <option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>
                    `).join('')}
                </select>
            `;
        } else {
            inputHtml = `
                <input type="text" 
                       id="${inputId}" 
                       class="form-input attr-input" 
                       data-attr="${attr.name}"
                       placeholder="${attr.placeholder || attr.name}"
                       value="${value}">
            `;
        }
        
        return `
            <div class="form-group" data-attr-name="${attr.name}">
                <label for="${inputId}">
                    ${attr.name}
                    ${attr.required ? '<span class="required">*</span>' : ''}
                    ${attr.aliases && attr.aliases.length > 0 ? `<span class="attr-aliases">(${attr.aliases.join(', ')})</span>` : ''}
                </label>
                ${inputHtml}
                <small class="form-text">${attr.description}</small>
                <div class="validation-feedback"></div>
            </div>
        `;
    }
    
    attachEditorEventListeners() {
        const modal = this.container.querySelector('#conditionEditModal');
        if (!modal) return;
        
        // Attribute inputs - update preview and validate on change
        modal.querySelectorAll('.attr-input').forEach(input => {
            input.addEventListener('input', () => {
                this.validateAttributeField(input);
                this.updateSyntaxPreview();
            });
            input.addEventListener('change', () => {
                this.validateAttributeField(input);
                this.updateSyntaxPreview();
            });
        });
        
        // Action selector
        const actionSelect = modal.querySelector('#conditionAction');
        const paramField = modal.querySelector('#actionParameterField');
        const paramLabel = modal.querySelector('#actionParameterLabel');
        const paramInput = modal.querySelector('#actionParameter');
        
        if (actionSelect) {
            actionSelect.addEventListener('change', () => {
                const action = actionSelect.value;
                
                // Show/hide parameter field based on action
                if (action === 'power' || action === 'cast' || action === 'castinstead' || action === 'orelsecast') {
                    paramField.style.display = 'block';
                    
                    if (action === 'power') {
                        paramLabel.textContent = 'Multiplier';
                        paramInput.placeholder = '2.0';
                    } else {
                        paramLabel.textContent = 'Skill Name';
                        paramInput.placeholder = 'SkillName';
                    }
                } else {
                    paramField.style.display = 'none';
                }
                
                this.updateSyntaxPreview();
            });
            
            // Trigger change to set initial state
            actionSelect.dispatchEvent(new Event('change'));
        }
        
        if (paramInput) {
            paramInput.addEventListener('input', () => this.updateSyntaxPreview());
        }
        
        // Save button
        modal.querySelector('.btn-save-condition')?.addEventListener('click', () => {
            this.saveCondition();
        });
        
        // Cancel button
        modal.querySelector('.btn-cancel-condition')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    updateSyntaxPreview() {
        const preview = this.container.querySelector('#syntaxPreview');
        if (!preview || !this.currentCondition) return;
        
        const syntax = this.generateCurrentSyntax();
        preview.textContent = `- ${syntax}`;
        
        // Update overall validation status
        this.updateValidationSummary();
    }
    
    generateCurrentSyntax() {
        if (!this.currentCondition) return '';
        
        const modal = this.container.querySelector('#conditionEditModal');
        if (!modal) return '';
        
        let syntax = this.currentCondition.id;
        
        // Collect attribute values
        const attributes = [];
        modal.querySelectorAll('.attr-input').forEach(input => {
            const attrName = input.dataset.attr;
            const value = input.value.trim();
            
            if (value) {
                // Find the attribute definition to get preferred alias
                const attrDef = this.currentCondition.attributes?.find(a => a.name === attrName);
                const key = (attrDef?.aliases && attrDef.aliases.length > 0) ? attrDef.aliases[0] : attrName;
                attributes.push(`${key}=${value}`);
            }
        });
        
        if (attributes.length > 0) {
            syntax += `{${attributes.join(';')}}`;
        }
        
        // Add action
        const actionSelect = modal.querySelector('#conditionAction');
        const actionParam = modal.querySelector('#actionParameter');
        
        if (actionSelect) {
            const action = actionSelect.value;
            
            if (action === 'power' || action === 'cast' || action === 'castinstead' || action === 'orelsecast') {
                const param = actionParam?.value.trim() || '';
                if (param) {
                    syntax += ` ${action} ${param}`;
                } else {
                    syntax += ` ${action}`;
                }
            } else {
                syntax += ` ${action}`;
            }
        }
        
        return syntax;
    }
    
    saveCondition() {
        if (!this.currentCondition) return;
        
        const modal = this.container.querySelector('#conditionEditModal');
        if (!modal) return;
        
        // Collect all data
        const conditionData = {
            condition: this.currentCondition,
            attributes: {},
            syntax: this.generateCurrentSyntax()
        };
        
        // Collect attribute values
        modal.querySelectorAll('.attr-input').forEach(input => {
            const attrName = input.dataset.attr;
            const value = input.value.trim();
            if (value) {
                conditionData.attributes[attrName] = value;
            }
        });
        
        // Get action
        const actionSelect = modal.querySelector('#conditionAction');
        const actionParam = modal.querySelector('#actionParameter');
        
        if (actionSelect) {
            const action = actionSelect.value;
            
            if (action === 'power' || action === 'cast' || action === 'castinstead' || action === 'orelsecast') {
                const param = actionParam?.value.trim() || '';
                conditionData.action = param ? `${action} ${param}` : action;
            } else {
                conditionData.action = action;
            }
        }
        
        // Validate required attributes
        const validation = window.ConditionHelpers.validate(this.currentCondition, conditionData.attributes);
        if (!validation.isValid) {
            alert('Please fill in all required attributes:\n' + validation.errors.join('\n'));
            return;
        }
        
        // Add or update condition
        if (this.currentEditIndex !== null) {
            this.options.conditions[this.currentEditIndex] = conditionData;
        } else {
            this.options.conditions.push(conditionData);
        }
        
        // Notify change
        this.options.onChange(this.options.conditions);
        
        // Close modal and refresh
        modal.style.display = 'none';
        this.refreshConditionList();
    }
    
    editCondition(index) {
        const condition = this.options.conditions[index];
        if (condition && condition.condition) {
            this.showConditionEditor(condition.condition, index);
        }
    }
    
    deleteCondition(index) {
        if (confirm('Are you sure you want to delete this condition?')) {
            this.options.conditions.splice(index, 1);
            this.options.onChange(this.options.conditions);
            this.refreshConditionList();
        }
    }
    
    moveCondition(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.options.conditions.length) return;
        
        const [condition] = this.options.conditions.splice(fromIndex, 1);
        this.options.conditions.splice(toIndex, 0, condition);
        
        this.options.onChange(this.options.conditions);
        this.refreshConditionList();
    }
    
    refreshConditionList() {
        const listContainer = this.container.querySelector('.condition-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderConditionList();
        }
    }
    
    formatConditionSyntax(cond) {
        return cond.syntax || `${cond.condition?.id || 'unknown'} ${cond.action || 'true'}`;
    }
    
    getConditions() {
        return this.options.conditions;
    }
    
    setConditions(conditions) {
        this.options.conditions = conditions;
        this.refreshConditionList();
    }

    /**
     * Validate a single attribute field and show inline feedback
     */
    validateAttributeField(input) {
        const attrName = input.dataset.attr;
        const formGroup = input.closest('.form-group');
        const feedbackDiv = formGroup?.querySelector('.validation-feedback');
        
        if (!this.currentCondition || !feedbackDiv) return;
        
        // Find attribute definition
        const attrDef = this.currentCondition.attributes?.find(a => a.name === attrName);
        if (!attrDef) return;
        
        const value = input.value.trim();
        
        // Clear previous state
        input.classList.remove('is-invalid', 'is-warning', 'is-valid');
        feedbackDiv.innerHTML = '';
        feedbackDiv.className = 'validation-feedback';
        
        // Required field check
        if (attrDef.required && !value) {
            input.classList.add('is-invalid');
            feedbackDiv.className = 'validation-feedback invalid-feedback';
            feedbackDiv.textContent = `${attrDef.displayName || attrName} is required`;
            return;
        }
        
        // Skip further validation if empty and not required
        if (!value) {
            return;
        }
        
        // Validate using ConditionHelpers
        const validation = window.ConditionHelpers.validateAttributeValue(attrDef, value);
        
        if (!validation.isValid) {
            input.classList.add('is-invalid');
            feedbackDiv.className = 'validation-feedback invalid-feedback';
            feedbackDiv.innerHTML = validation.errors.map(err => `<div>⚠️ ${err}</div>`).join('');
        } else if (validation.warnings && validation.warnings.length > 0) {
            input.classList.add('is-warning');
            feedbackDiv.className = 'validation-feedback warning-feedback';
            feedbackDiv.innerHTML = validation.warnings.map(warn => `<div>⚡ ${warn}</div>`).join('');
        } else {
            input.classList.add('is-valid');
        }
    }

    /**
     * Update validation summary for all fields
     */
    updateValidationSummary() {
        const modal = this.container.querySelector('#conditionEditModal');
        if (!modal || !this.currentCondition) return;
        
        // Collect all attribute values
        const values = {};
        modal.querySelectorAll('.attr-input').forEach(input => {
            const attrName = input.dataset.attr;
            values[attrName] = input.value.trim();
        });
        
        // Validate all
        const validation = window.ConditionHelpers.validate(this.currentCondition, values);
        
        // Update save button state
        const saveBtn = modal.querySelector('.btn-primary');
        if (saveBtn) {
            if (!validation.isValid) {
                saveBtn.disabled = true;
                saveBtn.title = 'Please fix validation errors before saving';
            } else {
                saveBtn.disabled = false;
                saveBtn.title = '';
            }
        }
    }
}

// Export for global use
window.ConditionEditor = ConditionEditor;
console.log('✅ ConditionEditor component loaded');
