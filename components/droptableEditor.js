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
                        <button class="btn btn-outline btn-danger" id="delete-droptable" title="Delete this droptable">
                            <i class="fas fa-trash"></i> Delete
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
                
                <!-- Conditions -->
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-filter"></i> Conditions
                            ${droptable.conditions && droptable.conditions.length > 0 ? `<span class="count-badge">${droptable.conditions.length}</span>` : ''}
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <p class="help-text">Conditions that must be met by the mob for drops to generate</p>
                        <div class="condition-list-container" id="conditions-list">
                            ${this.renderConditionList(droptable.conditions || [], 'Conditions')}
                        </div>
                        <button class="btn btn-primary btn-sm" id="btnBrowseConditions" style="margin-top: 10px;">
                            <i class="fas fa-search"></i> Browse Conditions
                        </button>
                    </div>
                </div>
                
                <!-- Trigger Conditions -->
                <div class="card collapsible-card collapsed">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-bolt"></i> Trigger Conditions
                            ${droptable.triggerConditions && droptable.triggerConditions.length > 0 ? `<span class="count-badge">${droptable.triggerConditions.length}</span>` : ''}
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <p class="help-text">Conditions that must be met by the killer/trigger entity</p>
                        <div class="condition-list-container" id="triggerconditions-list">
                            ${this.renderConditionList(droptable.triggerConditions || [], 'TriggerConditions')}
                        </div>
                        <button class="btn btn-primary btn-sm" id="btnBrowseTriggerConditions" style="margin-top: 10px;">
                            <i class="fas fa-search"></i> Browse Trigger Conditions
                        </button>
                    </div>
                </div>
                
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
        window.droptableEditor = this;
        
        // Browse Conditions buttons
        document.getElementById('btnBrowseConditions')?.addEventListener('click', () => {
            this.openConditionBrowser('Conditions');
        });
        
        document.getElementById('btnBrowseTriggerConditions')?.addEventListener('click', () => {
            this.openConditionBrowser('TriggerConditions');
        });
        
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
        
        // Delete droptable button
        document.getElementById('delete-droptable')?.addEventListener('click', () => {
            this.deleteDropTable(droptable);
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
    async addNewSection() {
        const newName = await this.editor.showPrompt('New Drop Table', 'Enter name for new droptable:');
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
    async duplicateDropTable(droptable) {
        const newName = await this.editor.showPrompt('Duplicate Drop Table', 'Enter name for duplicated droptable:', droptable.name + '_copy');
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
    async renameDropTable(droptable) {
        const newName = await this.editor.showPrompt('Rename Drop Table', 'Enter new name for droptable:', droptable.name);
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
    
    /**
     * Delete the current droptable
     */
    async deleteDropTable(droptable) {
        const confirmed = await this.editor.showConfirmDialog(
            'Delete Drop Table',
            `Delete droptable "${droptable.name}"? This cannot be undone.`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        // Find parent file
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        const droptableName = droptable.name;
        
        // Remove from entries
        parentFile.entries = parentFile.entries.filter(e => e.id !== droptable.id);
        
        // Update pack tree
        this.editor.packManager.updateFileContainer(parentFile.id, 'droptable');
        
        // Show success message
        this.editor.showToast(`Drop table "${droptableName}" deleted`, 'success');
        this.editor.markDirty();
        
        // Navigate to appropriate view
        if (parentFile.entries.length > 0) {
            this.editor.loadContent(parentFile.entries[0].id, 'droptable');
        } else {
            this.editor.loadContent(parentFile.id, 'droptable');
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
    
    /**
     * Render condition list as interactive cards
     */
    renderConditionList(conditions, sectionType) {
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
            return '<p class="empty-state" style="color: var(--text-secondary); font-style: italic; margin: 10px 0;">📋<br>No conditions added yet. Click "Browse Conditions" to add.</p>';
        }
        
        return conditions.map((cond, index) => {
            const { conditionStr, action, actionParam } = this.parseCondition(cond);
            const actionDisplay = actionParam ? `${action} ${actionParam}` : action;
            
            return `
                <div class="condition-item" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    margin-bottom: 8px;
                ">
                    <code style="flex: 1; font-size: 0.9em;">${this.escapeHtml(conditionStr)}</code>
                    <button class="btn-sm" onclick="window.droptableEditor.toggleConditionAction('${sectionType}', ${index})" title="Click to toggle true/false" style="
                        padding: 4px 8px;
                        background: ${action === 'true' ? '#10b98144' : action === 'false' ? '#ef444444' : '#3b82f644'};
                        border: 1px solid ${action === 'true' ? '#10b981' : action === 'false' ? '#ef4444' : '#3b82f6'};
                        border-radius: 4px;
                        font-size: 0.85em;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${this.escapeHtml(actionDisplay)}</button>
                    <button class="btn-icon" onclick="window.droptableEditor.removeCondition('${sectionType}', ${index})" title="Remove condition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Parse condition string to extract condition and action
     */
    parseCondition(conditionStr) {
        if (!conditionStr) return { conditionStr: '', action: 'true', actionParam: null };
        
        let str = conditionStr.trim();
        if (str.startsWith('- ')) str = str.substring(2);
        
        const actionMatch = str.match(/\s+(true|false|power|cast|castinstead|orElseCast|cancel)(?:\s+(.+))?$/);
        
        if (actionMatch) {
            const conditionPart = str.substring(0, actionMatch.index);
            const action = actionMatch[1];
            const actionParam = actionMatch[2] || null;
            return { conditionStr: conditionPart, action, actionParam };
        }
        
        return { conditionStr: str, action: 'true', actionParam: null };
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Open condition browser for a specific section
     */
    openConditionBrowser(sectionType) {
        if (!window.conditionBrowser) {
            if (typeof ConditionBrowser === 'undefined') {
                this.editor.showToast('Condition Browser not loaded', 'error');
                return;
            }
            window.conditionBrowser = new ConditionBrowser();
        }
        
        const droptable = this.currentDropTable;
        if (!droptable) return;
        
        window.conditionBrowser.open({
            usageMode: 'yaml',
            context: sectionType,
            onSelect: (result) => {
                if (!result || !result.conditionString) {
                    return;
                }
                
                const action = result.action || 'true';
                const actionParam = result.actionParam || '';
                const conditionEntry = actionParam 
                    ? `${result.conditionString} ${action} ${actionParam}`
                    : `${result.conditionString} ${action}`;
                
                const key = sectionType === 'TriggerConditions' ? 'triggerConditions' : 'conditions';
                if (!droptable[key]) {
                    droptable[key] = [];
                }
                
                droptable[key].push(conditionEntry);
                this.refreshConditionList(sectionType);
                this.editor.markDirty();
                this.editor.showToast(`Condition added to ${sectionType}`, 'success');
            }
        });
    }
    
    /**
     * Refresh condition list display
     */
    refreshConditionList(sectionType) {
        const droptable = this.currentDropTable;
        if (!droptable) return;
        
        const key = sectionType === 'TriggerConditions' ? 'triggerConditions' : 'conditions';
        const containerId = sectionType === 'TriggerConditions' ? 'triggerconditions-list' : 'conditions-list';
        const container = document.getElementById(containerId);
        
        if (container) {
            container.innerHTML = this.renderConditionList(droptable[key] || [], sectionType);
        }
        
        // Update count badge
        const icon = sectionType === 'TriggerConditions' ? '.fas.fa-bolt' : '.fas.fa-filter';
        const iconElement = document.querySelector(icon);
        if (iconElement) {
            const badge = iconElement.parentElement.querySelector('.count-badge');
            if (badge) {
                const count = droptable[key]?.length || 0;
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = '';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    }
    
    /**
     * Toggle condition action between true/false
     */
    toggleConditionAction(sectionType, index) {
        const droptable = this.currentDropTable;
        const key = sectionType === 'TriggerConditions' ? 'triggerConditions' : 'conditions';
        if (!droptable || !droptable[key] || !droptable[key][index]) return;
        
        const { conditionStr, action, actionParam } = this.parseCondition(droptable[key][index]);
        const newAction = action === 'true' ? 'false' : 'true';
        const newCondition = actionParam 
            ? `${conditionStr} ${newAction} ${actionParam}`
            : `${conditionStr} ${newAction}`;
        
        droptable[key][index] = newCondition;
        this.refreshConditionList(sectionType);
        this.editor.markDirty();
    }
    
    /**
     * Remove a condition
     */
    removeCondition(sectionType, index) {
        const droptable = this.currentDropTable;
        const key = sectionType === 'TriggerConditions' ? 'triggerConditions' : 'conditions';
        if (!droptable || !droptable[key]) return;
        
        droptable[key].splice(index, 1);
        this.refreshConditionList(sectionType);
        this.editor.markDirty();
        this.editor.showToast('Condition removed', 'success');
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
