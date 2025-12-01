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
        this.conditionEditor = null;
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
                        <button class="btn btn-outline" id="duplicate-mob" title="Create a copy of this mob">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline" id="rename-mob" title="Rename this mob">
                            <i class="fas fa-pen"></i> Rename
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
                ${isAdvanced ? this.renderBossBarSection(mob) : ''}
                ${isAdvanced ? this.renderEquipmentSection(mob) : ''}
                ${isAdvanced ? this.renderDamageModifiersSection(mob) : ''}
                ${isAdvanced ? this.renderKillMessagesSection(mob) : ''}
                ${isAdvanced ? this.renderAIGoalSelectorsSection(mob) : ''}
                ${isAdvanced ? this.renderAITargetSelectorsSection(mob) : ''}
                ${isAdvanced ? this.renderModulesSection(mob) : ''}
                ${isAdvanced ? this.renderLevelModifiersSection(mob) : ''}

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
    
    saveMob(mob) {
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
        
        // Sync data before saving
        this.syncToFile();
        
        // Save through editor
        if (this.editor && this.editor.saveCurrentFile) {
            this.editor.saveCurrentFile();
        }
    }
    
    /**
     * Add a new mob section to the current file
     */
    addNewSection() {
        const newName = prompt('Enter name for new mob:');
        if (!newName || newName.trim() === '') return;
        
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
            health: 20,
            damage: 5
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
    duplicateMob() {
        const newName = prompt('Enter name for duplicated mob:', this.currentMob.name + '_copy');
        if (!newName || newName.trim() === '') return;
        
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
    renameMob() {
        const newName = prompt('Enter new name for mob:', this.currentMob.name);
        if (!newName || newName.trim() === '' || newName.trim() === this.currentMob.name) return;
        
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
    
    renderCoreIdentity(mob, isAdvanced) {
        const hasTemplate = mob.template && mob.template.trim();
        const templateMob = hasTemplate ? this.getTemplateMob(mob.template) : null;
        
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
                    
                    <div class="form-group" data-mob-field="Display">
                        <label class="form-label">Display Name</label>
                        <input type="text" class="form-input" id="mob-display" value="${mob.display || ''}">
                        <small class="form-hint">Use & for color codes (e.g., &6Gold &lBold)</small>
                    </div>
                    
                    ${this.renderVanillaOverrideInfo(mob)}
                </div>
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
    detachFromTemplate() {
        if (!this.currentMob || !this.currentMob.template) return;
        
        const templateMob = this.getTemplateMob(this.currentMob.template);
        if (!templateMob) {
            this.editor.showToast('Template not found', 'error');
            return;
        }
        
        // Confirm action
        if (!confirm(`This will copy all values from "${this.currentMob.template}" to this mob and remove the template reference. Continue?`)) {
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
                            <input type="number" class="form-input" id="mob-health" value="${mob.health || 20}" min="0" step="0.5">
                            <small class="form-hint">Maximum health points</small>
                        </div>
                        <div class="form-group" data-mob-field="Damage">
                            <label class="form-label">Damage</label>
                            <input type="number" class="form-input" id="mob-damage" value="${mob.damage || 0}" min="0" step="0.5">
                            <small class="form-hint">Attack damage</small>
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
            <div class="card collapsible-card collapsed entity-specific-card" data-mob-field="${fieldName}">
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
                        items: MINECRAFT_BLOCKS,
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
                        items: MINECRAFT_ITEMS,
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
                    <p class="help-text">Stats increase per level. Example: Health 10 means +10 HP per level (Lvl 2 = +10 HP, Lvl 3 = +20 HP).</p>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Health per Level</label>
                            <input type="number" id="level-health" class="form-input" 
                                   value="${lm.health || 0}" step="0.5" min="0" placeholder="0">
                            <span class="help-text">Additional health per level</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Damage per Level</label>
                            <input type="number" id="level-damage" class="form-input" 
                                   value="${lm.damage || 0}" step="0.1" min="0" placeholder="0">
                            <span class="help-text">Additional damage per level</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Power per Level</label>
                            <input type="number" id="level-power" class="form-input" 
                                   value="${lm.power || 0}" step="0.1" min="0" placeholder="0">
                            <span class="help-text">Power multiplier for skill mechanics</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Armor per Level</label>
                            <input type="number" id="level-armor" class="form-input" 
                                   value="${lm.armor || 0}" step="0.5" min="0" placeholder="0">
                            <span class="help-text">Additional armor per level</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Knockback Resistance per Level</label>
                            <input type="number" id="level-knockback" class="form-input" 
                                   value="${lm.knockbackResistance || 0}" step="0.01" min="0" max="1" placeholder="0">
                            <span class="help-text">0.0 to 1.0 (0% to 100%)</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Movement Speed per Level</label>
                            <input type="number" id="level-movement" class="form-input" 
                                   value="${lm.movementSpeed || 0}" step="0.01" min="0" placeholder="0">
                            <span class="help-text">Additional movement speed per level</span>
                        </div>
                    </div>
                    
                    <div class="level-preview-compact" style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 0.5rem; border: 1px solid var(--border-primary);">
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                            <label style="font-weight: 600; color: var(--text-primary); white-space: nowrap;">Preview at Level:</label>
                            <input type="number" id="level-preview-input" class="form-input" 
                                   value="5" min="1" max="999" style="width: 80px;">
                            <div id="level-preview-stats" style="font-size: 0.9rem; color: var(--text-secondary); flex: 1;">
                                Health: ${mob.health || 10} • Damage: ${mob.damage || 1} • Power: 0 • Armor: 0 • KB Res: 0.0 • Speed: ${mob.options?.movementSpeed || 0.3}
                            </div>
                        </div>
                    </div>
                    
                    <div class="alert alert-info" style="margin-top: 1rem;">
                        <strong>About Power:</strong> Power affects skill mechanics (damage, leap, projectile) - not base stats. 
                        Combine with mob levels using spawners or the SetLevel mechanic.
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSkillsSection(mob) {
        return `
            <div class="card collapsible-card">
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
            <div class="card collapsible-card">
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
                <div class="card-body collapsible-card-body" style="display: none;">
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
        const sections = {
            general: { title: 'General Options', icon: 'cog', fields: [] },
            perPlayer: { title: 'Per-Player Options', icon: 'users', fields: [] },
            visualDefaults: { title: 'Visual Defaults', icon: 'eye', fields: [] },
            itemVFX: { title: 'Item VFX Settings', icon: 'magic', fields: [] },
            messages: { title: 'Messages', icon: 'comment', fields: [] }
        };

        // Categorize fields
        Object.entries(allFields).forEach(([key, field]) => {
            if (field.name === 'DropMethod') return; // Skip, already handled

            // Determine section based on field name patterns
            if (['ShowDeathChatMessage', 'ShowDeathHologram', 'Lootsplosion', 'HologramItemNames', 'RequiredDamagePercent', 'HologramTimeout'].includes(field.name)) {
                sections.general.fields.push({ key, field });
            } else if (['PerPlayerDrops', 'ClientSideDrops'].includes(field.name)) {
                sections.perPlayer.fields.push({ key, field });
            } else if (['ItemGlowByDefault', 'ItemBeamByDefault', 'ItemVFXByDefault'].includes(field.name)) {
                sections.visualDefaults.fields.push({ key, field });
            } else if (field.name.startsWith('ItemVFX')) {
                sections.itemVFX.fields.push({ key, field });
            } else if (['HologramMessage', 'ChatMessage'].includes(field.name)) {
                sections.messages.fields.push({ key, field });
            } else {
                sections.general.fields.push({ key, field });
            }
        });

        // Render each section
        Object.entries(sections).forEach(([sectionKey, section]) => {
            if (section.fields.length === 0) return;

            html += `
                <div class="card collapsible-card collapsed" style="margin-top: 1rem;">
                    <div class="card-header collapsible-header" style="background: #f8f9fa; padding: 0.75rem 1rem;">
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600;">
                            <i class="fas fa-${section.icon}"></i> ${section.title}
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h4>
                    </div>
                    <div class="collapsible-card-body" style="display: none; padding: 1rem;">
                        <div class="row">
            `;

            section.fields.forEach(({ key, field }) => {
                const value = dropOptions[field.name];
                html += `<div class="col-md-6">`;
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
        const fieldId = `drop-option-${field.name}`;
        const currentValue = value !== undefined ? value : field.default;

        let inputHtml = '';

        switch (field.type) {
            case 'boolean':
                inputHtml = `
                    <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input drop-option-field" id="${fieldId}" data-field="${field.name}" ${currentValue ? 'checked' : ''}>
                        <label class="custom-control-label" for="${fieldId}">${field.label}</label>
                    </div>
                `;
                break;

            case 'number':
                inputHtml = `
                    <label class="form-label" for="${fieldId}">${field.label}</label>
                    <input type="number" class="form-input drop-option-field" id="${fieldId}" data-field="${field.name}" value="${currentValue || ''}" step="any">
                `;
                break;

            case 'text':
            case 'select':
                if (field.type === 'select' && field.options) {
                    inputHtml = `
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <select class="form-select drop-option-field" id="${fieldId}" data-field="${field.name}">
                            ${field.options.map(opt => `<option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    `;
                } else {
                    inputHtml = `
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <input type="text" class="form-input drop-option-field" id="${fieldId}" data-field="${field.name}" value="${currentValue || ''}">
                    `;
                }
                break;

            case 'textarea':
                inputHtml = `
                    <label class="form-label" for="${fieldId}">${field.label}</label>
                    <textarea class="form-input drop-option-field" id="${fieldId}" data-field="${field.name}" rows="2">${currentValue || ''}</textarea>
                `;
                break;
        }

        let paperWarning = '';
        if (field.paperOnly) {
            paperWarning = '<small class="text-warning"><i class="fas fa-exclamation-triangle"></i> Requires Paper server</small>';
        }

        return `
            <div class="form-group">
                ${inputHtml}
                <small class="form-text text-muted">${field.description}</small>
                ${paperWarning}
            </div>
        `;
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
        document.getElementById('save-mob')?.addEventListener('click', () => {
            this.saveMob(this.currentMob);
        });
        
        // New section button (add new mob to current file)
        document.getElementById('new-mob')?.addEventListener('click', () => {
            this.addNewSection();
        });
        
        // Duplicate mob button
        document.getElementById('duplicate-mob')?.addEventListener('click', () => {
            this.duplicateMob();
        });
        
        // Rename mob button
        document.getElementById('rename-mob')?.addEventListener('click', () => {
            this.renameMob();
        });

        // Initialize collapsible functionality
        window.collapsibleManager.initializeCollapsible();
        
        // Restore collapsible states (skip when just switched to advanced)
        if (!this.editor.state.justSwitchedToAdvanced) {
            window.collapsibleManager.restoreStates();
        }
        
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
                this.updateMob('type', e.target.value);
                // Update YAML preview to show the Type override
                this.editor.updateYAMLPreview();
                // Re-render to show/hide entity-specific sections
                this.render(this.currentMob);
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
            'faction'
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
        const selectFields = ['despawn', 'profession', 'villagertype', 'horsearmor', 'horsecolor', 'horsestyle', 'billboard', 'transform', 'alignment'];
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
            'hastrades', 'preventslimesplit', 'saddled', 'tamed', 'defaultbackground', 'shadowed', 'seethrough'
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

                if (value !== undefined && value !== '') {
                    this.currentMob.dropOptions[fieldName] = value;
                } else {
                    delete this.currentMob.dropOptions[fieldName];
                }
            });
        });
        
        // Note: Skills and Drops add buttons are handled by their respective editor components
        // SkillBuilderEditor handles #add-skill-line-btn internally
        // MobDropsEditor handles #add-mobdrop-btn internally
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
            'seethrough': 'seeThrough'
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
    }
    
    initializePhase2Components() {
        const mob = this.currentMob;
        if (!mob) return;
        
        // Initialize AI Goals Editor
        const aiGoalsContainer = document.getElementById('mob-ai-goals-editor');
        if (aiGoalsContainer) {
            if (!this.aiGoalsEditor) {
                this.aiGoalsEditor = new AIEditor('mob-ai-goals-editor', 'goals', mob);
                this.aiGoalsEditor.onChange((goals) => {
                    this.currentMob.aiGoalSelectors = goals;
                    this.editor.markDirty();
                    // Update count badge
                    const badge = document.querySelector('.card-title .fas.fa-brain')?.parentElement.querySelector('.count-badge');
                    if (badge) badge.textContent = goals ? goals.length : 0;
                });
            } else {
                this.aiGoalsEditor.setValue(mob.aiGoalSelectors || []);
            }
        }
        
        // Initialize AI Targets Editor
        const aiTargetsContainer = document.getElementById('mob-ai-targets-editor');
        if (aiTargetsContainer) {
            if (!this.aiTargetsEditor) {
                this.aiTargetsEditor = new AIEditor('mob-ai-targets-editor', 'targets', mob);
                this.aiTargetsEditor.onChange((targets) => {
                    this.currentMob.aiTargetSelectors = targets;
                    this.editor.markDirty();
                    // Update count badge
                    const badge = document.querySelector('.card-title .fas.fa-crosshairs')?.parentElement.querySelector('.count-badge');
                    if (badge) badge.textContent = targets ? targets.length : 0;
                });
            } else {
                this.aiTargetsEditor.setValue(mob.aiTargetSelectors || []);
            }
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
        
        // Initialize Condition Editor
        if (!this.conditionEditor) {
            this.conditionEditor = new ConditionEditor('inline');
        }
        
        // Initialize Mechanic Browser
        if (!this.mechanicBrowser) {
            this.mechanicBrowser = new MechanicBrowser(
                this.targeterBrowser,
                this.triggerBrowser,
                this.conditionEditor
            );
        }
        
        // Initialize Skills Editor
        const skillsContainer = document.getElementById('mob-skills-editor');
        if (skillsContainer) {
            // Always recreate since DOM was recreated on render
            this.skillsEditor = new SkillBuilderEditor(
                skillsContainer,
                this.targeterBrowser,
                this.mechanicBrowser
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
