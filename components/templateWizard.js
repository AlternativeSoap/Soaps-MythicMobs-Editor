/**
 * Template Wizard - 2-Step Template Creation
 * Step 1: Template Details (metadata)
 * Step 2: Build Skill Lines (context-aware based on structure type)
 */

class TemplateWizard {
    constructor(templateManager, authManager, importExportManager) {
        this.templateManager = templateManager;
        this.authManager = authManager;
        this.importExportManager = importExportManager;
        
        // PERFORMANCE: Cache all DOM references to avoid repeated queries
        this.refs = {
            overlay: null,
            close: null,
            cancel: null,
            next: null,
            back: null,
            save: null,
            name: null,
            nameCounter: null,
            description: null,
            descCounter: null,
            category: null,
            icon: null,
            isOfficial: null,
            tags: null,
            adminOptions: null
        };
        
        this.currentStep = 1;
        this.templateData = {
            name: '',
            description: '',
            structureType: 'multi-line',
            category: 'combat',
            icon: '⚔️',
            type: 'skill',
            context: 'skill', // 'mob' or 'skill' - affects trigger availability
            tags: [],
            isOfficial: false,
            sections: [],
            lines: [] // For multi-line structure
        };
        
        this.sectionCounter = 0;
        this.sectionBuilders = {}; // Store SkillLineBuilder instances per section
        
        // Store event handler references to prevent duplication
        this.multiSectionClickHandler = null;
        this.multiSectionInputHandler = null;
        
        // Performance optimization
        this.debounceTimers = {};
        this.rafId = null;
        this.pendingPreviewUpdate = null;
        this.isHiding = false;
        
        // DOM cache
        this.cachedElements = new WeakMap();
        
        this.onSaveCallback = null;
        
        // Browser instances will be initialized lazily when needed
        // (not in constructor to ensure browser classes are loaded)
        this.targeterBrowser = null;
        this.triggerBrowser = null;
        this.mechanicBrowser = null;
        
        this.createModal();
        this.attachEventListeners();
    }
    
    /**
     * Initialize browser instances needed by SkillLineBuilder
     * Called lazily when opening builder to ensure browser classes are loaded
     */
    initializeBrowsers() {
        
        // Always create new instances (force refresh)
        if (window.TargeterBrowser) {
            this.targeterBrowser = new TargeterBrowser();
        } else {
            console.error('window.TargeterBrowser class not found!');
        }
        
        // Initialize Trigger Browser
        if (window.TriggerBrowser) {
            this.triggerBrowser = new TriggerBrowser(window.editor);
        } else {
            console.error('window.TriggerBrowser class not found!');
        }
        
        // Initialize Mechanic Browser (needs targeter and trigger browsers)
        if (window.MechanicBrowser) {
            this.mechanicBrowser = new MechanicBrowser(
                this.targeterBrowser,
                this.triggerBrowser,
                null  // Using global conditionBrowser instead
            );
        } else {
            console.error('window.MechanicBrowser class not found!');
        }
    }

    /**
     * Debounce utility - delays function execution until after delay ms
     */
    debounce(key, callback, delay = 200) {
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }
        this.debounceTimers[key] = setTimeout(() => {
            callback();
            delete this.debounceTimers[key];
        }, delay);
    }

    /**
     * RequestAnimationFrame wrapper for preview updates
     */
    schedulePreviewUpdate(updateFn) {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        this.pendingPreviewUpdate = updateFn;
        this.rafId = requestAnimationFrame(() => {
            if (this.pendingPreviewUpdate) {
                this.pendingPreviewUpdate();
                this.pendingPreviewUpdate = null;
            }
            this.rafId = null;
        });
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Clear debounce timers
        Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
        this.debounceTimers = {};
        
        // Cancel pending RAF
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // Clear DOM cache
        this.cachedElements = new WeakMap();
    }

    /**
     * Create the wizard modal
     */
    createModal() {
        const modalHTML = `
            <div id="templateWizardOverlay" class="condition-modal" style="display: none; z-index: 9999;">
                <div class="modal-content template-wizard-modal">
                    <!-- Header -->
                    <div class="template-wizard-header">
                        <div class="wizard-header-content">
                            <div class="wizard-icon-wrapper">
                                <i class="fas fa-wand-magic-sparkles"></i>
                            </div>
                            <div class="wizard-header-text">
                                <h2 id="wizardTitle">Create Template</h2>
                                <p class="wizard-subtitle">Step <span id="wizardStepNumber">1</span> of 2 — <span id="wizardStepName">Template Details</span></p>
                            </div>
                        </div>
                        <button class="btn-close" id="wizardClose" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="wizard-progress-bar">
                        <div class="wizard-progress-fill" id="wizardProgressFill" style="width: 50%;"></div>
                    </div>
                    
                    <!-- Body -->
                    <div class="template-wizard-body">
                        <!-- STEP 1: Template Details -->
                        <div id="wizardStep1" class="wizard-step-content active">
                            <!-- Essential Info Card -->
                            <div class="wizard-card">
                                <div class="wizard-card-header">
                                    <i class="fas fa-file-alt"></i>
                                    <span>Essential Information</span>
                                </div>
                                <div class="wizard-card-body">
                                    <div class="form-group">
                                        <label for="wizardName">
                                            Template Name <span class="required">*</span>
                                        </label>
                                        <div class="input-with-counter">
                                            <input 
                                                type="text" 
                                                id="wizardName" 
                                                class="form-control"
                                                placeholder="e.g., Epic Boss Combo"
                                                maxlength="50"
                                                required
                                            >
                                            <span class="char-counter" id="wizardNameCounter">0/50</span>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="wizardDescription">
                                            Description <span class="required">*</span>
                                        </label>
                                        <div class="input-with-counter">
                                            <textarea 
                                                id="wizardDescription" 
                                                class="form-control"
                                                placeholder="Describe what this template does and when to use it..."
                                                rows="3"
                                                maxlength="500"
                                                required
                                            ></textarea>
                                            <span class="char-counter" id="wizardDescCounter">0/500</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Context Selection Card -->
                            <div class="wizard-card">
                                <div class="wizard-card-header">
                                    <i class="fas fa-code-branch"></i>
                                    <span>Skill Context</span>
                                </div>
                                <div class="wizard-card-body">
                                    <div class="context-cards">
                                        <label class="context-card selected" data-context="skill">
                                            <input type="radio" name="wizardContext" value="skill" checked>
                                            <div class="context-card-icon">🎭</div>
                                            <div class="context-card-content">
                                                <span class="context-card-title">Regular Skill</span>
                                                <span class="context-card-desc">Standard skill without triggers</span>
                                            </div>
                                            <div class="context-card-check"><i class="fas fa-check"></i></div>
                                        </label>
                                        <label class="context-card" data-context="mob">
                                            <input type="radio" name="wizardContext" value="mob">
                                            <div class="context-card-icon">👾</div>
                                            <div class="context-card-content">
                                                <span class="context-card-title">Mob Skill</span>
                                                <span class="context-card-desc">Can use triggers like ~onTimer</span>
                                            </div>
                                            <div class="context-card-check"><i class="fas fa-check"></i></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Appearance Card -->
                            <div class="wizard-card">
                                <div class="wizard-card-header">
                                    <i class="fas fa-palette"></i>
                                    <span>Appearance</span>
                                </div>
                                <div class="wizard-card-body">
                                    <div class="appearance-grid">
                                        <div class="form-group">
                                            <label for="wizardCategory">Category</label>
                                            <select id="wizardCategory" class="form-control">
                                                <option value="combat">⚔️ Combat</option>
                                                <option value="damage">💥 Damage</option>
                                                <option value="healing">💚 Healing</option>
                                                <option value="summons">👾 Summons</option>
                                                <option value="projectiles">🎯 Projectiles</option>
                                                <option value="effects">✨ Effects</option>
                                                <option value="movement">🏃 Movement</option>
                                                <option value="buffs">💪 Buffs</option>
                                                <option value="debuffs">🐌 Debuffs</option>
                                                <option value="auras">🌟 Auras</option>
                                                <option value="utility">🔧 Utility</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="wizardIcon">Icon</label>
                                            <select id="wizardIcon" class="form-control">
                                                <option value="⚔️">⚔️ Sword</option>
                                                <option value="🔥">🔥 Fire</option>
                                                <option value="❄️">❄️ Ice</option>
                                                <option value="⚡">⚡ Lightning</option>
                                                <option value="💚">💚 Heart</option>
                                                <option value="💀">💀 Skull</option>
                                                <option value="👾">👾 Monster</option>
                                                <option value="🎯">🎯 Target</option>
                                                <option value="✨">✨ Sparkles</option>
                                                <option value="💥">💥 Explosion</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-group" style="grid-column: span 2;">
                                            <label for="wizardTags">Tags <span class="optional-label">(optional)</span></label>
                                            <input 
                                                type="text" 
                                                id="wizardTags" 
                                                class="form-control"
                                                placeholder="fire, boss, aoe (comma-separated)"
                                            >
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Admin Options (hidden by default) -->
                            <div id="wizardAdminOptions" class="wizard-card admin-card" style="display: none;">
                                <div class="wizard-card-header">
                                    <i class="fas fa-crown" style="color: #ffd700;"></i>
                                    <span>Admin Options</span>
                                </div>
                                <div class="wizard-card-body">
                                    <label class="wizard-toggle">
                                        <input type="checkbox" id="wizardIsOfficial">
                                        <span class="wizard-toggle-track"><span class="wizard-toggle-thumb"></span></span>
                                        <div class="wizard-toggle-text">
                                            <span>Mark as Official Template</span>
                                            <small>Official templates appear at the top and are highlighted</small>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Auto-detected info (subtle) -->
                            <div class="wizard-info-banner" id="wizardStructureTypeDisplay">
                                <i class="fas fa-magic"></i>
                                <span>Structure type will be <strong>auto-detected</strong> based on your skill lines</span>
                            </div>
                        </div>
                        
                        <!-- STEP 2: Build Skill Lines -->
                        <div id="wizardStep2" class="wizard-step-content" style="display: none;">
                            <div id="skillLinesBuilder" style="width: 100%;"></div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="template-wizard-footer">
                        <button class="btn btn-ghost" id="wizardBack" style="display: none;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <div class="wizard-footer-actions">
                            <button class="btn btn-ghost" id="wizardCancel">Cancel</button>
                            <button class="btn btn-primary btn-glow" id="wizardNext">
                                Continue <i class="fas fa-arrow-right"></i>
                            </button>
                            <button class="btn btn-success btn-glow" id="wizardSave" style="display: none;">
                                <i class="fas fa-check"></i> Create Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Cache DOM references once (avoid 52 getElementById calls)
        if (!this.refs.overlay) {
            this.refs.overlay = document.getElementById('templateWizardOverlay');
            this.refs.close = document.getElementById('wizardClose');
            this.refs.cancel = document.getElementById('wizardCancel');
            this.refs.next = document.getElementById('wizardNext');
            this.refs.back = document.getElementById('wizardBack');
            this.refs.save = document.getElementById('wizardSave');
            this.refs.name = document.getElementById('wizardName');
            this.refs.nameCounter = document.getElementById('wizardNameCounter');
            this.refs.description = document.getElementById('wizardDescription');
            this.refs.descCounter = document.getElementById('wizardDescCounter');
            this.refs.category = document.getElementById('wizardCategory');
            this.refs.icon = document.getElementById('wizardIcon');
            this.refs.isOfficial = document.getElementById('wizardIsOfficial');
            this.refs.tags = document.getElementById('wizardTags');
            this.refs.adminOptions = document.getElementById('wizardAdminOptions');
        }
        
        // Close buttons
        let wizardTouchHandled = false;
        if (this.refs.close) {
            this.refs.close.addEventListener('touchstart', (e) => {
                wizardTouchHandled = true;
                setTimeout(() => wizardTouchHandled = false, 500);
            }, { passive: false });
            this.refs.close.addEventListener('click', () => {
                if (wizardTouchHandled) return;
                this.close();
            });
        }
        
        if (this.refs.cancel) {
            this.refs.cancel.addEventListener('touchstart', (e) => {
                wizardTouchHandled = true;
                setTimeout(() => wizardTouchHandled = false, 500);
            }, { passive: false });
            this.refs.cancel.addEventListener('click', () => {
                if (wizardTouchHandled) return;
                this.close();
            });
        }
        
        // Navigation
        this.refs.next?.addEventListener('click', () => this.nextStep());
        this.refs.back?.addEventListener('click', () => this.previousStep());
        this.refs.save?.addEventListener('click', () => this.save());
        
        // Context cards selection
        document.querySelectorAll('.context-card').forEach(card => {
            card.addEventListener('click', () => {
                // Remove selected from all
                document.querySelectorAll('.context-card').forEach(c => c.classList.remove('selected'));
                // Add to clicked
                card.classList.add('selected');
                // Update radio
                const radio = card.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.templateData.context = radio.value;
                    this.templateData.type = radio.value;
                }
            });
        });
        
        // PERFORMANCE: Debounce character counters (prevents paint on every keystroke)
        const updateNameCounter = debounce((value) => {
            if (this.refs.nameCounter) {
                this.refs.nameCounter.textContent = `${value.length}/50`;
            }
        }, 50);
        
        const updateDescCounter = debounce((value) => {
            if (this.refs.descCounter) {
                this.refs.descCounter.textContent = `${value.length}/500`;
            }
        }, 50);
        
        // Character counters with debouncing
        this.refs.name?.addEventListener('input', (e) => {
            updateNameCounter(e.target.value);
        });
        
        this.refs.description?.addEventListener('input', (e) => {
            updateDescCounter(e.target.value);
        });
    }
    /**
     * Open wizard
     */
    async open(existingTemplate = null, isAdminMode = false, onSaveOrClose = null, defaultContext = null) {
        this.currentStep = 1;
        this.isAdminMode = isAdminMode;
        // Support both onSave callback (legacy) and onClose callback (new)
        this.onSaveCallback = typeof onSaveOrClose === 'function' ? onSaveOrClose : null;
        this.onCloseCallback = typeof onSaveOrClose === 'function' ? onSaveOrClose : null;
        
        // Check admin status
        await this.checkAdminStatus();
        
        // Reset or populate form
        if (existingTemplate) {
            this.populateStep1(existingTemplate);
        } else {
            this.resetForm();
            
            // Auto-select context if provided (from editor)
            if (defaultContext) {
                const contextRadio = document.querySelector(`input[name="wizardContext"][value="${defaultContext}"]`);
                if (contextRadio) {
                    contextRadio.checked = true;
                    // Trigger change event to update templateData
                    this.templateData.context = defaultContext;
                    this.templateData.type = defaultContext; // Also set type
                    if (window.DEBUG_MODE) console.log(`Auto-selected context: ${defaultContext}`);
                }
            }
        }
        
        // Show modal
        document.getElementById('templateWizardOverlay').style.display = 'flex';
        document.getElementById('wizardName')?.focus();
    }

    /**
     * Check if user is admin
     */
    async checkAdminStatus() {
        const adminOptions = document.getElementById('wizardAdminOptions');
        const isOfficialCheckbox = document.getElementById('wizardIsOfficial');
        
        if (!adminOptions) return;
        
        const hasAdminPermission = window.adminManager && 
            await window.adminManager.checkIsAdmin() &&
            window.adminManager.hasPermission('create_official_template');
        
        if (hasAdminPermission || this.isAdminMode) {
            adminOptions.style.display = 'block';
            if (this.isAdminMode && isOfficialCheckbox) {
                isOfficialCheckbox.checked = true;
            }
        } else {
            adminOptions.style.display = 'none';
        }
    }

    /**
     * Move to next step
     */
    nextStep() {
        if (this.currentStep === 1) {
            // Validate step 1
            if (!this.validateStep1()) return;
            
            // Save step 1 data
            this.saveStep1Data();
            
            // Move to step 2
            this.currentStep = 2;
            this.renderStep2();
            this.updateStepUI();
        }
    }

    /**
     * Move to previous step
     */
    previousStep() {
        if (this.currentStep === 2) {
            this.currentStep = 1;
            this.updateStepUI();
        }
    }

    /**
     * Validate step 1
     */
    validateStep1() {
        const name = document.getElementById('wizardName').value.trim();
        const description = document.getElementById('wizardDescription').value.trim();
        
        if (!name) {
            if (window.notificationModal) {
                window.notificationModal.alert('Please enter a template name', 'warning', 'Validation Error');
            }
            document.getElementById('wizardName').focus();
            return false;
        }
        
        if (!description) {
            if (window.notificationModal) {
                window.notificationModal.alert('Please enter a template description', 'warning', 'Validation Error');
            }
            document.getElementById('wizardDescription').focus();
            return false;
        }
        
        return true;
    }

    /**
     * Save step 1 data
     */
    saveStep1Data() {
        this.templateData.name = document.getElementById('wizardName').value.trim();
        this.templateData.description = document.getElementById('wizardDescription').value.trim();
        this.templateData.category = document.getElementById('wizardCategory').value;
        this.templateData.icon = document.getElementById('wizardIcon').value;
        // Type is auto-set from context radio buttons
        this.templateData.isOfficial = document.getElementById('wizardIsOfficial')?.checked || false;
        
        const tagsInput = document.getElementById('wizardTags').value;
        this.templateData.tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    }
    
    /**
     * Auto-detect structure type based on current data
     */
    autoDetectStructureType() {
        // Check if we have multiple sections with lines
        const sectionsWithLines = this.templateData.sections.filter(s => s.lines.length > 0);
        if (sectionsWithLines.length > 1) {
            return 'multi-section';
        }
        
        // Check lines array (for multi-line mode)
        const lines = this.templateData.lines.filter(l => l.trim());
        if (lines.length === 0) {
            // Also check sections
            const allLines = this.templateData.sections.flatMap(s => s.lines).filter(l => l.trim());
            if (allLines.length === 0) {
                return 'multi-line'; // Default
            }
            if (allLines.length === 1) {
                return 'single';
            }
            return sectionsWithLines.length > 1 ? 'multi-section' : 'multi-line';
        }
        
        if (lines.length === 1) {
            return 'single';
        }
        
        return 'multi-line';
    }
    
    /**
     * Update structure type display indicator
     */
    updateStructureTypeDisplay() {
        const type = this.autoDetectStructureType();
        this.templateData.structureType = type;
        
        const display = document.getElementById('wizardStructureTypeDisplay');
        if (display) {
            let icon, label;
            switch (type) {
                case 'single':
                    icon = 'fa-crosshairs';
                    label = 'Single Line';
                    break;
                case 'multi-section':
                    icon = 'fa-layer-group';
                    label = 'Multi-Section';
                    break;
                default:
                    icon = 'fa-list';
                    label = 'Multi-Line';
            }
            display.innerHTML = `
                <span class="structure-badge active" data-structure="${type}">
                    <i class="fas ${icon}"></i> ${label}
                </span>
            `;
        }
    }

    /**
     * Render step 2 - Always use multi-section builder (most flexible)
     * Structure type will be auto-detected when saving based on content
     */
    renderStep2() {
        const builder = document.getElementById('skillLinesBuilder');
        if (!builder) {
            console.error('skillLinesBuilder not found!');
            return;
        }

        // Always use multi-section mode - it's the most flexible
        // Structure type will be auto-detected on save based on actual content
        this.templateData.structureType = 'multi-section';
        const html = this.renderMultiSectionBuilder();
        builder.innerHTML = html;

        this.attachStep2EventListeners();
    }

    /**
     * Render single line builder
     */
    renderSingleLineBuilder() {
        return `
            <div class="form-group">
                <label>Skill Line:</label>
                <textarea 
                    id="singleSkillLine" 
                    class="form-control" 
                    rows="2"
                    placeholder="e.g., damage{a=10} @target"
                    style="font-family: 'Courier New', monospace;"
                ></textarea>
                <button class="btn btn-sm btn-primary" id="openSingleBuilder" style="margin-top: 0.5rem;">
                    <i class="fas fa-edit"></i> Open Skill Line Builder
                </button>
            </div>
            <div class="preview-section">
                <h4>Preview:</h4>
                <pre id="singlePreview" class="skill-preview"></pre>
            </div>
        `;
    }

    /**
     * Render multi-line builder
     */
    renderMultiLineBuilder() {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="margin: 0;">Skill Lines:</h4>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-primary" id="addLineBtn">
                        <i class="fas fa-plus"></i> Add Line
                    </button>
                    <button class="btn btn-sm btn-secondary" id="pasteMultiBtn">
                        <i class="fas fa-paste"></i> Paste Bulk
                    </button>
                    <button class="btn btn-sm btn-primary" id="openMultiBuilder">
                        <i class="fas fa-edit"></i> Open Builder
                    </button>
                </div>
            </div>
            <div id="multiLinesList" class="skill-lines-list"></div>
            <div class="preview-section" style="margin-top: 1rem;">
                <h4>Preview (<span id="multiLineCount">0</span> lines):</h4>
                <pre id="multiPreview" class="skill-preview"></pre>
            </div>
        `;
    }

    /**
     * Render multi-section builder
     */
    renderMultiSectionBuilder() {
        // Initialize with one default section if empty
        if (this.templateData.sections.length === 0) {
            this.sectionCounter = 1;
            this.templateData.sections.push({
                name: 'Skill1',
                lines: []
            });
        }

        return `
            <div class="wizard-sections-container">
                <!-- Modern Header Bar -->
                <div class="wizard-sections-header">
                    <div class="wizard-sections-title">
                        <div class="wizard-sections-icon">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div class="wizard-sections-info">
                            <h4>Template Sections</h4>
                            <p>Define skill groups that will be available when using this template</p>
                        </div>
                    </div>
                    <button class="btn-wizard-add" id="wizardAddSectionBtn">
                        <i class="fas fa-plus"></i>
                        <span>Add Section</span>
                    </button>
                </div>
                
                <!-- Sections list container -->
                <div id="multiSectionsList" class="wizard-sections-list"></div>
                
                <!-- Preview Panel -->
                <div class="wizard-preview-panel">
                    <div class="wizard-preview-header">
                        <div class="wizard-preview-title">
                            <i class="fas fa-eye"></i>
                            <span>YAML Preview</span>
                        </div>
                        <div class="wizard-preview-stats">
                            <span class="wizard-stat">
                                <i class="fas fa-folder"></i>
                                <span id="multiSectionCount">0</span> sections
                            </span>
                            <span class="wizard-stat">
                                <i class="fas fa-code"></i>
                                <span id="multiSectionLineCount">0</span> lines
                            </span>
                        </div>
                    </div>
                    <pre id="multiSectionPreview" class="wizard-preview-code"></pre>
                </div>
            </div>
        `;
    }

    /**
     * Attach step 2 event listeners - Always uses multi-section mode
     */
    attachStep2EventListeners() {
        // Always use multi-section mode (most flexible)
        // Multi-section listeners
        const addBtn = document.getElementById('wizardAddSectionBtn');
        
        if (addBtn) {
            const listener = () => {
                this.addSection();
            };
            addBtn.addEventListener('click', listener);
        } else {
            console.error('wizardAddSectionBtn not found in DOM!');
        }
        
        // Render sections (which calls attachMultiSectionListeners internally)
        this.renderMultiSections();
    }

    /**
     * Add a new section for multi-section
     */
    addSection() {
        this.sectionCounter++;
        const sectionName = `Skill${this.sectionCounter}`;
        
        this.templateData.sections.push({
            name: sectionName,
            lines: []
        });
        this.renderMultiSections();
    }

    /**
     * Render all sections (Phase 2)
     */
    renderMultiSections() {
        const container = document.getElementById('multiSectionsList');
        
        if (!container) {
            console.error('multiSectionsList container not found!');
            return;
        }

        // Generate HTML for all sections
        const html = this.templateData.sections.map((section, sectionIndex) => {
            const linesHTML = section.lines.length === 0 
                ? `<div class="wizard-section-empty">
                       <div class="wizard-empty-icon">
                           <i class="fas fa-wand-magic-sparkles"></i>
                       </div>
                       <p>No skill lines yet</p>
                       <span>Click "Add Line" or "Open Builder" to start</span>
                   </div>`
                : section.lines.map((line, lineIndex) => `
                    <div class="wizard-line-item" data-section="${sectionIndex}" data-line="${lineIndex}">
                        <div class="wizard-line-drag">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <div class="wizard-line-number">#${lineIndex + 1}</div>
                        <input 
                            type="text" 
                            class="wizard-line-input" 
                            value="${this.escapeHtml(line)}"
                            placeholder="e.g., damage{a=10} @target"
                        >
                        <button class="wizard-line-delete btn-delete-line" title="Delete Line">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');

            return `
                <div class="wizard-section-card" data-section-index="${sectionIndex}">
                    <!-- Section Header -->
                    <div class="wizard-section-header">
                        <div class="wizard-section-name-wrapper">
                            <i class="fas fa-pen wizard-edit-icon"></i>
                            <input 
                                type="text" 
                                class="wizard-section-name section-name-input" 
                                value="${this.escapeHtml(section.name)}"
                                placeholder="Section name"
                                title="Click to edit section name"
                            >
                        </div>
                        <div class="wizard-section-badge">
                            <i class="fas fa-code"></i>
                            <span>${section.lines.length}</span>
                        </div>
                        <button class="wizard-section-delete btn-delete-section" title="Delete Section">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <!-- Section Body -->
                    <div class="wizard-section-body">
                        <!-- Action Buttons -->
                        <div class="wizard-section-actions">
                            <button class="wizard-action-btn btn-add-line">
                                <i class="fas fa-plus"></i>
                                <span>Add Line</span>
                            </button>
                            <button class="wizard-action-btn btn-paste-lines">
                                <i class="fas fa-paste"></i>
                                <span>Paste Bulk</span>
                            </button>
                            <button class="wizard-action-btn primary btn-open-builder">
                                <i class="fas fa-edit"></i>
                                <span>Open Builder</span>
                            </button>
                        </div>
                        
                        <!-- Lines Container -->
                        <div class="wizard-section-lines">
                            ${linesHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Set HTML
        container.innerHTML = html;
        
        // Attach event listeners
        this.attachMultiSectionListeners();
        
        // Update preview
        this.updateMultiSectionPreview();
        this.updateStructureTypeDisplay(); // Auto-detect after render
    }

    /**
     * Attach event listeners for multi-section (Phase 3)
     */
    attachMultiSectionListeners() {
        const container = document.getElementById('multiSectionsList');
        if (!container) return;

        // Remove old listeners if they exist to prevent duplication
        if (this.multiSectionClickHandler) {
            container.removeEventListener('click', this.multiSectionClickHandler);
        }
        if (this.multiSectionInputHandler) {
            container.removeEventListener('input', this.multiSectionInputHandler);
        }

        // Create click handler
        this.multiSectionClickHandler = (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            // Get section index from closest wizard-section-card
            const card = target.closest('.wizard-section-card');
            if (!card) return;
            const sectionIndex = parseInt(card.dataset.sectionIndex);

            // Handle different button types
            if (target.classList.contains('btn-add-line')) {
                this.addLineToSection(sectionIndex);
            } else if (target.classList.contains('btn-paste-lines')) {
                this.pasteLinesToSection(sectionIndex);
            } else if (target.classList.contains('btn-open-builder')) {
                this.openSectionBuilder(sectionIndex);
            } else if (target.classList.contains('btn-delete-section')) {
                this.deleteSection(sectionIndex);
            } else if (target.classList.contains('btn-delete-line')) {
                const row = target.closest('.wizard-line-item');
                if (row) {
                    const lineIndex = parseInt(row.dataset.line);
                    this.deleteLineFromSection(sectionIndex, lineIndex);
                }
            }
        };

        // Create input handler
        this.multiSectionInputHandler = (e) => {
            if (e.target.classList.contains('section-name-input')) {
                const card = e.target.closest('.wizard-section-card');
                if (card) {
                    const sectionIndex = parseInt(card.dataset.sectionIndex);
                    this.templateData.sections[sectionIndex].name = e.target.value;
                    this.debounce('sectionPreview', () => this.updateMultiSectionPreview(), 200);
                }
            } else if (e.target.classList.contains('wizard-line-input')) {
                const row = e.target.closest('.wizard-line-item');
                if (row) {
                    const sectionIndex = parseInt(row.dataset.section);
                    const lineIndex = parseInt(row.dataset.line);
                    this.templateData.sections[sectionIndex].lines[lineIndex] = e.target.value;
                    this.debounce('sectionPreview', () => this.updateMultiSectionPreview(), 200);
                }
            }
        };

        // Attach the handlers
        container.addEventListener('click', this.multiSectionClickHandler);
        container.addEventListener('input', this.multiSectionInputHandler);
    }

    /**
     * Escape HTML for security
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add line to specific section
     */
    addLineToSection(sectionIndex) {
        this.templateData.sections[sectionIndex].lines.push('');
        this.renderMultiSections();
    }

    /**
     * Paste lines to specific section
     */
    pasteLinesToSection(sectionIndex) {
        this.showPasteModal(sectionIndex);
    }

    /**
     * Show paste modal for bulk line input
     */
    showPasteModal(sectionIndex) {
        const modalHTML = `
            <div id="pasteModal" class="condition-modal" style="display: flex; z-index: 10001;">
                <div class="modal-content condition-browser" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-paste"></i> Paste Skill Lines</h3>
                        <button class="btn-close" onclick="document.getElementById('pasteModal').remove()" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="condition-browser-body" style="padding: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Enter skill lines (one per line):</label>
                        <textarea 
                            id="pasteInput" 
                            class="form-control" 
                            rows="10"
                            placeholder="damage{a=10} @target\nheal{a=5} @self\nignite{d=100} @target"
                            style="font-family: 'Courier New', monospace; width: 100%; resize: vertical;"
                        ></textarea>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('pasteModal').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="pasteConfirm">
                            <i class="fas fa-check"></i> Paste
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus textarea
        const textarea = document.getElementById('pasteInput');
        if (textarea) {
            textarea.focus();
        }
        
        // Handle confirm
        document.getElementById('pasteConfirm').onclick = () => {
            const text = document.getElementById('pasteInput').value;
            if (text.trim()) {
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                this.templateData.sections[sectionIndex].lines.push(...lines);
                this.renderMultiSections();
            }
            document.getElementById('pasteModal').remove();
        };
        
        // Handle Enter key (Ctrl+Enter to confirm)
        textarea?.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                document.getElementById('pasteConfirm').click();
            } else if (e.key === 'Escape') {
                document.getElementById('pasteModal').remove();
            }
        });
    }

    /**
     * Delete line from section
     */
    deleteLineFromSection(sectionIndex, lineIndex) {
        this.templateData.sections[sectionIndex].lines.splice(lineIndex, 1);
        this.renderMultiSections();
    }

    /**
     * Delete section
     */
    deleteSection(sectionIndex) {
        if (this.templateData.sections.length === 1) {
            if (window.notificationModal) {
                window.notificationModal.alert(
                    'You must keep at least one section in your template.',
                    'info',
                    'Cannot Delete'
                );
            }
            return;
        }
        this.templateData.sections.splice(sectionIndex, 1);
        this.renderMultiSections();
    }

    /**
     * Add a new section from MechanicBrowser skillref input
     * Called when user creates a skill reference in mechanic browser during template creation
     * @param {string} skillName - The name of the skill/section to create
     * @returns {boolean} - Whether the section was added successfully
     */
    addSectionFromMechanicBrowser(skillName) {
        if (!skillName || !skillName.trim()) {
            return false;
        }
        
        const sanitizedName = skillName.trim();
        
        // Check if section already exists
        if (this.templateData.sections.some(s => s.name.toLowerCase() === sanitizedName.toLowerCase())) {
            window.editor?.showToast(`Section "${sanitizedName}" already exists in template`, 'info');
            return true; // Return true since it exists
        }
        
        // Add new section
        this.templateData.sections.push({
            name: sanitizedName,
            lines: []
        });
        
        // Note: Don't re-render here since wizard is hidden during builder use
        // The sections will be rendered when wizard is shown again
        
        return true;
    }

    /**
     * Add a multi-line
     */
    addMultiLine() {
        this.templateData.lines.push('');
        this.renderMultiLines();
        // Focus the new line input
        const inputs = document.querySelectorAll('.multi-line-input');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    }

    /**
     * Paste multiple lines for multi-line structure
     */
    pasteMultiLines() {
        const text = prompt('Paste skill lines (one per line):');
        if (!text) return;

        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        this.templateData.lines.push(...lines);
        this.renderMultiLines();
    }

    /**
     * Render multi-line list
     */
    renderMultiLines() {
        const container = document.getElementById('multiLinesList');
        if (!container) return;

        container.innerHTML = this.templateData.lines.map((line, index) => `
            <div class="skill-line-row">
                <span class="line-number">${index + 1}.</span>
                <input 
                    type="text" 
                    class="skill-line-input multi-line-input" 
                    value="${line}"
                    data-line-index="${index}"
                    placeholder="e.g., damage{a=10} @target"
                    style="font-family: 'Courier New', monospace;"
                >
                <button class="btn btn-sm btn-danger" onclick="window.templateWizard.deleteMultiLine(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Attach listeners for line inputs
        container.querySelectorAll('.multi-line-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const lineIndex = parseInt(e.target.dataset.lineIndex);
                this.templateData.lines[lineIndex] = e.target.value;
                this.debounce('multiLinePreview', () => this.updateMultiLinePreview(), 200);
            });
        });

        this.updateMultiLinePreview();
        this.updateStructureTypeDisplay(); // Auto-detect after render
    }

    /**
     * Delete multi-line
     */
    deleteMultiLine(index) {
        this.templateData.lines.splice(index, 1);
        this.renderMultiLines();
    }

    /**
     * Update multi-line preview
     */
    updateMultiLinePreview() {
        const preview = document.getElementById('multiPreview');
        const counter = document.getElementById('multiLineCount');
        if (!preview) return;

        const lines = this.templateData.lines.filter(l => l.trim());
        counter.textContent = lines.length;
        preview.textContent = lines.map(l => `  - ${l}`).join('\n') || '(no lines)';
    }

    /**
     * Update previews
     */
    updateSinglePreview() {
        const preview = document.getElementById('singlePreview');
        const input = document.getElementById('singleSkillLine');
        if (preview && input) {
            preview.textContent = input.value || '(empty)';
        }
    }

    updateMultiSectionPreview() {
        const preview = document.getElementById('multiSectionPreview');
        const countEl = document.getElementById('multiSectionCount');
        const lineCountEl = document.getElementById('multiSectionLineCount');
        
        if (!preview) return;

        let text = '';
        let totalLines = 0;
        
        this.templateData.sections.forEach(section => {
            const nonEmptyLines = section.lines.filter(l => l.trim());
            totalLines += nonEmptyLines.length;
            
            text += `${section.name}:\n`;
            nonEmptyLines.forEach(line => {
                text += `  - ${line}\n`;
            });
            text += '\n';
        });

        preview.textContent = text || '(no sections)';
        if (countEl) countEl.textContent = this.templateData.sections.length;
        if (lineCountEl) lineCountEl.textContent = totalLines;
    }

    /**
     * Get SkillLineBuilder instance from global window object
     * @returns {SkillLineBuilder|null}
     */
    getSkillLineBuilder() {
        const builder = window.skillLineBuilder;
        
        if (!builder) {
            console.error('SkillLineBuilder not found on window object');
        }
        
        return builder;
    }

    /**
     * Open Skill Line Builder for a specific section
     */
    openSectionBuilder(sectionIndex) {
        const section = this.templateData.sections[sectionIndex];
        if (!section) return;

        // Get SkillLineBuilder instance
        const builder = this.getSkillLineBuilder();
        if (!builder) {
            if (window.notificationModal) {
                window.notificationModal.alert(
                    'The Skill Line Builder component is not loaded. Please refresh the page or check the console for errors.',
                    'error',
                    'Skill Line Builder Not Available'
                );
            }
            return;
        }

        try {
            // Hide wizard before opening builder
            this.hide();

            // Don't pass browsers - let SkillLineBuilder use its own properly initialized browsers
            builder.open({
                context: this.templateData.context,
                // Callback for creating new sections from skillref inputs in mechanic browser
                onCreateSection: (skillName) => {
                    return this.addSectionFromMechanicBrowser(skillName);
                },
                onAddMultiple: (skillLines) => {
                    try {
                        if (skillLines && Array.isArray(skillLines)) {
                            // Update section with all returned lines
                            section.lines = skillLines;
                            
                            // Re-render the sections to show updated lines
                            this.renderMultiSections();
                            
                            // Show success notification
                            if (window.notificationModal && skillLines.length > 0) {
                                window.notificationModal.alert(
                                    `${skillLines.length} skill line(s) have been added to "${section.name}".`,
                                    'success',
                                    'Section Updated Successfully'
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Error updating section:', error);
                    } finally {
                        // Always show wizard again
                        this.show();
                    }
                },
                onClose: () => {
                    // Show wizard if user cancels without saving
                    this.show();
                }
            });
        } catch (error) {
            console.error('Error opening builder:', error);
            this.hideLoadingOverlay();
            this.show();
            if (window.notificationModal) {
                window.notificationModal.alert(
                    'An error occurred while opening the Skill Line Builder. Please try again.',
                    'error',
                    'Error Opening Builder'
                );
            }
        }
    }

    /**
     * Open Skill Line Builder for single line
     */
    openSingleBuilder() {
        const builder = this.getSkillLineBuilder();
        if (!builder) {
            if (window.notificationModal) {
                window.notificationModal.alert(
                    'The Skill Line Builder component is not loaded. Please refresh the page or check the console for errors.',
                    'error',
                    'Skill Line Builder Not Available'
                );
            }
            return;
        }

        const textarea = document.getElementById('singleSkillLine');
        const currentContent = textarea?.value || '';

        try {
            // Hide wizard before opening builder
            this.hide();

            // Don't pass browsers - let SkillLineBuilder use its own properly initialized browsers
            builder.open({
                context: this.templateData.context,
                onAddMultiple: (skillLines) => {
                    try {
                        if (skillLines && skillLines.length > 0 && textarea) {
                            // Update textarea with first line only (single line structure)
                            textarea.value = skillLines[0] || '';
                            this.updateSinglePreview();
                            
                            // Show success notification
                            if (window.notificationModal) {
                                window.notificationModal.alert(
                                    '1 skill line has been added to your template.',
                                    'success',
                                    'Line Added Successfully'
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Error updating single line:', error);
                    } finally {
                        // Always show wizard again
                        this.show();
                    }
                },
                onClose: () => {
                    // Show wizard if user cancels without saving
                    this.show();
                }
            });
        } catch (error) {
            console.error('Error opening builder:', error);
            this.hideLoadingOverlay();
            this.show();
            if (window.notificationModal) {
                window.notificationModal.alert(
                    'An error occurred while opening the Skill Line Builder. Please try again.',
                    'error',
                    'Error Opening Builder'
                );
            }
        }
    }

    /**
     * Open Skill Line Builder for multi-line
     */
    openMultiLineBuilder() {
        const builder = this.getSkillLineBuilder();
        if (!builder) {
            if (window.notificationModal) {
                window.notificationModal.alert(
                    'The Skill Line Builder component is not loaded. Please refresh the page or check the console for errors.',
                    'error',
                    'Skill Line Builder Not Available'
                );
            }
            return;
        }

        try {
            // Hide wizard before opening builder
            this.hide();

            // Don't pass browsers - let SkillLineBuilder use its own properly initialized browsers
            // (The global window.skillLineBuilder already has browsers set up correctly)
            builder.open({
                context: this.templateData.context,
                onAddMultiple: (skillLines) => {
                    try {
                        if (skillLines && Array.isArray(skillLines)) {
                            // Append new lines to existing template lines
                            this.templateData.lines.push(...skillLines);
                            this.renderMultiLines();
                            this.updateMultiLinePreview();
                            
                            // Show success notification
                            if (window.notificationModal && skillLines.length > 0) {
                                window.notificationModal.alert(
                                    `${skillLines.length} skill line(s) have been added to your template.`,
                                    'success',
                                    'Lines Added Successfully'
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Error updating multi-line:', error);
                    } finally {
                        // Always show wizard again
                        this.show();
                    }
                },
                onClose: () => {
                    // Show wizard if user cancels without saving
                    this.show();
                }
            });
        } catch (error) {
            console.error('Error opening builder:', error);
            this.hideLoadingOverlay();
            this.show();
            if (window.notificationModal) {
                window.notificationModal.alert(
                    'An error occurred while opening the Skill Line Builder. Please try again.',
                    'error',
                    'Error Opening Builder'
                );
            }
        }
    }

    /**
     * Update step UI
     */
    updateStepUI() {
        // Update step number in header
        const stepNumber = document.getElementById('wizardStepNumber');
        const stepName = document.getElementById('wizardStepName');
        const progressFill = document.getElementById('wizardProgressFill');
        
        if (stepNumber) stepNumber.textContent = this.currentStep;
        if (stepName) stepName.textContent = this.currentStep === 1 ? 'Template Details' : 'Build Skills';
        if (progressFill) progressFill.style.width = this.currentStep === 1 ? '50%' : '100%';

        // Show/hide step content
        document.getElementById('wizardStep1').style.display = this.currentStep === 1 ? 'block' : 'none';
        document.getElementById('wizardStep2').style.display = this.currentStep === 2 ? 'block' : 'none';

        // Show/hide navigation buttons
        document.getElementById('wizardBack').style.display = this.currentStep === 2 ? 'flex' : 'none';
        document.getElementById('wizardNext').style.display = this.currentStep === 1 ? 'flex' : 'none';
        document.getElementById('wizardSave').style.display = this.currentStep === 2 ? 'flex' : 'none';
    }

    /**
     * Save template
     */
    async save() {
        try {
            // Collect skill lines from sections (always multi-section mode in UI)
            let skillLines = [];
            const sections = [];
            
            // Collect from sections
            this.templateData.sections.forEach(section => {
                const sectionLines = section.lines.filter(l => l.trim());
                if (sectionLines.length > 0) {
                    sections.push({
                        name: section.name,
                        lines: sectionLines
                    });
                    skillLines.push(...sectionLines);
                }
            });

            // Validate we have at least one skill line
            if (skillLines.length === 0) {
                throw new Error('Template must have at least one skill line');
            }
            
            // Auto-detect structure type based on actual content
            let structureType;
            if (sections.length > 1) {
                structureType = 'multi-section';
            } else if (skillLines.length === 1) {
                structureType = 'single';
            } else {
                structureType = 'multi-line';
            }

            // Create template with context information
            const result = await this.templateManager.createTemplate({
                name: this.templateData.name,
                description: this.templateData.description,
                type: this.templateData.type,
                context: this.templateData.context,
                tags: this.templateData.tags,
                category: this.templateData.category,
                icon: this.templateData.icon,
                skillLines: skillLines,
                sections: sections,
                structure_type: structureType, // Use auto-detected type
                is_official: this.templateData.isOfficial
            });
            if (window.notificationModal) {
                window.notificationModal.alert('Your template has been successfully created and saved!', 'success', 'Template Created');
            }
            
            // Call callback if provided
            if (this.onSaveCallback) {
                this.onSaveCallback(result);
            }
            
            this.close();

        } catch (error) {
            console.error('Failed to save template:', error);
            if (window.notificationModal) {
                window.notificationModal.alert(
                    error.message,
                    'error',
                    'Failed to Save Template'
                );
            }
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        document.getElementById('wizardName').value = '';
        document.getElementById('wizardDescription').value = '';
        document.getElementById('wizardTags').value = '';
        document.getElementById('wizardNameCounter').textContent = '0/50';
        document.getElementById('wizardDescCounter').textContent = '0/500';
        
        this.templateData = {
            name: '',
            description: '',
            structureType: 'multi-section', // Always use multi-section mode (most flexible)
            category: 'combat',
            icon: '⚔️',
            type: 'skill',
            context: 'skill', // 'mob' or 'skill' - affects trigger availability
            tags: [],
            isOfficial: false,
            sections: [],
            lines: [] // For multi-line structure
        };
        
        this.sectionCounter = 0;
    }

    /**
     * Populate step 1 from existing template
     */
    populateStep1(template) {
        document.getElementById('wizardName').value = template.name || '';
        document.getElementById('wizardDescription').value = template.description || '';
        document.getElementById('wizardCategory').value = template.category || 'combat';
        document.getElementById('wizardIcon').value = template.icon || '⚔️';
        document.getElementById('wizardType').value = template.type || 'skill';
        document.getElementById('wizardTags').value = template.tags?.join(', ') || '';
    }

    /**
     * Close wizard
     */
    close() {
        this.cleanup();
        this.hideLoadingOverlay();
        document.getElementById('templateWizardOverlay').style.display = 'none';
        this.currentStep = 1;
        this.resetForm();
        this.updateStepUI();
        
        // Call close callback if provided (e.g., to re-open admin panel)
        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null; // Clear after calling
        }
    }

    /**
     * Hide wizard temporarily with smooth transition
     */
    hide() {
        const overlay = document.getElementById('templateWizardOverlay');
        if (overlay && !this.isHiding) {
            this.isHiding = true;
            overlay.classList.add('wizard-hiding');
            
            // Show loading overlay
            this.showLoadingOverlay('Opening Skill Line Builder...');
            
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.remove('wizard-hiding');
            }, 250); // Match CSS transition duration
        }
    }

    /**
     * Show wizard again with smooth transition and refresh
     */
    show() {
        const overlay = document.getElementById('templateWizardOverlay');
        if (overlay) {
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            this.isHiding = false;
            overlay.style.display = 'flex';
            overlay.classList.add('wizard-showing');
            
            // Use RAF for smooth preview update
            this.schedulePreviewUpdate(() => {
                // Refresh appropriate preview based on structure type
                if (this.templateData.structureType === 'single') {
                    this.updateSinglePreview();
                } else if (this.templateData.structureType === 'multi-line') {
                    this.updateMultiLinePreview();
                } else if (this.templateData.structureType === 'multi-section') {
                    this.updateMultiSectionPreview();
                }
                
                // Show success flash on preview
                this.flashSuccessOnPreview();
            });
            
            setTimeout(() => {
                overlay.classList.remove('wizard-showing');
            }, 300);
        }
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay(message = 'Loading...') {
        // Remove existing overlay if any
        this.hideLoadingOverlay();
        
        const overlay = document.createElement('div');
        overlay.className = 'wizard-loading-overlay';
        overlay.id = 'wizardLoadingOverlay';
        overlay.innerHTML = `
            <div class="wizard-loading-spinner"></div>
            <div class="wizard-loading-text">${message}</div>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('wizardLoadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        }
    }

    /**
     * Flash success animation on preview
     */
    flashSuccessOnPreview() {
        const previewId = this.templateData.structureType === 'single' ? 'singlePreview' :
                         this.templateData.structureType === 'multi-line' ? 'multiPreview' :
                         'multiSectionPreview';
        
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.classList.add('success-flash');
            setTimeout(() => preview.classList.remove('success-flash'), 600);
        }
    }
}

// Global instance
let templateWizard;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateWizard;
}
