/**
 * Mob Editor Component - Complete Redesign
 * Supports Beginner/Advanced modes with entity-specific field visibility
 */
class MobEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentMob = null;
        this.fieldManager = new EntityFieldManager();
        this.triggerBrowser = null;
        this.targeterBrowser = null;
        this.mechanicBrowser = null;
        // conditionEditor removed - using global conditionBrowserV2
    }
    
    render(mob) {
        this.currentMob = mob;
        const container = document.getElementById('mob-editor-view');
        if (!container) return;
        
        // Check if this is a file container (YML file selected, not a specific mob)
        if (mob._isFileContainer) {
            this.renderFileContainer(mob, container);
            return;
        }
        
        const isAdvanced = this.editor.state.currentMode === 'advanced';
        
        container.innerHTML = `
            <div class="editor-header">
                <h2>
                    <i class="fas fa-skull"></i>
                    Mob Editor
                    <span class="mob-name">${mob.name}</span>
                    <span class="mode-badge ${isAdvanced ? 'advanced' : 'beginner'}">${isAdvanced ? 'Advanced' : 'Beginner'} Mode</span>
                </h2>
                <div class="editor-actions">
                    <div class="action-group secondary-actions">
                        <button class="btn btn-outline" id="duplicate-mob" title="Create a copy of this mob (Ctrl+D)">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline btn-danger" id="delete-mob" title="Delete this mob">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-secondary" id="new-mob" title="Add a new mob to this file">
                            <i class="fas fa-plus"></i> New Section
                        </button>
                    </div>
                    <button class="btn btn-primary" id="save-mob">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>

            <div class="editor-content">
                ${this.renderCoreIdentity(mob, isAdvanced)}
                ${this.renderCombatStats(mob, isAdvanced)}
                ${isAdvanced ? this.renderUniversalOptions(mob) : ''}
                ${this.renderEntitySpecificSections(mob, isAdvanced)}
                ${this.renderDisplayOptionsSection(mob, isAdvanced)}
                ${isAdvanced ? this.renderFactionSection(mob) : ''}
                ${this.renderMountSection(mob, isAdvanced)}
                ${isAdvanced ? this.renderHealthBarSection(mob) : ''}
                ${isAdvanced ? this.renderBossBarSection(mob) : ''}
                ${isAdvanced ? this.renderHearingSection(mob) : ''}
                ${isAdvanced ? this.renderDisguiseSection(mob) : ''}
                ${isAdvanced ? this.renderEquipmentSection(mob) : ''}
                ${isAdvanced ? this.renderDamageModifiersSection(mob) : ''}
                ${isAdvanced ? this.renderKillMessagesSection(mob) : ''}
                ${isAdvanced ? this.renderAIGoalSelectorsSection(mob) : ''}
                ${isAdvanced ? this.renderAITargetSelectorsSection(mob) : ''}
                ${isAdvanced ? this.renderModulesSection(mob) : ''}
                ${isAdvanced ? this.renderLevelModifiersSection(mob) : ''}
                ${isAdvanced ? this.renderTotemSection(mob) : ''}
                ${this.renderTradesSection(mob, isAdvanced)}

                ${this.renderSkillsSection(mob)}
                ${this.renderDropsSection(mob)}
                ${isAdvanced ? this.renderDropOptionsSection(mob) : ''}
            </div>
        </div>
        `;
        
        // Clear the mode switch flag after rendering
        if (this.editor.state.justSwitchedToAdvanced !== undefined) {
            this.editor.state.justSwitchedToAdvanced = false;
        }
        
        this.attachEventListeners();
    }

    syncToFile() {
        // Sync currentMob data to state.currentFile for live preview
        if (this.currentMob && this.editor.state.currentFile) {
            Object.assign(this.editor.state.currentFile, this.currentMob);
        }
    }
    
    async saveMob(mob) {
        if (!mob.name) {
            this.editor.showToast('Please enter an internal name', 'error');
            return;
        }
        
        // Only require type if no template is set
        const hasTemplate = mob.template && mob.template.trim();
        if (!mob.type && !hasTemplate) {
            this.editor.showToast('Please select an entity type or use a template', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('save-mob');
        const originalHTML = saveBtn?.innerHTML;
        
        try {
            // Show saving state
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
            
            // Sync data before saving
            this.syncToFile();
            
            // Save through editor
            if (this.editor && this.editor.saveCurrentFile) {
                await this.editor.saveCurrentFile();
            }
        } finally {
            // Restore button state
            if (saveBtn && originalHTML) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHTML;
            }
        }
    }
    
    /**
     * Add a new mob section to the current file
     */
    async addNewSection() {
        let newName = await this.editor.showPrompt('New Mob', 'Enter name for new mob:');
        if (!newName || newName.trim() === '') return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
        // Find the parent file for the current mob
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A mob with that name already exists in this file', 'error');
            return;
        }
        
        // Create new mob with defaults
        const newMob = {
            id: 'mob-' + Date.now(),
            name: newName.trim(),
            type: 'ZOMBIE',
            health: 0,
            damage: 0
        };
        
        // Add to parent file's entries
        parentFile.entries.push(newMob);
        
        // Open the new mob
        newMob._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(newMob, 'mob');
        this.editor.showToast(`Created new mob "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'mob');
        }
    }
    
    /**
     * Duplicate the current mob within the same file
     */
    async duplicateMob() {
        let newName = await this.editor.showPrompt('Duplicate Mob', 'Enter name for duplicated mob:', this.currentMob.name + '_copy');
        if (!newName || newName.trim() === '') return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
        // Find the parent file for the current mob
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A mob with that name already exists in this file', 'error');
            return;
        }
        
        // Create a deep copy of the mob
        const duplicatedMob = typeof structuredClone !== 'undefined' ? structuredClone(this.currentMob) : JSON.parse(JSON.stringify(this.currentMob));
        duplicatedMob.name = newName.trim();
        duplicatedMob.id = 'mob-' + Date.now();
        delete duplicatedMob._parentFile; // Remove old reference
        
        // Add to parent file's entries
        parentFile.entries.push(duplicatedMob);
        
        // Open the new mob
        duplicatedMob._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(duplicatedMob, 'mob');
        this.editor.showToast(`Duplicated mob as "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'mob');
        }
    }
    
    /**
     * Find the parent file for the current mob
     */
    /**
     * Render file container view (when YML file is selected)
     */
    renderFileContainer(fileContainer, container) {
        container.innerHTML = `
            <div class="file-container-view">
                <div class="file-container-header">
                    <i class="fas fa-file-code" style="font-size: 4rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <h2>${fileContainer._fileName}</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        This file contains ${fileContainer._file.entries.length} mob(s)
                    </p>
                </div>
                <div class="file-container-actions">
                    <button class="btn btn-primary btn-large" id="add-mob-to-file">
                        <i class="fas fa-plus"></i> Add New Mob to this File
                    </button>
                </div>
                <div class="file-container-info" style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 0.5rem;">
                    <p style="margin: 0; color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> 
                        Click on a mob in the file tree to edit it, or click the button above to add a new mob to this file.
                    </p>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('add-mob-to-file')?.addEventListener('click', () => {
            this.addNewSection();
        });
    }
    
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.mobs) return null;
        
        // If current mob is a file container, return the file directly
        if (this.currentMob._isFileContainer) {
            return this.currentMob._file;
        }
        
        // Check if _parentFile reference exists
        if (this.currentMob._parentFile) {
            return pack.mobs.find(f => f.id === this.currentMob._parentFile.id);
        }
        
        // Search all files for this mob
        for (const file of pack.mobs) {
            if (file.entries && file.entries.some(e => e.id === this.currentMob.id)) {
                return file;
            }
        }
        
        return null;
    }
    
    /**
     * Get all mob entries across all files in the pack
     * @returns {Array} All mob entries with _parentFile references
     */
    getAllMobEntries() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.mobs) return [];
        
        const allMobs = [];
        
        // Check if using new file-based structure
        if (Array.isArray(pack.mobs) && pack.mobs.length > 0) {
            if (pack.mobs[0].entries !== undefined) {
                // New structure: iterate through files and their entries
                pack.mobs.forEach(file => {
                    if (file.entries && Array.isArray(file.entries)) {
                        file.entries.forEach(mob => {
                            // Attach parent file reference for navigation
                            mob._parentFile = { id: file.id, fileName: file.fileName };
                            allMobs.push(mob);
                        });
                    }
                });
            } else {
                // Legacy flat structure
                allMobs.push(...pack.mobs);
            }
        }
        
        return allMobs;
    }
    
    /**
     * Find a mob entry by name across all files
     */
    findMobByName(name) {
        if (!name) return null;
        const allMobs = this.getAllMobEntries();
        return allMobs.find(m => m.name === name || m.internalName === name) || null;
    }
    
    /**
     * Rename the current mob
     */
    async renameMob() {
        let newName = await this.editor.showPrompt('Rename Mob', 'Enter new name for mob:', this.currentMob.name);
        if (!newName || newName.trim() === '' || newName.trim() === this.currentMob.name) return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
        // Check if name already exists across all mobs
        const existing = this.findMobByName(newName.trim());
        if (existing && existing.id !== this.currentMob.id) {
            this.editor.showToast('A mob with that name already exists', 'error');
            return;
        }
        
        const oldName = this.currentMob.name;
        this.currentMob.name = newName.trim();
        
        // Update the UI
        this.render(this.currentMob);
        this.attachEventListeners();
        this.editor.showToast(`Renamed mob from "${oldName}" to "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.render();
        }
    }
    
    /**
     * Delete the current mob
     */
    async deleteMob() {
        const confirmed = await this.editor.showConfirmDialog(
            'Delete Mob',
            `Delete mob "${this.currentMob.name}"? This cannot be undone.`,
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
        
        const mobName = this.currentMob.name;
        
        // Remove from entries
        parentFile.entries = parentFile.entries.filter(e => e.id !== this.currentMob.id);
        
        // Update pack tree
        this.editor.packManager.updateFileContainer(parentFile.id, 'mob');
        
        // Show success message
        this.editor.showToast(`Mob "${mobName}" deleted`, 'success');
        this.editor.markDirty();
        
        // Navigate to appropriate view
        if (parentFile.entries.length > 0) {
            this.editor.openFile(parentFile.entries[0], 'mob');
        } else {
            this.editor.openFile(parentFile, 'mob');
        }
    }
    
    renderCoreIdentity(mob, isAdvanced) {
        const hasTemplate = mob.template && mob.template.trim();
        const templateMob = hasTemplate ? this.getTemplateMob(mob.template) : null;
        const nameplate = mob.nameplate || {};
        const hasMultipleLines = mob.display && mob.display.includes('\\n');
        
        return `
            <div class="card collapsible-card">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-id-card"></i> Core Identity
                        ${hasTemplate ? '<span class="template-badge"><i class="fas fa-layer-group"></i> Uses Template</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Internal Name <span class="required">*</span></label>
                            <input type="text" class="form-input" id="mob-name" value="${mob.name}">
                            <small class="form-hint">Internal mob identifier (no spaces)</small>
                            <small class="form-hint" id="mob-name-sanitized" style="color: var(--accent-primary); display: none;"></small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Entity Type ${isAdvanced && hasTemplate ? '' : '<span class="required">*</span>'}</label>
                            <div class="entity-type-wrapper">
                                ${hasTemplate ? `
                                    <button type="button" class="entity-type-lock-btn ${!mob.type ? 'locked' : 'unlocked'}" 
                                            id="entity-type-lock" 
                                            title="${!mob.type ? 'Click to override template entity type' : 'Click to use inherited entity type'}">
                                        <i class="fas ${!mob.type ? 'fa-lock' : 'fa-lock-open'}"></i>
                                    </button>
                                ` : ''}
                                <select class="form-select ${hasTemplate && !mob.type ? 'inherited-field' : ''}" id="mob-type" ${hasTemplate && !mob.type ? 'disabled' : ''}>
                                    ${this.renderEntityTypes(mob.type, hasTemplate && !mob.type ? templateMob?.type : null)}
                                </select>
                            </div>
                            ${hasTemplate && !mob.type ? `<small class="form-hint inherited-hint"><i class="fas fa-layer-group"></i> Inherited from ${mob.template}</small>` : 
                              hasTemplate && mob.type ? `<small class="form-hint override-hint"><i class="fas fa-edit"></i> Overriding template (${templateMob?.type || 'unknown'})</small>` :
                              '<small class="form-hint">Base entity type</small>'}
                        </div>
                    </div>
                    
                    ${isAdvanced ? this.renderTemplateSection(mob, templateMob) : this.renderBeginnerTemplateInfo(mob)}
                    
                    ${isAdvanced ? this.renderAdvancedDisplayName(mob, nameplate) : this.renderBeginnerDisplayName(mob)}
                    
                    ${this.renderVanillaOverrideInfo(mob)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render beginner display name (simple single-line)
     */
    renderBeginnerDisplayName(mob) {
        return `
            <div class="form-group" data-mob-field="Display">
                <label class="form-label">Display Name</label>
                <input type="text" class="form-input" id="mob-display" value="${this.escapeHtml(mob.display || '')}">
                <small class="form-hint">Use & for color codes (e.g., &6Gold &lBold)</small>
            </div>
        `;
    }
    
    /**
     * Render advanced display name with multi-line support and nameplate options
     */
    renderAdvancedDisplayName(mob, nameplate) {
        const displayLines = this.parseDisplayLines(mob.display || '');
        const useMultiLine = nameplate.enabled || displayLines.length > 1;
        
        return `
            <div class="form-group display-name-advanced" data-mob-field="Display">
                <div class="display-name-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <label class="form-label" style="margin: 0;">Display Name</label>
                    <label class="checkbox-label small" style="margin: 0; font-size: 0.85rem;">
                        <input type="checkbox" id="mob-use-multiline" ${useMultiLine ? 'checked' : ''}>
                        Multi-line (Nameplate)
                    </label>
                </div>
                
                <div id="display-name-single" style="display: ${useMultiLine ? 'none' : 'block'};">
                    <input type="text" class="form-input" id="mob-display" value="${this.escapeHtml(displayLines[0] || '')}">
                    <small class="form-hint">Use & for color codes (e.g., &6Gold &lBold)</small>
                </div>
                
                <div id="display-name-multiline" style="display: ${useMultiLine ? 'block' : 'none'};">
                    <div id="display-lines-container" class="display-lines-container">
                        ${displayLines.map((line, index) => this.renderDisplayLine(line, index, displayLines.length)).join('')}
                    </div>
                    
                    <button type="button" class="btn btn-secondary btn-sm" id="add-display-line-btn" style="margin-top: 0.5rem; width: 100%;">
                        <i class="fas fa-plus"></i> Add Line
                    </button>
                    
                    <div class="nameplate-settings" style="margin-top: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px; border: 1px solid var(--border-color);">
                        <div class="nameplate-settings-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <i class="fas fa-cog" style="color: var(--text-secondary);"></i>
                            <span style="font-weight: 600; font-size: 0.9rem;">Nameplate Settings</span>
                        </div>
                        
                        <div class="grid-2" style="gap: 0.75rem;">
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label" style="font-size: 0.8rem;">Offset</label>
                                <input type="number" class="form-input" id="mob-nameplate-offset" 
                                       value="${nameplate.offset || 1.8}" step="0.1" min="0" max="10">
                                <small class="form-hint">Height above mob</small>
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label" style="font-size: 0.8rem;">Scale</label>
                                <input type="text" class="form-input" id="mob-nameplate-scale" 
                                       value="${nameplate.scale || '1,1,1'}" placeholder="1,1,1">
                                <small class="form-hint">Size (x,y,z)</small>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin: 0.5rem 0 0 0;">
                            <label class="checkbox-label" style="font-size: 0.85rem;">
                                <input type="checkbox" id="mob-nameplate-mounted" ${nameplate.mounted ? 'checked' : ''}>
                                Mounted (ModelEngine)
                            </label>
                        </div>
                    </div>
                    
                    <small class="form-hint" style="margin-top: 0.5rem; display: block;">
                        <i class="fas fa-info-circle"></i> Multi-line uses MythicMobs Nameplate system. Requires Paper/Spigot 1.19.4+
                    </small>
                </div>
            </div>
        `;
    }
    
    /**
     * Parse display name into lines
     */
    parseDisplayLines(display) {
        if (!display) return [''];
        // Split by literal \n (escaped newline in YAML)
        const lines = display.split('\\n');
        return lines.length > 0 ? lines : [''];
    }
    
    /**
     * Render a single display line input
     */
    renderDisplayLine(line, index, totalLines) {
        return `
            <div class="display-line-row" data-line-index="${index}" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                <span class="line-number" style="color: var(--text-tertiary); font-size: 0.75rem; min-width: 20px;">${index + 1}.</span>
                <input type="text" class="form-input display-line-input" 
                       value="${this.escapeHtml(line)}" 
                       placeholder="Line ${index + 1}..."
                       data-line-index="${index}">
                ${totalLines > 1 ? `
                    <button type="button" class="btn btn-icon btn-danger btn-sm remove-display-line" data-line-index="${index}" title="Remove line">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render inline vanilla override info in Core Identity
     */
    renderVanillaOverrideInfo(mob) {
        const vanillaMobsList = window.ALL_VANILLA_MOBS || [];
        const isVanillaOverride = mob.name && vanillaMobsList.some(vm => vm.type.toUpperCase() === mob.name.toUpperCase());
        
        if (!isVanillaOverride) return '';
        
        return `
            <div class="vanilla-override-notice" style="
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, var(--bg-secondary) 100%);
                border: 1px solid var(--success);
                border-radius: 0.5rem;
                padding: 0.75rem 1rem;
                margin-top: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            ">
                <i class="fas fa-ghost" style="color: var(--success); font-size: 1.25rem;"></i>
                <div>
                    <strong style="color: var(--success);">Vanilla Override Active</strong>
                    <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                        All naturally spawned <strong>${mob.name}</strong> mobs will become this custom mob.
                    </p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render a simple template info box for Beginner mode
     * Shows if the mob uses a template, without full editing capabilities
     */
    renderBeginnerTemplateInfo(mob) {
        const hasTemplate = mob.template && mob.template.trim();
        if (!hasTemplate) return '';
        
        return `
            <div class="template-info-beginner" style="
                background: linear-gradient(135deg, var(--accent-primary-light) 0%, var(--bg-secondary) 100%);
                border: 1px solid var(--accent-primary);
                border-radius: 0.5rem;
                padding: 0.75rem 1rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            ">
                <i class="fas fa-layer-group" style="color: var(--accent-primary);"></i>
                <span>Uses template: <strong>${mob.template}</strong></span>
                <small style="margin-left: auto; color: var(--text-tertiary);">Switch to Advanced mode to edit</small>
            </div>
        `;
    }
    
    renderTemplateSection(mob, templateMob) {
        const hasTemplate = mob.template && mob.template.trim();
        const templateExists = templateMob !== null;
        const availableMobs = this.getAvailableMobs(mob.name);
        const childMobs = this.getChildMobs(mob.name);
        const inheritanceChain = hasTemplate ? this.getInheritanceChain(mob.template) : [];
        
        return `
            <div class="template-section">
                <!-- Template Selection -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-layer-group"></i> Template (Parent Mob)
                        ${hasTemplate ? (templateExists ? 
                            '<span class="template-status valid"><i class="fas fa-check-circle"></i> Valid</span>' : 
                            '<span class="template-status invalid"><i class="fas fa-exclamation-triangle"></i> Not Found</span>'
                        ) : ''}
                    </label>
                    <div id="template-dropdown-container"></div>
                    <small class="form-hint">Inherit properties from another mob. Properties set below will override the template.</small>
                </div>
                
                ${hasTemplate ? this.renderInheritanceChain(inheritanceChain) : ''}
                
                ${hasTemplate && templateMob ? this.renderTemplatePreview(templateMob, mob) : ''}
                
                <!-- Children Section - Show if this mob is used as a template -->
                ${childMobs.length > 0 ? this.renderChildMobsSection(childMobs) : ''}
                
                <!-- Quick Actions -->
                <div class="template-actions">
                    <button class="btn btn-sm btn-secondary" id="create-child-mob" title="Create a new mob that inherits from this one">
                        <i class="fas fa-code-branch"></i> Create Child Mob
                    </button>
                    ${hasTemplate ? `
                        <button class="btn btn-sm btn-outline" id="detach-template" title="Copy all inherited values and remove template reference">
                            <i class="fas fa-unlink"></i> Detach from Template
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render the inheritance chain visualization
     */
    renderInheritanceChain(chain) {
        if (chain.length === 0) return '';
        
        return `
            <div class="inheritance-chain">
                <div class="chain-label"><i class="fas fa-sitemap"></i> Inheritance Chain:</div>
                <div class="chain-items">
                    <span class="chain-item current">This Mob</span>
                    ${chain.map((item, index) => `
                        <i class="fas fa-arrow-right chain-arrow"></i>
                        <span class="chain-item ${item.exists ? 'exists' : 'missing'}" 
                              ${item.exists ? `data-mob-name="${item.name}" title="Click to edit ${item.name}"` : `title="Template not found: ${item.name}"`}>
                            ${item.name}
                            ${!item.exists ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render the child mobs section
     */
    renderChildMobsSection(childMobs) {
        return `
            <div class="child-mobs-section">
                <div class="child-mobs-header">
                    <i class="fas fa-sitemap"></i> 
                    Child Mobs (${childMobs.length})
                    <small class="hint">These mobs inherit from this one</small>
                </div>
                <div class="child-mobs-list">
                    ${childMobs.map(child => `
                        <span class="child-mob-chip" data-mob-name="${child.name}" title="Click to edit ${child.name}">
                            <i class="fas fa-link"></i>
                            ${child.name}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderTemplatePreview(templateMob, currentMob) {
        const inheritedProps = [];
        const overriddenProps = [];
        
        // Check which properties are inherited vs overridden
        const propsToCheck = [
            { key: 'type', label: 'Entity Type', icon: 'fa-dragon' },
            { key: 'health', label: 'Health', icon: 'fa-heart' },
            { key: 'damage', label: 'Damage', icon: 'fa-sword' },
            { key: 'armor', label: 'Armor', icon: 'fa-shield-alt' },
            { key: 'display', label: 'Display Name', icon: 'fa-tag' },
            { key: 'movementSpeed', label: 'Movement Speed', icon: 'fa-running' },
            { key: 'skills', label: 'Skills', icon: 'fa-magic', isArray: true },
            { key: 'drops', label: 'Drops', icon: 'fa-box', isArray: true },
            { key: 'equipment', label: 'Equipment', icon: 'fa-tshirt', isObject: true }
        ];
        
        propsToCheck.forEach(prop => {
            const templateValue = templateMob[prop.key];
            const currentValue = currentMob[prop.key];
            
            if (templateValue !== undefined && templateValue !== null && templateValue !== '') {
                const hasOverride = prop.isArray ? 
                    (currentValue && currentValue.length > 0) :
                    prop.isObject ? 
                        (currentValue && Object.keys(currentValue).length > 0) :
                        (currentValue !== undefined && currentValue !== null && currentValue !== '');
                
                const displayValue = prop.isArray ? 
                    `${templateValue.length} items` :
                    prop.isObject ? 
                        `${Object.keys(templateValue).length} slots` :
                        templateValue;
                
                if (hasOverride) {
                    overriddenProps.push({ ...prop, value: displayValue });
                } else {
                    inheritedProps.push({ ...prop, value: displayValue });
                }
            }
        });
        
        if (inheritedProps.length === 0 && overriddenProps.length === 0) {
            return '';
        }
        
        return `
            <div class="template-preview">
                <div class="template-preview-header" id="toggle-template-preview">
                    <span><i class="fas fa-eye"></i> Inherited Properties</span>
                    <i class="fas fa-chevron-down template-preview-toggle"></i>
                </div>
                <div class="template-preview-body" id="template-preview-body">
                    ${inheritedProps.length > 0 ? `
                        <div class="inherited-props">
                            <div class="props-label"><i class="fas fa-arrow-down"></i> Inherited from <strong>${currentMob.template}</strong>:</div>
                            <div class="props-grid">
                                ${inheritedProps.map(p => `
                                    <div class="prop-chip inherited">
                                        <i class="fas ${p.icon}"></i>
                                        <span class="prop-name">${p.label}</span>
                                        <span class="prop-value">${p.value}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${overriddenProps.length > 0 ? `
                        <div class="overridden-props">
                            <div class="props-label"><i class="fas fa-edit"></i> Overridden in this mob:</div>
                            <div class="props-grid">
                                ${overriddenProps.map(p => `
                                    <div class="prop-chip overridden">
                                        <i class="fas ${p.icon}"></i>
                                        <span class="prop-name">${p.label}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    getAvailableMobs(excludeName = null) {
        const allMobs = this.getAllMobEntries();
        
        return allMobs
            .filter(m => m.name !== excludeName)
            .map(m => m.name)
            .sort((a, b) => a.localeCompare(b));
    }
    
    getTemplateMob(templateName) {
        if (!templateName) return null;
        
        // Handle comma-separated templates (just check the first one)
        const firstName = templateName.split(',')[0].trim();
        return this.findMobByName(firstName);
    }
    
    /**
     * Find all mobs that use the given mob as their template
     * @param {string} mobName - Name of the potential parent mob
     * @returns {Array} List of child mobs
     */
    getChildMobs(mobName) {
        if (!mobName) return [];
        
        const allMobs = this.getAllMobEntries();
        
        return allMobs.filter(m => {
            if (!m.template) return false;
            // Check if this mob's template includes the given name
            const templates = m.template.split(',').map(t => t.trim());
            return templates.includes(mobName);
        });
    }
    
    /**
     * Get the full inheritance chain for a mob (template -> template -> ...)
     * @param {string} templateName - Starting template name
     * @param {Set} visited - Set of already visited mobs (to prevent cycles)
     * @returns {Array} Inheritance chain from immediate parent to root
     */
    getInheritanceChain(templateName, visited = new Set()) {
        if (!templateName || visited.has(templateName)) return [];
        visited.add(templateName);
        
        const templateMob = this.getTemplateMob(templateName);
        if (!templateMob) return [{ name: templateName, exists: false }];
        
        const chain = [{ name: templateName, exists: true, mob: templateMob }];
        
        // Recursively get parent chain
        if (templateMob.template) {
            chain.push(...this.getInheritanceChain(templateMob.template, visited));
        }
        
        return chain;
    }
    
    /**
     * Show dialog to create a new child mob that inherits from the current mob
     */
    showCreateChildMobDialog() {
        const parentName = this.currentMob?.name;
        if (!parentName) return;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas fa-code-branch"></i> Create Child Mob</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                        Create a new mob that inherits from <strong>${parentName}</strong>
                    </p>
                    <div class="form-group">
                        <label class="form-label">Child Mob Name <span class="required">*</span></label>
                        <input type="text" class="form-input" id="child-mob-name" 
                               placeholder="e.g., ${parentName}Elite" autofocus>
                        <small class="form-hint">Internal identifier (no spaces)</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-child-mob">Cancel</button>
                    <button class="btn btn-primary" id="confirm-child-mob">
                        <i class="fas fa-plus"></i> Create Child
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus input
        setTimeout(() => {
            document.getElementById('child-mob-name')?.focus();
        }, 50);
        
        // Event handlers
        const closeModal = () => modal.remove();
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-child-mob').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        modal.querySelector('#confirm-child-mob').addEventListener('click', () => {
            const nameInput = document.getElementById('child-mob-name');
            const childName = nameInput.value.trim();
            
            if (!childName) {
                this.editor.showToast('Please enter a name for the child mob', 'error');
                nameInput.focus();
                return;
            }
            
            // Check if name already exists
            const existingMob = this.getAvailableMobs().find(n => n === childName);
            if (existingMob) {
                this.editor.showToast(`A mob named "${childName}" already exists`, 'error');
                nameInput.focus();
                return;
            }
            
            this.createChildMob(childName, parentName);
            closeModal();
        });
        
        // Enter key to confirm
        document.getElementById('child-mob-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                modal.querySelector('#confirm-child-mob').click();
            }
        });
    }
    
    /**
     * Create a new child mob that inherits from the given parent
     */
    createChildMob(childName, parentName) {
        const pack = this.editor.state.currentPack;
        if (!pack) {
            this.editor.showToast('No pack loaded', 'error');
            return;
        }
        
        // Create new mob with template reference
        const newMob = {
            id: 'mob-' + Date.now(),
            name: childName,
            template: parentName
            // Don't set type - inherited from template
            // Don't set defaults - inherited from template
        };
        
        // Find the file containing the parent and add to same file
        const parentMob = this.findMobByName(parentName);
        let targetFile = null;
        
        if (parentMob && parentMob._parentFile) {
            // Find the actual file object
            targetFile = pack.mobs?.find(f => f.id === parentMob._parentFile.id);
        }
        
        if (!targetFile && pack.mobs?.length > 0) {
            // Use the first file as default
            targetFile = pack.mobs[0];
        }
        
        if (targetFile && targetFile.entries) {
            // Add to file's entries
            targetFile.entries.push(newMob);
            newMob._parentFile = { id: targetFile.id, fileName: targetFile.fileName };
        } else {
            this.editor.showToast('Could not find target file', 'error');
            return;
        }
        
        // Navigate to the new mob
        this.editor.showToast(`Created child mob: ${childName}`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.render();
        }
        
        // Open the new mob for editing
        this.editor.state.currentFile = newMob;
        this.render(newMob);
    }
    
    /**
     * Detach from template - copy all inherited values locally
     */
    async detachFromTemplate() {
        if (!this.currentMob || !this.currentMob.template) return;
        
        const templateMob = this.getTemplateMob(this.currentMob.template);
        if (!templateMob) {
            this.editor.showToast('Template not found', 'error');
            return;
        }
        
        // Confirm action
        const confirmed = await this.editor.showConfirmDialog('Apply Template', `This will copy all values from "${this.currentMob.template}" to this mob and remove the template reference. Continue?`, 'Continue', 'Cancel');
        if (!confirmed) {
            return;
        }
        
        // Get full resolved values from template chain
        const resolvedValues = this.resolveTemplateChain(this.currentMob);
        
        // Properties to copy from template (only if not already set on current mob)
        const propsToInherit = [
            'type', 'health', 'damage', 'armor', 'display', 'movementSpeed',
            'followRange', 'attackSpeed', 'knockbackResistance', 'despawn',
            'faction', 'alwaysShowName', 'visibleByDefault', 'invisible',
            'glowing', 'silent', 'noGravity', 'collidable', 'interactable',
            'lockPitch', 'noAI', 'invincible'
        ];
        
        propsToInherit.forEach(prop => {
            if (this.currentMob[prop] === undefined && resolvedValues[prop] !== undefined) {
                this.currentMob[prop] = resolvedValues[prop];
            }
        });
        
        // Copy equipment if not set
        if (!this.currentMob.equipment && resolvedValues.equipment) {
            this.currentMob.equipment = { ...resolvedValues.equipment };
        }
        
        // Copy skills if not set
        if ((!this.currentMob.skills || this.currentMob.skills.length === 0) && resolvedValues.skills) {
            this.currentMob.skills = [...resolvedValues.skills];
        }
        
        // Copy drops if not set
        if ((!this.currentMob.drops || this.currentMob.drops.length === 0) && resolvedValues.drops) {
            this.currentMob.drops = [...resolvedValues.drops];
        }
        
        // Remove template reference
        delete this.currentMob.template;
        
        this.editor.showToast('Detached from template - all values copied locally', 'success');
        this.render(this.currentMob);
    }
    
    /**
     * Resolve all inherited values from the template chain
     */
    resolveTemplateChain(mob) {
        const resolved = {};
        
        // Get inheritance chain (from immediate parent to root)
        const chain = this.getInheritanceChain(mob.template);
        
        // Apply values from root to immediate parent (so closer parents override)
        for (let i = chain.length - 1; i >= 0; i--) {
            const templateItem = chain[i];
            if (templateItem.exists && templateItem.mob) {
                Object.entries(templateItem.mob).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '' && key !== 'name' && key !== 'template') {
                        resolved[key] = value;
                    }
                });
            }
        }
        
        return resolved;
    }
    
    /**
     * Navigate to a mob by name
     */
    navigateToMob(mobName) {
        const mob = this.findMobByName(mobName);
        if (mob) {
            this.editor.state.currentFile = mob;
            this.render(mob);
            
            // Ensure Mobs folder is expanded
            const folderStates = this.editor.packManager.getFolderStates();
            if (!folderStates['mobs']) {
                this.editor.packManager.saveFolderState('mobs', true);
            }
            
            // Expand the parent file in the tree if it's collapsed
            if (mob._parentFile && mob._parentFile.id) {
                const parentFileId = mob._parentFile.id;
                const fileStates = this.editor.packManager.getFileStates();
                
                // Expand the file if it's collapsed
                if (!fileStates[parentFileId]) {
                    this.editor.packManager.saveFileState(parentFileId, true);
                }
            }
            
            // Re-render the tree to apply changes and highlight active item
            this.editor.packManager.renderPackTree();
            
            this.editor.showToast(`Opened: ${mobName}`, 'info');
        } else {
            this.editor.showToast(`Mob "${mobName}" not found`, 'error');
        }
    }
    
    renderCombatStats(mob, isAdvanced) {
        return `
            <div class="card collapsible-card collapsed" data-mob-field="Health">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-heart"></i> Combat & Movement
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-3">
                        <div class="form-group" data-mob-field="Health">
                            <label class="form-label">Health</label>
                            <input type="number" class="form-input" id="mob-health" value="${mob.health || 0}" min="0" step="0.5">
                            <small class="form-hint">Maximum health points</small>
                        </div>
                        <div class="form-group" data-mob-field="Damage">
                            <label class="form-label">Damage</label>
                            <input type="text" class="form-input" id="mob-damage" value="${mob.damage || ''}" placeholder="e.g. 5 or 2.5-3.5">
                            <small class="form-hint">Attack damage (single value or range)</small>
                        </div>
                        <div class="form-group" data-mob-field="Armor">
                            <label class="form-label">Armor</label>
                            <input type="number" class="form-input" id="mob-armor" value="${mob.armor || 0}" min="0">
                            <small class="form-hint">Armor points</small>
                        </div>
                    </div>
                    <div class="grid-${isAdvanced ? '3' : '2'}">
                        <div class="form-group" data-mob-field="MovementSpeed">
                            <label class="form-label">Movement Speed</label>
                            <input type="number" class="form-input" id="mob-movementspeed" value="${mob.movementSpeed || 0.25}" step="0.01">
                            <small class="form-hint">Default: 0.2 - 0.25</small>
                        </div>
                        ${isAdvanced ? `
                        <div class="form-group" data-mob-field="FollowRange">
                            <label class="form-label">Follow Range</label>
                            <input type="number" class="form-input" id="mob-followrange" value="${mob.followRange || 32}" min="0">
                            <small class="form-hint">Target tracking range</small>
                        </div>
                        <div class="form-group" data-mob-field="AttackSpeed">
                            <label class="form-label">Attack Speed</label>
                            <input type="number" class="form-input" id="mob-attackspeed" value="${mob.attackSpeed || 1}" min="0" step="0.1">
                            <small class="form-hint">Attacks per second</small>
                        </div>
                        <div class="form-group" data-mob-field="KnockbackResistance">
                            <label class="form-label">Knockback Resistance</label>
                            <input type="number" class="form-input" id="mob-knockbackresistance" value="${mob.knockbackResistance || 0}" min="0" max="1" step="0.1">
                            <small class="form-hint">0 = none, 1 = full</small>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderUniversalOptions(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}" data-mob-field="AlwaysShowName">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-globe"></i> Universal Options
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <h4 class="subsection-title">Display & Visibility</h4>
                    <div class="grid-5">
                        <div class="form-group" data-mob-field="AlwaysShowName">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-alwaysshowname" ${mob.alwaysShowName ? 'checked' : ''}>
                                Always Show Name
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="VisibleByDefault">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-visiblebydefault" ${mob.visibleByDefault !== false ? 'checked' : ''}>
                                Visible By Default
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="Invisible">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-invisible" ${mob.invisible ? 'checked' : ''}>
                                Invisible
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="Glowing">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-glowing" ${mob.glowing ? 'checked' : ''}>
                                Glowing
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="Silent">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-silent" ${mob.silent ? 'checked' : ''}>
                                Silent
                            </label>
                        </div>
                    </div>
                    
                    <h4 class="subsection-title">Physics & Behavior</h4>
                    <div class="grid-5">
                        <div class="form-group" data-mob-field="NoGravity">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-nogravity" ${mob.noGravity ? 'checked' : ''}>
                                No Gravity
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="Collidable">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-collidable" ${mob.collidable !== false ? 'checked' : ''}>
                                Collidable
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="Interactable">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-interactable" ${mob.interactable ? 'checked' : ''}>
                                Interactable
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="LockPitch">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-lockpitch" ${mob.lockPitch ? 'checked' : ''}>
                                Lock Pitch
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="NoAI">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-noai" ${mob.noAI ? 'checked' : ''}>
                                No AI
                            </label>
                        </div>
                    </div>
                    
                    <h4 class="subsection-title">Combat & Damage</h4>
                    <div class="grid-5">
                        <div class="form-group" data-mob-field="Invincible">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-invincible" ${mob.invincible ? 'checked' : ''}>
                                Invincible
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PreventVanillaDamage">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventvanilladamage" ${mob.preventVanillaDamage ? 'checked' : ''}>
                                Prevent Vanilla Damage
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PassthroughDamage">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-passthroughdamage" ${mob.passthroughDamage ? 'checked' : ''}>
                                Passthrough Damage
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PreventMobKillDrops">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventmobkilldrops" ${mob.preventMobKillDrops ? 'checked' : ''}>
                                Prevent Mob Kill Drops
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="ShowHealth">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-showhealth" ${mob.showHealth ? 'checked' : ''}>
                                Show Health
                            </label>
                        </div>
                    </div>
                    
                    <h4 class="subsection-title">Drops & Equipment</h4>
                    <div class="grid-5">
                        <div class="form-group" data-mob-field="PreventOtherDrops">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventotherdrops" ${mob.preventOtherDrops ? 'checked' : ''}>
                                Prevent Other Drops
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PreventRandomEquipment">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventrandomequipment" ${mob.preventRandomEquipment ? 'checked' : ''}>
                                Prevent Random Equipment
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PreventItemPickup">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventitempickup" ${mob.preventItemPickup !== false ? 'checked' : ''}>
                                Prevent Item Pickup
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PreventLeashing">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventleashing" ${mob.preventLeashing !== false ? 'checked' : ''}>
                                Prevent Leashing
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PreventRenaming">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventrenaming" ${mob.preventRenaming !== false ? 'checked' : ''}>
                                Prevent Renaming
                            </label>
                        </div>
                    </div>
                    
                    <h4 class="subsection-title">Special Behaviors</h4>
                    <div class="grid-5">
                        <div class="form-group" data-mob-field="PreventSunburn">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventsunburn" ${mob.preventSunburn ? 'checked' : ''}>
                                Prevent Sunburn
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="PreventTransformation">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-preventtransformation" ${mob.preventTransformation !== false ? 'checked' : ''}>
                                Prevent Transformation
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="DigOutOfGround">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-digoutofground" ${mob.digOutOfGround ? 'checked' : ''}>
                                Dig Out Of Ground
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="HealOnReload">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-healonreload" ${mob.healOnReload ? 'checked' : ''}>
                                Heal On Reload
                            </label>
                        </div>
                        <div class="form-group" data-mob-field="RepeatAllSkills">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-repeatallskills" ${mob.repeatAllSkills ? 'checked' : ''}>
                                Repeat All Skills
                            </label>
                        </div>
                    </div>
                    
                    <div class="grid-3">
                        <div class="form-group" data-mob-field="Despawn">
                            <label class="form-label">Despawn Mode</label>
                            <select class="form-select" id="mob-despawn">
                                <option value="true" ${mob.despawn === true || mob.despawn === 'NORMAL' ? 'selected' : ''}>NORMAL</option>
                                <option value="CHUNK" ${mob.despawn === 'CHUNK' ? 'selected' : ''}>CHUNK</option>
                                <option value="false" ${mob.despawn === false || mob.despawn === 'NEVER' ? 'selected' : ''}>NEVER</option>
                                <option value="PERSISTENT" ${mob.despawn === 'PERSISTENT' ? 'selected' : ''}>PERSISTENT</option>
                                <option value="NPC" ${mob.despawn === 'NPC' ? 'selected' : ''}>NPC</option>
                            </select>
                        </div>
                        <div class="form-group" data-mob-field="MaxCombatDistance">
                            <label class="form-label">Max Combat Distance</label>
                            <input type="number" class="form-input" id="mob-maxcombatdistance" value="${mob.maxCombatDistance || 256}" min="0">
                        </div>
                        <div class="form-group" data-mob-field="NoDamageTicks">
                            <label class="form-label">No Damage Ticks</label>
                            <input type="number" class="form-input" id="mob-nodamageticks" value="${mob.noDamageTicks || 10}" min="0">
                        </div>
                    </div>
                    
                    <div class="grid-3">
                        <div class="form-group" data-mob-field="Scale">
                            <label class="form-label">Scale</label>
                            <input type="number" class="form-input" id="mob-scale" value="${mob.scale || -1}" step="0.1">
                            <small class="form-hint">-1 to ignore, 1 = normal</small>
                        </div>
                        <div class="form-group" data-mob-field="ReviveHealth">
                            <label class="form-label">Revive Health</label>
                            <input type="number" class="form-input" id="mob-revivehealth" value="${mob.reviveHealth || -1}">
                            <small class="form-hint">-1 = full health</small>
                        </div>
                        <div class="form-group" data-mob-field="UseThreatTable">
                            <label class="checkbox-label" style="margin-top: 20px;">
                                <input type="checkbox" id="mob-usethreattable" ${mob.useThreatTable !== false ? 'checked' : ''}>
                                Use Threat Table
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group" data-mob-field="RandomizeProperties">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-randomizeproperties" ${mob.randomizeProperties !== false ? 'checked' : ''}>
                            Randomize Properties (vanilla variations)
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderEntitySpecificSections(mob, isAdvanced) {
        const entityType = mob.type || 'ZOMBIE';
        let html = '';
        
        // Zombie-specific options
        html += this.renderConditionalSection(entityType, 'PreventJockeyMounts', 'Zombie Options', 'fa-virus', `
            <div class="grid-3">
                <div class="form-group" data-mob-field="PreventJockeyMounts">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-preventjockeymounts" ${mob.preventJockeyMounts ? 'checked' : ''}>
                        Prevent Jockey Mounts
                    </label>
                </div>
                <div class="form-group" data-mob-field="PreventConversion">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-preventconversion" ${mob.preventConversion ? 'checked' : ''}>
                        Prevent Conversion
                    </label>
                </div>
                <div class="form-group" data-mob-field="ReinforcementsChance">
                    <label class="form-label">Reinforcements Chance</label>
                    <input type="number" class="form-input" id="mob-reinforcementschance" value="${mob.reinforcementsChance || 0}" min="0" max="1" step="0.01">
                    <small class="form-hint">0 = never, 1 = always</small>
                </div>
            </div>
        `);
        
        // Breedable options
        html += this.renderConditionalSection(entityType, 'Age', 'Age Options', 'fa-baby', `
            <div class="grid-4">
                <div class="form-group" data-mob-field="Baby">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-baby" ${mob.baby ? 'checked' : ''}>
                        Baby
                    </label>
                </div>
                <div class="form-group" data-mob-field="Adult">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-adult" ${mob.adult ? 'checked' : ''}>
                        Adult
                    </label>
                </div>
                <div class="form-group" data-mob-field="Age">
                    <label class="form-label">Age</label>
                    <input type="number" class="form-input" id="mob-age" value="${mob.age || 0}">
                    <small class="form-hint">-1 = baby, 1 = adult</small>
                </div>
                <div class="form-group" data-mob-field="AgeLock">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-agelock" ${mob.ageLock ? 'checked' : ''}>
                        Age Lock
                    </label>
                </div>
            </div>
        `);
        
        // Creeper options
        html += this.renderConditionalSection(entityType, 'ExplosionRadius', 'Creeper Options', 'fa-bomb', `
            <div class="grid-4">
                <div class="form-group" data-mob-field="ExplosionRadius">
                    <label class="form-label">Explosion Radius</label>
                    <input type="number" class="form-input" id="mob-explosionradius" value="${mob.explosionRadius || 3}" min="0">
                </div>
                <div class="form-group" data-mob-field="FuseTicks">
                    <label class="form-label">Fuse Ticks</label>
                    <input type="number" class="form-input" id="mob-fuseticks" value="${mob.fuseTicks || 30}" min="1">
                    <small class="form-hint">20 ticks = 1 second</small>
                </div>
                <div class="form-group" data-mob-field="SuperCharged">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-supercharged" ${mob.superCharged ? 'checked' : ''}>
                        Super Charged
                    </label>
                </div>
                <div class="form-group" data-mob-field="PreventSuicide">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-preventsuicide" ${mob.preventSuicide ? 'checked' : ''}>
                        Prevent Suicide
                    </label>
                </div>
            </div>
        `);
        
        // Armor Stand options
        html += this.renderConditionalSection(entityType, 'HasArms', 'Armor Stand Options', 'fa-male', `
            <div class="grid-5">
                <div class="form-group" data-mob-field="Small">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-small" ${mob.small ? 'checked' : ''}>
                        Small
                    </label>
                </div>
                <div class="form-group" data-mob-field="HasArms">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-hasarms" ${mob.hasArms ? 'checked' : ''}>
                        Has Arms
                    </label>
                </div>
                <div class="form-group" data-mob-field="HasBasePlate">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-hasbaseplate" ${mob.hasBasePlate !== false ? 'checked' : ''}>
                        Has Base Plate
                    </label>
                </div>
                <div class="form-group" data-mob-field="Marker">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-marker" ${mob.marker ? 'checked' : ''}>
                        Marker
                    </label>
                </div>
                <div class="form-group" data-mob-field="HasGravity">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-hasgravity" ${mob.hasGravity !== false ? 'checked' : ''}>
                        Has Gravity
                    </label>
                </div>
            </div>
            ${isAdvanced ? `
            <div class="grid-3">
                <div class="form-group" data-mob-field="CanMove">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-canmove" ${mob.canMove !== false ? 'checked' : ''}>
                        Can Move (Paper)
                    </label>
                </div>
                <div class="form-group" data-mob-field="CanTick">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-cantick" ${mob.canTick !== false ? 'checked' : ''}>
                        Can Tick (Paper)
                    </label>
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group" data-mob-field="ItemHead">
                    <label class="form-label">Item Head</label>
                    <input type="text" class="form-input" id="mob-itemhead" value="${mob.itemHead || ''}">
                </div>
                <div class="form-group" data-mob-field="ItemBody">
                    <label class="form-label">Item Body</label>
                    <input type="text" class="form-input" id="mob-itembody" value="${mob.itemBody || ''}">
                </div>
                <div class="form-group" data-mob-field="ItemLegs">
                    <label class="form-label">Item Legs</label>
                    <input type="text" class="form-input" id="mob-itemlegs" value="${mob.itemLegs || ''}">
                </div>
                <div class="form-group" data-mob-field="ItemFeet">
                    <label class="form-label">Item Feet</label>
                    <input type="text" class="form-input" id="mob-itemfeet" value="${mob.itemFeet || ''}">
                </div>
                <div class="form-group" data-mob-field="ItemHand">
                    <label class="form-label">Item Hand</label>
                    <input type="text" class="form-input" id="mob-itemhand" value="${mob.itemHand || ''}">
                </div>
                <div class="form-group" data-mob-field="ItemOffhand">
                    <label class="form-label">Item Offhand</label>
                    <input type="text" class="form-input" id="mob-itemoffhand" value="${mob.itemOffhand || ''}">
                </div>
            </div>
            ` : ''}
        `);
        
        // Armadillo options (1.21+)
        html += this.renderConditionalSection(entityType, 'ScaredState', 'Armadillo Options', 'fa-shield-alt', `
            <div class="grid-2">
                <div class="form-group" data-mob-field="ScaredState">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-scaredstate" ${mob.scaredState ? 'checked' : ''}>
                        Scared State
                    </label>
                    <small class="form-hint">Whether the armadillo is rolled up/scared</small>
                </div>
            </div>
        `);
        
        // Mannequin options (1.21.11+)
        html += this.renderConditionalSection(entityType, 'Immovable', 'Mannequin Options', 'fa-user', `
            <div class="grid-3">
                <div class="form-group" data-mob-field="Immovable">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-immovable" ${mob.immovable ? 'checked' : ''}>
                        Immovable
                    </label>
                    <small class="form-hint">Whether the mannequin should be immovable</small>
                </div>
                <div class="form-group" data-mob-field="HideDescription">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-hidedescription" ${mob.hideDescription ? 'checked' : ''}>
                        Hide Description
                    </label>
                    <small class="form-hint">Hide the description below the name</small>
                </div>
                <div class="form-group" data-mob-field="MainHand">
                    <label class="form-label">Main Hand</label>
                    <select class="form-select" id="mob-mainhand">
                        <option value="RIGHT" ${!mob.mainHand || mob.mainHand === 'RIGHT' ? 'selected' : ''}>RIGHT</option>
                        <option value="LEFT" ${mob.mainHand === 'LEFT' ? 'selected' : ''}>LEFT</option>
                    </select>
                    <small class="form-hint">Which hand should be the main one</small>
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group" data-mob-field="Description">
                    <label class="form-label">Description</label>
                    <input type="text" class="form-input" id="mob-description" value="${mob.description || ''}" placeholder="Hello World!">
                    <small class="form-hint">Appears below the mannequin's name</small>
                </div>
                <div class="form-group" data-mob-field="Player">
                    <label class="form-label">Player</label>
                    <input type="text" class="form-input" id="mob-player" value="${mob.player || 'Ashijin'}" placeholder="Ashijin">
                    <small class="form-hint">Player whose skin to use for the mannequin</small>
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group" data-mob-field="Pose">
                    <label class="form-label">Pose</label>
                    <select class="form-select" id="mob-pose">
                        <option value="" ${!mob.pose ? 'selected' : ''}>Default</option>
                        <option value="STANDING" ${mob.pose === 'STANDING' ? 'selected' : ''}>STANDING</option>
                        <option value="FALL_FLYING" ${mob.pose === 'FALL_FLYING' ? 'selected' : ''}>FALL_FLYING</option>
                        <option value="SLEEPING" ${mob.pose === 'SLEEPING' ? 'selected' : ''}>SLEEPING</option>
                        <option value="SWIMMING" ${mob.pose === 'SWIMMING' ? 'selected' : ''}>SWIMMING</option>
                        <option value="SPIN_ATTACK" ${mob.pose === 'SPIN_ATTACK' ? 'selected' : ''}>SPIN_ATTACK</option>
                        <option value="SNEAKING" ${mob.pose === 'SNEAKING' ? 'selected' : ''}>SNEAKING</option>
                        <option value="LONG_JUMPING" ${mob.pose === 'LONG_JUMPING' ? 'selected' : ''}>LONG_JUMPING</option>
                        <option value="DYING" ${mob.pose === 'DYING' ? 'selected' : ''}>DYING</option>
                        <option value="CROAKING" ${mob.pose === 'CROAKING' ? 'selected' : ''}>CROAKING</option>
                        <option value="USING_TONGUE" ${mob.pose === 'USING_TONGUE' ? 'selected' : ''}>USING_TONGUE</option>
                        <option value="SITTING" ${mob.pose === 'SITTING' ? 'selected' : ''}>SITTING</option>
                        <option value="ROARING" ${mob.pose === 'ROARING' ? 'selected' : ''}>ROARING</option>
                        <option value="SNIFFING" ${mob.pose === 'SNIFFING' ? 'selected' : ''}>SNIFFING</option>
                        <option value="EMERGING" ${mob.pose === 'EMERGING' ? 'selected' : ''}>EMERGING</option>
                        <option value="DIGGING" ${mob.pose === 'DIGGING' ? 'selected' : ''}>DIGGING</option>
                    </select>
                    <small class="form-hint">The pose of the mannequin</small>
                </div>
                <div class="form-group" data-mob-field="Model">
                    <label class="form-label">Model</label>
                    <select class="form-select" id="mob-model">
                        <option value="CLASSIC" ${!mob.model || mob.model === 'CLASSIC' ? 'selected' : ''}>CLASSIC</option>
                        <option value="SLIM" ${mob.model === 'SLIM' ? 'selected' : ''}>SLIM</option>
                    </select>
                    <small class="form-hint">The model type of the mannequin</small>
                </div>
            </div>
            <div class="grid-3">
                <div class="form-group" data-mob-field="Skin">
                    <label class="form-label">Skin</label>
                    <input type="text" class="form-input" id="mob-skin" value="${mob.skin || ''}" placeholder="namespace:directory/texturename">
                    <small class="form-hint">Custom texture for mannequin's skin</small>
                </div>
                <div class="form-group" data-mob-field="Cape">
                    <label class="form-label">Cape</label>
                    <input type="text" class="form-input" id="mob-cape" value="${mob.cape || ''}" placeholder="namespace:directory/texturename">
                    <small class="form-hint">Custom texture for mannequin's cape</small>
                </div>
                <div class="form-group" data-mob-field="Elytra">
                    <label class="form-label">Elytra</label>
                    <input type="text" class="form-input" id="mob-elytra" value="${mob.elytra || ''}" placeholder="namespace:directory/texturename">
                    <small class="form-hint">Custom texture for mannequin's elytra</small>
                </div>
            </div>
        `);
        
        // Villager options
        html += this.renderConditionalSection(entityType, 'Profession', 'Villager Options', 'fa-briefcase', `
            <div class="grid-3">
                <div class="form-group" data-mob-field="Profession">
                    <label class="form-label">Profession</label>
                    <select class="form-select" id="mob-profession">
                        <option value="">None</option>
                        <option value="ARMORER" ${mob.profession === 'ARMORER' ? 'selected' : ''}>Armorer</option>
                        <option value="BUTCHER" ${mob.profession === 'BUTCHER' ? 'selected' : ''}>Butcher</option>
                        <option value="CARTOGRAPHER" ${mob.profession === 'CARTOGRAPHER' ? 'selected' : ''}>Cartographer</option>
                        <option value="CLERIC" ${mob.profession === 'CLERIC' ? 'selected' : ''}>Cleric</option>
                        <option value="FARMER" ${mob.profession === 'FARMER' ? 'selected' : ''}>Farmer</option>
                        <option value="FISHERMAN" ${mob.profession === 'FISHERMAN' ? 'selected' : ''}>Fisherman</option>
                        <option value="FLETCHER" ${mob.profession === 'FLETCHER' ? 'selected' : ''}>Fletcher</option>
                        <option value="LEATHERWORKER" ${mob.profession === 'LEATHERWORKER' ? 'selected' : ''}>Leatherworker</option>
                        <option value="LIBRARIAN" ${mob.profession === 'LIBRARIAN' ? 'selected' : ''}>Librarian</option>
                        <option value="MASON" ${mob.profession === 'MASON' ? 'selected' : ''}>Mason</option>
                        <option value="NITWIT" ${mob.profession === 'NITWIT' ? 'selected' : ''}>Nitwit</option>
                        <option value="SHEPHERD" ${mob.profession === 'SHEPHERD' ? 'selected' : ''}>Shepherd</option>
                        <option value="TOOLSMITH" ${mob.profession === 'TOOLSMITH' ? 'selected' : ''}>Toolsmith</option>
                        <option value="WEAPONSMITH" ${mob.profession === 'WEAPONSMITH' ? 'selected' : ''}>Weaponsmith</option>
                    </select>
                </div>
                <div class="form-group" data-mob-field="Level">
                    <label class="form-label">Level</label>
                    <input type="number" class="form-input" id="mob-level" value="${mob.level || 1}" min="1" max="5">
                </div>
                <div class="form-group" data-mob-field="VillagerType">
                    <label class="form-label">Villager Type</label>
                    <select class="form-select" id="mob-villagertype">
                        <option value="PLAINS" ${!mob.villagerType || mob.villagerType === 'PLAINS' ? 'selected' : ''}>Plains</option>
                        <option value="DESERT" ${mob.villagerType === 'DESERT' ? 'selected' : ''}>Desert</option>
                        <option value="JUNGLE" ${mob.villagerType === 'JUNGLE' ? 'selected' : ''}>Jungle</option>
                        <option value="SAVANNA" ${mob.villagerType === 'SAVANNA' ? 'selected' : ''}>Savanna</option>
                        <option value="SNOW" ${mob.villagerType === 'SNOW' ? 'selected' : ''}>Snow</option>
                        <option value="SWAMP" ${mob.villagerType === 'SWAMP' ? 'selected' : ''}>Swamp</option>
                        <option value="TAIGA" ${mob.villagerType === 'TAIGA' ? 'selected' : ''}>Taiga</option>
                    </select>
                </div>
            </div>
            ${isAdvanced ? `
            <div class="form-group" data-mob-field="HasTrades">
                <label class="checkbox-label">
                    <input type="checkbox" id="mob-hastrades" ${mob.hasTrades ? 'checked' : ''}>
                    Has Trades
                </label>
            </div>
            ` : ''}
        `);
        
        // Size options (Slime, Phantom, etc.)
        html += this.renderConditionalSection(entityType, 'Size', 'Size Options', 'fa-expand', `
            <div class="grid-2">
                <div class="form-group" data-mob-field="Size">
                    <label class="form-label">Size</label>
                    <input type="number" class="form-input" id="mob-size" value="${mob.size || 1}" min="1" max="127">
                    <small class="form-hint">1-127 (larger = exponentially bigger)</small>
                </div>
                <div class="form-group" data-mob-field="PreventSlimeSplit">
                    <label class="checkbox-label" style="margin-top: 20px;">
                        <input type="checkbox" id="mob-preventslimesplit" ${mob.preventSlimeSplit ? 'checked' : ''}>
                        Prevent Slime Split
                    </label>
                </div>
            </div>
        `);
        
        // Additional entity-specific sections (only in advanced mode)
        if (isAdvanced) {
            // Horse options
            html += this.renderConditionalSection(entityType, 'HorseArmor', 'Horse Options', 'fa-horse', `
                <div class="grid-3">
                    <div class="form-group" data-mob-field="HorseArmor">
                        <label class="form-label">Horse Armor</label>
                        <select class="form-select" id="mob-horsearmor">
                            <option value="">None</option>
                            <option value="iron" ${mob.horseArmor === 'iron' ? 'selected' : ''}>Iron</option>
                            <option value="gold" ${mob.horseArmor === 'gold' ? 'selected' : ''}>Gold</option>
                            <option value="diamond" ${mob.horseArmor === 'diamond' ? 'selected' : ''}>Diamond</option>
                        </select>
                    </div>
                    <div class="form-group" data-mob-field="HorseColor">
                        <label class="form-label">Horse Color</label>
                        <select class="form-select" id="mob-horsecolor">
                            <option value="">Default</option>
                            <option value="WHITE" ${mob.horseColor === 'WHITE' ? 'selected' : ''}>White</option>
                            <option value="CREAMY" ${mob.horseColor === 'CREAMY' ? 'selected' : ''}>Creamy</option>
                            <option value="CHESTNUT" ${mob.horseColor === 'CHESTNUT' ? 'selected' : ''}>Chestnut</option>
                            <option value="BROWN" ${mob.horseColor === 'BROWN' ? 'selected' : ''}>Brown</option>
                            <option value="BLACK" ${mob.horseColor === 'BLACK' ? 'selected' : ''}>Black</option>
                            <option value="GRAY" ${mob.horseColor === 'GRAY' ? 'selected' : ''}>Gray</option>
                            <option value="DARK_BROWN" ${mob.horseColor === 'DARK_BROWN' ? 'selected' : ''}>Dark Brown</option>
                        </select>
                    </div>
                    <div class="form-group" data-mob-field="HorseStyle">
                        <label class="form-label">Horse Style</label>
                        <select class="form-select" id="mob-horsestyle">
                            <option value="">Default</option>
                            <option value="NONE" ${mob.horseStyle === 'NONE' ? 'selected' : ''}>None</option>
                            <option value="WHITE" ${mob.horseStyle === 'WHITE' ? 'selected' : ''}>White</option>
                            <option value="WHITEFIELD" ${mob.horseStyle === 'WHITEFIELD' ? 'selected' : ''}>Whitefield</option>
                            <option value="WHITE_DOTS" ${mob.horseStyle === 'WHITE_DOTS' ? 'selected' : ''}>White Dots</option>
                            <option value="BLACK_DOTS" ${mob.horseStyle === 'BLACK_DOTS' ? 'selected' : ''}>Black Dots</option>
                        </select>
                    </div>
                </div>
                <div class="grid-2">
                    <div class="form-group" data-mob-field="Saddled">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-saddled" ${mob.saddled ? 'checked' : ''}>
                            Saddled
                        </label>
                    </div>
                    <div class="form-group" data-mob-field="Tamed">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-tamed" ${mob.tamed ? 'checked' : ''}>
                            Tamed
                        </label>
                    </div>
                </div>
            `);
            
            // More entity-specific options can be added here following the same pattern
        }
        
        return html;
    }
    
    renderConditionalSection(entityType, fieldName, title, icon, content) {
        if (!this.fieldManager.shouldShowField(entityType, fieldName)) {
            return '';
        }
        
        return `
            <div class="card collapsible-card collapsed" data-mob-field="${fieldName}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas ${icon}"></i> ${title}
                        <span class="entity-badge">Entity-Specific</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    ${content}
                </div>
            </div>
        `;
    }
    
    renderDisplayOptionsSection(mob, isAdvanced) {
        const entityType = mob.type || 'ZOMBIE';
        const isDisplayEntity = ['BLOCK_DISPLAY', 'ITEM_DISPLAY', 'TEXT_DISPLAY'].includes(entityType);
        
        if (!isDisplayEntity || !isAdvanced) {
            return '';
        }
        
        return `
            <div class="card collapsible-card" data-mob-field="ViewRange">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-eye"></i> Display Options
                        <span class="entity-badge">Display Entity</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <h4 class="subsection-title">Base Options</h4>
                    <div class="grid-3">
                        <div class="form-group" data-mob-field="ViewRange">
                            <label class="form-label">View Range</label>
                            <input type="number" class="form-input" id="mob-viewrange" value="${mob.viewRange || 1}" min="0" step="0.1">
                            <small class="form-hint">Distance multiplier for rendering</small>
                        </div>
                        <div class="form-group" data-mob-field="Width">
                            <label class="form-label">Width</label>
                            <input type="number" class="form-input" id="mob-width" value="${mob.width || 0}" min="0" step="0.1">
                        </div>
                        <div class="form-group" data-mob-field="Height">
                            <label class="form-label">Height</label>
                            <input type="number" class="form-input" id="mob-height" value="${mob.height || 0}" min="0" step="0.1">
                        </div>
                    </div>
                    
                    <div class="grid-3">
                        <div class="form-group" data-mob-field="ShadowRadius">
                            <label class="form-label">Shadow Radius</label>
                            <input type="number" class="form-input" id="mob-shadowradius" value="${mob.shadowRadius || 0}" min="0" step="0.1">
                        </div>
                        <div class="form-group" data-mob-field="ShadowStrength">
                            <label class="form-label">Shadow Strength</label>
                            <input type="number" class="form-input" id="mob-shadowstrength" value="${mob.shadowStrength || 1}" min="0" max="1" step="0.1">
                            <small class="form-hint">0 = transparent, 1 = opaque</small>
                        </div>
                        <div class="form-group" data-mob-field="Billboard">
                            <label class="form-label">Billboard</label>
                            <select class="form-select" id="mob-billboard">
                                <option value="FIXED" ${!mob.billboard || mob.billboard === 'FIXED' ? 'selected' : ''}>FIXED (No rotation)</option>
                                <option value="CENTER" ${mob.billboard === 'CENTER' ? 'selected' : ''}>CENTER (Pivot center)</option>
                                <option value="HORIZONTAL" ${mob.billboard === 'HORIZONTAL' ? 'selected' : ''}>HORIZONTAL</option>
                                <option value="VERTICAL" ${mob.billboard === 'VERTICAL' ? 'selected' : ''}>VERTICAL</option>
                            </select>
                        </div>
                    </div>
                    
                    <h4 class="subsection-title">Timing & Interpolation</h4>
                    <div class="grid-3">
                        <div class="form-group" data-mob-field="TeleportDuration">
                            <label class="form-label">Teleport Duration (ticks)</label>
                            <input type="number" class="form-input" id="mob-teleportduration" value="${mob.teleportDuration || 0}" min="0">
                        </div>
                        <div class="form-group" data-mob-field="InterpolationDelay">
                            <label class="form-label">Interpolation Delay (ticks)</label>
                            <input type="number" class="form-input" id="mob-interpolationdelay" value="${mob.interpolationDelay || 0}" min="0">
                        </div>
                        <div class="form-group" data-mob-field="InterpolationDuration">
                            <label class="form-label">Interpolation Duration (ticks)</label>
                            <input type="number" class="form-input" id="mob-interpolationduration" value="${mob.interpolationDuration || 0}" min="0">
                        </div>
                    </div>
                    
                    <h4 class="subsection-title">Brightness & Color</h4>
                    <div class="grid-3">
                        <div class="form-group" data-mob-field="BlockLight">
                            <label class="form-label">Block Light</label>
                            <input type="number" class="form-input" id="mob-blocklight" value="${mob.blockLight !== undefined ? mob.blockLight : -1}" min="-1" max="15">
                            <small class="form-hint">-1 = use ambient, 0-15 = override</small>
                        </div>
                        <div class="form-group" data-mob-field="SkyLight">
                            <label class="form-label">Sky Light</label>
                            <input type="number" class="form-input" id="mob-skylight" value="${mob.skyLight !== undefined ? mob.skyLight : -1}" min="-1" max="15">
                            <small class="form-hint">-1 = use ambient, 0-15 = override</small>
                        </div>
                        <div class="form-group" data-mob-field="ColorOverride">
                            <label class="form-label">Color Override</label>
                            <input type="number" class="form-input" id="mob-coloroverride" value="${mob.colorOverride || 0}">
                            <small class="form-hint">0 = team color, or ARGB int</small>
                        </div>
                    </div>
                    
                    <h4 class="subsection-title">Transformations</h4>
                    <div class="grid-2">
                        <div class="form-group" data-mob-field="Translation">
                            <label class="form-label">Translation</label>
                            <input type="text" class="form-input" id="mob-translation" value="${mob.translation || '0,0,0'}">
                            <small class="form-hint">Format: x,y,z</small>
                        </div>
                        <div class="form-group" data-mob-field="Scale">
                            <label class="form-label">Scale</label>
                            <input type="text" class="form-input" id="mob-displayscale" value="${mob.displayScale || '1,1,1'}">
                            <small class="form-hint">Format: x,y,z</small>
                        </div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group" data-mob-field="LeftRotation">
                            <label class="form-label">Left Rotation</label>
                            <input type="text" class="form-input" id="mob-leftrotation" value="${mob.leftRotation || '0,0,0,1'}">
                            <small class="form-hint">Quaternion: x,y,z,w or Euler: x,y,z</small>
                        </div>
                        <div class="form-group" data-mob-field="RightRotation">
                            <label class="form-label">Right Rotation</label>
                            <input type="text" class="form-input" id="mob-rightrotation" value="${mob.rightRotation || '0,0,0,1'}">
                            <small class="form-hint">Quaternion: x,y,z,w or Euler: x,y,z</small>
                        </div>
                    </div>
                    
                    ${this.renderTypeSpecificDisplayOptions(mob, entityType)}
                </div>
            </div>
        `;
    }
    
    renderTypeSpecificDisplayOptions(mob, entityType) {
        let html = '';
        
        if (entityType === 'BLOCK_DISPLAY') {
            html = `
                <h4 class="subsection-title">Block Display</h4>
                <div class="form-group" data-mob-field="Block">
                    <label class="form-label">Block State</label>
                    <div id="mob-block-dropdown"></div>
                    <small class="form-hint">Search for blocks or type custom state (e.g., bell[facing=north])</small>
                </div>
            `;
            
            // Initialize dropdown after render
            setTimeout(() => {
                if (!window.blockDropdown) {
                    window.blockDropdown = new SearchableDropdown('mob-block-dropdown', {
                        categories: window.MINECRAFT_ITEM_CATEGORIES || null,
                        items: window.MINECRAFT_ITEM_CATEGORIES ? null : MINECRAFT_BLOCKS,
                        useIcons: true,
                        storageKey: 'mob-block',
                        placeholder: 'Search blocks...',
                        value: mob.block || '',
                        onSelect: (value) => this.updateMob('block', value)
                    });
                } else {
                    window.blockDropdown.setValue(mob.block || '');
                }
            }, 0);
        } else if (entityType === 'ITEM_DISPLAY') {
            html = `
                <h4 class="subsection-title">Item Display</h4>
                <div class="grid-2">
                    <div class="form-group" data-mob-field="Item">
                        <label class="form-label">Item</label>
                        <div id="mob-item-dropdown"></div>
                        <small class="form-hint">Search for items (e.g., diamond_sword, stick)</small>
                    </div>
                    <div class="form-group" data-mob-field="Transform">
                        <label class="form-label">Transform</label>
                        <select class="form-select" id="mob-transform">
                            <option value="NONE" ${!mob.transform || mob.transform === 'NONE' ? 'selected' : ''}>NONE</option>
                            <option value="FIRSTPERSON_LEFTHAND" ${mob.transform === 'FIRSTPERSON_LEFTHAND' ? 'selected' : ''}>First Person Left Hand</option>
                            <option value="FIRSTPERSON_RIGHTHAND" ${mob.transform === 'FIRSTPERSON_RIGHTHAND' ? 'selected' : ''}>First Person Right Hand</option>
                            <option value="THIRDPERSON_LEFTHAND" ${mob.transform === 'THIRDPERSON_LEFTHAND' ? 'selected' : ''}>Third Person Left Hand</option>
                            <option value="THIRDPERSON_RIGHTHAND" ${mob.transform === 'THIRDPERSON_RIGHTHAND' ? 'selected' : ''}>Third Person Right Hand</option>
                            <option value="GROUND" ${mob.transform === 'GROUND' ? 'selected' : ''}>Ground</option>
                            <option value="GUI" ${mob.transform === 'GUI' ? 'selected' : ''}>GUI</option>
                            <option value="HEAD" ${mob.transform === 'HEAD' ? 'selected' : ''}>Head</option>
                            <option value="FIXED" ${mob.transform === 'FIXED' ? 'selected' : ''}>Fixed</option>
                        </select>
                    </div>
                </div>
            `;
            
            // Initialize dropdown after render
            setTimeout(() => {
                if (!window.itemDropdown) {
                    window.itemDropdown = new SearchableDropdown('mob-item-dropdown', {
                        categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : (window.MINECRAFT_ITEM_CATEGORIES || null),
                        items: !window.getCombinedItemCategories && !window.MINECRAFT_ITEM_CATEGORIES ? MINECRAFT_ITEMS : null,
                        useIcons: true,
                        storageKey: 'mob-item',
                        placeholder: 'Search items...',
                        value: mob.item || '',
                        onSelect: (value) => this.updateMob('item', value)
                    });
                } else {
                    window.itemDropdown.setValue(mob.item || '');
                }
            }, 0);
        } else if (entityType === 'TEXT_DISPLAY') {
            html = `
                <h4 class="subsection-title">Text Display</h4>
                <div class="form-group" data-mob-field="Text">
                    <label class="form-label">Text</label>
                    <textarea class="form-textarea" id="mob-text" rows="3">${mob.text || 'Give This Poor Dude A Text To Display'}</textarea>
                    <small class="form-hint">Use \\n for new lines, & for color codes</small>
                </div>
                <div class="grid-3">
                    <div class="form-group" data-mob-field="Opacity">
                        <label class="form-label">Opacity</label>
                        <input type="number" class="form-input" id="mob-opacity" value="${mob.opacity || 255}" min="0" max="255">
                        <small class="form-hint">0 = transparent, 255 = opaque</small>
                    </div>
                    <div class="form-group" data-mob-field="LineWidth">
                        <label class="form-label">Line Width</label>
                        <input type="number" class="form-input" id="mob-linewidth" value="${mob.lineWidth || 200}" min="1">
                    </div>
                    <div class="form-group" data-mob-field="Alignment">
                        <label class="form-label">Alignment</label>
                        <select class="form-select" id="mob-alignment">
                            <option value="CENTER" ${!mob.alignment || mob.alignment === 'CENTER' ? 'selected' : ''}>CENTER</option>
                            <option value="LEFT" ${mob.alignment === 'LEFT' ? 'selected' : ''}>LEFT</option>
                            <option value="RIGHT" ${mob.alignment === 'RIGHT' ? 'selected' : ''}>RIGHT</option>
                        </select>
                    </div>
                </div>
                <div class="grid-3">
                    <div class="form-group" data-mob-field="BackgroundColor">
                        <label class="form-label">Background Color</label>
                        <input type="number" class="form-input" id="mob-backgroundcolor" value="${mob.backgroundColor || 1073741824}">
                        <small class="form-hint">ARGB integer value</small>
                    </div>
                    <div class="form-group" data-mob-field="DefaultBackground">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-defaultbackground" ${mob.defaultBackground ? 'checked' : ''}>
                            Default Background
                        </label>
                    </div>
                    <div class="form-group" data-mob-field="Shadowed">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-shadowed" ${mob.shadowed ? 'checked' : ''}>
                            Shadowed
                        </label>
                    </div>
                </div>
                <div class="form-group" data-mob-field="SeeThrough">
                    <label class="checkbox-label">
                        <input type="checkbox" id="mob-seethrough" ${mob.seeThrough ? 'checked' : ''}>
                        See Through (visible through blocks)
                    </label>
                </div>
            `;
        }
        
        return html;
    }
    
    // === PHASE 1: ADVANCED MOB FEATURES ===
    
    renderFactionSection(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-users"></i> Faction
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="form-group">
                        <label class="form-label">Faction</label>
                        <input type="text" class="form-input" id="mob-faction" value="${mob.faction || ''}">
                        <small class="form-hint">AI grouping for targeting. Players with faction.(name) permission are in faction.</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderBossBarSection(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-dragon"></i> Boss Bar
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div id="mob-bossbar-editor"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render HealthBar Section - Simple hologram health bar above mob
     */
    renderHealthBarSection(mob) {
        const healthBar = mob.healthBar || {};
        const isEnabled = healthBar.enabled || false;
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-heart-pulse"></i> Health Bar (Hologram)
                        ${isEnabled ? '<span class="badge badge-success">Enabled</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text" style="margin-bottom: 1rem;">
                        Creates a simple health bar hologram above the mob when damaged (different from Boss Bar).
                    </p>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-healthbar-enabled" ${isEnabled ? 'checked' : ''}>
                            Enable Health Bar
                        </label>
                    </div>
                    
                    <div id="healthbar-options" style="display: ${isEnabled ? 'block' : 'none'};">
                        <div class="form-group">
                            <label class="form-label">Vertical Offset</label>
                            <input type="number" class="form-input" id="mob-healthbar-offset" 
                                   value="${healthBar.offset || 1.45}" step="0.05" min="0" max="5">
                            <small class="form-hint">Height above the mob (default: 1.45)</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Mount Section - Set another MythicMob as mount
     */
    renderMountSection(mob, isAdvanced) {
        const hasMount = mob.mount && mob.mount.trim();
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}" data-mob-field="Mount">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-horse"></i> Mount
                        ${hasMount ? '<span class="badge badge-primary">' + this.escapeHtml(mob.mount) + '</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text" style="margin-bottom: 1rem;">
                        The mob will automatically ride on the selected mount when it spawns.
                    </p>
                    
                    <div class="form-group">
                        <label class="form-label">Mount (MythicMob or Entity)</label>
                        <input type="hidden" id="mob-mount-value" value="${this.escapeHtml(mob.mount || '')}">
                        ${this.createMountEntityPickerHTML('mob-mount-value')}
                        <small class="form-hint">Select a MythicMob from your pack or a vanilla entity</small>
                    </div>
                    
                    ${hasMount ? `
                    <div class="mount-preview" style="margin-top: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3);">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-horse" style="color: var(--accent-primary); font-size: 1.5rem;"></i>
                            <div>
                                <strong style="color: var(--text-primary);">${this.escapeHtml(mob.mount)}</strong>
                                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">This mob will spawn riding on ${this.escapeHtml(mob.mount)}</p>
                            </div>
                            <button class="btn btn-outline btn-sm" id="clear-mount-btn" style="margin-left: auto;">
                                <i class="fas fa-times"></i> Clear
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render Hearing Section - Enable warden-like sound detection
     */
    renderHearingSection(mob) {
        const hearing = mob.hearing || {};
        const isEnabled = hearing.enabled || false;
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-ear-listen"></i> Hearing
                        ${isEnabled ? '<span class="badge badge-success">Enabled</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text" style="margin-bottom: 1rem;">
                        Allows the mob to "hear" sounds like a Warden. Enables the <code>~onHear</code> trigger for skills.
                    </p>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-hearing-enabled" ${isEnabled ? 'checked' : ''}>
                            Enable Hearing
                        </label>
                    </div>
                    
                    ${isEnabled ? `
                    <div class="alert alert-info" style="margin-top: 1rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 1rem; border-radius: 8px;">
                        <i class="fas fa-info-circle" style="color: #3b82f6;"></i>
                        <span style="margin-left: 0.5rem;">Use <code>~onHear</code> trigger in skills. Access volume with <code>&lt;skill.var.volume&gt;</code></span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render Nameplate Section - Advanced nameplate configuration
     */
    renderNameplateSection(mob) {
        const nameplate = mob.nameplate || {};
        const isEnabled = nameplate.enabled || false;
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-tag"></i> Nameplate (Advanced)
                        ${isEnabled ? '<span class="badge badge-success">Enabled</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text" style="margin-bottom: 1rem;">
                        Forces Mythic nameplates which support multi-line display names (e.g., "Hello\\nWorld!").
                    </p>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="mob-nameplate-enabled" ${isEnabled ? 'checked' : ''}>
                            Enable Mythic Nameplate
                        </label>
                    </div>
                    
                    <div id="nameplate-options" style="display: ${isEnabled ? 'block' : 'none'};">
                        <div class="grid-2" style="margin-top: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Offset</label>
                                <input type="number" class="form-input" id="mob-nameplate-offset" 
                                       value="${nameplate.offset || 1.8}" step="0.1" min="0" max="10">
                                <small class="form-hint">Height above the mob</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Scale</label>
                                <input type="text" class="form-input" id="mob-nameplate-scale" 
                                       value="${nameplate.scale || '1,1,1'}" placeholder="1,1,1">
                                <small class="form-hint">Scale (x,y,z)</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="mob-nameplate-mounted" ${nameplate.mounted ? 'checked' : ''}>
                                Mounted (ModelEngine)
                            </label>
                            <small class="form-hint">Forces nameplate to work with ModelEngine entities</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Disguise Section - Basic LibsDisguises configuration
     */
    renderDisguiseSection(mob) {
        const disguise = mob.disguiseConfig || {};
        const hasDisguise = disguise.type && disguise.type.trim();
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-mask"></i> Disguise
                        ${hasDisguise ? '<span class="badge badge-primary">' + this.escapeHtml(disguise.type) + '</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="alert alert-warning" style="margin-bottom: 1rem; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 1rem; border-radius: 8px;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="fas fa-plug" style="color: #f59e0b; font-size: 1.25rem;"></i>
                            <div>
                                <strong style="color: #fbbf24;">Requires LibsDisguises</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                                    This feature requires the LibsDisguises plugin to be installed on your server.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <p class="help-text" style="margin-bottom: 1rem;">
                        Changes the mob's appearance to look like another entity type.
                    </p>
                    
                    <div class="form-group">
                        <label class="form-label">Disguise Entity Type</label>
                        <select class="form-select" id="mob-disguise-select">
                            <option value="">-- None --</option>
                            ${this.renderEntityTypes(disguise.type)}
                        </select>
                        <small class="form-hint">The entity this mob will look like (e.g., CHICKEN, PLAYER)</small>
                    </div>
                    
                    ${hasDisguise ? `
                    <div class="disguise-preview" style="margin-top: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3);">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-mask" style="color: var(--accent-primary); font-size: 1.5rem;"></i>
                            <div>
                                <strong style="color: var(--text-primary);">Disguised as ${this.escapeHtml(disguise.type)}</strong>
                                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">The mob will appear as a ${this.escapeHtml(disguise.type)} but behave as ${mob.type || 'its original type'}</p>
                            </div>
                            <button class="btn btn-outline btn-sm" id="clear-disguise-btn" style="margin-left: auto;">
                                <i class="fas fa-times"></i> Clear
                            </button>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="coming-soon-notice" style="margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%); border: 1px dashed rgba(139, 92, 246, 0.5); border-radius: 8px; text-align: center;">
                        <i class="fas fa-rocket" style="color: var(--accent-primary); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                            <strong style="color: var(--accent-primary);">More features coming soon!</strong><br>
                            Player disguises, custom skins, and more options will be added.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Trades Section - Villager trade configuration
     * Only visible for VILLAGER and WANDERING_TRADER entity types
     */
    renderTradesSection(mob, isAdvanced) {
        const entityType = (mob.type || '').toUpperCase();
        const tradeableEntities = ['VILLAGER', 'WANDERING_TRADER'];
        
        // Only show for tradeable entities
        if (!tradeableEntities.includes(entityType)) {
            return '';
        }
        
        const trades = mob.trades || {};
        const tradeList = Object.entries(trades).map(([key, trade]) => ({ id: key, ...trade }));
        const hasTrades = tradeList.length > 0;
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        return `
            <div class="card collapsible-card ${isCollapsed && hasTrades ? 'collapsed' : ''}" id="trades-section">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-exchange-alt"></i> Trades
                        ${hasTrades ? '<span class="count-badge">' + tradeList.length + '</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="alert alert-info" style="margin-bottom: 1rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 1rem; border-radius: 8px;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="fas fa-info-circle" style="color: #3b82f6; font-size: 1.25rem;"></i>
                            <div>
                                <strong style="color: #60a5fa;">Important:</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                                    Villagers must have a profession and Level of 2 or higher to keep custom trades.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="trades-list" class="trades-list">
                        ${tradeList.length === 0 ? `
                            <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
                                <i class="fas fa-store-slash" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                                <p>No trades configured yet</p>
                                <small>Click "Add Trade" to create a trade</small>
                            </div>
                        ` : tradeList.map((trade, index) => this.renderTradeItem(trade, index)).join('')}
                    </div>
                    
                    <button class="btn btn-secondary" id="add-trade-btn" style="margin-top: 1rem; width: 100%;">
                        <i class="fas fa-plus"></i> Add Trade
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render a single trade item in the trades list
     */
    renderTradeItem(trade, index) {
        const item1 = trade.Item1 || trade.item1 || '';
        const item2 = trade.Item2 || trade.item2 || '';
        const result = trade.Result || trade.result || '';
        const maxUses = trade.MaxUses || trade.maxUses || 10000;
        
        // Parse item strings to get amount and name
        const parseItem = (itemStr) => {
            if (!itemStr) return { amount: '', name: '' };
            const parts = itemStr.trim().split(' ');
            if (parts.length >= 2 && !isNaN(parseInt(parts[0]))) {
                return { amount: parts[0], name: parts.slice(1).join(' ') };
            }
            return { amount: '1', name: itemStr };
        };
        
        const i1 = parseItem(item1);
        const i2 = parseItem(item2);
        const res = parseItem(result);
        
        return `
            <div class="trade-item" data-trade-index="${index}" style="
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 12px;
                padding: 1.25rem;
                margin-bottom: 1rem;
                position: relative;
            ">
                <div class="trade-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <span class="trade-number" style="
                        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-weight: 600;
                        font-size: 0.85rem;
                    ">Trade #${index + 1}</span>
                    <button class="btn btn-outline btn-sm btn-danger remove-trade-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="trade-layout" style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    <!-- Input Items -->
                    <div class="trade-inputs" style="flex: 1; min-width: 200px;">
                        <label class="form-label" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin-bottom: 0.5rem;">Customer Gives</label>
                        
                        <div class="trade-input-row" style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                            <input type="number" class="form-input trade-amount" data-field="item1-amount" data-index="${index}" 
                                   value="${i1.amount}" min="1" max="64" style="width: 60px;" placeholder="Amt">
                            <div class="trade-item-select" id="trade-item1-${index}" style="flex: 1;" data-value="${i1.name}"></div>
                        </div>
                        
                        <div class="trade-input-row" style="display: flex; gap: 0.5rem; align-items: center;">
                            <input type="number" class="form-input trade-amount" data-field="item2-amount" data-index="${index}" 
                                   value="${i2.amount}" min="0" max="64" style="width: 60px;" placeholder="Amt">
                            <div class="trade-item-select" id="trade-item2-${index}" style="flex: 1;" data-value="${i2.name}"></div>
                            <small style="color: var(--text-tertiary); font-size: 0.7rem;">(Optional)</small>
                        </div>
                    </div>
                    
                    <!-- Arrow -->
                    <div class="trade-arrow" style="font-size: 2rem; color: var(--accent-primary);">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                    
                    <!-- Result Item -->
                    <div class="trade-result" style="flex: 1; min-width: 200px;">
                        <label class="form-label" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin-bottom: 0.5rem;">Customer Gets</label>
                        
                        <div class="trade-input-row" style="display: flex; gap: 0.5rem; align-items: center;">
                            <input type="number" class="form-input trade-amount" data-field="result-amount" data-index="${index}" 
                                   value="${res.amount}" min="1" max="64" style="width: 60px;" placeholder="Amt">
                            <div class="trade-item-select" id="trade-result-${index}" style="flex: 1;" data-value="${res.name}"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Max Uses -->
                <div class="trade-options" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label" style="font-size: 0.75rem;">Max Uses</label>
                        <input type="number" class="form-input trade-max-uses" data-index="${index}" 
                               value="${maxUses}" min="1" placeholder="10000" style="width: 120px;">
                        <small class="form-hint">Times this trade can be used before restocking</small>
                    </div>
                </div>
            </div>
        `;
    }

    renderEquipmentSection(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-shield-alt"></i> Equipment
                        <span class="count-badge">${mob.equipment ? Object.keys(mob.equipment).length : 0}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div id="mob-equipment-editor"></div>
                </div>
            </div>
        `;
    }
    
    renderDamageModifiersSection(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-shield"></i> Damage Modifiers
                        <span class="count-badge">${mob.damageModifiers ? Object.keys(mob.damageModifiers).length : 0}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div id="mob-damagemodifiers-editor"></div>
                </div>
            </div>
        `;
    }
    
    renderKillMessagesSection(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-skull-crossbones"></i> Kill Messages
                        <span class="count-badge">${mob.killMessages ? mob.killMessages.length : 0}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div id="mob-killmessages-list" class="killmessages-list">
                        ${this.renderKillMessages(mob.killMessages)}
                    </div>
                    <button class="add-item-btn" id="add-killmessage-btn">
                        <i class="fas fa-plus"></i> Add Kill Message
                    </button>
                    <small class="form-hint mt-2">
                        Use &lt;target.name&gt; for victim, &lt;caster.name&gt; for mob name. Random message is chosen on kill.
                    </small>
                </div>
            </div>
        `;
    }
    
    renderKillMessages(messages) {
        if (!messages || messages.length === 0) {
            return '<div class="empty-state">No kill messages configured</div>';
        }
        
        return messages.map((msg, index) => `
            <div class="killmessage-item">
                <input type="text" class="form-input killmessage-input" 
                       data-index="${index}" value="${msg}" 
                       placeholder="<target.name> was slain by <caster.name>">
                <button class="btn btn-icon remove-killmessage-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    renderAIGoalSelectorsSection(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-brain"></i> AI Goal Selectors
                        <span class="count-badge">${mob.aiGoalSelectors ? mob.aiGoalSelectors.length : 0}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Define custom AI behaviors and goals for this mob. Higher priority goals are executed first.</p>
                    <div id="mob-ai-goals-editor"></div>
                </div>
            </div>
        `;
    }
    
    renderAITargetSelectorsSection(mob) {
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-crosshairs"></i> AI Target Selectors
                        <span class="count-badge">${mob.aiTargetSelectors ? mob.aiTargetSelectors.length : 0}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Define which entities this mob will target. Supports faction-based targeting.</p>
                    <div id="mob-ai-targets-editor"></div>
                </div>
            </div>
        `;
    }
    
    renderModulesSection(mob) {
        const threatTable = mob.modules?.threatTable || false;
        const immunityTable = mob.modules?.immunityTable || false;
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-puzzle-piece"></i> Modules
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Enable advanced mob behavior modules</p>
                    <div class="modules-section">
                        <div class="module-option">
                            <label class="checkbox-label">
                                <input type="checkbox" id="module-threattable" ${threatTable ? 'checked' : ''}>
                                <div class="module-option-info">
                                    <div class="module-option-title">ThreatTable</div>
                                    <div class="module-option-description">
                                        Enables advanced threat management system. Mob will track and prioritize targets based on threat levels.
                                    </div>
                                </div>
                            </label>
                        </div>
                        <div class="module-option">
                            <label class="checkbox-label">
                                <input type="checkbox" id="module-immunitytable" ${immunityTable ? 'checked' : ''}>
                                <div class="module-option-info">
                                    <div class="module-option-title">ImmunityTable</div>
                                    <div class="module-option-description">
                                        Enables immunity configuration system. Control which damage types and effects the mob is immune to.
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Vanilla Override section removed - info now shown inline in Core Identity when applicable
    
    renderLevelModifiersSection(mob) {
        const lm = mob.levelModifiers || {};
        const hasModifiers = Object.values(lm).some(v => v && v !== 0);
        const isCollapsed = this.editor.state.justSwitchedToAdvanced !== false;
        
        // Helper to render a stat modifier card
        const renderStatCard = (id, icon, label, value, step, color) => {
            const hasValue = value && value !== 0;
            return `
                <div class="level-mod-card ${hasValue ? 'active' : ''}" data-stat="${id.replace('level-', '')}">
                    <div class="level-mod-header">
                        <div class="level-mod-icon"><i class="fas fa-${icon}"></i></div>
                        <span class="level-mod-name">${label}</span>
                    </div>
                    <input type="number" id="${id}" class="level-mod-input" 
                           value="${value || 0}" step="${step}" min="0" placeholder="0">
                </div>
            `;
        };
        
        return `
            <div class="card collapsible-card ${isCollapsed ? 'collapsed' : ''}">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-layer-group"></i> Level Modifiers
                        ${hasModifiers ? '<span class="badge badge-success">Active</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text" style="margin-bottom: 1rem;">Stats added per mob level. Values are multiplied by (level - 1).</p>
                    
                    <div class="level-mod-grid">
                        ${renderStatCard('level-health', 'heart', 'Health', lm.health, '0.5', '#ef4444')}
                        ${renderStatCard('level-damage', 'sword', 'Damage', lm.damage, '0.1', '#f97316')}
                        ${renderStatCard('level-power', 'bolt', 'Power', lm.power, '0.1', '#eab308')}
                        ${renderStatCard('level-armor', 'shield-alt', 'Armor', lm.armor, '0.5', '#3b82f6')}
                        ${renderStatCard('level-knockback', 'hand-rock', 'KB Resist', lm.knockbackResistance, '0.01', '#8b5cf6')}
                        ${renderStatCard('level-movement', 'running', 'Speed', lm.movementSpeed, '0.01', '#10b981')}
                    </div>
                    
                    <div class="level-preview-card">
                        <div class="level-preview-header">
                            <div class="level-preview-title">
                                <i class="fas fa-eye"></i>
                                <span>Stats Preview</span>
                            </div>
                            <div class="level-input-group">
                                <span class="level-input-label">Level</span>
                                <input type="number" id="level-preview-input" class="level-input" value="5" min="1" max="999">
                            </div>
                        </div>
                        <div class="level-preview-stats" id="level-preview-stats">
                            <div class="preview-stat-item" data-stat="health">
                                <i class="fas fa-heart"></i>
                                <div class="stat-info">
                                    <span class="stat-label">Health</span>
                                    <span class="stat-value">${mob.health || 10}</span>
                                </div>
                            </div>
                            <div class="preview-stat-item" data-stat="damage">
                                <i class="fas fa-sword"></i>
                                <div class="stat-info">
                                    <span class="stat-label">Damage</span>
                                    <span class="stat-value">${mob.damage || 1}</span>
                                </div>
                            </div>
                            <div class="preview-stat-item" data-stat="power">
                                <i class="fas fa-bolt"></i>
                                <div class="stat-info">
                                    <span class="stat-label">Power</span>
                                    <span class="stat-value">0</span>
                                </div>
                            </div>
                            <div class="preview-stat-item" data-stat="armor">
                                <i class="fas fa-shield-alt"></i>
                                <div class="stat-info">
                                    <span class="stat-label">Armor</span>
                                    <span class="stat-value">0</span>
                                </div>
                            </div>
                            <div class="preview-stat-item" data-stat="kbresist">
                                <i class="fas fa-hand-rock"></i>
                                <div class="stat-info">
                                    <span class="stat-label">KB Resist</span>
                                    <span class="stat-value">0.0</span>
                                </div>
                            </div>
                            <div class="preview-stat-item" data-stat="speed">
                                <i class="fas fa-running"></i>
                                <div class="stat-info">
                                    <span class="stat-label">Speed</span>
                                    <span class="stat-value">${mob.options?.movementSpeed || 0.3}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render the compact totem section with "Open Builder" button
     */
    renderTotemSection(mob) {
        const totem = mob.totem || mob.Totem || {};
        const headBlock = totem.head || totem.Head || 'PLAYER_HEAD';
        const pattern = totem.pattern || totem.Pattern || [];
        const replacement = totem.replacement || totem.Replacement || [];
        const hasTotem = pattern.length > 0 || headBlock !== 'PLAYER_HEAD';
        
        // Calculate dimensions for display
        let dimensions = '0×0×0';
        let layerCount = 0;
        if (pattern.length > 0) {
            const coords = pattern.map(entry => {
                const parts = entry.trim().split(/\s+/);
                const [x, y, z] = parts[0].split(',').map(v => parseInt(v) || 0);
                return { x, y, z };
            });
            const minX = Math.min(...coords.map(c => c.x));
            const maxX = Math.max(...coords.map(c => c.x));
            const minY = Math.min(...coords.map(c => c.y));
            const maxY = Math.max(...coords.map(c => c.y));
            const minZ = Math.min(...coords.map(c => c.z));
            const maxZ = Math.max(...coords.map(c => c.z));
            dimensions = `${maxX - minX + 1}×${maxY - minY + 1}×${maxZ - minZ + 1}`;
            layerCount = maxY - minY + 1;
        }
        
        return `
            <div class="card collapsible-card collapsed" id="totem-section">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-monument"></i> Totem Summoning
                        ${hasTotem ? '<span class="card-badge">Configured</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="totem-compact-section">
                        <!-- Info Banner -->
                        <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 10px; margin-bottom: 4px;">
                            <i class="fas fa-lightbulb" style="color: #a78bfa; font-size: 18px; margin-top: 2px;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #e9d5ff; font-size: 13px; display: block; margin-bottom: 4px;">Totem Summoning</strong>
                                <p style="margin: 0; color: #c4b5fd; line-height: 1.5; font-size: 12px;">
                                    Build a structure in-game that summons this mob when completed. Click the button below to open the visual totem builder.
                                </p>
                            </div>
                        </div>
                        
                        <!-- Compact Status Display -->
                        <div class="totem-compact-preview">
                            <canvas id="totem-mini-preview-canvas" class="totem-mini-preview" width="80" height="80"></canvas>
                            <div class="totem-compact-stats">
                                <div class="totem-compact-stat">
                                    <div class="value" id="totem-compact-blocks">${pattern.length}</div>
                                    <div class="label">Blocks</div>
                                </div>
                                <div class="totem-compact-stat">
                                    <div class="value" id="totem-compact-dimensions">${dimensions}</div>
                                    <div class="label">W×H×D</div>
                                </div>
                                <div class="totem-compact-stat">
                                    <div class="value" id="totem-compact-layers">${layerCount}</div>
                                    <div class="label">Layers</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Head Block Quick Config -->
                        <div class="totem-head-config">
                            <div class="label">
                                <i class="fas fa-cube"></i> Trigger Block
                            </div>
                            <div id="totem-head-dropdown-compact"></div>
                        </div>
                        
                        <!-- Open Builder Button -->
                        <button type="button" class="totem-open-builder-btn" id="open-totem-builder-btn" data-interactive="true">
                            <i class="fas fa-edit"></i>
                            <span>Open Totem Builder</span>
                        </button>
                        
                        <!-- Replacement Blocks (Collapsible) -->
                        <details style="margin-top: 8px;">
                            <summary style="cursor: pointer; padding: 10px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 8px; font-size: 12px; font-weight: 600; color: #fbbf24; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-exchange-alt"></i>
                                Replacement Blocks
                                <span style="margin-left: auto; font-size: 10px; background: rgba(251, 191, 36, 0.2); padding: 2px 8px; border-radius: 10px;">${replacement.length}</span>
                            </summary>
                            <div style="padding: 12px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(251, 191, 36, 0.1); border-top: none; border-radius: 0 0 8px 8px;">
                                <div id="totem-replacement-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
                                    ${replacement.length === 0 ? `
                                        <small style="color: var(--text-secondary); text-align: center; padding: 8px;">
                                            No replacements (all blocks become AIR)
                                        </small>
                                    ` : ''}
                                    ${replacement.map((entry, index) => this.generateTotemReplacementCard(entry, index)).join('')}
                                </div>
                                <button type="button" class="add-item-btn add-totem-replacement-btn" data-interactive="true" style="width: 100%; margin-top: 8px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: none; padding: 8px; font-weight: 600; font-size: 12px; border-radius: 6px;">
                                    <i class="fas fa-plus-circle"></i>
                                    <span>Add Replacement</span>
                                </button>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
            
            <!-- Totem Builder Modal (rendered once, hidden by default) -->
            ${this.renderTotemBuilderModal(mob)}
        `;
    }
    
    /**
     * Render the full totem builder modal
     */
    renderTotemBuilderModal(mob) {
        const totem = mob.totem || mob.Totem || {};
        const headBlock = totem.head || totem.Head || 'PLAYER_HEAD';
        const pattern = totem.pattern || totem.Pattern || [];
        
        return `
            <div class="totem-builder-overlay" id="totem-builder-overlay">
                <div class="totem-builder-modal">
                    <!-- Header -->
                    <div class="totem-builder-header">
                        <div class="totem-builder-title">
                            <i class="fas fa-monument"></i>
                            <h2>Totem Builder</h2>
                            <span>${pattern.length} blocks</span>
                        </div>
                        <button type="button" class="totem-builder-close" id="totem-builder-close" data-interactive="true">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Body -->
                    <div class="totem-builder-body">
                        <!-- Left Sidebar - Tools -->
                        <div class="totem-sidebar-left">
                            <!-- Paint Material -->
                            <div class="totem-tool-section">
                                <div class="totem-tool-header" style="color: #fb923c;">
                                    <i class="fas fa-paint-brush"></i>
                                    <span>Paint Tool</span>
                                </div>
                                <div class="totem-tool-content">
                                    <div class="totem-material-current" id="totem-current-material-display">
                                        <div class="totem-material-preview">
                                            <i class="fas fa-cube"></i>
                                        </div>
                                        <div class="totem-material-info">
                                            <div class="label">Current Material</div>
                                            <div class="name" id="totem-material-name">PLAYER_HEAD</div>
                                        </div>
                                    </div>
                                    <div id="totem-modal-paint-dropdown" style="margin-bottom: 10px;"></div>
                                    
                                    <!-- Symmetry Toggle -->
                                    <label class="totem-symmetry-toggle" id="totem-modal-symmetry-toggle">
                                        <input type="checkbox" id="totem-modal-symmetry-checkbox">
                                        <div class="toggle-box"><i class="fas fa-check"></i></div>
                                        <span>Mirror (Symmetry)</span>
                                    </label>
                                    
                                    <!-- Recent Materials -->
                                    <div style="margin-top: 10px;">
                                        <div style="font-size: 9px; font-weight: 600; color: #fdba74; text-transform: uppercase; margin-bottom: 6px;">
                                            <i class="fas fa-clock"></i> Recent
                                        </div>
                                        <div class="totem-recent-grid" id="totem-modal-recent-materials"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- View Controls -->
                            <div class="totem-tool-section">
                                <div class="totem-tool-header" style="color: #ec4899;">
                                    <i class="fas fa-eye"></i>
                                    <span>View</span>
                                </div>
                                <div class="totem-tool-content">
                                    <div class="totem-view-buttons">
                                        <button type="button" class="totem-view-btn-modal active" data-view="top" data-interactive="true">
                                            <i class="fas fa-arrow-down"></i> Top View (X-Z)
                                        </button>
                                        <button type="button" class="totem-view-btn-modal" data-view="front" data-interactive="true">
                                            <i class="fas fa-arrows-alt-h"></i> Front View (X-Y)
                                        </button>
                                        <button type="button" class="totem-view-btn-modal" data-view="side" data-interactive="true">
                                            <i class="fas fa-arrows-alt-v"></i> Side View (Z-Y)
                                        </button>
                                    </div>
                                    
                                    <!-- Y Level Control (for top view) -->
                                    <div class="totem-y-control" id="totem-modal-y-control">
                                        <span class="totem-y-label">Y Level</span>
                                        <button type="button" class="totem-y-btn" id="totem-modal-y-down" data-interactive="true">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <span class="totem-y-value" id="totem-modal-y-display">0</span>
                                        <button type="button" class="totem-y-btn" id="totem-modal-y-up" data-interactive="true">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Transform Tools -->
                            <div class="totem-tool-section">
                                <div class="totem-tool-header" style="color: #3b82f6;">
                                    <i class="fas fa-magic"></i>
                                    <span>Transform</span>
                                </div>
                                <div class="totem-tool-content">
                                    <div class="totem-tool-buttons">
                                        <button type="button" class="totem-tool-btn" id="totem-modal-undo" data-interactive="true" title="Undo (Ctrl+Z)">
                                            <i class="fas fa-undo"></i>
                                            <span>Undo</span>
                                        </button>
                                        <button type="button" class="totem-tool-btn" id="totem-modal-redo" data-interactive="true" title="Redo (Ctrl+Y)">
                                            <i class="fas fa-redo"></i>
                                            <span>Redo</span>
                                        </button>
                                        <button type="button" class="totem-tool-btn" id="totem-modal-rotate" data-interactive="true" title="Rotate 90°">
                                            <i class="fas fa-sync-alt"></i>
                                            <span>Rotate</span>
                                        </button>
                                        <button type="button" class="totem-tool-btn" id="totem-modal-mirror-x" data-interactive="true" title="Mirror X">
                                            <i class="fas fa-arrows-alt-h"></i>
                                            <span>Flip X</span>
                                        </button>
                                        <button type="button" class="totem-tool-btn" id="totem-modal-mirror-z" data-interactive="true" title="Mirror Z">
                                            <i class="fas fa-arrows-alt-v"></i>
                                            <span>Flip Z</span>
                                        </button>
                                        <button type="button" class="totem-tool-btn" id="totem-modal-center" data-interactive="true" title="Center Structure">
                                            <i class="fas fa-compress-arrows-alt"></i>
                                            <span>Center</span>
                                        </button>
                                        <button type="button" class="totem-tool-btn danger" id="totem-modal-clear" data-interactive="true" title="Clear All">
                                            <i class="fas fa-trash"></i>
                                            <span>Clear</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Statistics -->
                            <div class="totem-tool-section">
                                <div class="totem-tool-header" style="color: #10b981;">
                                    <i class="fas fa-chart-bar"></i>
                                    <span>Stats</span>
                                </div>
                                <div class="totem-tool-content">
                                    <div class="totem-stats-grid">
                                        <div class="totem-stat-item">
                                            <div class="value" id="totem-modal-total-blocks">0</div>
                                            <div class="label">Blocks</div>
                                        </div>
                                        <div class="totem-stat-item purple">
                                            <div class="value" id="totem-modal-layer-count">0</div>
                                            <div class="label">Layers</div>
                                        </div>
                                        <div class="totem-stat-item blue" style="grid-column: span 2;">
                                            <div class="value" id="totem-modal-dimensions">0×0×0</div>
                                            <div class="label">Dimensions (W×H×D)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Center - Grid Area -->
                        <div class="totem-grid-area">
                            <div class="totem-grid-header">
                                <div class="totem-grid-label">
                                    <i class="fas fa-grip-horizontal"></i> Interactive Grid
                                </div>
                                <div class="totem-view-indicator" id="totem-modal-view-indicator">
                                    <i class="fas fa-arrow-down"></i> TOP VIEW (Y=0)
                                </div>
                            </div>
                            
                            <div class="totem-grid-wrapper">
                                <div class="totem-modal-grid" id="totem-modal-grid">
                                    <!-- Grid cells rendered by JS -->
                                </div>
                            </div>
                            
                            <div class="totem-grid-instructions">
                                <div class="totem-instruction paint">
                                    <i class="fas fa-mouse-pointer"></i>
                                    <span>Left-click to paint</span>
                                </div>
                                <div class="totem-instruction erase">
                                    <i class="fas fa-eraser"></i>
                                    <span>Right-click to erase</span>
                                </div>
                                <div class="totem-instruction drag">
                                    <i class="fas fa-hand-paper"></i>
                                    <span>Click + Drag to paint multiple</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Sidebar - Preview & Templates -->
                        <div class="totem-sidebar-right">
                            <!-- Live Preview -->
                            <div class="totem-preview-container">
                                <div class="totem-preview-header">
                                    <span class="totem-preview-label"><i class="fas fa-eye"></i> Live Preview</span>
                                    <span class="totem-preview-label"><i class="fas fa-cube"></i> Minecraft</span>
                                </div>
                                <canvas id="totem-modal-preview-canvas" class="totem-preview-canvas" width="280" height="280"></canvas>
                            </div>
                            
                            <!-- Templates -->
                            <div class="totem-tool-section">
                                <div class="totem-tool-header" style="color: #6366f1;">
                                    <i class="fas fa-th-large"></i>
                                    <span>Quick Templates</span>
                                </div>
                                <div class="totem-tool-content">
                                    <div class="totem-templates-grid" id="totem-modal-templates">
                                        <!-- Templates rendered by JS -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="totem-builder-footer">
                        <div class="totem-footer-info">
                            <span><i class="fas fa-crosshairs" style="color: #ef4444;"></i> ⊕ = Spawn Point (0,0,0)</span>
                            <span><i class="fas fa-info-circle"></i> Changes are saved automatically</span>
                        </div>
                        <div class="totem-footer-actions">
                            <button type="button" class="totem-btn-cancel" id="totem-modal-cancel" data-interactive="true">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Paint Mode Indicator (appears when dragging) -->
            <div class="totem-paint-mode" id="totem-paint-mode-indicator">
                <i class="fas fa-paint-brush"></i>
                <span>Painting...</span>
            </div>
        `;
    }
    
    /**
     * OLD renderTotemSection - kept for reference, now replaced with compact version
     */
    renderTotemSectionOLD(mob) {
        const totem = mob.totem || mob.Totem || {};
        const headBlock = totem.head || totem.Head || 'PLAYER_HEAD';
        const pattern = totem.pattern || totem.Pattern || [];
        const replacement = totem.replacement || totem.Replacement || [];
        const hasTotem = pattern.length > 0 || headBlock !== 'PLAYER_HEAD';
        
        return `
            <div class="card collapsible-card collapsed" id="totem-section">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-monument"></i> Totem Summoning
                        ${hasTotem ? '<span class="card-badge">Configured</span>' : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="alert alert-info" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%); border: 2px solid rgba(139, 92, 246, 0.5); padding: 16px; border-radius: 10px;">
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <i class="fas fa-lightbulb" style="color: #a78bfa; font-size: 20px; margin-top: 2px;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #e9d5ff; font-size: 15px; display: block; margin-bottom: 6px;">About Totems:</strong>
                                <p style="margin: 0; color: #ddd6fe; line-height: 1.6; font-size: 14px;">
                                    Build a structure in-game that summons this mob. The <strong style="color: #a78bfa;">Head</strong> block triggers the check. Use the visual grid builder below to paint your totem structure.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px; background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%); border: 2px solid rgba(99,102,241,0.4); border-radius: 10px; padding: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-lightbulb" style="color: #fbbf24; font-size: 18px;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #818cf8; font-size: 13px; display: block; margin-bottom: 4px;">Quick Start:</strong>
                                <span style="color: #c4b5fd; font-size: 12px;">Click a template below to instantly load a pre-made totem structure!</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QUICK TEMPLATES - ALWAYS VISIBLE -->
                    <div style="margin-bottom: 20px; background: linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%); border: 2px solid rgba(99,102,241,0.5); border-radius: 12px; padding: 16px; box-shadow: 0 4px 16px rgba(99,102,241,0.3);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <i class="fas fa-th-large" style="color: #6366f1; font-size: 16px;"></i>
                            <span style="font-weight: 700; font-size: 13px; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px;">Quick Templates</span>
                            <span style="margin-left: auto; font-size: 10px; background: rgba(99,102,241,0.3); padding: 3px 8px; border-radius: 10px; color: #a5b4fc; font-weight: 600;">6 presets</span>
                        </div>
                        <div id="totem-templates" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            <!-- Templates rendered here by JavaScript -->
                        </div>
                    </div>

                    <!-- Visual Builder (Manual Entry removed) -->
                    
                    <div style="display: grid; grid-template-columns: 340px 1fr 1fr; gap: 20px;">
                        <!-- LEFT SIDEBAR: Controls & Configuration -->
                        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 85vh; overflow-y: auto; overflow-x: hidden; padding-right: 8px;">
                            
                            <!-- Head Block Configuration -->
                            <div class="totem-section" style="background: linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 100%); border: 2px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                <label class="form-label" style="display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 12px; font-size: 13px; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <i class="fas fa-cube" style="color: #a78bfa; font-size: 16px;"></i>
                                    Trigger Block
                                    <i class="fas fa-question-circle" style="margin-left: auto; font-size: 12px; opacity: 0.6; cursor: help;" title="The block that activates this totem structure when placed"></i>
                                </label>
                                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 12px;">
                                    <div id="totem-head-dropdown"></div>
                                </div>
                                <small class="form-hint" style="margin-top: 8px; display: block; font-size: 10px; background: rgba(139,92,246,0.1); padding: 6px 8px; border-radius: 6px; border-left: 3px solid #a78bfa;">
                                    <i class="fas fa-lightbulb" style="color: #fbbf24;"></i>
                                    <strong>Tip:</strong> Use PLAYER_HEAD for custom totem structures
                                </small>
                            </div>
                            
                            <!-- Enhanced Statistics (Prominent Display) -->
                            <div class="totem-section" style="background: linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%); border: 2px solid rgba(16,185,129,0.25); border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 12px; font-size: 13px; color: #6ee7b7; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <i class="fas fa-chart-bar" style="color: #10b981; font-size: 16px;"></i>
                                    Structure Stats
                                </label>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div id="totem-block-stats" style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                                        <span style="font-size: 11px; font-weight: 600; color: #6ee7b7;">
                                            <i class="fas fa-cubes"></i> Total Blocks
                                        </span>
                                        <span id="totem-total-blocks" style="font-size: 20px; font-weight: 700; color: #10b981; font-family: var(--font-mono);">${pattern.length}</span>
                                    </div>
                                    <div id="totem-dimensions-stats" style="background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                                        <span style="font-size: 11px; font-weight: 600; color: #93c5fd;">
                                            <i class="fas fa-ruler-combined"></i> Dimensions
                                        </span>
                                        <span id="totem-size" style="font-size: 14px; font-weight: 700; color: #3b82f6; font-family: var(--font-mono);">0×0×0</span>
                                    </div>
                                    <div id="totem-layers-stats" style="background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                                        <span style="font-size: 11px; font-weight: 600; color: #d8b4fe;">
                                            <i class="fas fa-layer-group"></i> Y Layers
                                        </span>
                                        <span id="totem-layer-count" style="font-size: 14px; font-weight: 700; color: #a855f7; font-family: var(--font-mono);">0</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Tools (Collapsible) -->
                            <div class="totem-section" style="background: linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(37,99,235,0.08) 100%); border: 2px solid rgba(59,130,246,0.25); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                <button type="button" class="totem-toggle-section" data-section="tools" style="width: 100%; background: none; border: none; padding: 14px 16px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; color: white;">
                                    <i class="fas fa-chevron-down totem-toggle-icon" style="color: #3b82f6; font-size: 12px; transition: transform 0.3s;"></i>
                                    <i class="fas fa-tools" style="color: #3b82f6; font-size: 16px;"></i>
                                    <span style="font-weight: 700; font-size: 13px; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.5px;">Transform Tools</span>
                                </button>
                                <div id="totem-tools-content" style="padding: 0 16px 16px 16px;">
                                    <!-- History Controls -->
                                    <div style="margin-bottom: 10px;">
                                        <small style="display: block; font-size: 10px; font-weight: 600; color: #93c5fd; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            <i class="fas fa-history"></i> History
                                        </small>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                                            <button type="button" class="btn totem-undo-btn" data-interactive="true" style="padding: 8px; font-size: 11px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; border-radius: 6px; font-weight: 600; transition: all 0.2s;">
                                                <i class="fas fa-undo"></i> Undo
                                                <small style="opacity: 0.6; font-size: 9px; margin-left: 4px;">Ctrl+Z</small>
                                            </button>
                                            <button type="button" class="btn totem-redo-btn" data-interactive="true" style="padding: 8px; font-size: 11px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; border-radius: 6px; font-weight: 600; transition: all 0.2s;">
                                                <i class="fas fa-redo"></i> Redo
                                                <small style="opacity: 0.6; font-size: 9px; margin-left: 4px;">Ctrl+Y</small>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Transform Operations -->
                                    <div style="margin-bottom: 10px;">
                                        <small style="display: block; font-size: 10px; font-weight: 600; color: #93c5fd; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            <i class="fas fa-magic"></i> Transform
                                        </small>
                                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                                            <button type="button" class="btn totem-rotate-btn" data-interactive="true" title="Rotate 90° clockwise" style="padding: 8px; font-size: 10px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; border-radius: 6px; font-weight: 600;">
                                                <i class="fas fa-sync-alt"></i><br><span style="font-size: 9px;">Rotate</span>
                                            </button>
                                            <button type="button" class="btn totem-mirror-x-btn" data-interactive="true" title="Mirror along X axis" style="padding: 8px; font-size: 10px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; border-radius: 6px; font-weight: 600;">
                                                <i class="fas fa-arrows-alt-h"></i><br><span style="font-size: 9px;">Flip X</span>
                                            </button>
                                            <button type="button" class="btn totem-mirror-z-btn" data-interactive="true" title="Mirror along Z axis" style="padding: 8px; font-size: 10px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; border-radius: 6px; font-weight: 600;">
                                                <i class="fas fa-arrows-alt-v"></i><br><span style="font-size: 9px;">Flip Z</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Utility -->
                                    <div>
                                        <small style="display: block; font-size: 10px; font-weight: 600; color: #93c5fd; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            <i class="fas fa-sliders-h"></i> Utility
                                        </small>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                                            <button type="button" class="btn totem-center-grid-btn" data-interactive="true" title="Center structure" style="padding: 8px; font-size: 11px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; border-radius: 6px; font-weight: 600;">
                                                <i class="fas fa-compress-arrows-alt"></i> Center
                                            </button>
                                            <button type="button" class="btn totem-clear-grid-btn" data-interactive="true" title="Clear everything" style="padding: 8px; font-size: 11px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; border-radius: 6px; font-weight: 600;">
                                                <i class="fas fa-eraser"></i> Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Paint Material Selector (Enhanced) -->
                            <div class="totem-section" style="background: linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(249,115,22,0.08) 100%); border: 2px solid rgba(251,146,60,0.25); border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                    <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; color: #fdba74; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <i class="fas fa-paint-brush" style="color: #fb923c; font-size: 16px;"></i>
                                        Paint Tool
                                    </label>
                                    <label style="font-size: 10px; color: #fdba74; cursor: pointer; background: rgba(251,146,60,0.2); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(251,146,60,0.3);" title="Auto-mirror blocks along X-axis">
                                        <input type="checkbox" id="totem-symmetry-mode" style="margin-right: 4px;">
                                        <i class="fas fa-reflect"></i> Symmetry
                                    </label>
                                </div>
                                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(251,146,60,0.3); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                                    <div id="totem-paint-material-dropdown"></div>
                                </div>
                                <div>
                                    <small style="display: block; font-size: 10px; font-weight: 600; color: #fdba74; margin-bottom: 6px;">
                                        <i class="fas fa-clock"></i> Recent Materials
                                    </small>
                                    <div id="totem-recent-materials" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                                        <!-- Recent materials will appear here as larger blocks -->
                                    </div>
                                </div>
                            </div>

                            <!-- View Controls -->
                            <div class="totem-section" style="background: linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(219,39,119,0.08) 100%); border: 2px solid rgba(236,72,153,0.25); border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 10px; font-size: 13px; color: #f9a8d4; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <i class="fas fa-eye" style="color: #ec4899; font-size: 16px;"></i>
                                    View Angle
                                </label>
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    <button type="button" class="totem-view-btn active" data-view="top" data-interactive="true" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border: none; border-radius: 6px; color: white; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(236,72,153,0.3);">
                                        <i class="fas fa-arrow-down"></i> Top View (X-Z)
                                    </button>
                                    <button type="button" class="totem-view-btn" data-view="front" data-interactive="true" style="width: 100%; padding: 10px; background: rgba(236,72,153,0.1); border: 1px solid rgba(236,72,153,0.3); border-radius: 6px; color: #f9a8d4; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                                        <i class="fas fa-arrows-alt-h"></i> Front View (X-Y)
                                    </button>
                                    <button type="button" class="totem-view-btn" data-view="side" data-interactive="true" style="width: 100%; padding: 10px; background: rgba(236,72,153,0.1); border: 1px solid rgba(236,72,153,0.3); border-radius: 6px; color: #f9a8d4; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                                        <i class="fas fa-arrows-alt-v"></i> Side View (Z-Y)
                                    </button>
                                </div>

                                <!-- Y Level Control -->
                                <div id="totem-y-control" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(236,72,153,0.3); border-radius: 8px; padding: 12px; margin-top: 12px;">
                                    <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600; color: #f9a8d4; margin-bottom: 8px;">
                                        <span><i class="fas fa-layer-group"></i> Y Level</span>
                                        <span id="totem-y-display" style="font-family: var(--font-mono); font-size: 16px; color: #ec4899; font-weight: 700;">0</span>
                                    </label>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                                        <button type="button" class="btn totem-y-down-btn" data-interactive="true" style="padding: 8px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 11px;">
                                            <i class="fas fa-arrow-down"></i> Down
                                        </button>
                                        <button type="button" class="btn totem-y-up-btn" data-interactive="true" style="padding: 8px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 11px;">
                                            <i class="fas fa-arrow-up"></i> Up
                                        </button>
                                    </div>
                                    <small style="display: block; color: rgba(249,168,212,0.7); font-size: 9px; text-align: center; margin-top: 6px;">
                                        Y=0 is spawn point • Range: -5 to +5
                                    </small>
                                </div>
                            </div>
                        </div> <!-- End LEFT SIDEBAR -->

                        <!-- CENTER COLUMN: Interactive Grid Builder with Coordinate Labels -->
                        <div style="background: linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(15,23,42,0.5) 100%); border: 2px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 700px; position: relative; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
                            <!-- Grid Header -->
                            <div style="position: absolute; top: 12px; left: 12px; right: 12px; display: flex; align-items: center; justify-content: space-between;">
                                <div style="background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.2) 100%); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #a78bfa; letter-spacing: 0.5px;">
                                    <i class="fas fa-grip-horizontal" style="margin-right: 6px;"></i>
                                    INTERACTIVE GRID
                                </div>
                                <div id="totem-current-view-indicator" style="background: rgba(236,72,153,0.2); border: 1px solid rgba(236,72,153,0.3); border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #f9a8d4;">
                                    <i class="fas fa-arrow-down"></i> TOP VIEW
                                </div>
                            </div>
                            
                            <!-- Grid with axis labels -->
                            <div id="totem-grid-container" style="position: relative; margin-top: 40px;">
                                <div id="totem-grid" style="display: inline-grid; gap: 2px;">
                                    <!-- Grid cells generated by JavaScript -->
                                </div>
                                <!-- Coordinate labels will be added by JavaScript -->
                            </div>
                            
                            <!-- Grid Instructions -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; width: 100%; max-width: 500px;">
                                <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 10px; text-align: center;">
                                    <i class="fas fa-mouse-pointer" style="color: #a78bfa; font-size: 18px; margin-bottom: 4px; display: block;"></i>
                                    <strong style="display: block; font-size: 11px; color: #c4b5fd; margin-bottom: 2px;">Left-Click</strong>
                                    <small style="font-size: 9px; color: var(--text-tertiary);">Place block</small>
                                </div>
                                <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 10px; text-align: center;">
                                    <i class="fas fa-eraser" style="color: #ef4444; font-size: 18px; margin-bottom: 4px; display: block;"></i>
                                    <strong style="display: block; font-size: 11px; color: #fca5a5; margin-bottom: 2px;">Right-Click</strong>
                                    <small style="font-size: 9px; color: var(--text-tertiary);">Remove block</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- RIGHT COLUMN: Live Preview Canvas with Controls -->
                        <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%); border: 2px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05); position: relative; min-height: 700px; display: flex; flex-direction: column; overflow: hidden;">
                            <!-- Corner decorations -->
                            <div style="position: absolute; top: 0; left: 0; width: 40px; height: 40px; border-top: 2px solid rgba(139, 92, 246, 0.4); border-left: 2px solid rgba(139, 92, 246, 0.4); border-radius: 12px 0 0 0;"></div>
                            <div style="position: absolute; top: 0; right: 0; width: 40px; height: 40px; border-top: 2px solid rgba(139, 92, 246, 0.4); border-right: 2px solid rgba(139, 92, 246, 0.4); border-radius: 0 12px 0 0;"></div>
                            <div style="position: absolute; bottom: 0; left: 0; width: 40px; height: 40px; border-bottom: 2px solid rgba(139, 92, 246, 0.4); border-left: 2px solid rgba(139, 92, 246, 0.4); border-radius: 0 0 0 12px;"></div>
                            <div style="position: absolute; bottom: 0; right: 0; width: 40px; height: 40px; border-bottom: 2px solid rgba(139, 92, 246, 0.4); border-right: 2px solid rgba(139, 92, 246, 0.4); border-radius: 0 0 12px 0;"></div>
                            
                            <!-- Preview Header -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%); border: 1px solid rgba(139, 92, 246, 0.5); border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #a78bfa; letter-spacing: 0.5px;">
                                    <i class="fas fa-eye" style="margin-right: 6px;"></i>
                                    LIVE PREVIEW
                                </div>
                                <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%); border: 1px solid rgba(139, 92, 246, 0.5); border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #a78bfa; letter-spacing: 0.5px;">
                                    <i class="fas fa-cube" style="margin-right: 6px;"></i>
                                    MINECRAFT
                                </div>
                            </div>
                            
                            <!-- Canvas Container -->
                            <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative;">
                                <canvas id="totem-preview-canvas" style="border-radius: 8px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.2); max-width: 100%; max-height: 100%;"></canvas>
                            </div>
                            
                            <!-- Preview Info Footer -->
                            <div style="margin-top: 12px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 10px;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 16px; font-size: 10px; color: #c4b5fd;">
                                    <span>
                                        <i class="fas fa-info-circle" style="color: #a78bfa; margin-right: 4px;"></i>
                                        Updates in real-time
                                    </span>
                                    <span style="opacity: 0.6;">•</span>
                                    <span>
                                        <i class="fas fa-crosshairs" style="color: #fbbf24; margin-right: 4px;"></i>
                                        ⊕ = Spawn Point (0,0,0)
                                    </span>
                                </div>
                            </div>
                        </div> <!-- End RIGHT COLUMN -->
                    </div> <!-- End 3-column grid layout -->
                    
                    <!-- Replacement Blocks Section (Full-Width Below 3-Column Layout) -->
                    <div>
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 12px;">
                            <i class="fas fa-exchange-alt" style="color: #fbbf24;"></i>
                            Replacement Blocks (Optional)
                            <small style="font-weight: normal; color: var(--text-secondary); margin-left: auto;">
                                ${replacement.length} replacements
                            </small>
                        </label>
                        
                        <div id="totem-replacement-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; padding: 12px; background: rgba(251, 191, 36, 0.05); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 8px; margin-bottom: 12px;">
                            ${replacement.length === 0 ? `
                                <small style="color: var(--text-secondary); text-align: center; padding: 12px;">
                                    No replacements (all blocks become AIR)
                                </small>
                            ` : ''}
                            ${replacement.map((entry, index) => this.generateTotemReplacementCard(entry, index)).join('')}
                        </div>
                        
                        <button type="button" class="add-item-btn add-totem-replacement-btn" data-interactive="true" style="width: 100%; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: none; padding: 10px; font-weight: 600; font-size: 13px;">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Replacement</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate individual totem pattern block card
     */
    generateTotemPatternCard(entry, index) {
        const parts = entry.trim().split(/\s+/);
        const coords = parts[0] || '0,0,0';
        const material = parts.slice(1).join(' ') || 'STONE';
        const [x, y, z] = coords.split(',').map(v => parseInt(v) || 0);
        
        return `
            <div class="totem-pattern-card" data-index="${index}" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; padding: 12px; display: grid; grid-template-columns: 100px 1fr auto auto; gap: 10px; align-items: center; transition: all 0.2s ease;">
                <div>
                    <label style="font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">
                        <i class="fas fa-map-marker-alt" style="margin-right: 2px;"></i>
                        Coords
                    </label>
                    <input 
                        type="text" 
                        class="form-input totem-pattern-coords" 
                        data-index="${index}"
                        data-interactive="true"
                        value="${coords}"
                        placeholder="x,y,z"
                        style="font-family: var(--font-mono); font-size: 12px; padding: 6px 8px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(139, 92, 246, 0.3);"
                    >
                </div>
                <div>
                    <label style="font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">
                        <i class="fas fa-cube" style="margin-right: 2px;"></i>
                        Material
                    </label>
                    <input 
                        type="text" 
                        class="form-input totem-pattern-material" 
                        data-index="${index}"
                        data-interactive="true"
                        value="${material}"
                        placeholder="NETHERITE_BLOCK"
                        readonly
                        style="font-family: var(--font-mono); font-size: 12px; padding: 6px 8px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(139, 92, 246, 0.3); cursor: default;"
                    >
                </div>
                <button type="button" class="btn browse-pattern-material-btn" data-index="${index}" data-interactive="true" style="padding: 6px 12px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border: none; border-radius: 6px; color: white; font-weight: 600; font-size: 11px; white-space: nowrap;">
                    <i class="fas fa-search"></i> Browse
                </button>
                <button type="button" class="btn-icon btn-danger remove-totem-pattern" data-index="${index}" data-interactive="true" style="width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 13px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * Generate individual totem replacement card
     */
    generateTotemReplacementCard(entry, index) {
        const parts = entry.trim().split(/\s+/);
        const coords = parts[0] || '0,0,0';
        const material = parts.slice(1).join(' ') || 'AIR';
        
        return `
            <div class="totem-replacement-card" data-index="${index}" style="background: rgba(251, 191, 36, 0.05); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 6px; padding: 10px; display: grid; grid-template-columns: 100px 1fr auto; gap: 10px; align-items: center;">
                <input 
                    type="text" 
                    class="form-input totem-replacement-coords" 
                    data-index="${index}"
                    data-interactive="true"
                    value="${coords}"
                    placeholder="x,y,z"
                    style="font-family: var(--font-mono); font-size: 12px; padding: 6px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(251, 191, 36, 0.3);"
                >
                <input 
                    type="text" 
                    class="form-input totem-replacement-material" 
                    data-index="${index}"
                    data-interactive="true"
                    value="${material}"
                    placeholder="AIR"
                    style="font-family: var(--font-mono); font-size: 12px; padding: 6px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(251, 191, 36, 0.3);"
                >
                <button type="button" class="btn-icon btn-danger remove-totem-replacement" data-index="${index}" data-interactive="true" style="width: 28px; height: 28px; padding: 0; font-size: 12px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    renderSkillsSection(mob) {
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-magic"></i> Skills
                        <span class="count-badge">${mob.skills ? mob.skills.length : 0}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Skills are actions the mob can perform based on triggers (e.g., onAttack, onDamaged). Configure mechanics, conditions, and cooldowns.</p>
                    <div id="mob-skills-editor"></div>
                </div>
            </div>
        `;
    }
    
    renderDropsSection(mob) {
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-box"></i> Drops
                        <span class="count-badge">${mob.drops ? mob.drops.length : 0}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Configure items, XP, and MythicItems that this mob drops on death. Set amounts and drop chances.</p>
                    <div id="mob-drops-editor"></div>
                </div>
            </div>
        `;
    }

    renderDropOptionsSection(mob) {
        // Initialize dropOptions if not present
        if (!mob.dropOptions) {
            mob.dropOptions = { DropMethod: 'VANILLA' };
        }

        const dropOptions = mob.dropOptions;
        const isFancy = dropOptions.DropMethod === 'FANCY';

        // Get all field configurations from fancyDrops.js
        const allFields = window.getAllDropOptionsFields ? window.getAllDropOptionsFields() : {};

        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-sparkles"></i> Fancy Drop Options
                        <span class="badge ${isFancy ? 'badge-success' : 'badge-secondary'}">${dropOptions.DropMethod}</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Configure fancy drops system with visual effects, holograms, and per-player drops. Set DropMethod to FANCY to enable these features.</p>
                    
                    <div class="form-group">
                        <label class="form-label">Drop Method</label>
                        <select id="drop-method" class="form-select">
                            <option value="VANILLA" ${dropOptions.DropMethod === 'VANILLA' ? 'selected' : ''}>VANILLA</option>
                            <option value="FANCY" ${dropOptions.DropMethod === 'FANCY' ? 'selected' : ''}>FANCY</option>
                        </select>
                        <small class="form-hint">FANCY enables visual effects, holograms, and per-player drops. VANILLA uses default Minecraft drop behavior.</small>
                    </div>

                    <div id="fancy-drop-options-container" style="${isFancy ? '' : 'display: none;'}">
                        ${this.renderDropOptionsFields(dropOptions, allFields)}
                    </div>
                </div>
            </div>
        `;
    }

    renderDropOptionsFields(dropOptions, allFields) {
        if (!allFields || Object.keys(allFields).length === 0) {
            return '<p class="text-muted">Drop options configuration not loaded.</p>';
        }

        let html = '';

        // Group fields by section
        const sections = {};
        
        Object.entries(allFields).forEach(([key, field]) => {
            if (field.name === 'DropMethod') return; // Skip, already handled

            const sectionKey = field.section || 'Other';
            if (!sections[sectionKey]) {
                sections[sectionKey] = {
                    title: field.section,
                    icon: field.sectionIcon || 'cog',
                    fields: []
                };
            }
            
            // Get the value for this field, handling nested properties
            let value;
            if (field.name.includes('.')) {
                // Handle nested fields like ItemVFX.Material
                const parts = field.name.split('.');
                value = dropOptions;
                for (const part of parts) {
                    value = value?.[part];
                }
            } else {
                value = dropOptions[field.name];
            }
            
            sections[sectionKey].fields.push({ key, field, value });
        });

        // Render each section
        Object.entries(sections).forEach(([sectionKey, section]) => {
            if (section.fields.length === 0) return;

            html += `
                <div class="card collapsible-card collapsed" style="margin-top: 1rem;">
                    <div class="card-header collapsible-header" style="background: var(--bg-secondary); padding: 0.75rem 1rem;">
                        <h4 class="card-title" style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">
                            <i class="fas fa-${section.icon}"></i> ${section.title}
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h4>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
            `;

            section.fields.forEach(({ key, field, value }) => {
                html += `<div>`;
                html += this.renderDropOptionField(field, value);
                html += `</div>`;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    renderDropOptionField(field, value) {
        const fieldId = `drop-option-${field.name.replace(/\./g, '-')}`;
        const currentValue = value !== undefined ? value : field.default;

        let inputHtml = '';

        switch (field.type) {
            case 'boolean':
                inputHtml = `
                    <div class="toggle-option-row">
                        <span class="toggle-option-label">${field.label}</span>
                        <label class="toggle-switch">
                            <input type="checkbox" class="drop-option-field" id="${fieldId}" data-field="${field.name}" ${currentValue ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
                break;

            case 'number':
                inputHtml = `
                    <label class="form-label" for="${fieldId}">${field.label}</label>
                    <input type="number" class="form-input drop-option-field" id="${fieldId}" data-field="${field.name}" value="${currentValue !== undefined ? currentValue : ''}" step="any">
                `;
                break;

            case 'select':
                if (field.options) {
                    inputHtml = `
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <select class="form-select drop-option-field" id="${fieldId}" data-field="${field.name}">
                            ${field.options.map(opt => `<option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    `;
                }
                break;

            case 'text':
                inputHtml = `
                    <label class="form-label" for="${fieldId}">${field.label}</label>
                    <input type="text" class="form-input drop-option-field" id="${fieldId}" data-field="${field.name}" value="${currentValue || ''}" placeholder="${field.placeholder || ''}">
                `;
                break;

            case 'stringlist':
                // For HologramMessage and ChatMessage - render as a list editor
                const listValue = Array.isArray(currentValue) ? currentValue : [];
                inputHtml = `
                    <label class="form-label">${field.label}</label>
                    <div class="stringlist-editor" data-field="${field.name}">
                        <div class="stringlist-items" id="${fieldId}-items">
                            ${listValue.map((line, idx) => `
                                <div class="stringlist-item" data-index="${idx}">
                                    <input type="text" class="form-input stringlist-line" value="${this.escapeHtml(line)}" placeholder="Enter line ${idx + 1}...">
                                    <button type="button" class="btn btn-sm btn-danger stringlist-remove" title="Remove line">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-sm btn-outline stringlist-add" data-field="${field.name}">
                            <i class="fas fa-plus"></i> Add Line
                        </button>
                    </div>
                `;
                break;
        }

        let paperWarning = '';
        if (field.paperOnly) {
            paperWarning = '<small class="text-warning"><i class="fas fa-exclamation-triangle"></i> Requires Paper server</small>';
        }

        let placeholderInfo = '';
        if (field.placeholders && field.placeholders.length > 0) {
            placeholderInfo = `
                <details class="mt-2">
                    <summary style="cursor: pointer; color: var(--primary-color); font-size: 0.85rem;">
                        <i class="fas fa-info-circle"></i> Available Placeholders
                    </summary>
                    <ul style="font-size: 0.8rem; margin: 0.5rem 0; padding-left: 1.5rem; color: var(--text-secondary);">
                        ${field.placeholders.map(ph => `<li>${this.escapeHtml(ph)}</li>`).join('')}
                    </ul>
                </details>
            `;
        }

        return `
            <div class="form-group">
                ${inputHtml}
                <small class="form-text text-muted">${field.description}</small>
                ${paperWarning}
                ${placeholderInfo}
            </div>
        `;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Render entity options for Mount selector - includes MythicMobs from pack + vanilla entities
     */
    renderMountEntityOptions(selected) {
        let html = '';
        
        // Get MythicMobs from current pack
        const mythicMobs = [];
        if (this.editor.state.currentPack?.mobs) {
            this.editor.state.currentPack.mobs.forEach(file => {
                if (file.entries) {
                    file.entries.forEach(mob => {
                        if (mob.internalName) mythicMobs.push(mob.internalName);
                    });
                }
            });
        }
        
        // MythicMobs category
        if (mythicMobs.length > 0) {
            html += `<optgroup label="🔮 MythicMobs (Your Pack)">`;
            mythicMobs.sort().forEach(mob => {
                html += `<option value="${mob}" ${mob === selected ? 'selected' : ''}>${mob}</option>`;
            });
            html += `</optgroup>`;
        }
        
        // Vanilla entity categories
        const categories = this.fieldManager.getEntitiesByCategory();
        Object.entries(categories).forEach(([category, entities]) => {
            html += `<optgroup label="${category}">`;
            entities.forEach(entity => {
                html += `<option value="${entity}" ${entity === selected ? 'selected' : ''}>${entity}</option>`;
            });
            html += `</optgroup>`;
        });
        
        return html;
    }
    
    renderEntityTypes(selected, inheritedType = null) {
        const categories = this.fieldManager.getEntitiesByCategory();
        let html = '';
        
        // If showing inherited type, display it as the selected option
        const displayType = selected || inheritedType;
        
        Object.entries(categories).forEach(([category, entities]) => {
            html += `<optgroup label="${category}">`;
            entities.forEach(entity => {
                html += `<option value="${entity}" ${entity === displayType ? 'selected' : ''}>${entity}</option>`;
            });
            html += `</optgroup>`;
        });
        
        return html;
    }
    
    /**
     * Apply vanilla Minecraft stats if available for the selected entity type
     * Only fills in Health and Damage if the fields are empty or have default values
     */
    applyVanillaStatsIfAvailable(entityType) {
        if (!entityType || !window.VANILLA_MOB_STATS) return;
        
        const stats = window.VANILLA_MOB_STATS[entityType];
        if (!stats) return; // No vanilla data for this mob type
        
        const healthInput = document.getElementById('mob-health');
        const damageInput = document.getElementById('mob-damage');
        
        let appliedStats = [];
        
        // Auto-fill Health - update whenever entity type changes
        if (healthInput) {
            this.currentMob.health = stats.health;
            healthInput.value = stats.health;
            appliedStats.push(`Health: ${stats.health}`);
        }
        
        // Auto-fill Damage - update whenever entity type changes
        if (damageInput && (stats.damage.min > 0 || stats.damage.max > 0)) {
            // Calculate average damage (middle value between min and max)
            const averageDamage = (stats.damage.min + stats.damage.max) / 2;
            const damageValue = Math.round(averageDamage * 10) / 10; // Round to 1 decimal
            this.currentMob.damage = damageValue;
            damageInput.value = damageValue;
            appliedStats.push(`Damage: ${damageValue}`);
        }
        
        // Show subtle notification if stats were applied
        if (appliedStats.length > 0) {
            this.editor.showToast(`Applied ${entityType} defaults: ${appliedStats.join(', ')}`, 'info', 3000);
        }
        
        // Sync to file for preview
        this.syncToFile();
    }
    
    /**
     * Update the Trades section visibility based on entity type
     * Only show for VILLAGER and WANDERING_TRADER
     */
    updateTradesSectionVisibility(entityType) {
        const tradesSection = document.getElementById('trades-section');
        if (!tradesSection) return;
        
        const tradeableEntities = ['VILLAGER', 'WANDERING_TRADER'];
        const shouldShow = tradeableEntities.includes((entityType || '').toUpperCase());
        
        if (shouldShow) {
            tradesSection.style.display = '';
        } else {
            tradesSection.style.display = 'none';
        }
    }
    
    /**
     * Toggle the entity type lock for template inheritance
     * When locked: uses inherited type from template
     * When unlocked: allows overriding the entity type
     */
    toggleEntityTypeLock() {
        const lockBtn = document.getElementById('entity-type-lock');
        const typeSelect = document.getElementById('mob-type');
        
        if (!lockBtn || !typeSelect || !this.currentMob) return;
        
        const isCurrentlyLocked = lockBtn.classList.contains('locked');
        
        if (isCurrentlyLocked) {
            // Unlocking - enable the dropdown for override
            lockBtn.classList.remove('locked');
            lockBtn.classList.add('unlocked');
            lockBtn.innerHTML = '<i class="fas fa-lock-open"></i>';
            lockBtn.title = 'Click to use inherited entity type';
            
            typeSelect.disabled = false;
            typeSelect.classList.remove('inherited-field');
            
            // Set the current value as the override
            const currentValue = typeSelect.value;
            this.currentMob.type = currentValue;
            
            this.editor.showToast('Entity type unlocked - you can now override it', 'info');
        } else {
            // Locking - clear override and use inherited type
            lockBtn.classList.remove('unlocked');
            lockBtn.classList.add('locked');
            lockBtn.innerHTML = '<i class="fas fa-lock"></i>';
            lockBtn.title = 'Click to override template entity type';
            
            typeSelect.disabled = true;
            typeSelect.classList.add('inherited-field');
            
            // Clear the override - will inherit from template
            delete this.currentMob.type;
            
            this.editor.showToast('Entity type locked - using inherited type from template', 'info');
        }
        
        // Update the hint text
        this.updateEntityTypeHint();
        
        // Sync changes and update preview
        this.syncToFile();
        this.editor.markDirty();
        this.editor.updateYAMLPreview();
    }
    
    /**
     * Update the entity type hint text based on lock state
     */
    updateEntityTypeHint() {
        const formGroup = document.getElementById('mob-type')?.closest('.form-group');
        if (!formGroup) return;
        
        const existingHint = formGroup.querySelector('.form-hint');
        if (!existingHint) return;
        
        const templateMob = this.getTemplateMob(this.currentMob);
        const hasTemplate = !!this.currentMob.template;
        
        if (hasTemplate && !this.currentMob.type) {
            existingHint.className = 'form-hint inherited-hint';
            existingHint.innerHTML = `<i class="fas fa-layer-group"></i> Inherited from ${this.currentMob.template}`;
        } else if (hasTemplate && this.currentMob.type) {
            existingHint.className = 'form-hint override-hint';
            existingHint.innerHTML = `<i class="fas fa-edit"></i> Overriding template (${templateMob?.type || 'unknown'})`;
        } else {
            existingHint.className = 'form-hint';
            existingHint.innerHTML = 'Base entity type';
        }
    }
    
    renderSkills(skills) {
        if (!skills || skills.length === 0) {
            return '<div class="empty-state"><p>No skills yet</p></div>';
        }
        
        return skills.map(skill => `
            <div class="skill-item">
                <i class="fas fa-grip-vertical skill-handle"></i>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-trigger">${skill.trigger || '~onAttack'}</div>
                </div>
                <div class="skill-actions">
                    <button class="icon-btn" onclick="removeSkill('${skill.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderDrops(drops) {
        if (!drops || drops.length === 0) {
            return '<div class="empty-state"><p>No drops configured</p></div>';
        }
        
        return drops.map(drop => `
            <div class="drop-item">
                <div class="drop-icon"><i class="fas fa-cube"></i></div>
                <div class="drop-info">
                    <span>${drop.item}</span>
                    <span>Amount: ${drop.amount}</span>
                    <span>Chance: ${drop.chance * 100}%</span>
                </div>
                <button class="icon-btn" onclick="removeDrop('${drop.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    attachEventListeners() {
        // Save button
        document.getElementById('save-mob')?.addEventListener('click', async () => {
            await this.saveMob(this.currentMob);
        });
        
        // New section button (add new mob to current file)
        document.getElementById('new-mob')?.addEventListener('click', () => {
            this.addNewSection();
        });
        
        // Duplicate mob button
        document.getElementById('duplicate-mob')?.addEventListener('click', () => {
            this.duplicateMob();
        });
        
        // Delete mob button
        document.getElementById('delete-mob')?.addEventListener('click', () => {
            this.deleteMob();
        });

        // Initialize collapsible functionality
        window.collapsibleManager.initializeCollapsible();
        
        // Restore collapsible states (skip when just switched to advanced)
        if (!this.editor.state.justSwitchedToAdvanced) {
            window.collapsibleManager.restoreStates();
        }
        
        // Mob name input with sanitization
        document.getElementById('mob-name')?.addEventListener('input', (e) => {
            if (this.currentMob) {
                let newName = e.target.value;
                
                // Show sanitization preview if needed
                const sanitizedName = this.editor.sanitizeInternalName(newName);
                const sanitizedHint = document.getElementById('mob-name-sanitized');
                if (sanitizedHint && sanitizedName !== newName && newName.trim()) {
                    sanitizedHint.textContent = `Will be saved as: ${sanitizedName}`;
                    sanitizedHint.style.display = 'block';
                } else if (sanitizedHint) {
                    sanitizedHint.style.display = 'none';
                }
                
                // Apply sanitization and update mob name
                this.currentMob.name = sanitizedName;
                this.editor.markDirty();
            }
        });
        
        // Initialize Phase 1 components
        this.initializePhase1Components();
        
        // Initialize Phase 2-4 components immediately (don't defer)
        this.initializePhase2Components();
        this.initializePhase3Components();
        this.initializePhase4Components();
        
        // Vanilla override suggestion clicks
        document.querySelectorAll('.override-suggestion:not(.current)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                if (type) {
                    document.getElementById('mob-internal-name').value = type;
                    this.updateMob('internalName', type);
                    this.render(this.currentMob);
                }
            });
        });
        
        // Entity type change handler - triggers field visibility update
        const typeSelect = document.getElementById('mob-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                const selectedType = e.target.value;
                this.updateMob('type', selectedType);
                
                // Auto-fill vanilla stats if available
                this.applyVanillaStatsIfAvailable(selectedType);
                
                // Update YAML preview to show the Type override
                this.editor.updateYAMLPreview();
                
                // Update Trades section visibility based on entity type
                this.updateTradesSectionVisibility(selectedType);
                
                // Note: Not re-rendering to preserve expanded/collapsed section states
            });
        }
        
        // Entity type lock/unlock button for template inheritance
        const lockBtn = document.getElementById('entity-type-lock');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                this.toggleEntityTypeLock();
            });
        }
        
        // Initialize Template dropdown (Advanced mode only)
        this.initializeTemplateDropdown();
        
        // Template preview toggle
        document.getElementById('toggle-template-preview')?.addEventListener('click', () => {
            const body = document.getElementById('template-preview-body');
            const toggle = document.querySelector('.template-preview-toggle');
            if (body && toggle) {
                body.classList.toggle('collapsed');
                toggle.classList.toggle('collapsed');
            }
        });
        
        // Create child mob button
        document.getElementById('create-child-mob')?.addEventListener('click', () => {
            this.showCreateChildMobDialog();
        });
        
        // Detach from template button
        document.getElementById('detach-template')?.addEventListener('click', () => {
            this.detachFromTemplate();
        });
        
        // Child mob chip clicks - navigate to child
        document.querySelectorAll('.child-mob-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const mobName = chip.dataset.mobName;
                if (mobName) {
                    this.navigateToMob(mobName);
                }
            });
        });
        
        // Inheritance chain item clicks - navigate to template
        document.querySelectorAll('.chain-item.exists').forEach(item => {
            item.addEventListener('click', () => {
                const mobName = item.dataset.mobName;
                if (mobName) {
                    this.navigateToMob(mobName);
                }
            });
        });
        
        // Text/number inputs (block and item handled by SearchableDropdown)
        const textFields = [
            'name', 'display', 'health', 'damage', 'armor', 'movementspeed', 'followrange',
            'attackspeed', 'knockbackresistance', 'maxcombatdistance', 'nodamageticks',
            'scale', 'revivehealth', 'age', 'explosionradius', 'fuseticks', 'reinforcementschance',
            'size', 'profession', 'level', 'villagertype', 'horsearmor', 'horsecolor', 'horsestyle',
            'itemhead', 'itembody', 'itemlegs', 'itemfeet', 'itemhand', 'itemoffhand',
            'viewrange', 'width', 'height', 'shadowradius', 'shadowstrength', 'teleportduration',
            'interpolationdelay', 'interpolationduration', 'blocklight', 'skylight', 'coloroverride',
            'translation', 'displayscale', 'leftrotation', 'rightrotation',
            'opacity', 'linewidth', 'backgroundcolor',
            // Phase 1 fields
            'faction',
            // Mannequin fields
            'description', 'player', 'skin', 'cape', 'elytra'
        ];
        
        textFields.forEach(field => {
            const element = document.getElementById(`mob-${field}`);
            if (element) {
                element.addEventListener('input', () => this.updateMob(field, element.value));
            }
        });
        
        // Armor Stand Pose fields
        const poseFields = ['head', 'body', 'leftarm', 'rightarm', 'leftleg', 'rightleg'];
        poseFields.forEach(field => {
            const element = document.getElementById(`mob-pose-${field}`);
            if (element) {
                element.addEventListener('input', () => {
                    if (!this.currentMob.pose) this.currentMob.pose = {};
                    const camelField = field === 'leftarm' ? 'leftArm' : 
                                       field === 'rightarm' ? 'rightArm' :
                                       field === 'leftleg' ? 'leftLeg' :
                                       field === 'rightleg' ? 'rightLeg' : field;
                    this.currentMob.pose[camelField] = element.value;
                    this.syncToFile();
                    this.editor.markDirty();
                });
            }
        });
        
        // Select dropdowns
        const selectFields = ['despawn', 'profession', 'villagertype', 'horsearmor', 'horsecolor', 'horsestyle', 'billboard', 'transform', 'alignment', 'mainhand', 'pose', 'model'];
        selectFields.forEach(field => {
            const element = document.getElementById(`mob-${field}`);
            if (element) {
                element.addEventListener('change', () => this.updateMob(field, element.value));
            }
        });
        
        // Textarea
        const element = document.getElementById('mob-text');
        if (element) {
            element.addEventListener('input', () => this.updateMob('text', element.value));
        }
        
        // Checkboxes - comprehensive list
        const checkboxFields = [
            'alwaysshowname', 'visiblebydefault', 'invisible', 'glowing', 'silent', 'nogravity',
            'collidable', 'interactable', 'lockpitch', 'noai', 'invincible', 'preventvanilladamage',
            'passthroughdamage', 'preventmobkilldrops', 'showhealth', 'preventotherdrops',
            'preventrandomequipment', 'preventitempickup', 'preventleashing', 'preventrenaming',
            'preventsunburn', 'preventtransformation', 'digoutofground', 'healonreload',
            'repeatallskills', 'usethreattable', 'randomizeproperties', 'preventjockeymounts',
            'preventconversion', 'baby', 'adult', 'agelock', 'supercharged', 'preventsuicide',
            'small', 'hasarms', 'hasbaseplate', 'marker', 'hasgravity', 'canmove', 'cantick',
            'hastrades', 'preventslimesplit', 'saddled', 'tamed', 'defaultbackground', 'shadowed', 'seethrough',
            // Mannequin fields
            'immovable', 'hidedescription',
            // Armadillo fields
            'scaredstate'
        ];
        
        checkboxFields.forEach(field => {
            const element = document.getElementById(`mob-${field}`);
            if (element) {
                element.addEventListener('change', () => this.updateMob(field, element.checked));
            }
        });

        // DropOptions - DropMethod change handler
        const dropMethodSelect = document.getElementById('drop-method');
        if (dropMethodSelect) {
            dropMethodSelect.addEventListener('change', (e) => {
                if (!this.currentMob.dropOptions) {
                    this.currentMob.dropOptions = {};
                }
                this.currentMob.dropOptions.DropMethod = e.target.value;
                
                // Show/hide fancy options container
                const fancyContainer = document.getElementById('fancy-drop-options-container');
                if (fancyContainer) {
                    fancyContainer.style.display = e.target.value === 'FANCY' ? '' : 'none';
                }

                // Update badge
                const badge = document.querySelector('.card-title .badge');
                if (badge) {
                    badge.textContent = e.target.value;
                    badge.className = `badge ${e.target.value === 'FANCY' ? 'badge-success' : 'badge-secondary'}`;
                }
            });
        }

        // DropOptions - field change handlers
        document.querySelectorAll('.drop-option-field').forEach(field => {
            const fieldName = field.dataset.field;
            
            field.addEventListener('change', (e) => {
                if (!this.currentMob.dropOptions) {
                    this.currentMob.dropOptions = { DropMethod: 'VANILLA' };
                }

                let value;
                if (field.type === 'checkbox') {
                    value = field.checked;
                } else if (field.type === 'number') {
                    value = field.value !== '' ? parseFloat(field.value) : undefined;
                } else {
                    value = field.value || undefined;
                }

                // Handle nested fields like ItemVFX.Material
                if (fieldName.includes('.')) {
                    const parts = fieldName.split('.');
                    let current = this.currentMob.dropOptions;
                    
                    // Navigate to the parent object, creating it if needed
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]]) {
                            current[parts[i]] = {};
                        }
                        current = current[parts[i]];
                    }
                    
                    // Set the final value
                    const lastPart = parts[parts.length - 1];
                    if (value !== undefined && value !== '') {
                        current[lastPart] = value;
                    } else {
                        delete current[lastPart];
                    }
                } else {
                    // Regular field
                    if (value !== undefined && value !== '') {
                        this.currentMob.dropOptions[fieldName] = value;
                    } else {
                        delete this.currentMob.dropOptions[fieldName];
                    }
                }
                
                this.editor.markDirty();
            });
        });
        
        // DropOptions - stringlist handlers (for HologramMessage and ChatMessage)
        document.querySelectorAll('.stringlist-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldName = e.target.closest('button').dataset.field;
                const container = e.target.closest('.stringlist-editor');
                const itemsContainer = container.querySelector('.stringlist-items');
                
                if (!this.currentMob.dropOptions) {
                    this.currentMob.dropOptions = { DropMethod: 'VANILLA' };
                }
                
                // Initialize array if needed
                if (!Array.isArray(this.currentMob.dropOptions[fieldName])) {
                    this.currentMob.dropOptions[fieldName] = [];
                }
                
                const currentLines = this.currentMob.dropOptions[fieldName];
                const newIndex = currentLines.length;
                
                // Add new line
                currentLines.push('');
                
                // Add DOM element
                const newItem = document.createElement('div');
                newItem.className = 'stringlist-item';
                newItem.dataset.index = newIndex;
                newItem.innerHTML = `
                    <input type="text" class="form-input stringlist-line" value="" placeholder="Enter line ${newIndex + 1}...">
                    <button type="button" class="btn btn-sm btn-danger stringlist-remove" title="Remove line">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                itemsContainer.appendChild(newItem);
                
                // Attach event listeners to the new elements
                this.attachStringlistItemListeners(newItem, fieldName);
                
                this.editor.markDirty();
            });
        });
        
        // Attach listeners to existing stringlist items
        document.querySelectorAll('.stringlist-item').forEach(item => {
            const fieldName = item.closest('.stringlist-editor').dataset.field;
            this.attachStringlistItemListeners(item, fieldName);
        });
        
        // Note: Skills and Drops add buttons are handled by their respective editor components
        // SkillBuilderEditor handles #add-skill-line-btn internally
        // MobDropsEditor handles #add-mobdrop-btn internally
    }
    
    attachStringlistItemListeners(item, fieldName) {
        const input = item.querySelector('.stringlist-line');
        const removeBtn = item.querySelector('.stringlist-remove');
        
        if (input) {
            input.addEventListener('input', (e) => {
                const index = parseInt(item.dataset.index);
                if (!this.currentMob.dropOptions) {
                    this.currentMob.dropOptions = { DropMethod: 'VANILLA' };
                }
                if (!Array.isArray(this.currentMob.dropOptions[fieldName])) {
                    this.currentMob.dropOptions[fieldName] = [];
                }
                this.currentMob.dropOptions[fieldName][index] = e.target.value;
                this.editor.markDirty();
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                if (this.currentMob.dropOptions && Array.isArray(this.currentMob.dropOptions[fieldName])) {
                    this.currentMob.dropOptions[fieldName].splice(index, 1);
                    
                    // Re-render to update indices
                    window.collapsibleManager.saveStates();
                    this.render(this.currentMob);
                    this.editor.markDirty();
                }
            });
        }
    }
    
    updateMob(field, value) {
        if (!this.currentMob) return;
        
        // Track if name field is being updated
        const isNameField = (field === 'name');
        
        // Field name mapping
        const fieldMap = {
            'movementspeed': 'movementSpeed',
            'followrange': 'followRange',
            'attackspeed': 'attackSpeed',
            'knockbackresistance': 'knockbackResistance',
            'alwaysshowname': 'alwaysShowName',
            'visiblebydefault': 'visibleByDefault',
            'nogravity': 'noGravity',
            'lockpitch': 'lockPitch',
            'noai': 'noAI',
            'maxcombatdistance': 'maxCombatDistance',
            'nodamageticks': 'noDamageTicks',
            'passthroughdamage': 'passthroughDamage',
            'preventitempickup': 'preventItemPickup',
            'preventleashing': 'preventLeashing',
            'preventmobkilldrops': 'preventMobKillDrops',
            'preventotherdrops': 'preventOtherDrops',
            'preventrandomequipment': 'preventRandomEquipment',
            'preventrenaming': 'preventRenaming',
            'preventsunburn': 'preventSunburn',
            'preventtransformation': 'preventTransformation',
            'preventvanilladamage': 'preventVanillaDamage',
            'repeatallskills': 'repeatAllSkills',
            'revivehealth': 'reviveHealth',
            'showhealth': 'showHealth',
            'usethreattable': 'useThreatTable',
            'randomizeproperties': 'randomizeProperties',
            'healonreload': 'healOnReload',
            'digoutofground': 'digOutOfGround',
            'preventjockeymounts': 'preventJockeyMounts',
            'preventconversion': 'preventConversion',
            'reinforcementschance': 'reinforcementsChance',
            'agelock': 'ageLock',
            'explosionradius': 'explosionRadius',
            'fuseticks': 'fuseTicks',
            'supercharged': 'superCharged',
            'preventsuicide': 'preventSuicide',
            'hasarms': 'hasArms',
            'hasbaseplate': 'hasBasePlate',
            'hasgravity': 'hasGravity',
            'canmove': 'canMove',
            'cantick': 'canTick',
            'itemhead': 'itemHead',
            'itembody': 'itemBody',
            'itemlegs': 'itemLegs',
            'itemfeet': 'itemFeet',
            'itemhand': 'itemHand',
            'itemoffhand': 'itemOffhand',
            'hastrades': 'hasTrades',
            'villagertype': 'villagerType',
            'preventslimesplit': 'preventSlimeSplit',
            'horsearmor': 'horseArmor',
            'horsecolor': 'horseColor',
            'horsestyle': 'horseStyle',
            'viewrange': 'viewRange',
            'shadowradius': 'shadowRadius',
            'shadowstrength': 'shadowStrength',
            'teleportduration': 'teleportDuration',
            'interpolationdelay': 'interpolationDelay',
            'interpolationduration': 'interpolationDuration',
            'blocklight': 'blockLight',
            'skylight': 'skyLight',
            'coloroverride': 'colorOverride',
            'leftrotation': 'leftRotation',
            'rightrotation': 'rightRotation',
            'displayscale': 'displayScale',
            'linewidth': 'lineWidth',
            'backgroundcolor': 'backgroundColor',
            'defaultbackground': 'defaultBackground',
            'seethrough': 'seeThrough',
            // Mannequin field mappings
            'hidedescription': 'hideDescription',
            'mainhand': 'mainHand',
            // Armadillo field mappings
            'scaredstate': 'scaredState'
        };
        
        const prop = fieldMap[field] || field;
        
        // Convert numeric fields
        const numericFields = [
            'health', 'damage', 'armor', 'movementSpeed', 'followRange', 'attackSpeed',
            'knockbackResistance', 'maxCombatDistance', 'noDamageTicks', 'scale',
            'reviveHealth', 'age', 'explosionRadius', 'fuseTicks', 'reinforcementsChance',
            'size', 'level', 'viewRange', 'width', 'height', 'shadowRadius', 'shadowStrength',
            'teleportDuration', 'interpolationDelay', 'interpolationDuration', 'blockLight',
            'skyLight', 'colorOverride', 'opacity', 'lineWidth', 'backgroundColor'
        ];
        
        if (numericFields.includes(prop)) {
            this.currentMob[prop] = parseFloat(value) || 0;
        } else if (typeof value === 'boolean') {
            this.currentMob[prop] = value;
        } else {
            this.currentMob[prop] = value;
        }
        
        this.syncToFile();
        this.editor.markDirty();
        
        // Update YAML preview to reflect changes immediately
        this.editor.updateYAMLPreview();
        
        // Refresh file tree if name was updated
        if (isNameField) {
            this.editor.packManager.renderPackTree();
        }
    }
    
    // === PHASE 1: Initialize Components ===
    initializePhase1Components() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // Initialize BossBar Editor
        const bossBarContainer = document.getElementById('mob-bossbar-editor');
        if (bossBarContainer) {
            if (!this.bossBarEditor) {
                this.bossBarEditor = new BossBarEditor('mob-bossbar-editor', mob);
                this.bossBarEditor.onChange((bossBar) => {
                    this.currentMob.bossBar = bossBar;
                    this.editor.markDirty();
                });
            }
            this.bossBarEditor.render();
        }
        
        // Initialize Equipment Editor
        const equipmentContainer = document.getElementById('mob-equipment-editor');
        if (equipmentContainer) {
            if (!this.equipmentEditor) {
                this.equipmentEditor = new EquipmentEditor('mob-equipment-editor', mob);
                this.equipmentEditor.onChange((equipment) => {
                    this.currentMob.equipment = equipment;
                    this.editor.markDirty();
                    // Update count badge
                    const badge = document.querySelector('.card-title .fas.fa-tshirt')?.parentElement.querySelector('.count-badge');
                    if (badge) badge.textContent = equipment ? Object.keys(equipment).filter(k => equipment[k]).length : 0;
                });
            }
            this.equipmentEditor.render();
        }
        
        // Initialize Damage Modifiers Editor
        const damageModsContainer = document.getElementById('mob-damagemodifiers-editor');
        if (damageModsContainer) {
            if (!this.damageModifiersEditor) {
                this.damageModifiersEditor = new DamageModifierEditor('mob-damagemodifiers-editor', mob);
                this.damageModifiersEditor.onChange((damageModifiers) => {
                    this.currentMob.damageModifiers = damageModifiers;
                    this.editor.markDirty();
                    // Update count badge
                    const badge = document.querySelector('.card-title .fas.fa-shield')?.parentElement.querySelector('.count-badge');
                    if (badge) badge.textContent = damageModifiers ? Object.keys(damageModifiers).length : 0;
                });
            }
            this.damageModifiersEditor.render();
        }
        
        // Kill Messages event listeners
        document.getElementById('add-killmessage-btn')?.addEventListener('click', () => {
            if (!this.currentMob.killMessages) {
                this.currentMob.killMessages = [];
            }
            this.currentMob.killMessages.push('');
            window.collapsibleManager.saveStates();
            this.render(this.currentMob);
        });
        
        document.querySelectorAll('.killmessage-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (this.currentMob.killMessages && this.currentMob.killMessages[index] !== undefined) {
                    this.currentMob.killMessages[index] = e.target.value;
                    this.editor.markDirty();
                }
            });
        });
        
        document.querySelectorAll('.remove-killmessage-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                if (this.currentMob.killMessages) {
                    this.currentMob.killMessages.splice(index, 1);
                    window.collapsibleManager.saveStates();
                    this.render(this.currentMob);
                }
            });
        });
        
        // Initialize new sections
        this.initializeNewSections();
        
        // Initialize display name (multi-line support)
        this.initializeDisplayNameListeners();
    }
    
    /**
     * Initialize event listeners for advanced display name (multi-line) functionality
     */
    initializeDisplayNameListeners() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // Multi-line toggle checkbox
        const useMultilineCheckbox = document.getElementById('mob-use-multiline');
        if (useMultilineCheckbox) {
            useMultilineCheckbox.addEventListener('change', (e) => {
                const isMultiline = e.target.checked;
                
                // Toggle visibility
                const singleContainer = document.getElementById('display-name-single');
                const multilineContainer = document.getElementById('display-name-multiline');
                
                if (singleContainer) singleContainer.style.display = isMultiline ? 'none' : 'block';
                if (multilineContainer) multilineContainer.style.display = isMultiline ? 'block' : 'none';
                
                // Initialize nameplate config if switching to multiline
                if (isMultiline) {
                    if (!this.currentMob.nameplate) this.currentMob.nameplate = {};
                    this.currentMob.nameplate.enabled = true;
                } else {
                    // Convert multi-line back to single line
                    if (this.currentMob.nameplate) {
                        this.currentMob.nameplate.enabled = false;
                    }
                    const displayLines = document.querySelectorAll('.display-line-input');
                    if (displayLines.length > 0) {
                        const singleInput = document.getElementById('mob-display');
                        if (singleInput) {
                            singleInput.value = displayLines[0]?.value || '';
                            this.currentMob.display = singleInput.value;
                        }
                    }
                }
                
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
        }
        
        // Add display line button
        const addLineBtn = document.getElementById('add-display-line-btn');
        if (addLineBtn) {
            addLineBtn.addEventListener('click', () => {
                const container = document.getElementById('display-lines-container');
                if (!container) return;
                
                const currentLines = container.querySelectorAll('.display-line-row');
                const newIndex = currentLines.length;
                
                // Create new line
                const newLineHtml = this.renderDisplayLine('', newIndex, newIndex + 1);
                container.insertAdjacentHTML('beforeend', newLineHtml);
                
                // Re-attach listeners
                this.attachDisplayLineListeners();
                
                // Update the display value
                this.updateDisplayFromLines();
                
                // Focus the new input
                const newInput = container.querySelector(`.display-line-input[data-line-index="${newIndex}"]`);
                if (newInput) newInput.focus();
            });
        }
        
        // Attach listeners to existing lines
        this.attachDisplayLineListeners();
        
        // Nameplate settings listeners (these work for both standalone and integrated versions)
        const nameplateOffset = document.getElementById('mob-nameplate-offset');
        if (nameplateOffset) {
            nameplateOffset.addEventListener('input', (e) => {
                if (!this.currentMob.nameplate) this.currentMob.nameplate = {};
                this.currentMob.nameplate.offset = parseFloat(e.target.value) || 1.8;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
        }
        
        const nameplateScale = document.getElementById('mob-nameplate-scale');
        if (nameplateScale) {
            nameplateScale.addEventListener('input', (e) => {
                if (!this.currentMob.nameplate) this.currentMob.nameplate = {};
                this.currentMob.nameplate.scale = e.target.value || '1,1,1';
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
        }
        
        const nameplateMounted = document.getElementById('mob-nameplate-mounted');
        if (nameplateMounted) {
            nameplateMounted.addEventListener('change', (e) => {
                if (!this.currentMob.nameplate) this.currentMob.nameplate = {};
                this.currentMob.nameplate.mounted = e.target.checked;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
        }
    }
    
    /**
     * Attach event listeners to display line inputs and remove buttons
     */
    attachDisplayLineListeners() {
        // Input listeners
        document.querySelectorAll('.display-line-input').forEach(input => {
            // Remove existing listener by cloning
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('input', () => {
                this.updateDisplayFromLines();
            });
        });
        
        // Remove line button listeners
        document.querySelectorAll('.remove-display-line').forEach(btn => {
            // Remove existing listener by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const lineRow = e.target.closest('.display-line-row');
                if (lineRow) {
                    lineRow.remove();
                    this.renumberDisplayLines();
                    this.updateDisplayFromLines();
                }
            });
        });
    }
    
    /**
     * Update mob display property from multi-line inputs
     */
    updateDisplayFromLines() {
        const lines = [];
        document.querySelectorAll('.display-line-input').forEach(input => {
            lines.push(input.value);
        });
        
        // Join with \n (literal backslash-n for YAML)
        this.currentMob.display = lines.join('\\n');
        this.editor.markDirty();
        this.editor.updateYAMLPreview();
    }
    
    /**
     * Renumber display lines after removal
     */
    renumberDisplayLines() {
        const container = document.getElementById('display-lines-container');
        if (!container) return;
        
        const lines = container.querySelectorAll('.display-line-row');
        lines.forEach((row, index) => {
            row.dataset.lineIndex = index;
            const lineNum = row.querySelector('.line-number');
            if (lineNum) lineNum.textContent = `${index + 1}.`;
            
            const input = row.querySelector('.display-line-input');
            if (input) input.dataset.lineIndex = index;
            
            const removeBtn = row.querySelector('.remove-display-line');
            if (removeBtn) {
                removeBtn.dataset.lineIndex = index;
                // Show/hide remove button based on total lines
                removeBtn.style.display = lines.length > 1 ? 'flex' : 'none';
            }
        });
    }
    
    /**
     * Initialize event listeners for new sections: Mount, HealthBar, Hearing, Nameplate, Disguise, Trades
     */
    initializeNewSections() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // === HealthBar Section ===
        const healthBarEnabled = document.getElementById('mob-healthbar-enabled');
        if (healthBarEnabled) {
            healthBarEnabled.addEventListener('change', (e) => {
                if (!this.currentMob.healthBar) this.currentMob.healthBar = {};
                this.currentMob.healthBar.enabled = e.target.checked;
                
                // Toggle options visibility
                const options = document.getElementById('healthbar-options');
                if (options) options.style.display = e.target.checked ? 'block' : 'none';
                
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
        }
        
        const healthBarOffset = document.getElementById('mob-healthbar-offset');
        if (healthBarOffset) {
            healthBarOffset.addEventListener('input', (e) => {
                if (!this.currentMob.healthBar) this.currentMob.healthBar = {};
                this.currentMob.healthBar.offset = parseFloat(e.target.value) || 1.45;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
        }
        
        // === Mount Section ===
        this.initializeMountDropdown();
        
        const clearMountBtn = document.getElementById('clear-mount-btn');
        if (clearMountBtn) {
            clearMountBtn.addEventListener('click', () => {
                this.currentMob.mount = '';
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
                window.collapsibleManager.saveStates();
                this.render(this.currentMob);
            });
        }
        
        // === Hearing Section ===
        const hearingEnabled = document.getElementById('mob-hearing-enabled');
        if (hearingEnabled) {
            hearingEnabled.addEventListener('change', (e) => {
                if (!this.currentMob.hearing) this.currentMob.hearing = {};
                this.currentMob.hearing.enabled = e.target.checked;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
                window.collapsibleManager.saveStates();
                this.render(this.currentMob);
            });
        }
        
        // Note: Nameplate settings are now handled by initializeDisplayNameListeners() 
        // as they are integrated into Core Identity section for Advanced mode
        
        // === Disguise Section ===
        const disguiseSelect = document.getElementById('mob-disguise-select');
        if (disguiseSelect) {
            disguiseSelect.addEventListener('change', (e) => {
                if (!this.currentMob.disguiseConfig) this.currentMob.disguiseConfig = {};
                this.currentMob.disguiseConfig.type = e.target.value;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
                window.collapsibleManager.saveStates();
                this.render(this.currentMob);
            });
        }
        
        const clearDisguiseBtn = document.getElementById('clear-disguise-btn');
        if (clearDisguiseBtn) {
            clearDisguiseBtn.addEventListener('click', () => {
                this.currentMob.disguiseConfig = {};
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
                window.collapsibleManager.saveStates();
                this.render(this.currentMob);
            });
        }
        
        // === Trades Section ===
        this.initializeTradesSection();
    }
    
    /**
     * Initialize Mount dropdown with Entity Picker (same as summon mechanic)
     * Includes MythicMobs from pack + Vanilla entity categories
     */
    initializeMountDropdown() {
        this.setupMountEntityPickerHandlers('mob-mount-value');
        // Refresh MythicMobs immediately after setup
        this.refreshMountMythicMobs();
    }
    
    /**
     * Create entity picker HTML for mount selection (same pattern as mechanicBrowser)
     */
    createMountEntityPickerHTML(inputId) {
        // Get custom MythicMobs from the current pack
        const customMobs = this.getCustomMythicMobs();
        
        // Categorize entities (same as mechanicBrowser)
        const categories = {
            'Hostile': ['ZOMBIE', 'SKELETON', 'SPIDER', 'CAVE_SPIDER', 'CREEPER', 'ENDERMAN', 'WITCH', 'SLIME', 
                       'MAGMA_CUBE', 'BLAZE', 'GHAST', 'ZOMBIFIED_PIGLIN', 'HOGLIN', 'PIGLIN', 'PIGLIN_BRUTE',
                       'WITHER_SKELETON', 'STRAY', 'HUSK', 'DROWNED', 'PHANTOM', 'SILVERFISH', 'ENDERMITE',
                       'VINDICATOR', 'EVOKER', 'VEX', 'PILLAGER', 'RAVAGER', 'GUARDIAN', 'ELDER_GUARDIAN',
                       'SHULKER', 'ZOGLIN', 'WARDEN', 'BOGGED', 'BREEZE'],
            'Passive': ['PIG', 'COW', 'SHEEP', 'CHICKEN', 'RABBIT', 'HORSE', 'DONKEY', 'MULE', 'LLAMA',
                       'TRADER_LLAMA', 'CAT', 'OCELOT', 'WOLF', 'PARROT', 'BAT', 'VILLAGER', 'WANDERING_TRADER',
                       'COD', 'SALMON', 'TROPICAL_FISH', 'PUFFERFISH', 'SQUID', 'GLOW_SQUID', 'DOLPHIN',
                       'TURTLE', 'POLAR_BEAR', 'PANDA', 'FOX', 'BEE', 'MOOSHROOM', 'STRIDER', 'AXOLOTL',
                       'GOAT', 'FROG', 'TADPOLE', 'CAMEL', 'SNIFFER', 'ARMADILLO', 'ALLAY'],
            'Utility': ['IRON_GOLEM', 'SNOW_GOLEM', 'ARMOR_STAND', 'ITEM_DISPLAY', 'BLOCK_DISPLAY',
                       'TEXT_DISPLAY', 'INTERACTION', 'MARKER'],
            'Bosses': ['ENDER_DRAGON', 'WITHER']
        };
        
        // Add MythicMobs category if we have custom mobs
        if (customMobs.length > 0) {
            categories['MythicMobs'] = customMobs;
        }

        return `
            <div class="entity-picker-container" data-input-id="${inputId}">
                <!-- Selected Entity Display -->
                <div class="entity-chips-container" style="display: none;">
                    <div class="entity-chips"></div>
                    <button type="button" class="btn-clear-entities">
                        Clear
                    </button>
                </div>

                <!-- Entity Search -->
                <div class="entity-search-container">
                    <input type="text" 
                           class="entity-search-input" 
                           placeholder="🔍 Search entities or type custom mob name and press Enter...">
                    <small class="entity-search-hint">Type any entity name and press <kbd>Enter</kbd> to add</small>
                </div>

                <!-- Entity Browser -->
                <div class="entity-browser">
                    ${Object.entries(categories).map(([category, entities]) => `
                        <div class="entity-category" data-category="${category}">
                            <div class="entity-category-header">
                                ${category === 'MythicMobs' ? '🔮 ' : ''}${category} (${entities.length})
                            </div>
                            <div class="entity-grid">
                                ${entities.map(entity => `
                                    <button type="button" 
                                            class="entity-item ${category === 'MythicMobs' ? 'mythicmob-item' : ''}" 
                                            data-entity="${entity}">
                                        ${entity}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Refresh MythicMobs category in the mount entity picker
     * Called when mount section is expanded to get latest mobs
     */
    refreshMountMythicMobs() {
        const container = document.querySelector('.entity-picker-container[data-input-id="mob-mount-value"]');
        if (!container) return;

        const customMobs = this.getCustomMythicMobs();
        const entityBrowser = container.querySelector('.entity-browser');
        if (!entityBrowser) return;

        // Find or create MythicMobs category
        let mythicCategory = entityBrowser.querySelector('.entity-category[data-category="MythicMobs"]');
        
        if (customMobs.length > 0) {
            const categoryHTML = `
                <div class="entity-category" data-category="MythicMobs">
                    <div class="entity-category-header">
                        🔮 MythicMobs (${customMobs.length})
                    </div>
                    <div class="entity-grid">
                        ${customMobs.map(entity => `
                            <button type="button" 
                                    class="entity-item mythicmob-item" 
                                    data-entity="${entity}">
                                ${entity}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            if (mythicCategory) {
                // Update existing category
                mythicCategory.outerHTML = categoryHTML;
            } else {
                // Add new category at the top
                entityBrowser.insertAdjacentHTML('afterbegin', categoryHTML);
            }
        } else if (mythicCategory) {
            // Remove category if no mobs
            mythicCategory.remove();
        }
    }

    /**
     * Setup entity picker event handlers for mount selection
     */
    setupMountEntityPickerHandlers(inputId) {
        const container = document.querySelector(`.entity-picker-container[data-input-id="${inputId}"]`);
        if (!container) return;

        const input = document.getElementById(inputId);
        const searchInput = container.querySelector('.entity-search-input');
        const chipsContainer = container.querySelector('.entity-chips');
        const chipsWrapper = container.querySelector('.entity-chips-container');
        const clearBtn = container.querySelector('.btn-clear-entities');

        // Track selected entity (mount only allows one)
        let selectedEntity = input.value.trim() || '';

        // Initialize from existing input value
        if (selectedEntity) {
            this.updateMountEntityChip(chipsContainer, chipsWrapper, selectedEntity, input);
        }
        
        // Refresh MythicMobs when mount section is expanded
        const mountCard = container.closest('.collapsible-card[data-mob-field="Mount"]');
        if (mountCard) {
            const header = mountCard.querySelector('.collapsible-header');
            if (header) {
                header.addEventListener('click', () => {
                    // Refresh after a small delay to let the section expand
                    setTimeout(() => {
                        if (!mountCard.classList.contains('collapsed')) {
                            this.refreshMountMythicMobs();
                        }
                    }, 50);
                });
            }
        }

        // Entity item click handler
        container.addEventListener('click', (e) => {
            const entityBtn = e.target.closest('.entity-item');
            if (entityBtn) {
                const entity = entityBtn.dataset.entity;
                selectedEntity = entity;
                input.value = entity;
                this.updateMountEntityChip(chipsContainer, chipsWrapper, selectedEntity, input);
                
                // Update mob data
                this.currentMob.mount = entity;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
                window.collapsibleManager.saveStates();
                this.render(this.currentMob);
            }
        });

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                selectedEntity = '';
                input.value = '';
                this.updateMountEntityChip(chipsContainer, chipsWrapper, '', input);
                
                // Clear mob mount
                this.currentMob.mount = '';
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
                window.collapsibleManager.saveStates();
                this.render(this.currentMob);
            });
        }

        // Enter key to add custom entity
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const customName = searchInput.value.trim();
                if (customName) {
                    selectedEntity = customName;
                    input.value = customName;
                    this.updateMountEntityChip(chipsContainer, chipsWrapper, selectedEntity, input);
                    searchInput.value = '';
                    
                    // Reset search filter
                    const categories = container.querySelectorAll('.entity-category');
                    categories.forEach(cat => cat.style.display = '');
                    container.querySelectorAll('.entity-item').forEach(item => item.style.display = '');
                    
                    // Update mob data
                    this.currentMob.mount = customName;
                    this.editor.markDirty();
                    this.editor.updateYAMLPreview();
                    window.collapsibleManager.saveStates();
                    this.render(this.currentMob);
                }
            }
        });

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const categories = container.querySelectorAll('.entity-category');
            
            categories.forEach(category => {
                const items = category.querySelectorAll('.entity-item');
                let visibleCount = 0;
                
                items.forEach(item => {
                    const entityName = item.dataset.entity.toLowerCase();
                    if (entityName.includes(query)) {
                        item.style.display = '';
                        visibleCount++;
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Hide category if no visible items
                category.style.display = visibleCount > 0 ? '' : 'none';
            });
        });
    }

    /**
     * Update mount entity chip display
     */
    updateMountEntityChip(chipsContainer, chipsWrapper, entity, input) {
        if (!chipsContainer) return;
        
        if (entity) {
            chipsWrapper.style.display = 'flex';
            chipsContainer.innerHTML = `
                <span class="entity-chip">
                    ${entity}
                    <button type="button" class="chip-remove" data-entity="${entity}">×</button>
                </span>
            `;
            
            // Add remove handler
            const removeBtn = chipsContainer.querySelector('.chip-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    input.value = '';
                    chipsWrapper.style.display = 'none';
                    chipsContainer.innerHTML = '';
                    
                    // Clear mob mount
                    this.currentMob.mount = '';
                    this.editor.markDirty();
                    this.editor.updateYAMLPreview();
                    window.collapsibleManager.saveStates();
                    this.render(this.currentMob);
                });
            }
        } else {
            chipsWrapper.style.display = 'none';
            chipsContainer.innerHTML = '';
        }
    }

    /**
     * Get custom MythicMobs from the current pack (same as mechanicBrowser)
     */
    getCustomMythicMobs() {
        try {
            // Try multiple paths to access packManager (same as mechanicBrowser)
            let packManager = null;
            
            // Path 1: this.editor.packManager
            if (this.editor?.packManager) {
                packManager = this.editor.packManager;
            }
            // Path 2: window.editor.packManager (global editor instance)
            else if (window.editor?.packManager) {
                packManager = window.editor.packManager;
            }
            // Path 3: window.app.packManager (fallback)
            else if (window.app?.packManager) {
                packManager = window.app.packManager;
            }
            
            if (!packManager) {
                return [];
            }
            
            const activePack = packManager.activePack;
            if (!activePack || !activePack.mobs) {
                return [];
            }
            
            const customMobs = [];
            const currentMobName = this.currentMob?.name || this.currentMob?.internalName;
            
            // Check if using file-based structure
            if (Array.isArray(activePack.mobs) && activePack.mobs.length > 0) {
                if (activePack.mobs[0].entries !== undefined) {
                    // File-based structure
                    activePack.mobs.forEach(file => {
                        if (file.entries && Array.isArray(file.entries)) {
                            file.entries.forEach(mob => {
                                const mobName = mob.internalName || mob.name;
                                if (mobName && mobName !== currentMobName) {
                                    customMobs.push(mobName);
                                }
                            });
                        }
                    });
                } else {
                    // Legacy structure
                    activePack.mobs.forEach(mob => {
                        const mobName = mob.internalName || mob.name;
                        if (mobName && mobName !== currentMobName) {
                            customMobs.push(mobName);
                        }
                    });
                }
            }
            
            // Sort alphabetically and remove duplicates
            return [...new Set(customMobs)].sort((a, b) => a.localeCompare(b));
        } catch (err) {
            console.error('Error getting custom MythicMobs:', err);
            return [];
        }
    }
    
    /**
    
    /**
     * Initialize Trades section with item selectors
     */
    initializeTradesSection() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // Only for tradeable entities
        const entityType = (mob.type || '').toUpperCase();
        const tradeableEntities = ['VILLAGER', 'WANDERING_TRADER'];
        if (!tradeableEntities.includes(entityType)) return;
        
        // Initialize trades object if needed
        if (!mob.trades) mob.trades = {};
        
        // Add Trade button
        const addTradeBtn = document.getElementById('add-trade-btn');
        if (addTradeBtn) {
            addTradeBtn.addEventListener('click', () => {
                const tradeKeys = Object.keys(mob.trades);
                const newKey = (tradeKeys.length + 1).toString();
                
                mob.trades[newKey] = {
                    Item1: '1 EMERALD',
                    Item2: '',
                    Result: '1 STONE',
                    MaxUses: 10000
                };
                
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
                window.collapsibleManager.saveStates();
                this.render(this.currentMob);
            });
        }
        
        // Remove trade buttons
        document.querySelectorAll('.remove-trade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                const tradeKeys = Object.keys(mob.trades);
                const keyToRemove = tradeKeys[index];
                
                if (keyToRemove) {
                    delete mob.trades[keyToRemove];
                    // Reindex trades
                    const newTrades = {};
                    Object.values(mob.trades).forEach((trade, i) => {
                        newTrades[(i + 1).toString()] = trade;
                    });
                    mob.trades = newTrades;
                    
                    this.editor.markDirty();
                    this.editor.updateYAMLPreview();
                    window.collapsibleManager.saveStates();
                    this.render(this.currentMob);
                }
            });
        });
        
        // Initialize item dropdowns for each trade
        this.initializeTradeItemDropdowns();
        
        // Amount and MaxUses inputs
        document.querySelectorAll('.trade-amount, .trade-max-uses').forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateTradeFromInputs();
            });
        });
    }
    
    /**
     * Initialize item dropdowns for trades using material browser
     */
    initializeTradeItemDropdowns() {
        const mob = this.currentMob;
        const tradeKeys = Object.keys(mob.trades || {});
        
        tradeKeys.forEach((key, index) => {
            const trade = mob.trades[key];
            
            // Item1 dropdown
            this.initializeTradeItemInput(`trade-item1-${index}`, trade.Item1 || trade.item1, (value) => {
                const parts = (trade.Item1 || trade.item1 || '').split(' ');
                const amount = parts.length >= 2 && !isNaN(parseInt(parts[0])) ? parts[0] : '1';
                mob.trades[key].Item1 = `${amount} ${value}`;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
            
            // Item2 dropdown (optional)
            this.initializeTradeItemInput(`trade-item2-${index}`, trade.Item2 || trade.item2, (value) => {
                if (value) {
                    const parts = (trade.Item2 || trade.item2 || '').split(' ');
                    const amount = parts.length >= 2 && !isNaN(parseInt(parts[0])) ? parts[0] : '1';
                    mob.trades[key].Item2 = `${amount} ${value}`;
                } else {
                    mob.trades[key].Item2 = '';
                }
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
            
            // Result dropdown
            this.initializeTradeItemInput(`trade-result-${index}`, trade.Result || trade.result, (value) => {
                const parts = (trade.Result || trade.result || '').split(' ');
                const amount = parts.length >= 2 && !isNaN(parseInt(parts[0])) ? parts[0] : '1';
                mob.trades[key].Result = `${amount} ${value}`;
                this.editor.markDirty();
                this.editor.updateYAMLPreview();
            });
        });
    }
    
    /**
     * Initialize a single trade item input with autocomplete
     */
    initializeTradeItemInput(containerId, currentValue, onChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Parse current value to get item name
        const parts = (currentValue || '').trim().split(' ');
        const itemName = parts.length >= 2 && !isNaN(parseInt(parts[0])) ? parts.slice(1).join(' ') : currentValue;
        
        // Get Minecraft items and MythicItems
        const minecraftItems = (window.MINECRAFT_ITEMS || []).map(i => i.toUpperCase());
        const mythicItems = this.getMythicItems();
        
        container.innerHTML = `
            <input type="text" class="form-input trade-item-input" 
                   value="${this.escapeHtml(itemName || '')}" 
                   placeholder="Search items..."
                   autocomplete="off">
            <div class="trade-item-dropdown" style="display: none;"></div>
        `;
        
        const input = container.querySelector('.trade-item-input');
        const dropdown = container.querySelector('.trade-item-dropdown');
        
        const updateDropdown = (query = '') => {
            const q = query.toLowerCase();
            let html = '';
            
            // MythicItems first
            const filteredMythic = mythicItems.filter(i => i.toLowerCase().includes(q));
            if (filteredMythic.length > 0) {
                html += `<div class="trade-dropdown-category">MythicItems</div>`;
                html += filteredMythic.slice(0, 10).map(item => `
                    <div class="trade-dropdown-item mythicitem" data-value="${item}">
                        <i class="fas fa-star" style="color: #f97316;"></i> ${item}
                    </div>
                `).join('');
            }
            
            // Minecraft items
            const filteredMaterials = minecraftItems.filter(m => m.toLowerCase().includes(q));
            if (filteredMaterials.length > 0) {
                html += `<div class="trade-dropdown-category">Minecraft Items</div>`;
                html += filteredMaterials.slice(0, 20).map(item => `
                    <div class="trade-dropdown-item" data-value="${item}">${item}</div>
                `).join('');
            }
            
            dropdown.innerHTML = html || '<div class="trade-dropdown-empty">No items found</div>';
            
            // Click handlers
            dropdown.querySelectorAll('.trade-dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.dataset.value;
                    input.value = value;
                    dropdown.style.display = 'none';
                    onChange(value);
                });
            });
        };
        
        input.addEventListener('focus', () => {
            updateDropdown(input.value);
            dropdown.style.display = 'block';
        });
        
        input.addEventListener('input', () => {
            updateDropdown(input.value);
            dropdown.style.display = 'block';
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.style.display = 'none';
                onChange(input.value);
            }, 200);
        });
    }
    
    /**
     * Get list of MythicItems from current pack
     */
    getMythicItems() {
        const items = [];
        if (this.editor.state.currentPack?.items) {
            this.editor.state.currentPack.items.forEach(file => {
                if (file.entries) {
                    file.entries.forEach(item => {
                        if (item.internalName) items.push(item.internalName);
                    });
                }
            });
        }
        return items;
    }
    
    /**
     * Update trade data from all inputs
     */
    updateTradeFromInputs() {
        const mob = this.currentMob;
        const tradeKeys = Object.keys(mob.trades || {});
        
        tradeKeys.forEach((key, index) => {
            const trade = mob.trades[key];
            
            // Get amounts
            const item1Amount = document.querySelector(`[data-field="item1-amount"][data-index="${index}"]`)?.value || '1';
            const item2Amount = document.querySelector(`[data-field="item2-amount"][data-index="${index}"]`)?.value || '';
            const resultAmount = document.querySelector(`[data-field="result-amount"][data-index="${index}"]`)?.value || '1';
            const maxUses = document.querySelector(`.trade-max-uses[data-index="${index}"]`)?.value || '10000';
            
            // Get item names from inputs
            const item1Name = document.querySelector(`#trade-item1-${index} .trade-item-input`)?.value || '';
            const item2Name = document.querySelector(`#trade-item2-${index} .trade-item-input`)?.value || '';
            const resultName = document.querySelector(`#trade-result-${index} .trade-item-input`)?.value || '';
            
            // Update trade
            trade.Item1 = item1Name ? `${item1Amount} ${item1Name}` : '';
            trade.Item2 = item2Name && item2Amount ? `${item2Amount} ${item2Name}` : '';
            trade.Result = resultName ? `${resultAmount} ${resultName}` : '';
            trade.MaxUses = parseInt(maxUses) || 10000;
        });
        
        this.editor.markDirty();
        this.editor.updateYAMLPreview();
    }

    initializePhase2Components() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // Initialize AI Goals Editor
        // Always create fresh instance since DOM is re-rendered each time
        const aiGoalsContainer = document.getElementById('mob-ai-goals-editor');
        if (aiGoalsContainer) {
            this.aiGoalsEditor = new AIEditor('mob-ai-goals-editor', 'goals', mob);
            this.aiGoalsEditor.onChange((goals) => {
                this.currentMob.aiGoalSelectors = goals;
                this.editor.markDirty();
                // Update count badge
                const badge = document.querySelector('.card-title .fas.fa-brain')?.parentElement.querySelector('.count-badge');
                if (badge) badge.textContent = goals ? goals.length : 0;
            });
            this.aiGoalsEditor.setValue(mob.aiGoalSelectors || []);
        } else {
            this.aiGoalsEditor = null;
        }
        
        // Initialize AI Targets Editor
        // Always create fresh instance since DOM is re-rendered each time
        const aiTargetsContainer = document.getElementById('mob-ai-targets-editor');
        if (aiTargetsContainer) {
            this.aiTargetsEditor = new AIEditor('mob-ai-targets-editor', 'targets', mob);
            this.aiTargetsEditor.onChange((targets) => {
                this.currentMob.aiTargetSelectors = targets;
                this.editor.markDirty();
                // Update count badge
                const badge = document.querySelector('.card-title .fas.fa-crosshairs')?.parentElement.querySelector('.count-badge');
                if (badge) badge.textContent = targets ? targets.length : 0;
            });
            this.aiTargetsEditor.setValue(mob.aiTargetSelectors || []);
        } else {
            this.aiTargetsEditor = null;
        }
        
        // Modules checkboxes
        document.getElementById('module-threattable')?.addEventListener('change', (e) => {
            if (!this.currentMob.modules) this.currentMob.modules = {};
            this.currentMob.modules.threatTable = e.target.checked;
            this.editor.markDirty();
        });
        
        document.getElementById('module-immunitytable')?.addEventListener('change', (e) => {
            if (!this.currentMob.modules) this.currentMob.modules = {};
            this.currentMob.modules.immunityTable = e.target.checked;
            this.editor.markDirty();
        });
    }
    
    initializePhase3Components() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // Initialize Vanilla Overrides Editor
        const vanillaOverridesContainer = document.getElementById('mob-vanilla-overrides-editor');
        if (vanillaOverridesContainer) {
            if (!this.vanillaOverridesEditor) {
                this.vanillaOverridesEditor = new VanillaOverridesEditor('mob-vanilla-overrides-editor', mob);
                this.vanillaOverridesEditor.onChange((disguise) => {
                    this.currentMob.disguise = disguise;
                    this.editor.markDirty();
                    // Update count badge
                    const badge = document.querySelector('.card-title .fas.fa-ghost')?.parentElement.querySelector('.count-badge');
                    if (badge) badge.textContent = disguise?.types?.length || 0;
                });
            } else {
                this.vanillaOverridesEditor.setValue(mob.disguise || null);
            }
        }
        
        // Level Modifiers event listeners
        const levelModifierFields = [
            { id: 'level-health', key: 'health' },
            { id: 'level-damage', key: 'damage' },
            { id: 'level-power', key: 'power' },
            { id: 'level-armor', key: 'armor' },
            { id: 'level-knockback', key: 'knockbackResistance' },
            { id: 'level-movement', key: 'movementSpeed' }
        ];
        
        levelModifierFields.forEach(({ id, key }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    if (!this.currentMob.levelModifiers) {
                        this.currentMob.levelModifiers = {};
                    }
                    const value = parseFloat(e.target.value) || 0;
                    this.currentMob.levelModifiers[key] = value;
                    this.editor.markDirty();
                    this.updateLevelPreview();
                });
            }
        });
        
        // Level preview input
        const previewInput = document.getElementById('level-preview-input');
        if (previewInput) {
            previewInput.addEventListener('input', () => {
                this.updateLevelPreview();
            });
            this.updateLevelPreview();
        }
    }
    
    updateLevelPreview() {
        const previewStats = document.getElementById('level-preview-stats');
        const previewInput = document.getElementById('level-preview-input');
        if (!previewStats || !previewInput) return;
        
        const level = parseInt(previewInput.value) || 1;
        const mob = this.currentMob;
        const lm = mob.levelModifiers || {};
        
        // Calculate stats at selected level
        const baseHealth = parseFloat(mob.health) || 10;
        const baseDamage = parseFloat(mob.damage) || 1;
        const baseSpeed = parseFloat(mob.options?.movementSpeed) || 0.3;
        
        const health = baseHealth + ((lm.health || 0) * level);
        const damage = baseDamage + ((lm.damage || 0) * level);
        const power = (lm.power || 0) * level;
        const armor = (lm.armor || 0) * level;
        const knockback = Math.min(1.0, (lm.knockbackResistance || 0) * level);
        const speed = baseSpeed + ((lm.movementSpeed || 0) * level);
        
        previewStats.innerHTML = `
            <strong>Health:</strong> ${health.toFixed(1)} • 
            <strong>Damage:</strong> ${damage.toFixed(1)} • 
            <strong>Power:</strong> ${power.toFixed(1)} • 
            <strong>Armor:</strong> ${armor.toFixed(1)} • 
            <strong>KB Res:</strong> ${knockback.toFixed(2)} • 
            <strong>Speed:</strong> ${speed.toFixed(2)}
        `;
    }
    
    initializePhase4Components() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // Initialize Trigger Browser
        if (!this.triggerBrowser) {
            this.triggerBrowser = new TriggerBrowser(this.editor);
        }
        
        // Initialize Targeter Browser
        if (!this.targeterBrowser) {
            this.targeterBrowser = new TargeterBrowser();
        }
        
        // No longer need to initialize condition editor - using global V2 browser
        
        // Initialize Mechanic Browser
        if (!this.mechanicBrowser) {
            this.mechanicBrowser = new MechanicBrowser(
                this.targeterBrowser,
                this.triggerBrowser,
                null  // Using global conditionBrowserV2 instead
            );
        }
        
        // Initialize Skills Editor
        const skillsContainer = document.getElementById('mob-skills-editor');
        if (skillsContainer) {
            // Always recreate since DOM was recreated on render
            this.skillsEditor = new SkillBuilderEditor(
                skillsContainer,
                this.targeterBrowser,
                this.mechanicBrowser,
                this.triggerBrowser,
                null,  // Using global conditionBrowserV2 instead
                window.templateManager,
                window.templateEditor
            );
            this.skillsEditor.setContext('mob');
            this.skillsEditor.setValue(mob.skills || []);
            this.skillsEditor.onChange((skillLines) => {
                this.currentMob.skills = skillLines;
                this.syncToFile();
                this.editor.markDirty();
                // Update count badge
                const badge = document.querySelector('.card-title .fas.fa-magic')?.parentElement.querySelector('.count-badge');
                if (badge) badge.textContent = skillLines ? skillLines.length : 0;
            });
        }
        
        // Initialize Drops Editor
        const dropsContainer = document.getElementById('mob-drops-editor');
        if (dropsContainer) {
            // Always recreate since DOM was recreated on render
            this.dropsEditor = new MobDropsEditor('mob-drops-editor', mob.drops || []);
            this.dropsEditor.onChange((drops) => {
                this.currentMob.drops = drops;
                this.editor.markDirty();
                // Update count badge
                const badge = document.querySelector('.card-title .fas.fa-box')?.parentElement.querySelector('.count-badge');
                if (badge) badge.textContent = drops ? drops.length : 0;
            });
        }
        
        // Initialize Totem handlers
        this.attachTotemHandlers(mob);
        

    }
    
    /**
     * Attach totem section event handlers
     */
    attachTotemHandlers(mob) {
        // Add handler for when Totem Summoning section is expanded
        const totemSection = document.getElementById('totem-section');
        if (totemSection) {
            const header = totemSection.querySelector('.collapsible-header');
            if (header) {
                header.addEventListener('click', () => {
                    // When totem section is opened, ensure templates and dropdowns are rendered
                    setTimeout(() => {
                        // Render templates
                        if (this.TOTEM_TEMPLATES) {
                            this.renderTotemTemplates(this.TOTEM_TEMPLATES);
                        }
                        
                        // Initialize head dropdown if not already done
                        const headContainer = document.getElementById('totem-head-dropdown');
                        if (headContainer && !headContainer.querySelector('.searchable-dropdown')) {
                            const headBlock = mob?.totem?.head || mob?.totem?.Head || mob?.Totem?.head || mob?.Totem?.Head || 'PLAYER_HEAD';
                            if (window.MINECRAFT_ITEMS && typeof SearchableDropdown !== 'undefined') {
                                try {
                                    new SearchableDropdown('totem-head-dropdown', {
                                        categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : null,
                                        items: !window.getCombinedItemCategories ? window.MINECRAFT_ITEMS : null,
                                        useIcons: true,
                                        storageKey: 'totem-head-material',
                                        placeholder: 'Search trigger block...',
                                        value: headBlock,
                                        onSelect: (value) => {
                                            if (!mob.totem) mob.totem = {};
                                            mob.totem.Head = value;
                                            this.updateTotemPreview(mob);
                                            this.editor.markDirty();
                                            this.editor.updateYAMLPreview();
                                        }
                                    });
                                } catch(e) {
                                    console.error('Failed to init head dropdown on expand:', e);
                                }
                            }
                        }
                        
                        // Initialize paint dropdown if not already done
                        const paintContainer = document.getElementById('totem-paint-material-dropdown');
                        if (paintContainer && !paintContainer.querySelector('.searchable-dropdown')) {
                            if (window.MINECRAFT_ITEMS && typeof SearchableDropdown !== 'undefined') {
                                try {
                                    new SearchableDropdown('totem-paint-material-dropdown', {
                                        categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : null,
                                        items: !window.getCombinedItemCategories ? window.MINECRAFT_ITEMS : null,
                                        useIcons: true,
                                        storageKey: 'totem-paint-material',
                                        placeholder: 'Search paint material...',
                                        value: this.totemGridState.currentMaterial,
                                        onSelect: (value) => {
                                            this.totemGridState.currentMaterial = value;
                                            this.addToRecentMaterials(value);
                                            this.renderRecentMaterials();
                                        }
                                    });
                                } catch(e) {
                                    console.error('Failed to init paint dropdown on expand:', e);
                                }
                            }
                        }
                    }, 150);
                });
            }
        }
        
        // Initialize totem renderer
        const canvas = document.getElementById('totem-preview-canvas');
        if (canvas) {
            // Ensure Totem Renderer class is available
            if (typeof TotemRenderer === 'undefined') {
                console.error('TotemRenderer class not loaded');
                return;
            }
            
            if (!this.totemRenderer) {
                this.totemRenderer = new TotemRenderer('totem-preview-canvas');
            }
            
            // Initial render
            this.updateTotemPreview(mob);
        }

        // Initialize totem visual builder state
        if (!this.totemGridState) {
            this.totemGridState = {
                currentView: 'top',
                currentY: 0,
                currentMaterial: 'PLAYER_HEAD',
                gridSize: 7,
                blocks: new Map(), // key: "x,y,z", value: "MATERIAL"
                history: [], // Undo history
                historyIndex: -1, // Current position in history
                recentMaterials: ['PLAYER_HEAD', 'GOLD_BLOCK', 'DIAMOND_BLOCK', 'EMERALD_BLOCK', 'IRON_BLOCK'], // Recent materials palette
                symmetryMode: false // Symmetry painting mode
            };
        }
        
        // Totem templates library (store as instance property for later access)
        this.TOTEM_TEMPLATES = {
            't_shape': {
                name: 'T-Shape',
                icon: '⊤',
                description: 'Classic T totem',
                pattern: [
                    '0,0,0 PLAYER_HEAD',
                    '-1,0,0 GOLD_BLOCK',
                    '1,0,0 GOLD_BLOCK',
                    '0,-1,0 GOLD_BLOCK',
                    '0,-2,0 GOLD_BLOCK'
                ]
            },
            'cross': {
                name: 'Cross',
                icon: '✚',
                description: '3D cross shape',
                pattern: [
                    '0,0,0 PLAYER_HEAD',
                    '1,0,0 DIAMOND_BLOCK',
                    '-1,0,0 DIAMOND_BLOCK',
                    '0,1,0 DIAMOND_BLOCK',
                    '0,-1,0 DIAMOND_BLOCK',
                    '0,0,1 DIAMOND_BLOCK',
                    '0,0,-1 DIAMOND_BLOCK'
                ]
            },
            'pillar': {
                name: 'Pillar',
                icon: '▌',
                description: 'Vertical tower',
                pattern: [
                    '0,0,0 PLAYER_HEAD',
                    '0,-1,0 GOLD_BLOCK',
                    '0,-2,0 GOLD_BLOCK',
                    '0,-3,0 GOLD_BLOCK',
                    '0,-4,0 GOLD_BLOCK'
                ]
            },
            'platform': {
                name: 'Platform',
                icon: '▢',
                description: '3x3 square',
                pattern: [
                    '0,0,0 PLAYER_HEAD',
                    '-1,0,-1 EMERALD_BLOCK', '0,0,-1 EMERALD_BLOCK', '1,0,-1 EMERALD_BLOCK',
                    '-1,0,0 EMERALD_BLOCK', '1,0,0 EMERALD_BLOCK',
                    '-1,0,1 EMERALD_BLOCK', '0,0,1 EMERALD_BLOCK', '1,0,1 EMERALD_BLOCK'
                ]
            },
            'pyramid': {
                name: 'Pyramid',
                icon: '▲',
                description: 'Small pyramid',
                pattern: [
                    '0,0,0 PLAYER_HEAD',
                    // Layer -1
                    '-1,-1,-1 GOLD_BLOCK', '0,-1,-1 GOLD_BLOCK', '1,-1,-1 GOLD_BLOCK',
                    '-1,-1,0 GOLD_BLOCK', '0,-1,0 GOLD_BLOCK', '1,-1,0 GOLD_BLOCK',
                    '-1,-1,1 GOLD_BLOCK', '0,-1,1 GOLD_BLOCK', '1,-1,1 GOLD_BLOCK',
                    // Layer -2
                    '-1,-2,-1 DIAMOND_BLOCK', '0,-2,-1 DIAMOND_BLOCK', '1,-2,-1 DIAMOND_BLOCK',
                    '-1,-2,0 DIAMOND_BLOCK', '1,-2,0 DIAMOND_BLOCK',
                    '-1,-2,1 DIAMOND_BLOCK', '0,-2,1 DIAMOND_BLOCK', '1,-2,1 DIAMOND_BLOCK'
                ]
            },
            'ring': {
                name: 'Ring',
                icon: '◯',
                description: 'Circular ring',
                pattern: [
                    '0,0,0 PLAYER_HEAD',
                    // Ring around center
                    '-1,0,-1 IRON_BLOCK', '0,0,-1 IRON_BLOCK', '1,0,-1 IRON_BLOCK',
                    '-1,0,0 IRON_BLOCK', '1,0,0 IRON_BLOCK',
                    '-1,0,1 IRON_BLOCK', '0,0,1 IRON_BLOCK', '1,0,1 IRON_BLOCK',
                    // Second layer
                    '-1,-1,-1 IRON_BLOCK', '0,-1,-1 IRON_BLOCK', '1,-1,-1 IRON_BLOCK',
                    '-1,-1,0 IRON_BLOCK', '1,-1,0 IRON_BLOCK',
                    '-1,-1,1 IRON_BLOCK', '0,-1,1 IRON_BLOCK', '1,-1,1 IRON_BLOCK'
                ]
            }
        };
        
        // Defer totem initialization until section is expanded
        // This prevents warnings about missing DOM elements
        this.totemInitialized = false;

        // Load existing pattern into grid state
        const pattern = mob?.totem?.Pattern || mob?.Totem?.Pattern || [];
        this.totemGridState.blocks.clear();
        pattern.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const coords = parts[0];
            const material = parts.slice(1).join(' ');
            this.totemGridState.blocks.set(coords, material);
        });

        // Skip head dropdown initialization - will be done when section is expanded

        // Initialize Paint material SearchableDropdown
        setTimeout(() => {
            const paintContainer = document.getElementById('totem-paint-material-dropdown');
            if (paintContainer && window.MINECRAFT_ITEMS) {
                paintContainer.innerHTML = '';
                new SearchableDropdown('totem-paint-material-dropdown', {
                    categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : null,
                    items: !window.getCombinedItemCategories ? window.MINECRAFT_ITEMS : null,
                    useIcons: true,
                    storageKey: 'totem-paint-material',
                    placeholder: 'Search paint material...',
                    value: this.totemGridState.currentMaterial,
                    onSelect: (value) => {
                        this.totemGridState.currentMaterial = value;
                    }
                });
            }
        }, 100);

        // View switcher buttons
        document.querySelectorAll('.totem-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const view = btn.dataset.view;
                this.totemGridState.currentView = view;
                
                // Update totem renderer view (for preview canvas)
                if (this.totemRenderer) {
                    this.totemRenderer.setView(view);
                }
                
                // Update button styles
                document.querySelectorAll('.totem-view-btn').forEach(b => {
                    if (b.dataset.view === view) {
                        b.style.background = 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
                        b.style.border = 'none';
                        b.style.color = 'white';
                        b.style.boxShadow = '0 2px 6px rgba(236,72,153,0.3)';
                    } else {
                        b.style.background = 'rgba(236,72,153,0.1)';
                        b.style.border = '1px solid rgba(236,72,153,0.3)';
                        b.style.color = '#f9a8d4';
                        b.style.boxShadow = 'none';
                    }
                });

                // Show/hide Y control
                const yControl = document.getElementById('totem-y-control');
                if (yControl) {
                    yControl.style.display = view === 'top' ? 'flex' : 'none';
                }

                this.renderTotemGrid();
                this.updateTotemPreview(mob);
                
                // Update view indicator in grid header
                const viewIndicator = document.getElementById('totem-current-view-indicator');
                if (viewIndicator) {
                    const viewNames = {
                        'top': '<i class="fas fa-arrow-down"></i> TOP VIEW',
                        'front': '<i class="fas fa-arrows-alt-h"></i> FRONT VIEW',
                        'side': '<i class="fas fa-arrows-alt-v"></i> SIDE VIEW'
                    };
                    viewIndicator.innerHTML = viewNames[view] || 'TOP VIEW';
                }
            }, true);
        });
        
        // Collapsible sections toggle
        document.querySelectorAll('.totem-toggle-section').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const section = btn.dataset.section;
                const content = document.getElementById(`totem-${section}-content`);
                const icon = btn.querySelector('.totem-toggle-icon');
                
                if (content) {
                    const isCollapsed = content.style.display === 'none';
                    content.style.display = isCollapsed ? 'block' : 'none';
                    if (icon) {
                        icon.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
                    }
                    
                    // Render templates when templates section is expanded
                    if (section === 'templates' && isCollapsed && this.TOTEM_TEMPLATES) {
                        setTimeout(() => this.renderTotemTemplates(this.TOTEM_TEMPLATES), 10);
                    }
                    
                    // Save state to localStorage
                    localStorage.setItem(`totem-section-${section}`, isCollapsed ? 'expanded' : 'collapsed');
                }
            });
            
            // Restore saved state from localStorage
            const section = btn.dataset.section;
            const savedState = localStorage.getItem(`totem-section-${section}`);
            const content = document.getElementById(`totem-${section}-content`);
            const icon = btn.querySelector('.totem-toggle-icon');
            
            if (savedState === 'collapsed' && content) {
                content.style.display = 'none';
                if (icon) icon.style.transform = 'rotate(-90deg)';
            } else if (content) {
                // Default: Both Templates and Tools expanded for better discoverability
                content.style.display = 'block';
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        });

        // Y level controls
        const yUpBtn = document.querySelector('.totem-y-up-btn');
        const yDownBtn = document.querySelector('.totem-y-down-btn');
        if (yUpBtn) {
            yUpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.totemGridState.currentY++;
                this.updateYDisplay();
                this.renderTotemGrid();
            }, true);
        }
        if (yDownBtn) {
            yDownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.totemGridState.currentY--;
                this.updateYDisplay();
                this.renderTotemGrid();
            }, true);
        }

        // Clear grid button
        const clearBtn = document.querySelector('.totem-clear-grid-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const confirmed = await this.editor.showConfirmDialog(
                    'Clear Totem Structure?',
                    'This will remove all blocks from your totem design.',
                    'Clear All',
                    'Cancel'
                );
                
                if (confirmed) {
                    this.saveTotemHistory();
                    this.totemGridState.blocks.clear();
                    this.syncTotemToMob();
                    this.renderTotemGrid();
                    this.updateTotemPreview(mob);
                    this.updateTotemStatistics();
                }
            }, true);
        }

        // Center grid button
        const centerBtn = document.querySelector('.totem-center-grid-btn');
        if (centerBtn) {
            centerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Find bounds and recenter all blocks
                const coords = Array.from(this.totemGridState.blocks.keys());
                if (coords.length === 0) return;

                this.saveTotemHistory();
                
                const positions = coords.map(c => c.split(',').map(Number));
                const minX = Math.min(...positions.map(p => p[0]));
                const minY = Math.min(...positions.map(p => p[1]));
                const minZ = Math.min(...positions.map(p => p[2]));
                
                const newBlocks = new Map();
                this.totemGridState.blocks.forEach((material, coord) => {
                    const [x, y, z] = coord.split(',').map(Number);
                    const newCoord = `${x - minX},${y - minY},${z - minZ}`;
                    newBlocks.set(newCoord, material);
                });
                
                this.totemGridState.blocks = newBlocks;
                this.syncTotemToMob();
                this.renderTotemGrid();
                this.updateTotemPreview(mob);
                this.updateTotemStatistics();
            }, true);
        }
        
        // Undo button
        const undoBtn = document.querySelector('.totem-undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.undoTotem();
            }, true);
        }
        
        // Redo button
        const redoBtn = document.querySelector('.totem-redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.redoTotem();
            }, true);
        }
        
        // Mirror X button
        const mirrorXBtn = document.querySelector('.totem-mirror-x-btn');
        if (mirrorXBtn) {
            mirrorXBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.mirrorTotemX();
            }, true);
        }
        
        // Mirror Z button
        const mirrorZBtn = document.querySelector('.totem-mirror-z-btn');
        if (mirrorZBtn) {
            mirrorZBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.mirrorTotemZ();
            }, true);
        }
        
        // Rotate button
        const rotateBtn = document.querySelector('.totem-rotate-btn');
        if (rotateBtn) {
            rotateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.rotateTotem();
            }, true);
        }
        
        // Symmetry mode checkbox
        const symmetryCheckbox = document.getElementById('totem-symmetry-mode');
        if (symmetryCheckbox) {
            symmetryCheckbox.addEventListener('change', (e) => {
                this.totemGridState.symmetryMode = e.target.checked;
            });
        }
        
        // Initialize recent materials palette
        this.renderRecentMaterials();
        this.updateTotemStatistics();
        this.updateUndoRedoButtons();
        
        // Add keyboard shortcuts for undo/redo
        const handleTotemKeyboard = (e) => {
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undoTotem();
            } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redoTotem();
            }
        };
        
        // Attach to visual mode container
        const visualMode = document.getElementById('totem-visual-mode');
        if (visualMode) {
            visualMode.addEventListener('keydown', handleTotemKeyboard);
        }
        
        // Store for cleanup
        if (!this._totemKeyboardHandler) {
            this._totemKeyboardHandler = handleTotemKeyboard;
        }

        // Initial grid render
        this.renderTotemGrid();
        
        // Add pattern button
        const addPatternBtn = document.querySelector('.add-totem-pattern-btn');
        if (addPatternBtn) {
            addPatternBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Save scroll position BEFORE render
                const container = document.querySelector('.mob-editor-container') || document.querySelector('.editor-content');
                const scrollTop = container ? container.scrollTop : 0;
                
                if (!mob.totem) mob.totem = {};
                if (!mob.totem.Pattern) mob.totem.Pattern = [];
                mob.totem.Pattern.push('0,0,0 STONE');
                
                window.collapsibleManager.saveStates();
                this.render(mob);
                
                // Keep section expanded and restore scroll
                requestAnimationFrame(() => {
                    const totemSection = document.getElementById('totem-section');
                    if (totemSection) {
                        totemSection.classList.remove('collapsed');
                    }
                    
                    // Restore scroll position
                    if (container) {
                        container.scrollTop = scrollTop;
                    }
                    
                    // Update preview
                    this.updateTotemPreview(mob);
                });
            }, true);
        }
        
        // Remove pattern buttons
        document.querySelectorAll('.remove-totem-pattern').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Save scroll position BEFORE render
                const container = document.querySelector('.mob-editor-container') || document.querySelector('.editor-content');
                const scrollTop = container ? container.scrollTop : 0;
                
                const index = parseInt(e.currentTarget.dataset.index);
                if (mob.totem && mob.totem.Pattern) {
                    mob.totem.Pattern.splice(index, 1);
                    window.collapsibleManager.saveStates();
                    this.render(mob);
                    
                    // Keep section expanded and restore scroll
                    requestAnimationFrame(() => {
                        const totemSection = document.getElementById('totem-section');
                        if (totemSection) {
                            totemSection.classList.remove('collapsed');
                        }
                        
                        // Restore scroll position
                        if (container) {
                            container.scrollTop = scrollTop;
                        }
                    });
                }
            }, true);
        });
        
        // Pattern input handlers
        document.querySelectorAll('.totem-pattern-coords, .totem-pattern-material').forEach(input => {
            input.addEventListener('input', (e) => {
                e.stopPropagation();
                const index = parseInt(e.currentTarget.dataset.index);
                const isCoords = e.currentTarget.classList.contains('totem-pattern-coords');
                
                if (mob.totem && mob.totem.Pattern && mob.totem.Pattern[index]) {
                    const parts = mob.totem.Pattern[index].split(/\s+/);
                    if (isCoords) {
                        const coords = e.target.value.trim();
                        const material = parts.slice(1).join(' ') || 'STONE';
                        mob.totem.Pattern[index] = `${coords} ${material}`;
                    } else {
                        const coords = parts[0] || '0,0,0';
                        const material = e.target.value.trim().toUpperCase() || 'STONE';
                        mob.totem.Pattern[index] = `${coords} ${material}`;
                    }
                    
                    this.updateTotemPreview(mob);
                    this.editor.markDirty();
                }
            }, true);
        });
        
        // Add replacement button
        const addReplacementBtn = document.querySelector('.add-totem-replacement-btn');
        if (addReplacementBtn) {
            addReplacementBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Save scroll position BEFORE render
                const container = document.querySelector('.mob-editor-container') || document.querySelector('.editor-content');
                const scrollTop = container ? container.scrollTop : 0;
                
                if (!mob.totem) mob.totem = {};
                if (!mob.totem.Replacement) mob.totem.Replacement = [];
                mob.totem.Replacement.push('0,0,0 AIR');
                
                window.collapsibleManager.saveStates();
                this.render(mob);
                
                // Keep section expanded and restore scroll
                requestAnimationFrame(() => {
                    const totemSection = document.getElementById('totem-section');
                    if (totemSection) {
                        totemSection.classList.remove('collapsed');
                    }
                    
                    // Restore scroll position
                    if (container) {
                        container.scrollTop = scrollTop;
                    }
                });
            }, true);
        }
        
        // Remove replacement buttons
        document.querySelectorAll('.remove-totem-replacement').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Save scroll position BEFORE render
                const container = document.querySelector('.mob-editor-container') || document.querySelector('.editor-content');
                const scrollTop = container ? container.scrollTop : 0;
                
                const index = parseInt(e.currentTarget.dataset.index);
                if (mob.totem && mob.totem.Replacement) {
                    mob.totem.Replacement.splice(index, 1);
                    window.collapsibleManager.saveStates();
                    this.render(mob);
                    
                    // Keep section expanded and restore scroll
                    requestAnimationFrame(() => {
                        const totemSection = document.getElementById('totem-section');
                        if (totemSection) {
                            totemSection.classList.remove('collapsed');
                        }
                        
                        // Restore scroll position
                        if (container) {
                            container.scrollTop = scrollTop;
                        }
                    });
                }
            }, true);
        });
        
        // Replacement input handlers
        document.querySelectorAll('.totem-replacement-coords, .totem-replacement-material').forEach(input => {
            input.addEventListener('input', (e) => {
                e.stopPropagation();
                const index = parseInt(e.currentTarget.dataset.index);
                const isCoords = e.currentTarget.classList.contains('totem-replacement-coords');
                
                if (mob.totem && mob.totem.Replacement && mob.totem.Replacement[index]) {
                    const parts = mob.totem.Replacement[index].split(/\s+/);
                    if (isCoords) {
                        const coords = e.target.value.trim();
                        const material = parts.slice(1).join(' ') || 'AIR';
                        mob.totem.Replacement[index] = `${coords} ${material}`;
                    } else {
                        const coords = parts[0] || '0,0,0';
                        const material = e.target.value.trim().toUpperCase() || 'AIR';
                        mob.totem.Replacement[index] = `${coords} ${material}`;
                    }
                    
                    this.editor.markDirty();
                }
            }, true);
        });
        
        // === NEW TOTEM BUILDER MODAL HANDLERS ===
        this.initTotemBuilderModal(mob);
    }
    
    /**
     * Initialize the totem builder modal with all event handlers
     */
    initTotemBuilderModal(mob) {
        // Open builder button
        const openBuilderBtn = document.getElementById('open-totem-builder-btn');
        if (openBuilderBtn) {
            openBuilderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openTotemBuilderModal(mob);
            }, true);
        }
        
        // Close modal buttons
        const closeBtn = document.getElementById('totem-builder-close');
        const cancelBtn = document.getElementById('totem-modal-cancel');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeTotemBuilderModal(), true);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeTotemBuilderModal(), true);
        }
        
        // Close on overlay click
        const overlay = document.getElementById('totem-builder-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeTotemBuilderModal();
                }
            }, true);
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay?.classList.contains('active')) {
                this.closeTotemBuilderModal();
            }
        });
        
        // Initialize compact preview canvas
        this.updateCompactPreview(mob);
        
        // Initialize head dropdown in compact section
        setTimeout(() => {
            const headContainerCompact = document.getElementById('totem-head-dropdown-compact');
            if (headContainerCompact && window.MINECRAFT_ITEMS) {
                headContainerCompact.innerHTML = '';
                const totem = mob.totem || mob.Totem || {};
                const headBlock = totem.head || totem.Head || 'PLAYER_HEAD';
                
                new SearchableDropdown('totem-head-dropdown-compact', {
                    categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : null,
                    items: !window.getCombinedItemCategories ? window.MINECRAFT_ITEMS : null,
                    useIcons: true,
                    storageKey: 'totem-head-block',
                    placeholder: 'Search block...',
                    value: headBlock,
                    onSelect: (value) => {
                        if (!mob.totem) mob.totem = {};
                        mob.totem.Head = value;
                        this.editor.markDirty();
                        this.editor.updateYAMLPreview();
                    }
                });
            }
        }, 100);
    }
    
    /**
     * Open the totem builder modal
     */
    openTotemBuilderModal(mob) {
        const overlay = document.getElementById('totem-builder-overlay');
        if (!overlay) return;
        
        // Show modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Initialize modal components
        setTimeout(() => {
            this.initTotemModalControls(mob);
            this.renderTotemModalGrid();
            this.updateTotemModalPreview(mob);
            this.updateTotemModalStats();
            this.renderTotemModalTemplates();
            this.renderTotemModalRecentMaterials();
        }, 50);
    }
    
    /**
     * Close the totem builder modal
     */
    closeTotemBuilderModal() {
        const overlay = document.getElementById('totem-builder-overlay');
        if (!overlay) return;
        
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Update compact section preview
        this.updateCompactPreview(this.currentMob);
        this.updateCompactStats();
    }
    
    /**
     * Initialize modal control event handlers
     */
    initTotemModalControls(mob) {
        // Paint material dropdown
        const paintContainer = document.getElementById('totem-modal-paint-dropdown');
        if (paintContainer && window.MINECRAFT_ITEMS) {
            paintContainer.innerHTML = '';
            new SearchableDropdown('totem-modal-paint-dropdown', {
                categories: window.getCombinedItemCategories ? window.getCombinedItemCategories(true) : null,
                items: !window.getCombinedItemCategories ? window.MINECRAFT_ITEMS : null,
                useIcons: true,
                storageKey: 'totem-modal-paint-material',
                placeholder: 'Search material...',
                value: this.totemGridState.currentMaterial,
                onSelect: (value) => {
                    this.totemGridState.currentMaterial = value;
                    this.addToRecentMaterials(value);
                    this.updateMaterialDisplay(value);
                    this.renderTotemModalRecentMaterials();
                }
            });
        }
        
        // Symmetry toggle
        const symmetryToggle = document.getElementById('totem-modal-symmetry-toggle');
        const symmetryCheckbox = document.getElementById('totem-modal-symmetry-checkbox');
        if (symmetryToggle) {
            // Set initial state
            if (symmetryCheckbox) symmetryCheckbox.checked = this.totemGridState.symmetryMode;
            symmetryToggle.classList.toggle('active', this.totemGridState.symmetryMode);
            
            // Remove old listeners by cloning
            const newToggle = symmetryToggle.cloneNode(true);
            symmetryToggle.parentNode.replaceChild(newToggle, symmetryToggle);
            
            newToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.totemGridState.symmetryMode = !this.totemGridState.symmetryMode;
                const checkbox = newToggle.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = this.totemGridState.symmetryMode;
                newToggle.classList.toggle('active', this.totemGridState.symmetryMode);
            }, true);
        }
        
        // View buttons
        document.querySelectorAll('.totem-view-btn-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const view = btn.dataset.view;
                this.totemGridState.currentView = view;
                
                // Update button styles
                document.querySelectorAll('.totem-view-btn-modal').forEach(b => {
                    b.classList.toggle('active', b.dataset.view === view);
                });
                
                // Show/hide Y control
                const yControl = document.getElementById('totem-modal-y-control');
                if (yControl) {
                    yControl.style.display = view === 'top' ? 'flex' : 'none';
                }
                
                // Update view indicator
                this.updateModalViewIndicator();
                
                this.renderTotemModalGrid();
                this.updateTotemModalPreview(mob);
            }, true);
        });
        
        // Y level controls
        const yUp = document.getElementById('totem-modal-y-up');
        const yDown = document.getElementById('totem-modal-y-down');
        
        if (yUp) {
            yUp.addEventListener('click', () => {
                this.totemGridState.currentY++;
                this.updateModalYDisplay();
                this.updateModalViewIndicator();
                this.renderTotemModalGrid();
            }, true);
        }
        
        if (yDown) {
            yDown.addEventListener('click', () => {
                this.totemGridState.currentY--;
                this.updateModalYDisplay();
                this.updateModalViewIndicator();
                this.renderTotemModalGrid();
            }, true);
        }
        
        // Transform tools
        document.getElementById('totem-modal-undo')?.addEventListener('click', () => this.undoTotem(), true);
        document.getElementById('totem-modal-redo')?.addEventListener('click', () => this.redoTotem(), true);
        document.getElementById('totem-modal-rotate')?.addEventListener('click', () => this.rotateTotem(), true);
        document.getElementById('totem-modal-mirror-x')?.addEventListener('click', () => this.mirrorTotemX(), true);
        document.getElementById('totem-modal-mirror-z')?.addEventListener('click', () => this.mirrorTotemZ(), true);
        document.getElementById('totem-modal-center')?.addEventListener('click', () => this.centerTotem(), true);
        document.getElementById('totem-modal-clear')?.addEventListener('click', async () => {
            const confirmed = await this.editor.showConfirmDialog(
                'Clear Totem?',
                'This will remove all blocks from your totem.',
                'Clear All',
                'Cancel'
            );
            if (confirmed) {
                this.saveTotemHistory();
                this.totemGridState.blocks.clear();
                this.refreshTotemDisplays();
            }
        }, true);
    }
    
    /**
     * Render the modal grid with drag painting support
     */
    renderTotemModalGrid() {
        const gridContainer = document.getElementById('totem-modal-grid');
        if (!gridContainer) return;
        
        const state = this.totemGridState;
        const size = state.gridSize;
        const half = Math.floor(size / 2);
        
        gridContainer.style.gridTemplateColumns = `repeat(${size}, 38px)`;
        
        let html = '';
        const view = state.currentView;
        
        if (view === 'top') {
            // Top view: X-Z plane
            for (let z = -half; z <= half; z++) {
                for (let x = -half; x <= half; x++) {
                    html += this.renderTotemModalCell(x, state.currentY, z, 'top');
                }
            }
        } else if (view === 'front') {
            // Front view: X-Y plane
            for (let y = half; y >= -half; y--) {
                for (let x = -half; x <= half; x++) {
                    html += this.renderTotemModalCell(x, y, 0, 'front');
                }
            }
        } else {
            // Side view: Z-Y plane
            for (let y = half; y >= -half; y--) {
                for (let z = -half; z <= half; z++) {
                    html += this.renderTotemModalCell(0, y, z, 'side');
                }
            }
        }
        
        gridContainer.innerHTML = html;
        
        // Attach cell event handlers with drag painting support
        this.attachModalGridHandlers(gridContainer);
    }
    
    /**
     * Render a single grid cell for the modal
     */
    renderTotemModalCell(x, y, z, view) {
        const state = this.totemGridState;
        const coord = `${x},${y},${z}`;
        const hasBlock = state.blocks.has(coord);
        const material = state.blocks.get(coord) || '';
        const half = Math.floor(state.gridSize / 2);
        
        // Check for blocks at other levels (for top view)
        let hasBlockOtherY = false;
        if (view === 'top') {
            for (let checkY = -half; checkY <= half; checkY++) {
                if (checkY !== y && state.blocks.has(`${x},${checkY},${z}`)) {
                    hasBlockOtherY = true;
                    break;
                }
            }
        }
        
        const isSpawnPoint = x === 0 && y === 0 && z === 0;
        
        let classes = 'totem-grid-cell-modal';
        if (hasBlock) classes += ' has-block';
        else if (hasBlockOtherY) classes += ' has-other';
        else if (isSpawnPoint) classes += ' spawn-point';
        
        let icon = '';
        if (hasBlock) icon = '▣';
        else if (isSpawnPoint) icon = '⊕';
        else if (hasBlockOtherY) icon = '○';
        
        const tooltip = hasBlock ? `${coord}: ${material}` : isSpawnPoint ? 'Spawn Point (0,0,0)' : coord;
        
        return `
            <div class="${classes}" 
                 data-coord="${coord}" 
                 data-x="${x}" 
                 data-y="${y}" 
                 data-z="${z}"
                 title="${tooltip}">
                <span class="cell-icon">${icon}</span>
            </div>
        `;
    }
    
    /**
     * Attach grid event handlers with drag painting support
     */
    attachModalGridHandlers(gridContainer) {
        const state = this.totemGridState;
        let isPainting = false;
        let isErasing = false;
        let paintedCells = new Set(); // Track cells painted in current drag
        
        const paintIndicator = document.getElementById('totem-paint-mode-indicator');
        
        const startPaint = (cell, erase = false) => {
            isPainting = !erase;
            isErasing = erase;
            paintedCells.clear();
            
            if (paintIndicator) {
                paintIndicator.classList.add('active');
                paintIndicator.innerHTML = erase ? 
                    '<i class="fas fa-eraser"></i> <span>Erasing...</span>' :
                    '<i class="fas fa-paint-brush"></i> <span>Painting...</span>';
            }
            
            this.saveTotemHistory();
            this.paintCell(cell, erase);
            paintedCells.add(cell.dataset.coord);
        };
        
        const continuePaint = (cell) => {
            if (!isPainting && !isErasing) return;
            if (paintedCells.has(cell.dataset.coord)) return;
            
            this.paintCell(cell, isErasing);
            paintedCells.add(cell.dataset.coord);
        };
        
        const endPaint = () => {
            if (isPainting || isErasing) {
                isPainting = false;
                isErasing = false;
                paintedCells.clear();
                
                if (paintIndicator) {
                    paintIndicator.classList.remove('active');
                }
                
                this.refreshTotemDisplays();
            }
        };
        
        // Attach handlers to each cell
        gridContainer.querySelectorAll('.totem-grid-cell-modal').forEach(cell => {
            // Left mouse down - start painting
            cell.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click
                    e.preventDefault();
                    startPaint(cell, false);
                }
            });
            
            // Right mouse down - start erasing
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                startPaint(cell, true);
            });
            
            // Mouse enter while painting
            cell.addEventListener('mouseenter', (e) => {
                continuePaint(cell);
                
                // Hover preview
                if (!isPainting && !isErasing && !state.blocks.has(cell.dataset.coord)) {
                    cell.classList.add('painting-preview');
                }
            });
            
            // Mouse leave - remove hover preview
            cell.addEventListener('mouseleave', () => {
                cell.classList.remove('painting-preview');
            });
        });
        
        // Global mouse up to end painting
        document.addEventListener('mouseup', endPaint);
        
        // Prevent default drag behavior
        gridContainer.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    /**
     * Paint or erase a single cell
     */
    paintCell(cell, erase) {
        const state = this.totemGridState;
        const coord = cell.dataset.coord;
        
        if (erase) {
            state.blocks.delete(coord);
            
            // Remove symmetry block if enabled
            if (state.symmetryMode) {
                const [x, y, z] = coord.split(',').map(Number);
                state.blocks.delete(`${-x},${y},${z}`);
            }
            
            cell.classList.remove('has-block');
            cell.classList.add('erasing');
        } else {
            state.blocks.set(coord, state.currentMaterial);
            
            // Place symmetry block if enabled
            if (state.symmetryMode) {
                const [x, y, z] = coord.split(',').map(Number);
                const mirrorCoord = `${-x},${y},${z}`;
                if (mirrorCoord !== coord) {
                    state.blocks.set(mirrorCoord, state.currentMaterial);
                }
            }
            
            cell.classList.add('has-block');
            cell.querySelector('.cell-icon').textContent = '▣';
        }
    }
    
    /**
     * Update the material display in the modal
     */
    updateMaterialDisplay(material) {
        const nameDisplay = document.getElementById('totem-material-name');
        if (nameDisplay) {
            nameDisplay.textContent = material;
        }
    }
    
    /**
     * Update Y level display in modal
     */
    updateModalYDisplay() {
        const display = document.getElementById('totem-modal-y-display');
        if (display) {
            display.textContent = this.totemGridState.currentY;
        }
    }
    
    /**
     * Update view indicator in modal
     */
    updateModalViewIndicator() {
        const indicator = document.getElementById('totem-modal-view-indicator');
        if (!indicator) return;
        
        const view = this.totemGridState.currentView;
        const viewLabels = {
            'top': `<i class="fas fa-arrow-down"></i> TOP VIEW (Y=${this.totemGridState.currentY})`,
            'front': '<i class="fas fa-arrows-alt-h"></i> FRONT VIEW (X-Y)',
            'side': '<i class="fas fa-arrows-alt-v"></i> SIDE VIEW (Z-Y)'
        };
        
        indicator.innerHTML = viewLabels[view] || viewLabels['top'];
    }
    
    /**
     * Update modal preview canvas
     */
    updateTotemModalPreview(mob) {
        const canvas = document.getElementById('totem-modal-preview-canvas');
        if (!canvas) return;
        
        // Create temporary renderer for modal canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Use existing totem renderer logic
        if (this.totemRenderer) {
            // Temporarily swap canvas
            const originalCanvas = this.totemRenderer.canvas;
            const originalCtx = this.totemRenderer.ctx;
            
            this.totemRenderer.canvas = canvas;
            this.totemRenderer.ctx = ctx;
            
            const pattern = mob?.totem?.Pattern || [];
            this.totemRenderer.render(pattern, this.totemGridState.currentView);
            
            // Restore original
            this.totemRenderer.canvas = originalCanvas;
            this.totemRenderer.ctx = originalCtx;
        }
    }
    
    /**
     * Update modal statistics display
     */
    updateTotemModalStats() {
        const state = this.totemGridState;
        
        // Total blocks
        const totalEl = document.getElementById('totem-modal-total-blocks');
        if (totalEl) totalEl.textContent = state.blocks.size;
        
        // Calculate dimensions
        if (state.blocks.size > 0) {
            const coords = Array.from(state.blocks.keys()).map(c => {
                const [x, y, z] = c.split(',').map(Number);
                return { x, y, z };
            });
            
            const minX = Math.min(...coords.map(c => c.x));
            const maxX = Math.max(...coords.map(c => c.x));
            const minY = Math.min(...coords.map(c => c.y));
            const maxY = Math.max(...coords.map(c => c.y));
            const minZ = Math.min(...coords.map(c => c.z));
            const maxZ = Math.max(...coords.map(c => c.z));
            
            const dimensionsEl = document.getElementById('totem-modal-dimensions');
            if (dimensionsEl) {
                dimensionsEl.textContent = `${maxX - minX + 1}×${maxY - minY + 1}×${maxZ - minZ + 1}`;
            }
            
            const layersEl = document.getElementById('totem-modal-layer-count');
            if (layersEl) {
                layersEl.textContent = maxY - minY + 1;
            }
        } else {
            const dimensionsEl = document.getElementById('totem-modal-dimensions');
            if (dimensionsEl) dimensionsEl.textContent = '0×0×0';
            
            const layersEl = document.getElementById('totem-modal-layer-count');
            if (layersEl) layersEl.textContent = '0';
        }
        
        // Update header badge
        const headerBadge = document.querySelector('.totem-builder-title span');
        if (headerBadge) {
            headerBadge.textContent = `${state.blocks.size} blocks`;
        }
    }
    
    /**
     * Render templates in modal
     */
    renderTotemModalTemplates() {
        const container = document.getElementById('totem-modal-templates');
        if (!container || !this.TOTEM_TEMPLATES) return;
        
        container.innerHTML = Object.entries(this.TOTEM_TEMPLATES).map(([key, template]) => `
            <div class="totem-template-item" data-template="${key}">
                <span class="icon">${template.icon}</span>
                <span class="name">${template.name}</span>
                <span class="desc">${template.description}</span>
            </div>
        `).join('');
        
        // Attach click handlers
        container.querySelectorAll('.totem-template-item').forEach(item => {
            item.addEventListener('click', () => {
                const templateKey = item.dataset.template;
                const template = this.TOTEM_TEMPLATES[templateKey];
                if (template) {
                    this.applyTotemTemplate(template);
                }
            });
        });
    }
    
    /**
     * Apply a totem template
     */
    applyTotemTemplate(template) {
        this.saveTotemHistory();
        this.totemGridState.blocks.clear();
        
        template.pattern.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const coord = parts[0];
            const material = parts.slice(1).join(' ');
            this.totemGridState.blocks.set(coord, material);
        });
        
        this.refreshTotemDisplays();
    }
    
    /**
     * Render recent materials in modal
     */
    renderTotemModalRecentMaterials() {
        const container = document.getElementById('totem-modal-recent-materials');
        if (!container) return;
        
        const recentMaterials = this.totemGridState.recentMaterials || [];
        
        container.innerHTML = recentMaterials.slice(0, 8).map(material => {
            const isActive = material === this.totemGridState.currentMaterial;
            return `
                <div class="totem-recent-item ${isActive ? 'active' : ''}" 
                     data-material="${material}" 
                     title="${material}">
                    <i class="fas fa-cube"></i>
                </div>
            `;
        }).join('');
        
        // Attach click handlers
        container.querySelectorAll('.totem-recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const material = item.dataset.material;
                this.totemGridState.currentMaterial = material;
                this.updateMaterialDisplay(material);
                this.renderTotemModalRecentMaterials();
            });
        });
    }
    
    /**
     * Update compact preview canvas
     */
    updateCompactPreview(mob) {
        const canvas = document.getElementById('totem-mini-preview-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw mini preview
        ctx.clearRect(0, 0, 80, 80);
        
        const pattern = mob?.totem?.Pattern || [];
        if (pattern.length === 0) {
            // Empty state
            ctx.fillStyle = '#1a1530';
            ctx.fillRect(0, 0, 80, 80);
            ctx.fillStyle = '#4a4570';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No blocks', 40, 45);
            return;
        }
        
        // Use totem renderer for mini preview
        if (this.totemRenderer) {
            const originalCanvas = this.totemRenderer.canvas;
            const originalCtx = this.totemRenderer.ctx;
            const originalBlockSize = this.totemRenderer.blockSize;
            
            this.totemRenderer.canvas = canvas;
            this.totemRenderer.ctx = ctx;
            this.totemRenderer.blockSize = 12; // Smaller blocks for mini preview
            
            this.totemRenderer.render(pattern, 'top');
            
            this.totemRenderer.canvas = originalCanvas;
            this.totemRenderer.ctx = originalCtx;
            this.totemRenderer.blockSize = originalBlockSize;
        }
    }
    
    /**
     * Update compact section stats
     */
    updateCompactStats() {
        const state = this.totemGridState;
        
        const blocksEl = document.getElementById('totem-compact-blocks');
        if (blocksEl) blocksEl.textContent = state.blocks.size;
        
        if (state.blocks.size > 0) {
            const coords = Array.from(state.blocks.keys()).map(c => {
                const [x, y, z] = c.split(',').map(Number);
                return { x, y, z };
            });
            
            const minX = Math.min(...coords.map(c => c.x));
            const maxX = Math.max(...coords.map(c => c.x));
            const minY = Math.min(...coords.map(c => c.y));
            const maxY = Math.max(...coords.map(c => c.y));
            const minZ = Math.min(...coords.map(c => c.z));
            const maxZ = Math.max(...coords.map(c => c.z));
            
            const dimEl = document.getElementById('totem-compact-dimensions');
            if (dimEl) dimEl.textContent = `${maxX - minX + 1}×${maxY - minY + 1}×${maxZ - minZ + 1}`;
            
            const layersEl = document.getElementById('totem-compact-layers');
            if (layersEl) layersEl.textContent = maxY - minY + 1;
        } else {
            const dimEl = document.getElementById('totem-compact-dimensions');
            if (dimEl) dimEl.textContent = '0×0×0';
            
            const layersEl = document.getElementById('totem-compact-layers');
            if (layersEl) layersEl.textContent = '0';
        }
    }
    
    /**
     * Update Y level display
     */
    updateYDisplay() {
        const yDisplay = document.getElementById('totem-y-display');
        if (yDisplay) {
            yDisplay.textContent = `Y = ${this.totemGridState.currentY}`;
        }
    }
    
    /**
     * Render totem template library
     */
    renderTotemTemplates(templates) {
        const container = document.getElementById('totem-templates');
        if (!container) {
            if (window.DEBUG_MODE) console.warn('Totem templates container not found - will render when section is expanded');
            return;
        }
        
        container.innerHTML = Object.entries(templates).map(([key, template]) => `
            <button type="button" class="totem-template-btn" data-template="${key}" data-interactive="true" 
                    style="background: linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.1) 100%); 
                           border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 12px 8px; 
                           cursor: pointer; transition: all 0.2s; text-align: center;"
                    title="${template.description}"
                    onmouseover="this.style.background='linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.2) 100%)'; this.style.borderColor='rgba(139,92,246,0.5)'; this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.background='linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.1) 100%)'; this.style.borderColor='rgba(139,92,246,0.3)'; this.style.transform='translateY(0)'">
                <div style="font-size: 24px; margin-bottom: 4px;">${template.icon}</div>
                <div style="font-size: 10px; font-weight: 600; color: #a78bfa;">${template.name}</div>
                <div style="font-size: 9px; color: var(--text-tertiary); margin-top: 2px;">${template.pattern.length} blocks</div>
            </button>
        `).join('');
        
        // Attach template click handlers
        container.querySelectorAll('.totem-template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const templateKey = btn.dataset.template;
                this.loadTotemTemplate(templates[templateKey]);
            });
        });
    }
    
    /**
     * Load a totem template
     */
    loadTotemTemplate(template) {
        this.saveTotemHistory(); // Save current state for undo
        this.totemGridState.blocks.clear();
        
        template.pattern.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const coords = parts[0];
            const material = parts.slice(1).join(' ');
            this.totemGridState.blocks.set(coords, material);
            
            // Add to recent materials
            this.addToRecentMaterials(material);
        });
        
        this.renderTotemGrid();
        this.updateTotemPreview(this.currentMob);
        this.syncTotemToMob();
        this.updateTotemStatistics();
    }
    
    /**
     * Save current totem state to history for undo
     */
    saveTotemHistory() {
        const state = this.totemGridState;
        
        // Remove any redo states
        state.history = state.history.slice(0, state.historyIndex + 1);
        
        // Save current state
        const snapshot = new Map(state.blocks);
        state.history.push(snapshot);
        state.historyIndex++;
        
        // Limit history to 50 states
        if (state.history.length > 50) {
            state.history.shift();
            state.historyIndex--;
        }
        
        this.updateUndoRedoButtons();
    }
    
    /**
     * Undo totem change
     */
    undoTotem() {
        const state = this.totemGridState;
        if (state.historyIndex <= 0) return;
        
        state.historyIndex--;
        state.blocks = new Map(state.history[state.historyIndex]);
        
        this.refreshTotemDisplays();
        this.updateUndoRedoButtons();
    }
    
    /**
     * Redo totem change
     */
    redoTotem() {
        const state = this.totemGridState;
        if (state.historyIndex >= state.history.length - 1) return;
        
        state.historyIndex++;
        state.blocks = new Map(state.history[state.historyIndex]);
        
        this.refreshTotemDisplays();
        this.updateUndoRedoButtons();
    }
    
    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const state = this.totemGridState;
        const undoBtn = document.querySelector('.totem-undo-btn');
        const redoBtn = document.querySelector('.totem-redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = state.historyIndex <= 0;
            undoBtn.style.opacity = undoBtn.disabled ? '0.4' : '1';
        }
        if (redoBtn) {
            redoBtn.disabled = state.historyIndex >= state.history.length - 1;
            redoBtn.style.opacity = redoBtn.disabled ? '0.4' : '1';
        }
    }
    
    /**
     * Check if totem modal is currently open
     */
    isTotemModalOpen() {
        const overlay = document.getElementById('totem-builder-overlay');
        return overlay && overlay.classList.contains('active');
    }
    
    /**
     * Refresh all totem displays (both modal and inline)
     */
    refreshTotemDisplays() {
        this.syncTotemToMob();
        
        // Update modal if open
        if (this.isTotemModalOpen()) {
            this.renderTotemModalGrid();
            this.updateTotemModalPreview(this.currentMob);
            this.updateTotemModalStats();
        }
        
        // Update old inline grid if it exists
        this.renderTotemGrid();
        this.updateTotemPreview(this.currentMob);
        this.updateTotemStatistics();
        
        // Update compact preview
        this.updateCompactPreview(this.currentMob);
        this.updateCompactStats();
    }
    
    /**
     * Mirror totem along X axis
     */
    mirrorTotemX() {
        this.saveTotemHistory();
        const newBlocks = new Map();
        
        this.totemGridState.blocks.forEach((material, coords) => {
            const [x, y, z] = coords.split(',').map(Number);
            const newCoords = `${-x},${y},${z}`;
            newBlocks.set(newCoords, material);
        });
        
        this.totemGridState.blocks = newBlocks;
        this.refreshTotemDisplays();
    }
    
    /**
     * Mirror totem along Z axis
     */
    mirrorTotemZ() {
        this.saveTotemHistory();
        const newBlocks = new Map();
        
        this.totemGridState.blocks.forEach((material, coords) => {
            const [x, y, z] = coords.split(',').map(Number);
            const newCoords = `${x},${y},${-z}`;
            newBlocks.set(newCoords, material);
        });
        
        this.totemGridState.blocks = newBlocks;
        this.refreshTotemDisplays();
    }
    
    /**
     * Rotate totem 90° around Y axis
     */
    rotateTotem() {
        this.saveTotemHistory();
        const newBlocks = new Map();
        
        this.totemGridState.blocks.forEach((material, coords) => {
            const [x, y, z] = coords.split(',').map(Number);
            // Rotate 90° clockwise: (x,z) -> (z,-x)
            const newCoords = `${z},${y},${-x}`;
            newBlocks.set(newCoords, material);
        });
        
        this.totemGridState.blocks = newBlocks;
        this.refreshTotemDisplays();
    }
    
    /**
     * Center totem structure at origin
     */
    centerTotem() {
        const coords = Array.from(this.totemGridState.blocks.keys());
        if (coords.length === 0) return;
        
        this.saveTotemHistory();
        
        const positions = coords.map(c => c.split(',').map(Number));
        const minX = Math.min(...positions.map(p => p[0]));
        const minY = Math.min(...positions.map(p => p[1]));
        const minZ = Math.min(...positions.map(p => p[2]));
        
        const newBlocks = new Map();
        this.totemGridState.blocks.forEach((material, coord) => {
            const [x, y, z] = coord.split(',').map(Number);
            const newCoord = `${x - minX},${y - minY},${z - minZ}`;
            newBlocks.set(newCoord, material);
        });
        
        this.totemGridState.blocks = newBlocks;
        this.refreshTotemDisplays();
    }
    
    /**
     * Add material to recent materials palette
     */
    addToRecentMaterials(material) {
        const state = this.totemGridState;
        
        // Remove if already exists
        const index = state.recentMaterials.indexOf(material);
        if (index > -1) {
            state.recentMaterials.splice(index, 1);
        }
        
        // Add to front
        state.recentMaterials.unshift(material);
        
        // Keep only 8 recent materials
        state.recentMaterials = state.recentMaterials.slice(0, 8);
        
        this.renderRecentMaterials();
    }
    
    /**
     * Render recent materials palette (Enhanced Grid Display)
     */
    renderRecentMaterials() {
        const container = document.getElementById('totem-recent-materials');
        if (!container) return;
        
        const state = this.totemGridState;
        const currentMaterial = state.currentMaterial;
        
        if (state.recentMaterials.length === 0) {
            container.innerHTML = '<small style="grid-column: span 4; text-align: center; color: var(--text-tertiary); font-size: 9px; padding: 8px;">No recent materials yet</small>';
            return;
        }
        
        container.innerHTML = state.recentMaterials.map(material => {
            const isActive = material === currentMaterial;
            return `
                <button type="button" class="totem-recent-material-btn" data-material="${material}" 
                        style="aspect-ratio: 1; background: ${isActive ? 'linear-gradient(135deg, rgba(251,146,60,0.4) 0%, rgba(249,115,22,0.3) 100%)' : 'rgba(0,0,0,0.3)'}; 
                               border: ${isActive ? '2px solid rgba(251,146,60,0.6)' : '1px solid rgba(251,146,60,0.25)'}; 
                               border-radius: 8px; padding: 6px; font-size: 9px; color: ${isActive ? '#fdba74' : '#fb923c'}; 
                               cursor: pointer; transition: all 0.2s; font-family: var(--font-mono); 
                               display: flex; flex-direction: column; align-items: center; justify-content: center;
                               font-weight: ${isActive ? '700' : '500'}; overflow: hidden; position: relative;
                               box-shadow: ${isActive ? '0 0 12px rgba(251,146,60,0.3)' : 'none'};"
                        title="${material} - Click to use"
                        onmouseover="this.style.transform='scale(1.1)'; this.style.borderColor='rgba(251,146,60,0.6)';"
                        onmouseout="this.style.transform='scale(1)'; this.style.borderColor='${isActive ? 'rgba(251,146,60,0.6)' : 'rgba(251,146,60,0.25)'}';">
                    <i class="fas fa-cube" style="font-size: 14px; margin-bottom: 2px; opacity: 0.8;"></i>
                    <span style="font-size: 7px; text-align: center; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${material.replace(/_/g, ' ').substring(0, 10)}
                    </span>
                    ${isActive ? '<div style="position: absolute; top: 2px; right: 2px; width: 6px; height: 6px; background: #fb923c; border-radius: 50%; box-shadow: 0 0 6px #fb923c;"></div>' : ''}
                </button>
            `;
        }).join('');
        
        // Attach click handlers
        container.querySelectorAll('.totem-recent-material-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.totemGridState.currentMaterial = btn.dataset.material;
                this.renderRecentMaterials(); // Update active state
            });
        });
    }
    
    /**
     * Update totem statistics display
     */
    updateTotemStatistics() {
        const totalElement = document.getElementById('totem-total-blocks');
        const sizeElement = document.getElementById('totem-size');
        const layersElement = document.getElementById('totem-layer-count');
        
        if (!totalElement || !sizeElement || !layersElement) return;
        
        const state = this.totemGridState;
        const blocks = Array.from(state.blocks.keys()).map(coords => {
            const [x, y, z] = coords.split(',').map(Number);
            return { x, y, z };
        });
        
        if (blocks.length === 0) {
            totalElement.textContent = '0';
            sizeElement.textContent = '0x0x0';
            layersElement.textContent = '0';
            return;
        }
        
        const minX = Math.min(...blocks.map(b => b.x));
        const maxX = Math.max(...blocks.map(b => b.x));
        const minY = Math.min(...blocks.map(b => b.y));
        const maxY = Math.max(...blocks.map(b => b.y));
        const minZ = Math.min(...blocks.map(b => b.z));
        const maxZ = Math.max(...blocks.map(b => b.z));
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const depth = maxZ - minZ + 1;
        const layers = new Set(blocks.map(b => b.y)).size;
        
        totalElement.textContent = blocks.length;
        sizeElement.textContent = `${width}×${height}×${depth}`;
        layersElement.textContent = layers;
    }
    
    /**
     * Sync totem blocks to mob data
     */
    syncTotemToMob() {
        const pattern = [];
        this.totemGridState.blocks.forEach((material, coords) => {
            pattern.push(`${coords} ${material}`);
        });
        
        if (!this.currentMob.totem) this.currentMob.totem = {};
        this.currentMob.totem.Pattern = pattern;
        
        this.editor.markDirty();
        this.editor.updateYAMLPreview();
    }

    /**
     * Render the visual totem grid based on current view
     */
    renderTotemGrid() {
        const gridContainer = document.getElementById('totem-grid');
        if (!gridContainer) return;

        const state = this.totemGridState;
        const size = state.gridSize;
        const half = Math.floor(size / 2);

        let html = '';
        const view = state.currentView;
        
        // Calculate block statistics
        const totalBlocks = state.blocks.size;
        const blocksByY = {};
        state.blocks.forEach((material, coord) => {
            const y = parseInt(coord.split(',')[1]);
            blocksByY[y] = (blocksByY[y] || 0) + 1;
        });
        const currentYBlocks = blocksByY[state.currentY] || 0;

        if (view === 'top') {
            // Top view: X-Z plane showing all Y levels with current highlighted
            gridContainer.style.gridTemplateColumns = `repeat(${size}, 30px)`;
            
            for (let z = -half; z <= half; z++) {
                for (let x = -half; x <= half; x++) {
                    // Check for blocks at current Y and other Y levels
                    const currentCoord = `${x},${state.currentY},${z}`;
                    const hasBlockAtCurrentY = state.blocks.has(currentCoord);
                    const currentMaterial = state.blocks.get(currentCoord) || '';
                    
                    // Check for blocks at other Y levels
                    let hasBlockOtherY = false;
                    let otherYLevels = [];
                    for (let y = -half; y <= half; y++) {
                        if (y !== state.currentY) {
                            const coord = `${x},${y},${z}`;
                            if (state.blocks.has(coord)) {
                                hasBlockOtherY = true;
                                otherYLevels.push(y);
                            }
                        }
                    }
                    
                    const isSpawnPoint = x === 0 && z === 0 && state.currentY === 0;
                    
                    // Determine cell styling
                    let bgColor, borderColor, borderWidth;
                    if (hasBlockAtCurrentY) {
                        bgColor = 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';
                        borderColor = '#a78bfa';
                        borderWidth = '2px';
                    } else if (hasBlockOtherY) {
                        bgColor = 'rgba(139, 92, 246, 0.15)';
                        borderColor = 'rgba(139, 92, 246, 0.3)';
                        borderWidth = '1px';
                    } else if (isSpawnPoint) {
                        bgColor = 'rgba(239,68,68,0.2)';
                        borderColor = '#ef4444';
                        borderWidth = '2px';
                    } else {
                        bgColor = 'rgba(255,255,255,0.05)';
                        borderColor = 'rgba(255,255,255,0.1)';
                        borderWidth = '1px';
                    }
                    
                    const tooltipText = isSpawnPoint && !hasBlockAtCurrentY ? 
                        'Spawn Point (0,0,0)' : 
                        hasBlockAtCurrentY ? 
                        `${currentCoord}: ${currentMaterial}` : 
                        hasBlockOtherY ? 
                        `${x},?,${z} - Blocks at Y: ${otherYLevels.join(', ')}` : 
                        `${currentCoord} (Empty)`;
                    
                    html += `
                        <div 
                            class="totem-grid-cell" 
                            data-coord="${currentCoord}"
                            data-x="${x}" 
                            data-y="${state.currentY}" 
                            data-z="${z}"
                            data-has-other="${hasBlockOtherY}"
                            style="
                                width: 30px;
                                height: 30px;
                                background: ${bgColor};
                                border: ${borderWidth} solid ${borderColor};
                                cursor: pointer;
                                transition: all 0.15s ease;
                                position: relative;
                                border-radius: 3px;
                            "
                            title="${tooltipText}"
                        >
                            ${isSpawnPoint && !hasBlockAtCurrentY ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; color: #ef4444;">⊕</div>' : ''}
                            ${hasBlockAtCurrentY ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; color: white; font-weight: bold;">▣</div>' : ''}
                            ${hasBlockOtherY && !hasBlockAtCurrentY ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 8px; color: #a78bfa;">○</div>' : ''}
                        </div>
                    `;
                }
            }
        } else if (view === 'front') {
            // Front view: X-Y plane showing all Z with current highlighted
            gridContainer.style.gridTemplateColumns = `repeat(${size}, 30px)`;
            
            for (let y = half; y >= -half; y--) {
                for (let x = -half; x <= half; x++) {
                    // Show all blocks collapsed onto X-Y plane
                    let hasBlock = false;
                    let materials = [];
                    let zLevels = [];
                    
                    for (let z = -half; z <= half; z++) {
                        const coord = `${x},${y},${z}`;
                        if (state.blocks.has(coord)) {
                            hasBlock = true;
                            materials.push(state.blocks.get(coord));
                            zLevels.push(z);
                        }
                    }
                    
                    const isSpawnPoint = x === 0 && y === 0;
                    const coord = `${x},${y},0`;
                    
                    html += `
                        <div 
                            class="totem-grid-cell" 
                            data-coord="${coord}"
                            data-x="${x}" 
                            data-y="${y}" 
                            data-z="0"
                            style="
                                width: 30px;
                                height: 30px;
                                background: ${hasBlock ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : (isSpawnPoint ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)')};
                                border: 1px solid ${hasBlock ? '#a78bfa' : (isSpawnPoint ? '#ef4444' : 'rgba(255,255,255,0.1)')};
                                cursor: pointer;
                                transition: all 0.15s ease;
                                position: relative;
                                border-radius: 3px;
                                opacity: ${hasBlock ? 1 : 0.6};
                            "
                            title="${isSpawnPoint && !hasBlock ? 'Spawn Point (0,0,0)' : hasBlock ? `X=${x}, Y=${y}, Z: ${zLevels.join(', ')}` : `${coord} (Empty)`}"
                        >
                            ${isSpawnPoint && !hasBlock ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; color: #ef4444;">⊕</div>' : ''}
                            ${hasBlock ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; color: white;">▣</div>' : ''}
                        </div>
                    `;
                }
            }
        } else { // 'side'
            // Side view: Z-Y plane showing all X with current highlighted
            gridContainer.style.gridTemplateColumns = `repeat(${size}, 30px)`;
            
            for (let y = half; y >= -half; y--) {
                for (let z = -half; z <= half; z++) {
                    // Show all blocks collapsed onto Z-Y plane
                    let hasBlock = false;
                    let materials = [];
                    let xLevels = [];
                    
                    for (let x = -half; x <= half; x++) {
                        const coord = `${x},${y},${z}`;
                        if (state.blocks.has(coord)) {
                            hasBlock = true;
                            materials.push(state.blocks.get(coord));
                            xLevels.push(x);
                        }
                    }
                    
                    const isSpawnPoint = z === 0 && y === 0;
                    const coord = `0,${y},${z}`;
                    
                    html += `
                        <div 
                            class="totem-grid-cell" 
                            data-coord="${coord}"
                            data-x="0" 
                            data-y="${y}" 
                            data-z="${z}"
                            style="
                                width: 30px;
                                height: 30px;
                                background: ${hasBlock ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : (isSpawnPoint ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)')};
                                border: 1px solid ${hasBlock ? '#a78bfa' : (isSpawnPoint ? '#ef4444' : 'rgba(255,255,255,0.1)')};
                                cursor: pointer;
                                transition: all 0.15s ease;
                                position: relative;
                                border-radius: 3px;
                                opacity: ${hasBlock ? 1 : 0.6};
                            "
                            title="${isSpawnPoint && !hasBlock ? 'Spawn Point (0,0,0)' : hasBlock ? `Z=${z}, Y=${y}, X: ${xLevels.join(', ')}` : `${coord} (Empty)`}"
                        >
                            ${isSpawnPoint && !hasBlock ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; color: #ef4444;">⊕</div>' : ''}
                            ${hasBlock ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; color: white;">▣</div>' : ''}
                        </div>
                    `;
                }
            }
        }

        gridContainer.innerHTML = html;
        
        // Update stats display
        const statsElement = document.getElementById('totem-block-stats');
        if (statsElement) {
            statsElement.textContent = view === 'top' ? 
                `Total: ${totalBlocks} blocks • Layer Y=${state.currentY}: ${currentYBlocks} blocks` :
                `Total: ${totalBlocks} blocks`;
        }

        // Attach cell click handlers
        gridContainer.querySelectorAll('.totem-grid-cell').forEach(cell => {
            // Left click to place
            cell.addEventListener('click', (e) => {
                e.preventDefault();
                const coord = cell.dataset.coord;
                const currentMaterial = state.currentMaterial;
                
                // Save history before modification
                this.saveTotemHistory();
                
                if (state.blocks.has(coord)) {
                    // Already has a block - remove it
                    state.blocks.delete(coord);
                    
                    // Remove symmetry block if enabled
                    if (state.symmetryMode) {
                        const [x, y, z] = coord.split(',').map(Number);
                        const mirrorCoord = `${-x},${y},${z}`;
                        state.blocks.delete(mirrorCoord);
                    }
                } else {
                    // Place new block
                    state.blocks.set(coord, currentMaterial);
                    this.addToRecentMaterials(currentMaterial);
                    
                    // Place symmetry block if enabled
                    if (state.symmetryMode) {
                        const [x, y, z] = coord.split(',').map(Number);
                        const mirrorCoord = `${-x},${y},${z}`;
                        if (mirrorCoord !== coord) { // Don't duplicate if on center axis
                            state.blocks.set(mirrorCoord, currentMaterial);
                        }
                    }
                }
                
                this.syncTotemToMob();
                this.renderTotemGrid();
                this.updateTotemPreview(this.currentMob);
                this.updateTotemStatistics();
            });

            // Right click to remove
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const coord = cell.dataset.coord;
                
                // Save history before modification
                this.saveTotemHistory();
                
                state.blocks.delete(coord);
                
                // Remove symmetry block if enabled
                if (state.symmetryMode) {
                    const [x, y, z] = coord.split(',').map(Number);
                    const mirrorCoord = `${-x},${y},${z}`;
                    state.blocks.delete(mirrorCoord);
                }
                
                this.syncTotemToMob();
                this.renderTotemGrid();
                this.updateTotemPreview(this.currentMob);
                this.updateTotemStatistics();
            });

            // Hover effects
            cell.addEventListener('mouseenter', () => {
                if (!state.blocks.has(cell.dataset.coord)) {
                    cell.style.background = 'rgba(139, 92, 246, 0.4)';
                    cell.style.borderColor = '#a78bfa';
                    cell.style.transform = 'scale(1.15)';
                    cell.style.zIndex = '10';
                }
            });

            cell.addEventListener('mouseleave', () => {
                if (!state.blocks.has(cell.dataset.coord)) {
                    const hasOther = cell.dataset.hasOther === 'true';
                    const x = cell.dataset.x;
                    const y = cell.dataset.y;
                    const z = cell.dataset.z;
                    const isSpawnPoint = x === '0' && y === '0' && z === '0';
                    
                    if (hasOther) {
                        cell.style.background = 'rgba(139, 92, 246, 0.15)';
                        cell.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    } else if (isSpawnPoint) {
                        cell.style.background = 'rgba(239,68,68,0.2)';
                        cell.style.borderColor = '#ef4444';
                    } else {
                        cell.style.background = 'rgba(255,255,255,0.05)';
                        cell.style.borderColor = 'rgba(255,255,255,0.1)';
                    }
                    cell.style.transform = 'scale(1)';
                    cell.style.zIndex = '1';
                }
            });
        });
    }

    /**
     * Sync grid state to mob pattern array
     */
    syncGridToPattern(mob) {
        if (!mob.totem) mob.totem = {};
        mob.totem.Pattern = Array.from(this.totemGridState.blocks.entries())
            .map(([coord, material]) => `${coord} ${material}`)
            .sort(); // Sort for consistency
        this.editor.markDirty();
    }

    /**
     * Show material browser modal
     */
    showMaterialBrowser(callback) {
        // Import materials list
        if (typeof window.minecraftMaterials === 'undefined') {
            // Fallback materials
            const materials = ['STONE', 'COBBLESTONE', 'NETHERITE_BLOCK', 'DIAMOND_BLOCK', 'GOLD_BLOCK', 'IRON_BLOCK', 'EMERALD_BLOCK', 'PLAYER_HEAD', 'PLAYER_WALL_HEAD', 'OBSIDIAN', 'BEDROCK', 'QUARTZ_BLOCK'];
            this.showMaterialModal(materials, callback);
            return;
        }
        
        this.showMaterialModal(window.minecraftMaterials, callback);
    }

    /**
     * Show material selection modal
     */
    showMaterialModal(materials, callback) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
        modal.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 24px; max-width: 600px; width: 90%; max-height: 80vh; display: flex; flex-direction: column;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: var(--text-primary);">
                        <i class="fas fa-cube" style="color: #8b5cf6; margin-right: 8px;"></i>
                        Select Material
                    </h3>
                    <button class="material-modal-close" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <input 
                    type="text" 
                    class="material-search" 
                    placeholder="Search materials..."
                    style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; color: white; margin-bottom: 16px; font-size: 14px;"
                >
                
                <div class="material-list" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px;">
                    ${materials.slice(0, 100).map(mat => `
                        <div class="material-item" data-material="${mat}" style="padding: 12px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: var(--font-mono); font-size: 12px; text-align: center;">
                            ${mat}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const searchInput = modal.querySelector('.material-search');
        const materialList = modal.querySelector('.material-list');
        const closeBtn = modal.querySelector('.material-modal-close');
        
        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = materials.filter(m => m.toLowerCase().includes(query));
            materialList.innerHTML = filtered.slice(0, 100).map(mat => `
                <div class="material-item" data-material="${mat}" style="padding: 12px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: var(--font-mono); font-size: 12px; text-align: center;">
                    ${mat}
                </div>
            `).join('');
            
            // Reattach click handlers
            attachMaterialHandlers();
        });
        
        // Material selection
        const attachMaterialHandlers = () => {
            modal.querySelectorAll('.material-item').forEach(item => {
                item.addEventListener('click', () => {
                    callback(item.dataset.material);
                    document.body.removeChild(modal);
                });
                
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';
                    item.style.transform = 'scale(1.05)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'rgba(139,92,246,0.1)';
                    item.style.transform = 'scale(1)';
                });
            });
        };
        
        attachMaterialHandlers();
        
        // Close handlers
        closeBtn.addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        // Focus search
        searchInput.focus();
    }

    /**
     * Update totem preview canvas
     */
    updateTotemPreview(mob) {
        if (!this.totemRenderer) return;
        
        const pattern = mob?.totem?.Pattern || mob?.Totem?.Pattern || [];
        const head = mob?.totem?.Head || mob?.Totem?.Head || 'PLAYER_HEAD';
        
        this.totemRenderer.renderTotem(pattern, head);
    }
    
    addSkill() {
        // Legacy method - now handled by SkillBuilderEditor
        if (this.skillsEditor) {
            this.skillsEditor.showSkillEditor();
        }
    }
    
    addDrop() {
        // Legacy method - now handled by MobDropsEditor
        if (this.dropsEditor) {
            this.dropsEditor.showDropEditor();
        }
    }
    
    initializeTemplateDropdown() {
        const container = document.getElementById('template-dropdown-container');
        if (!container) return;
        
        const availableMobs = this.getAvailableMobs(this.currentMob?.name);
        const currentTemplate = this.currentMob?.template || '';
        
        // Create a custom template dropdown with validation
        container.innerHTML = `
            <div class="template-dropdown">
                <div class="template-input-wrapper">
                    <input 
                        type="text" 
                        class="form-input template-input" 
                        id="mob-template"
                        placeholder="Search or type mob name..."
                        value="${currentTemplate}"
                        autocomplete="off"
                    >
                    <i class="fas fa-chevron-down template-dropdown-icon"></i>
                </div>
                <div class="template-dropdown-list" id="template-dropdown-list">
                    <div class="template-dropdown-item template-clear" data-value="">
                        <i class="fas fa-times"></i> Clear Template
                    </div>
                    ${availableMobs.map(name => `
                        <div class="template-dropdown-item ${name === currentTemplate ? 'selected' : ''}" data-value="${name}">
                            <i class="fas fa-skull"></i> ${name}
                        </div>
                    `).join('')}
                    ${availableMobs.length === 0 ? '<div class="template-dropdown-empty">No other mobs in pack</div>' : ''}
                </div>
            </div>
        `;
        
        const input = container.querySelector('.template-input');
        const list = container.querySelector('.template-dropdown-list');
        const icon = container.querySelector('.template-dropdown-icon');
        
        let isOpen = false;
        
        const openDropdown = () => {
            list.style.display = 'block';
            icon.classList.add('open');
            isOpen = true;
        };
        
        const closeDropdown = () => {
            list.style.display = 'none';
            icon.classList.remove('open');
            isOpen = false;
        };
        
        const filterItems = (searchText) => {
            const items = list.querySelectorAll('.template-dropdown-item:not(.template-clear)');
            const search = searchText.toLowerCase();
            
            items.forEach(item => {
                const value = item.dataset.value.toLowerCase();
                item.style.display = value.includes(search) ? '' : 'none';
            });
        };
        
        const selectTemplate = (value) => {
            input.value = value;
            this.updateMob('template', value);
            closeDropdown();
            
            // Re-render to show inheritance preview
            window.collapsibleManager?.saveStates();
            this.render(this.currentMob);
        };
        
        // Event listeners
        input.addEventListener('focus', openDropdown);
        
        input.addEventListener('input', (e) => {
            filterItems(e.target.value);
            openDropdown();
        });
        
        input.addEventListener('blur', () => {
            // Delay to allow click on dropdown item
            setTimeout(closeDropdown, 200);
        });
        
        input.addEventListener('change', () => {
            this.updateMob('template', input.value);
        });
        
        icon.addEventListener('click', () => {
            if (isOpen) {
                closeDropdown();
            } else {
                input.focus();
            }
        });
        
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.template-dropdown-item');
            if (item) {
                selectTemplate(item.dataset.value);
            }
        });
    }
    
}

window.MobEditor = MobEditor;
