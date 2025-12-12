/**
 * Template Editor Component
 * Modal for creating and editing user templates
 * Includes validation, auto-suggestion, and character counters
 */

class TemplateEditor {
    constructor(templateManager) {
        this.templateManager = templateManager;
        this.mode = 'create'; // 'create' or 'edit'
        this.currentTemplate = null;
        this.skillLines = [];
        this.onSaveCallback = null;
        
        this.createModal();
        this.attachEventListeners();
        
        console.log('✏️ TemplateEditor initialized');
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
                            
                            <!-- Preview -->
                            <div class="form-group">
                                <label>
                                    Preview 
                                    <span class="line-count" id="lineCount">(0 lines)</span>
                                </label>
                                <div class="template-preview" style="background: var(--bg-secondary); padding: 1rem; border-radius: 4px; max-height: 200px; overflow-y: auto;">
                                    <pre id="templatePreview" style="margin: 0; font-size: 0.9rem;"><code></code></pre>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Footer -->
                    <div class="modal-footer">
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
        
        // Click outside to close
        document.getElementById('templateEditorOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'templateEditorOverlay') {
                this.close();
            }
        });
        
        // Name input - validation and character counter
        const nameInput = document.getElementById('templateName');
        nameInput.addEventListener('input', () => {
            this.updateCharCounter('name', nameInput.value);
            this.validateName();
            this.updateSaveButton();
        });
        
        // Description input - validation and character counter
        const descInput = document.getElementById('templateDescription');
        descInput.addEventListener('input', () => {
            this.updateCharCounter('description', descInput.value);
            this.validateDescription();
            this.updateSaveButton();
        });
        
        // Tags input - validation
        document.getElementById('templateTags').addEventListener('input', () => {
            this.updateSaveButton();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('templateEditorOverlay');
            if (overlay.style.display === 'none') return;
            
            if (e.key === 'Escape') {
                this.close();
            } else if (e.ctrlKey && e.key === 'Enter') {
                const saveBtn = document.getElementById('templateEditorSave');
                if (!saveBtn.disabled) {
                    this.save();
                }
            }
        });
    }
    
    /**
     * Open the template editor
     * @param {Object} options - Configuration options
     */
    open(options = {}) {
        this.mode = options.mode || 'create';
        this.currentTemplate = options.template || null;
        this.skillLines = options.skillLines || [];
        this.onSaveCallback = options.onSave || null;
        
        // Update title
        const title = this.mode === 'edit' ? 'Edit Template' : 'Save as Template';
        const titleEl = document.getElementById('templateEditorTitle');
        if (titleEl) {
            titleEl.innerHTML = `
                <i class="fas fa-${this.mode === 'edit' ? 'edit' : 'save'}"></i>
                ${title}
            `;
        }
        
        // Update save button text
        const saveButtonText = document.getElementById('saveButtonText');
        if (saveButtonText) {
            saveButtonText.textContent = this.mode === 'edit' ? 'Update Template' : 'Save Template';
        }
        
        // Populate form
        if (this.mode === 'edit' && this.currentTemplate) {
            this.populateForm(this.currentTemplate);
        } else {
            this.resetForm();
            this.autoSuggest(options);
        }
        
        // Update preview
        this.updatePreview();
        
        // Show modal
        document.getElementById('templateEditorOverlay').style.display = 'flex';
        
        // Focus name input
        setTimeout(() => {
            document.getElementById('templateName').focus();
        }, 100);
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
        
        this.skillLines = template.data?.skillLines || template.skillLines || [];
        
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
        
        if (!this.skillLines || this.skillLines.length === 0) {
            preview.innerHTML = '<code style="color: var(--text-secondary);">No skill lines to preview</code>';
            lineCount.textContent = '(0 lines)';
            return;
        }
        
        const lines = Array.isArray(this.skillLines) ? this.skillLines : [this.skillLines];
        preview.innerHTML = `<code>${this.escapeHtml(lines.join('\n'))}</code>`;
        lineCount.textContent = `(${lines.length} line${lines.length !== 1 ? 's' : ''})`;
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
            
            // Collect form data
            const name = document.getElementById('templateName').value.trim();
            const description = document.getElementById('templateDescription').value.trim();
            const category = document.getElementById('templateCategory').value;
            const icon = document.getElementById('templateIcon').value;
            const tagsInput = document.getElementById('templateTags').value.trim();
            
            // Parse tags
            const tags = tagsInput
                ? tagsInput.split(',').map(t => t.trim()).filter(t => t.length >= 2 && t.length <= 20).slice(0, 10)
                : [];
            
            // Detect type from current form value
            const typeText = document.getElementById('templateType').value;
            const type = typeText.includes('Mob') ? 'mob' : 'skill';
            
            const templateData = {
                name,
                description,
                category,
                icon,
                tags,
                type,
                skillLines: this.skillLines
            };
            
            let result;
            
            if (this.mode === 'edit' && this.currentTemplate) {
                // Update existing template
                result = await this.templateManager.updateTemplate(this.currentTemplate.id, {
                    name,
                    description,
                    tags,
                    data: {
                        ...this.currentTemplate.data,
                        category,
                        icon
                    }
                });
                
                console.log('✅ Template updated successfully:', result);
                this.showNotification('Template updated successfully!', 'success');
            } else {
                // Create new template
                result = await this.templateManager.createTemplate(templateData);
                
                console.log('✅ Template created successfully:', result);
                this.showNotification('Template created successfully!', 'success');
            }
            
            // Call callback if provided (Issue #4: Pass result to callback)
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
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            // Fallback to alert for important messages
            if (type === 'error') {
                alert(message);
            }
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

console.log('✅ TemplateEditor loaded');
