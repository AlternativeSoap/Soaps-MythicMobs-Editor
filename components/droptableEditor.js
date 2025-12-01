/**
 * DropTable Editor - Complete drop table configuration
 * Supports weighted drops, conditions, equipment tables
 */
class DropTableEditor {
    constructor(editor) {
        this.editor = editor;
        this.dropsEditor = null;
    }
    
    render(droptable) {
        const editorPanel = document.getElementById('droptable-editor-view');
        if (!editorPanel) return;
        
        // Store reference to current droptable
        this.currentDropTable = droptable;
        
        // Check if this is a file container
        if (droptable._isFileContainer) {
            this.renderFileContainer(droptable, editorPanel);
            return;
        }
        
        // Check mode
        const isAdvanced = this.editor.state.currentMode === 'advanced';
        
        // Ensure droptable has all necessary properties
        droptable.tableType = droptable.tableType || 'normal';
        droptable.config = droptable.config || {};
        droptable.conditions = droptable.conditions || [];
        droptable.triggerConditions = droptable.triggerConditions || [];
        droptable.drops = droptable.drops || [];
        
        editorPanel.innerHTML = `
            <div class="editor-header">
                <h2>
                    <i class="fas fa-table"></i> DropTable: ${droptable.name}
                    <span class="mode-badge ${isAdvanced ? 'advanced' : 'beginner'}">${isAdvanced ? 'Advanced' : 'Beginner'} Mode</span>
                </h2>
                <div class="editor-actions">
                    <div class="action-group secondary-actions">
                        <button class="btn btn-outline" id="duplicate-droptable" title="Create a copy of this droptable">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline" id="rename-droptable" title="Rename this droptable">
                            <i class="fas fa-pen"></i> Rename
                        </button>
                        <button class="btn btn-secondary" id="new-droptable" title="Add a new droptable to this file">
                            <i class="fas fa-plus"></i> New Section
                        </button>
                    </div>
                    <button class="btn btn-primary" id="save-droptable">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            <div class="editor-content" id="droptable-form-view">
                <!-- Basic Info -->
                <div class="card collapsible-card">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-info-circle"></i> Basic Information
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <div class="form-group">
                            <label>Internal Name</label>
                            <input type="text" id="droptable-name" value="${droptable.name}" placeholder="my_drop_table" class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>Table Type</label>
                            <select id="droptable-type" class="form-select">
                                <option value="normal" ${droptable.tableType === 'normal' ? 'selected' : ''}>Normal DropTable</option>
                                <option value="equipment" ${droptable.tableType === 'equipment' ? 'selected' : ''}>Equipment DropTable</option>
                            </select>
                            <span class="help-text">Equipment tables are used for mob equipment or Equip mechanic</span>
                        </div>
                    </div>
                </div>
                
                <!-- Configuration -->
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-cogs"></i> Configuration
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        ${this.renderConfiguration(droptable)}
                    </div>
                </div>
                
                <!-- Conditions (Advanced Only) -->
                ${isAdvanced ? `
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-filter"></i> Conditions
                            ${droptable.conditions && droptable.conditions.length > 0 ? `<span class="card-badge">${droptable.conditions.length}</span>` : ''}
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <p class="help-text">Conditions that must be met by the mob for drops to generate</p>
                        <div id="droptable-conditions-editor"></div>
                    </div>
                </div>
                
                <!-- Trigger Conditions -->
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-bolt"></i> Trigger Conditions
                            ${droptable.triggerConditions && droptable.triggerConditions.length > 0 ? `<span class="card-badge">${droptable.triggerConditions.length}</span>` : ''}
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <p class="help-text">Conditions that must be met by the killer/trigger entity</p>
                        <div id="droptable-trigger-conditions-editor"></div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Drops -->
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-box-open"></i> Drops
                            <span class="count-badge">${droptable.drops.length}</span>
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <div id="droptable-drops-editor"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize drops editor
        setTimeout(() => {
            this.dropsEditor = new MobDropsEditor('droptable-drops-editor', droptable.drops);
            this.dropsEditor.onChange((drops) => {
                droptable.drops = drops;
                this.editor.markDirty();
            });
        }, 100);
        
        this.attachEventHandlers(droptable);
        window.collapsibleManager.initializeCollapsible();
        
        // Initialize condition editors after DOM is ready
        setTimeout(() => {
            this.initializeConditionEditors();
        }, 200);
    }
    
    renderConfiguration(droptable) {
        const config = droptable.config || {};
        
        return `
            <div class="form-row">
                <div class="form-group">
                    <label>Total Items</label>
                    <input type="number" id="config-totalitems" value="${config.TotalItems || ''}" 
                           placeholder="Leave empty for no limit" min="0" class="form-input">
                    <span class="help-text">Exact number of drops (makes chances into weights)</span>
                </div>
                <div class="form-group">
                    <label>Min Items</label>
                    <input type="number" id="config-minitems" value="${config.MinItems || ''}" 
                           placeholder="0" min="0" class="form-input">
                    <span class="help-text">Minimum drops to generate</span>
                </div>
                <div class="form-group">
                    <label>Max Items</label>
                    <input type="number" id="config-maxitems" value="${config.MaxItems || ''}" 
                           placeholder="No max" min="0" class="form-input">
                    <span class="help-text">Maximum drops to generate</span>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Bonus Level Items</label>
                    <input type="text" id="config-bonuslevelitems" value="${config.BonusLevelItems || ''}" 
                           placeholder="0.2 or 0.2to0.5" class="form-input">
                    <span class="help-text">Modifier based on mob level (can be range)</span>
                </div>
                <div class="form-group">
                    <label>Bonus Luck Items</label>
                    <input type="text" id="config-bonusluckitems" value="${config.BonusLuckItems || ''}" 
                           placeholder="0.15 or 0.15to8" class="form-input">
                    <span class="help-text">Modifier based on killer's luck stat</span>
                </div>
            </div>
            
            <div class="info-box">
                <i class="fas fa-lightbulb"></i>
                <div>
                    <strong>Weighted Drops:</strong> When TotalItems, MinItems, or MaxItems are set, 
                    drop chances become weights. Higher weights = more likely to drop.
                </div>
            </div>
        `;
    }
    

    
    attachEventHandlers(droptable) {
        // Table type change
        document.getElementById('droptable-type')?.addEventListener('change', (e) => {
            droptable.tableType = e.target.value;
            this.syncToFile();
            this.editor.markDirty();
        });
        
        // Configuration inputs
        ['totalitems', 'minitems', 'maxitems', 'bonuslevelitems', 'bonusluckitems'].forEach(field => {
            document.getElementById(`config-${field}`)?.addEventListener('input', () => {
                this.syncToFile();
                this.editor.markDirty();
            });
        });
        
        // Save button
        document.getElementById('save-droptable')?.addEventListener('click', () => {
            this.save(droptable);
        });
        
        // New section button (add new droptable to current file)
        document.getElementById('new-droptable')?.addEventListener('click', () => {
            this.addNewSection();
        });
        
        // Duplicate droptable button
        document.getElementById('duplicate-droptable')?.addEventListener('click', () => {
            this.duplicateDropTable(droptable);
        });
        
        // Rename droptable button
        document.getElementById('rename-droptable')?.addEventListener('click', () => {
            this.renameDropTable(droptable);
        });
        
        // View mode toggle
        document.getElementById('toggle-view-mode')?.addEventListener('click', () => {
            this.toggleViewMode();
        });
        
        // Input changes
        const inputs = document.querySelectorAll('#droptable-form-view input, #droptable-form-view select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.syncToFile();
                this.editor.markDirty();
            });
            input.addEventListener('change', () => {
                this.syncToFile();
                this.editor.markDirty();
            });
        });
    }
    
    syncToFile() {
        // Sync form data to state.currentFile for live preview
        const data = this.collectFormData();
        const file = this.editor.state.currentFile;
        if (file) {
            const oldName = file.name;
            Object.assign(file, data);
            if (this.dropsEditor) {
                file.drops = this.dropsEditor.getValue();
            }
            // Refresh file tree if name changed
            if (oldName !== data.name) {
                this.editor.packManager.renderPackTree();
            }
        }
    }
    
    save(droptable) {
        const data = this.collectFormData();
        const file = this.editor.state.currentFile;
        
        if (file) {
            Object.assign(file, data);
            // Update drops from editor
            if (this.dropsEditor) {
                file.drops = this.dropsEditor.getValue();
            }
            this.editor.fileManager.saveFile(file, 'droptable');
            this.editor.updateYAMLPreview();
            this.editor.state.isDirty = false;
            this.editor.updateSaveStatusIndicator();
        }
    }
    
    /**
     * Add a new droptable section to the current file
     */
    addNewSection() {
        const newName = prompt('Enter name for new droptable:');
        if (!newName || newName.trim() === '') return;
        
        // Find the parent file for the current droptable
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A droptable with that name already exists in this file', 'error');
            return;
        }
        
        // Create new droptable with defaults
        const newDroptable = {
            id: 'droptable-' + Date.now(),
            name: newName.trim(),
            drops: []
        };
        
        // Add to parent file's entries
        parentFile.entries.push(newDroptable);
        
        // Open the new droptable
        newDroptable._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(newDroptable, 'droptable');
        this.editor.showToast(`Created new droptable "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.renderPackTree();
        }
    }
    
    /**
     * Duplicate the current droptable within the same file
     */
    duplicateDropTable(droptable) {
        const newName = prompt('Enter name for duplicated droptable:', droptable.name + '_copy');
        if (!newName || newName.trim() === '') return;
        
        // Find the parent file for the current droptable
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A droptable with that name already exists in this file', 'error');
            return;
        }
        
        // Create a deep copy of the droptable
        const duplicated = typeof structuredClone !== 'undefined' ? structuredClone(droptable) : JSON.parse(JSON.stringify(droptable));
        duplicated.name = newName.trim();
        duplicated.id = 'droptable-' + Date.now();
        delete duplicated._parentFile;
        
        // Add to parent file's entries
        parentFile.entries.push(duplicated);
        
        // Open the new droptable
        duplicated._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(duplicated, 'droptable');
        this.editor.showToast(`Duplicated drop table as "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'droptable');
        }
    }
    
    /**
     * Find the parent file for the current droptable
     */
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.droptables) return null;
        
        const currentDroptable = this.editor.state.currentFile;
        
        // Check if _parentFile reference exists
        if (currentDroptable._parentFile) {
            return pack.droptables.find(f => f.id === currentDroptable._parentFile.id);
        }
        
        // Search all files for this droptable
        for (const file of pack.droptables) {
            if (file.entries && file.entries.some(e => e.id === currentDroptable.id)) {
                return file;
            }
        }
        
        return null;
    }
    
    /**
     * Rename the current droptable
     */
    renameDropTable(droptable) {
        const newName = prompt('Enter new name for droptable:', droptable.name);
        if (!newName || newName.trim() === '' || newName.trim() === droptable.name) return;
        
        // Check if name already exists
        const pack = this.editor.state.currentPack;
        if (pack && pack.droptables) {
            const existing = pack.droptables.find(d => d.name === newName.trim() && d.id !== droptable.id);
            if (existing) {
                this.editor.showToast('A droptable with that name already exists', 'error');
                return;
            }
        }
        
        const oldName = droptable.name;
        droptable.name = newName.trim();
        
        // Update the UI
        this.render(droptable);
        this.editor.showToast(`Renamed droptable from "${oldName}" to "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.render();
        }
    }
    
    collectFormData() {
        const config = {};
        
        const totalItems = document.getElementById('config-totalitems')?.value;
        const minItems = document.getElementById('config-minitems')?.value;
        const maxItems = document.getElementById('config-maxitems')?.value;
        const bonusLevel = document.getElementById('config-bonuslevelitems')?.value;
        const bonusLuck = document.getElementById('config-bonusluckitems')?.value;
        
        if (totalItems) config.TotalItems = parseInt(totalItems);
        if (minItems) config.MinItems = parseInt(minItems);
        if (maxItems) config.MaxItems = parseInt(maxItems);
        if (bonusLevel) config.BonusLevelItems = bonusLevel;
        if (bonusLuck) config.BonusLuckItems = bonusLuck;
        
        return {
            name: document.getElementById('droptable-name')?.value || '',
            tableType: document.getElementById('droptable-type')?.value || 'normal',
            config: config,
            conditions: this.currentDropTable?.conditions || [],
            triggerConditions: this.currentDropTable?.triggerConditions || [],
            drops: this.dropsEditor ? this.dropsEditor.getValue() : []
        };
    }
    
    initializeConditionEditors() {
        console.log('🔵 DropTable: initializeConditionEditors called');
        console.log('🔵 window.ConditionEditor exists?', !!window.ConditionEditor);
        console.log('🔵 this.currentDropTable exists?', !!this.currentDropTable);
        
        if (!window.ConditionEditor) {
            console.warn('⚠️ ConditionEditor not loaded yet, retrying in 500ms...');
            setTimeout(() => this.initializeConditionEditors(), 500);
            return;
        }
        
        if (!this.currentDropTable) {
            console.error('❌ No currentDropTable reference!');
            return;
        }
        
        console.log('✅ ConditionEditor loaded, initializing...');
        
        // Conditions
        const conditionsContainer = document.getElementById('droptable-conditions-editor');
        console.log('🔵 Conditions container:', conditionsContainer);
        if (conditionsContainer) {
            if (!this.currentDropTable.conditions) {
                this.currentDropTable.conditions = [];
            }
            try {
                this.conditionsEditor = new ConditionEditor('droptable-conditions-editor', {
                    mode: 'Conditions',
                    conditions: this.currentDropTable.conditions,
                    onChange: (conditions) => {
                        this.currentDropTable.conditions = conditions;
                        this.updateConditionCount('.fas.fa-filter', conditions.length);
                        this.editor.markDirty();
                    }
                });
                console.log('✅ Conditions editor initialized');
            } catch (error) {
                console.error('❌ Error initializing Conditions editor:', error);
            }
        }
        
        // Trigger Conditions
        const triggerConditionsContainer = document.getElementById('droptable-trigger-conditions-editor');
        console.log('🔵 TriggerConditions container:', triggerConditionsContainer);
        if (triggerConditionsContainer) {
            if (!this.currentDropTable.triggerConditions) {
                this.currentDropTable.triggerConditions = [];
            }
            try {
                this.triggerConditionsEditor = new ConditionEditor('droptable-trigger-conditions-editor', {
                    mode: 'TriggerConditions',
                    conditions: this.currentDropTable.triggerConditions,
                    onChange: (conditions) => {
                        this.currentDropTable.triggerConditions = conditions;
                        this.updateConditionCount('.fas.fa-bolt', conditions.length);
                        this.editor.markDirty();
                    }
                });
                console.log('✅ TriggerConditions editor initialized');
            } catch (error) {
                console.error('❌ Error initializing TriggerConditions editor:', error);
            }
        }
    }
    
    updateConditionCount(iconSelector, count) {
        const icon = document.querySelector(iconSelector);
        if (icon) {
            const badge = icon.parentElement.querySelector('.count-badge');
            if (badge) {
                badge.textContent = count;
            }
        }
    }
    
    renderFileContainer(fileContainer, container) {
        container.innerHTML = `
            <div class="file-container-view">
                <div class="file-container-header">
                    <i class="fas fa-file-code" style="font-size: 4rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <h2>${fileContainer._fileName}</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        This file contains ${fileContainer._file.entries.length} droptable(s)
                    </p>
                </div>
                <div class="file-container-actions">
                    <button class="btn btn-primary btn-large" id="add-droptable-to-file">
                        <i class="fas fa-plus"></i> Add New DropTable to this File
                    </button>
                </div>
                <div class="file-container-info" style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 0.5rem;">
                    <p style="margin: 0; color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> 
                        Click on a droptable in the file tree to edit it, or click the button above to add a new droptable to this file.
                    </p>
                </div>
            </div>
        `;
        document.getElementById('add-droptable-to-file')?.addEventListener('click', () => {
            this.addNewSection();
        });
    }
    
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.droptables) return null;
        if (this.currentDropTable._isFileContainer) {
            return this.currentDropTable._file;
        }
        if (this.currentDropTable._parentFile) {
            return pack.droptables.find(f => f.id === this.currentDropTable._parentFile.id);
        }
        for (const file of pack.droptables) {
            if (file.entries && file.entries.some(e => e.id === this.currentDropTable.id)) {
                return file;
            }
        }
        return null;
    }
}

window.DropTableEditor = DropTableEditor;
