/**
 * Template Import Wizard - Complete Multi-Step UI
 * 6-step wizard with smart suggestions and manual control
 */
class TemplateImportWizard {
    constructor() {
        this.importer = null;
        this.currentStep = 1;
        this.totalSteps = 5;
        
        // State
        this.yamlContent = '';
        this.forcedFileType = null;
        this.analysisResult = null;
        this.groups = [];
        this.standalone = [];
        this.excludedSkills = new Set();
        this.templateConfigs = [];
        this.duplicateResults = [];
        this.batchSettings = {
            category: null,
            context: 'skill',
            isOfficial: false
        };
    }

    open() {
        // Prevent opening if already importing
        if (this._isImporting) {
            console.log('[Import Wizard] Cannot open - import in progress');
            return;
        }
        
        if (!this.importer && window.templateManager) {
            this.importer = new TemplateYAMLImporter(window.templateManager);
        }
        
        if (!this.importer) {
            alert('Template system not available');
            return;
        }
        
        this.reset();
        this.createModal();
        this.renderStep();
    }

    reset() {
        this.currentStep = 1;
        this.yamlContent = '';
        this.loadedFileName = null;
        this.forcedFileType = null;
        this.analysisResult = null;
        this.groups = [];
        this.standalone = [];
        this.excludedSkills = new Set();
        this.templateConfigs = [];
        this.duplicateResults = [];
        this.batchSettings = { category: null, context: 'skill', isOfficial: false };
        this._isImporting = false;
        this._importCompleted = false;
    }

    createModal() {
        // Remove any existing wizard
        document.getElementById('templateImportWizard')?.remove();

        // Create overlay container - using condition-modal pattern (proven to work)
        const overlay = document.createElement('div');
        overlay.id = 'templateImportWizard';
        overlay.className = 'condition-modal';
        // CRITICAL: Set display:flex inline to show immediately (condition-modal has display:none by default)
        overlay.style.cssText = 'display: flex; z-index: 10000;';
        
        // Create modal content container
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content import-wizard-content';
        modalContent.innerHTML = `
            <!-- Header -->
            <div class="import-wizard-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="fas fa-file-import"></i>
                    </div>
                    <div>
                        <h2>Import Templates from YAML</h2>
                        <p class="header-subtitle">Smart analysis & batch import for MythicMobs skills</p>
                    </div>
                </div>
                <button class="btn-close" id="closeImportWizard" type="button" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Progress Steps -->
            <div class="import-wizard-progress">
                <div class="progress-track"></div>
                <div class="progress-step active" data-step="1">
                    <div class="step-icon"><i class="fas fa-upload"></i></div>
                    <div class="step-label">Upload</div>
                </div>
                <div class="progress-step" data-step="2">
                    <div class="step-icon"><i class="fas fa-search-plus"></i></div>
                    <div class="step-label">Analysis</div>
                </div>
                <div class="progress-step" data-step="3">
                    <div class="step-icon"><i class="fas fa-layer-group"></i></div>
                    <div class="step-label">Group</div>
                </div>
                <div class="progress-step" data-step="4">
                    <div class="step-icon"><i class="fas fa-sliders-h"></i></div>
                    <div class="step-label">Configure</div>
                </div>
                <div class="progress-step" data-step="5">
                    <div class="step-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="step-label">Review</div>
                </div>
            </div>
            
            <!-- Body Content -->
            <div class="import-wizard-body">
                <div id="wizardStepContent" class="wizard-content"></div>
            </div>
            
            <!-- Footer with Buttons -->
            <div class="import-wizard-footer">
                <button class="btn btn-secondary" id="wizardBack" type="button" style="display: none;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <div class="footer-spacer"></div>
                <button class="btn btn-secondary" id="wizardCancel" type="button">Cancel</button>
                <button class="btn btn-primary" id="wizardNext" type="button">
                    Next <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;

        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);
        
        // Store references
        this.overlay = overlay;
        this.modalContent = modalContent;
        
        // Inject styles
        this.injectStyles();

        // Bind events using direct references (more reliable than getElementById)
        const closeBtn = modalContent.querySelector('#closeImportWizard');
        const cancelBtn = modalContent.querySelector('#wizardCancel');
        const backBtn = modalContent.querySelector('#wizardBack');
        const nextBtn = modalContent.querySelector('#wizardNext');
        
        // Use arrow functions to preserve 'this' context
        // Prevent closing during import
        closeBtn?.addEventListener('click', () => {
            if (!this._isImporting) this.close();
        });
        cancelBtn?.addEventListener('click', () => {
            if (!this._isImporting) this.close();
        });
        backBtn?.addEventListener('click', () => this.previousStep());
        nextBtn?.addEventListener('click', () => this.nextStep());
        
        // Close on overlay background click (but not during import)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && !this._isImporting) this.close();
        });
    }

    injectStyles() {
        if (document.getElementById('importWizardStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'importWizardStyles';
        styles.textContent = `
            /* ============================================
               Import Wizard Styles
               Uses condition-modal pattern (proven to work)
               ============================================ */
            
            /* Modal Content Container */
            .import-wizard-content {
                width: 90%;
                max-width: 850px;
                max-height: 88vh;
                background: var(--bg-secondary);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
                animation: importWizardSlideIn 0.25s ease-out;
                display: flex;
                flex-direction: column;
            }
            
            @keyframes importWizardSlideIn {
                from { opacity: 0; transform: translateY(-12px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            
            /* Header with Gradient */
            .import-wizard-header {
                background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
                padding: 1.25rem 1.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .import-wizard-header .header-title {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .import-wizard-header .header-icon {
                width: 46px;
                height: 46px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.3rem;
                color: white;
            }
            .import-wizard-header h2 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 600;
                color: white;
            }
            .import-wizard-header .header-subtitle {
                margin: 0.25rem 0 0;
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.85);
            }
            .import-wizard-header .btn-close {
                background: rgba(255, 255, 255, 0.15);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s;
            }
            .import-wizard-header .btn-close:hover {
                background: rgba(255, 255, 255, 0.25);
            }
            
            /* Progress Steps */
            .import-wizard-progress {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 1.25rem 2rem;
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
                position: relative;
            }
            .import-wizard-progress .progress-track {
                position: absolute;
                top: 2rem;
                left: 15%;
                right: 15%;
                height: 2px;
                background: var(--border-color);
                border-radius: 2px;
                z-index: 0;
            }
            .import-wizard-progress .progress-step {
                flex: 1;
                text-align: center;
                position: relative;
                z-index: 2;
            }
            .import-wizard-progress .step-icon {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: var(--bg-primary);
                border: 2px solid var(--border-color);
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 0.4rem;
                font-size: 0.9rem;
                transition: background 0.2s, border-color 0.2s, color 0.2s;
            }
            .import-wizard-progress .progress-step.active .step-icon {
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                border-color: #7c3aed;
                color: white;
                box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
            }
            .import-wizard-progress .progress-step.completed .step-icon {
                background: #10b981;
                border-color: #10b981;
                color: white;
            }
            .import-wizard-progress .progress-step.completed .step-icon i::before {
                content: "\\f00c";
            }
            .import-wizard-progress .step-label {
                font-size: 0.75rem;
                color: var(--text-secondary);
                font-weight: 500;
                transition: color 0.2s;
            }
            .import-wizard-progress .progress-step.active .step-label {
                color: #7c3aed;
                font-weight: 600;
            }
            .import-wizard-progress .progress-step.completed .step-label {
                color: #10b981;
            }
            
            /* Body */
            .import-wizard-body {
                flex: 1;
                overflow-y: auto;
                max-height: calc(88vh - 220px);
            }
            
            /* Wizard Content Area */
            .wizard-content {
                padding: 1.5rem;
            }
            
            /* File drop zone */
            .yaml-drop-zone {
                border: 2px dashed rgba(124, 58, 237, 0.35);
                border-radius: 14px;
                padding: 2.5rem 2rem;
                text-align: center;
                cursor: pointer;
                transition: border-color 0.2s, background 0.2s;
                background: rgba(124, 58, 237, 0.03);
            }
            .yaml-drop-zone:hover, .yaml-drop-zone.dragover {
                border-color: #7c3aed;
                background: rgba(124, 58, 237, 0.08);
            }
            .yaml-drop-zone .drop-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 1rem;
                border-radius: 50%;
                background: rgba(124, 58, 237, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.75rem;
                color: #7c3aed;
            }
            .yaml-drop-zone .drop-title {
                font-size: 1.05rem;
                font-weight: 600;
                margin-bottom: 0.4rem;
                color: var(--text-primary);
            }
            .yaml-drop-zone .drop-subtitle {
                color: var(--text-secondary);
                font-size: 0.85rem;
            }
            
            /* File Loaded Indicator */
            .file-loaded-indicator {
                animation: fadeIn 0.3s ease-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Footer */
            .import-wizard-footer {
                background: var(--bg-tertiary);
                border-top: 1px solid var(--border-color);
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .import-wizard-footer .footer-spacer {
                flex: 1;
            }
            .import-wizard-footer .btn {
                padding: 0.6rem 1.25rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.15s;
            }
            .import-wizard-footer .btn-secondary {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                color: var(--text-secondary);
            }
            .import-wizard-footer .btn-secondary:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }
            .import-wizard-footer .btn-primary {
                background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                border: none;
                color: white;
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
            }
            .import-wizard-footer .btn-primary:hover {
                box-shadow: 0 6px 18px rgba(124, 58, 237, 0.35);
            }
            .import-wizard-footer .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            /* Analysis cards */
            .analysis-section {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 1rem;
                margin-bottom: 0.75rem;
            }
            .analysis-section h4 {
                margin: 0 0 0.6rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
            }
            
            /* File Type Selection */
            .file-type-section {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 1rem;
                margin-top: 0.75rem;
            }
            .file-type-section h4 {
                margin: 0 0 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
            }
            .file-type-options {
                display: flex;
                gap: 0.6rem;
                flex-wrap: wrap;
            }
            .file-type-option {
                flex: 1;
                min-width: 150px;
                padding: 0.875rem 1rem;
                border: 2px solid var(--border-color);
                border-radius: 10px;
                background: var(--bg-primary);
                cursor: pointer;
                transition: border-color 0.15s, background 0.15s;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .file-type-option:hover {
                border-color: var(--primary-color);
                background: var(--bg-tertiary);
            }
            .file-type-option.selected {
                border-color: var(--primary-color);
                background: rgba(124, 58, 237, 0.1);
            }
            .file-type-option input[type="radio"] {
                display: none;
            }
            .file-type-option .radio-custom {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid var(--border-color);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: border-color 0.15s, background 0.15s;
            }
            .file-type-option.selected .radio-custom {
                border-color: var(--primary-color);
                background: var(--primary-color);
            }
            .file-type-option.selected .radio-custom::after {
                content: '';
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: white;
            }
            .file-type-option .option-content {
                flex: 1;
            }
            .file-type-option .option-label {
                font-weight: 600;
                font-size: 0.9rem;
            }
            .file-type-option .option-desc {
                font-size: 0.8rem;
                color: var(--text-secondary);
                margin-top: 0.125rem;
            }
            
            /* Component badges */
            .component-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .component-badge {
                background: var(--bg-tertiary);
                padding: 0.25rem 0.5rem;
                border-radius: 6px;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            .component-badge .count {
                background: var(--primary-color);
                color: white;
                padding: 0.1rem 0.4rem;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
            }
            
            /* Skill groups */
            .skill-group {
                border: 2px solid var(--border-color);
                border-radius: 12px;
                margin-bottom: 1rem;
                background: var(--bg-secondary);
                overflow: hidden;
            }
            .skill-group.selected {
                border-color: var(--primary-color);
            }
            .skill-group-header {
                background: var(--bg-tertiary);
                padding: 0.75rem 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
            }
            .skill-group-header h4 {
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .skill-group-body {
                padding: 0.75rem 1rem;
            }
            .skill-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem;
                border-radius: 6px;
                margin-bottom: 0.25rem;
                background: var(--bg-primary);
                cursor: move;
            }
            .skill-item:hover {
                background: var(--bg-tertiary);
            }
            .skill-item.excluded {
                opacity: 0.5;
                text-decoration: line-through;
            }
            .skill-item .skill-meta {
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            /* Drag and drop styles */
            .skill-item.dragging {
                opacity: 0.5;
                background: var(--bg-tertiary);
                border: 2px dashed var(--primary-color);
            }
            .skill-item.drag-over {
                border-top: 3px solid var(--primary-color);
                margin-top: -3px;
            }
            .skill-item.drag-over-bottom {
                border-bottom: 3px solid var(--primary-color);
                margin-bottom: -3px;
            }
            .skill-item.create-group-target {
                background: var(--primary-color-dim, rgba(var(--primary-rgb, 99, 102, 241), 0.2));
                border: 2px solid var(--primary-color);
                animation: pulseGlow 0.8s ease-in-out infinite;
            }
            @keyframes pulseGlow {
                0%, 100% { box-shadow: 0 0 5px var(--primary-color); }
                50% { box-shadow: 0 0 15px var(--primary-color); }
            }
            .skill-group-body.drag-over {
                background: var(--bg-tertiary);
                border: 2px dashed var(--primary-color);
                border-radius: 8px;
            }
            .skill-group.drag-over-group {
                border-color: var(--primary-color);
                box-shadow: 0 0 10px var(--primary-color);
            }
            .ungrouped-drop-zone.drag-over {
                background: var(--bg-tertiary);
                border-color: var(--primary-color) !important;
            }
            
            /* Group drag and drop */
            .skill-group.group-dragging {
                opacity: 0.6;
                border: 2px dashed var(--primary-color);
                background: var(--bg-tertiary);
            }
            .skill-group.group-drag-over-top {
                border-top: 3px solid var(--success-color, #22c55e);
                margin-top: -3px;
            }
            .skill-group.group-drag-over-bottom {
                border-bottom: 3px solid var(--success-color, #22c55e);
                margin-bottom: -3px;
            }
            .skill-group .group-drag-handle {
                cursor: grab;
                padding: 0.25rem 0.5rem;
                margin-right: 0.5rem;
                color: var(--text-secondary);
                border-radius: 4px;
                transition: background 0.15s, color 0.15s;
            }
            .skill-group .group-drag-handle:hover {
                background: var(--bg-tertiary);
                color: var(--primary-color);
            }
            .skill-group .group-drag-handle:active {
                cursor: grabbing;
            }
            .drag-hint {
                font-size: 0.75rem;
                color: var(--text-secondary);
                margin-top: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .drag-hint i {
                color: var(--primary-color);
            }
            
            /* Quick actions */
            .quick-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }
            .quick-action-btn {
                flex: 1;
                padding: 1.25rem;
                border: 2px solid var(--border-color);
                border-radius: 12px;
                background: var(--bg-secondary);
                cursor: pointer;
                text-align: center;
                transition: border-color 0.15s, background 0.15s;
            }
            .quick-action-btn:hover {
                border-color: var(--primary-color);
                background: var(--bg-tertiary);
            }
            .quick-action-btn.primary {
                border-color: var(--primary-color);
                background: var(--primary-color);
                color: white;
            }
            .quick-action-btn i {
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
            }
            
            /* Template config cards */
            .template-config-card {
                border: 1px solid var(--border-color);
                border-radius: 8px;
                margin-bottom: 1rem;
                overflow: hidden;
            }
            .template-config-header {
                background: var(--bg-secondary);
                padding: 0.75rem 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
            }
            .template-config-body {
                padding: 1rem;
                display: none;
            }
            .template-config-card.expanded .template-config-body {
                display: block;
            }
            
            /* Warnings */
            .warning-item {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 0.75rem;
                background: var(--bg-secondary);
                border-radius: 6px;
                margin-bottom: 0.5rem;
                border-left: 3px solid var(--warning);
            }
            .warning-item.info {
                border-left-color: var(--info);
            }
            .warning-item i {
                color: var(--warning);
                margin-top: 0.1rem;
            }
            .warning-item.info i {
                color: var(--info);
            }
            
            /* Duplicate check */
            .duplicate-item {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 0.75rem;
            }
            .duplicate-match {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.5rem;
                background: var(--bg-tertiary);
                border-radius: 4px;
                margin-top: 0.5rem;
            }
            .similarity-bar {
                width: 60px;
                height: 8px;
                background: var(--bg-primary);
                border-radius: 4px;
                overflow: hidden;
            }
            .similarity-fill {
                height: 100%;
                background: var(--warning);
            }
            .similarity-fill.high {
                background: var(--error);
            }
            
            /* Results */
            .result-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                background: var(--bg-secondary);
                border-radius: 8px;
                margin-bottom: 0.5rem;
                border: 1px solid var(--border-color);
            }
            .result-item.success { border-left: 3px solid var(--success); }
            .result-item.success i { color: var(--success); }
            .result-item.failed { border-left: 3px solid var(--error); }
            .result-item.failed i { color: var(--error); }
            
            /* Description validation */
            .description-hint {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.75rem;
                margin-top: 0.35rem;
                padding: 0 0.25rem;
            }
            .description-hint.error {
                color: var(--error);
            }
            .description-hint.valid {
                color: var(--success);
            }
            .description-hint i {
                margin-left: 0.25rem;
            }
            .input-error {
                border-color: var(--error) !important;
                box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
            }
            .template-config-card.has-error {
                border-color: var(--error);
            }
            .template-config-card.has-error .template-config-header {
                background: rgba(239, 68, 68, 0.1);
            }
            
            /* Complexity indicator */
            .complexity-bar {
                display: flex;
                gap: 2px;
            }
            .complexity-segment {
                width: 12px;
                height: 4px;
                background: var(--border-color);
                border-radius: 2px;
            }
            .complexity-segment.active {
                background: var(--primary-color);
            }
            .complexity-segment.active.beginner { background: var(--success); }
            .complexity-segment.active.intermediate { background: var(--info); }
            .complexity-segment.active.advanced { background: var(--warning); }
            .complexity-segment.active.expert { background: var(--error); }
            
            /* YAML Textarea */
            .yaml-textarea {
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                font-size: 0.85rem;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 1rem;
                resize: vertical;
                line-height: 1.5;
            }
            .yaml-textarea:focus {
                border-color: var(--primary-color);
                outline: none;
                box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
            }
            
            /* Parse Error */
            .parse-error {
                margin-top: 1rem;
                padding: 1rem;
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 10px;
                color: #fca5a5;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .parse-error i {
                color: #ef4444;
                font-size: 1.1rem;
            }
        `;
        document.head.appendChild(styles);
    }

    renderStep() {
        // Use stored reference for better performance
        const container = this.modalContent || document;
        
        // Update progress indicators
        container.querySelectorAll('.progress-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum < this.currentStep) step.classList.add('completed');
            else if (stepNum === this.currentStep) step.classList.add('active');
        });

        // Update navigation buttons
        const backBtn = container.querySelector('#wizardBack');
        const nextBtn = container.querySelector('#wizardNext');
        
        if (backBtn) backBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        
        if (this.currentStep === this.totalSteps) {
            if (nextBtn) nextBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Create Templates';
        } else {
            if (nextBtn) nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }

        // Render step content
        const content = container.querySelector('#wizardStepContent');
        if (!content) return;
        
        switch (this.currentStep) {
            case 1: content.innerHTML = this.renderStep1(); this.attachStep1Listeners(); break;
            case 2: content.innerHTML = this.renderStep2(); this.attachStep2Listeners(); break;
            case 3: content.innerHTML = this.renderStep3(); this.attachStep3Listeners(); break;
            case 4: content.innerHTML = this.renderStep4(); this.attachStep4Listeners(); break;
            case 5: content.innerHTML = this.renderStep5(); break;
        }
    }

    // STEP 1: Upload & File Type Selection
    renderStep1() {
        return `
            <div class="yaml-drop-zone" id="yamlDropZone">
                <div class="drop-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="drop-title">Drop YAML file here or click to browse</div>
                <div class="drop-subtitle">Supports .yml, .yaml files • MythicMobs skill and mob configurations</div>
                <input type="file" id="yamlFileInput" accept=".yml,.yaml" style="display: none;">
            </div>
            
            ${this.loadedFileName ? `
                <div class="file-loaded-indicator" style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-file-code" style="color: #10b981; font-size: 1.5rem;"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #10b981;">${this.loadedFileName}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${this.yamlContent.split('\n').length} lines loaded</div>
                    </div>
                    <button class="btn btn-ghost btn-sm" id="clearLoadedFile" style="color: var(--text-secondary);">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
            ` : ''}
            
            <div class="file-type-section">
                <h4><i class="fas fa-magic"></i> File Type Detection</h4>
                <div class="file-type-options">
                    <label class="file-type-option ${!this.forcedFileType ? 'selected' : ''}" data-value="auto">
                        <input type="radio" name="fileType" value="auto" ${!this.forcedFileType ? 'checked' : ''}>
                        <div class="radio-custom"></div>
                        <div class="option-content">
                            <div class="option-label">✨ Auto-detect</div>
                            <div class="option-desc">Recommended - Smart detection</div>
                        </div>
                    </label>
                    <label class="file-type-option ${this.forcedFileType === 'mob' ? 'selected' : ''}" data-value="mob">
                        <input type="radio" name="fileType" value="mob" ${this.forcedFileType === 'mob' ? 'checked' : ''}>
                        <div class="radio-custom"></div>
                        <div class="option-content">
                            <div class="option-label">🐲 Mob File</div>
                            <div class="option-desc">Extract Skills sections only</div>
                        </div>
                    </label>
                    <label class="file-type-option ${this.forcedFileType === 'skill' ? 'selected' : ''}" data-value="skill">
                        <input type="radio" name="fileType" value="skill" ${this.forcedFileType === 'skill' ? 'checked' : ''}>
                        <div class="radio-custom"></div>
                        <div class="option-content">
                            <div class="option-label">⚡ Skill File</div>
                            <div class="option-desc">Parse all top-level skills</div>
                        </div>
                    </label>
                </div>
            </div>
            
            <div id="parseError" class="parse-error" style="display: none;">
                <i class="fas fa-exclamation-triangle"></i>
                <span id="parseErrorMessage"></span>
            </div>
        `;
    }

    attachStep1Listeners() {
        const dropZone = document.getElementById('yamlDropZone');
        const fileInput = document.getElementById('yamlFileInput');
        const clearBtn = document.getElementById('clearLoadedFile');

        dropZone?.addEventListener('click', () => fileInput?.click());
        dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.loadFile(file);
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadFile(e.target.files[0]);
        });

        clearBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.yamlContent = '';
            this.loadedFileName = null;
            this.renderStep();
        });

        // File type options with visual selection
        document.querySelectorAll('.file-type-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.file-type-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;
                this.forcedFileType = radio.value === 'auto' ? null : radio.value;
            });
        });
    }

    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.yamlContent = e.target.result;
            this.loadedFileName = file.name;
            this.renderStep();
        };
        reader.onerror = (e) => {
            console.error('[Import Wizard] File read error:', e);
        };
        reader.readAsText(file);
    }

    // STEP 2: Analysis Results
    renderStep2() {
        if (!this.analysisResult) return '<p>No analysis available</p>';
        const r = this.analysisResult;
        
        // Determine if this is a mob file based on source types
        const isMobFile = r.fileType === 'mob' || r.skills?.some(s => s.sourceType === 'mob');
        const entityName = isMobFile ? 'Mobs' : 'Skills';
        const entityNameSingular = isMobFile ? 'mob' : 'skill';
        
        return `
            <div class="analysis-section">
                <h4><i class="fas fa-file-alt"></i> File Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${r.totalSkills}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${entityName} Found</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${r.totalLines}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Total Lines</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${isMobFile ? 'Mob' : 'Skill'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">File Type</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${isMobFile ? 'Mob Template' : (r.hasTriggers ? 'Mob' : 'Skill')}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Context</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-brain"></i> Smart Detection</h4>
                <p style="margin: 0 0 1rem; color: var(--text-secondary);">
                    Suggested <strong>${r.suggestedGroups.totalGroups}</strong> template groups from <strong>${r.totalSkills}</strong> ${entityName.toLowerCase()}
                    (${r.suggestedGroups.totalStandalone} standalone)
                </p>
                
                ${r.suggestedGroups.groups.map(g => `
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-layer-group" style="color: var(--primary-color);"></i>
                        <strong>"${g.suggestedName}"</strong>
                        <span style="color: var(--text-secondary);">(${g.skills.length} ${g.skills.length === 1 ? entityNameSingular : entityName.toLowerCase()}, ${g.reason})</span>
                    </div>
                `).join('')}
                
                ${r.suggestedGroups.standalone.length > 0 ? `
                    <div style="margin-top: 0.5rem; color: var(--text-secondary);">
                        + ${r.suggestedGroups.standalone.length} standalone ${entityName.toLowerCase()} will become individual templates
                    </div>
                ` : ''}
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-puzzle-piece"></i> Components Detected</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">
                            <i class="fas fa-cog"></i> Mechanics (${Object.keys(r.componentStats.mechanics).length})
                        </div>
                        <div class="component-grid">
                            ${Object.entries(r.componentStats.mechanics).slice(0, 8).map(([m, c]) => `
                                <span class="component-badge">${m} <span class="count">${c}</span></span>
                            `).join('')}
                            ${Object.keys(r.componentStats.mechanics).length > 8 ? `<span class="component-badge">+${Object.keys(r.componentStats.mechanics).length - 8} more</span>` : ''}
                        </div>
                    </div>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">
                            <i class="fas fa-crosshairs"></i> Targeters (${Object.keys(r.componentStats.targeters).length})
                        </div>
                        <div class="component-grid">
                            ${Object.entries(r.componentStats.targeters).slice(0, 6).map(([t, c]) => `
                                <span class="component-badge">${t} <span class="count">${c}</span></span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            ${r.warnings.length > 0 ? `
                <div class="analysis-section">
                    <h4><i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i> Warnings (${r.warnings.length})</h4>
                    ${r.warnings.slice(0, 5).map(w => `
                        <div class="warning-item ${w.severity}">
                            <i class="fas fa-${w.severity === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                            <span>${w.message}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="quick-actions">
                <div class="quick-action-btn primary" id="acceptSuggestions">
                    <i class="fas fa-rocket"></i>
                    <div style="font-weight: 600;">Accept Smart Suggestions</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">Create ${r.suggestedGroups.totalGroups + r.suggestedGroups.totalStandalone} templates with auto-detected settings</div>
                </div>
                <div class="quick-action-btn" id="customizeGroupings">
                    <i class="fas fa-edit"></i>
                    <div style="font-weight: 600;">Customize Groupings</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Manually adjust which skills go together</div>
                </div>
            </div>
        `;
    }

    attachStep2Listeners() {
        document.getElementById('acceptSuggestions')?.addEventListener('click', () => {
            this.applySmartSuggestions();
            this.currentStep = 4; // Skip to configure
            this.renderStep();
        });

        document.getElementById('customizeGroupings')?.addEventListener('click', () => {
            this.applySmartSuggestions();
            this.currentStep = 3;
            this.renderStep();
        });
    }

    applySmartSuggestions() {
        const r = this.analysisResult;
        
        // Debug: Log what we're working with
        console.log('[Import Wizard] Applying smart suggestions');
        console.log('[Import Wizard] suggestedGroups.groups:', r.suggestedGroups.groups?.length || 0);
        console.log('[Import Wizard] suggestedGroups.standalone:', r.suggestedGroups.standalone?.length || 0);
        
        this.groups = (r.suggestedGroups.groups || []).map(g => {
            console.log('[Import Wizard] Creating group:', g.suggestedName, 'with', g.skills?.length, 'skills');
            return {
                ...g,
                id: this.generateId(),
                collapsed: true
            };
        });
        
        this.standalone = (r.suggestedGroups.standalone || []).map(s => ({
            ...s,
            id: this.generateId()
        }));
        
        this.batchSettings.context = r.context;
        
        console.log('[Import Wizard] After applying: groups=', this.groups.length, 'standalone=', this.standalone.length);
    }

    generateId() {
        return 'g_' + Math.random().toString(36).substr(2, 9);
    }

    // STEP 3: Skill Grouping
    renderStep3() {
        return `
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-secondary btn-sm" id="selectAllSkills">
                    <i class="fas fa-check-square"></i> Select All
                </button>
                <button class="btn btn-secondary btn-sm" id="deselectAllSkills">
                    <i class="fas fa-square"></i> Deselect All
                </button>
                <button class="btn btn-secondary btn-sm" id="createGroupBtn">
                    <i class="fas fa-folder-plus"></i> Create Group from Selected
                </button>
                <button class="btn btn-secondary btn-sm" id="resetGroupings">
                    <i class="fas fa-undo"></i> Reset to Suggested
                </button>
            </div>
            <div class="drag-hint">
                <i class="fas fa-info-circle"></i>
                <span>Drag skills to reorder, move between groups, or hold over another skill to create a new group</span>
            </div>
            
            <div id="groupsContainer" style="margin-top: 1rem;">
                ${this.groups.map((group, gi) => this.renderSkillGroup(group, gi)).join('')}
            </div>
            
            <div class="skill-group ungrouped-drop-zone" style="border-style: dashed;" data-group-id="standalone">
                <div class="skill-group-header" style="cursor: default;">
                    <h4><i class="fas fa-list" style="color: var(--text-secondary);"></i> Ungrouped Skills</h4>
                    <span style="color: var(--text-secondary); font-size: 0.8rem;">Each becomes a single-section template</span>
                </div>
                <div class="skill-group-body" id="ungroupedSkills" data-drop-zone="standalone">
                    ${this.standalone.map((skill, si) => this.renderSkillItem(skill, 'standalone', si)).join('')}
                    ${this.standalone.length === 0 ? '<p class="empty-drop-hint" style="color: var(--text-secondary); margin: 0; padding: 1rem; text-align: center;">Drop skills here to ungroup them</p>' : ''}
                </div>
            </div>
            
            <div class="analysis-section" style="margin-top: 1rem;">
                <h4><i class="fas fa-clipboard-list"></i> Import Summary</h4>
                <p style="margin: 0;">
                    <strong>${this.groups.length + this.standalone.length - this.excludedSkills.size}</strong> templates to create
                    ${this.groups.length > 0 ? `(${this.groups.length} multi-section, ${this.standalone.filter(s => !this.excludedSkills.has(s.name)).length} single)` : ''}
                    ${this.excludedSkills.size > 0 ? `, <span style="color: var(--text-secondary);">${this.excludedSkills.size} excluded</span>` : ''}
                </p>
            </div>
        `;
    }

    renderSkillGroup(group, index) {
        return `
            <div class="skill-group" data-group-id="${group.id}" data-group-index="${index}" draggable="true">
                <div class="skill-group-header" onclick="window.importWizardInstance.toggleGroup('${group.id}')" 
                     data-drop-zone="${group.id}" data-drop-position="top">
                    <h4>
                        <span class="group-drag-handle" title="Drag to reorder groups" onclick="event.stopPropagation()">
                            <i class="fas fa-grip-lines"></i>
                        </span>
                        <i class="fas fa-${group.collapsed ? 'chevron-right' : 'chevron-down'}"></i>
                        <i class="fas fa-layer-group" style="color: var(--primary-color);"></i>
                        <input type="text" class="form-input" value="${group.suggestedName}" 
                            onclick="event.stopPropagation()" 
                            onchange="window.importWizardInstance.updateGroupName('${group.id}', this.value)"
                            style="border: none; background: transparent; font-weight: 600; font-size: inherit; padding: 0; width: auto;">
                    </h4>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="color: var(--text-secondary); font-size: 0.8rem;">${group.skills.length} skills • ${group.reason}</span>
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); window.importWizardInstance.ungroupAll('${group.id}')">
                            <i class="fas fa-unlink"></i> Ungroup
                        </button>
                    </div>
                </div>
                <div class="skill-group-body" data-drop-zone="${group.id}" style="${group.collapsed ? 'display: none;' : ''}">
                    ${group.skills.map((skill, si) => this.renderSkillItem(skill, group.id, si)).join('')}
                    ${group.skills.length === 0 ? '<p class="empty-drop-hint" style="color: var(--text-secondary); margin: 0; padding: 0.5rem; text-align: center;">Drop skills here</p>' : ''}
                </div>
            </div>
        `;
    }

    renderSkillItem(skill, groupId, index) {
        const isExcluded = this.excludedSkills.has(skill.name);
        const complexityLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const complexityIndex = complexityLevels.indexOf(skill.complexity);
        
        return `
            <div class="skill-item ${isExcluded ? 'excluded' : ''}" 
                 data-skill-name="${skill.name}" 
                 data-group-id="${groupId}"
                 draggable="true">
                <input type="checkbox" 
                    ${isExcluded ? '' : 'checked'} 
                    onchange="window.importWizardInstance.toggleSkillExclusion('${skill.name}')">
                <i class="fas fa-grip-vertical" style="color: var(--text-secondary); cursor: move;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${skill.name}</div>
                    <div class="skill-meta">
                        ${skill.lineCount} lines • ${skill.mechanics.slice(0, 3).join(', ')}${skill.mechanics.length > 3 ? '...' : ''}
                        ${skill.skillCalls.length > 0 ? `• calls ${skill.skillCalls.length}` : ''}
                    </div>
                </div>
                <div class="complexity-bar" title="${skill.complexity}">
                    ${complexityLevels.map((level, i) => `
                        <div class="complexity-segment ${i <= complexityIndex ? 'active ' + skill.complexity : ''}"></div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    toggleGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.collapsed = !group.collapsed;
            // Optimized: Toggle visibility without full re-render
            const groupEl = document.querySelector(`.skill-group[data-group-id="${groupId}"]`);
            if (groupEl) {
                const body = groupEl.querySelector('.skill-group-body');
                const chevron = groupEl.querySelector('.skill-group-header h4 i:first-child');
                if (body) body.style.display = group.collapsed ? 'none' : 'block';
                if (chevron) chevron.className = `fas fa-${group.collapsed ? 'chevron-right' : 'chevron-down'}`;
            }
        }
    }

    updateGroupName(groupId, name) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) group.suggestedName = name;
    }

    ungroupAll(groupId) {
        const groupIndex = this.groups.findIndex(g => g.id === groupId);
        if (groupIndex > -1) {
            const group = this.groups[groupIndex];
            this.standalone.push(...group.skills);
            this.groups.splice(groupIndex, 1);
            this.renderStep();
        }
    }

    toggleSkillExclusion(skillName) {
        if (this.excludedSkills.has(skillName)) {
            this.excludedSkills.delete(skillName);
        } else {
            this.excludedSkills.add(skillName);
        }
        // Optimized: Update only the affected skill item instead of full re-render
        this.updateSkillItemVisual(skillName);
        this.updateImportSummary();
    }

    // Performance optimization: update single skill item without full re-render
    updateSkillItemVisual(skillName) {
        const isExcluded = this.excludedSkills.has(skillName);
        const skillItem = document.querySelector(`.skill-item[data-skill-name="${skillName}"]`);
        if (skillItem) {
            skillItem.classList.toggle('excluded', isExcluded);
            const checkbox = skillItem.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = !isExcluded;
        }
    }

    // Performance optimization: update summary without full re-render  
    updateImportSummary() {
        const summaryP = document.querySelector('.analysis-section:last-child p');
        if (summaryP) {
            const totalTemplates = this.groups.length + this.standalone.length - this.excludedSkills.size;
            const standaloneCount = this.standalone.filter(s => !this.excludedSkills.has(s.name)).length;
            summaryP.innerHTML = `
                <strong>${totalTemplates}</strong> templates to create
                ${this.groups.length > 0 ? `(${this.groups.length} multi-section, ${standaloneCount} single)` : ''}
                ${this.excludedSkills.size > 0 ? `, <span style="color: var(--text-secondary);">${this.excludedSkills.size} excluded</span>` : ''}
            `;
        }
    }

    attachStep3Listeners() {
        window.importWizardInstance = this;

        document.getElementById('selectAllSkills')?.addEventListener('click', () => {
            this.excludedSkills.clear();
            this.renderStep();
        });

        document.getElementById('deselectAllSkills')?.addEventListener('click', () => {
            const allSkills = [
                ...this.groups.flatMap(g => g.skills),
                ...this.standalone
            ];
            allSkills.forEach(s => this.excludedSkills.add(s.name));
            this.renderStep();
        });

        document.getElementById('resetGroupings')?.addEventListener('click', () => {
            this.applySmartSuggestions();
            this.excludedSkills.clear();
            this.renderStep();
        });

        document.getElementById('createGroupBtn')?.addEventListener('click', () => {
            // Find selected ungrouped skills
            const selectedStandalone = this.standalone.filter(s => !this.excludedSkills.has(s.name));
            if (selectedStandalone.length >= 2) {
                const newGroup = {
                    id: this.generateId(),
                    type: 'manual',
                    reason: 'Manually grouped',
                    suggestedName: 'New Group',
                    skills: selectedStandalone,
                    confidence: 1,
                    collapsed: false
                };
                this.groups.push(newGroup);
                this.standalone = this.standalone.filter(s => this.excludedSkills.has(s.name));
                this.renderStep();
            } else {
                alert('Select at least 2 ungrouped skills to create a group');
            }
        });
        
        // Initialize drag and drop
        this.initDragAndDrop();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // DRAG AND DROP FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════════════
    
    initDragAndDrop() {
        // State for drag operations
        this.dragState = {
            draggedSkill: null,
            draggedFromGroup: null,
            createGroupTimer: null,
            createGroupTarget: null,
            // Group drag state
            draggedGroupId: null,
            isGroupDrag: false
        };
        
        const container = this.modalContent || document;
        
        // Attach drag events to all skill items
        container.querySelectorAll('.skill-item').forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOverSkill(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeaveSkill(e));
            item.addEventListener('drop', (e) => this.handleDropOnSkill(e));
        });
        
        // Attach drop events to group bodies
        container.querySelectorAll('.skill-group-body').forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDragOverZone(e));
            zone.addEventListener('dragleave', (e) => this.handleDragLeaveZone(e));
            zone.addEventListener('drop', (e) => this.handleDropOnZone(e));
        });
        
        // Attach drop events to group headers (for dropping at top of group)
        container.querySelectorAll('.skill-group-header[data-drop-zone]').forEach(header => {
            header.addEventListener('dragover', (e) => this.handleDragOverZone(e));
            header.addEventListener('dragleave', (e) => this.handleDragLeaveZone(e));
            header.addEventListener('drop', (e) => this.handleDropOnZone(e));
        });
        
        // Attach drag events to skill groups (for reordering groups)
        container.querySelectorAll('.skill-group[draggable="true"]').forEach(group => {
            group.addEventListener('dragstart', (e) => this.handleGroupDragStart(e));
            group.addEventListener('dragend', (e) => this.handleGroupDragEnd(e));
            group.addEventListener('dragover', (e) => this.handleGroupDragOver(e));
            group.addEventListener('dragleave', (e) => this.handleGroupDragLeave(e));
            group.addEventListener('drop', (e) => this.handleGroupDrop(e));
        });
    }
    
    handleDragStart(e) {
        // If dragging from the group drag handle, let group drag take over
        if (e.target.closest('.group-drag-handle')) {
            return; // Let it bubble up to group drag
        }
        
        const skillItem = e.target.closest('.skill-item');
        if (!skillItem) return;
        
        const skillName = skillItem.dataset.skillName;
        const groupId = skillItem.dataset.groupId;
        
        this.dragState.draggedSkill = skillName;
        this.dragState.draggedFromGroup = groupId;
        
        skillItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', skillName);
        
        // Add slight delay to allow the dragging class to be applied
        setTimeout(() => {
            skillItem.style.opacity = '0.5';
        }, 0);
    }
    
    handleDragEnd(e) {
        const skillItem = e.target.closest('.skill-item');
        if (skillItem) {
            skillItem.classList.remove('dragging');
            skillItem.style.opacity = '';
        }
        
        // Clear all drag states
        this.clearAllDragStates();
        
        // Clear create group timer
        if (this.dragState.createGroupTimer) {
            clearTimeout(this.dragState.createGroupTimer);
            this.dragState.createGroupTimer = null;
        }
        
        this.dragState.draggedSkill = null;
        this.dragState.draggedFromGroup = null;
        this.dragState.createGroupTarget = null;
    }
    
    handleDragOverSkill(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetItem = e.target.closest('.skill-item');
        if (!targetItem) return;
        
        const targetSkillName = targetItem.dataset.skillName;
        
        // Don't allow dropping on self
        if (targetSkillName === this.dragState.draggedSkill) return;
        
        e.dataTransfer.dropEffect = 'move';
        
        // Determine if we should show top or bottom indicator
        const rect = targetItem.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isTop = e.clientY < midY;
        
        // Clear existing indicators
        targetItem.classList.remove('drag-over', 'drag-over-bottom');
        targetItem.classList.add(isTop ? 'drag-over' : 'drag-over-bottom');
        
        // Set up timer for creating new group
        if (this.dragState.createGroupTarget !== targetSkillName) {
            // Clear existing timer
            if (this.dragState.createGroupTimer) {
                clearTimeout(this.dragState.createGroupTimer);
                // Remove previous target highlight
                const prevTarget = document.querySelector('.skill-item.create-group-target');
                if (prevTarget) prevTarget.classList.remove('create-group-target');
            }
            
            this.dragState.createGroupTarget = targetSkillName;
            
            // Start timer for create group indicator
            this.dragState.createGroupTimer = setTimeout(() => {
                targetItem.classList.add('create-group-target');
            }, 600); // 600ms hold to show create group indicator
        }
    }
    
    handleDragLeaveSkill(e) {
        const targetItem = e.target.closest('.skill-item');
        if (!targetItem) return;
        
        // Check if we're still within the same item
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && targetItem.contains(relatedTarget)) return;
        
        targetItem.classList.remove('drag-over', 'drag-over-bottom', 'create-group-target');
        
        // Clear create group timer
        if (this.dragState.createGroupTimer) {
            clearTimeout(this.dragState.createGroupTimer);
            this.dragState.createGroupTimer = null;
        }
        this.dragState.createGroupTarget = null;
    }
    
    handleDropOnSkill(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetItem = e.target.closest('.skill-item');
        if (!targetItem) return;
        
        const targetSkillName = targetItem.dataset.skillName;
        const targetGroupId = targetItem.dataset.groupId;
        const draggedSkillName = this.dragState.draggedSkill;
        const draggedFromGroup = this.dragState.draggedFromGroup;
        
        if (!draggedSkillName || draggedSkillName === targetSkillName) return;
        
        // Check if create-group-target is active (held long enough)
        if (targetItem.classList.contains('create-group-target')) {
            // Create new group with both skills
            this.createGroupFromTwoSkills(draggedSkillName, draggedFromGroup, targetSkillName, targetGroupId);
        } else {
            // Move skill to same group as target, position based on drop location
            const rect = targetItem.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const insertBefore = e.clientY < midY;
            
            this.moveSkillToGroup(draggedSkillName, draggedFromGroup, targetGroupId, targetSkillName, insertBefore);
        }
        
        this.clearAllDragStates();
        this.renderStep();
    }
    
    handleDragOverZone(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const zone = e.target.closest('[data-drop-zone]');
        if (!zone) return;
        
        e.dataTransfer.dropEffect = 'move';
        
        // Add visual feedback
        if (zone.classList.contains('skill-group-body')) {
            zone.classList.add('drag-over');
        } else if (zone.classList.contains('skill-group-header')) {
            zone.closest('.skill-group').classList.add('drag-over-group');
        }
    }
    
    handleDragLeaveZone(e) {
        const zone = e.target.closest('[data-drop-zone]');
        if (!zone) return;
        
        // Check if we're still within the zone
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && zone.contains(relatedTarget)) return;
        
        zone.classList.remove('drag-over');
        const group = zone.closest('.skill-group');
        if (group) group.classList.remove('drag-over-group');
    }
    
    handleDropOnZone(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const zone = e.target.closest('[data-drop-zone]');
        if (!zone) return;
        
        const targetGroupId = zone.dataset.dropZone;
        const draggedSkillName = this.dragState.draggedSkill;
        const draggedFromGroup = this.dragState.draggedFromGroup;
        
        if (!draggedSkillName) return;
        
        // Don't do anything if dropping in same group without position change
        if (targetGroupId === draggedFromGroup && !zone.classList.contains('skill-group-header')) {
            this.clearAllDragStates();
            return;
        }
        
        // Move skill to the target group
        const insertAtTop = zone.classList.contains('skill-group-header');
        this.moveSkillToGroup(draggedSkillName, draggedFromGroup, targetGroupId, null, insertAtTop);
        
        this.clearAllDragStates();
        this.renderStep();
    }
    
    clearAllDragStates() {
        const container = this.modalContent || document;
        
        container.querySelectorAll('.skill-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over', 'drag-over-bottom', 'create-group-target');
            item.style.opacity = '';
        });
        
        container.querySelectorAll('.skill-group-body').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        
        container.querySelectorAll('.skill-group').forEach(group => {
            group.classList.remove('drag-over-group', 'group-dragging', 'group-drag-over-top', 'group-drag-over-bottom');
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // GROUP DRAG AND DROP (for reordering groups)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    handleGroupDragStart(e) {
        // Only initiate group drag if starting from the drag handle
        const handle = e.target.closest('.group-drag-handle');
        if (!handle) {
            // Check if dragging a skill inside the group
            const skillItem = e.target.closest('.skill-item');
            if (skillItem) {
                return; // Let skill drag handle it
            }
        }
        
        const groupEl = e.target.closest('.skill-group[draggable="true"]');
        if (!groupEl) return;
        
        // Prevent skill drag if starting from group
        e.stopPropagation();
        
        const groupId = groupEl.dataset.groupId;
        
        this.dragState.draggedGroupId = groupId;
        this.dragState.isGroupDrag = true;
        
        groupEl.classList.add('group-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `group:${groupId}`);
    }
    
    handleGroupDragEnd(e) {
        const groupEl = e.target.closest('.skill-group');
        if (groupEl) {
            groupEl.classList.remove('group-dragging');
        }
        
        this.clearAllDragStates();
        
        this.dragState.draggedGroupId = null;
        this.dragState.isGroupDrag = false;
    }
    
    handleGroupDragOver(e) {
        // Only handle if we're doing a group drag
        if (!this.dragState.isGroupDrag) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const targetGroup = e.target.closest('.skill-group[draggable="true"]');
        if (!targetGroup) return;
        
        const targetGroupId = targetGroup.dataset.groupId;
        
        // Don't allow dropping on self
        if (targetGroupId === this.dragState.draggedGroupId) return;
        
        e.dataTransfer.dropEffect = 'move';
        
        // Determine if we should show top or bottom indicator
        const rect = targetGroup.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isTop = e.clientY < midY;
        
        // Clear existing indicators on all groups
        const container = this.modalContent || document;
        container.querySelectorAll('.skill-group').forEach(g => {
            g.classList.remove('group-drag-over-top', 'group-drag-over-bottom');
        });
        
        targetGroup.classList.add(isTop ? 'group-drag-over-top' : 'group-drag-over-bottom');
    }
    
    handleGroupDragLeave(e) {
        if (!this.dragState.isGroupDrag) return;
        
        const targetGroup = e.target.closest('.skill-group');
        if (!targetGroup) return;
        
        // Check if we're still within the same group
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && targetGroup.contains(relatedTarget)) return;
        
        targetGroup.classList.remove('group-drag-over-top', 'group-drag-over-bottom');
    }
    
    handleGroupDrop(e) {
        // Only handle if we're doing a group drag
        if (!this.dragState.isGroupDrag) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const targetGroup = e.target.closest('.skill-group[draggable="true"]');
        if (!targetGroup) return;
        
        const targetGroupId = targetGroup.dataset.groupId;
        const draggedGroupId = this.dragState.draggedGroupId;
        
        if (!draggedGroupId || draggedGroupId === targetGroupId) {
            this.clearAllDragStates();
            return;
        }
        
        // Determine insertion position
        const rect = targetGroup.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertBefore = e.clientY < midY;
        
        // Reorder groups
        this.reorderGroups(draggedGroupId, targetGroupId, insertBefore);
        
        this.clearAllDragStates();
        this.renderStep();
    }
    
    /**
     * Reorder groups by moving one group relative to another
     */
    reorderGroups(sourceGroupId, targetGroupId, insertBefore) {
        const sourceIndex = this.groups.findIndex(g => g.id === sourceGroupId);
        const targetIndex = this.groups.findIndex(g => g.id === targetGroupId);
        
        if (sourceIndex === -1 || targetIndex === -1) return;
        
        // Remove source group
        const [sourceGroup] = this.groups.splice(sourceIndex, 1);
        
        // Calculate new target index (account for removal shifting indices)
        let newTargetIndex = targetIndex;
        if (sourceIndex < targetIndex) {
            newTargetIndex--; // Adjust for the removed element
        }
        
        // Insert at correct position
        if (insertBefore) {
            this.groups.splice(newTargetIndex, 0, sourceGroup);
        } else {
            this.groups.splice(newTargetIndex + 1, 0, sourceGroup);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SKILL MOVEMENT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Find a skill object by name from groups or standalone
     */
    findSkillByName(skillName) {
        // Search in groups
        for (const group of this.groups) {
            const skill = group.skills.find(s => s.name === skillName);
            if (skill) return skill;
        }
        // Search in standalone
        return this.standalone.find(s => s.name === skillName);
    }
    
    /**
     * Remove a skill from its current location
     */
    removeSkillFromSource(skillName, sourceGroupId) {
        if (sourceGroupId === 'standalone') {
            const index = this.standalone.findIndex(s => s.name === skillName);
            if (index > -1) {
                return this.standalone.splice(index, 1)[0];
            }
        } else {
            const group = this.groups.find(g => g.id === sourceGroupId);
            if (group) {
                const index = group.skills.findIndex(s => s.name === skillName);
                if (index > -1) {
                    const skill = group.skills.splice(index, 1)[0];
                    // If group is now empty, remove it
                    if (group.skills.length === 0) {
                        this.groups = this.groups.filter(g => g.id !== sourceGroupId);
                    }
                    return skill;
                }
            }
        }
        return null;
    }
    
    /**
     * Move a skill to a target group at a specific position
     */
    moveSkillToGroup(skillName, sourceGroupId, targetGroupId, targetSkillName = null, insertBefore = false) {
        // Get the skill object
        const skill = this.removeSkillFromSource(skillName, sourceGroupId);
        if (!skill) return;
        
        if (targetGroupId === 'standalone') {
            // Moving to standalone
            if (targetSkillName) {
                const targetIndex = this.standalone.findIndex(s => s.name === targetSkillName);
                if (targetIndex > -1) {
                    const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
                    this.standalone.splice(insertIndex, 0, skill);
                } else {
                    this.standalone.push(skill);
                }
            } else {
                if (insertBefore) {
                    this.standalone.unshift(skill);
                } else {
                    this.standalone.push(skill);
                }
            }
        } else {
            // Moving to a group
            const targetGroup = this.groups.find(g => g.id === targetGroupId);
            if (targetGroup) {
                if (targetSkillName) {
                    const targetIndex = targetGroup.skills.findIndex(s => s.name === targetSkillName);
                    if (targetIndex > -1) {
                        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
                        targetGroup.skills.splice(insertIndex, 0, skill);
                    } else {
                        targetGroup.skills.push(skill);
                    }
                } else {
                    if (insertBefore) {
                        targetGroup.skills.unshift(skill);
                    } else {
                        targetGroup.skills.push(skill);
                    }
                }
            }
        }
    }
    
    /**
     * Create a new group from two skills
     */
    createGroupFromTwoSkills(skill1Name, skill1Source, skill2Name, skill2Source) {
        // Get both skill objects
        const skill1 = this.findSkillByName(skill1Name);
        const skill2 = this.findSkillByName(skill2Name);
        
        if (!skill1 || !skill2) return;
        
        // Remove both skills from their sources
        this.removeSkillFromSource(skill1Name, skill1Source);
        this.removeSkillFromSource(skill2Name, skill2Source);
        
        // Create new group
        const newGroup = {
            id: this.generateId(),
            type: 'manual',
            reason: 'Manually grouped via drag',
            suggestedName: this.suggestGroupNameFromSkills([skill1, skill2]),
            skills: [skill1, skill2],
            confidence: 1,
            collapsed: false
        };
        
        this.groups.push(newGroup);
    }
    
    /**
     * Suggest a group name based on skill names
     */
    suggestGroupNameFromSkills(skills) {
        if (skills.length === 0) return 'New Group';
        
        // Try to find common prefix
        const names = skills.map(s => s.name);
        let commonPrefix = names[0];
        
        for (const name of names) {
            while (commonPrefix.length > 0 && !name.startsWith(commonPrefix)) {
                commonPrefix = commonPrefix.slice(0, -1);
            }
        }
        
        // Remove trailing separators
        commonPrefix = commonPrefix.replace(/[-_]$/, '');
        
        if (commonPrefix.length >= 3) {
            // Convert to readable name
            return commonPrefix
                .replace(/[-_]/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        
        return 'New Group';
    }

    // STEP 4: Configure Templates
    renderStep4() {
        // Only build configs if they haven't been built yet or are empty
        // This prevents duplicate building when navigating back and forth
        if (!this.templateConfigs || this.templateConfigs.length === 0) {
            this.buildTemplateConfigs();
        }
        
        return `
            <div class="analysis-section">
                <h4><i class="fas fa-sliders-h"></i> Batch Settings (applies to all)</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    <div>
                        <label class="form-label">Category</label>
                        <select class="form-select" id="batchCategory" style="width: 100%;">
                            <option value="">Auto-detect each</option>
                            <option value="combat">Combat</option>
                            <option value="effects">Effects</option>
                            <option value="movement">Movement</option>
                            <option value="support">Support</option>
                            <option value="utility">Utility</option>
                            <option value="crowd-control">Crowd Control</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Context</label>
                        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" name="batchContext" value="skill" ${this.batchSettings.context === 'skill' ? 'checked' : ''}>
                                Regular Skills
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="radio" name="batchContext" value="mob" ${this.batchSettings.context === 'mob' ? 'checked' : ''}>
                                Mob Skills
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">&nbsp;</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                            <input type="checkbox" id="batchOfficial" ${this.batchSettings.isOfficial ? 'checked' : ''}>
                            Mark all as Official Templates
                        </label>
                    </div>
                </div>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem;"><i class="fas fa-list"></i> Templates (${this.templateConfigs.length})</h4>
            
            ${this.templateConfigs.map((config, i) => this.renderTemplateConfig(config, i)).join('')}
        `;
    }

    buildTemplateConfigs() {
        this.templateConfigs = [];
        
        console.log('[Import Wizard] Building template configs');
        console.log('[Import Wizard] Groups:', this.groups.length, 'Standalone:', this.standalone.length);
        
        // Groups become multi-section templates
        // IMPORTANT: section.name MUST preserve the original MythicMobs skill/mob name
        // (e.g., ZOMBIE_BLEEDING-Start or ZOMBIE_BOMBER_DUMMY) as these are internal references
        for (const group of this.groups) {
            const activeSkills = group.skills.filter(s => !this.excludedSkills.has(s.name));
            console.log('[Import Wizard] Processing group:', group.suggestedName, 'activeSkills:', activeSkills.length);
            if (activeSkills.length === 0) continue;
            
            // Check if this is a mob group
            const isMobGroup = activeSkills.some(s => s.sourceType === 'mob' || s.mobConfig);
            
            this.templateConfigs.push({
                id: group.id,
                name: group.suggestedName,  // Human-readable display name
                description: '',
                category: this.batchSettings.category || activeSkills[0].suggestedCategory,
                complexity: this.calculateGroupComplexity(activeSkills),
                context: isMobGroup ? 'mob' : this.batchSettings.context,
                isOfficial: this.batchSettings.isOfficial,
                isMultiSection: true,
                skills: activeSkills,
                sections: activeSkills.map(s => ({
                    name: s.name,  // MUST be original name: ZOMBIE_BLEEDING-Start, ZOMBIE_BOMBER_DUMMY, etc.
                    skillLines: s.data.Skills || [],
                    conditions: s.conditions,
                    triggers: s.triggers,
                    mobConfig: s.mobConfig || null  // Include mob configuration
                })),
                tags: this.generateTags(activeSkills)
            });
        }
        
        // Standalone become single-section templates
        // IMPORTANT: section.name MUST preserve the original MythicMobs skill/mob name
        for (const skill of this.standalone) {
            if (this.excludedSkills.has(skill.name)) continue;
            
            console.log('[Import Wizard] Processing standalone:', skill.name, 'sourceType:', skill.sourceType);
            
            // Check if this is a mob
            const isMob = skill.sourceType === 'mob' || skill.mobConfig;
            
            this.templateConfigs.push({
                id: skill.id || this.generateId(),
                name: this.importer.toReadableName(skill.name),  // Human-readable display name
                description: '',
                category: this.batchSettings.category || skill.suggestedCategory,
                complexity: skill.complexity,
                context: isMob ? 'mob' : this.batchSettings.context,
                isOfficial: this.batchSettings.isOfficial,
                isMultiSection: false,
                skills: [skill],
                sections: [{
                    name: skill.name,  // MUST be original name: ZOMBIE_BLEEDING, ZOMBIE_BOMBER, etc.
                    skillLines: skill.data.Skills || [],
                    conditions: skill.conditions,
                    triggers: skill.triggers,
                    mobConfig: skill.mobConfig || null  // Include mob configuration
                }],
                tags: this.generateTags([skill])
            });
        }
        
        console.log('[Import Wizard] Total templateConfigs:', this.templateConfigs.length);
    }

    calculateGroupComplexity(skills) {
        const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        const avg = skills.reduce((sum, s) => sum + (levels[s.complexity] || 2), 0) / skills.length;
        if (avg < 1.5) return 'beginner';
        if (avg < 2.5) return 'intermediate';
        if (avg < 3.5) return 'advanced';
        return 'expert';
    }

    generateTags(skills) {
        const tags = new Set();
        for (const skill of skills) {
            for (const mech of skill.mechanics.slice(0, 3)) {
                tags.add(mech);
            }
        }
        return Array.from(tags).slice(0, 5);
    }

    renderTemplateConfig(config, index) {
        const complexityLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const complexityIndex = complexityLevels.indexOf(config.complexity);
        const descriptionValid = config.description && config.description.trim().length >= 10;
        const descriptionLength = config.description ? config.description.trim().length : 0;
        
        return `
            <div class="template-config-card ${index === 0 ? 'expanded' : ''} ${!descriptionValid ? 'has-error' : ''}" data-config-id="${config.id}">
                <div class="template-config-header" onclick="window.importWizardInstance.toggleConfigCard('${config.id}')">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        ${!descriptionValid ? '<i class="fas fa-exclamation-circle" style="color: var(--error);"></i>' : ''}
                        <i class="fas fa-${config.isMultiSection ? 'layer-group' : 'file'}"></i>
                        <strong>${config.name}</strong>
                        <span style="color: var(--text-secondary); font-size: 0.8rem;">
                            ${config.sections.length} section${config.sections.length > 1 ? 's' : ''} • ${config.category}
                        </span>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="template-config-body">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label class="form-label">Name</label>
                            <input type="text" class="form-input" value="${config.name}"
                                onchange="window.importWizardInstance.updateConfig('${config.id}', 'name', this.value)">
                        </div>
                        <div>
                            <label class="form-label">Category</label>
                            <select class="form-select" style="width: 100%;"
                                onchange="window.importWizardInstance.updateConfig('${config.id}', 'category', this.value)">
                                <option value="combat" ${config.category === 'combat' ? 'selected' : ''}>Combat</option>
                                <option value="effects" ${config.category === 'effects' ? 'selected' : ''}>Effects</option>
                                <option value="movement" ${config.category === 'movement' ? 'selected' : ''}>Movement</option>
                                <option value="support" ${config.category === 'support' ? 'selected' : ''}>Support</option>
                                <option value="utility" ${config.category === 'utility' ? 'selected' : ''}>Utility</option>
                                <option value="crowd-control" ${config.category === 'crowd-control' ? 'selected' : ''}>Crowd Control</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Description <span style="color: var(--error);">*</span></label>
                        <textarea class="form-input ${!descriptionValid ? 'input-error' : ''}" rows="2" 
                            placeholder="Describe what this template does... (min 10 characters)"
                            oninput="window.importWizardInstance.updateConfigDescription('${config.id}', this)"
                            onchange="window.importWizardInstance.updateConfig('${config.id}', 'description', this.value)">${config.description}</textarea>
                        <div class="description-hint ${!descriptionValid ? 'error' : 'valid'}">
                            <span>${descriptionLength}/10 characters minimum</span>
                            ${!descriptionValid ? '<i class="fas fa-exclamation-circle"></i> Required' : '<i class="fas fa-check-circle"></i>'}
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem;">
                        <label class="form-label">Tags</label>
                        <div class="component-grid">
                            ${config.tags.map(tag => `<span class="component-badge">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem;">
                        <label class="form-label">Sections</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${config.sections.map(s => `
                                <span class="component-badge">
                                    <i class="fas fa-file-code"></i> ${s.name} (${s.skillLines.length} lines)
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 1rem;">
                        <span class="form-label" style="margin: 0;">Complexity:</span>
                        <div class="complexity-bar">
                            ${complexityLevels.map((level, i) => `
                                <div class="complexity-segment ${i <= complexityIndex ? 'active ' + config.complexity : ''}"></div>
                            `).join('')}
                        </div>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); text-transform: capitalize;">${config.complexity}</span>
                    </div>
                </div>
            </div>
        `;
    }

    toggleConfigCard(configId) {
        const card = document.querySelector(`[data-config-id="${configId}"]`);
        if (card) card.classList.toggle('expanded');
    }

    updateConfig(configId, field, value) {
        const config = this.templateConfigs.find(c => c.id === configId);
        if (config) config[field] = value;
        // Update Next button state
        this.updateNextButtonState();
    }

    updateConfigDescription(configId, textarea) {
        const config = this.templateConfigs.find(c => c.id === configId);
        if (!config) return;
        
        const value = textarea.value;
        config.description = value;
        
        const card = textarea.closest('.template-config-card');
        const hint = textarea.nextElementSibling;
        const descriptionLength = value.trim().length;
        const isValid = descriptionLength >= 10;
        
        // Update textarea styling
        textarea.classList.toggle('input-error', !isValid);
        
        // Update hint text
        if (hint && hint.classList.contains('description-hint')) {
            hint.className = `description-hint ${isValid ? 'valid' : 'error'}`;
            hint.innerHTML = `
                <span>${descriptionLength}/10 characters minimum</span>
                ${!isValid ? '<i class="fas fa-exclamation-circle"></i> Required' : '<i class="fas fa-check-circle"></i>'}
            `;
        }
        
        // Update card error state
        if (card) {
            card.classList.toggle('has-error', !isValid);
            const header = card.querySelector('.template-config-header');
            if (header) {
                // Update error icon in header
                const existingIcon = header.querySelector('.fa-exclamation-circle');
                if (!isValid && !existingIcon) {
                    header.querySelector('div').insertAdjacentHTML('afterbegin', 
                        '<i class="fas fa-exclamation-circle" style="color: var(--error);"></i>');
                } else if (isValid && existingIcon) {
                    existingIcon.remove();
                }
            }
        }
        
        // Update Next button state
        this.updateNextButtonState();
    }

    updateNextButtonState() {
        if (this.currentStep !== 4) return;
        
        const container = this.modalContent || document;
        const nextBtn = container.querySelector('#wizardNext');
        if (!nextBtn) return;
        
        const invalidCount = this.getInvalidDescriptionCount();
        
        if (invalidCount > 0) {
            nextBtn.disabled = true;
            nextBtn.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${invalidCount} description${invalidCount > 1 ? 's' : ''} need${invalidCount === 1 ? 's' : ''} min 10 characters`;
            nextBtn.style.opacity = '0.6';
        } else {
            nextBtn.disabled = false;
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            nextBtn.style.opacity = '1';
        }
    }

    getInvalidDescriptionCount() {
        return this.templateConfigs.filter(c => !c.description || c.description.trim().length < 10).length;
    }

    attachStep4Listeners() {
        window.importWizardInstance = this;

        document.getElementById('batchCategory')?.addEventListener('change', (e) => {
            this.batchSettings.category = e.target.value || null;
            if (e.target.value) {
                this.templateConfigs.forEach(c => c.category = e.target.value);
            }
        });

        document.querySelectorAll('input[name="batchContext"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.batchSettings.context = e.target.value;
                this.templateConfigs.forEach(c => c.context = e.target.value);
            });
        });

        document.getElementById('batchOfficial')?.addEventListener('change', (e) => {
            this.batchSettings.isOfficial = e.target.checked;
            this.templateConfigs.forEach(c => c.isOfficial = e.target.checked);
        });

        // Initialize Next button state based on descriptions
        this.updateNextButtonState();
    }

    // STEP 5: Final Review
    renderStep5() {
        const stats = {
            totalTemplates: this.templateConfigs.length,
            totalSections: this.templateConfigs.reduce((sum, c) => sum + c.sections.length, 0),
            totalLines: this.templateConfigs.reduce((sum, c) => 
                sum + c.sections.reduce((s, sec) => s + sec.skillLines.length, 0), 0)
        };
        
        return `
            <div class="analysis-section" style="text-align: center;">
                <h4 style="justify-content: center;"><i class="fas fa-check-circle" style="color: var(--success);"></i> Ready to Import</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
                    <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${stats.totalTemplates}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Templates</div>
                    </div>
                    <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${stats.totalSections}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Sections</div>
                    </div>
                    <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${stats.totalLines}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Skill Lines</div>
                    </div>
                </div>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem;"><i class="fas fa-list-check"></i> Templates to Create</h4>
            
            ${this.templateConfigs.map(config => `
                <div class="result-item success">
                    <i class="fas fa-${config.isMultiSection ? 'layer-group' : 'file'}"></i>
                    <div style="flex: 1;">
                        <strong>${config.name}</strong>
                        <span style="color: var(--text-secondary); margin-left: 0.5rem;">
                            ${config.sections.length} section${config.sections.length > 1 ? 's' : ''} • ${config.category}
                        </span>
                    </div>
                    <span class="component-badge" style="text-transform: capitalize;">${config.complexity}</span>
                </div>
            `).join('')}
            
            ${this.analysisResult?.warnings?.length > 0 ? `
                <div class="analysis-section" style="margin-top: 1.5rem;">
                    <h4><i class="fas fa-info-circle" style="color: var(--info);"></i> Notes</h4>
                    <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
                        ${this.analysisResult.missingSkills.slice(0, 3).map(m => 
                            `<li>"${m.calledSkill}" is referenced but not defined (will need to be created separately)</li>`
                        ).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    // Navigation
    async nextStep() {
        // Prevent navigation during import or after completion
        if (this._isImporting || this._importCompleted) {
            console.log('[Import Wizard] Import in progress or completed, ignoring nextStep');
            return;
        }
        
        try {
            if (this.currentStep === 1) {
                // Validate and analyze
                const content = this.yamlContent.trim();
                if (!content) {
                    this.showError('Please load a YAML file first');
                    return;
                }

                const result = this.importer.analyzeYAML(content, this.forcedFileType);
                
                if (!result.success) {
                    this.showError(result.error);
                    return;
                }

                this.analysisResult = result;
                this.currentStep = 2;
                this.renderStep();
                
            } else if (this.currentStep === 2) {
                // Apply suggestions and go to step 3
                this.applySmartSuggestions();
                this.currentStep = 3;
                this.renderStep();
                
            } else if (this.currentStep === 3) {
                // Build configs and go to step 4
                this.buildTemplateConfigs();
                this.currentStep = 4;
                this.renderStep();
                
            } else if (this.currentStep === 4) {
                // Go to review
                this.currentStep = 5;
                this.renderStep();
                
            } else if (this.currentStep === 5) {
                // Perform import
                await this.performImport();
            }
        } catch (error) {
            console.error('[Import Wizard] Error in nextStep:', error);
            this.showError(`An error occurred: ${error.message}`);
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            // If going back from step 4 or 5, clear template configs so they get rebuilt
            if (this.currentStep >= 4) {
                this.templateConfigs = [];
            }
            this.currentStep--;
            this.renderStep();
        }
    }

    showError(message) {
        console.error('[Import Wizard] Error:', message);
        
        // Try to show in the error div
        const container = this.modalContent || document;
        const errorDiv = container.querySelector('#parseError');
        const errorMsg = container.querySelector('#parseErrorMessage');
        if (errorDiv && errorMsg) {
            errorMsg.textContent = message;
            errorDiv.style.display = 'flex';
        } else {
            // Fallback: inject error into wizard content
            const content = container.querySelector('#wizardStepContent');
            if (content) {
                const existingError = content.querySelector('.parse-error');
                if (existingError) {
                    existingError.querySelector('span').textContent = message;
                } else {
                    const errorHtml = `
                        <div class="parse-error" style="margin-bottom: 1rem;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>${message}</span>
                        </div>
                    `;
                    content.insertAdjacentHTML('afterbegin', errorHtml);
                }
            }
        }
    }

    clearError() {
        const container = this.modalContent || document;
        const errorDiv = container.querySelector('#parseError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    async performImport() {
        // Prevent double imports - check both flags
        if (this._isImporting || this._importCompleted) {
            console.log('[Import Wizard] Import already in progress or completed, ignoring');
            return;
        }
        this._isImporting = true;
        
        const container = this.modalContent || document;
        const nextBtn = container.querySelector('#wizardNext');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        }

        try {
            const results = await this.importer.importTemplates(this.templateConfigs);
            
            // Mark as completed BEFORE showing results to prevent any re-triggers
            this._importCompleted = true;
            
            // Refresh admin panel templates list if it's open
            if (results.success.length > 0 && window.adminPanel) {
                window.adminPanel.loadTemplates();
            }
            
            this.showResults(results);
        } catch (error) {
            console.error('[Import Wizard] Import failed:', error);
            this.showNotification(`Import failed: ${error.message}`, 'error', 'Import Error');
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Create Templates';
            }
        } finally {
            this._isImporting = false;
        }
    }
    
    showNotification(message, type = 'info', title = 'Import') {
        if (window.notificationModal) {
            window.notificationModal.alert(message, type, title);
        } else {
            // Fallback to native alert if notificationModal not available
            alert(message);
        }
    }

    showResults(results) {
        // First ensure modal is still present
        if (!this.overlay || !document.body.contains(this.overlay)) {
            console.error('[Import Wizard] Modal no longer in DOM');
            this.showNotification(
                `Import complete! Created ${results.success?.length || 0} of ${results.total || 0} templates.`,
                results.success?.length > 0 ? 'success' : 'warning',
                'Import Complete'
            );
            return;
        }
        
        const container = this.modalContent || document;
        let content = container.querySelector('#wizardStepContent');
        
        // If content element is gone, try to recreate the step view
        if (!content) {
            console.warn('[Import Wizard] wizardStepContent not found, attempting to find alternate container');
            // Try modal body as fallback
            content = container.querySelector('.wizard-content') || container.querySelector('.modal-body');
        }
        
        if (!content) {
            console.error('[Import Wizard] Cannot find any content container');
            this.showNotification(
                `Import complete! Created ${results.success?.length || 0} of ${results.total || 0} templates.`,
                results.success?.length > 0 ? 'success' : 'warning',
                'Import Complete'
            );
            return;
        }
        
        const hasFailures = results.failed && results.failed.length > 0;
        const allFailed = results.success.length === 0 && hasFailures;
        
        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; color: ${allFailed ? 'var(--error)' : 'var(--success)'}; margin-bottom: 1rem;">
                    <i class="fas fa-${allFailed ? 'times-circle' : 'check-circle'}"></i>
                </div>
                <h2 style="margin: 0 0 0.5rem;">${allFailed ? 'Import Failed' : 'Import Complete!'}</h2>
                <p style="color: var(--text-secondary); margin: 0;">
                    Successfully imported <strong>${results.success.length}</strong> of <strong>${results.total}</strong> templates
                </p>
            </div>
            
            ${results.success.length > 0 ? `
                <div style="margin-top: 1.5rem;">
                    <h4><i class="fas fa-check" style="color: var(--success);"></i> Created Templates</h4>
                    ${results.success.map(s => `
                        <div class="result-item success">
                            <i class="fas fa-check-circle"></i>
                            <span>${s.name}</span>
                            <span class="component-badge">${s.sectionsCount} sections</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${hasFailures ? `
                <div style="margin-top: 1.5rem;">
                    <h4><i class="fas fa-times" style="color: var(--error);"></i> Failed Imports</h4>
                    ${results.failed.map(f => `
                        <div class="result-item failed">
                            <i class="fas fa-times-circle"></i>
                            <span>${f.name}</span>
                            <span style="color: var(--error); font-size: 0.85rem;">${f.error}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-lightbulb" style="color: #fbbf24;"></i>
                        <div>
                            <strong>Fix the issues</strong>
                            <p style="margin: 0.25rem 0 0; color: var(--text-secondary); font-size: 0.85rem;">
                                Click "Go Back" to return to the Configure step and fix the description fields.
                            </p>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;

        // Update buttons for completion state
        const nextBtn = container.querySelector('#wizardNext');
        const backBtn = container.querySelector('#wizardBack');
        
        if (nextBtn) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Done';
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            // Replace event listener to close on click
            nextBtn.onclick = () => this.close();
        }
        
        // Show back button if there are failures to allow fixing
        if (backBtn) {
            if (hasFailures) {
                backBtn.style.display = 'inline-flex';
                backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Go Back to Fix';
                backBtn.onclick = () => {
                    // Reset to step 4 to fix issues
                    this.currentStep = 4;
                    this.renderStep();
                };
            } else {
                backBtn.style.display = 'none';
            }
        }
    }

    close() {
        // Remove the modal from DOM
        const wizard = document.getElementById('templateImportWizard');
        if (wizard) {
            wizard.remove();
        }
        // Clear references
        this.overlay = null;
        this.modalContent = null;
        window.importWizardInstance = null;
    }
}

window.TemplateImportWizard = TemplateImportWizard;