/**
 * Guided Mode Wizard - Step-by-step mob creation for beginners
 * Ultra-friendly wizard interface for the Guided Mode
 * 
 * ═══════════════════════════════════════════════════════════════
 * Created by: AlternativeSoap
 * © 2025-2026 AlternativeSoap - All Rights Reserved
 * ═══════════════════════════════════════════════════════════════
 */

class GuidedModeWizard {
    constructor(editor) {
        this.editor = editor;
        this.currentStep = 1;
        this.totalSteps = 5;
        this.wizardData = this.getDefaultWizardData();
        this.presets = window.GuidedModePresets;
        this.isOpen = false;
    }

    getDefaultWizardData() {
        return {
            // Step 1: Basic Info
            mobName: '',
            displayName: '',
            
            // Step 2: Mob Type (template)
            selectedTemplate: null,
            mobType: 'ZOMBIE',
            
            // Step 3: Stats
            health: 40,
            damage: 6,
            armor: 2,
            
            // Step 4: Skills
            selectedSkills: [],
            skillOptions: {},
            
            // Step 5: Review & Create
            packId: null
        };
    }

    /**
     * Open the wizard
     */
    open(packId = null) {
        this.wizardData = this.getDefaultWizardData();
        this.wizardData.packId = packId || this.editor?.state?.currentPack?.id;
        this.currentStep = 1;
        this.isOpen = true;
        this.render();
    }

    /**
     * Close the wizard
     */
    close() {
        this.isOpen = false;
        const overlay = document.getElementById('guided-wizard-overlay');
        if (overlay) {
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 200);
        }
    }

    /**
     * Render the wizard
     */
    render() {
        // Remove existing overlay
        const existing = document.getElementById('guided-wizard-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'guided-wizard-overlay';
        overlay.className = 'guided-wizard-overlay';
        overlay.innerHTML = `
            <div class="guided-wizard-container">
                <div class="guided-wizard-header">
                    <div class="wizard-title">
                        <i class="fas fa-magic"></i>
                        <span>Create Your Mob</span>
                    </div>
                    <button class="wizard-close-btn" id="wizard-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="wizard-progress">
                    ${this.renderProgressSteps()}
                </div>
                
                <div class="wizard-content" id="wizard-content">
                    ${this.renderCurrentStep()}
                </div>
                
                <div class="wizard-footer">
                    <button class="btn btn-secondary wizard-btn" id="wizard-back" ${this.currentStep === 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <div class="wizard-step-indicator">
                        Step ${this.currentStep} of ${this.totalSteps}
                    </div>
                    ${this.currentStep < this.totalSteps ? `
                        <button class="btn btn-primary wizard-btn" id="wizard-next">
                            Next <i class="fas fa-arrow-right"></i>
                        </button>
                    ` : `
                        <button class="btn btn-success wizard-btn" id="wizard-create">
                            <i class="fas fa-check"></i> Create Mob
                        </button>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.attachEventListeners();

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    }

    /**
     * Render progress steps
     */
    renderProgressSteps() {
        const steps = [
            { num: 1, icon: 'fa-info-circle', label: 'Basic Info' },
            { num: 2, icon: 'fa-dragon', label: 'Mob Type' },
            { num: 3, icon: 'fa-chart-bar', label: 'Stats' },
            { num: 4, icon: 'fa-magic', label: 'Skills' },
            { num: 5, icon: 'fa-check-circle', label: 'Review' }
        ];

        return steps.map((step, index) => {
            const isActive = step.num === this.currentStep;
            const isCompleted = step.num < this.currentStep;
            const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : '');
            
            return `
                <div class="progress-step ${statusClass}">
                    <div class="step-circle">
                        ${isCompleted ? '<i class="fas fa-check"></i>' : `<i class="fas ${step.icon}"></i>`}
                    </div>
                    <span class="step-label">${step.label}</span>
                    ${index < steps.length - 1 ? '<div class="step-connector"></div>' : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Render current step content
     */
    renderCurrentStep() {
        switch (this.currentStep) {
            case 1: return this.renderStep1();
            case 2: return this.renderStep2();
            case 3: return this.renderStep3();
            case 4: return this.renderStep4();
            case 5: return this.renderStep5();
            default: return '';
        }
    }

    /**
     * Step 1: Basic Information
     */
    renderStep1() {
        return `
            <div class="wizard-step step-basic-info">
                <div class="step-header">
                    <h2><i class="fas fa-info-circle"></i> Basic Information</h2>
                    <p>Let's start with the basics - give your mob a name!</p>
                </div>
                
                <div class="step-content">
                    <div class="form-group large-input">
                        <label class="form-label">
                            <i class="fas fa-tag"></i> Internal Name
                            <span class="required-badge">Required</span>
                        </label>
                        <input type="text" 
                               class="form-input wizard-input" 
                               id="wizard-mob-name" 
                               placeholder="e.g., FireZombie, IceKnight, StormBoss"
                               value="${this.wizardData.mobName}"
                               autocomplete="off">
                        <div class="input-help">
                            <i class="fas fa-info-circle"></i>
                            This is the ID used in MythicMobs configs. No spaces allowed.
                        </div>
                    </div>
                    
                    <div class="form-group large-input">
                        <label class="form-label">
                            <i class="fas fa-font"></i> Display Name
                            <span class="optional-badge">Optional</span>
                        </label>
                        <input type="text" 
                               class="form-input wizard-input" 
                               id="wizard-display-name" 
                               placeholder="e.g., &c&lFire Zombie"
                               value="${this.wizardData.displayName}"
                               autocomplete="off">
                        <div class="input-help">
                            <i class="fas fa-palette"></i>
                            The name shown above the mob. Use &amp; color codes for colors!
                        </div>
                        <div class="color-code-preview" id="display-name-preview">
                            <span class="preview-label">Preview:</span> <span class="preview-content">${this.parseColorCodes(this.wizardData.displayName)}</span>
                        </div>
                    </div>
                    
                    <div class="color-codes-help">
                        <div class="help-title"><i class="fas fa-palette"></i> Quick Color Codes</div>
                        <div class="color-grid">
                            <button class="color-btn" data-code="&0" style="background:#000000" title="Black">&0</button>
                            <button class="color-btn" data-code="&1" style="background:#0000AA" title="Dark Blue">&1</button>
                            <button class="color-btn" data-code="&2" style="background:#00AA00" title="Dark Green">&2</button>
                            <button class="color-btn" data-code="&3" style="background:#00AAAA" title="Dark Aqua">&3</button>
                            <button class="color-btn" data-code="&4" style="background:#AA0000" title="Dark Red">&4</button>
                            <button class="color-btn" data-code="&5" style="background:#AA00AA" title="Dark Purple">&5</button>
                            <button class="color-btn" data-code="&6" style="background:#FFAA00" title="Gold">&6</button>
                            <button class="color-btn" data-code="&7" style="background:#AAAAAA" title="Gray">&7</button>
                            <button class="color-btn" data-code="&8" style="background:#555555" title="Dark Gray">&8</button>
                            <button class="color-btn" data-code="&9" style="background:#5555FF" title="Blue">&9</button>
                            <button class="color-btn" data-code="&a" style="background:#55FF55" title="Green">&a</button>
                            <button class="color-btn" data-code="&b" style="background:#55FFFF" title="Aqua">&b</button>
                            <button class="color-btn" data-code="&c" style="background:#FF5555" title="Red">&c</button>
                            <button class="color-btn" data-code="&d" style="background:#FF55FF" title="Light Purple">&d</button>
                            <button class="color-btn" data-code="&e" style="background:#FFFF55;color:#000" title="Yellow">&e</button>
                            <button class="color-btn" data-code="&f" style="background:#FFFFFF;color:#000" title="White">&f</button>
                        </div>
                        <div class="help-title" style="margin-top:12px;"><i class="fas fa-text-width"></i> Formatting Codes</div>
                        <div class="color-grid format-grid">
                            <button class="color-btn format-btn" data-code="&l" title="Bold">&l <b>Bold</b></button>
                            <button class="color-btn format-btn" data-code="&o" title="Italic">&o <i>Italic</i></button>
                            <button class="color-btn format-btn" data-code="&n" title="Underline">&n <u>Underline</u></button>
                            <button class="color-btn format-btn" data-code="&m" title="Strikethrough">&m <s>Strike</s></button>
                            <button class="color-btn format-btn" data-code="&k" title="Magic/Obfuscated">&k Magic</button>
                            <button class="color-btn format-btn reset-btn" data-code="&r" title="Reset all formatting">&r Reset</button>
                        </div>
                        
                        <div class="help-title" style="margin-top:16px;"><i class="fas fa-palette"></i> Custom Color</div>
                        
                        <!-- Simplified Color Picker -->
                        <div class="smart-color-picker">
                            <div class="color-picker-main">
                                <input type="color" id="wizard-color-picker" class="big-color-picker" value="#FF5555" title="Click to pick any color">
                                <div class="color-info">
                                    <div class="color-code-display" id="wizard-color-code">&lt;#FF5555&gt;</div>
                                    <div class="color-hint">Click the square to pick a color</div>
                                </div>
                            </div>
                            <button class="smart-insert-btn" id="wizard-insert-color" title="Add this color to your name">
                                <i class="fas fa-plus-circle"></i> Add Color
                            </button>
                        </div>
                        
                        <!-- Gradient Mode Toggle -->
                        <div class="gradient-toggle-section">
                            <label class="gradient-toggle-label">
                                <input type="checkbox" id="wizard-gradient-mode" class="gradient-toggle-checkbox">
                                <span class="gradient-toggle-slider"></span>
                                <span class="gradient-toggle-text"><i class="fas fa-rainbow"></i> Gradient Mode</span>
                            </label>
                        </div>
                        
                        <!-- Gradient Builder (hidden by default) -->
                        <div class="gradient-builder" id="wizard-gradient-builder" style="display: none;">
                            <div class="gradient-colors">
                                <div class="gradient-color-box">
                                    <span class="gradient-color-label">From</span>
                                    <input type="color" id="wizard-gradient-start" class="gradient-color-input" value="#FF5555">
                                </div>
                                <div class="gradient-arrow-icon"><i class="fas fa-long-arrow-alt-right"></i></div>
                                <div class="gradient-color-box">
                                    <span class="gradient-color-label">To</span>
                                    <input type="color" id="wizard-gradient-end" class="gradient-color-input" value="#5555FF">
                                </div>
                            </div>
                            <div class="gradient-live-preview" id="wizard-gradient-preview"></div>
                            <div class="gradient-text-input">
                                <label>Text to gradient:</label>
                                <input type="text" id="wizard-gradient-text" class="form-input" placeholder="Type text here..." maxlength="50">
                            </div>
                            <button class="smart-insert-btn gradient-add-btn" id="wizard-insert-gradient" title="Add gradient text to your name">
                                <i class="fas fa-magic"></i> Add Gradient Text
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 2: Mob Type Selection
     */
    renderStep2() {
        const templates = this.presets?.mobTemplates || [];
        
        return `
            <div class="wizard-step step-mob-type">
                <div class="step-header">
                    <h2><i class="fas fa-dragon"></i> Choose Mob Type</h2>
                    <p>Pick a template to start with, or choose a base entity type.</p>
                </div>
                
                <div class="step-content">
                    <div class="template-section">
                        <h3><i class="fas fa-star"></i> Recommended Templates</h3>
                        <div class="template-grid">
                            ${templates.map(template => `
                                <div class="template-card ${this.wizardData.selectedTemplate === template.id ? 'selected' : ''}" 
                                     data-template="${template.id}">
                                    <div class="template-card-icon" style="color: ${template.color}">
                                        <i class="fas ${template.icon}"></i>
                                    </div>
                                    <div class="template-card-content">
                                        <h4>${template.name}</h4>
                                        <p>${template.description}</p>
                                        <div class="template-stats">
                                            <span class="stat"><i class="fas fa-heart"></i> ${template.defaults.health}</span>
                                            <span class="stat"><i class="fas fa-burst"></i> ${template.defaults.damage}</span>
                                            <span class="stat"><i class="fas fa-shield"></i> ${template.defaults.armor}</span>
                                        </div>
                                    </div>
                                    <div class="template-difficulty">
                                        <span class="difficulty-badge ${template.difficulty}">${template.difficulty}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="divider-or"><span>OR</span></div>
                    
                    <div class="custom-type-section">
                        <h3><i class="fas fa-cog"></i> Custom Entity Type</h3>
                        <div class="entity-type-selector">
                            <select class="form-select wizard-select" id="wizard-entity-type">
                                ${this.getEntityTypeOptions()}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 3: Stats Configuration
     */
    renderStep3() {
        return `
            <div class="wizard-step step-stats">
                <div class="step-header">
                    <h2><i class="fas fa-chart-bar"></i> Configure Stats</h2>
                    <p>Set your mob's combat statistics.</p>
                </div>
                
                <div class="step-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-card-header">
                                <div class="stat-icon health-icon">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <label class="stat-label">Health</label>
                            </div>
                            <div class="stat-info">
                                <div class="stat-input-group">
                                    <input type="range" 
                                           class="stat-slider" 
                                           id="wizard-health-slider"
                                           min="1" max="500" step="1"
                                           value="${this.wizardData.health}">
                                    <input type="number" 
                                           class="stat-number" 
                                           id="wizard-health"
                                           min="1" max="10000"
                                           value="${this.wizardData.health}">
                                </div>
                                <div class="stat-help">How much damage the mob can take</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-card-header">
                                <div class="stat-icon damage-icon">
                                    <i class="fas fa-burst"></i>
                                </div>
                                <label class="stat-label">Damage</label>
                            </div>
                            <div class="stat-info">
                                <div class="stat-input-group">
                                    <input type="range" 
                                           class="stat-slider" 
                                           id="wizard-damage-slider"
                                           min="0" max="50" step="1"
                                           value="${this.wizardData.damage}">
                                    <input type="number" 
                                           class="stat-number" 
                                           id="wizard-damage"
                                           min="0" max="1000"
                                           value="${this.wizardData.damage}">
                                </div>
                                <div class="stat-help">Base attack damage per hit</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-card-header">
                                <div class="stat-icon armor-icon">
                                    <i class="fas fa-shield-halved"></i>
                                </div>
                                <label class="stat-label">Armor</label>
                            </div>
                            <div class="stat-info">
                                <div class="stat-input-group">
                                    <input type="range" 
                                           class="stat-slider" 
                                           id="wizard-armor-slider"
                                           min="0" max="30" step="1"
                                           value="${this.wizardData.armor}">
                                    <input type="number" 
                                           class="stat-number" 
                                           id="wizard-armor"
                                           min="0" max="100"
                                           value="${this.wizardData.armor}">
                                </div>
                                <div class="stat-help">Damage reduction from attacks</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-preview">
                        <h4><i class="fas fa-eye"></i> Stats Preview</h4>
                        <div class="preview-bars">
                            <div class="preview-bar">
                                <span class="bar-label">Health</span>
                                <div class="bar-track">
                                    <div class="bar-fill health-fill" style="width: ${Math.min(100, (this.wizardData.health / 200) * 100)}%"></div>
                                </div>
                                <span class="bar-value">${this.wizardData.health}</span>
                            </div>
                            <div class="preview-bar">
                                <span class="bar-label">Damage</span>
                                <div class="bar-track">
                                    <div class="bar-fill damage-fill" style="width: ${Math.min(100, (this.wizardData.damage / 20) * 100)}%"></div>
                                </div>
                                <span class="bar-value">${this.wizardData.damage}</span>
                            </div>
                            <div class="preview-bar">
                                <span class="bar-label">Armor</span>
                                <div class="bar-track">
                                    <div class="bar-fill armor-fill" style="width: ${Math.min(100, (this.wizardData.armor / 20) * 100)}%"></div>
                                </div>
                                <span class="bar-value">${this.wizardData.armor}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 4: Skills Selection
     */
    renderStep4() {
        const categories = this.presets?.categories || {};
        const allSkills = this.presets?.getAllSkills() || [];
        
        // Get suggested skills from template
        const template = this.wizardData.selectedTemplate ? 
            this.presets.getMobTemplateById(this.wizardData.selectedTemplate) : null;
        const suggestedSkillIds = template?.suggestedSkills || [];
        
        return `
            <div class="wizard-step step-skills">
                <div class="step-header">
                    <h2><i class="fas fa-magic"></i> Add Skills</h2>
                    <p>Select abilities for your mob. You can customize each skill!</p>
                </div>
                
                <div class="step-content">
                    ${suggestedSkillIds.length > 0 ? `
                        <div class="suggested-skills-section">
                            <h3><i class="fas fa-star"></i> Recommended for ${template.name}</h3>
                            <div class="skills-mini-grid">
                                ${suggestedSkillIds.map(skillId => {
                                    const skill = this.presets.getSkillById(skillId);
                                    if (!skill) return '';
                                    const isSelected = this.wizardData.selectedSkills.includes(skillId);
                                    return this.renderSkillCard(skill, isSelected, true);
                                }).join('')}
                            </div>
                        </div>
                        <div class="divider-simple"></div>
                    ` : ''}
                    
                    <div class="all-skills-section">
                        <h3><i class="fas fa-list"></i> All Available Skills</h3>
                        
                        <div class="skill-category-tabs">
                            <button class="category-tab active" data-category="all">
                                <i class="fas fa-th"></i> All
                            </button>
                            ${Object.entries(categories).map(([key, cat]) => `
                                <button class="category-tab" data-category="${key}">
                                    <i class="fas ${cat.icon}"></i> ${cat.name}
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="skills-grid" id="skills-grid">
                            ${allSkills.map(skill => {
                                const isSelected = this.wizardData.selectedSkills.includes(skill.id);
                                return this.renderSkillCard(skill, isSelected, false);
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="selected-skills-summary ${this.wizardData.selectedSkills.length === 0 ? 'empty' : ''}">
                        <h4><i class="fas fa-check-circle"></i> Selected Skills (${this.wizardData.selectedSkills.length})</h4>
                        <div class="selected-skills-list">
                            ${this.wizardData.selectedSkills.length === 0 ? 
                                '<p class="no-skills-message">No skills selected yet. Click on skills above to add them!</p>' :
                                this.wizardData.selectedSkills.map(skillId => {
                                    const skill = this.presets.getSkillById(skillId);
                                    return skill ? `
                                        <div class="selected-skill-chip" style="border-color: ${skill.color}">
                                            <i class="fas ${skill.icon}" style="color: ${skill.color}"></i>
                                            <span>${skill.name}</span>
                                            <button class="remove-skill-btn" data-skill="${skill.id}">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ` : '';
                                }).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render individual skill card
     */
    renderSkillCard(skill, isSelected, isSuggested) {
        const isMetaskill = this.presets.isMetaskill(skill.id);
        const difficulty = this.presets.difficulties[skill.difficulty] || {};
        
        return `
            <div class="skill-card ${isSelected ? 'selected' : ''} ${isSuggested ? 'suggested' : ''}" 
                 data-skill="${skill.id}"
                 data-category="${skill.category}">
                <div class="skill-card-header">
                    <div class="skill-icon" style="background: ${skill.color}20; color: ${skill.color}">
                        <i class="fas ${skill.icon}"></i>
                    </div>
                    <div class="skill-badges">
                        ${isMetaskill ? '<span class="badge badge-meta" title="Creates separate skill file(s)">Metaskill</span>' : ''}
                        <span class="badge badge-difficulty" style="background: ${difficulty.color}20; color: ${difficulty.color}">
                            ${skill.difficulty}
                        </span>
                    </div>
                </div>
                <div class="skill-card-body">
                    <h4>${skill.name}</h4>
                    <p>${skill.description}</p>
                </div>
                <div class="skill-card-footer">
                    <button class="btn btn-sm ${isSelected ? 'btn-danger' : 'btn-primary'} skill-toggle-btn">
                        <i class="fas ${isSelected ? 'fa-minus' : 'fa-plus'}"></i>
                        ${isSelected ? 'Remove' : 'Add'}
                    </button>
                    ${skill.options && skill.options.length > 0 ? `
                        <button class="btn btn-sm btn-secondary skill-options-btn" data-skill="${skill.id}" ${!isSelected ? 'disabled' : ''}>
                            <i class="fas fa-sliders-h"></i> Options
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Step 5: Review & Create
     */
    renderStep5() {
        const template = this.wizardData.selectedTemplate ? 
            this.presets.getMobTemplateById(this.wizardData.selectedTemplate) : null;
        
        return `
            <div class="wizard-step step-review">
                <div class="step-header">
                    <h2><i class="fas fa-check-circle"></i> Review & Create</h2>
                    <p>Here's what your mob will look like. Ready to create it?</p>
                </div>
                
                <div class="step-content">
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-icon" style="background: ${template?.color || '#8b5cf6'}20">
                                <i class="fas ${template?.icon || 'fa-skull'}" style="color: ${template?.color || '#8b5cf6'}"></i>
                            </div>
                            <div class="review-title">
                                <h3>${this.wizardData.mobName || 'Unnamed Mob'}</h3>
                                <div class="review-display-name">
                                    ${this.parseColorCodes(this.wizardData.displayName || this.wizardData.mobName || 'Mob')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="review-sections">
                            <div class="review-section">
                                <h4><i class="fas fa-info-circle"></i> Basic Info</h4>
                                <div class="review-grid">
                                    <div class="review-item">
                                        <span class="review-label">Internal Name</span>
                                        <span class="review-value">${this.wizardData.mobName || 'Not set'}</span>
                                    </div>
                                    <div class="review-item">
                                        <span class="review-label">Entity Type</span>
                                        <span class="review-value">${this.wizardData.mobType}</span>
                                    </div>
                                    <div class="review-item">
                                        <span class="review-label">Template</span>
                                        <span class="review-value">${template?.name || 'Custom'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="review-section">
                                <h4><i class="fas fa-chart-bar"></i> Combat Stats</h4>
                                <div class="review-stats">
                                    <div class="review-stat">
                                        <i class="fas fa-heart" style="color: #ef4444"></i>
                                        <span class="stat-value">${this.wizardData.health}</span>
                                        <span class="stat-name">Health</span>
                                    </div>
                                    <div class="review-stat">
                                        <i class="fas fa-burst" style="color: #f97316"></i>
                                        <span class="stat-value">${this.wizardData.damage}</span>
                                        <span class="stat-name">Damage</span>
                                    </div>
                                    <div class="review-stat">
                                        <i class="fas fa-shield-halved" style="color: #3b82f6"></i>
                                        <span class="stat-value">${this.wizardData.armor}</span>
                                        <span class="stat-name">Armor</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="review-section">
                                <h4><i class="fas fa-magic"></i> Skills (${this.wizardData.selectedSkills.length})</h4>
                                ${this.wizardData.selectedSkills.length === 0 ? 
                                    '<p class="review-empty">No skills selected</p>' :
                                    `<div class="review-skills">
                                        ${this.wizardData.selectedSkills.map(skillId => {
                                            const skill = this.presets.getSkillById(skillId);
                                            if (!skill) return '';
                                            const isMetaskill = this.presets.isMetaskill(skillId);
                                            return `
                                                <div class="review-skill-item">
                                                    <i class="fas ${skill.icon}" style="color: ${skill.color}"></i>
                                                    <span>${skill.name}</span>
                                                    ${isMetaskill ? '<span class="meta-badge">+Skill File</span>' : ''}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>`
                                }
                            </div>
                        </div>
                        
                        ${this.renderYAMLPreview()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render YAML preview
     */
    renderYAMLPreview() {
        const yaml = this.generateYAML();
        return `
            <div class="review-yaml">
                <div class="yaml-header">
                    <h4><i class="fas fa-code"></i> YAML Preview</h4>
                    <button class="btn btn-sm btn-secondary" id="copy-yaml-btn">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre class="yaml-preview-code"><code>${this.escapeHtml(yaml)}</code></pre>
            </div>
        `;
    }

    /**
     * Generate YAML from wizard data
     */
    generateYAML() {
        const data = this.wizardData;
        let yaml = `${data.mobName || 'NewMob'}:\n`;
        yaml += `  Type: ${data.mobType}\n`;
        
        if (data.displayName) {
            yaml += `  Display: '${data.displayName}'\n`;
        }
        
        yaml += `  Health: ${data.health}\n`;
        yaml += `  Damage: ${data.damage}\n`;
        
        if (data.armor > 0) {
            yaml += `  Armor: ${data.armor}\n`;
        }
        
        // Add skills
        if (data.selectedSkills.length > 0) {
            yaml += `  Skills:\n`;
            
            data.selectedSkills.forEach(skillId => {
                const skill = this.presets.getSkillById(skillId);
                if (!skill) return;
                
                const opts = data.skillOptions[skillId] || {};
                const isMetaskill = this.presets.isMetaskill(skillId);
                
                if (isMetaskill && skill.mobSkillLine) {
                    yaml += `  ${skill.mobSkillLine(opts)}\n`;
                } else if (skill.generateLine) {
                    yaml += `  ${skill.generateLine(opts)}\n`;
                }
            });
        }
        
        return yaml;
    }

    /**
     * Generate skill files YAML for metaskills
     */
    generateSkillFilesYAML() {
        const data = this.wizardData;
        const skillFiles = {};
        
        data.selectedSkills.forEach(skillId => {
            const skill = this.presets.getSkillById(skillId);
            if (!skill || !this.presets.isMetaskill(skillId)) return;
            
            const opts = data.skillOptions[skillId] || {};
            if (skill.generateSkills) {
                const skills = skill.generateSkills(opts);
                Object.assign(skillFiles, skills);
            }
        });
        
        return skillFiles;
    }

    /**
     * Get entity type options for dropdown - uses same categories as the mob editor
     */
    getEntityTypeOptions() {
        // Use the global ENTITY_CATEGORIES from entityFieldMap.js (same as mob editor)
        const categories = window.ENTITY_CATEGORIES || {
            'Hostile': [
                'ZOMBIE', 'ZOMBIE_VILLAGER', 'HUSK', 'DROWNED', 
                'SKELETON', 'WITHER_SKELETON', 'STRAY', 'BOGGED',
                'CREEPER', 'SPIDER', 'CAVE_SPIDER', 'ENDERMAN',
                'BLAZE', 'GHAST', 'PHANTOM', 'WITCH',
                'VINDICATOR', 'EVOKER', 'PILLAGER', 'RAVAGER', 'VEX',
                'ENDERMITE', 'SILVERFISH', 'GUARDIAN', 'ELDER_GUARDIAN',
                'SHULKER', 'SLIME', 'MAGMA_CUBE',
                'PIGLIN', 'PIGLIN_BRUTE', 'HOGLIN', 'ZOGLIN', 'ZOMBIFIED_PIGLIN',
                'WARDEN', 'BREEZE'
            ],
            'Passive': [
                'COW', 'MOOSHROOM', 'SHEEP', 'PIG', 'CHICKEN', 'RABBIT', 'TURTLE',
                'BAT', 'SQUID', 'GLOW_SQUID',
                'COD', 'SALMON', 'PUFFERFISH', 'TROPICAL_FISH', 'DOLPHIN',
                'VILLAGER', 'WANDERING_TRADER', 'ARMADILLO'
            ],
            'Tameable': [
                'WOLF', 'CAT', 'OCELOT', 'PARROT',
                'HORSE', 'DONKEY', 'MULE', 'SKELETON_HORSE', 'ZOMBIE_HORSE',
                'LLAMA', 'TRADER_LLAMA'
            ],
            'Neutral': [
                'IRON_GOLEM', 'SNOW_GOLEM', 'BEE', 'PANDA', 'POLAR_BEAR',
                'FOX', 'AXOLOTL', 'GOAT', 'FROG', 'TADPOLE', 'ALLAY', 'CAMEL', 'SNIFFER'
            ],
            'Bosses': [
                'ENDER_DRAGON', 'WITHER'
            ],
            'Special': [
                'ARMOR_STAND', 'MANNEQUIN', 'ITEM_FRAME', 'GLOW_ITEM_FRAME', 'PAINTING', 
                'BOAT', 'CHEST_BOAT', 'MINECART', 'MINECART_CHEST',
                'ITEM', 'EXPERIENCE_ORB', 'FALLING_BLOCK', 'TNT', 'INTERACTION', 'COPPER_GOLEM'
            ],
            'Display Entities': [
                'BLOCK_DISPLAY', 'ITEM_DISPLAY', 'TEXT_DISPLAY'
            ]
        };
        
        let html = '';
        
        Object.entries(categories).forEach(([category, entities]) => {
            html += `<optgroup label="${category}">`;
            entities.forEach(entity => {
                html += `<option value="${entity}" ${entity === this.wizardData.mobType ? 'selected' : ''}>${entity}</option>`;
            });
            html += `</optgroup>`;
        });
        
        return html;
    }

    /**
     * Parse Minecraft color codes for preview
     * Supports: &0-&f colors, &l bold, &o italic, &n underline, &m strikethrough, &k obfuscated, &r reset
     * Also supports hex colors: <#RRGGBB> and gradients: <gradient:#color1:#color2>text</gradient>
     */
    parseColorCodes(text, showPlaceholder = true) {
        if (!text) return showPlaceholder ? '<span style="color:#888">Your Mob Name</span>' : '';
        
        const colorMap = {
            '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
            '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
            '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
            'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
        };
        
        // Check if text is ONLY color codes (no actual visible text)
        const textWithoutCodes = text
            .replace(/&[0-9a-fk-or]/gi, '')
            .replace(/<#[0-9A-Fa-f]{6}>/g, '')
            .replace(/<gradient:[^>]+>/g, '')
            .replace(/<\/gradient>/g, '');
        const hasVisibleText = textWithoutCodes.trim().length > 0;
        
        // If no visible text, show a placeholder with the formatting applied
        let displayText = text;
        if (!hasVisibleText && showPlaceholder) {
            displayText = text + 'Your Mob Name';
        }
        
        // Build the preview with proper span handling
        let html = '';
        let currentColor = '#FFFFFF';
        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        let isStrikethrough = false;
        let isObfuscated = false;
        let i = 0;
        
        while (i < displayText.length) {
            // Check for hex color code <#RRGGBB>
            if (displayText[i] === '<' && displayText[i + 1] === '#') {
                const hexMatch = displayText.substring(i).match(/^<#([0-9A-Fa-f]{6})>/);
                if (hexMatch) {
                    currentColor = '#' + hexMatch[1].toUpperCase();
                    i += hexMatch[0].length;
                    continue;
                }
            }
            
            // Check for gradient (simplified - just show the text in first color)
            if (displayText[i] === '<' && displayText.substring(i, i + 10) === '<gradient:') {
                const gradientMatch = displayText.substring(i).match(/^<gradient:#([0-9A-Fa-f]{6}):#([0-9A-Fa-f]{6})>([^<]*)<\/gradient>/);
                if (gradientMatch) {
                    // Render gradient text with a CSS gradient effect
                    const color1 = '#' + gradientMatch[1];
                    const color2 = '#' + gradientMatch[2];
                    const gradientText = gradientMatch[3];
                    const style = `background: linear-gradient(90deg, ${color1}, ${color2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;${isBold ? 'font-weight:bold;' : ''}${isItalic ? 'font-style:italic;' : ''}`;
                    html += `<span style="${style}">${this.escapeHtml(gradientText)}</span>`;
                    i += gradientMatch[0].length;
                    continue;
                }
            }
            
            // Check for & color/format code
            if (displayText[i] === '&' && i + 1 < displayText.length) {
                const code = displayText[i + 1].toLowerCase();
                
                if (colorMap[code]) {
                    currentColor = colorMap[code];
                    i += 2;
                    continue;
                } else if (code === 'l') {
                    isBold = true;
                    i += 2;
                    continue;
                } else if (code === 'o') {
                    isItalic = true;
                    i += 2;
                    continue;
                } else if (code === 'n') {
                    isUnderline = true;
                    i += 2;
                    continue;
                } else if (code === 'm') {
                    isStrikethrough = true;
                    i += 2;
                    continue;
                } else if (code === 'k') {
                    isObfuscated = true;
                    i += 2;
                    continue;
                } else if (code === 'r') {
                    currentColor = '#FFFFFF';
                    isBold = false;
                    isItalic = false;
                    isUnderline = false;
                    isStrikethrough = false;
                    isObfuscated = false;
                    i += 2;
                    continue;
                }
            }
            
            // Regular character - add it with current formatting
            const char = displayText[i];
            let style = `color:${currentColor}`;
            if (isBold) style += ';font-weight:bold';
            if (isItalic) style += ';font-style:italic';
            if (isUnderline) style += ';text-decoration:underline';
            if (isStrikethrough) style += ';text-decoration:line-through';
            if (isUnderline && isStrikethrough) style = style.replace(/text-decoration:[^;]+/g, '') + ';text-decoration:underline line-through';
            
            // For obfuscated, show a placeholder effect
            // Convert spaces to &nbsp; to preserve them in HTML
            let displayChar;
            if (isObfuscated) {
                displayChar = '▓';
            } else if (char === ' ') {
                displayChar = '&nbsp;';
            } else {
                displayChar = this.escapeHtml(char);
            }
            html += `<span style="${style}">${displayChar}</span>`;
            i++;
        }
        
        return html || (showPlaceholder ? '<span style="color:#888">Your Mob Name</span>' : '');
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        document.getElementById('wizard-close')?.addEventListener('click', () => this.close());

        // NOTE: Overlay click to close is intentionally DISABLED for guided mode
        // Users must use the X button or complete the wizard
        // This prevents accidental closure while learning

        // Navigation buttons
        document.getElementById('wizard-back')?.addEventListener('click', () => this.prevStep());
        document.getElementById('wizard-next')?.addEventListener('click', () => this.nextStep());
        document.getElementById('wizard-create')?.addEventListener('click', () => this.createMob());

        // Step-specific listeners
        this.attachStepListeners();
    }

    /**
     * Attach step-specific event listeners
     */
    attachStepListeners() {
        switch (this.currentStep) {
            case 1:
                this.attachStep1Listeners();
                break;
            case 2:
                this.attachStep2Listeners();
                break;
            case 3:
                this.attachStep3Listeners();
                break;
            case 4:
                this.attachStep4Listeners();
                break;
            case 5:
                this.attachStep5Listeners();
                break;
        }
    }

    /**
     * Step 1 listeners
     */
    attachStep1Listeners() {
        const nameInput = document.getElementById('wizard-mob-name');
        const displayInput = document.getElementById('wizard-display-name');
        const preview = document.getElementById('display-name-preview');

        nameInput?.addEventListener('input', (e) => {
            // Sanitize name - convert spaces to underscores, remove other special chars
            let value = e.target.value.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            e.target.value = value;
            this.wizardData.mobName = value;
        });
        
        // Also handle keydown to convert space to underscore in real-time
        nameInput?.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                const pos = e.target.selectionStart;
                const before = e.target.value.substring(0, pos);
                const after = e.target.value.substring(pos);
                e.target.value = before + '_' + after;
                e.target.setSelectionRange(pos + 1, pos + 1);
                this.wizardData.mobName = e.target.value;
            }
        });

        displayInput?.addEventListener('input', (e) => {
            this.wizardData.displayName = e.target.value;
            this.updateDisplayNamePreview();
        });

        // Color code buttons (excluding smart buttons)
        document.querySelectorAll('.color-btn:not(.smart-insert-btn)').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                if (displayInput && code) {
                    const pos = displayInput.selectionStart;
                    const before = displayInput.value.substring(0, pos);
                    const after = displayInput.value.substring(pos);
                    displayInput.value = before + code + after;
                    displayInput.focus();
                    displayInput.setSelectionRange(pos + code.length, pos + code.length);
                    this.wizardData.displayName = displayInput.value;
                    this.updateDisplayNamePreview();
                }
            });
        });
        
        // Smart Color Picker
        const colorPicker = document.getElementById('wizard-color-picker');
        const colorCode = document.getElementById('wizard-color-code');
        const insertColorBtn = document.getElementById('wizard-insert-color');
        
        // Update color code display when picker changes
        colorPicker?.addEventListener('input', (e) => {
            const hex = e.target.value.toUpperCase().substring(1);
            if (colorCode) {
                colorCode.textContent = `<#${hex}>`;
                colorCode.style.color = e.target.value;
            }
        });
        
        // Insert color button
        insertColorBtn?.addEventListener('click', () => {
            if (displayInput && colorPicker) {
                const hex = colorPicker.value.toUpperCase().substring(1);
                const code = `<#${hex}>`;
                const pos = displayInput.selectionStart;
                const before = displayInput.value.substring(0, pos);
                const after = displayInput.value.substring(pos);
                displayInput.value = before + code + after;
                displayInput.focus();
                displayInput.setSelectionRange(pos + code.length, pos + code.length);
                this.wizardData.displayName = displayInput.value;
                this.updateDisplayNamePreview();
            }
        });
        
        // Gradient Mode Toggle
        const gradientToggle = document.getElementById('wizard-gradient-mode');
        const gradientBuilder = document.getElementById('wizard-gradient-builder');
        
        gradientToggle?.addEventListener('change', (e) => {
            if (gradientBuilder) {
                gradientBuilder.style.display = e.target.checked ? 'block' : 'none';
            }
        });
        
        // Gradient Builder
        const gradientStart = document.getElementById('wizard-gradient-start');
        const gradientEnd = document.getElementById('wizard-gradient-end');
        const gradientPreview = document.getElementById('wizard-gradient-preview');
        const gradientText = document.getElementById('wizard-gradient-text');
        const insertGradientBtn = document.getElementById('wizard-insert-gradient');
        
        const updateGradientPreview = () => {
            if (gradientPreview && gradientStart && gradientEnd) {
                const text = gradientText?.value || 'Sample Text';
                gradientPreview.style.background = `linear-gradient(90deg, ${gradientStart.value}, ${gradientEnd.value})`;
                gradientPreview.style.webkitBackgroundClip = 'text';
                gradientPreview.style.webkitTextFillColor = 'transparent';
                gradientPreview.style.backgroundClip = 'text';
                gradientPreview.textContent = text;
            }
        };
        
        gradientStart?.addEventListener('input', updateGradientPreview);
        gradientEnd?.addEventListener('input', updateGradientPreview);
        gradientText?.addEventListener('input', updateGradientPreview);
        
        // Initialize gradient preview
        updateGradientPreview();
        
        // Insert gradient button
        insertGradientBtn?.addEventListener('click', () => {
            if (displayInput && gradientStart && gradientEnd) {
                const startHex = gradientStart.value.toUpperCase().substring(1);
                const endHex = gradientEnd.value.toUpperCase().substring(1);
                const text = gradientText?.value || '';
                
                if (!text.trim()) {
                    // Show a hint if no text entered
                    if (gradientText) {
                        gradientText.style.borderColor = '#ff6b6b';
                        gradientText.placeholder = 'Enter text first!';
                        setTimeout(() => {
                            gradientText.style.borderColor = '';
                            gradientText.placeholder = 'Type text here...';
                        }, 2000);
                    }
                    return;
                }
                
                const code = `<gradient:#${startHex}:#${endHex}>${text}</gradient>`;
                const pos = displayInput.selectionStart;
                const before = displayInput.value.substring(0, pos);
                const after = displayInput.value.substring(pos);
                displayInput.value = before + code + after;
                displayInput.focus();
                displayInput.setSelectionRange(pos + code.length, pos + code.length);
                this.wizardData.displayName = displayInput.value;
                this.updateDisplayNamePreview();
                
                // Clear the gradient text input after inserting
                if (gradientText) {
                    gradientText.value = '';
                    updateGradientPreview();
                }
            }
        });
        
        // Initial preview update
        this.updateDisplayNamePreview();
    }
    
    /**
     * Update the display name preview in real-time
     */
    updateDisplayNamePreview() {
        const preview = document.getElementById('display-name-preview');
        if (preview) {
            const content = preview.querySelector('.preview-content');
            if (content) {
                content.innerHTML = this.parseColorCodes(this.wizardData.displayName);
            } else {
                preview.innerHTML = `<span class="preview-label">Preview:</span> <span class="preview-content">${this.parseColorCodes(this.wizardData.displayName)}</span>`;
            }
        }
    }

    /**
     * Step 2 listeners
     */
    attachStep2Listeners() {
        // Template cards
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.template;
                const template = this.presets.getMobTemplateById(templateId);
                
                if (template) {
                    // Toggle selection
                    if (this.wizardData.selectedTemplate === templateId) {
                        this.wizardData.selectedTemplate = null;
                    } else {
                        this.wizardData.selectedTemplate = templateId;
                        this.wizardData.mobType = template.defaults.type;
                        this.wizardData.health = template.defaults.health;
                        this.wizardData.damage = template.defaults.damage;
                        this.wizardData.armor = template.defaults.armor;
                        
                        // Pre-select suggested skills
                        if (template.suggestedSkills) {
                            this.wizardData.selectedSkills = [...template.suggestedSkills];
                        }
                    }
                    
                    // Update UI
                    document.querySelectorAll('.template-card').forEach(c => {
                        c.classList.toggle('selected', c.dataset.template === this.wizardData.selectedTemplate);
                    });
                    
                    // Update entity type dropdown
                    const entitySelect = document.getElementById('wizard-entity-type');
                    if (entitySelect) {
                        entitySelect.value = this.wizardData.mobType;
                    }
                }
            });
        });

        // Entity type dropdown
        document.getElementById('wizard-entity-type')?.addEventListener('change', (e) => {
            this.wizardData.mobType = e.target.value;
            this.wizardData.selectedTemplate = null;
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        });
    }

    /**
     * Step 3 listeners
     */
    attachStep3Listeners() {
        const stats = ['health', 'damage', 'armor'];
        
        stats.forEach(stat => {
            const slider = document.getElementById(`wizard-${stat}-slider`);
            const number = document.getElementById(`wizard-${stat}`);
            
            const updateStat = (value) => {
                this.wizardData[stat] = parseInt(value) || 0;
                this.updateStatsPreview();
            };
            
            slider?.addEventListener('input', (e) => {
                if (number) number.value = e.target.value;
                updateStat(e.target.value);
            });
            
            number?.addEventListener('input', (e) => {
                if (slider) slider.value = Math.min(e.target.value, slider.max);
                updateStat(e.target.value);
            });
        });
    }

    /**
     * Update stats preview bars
     */
    updateStatsPreview() {
        const healthFill = document.querySelector('.health-fill');
        const damageFill = document.querySelector('.damage-fill');
        const armorFill = document.querySelector('.armor-fill');
        
        if (healthFill) {
            healthFill.style.width = `${Math.min(100, (this.wizardData.health / 200) * 100)}%`;
            healthFill.closest('.preview-bar').querySelector('.bar-value').textContent = this.wizardData.health;
        }
        if (damageFill) {
            damageFill.style.width = `${Math.min(100, (this.wizardData.damage / 20) * 100)}%`;
            damageFill.closest('.preview-bar').querySelector('.bar-value').textContent = this.wizardData.damage;
        }
        if (armorFill) {
            armorFill.style.width = `${Math.min(100, (this.wizardData.armor / 20) * 100)}%`;
            armorFill.closest('.preview-bar').querySelector('.bar-value').textContent = this.wizardData.armor;
        }
    }

    /**
     * Step 4 listeners
     */
    attachStep4Listeners() {
        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.skill-card').forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Skill cards - toggle selection
        document.querySelectorAll('.skill-card').forEach(card => {
            const toggleBtn = card.querySelector('.skill-toggle-btn');
            
            toggleBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillId = card.dataset.skill;
                this.toggleSkill(skillId);
            });
            
            const optionsBtn = card.querySelector('.skill-options-btn');
            optionsBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillId = card.dataset.skill;
                this.showSkillOptions(skillId);
            });
        });

        // Remove skill chips
        document.querySelectorAll('.remove-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillId = btn.dataset.skill;
                this.toggleSkill(skillId);
            });
        });
    }

    /**
     * Toggle skill selection
     */
    toggleSkill(skillId) {
        const index = this.wizardData.selectedSkills.indexOf(skillId);
        
        if (index > -1) {
            this.wizardData.selectedSkills.splice(index, 1);
            delete this.wizardData.skillOptions[skillId];
        } else {
            this.wizardData.selectedSkills.push(skillId);
            // Initialize with default options
            const skill = this.presets.getSkillById(skillId);
            if (skill && skill.options) {
                this.wizardData.skillOptions[skillId] = {};
                skill.options.forEach(opt => {
                    this.wizardData.skillOptions[skillId][opt.id] = opt.default;
                });
            }
        }
        
        // Re-render step 4
        document.getElementById('wizard-content').innerHTML = this.renderCurrentStep();
        this.attachStep4Listeners();
    }

    /**
     * Show skill options modal
     */
    showSkillOptions(skillId) {
        const skill = this.presets.getSkillById(skillId);
        if (!skill || !skill.options) return;
        
        const currentOpts = this.wizardData.skillOptions[skillId] || {};
        
        const modal = document.createElement('div');
        modal.className = 'skill-options-modal-overlay';
        modal.innerHTML = `
            <div class="skill-options-modal">
                <div class="modal-header">
                    <h3>
                        <i class="fas ${skill.icon}" style="color: ${skill.color}"></i>
                        ${skill.name} Options
                    </h3>
                    <button class="modal-close-btn" id="close-options-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${skill.options.map(opt => `
                        <div class="option-group">
                            <label class="option-label">${opt.label}</label>
                            ${opt.type === 'number' ? `
                                <div class="option-input-group">
                                    <input type="range" 
                                           class="option-slider" 
                                           data-option="${opt.id}"
                                           min="${opt.min || 0}" 
                                           max="${opt.max || 100}" 
                                           step="${opt.step || 1}"
                                           value="${currentOpts[opt.id] ?? opt.default}">
                                    <input type="number" 
                                           class="option-number" 
                                           data-option="${opt.id}"
                                           min="${opt.min || 0}" 
                                           max="${opt.max || 100}"
                                           step="${opt.step || 1}"
                                           value="${currentOpts[opt.id] ?? opt.default}">
                                </div>
                            ` : `
                                <input type="text" 
                                       class="option-text" 
                                       data-option="${opt.id}"
                                       value="${currentOpts[opt.id] ?? opt.default}">
                            `}
                            ${opt.description ? `<div class="option-help">${opt.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="reset-options-btn">Reset to Defaults</button>
                    <button class="btn btn-primary" id="save-options-btn">Save Options</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Sync sliders and number inputs
        modal.querySelectorAll('.option-slider').forEach(slider => {
            const optId = slider.dataset.option;
            const numberInput = modal.querySelector(`.option-number[data-option="${optId}"]`);
            
            slider.addEventListener('input', () => {
                if (numberInput) numberInput.value = slider.value;
            });
        });
        
        modal.querySelectorAll('.option-number').forEach(number => {
            const optId = number.dataset.option;
            const slider = modal.querySelector(`.option-slider[data-option="${optId}"]`);
            
            number.addEventListener('input', () => {
                if (slider) slider.value = Math.min(number.value, slider.max);
            });
        });
        
        // Close button
        modal.querySelector('#close-options-modal')?.addEventListener('click', () => modal.remove());
        
        // Overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Reset button
        modal.querySelector('#reset-options-btn')?.addEventListener('click', () => {
            skill.options.forEach(opt => {
                const slider = modal.querySelector(`.option-slider[data-option="${opt.id}"]`);
                const number = modal.querySelector(`.option-number[data-option="${opt.id}"]`);
                const text = modal.querySelector(`.option-text[data-option="${opt.id}"]`);
                
                if (slider) slider.value = opt.default;
                if (number) number.value = opt.default;
                if (text) text.value = opt.default;
            });
        });
        
        // Save button
        modal.querySelector('#save-options-btn')?.addEventListener('click', () => {
            if (!this.wizardData.skillOptions[skillId]) {
                this.wizardData.skillOptions[skillId] = {};
            }
            
            skill.options.forEach(opt => {
                const input = modal.querySelector(`.option-number[data-option="${opt.id}"], .option-text[data-option="${opt.id}"]`);
                if (input) {
                    this.wizardData.skillOptions[skillId][opt.id] = opt.type === 'number' ? 
                        parseFloat(input.value) : input.value;
                }
            });
            
            modal.remove();
            this.editor?.showToast?.(`${skill.name} options saved!`, 'success');
        });
    }

    /**
     * Step 5 listeners
     */
    attachStep5Listeners() {
        document.getElementById('copy-yaml-btn')?.addEventListener('click', () => {
            const yaml = this.generateYAML();
            navigator.clipboard.writeText(yaml).then(() => {
                this.editor?.showToast?.('YAML copied to clipboard!', 'success');
            });
        });
    }

    /**
     * Navigate to next step
     */
    nextStep() {
        if (!this.validateCurrentStep()) return;
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.render();
        }
    }

    /**
     * Navigate to previous step
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.render();
        }
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.wizardData.mobName || this.wizardData.mobName.trim() === '') {
                    this.editor?.showToast?.('Please enter an internal name for your mob', 'warning');
                    document.getElementById('wizard-mob-name')?.focus();
                    return false;
                }
                return true;
            
            case 2:
                if (!this.wizardData.mobType) {
                    this.editor?.showToast?.('Please select a mob type', 'warning');
                    return false;
                }
                return true;
            
            default:
                return true;
        }
    }

    /**
     * Create the mob
     */
    async createMob() {
        if (!this.validateCurrentStep()) return;
        
        const data = this.wizardData;
        
        // Check if we have a pack
        let pack = this.editor?.state?.currentPack;
        if (!pack && data.packId) {
            pack = this.editor?.packManager?.packs?.find(p => p.id === data.packId);
        }
        
        if (!pack) {
            this.editor?.showToast?.('Please select a pack first', 'warning');
            return;
        }
        
        try {
            // Create mob object
            const newMob = {
                id: 'mob-' + Date.now(),
                name: data.mobName,
                type: data.mobType,
                displayName: data.displayName || undefined,
                health: data.health,
                damage: data.damage,
                armor: data.armor > 0 ? data.armor : undefined,
                skills: []
            };
            
            // Generate skill lines
            const skillFilesToCreate = {};
            
            data.selectedSkills.forEach(skillId => {
                const skill = this.presets.getSkillById(skillId);
                if (!skill) return;
                
                const opts = data.skillOptions[skillId] || {};
                const isMetaskill = this.presets.isMetaskill(skillId);
                
                if (isMetaskill) {
                    // Add mob skill line
                    if (skill.mobSkillLine) {
                        newMob.skills.push(skill.mobSkillLine(opts));
                    }
                    // Collect skill files to create
                    if (skill.generateSkills) {
                        const skills = skill.generateSkills(opts);
                        Object.assign(skillFilesToCreate, skills);
                    }
                } else if (skill.generateLine) {
                    newMob.skills.push(skill.generateLine(opts));
                }
            });
            
            // Create or find mob file
            if (!pack.mobs) pack.mobs = [];
            
            // Create new file for the mob
            const mobFile = {
                id: 'mob-file-' + Date.now(),
                fileName: data.mobName + '.yml',
                entries: [newMob]
            };
            
            pack.mobs.push(mobFile);
            
            // Create skill files if needed
            if (Object.keys(skillFilesToCreate).length > 0) {
                if (!pack.skills) pack.skills = [];
                
                // Debug log the skills being created
                console.log('[GuidedModeWizard] Creating skill files:', {
                    skillCount: Object.keys(skillFilesToCreate).length,
                    skillNames: Object.keys(skillFilesToCreate),
                    skillFilesToCreate: JSON.parse(JSON.stringify(skillFilesToCreate))
                });
                
                // Create one skill file with all the metaskills
                const baseTimestamp = Date.now();
                const skillEntries = Object.entries(skillFilesToCreate).map(([name, skillData], index) => {
                    // Convert Skills array to the proper format expected by skillEditor
                    // The editor needs:
                    // - Skills: [...] for display count (capitalized)
                    // - skills: { skillName: { lines: [...], Conditions: [...], Cooldown: ... } } for internal editor
                    const skillLines = skillData.Skills || [];
                    
                    console.log(`[GuidedModeWizard] Processing skill "${name}":`, {
                        hasSkillsArray: !!skillData.Skills,
                        skillLinesCount: skillLines.length,
                        skillLines: skillLines,
                        conditions: skillData.Conditions,
                        cooldown: skillData.Cooldown
                    });
                    
                    // Build the internal skill object with all properties
                    const skillInternalData = {
                        lines: skillLines
                    };
                    
                    // Pass through Conditions if present
                    if (skillData.Conditions && skillData.Conditions.length > 0) {
                        skillInternalData.Conditions = skillData.Conditions;
                    }
                    
                    // Pass through Cooldown if present
                    if (skillData.Cooldown !== undefined) {
                        skillInternalData.cooldown = skillData.Cooldown;
                    }
                    
                    return {
                        id: `skill-${baseTimestamp}-${index}-${name}`,
                        name: name,
                        Skills: skillLines,  // Keep for display count
                        Conditions: skillData.Conditions || [],  // Root level for YAML export
                        Cooldown: skillData.Cooldown,  // Root level for YAML export
                        skills: {
                            [name]: skillInternalData  // Internal editor format with all data
                        }
                    };
                });
                
                const skillFile = {
                    id: `skill-file-${baseTimestamp}`,
                    fileName: data.mobName + '_Skills.yml',
                    entries: skillEntries
                };
                
                console.log('[GuidedModeWizard] Created skill file:', {
                    fileName: skillFile.fileName,
                    entryCount: skillEntries.length,
                    firstEntry: skillEntries[0] ? {
                        name: skillEntries[0].name,
                        skillsKeys: Object.keys(skillEntries[0].skills || {}),
                        linesCount: skillEntries[0].skills?.[skillEntries[0].name]?.lines?.length
                    } : null
                });
                
                pack.skills.push(skillFile);
                
                // Expand the skills folder so user can see the created skills
                this.editor?.packManager?.saveFolderState?.('skills', true);
            }
            
            // Also expand the mobs folder
            this.editor?.packManager?.saveFolderState?.('mobs', true);
            
            // Save and refresh
            await this.editor?.packManager?.savePacks?.();
            this.editor?.packManager?.renderPackTree?.();
            
            // Set parent file reference
            newMob._parentFile = { id: mobFile.id, fileName: mobFile.fileName };
            
            // Open the new mob
            this.editor?.openFile?.(newMob, 'mob');
            
            // Close wizard
            this.close();
            
            // Show success message
            const skillCount = data.selectedSkills.length;
            const metaskillCount = data.selectedSkills.filter(id => this.presets.isMetaskill(id)).length;
            
            let message = `Created "${data.mobName}" successfully!`;
            if (metaskillCount > 0) {
                message += ` (${metaskillCount} skill file${metaskillCount > 1 ? 's' : ''} also created)`;
            }
            
            this.editor?.showToast?.(message, 'success');
            
        } catch (error) {
            console.error('Failed to create mob:', error);
            this.editor?.showToast?.('Failed to create mob: ' + error.message, 'error');
        }
    }
}

// Export to global scope
window.GuidedModeWizard = GuidedModeWizard;
