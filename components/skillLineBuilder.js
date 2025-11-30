/**
 * Skill Line Builder
 * Modern unified editor for creating skill lines with multiple modes:
 * - Quick Build: Visual builder with browser integration
 * - Templates: Pre-made skill line templates
 * - Manual: Multi-line text editor with validation
 * - Bulk: Import multiple lines at once
 */

class SkillLineBuilder {
    constructor() {
        this.context = 'mob';
        this.currentTab = 'quick-build';
        this.onAddCallback = null;
        this.onAddMultipleCallback = null;
        this.onBackCallback = null;
        
        // Multi-line queue for adding multiple skill lines at once
        this.skillLineQueue = [];
        
        // Current skill line being built in Quick Build tab
        this.currentLine = {
            mechanic: null,
            targeter: null,
            trigger: null,
            conditions: [],
            chance: null,
            health: null
        };
        
        // Browser instances
        this.mechanicBrowser = null;
        this.targeterBrowser = null;
        this.triggerBrowser = null;
        this.conditionBrowser = null;
        this.templateSelector = null;
        
        // Autocomplete for manual editor
        this.autocomplete = null;
        
        // DOM elements (cached after creation)
        this.overlay = null;
        this.modal = null;
        this.tabButtons = null;
        this.tabContents = null;
        
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        const modalHTML = `
            <div id="skillLineBuilderOverlay" class="condition-modal" style="display: none;">
                <div class="modal-content skill-line-builder-content condition-browser">
                    <!-- Header -->
                    <div class="modal-header">
                        <button class="btn btn-secondary btn-back" id="skillBuilderBack" title="Back to options" style="display: none;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <h2>
                            <i class="fas fa-hammer"></i>
                            Skill Line Builder
                        </h2>
                        <button class="btn-close" id="skillBuilderClose">&times;</button>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="category-tabs" id="skillBuilderTabs">
                        <button class="category-tab active" data-tab="quick-build">
                            <i class="fas fa-magic"></i>
                            Quick Build
                        </button>
                        <button class="category-tab" data-tab="templates">
                            <i class="fas fa-layer-group"></i>
                            Templates
                        </button>
                        <button class="category-tab" data-tab="bulk">
                            <i class="fas fa-file-import"></i>
                            Bulk Import
                        </button>
                    </div>
                    
                    <!-- Tab Content Container -->
                    <div class="condition-browser-body">
                    <!-- Quick Build Tab -->
                    <div class="skill-builder-tab-content active" data-tab-content="quick-build">
                        ${this.createQuickBuildTab()}
                    </div>
                    
                    <!-- Templates Tab -->
                    <div class="skill-builder-tab-content" data-tab-content="templates">
                        ${this.createTemplatesTab()}
                    </div>
                    
                    <!-- Bulk Import Tab -->
                    <div class="skill-builder-tab-content" data-tab-content="bulk">
                        ${this.createBulkTab()}
                    </div>
                </div>
                
                <!-- Multi-Line Queue Panel (shown when queue has items) -->
                <div class="skill-line-queue-panel" id="skillLineQueue" style="display: none;">
                    <div class="queue-header">
                        <h3>
                            <i class="fas fa-list"></i>
                            Queue (<span id="queueCount">0</span>)
                        </h3>
                        <button class="btn btn-sm btn-danger" id="clearQueue" title="Clear All">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="queue-list" id="queueList">
                        <!-- Queue items will be rendered here -->
                    </div>
                </div>
                
                    <!-- Footer -->
                    <div class="modal-footer">
                        <div class="footer-info">
                            <span id="skillBuilderInfo">Select components to build your skill line</span>
                        </div>
                        <button class="btn btn-secondary" id="skillBuilderCancel">Close</button>
                        <button class="btn btn-primary" id="skillBuilderAdd" disabled>
                            <i class="fas fa-plus"></i>
                            <span id="addButtonText">Add Skill Line</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
        
        // Cache DOM elements
        this.overlay = document.getElementById('skillLineBuilderOverlay');
        this.modal = this.overlay.querySelector('.modal-content');
        this.tabButtons = this.overlay.querySelectorAll('.category-tab');
        this.tabContents = this.overlay.querySelectorAll('.skill-builder-tab-content');
    }

    /**
     * Create Quick Build tab HTML
     */
    createQuickBuildTab() {
        return `
            <div class="quick-build-container">
                <!-- Component Selection Section -->
                <div class="quick-build-section">
                    <div class="section-header">
                        <h3><i class="fas fa-puzzle-piece"></i> Components</h3>
                        <span class="section-hint">Click buttons to add components to your skill line</span>
                    </div>
                    
                    <div class="component-grid">
                        <!-- Mechanic (Required) -->
                        <div class="component-card" data-component="mechanic">
                            <div class="component-card-header">
                                <div class="component-icon">⚙️</div>
                                <div class="component-info">
                                    <h4>Mechanic</h4>
                                    <span class="component-status" id="mechanicStatus">Required</span>
                                </div>
                            </div>
                            <div class="component-value" id="mechanicValue">
                                <span class="placeholder">Click to select...</span>
                            </div>
                            <div class="component-actions">
                                <button class="btn btn-sm btn-primary" id="selectMechanic">
                                    <i class="fas fa-search"></i>
                                    Browse Mechanics
                                </button>
                                <button class="btn btn-sm btn-secondary" id="clearMechanic" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Targeter (Optional) -->
                        <div class="component-card" data-component="targeter">
                            <div class="component-card-header">
                                <div class="component-icon">🎯</div>
                                <div class="component-info">
                                    <h4>Targeter</h4>
                                    <span class="component-status">Optional</span>
                                </div>
                            </div>
                            <div class="component-value" id="targeterValue">
                                <span class="placeholder">None</span>
                            </div>
                            <div class="component-actions">
                                <button class="btn btn-sm btn-primary" id="selectTargeter">
                                    <i class="fas fa-search"></i>
                                    Browse Targeters
                                </button>
                                <button class="btn btn-sm btn-secondary" id="clearTargeter" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Trigger (Context-Dependent) -->
                        <div class="component-card" data-component="trigger">
                            <div class="component-card-header">
                                <div class="component-icon">⚡</div>
                                <div class="component-info">
                                    <h4>Trigger</h4>
                                    <span class="component-status" id="triggerStatus">Optional</span>
                                </div>
                            </div>
                            <div class="component-value" id="triggerValue">
                                <span class="placeholder">None</span>
                            </div>
                            <div class="component-actions">
                                <button class="btn btn-sm btn-primary" id="selectTrigger">
                                    <i class="fas fa-search"></i>
                                    Browse Triggers
                                </button>
                                <button class="btn btn-sm btn-secondary" id="clearTrigger" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Conditions (Optional, Multiple) -->
                        <div class="component-card" data-component="conditions">
                            <div class="component-card-header">
                                <div class="component-icon">❓</div>
                                <div class="component-info">
                                    <h4>Conditions</h4>
                                    <span class="component-status">Optional</span>
                                </div>
                            </div>
                            <div class="component-value" id="conditionsValue">
                                <span class="placeholder">None</span>
                            </div>
                            <div class="component-actions">
                                <button class="btn btn-sm btn-primary" id="selectCondition">
                                    <i class="fas fa-search"></i>
                                    Add Condition
                                </button>
                                <button class="btn btn-sm btn-secondary" id="clearConditions" style="display: none;">
                                    <i class="fas fa-times"></i>
                                    Clear All
                                </button>
                            </div>
                        </div>
                        
                        <!-- Chance (Optional) -->
                        <div class="component-card compact" data-component="chance">
                            <div class="component-card-header">
                                <div class="component-icon">🎲</div>
                                <div class="component-info">
                                    <h4>Chance</h4>
                                    <span class="component-status">Optional</span>
                                </div>
                            </div>
                            <input type="number" 
                                   id="chanceInput" 
                                   class="form-input" 
                                   placeholder="0.0 - 1.0" 
                                   min="0" 
                                   max="1" 
                                   step="0.1">
                        </div>
                        
                        <!-- Health Modifier (Optional) -->
                        <div class="component-card compact" data-component="health">
                            <div class="component-card-header">
                                <div class="component-icon">❤️</div>
                                <div class="component-info">
                                    <h4>Health</h4>
                                    <span class="component-status">Optional</span>
                                </div>
                            </div>
                            <input type="text" 
                                   id="healthInput" 
                                   class="form-input" 
                                   placeholder="e.g., 50, >75%, <25">
                        </div>
                    </div>
                </div>
                
                <!-- Preview Section -->
                <div class="quick-build-section preview-section">
                    <div class="section-header">
                        <h3><i class="fas fa-eye"></i> Preview</h3>
                        <button class="btn btn-sm btn-secondary" id="copyPreview" disabled>
                            <i class="fas fa-copy"></i>
                            Copy
                        </button>
                    </div>
                    
                    <div class="preview-display">
                        <div class="preview-code" id="quickBuildPreview">
                            <span class="preview-placeholder">Build your skill line to see preview...</span>
                        </div>
                    </div>
                    
                    <div class="preview-actions">
                        <button class="btn btn-secondary" id="resetQuickBuild">
                            <i class="fas fa-undo"></i>
                            Reset
                        </button>
                        <button class="btn btn-primary" id="addToQueue">
                            <i class="fas fa-plus"></i>
                            Add to Queue
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create Templates tab HTML
     */
    createTemplatesTab() {
        return `
            <div class="templates-container">
                <div class="templates-info">
                    <i class="fas fa-layer-group" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <h3>Browse Skill Templates</h3>
                    <p>Click the button below to open the template browser and select from pre-made skill line templates.</p>
                    <button class="btn btn-primary btn-lg" id="openTemplateBrowser">
                        <i class="fas fa-layer-group"></i>
                        Open Template Browser
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create Manual tab HTML
     */
    createManualTab() {
        return `
            <div class="manual-editor-container">
                <div class="manual-editor-header">
                    <div class="editor-info">
                        <h3><i class="fas fa-code"></i> Manual Editor</h3>
                        <p>Write skill lines directly. Each line will be validated. Press Ctrl+Enter to add.</p>
                    </div>
                    <div class="editor-format">
                        <strong>Format:</strong>
                        <code>- mechanic{args} @targeter ~trigger ?condition chance health</code>
                    </div>
                </div>
                
                <div class="manual-editor-workspace">
                    <div class="editor-sidebar">
                        <div class="line-numbers" id="manualLineNumbers">1</div>
                    </div>
                    <div class="editor-main">
                        <textarea 
                            id="manualEditor" 
                            class="manual-editor-input" 
                            placeholder="- damage{a=20} @Target ~onAttack ?health{h<50%} 0.5&#10;- heal{a=10} @Self&#10;- message{m=&quot;Hello!&quot;} @PIR{r=10}"
                            spellcheck="false"
                        ></textarea>
                    </div>
                </div>
                
                <div class="manual-editor-validation" id="manualValidation">
                    <div class="validation-header">
                        <i class="fas fa-check-circle"></i>
                        <span>No issues found</span>
                    </div>
                </div>
                
                <div class="manual-editor-actions">
                    <button class="btn btn-secondary" id="clearManualEditor">
                        <i class="fas fa-trash"></i>
                        Clear
                    </button>
                    <button class="btn btn-secondary" id="formatManualEditor">
                        <i class="fas fa-magic"></i>
                        Auto-Format
                    </button>
                    <button class="btn btn-primary" id="addManualLines">
                        <i class="fas fa-plus"></i>
                        Add Lines to Queue
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create Bulk Import tab HTML
     */
    createBulkTab() {
        return `
            <div class="bulk-import-container">
                <div class="bulk-import-header">
                    <div class="bulk-info">
                        <h3><i class="fas fa-file-import"></i> Bulk Import</h3>
                        <p>Paste multiple skill lines from YAML or other sources. Lines will be validated and formatted.</p>
                    </div>
                    <div class="bulk-stats" id="bulkStats">
                        <div class="stat-item">
                            <strong>Lines:</strong> <span id="bulkLineCount">0</span>
                        </div>
                        <div class="stat-item">
                            <strong>Valid:</strong> <span id="bulkValidCount" class="text-success">0</span>
                        </div>
                        <div class="stat-item">
                            <strong>Invalid:</strong> <span id="bulkInvalidCount" class="text-danger">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="bulk-import-workspace">
                    <textarea 
                        id="bulkImportInput" 
                        class="bulk-import-input" 
                        placeholder="Paste your skill lines here...&#10;&#10;Example:&#10;  Skills:&#10;  - damage{a=20} @Target ~onAttack&#10;  - heal{a=10} @Self&#10;  - message{m=&quot;Hello!&quot;} @PIR{r=10}"
                        spellcheck="false"
                    ></textarea>
                </div>
                
                <div class="bulk-import-validation" id="bulkValidation">
                    <!-- Validation results will appear here -->
                </div>
                
                <div class="bulk-import-actions">
                    <button class="btn btn-secondary" id="clearBulkImport">
                        <i class="fas fa-trash"></i>
                        Clear
                    </button>
                    <button class="btn btn-secondary" id="parseBulkImport">
                        <i class="fas fa-check"></i>
                        Validate
                    </button>
                    <button class="btn btn-primary" id="addBulkLines" disabled>
                        <i class="fas fa-plus"></i>
                        Add Valid Lines to Queue
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close buttons
        this.overlay.querySelector('#skillBuilderClose').addEventListener('click', () => this.close());
        this.overlay.querySelector('#skillBuilderCancel').addEventListener('click', () => this.close());
        
        // Back button
        this.overlay.querySelector('#skillBuilderBack')?.addEventListener('click', () => {
            this.close();
            if (this.onBackCallback) {
                this.onBackCallback();
            }
        });
        
        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Add button (processes queue)
        this.overlay.querySelector('#skillBuilderAdd').addEventListener('click', () => {
            this.processQueue();
        });
        
        // Attach tab-specific listeners
        this.attachQuickBuildListeners();
        this.attachTemplatesListeners();
        // Note: Manual tab removed - now a separate option in creation mode selector
        // this.attachManualListeners();
        this.attachBulkListeners();
        this.attachQueueListeners();
    }

    /**
     * Attach Quick Build tab listeners
     */
    attachQuickBuildListeners() {
        // Mechanic selection
        this.overlay.querySelector('#selectMechanic').addEventListener('click', () => {
            this.openMechanicBrowser();
        });
        
        this.overlay.querySelector('#clearMechanic').addEventListener('click', () => {
            this.clearComponent('mechanic');
        });
        
        // Targeter selection
        this.overlay.querySelector('#selectTargeter').addEventListener('click', () => {
            this.openTargeterBrowser();
        });
        
        this.overlay.querySelector('#clearTargeter').addEventListener('click', () => {
            this.clearComponent('targeter');
        });
        
        // Trigger selection
        this.overlay.querySelector('#selectTrigger').addEventListener('click', () => {
            if (this.context !== 'skill') {
                this.openTriggerBrowser();
            }
        });
        
        this.overlay.querySelector('#clearTrigger').addEventListener('click', () => {
            this.clearComponent('trigger');
        });
        
        // Condition selection
        this.overlay.querySelector('#selectCondition').addEventListener('click', () => {
            this.openConditionBrowser();
        });
        
        this.overlay.querySelector('#clearConditions').addEventListener('click', () => {
            this.clearComponent('conditions');
        });
        
        // Chance input
        this.overlay.querySelector('#chanceInput').addEventListener('input', (e) => {
            this.currentLine.chance = e.target.value || null;
            this.updateQuickBuildPreview();
        });
        
        // Health input
        this.overlay.querySelector('#healthInput').addEventListener('input', (e) => {
            this.currentLine.health = e.target.value || null;
            this.updateQuickBuildPreview();
        });
        
        // Copy preview
        this.overlay.querySelector('#copyPreview').addEventListener('click', () => {
            this.copyPreviewToClipboard();
        });
        
        // Reset
        this.overlay.querySelector('#resetQuickBuild').addEventListener('click', () => {
            this.resetQuickBuild();
        });
        
        // Add to queue
        this.overlay.querySelector('#addToQueue').addEventListener('click', () => {
            this.addCurrentLineToQueue();
        });
    }

    /**
     * Attach Templates tab listeners
     */
    attachTemplatesListeners() {
        this.overlay.querySelector('#openTemplateBrowser').addEventListener('click', () => {
            this.openTemplateSelector();
        });
    }

    /**
     * Attach Manual tab listeners
     */
    attachManualListeners() {
        const manualEditor = this.overlay.querySelector('#manualEditor');
        const lineNumbers = this.overlay.querySelector('#manualLineNumbers');
        
        // Update line numbers on input
        manualEditor.addEventListener('input', () => {
            this.updateManualLineNumbers();
            this.validateManualEditor();
        });
        
        // Sync scroll
        manualEditor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = manualEditor.scrollTop;
        });
        
        // Ctrl+Enter to add
        manualEditor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.addManualLinesToQueue();
            }
        });
        
        // Clear button
        this.overlay.querySelector('#clearManualEditor').addEventListener('click', () => {
            manualEditor.value = '';
            this.updateManualLineNumbers();
            this.validateManualEditor();
        });
        
        // Format button
        this.overlay.querySelector('#formatManualEditor').addEventListener('click', () => {
            this.formatManualEditor();
        });
        
        // Add to queue button
        this.overlay.querySelector('#addManualLines').addEventListener('click', () => {
            this.addManualLinesToQueue();
        });
    }

    /**
     * Attach Bulk Import tab listeners
     */
    attachBulkListeners() {
        const bulkInput = this.overlay.querySelector('#bulkImportInput');
        
        // Auto-update stats on input
        bulkInput.addEventListener('input', () => {
            this.updateBulkStats();
        });
        
        // Clear button
        this.overlay.querySelector('#clearBulkImport').addEventListener('click', () => {
            bulkInput.value = '';
            this.updateBulkStats();
            this.overlay.querySelector('#bulkValidation').innerHTML = '';
            this.overlay.querySelector('#addBulkLines').disabled = true;
        });
        
        // Parse/Validate button
        this.overlay.querySelector('#parseBulkImport').addEventListener('click', () => {
            this.parseBulkImport();
        });
        
        // Add to queue button
        this.overlay.querySelector('#addBulkLines').addEventListener('click', () => {
            this.addBulkLinesToQueue();
        });
    }

    /**
     * Attach Queue panel listeners
     */
    attachQueueListeners() {
        // Clear queue button
        this.overlay.querySelector('#clearQueue').addEventListener('click', () => {
            this.clearQueue();
        });
    }

    /**
     * Open the skill line builder
     */
    open({ context = 'mob', onAdd = null, onAddMultiple = null, onBack = null }) {
        console.log('🔨 Opening Skill Line Builder');
        this.context = context;
        this.onAddCallback = onAdd;
        this.onAddMultipleCallback = onAddMultiple;
        this.onBackCallback = onBack;
        
        // Show/hide back button based on callback presence
        const backBtn = this.overlay.querySelector('#skillBuilderBack');
        if (backBtn) {
            backBtn.style.display = this.onBackCallback ? 'inline-flex' : 'none';
        }
        
        // Reset state
        this.resetQuickBuild();
        this.clearQueue();
        this.switchTab('quick-build');
        
        // Update trigger availability based on context
        this.updateTriggerAvailability();
        
        // Show modal
        this.overlay.style.display = 'flex';
    }

    /**
     * Close the skill line builder
     */
    close() {
        this.overlay.style.display = 'none';
        
        // Clean up
        this.onAddCallback = null;
        this.onAddMultipleCallback = null;
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        this.tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update tab contents
        this.tabContents.forEach(content => {
            if (content.dataset.tabContent === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // Update footer info based on tab
        this.updateFooterInfo();
    }

    /**
     * Update footer info text based on current tab
     */
    updateFooterInfo() {
        const infoElement = this.overlay.querySelector('#skillBuilderInfo');
        const addButton = this.overlay.querySelector('#skillBuilderAdd');
        const addButtonText = this.overlay.querySelector('#addButtonText');
        
        switch (this.currentTab) {
            case 'quick-build':
                infoElement.textContent = 'Select components to build your skill line';
                addButtonText.textContent = this.skillLineQueue.length > 0 
                    ? `Add ${this.skillLineQueue.length} Skill Line${this.skillLineQueue.length !== 1 ? 's' : ''}`
                    : 'Add Skill Line';
                break;
            case 'templates':
                infoElement.textContent = 'Browse and select from pre-made templates';
                addButtonText.textContent = this.skillLineQueue.length > 0 
                    ? `Add ${this.skillLineQueue.length} Skill Line${this.skillLineQueue.length !== 1 ? 's' : ''}`
                    : 'Select Template';
                break;
            case 'manual':
                infoElement.textContent = 'Write skill lines manually with validation';
                addButtonText.textContent = this.skillLineQueue.length > 0 
                    ? `Add ${this.skillLineQueue.length} Skill Line${this.skillLineQueue.length !== 1 ? 's' : ''}`
                    : 'Add Skill Line';
                break;
            case 'bulk':
                infoElement.textContent = 'Import multiple skill lines at once';
                addButtonText.textContent = this.skillLineQueue.length > 0 
                    ? `Add ${this.skillLineQueue.length} Skill Line${this.skillLineQueue.length !== 1 ? 's' : ''}`
                    : 'Import Lines';
                break;
        }
        
        // Enable/disable add button based on queue
        addButton.disabled = this.skillLineQueue.length === 0;
    }

    /**
     * Update trigger availability based on context
     */
    updateTriggerAvailability() {
        const triggerCard = this.overlay.querySelector('[data-component="trigger"]');
        const triggerBtn = this.overlay.querySelector('#selectTrigger');
        const triggerStatus = this.overlay.querySelector('#triggerStatus');
        
        if (this.context === 'skill') {
            triggerCard.classList.add('disabled');
            triggerBtn.disabled = true;
            triggerStatus.textContent = 'Not Allowed';
            triggerStatus.style.color = 'var(--danger, #ef4444)';
        } else {
            triggerCard.classList.remove('disabled');
            triggerBtn.disabled = false;
            triggerStatus.textContent = 'Optional';
            triggerStatus.style.color = 'var(--text-secondary, #999)';
        }
    }

    // ========================================
    // QUICK BUILD TAB METHODS
    // ========================================

    /**
     * Open mechanic browser
     */
    openMechanicBrowser() {
        if (!this.mechanicBrowser) {
            this.mechanicBrowser = new MechanicBrowser();
        }
        
        this.mechanicBrowser.open({
            parentZIndex: 1000,
            onSelect: (mechanic) => {
                this.currentLine.mechanic = mechanic;
                this.updateComponentDisplay('mechanic', mechanic);
                this.updateQuickBuildPreview();
            }
        });
    }

    /**
     * Open targeter browser
     */
    openTargeterBrowser() {
        if (!this.targeterBrowser) {
            this.targeterBrowser = new TargeterBrowser();
        }
        
        this.targeterBrowser.open({
            parentZIndex: 1000,
            onSelect: (targeter) => {
                this.currentLine.targeter = targeter;
                this.updateComponentDisplay('targeter', targeter);
                this.updateQuickBuildPreview();
            }
        });
    }

    /**
     * Open trigger browser
     */
    openTriggerBrowser() {
        if (!this.triggerBrowser) {
            this.triggerBrowser = new TriggerBrowser();
        }
        
        this.triggerBrowser.open({
            parentZIndex: 1000,
            onSelect: (trigger) => {
                this.currentLine.trigger = trigger;
                this.updateComponentDisplay('trigger', trigger);
                this.updateQuickBuildPreview();
            }
        });
    }

    /**
     * Open condition browser (using ConditionEditor component)
     */
    openConditionBrowser() {
        // ConditionEditor is available but needs to be initialized differently
        // For now, show alert - full integration would require modal version
        alert('Condition browser integration coming soon. Use manual editor tab for now.');
        return;
        
        // TODO: Implement modal condition browser similar to mechanic/targeter browsers
    }

    /**
     * Clear a component
     */
    clearComponent(component) {
        switch (component) {
            case 'mechanic':
                this.currentLine.mechanic = null;
                break;
            case 'targeter':
                this.currentLine.targeter = null;
                break;
            case 'trigger':
                this.currentLine.trigger = null;
                break;
            case 'conditions':
                this.currentLine.conditions = [];
                break;
        }
        
        this.updateComponentDisplay(component, null);
        this.updateQuickBuildPreview();
    }

    /**
     * Update component display
     */
    updateComponentDisplay(component, value) {
        const valueElement = this.overlay.querySelector(`#${component}Value`);
        const clearButton = this.overlay.querySelector(`#clear${component.charAt(0).toUpperCase() + component.slice(1)}`);
        
        if (!value || (Array.isArray(value) && value.length === 0)) {
            valueElement.innerHTML = '<span class="placeholder">None</span>';
            if (clearButton) clearButton.style.display = 'none';
        } else {
            if (component === 'conditions') {
                // Display multiple conditions
                valueElement.innerHTML = value.map(c => 
                    `<div class="condition-chip">${c}</div>`
                ).join('');
            } else {
                valueElement.innerHTML = `<code>${this.escapeHtml(value)}</code>`;
            }
            if (clearButton) clearButton.style.display = 'block';
        }
    }

    /**
     * Update Quick Build preview
     */
    updateQuickBuildPreview() {
        const previewElement = this.overlay.querySelector('#quickBuildPreview');
        const copyButton = this.overlay.querySelector('#copyPreview');
        
        const skillLine = this.buildSkillLineFromComponents();
        
        if (skillLine) {
            previewElement.innerHTML = `<code>${this.escapeHtml(skillLine)}</code>`;
            copyButton.disabled = false;
        } else {
            previewElement.innerHTML = '<span class="preview-placeholder">Build your skill line to see preview...</span>';
            copyButton.disabled = true;
        }
    }

    /**
     * Build skill line string from current components
     */
    buildSkillLineFromComponents() {
        if (!this.currentLine.mechanic) return null;
        
        let line = `- ${this.currentLine.mechanic}`;
        
        if (this.currentLine.targeter) {
            line += ` @${this.currentLine.targeter}`;
        }
        
        if (this.currentLine.trigger) {
            line += ` ~${this.currentLine.trigger}`;
        }
        
        if (this.currentLine.conditions.length > 0) {
            line += ' ' + this.currentLine.conditions.map(c => `?${c}`).join(' ');
        }
        
        if (this.currentLine.chance) {
            line += ` ${this.currentLine.chance}`;
        }
        
        if (this.currentLine.health) {
            line += ` ${this.currentLine.health}`;
        }
        
        return line;
    }

    /**
     * Copy preview to clipboard
     */
    copyPreviewToClipboard() {
        const skillLine = this.buildSkillLineFromComponents();
        if (skillLine) {
            navigator.clipboard.writeText(skillLine).then(() => {
                console.log('✅ Copied to clipboard:', skillLine);
                // Show temporary feedback
                const btn = this.overlay.querySelector('#copyPreview');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 1500);
            });
        }
    }

    /**
     * Reset Quick Build
     */
    resetQuickBuild() {
        this.currentLine = {
            mechanic: null,
            targeter: null,
            trigger: null,
            conditions: [],
            chance: null,
            health: null
        };
        
        // Reset all displays
        this.updateComponentDisplay('mechanic', null);
        this.updateComponentDisplay('targeter', null);
        this.updateComponentDisplay('trigger', null);
        this.updateComponentDisplay('conditions', null);
        
        // Reset inputs
        this.overlay.querySelector('#chanceInput').value = '';
        this.overlay.querySelector('#healthInput').value = '';
        
        this.updateQuickBuildPreview();
    }

    /**
     * Add current line to queue
     */
    addCurrentLineToQueue() {
        const skillLine = this.buildSkillLineFromComponents();
        if (skillLine) {
            this.addToQueue(skillLine);
            this.resetQuickBuild();
        }
    }

    // ========================================
    // TEMPLATES TAB METHODS
    // ========================================

    /**
     * Open template selector
     */
    openTemplateSelector() {
        if (!this.templateSelector) {
            this.templateSelector = new TemplateSelector();
        }
        
        this.templateSelector.open({
            context: this.context,
            onSelect: (skillLines) => {
                // Handle both single line and array of lines
                const lines = Array.isArray(skillLines) ? skillLines : [skillLines];
                
                lines.forEach(line => {
                    this.addToQueue(line);
                });
                
                // Switch to show queue
                this.updateQueueDisplay();
            }
        });
    }

    // ========================================
    // MANUAL TAB METHODS
    // ========================================

    /**
     * Update manual editor line numbers
     */
    updateManualLineNumbers() {
        const editor = this.overlay.querySelector('#manualEditor');
        const lineNumbers = this.overlay.querySelector('#manualLineNumbers');
        
        const lines = editor.value.split('\n').length;
        lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n');
    }

    /**
     * Validate manual editor content
     */
    validateManualEditor() {
        const editor = this.overlay.querySelector('#manualEditor');
        const validation = this.overlay.querySelector('#manualValidation');
        
        const lines = editor.value.split('\n').filter(l => l.trim());
        
        if (lines.length === 0) {
            validation.innerHTML = `
                <div class="validation-header">
                    <i class="fas fa-info-circle"></i>
                    <span>No content to validate</span>
                </div>
            `;
            return;
        }
        
        let validCount = 0;
        let invalidCount = 0;
        const issues = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                validCount++;
            } else if (trimmed.length > 0) {
                invalidCount++;
                issues.push({line: index + 1, message: 'Line must start with "- "'});
            }
        });
        
        if (invalidCount === 0) {
            validation.innerHTML = `
                <div class="validation-header success">
                    <i class="fas fa-check-circle"></i>
                    <span>${validCount} valid line${validCount !== 1 ? 's' : ''}</span>
                </div>
            `;
        } else {
            validation.innerHTML = `
                <div class="validation-header error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${invalidCount} issue${invalidCount !== 1 ? 's' : ''} found</span>
                </div>
                <div class="validation-issues">
                    ${issues.map(issue => `
                        <div class="validation-issue">
                            <strong>Line ${issue.line}:</strong> ${issue.message}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    /**
     * Format manual editor content
     */
    formatManualEditor() {
        const editor = this.overlay.querySelector('#manualEditor');
        const lines = editor.value.split('\n');
        
        const formatted = lines
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                if (!line.startsWith('- ') && !line.startsWith('Skills:')) {
                    return `- ${line}`;
                }
                return line;
            })
            .join('\n');
        
        editor.value = formatted;
        this.updateManualLineNumbers();
        this.validateManualEditor();
    }

    /**
     * Add manual lines to queue
     */
    addManualLinesToQueue() {
        const editor = this.overlay.querySelector('#manualEditor');
        const lines = editor.value.split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('- '));
        
        if (lines.length === 0) {
            console.warn('No valid skill lines to add');
            return;
        }
        
        lines.forEach(line => {
            this.addToQueue(line);
        });
        
        // Clear editor
        editor.value = '';
        this.updateManualLineNumbers();
        this.validateManualEditor();
    }

    // ========================================
    // BULK IMPORT TAB METHODS
    // ========================================

    /**
     * Update bulk import stats
     */
    updateBulkStats() {
        const input = this.overlay.querySelector('#bulkImportInput');
        const lines = input.value.split('\n').filter(l => l.trim());
        
        this.overlay.querySelector('#bulkLineCount').textContent = lines.length;
        this.overlay.querySelector('#bulkValidCount').textContent = '0';
        this.overlay.querySelector('#bulkInvalidCount').textContent = '0';
    }

    /**
     * Parse and validate bulk import
     */
    parseBulkImport() {
        const input = this.overlay.querySelector('#bulkImportInput');
        const validation = this.overlay.querySelector('#bulkValidation');
        const addButton = this.overlay.querySelector('#addBulkLines');
        
        const text = input.value;
        const lines = text.split('\n');
        
        const validLines = [];
        const invalidLines = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Skip empty lines and YAML headers
            if (!trimmed || trimmed === 'Skills:' || trimmed.endsWith(':')) {
                return;
            }
            
            // Extract skill line (remove YAML list markers)
            let skillLine = trimmed;
            if (trimmed.startsWith('- ')) {
                skillLine = trimmed;
            } else if (trimmed.match(/^\s*-\s+/)) {
                skillLine = '- ' + trimmed.replace(/^\s*-\s+/, '');
            } else {
                invalidLines.push({line: index + 1, text: trimmed, reason: 'Invalid format'});
                return;
            }
            
            validLines.push(skillLine);
        });
        
        // Update stats
        this.overlay.querySelector('#bulkValidCount').textContent = validLines.length;
        this.overlay.querySelector('#bulkInvalidCount').textContent = invalidLines.length;
        
        // Show validation results
        if (validLines.length === 0 && invalidLines.length === 0) {
            validation.innerHTML = `
                <div class="validation-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>No content to validate</p>
                </div>
            `;
            addButton.disabled = true;
        } else if (invalidLines.length === 0) {
            validation.innerHTML = `
                <div class="validation-success">
                    <i class="fas fa-check-circle"></i>
                    <p>All ${validLines.length} line${validLines.length !== 1 ? 's are' : ' is'} valid and ready to import!</p>
                </div>
            `;
            addButton.disabled = false;
        } else {
            validation.innerHTML = `
                <div class="validation-mixed">
                    <div class="validation-summary">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${validLines.length} valid, ${invalidLines.length} invalid</p>
                    </div>
                    <div class="validation-issues">
                        ${invalidLines.map(issue => `
                            <div class="validation-issue">
                                <strong>Line ${issue.line}:</strong> ${issue.reason}
                                <code>${this.escapeHtml(issue.text)}</code>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            addButton.disabled = validLines.length === 0;
        }
        
        // Store valid lines for adding
        this.bulkValidLines = validLines;
    }

    /**
     * Add bulk lines to queue
     */
    addBulkLinesToQueue() {
        if (!this.bulkValidLines || this.bulkValidLines.length === 0) {
            return;
        }
        
        this.bulkValidLines.forEach(line => {
            this.addToQueue(line);
        });
        
        // Clear input
        this.overlay.querySelector('#bulkImportInput').value = '';
        this.overlay.querySelector('#bulkValidation').innerHTML = '';
        this.updateBulkStats();
        this.bulkValidLines = [];
    }

    // ========================================
    // QUEUE MANAGEMENT METHODS
    // ========================================

    /**
     * Add a skill line to the queue
     */
    addToQueue(skillLine) {
        this.skillLineQueue.push(skillLine);
        this.updateQueueDisplay();
    }

    /**
     * Remove a skill line from the queue
     */
    removeFromQueue(index) {
        this.skillLineQueue.splice(index, 1);
        this.updateQueueDisplay();
    }

    /**
     * Clear the entire queue
     */
    clearQueue() {
        this.skillLineQueue = [];
        this.updateQueueDisplay();
    }

    /**
     * Update queue display
     */
    updateQueueDisplay() {
        const queuePanel = this.overlay.querySelector('#skillLineQueue');
        const queueList = this.overlay.querySelector('#queueList');
        const queueCount = this.overlay.querySelector('#queueCount');
        
        // Update count
        queueCount.textContent = this.skillLineQueue.length;
        
        // Show/hide panel
        if (this.skillLineQueue.length === 0) {
            queuePanel.style.display = 'none';
        } else {
            queuePanel.style.display = 'block';
            
            // Render queue items
            queueList.innerHTML = this.skillLineQueue.map((line, index) => `
                <div class="queue-item" data-index="${index}">
                    <div class="queue-item-number">${index + 1}</div>
                    <div class="queue-item-content">
                        <code>${this.escapeHtml(line)}</code>
                    </div>
                    <button class="queue-item-remove" data-index="${index}" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            // Attach remove handlers
            queueList.querySelectorAll('.queue-item-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    this.removeFromQueue(index);
                });
            });
        }
        
        // Update footer
        this.updateFooterInfo();
    }

    /**
     * Process the queue (add all lines)
     */
    processQueue() {
        if (this.skillLineQueue.length === 0) return;
        
        console.log('✅ Processing queue:', this.skillLineQueue.length, 'line(s)');
        
        if (this.skillLineQueue.length === 1) {
            // Single line - use onAdd callback
            if (this.onAddCallback) {
                this.onAddCallback(this.skillLineQueue[0]);
            }
        } else {
            // Multiple lines - use onAddMultiple callback
            if (this.onAddMultipleCallback) {
                this.onAddMultipleCallback(this.skillLineQueue);
            } else if (this.onAddCallback) {
                // Fallback: add one by one
                this.skillLineQueue.forEach(line => {
                    this.onAddCallback(line);
                });
            }
        }
        
        this.close();
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineBuilder;
}

console.log('✅ SkillLineBuilder component loaded (Modern Unified Design)');
