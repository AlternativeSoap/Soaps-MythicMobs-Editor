/**
 * Template Creation Wizard
 * Two-step wizard for creating templates with skill line builder integration
 * Step 1: Build skill lines with embedded builder
 * Step 2: Add metadata (name, description, category, etc.)
 */

class TemplateCreationWizard {
    constructor(templateManager, templateEditor) {
        this.templateManager = templateManager;
        this.templateEditor = templateEditor;
        this.currentStep = 1;
        this.context = 'mob'; // 'mob' or 'skill'
        this.skillLines = [];
        this.onCompleteCallback = null;
        this.templateSelectorRef = null; // Issue #4: Reference to template selector for auto-refresh
        
        // Phase 2: Event listener tracking for cleanup
        this.eventListeners = [];
        
        // Phase 2: DOM element cache
        this.cachedElements = {};
        
        this.createModal();
        this.attachEventListeners();
        
        console.log('🧙 TemplateCreationWizard initialized');
    }
    
    /**
     * Create the wizard modal HTML
     */
    createModal() {
        const modalHTML = `
            <div id="templateWizardOverlay" class="condition-modal" style="display: none; z-index: 10000;">
                <div class="modal-content condition-browser" style="max-width: 900px; max-height: 85vh;">
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
                    
                    <!-- Progress Bar -->
                    <div class="wizard-progress" style="padding: 0 1.5rem; margin-bottom: 1rem;">
                        <div class="progress-bar" style="background: var(--border-color); height: 4px; border-radius: 2px; overflow: hidden;">
                            <div id="wizardProgressFill" style="background: var(--primary-color); height: 100%; width: 50%; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                            <span id="step1Label" style="font-weight: 600; color: var(--primary-color);">
                                <i class="fas fa-code"></i> Build Skill Lines
                            </span>
                            <span id="step2Label">
                                <i class="fas fa-tag"></i> Add Details
                            </span>
                        </div>
                    </div>
                    
                    <!-- Body -->
                    <div class="condition-browser-body" style="padding: 1.5rem; overflow-y: auto;">
                        <!-- Step 1: Build Skill Lines -->
                        <div id="wizardStep1" style="display: block;">
                            <!-- Context Selector -->
                            <div class="form-group" style="margin-bottom: 1.5rem;">
                                <label style="font-weight: 600; margin-bottom: 0.75rem; display: block;">
                                    <i class="fas fa-crosshairs"></i> Template Context
                                </label>
                                <div class="context-selector" style="display: inline-flex; background: var(--bg-tertiary); border-radius: 12px; padding: 0.375rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                                    <button type="button" class="context-option active" data-context="mob" style="flex: 1; padding: 0.75rem 1.5rem; border: none; background: var(--primary-color); color: white; border-radius: 8px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
                                        <span style="font-size: 1.25rem;">🐉</span>
                                        <div style="text-align: left;">
                                            <div style="font-size: 0.95rem;">Mob Skills</div>
                                            <div style="font-size: 0.75rem; opacity: 0.9; font-weight: 400;">Includes triggers (~onAttack, ~onDamaged, etc.)</div>
                                        </div>
                                    </button>
                                    <button type="button" class="context-option" data-context="skill" style="flex: 1; padding: 0.75rem 1.5rem; border: none; background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
                                        <span style="font-size: 1.25rem;">⚔️</span>
                                        <div style="text-align: left;">
                                            <div style="font-size: 0.95rem;">Standalone Skills</div>
                                            <div style="font-size: 0.75rem; opacity: 0.7; font-weight: 400;">No triggers, just mechanics</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Skill Line Builder Container -->
                            <div class="form-group">
                                <label style="font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                                    <span>
                                        <i class="fas fa-list"></i> Skill Lines
                                        <span id="lineCountBadge" style="background: var(--primary-color); color: white; padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.85rem; margin-left: 0.5rem;">0 lines</span>
                                    </span>
                                    <button type="button" id="clearLinesBtn" class="btn btn-secondary btn-sm" style="display: none;">
                                        <i class="fas fa-trash"></i> Clear All
                                    </button>
                                </label>
                                <div id="wizardSkillLineContainer" style="background: var(--bg-secondary); border: 2px dashed var(--border-color); border-radius: 8px; min-height: 200px; padding: 1rem;">
                                    <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                        <i class="fas fa-code" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                                        <p>No skill lines yet</p>
                                        <small>Click "+ Add Line" below to start building</small>
                                    </div>
                                </div>
                                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button type="button" id="openSkillBuilderBtn" class="btn btn-primary">
                                        <i class="fas fa-magic"></i> Skill Line Builder
                                    </button>
                                    <button type="button" id="pasteSkillBtn" class="btn btn-secondary">
                                        <i class="fas fa-paste"></i> Paste Skill
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Step 2: Add Metadata (Hidden initially) -->
                        <div id="wizardStep2" style="display: none;">
                            <!-- This will be populated by TemplateEditor form content -->
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="wizardCancel">Cancel</button>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" id="wizardBack" style="display: none;">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <button class="btn btn-primary" id="wizardNext">
                                Next <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
        
        // Inject custom styles for the switch
        this.injectStyles();
    }
    
    /**
     * Inject custom CSS for the context switch
     */
    injectStyles() {
        if (document.getElementById('templateWizardStyles')) return;
        
        const styles = `
            <style id="templateWizardStyles">
                .context-option {
                    position: relative;
                    overflow: hidden;
                }
                
                .context-option:hover:not(.active) {
                    background: var(--bg-secondary) !important;
                    color: var(--text-primary) !important;
                }
                
                .context-option:active {
                    transform: scale(0.96) !important;
                }
                
                .context-option::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }
                
                .context-option:hover::before {
                    opacity: 1;
                }
                
                .context-option.active::after {
                    content: '✓';
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: bold;
                    opacity: 0.8;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    /**
     * Attach event listeners (Phase 2: with tracking for cleanup)
     */
    attachEventListeners() {
        // Helper to track event listeners
        const addTrackedListener = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
                this.eventListeners.push({ element, event, handler });
            }
        };
        
        // Close/Cancel
        addTrackedListener(document.getElementById('wizardClose'), 'click', () => this.close());
        addTrackedListener(document.getElementById('wizardCancel'), 'click', () => this.close());
        
        // Context selector
        document.querySelectorAll('.context-option').forEach(btn => {
            const handler = (e) => {
                const context = e.currentTarget.dataset.context;
                this.setContext(context);
            };
            addTrackedListener(btn, 'click', handler);
        });
        
        // Skill line buttons
        addTrackedListener(document.getElementById('openSkillBuilderBtn'), 'click', () => this.openSkillLineBuilder());
        addTrackedListener(document.getElementById('pasteSkillBtn'), 'click', () => this.pasteSkill());
        addTrackedListener(document.getElementById('clearLinesBtn'), 'click', () => this.clearLines());
        
        // Navigation
        addTrackedListener(document.getElementById('wizardNext'), 'click', () => this.nextStep());
        addTrackedListener(document.getElementById('wizardBack'), 'click', () => this.prevStep());
    }
    
    /**
     * Open the wizard
     */
    open(options = {}) {
        console.log('🧙 Opening Template Creation Wizard');
        
        this.context = options.context || 'mob';
        this.skillLines = options.skillLines || [];
        this.onCompleteCallback = options.onComplete || null;
        this.templateSelectorRef = options.templateSelector || null; // Issue #4: Store selector reference
        this.currentStep = 1;
        
        // Reset UI
        this.setContext(this.context);
        this.renderSkillLines();
        this.updateUI();
        
        // Show modal
        document.getElementById('templateWizardOverlay').style.display = 'flex';
        
        // Focus first element
        setTimeout(() => {
            document.querySelector('.context-option.active')?.focus();
        }, 100);
    }
    
    /**
     * Close the wizard
     */
    async close(skipConfirmation = false) {
        if (!skipConfirmation && this.skillLines.length > 0) {
            const confirmed = await window.notificationModal.confirm(
                'Your progress will be lost. Are you sure you want to close?',
                'Discard Changes?',
                {
                    confirmText: 'Discard',
                    cancelText: 'Keep Editing',
                    confirmClass: 'danger',
                    icon: '⚠️',
                    type: 'warning'
                }
            );
            if (!confirmed) return;
        }
        
        document.getElementById('templateWizardOverlay').style.display = 'none';
        this.skillLines = [];
        this.currentStep = 1;
        
        // Phase 2: Cleanup to prevent event listener accumulation
        this.cleanup();
    }
    
    /**
     * Cleanup event listeners (Phase 2 performance optimization)
     */
    cleanup() {
        // Note: We don't actually remove listeners here since they're on persistent DOM elements
        // This method is for future expansion if we add dynamic listeners
        // The tracked listeners are cleaned up when modal is destroyed
        console.log('🧹 Wizard cleanup completed');
    }
    
    /**
     * Set context (mob or skill)
     */
    setContext(context) {
        this.context = context;
        
        // Update UI with modern switch styling
        document.querySelectorAll('.context-option').forEach(btn => {
            if (btn.dataset.context === context) {
                btn.classList.add('active');
                btn.style.background = 'var(--primary-color)';
                btn.style.color = 'white';
                btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                btn.style.transform = 'scale(1)';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-secondary)';
                btn.style.boxShadow = 'none';
                btn.style.transform = 'scale(0.98)';
            }
        });
        
        console.log(`🎯 Context set to: ${context}`);
    }
    
    /**
     * Open Skill Line Builder (integrated with existing builder)
     */
    openSkillLineBuilder() {
        console.log('🔮 Opening Skill Line Builder from wizard');
        
        // Get the skill line builder and browsers from the main editor
        const skillBuilderEditor = window.editor?.skillEditor?.skillBuilderEditor;
        const skillLineBuilder = skillBuilderEditor?.skillLineBuilder;
        
        if (!skillLineBuilder) {
            console.error('❌ Skill Line Builder not available');
            console.log('Available:', {
                editor: !!window.editor,
                skillEditor: !!window.editor?.skillEditor,
                skillBuilderEditor: !!skillBuilderEditor,
                skillLineBuilder: !!skillLineBuilder
            });
            alert('Skill Line Builder is not available. Please make sure the editor is fully loaded.');
            return;
        }
        
        // Get browser components from the skill builder editor
        const mechanicBrowser = skillBuilderEditor?.mechanicBrowser;
        const targeterBrowser = skillBuilderEditor?.targeterBrowser;
        const triggerBrowser = skillBuilderEditor?.triggerBrowser;
        
        console.log('📚 Browsers available:', {
            mechanic: !!mechanicBrowser,
            targeter: !!targeterBrowser,
            trigger: !!triggerBrowser
        });
        
        // Hide wizard temporarily (CRITICAL: Keep reference to re-show it)
        const wizardOverlay = document.getElementById('templateWizardOverlay');
        wizardOverlay.style.display = 'none';
        
        // Open builder with callbacks and browser components
        skillLineBuilder.open({
            context: this.context,
            // Pass browser components
            mechanicBrowser: mechanicBrowser,
            targeterBrowser: targeterBrowser,
            triggerBrowser: triggerBrowser,
            // Callbacks - FIXED to ensure proper navigation and line additions
            onAdd: (skillLine) => {
                console.log('✅ Skill line added from builder:', skillLine);
                // Single line callback
                if (skillLine && typeof skillLine === 'string' && skillLine.trim()) {
                    this.skillLines.push(skillLine.trim());
                    console.log('📝 Current skill lines:', this.skillLines);
                    // Re-show wizard FIRST, then render
                    wizardOverlay.style.display = 'flex';
                    this.renderSkillLines();
                } else {
                    console.warn('⚠️ Invalid skill line received:', skillLine);
                }
            },
            onAddMultiple: (skillLines) => {
                console.log('✅ Multiple skill lines added from builder:', skillLines);
                // Multiple lines callback
                if (Array.isArray(skillLines) && skillLines.length > 0) {
                    const validLines = skillLines.filter(line => 
                        typeof line === 'string' && line.trim()
                    ).map(line => line.trim());
                    
                    if (validLines.length > 0) {
                        this.skillLines.push(...validLines);
                        console.log('📝 Current skill lines:', this.skillLines);
                        // Re-show wizard FIRST, then render
                        wizardOverlay.style.display = 'flex';
                        this.renderSkillLines();
                    }
                } else {
                    console.warn('⚠️ Invalid skill lines array received:', skillLines);
                }
            },
            onBack: () => {
                console.log('🔙 User closed builder, returning to wizard');
                // CRITICAL FIX: Re-show wizard overlay directly, don't let it bubble to template selector
                wizardOverlay.style.display = 'flex';
                // Ensure wizard stays on top
                setTimeout(() => {
                    wizardOverlay.style.zIndex = '10000';
                }, 50);
            }
        });
    }
    
    /**
     * Paste skill from clipboard
     */
    async pasteSkill() {
        try {
            const text = await navigator.clipboard.readText();
            const lines = text.split('\n').filter(l => l.trim().length > 0);
            this.skillLines.push(...lines);
            this.renderSkillLines();
            console.log(`📋 Pasted ${lines.length} lines`);
        } catch (error) {
            console.error('Failed to paste:', error);
            alert('Failed to paste from clipboard');
        }
    }
    
    /**
     * Clear all lines
     */
    async clearLines() {
        const confirmed = await window.notificationModal.confirm(
            'This will remove all skill lines you have added. This action cannot be undone.',
            'Clear All Skill Lines?',
            {
                confirmText: 'Clear All',
                cancelText: 'Cancel',
                confirmClass: 'danger',
                icon: '🗑️',
                type: 'warning'
            }
        );
        
        if (confirmed) {
            this.skillLines = [];
            this.renderSkillLines();
        }
    }
    
    /**
     * Render skill lines in container
     */
    renderSkillLines() {
        const container = document.getElementById('wizardSkillLineContainer');
        const badge = document.getElementById('lineCountBadge');
        const clearBtn = document.getElementById('clearLinesBtn');
        
        badge.textContent = `${this.skillLines.length} line${this.skillLines.length !== 1 ? 's' : ''}`;
        clearBtn.style.display = this.skillLines.length > 0 ? 'inline-flex' : 'none';
        
        if (this.skillLines.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-code" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>No skill lines yet</p>
                    <small>Click "+ Add Line" below to start building</small>
                </div>
            `;
            return;
        }
        
        let html = '<div class="skill-lines-list" style="display: flex; flex-direction: column; gap: 0.5rem;">';
        this.skillLines.forEach((line, index) => {
            html += `
                <div class="skill-line-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                    <span style="color: var(--text-secondary); font-size: 0.85rem; min-width: 2rem;">${index + 1}.</span>
                    <code style="flex: 1; font-size: 0.9rem; color: var(--primary-color);">${this.escapeHtml(line)}</code>
                    <button class="btn btn-secondary btn-sm" onclick="window.templateWizard.editLine(${index})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.templateWizard.removeLine(${index})" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }
    
    /**
     * Edit a skill line
     */
    editLine(index) {
        const newLine = prompt('Edit skill line:', this.skillLines[index]);
        if (newLine !== null && newLine.trim()) {
            this.skillLines[index] = newLine.trim();
            this.renderSkillLines();
        }
    }
    
    /**
     * Remove a skill line
     */
    removeLine(index) {
        this.skillLines.splice(index, 1);
        this.renderSkillLines();
    }
    
    /**
     * Go to next step
     */
    async nextStep() {
        if (this.currentStep === 1) {
            // Validate step 1
            if (this.skillLines.length === 0) {
                await window.notificationModal.alert(
                    'You need to add at least one skill line before proceeding to the next step.',
                    'warning',
                    'Please Add Skill Lines'
                );
                return;
            }
            
            // Move to step 2
            this.currentStep = 2;
            this.showStep2();
        } else if (this.currentStep === 2) {
            // Save template via templateEditor
            this.saveTemplate();
        }
    }
    
    /**
     * Go to previous step
     */
    prevStep() {
        if (this.currentStep === 2) {
            this.currentStep = 1;
            this.updateUI();
        }
    }
    
    /**
     * Show step 2 (metadata form)
     */
    showStep2() {
        console.log('➡️ Moving to Step 2: Opening Template Editor');
        
        // Store skill lines before closing wizard (wizard.close() clears them)
        const skillLinesToPass = [...this.skillLines];
        const contextToPass = this.context;
        const completeCallback = this.onCompleteCallback;
        const templateSelectorRef = this.templateSelectorRef; // Issue #4: Pass selector reference
        
        // CRITICAL FIX: Hide template selector first to prevent z-index issues
        const templateSelectorOverlay = document.getElementById('templateSelectorOverlay');
        if (templateSelectorOverlay) {
            templateSelectorOverlay.style.display = 'none';
            console.log('🙈 Template selector hidden');
        }
        
        // Close wizard (skip confirmation since we're progressing, not canceling)
        this.close(true);
        
        // Open template editor with skill lines pre-populated
        this.templateEditor.open({
            mode: 'create',
            skillLines: skillLinesToPass,
            context: contextToPass,
            template: {
                category: 'combat',
                icon: '⚔️'
            },
            onSave: async (newTemplate) => {
                console.log('✅ Template saved from wizard flow:', newTemplate);
                
                // Issue #4: Auto-refresh and reopen template selector
                if (templateSelectorRef) {
                    console.log('🔄 Refreshing template selector...');
                    await templateSelectorRef.refresh();
                    
                    // Reopen with the new template's context
                    setTimeout(() => {
                        templateSelectorRef.open({
                            context: contextToPass,
                            onSelect: templateSelectorRef.onSelectCallback // Preserve callback
                        });
                        
                        // Show success notification
                        window.notificationModal.alert(
                            `Template "${newTemplate.name}" has been created successfully!`,
                            'success',
                            'Template Created'
                        );
                    }, 300);
                }
                
                if (completeCallback) {
                    completeCallback(newTemplate);
                }
            },
            onCancel: () => {
                console.log('❌ Template creation cancelled - reopening template selector');
                // If user cancels, re-show the template selector
                if (templateSelectorOverlay) {
                    templateSelectorOverlay.style.display = 'flex';
                }
            }
        });
    }
    
    /**
     * Save template
     */
    async saveTemplate() {
        // This is handled by templateEditor in step 2
    }
    
    /**
     * Update UI based on current step
     */
    updateUI() {
        // Update step indicator
        document.getElementById('wizardStepNumber').textContent = this.currentStep;
        document.getElementById('wizardProgressFill').style.width = `${(this.currentStep / 2) * 100}%`;
        
        // Update step labels
        const step1Label = document.getElementById('step1Label');
        const step2Label = document.getElementById('step2Label');
        
        if (this.currentStep === 1) {
            step1Label.style.fontWeight = '600';
            step1Label.style.color = 'var(--primary-color)';
            step2Label.style.fontWeight = 'normal';
            step2Label.style.color = 'var(--text-secondary)';
        } else {
            step1Label.style.fontWeight = 'normal';
            step1Label.style.color = 'var(--text-secondary)';
            step2Label.style.fontWeight = '600';
            step2Label.style.color = 'var(--primary-color)';
        }
        
        // Show/hide steps
        document.getElementById('wizardStep1').style.display = this.currentStep === 1 ? 'block' : 'none';
        document.getElementById('wizardStep2').style.display = this.currentStep === 2 ? 'block' : 'none';
        
        // Update buttons
        document.getElementById('wizardBack').style.display = this.currentStep === 2 ? 'inline-flex' : 'none';
        const nextBtn = document.getElementById('wizardNext');
        if (this.currentStep === 1) {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        } else {
            nextBtn.innerHTML = '<i class="fas fa-save"></i> Save Template';
        }
    }
    
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export and expose globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateCreationWizard;
}

console.log('✅ TemplateCreationWizard loaded');
