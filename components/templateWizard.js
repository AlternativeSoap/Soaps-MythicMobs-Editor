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
            console.error('❌ window.TargeterBrowser class not found!');
        }
        
        // Initialize Trigger Browser
        if (window.TriggerBrowser) {
            this.triggerBrowser = new TriggerBrowser(window.editor);
        } else {
            console.error('❌ window.TriggerBrowser class not found!');
        }
        
        // Initialize Mechanic Browser (needs targeter and trigger browsers)
        if (window.MechanicBrowser) {
            this.mechanicBrowser = new MechanicBrowser(
                this.targeterBrowser,
                this.triggerBrowser,
                null  // Using global conditionBrowser instead
            );
        } else {
            console.error('❌ window.MechanicBrowser class not found!');
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
                <div class="modal-content condition-browser" style="max-width: 700px; max-height: 90vh;">
                    <!-- Header -->
                    <div class="modal-header">
                        <h2 id="wizardTitle">
                            <i class="fas fa-magic"></i>
                            Create Template - Step <span id="wizardStepNumber">1</span>/2
                        </h2>
                        <button class="btn-close" id="wizardClose" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Step Indicator -->
                    <div class="wizard-steps">
                        <div class="wizard-step active" data-step="1">
                            <div class="step-number">1</div>
                            <div class="step-label">Template Details</div>
                        </div>
                        <div class="wizard-step-line"></div>
                        <div class="wizard-step" data-step="2">
                            <div class="step-number">2</div>
                            <div class="step-label">Build Skills</div>
                        </div>
                    </div>
                    
                    <!-- Body -->
                    <div class="condition-browser-body wizard-body" style="padding: 1.5rem; overflow-y: auto; max-height: calc(90vh - 250px);">
                        <!-- STEP 1: Template Details -->
                        <div id="wizardStep1" class="wizard-step-content active">
                            <div class="form-group">
                                <label for="wizardName">
                                    Template Name <span class="required">*</span>
                                    <span class="char-counter" id="wizardNameCounter">0/50</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="wizardName" 
                                    class="form-control"
                                    placeholder="e.g., Epic Boss Combo"
                                    maxlength="50"
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="wizardDescription">
                                    Description <span class="required">*</span>
                                    <span class="char-counter" id="wizardDescCounter">0/500</span>
                                </label>
                                <textarea 
                                    id="wizardDescription" 
                                    class="form-control"
                                    placeholder="Describe what this template does..."
                                    rows="3"
                                    maxlength="500"
                                    required
                                ></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    Structure Type
                                    <i class="fas fa-info-circle" title="Single: one line | Multi-line: multiple lines | Multi-section: multiple named sections" style="cursor: help; opacity: 0.6;"></i>
                                </label>
                                <div class="structure-type-selector">
                                    <button type="button" class="btn btn-structure" data-structure="single">
                                        🎯 Single Line
                                    </button>
                                    <button type="button" class="btn btn-structure active" data-structure="multi-line">
                                        📋 Multi-Line
                                    </button>
                                    <button type="button" class="btn btn-structure" data-structure="multi-section">
                                        📚 Multi-Section
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>
                                    Context
                                    <i class="fas fa-info-circle" title="Mob skills can use triggers (e.g., ~onTimer, ~onDamaged). Regular skills cannot." style="cursor: help; opacity: 0.6;"></i>
                                </label>
                                <div class="context-selector" style="display: flex; gap: 1rem;">
                                    <label style="display: flex; align-items: center; cursor: pointer;">
                                        <input type="radio" name="wizardContext" value="skill" checked style="margin-right: 0.5rem;">
                                        <span>🎭 Regular Skill</span>
                                    </label>
                                    <label style="display: flex; align-items: center; cursor: pointer;">
                                        <input type="radio" name="wizardContext" value="mob" style="margin-right: 0.5rem;">
                                        <span>👾 Mob Skill (with triggers)</span>
                                    </label>
                                </div>
                            </div>

                            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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
                            </div>
                            
                            <div class="form-group">
                                <label for="wizardTags">Tags (optional, comma-separated)</label>
                                <input 
                                    type="text" 
                                    id="wizardTags" 
                                    class="form-control"
                                    placeholder="e.g., fire, boss, aoe"
                                >
                                <small class="form-text">Max 10 tags, each 2-20 characters</small>
                            </div>
                            
                            <!-- Admin Options -->
                            <div id="wizardAdminOptions" style="display: none;">
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; cursor: pointer;">
                                        <input type="checkbox" id="wizardIsOfficial" style="margin-right: 0.5rem;">
                                        <span>Mark as Official Template</span>
                                        <i class="fas fa-crown" style="margin-left: 0.5rem; color: #ffd700;"></i>
                                    </label>
                                    <small class="form-text">Official templates appear at the top and are highlighted</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- STEP 2: Build Skill Lines -->
                        <div id="wizardStep2" class="wizard-step-content" style="display: none;">
                            <div id="skillLinesBuilder" style="width: 100%;"></div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="modal-footer" style="display: flex; justify-content: space-between;">
                        <button class="btn btn-secondary" id="wizardBack" style="display: none;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                            <button class="btn btn-secondary" id="wizardCancel">Cancel</button>
                            <button class="btn btn-primary" id="wizardNext">
                                Next: Build Skills <i class="fas fa-arrow-right"></i>
                            </button>
                            <button class="btn btn-primary" id="wizardSave" style="display: none;">
                                <i class="fas fa-save"></i> Save Template
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
        this.refs.close?.addEventListener('click', () => this.close());
        this.refs.cancel?.addEventListener('click', () => this.close());
        
        // Navigation
        this.refs.next?.addEventListener('click', () => this.nextStep());
        this.refs.back?.addEventListener('click', () => this.previousStep());
        this.refs.save?.addEventListener('click', () => this.save());
        
        // Structure type buttons
        document.querySelectorAll('.btn-structure').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-structure').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.templateData.structureType = e.target.dataset.structure;
            });
        });
        
        // Context radio buttons
        document.querySelectorAll('input[name="wizardContext"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.templateData.context = e.target.value;
                // Auto-set type based on context
                this.templateData.type = e.target.value; // 'mob' or 'skill'
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
    async open(existingTemplate = null, isAdminMode = false, onSave = null, defaultContext = null) {
        this.currentStep = 1;
        this.isAdminMode = isAdminMode;
        this.onSaveCallback = onSave;
        
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
                    console.log(`✅ Auto-selected context: ${defaultContext}`);
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
     * Render step 2 based on structure type
     */
    renderStep2() {
        const builder = document.getElementById('skillLinesBuilder');
        console.log('   skillLinesBuilder element:', builder);
        if (!builder) {
            console.error('❌ skillLinesBuilder not found!');
            return;
        }

        if (this.templateData.structureType === 'single') {
            builder.innerHTML = this.renderSingleLineBuilder();
        } else if (this.templateData.structureType === 'multi-line') {
            builder.innerHTML = this.renderMultiLineBuilder();
        } else if (this.templateData.structureType === 'multi-section') {
            const html = this.renderMultiSectionBuilder();
            console.log('   Generated HTML length:', html.length);
            builder.innerHTML = html;
            console.log('   HTML inserted into builder');
            
            // Verify the button exists in DOM
            setTimeout(() => {
                const btn = document.getElementById('addSectionBtn');
                const list = document.getElementById('multiSectionsList');
                console.log('   Verification after innerHTML:');
                console.log('     addSectionBtn exists:', !!btn);
                console.log('     multiSectionsList exists:', !!list);
            }, 0);
        }

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
            <div class="multi-section-container" style="width: 100%;">
                <!-- Header with global actions -->
                <div class="section-header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="margin: 0;">Sections:</h4>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-primary" id="wizardAddSectionBtn">
                            <i class="fas fa-plus"></i> Add Section
                        </button>
                    </div>
                </div>
                
                <!-- Sections list container -->
                <div id="multiSectionsList" style="width: 100%; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem;"></div>
                
                <!-- Preview -->
                <div class="preview-section" style="margin-top: 1rem;">
                    <h4>Preview (<span id="multiSectionCount">0</span> sections, <span id="multiSectionLineCount">0</span> total lines):</h4>
                    <pre id="multiSectionPreview" class="skill-preview"></pre>
                </div>
            </div>
        `;
    }

    /**
     * Attach step 2 event listeners
     */
    attachStep2EventListeners() {
        const type = this.templateData.structureType;

        if (type === 'single') {
            document.getElementById('singleSkillLine')?.addEventListener('input', () => {
                this.debounce('singlePreview', () => this.updateSinglePreview(), 200);
            });
            document.getElementById('openSingleBuilder')?.addEventListener('click', () => this.openSingleBuilder());
        } else if (type === 'multi-line') {
            document.getElementById('addLineBtn')?.addEventListener('click', () => this.addMultiLine());
            document.getElementById('pasteMultiBtn')?.addEventListener('click', () => this.pasteMultiLines());
            document.getElementById('openMultiBuilder')?.addEventListener('click', () => this.openMultiLineBuilder());
            this.renderMultiLines(); // Initial render
        } else if (type === 'multi-section') {
            // Multi-section listeners
            console.log('   Searching for wizardAddSectionBtn...');
            
            const addBtn = document.getElementById('wizardAddSectionBtn');
            console.log('   wizardAddSectionBtn element:', addBtn);
            console.log('   wizardAddSectionBtn exists:', !!addBtn);
            console.log('   wizardAddSectionBtn parent:', addBtn?.parentElement);
            
            if (addBtn) {
                const listener = () => {
                    this.addSection();
                };
                addBtn.addEventListener('click', listener);
                
                // Test if button is clickable
                console.log('   Button disabled?', addBtn.disabled);
                console.log('   Button style.display:', window.getComputedStyle(addBtn).display);
                console.log('   Button style.pointerEvents:', window.getComputedStyle(addBtn).pointerEvents);
            } else {
                console.error('❌ wizardAddSectionBtn not found in DOM!');
                console.error('   Checking entire skillLinesBuilder:');
                const builder = document.getElementById('skillLinesBuilder');
                if (builder) {
                    console.error('   skillLinesBuilder HTML (first 1000 chars):', builder.innerHTML.substring(0, 1000));
                    console.error('   Looking for buttons in builder:', builder.querySelectorAll('button'));
                }
            }
            
            // Render sections (which calls attachMultiSectionListeners internally)
            console.log('   Calling renderMultiSections()...');
            this.renderMultiSections();
        }
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
        console.log('   Current sections:', this.templateData.sections.length);
        
        const container = document.getElementById('multiSectionsList');
        console.log('   Container element:', container);
        console.log('   Container exists:', !!container);
        
        if (!container) {
            console.error('❌ multiSectionsList container not found!');
            console.error('   Dumping entire skillLinesBuilder:');
            const builder = document.getElementById('skillLinesBuilder');
            if (builder) {
                console.error('   skillLinesBuilder HTML:', builder.innerHTML.substring(0, 500));
            }
            return;
        }

        // Generate HTML for all sections
        const html = this.templateData.sections.map((section, sectionIndex) => {
            const linesHTML = section.lines.length === 0 
                ? `<div class="empty-state" style="text-align: center; padding: 1.5rem; opacity: 0.5; color: var(--text-secondary);">
                       No lines yet<br><small>Click "+ Add Line" or "Open Builder" to start</small>
                   </div>`
                : section.lines.map((line, lineIndex) => `
                    <div class="skill-line-row" data-section="${sectionIndex}" data-line="${lineIndex}">
                        <span class="line-number">${lineIndex + 1}.</span>
                        <input 
                            type="text" 
                            class="skill-line-input" 
                            value="${this.escapeHtml(line)}"
                            placeholder="e.g., damage{a=10} @target"
                            style="font-family: 'Courier New', monospace;"
                        >
                        <button class="btn btn-sm btn-danger btn-delete-line" title="Delete Line">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');

            return `
                <div class="section-card" data-section-index="${sectionIndex}" style="width: 100%;">
                    <!-- Section header with name and delete -->
                    <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: var(--bg-tertiary, #1a1a1a); border-bottom: 1px solid var(--border-color, #2a2a2a);">
                        <input 
                            type="text" 
                            class="section-name-input" 
                            value="${this.escapeHtml(section.name)}"
                            placeholder="Section name (e.g., Skill1)"
                            style="flex: 1; background: transparent; border: 1px solid transparent; color: var(--text-primary); font-size: 1rem; font-weight: 600; padding: 6px 10px; border-radius: 4px;"
                        >
                        <button class="btn btn-sm btn-danger btn-delete-section" title="Delete Section">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <!-- Section body with actions and lines -->
                    <div class="section-body" style="padding: 15px;">
                        <!-- Action buttons -->
                        <div class="section-actions" style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <button class="btn btn-sm btn-primary btn-add-line">
                                <i class="fas fa-plus"></i> Add Line
                            </button>
                            <button class="btn btn-sm btn-secondary btn-paste-lines">
                                <i class="fas fa-paste"></i> Paste Bulk
                            </button>
                            <button class="btn btn-sm btn-primary btn-open-builder">
                                <i class="fas fa-edit"></i> Open Builder
                            </button>
                        </div>
                        
                        <!-- Lines container -->
                        <div class="section-lines" style="display: flex; flex-direction: column; gap: 8px;">
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

            // Get section index from closest section-card
            const card = target.closest('.section-card');
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
                const row = target.closest('.skill-line-row');
                if (row) {
                    const lineIndex = parseInt(row.dataset.line);
                    this.deleteLineFromSection(sectionIndex, lineIndex);
                }
            }
        };

        // Create input handler
        this.multiSectionInputHandler = (e) => {
            if (e.target.classList.contains('section-name-input')) {
                const card = e.target.closest('.section-card');
                if (card) {
                    const sectionIndex = parseInt(card.dataset.sectionIndex);
                    this.templateData.sections[sectionIndex].name = e.target.value;
                    this.debounce('sectionPreview', () => this.updateMultiSectionPreview(), 200);
                }
            } else if (e.target.classList.contains('skill-line-input')) {
                const row = e.target.closest('.skill-line-row');
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
            console.error('❌ SkillLineBuilder not found on window object');
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
        // Update step indicators
        document.querySelectorAll('.wizard-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === this.currentStep);
            step.classList.toggle('completed', stepNum < this.currentStep);
        });

        // Update step number in header
        document.getElementById('wizardStepNumber').textContent = this.currentStep;

        // Show/hide step content
        document.getElementById('wizardStep1').style.display = this.currentStep === 1 ? 'block' : 'none';
        document.getElementById('wizardStep2').style.display = this.currentStep === 2 ? 'block' : 'none';

        // Show/hide navigation buttons
        document.getElementById('wizardBack').style.display = this.currentStep === 2 ? 'block' : 'none';
        document.getElementById('wizardNext').style.display = this.currentStep === 1 ? 'block' : 'none';
        document.getElementById('wizardSave').style.display = this.currentStep === 2 ? 'block' : 'none';
    }

    /**
     * Save template
     */
    async save() {
        try {
            // Collect skill lines based on structure type
            let skillLines = [];
            const sections = [];

            if (this.templateData.structureType === 'single') {
                const line = document.getElementById('singleSkillLine').value.trim();
                if (line) {
                    skillLines = [line];
                    sections.push({ name: 'Skill1', lines: [line] });
                }
            } else if (this.templateData.structureType === 'multi-line') {
                // Collect multi-line content
                skillLines = this.templateData.lines.filter(l => l.trim());
                if (skillLines.length > 0) {
                    sections.push({ name: 'Skills', lines: skillLines });
                }
            } else if (this.templateData.structureType === 'multi-section') {
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
            }

            // Validate we have at least one skill line
            if (skillLines.length === 0) {
                throw new Error('Template must have at least one skill line');
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
                structure_type: this.templateData.structureType,
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
