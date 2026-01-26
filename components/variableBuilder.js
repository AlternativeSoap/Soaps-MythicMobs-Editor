/**
 * Variable Builder - Guided wizard for creating MythicMobs variables
 * Provides type-aware value builders, scope selection, and live YAML preview
 * Part of Phase 4 of the Variable System Implementation
 */

const VariableBuilder = {
    // State
    currentVariable: null,
    isOpen: false,
    mode: 'create', // 'create' or 'edit'
    callbacks: {
        onSave: null,
        onCancel: null
    },
    
    // Modal elements
    modal: null,
    overlay: null,
    
    /**
     * Initialize the variable builder
     */
    init() {
        this.createModal();
        this.attachGlobalListeners();
    },
    
    /**
     * Create the modal structure
     */
    createModal() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'variable-builder-overlay';
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'variable-builder-modal';
        this.modal.innerHTML = this.getModalHTML();
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        
        // Attach event listeners
        this.attachEventListeners();
    },
    
    /**
     * Common variable templates for quick setup
     */
    commonTemplates: [
        { 
            name: 'Damage Counter', 
            icon: 'fa-crosshairs', 
            color: '#ef4444',
            config: { name: 'damage_dealt', scope: 'CASTER', type: 'FLOAT', value: '0', save: false, duration: 0 },
            description: 'Tracks total damage dealt by a mob'
        },
        { 
            name: 'Boss Phase', 
            icon: 'fa-skull', 
            color: '#8b5cf6',
            config: { name: 'current_phase', scope: 'CASTER', type: 'INTEGER', value: '1', save: false, duration: 0 },
            description: 'Track boss phases (1, 2, 3, etc.)'
        },
        { 
            name: 'Hit Counter', 
            icon: 'fa-bullseye', 
            color: '#f59e0b',
            config: { name: 'hit_count', scope: 'CASTER', type: 'INTEGER', value: '0', save: false, duration: 0 },
            description: 'Count successful hits or combo stacks'
        },
        { 
            name: 'Target Marker', 
            icon: 'fa-location-dot', 
            color: '#ec4899',
            config: { name: 'marked', scope: 'TARGET', type: 'BOOLEAN', value: 'true', save: false, duration: 0 },
            description: 'Mark targets for special effects'
        },
        { 
            name: 'Spawn Location', 
            icon: 'fa-map-pin', 
            color: '#10b981',
            config: { name: 'spawn_loc', scope: 'CASTER', type: 'LOCATION', value: '<caster.location>', save: true, duration: 0 },
            description: 'Save spawn point for return mechanics'
        },
        { 
            name: 'Cooldown Timer', 
            icon: 'fa-hourglass-half', 
            color: '#06b6d4',
            config: { name: 'ability_cd', scope: 'CASTER', type: 'TIME', value: '<time.epoch>', save: false, duration: 0 },
            description: 'Track ability cooldowns with epoch time'
        },
        { 
            name: 'Enrage Flag', 
            icon: 'fa-fire', 
            color: '#dc2626',
            config: { name: 'is_enraged', scope: 'CASTER', type: 'BOOLEAN', value: 'false', save: false, duration: 0 },
            description: 'Toggle for enrage/berserk states'
        },
        { 
            name: 'Loop Counter', 
            icon: 'fa-sync', 
            color: '#3b82f6',
            config: { name: 'loop_i', scope: 'SKILL', type: 'INTEGER', value: '0', save: false, duration: 0 },
            description: 'Temporary counter for skill loops'
        }
    ],
    
    /**
     * Get the modal HTML structure
     */
    getModalHTML() {
        return `
            <div class="variable-builder-header">
                <h2><i class="fas fa-wand-magic-sparkles"></i> <span class="builder-title">Create Variable</span></h2>
                <button class="variable-builder-close" title="Close (Esc)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="variable-builder-body">
                <!-- Left Side: Configuration -->
                <div class="variable-builder-config">
                    <!-- Quick Start Section - Collapsible -->
                    <div class="builder-section collapsible" data-section="templates">
                        <div class="builder-section-header" role="button" aria-expanded="true">
                            <div class="header-left">
                                <i class="fas fa-bolt section-icon"></i>
                                <h3>Quick Start</h3>
                                <span class="badge badge-purple">Templates</span>
                            </div>
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </div>
                        <div class="builder-section-content">
                            <p class="section-hint">Click a template to auto-fill the form</p>
                            <div class="quick-templates-grid" id="quick-templates-grid">
                                ${this.renderQuickTemplates()}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Essentials Group -->
                    <div class="section-group">
                        <div class="section-group-label">
                            <i class="fas fa-asterisk"></i> Required Fields
                        </div>
                        
                        <!-- Variable Name - Always Visible -->
                        <div class="builder-section essential">
                            <div class="builder-section-header compact">
                                <div class="header-left">
                                    <span class="step-badge">1</span>
                                    <h3>Name</h3>
                                </div>
                            </div>
                            <div class="builder-section-content">
                                <div class="input-with-validation">
                                    <div class="input-wrapper">
                                        <i class="fas fa-tag input-icon"></i>
                                        <input type="text" 
                                               id="variable-name-input" 
                                               class="variable-name-input" 
                                               placeholder="my_variable_name"
                                               autocomplete="off"
                                               spellcheck="false">
                                    </div>
                                    <div class="validation-feedback" id="name-validation"></div>
                                </div>
                                <div class="naming-tips">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Use lowercase letters and underscores (e.g., <code>hit_counter</code>, <code>is_active</code>)</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Scope Selection - Compact -->
                        <div class="builder-section essential collapsible expanded" data-section="scope">
                            <div class="builder-section-header compact" role="button" aria-expanded="true">
                                <div class="header-left">
                                    <span class="step-badge">2</span>
                                    <h3>Scope</h3>
                                    <span class="current-value" id="current-scope-display">CASTER</span>
                                </div>
                                <i class="fas fa-chevron-down collapse-icon"></i>
                            </div>
                            <div class="builder-section-content">
                                <div class="scope-selector compact-grid" id="scope-selector">
                                    ${this.renderScopeOptions()}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Type Selection - Compact -->
                        <div class="builder-section essential collapsible expanded" data-section="type">
                            <div class="builder-section-header compact" role="button" aria-expanded="true">
                                <div class="header-left">
                                    <span class="step-badge">3</span>
                                    <h3>Type</h3>
                                    <span class="current-value" id="current-type-display">INTEGER</span>
                                </div>
                                <i class="fas fa-chevron-down collapse-icon"></i>
                            </div>
                            <div class="builder-section-content">
                                <div class="type-selector" id="type-selector">
                                    ${this.renderTypeOptions()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Value Section -->
                    <div class="section-group">
                        <div class="section-group-label">
                            <i class="fas fa-edit"></i> Value Configuration
                        </div>
                        
                        <div class="builder-section collapsible expanded" data-section="value">
                            <div class="builder-section-header compact" role="button" aria-expanded="true">
                                <div class="header-left">
                                    <span class="step-badge">4</span>
                                    <h3>Initial Value</h3>
                                    <span class="type-indicator" id="current-type-badge"></span>
                                </div>
                                <i class="fas fa-chevron-down collapse-icon"></i>
                            </div>
                            <div class="builder-section-content">
                                <div id="value-builder-container" class="value-builder-container">
                                    <!-- Dynamic content based on type -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Advanced Options - Collapsible -->
                    <div class="section-group">
                        <div class="section-group-label">
                            <i class="fas fa-sliders-h"></i> Advanced Options
                        </div>
                        
                        <div class="builder-section collapsible" data-section="options">
                            <div class="builder-section-header compact" role="button" aria-expanded="false">
                                <div class="header-left">
                                    <span class="step-badge optional">5</span>
                                    <h3>Persistence & Duration</h3>
                                </div>
                                <i class="fas fa-chevron-down collapse-icon"></i>
                            </div>
                            <div class="builder-section-content">
                                <div class="options-grid">
                                    <label class="option-card">
                                        <div class="option-card-header">
                                            <input type="checkbox" id="option-save" class="option-checkbox">
                                            <div class="option-icon">
                                                <i class="fas fa-database"></i>
                                            </div>
                                            <div class="option-info">
                                                <span class="option-title">Save to File</span>
                                                <span class="option-desc">Persists through server restarts</span>
                                            </div>
                                        </div>
                                    </label>
                                    
                                    <div class="option-card">
                                        <div class="option-card-header">
                                            <div class="option-icon">
                                                <i class="fas fa-hourglass-half"></i>
                                            </div>
                                            <div class="option-info">
                                                <span class="option-title">Duration (ticks)</span>
                                                <span class="option-desc">Auto-expire after X ticks</span>
                                            </div>
                                        </div>
                                        <div class="option-input-row">
                                            <input type="number" 
                                                   id="option-duration" 
                                                   value="0" 
                                                   min="0" 
                                                   placeholder="0">
                                            <span class="input-suffix">0 = permanent</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Side: Preview -->
                <div class="variable-builder-preview">
                    <div class="preview-header">
                        <h3><i class="fas fa-code"></i> Live Preview</h3>
                        <button class="copy-preview-btn" title="Copy to clipboard">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    
                    <div class="preview-tabs">
                        <button class="preview-tab active" data-tab="mechanic">
                            <i class="fas fa-cog"></i> Set Mechanic
                        </button>
                        <button class="preview-tab" data-tab="placeholder">
                            <i class="fas fa-code"></i> Placeholder
                        </button>
                        <button class="preview-tab" data-tab="condition">
                            <i class="fas fa-question-circle"></i> Condition
                        </button>
                    </div>
                    
                    <div class="preview-content" id="preview-content">
                        <pre><code id="preview-code"></code></pre>
                    </div>
                    
                    <div class="preview-explanation" id="preview-explanation">
                        <!-- Dynamic explanation of the generated code -->
                    </div>
                    
                    <div class="quick-reference collapsible" data-section="reference">
                        <div class="reference-header" role="button" aria-expanded="false">
                            <h4><i class="fas fa-book"></i> Quick Reference</h4>
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </div>
                        <div class="reference-content" id="reference-content">
                            <!-- Type-specific reference -->
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="variable-builder-footer">
                <div class="footer-left">
                    <button class="btn-secondary" id="btn-cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
                <div class="footer-right">
                    <button class="btn-ghost" id="btn-save-template" title="Save current config as a reusable template">
                        <i class="fas fa-star"></i> Save Template
                    </button>
                    <button class="btn-primary" id="btn-insert">
                        <i class="fas fa-plus"></i> Create & Insert
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Render quick templates grid
     */
    renderQuickTemplates() {
        return this.commonTemplates.map((template, index) => `
            <button type="button" 
                    class="quick-template-btn" 
                    data-template-index="${index}"
                    title="${template.description}">
                <i class="fas ${template.icon}" style="color: ${template.color}"></i>
                <span>${template.name}</span>
            </button>
        `).join('');
    },
    
    /**
     * Apply a quick template
     * @param {number} index - Template index
     */
    applyQuickTemplate(index) {
        const template = this.commonTemplates[index];
        if (!template) return;
        
        // Apply template configuration
        this.currentVariable = { ...template.config };
        
        // Update UI
        this.modal.querySelector('#variable-name-input').value = this.currentVariable.name;
        this.selectScope(this.currentVariable.scope, false);
        this.selectType(this.currentVariable.type, false);
        
        // Set options
        this.modal.querySelector('#option-save').checked = this.currentVariable.save;
        this.modal.querySelector('#option-duration').value = this.currentVariable.duration;
        
        // Update preview
        this.updatePreview();
        
        // Visual feedback
        const btn = this.modal.querySelector(`[data-template-index="${index}"]`);
        if (btn) {
            btn.classList.add('applied');
            setTimeout(() => btn.classList.remove('applied'), 500);
        }
        
        // Toast notification
        if (typeof NotificationModal !== 'undefined') {
            NotificationModal.show(`"${template.name}" template loaded!`, 'success', 1500);
        }
    },
    
    /**
     * Render scope selection options
     */
    renderScopeOptions() {
        if (typeof VARIABLE_SCOPES === 'undefined') {
            console.warn('VARIABLE_SCOPES not loaded');
            return '<p class="error">Variable data not loaded</p>';
        }
        
        return VARIABLE_SCOPES.map(scope => {
            // Convert boolean persistent to display string
            const persistenceLabel = scope.persistent ? 'Persistent' : 'Temporary';
            const persistenceClass = scope.persistent ? 'persistent' : 'temporary';
            
            return `
            <div class="scope-option ${scope.id === 'CASTER' ? 'selected' : ''}" 
                 data-scope="${scope.id}">
                <div class="scope-icon" style="color: ${scope.color}">
                    <i class="fas ${scope.icon}"></i>
                </div>
                <div class="scope-info">
                    <span class="scope-name">${scope.name}</span>
                    <span class="scope-description">${scope.description}</span>
                </div>
                <div class="scope-persistence">
                    <span class="persistence-badge ${persistenceClass}">
                        ${persistenceLabel}
                    </span>
                </div>
            </div>
        `;
        }).join('');
    },
    
    /**
     * Render type selection options
     */
    renderTypeOptions() {
        if (typeof VARIABLE_TYPES === 'undefined') {
            console.warn('VARIABLE_TYPES not loaded');
            return '<p class="error">Variable data not loaded</p>';
        }
        
        // Group types by category
        const categories = {
            'Numbers': ['INTEGER', 'FLOAT', 'LONG', 'DOUBLE'],
            'Text & Logic': ['STRING', 'BOOLEAN'],
            'Collections': ['SET', 'LIST', 'MAP'],
            'Spatial': ['LOCATION', 'VECTOR'],
            'Advanced': ['TIME', 'METASKILL', 'ITEM']
        };
        
        let html = '';
        for (const [category, typeIds] of Object.entries(categories)) {
            html += `<div class="type-category">
                <span class="category-label">${category}</span>
                <div class="type-options">`;
            
            for (const typeId of typeIds) {
                const type = VARIABLE_TYPES.find(t => t.id === typeId);
                if (!type) continue;
                
                html += `
                    <div class="type-option ${typeId === 'INTEGER' ? 'selected' : ''}" 
                         data-type="${type.id}" 
                         title="${type.description}">
                        <div class="type-icon" style="color: ${type.color}">
                            <i class="fas ${type.icon}"></i>
                        </div>
                        <span class="type-name">${type.name}</span>
                    </div>
                `;
            }
            
            html += '</div></div>';
        }
        
        return html;
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        this.modal.querySelector('.variable-builder-close').addEventListener('click', () => this.close());
        
        // Collapsible sections
        this.modal.querySelectorAll('.builder-section.collapsible .builder-section-header').forEach(header => {
            header.addEventListener('click', () => this.toggleSection(header.parentElement));
        });
        
        // Quick reference collapsible
        const refHeader = this.modal.querySelector('.quick-reference .reference-header');
        if (refHeader) {
            refHeader.addEventListener('click', () => {
                const container = refHeader.closest('.quick-reference');
                container.classList.toggle('expanded');
            });
        }
        
        // Name input
        const nameInput = this.modal.querySelector('#variable-name-input');
        nameInput.addEventListener('input', (e) => this.handleNameChange(e.target.value));
        nameInput.addEventListener('blur', (e) => this.validateName(e.target.value));
        
        // Quick templates
        this.modal.querySelectorAll('.quick-template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.templateIndex);
                this.applyQuickTemplate(index);
            });
        });
        
        // Scope selection
        this.modal.querySelectorAll('.scope-option').forEach(option => {
            option.addEventListener('click', () => this.selectScope(option.dataset.scope));
        });
        
        // Type selection
        this.modal.querySelectorAll('.type-option').forEach(option => {
            option.addEventListener('click', () => this.selectType(option.dataset.type));
        });
        
        // Options
        this.modal.querySelector('#option-save').addEventListener('change', () => this.updatePreview());
        this.modal.querySelector('#option-duration').addEventListener('input', () => this.updatePreview());
        
        // Preview tabs
        this.modal.querySelectorAll('.preview-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPreviewTab(tab.dataset.tab));
        });
        
        // Copy button
        this.modal.querySelector('.copy-preview-btn').addEventListener('click', () => this.copyPreview());
        
        // Footer buttons
        this.modal.querySelector('#btn-cancel').addEventListener('click', () => this.close());
        this.modal.querySelector('#btn-save-template').addEventListener('click', () => this.saveAsTemplate());
        this.modal.querySelector('#btn-insert').addEventListener('click', () => this.insertVariable());
    },
    
    /**
     * Toggle section collapse/expand
     * @param {HTMLElement} section - The section element to toggle
     */
    toggleSection(section) {
        const isExpanded = section.classList.contains('expanded');
        section.classList.toggle('expanded', !isExpanded);
        
        const header = section.querySelector('.builder-section-header');
        if (header) {
            header.setAttribute('aria-expanded', !isExpanded);
        }
    },
    
    /**
     * Attach global listeners
     */
    attachGlobalListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            if (e.key === 'Escape') {
                this.close();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.insertVariable();
            }
        });
    },
    
    /**
     * Open the builder in create mode
     * @param {Object} options - Configuration options
     * @param {number} options.parentZIndex - Z-index of parent modal (to ensure this opens above)
     */
    open(options = {}) {
        // Ensure modal is created
        if (!this.modal || !this.overlay) {
            console.warn('VariableBuilder: Modal not initialized, calling init()');
            this.init();
        }
        
        // Verify modal was created successfully
        if (!this.modal) {
            console.error('VariableBuilder: Failed to create modal');
            return;
        }
        
        this.mode = options.mode || 'create';
        this.callbacks.onSave = options.onSave || null;
        this.callbacks.onCancel = options.onCancel || null;
        
        // Handle z-index to ensure modal appears above parent
        if (options.parentZIndex) {
            this.overlay.style.zIndex = options.parentZIndex + 100;
        } else {
            this.overlay.style.zIndex = '10200';
        }
        
        // Reset state
        this.currentVariable = {
            name: options.name || '',
            scope: options.scope || 'CASTER',
            type: options.type || 'INTEGER',
            value: options.value || '',
            save: options.save || false,
            duration: options.duration || 0
        };
        
        // Update UI
        this.modal.querySelector('.builder-title').textContent = 
            this.mode === 'edit' ? 'Edit Variable' : 'Create Variable';
        
        this.modal.querySelector('#variable-name-input').value = this.currentVariable.name;
        
        // Select initial scope and type
        this.selectScope(this.currentVariable.scope, false);
        this.selectType(this.currentVariable.type, false);
        
        // Set options
        this.modal.querySelector('#option-save').checked = this.currentVariable.save;
        this.modal.querySelector('#option-duration').value = this.currentVariable.duration;
        
        // Show modal
        this.overlay.classList.add('visible');
        this.isOpen = true;
        
        // Focus name input
        setTimeout(() => {
            this.modal.querySelector('#variable-name-input').focus();
        }, 100);
        
        // Update preview
        this.updatePreview();
    },
    
    /**
     * Close the builder
     */
    close() {
        this.overlay.classList.remove('visible');
        this.isOpen = false;
        
        if (this.callbacks.onCancel) {
            this.callbacks.onCancel();
        }
    },
    
    /**
     * Handle name input change
     * @param {string} name - Variable name
     */
    handleNameChange(name) {
        this.currentVariable.name = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        this.modal.querySelector('#variable-name-input').value = this.currentVariable.name;
        this.updatePreview();
    },
    
    /**
     * Validate variable name
     * @param {string} name - Variable name
     */
    validateName(name) {
        const feedback = this.modal.querySelector('#name-validation');
        
        if (!name) {
            feedback.innerHTML = '<span class="warning"><i class="fas fa-exclamation-triangle"></i> Name required</span>';
            return false;
        }
        
        if (!/^[a-z][a-z0-9_]*$/i.test(name)) {
            feedback.innerHTML = '<span class="error"><i class="fas fa-times-circle"></i> Must start with letter, use only letters/numbers/underscores</span>';
            return false;
        }
        
        if (name.length < 2) {
            feedback.innerHTML = '<span class="warning"><i class="fas fa-exclamation-triangle"></i> Name too short</span>';
            return false;
        }
        
        // Check for existing variable
        if (typeof VariableManager !== 'undefined' && this.mode === 'create') {
            const existing = VariableManager.getByName(name);
            if (existing) {
                feedback.innerHTML = `<span class="info"><i class="fas fa-info-circle"></i> Variable exists in ${existing.scope} scope</span>`;
                return true;
            }
        }
        
        feedback.innerHTML = '<span class="success"><i class="fas fa-check-circle"></i> Valid name</span>';
        return true;
    },
    
    /**
     * Select a scope
     * @param {string} scopeId - Scope ID
     * @param {boolean} updatePreview - Whether to update preview
     */
    selectScope(scopeId, updatePreview = true) {
        this.currentVariable.scope = scopeId;
        
        // Update UI
        this.modal.querySelectorAll('.scope-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.scope === scopeId);
        });
        
        // Update current value display
        const scopeDisplay = this.modal.querySelector('#current-scope-display');
        if (scopeDisplay) {
            scopeDisplay.textContent = scopeId;
        }
        
        if (updatePreview) {
            this.updatePreview();
        }
    },
    
    /**
     * Select a type
     * @param {string} typeId - Type ID
     * @param {boolean} updatePreview - Whether to update preview
     */
    selectType(typeId, updatePreview = true) {
        this.currentVariable.type = typeId;
        
        // Update UI
        this.modal.querySelectorAll('.type-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.type === typeId);
        });
        
        // Update type badge in header
        const type = VARIABLE_TYPES.find(t => t.id === typeId);
        if (type) {
            const typeBadge = this.modal.querySelector('#current-type-badge');
            if (typeBadge) {
                typeBadge.innerHTML = `<i class="fas ${type.icon}" style="color: ${type.color}"></i> ${type.name}`;
            }
            
            // Update current value display
            const typeDisplay = this.modal.querySelector('#current-type-display');
            if (typeDisplay) {
                typeDisplay.textContent = type.name;
            }
        }
        
        // Update value builder
        this.renderValueBuilder(typeId);
        
        // Update reference
        this.renderQuickReference(typeId);
        
        if (updatePreview) {
            this.updatePreview();
        }
    },
    
    /**
     * Render the value builder based on type
     * @param {string} typeId - Type ID
     */
    renderValueBuilder(typeId) {
        const container = this.modal.querySelector('#value-builder-container');
        const type = VARIABLE_TYPES.find(t => t.id === typeId);
        
        if (!type) {
            container.innerHTML = '<p class="error">Unknown type</p>';
            return;
        }
        
        // Type-specific builders
        const builders = {
            INTEGER: this.buildNumberInput.bind(this, 'integer', 1),
            FLOAT: this.buildNumberInput.bind(this, 'float', 0.1),
            LONG: this.buildNumberInput.bind(this, 'long', 1),
            DOUBLE: this.buildNumberInput.bind(this, 'double', 0.001),
            STRING: this.buildStringInput.bind(this),
            BOOLEAN: this.buildBooleanInput.bind(this),
            SET: this.buildCollectionInput.bind(this, 'set'),
            LIST: this.buildCollectionInput.bind(this, 'list'),
            MAP: this.buildMapInput.bind(this),
            LOCATION: this.buildLocationInput.bind(this),
            VECTOR: this.buildVectorInput.bind(this),
            TIME: this.buildTimeInput.bind(this),
            METASKILL: this.buildMetaskillInput.bind(this),
            ITEM: this.buildItemInput.bind(this)
        };
        
        const builder = builders[typeId];
        if (builder) {
            container.innerHTML = builder(type);
            this.attachValueBuilderListeners(typeId);
        }
    },
    
    /**
     * Build number input (INTEGER, FLOAT, LONG, DOUBLE)
     */
    buildNumberInput(numberType, step, type) {
        const examples = type.examples.slice(0, 3).join(', ');
        return `
            <div class="value-builder number-builder">
                <div class="number-input-group">
                    <input type="number" 
                           id="value-number" 
                           class="value-input-large"
                           value="${this.currentVariable.value || type.defaultValue}"
                           step="${step}"
                           placeholder="${type.defaultValue}">
                    <div class="number-quick-buttons">
                        <button type="button" class="quick-num" data-value="-10">-10</button>
                        <button type="button" class="quick-num" data-value="-1">-1</button>
                        <button type="button" class="quick-num" data-value="0">0</button>
                        <button type="button" class="quick-num" data-value="1">+1</button>
                        <button type="button" class="quick-num" data-value="10">+10</button>
                    </div>
                </div>
                <div class="value-helpers">
                    <span class="helper-label">Or use placeholder:</span>
                    <div class="placeholder-chips">
                        <button type="button" class="chip" data-value="<random.1to10>">Random 1-10</button>
                        <button type="button" class="chip" data-value="<caster.hp>">Caster HP</button>
                        <button type="button" class="chip" data-value="<caster.level>">Caster Level</button>
                    </div>
                </div>
                <p class="value-hint"><i class="fas fa-lightbulb"></i> Examples: ${examples}</p>
            </div>
        `;
    },
    
    /**
     * Build string input
     */
    buildStringInput(type) {
        return `
            <div class="value-builder string-builder">
                <input type="text" 
                       id="value-string" 
                       class="value-input-large"
                       value="${this.currentVariable.value || ''}"
                       placeholder="Enter text value">
                <div class="string-preview">
                    <span class="preview-label">Preview:</span>
                    <span class="string-preview-value" id="string-preview">${this.currentVariable.value || 'Your text here'}</span>
                </div>
                <div class="value-helpers">
                    <span class="helper-label">Common values:</span>
                    <div class="placeholder-chips">
                        <button type="button" class="chip" data-value="phase1">phase1</button>
                        <button type="button" class="chip" data-value="idle">idle</button>
                        <button type="button" class="chip" data-value="<caster.name>">Caster Name</button>
                        <button type="button" class="chip" data-value="<target.name>">Target Name</button>
                    </div>
                </div>
                <div class="color-code-helper">
                    <span class="helper-label"><i class="fas fa-palette"></i> Color codes:</span>
                    <div class="color-chips">
                        <button type="button" class="color-chip" data-value="&c" style="color: #FF5555" title="Red">&c</button>
                        <button type="button" class="color-chip" data-value="&a" style="color: #55FF55" title="Green">&a</button>
                        <button type="button" class="color-chip" data-value="&b" style="color: #55FFFF" title="Aqua">&b</button>
                        <button type="button" class="color-chip" data-value="&e" style="color: #FFFF55" title="Yellow">&e</button>
                        <button type="button" class="color-chip" data-value="&6" style="color: #FFAA00" title="Gold">&6</button>
                        <button type="button" class="color-chip" data-value="&d" style="color: #FF55FF" title="Light Purple">&d</button>
                        <button type="button" class="color-chip" data-value="&f" style="color: #FFFFFF" title="White">&f</button>
                        <button type="button" class="color-chip" data-value="&l" style="font-weight: bold" title="Bold">&l</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Build boolean input
     */
    buildBooleanInput(type) {
        const currentValue = this.currentVariable.value === 'true' || this.currentVariable.value === true;
        return `
            <div class="value-builder boolean-builder">
                <div class="boolean-toggle-group">
                    <button type="button" class="boolean-option ${currentValue ? 'selected' : ''}" data-value="true">
                        <i class="fas fa-check-circle"></i>
                        <span>TRUE</span>
                    </button>
                    <button type="button" class="boolean-option ${!currentValue ? 'selected' : ''}" data-value="false">
                        <i class="fas fa-times-circle"></i>
                        <span>FALSE</span>
                    </button>
                </div>
                <div class="boolean-use-cases">
                    <span class="helper-label">Common use cases:</span>
                    <ul>
                        <li><code>is_enraged</code> - Track boss phases</li>
                        <li><code>has_been_hit</code> - One-time triggers</li>
                        <li><code>shield_active</code> - Toggle mechanics</li>
                    </ul>
                </div>
            </div>
        `;
    },
    
    /**
     * Build collection input (SET, LIST)
     */
    buildCollectionInput(collectionType, type) {
        return `
            <div class="value-builder collection-builder">
                <div class="collection-info">
                    <i class="fas fa-info-circle"></i>
                    <span>${collectionType === 'set' ? 'Sets store unique values only' : 'Lists preserve order and allow duplicates'}</span>
                </div>
                <div class="collection-items" id="collection-items">
                    <!-- Dynamic items -->
                </div>
                <div class="collection-add-row">
                    <input type="text" 
                           id="collection-new-item" 
                           placeholder="Add item..."
                           class="collection-input">
                    <button type="button" id="add-collection-item" class="btn-add-item">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="collection-presets">
                    <span class="helper-label">Quick presets:</span>
                    <div class="preset-chips">
                        <button type="button" class="chip preset-chip" data-preset="phases">Boss Phases</button>
                        <button type="button" class="chip preset-chip" data-preset="targets">Target IDs</button>
                        <button type="button" class="chip preset-chip" data-preset="abilities">Ability Names</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Build map input
     */
    buildMapInput(type) {
        return `
            <div class="value-builder map-builder">
                <div class="map-info">
                    <i class="fas fa-info-circle"></i>
                    <span>Maps store key-value pairs for lookup tables</span>
                </div>
                <div class="map-entries" id="map-entries">
                    <!-- Dynamic entries -->
                </div>
                <div class="map-add-row">
                    <input type="text" id="map-new-key" placeholder="Key" class="map-key-input">
                    <span class="map-separator">:</span>
                    <input type="text" id="map-new-value" placeholder="Value" class="map-value-input">
                    <button type="button" id="add-map-entry" class="btn-add-item">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="map-presets">
                    <span class="helper-label">Quick presets:</span>
                    <div class="preset-chips">
                        <button type="button" class="chip preset-chip" data-preset="config">Config</button>
                        <button type="button" class="chip preset-chip" data-preset="stats">Stats</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Build location input
     */
    buildLocationInput(type) {
        return `
            <div class="value-builder location-builder">
                <div class="location-method-tabs">
                    <button type="button" class="method-tab active" data-method="coords">Coordinates</button>
                    <button type="button" class="method-tab" data-method="placeholder">Placeholder</button>
                    <button type="button" class="method-tab" data-method="relative">Relative</button>
                </div>
                
                <div class="location-method-content" id="location-content">
                    <div class="location-coords">
                        <div class="coord-inputs">
                            <div class="coord-group">
                                <label>World</label>
                                <input type="text" id="loc-world" placeholder="world" value="world">
                            </div>
                            <div class="coord-group">
                                <label>X</label>
                                <input type="number" id="loc-x" placeholder="0" step="0.1" value="0">
                            </div>
                            <div class="coord-group">
                                <label>Y</label>
                                <input type="number" id="loc-y" placeholder="64" step="0.1" value="64">
                            </div>
                            <div class="coord-group">
                                <label>Z</label>
                                <input type="number" id="loc-z" placeholder="0" step="0.1" value="0">
                            </div>
                        </div>
                        <div class="coord-optional">
                            <div class="coord-group">
                                <label>Yaw</label>
                                <input type="number" id="loc-yaw" placeholder="0" step="1" value="0">
                            </div>
                            <div class="coord-group">
                                <label>Pitch</label>
                                <input type="number" id="loc-pitch" placeholder="0" step="1" value="0">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="location-presets">
                    <span class="helper-label">Quick placeholders:</span>
                    <div class="placeholder-chips">
                        <button type="button" class="chip" data-value="<caster.location>">Caster Location</button>
                        <button type="button" class="chip" data-value="<target.location>">Target Location</button>
                        <button type="button" class="chip" data-value="<skill.targetlocation>">Skill Target</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Build vector input
     */
    buildVectorInput(type) {
        return `
            <div class="value-builder vector-builder">
                <div class="vector-visual">
                    <div class="vector-3d-preview" id="vector-preview">
                        <div class="vector-arrow" id="vector-arrow"></div>
                    </div>
                </div>
                <div class="vector-inputs">
                    <div class="vector-group">
                        <label style="color: #ef4444">X</label>
                        <input type="number" id="vec-x" step="0.1" value="0">
                    </div>
                    <div class="vector-group">
                        <label style="color: #22c55e">Y</label>
                        <input type="number" id="vec-y" step="0.1" value="1">
                    </div>
                    <div class="vector-group">
                        <label style="color: #3b82f6">Z</label>
                        <input type="number" id="vec-z" step="0.1" value="0">
                    </div>
                </div>
                <div class="vector-magnitude">
                    <span>Magnitude: <strong id="vec-magnitude">1.00</strong></span>
                    <button type="button" id="normalize-vector" class="btn-small">Normalize</button>
                </div>
                <div class="vector-presets">
                    <span class="helper-label">Presets:</span>
                    <div class="placeholder-chips">
                        <button type="button" class="chip" data-x="0" data-y="1" data-z="0">Up</button>
                        <button type="button" class="chip" data-x="0" data-y="-1" data-z="0">Down</button>
                        <button type="button" class="chip" data-x="1" data-y="0" data-z="0">East</button>
                        <button type="button" class="chip" data-x="0" data-y="0" data-z="1">South</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Build time input
     */
    buildTimeInput(type) {
        return `
            <div class="value-builder time-builder">
                <div class="time-input-group">
                    <label>Epoch Timestamp (ms)</label>
                    <input type="number" 
                           id="value-time" 
                           class="value-input-large"
                           value="${Date.now()}"
                           placeholder="Epoch timestamp">
                </div>
                <div class="time-helpers">
                    <button type="button" class="btn-time-now" id="set-time-now">
                        <i class="fas fa-clock"></i> Set to Now
                    </button>
                    <span class="time-preview" id="time-preview">
                        ${new Date().toLocaleString()}
                    </span>
                </div>
                <div class="time-placeholders">
                    <span class="helper-label">Or use placeholder:</span>
                    <div class="placeholder-chips">
                        <button type="button" class="chip" data-value="<server.time>">Server Time</button>
                        <button type="button" class="chip" data-value="<caster.var.last_cast>">Last Cast Time</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Build metaskill input
     */
    buildMetaskillInput(type) {
        return `
            <div class="value-builder metaskill-builder">
                <div class="metaskill-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>METASKILL variables store inline skill definitions. Use with care!</span>
                </div>
                <div class="metaskill-input-group">
                    <label>Skill Name or Inline Definition</label>
                    <textarea id="value-metaskill" 
                              class="metaskill-textarea"
                              rows="4"
                              placeholder="- message{m=Hello} @trigger"></textarea>
                </div>
                <div class="metaskill-examples">
                    <span class="helper-label">Examples:</span>
                    <div class="code-examples">
                        <code>StoredSkillName</code>
                        <code>- damage{a=10} @target</code>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Build item input
     */
    buildItemInput(type) {
        return `
            <div class="value-builder item-builder">
                <div class="item-input-group">
                    <label>Item ID or MythicMobs Item</label>
                    <input type="text" 
                           id="value-item" 
                           class="value-input-large"
                           placeholder="mythicmobs:ExampleSword or minecraft:diamond_sword">
                </div>
                <div class="item-helpers">
                    <span class="helper-label">Placeholders:</span>
                    <div class="placeholder-chips">
                        <button type="button" class="chip" data-value="<target.itemhand>">Target's Hand Item</button>
                        <button type="button" class="chip" data-value="<caster.itemoffhand>">Caster's Offhand</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Attach value builder listeners based on type
     */
    attachValueBuilderListeners(typeId) {
        const container = this.modal.querySelector('#value-builder-container');
        
        // Number input
        if (['INTEGER', 'FLOAT', 'LONG', 'DOUBLE'].includes(typeId)) {
            const numInput = container.querySelector('#value-number');
            if (numInput) {
                numInput.addEventListener('input', (e) => {
                    this.currentVariable.value = e.target.value;
                    this.updatePreview();
                });
            }
            
            // Quick number buttons
            container.querySelectorAll('.quick-num').forEach(btn => {
                btn.addEventListener('click', () => {
                    const numInput = container.querySelector('#value-number');
                    const current = parseFloat(numInput.value) || 0;
                    const delta = parseFloat(btn.dataset.value);
                    numInput.value = current + delta;
                    this.currentVariable.value = numInput.value;
                    this.updatePreview();
                });
            });
            
            // Placeholder chips
            container.querySelectorAll('.chip[data-value]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const numInput = container.querySelector('#value-number');
                    numInput.value = chip.dataset.value;
                    this.currentVariable.value = chip.dataset.value;
                    this.updatePreview();
                });
            });
        }
        
        // String input
        if (typeId === 'STRING') {
            const strInput = container.querySelector('#value-string');
            if (strInput) {
                strInput.addEventListener('input', (e) => {
                    this.currentVariable.value = e.target.value;
                    container.querySelector('#string-preview').textContent = e.target.value || 'Your text here';
                    this.updatePreview();
                });
            }
            
            // Chips and color codes
            container.querySelectorAll('.chip[data-value], .color-chip[data-value]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const strInput = container.querySelector('#value-string');
                    strInput.value += chip.dataset.value;
                    this.currentVariable.value = strInput.value;
                    container.querySelector('#string-preview').textContent = strInput.value;
                    this.updatePreview();
                });
            });
        }
        
        // Boolean input
        if (typeId === 'BOOLEAN') {
            container.querySelectorAll('.boolean-option').forEach(option => {
                option.addEventListener('click', () => {
                    container.querySelectorAll('.boolean-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    this.currentVariable.value = option.dataset.value;
                    this.updatePreview();
                });
            });
        }
        
        // Location input
        if (typeId === 'LOCATION') {
            const inputs = ['loc-world', 'loc-x', 'loc-y', 'loc-z', 'loc-yaw', 'loc-pitch'];
            inputs.forEach(id => {
                const input = container.querySelector(`#${id}`);
                if (input) {
                    input.addEventListener('input', () => {
                        this.updateLocationValue();
                    });
                }
            });
            
            // Placeholder chips
            container.querySelectorAll('.chip[data-value]').forEach(chip => {
                chip.addEventListener('click', () => {
                    this.currentVariable.value = chip.dataset.value;
                    this.updatePreview();
                });
            });
        }
        
        // Vector input
        if (typeId === 'VECTOR') {
            const updateVector = () => {
                const x = parseFloat(container.querySelector('#vec-x').value) || 0;
                const y = parseFloat(container.querySelector('#vec-y').value) || 0;
                const z = parseFloat(container.querySelector('#vec-z').value) || 0;
                const magnitude = Math.sqrt(x*x + y*y + z*z);
                container.querySelector('#vec-magnitude').textContent = magnitude.toFixed(2);
                this.currentVariable.value = `${x},${y},${z}`;
                this.updatePreview();
            };
            
            ['vec-x', 'vec-y', 'vec-z'].forEach(id => {
                const input = container.querySelector(`#${id}`);
                if (input) {
                    input.addEventListener('input', updateVector);
                }
            });
            
            // Normalize button
            container.querySelector('#normalize-vector')?.addEventListener('click', () => {
                const x = parseFloat(container.querySelector('#vec-x').value) || 0;
                const y = parseFloat(container.querySelector('#vec-y').value) || 0;
                const z = parseFloat(container.querySelector('#vec-z').value) || 0;
                const magnitude = Math.sqrt(x*x + y*y + z*z);
                if (magnitude > 0) {
                    container.querySelector('#vec-x').value = (x / magnitude).toFixed(3);
                    container.querySelector('#vec-y').value = (y / magnitude).toFixed(3);
                    container.querySelector('#vec-z').value = (z / magnitude).toFixed(3);
                    updateVector();
                }
            });
            
            // Preset chips
            container.querySelectorAll('.chip[data-x]').forEach(chip => {
                chip.addEventListener('click', () => {
                    container.querySelector('#vec-x').value = chip.dataset.x;
                    container.querySelector('#vec-y').value = chip.dataset.y;
                    container.querySelector('#vec-z').value = chip.dataset.z;
                    updateVector();
                });
            });
        }
        
        // Time input
        if (typeId === 'TIME') {
            const timeInput = container.querySelector('#value-time');
            if (timeInput) {
                timeInput.addEventListener('input', () => {
                    this.currentVariable.value = timeInput.value;
                    container.querySelector('#time-preview').textContent = 
                        new Date(parseInt(timeInput.value)).toLocaleString();
                    this.updatePreview();
                });
            }
            
            container.querySelector('#set-time-now')?.addEventListener('click', () => {
                const now = Date.now();
                timeInput.value = now;
                this.currentVariable.value = now;
                container.querySelector('#time-preview').textContent = new Date(now).toLocaleString();
                this.updatePreview();
            });
        }
        
        // Metaskill input
        if (typeId === 'METASKILL') {
            const textarea = container.querySelector('#value-metaskill');
            if (textarea) {
                textarea.addEventListener('input', () => {
                    this.currentVariable.value = textarea.value;
                    this.updatePreview();
                });
            }
        }
        
        // Item input
        if (typeId === 'ITEM') {
            const itemInput = container.querySelector('#value-item');
            if (itemInput) {
                itemInput.addEventListener('input', () => {
                    this.currentVariable.value = itemInput.value;
                    this.updatePreview();
                });
            }
            
            container.querySelectorAll('.chip[data-value]').forEach(chip => {
                chip.addEventListener('click', () => {
                    itemInput.value = chip.dataset.value;
                    this.currentVariable.value = chip.dataset.value;
                    this.updatePreview();
                });
            });
        }
    },
    
    /**
     * Update location value from coordinate inputs
     */
    updateLocationValue() {
        const container = this.modal.querySelector('#value-builder-container');
        const world = container.querySelector('#loc-world').value || 'world';
        const x = container.querySelector('#loc-x').value || 0;
        const y = container.querySelector('#loc-y').value || 64;
        const z = container.querySelector('#loc-z').value || 0;
        const yaw = container.querySelector('#loc-yaw').value || 0;
        const pitch = container.querySelector('#loc-pitch').value || 0;
        
        this.currentVariable.value = `${world},${x},${y},${z},${yaw},${pitch}`;
        this.updatePreview();
    },
    
    /**
     * Render quick reference for type
     */
    renderQuickReference(typeId) {
        const container = this.modal.querySelector('#reference-content');
        const type = VARIABLE_TYPES.find(t => t.id === typeId);
        
        if (!type) {
            container.innerHTML = '';
            return;
        }
        
        let html = `
            <div class="ref-section">
                <h5>Meta Keywords</h5>
                <div class="ref-keywords">
        `;
        
        if (type.metaKeywords && type.metaKeywords.length > 0) {
            html += type.metaKeywords.slice(0, 8).map(kw => 
                `<code class="ref-keyword">.${kw}</code>`
            ).join('');
            if (type.metaKeywords.length > 8) {
                html += `<span class="more-keywords">+${type.metaKeywords.length - 8} more</span>`;
            }
        } else {
            html += '<span class="no-keywords">No special keywords</span>';
        }
        
        html += `
                </div>
            </div>
            <div class="ref-section">
                <h5>Example Values</h5>
                <div class="ref-examples">
                    ${type.examples.map(ex => `<code>${ex}</code>`).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    /**
     * Switch preview tab
     */
    switchPreviewTab(tab) {
        this.modal.querySelectorAll('.preview-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        this.updatePreview(tab);
    },
    
    /**
     * Update the preview
     */
    updatePreview(tab = null) {
        const activeTab = tab || this.modal.querySelector('.preview-tab.active')?.dataset.tab || 'mechanic';
        const codeElement = this.modal.querySelector('#preview-code');
        const explanationElement = this.modal.querySelector('#preview-explanation');
        
        const { name, scope, type, value, save, duration } = this.currentVariable;
        const scopePrefix = scope.toLowerCase();
        
        let code = '';
        let explanation = '';
        
        switch (activeTab) {
            case 'mechanic':
                code = this.generateSetMechanicCode();
                explanation = this.generateMechanicExplanation();
                break;
                
            case 'placeholder':
                code = `<${scopePrefix}.var.${name || 'variable_name'}>`;
                explanation = `<p>Use this placeholder to <strong>read</strong> the variable value.</p>
                    <p><code>|</code> adds a fallback: <code>&lt;${scopePrefix}.var.${name || 'variable_name'}|0&gt;</code></p>`;
                break;
                
            case 'condition':
                code = this.generateConditionCode();
                explanation = `<p>Conditions can check variable values in skill conditions.</p>
                    <p>Use <code>?</code> for inline conditions.</p>`;
                break;
        }
        
        codeElement.textContent = code;
        explanationElement.innerHTML = explanation;
    },
    
    /**
     * Generate the setVariable mechanic code
     */
    generateSetMechanicCode() {
        const { name, scope, type, value, save, duration } = this.currentVariable;
        
        let parts = [`var=${scope.toLowerCase()}.${name || 'variable_name'}`];
        parts.push(`value=${value || '0'}`);
        
        if (type && type !== 'STRING') {
            parts.push(`type=${type}`);
        }
        
        if (save) {
            parts.push('save=true');
        }
        
        if (duration && parseInt(duration) > 0) {
            parts.push(`duration=${duration}`);
        }
        
        return `- setvariable{${parts.join(';')}}`;
    },
    
    /**
     * Generate explanation for mechanic
     */
    generateMechanicExplanation() {
        const { scope, type, save, duration } = this.currentVariable;
        
        const scopeInfo = VARIABLE_SCOPES.find(s => s.id === scope);
        const typeInfo = VARIABLE_TYPES.find(t => t.id === type);
        
        let html = '<ul class="explanation-list">';
        
        if (scopeInfo) {
            html += `<li><strong>Scope:</strong> ${scopeInfo.name} - ${scopeInfo.description}</li>`;
        }
        
        if (typeInfo) {
            html += `<li><strong>Type:</strong> ${typeInfo.name} - ${typeInfo.description}</li>`;
        }
        
        if (save) {
            html += `<li><strong>Save:</strong> Will persist through server restarts</li>`;
        }
        
        if (duration && parseInt(duration) > 0) {
            html += `<li><strong>Duration:</strong> Expires after ${duration} ticks (${(parseInt(duration) / 20).toFixed(1)}s)</li>`;
        }
        
        html += '</ul>';
        return html;
    },
    
    /**
     * Generate condition code
     */
    generateConditionCode() {
        const { name, scope, type, value } = this.currentVariable;
        const scopePrefix = scope.toLowerCase();
        
        if (type === 'BOOLEAN') {
            return `- variableEquals{var=${scopePrefix}.${name || 'variable_name'};value=true}`;
        } else if (['INTEGER', 'FLOAT', 'LONG', 'DOUBLE'].includes(type)) {
            return `- variableInRange{var=${scopePrefix}.${name || 'variable_name'};value=0to100}`;
        } else {
            return `- variableEquals{var=${scopePrefix}.${name || 'variable_name'};value=${value || 'test'}}`;
        }
    },
    
    /**
     * Copy preview to clipboard
     */
    copyPreview() {
        const code = this.modal.querySelector('#preview-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            // Show feedback
            const btn = this.modal.querySelector('.copy-preview-btn');
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 1500);
        });
    },
    
    /**
     * Save as template
     */
    saveAsTemplate() {
        const templates = JSON.parse(localStorage.getItem('mm_variable_templates') || '[]');
        
        const template = {
            id: Date.now(),
            name: this.currentVariable.name || 'Unnamed Template',
            ...this.currentVariable
        };
        
        templates.push(template);
        localStorage.setItem('mm_variable_templates', JSON.stringify(templates));
        
        // Feedback
        if (typeof NotificationModal !== 'undefined') {
            NotificationModal.show('Template saved!', 'success');
        }
    },
    
    /**
     * Insert the variable
     */
    insertVariable() {
        if (!this.currentVariable.name) {
            this.validateName('');
            this.modal.querySelector('#variable-name-input').focus();
            return;
        }
        
        const result = {
            ...this.currentVariable,
            mechanic: this.generateSetMechanicCode(),
            placeholder: `<${this.currentVariable.scope.toLowerCase()}.var.${this.currentVariable.name}>`
        };
        
        // Register with VariableManager
        if (typeof VariableManager !== 'undefined') {
            VariableManager.registerVariable({
                name: this.currentVariable.name,
                scope: this.currentVariable.scope,
                type: this.currentVariable.type,
                defaultValue: this.currentVariable.value,
                source: { type: 'manual', location: 'Variable Builder' }
            });
        }
        
        // Call callback
        if (this.callbacks.onSave) {
            this.callbacks.onSave(result);
        }
        
        this.close();
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VariableBuilder.init());
} else {
    VariableBuilder.init();
}

// Expose to window for global access
window.VariableBuilder = VariableBuilder;
window.variableBuilder = VariableBuilder; // Also lowercase for compatibility

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariableBuilder;
}
