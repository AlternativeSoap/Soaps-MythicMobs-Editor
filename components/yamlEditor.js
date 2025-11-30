/**
 * YAML Editor - Handles raw YAML editing with syntax highlighting
 */
class YAMLEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentContent = '';
        this.isEditing = false;
    }
    
    /**
     * Show YAML editor for current file
     */
    show(yamlContent) {
        this.currentContent = yamlContent;
        this.isEditing = true;
        
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
        }
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
            const parsed = window.YAMLParser.parse(yamlContent);
            
            // Update the current file data
            if (this.editor.state.currentFile) {
                Object.assign(this.editor.state.currentFile, parsed);
                this.editor.markDirty();
                this.editor.showToast('YAML parsed successfully!', 'success');
                
                // Re-render the editor to show updated data
                this.rerenderCurrentEditor();
            }
        } catch (error) {
            this.editor.showToast(`YAML parse error: ${error.message}`, 'error');
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
