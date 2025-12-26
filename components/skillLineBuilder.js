/**
 * ===================================
 * SKILL LINE BUILDER - COMPLETE OVERHAUL V2.0
 * ===================================
 * 
 * Modern, performant, context-aware skill line builder
 * 
 * Architecture:
 * - Immutable state management with history
 * - Event delegation for performance
 * - DOM caching
 * - Context-aware (mob vs skill - NO triggers in skills!)
 * - Proper browser integration
 * - Virtual scrolling for large queues
 * - Debounced inputs & throttled renders
 * 
 * @version 2.0.0
 * @date December 2, 2025
 */

class SkillLineBuilder {
    constructor(templateManager = null, templateEditor = null) {
        // Generate unique ID for this instance
        this.instanceId = Math.random().toString(36).substr(2, 9);
        console.log(`🚀 Initializing SkillLineBuilder v2.0 [Instance: ${this.instanceId}]`);
        
        // ========================================
        // DEPENDENCIES
        // ========================================
        this.templateManager = templateManager;
        this.templateEditor = templateEditor;
        
        // ========================================
        // STATE MANAGEMENT
        // ========================================
        this.state = {
            context: 'mob',
            currentTab: 'quick-build',
            isOpen: false,
            isLoading: false,
            isMinimized: false,  // Track minimize state
            activeBrowser: null, // Track which browser is currently open
            
            currentLine: {
                mechanic: null,
                targeter: '@Self',
                trigger: null,
                conditions: [],
                chance: null,
                health: null
            },
            
            queue: [],
            validationErrors: [],
            lastRenderTime: 0
        };
        
        this.stateObservers = [];
        this.stateHistory = [];
        this.historyIndex = -1;
        
        // Store bound event handlers for cleanup
        this.boundHandlers = {
            click: null,
            keydown: null
        };
        this.maxHistory = 50;
        
        // Track last logged context to reduce spam (initialize to match default state.context)
        this.lastLoggedContext = 'mob';
        
        // ========================================
        // BROWSER & CALLBACK REFERENCES
        // ========================================
        this.browsers = {
            mechanic: null,
            targeter: null,
            condition: null,
            trigger: null
        };
        
        this.browserState = {
            mechanicFilter: '',
            targeterFilter: '',
            triggerFilter: '',
            conditionFilter: ''
        };
        
        this.callbacks = {
            onAdd: null,
            onAddMultiple: null,
            onBack: null,
            onClose: null
        };
        
        // ========================================
        // DOM CACHE
        // ========================================
        this.dom = {};
        
        // ========================================
        // PERFORMANCE OPTIMIZATION
        // ========================================
        this.timers = {
            debounce: {},
            throttle: {}
        };
        this.raf = null;
        
        // ========================================
        // INITIALIZATION
        // ========================================
        this.createModal();
        this.cacheDOMElements();
        this.attachEventListeners();
        this.saveState();
    }
    
    // ========================================
    // STATE MANAGEMENT METHODS
    // ========================================
    
    setState(update) {
        const oldState = this.state;
        const newState = typeof update === 'function' 
            ? { ...this.state, ...update(this.state) }  // Merge functional update with existing state
            : { ...this.state, ...update };
        
        if (JSON.stringify(oldState) === JSON.stringify(newState)) return;
        
        // DEBUGGING: Track context changes
        if (oldState.context !== newState.context) {
            console.warn('⚠️ CONTEXT CHANGED in setState!');
            console.warn('  Old context:', oldState.context);
            console.warn('  New context:', newState.context);
            console.warn('  Update type:', typeof update);
            console.warn('  Update:', update);
            console.trace('  Stack trace:');
        }
        
        this.state = newState;
        
        // console.log('🔄 setState called:', {
        //     mechanic: this.state.currentLine?.mechanic,
        //     trigger: this.state.currentLine?.trigger,
        //     targeter: this.state.currentLine?.targeter,
        //     conditions: this.state.currentLine?.conditions?.length || 0
        // });
        
        this.debouncedSaveState();
        this.notifyStateChange(oldState, newState);
        this.scheduleRender();
    }
    
    observeState(callback) {
        this.stateObservers.push(callback);
    }
    
    notifyStateChange(oldState, newState) {
        this.stateObservers.forEach(observer => {
            try {
                observer(oldState, newState);
            } catch (err) {
                console.error('State observer error:', err);
            }
        });
    }
    
    saveState() {
        const stateSnapshot = JSON.parse(JSON.stringify(this.state));
        
        if (this.historyIndex < this.stateHistory.length - 1) {
            this.stateHistory = this.stateHistory.slice(0, this.historyIndex + 1);
        }
        
        this.stateHistory.push(stateSnapshot);
        
        if (this.stateHistory.length > this.maxHistory) {
            this.stateHistory.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    debouncedSaveState() {
        this.debounce('saveState', () => this.saveState(), 300);
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.stateHistory[this.historyIndex]);
        }
    }
    
    redo() {
        if (this.historyIndex < this.stateHistory.length - 1) {
            this.historyIndex++;
            this.restoreState(this.stateHistory[this.historyIndex]);
        }
    }
    
    restoreState(stateSnapshot) {
        this.state = JSON.parse(JSON.stringify(stateSnapshot));
        this.notifyStateChange({}, this.state);
        this.render();
    }
    
    // ========================================
    // PERFORMANCE UTILITIES
    // ========================================
    
    debounce(key, fn, delay) {
        if (this.timers.debounce[key]) {
            clearTimeout(this.timers.debounce[key]);
        }
        
        this.timers.debounce[key] = setTimeout(() => {
            fn();
            delete this.timers.debounce[key];
        }, delay);
    }
    
    throttle(key, fn, delay) {
        if (this.timers.throttle[key]) return;
        
        this.timers.throttle[key] = setTimeout(() => {
            fn();
            delete this.timers.throttle[key];
        }, delay);
    }
    
    scheduleRender() {
        if (this.raf) cancelAnimationFrame(this.raf);
        
        this.raf = requestAnimationFrame(() => {
            const startTime = performance.now();
            this.render();
            const renderTime = performance.now() - startTime;
            
            // Update state directly without triggering re-render (performance tracking only)
            this.state.lastRenderTime = renderTime;
            
            if (renderTime > 16.67) {
                console.warn(`⚠️ Slow render: ${renderTime.toFixed(2)}ms`);
            }
            
            this.raf = null;
        });
    }
    
    // ========================================
    // DOM CREATION
    // ========================================
    
    createModal() {
        const modalHTML = `
            <div id="skillLineBuilderOverlay" class="skill-builder-overlay" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="skillBuilderTitle">
                <div class="skill-builder-modal" role="document">
                    <!-- Header -->
                    <div class="skill-builder-header">
                        <button class="skill-builder-btn-back" id="skillBuilderBack" style="display: none;" aria-label="Go back" title="Go back">
                            <i class="fas fa-arrow-left" aria-hidden="true"></i>
                        </button>
                        <div class="skill-builder-title">
                            <i class="fas fa-hammer" aria-hidden="true"></i>
                            <h2 id="skillBuilderTitle">Skill Line Builder</h2>
                            <span class="skill-builder-context-badge" id="contextBadge" role="status" aria-live="polite">Mob Context</span>
                        </div>
                        <button class="skill-builder-btn-close" id="skillBuilderClose" aria-label="Close modal" title="Close (Esc)">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                        <button class="skill-builder-btn-help" id="skillBuilderHelp" aria-label="Show keyboard shortcuts" title="Keyboard shortcuts (F1)">
                            <i class="fas fa-keyboard" aria-hidden="true"></i>
                        </button>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="skill-builder-tabs">
                        <button class="skill-builder-tab active" data-tab="quick-build">
                            <i class="fas fa-magic"></i>
                            <span>Quick Build</span>
                        </button>
                    </div>
                    
                    <!-- Body -->
                    <div class="skill-builder-body">
                        ${this.createQuickBuildTab()}
                    </div>
                    
                    <!-- Queue Panel -->
                    <div class="skill-builder-queue-panel" id="queuePanel" style="display: none;">
                        <div class="queue-header">
                            <h3><i class="fas fa-list"></i> Queue (<span id="queueCount">0</span>)</h3>
                            <div class="queue-header-actions">
                                <button class="btn-icon" id="toggleQueue" title="Minimize/Expand queue"><i class="fas fa-chevron-right"></i></button>
                                <button class="btn-icon" id="clearQueue" title="Clear entire queue"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="queue-list" id="queueList"></div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="skill-builder-footer">
                        <div class="footer-info">
                            <span id="footerInfo">Select components to build your skill line</span>
                            <span class="footer-perf" id="footerPerf"></span>
                        </div>
                        <div class="footer-actions" style="display: flex; gap: 12px; align-items: center;">
                            <button class="btn btn-secondary" id="btnCancel" style="min-width: 100px; padding: 10px 20px;">Cancel</button>
                            <button class="btn btn-info" id="btnSaveTemplate" style="display: none; min-width: 160px; padding: 10px 20px;">
                                <i class="fas fa-save" style="margin-right: 6px;"></i>
                                Save as Template
                            </button>
                            <button class="btn btn-primary" id="btnAdd" disabled style="min-width: 140px; padding: 10px 24px; font-size: 14px;">
                                <i class="fas fa-plus" style="margin-right: 6px;"></i>
                                <span id="btnAddText">Add Skill Line</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
    }
    
    createQuickBuildTab() {
        return `
            <div class="skill-builder-tab-content active" data-tab-content="quick-build">
                <div class="quick-build-container">
                    <div class="components-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-puzzle-piece"></i> Components</h3>
                            <p>Build your skill line step by step</p>
                        </div>
                        
                        <div class="components-list">
                            ${this.createMechanicCard()}
                            ${this.createTargeterCard()}
                            ${this.createTriggerCard()}
                            ${this.createConditionCard()}
                            ${this.createModifiers()}
                        </div>
                    </div>
                    
                    <div class="preview-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-eye"></i> Preview</h3>
                            <button class="btn btn-sm btn-icon" id="btnCopyPreview" disabled title="Copy skill line to clipboard">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        
                        <div class="preview-container">
                            <div class="preview-code" id="previewCode">
                                <span class="preview-placeholder">
                                    <i class="fas fa-hammer"></i>
                                    <p>Your skill line will appear here</p>
                                    <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(124, 58, 237, 0.1); border-radius: 6px; font-size: 0.75rem; color: var(--text-tertiary);">
                                        <strong style="color: var(--accent-primary); display: block; margin-bottom: 0.5rem;">💡 Quick Tips:</strong>
                                        <div style="text-align: left; line-height: 1.6;">
                                            • Start by selecting a <strong>Mechanic</strong><br>
                                            • Use <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 0.7rem;">Alt+M</kbd> for mechanics browser<br>
                                            • Use <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 0.7rem;">Alt+T</kbd> for targeters<br>
                                            • Press <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 0.7rem;">Ctrl+Enter</kbd> to add to queue
                                        </div>
                                    </div>
                                </span>
                            </div>
                        </div>
                        
                        <div class="preview-validation" id="previewValidation"></div>
                        
                        <div class="preview-actions">
                            <button class="btn btn-secondary" id="btnReset" title="Reset current line">
                                <i class="fas fa-undo"></i> Reset
                            </button>
                            <button class="btn btn-primary" id="btnAddToQueue" disabled title="Add to queue (Ctrl+Enter)">
                                <i class="fas fa-plus"></i> Add to Queue <span class="kbd-hint">Ctrl+⏎</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createMechanicCard() {
        return `
            <div class="component-card required" id="mechanicCard">
                <div class="component-header">
                    <div class="component-icon">⚙️</div>
                    <div class="component-info">
                        <h4>Mechanic</h4>
                        <span class="component-badge required">Required</span>
                    </div>
                    <div class="component-status" id="mechanicStatus">
                        <i class="fas fa-circle"></i>
                    </div>
                </div>
                <div class="component-actions">
                    <button class="btn btn-sm btn-primary" id="btnSelectMechanic" title="Open mechanic browser (Alt+M)">
                        <i class="fas fa-search"></i> Mechanics
                    </button>
                    <button class="btn btn-sm btn-icon" id="btnClearMechanic" style="display: none;" title="Clear selected mechanic">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    createTargeterCard() {
        return `
            <div class="component-card" id="targeterCard">
                <div class="component-header">
                    <div class="component-icon">🎯</div>
                    <div class="component-info">
                        <h4>Targeter</h4>
                        <span class="component-badge optional">Optional</span>
                    </div>
                    <div class="component-status filled" id="targeterStatus">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
                <div class="component-actions">
                    <button class="btn btn-sm btn-primary" id="btnSelectTargeter" title="Open targeter browser (Alt+T)">
                        <i class="fas fa-search"></i> Targeters
                    </button>
                    <button class="btn btn-sm btn-icon" id="btnClearTargeter" style="display: none;" title="Reset to @Self">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    createTriggerCard() {
        return `
            <div class="component-card" id="triggerCard" style="display: none;">
                <div class="component-header">
                    <div class="component-icon">⚡</div>
                    <div class="component-info">
                        <h4>Trigger</h4>
                        <span class="component-badge optional">Mob Only</span>
                    </div>
                    <div class="component-status" id="triggerStatus">
                        <i class="fas fa-circle"></i>
                    </div>
                </div>
                <div class="component-actions">
                    <button class="btn btn-sm btn-primary" id="btnSelectTrigger" title="Open trigger browser (Mob context only)">
                        <i class="fas fa-bolt"></i> Triggers
                    </button>
                    <button class="btn btn-sm btn-icon" id="btnClearTrigger" style="display: none;" title="Remove trigger">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    createConditionCard() {
        return `
            <div class="component-card" id="conditionCard">
                <div class="component-header">
                    <div class="component-icon">❓</div>
                    <div class="component-info">
                        <h4>Inline Conditions</h4>
                        <span class="component-badge optional">Optional</span>
                        <p style="color: #888; font-size: 10px; margin: 4px 0 0 0; font-style: italic;">Prefix: <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-size: 9px;">?</code> <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-size: 9px;">?!</code> <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-size: 9px;">?~</code> <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-size: 9px;">?~!</code></p>
                    </div>
                    <div class="component-status" id="conditionStatus">
                        <i class="fas fa-circle"></i>
                    </div>
                </div>
                <div class="component-actions">
                    <button class="btn btn-sm btn-primary" id="btnAddCondition" title="Add inline condition to skill line (Alt+C)">
                        <i class="fas fa-plus"></i> Add Condition
                    </button>
                </div>
                <div class="conditions-list" id="conditionsList" style="display: none;"></div>
            </div>
        `;
    }
    
    createModifiers() {
        return `
            <div class="modifiers-container">
                <div class="modifier-field">
                    <label for="chanceInput">
                        <i class="fas fa-dice"></i> Chance (0-1)
                    </label>
                    <input type="number" id="chanceInput" min="0" max="1" step="0.01" placeholder="e.g. 0.5">
                </div>
                <div class="modifier-field">
                    <label for="healthInput">
                        <i class="fas fa-heart"></i> Health Modifier
                    </label>
                    <input type="text" id="healthInput" placeholder="e.g. >50% or <0.5">
                </div>
            </div>
        `;
    }
    
    createBulkTab() {
        return `
            <div class="skill-builder-tab-content" data-tab-content="bulk">
                <div class="bulk-container">
                    <div class="bulk-header">
                        <div class="bulk-info">
                            <h3><i class="fas fa-file-import"></i> Bulk Import</h3>
                            <p>Paste multiple skill lines</p>
                        </div>
                        <div class="bulk-stats" id="bulkStats">
                            <div class="stat"><span class="stat-label">Lines:</span> <span id="bulkTotal">0</span></div>
                            <div class="stat success"><span class="stat-label">Valid:</span> <span id="bulkValid">0</span></div>
                            <div class="stat error"><span class="stat-label">Invalid:</span> <span id="bulkInvalid">0</span></div>
                        </div>
                    </div>
                    
                    <div class="bulk-editor">
                        <textarea id="bulkInput" class="bulk-textarea" placeholder="Paste skill lines here..." spellcheck="false"></textarea>
                    </div>
                    
                    <div class="bulk-validation" id="bulkValidation"></div>
                    
                    <div class="bulk-actions">
                        <button class="btn btn-secondary" id="btnClearBulk" title="Clear all bulk input">
                            <i class="fas fa-trash"></i> Clear
                        </button>
                        <button class="btn btn-secondary" id="btnValidateBulk" title="Validate YAML syntax and check for errors">
                            <i class="fas fa-check"></i> Validate
                        </button>
                        <button class="btn btn-primary" id="btnImportBulk" disabled title="Import validated lines to queue">
                            <i class="fas fa-file-import"></i> Import Valid Lines
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // DOM CACHING
    // ========================================
    
    cacheDOMElements() {
        const get = id => document.getElementById(id);
        const qs = sel => document.querySelector(sel);
        const qsa = sel => document.querySelectorAll(sel);
        
        this.dom = {
            overlay: get('skillLineBuilderOverlay'),
            modal: qs('.skill-builder-modal'),
            contextBadge: get('contextBadge'),
            
            // Tabs
            tabButtons: qsa('.skill-builder-tab'),
            tabContents: qsa('.skill-builder-tab-content'),
            
            // Component Cards & Values
            mechanicCard: get('mechanicCard'),
            mechanicStatus: get('mechanicStatus'),
            
            targeterCard: get('targeterCard'),
            targeterStatus: get('targeterStatus'),
            
            triggerCard: get('triggerCard'),
            triggerStatus: get('triggerStatus'),
            
            conditionCard: get('conditionCard'),
            conditionsList: get('conditionsList'),
            conditionStatus: get('conditionStatus'),
            
            // Inputs
            chanceInput: get('chanceInput'),
            healthInput: get('healthInput'),
            
            // Preview
            preview: get('previewCode'),
            previewValidation: get('previewValidation'),
            
            // Queue
            queuePanel: get('queuePanel'),
            queueList: get('queueList'),
            queueCount: get('queueCount'),
            toggleQueueBtn: get('toggleQueue'),
            
            // Footer
            footerInfo: get('footerInfo'),
            footerPerf: get('footerPerf'),
            
            // Buttons
            btnAdd: get('btnAdd'),
            btnAddText: get('btnAddText'),
            btnSaveTemplate: get('btnSaveTemplate'),
            btnClose: get('skillBuilderClose'),
            btnBack: get('skillBuilderBack'),
            btnCopyPreview: get('btnCopyPreview'),
            btnAddToQueue: get('btnAddToQueue'),
            btnReset: get('btnReset'),
            
            // Bulk
            bulkInput: get('bulkInput'),
            bulkValidation: get('bulkValidation'),
            bulkTotal: get('bulkTotal'),
            bulkValid: get('bulkValid'),
            bulkInvalid: get('bulkInvalid')
        };
        
        if (window.DEBUG_MODE) {
        }
    }
    
    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    attachEventListeners() {
        // Store bound handlers for cleanup
        this.boundHandlers.click = this.handleClick.bind(this);
        this.boundHandlers.keydown = this.handleKeydown.bind(this);
        
        // Event delegation on overlay
        this.dom.overlay.addEventListener('click', this.boundHandlers.click);
        
        // Input events (debounced)
        if (this.dom.chanceInput) {
            this.dom.chanceInput.addEventListener('input', () => {
                this.debounce('chanceInput', () => {
                    this.updateChance(this.dom.chanceInput.value);
                }, 150);
            });
        }
        
        if (this.dom.healthInput) {
            this.dom.healthInput.addEventListener('input', () => {
                this.debounce('healthInput', () => {
                    this.updateHealth(this.dom.healthInput.value);
                }, 150);
            });
        }
        
        if (this.dom.bulkInput) {
            this.dom.bulkInput.addEventListener('input', () => {
                this.debounce('bulkInput', () => {
                    this.updateBulkStats();
                }, 300);
            });
        }
        
        // Close on overlay click
        this.dom.overlay.addEventListener('click', (e) => {
            if (e.target === this.dom.overlay) this.close();
        });
        
        // Keyboard shortcuts (attached to document but checks if builder is open)
        document.addEventListener('keydown', this.boundHandlers.keydown);
    }
    
    handleClick(e) {
        const target = e.target.closest('button');
        if (!target) {
            if (window.DEBUG_MODE) {
            }
            return;
        }
        
        const id = target.id;
        
        const actions = {
            // Header
            'skillBuilderClose': () => this.close(),
            'btnCancel': () => this.close(),
            'skillBuilderBack': () => this.handleBack(),
            'skillBuilderHelp': () => this.showKeyboardShortcuts(),
            
            // Component Selection
            'btnSelectMechanic': () => this.openMechanicBrowser(),
            'btnClearMechanic': () => this.clearMechanic(),
            'btnSelectTargeter': () => this.openTargeterBrowser(),
            'btnClearTargeter': () => this.clearTargeter(),
            'btnSelectTrigger': () => this.openTriggerBrowser(),
            'btnClearTrigger': () => this.clearTrigger(),
            'btnAddCondition': () => this.openConditionEditor(),
            
            // Preview
            'btnCopyPreview': () => this.copyPreview(),
            'btnReset': () => this.resetCurrentLine(),
            'btnAddToQueue': () => this.addCurrentLineToQueue(),
            
            // Queue
            'toggleQueue': () => this.toggleQueuePanel(),
            'clearQueue': () => this.clearQueue(),
            
            // Footer
            'btnAdd': () => this.processQueue(),
            'btnSaveTemplate': () => this.showTemplateSaveDialog(),
            
            // Bulk
            'btnClearBulk': () => this.clearBulk(),
            'btnValidateBulk': () => this.validateBulk(),
            'btnImportBulk': () => this.importBulk()
        };
        
        if (actions[id]) {
            actions[id]();
        }
        
        // Handle dynamic elements
        if (target.classList.contains('condition-chip-remove')) {
            this.removeCondition(parseInt(target.dataset.index));
        }
        
        if (target.classList.contains('queue-item-remove')) {
            this.removeFromQueue(parseInt(target.dataset.index));
        }
        
        if (target.classList.contains('skill-builder-tab')) {
            this.switchTab(target.dataset.tab);
        }
    }
    
    handleKeydown(e) {
        // Only handle if builder is open AND not minimized
        if (!this.state.isOpen) return;
        if (this.dom.overlay && this.dom.overlay.classList.contains('minimized')) return;
        if (this.dom.overlay && this.dom.overlay.style.display === 'none') return;
        
        // Close on Escape
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }
        
        // Undo/Redo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
            return;
        }
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            this.redo();
            return;
        }
        
        // Quick Add to Queue (Ctrl+Enter)
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!this.dom.btnAddToQueue.disabled) this.addCurrentLineToQueue();
            return;
        }
        
        // Tab Navigation (Ctrl+Tab / Ctrl+Shift+Tab)
        if (e.ctrlKey && e.key === 'Tab') {
            e.preventDefault();
            const tabs = ['quick-build', 'bulk-import'];
            const currentIdx = tabs.indexOf(this.state.activeTab);
            const nextIdx = e.shiftKey 
                ? (currentIdx - 1 + tabs.length) % tabs.length
                : (currentIdx + 1) % tabs.length;
            this.switchTab(tabs[nextIdx]);
            return;
        }
        
        // Quick Browser Access
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            this.openMechanicBrowser();
            return;
        }
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            this.openTargeterBrowser();
            return;
        }
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            this.openConditionEditor();
            return;
        }
        
        // Toggle Queue Panel (Ctrl+Q)
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            this.toggleQueuePanel();
            return;
        }
        
        // Show Keyboard Shortcuts (F1)
        if (e.key === 'F1') {
            e.preventDefault();
            this.showKeyboardShortcuts();
            return;
        }
    }
    
    /**
     * Show keyboard shortcuts help
     */
    showKeyboardShortcuts() {
        const shortcuts = [
            { keys: 'Esc', description: 'Close modal' },
            { keys: 'Ctrl+Z', description: 'Undo' },
            { keys: 'Ctrl+Y / Ctrl+Shift+Z', description: 'Redo' },
            { keys: 'Ctrl+Enter', description: 'Add line to queue' },
            { keys: 'Ctrl+Tab', description: 'Next tab' },
            { keys: 'Ctrl+Shift+Tab', description: 'Previous tab' },
            { keys: 'Alt+M', description: 'Open mechanic browser' },
            { keys: 'Alt+T', description: 'Open targeter browser' },
            { keys: 'Alt+C', description: 'Open condition editor' },
            { keys: 'Ctrl+Q', description: 'Toggle queue panel' },
            { keys: 'F1', description: 'Show this help' }
        ];
        
        const shortcutsHTML = shortcuts.map(s => `
            <tr>
                <td><kbd>${s.keys}</kbd></td>
                <td>${s.description}</td>
            </tr>
        `).join('');
        
        const helpModal = document.createElement('div');
        helpModal.className = 'keyboard-shortcuts-modal';
        helpModal.innerHTML = `
            <div class="shortcuts-overlay"></div>
            <div class="shortcuts-panel">
                <div class="shortcuts-header">
                    <h3><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h3>
                    <button class="btn-close-shortcuts" aria-label="Close shortcuts">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="shortcuts-body">
                    <table class="shortcuts-table">
                        <thead>
                            <tr>
                                <th>Keys</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${shortcutsHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        const closeHelp = () => {
            helpModal.classList.add('closing');
            setTimeout(() => helpModal.remove(), 300);
        };
        
        helpModal.querySelector('.btn-close-shortcuts').addEventListener('click', closeHelp);
        helpModal.querySelector('.shortcuts-overlay').addEventListener('click', closeHelp);
        
        setTimeout(() => helpModal.classList.add('show'), 10);
    }
    
    /**
     * Toggle queue panel collapsed state (slides to the side)
     */
    toggleQueuePanel() {
        if (!this.dom.queuePanel) {
            console.warn('⚠️ Queue panel not found!');
            return;
        }
        
        const isCollapsed = this.dom.queuePanel.classList.toggle('collapsed');
        
        // Update toggle button icon
        if (this.dom.toggleQueueBtn) {
            const icon = this.dom.toggleQueueBtn.querySelector('i');
            if (icon) {
                icon.className = isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            }
        } else {
            console.warn('⚠️ Toggle button not found!');
        }
    }
    
    /**
     * Trap focus within modal for accessibility
     */
    trapFocus() {
        if (!this.dom.modal) return;
        
        const focusableElements = this.dom.modal.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        this.dom.modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    open(options = {}) {
        
        // Re-cache DOM elements to ensure fresh references (fixes re-open bug)
        this.cacheDOMElements();
        
        if (!this.dom.overlay) {
            console.error('❌ Overlay element not found! Cannot open Skill Line Builder.');
            return;
        }
        
        // Reset state completely when opening (fresh start)
        this.setState({
            context: options.context || 'skill',
            isOpen: true,
            isMinimized: false,
            activeBrowser: null,
            currentLine: {
                mechanic: null,
                targeter: '@Self',
                trigger: null,
                conditions: [],
                chance: null,
                health: null
            },
            queue: [],
            validationErrors: []
        });
        
        this.callbacks = {
            onAdd: options.onAdd || null,
            onAddMultiple: options.onAddMultiple || null,
            onBack: options.onBack || null,
            onClose: options.onClose || null
        };
        
        // Accept browser instances from parent editor if provided
        if (options.mechanicBrowser) this.browsers.mechanic = options.mechanicBrowser;
        if (options.targeterBrowser) this.browsers.targeter = options.targeterBrowser;
        if (options.triggerBrowser) this.browsers.trigger = options.triggerBrowser;
        // conditionEditor removed - using global conditionBrowserV2
        if (options.templateSelector) this.templateSelector = options.templateSelector;
        
        // Ensure overlay is not minimized
        this.dom.overlay.classList.remove('minimized');
        this.dom.overlay.style.display = 'flex';
        this.dom.overlay.style.opacity = '1';
        this.dom.overlay.style.pointerEvents = 'auto';
        
        this.updateContextUI();
        this.render();
        
        // Setup focus trap
        this.trapFocus();
        
        setTimeout(() => {
            const firstBtn = this.dom.overlay.querySelector('.btn-primary');
            if (firstBtn) firstBtn.focus();
        }, 100);
    }
    
    close() {
        
        this.setState({ isOpen: false });
        this.dom.overlay.style.display = 'none';
        
        if (this.callbacks.onClose) this.callbacks.onClose();
        this.cleanup();
    }
    
    minimize() {
        this.setState({ isMinimized: true });
        this.dom.overlay.classList.add('minimized');
        
        // Add visual feedback that we're waiting
        if (this.dom.overlay) {
            this.dom.overlay.style.opacity = '0.3';
            this.dom.overlay.style.pointerEvents = 'none';
        }
    }
    
    restore() {
        this.setState({ isMinimized: false, activeBrowser: null });
        this.dom.overlay.classList.remove('minimized');
        
        // Restore full visibility, interaction, and z-index
        if (this.dom.overlay) {
            this.dom.overlay.style.opacity = '1';
            this.dom.overlay.style.pointerEvents = 'auto';
            this.dom.overlay.style.zIndex = '10000'; // Restore original z-index
        }
        
        // Focus back on builder
        setTimeout(() => {
            if (this.dom.overlay && this.dom.overlay.style.display !== 'none') {
                const firstInput = this.dom.overlay.querySelector('input, button');
                if (firstInput) firstInput.focus();
            }
        }, 100);
    }
    
    setContext(context) {
        if (context !== 'mob' && context !== 'skill') {
            console.error('Invalid context:', context);
            return;
        }
        
        this.setState({ context });
        this.updateContextUI();
    }
    
    updateContextUI() {
        const isMob = this.state.context === 'mob';
        
        if (this.dom.contextBadge) {
            this.dom.contextBadge.textContent = isMob ? 'Mob Context' : 'Skill Context';
            this.dom.contextBadge.className = `skill-builder-context-badge ${isMob ? 'context-mob' : 'context-skill'}`;
        }
        
        if (this.dom.triggerCard) {
            this.dom.triggerCard.style.display = isMob ? 'block' : 'none';
        }
        
        console.log(`✅ Context: ${this.state.context}`);
    }
    
    destroy() {
        this.cleanup();
        if (this.dom.overlay) this.dom.overlay.remove();
        this.dom = {};
        this.browsers = {};
        this.callbacks = {};
    }
    
    cleanup() {
        // Clear timers
        Object.values(this.timers.debounce).forEach(t => clearTimeout(t));
        Object.values(this.timers.throttle).forEach(t => clearTimeout(t));
        this.timers = { debounce: {}, throttle: {} };
        
        // Cancel animation frame
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
        
        // Clean up virtual scroll listener
        if (this.virtualScrollListener && this.dom.queueList) {
            this.dom.queueList.removeEventListener('scroll', this.virtualScrollListener);
            this.virtualScrollListener = null;
        }
        
        // DO NOT remove main event listeners - they should persist across open/close cycles
        // Removing them causes buttons to become unresponsive after reopening
        console.log('🧹 Cleanup complete (event listeners preserved)');
    }
    
    // ========================================
    // RENDERING
    // ========================================
    
    render() {
        // console.log('🎨 render() called - updating all displays');
        this.updateComponentsDisplay();
        this.updatePreview();
        this.updateQueueDisplay();
        this.updateFooter();
        console.log('✅ render() complete');
    }
    
    updateComponentsDisplay() {
        const { currentLine } = this.state;
        const hasMechanic = currentLine.mechanic !== null;
        
        // Mechanic
        if (currentLine.mechanic) {
            this.dom.mechanicStatus.classList.add('filled');
            this.dom.mechanicCard.classList.add('filled');
            const btnClear = document.getElementById('btnClearMechanic');
            if (btnClear) btnClear.style.display = 'block';
            // Hide the "Required" badge when mechanic is filled
            const requiredBadge = this.dom.mechanicCard.querySelector('.component-badge.required');
            if (requiredBadge) requiredBadge.style.display = 'none';
        } else {
            this.dom.mechanicStatus.classList.remove('filled');
            this.dom.mechanicCard.classList.remove('filled');
            const btnClear = document.getElementById('btnClearMechanic');
            if (btnClear) btnClear.style.display = 'none';
            // Show the "Required" badge when mechanic is empty
            const requiredBadge = this.dom.mechanicCard.querySelector('.component-badge.required');
            if (requiredBadge) requiredBadge.style.display = 'inline-block';
        }
        
        // Enable/disable components based on mechanic selection
        const btnTargeter = document.getElementById('btnSelectTargeter');
        const btnCondition = document.getElementById('btnAddCondition');
        const btnTrigger = document.getElementById('btnSelectTrigger');
        
        if (btnTargeter) {
            btnTargeter.disabled = !hasMechanic;
        }
        if (btnCondition) {
            btnCondition.disabled = !hasMechanic;
        }
        if (this.dom.chanceInput) this.dom.chanceInput.disabled = !hasMechanic;
        if (this.dom.healthInput) this.dom.healthInput.disabled = !hasMechanic;
        
        // Trigger button (mob context only)
        if (this.state.context === 'mob' && btnTrigger) {
            btnTrigger.disabled = !hasMechanic;
        }
        
        // Visual feedback: Add/remove disabled class on cards
        if (this.dom.targeterCard) {
            this.dom.targeterCard.classList.toggle('component-disabled', !hasMechanic);
            this.dom.targeterCard.style.opacity = hasMechanic ? '1' : '0.5';
            this.dom.targeterCard.style.pointerEvents = hasMechanic ? 'auto' : 'none';
        }
        if (this.dom.conditionCard) {
            this.dom.conditionCard.classList.toggle('component-disabled', !hasMechanic);
            this.dom.conditionCard.style.opacity = hasMechanic ? '1' : '0.5';
            this.dom.conditionCard.style.pointerEvents = hasMechanic ? 'auto' : 'none';
        }
        if (this.state.context === 'mob' && this.dom.triggerCard) {
            this.dom.triggerCard.classList.toggle('component-disabled', !hasMechanic);
            this.dom.triggerCard.style.opacity = hasMechanic ? '1' : '0.5';
            this.dom.triggerCard.style.pointerEvents = hasMechanic ? 'auto' : 'none';
        }
        
        // Targeter
        if (currentLine.targeter && currentLine.targeter !== '@Self') {
            this.dom.targeterCard.classList.add('filled');
            document.getElementById('btnClearTargeter').style.display = 'block';
        } else {
            this.dom.targeterCard.classList.remove('filled');
            document.getElementById('btnClearTargeter').style.display = 'none';
        }
        
        // Trigger
        if (currentLine.trigger) {
            this.dom.triggerStatus.classList.add('filled');
            this.dom.triggerCard.classList.add('filled');
            document.getElementById('btnClearTrigger').style.display = 'block';
        } else {
            this.dom.triggerStatus.classList.remove('filled');
            this.dom.triggerCard.classList.remove('filled');
            document.getElementById('btnClearTrigger').style.display = 'none';
        }
        
        // Conditions - separate inline and regular
        if (currentLine.conditions && currentLine.conditions.length > 0) {
            const inlineConditions = currentLine.conditions.filter(c => c.usageMode === 'inline' || !c.usageMode);
            const regularConditions = currentLine.conditions.filter(c => c.usageMode === 'regular');
            const targeterConditions = currentLine.conditions.filter(c => c.usageMode === 'targeter');
            
            const parts = [];
            if (inlineConditions.length > 0) parts.push(`${inlineConditions.length} inline`);
            if (regularConditions.length > 0) parts.push(`${regularConditions.length} regular`);
            if (targeterConditions.length > 0) parts.push(`${targeterConditions.length} targeter`);
            
            this.dom.conditionStatus.classList.add('filled');
            this.dom.conditionCard.classList.add('filled');
            
            this.dom.conditionsList.style.display = 'block';
            let listHTML = '';
            
            // Show inline conditions
            if (inlineConditions.length > 0) {
                listHTML += inlineConditions.map((c, i) => {
                    const actualIndex = currentLine.conditions.indexOf(c);
                    const displayText = c.fullString || c.name || String(c);
                    const prefix = c.prefix || '?';
                    const isTrigger = prefix.includes('~');
                    const badgeColor = isTrigger ? '#9C27B0' : '#2196F3';
                    const badgeLabel = isTrigger ? 'trigger' : 'caster';
                    
                    return `
                        <div class="condition-chip" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 6px; margin: 4px 4px 4px 0; border: 1px solid rgba(255,255,255,0.1);">
                            <span style="background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; font-family: monospace;">${this.escapeHtml(prefix)}</span>
                            <span style="font-family: 'Fira Code', monospace; font-size: 12px;">${this.escapeHtml(displayText.replace(prefix, ''))}</span>
                            <button class="condition-chip-remove" data-index="${actualIndex}" style="background: none; border: none; color: #e74c3c; cursor: pointer; padding: 2px 4px; margin-left: 4px; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                                <i class="fas fa-times" style="font-size: 11px;"></i>
                            </button>
                        </div>
                    `;
                }).join('');
            }
            
            // Show regular conditions grouped by section
            if (regularConditions.length > 0) {
                const sections = {
                    'Conditions': regularConditions.filter(c => c.sectionType === 'Conditions'),
                    'TargetConditions': regularConditions.filter(c => c.sectionType === 'TargetConditions'),
                    'TriggerConditions': regularConditions.filter(c => c.sectionType === 'TriggerConditions')
                };
                
                for (const [sectionName, conditions] of Object.entries(sections)) {
                    if (conditions.length > 0) {
                        listHTML += `<div style="margin-top: 8px; margin-bottom: 4px;"><strong style="font-size: 11px; color: #888;">${sectionName}:</strong></div>`;
                        listHTML += conditions.map(c => {
                            const actualIndex = currentLine.conditions.indexOf(c);
                            return `
                                <div class="condition-chip" style="background: #e8f5e9;">
                                    <span style="font-size: 11px;">- ${this.escapeHtml((c.fullString || c.name) + ' ' + c.action)}</span>
                                    <button class="condition-chip-remove" data-index="${actualIndex}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        }).join('');
                    }
                }
            }
            
            // Show targeter conditions
            if (targeterConditions.length > 0) {
                listHTML += '<div style="margin-top: 8px; margin-bottom: 4px;"><strong style="font-size: 11px; color: #888;">Targeter:</strong></div>';
                listHTML += targeterConditions.map(c => {
                    const actualIndex = currentLine.conditions.indexOf(c);
                    return `
                        <div class="condition-chip" style="background: #fff3cd;">
                            <span style="font-size: 11px;">- ${this.escapeHtml((c.fullString || c.name) + ' ' + c.action)}</span>
                            <button class="condition-chip-remove" data-index="${actualIndex}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                }).join('');
            }
            
            console.log('🔍 Setting conditionsList HTML (length:', listHTML.length, '):', listHTML.substring(0, 200));
            this.dom.conditionsList.innerHTML = listHTML;
            console.log('🔍 conditionsList after setting innerHTML:', this.dom.conditionsList.innerHTML.substring(0, 200));
        } else {
            this.dom.conditionStatus.classList.remove('filled');
            this.dom.conditionCard.classList.remove('filled');
            this.dom.conditionsList.style.display = 'none';
        }
    }
    updatePreview() {
        // RAF throttling for smooth 60fps performance
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(() => {
            const line = this.generateSkillLine();
            
            if (line) {
                // Show skill line with "- " prefix for visual accuracy (matches YAML output)
                this.dom.preview.innerHTML = `<code>- ${this.escapeHtml(line)}</code>`;
                
                // Context-aware button state validation
                const hasMechanic = this.state.currentLine.mechanic !== null;
                const hasTrigger = this.state.currentLine.trigger !== null;
                const canAddToQueue = this.state.context === 'skill' 
                    ? hasMechanic 
                    : (hasMechanic && hasTrigger);
                
                this.dom.btnAddToQueue.disabled = !canAddToQueue;
                this.dom.btnCopyPreview.disabled = false;
                
                // Add highlight animation for new content
                this.dom.preview.parentElement.classList.add('new-content');
                setTimeout(() => {
                    this.dom.preview.parentElement.classList.remove('new-content');
                }, 600);
                
                // Auto-scroll to show new content (smooth)
                const previewContainer = this.dom.preview.closest('.preview-container');
                if (previewContainer && previewContainer.scrollHeight > previewContainer.clientHeight) {
                    previewContainer.scrollTo({
                        top: previewContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            } else {
                this.dom.preview.innerHTML = `
                    <span class="preview-placeholder">
                        <i class="fas fa-hammer"></i>
                        <p>Your skill line will appear here</p>
                    </span>
                `;
                this.dom.btnAddToQueue.disabled = true;
                this.dom.btnCopyPreview.disabled = true;
            }
        });
    }
    
    showLoadingState() {
        if (!this.dom.overlay) return;
        
        // Add loading indicator
        let loadingEl = this.dom.overlay.querySelector('.skill-builder-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'skill-builder-loading';
            loadingEl.innerHTML = `
                <div class="skill-builder-spinner"></div>
                <div class="skill-builder-loading-text">Loading browser...</div>
            `;
            this.dom.overlay.appendChild(loadingEl);
        }
        loadingEl.style.display = 'block';
        
        // Auto-hide after browser opens (timeout fallback)
        setTimeout(() => this.hideLoadingState(), 500);
    }
    
    hideLoadingState() {
        if (!this.dom.overlay) return;
        
        const loadingEl = this.dom.overlay.querySelector('.skill-builder-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
            loadingEl.style.opacity = '0';
        }
    }
    
    updateQueueDisplay() {
        const count = this.state?.queue?.length || 0;
        
        this.dom.queueCount.textContent = count;
        this.dom.queuePanel.style.display = count > 0 ? 'block' : 'none';
        
        // Set max height to prevent overlap (max 5 visible items)
        if (this.dom.queueList) {
            this.dom.queueList.style.maxHeight = '300px';
            this.dom.queueList.style.overflowY = 'auto';
        }
        
        if (count > 0) {
            // Use virtual scrolling for large queues (20+ items)
            if (count > 20) {
                this.renderVirtualQueue();
            } else {
                // Standard rendering for smaller queues
                this.dom.queueList.innerHTML = this.state.queue.map((line, i) => `
                    <div class="queue-item" data-index="${i}">
                        <div class="queue-item-number">${i + 1}</div>
                        <div class="queue-item-content"><code>${this.escapeHtml(line)}</code></div>
                        <button class="queue-item-remove btn-icon" data-index="${i}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
            }
        }
        
        // Update button text based on queue count
        this.dom.btnAddText.textContent = count > 1 ? `Add ${count} Lines` : 'Add Skill Line';
        
        // Enable/disable based on current line validity (checked in updateFooter)
        // Don't disable here based on queue count
    }
    
    /**
     * Virtual scrolling for large queues
     */
    renderVirtualQueue() {
        const ITEM_HEIGHT = 60; // Approximate height of each queue item
        const BUFFER_SIZE = 10; // Render extra items above/below viewport
        const CONTAINER_HEIGHT = this.dom.queueList.clientHeight || 400;
        
        const totalItems = this.state.queue.length;
        const totalHeight = totalItems * ITEM_HEIGHT;
        
        // Calculate visible range
        const scrollTop = this.dom.queueList.scrollTop || 0;
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
        const visibleItems = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + (BUFFER_SIZE * 2);
        const endIndex = Math.min(totalItems, startIndex + visibleItems);
        
        // Create spacer divs to maintain scroll height
        const topSpacer = startIndex * ITEM_HEIGHT;
        const bottomSpacer = (totalItems - endIndex) * ITEM_HEIGHT;
        
        // Render only visible items
        const visibleHTML = this.state.queue.slice(startIndex, endIndex).map((line, idx) => {
            const actualIndex = startIndex + idx;
            return `
                <div class="queue-item" data-index="${actualIndex}">
                    <div class="queue-item-number">${actualIndex + 1}</div>
                    <div class="queue-item-content"><code>${this.escapeHtml(line)}</code></div>
                    <button class="queue-item-remove btn-icon" data-index="${actualIndex}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        this.dom.queueList.innerHTML = `
            <div style="height: ${topSpacer}px;"></div>
            ${visibleHTML}
            <div style="height: ${bottomSpacer}px;"></div>
        `;
        
        // Setup scroll listener for continuous virtual scrolling
        if (!this.virtualScrollListener) {
            this.virtualScrollListener = this.throttle(() => {
                if (this.state.queue.length > 50) {
                    this.renderVirtualQueue();
                }
            }, 100);
            
            this.dom.queueList.addEventListener('scroll', this.virtualScrollListener, { passive: true });
        }
    }
    
    updateFooter() {
        const hasMechanic = this.state.currentLine.mechanic !== null;
        const hasTrigger = this.state.currentLine.trigger !== null;
        const hasTargeter = this.state.currentLine.targeter !== null;
        const hasConditions = this.state.currentLine.conditions && this.state.currentLine.conditions.length > 0;
        
        // OPTIMIZED LOGGING: Only log when context changes
        const context = this.state.context || 'skill';
        if (this.lastLoggedContext !== context) {
            console.warn(`🔄 [${this.instanceId}] CONTEXT CHANGED IN RENDER: ${this.lastLoggedContext} → ${context}`);
            console.log(`   [${this.instanceId}] State:`, {
                mechanic: this.state.currentLine.mechanic?.name || null,
                trigger: this.state.currentLine.trigger,
                targeter: this.state.currentLine.targeter,
                hasMechanic,
                hasTrigger
            });
            this.lastLoggedContext = context;
        }
        
        // Validate requirements for buttons
        const canAddToQueue = context === 'skill' 
            ? hasMechanic 
            : (hasMechanic && hasTrigger);
        
        console.log('✅ Button validation result:', { 
            context,  // Show the context (with fallback)
            contextRaw: this.state.context,  // Show raw context to detect undefined
            canAddToQueue,
            reason: !canAddToQueue ? (
                context === 'skill' 
                    ? 'Missing: mechanic' 
                    : (!hasMechanic ? 'Missing: mechanic' : 'Missing: trigger')
            ) : 'Valid'
        });
        
        // Debug: Check button elements exist
        
        // Update button states with defensive checks
        if (this.dom.btnAddToQueue) {
            const oldState = this.dom.btnAddToQueue.disabled;
            this.dom.btnAddToQueue.disabled = !canAddToQueue;
        } else {
            console.warn('⚠️ btnAddToQueue element not found!');
        }
        
        // btnAdd (Add Skill Line) should always be enabled if there's a valid line to add
        const queueCount = this.state?.queue?.length || 0;
        const canAddDirectly = canAddToQueue; // Can add current line directly
        
        if (this.dom.btnAdd) {
            const oldState = this.dom.btnAdd.disabled;
            this.dom.btnAdd.disabled = !(queueCount > 0 || canAddDirectly);
            console.log('🔘 btnAdd.disabled:', oldState, '→', this.dom.btnAdd.disabled, '(queue:', queueCount, ', canAdd:', canAddDirectly, ')');
        } else {
            console.warn('⚠️ btnAdd element not found!');
        }
        
        // Context-aware validation messages
        if (!hasMechanic) {
            this.dom.footerInfo.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #FF9800;"></i> Select a mechanic to get started';
        } else if (context === 'mob' && !hasTrigger) {
            // Only require trigger when context is explicitly 'mob' (not undefined/skill)
            this.dom.footerInfo.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #FF9800;"></i> Add a trigger (required for mob context)';
        } else {
            this.dom.footerInfo.innerHTML = '<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Looking good! Add to queue or continue building';
        }
        
        if (this.state.lastRenderTime > 0) {
            this.dom.footerPerf.textContent = `${this.state.lastRenderTime.toFixed(1)}ms`;
        }
        
        // Update "Save as Template" button visibility
        this.updateSaveTemplateButton();
    }
    
    /**
     * Update visibility of "Save as Template" button
     * Shows when user is logged in and has content in queue or current line
     */
    updateSaveTemplateButton() {
        if (!this.dom.btnSaveTemplate || !this.templateManager) return;
        
        // Check if user is logged in
        const isLoggedIn = window.authManager && window.authManager.user;
        
        // Check if there's content to save (queue or valid current line)
        const hasQueueContent = this.state.queue && this.state.queue.length > 0;
        const hasValidCurrentLine = this.state.currentLine.mechanic !== null;
        const hasContent = hasQueueContent || hasValidCurrentLine;
        
        // Show button only if logged in AND has content
        if (isLoggedIn && hasContent) {
            this.dom.btnSaveTemplate.style.display = '';
        } else {
            this.dom.btnSaveTemplate.style.display = 'none';
        }
    }
    
    /**
     * Get current skill lines from queue + current line
     */
    getCurrentSkillLines() {
        const lines = [];
        
        // Add all queued lines
        if (this.state.queue && this.state.queue.length > 0) {
            lines.push(...this.state.queue);
        }
        
        // Add current line if valid
        const currentLine = this.generateSkillLine();
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    /**
     * Show template save dialog with auto-suggestions
     */
    async showTemplateSaveDialog() {
        if (!this.templateEditor || !this.templateManager) {
            console.error('Template system not initialized');
            return;
        }
        
        const skillLines = this.getCurrentSkillLines();
        
        if (skillLines.length === 0) {
            window.notificationModal?.alert(
                'No skill lines to save as template. Please add at least one skill line.',
                'info',
                'No Skill Lines'
            );
            return;
        }
        
        // Auto-detect template properties
        const templateType = this.templateManager.detectTemplateType(skillLines);
        const category = this.templateManager.suggestCategory(skillLines);
        const icon = this.templateManager.suggestIcon(category);
        
        // Open template editor with pre-filled data
        this.templateEditor.open({
            skillLines: skillLines,
            type: templateType,
            category: category,
            icon: icon,
            onSave: async (template) => {
                
                // Optionally clear the builder after saving
                const clearAfterSave = await window.notificationModal?.confirm(
                    'Template saved successfully! Would you like to clear the skill builder?',
                    'Template Saved',
                    { confirmText: 'Clear', cancelText: 'Keep' }
                );
                if (clearAfterSave) {
                    this.clearQueue();
                    this.resetCurrentLine();
                }
            }
        });
    }
    
    switchTab(tab) {
        this.setState({ currentTab: tab });
        
        this.dom.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.dom.tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tab);
        });
    }
    
    // ========================================
    // SKILL LINE GENERATION
    // ========================================
    
    generateSkillLine() {
        const { currentLine } = this.state;
        
        if (!currentLine.mechanic) return null;
        
        // Don't include the "- " prefix - the YAML renderer will add it
        let line = `${currentLine.mechanic.fullString || currentLine.mechanic.name}`;
        
        // Include targeter if present (including @Self if explicitly selected)
        if (currentLine.targeter) {
            line += ` ${currentLine.targeter}`;
        }
        
        if (currentLine.trigger && this.state.context === 'mob') {
            line += ` ~${currentLine.trigger}`;
        }
        
        // Inline conditions only (handle both string and object formats)
        // Format: ?cond1 ?cond2 ?~cond3 (space-separated)
        if (currentLine.conditions && currentLine.conditions.length > 0) {
            const condStr = currentLine.conditions
                .map(c => {
                    // Handle both string and object formats
                    if (typeof c === 'string') {
                        // Already formatted inline condition
                        return c;
                    }
                    // Object format - fullString already includes prefix
                    return c.fullString || c.name || String(c);
                })
                .join(' '); // SPACE separator for inline conditions!
            line += ` ${condStr}`;
        }
        
        // Health modifier comes before chance
        if (currentLine.health) {
            line += ` ${currentLine.health}`;
        }
        
        if (currentLine.chance) {
            line += ` ${currentLine.chance}`;
        }
        
        return line;
    }
    
    /**
     * Generate regular condition sections for YAML export
     * Skill Line Builder only uses inline conditions
     * Regular condition sections are handled by parent editors
     */
    generateConditionSections() {
        return null;
    }
    
    // ========================================
    // BROWSER INTEGRATION
    // ========================================
    
    /**
     * Initialize browser instances (check availability)
     */
    initializeBrowsers() {
        // Browsers should be passed via open() options
        // This method just validates they're available
        if (!this.browsers.mechanic) {
            console.warn('⚠️ MechanicBrowser not provided to SkillLineBuilder');
            console.log('Available browsers:', this.browsers);
        }
        if (!this.browsers.targeter) {
            console.warn('⚠️ TargeterBrowser not provided to SkillLineBuilder');
            console.log('Available browsers:', this.browsers);
        }
        // ConditionBrowser is now used instead of ConditionEditor
        // Trigger browser is optional (only for mob context)
        if (this.state.context === 'mob' && !this.browsers.trigger) {
            console.warn('⚠️ TriggerBrowser not provided (mob context)');
            console.log('Available browsers:', this.browsers);
        }
    }
    
    /**
     * Open Mechanic Browser
     */
    openMechanicBrowser() {
        
        // Prevent opening multiple browsers at once
        if (this.state.activeBrowser) {
            console.warn('⚠️ Browser already open:', this.state.activeBrowser);
            return;
        }
        
        // Lazy initialization - create browsers if they don't exist (at this point all classes are loaded)
        if (!this.browsers.targeter && window.TargeterBrowser) {
            this.browsers.targeter = new TargeterBrowser();
        }
        if (!this.browsers.trigger && window.TriggerBrowser) {
            this.browsers.trigger = new TriggerBrowser(window.editor);
        }
        if (!this.browsers.mechanic && window.MechanicBrowser) {
            this.browsers.mechanic = new MechanicBrowser(
                this.browsers.targeter,
                this.browsers.trigger,
                null
            );
        }
        
        if (!this.browsers.mechanic) {
            console.error('❌ MechanicBrowser not available - window.MechanicBrowser class not found');
            return;
        }
        
        // Minimize builder and track active browser
        this.minimize();
        this.setState({ isLoading: true, activeBrowser: 'mechanic' });
        this.showLoadingState();
        
        const builderContext = this.state.context || 'skill';
        
        // Open browser with callback and proper context
        this.browsers.mechanic.open({
            context: builderContext, // Pass context in options
            parentZIndex: 10000,
            onSelect: (skillLine) => {
                
                // Hide loading
                this.hideLoadingState();
                
                // Restore builder with full state reset
                this.setState({ 
                    isMinimized: false, 
                    activeBrowser: null,
                    isLoading: false 
                });
                
                // Restore DOM state
                if (this.dom.overlay) {
                    this.dom.overlay.classList.remove('minimized');
                    this.dom.overlay.style.opacity = '1';
                    this.dom.overlay.style.pointerEvents = 'auto';
                    this.dom.overlay.style.zIndex = '10000';
                }
                
                // If cancelled (null), just return
                if (skillLine === null) {
                    return;
                }
                
                // Parse the skill line to extract components
                this.parseAndUpdateFromSkillLine(skillLine);
            }
        });
    }
    
    /**
     * Parse skill line from Mechanic Browser and update state
     */
    parseAndUpdateFromSkillLine(skillLine) {
        if (!skillLine) return;
        
        // Extract mechanic (everything before @, ~, or ?, with optional "- " prefix)
        const mechanicMatch = skillLine.match(/^-?\s*([^@~?]+)/);
        const mechanic = mechanicMatch ? mechanicMatch[1].trim() : null;
        
        // Extract targeter (after @, before ~, ?, chance, or health)
        const targeterMatch = skillLine.match(/@([^\s~?]+)/);
        const targeter = targeterMatch ? `@${targeterMatch[1]}` : '@Self';
        
        // Extract trigger (after ~, before ?)
        const triggerMatch = skillLine.match(/~([^\s?]+)/);
        const trigger = triggerMatch ? triggerMatch[1] : null;
        
        // Extract conditions (after ?)
        const conditionsMatch = skillLine.match(/\?([^\s]+)/);
        const conditionsStr = conditionsMatch ? conditionsMatch[1] : null;
        const conditions = conditionsStr ? conditionsStr.split(',').map(c => ({
            name: c,
            fullString: c
        })) : [];
        
        // Extract chance (standalone decimal between 0-1 at end of line, NOT inside {})
        const chanceMatch = skillLine.match(/\s+(0?\.\d+|1\.0)\s*$/);
        const chance = chanceMatch ? chanceMatch[1] : null;
        
        // Extract health modifier (< > = patterns NOT inside {})
        const healthMatch = skillLine.match(/\s+([<>=]+\d+%?)(?!.*})/);
        const health = healthMatch ? healthMatch[1] : null;
        
        // Update state
        this.setState({
            currentLine: {
                mechanic: mechanic ? { name: mechanic, fullString: mechanic } : null,
                targeter: targeter,
                trigger: trigger,
                conditions: conditions,
                chance: chance,
                health: health
            }
        });
        
        // Force full render to update all components (including button states)
        this.render();
    }
    
    /**
     * Clear mechanic
     */
    clearMechanic() {
        this.setState(s => ({
            currentLine: { ...s.currentLine, mechanic: null }
        }));
    }
    
    /**
     * Open Targeter Browser
     */
    openTargeterBrowser() {
        
        // Prevent opening multiple browsers at once
        if (this.state.activeBrowser) {
            console.warn('⚠️ Browser already open:', this.state.activeBrowser);
            return;
        }
        
        // Lazy initialization - create if doesn't exist (at this point all classes are loaded)
        if (!this.browsers.targeter && window.TargeterBrowser) {
            this.browsers.targeter = new TargeterBrowser();
        }
        if (!this.browsers.trigger && window.TriggerBrowser) {
            this.browsers.trigger = new TriggerBrowser(window.editor);
        }
        if (!this.browsers.mechanic && window.MechanicBrowser) {
            this.browsers.mechanic = new MechanicBrowser(
                this.browsers.targeter,
                this.browsers.trigger,
                null
            );
        }
        
        if (!this.browsers.targeter) {
            console.error('❌ TargeterBrowser not available - window.TargeterBrowser class not found');
            return;
        }
        
        // Minimize builder and track active browser
        this.minimize();
        this.setState({ isLoading: true, activeBrowser: 'targeter' });
        this.showLoadingState();
        
        // Open browser with callback
        this.browsers.targeter.open({
            parentZIndex: 10000,
            onSelect: (result) => {
                
                // Hide loading
                this.hideLoadingState();
                
                // Restore DOM state immediately
                if (this.dom.overlay) {
                    this.dom.overlay.classList.remove('minimized');
                    this.dom.overlay.style.opacity = '1';
                    this.dom.overlay.style.pointerEvents = 'auto';
                    this.dom.overlay.style.zIndex = '10000';
                }
                
                // If cancelled (null), just restore state and return
                if (result === null) {
                    this.setState({ 
                        isMinimized: false, 
                        activeBrowser: null,
                        isLoading: false 
                    });
                    return;
                }
                
                // Extract targeter string from result object
                // Priority: targeterString (from attribute config) > string result > extract from object
                let targeterString = '';
                if (result.targeterString) {
                    // Browser configured targeter with attributes
                    targeterString = result.targeterString;
                } else if (typeof result === 'string') {
                    targeterString = result;
                } else if (result.targeter) {
                    targeterString = result.targeter.fullString || result.targeter.name || result.targeter;
                } else {
                    targeterString = result.fullString || result.name || String(result);
                }
                
                // CRITICAL: Batch ALL state updates together to prevent intermediate renders
                // MUST spread existing state to preserve context and other properties!
                this.setState(s => ({
                    ...s,  // Preserve ALL state including context
                    isMinimized: false,
                    activeBrowser: null,
                    isLoading: false,
                    currentLine: { ...s.currentLine, targeter: targeterString }
                }));
                
                this.render();
            }
        });
    }
    
    /**
     * Clear targeter
     */
    clearTargeter() {
        this.setState(s => ({
            currentLine: { ...s.currentLine, targeter: '@Self' }
        }));
    }
    
    /**
     * Open Trigger Browser (Context-Aware)
     */
    openTriggerBrowser() {
        // Check context - triggers ONLY in mob context
        if (this.state.context !== 'mob') {
            console.warn('⚠️ Triggers only available in mob context');
            this.showNotification('Triggers are only available for mob files', 'warning');
            return;
        }
        
        console.log('⚡ Opening Trigger Browser');
        
        // Prevent opening multiple browsers at once
        if (this.state.activeBrowser) {
            console.warn('⚠️ Browser already open:', this.state.activeBrowser);
            return;
        }
        
        // Lazy initialization - create if doesn't exist (at this point all classes are loaded)
        if (!this.browsers.targeter && window.TargeterBrowser) {
            this.browsers.targeter = new TargeterBrowser();
        }
        if (!this.browsers.trigger && window.TriggerBrowser) {
            this.browsers.trigger = new TriggerBrowser(window.editor);
        }
        if (!this.browsers.mechanic && window.MechanicBrowser) {
            this.browsers.mechanic = new MechanicBrowser(
                this.browsers.targeter,
                this.browsers.trigger,
                null
            );
        }
        
        if (!this.browsers.trigger) {
            console.error('❌ TriggerBrowser not available - window.TriggerBrowser class not found');
            return;
        }
        
        // Minimize builder and track active browser
        this.minimize();
        this.setState({ isLoading: true, activeBrowser: 'trigger' });
        this.showLoadingState();
        
        // Open browser with callback
        this.browsers.trigger.open({
            parentZIndex: 10000,
            onSelect: (result) => {
                
                // Hide loading
                this.hideLoadingState();
                
                // If cancelled (null), just return
                if (result === null || result === undefined) {
                    
                    // Restore builder
                    this.setState({ 
                        isMinimized: false, 
                        activeBrowser: null,
                        isLoading: false 
                    });
                    
                    // Restore DOM state
                    if (this.dom.overlay) {
                        this.dom.overlay.classList.remove('minimized');
                        this.dom.overlay.style.opacity = '1';
                        this.dom.overlay.style.pointerEvents = 'auto';
                        this.dom.overlay.style.zIndex = '10000';
                    }
                    return;
                }
                
                // Extract trigger name (without ~)
                // Result is an object: {trigger: {name: "onDamaged", ...}, parameter: null, autoEnableRequirements: null}
                
                let triggerName;
                if (typeof result === 'string') {
                    // Result is already a string
                    triggerName = result.replace(/^~/, '');
                } else if (result && result.trigger) {
                    // Result is an object with trigger property
                    if (typeof result.trigger === 'string') {
                        // Trigger is a string
                        triggerName = result.trigger.replace(/^~/, '');
                    } else if (result.trigger.name) {
                        // Trigger is an object with name property
                        triggerName = result.trigger.name;
                    } else {
                        console.error('❌ Invalid trigger format:', result.trigger);
                        return;
                    }
                } else {
                    console.error('❌ Invalid trigger result:', result);
                    return;
                }
                
                // Update state with trigger
                this.setState(s => ({
                    ...s,
                    isMinimized: false, 
                    activeBrowser: null,
                    isLoading: false,
                    currentLine: { ...s.currentLine, trigger: triggerName }
                }));
                
                // Restore DOM state
                if (this.dom.overlay) {
                    this.dom.overlay.classList.remove('minimized');
                    this.dom.overlay.style.opacity = '1';
                    this.dom.overlay.style.pointerEvents = 'auto';
                    this.dom.overlay.style.zIndex = '10000';
                }
            }
        });
    }
    
    /**
     * Clear trigger
     */
    clearTrigger() {
        this.setState(s => ({
            currentLine: { ...s.currentLine, trigger: null }
        }));
    }
    
    /**
     * Open Condition Browser
     */
    openConditionEditor() {
        
        // Prevent opening multiple browsers at once
        if (this.state.activeBrowser) {
            console.warn('⚠️ Browser already open:', this.state.activeBrowser);
            return;
        }
        
        // Check if ConditionBrowser class exists
        if (typeof ConditionBrowser === 'undefined') {
            console.error('❌ ConditionBrowser class not found!');
            if (this.editor && this.editor.showAlert) {
                this.editor.showAlert('Condition Browser component failed to load. Please refresh the page.', 'error', 'Component Error');
            }
            return;
        }
        
        // Initialize condition browser if needed (synchronous for reliability)
        try {
            if (!window.conditionBrowser) {
                window.conditionBrowser = new ConditionBrowser();
            }
        } catch (error) {
            console.error('❌ Error creating ConditionBrowser:', error);
            if (this.editor && this.editor.showAlert) {
                this.editor.showAlert('Failed to initialize Condition Browser: ' + error.message, 'error', 'Initialization Error');
            }
            return;
        }
        
        // Minimize builder and track active browser (batch updates)
        this.minimize();
        this.setState({ activeBrowser: 'condition' });
        
        // Open condition browser with callback (add small delay to ensure minimize completes)
        setTimeout(() => {
            window.conditionBrowser.open({
            usageMode: 'inline',  // KEY: Use inline mode for skill line builder
            conditionType: 'caster',  // Default to caster conditions
            parentZIndex: 10000,
            onSelect: (result) => {
                
                // Restore DOM state immediately
                if (this.dom.overlay) {
                    this.dom.overlay.classList.remove('minimized');
                    this.dom.overlay.style.opacity = '1';
                    this.dom.overlay.style.pointerEvents = 'auto';
                    this.dom.overlay.style.zIndex = '10000';
                }
                
                // If cancelled (null), just restore state and return
                if (result === null) {
                    this.setState(s => ({ 
                        ...s,  // Preserve ALL state including context
                        isMinimized: false, 
                        activeBrowser: null 
                    }));
                    return;
                }
                
                if (result && result.conditionString) {
                    
                    // Result already in full inline format: ?conditionName{attrs} or ?!condition or ?~condition
                    const conditionObj = {
                        name: result.conditionString,  // Full string with prefix
                        fullString: result.conditionString,
                        prefix: result.prefix || '?',
                        conditionType: result.conditionType || 'caster',
                        usageMode: 'inline'
                    };
                    
                    // CRITICAL: Batch ALL state updates together to prevent intermediate renders
                    // MUST spread existing state to preserve context and other properties!
                    this.setState(s => {
                        const newConditions = [...(s.currentLine.conditions || []), conditionObj];
                        return {
                            ...s,  // Preserve ALL state including context
                            isMinimized: false,
                            activeBrowser: null,
                            currentLine: { 
                                ...s.currentLine, 
                                conditions: newConditions
                            }
                        };
                    });
                    
                    // Force immediate render to show condition in preview
                    this.render();
                } else {
                    console.warn('⚠️ No conditionString in result:', result);
                }
            }
        });
        }, 50); // Small delay to ensure UI transitions smoothly
    }
    
    /**
     * Remove condition by index
     */
    removeCondition(index) {
        this.setState(s => ({
            currentLine: {
                ...s.currentLine,
                conditions: s.currentLine.conditions.filter((_, i) => i !== index)
            }
        }));
    }
    
    // ========================================
    // INLINE CONDITIONS METHODS
    // ========================================
    
    /**
     * Toggle advanced inline conditions section
     */
    toggleAdvancedSection() {
        const section = document.getElementById('inlineConditionsSection');
        const body = section.querySelector('.advanced-body');
        const toggleIcon = section.querySelector('.toggle-icon');
        
        if (section.classList.contains('collapsed')) {
            section.classList.remove('collapsed');
            body.style.display = 'block';
            toggleIcon.style.transform = 'rotate(180deg)';
        } else {
            section.classList.add('collapsed');
            body.style.display = 'none';
            toggleIcon.style.transform = 'rotate(0deg)';
        }
    }
    
    /**
     * Open inline condition builder
     */
    openInlineConditionBuilder() {
        
        // Prevent opening multiple browsers at once
        if (this.state.activeBrowser) {
            console.warn('⚠️ Browser already open:', this.state.activeBrowser);
            return;
        }
        
        // Initialize inline condition builder if not exists
        if (!this.browsers.inlineCondition) {
            this.browsers.inlineCondition = new InlineConditionBuilder();
        }
        
        // Minimize builder and track active browser
        this.minimize();
        this.setState({ isLoading: true, activeBrowser: 'inlineCondition' });
        this.showLoadingState();
        
        const context = {
            hasTrigger: !!this.state.currentLine.trigger,
            targeter: this.state.currentLine.targeter || '@Self'
        };
        
        // Open builder with callback
        this.browsers.inlineCondition.open({
            context: context,
            parentZIndex: 10000,
            onSelect: (result) => {
                
                // Hide loading
                this.hideLoadingState();
                
                // Restore builder with full state reset
                this.setState({ 
                    isMinimized: false, 
                    activeBrowser: null,
                    isLoading: false 
                });
                
                // Restore DOM state
                if (this.dom.overlay) {
                    this.dom.overlay.classList.remove('minimized');
                    this.dom.overlay.style.opacity = '1';
                    this.dom.overlay.style.pointerEvents = 'auto';
                    this.dom.overlay.style.zIndex = '10000';
                }
                
                // If cancelled (null), just return
                if (result === null) {
                    return;
                }
                
                // Add the inline condition
                if (result && result.condition) {
                    this.addInlineCondition(result.condition, result.conditionString);
                }
            }
        });
    }
    
    /**
     * Add inline condition to current line
     */
    addInlineCondition(condition, conditionString) {
        this.setState(s => ({
            currentLine: {
                ...s.currentLine,
                inlineConditions: [...s.currentLine.inlineConditions, { condition, conditionString }]
            }
        }));
        
        this.updateInlineConditionsDisplay();
        this.updatePreview();
    }
    
    /**
     * Remove inline condition by index
     */
    removeInlineCondition(index) {
        this.setState(s => ({
            currentLine: {
                ...s.currentLine,
                inlineConditions: s.currentLine.inlineConditions.filter((_, i) => i !== index)
            }
        }));
        
        this.updateInlineConditionsDisplay();
        this.updatePreview();
    }
    
    /**
     * Update inline conditions display
     */
    updateInlineConditionsDisplay() {
        const listContainer = document.getElementById('inlineConditionsList');
        const { inlineConditions } = this.state.currentLine;
        
        if (inlineConditions && inlineConditions.length > 0) {
            listContainer.style.display = 'block';
            
            let listHTML = inlineConditions.map((ic, index) => {
                const { condition, conditionString } = ic;
                const typeLabel = condition.type === 'trigger' ? '?~' : condition.type === 'target' ? 'Target' : '?';
                const bgColor = condition.type === 'trigger' ? '#fff3cd' : condition.type === 'target' ? '#e3f2fd' : '#e8f5e9';
                
                return `
                    <div class="condition-chip" style="background: ${bgColor};">
                        <span style="font-size: 11px;">
                            <strong>${typeLabel}</strong> ${this.escapeHtml(conditionString)}
                        </span>
                        <button class="inline-condition-chip-remove" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }).join('');
            
            listContainer.innerHTML = listHTML;
        } else {
            listContainer.style.display = 'none';
        }
    }
    
    /**
     * Show notification (enhanced with icons)
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `skill-builder-notification ${type}`;
        notification.innerHTML = `${icons[type] || icons.info} ${message}`;
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        if (!this.dom.loadingOverlay) {
            const overlay = document.createElement('div');
            overlay.className = 'skill-builder-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-message">${message}</div>
                </div>
            `;
            this.dom.modal.appendChild(overlay);
            this.dom.loadingOverlay = overlay;
        } else {
            this.dom.loadingOverlay.querySelector('.loading-message').textContent = message;
            this.dom.loadingOverlay.classList.add('show');
        }
    }
    
    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.dom.loadingOverlay) {
            this.dom.loadingOverlay.classList.remove('show');
        }
    }
    
    /**
     * Set button loading state
     */
    setButtonLoading(buttonId, loading = true) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }
    
    updateChance(value) {
        this.setState(s => ({
            currentLine: { ...s.currentLine, chance: value || null }
        }));
    }
    
    updateHealth(value) {
        this.setState(s => ({
            currentLine: { ...s.currentLine, health: value || null }
        }));
    }
    
    copyPreview() {
        const line = this.generateSkillLine();
        if (line && navigator.clipboard) {
            navigator.clipboard.writeText(line);
            
            // Visual feedback
            const previewContainer = document.querySelector('.preview-container');
            const copyBtn = document.getElementById('btnCopyPreview');
            
            if (previewContainer) {
                previewContainer.classList.add('copy-success');
                setTimeout(() => previewContainer.classList.remove('copy-success'), 500);
            }
            
            if (copyBtn) {
                const icon = copyBtn.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'fas fa-check';
                setTimeout(() => icon.className = originalClass, 1000);
            }
            
            this.showNotification('Copied to clipboard!', 'success');
        }
    }
    
    resetCurrentLine() {
        this.setState({
            currentLine: {
                mechanic: null,
                targeter: '@Self',
                trigger: null,
                conditions: [],
                chance: null,
                health: null
            }
        });
        
        // Force immediate re-lock of components (don't wait for RAF)
        const btnTargeter = document.getElementById('btnSelectTargeter');
        const btnCondition = document.getElementById('btnAddCondition');
        const btnTrigger = document.getElementById('btnSelectTrigger');
        
        if (btnTargeter) btnTargeter.disabled = true;
        if (btnCondition) btnCondition.disabled = true;
        if (btnTrigger) btnTrigger.disabled = true;
        if (this.dom.chanceInput) this.dom.chanceInput.disabled = true;
        if (this.dom.healthInput) this.dom.healthInput.disabled = true;
        
        // Force immediate visual feedback on cards
        if (this.dom.targeterCard) {
            this.dom.targeterCard.classList.add('component-disabled');
            this.dom.targeterCard.style.opacity = '0.5';
            this.dom.targeterCard.style.pointerEvents = 'none';
        }
        if (this.dom.conditionCard) {
            this.dom.conditionCard.classList.add('component-disabled');
            this.dom.conditionCard.style.opacity = '0.5';
            this.dom.conditionCard.style.pointerEvents = 'none';
        }
        if (this.dom.triggerCard) {
            this.dom.triggerCard.classList.add('component-disabled');
            this.dom.triggerCard.style.opacity = '0.5';
            this.dom.triggerCard.style.pointerEvents = 'none';
        }
        
        if (this.dom.chanceInput) this.dom.chanceInput.value = '';
        if (this.dom.healthInput) this.dom.healthInput.value = '';
        
        // Clear inline conditions display
        const listContainer = document.getElementById('inlineConditionsList');
        if (listContainer) {
            listContainer.style.display = 'none';
            listContainer.innerHTML = '';
        }
    }
    
    addCurrentLineToQueue() {
        const line = this.generateSkillLine();
        if (line) {
            // Add to queue and reset currentLine in one setState call
            // CRITICAL: Must preserve context and other state properties!
            this.setState(s => ({
                ...s,  // Preserve ALL state including context
                queue: [...(s.queue || []), line],
                currentLine: {
                    mechanic: null,
                    targeter: '@Self',
                    trigger: null,
                    conditions: [],
                    chance: null,
                    health: null
                }
            }));
            
            // Force immediate re-lock of components (don't wait for RAF)
            const btnTargeter = document.getElementById('btnSelectTargeter');
            const btnCondition = document.getElementById('btnAddCondition');
            const btnTrigger = document.getElementById('btnSelectTrigger');
            
            if (btnTargeter) btnTargeter.disabled = true;
            if (btnCondition) btnCondition.disabled = true;
            if (btnTrigger) btnTrigger.disabled = true;
            if (this.dom.chanceInput) this.dom.chanceInput.disabled = true;
            if (this.dom.healthInput) this.dom.healthInput.disabled = true;
            
            // Force immediate visual feedback on cards
            if (this.dom.targeterCard) {
                this.dom.targeterCard.classList.add('component-disabled');
                this.dom.targeterCard.style.opacity = '0.5';
                this.dom.targeterCard.style.pointerEvents = 'none';
            }
            if (this.dom.conditionCard) {
                this.dom.conditionCard.classList.add('component-disabled');
                this.dom.conditionCard.style.opacity = '0.5';
                this.dom.conditionCard.style.pointerEvents = 'none';
            }
            if (this.dom.triggerCard) {
                this.dom.triggerCard.classList.add('component-disabled');
                this.dom.triggerCard.style.opacity = '0.5';
                this.dom.triggerCard.style.pointerEvents = 'none';
            }
            
            // Clear input fields
            if (this.dom.chanceInput) this.dom.chanceInput.value = '';
            if (this.dom.healthInput) this.dom.healthInput.value = '';
        }
    }
    
    removeFromQueue(index) {
        this.setState(s => ({
            queue: s.queue.filter((_, i) => i !== index)
        }));
    }
    
    clearQueue() {
        this.setState({ queue: [] });
    }
    
    processQueue() {
        const { queue } = this.state;
        
        // Check if queue exists and is an array
        if (!queue || !Array.isArray(queue)) {
            console.error('❌ Queue is undefined or not an array');
            return;
        }
        
        // If queue is empty, try to add the current line directly
        if (queue.length === 0) {
            const currentLine = this.generateSkillLine();
            if (currentLine) {
                console.log('🚀 Processing current line directly (no queue):', currentLine);
                
                // Add current line using callback
                if (this.callbacks.onAddMultiple) {
                    this.callbacks.onAddMultiple([currentLine]);
                } else if (this.callbacks.onAdd) {
                    this.callbacks.onAdd(currentLine);
                }
                
                this.close();
                return;
            }
            
            // No queue and no valid current line
            console.warn('⚠️ Cannot process: queue is empty and no valid current line');
            return;
        }
        
        // Always use onAddMultiple for consistency to avoid double-wrapping
        if (this.callbacks.onAddMultiple) {
            this.callbacks.onAddMultiple(queue);
        } else if (this.callbacks.onAdd) {
            // Fallback: call onAdd for each line individually
            queue.forEach(line => this.callbacks.onAdd(line));
        }
        
        // Clear the queue after processing
        this.setState({ queue: [] });
        
        this.close();
    }
    
    handleBack() {
        if (this.callbacks.onBack) this.callbacks.onBack();
        this.close();
    }
    
    // ========================================
    // BULK IMPORT
    // ========================================
    
    /**
     * Clear bulk input
     */
    clearBulk() {
        if (this.dom.bulkInput) {
            this.dom.bulkInput.value = '';
            this.updateBulkStats();
            
            // Clear validation display
            if (this.dom.bulkValidation) {
                this.dom.bulkValidation.innerHTML = '';
            }
        }
    }
    
    /**
     * Validate bulk input
     */
    validateBulk() {
        if (!this.dom.bulkInput) return;
        
        const input = this.dom.bulkInput.value;
        const lines = input.split('\n');
        
        const validLines = [];
        const invalidLines = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Skip empty lines and YAML headers
            if (!trimmed || trimmed.startsWith('#') || trimmed.match(/^[A-Za-z]+:/)) {
                return;
            }
            
            // Check if line starts with dash
            if (trimmed.startsWith('-')) {
                // Basic validation - check for mechanic
                const mechanicMatch = trimmed.match(/^-\s*\w+/);
                if (mechanicMatch) {
                    validLines.push({ line: trimmed, lineNumber: index + 1 });
                } else {
                    invalidLines.push({ 
                        line: trimmed, 
                        lineNumber: index + 1,
                        error: 'Invalid mechanic format'
                    });
                }
            } else if (trimmed.length > 0) {
                invalidLines.push({ 
                    line: trimmed, 
                    lineNumber: index + 1,
                    error: 'Line must start with "-"'
                });
            }
        });
        
        // Update stats
        this.dom.bulkTotal.textContent = validLines.length + invalidLines.length;
        this.dom.bulkValid.textContent = validLines.length;
        this.dom.bulkInvalid.textContent = invalidLines.length;
        
        // Show validation results
        if (this.dom.bulkValidation) {
            if (invalidLines.length > 0) {
                this.dom.bulkValidation.innerHTML = `
                    <div class="bulk-validation-errors">
                        <h4><i class="fas fa-exclamation-triangle"></i> Validation Errors</h4>
                        ${invalidLines.map(item => `
                            <div class="bulk-error-item">
                                <span class="line-number">Line ${item.lineNumber}:</span>
                                <span class="error-message">${item.error}</span>
                                <code>${this.escapeHtml(item.line)}</code>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (validLines.length > 0) {
                this.dom.bulkValidation.innerHTML = `
                    <div class="bulk-validation-success">
                        <i class="fas fa-check-circle"></i>
                        All ${validLines.length} line(s) are valid!
                    </div>
                `;
            } else {
                this.dom.bulkValidation.innerHTML = '';
            }
        }
        
        // Enable/disable import button
        const importBtn = document.getElementById('btnImportBulk');
        if (importBtn) {
            importBtn.disabled = validLines.length === 0;
        }
        
        // Store valid lines for import
        this.validBulkLines = validLines.map(item => item.line);
        
        console.log(`✅ Validation complete: ${validLines.length} valid, ${invalidLines.length} invalid`);
    }
    
    /**
     * Import bulk lines
     */
    importBulk() {
        if (!this.validBulkLines || this.validBulkLines.length === 0) {
            console.warn('No valid lines to import');
            return;
        }
        
        console.log(`📥 Importing ${this.validBulkLines.length} lines`);
        
        // Add all valid lines to queue
        this.setState(s => ({
            queue: [...s.queue, ...this.validBulkLines]
        }));
        
        // Clear bulk input
        this.clearBulk();
        
        // Switch to quick build tab to show queue
        this.switchTab('quick-build');
        
        // Show success notification
        this.showNotification(`Imported ${this.validBulkLines.length} skill line(s)`, 'success');
    }
    
    /**
     * Update bulk stats (called on input)
     */
    updateBulkStats() {
        if (!this.dom.bulkInput) return;
        
        const lines = this.dom.bulkInput.value.split('\n').filter(l => {
            const trimmed = l.trim();
            return trimmed && trimmed.startsWith('-');
        });
        
        this.dom.bulkTotal.textContent = lines.length;
        this.dom.bulkValid.textContent = '?';
        this.dom.bulkInvalid.textContent = '?';
        
        // Reset valid lines cache
        this.validBulkLines = [];
        
        // Disable import button until validated
        const importBtn = document.getElementById('btnImportBulk');
        if (importBtn) {
            importBtn.disabled = true;
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineBuilder;
}

// Loaded silently
