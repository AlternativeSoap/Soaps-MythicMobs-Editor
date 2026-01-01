/**
 * Template Editor Component
 * Modal for creating and editing user templates
 * Includes validation, auto-suggestion, and character counters
 */

class TemplateEditor {
    constructor(templateManager, authManager, importExportManager) {
        this.templateManager = templateManager;
        this.authManager = authManager;
        this.importExportManager = importExportManager;
        this.mode = 'create'; // 'create' or 'edit'
        this.currentTemplate = null;
        this.skillLines = [];
        this.sections = []; // New: for multi-section support
        this.structureType = 'multi-line'; // 'single', 'multi-line', or 'multi-section'
        this.onSaveCallback = null;
        this.isDirty = false; // Track unsaved changes
        this.initialState = null; // Store initial state for comparison
        
        this.createModal();
        this.attachEventListeners();
    }
    
    /**
     * Create the modal HTML
     */
    createModal() {
        const modalHTML = `
            <div id="templateEditorOverlay" class="condition-modal" style="display: none; z-index: 10000;">
                <div class="modal-content condition-browser" style="max-width: 600px;">
                    <!-- Header -->
                    <div class="modal-header">
                        <h2 id="templateEditorTitle">
                            <i class="fas fa-save"></i>
                            Save as Template
                        </h2>
                        <button class="btn-close" id="templateEditorClose" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Body -->
                    <div class="condition-browser-body" style="padding: 1.5rem;">
                        <form id="templateEditorForm">
                            <!-- Name Field -->
                            <div class="form-group">
                                <label for="templateName">
                                    Template Name <span class="required">*</span>
                                    <span class="char-counter" id="nameCounter">0/50</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="templateName" 
                                    class="form-control"
                                    placeholder="e.g., Epic Boss Combo"
                                    maxlength="50"
                                    required
                                >
                                <small class="form-text text-danger" id="nameError" style="display: none;"></small>
                            </div>
                            
                            <!-- Description Field -->
                            <div class="form-group">
                                <label for="templateDescription">
                                    Description <span class="required">*</span>
                                    <span class="char-counter" id="descriptionCounter">0/500</span>
                                </label>
                                <textarea 
                                    id="templateDescription" 
                                    class="form-control"
                                    placeholder="Describe what this template does..."
                                    rows="3"
                                    maxlength="500"
                                    required
                                ></textarea>
                                <small class="form-text text-danger" id="descriptionError" style="display: none;"></small>
                            </div>
                            
                            <!-- Structure Type Selector -->
                            <div class="form-group">
                                <label>
                                    Structure Type
                                    <i class="fas fa-info-circle" title="Single: one line | Multi-line: multiple lines in one section | Multi-section: multiple named sections" style="cursor: help; color: var(--text-secondary);"></i>
                                </label>
                                <div class="structure-type-selector" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                    <button type="button" class="btn btn-structure" data-structure="single" title="Single skill line">
                                        🎯 Single Line
                                    </button>
                                    <button type="button" class="btn btn-structure active" data-structure="multi-line" title="Multiple lines in one section">
                                        📋 Multi-Line
                                    </button>
                                    <button type="button" class="btn btn-structure" data-structure="multi-section" title="Multiple named sections">
                                        📚 Multi-Section
                                    </button>
                                </div>
                            </div>

                            <!-- Row: Category, Icon, Type -->
                            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <!-- Category -->
                                <div class="form-group">
                                    <label for="templateCategory">Category</label>
                                    <select id="templateCategory" class="form-control">
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
                                
                                <!-- Icon -->
                                <div class="form-group">
                                    <label for="templateIcon">Icon</label>
                                    <select id="templateIcon" class="form-control">
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
                                        <option value="🌟">🌟 Star</option>
                                        <option value="🧪">🧪 Potion</option>
                                        <option value="🩸">🩸 Blood</option>
                                        <option value="🏃">🏃 Running</option>
                                        <option value="💪">💪 Strong</option>
                                        <option value="🐌">🐌 Slow</option>
                                        <option value="🔧">🔧 Wrench</option>
                                        <option value="📦">📦 Box</option>
                                    </select>
                                </div>
                                
                                <!-- Type (Read-only) -->
                                <div class="form-group">
                                    <label for="templateType">Type</label>
                                    <input 
                                        type="text" 
                                        id="templateType" 
                                        class="form-control" 
                                        readonly
                                        style="background: var(--input-disabled-bg); cursor: not-allowed;"
                                        title="Auto-detected based on triggers"
                                    >
                                </div>
                            </div>
                            
                            <!-- Tags Field -->
                            <div class="form-group">
                                <label for="templateTags">
                                    Tags <span class="optional">(optional, comma-separated)</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="templateTags" 
                                    class="form-control"
                                    placeholder="e.g., fire, boss, aoe"
                                >
                                <small class="form-text">Max 10 tags, each 2-20 characters</small>
                            </div>
                            
                            <!-- Sections Container (for multi-section mode) -->
                            <div id="sectionsContainer" style="display: none;">
                                <div class="form-group">
                                    <label>
                                        Skill Sections
                                        <button type="button" class="btn btn-sm btn-primary" id="addSectionBtn" style="margin-left: 0.5rem;">
                                            <i class="fas fa-plus"></i> Add Section
                                        </button>
                                    </label>
                                    <div id="sectionsList" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
                                        <!-- Section cards will be added here -->
                                    </div>
                                </div>
                            </div>

                            <!-- Preview -->
                            <div class="form-group">
                                <label>
                                    Preview 
                                    <span class="line-count" id="lineCount">(0 lines)</span>
                                    <button type="button" class="btn btn-sm btn-secondary" id="yamlPreviewBtn" style="margin-left: 0.5rem;" title="Preview as YAML">
                                        <i class="fas fa-eye"></i> YAML
                                    </button>
                                    <button type="button" class="btn btn-sm btn-primary" id="editLinesBtn" style="margin-left: 0.5rem;" title="Edit skill lines">
                                        <i class="fas fa-edit"></i> Edit Lines
                                    </button>
                                </label>
                                <div class="template-preview" style="background: var(--bg-secondary); padding: 1rem; border-radius: 4px; max-height: 200px; overflow: auto; cursor: pointer;" id="templatePreviewContainer" title="Click to edit lines">
                                    <pre id="templatePreview" style="margin: 0; font-size: 0.9rem; white-space: pre;"><code></code></pre>
                                </div>
                            </div>

                            <!-- Admin Options (only visible to admins) -->
                            <div id="adminOptions" style="display: none;">
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; cursor: pointer;">
                                        <input type="checkbox" id="templateIsOfficial" style="margin-right: 0.5rem;">
                                        <span>Mark as Official Template</span>
                                        <i class="fas fa-crown" style="margin-left: 0.5rem; color: #ffd700;"></i>
                                    </label>
                                    <small class="form-text">Official templates are highlighted and appear at the top</small>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Footer -->
                    <div class="modal-footer">
                        <div style="display: flex; gap: 0.5rem; margin-right: auto;">
                            <button class="btn btn-secondary" id="importYamlBtn" title="Import from YAML file">
                                <i class="fas fa-file-import"></i> Import
                            </button>
                            <button class="btn btn-secondary" id="exportYamlBtn" title="Export as YAML file">
                                <i class="fas fa-file-export"></i> Export
                            </button>
                        </div>
                        <button class="btn btn-secondary" id="templateEditorCancel">Cancel</button>
                        <button class="btn btn-primary" id="templateEditorSave" disabled>
                            <i class="fas fa-save"></i>
                            <span id="saveButtonText">Save Template</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        document.getElementById('templateEditorClose').addEventListener('click', () => {
            this.close();
        });
        
        // Cancel button
        document.getElementById('templateEditorCancel').addEventListener('click', () => {
            this.close();
        });
        
        // Save button
        document.getElementById('templateEditorSave').addEventListener('click', () => {
            this.save();
        });
        
        // Structure type buttons
        document.querySelectorAll('.btn-structure').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const structureType = e.currentTarget.dataset.structure;
                this.setStructureType(structureType);
            });
        });
        
        // Add section button
        document.getElementById('addSectionBtn').addEventListener('click', () => {
            this.addSection();
        });
        
        // YAML Preview button
        document.getElementById('yamlPreviewBtn').addEventListener('click', () => {
            this.showYamlPreview();
        });
        
        // Edit Lines button and preview container click
        document.getElementById('editLinesBtn').addEventListener('click', () => {
            this.openLinesEditor();
        });
        
        document.getElementById('templatePreviewContainer').addEventListener('click', () => {
            this.openLinesEditor();
        });
        
        // Import/Export buttons
        document.getElementById('importYamlBtn').addEventListener('click', () => {
            this.importYaml();
        });
        
        document.getElementById('exportYamlBtn').addEventListener('click', () => {
            this.exportYaml();
        });
        
        // Click outside to close - but warn if unsaved changes
        document.getElementById('templateEditorOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'templateEditorOverlay') {
                this.confirmClose();
            }
        });
        
        // Name input - validation and character counter
        const nameInput = document.getElementById('templateName');
        nameInput.addEventListener('input', () => {
            this.updateCharCounter('name', nameInput.value);
            this.validateName();
            this.updateSaveButton();
            this.isDirty = true;
        });
        
        // Description input - validation and character counter
        const descInput = document.getElementById('templateDescription');
        descInput.addEventListener('input', () => {
            this.updateCharCounter('description', descInput.value);
            this.validateDescription();
            this.updateSaveButton();
            this.isDirty = true;
        });
        
        // Tags input - validation
        document.getElementById('templateTags').addEventListener('input', () => {
            this.updateSaveButton();
            this.isDirty = true;
        });
        
        // Category and Icon select - mark dirty
        document.getElementById('templateCategory').addEventListener('change', () => {
            this.isDirty = true;
        });
        document.getElementById('templateIcon').addEventListener('change', () => {
            this.isDirty = true;
        });
        
        // Official checkbox (admin only) - mark dirty
        const officialCheckbox = document.getElementById('templateIsOfficial');
        if (officialCheckbox) {
            officialCheckbox.addEventListener('change', () => {
                this.isDirty = true;
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('templateEditorOverlay');
            if (overlay.style.display === 'none') return;
            
            if (e.key === 'Escape') {
                this.confirmClose();
            } else if (e.ctrlKey && e.key === 'Enter') {
                const saveBtn = document.getElementById('templateEditorSave');
                if (!saveBtn.disabled) {
                    this.save();
                }
            }
        });
    }
    
    /**
     * Confirm close if there are unsaved changes
     */
    confirmClose() {
        if (this.isDirty) {
            // Show confirmation dialog
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                this.close();
            }
        } else {
            this.close();
        }
    }
    
    /**
     * Open the template editor
     * @param {Object} template - Template to edit (null for new)
     * @param {Boolean} isAdminMode - Whether to open in admin mode for official templates
     */
    open(template = null, isAdminMode = false) {
        this.mode = template ? 'edit' : 'create';
        this.currentTemplate = template;
        this.isAdminMode = isAdminMode;
        
        // Legacy options support
        if (template && typeof template === 'object' && !template.id && template.mode) {
            // Old API: open({ mode, template, skillLines, sections, onSave })
            this.mode = template.mode || 'create';
            this.currentTemplate = template.template || null;
            this.skillLines = template.skillLines || [];
            this.sections = template.sections || [];
            this.onSaveCallback = template.onSave || null;
        } else {
            this.skillLines = template?.content?.split('\n') || [];
            this.sections = template?.sections || [];
            this.onSaveCallback = null;
        }
        
        // Update title
        const title = this.mode === 'edit' ? 'Edit Template' : 
                     isAdminMode ? 'Create Official Template' : 'Save as Template';
        const titleEl = document.getElementById('templateEditorTitle');
        if (titleEl) {
            const icon = this.mode === 'edit' ? 'edit' : isAdminMode ? 'crown' : 'save';
            titleEl.innerHTML = `
                <i class="fas fa-${icon}"></i>
                ${title}
            `;
        }
        
        // Update save button text
        const saveButtonText = document.getElementById('saveButtonText');
        if (saveButtonText) {
            saveButtonText.textContent = this.mode === 'edit' ? 'Update Template' : 'Save Template';
        }
        
        // Check if user is admin to show admin options
        this.checkAdminStatus();
        
        // Populate form
        if (this.mode === 'edit' && this.currentTemplate) {
            this.populateForm(this.currentTemplate);
        } else {
            this.resetForm();
            // Auto-suggest based on current content
            if (this.skillLines.length > 0 || this.sections.length > 0) {
                this.autoSuggest({ skillLines: this.skillLines, sections: this.sections });
            }
        }
        
        // Update preview
        this.updatePreview();
        
        // Reset dirty state on fresh open
        this.isDirty = false;
        
        // Show modal
        document.getElementById('templateEditorOverlay').style.display = 'flex';
        
        // Focus name input
        setTimeout(() => {
            document.getElementById('templateName').focus();
        }, 100);
    }
    
    /**
     * Check if current user is admin and show/hide admin options
     */
    async checkAdminStatus() {
        const adminOptions = document.getElementById('adminOptions');
        const isOfficialCheckbox = document.getElementById('templateIsOfficial');
        
        if (!adminOptions) return;
        
        // Check if admin system is available and user is admin
        const hasAdminPermission = window.adminManager && 
            await window.adminManager.checkIsAdmin() &&
            window.adminManager.hasPermission('create_official_template');
        
        if (hasAdminPermission || this.isAdminMode) {
            adminOptions.style.display = 'block';
            
            // Auto-check if in admin mode
            if (this.isAdminMode && isOfficialCheckbox) {
                isOfficialCheckbox.checked = true;
                isOfficialCheckbox.disabled = true; // Prevent unchecking in admin mode
            }
        } else {
            adminOptions.style.display = 'none';
            if (isOfficialCheckbox) {
                isOfficialCheckbox.checked = false;
            }
        }
    }
    
    /**
     * Close the template editor
     */
    close() {
        document.getElementById('templateEditorOverlay').style.display = 'none';
        this.resetForm();
        this.currentTemplate = null;
        this.skillLines = [];
        this.onSaveCallback = null;
        this.isDirty = false; // Reset dirty state
    }
    
    /**
     * Populate form with template data (for edit mode)
     */
    populateForm(template) {
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateDescription').value = template.description;
        document.getElementById('templateCategory').value = template.data?.category || template.category || 'utility';
        document.getElementById('templateIcon').value = template.data?.icon || template.icon || '📦';
        document.getElementById('templateType').value = template.type === 'mob' ? '🔒 Mob' : '📝 Skill';
        
        const tags = template.tags || [];
        document.getElementById('templateTags').value = tags.join(', ');
        
        // Handle structure type
        const structureType = template.structure_type || template.data?.structure_type || 'multi-line';
        this.setStructureType(structureType);
        
        // Load sections or skillLines
        if (template.sections && template.sections.length > 0) {
            this.sections = template.sections.map(s => ({
                name: s.name,
                lines: Array.isArray(s.lines) ? s.lines : []
            }));
            
            if (structureType === 'multi-section') {
                this.renderSections();
            } else {
                // For backward compatibility: extract lines from first section
                this.skillLines = template.sections[0]?.lines || [];
            }
        } else {
            // Fallback to old skillLines format
            this.skillLines = template.data?.skillLines || template.skillLines || [];
            this.sections = [{ name: 'Skills', lines: this.skillLines }];
        }
        
        // Admin option
        const isOfficial = template.is_official || template.data?.is_official || false;
        const officialCheckbox = document.getElementById('templateIsOfficial');
        if (officialCheckbox) {
            officialCheckbox.checked = isOfficial;
        }
        
        this.updateCharCounter('name', template.name);
        this.updateCharCounter('description', template.description);
        this.updatePreview();
        this.updateSaveButton();
    }
    
    /**
     * Reset form to empty state
     */
    resetForm() {
        document.getElementById('templateName').value = '';
        document.getElementById('templateDescription').value = '';
        document.getElementById('templateCategory').value = 'combat';
        document.getElementById('templateIcon').value = '⚔️';
        document.getElementById('templateType').value = '';
        document.getElementById('templateTags').value = '';
        
        document.getElementById('nameError').style.display = 'none';
        document.getElementById('descriptionError').style.display = 'none';
        
        // Reset structure type to multi-line
        this.setStructureType('multi-line');
        
        // Reset sections
        this.sections = [];
        
        // Reset admin option
        const officialCheckbox = document.getElementById('templateIsOfficial');
        if (officialCheckbox) {
            officialCheckbox.checked = false;
        }
        
        this.updateCharCounter('name', '');
        this.updateCharCounter('description', '');
    }
    
    /**
     * Auto-suggest category, icon, and type
     */
    autoSuggest(options) {
        if (!this.skillLines || this.skillLines.length === 0) return;
        
        // Auto-detect type
        const type = options.type || this.templateManager.detectTemplateType(this.skillLines);
        document.getElementById('templateType').value = type === 'mob' ? '🔒 Mob' : '📝 Skill';
        
        // Suggest category
        const suggestedCategory = options.suggestedCategory || 
            this.templateManager.suggestCategory(this.skillLines);
        document.getElementById('templateCategory').value = suggestedCategory;
        
        // Suggest icon
        const suggestedIcon = options.suggestedIcon || 
            this.templateManager.suggestIcon(this.skillLines);
        document.getElementById('templateIcon').value = suggestedIcon;
    }
    
    /**
     * Update character counter
     */
    updateCharCounter(field, value) {
        const max = field === 'name' ? 50 : 500;
        const counter = document.getElementById(`${field}Counter`);
        const length = value.length;
        
        counter.textContent = `${length}/${max}`;
        
        // Color coding
        if (length === 0) {
            counter.style.color = 'var(--text-secondary)';
        } else if (length > max * 0.9) {
            counter.style.color = 'var(--danger-color)';
        } else if (length > max * 0.7) {
            counter.style.color = 'var(--warning-color)';
        } else {
            counter.style.color = 'var(--success-color)';
        }
    }
    
    /**
     * Validate name field
     */
    validateName() {
        const name = document.getElementById('templateName').value.trim();
        const errorEl = document.getElementById('nameError');
        
        if (name.length === 0) {
            errorEl.textContent = 'Name is required';
            errorEl.style.display = 'block';
            return false;
        }
        
        if (name.length < 3) {
            errorEl.textContent = 'Name must be at least 3 characters';
            errorEl.style.display = 'block';
            return false;
        }
        
        if (name.length > 50) {
            errorEl.textContent = 'Name must be 50 characters or less';
            errorEl.style.display = 'block';
            return false;
        }
        
        errorEl.style.display = 'none';
        return true;
    }
    
    /**
     * Validate description field
     */
    validateDescription() {
        const desc = document.getElementById('templateDescription').value.trim();
        const errorEl = document.getElementById('descriptionError');
        
        if (desc.length === 0) {
            errorEl.textContent = 'Description is required';
            errorEl.style.display = 'block';
            return false;
        }
        
        if (desc.length < 10) {
            errorEl.textContent = 'Description must be at least 10 characters';
            errorEl.style.display = 'block';
            return false;
        }
        
        if (desc.length > 500) {
            errorEl.textContent = 'Description must be 500 characters or less';
            errorEl.style.display = 'block';
            return false;
        }
        
        errorEl.style.display = 'none';
        return true;
    }
    
    /**
     * Update preview section
     */
    updatePreview() {
        const preview = document.getElementById('templatePreview');
        const lineCount = document.getElementById('lineCount');
        
        let previewLines = [];
        let totalLines = 0;
        
        if (this.structureType === 'multi-section') {
            // Preview multi-section format
            if (this.sections.length === 0) {
                preview.innerHTML = '<code style="color: var(--text-secondary);">No sections defined</code>';
                lineCount.textContent = '(0 lines)';
                return;
            }
            
            this.sections.forEach(section => {
                if (section.lines && section.lines.length > 0) {
                    previewLines.push(`${section.name}:`);
                    previewLines.push('  Skills:');
                    section.lines.forEach(line => {
                        previewLines.push(`    ${line}`);
                        totalLines++;
                    });
                }
            });
            
            lineCount.textContent = `(${this.sections.length} section${this.sections.length !== 1 ? 's' : ''}, ${totalLines} line${totalLines !== 1 ? 's' : ''})`;
        } else {
            // Preview single/multi-line format
            if (!this.skillLines || this.skillLines.length === 0) {
                preview.innerHTML = '<code style="color: var(--text-secondary);">No skill lines to preview</code>';
                lineCount.textContent = '(0 lines)';
                return;
            }
            
            const lines = Array.isArray(this.skillLines) ? this.skillLines : [this.skillLines];
            previewLines = lines;
            totalLines = lines.length;
            lineCount.textContent = `(${totalLines} line${totalLines !== 1 ? 's' : ''})`;
        }
        
        preview.innerHTML = `<code>${this.escapeHtml(previewLines.join('\n'))}</code>`;
    }
    
    /**
     * Update save button state
     */
    updateSaveButton() {
        const saveBtn = document.getElementById('templateEditorSave');
        const isValid = this.validateName() && this.validateDescription();
        saveBtn.disabled = !isValid;
    }
    
    /**
     * Set structure type
     */
    setStructureType(type) {
        this.structureType = type;
        
        // Update button states
        document.querySelectorAll('.btn-structure').forEach(btn => {
            if (btn.dataset.structure === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show/hide sections container
        const sectionsContainer = document.getElementById('sectionsContainer');
        if (type === 'multi-section') {
            sectionsContainer.style.display = 'block';
            // Initialize sections if empty
            if (this.sections.length === 0) {
                this.addSection('MainSkill');
            }
        } else {
            sectionsContainer.style.display = 'none';
        }
        
        this.updatePreview();
    }
    
    /**
     * Open the skill line selection/editing modal
     */
    openLinesEditor() {
        this.showLinesSelectionModal();
    }
    
    /**
     * Show modal with all skill lines for selection/editing
     */
    showLinesSelectionModal() {
        // Get all lines organized by section
        const allLines = this.getAllLinesWithSections();
        
        // Create modal
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'linesSelectionModal';
        modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10100;';
        
        const hasMultipleSections = this.structureType === 'multi-section' && this.sections.length > 1;
        
        modalOverlay.innerHTML = `
            <div class="lines-selection-modal" style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; width: 90%; max-width: 700px; max-height: 80vh; display: flex; flex-direction: column; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0;"><i class="fas fa-edit"></i> Edit Skill Lines</h3>
                    <button class="btn-icon close-modal-btn" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                ${hasMultipleSections ? `
                    <div style="margin-bottom: 1rem;">
                        <label style="margin-bottom: 0.5rem; display: block;">Section:</label>
                        <select id="sectionSelector" class="form-control" style="width: 100%;">
                            ${this.sections.map((s, i) => `<option value="${i}">${this.escapeHtml(s.name)} (${s.lines.length} lines)</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                
                <div id="linesListContainer" style="flex: 1; overflow-y: auto; margin-bottom: 1rem; min-height: 200px;">
                    ${this.renderLinesList(0)}
                </div>
                
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <button class="btn btn-secondary close-modal-btn">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <button class="btn btn-primary" id="addNewLineBtn">
                        <i class="fas fa-plus"></i> Add New Line
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Event listeners
        modalOverlay.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => modalOverlay.remove());
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.remove();
        });
        
        // Section selector change
        const sectionSelector = modalOverlay.querySelector('#sectionSelector');
        if (sectionSelector) {
            sectionSelector.addEventListener('change', (e) => {
                const container = modalOverlay.querySelector('#linesListContainer');
                container.innerHTML = this.renderLinesList(parseInt(e.target.value));
                this.attachLineEventListeners(modalOverlay, parseInt(e.target.value));
            });
        }
        
        // Add new line button
        modalOverlay.querySelector('#addNewLineBtn').addEventListener('click', () => {
            const sectionIndex = sectionSelector ? parseInt(sectionSelector.value) : 0;
            modalOverlay.remove();
            this.openSkillLineBuilder(sectionIndex, -1); // -1 means add new
        });
        
        // Attach edit/delete listeners
        const currentSection = sectionSelector ? parseInt(sectionSelector.value) : 0;
        this.attachLineEventListeners(modalOverlay, currentSection);
    }
    
    /**
     * Get all lines organized by section
     */
    getAllLinesWithSections() {
        if (this.structureType === 'multi-section') {
            return this.sections.map((s, i) => ({
                sectionIndex: i,
                sectionName: s.name,
                lines: s.lines || []
            }));
        } else {
            return [{
                sectionIndex: 0,
                sectionName: 'Skills',
                lines: this.skillLines || []
            }];
        }
    }
    
    /**
     * Render the list of lines for a section
     */
    renderLinesList(sectionIndex) {
        const lines = this.structureType === 'multi-section'
            ? (this.sections[sectionIndex]?.lines || [])
            : (this.skillLines || []);
        
        if (lines.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    <p>No skill lines in this ${this.structureType === 'multi-section' ? 'section' : 'template'}.</p>
                    <p style="font-size: 0.85rem;">Click "Add New Line" to create one.</p>
                </div>
            `;
        }
        
        return `
            <div class="lines-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${lines.map((line, i) => `
                    <div class="line-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 4px; border: 1px solid var(--border-color);">
                        <span class="line-number" style="color: var(--text-secondary); font-size: 0.85rem; min-width: 30px; flex-shrink: 0;">#${i + 1}</span>
                        <code class="line-content" style="flex: 1; overflow-x: auto; white-space: nowrap; font-size: 0.85rem; color: var(--primary-color); padding: 0.25rem 0;" title="${this.escapeHtml(line)}">${this.escapeHtml(line)}</code>
                        <div class="line-actions" style="display: flex; gap: 0.25rem; flex-shrink: 0;">
                            <button class="btn btn-sm btn-secondary edit-line-btn" data-line-index="${i}" title="Edit this line">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-line-btn" data-line-index="${i}" title="Delete this line">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Attach event listeners for edit/delete buttons
     */
    attachLineEventListeners(modalOverlay, sectionIndex) {
        // Edit buttons
        modalOverlay.querySelectorAll('.edit-line-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lineIndex = parseInt(btn.dataset.lineIndex);
                modalOverlay.remove();
                this.openSkillLineBuilder(sectionIndex, lineIndex);
            });
        });
        
        // Delete buttons
        modalOverlay.querySelectorAll('.delete-line-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lineIndex = parseInt(btn.dataset.lineIndex);
                this.deleteLine(sectionIndex, lineIndex, modalOverlay);
            });
        });
    }
    
    /**
     * Delete a skill line
     */
    deleteLine(sectionIndex, lineIndex, modalOverlay) {
        const lines = this.structureType === 'multi-section'
            ? this.sections[sectionIndex]?.lines
            : this.skillLines;
        
        if (!lines || !lines[lineIndex]) return;
        
        const lineText = lines[lineIndex];
        
        if (confirm(`Delete this skill line?\n\n${lineText}`)) {
            if (this.structureType === 'multi-section') {
                this.sections[sectionIndex].lines.splice(lineIndex, 1);
                this.renderSections();
            } else {
                this.skillLines.splice(lineIndex, 1);
            }
            
            this.updatePreview();
            this.updateSaveButton();
            
            // Refresh the modal list
            const container = modalOverlay.querySelector('#linesListContainer');
            container.innerHTML = this.renderLinesList(sectionIndex);
            this.attachLineEventListeners(modalOverlay, sectionIndex);
            
            // Update section selector if multi-section
            const sectionSelector = modalOverlay.querySelector('#sectionSelector');
            if (sectionSelector) {
                sectionSelector.innerHTML = this.sections.map((s, i) => 
                    `<option value="${i}" ${i === sectionIndex ? 'selected' : ''}>${this.escapeHtml(s.name)} (${s.lines.length} lines)</option>`
                ).join('');
            }
            
            this.showNotification('Line deleted', 'success');
        }
    }
    
    /**
     * Open skill line builder for editing or adding a line
     * @param {number} sectionIndex - Section index (0 for non-multi-section)
     * @param {number} lineIndex - Line index to edit, or -1 to add new
     */
    openSkillLineBuilder(sectionIndex, lineIndex) {
        if (!window.skillLineBuilder) {
            console.error('SkillLineBuilder not available');
            window.notificationModal?.alert('Skill Line Builder is not available', 'error');
            return;
        }
        
        const isEditing = lineIndex >= 0;
        const existingLine = isEditing
            ? (this.structureType === 'multi-section'
                ? this.sections[sectionIndex]?.lines[lineIndex]
                : this.skillLines[lineIndex])
            : null;
        
        // Store edit context
        this.editContext = {
            sectionIndex,
            lineIndex,
            isEditing
        };
        
        // Determine context from template type (mob or skill)
        const templateType = this.currentTemplate?.type || this.getTemplateTypeFromUI();
        const builderContext = templateType === 'mob' ? 'mob' : 'skill';
        
        // Open skill line builder with higher z-index and correct context
        window.skillLineBuilder.open({
            context: builderContext,
            zIndex: 10200, // Above lines selection modal
            onAdd: (skillLine) => {
                this.handleSkillLineResult(skillLine);
            },
            onAddMultiple: (skillLines) => {
                // For multiple lines, add them all
                skillLines.forEach(line => this.handleSkillLineResult(line, false));
                this.updatePreview();
                this.updateSaveButton();
            },
            onClose: () => {
                this.editContext = null;
            }
        });
        
        // If editing, load the existing line into the builder after a short delay
        if (isEditing && existingLine) {
            setTimeout(() => {
                if (window.skillLineBuilder.parseAndUpdateFromSkillLine) {
                    window.skillLineBuilder.parseAndUpdateFromSkillLine(existingLine);
                }
            }, 100);
        }
    }
    
    /**
     * Get template type from UI (fallback when currentTemplate not available)
     */
    getTemplateTypeFromUI() {
        const typeText = document.getElementById('templateType')?.value || '';
        return typeText.includes('Mob') ? 'mob' : 'skill';
    }
    
    /**
     * Handle result from skill line builder
     */
    handleSkillLineResult(skillLine, updateUI = true) {
        if (!skillLine) return;
        
        const ctx = this.editContext || { sectionIndex: 0, lineIndex: -1, isEditing: false };
        
        if (this.structureType === 'multi-section') {
            if (!this.sections[ctx.sectionIndex]) {
                this.sections[ctx.sectionIndex] = { name: 'Skills', lines: [] };
            }
            
            if (ctx.isEditing && ctx.lineIndex >= 0) {
                // Replace existing line
                this.sections[ctx.sectionIndex].lines[ctx.lineIndex] = skillLine;
            } else {
                // Add new line
                this.sections[ctx.sectionIndex].lines.push(skillLine);
            }
            
            if (updateUI) this.renderSections();
        } else {
            if (ctx.isEditing && ctx.lineIndex >= 0) {
                // Replace existing line
                this.skillLines[ctx.lineIndex] = skillLine;
            } else {
                // Add new line
                this.skillLines.push(skillLine);
            }
        }
        
        if (updateUI) {
            this.updatePreview();
            this.updateSaveButton();
        }
    }
    
    /**
     * Save lines from the editor modal (legacy - kept for import functionality)
     */
    saveLinesFromEditor(content) {
        
        if (this.structureType === 'multi-section') {
            // Parse sections from text (lines starting with # are section names)
            const lines = content.split('\n');
            const newSections = [];
            let currentSection = null;
            
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('#')) {
                    // New section
                    if (currentSection) {
                        newSections.push(currentSection);
                    }
                    currentSection = {
                        name: trimmedLine.substring(1).trim() || 'Unnamed',
                        lines: []
                    };
                } else if (trimmedLine && currentSection) {
                    currentSection.lines.push(trimmedLine);
                } else if (trimmedLine && !currentSection) {
                    // Lines before first section - create default section
                    currentSection = { name: 'Skills', lines: [trimmedLine] };
                }
            });
            
            if (currentSection) {
                newSections.push(currentSection);
            }
            
            this.sections = newSections.length > 0 ? newSections : [{ name: 'Skills', lines: [] }];
            this.renderSections();
        } else {
            // Parse as simple line list
            this.skillLines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
        }
        
        this.updatePreview();
        this.updateSaveButton();
    }
    
    /**
     * Add a new section
     */
    addSection(defaultName = '') {
        const sectionIndex = this.sections.length;
        const sectionName = defaultName || `Section${sectionIndex + 1}`;
        
        const section = {
            name: sectionName,
            lines: this.skillLines.length > 0 && sectionIndex === 0 ? [...this.skillLines] : []
        };
        
        this.sections.push(section);
        this.renderSections();
        this.updatePreview();
    }
    
    /**
     * Remove a section
     */
    removeSection(index) {
        if (this.sections.length <= 1) {
            this.showNotification('Must have at least one section', 'warning');
            return;
        }
        
        this.sections.splice(index, 1);
        this.renderSections();
        this.updatePreview();
    }
    
    /**
     * Update section name
     */
    updateSectionName(index, newName) {
        const validation = this.templateManager.validateSectionName(newName);
        
        const input = document.querySelector(`[data-section-index="${index}"] .section-name-input`);
        const errorEl = document.querySelector(`[data-section-index="${index}"] .section-name-error`);
        
        if (!validation.valid) {
            input.style.borderColor = 'var(--danger-color)';
            errorEl.textContent = validation.error;
            errorEl.style.display = 'block';
            return false;
        }
        
        input.style.borderColor = '';
        errorEl.style.display = 'none';
        this.sections[index].name = newName;
        this.updatePreview();
        return true;
    }
    
    /**
     * Update section lines
     */
    updateSectionLines(index, linesText) {
        const lines = linesText.split('\n').filter(line => line.trim());
        this.sections[index].lines = lines;
        this.updatePreview();
    }
    
    /**
     * Render sections UI
     */
    renderSections() {
        const sectionsList = document.getElementById('sectionsList');
        sectionsList.innerHTML = '';
        
        this.sections.forEach((section, index) => {
            const sectionCard = document.createElement('div');
            sectionCard.className = 'section-card';
            sectionCard.dataset.sectionIndex = index;
            sectionCard.style.cssText = 'background: var(--bg-secondary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color);';
            
            sectionCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <input 
                        type="text" 
                        class="form-control section-name-input" 
                        value="${this.escapeHtml(section.name)}"
                        placeholder="Section name (e.g., PhaseOne)"
                        style="flex: 1;"
                    >
                    <button type="button" class="btn btn-sm btn-danger remove-section-btn" title="Remove section">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <small class="section-name-error" style="color: var(--danger-color); display: none; margin-bottom: 0.5rem;"></small>
                <textarea 
                    class="form-control section-lines-input"
                    rows="4"
                    placeholder="Enter skill lines (one per line)..."
                    style="font-family: monospace; font-size: 0.9rem;"
                >${section.lines.join('\n')}</textarea>
            `;
            
            // Attach event listeners
            const nameInput = sectionCard.querySelector('.section-name-input');
            nameInput.addEventListener('input', (e) => {
                this.updateSectionName(index, e.target.value.trim());
            });
            
            const linesInput = sectionCard.querySelector('.section-lines-input');
            linesInput.addEventListener('input', (e) => {
                this.updateSectionLines(index, e.target.value);
            });
            
            const removeBtn = sectionCard.querySelector('.remove-section-btn');
            removeBtn.addEventListener('click', () => {
                this.removeSection(index);
            });
            
            sectionsList.appendChild(sectionCard);
        });
    }
    
    /**
     * Show YAML preview modal
     */
    showYamlPreview() {
        if (!this.importExportManager) {
            this.showNotification('YAML preview not available', 'warning');
            return;
        }
        
        // Build template data
        const templateData = this.buildTemplateData();
        
        // Use the dedicated YAML Preview Modal if available
        if (window.yamlPreviewModal) {
            window.yamlPreviewModal.open(templateData);
        } else {
            // Fallback to simple modal if YamlPreviewModal not loaded
            const yaml = this.importExportManager.exportToYAML(templateData);
            this.showSimpleYamlPreview(yaml);
        }
    }
    
    /**
     * Fallback simple YAML preview (if YamlPreviewModal not available)
     * @param {string} yaml - YAML string to display
     */
    showSimpleYamlPreview(yaml) {
        const modalContent = `
            <div style="background: var(--bg-primary); padding: 2rem; border-radius: 8px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-top: 0;">YAML Preview</h3>
                <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 4px; overflow-x: auto;"><code>${this.escapeHtml(yaml)}</code></pre>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="this.closest('[id^=yamlPreviewModal]').remove()">Close</button>
                    <button class="btn btn-primary" onclick="navigator.clipboard.writeText(\`${yaml.replace(/`/g, '\\`')}\`).then(() => alert('YAML copied to clipboard!'))">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        `;
        
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'yamlPreviewModal_' + Date.now();
        modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001;';
        modalOverlay.innerHTML = modalContent;
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
        
        document.body.appendChild(modalOverlay);
    }
    
    /**
     * Import from YAML file
     */
    importYaml() {
        if (!this.importExportManager) {
            this.showNotification('YAML import not available', 'warning');
            return;
        }
        
        this.importExportManager.importFromFile(
            (templateData) => {
                // Populate form with imported data
                this.populateFormFromImport(templateData);
                this.showNotification('Template imported successfully!', 'success');
            },
            (error) => {
                this.showNotification(`Import failed: ${error}`, 'error');
            }
        );
    }
    
    /**
     * Export current template as YAML
     */
    exportYaml() {
        if (!this.importExportManager) {
            this.showNotification('YAML export not available', 'warning');
            return;
        }
        
        // Validate first
        if (!this.validateName() || !this.validateDescription()) {
            this.showNotification('Please fix validation errors before exporting', 'warning');
            return;
        }
        
        const templateData = this.buildTemplateData();
        this.importExportManager.downloadAsYAML(templateData);
        this.showNotification('Template exported as YAML!', 'success');
    }
    
    /**
     * Build template data object from form
     */
    buildTemplateData() {
        const name = document.getElementById('templateName').value.trim();
        const description = document.getElementById('templateDescription').value.trim();
        const category = document.getElementById('templateCategory').value;
        const icon = document.getElementById('templateIcon').value;
        const tagsInput = document.getElementById('templateTags').value.trim();
        const tags = tagsInput
            ? tagsInput.split(',').map(t => t.trim()).filter(t => t.length >= 2 && t.length <= 20).slice(0, 10)
            : [];
        
        const typeText = document.getElementById('templateType').value;
        const type = typeText.includes('Mob') ? 'mob' : 'skill';
        
        const isOfficial = document.getElementById('templateIsOfficial')?.checked || false;
        
        // Build sections based on structure type
        let sections;
        if (this.structureType === 'multi-section') {
            sections = this.sections;
        } else if (this.structureType === 'single') {
            sections = [{ name: 'Skills', lines: [this.skillLines[0] || ''] }];
        } else {
            // multi-line
            sections = [{ name: 'Skills', lines: this.skillLines }];
        }
        
        return {
            name,
            description,
            category,
            icon,
            tags,
            type,
            sections,
            structure_type: this.structureType,
            is_official: isOfficial
        };
    }
    
    /**
     * Populate form from imported YAML data
     */
    populateFormFromImport(templateData) {
        document.getElementById('templateName').value = templateData.name || '';
        document.getElementById('templateDescription').value = templateData.description || '';
        document.getElementById('templateCategory').value = templateData.category || 'combat';
        document.getElementById('templateIcon').value = templateData.icon || '⚔️';
        document.getElementById('templateType').value = templateData.type === 'mob' ? '🔒 Mob' : '📝 Skill';
        document.getElementById('templateTags').value = (templateData.tags || []).join(', ');
        
        // Set structure type
        const structureType = templateData.structure_type || 'multi-line';
        this.setStructureType(structureType);
        
        // Load sections
        if (templateData.sections && templateData.sections.length > 0) {
            this.sections = templateData.sections.map(s => ({
                name: s.name,
                lines: s.lines || []
            }));
            
            if (structureType === 'multi-section') {
                this.renderSections();
            } else {
                // For single/multi-line, extract lines
                this.skillLines = templateData.sections[0]?.lines || [];
            }
        }
        
        // Admin option
        if (templateData.is_official !== undefined) {
            const officialCheckbox = document.getElementById('templateIsOfficial');
            if (officialCheckbox) {
                officialCheckbox.checked = templateData.is_official;
            }
        }
        
        this.updateCharCounter('name', templateData.name || '');
        this.updateCharCounter('description', templateData.description || '');
        this.updatePreview();
        this.updateSaveButton();
    }
    
    /**
     * Save template
     */
    async save() {
        // Final validation
        if (!this.validateName() || !this.validateDescription()) {
            return;
        }
        
        const saveBtn = document.getElementById('templateEditorSave');
        const originalText = saveBtn.innerHTML;
        
        try {
            // Disable button and show loading
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // Build template data
            const templateData = this.buildTemplateData();
            
            let result;
            
            if (this.mode === 'edit' && this.currentTemplate) {
                // Update existing template
                const updateData = {
                    name: templateData.name,
                    description: templateData.description,
                    tags: templateData.tags,
                    structure_type: templateData.structure_type,
                    is_official: templateData.is_official,
                    data: {
                        category: templateData.category,
                        icon: templateData.icon,
                        sections: templateData.sections
                    }
                };
                
                // If marking as official and wasn't before, record approval info
                if (templateData.is_official && !this.currentTemplate.is_official) {
                    const currentUser = this.templateManager.auth?.getCurrentUser();
                    if (currentUser) {
                        updateData.approved_by = currentUser.id;
                        updateData.approved_at = new Date().toISOString();
                    }
                }
                
                result = await this.templateManager.updateTemplate(this.currentTemplate.id, updateData);
                this.showNotification('Template updated successfully!', 'success');
            } else {
                // Create new template - use templateManager.createTemplate which handles sections
                result = await this.templateManager.createTemplate({
                    name: templateData.name,
                    description: templateData.description,
                    type: templateData.type,
                    tags: templateData.tags,
                    category: templateData.category,
                    icon: templateData.icon,
                    sections: templateData.sections,
                    structure_type: templateData.structure_type,
                    is_official: templateData.is_official
                });
                this.showNotification('Template created successfully!', 'success');
            }
            
            // Call callback if provided
            if (this.onSaveCallback) {
                this.onSaveCallback(result);
            }
            
            this.close();
            
        } catch (error) {
            console.error('Failed to save template:', error);
            this.showNotification(error.message || 'Failed to save template', 'error');
            
            // Re-enable button
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
    
    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        if (window.editor && typeof window.editor.showToast === 'function') {
            window.editor.showToast(message, type);
        } else if (window.notificationModal) {
            window.notificationModal.alert(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
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

// Export for use in other modules
window.TemplateEditor = TemplateEditor;
