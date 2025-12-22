/**
 * YAML Editor - Handles raw YAML editing with syntax highlighting
 */
class YAMLEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentContent = '';
        this.originalContent = ''; // Track original content for change detection
        this.isEditing = false;
        this.hasUnsavedEdits = false; // Track if manual edits exist
        this.setupChangeTracking();
    }
    
    /**
     * Setup change tracking for the YAML editor
     */
    setupChangeTracking() {
        // Listen for input changes in YAML editor
        document.addEventListener('DOMContentLoaded', () => {
            const editor = document.getElementById('yaml-editor');
            if (editor) {
                editor.addEventListener('input', () => {
                    this.checkForChanges();
                });
            }
        });
    }
    
    /**
     * Check if YAML content has changed
     */
    checkForChanges() {
        const editor = document.getElementById('yaml-editor');
        if (!editor) return;
        
        const currentValue = editor.value;
        if (currentValue !== this.originalContent) {
            this.hasUnsavedEdits = true;
            this.updateEditButtons(true);
        } else {
            this.hasUnsavedEdits = false;
            this.updateEditButtons(false);
        }
    }
    
    /**
     * Update edit action buttons visibility/state
     */
    updateEditButtons(showActions) {
        let actionsContainer = document.getElementById('yaml-edit-actions');
        
        if (showActions && !actionsContainer) {
            // Create action buttons if they don't exist
            const editBtn = document.getElementById('edit-yaml-btn');
            if (editBtn && editBtn.parentNode) {
                actionsContainer = document.createElement('div');
                actionsContainer.id = 'yaml-edit-actions';
                actionsContainer.style.cssText = 'display: flex; gap: 0.5rem; margin-left: 0.5rem;';
                actionsContainer.innerHTML = `
                    <button class="icon-btn" id="apply-yaml-btn" title="Apply Changes" style="color: var(--success);">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="icon-btn" id="discard-yaml-btn" title="Discard Changes" style="color: var(--error);">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                editBtn.parentNode.insertBefore(actionsContainer, editBtn.nextSibling);
                
                // Attach event listeners
                document.getElementById('apply-yaml-btn')?.addEventListener('click', () => this.applyChanges());
                document.getElementById('discard-yaml-btn')?.addEventListener('click', () => this.discardChanges());
            }
        } else if (!showActions && actionsContainer) {
            // Remove action buttons if no changes
            actionsContainer.remove();
        }
    }
    
    /**
     * Show YAML editor for current file
     */
    show(yamlContent) {
        this.currentContent = yamlContent;
        this.originalContent = yamlContent; // Store original for comparison
        this.isEditing = true;
        this.hasUnsavedEdits = false;
        
        const preview = document.getElementById('yaml-preview-content');
        const editor = document.getElementById('yaml-editor');
        
        if (preview && editor) {
            preview.classList.add('hidden');
            editor.classList.remove('hidden');
            editor.value = yamlContent;
            editor.focus();
            
            // Update button icon
            const editBtn = document.getElementById('edit-yaml-btn');
            if (editBtn) {
                editBtn.innerHTML = '<i class="fas fa-eye"></i>';
                editBtn.title = 'Preview YAML';
            }
        }
    }
    
    /**
     * Hide YAML editor and show preview
     */
    hide() {
        // Check for unsaved edits before hiding
        if (this.hasUnsavedEdits) {
            this.promptSaveChanges();
            return;
        }
        
        this.isEditing = false;
        
        const preview = document.getElementById('yaml-preview-content');
        const editor = document.getElementById('yaml-editor');
        
        if (preview && editor) {
            editor.classList.add('hidden');
            preview.classList.remove('hidden');
            
            // Update button icon
            const editBtn = document.getElementById('edit-yaml-btn');
            if (editBtn) {
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Edit YAML';
            }
            
            // Remove action buttons
            this.updateEditButtons(false);
        }
    }
    
    /**
     * Prompt user to save changes before closing editor
     */
    async promptSaveChanges() {
        const confirmed = await this.editor.showConfirmDialog(
            'You have unsaved YAML edits. Would you like to apply them?',
            'Unsaved Changes',
            { confirmText: 'Apply', cancelText: 'Discard', showCancel: true }
        );
        
        if (confirmed) {
            this.applyChanges();
        } else {
            this.discardChanges();
        }
    }
    
    /**
     * Apply YAML changes to the form
     */
    applyChanges() {
        this.parseAndUpdateForm();
        this.hasUnsavedEdits = false;
        this.originalContent = this.getContent();
        this.updateEditButtons(false);
        this.hide();
    }
    
    /**
     * Discard YAML changes and revert
     */
    discardChanges() {
        const editor = document.getElementById('yaml-editor');
        if (editor) {
            editor.value = this.originalContent;
        }
        this.hasUnsavedEdits = false;
        this.updateEditButtons(false);
        this.hide();
    }
    
    /**
     * Toggle between edit and preview mode
     */
    toggle() {
        if (this.isEditing) {
            this.hide();
        } else {
            const preview = document.getElementById('yaml-preview-content');
            if (preview) {
                this.show(preview.textContent);
            }
        }
    }
    
    /**
     * Get current YAML content from editor
     */
    getContent() {
        const editor = document.getElementById('yaml-editor');
        return editor ? editor.value : this.currentContent;
    }
    
    /**
     * Set YAML content in editor
     */
    setContent(yamlContent) {
        this.currentContent = yamlContent;
        const editor = document.getElementById('yaml-editor');
        if (editor) {
            editor.value = yamlContent;
        }
    }
    
    /**
     * Parse YAML and update form
     */
    parseAndUpdateForm() {
        const yamlContent = this.getContent();
        
        try {
            // Use the existing YAML parser
            const parsed = window.YAMLParser?.parse(yamlContent) || jsyaml.load(yamlContent);
            
            // Update the current file data
            if (this.editor.state.currentFile) {
                const oldData = { ...this.editor.state.currentFile };
                
                // Merge parsed data with existing, preserving unknown fields
                Object.keys(parsed).forEach(key => {
                    this.editor.state.currentFile[key] = parsed[key];
                });
                
                // Mark fields that were manually added (not in original structure)
                const knownFields = this.getKnownFieldsForType(this.editor.state.currentFileType);
                const unknownFields = Object.keys(parsed).filter(key => !knownFields.includes(key));
                
                if (unknownFields.length > 0) {
                    // Mark unknown fields for preservation
                    unknownFields.forEach(key => {
                        if (typeof this.editor.state.currentFile[key] === 'object' && this.editor.state.currentFile[key] !== null) {
                            this.editor.state.currentFile[key]._manualEdit = true;
                        }
                    });
                    
                    this.editor.showToast(
                        `Changes applied. ${unknownFields.length} custom field${unknownFields.length !== 1 ? 's' : ''} preserved: ${unknownFields.join(', ')}`,
                        'success'
                    );
                } else {
                    this.editor.showToast('YAML changes applied successfully!', 'success');
                }
                
                this.editor.markDirty();
                
                // Re-render the editor to show updated data
                this.rerenderCurrentEditor();
            }
        } catch (error) {
            console.error('YAML parse error:', error);
            this.editor.showToast(`YAML parse error: ${error.message}`, 'error');
        }
    }
    
    /**
     * Get list of known fields for a file type
     * @param {string} fileType - 'mob', 'skill', 'item', etc.
     * @returns {Array<string>} Array of known field names
     */
    getKnownFieldsForType(fileType) {
        const commonFields = ['name', '_isFileContainer', '_fileName', 'modified', 'isNew'];
        
        switch (fileType) {
            case 'mob':
                return [...commonFields, 'Type', 'Display', 'Health', 'Damage', 'Armor', 'Skills', 
                        'Drops', 'DamageModifiers', 'Equipment', 'Options', 'AIGoalSelectors', 
                        'AITargetSelectors', 'Modules', 'Disguise', 'BossBar', 'Faction', 'Mount', 
                        'isTemplate', 'Template', 'ThreatTable', 'LevelModifiers', 'KillMessages'];
            case 'skill':
                return [...commonFields, 'Skills', 'skills', 'cooldown', 'Conditions', 
                        'TargetConditions', 'TriggerConditions', 'cancelIfNoTargets',
                        'onCooldownSkill', 'failedConditionsSkill', 'skill'];
            case 'item':
                return [...commonFields, 'Id', 'Display', 'Data', 'Amount', 'Options', 
                        'Enchantments', 'PotionEffects', 'Unbreakable', 'HideFlags', 
                        'AttributeModifiers', 'CanDestroy', 'CanPlaceOn'];
            default:
                return commonFields;
        }
    }
    
    /**
     * Re-render the current editor with updated data
     */
    rerenderCurrentEditor() {
        const fileType = this.editor.state.currentFileType;
        const file = this.editor.state.currentFile;
        
        if (!file || !fileType) return;
        
        switch (fileType) {
            case 'mob':
                this.editor.mobEditor.render(file);
                break;
            case 'skill':
                this.editor.skillEditor.render(file);
                break;
            case 'item':
                this.editor.itemEditor.render(file);
                break;
        }
    }
    
    /**
     * Validate YAML syntax
     */
    validate() {
        const yamlContent = this.getContent();
        
        try {
            window.YAMLParser.parse(yamlContent);
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Apply syntax highlighting to preview
     */
    highlightSyntax(yamlText) {
        // Basic YAML syntax highlighting using spans
        let highlighted = yamlText;
        
        // Comments
        highlighted = highlighted.replace(/(#.+)/g, '<span class="yaml-comment">$1</span>');
        
        // Keys (before colon)
        highlighted = highlighted.replace(/^(\s*)([a-zA-Z0-9_-]+):/gm, '$1<span class="yaml-key">$2</span>:');
        
        // Strings in quotes
        highlighted = highlighted.replace(/(['"])(.*?)\1/g, '<span class="yaml-string">$1$2$1</span>');
        
        // Numbers
        highlighted = highlighted.replace(/:\s*(\d+\.?\d*)/g, ': <span class="yaml-number">$1</span>');
        
        // Booleans
        highlighted = highlighted.replace(/:\s*(true|false|yes|no)/gi, ': <span class="yaml-boolean">$1</span>');
        
        // List markers
        highlighted = highlighted.replace(/^(\s*)-\s/gm, '$1<span class="yaml-list">-</span> ');
        
        return highlighted;
    }
}

window.YAMLEditor = YAMLEditor;
