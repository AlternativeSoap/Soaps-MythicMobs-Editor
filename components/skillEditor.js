/**
 * Skill Editor Component
 * Full Metaskill support with all MythicMobs skill properties
 * Updated to use new skill line system with browser components
 */
class SkillEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentSkill = null;
        this.skillBuilderEditor = null;
        
        // Browser components
        this.targeterBrowser = null;
        this.mechanicBrowser = null;
        // conditionEditor removed - using global conditionBrowserV2
    }
    
    render(skill) {
        this.currentSkill = skill;
        const container = document.getElementById('skill-editor-view');
        if (!container) return;
        
        // Check if this is a file container
        if (skill._isFileContainer) {
            this.renderFileContainer(skill, container);
            return;
        }
        
        const isAdvanced = this.editor.state.currentMode === 'advanced';

        container.innerHTML = `
            <div class="editor-header">
                <h2>
                    <i class="fas fa-magic"></i>
                    Metaskill Editor
                    <span class="item-name">${skill.name}</span>
                    <span class="mode-badge ${isAdvanced ? 'advanced' : 'beginner'}">${isAdvanced ? 'Advanced' : 'Beginner'} Mode</span>
                </h2>
                <div class="editor-actions">
                    <div class="action-group secondary-actions">
                        <button class="btn btn-outline" id="duplicate-skill" title="Create a copy of this skill">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline" id="rename-skill" title="Rename this skill">
                            <i class="fas fa-pen"></i> Rename
                        </button>
                        <button class="btn btn-outline btn-danger" id="delete-skill" title="Delete this skill">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-secondary" id="new-skill" title="Add a new skill to this file">
                            <i class="fas fa-plus"></i> New Section
                        </button>
                    </div>
                    <button class="btn btn-primary" id="save-skill">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>

            <div class="editor-content">
                <!-- Core Skill Properties -->
                <div class="card collapsible-card">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-cog"></i> Skill Properties
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label">Skill Name <span class="required">*</span></label>
                                <input type="text" class="form-input" id="skill-name" value="${skill.name}">
                                <small class="form-hint">Internal identifier (no spaces). This is how you reference this skill.</small>
                                <small class="form-hint" id="skill-name-sanitized" style="color: var(--accent-primary); display: none;"></small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cooldown (seconds)</label>
                                <input type="number" class="form-input" id="skill-cooldown" value="${this.getConditionStorageObject().cooldown || ''}" min="0" step="0.1" placeholder="0">
                                <small class="form-hint">Time between executions for the same caster</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type=\"checkbox\" id=\"skill-cancelifnotargets\" ${this.getConditionStorageObject().cancelIfNoTargets !== false ? 'checked' : ''}>
                                Cancel If No Targets
                            </label>
                            <small class="form-hint">If enabled, skill won't execute if no valid targets are found (default: true)</small>
                        </div>
                    </div>
                </div>
                
                ${isAdvanced ? this.renderAdvancedSkillOptions(skill) : ''}
                
                <!-- Main Skills Section -->
                <div class="card collapsible-card">
                    <div class="card-header collapsible-header">
                        <h3 class="card-title">
                            <i class="fas fa-magic"></i> Skills
                            <span class="count-badge">${skill.Skills ? skill.Skills.length : 0}</span>
                            <i class="fas fa-chevron-down collapse-icon"></i>
                        </h3>
                    </div>
                    <div class="card-body collapsible-card-body">
                        <p class="help-text">
                            The mechanics to execute when this skill is called. 
                            Mechanics inherit targets from the calling skill unless overridden with a targeter.
                        </p>
                        <div id="skill-lines-editor"></div>
                    </div>
                </div>
                
                ${isAdvanced ? this.renderConditionsSections(skill) : ''}
            </div>
        `;
        
        // Initialize skill builder after DOM is ready
        setTimeout(() => {
            this.initializeSkillBuilder();
        }, 100);
        
        this.attachEventListeners();
        window.collapsibleManager?.initializeCollapsible();
    }
    
    /**
     * Render advanced skill options (OnCooldownSkill, FailedConditionsSkill, etc.)
     */
    renderAdvancedSkillOptions(skill) {
        const targetObj = this.getConditionStorageObject();
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-sliders-h"></i> Advanced Options
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">On Cooldown Skill</label>
                            <input type="text" class="form-input" id="skill-oncooldownskill" value="${targetObj.onCooldownSkill || ''}" placeholder="SkillName">
                            <small class="form-hint">Skill to execute if this one is on cooldown</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Failed Conditions Skill</label>
                            <input type="text" class="form-input" id="skill-failedconditionsskill" value="${targetObj.failedConditionsSkill || targetObj.onFailSkill || ''}" placeholder="SkillName">
                            <small class="form-hint">Skill to execute if conditions fail (alias: OnFailSkill)</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Skill (Async Execute)</label>
                        <input type="text" class="form-input" id="skill-skillref" value="${targetObj.skill || ''}" placeholder="AnotherSkillName">
                        <small class="form-hint">Another metaskill to execute (ignores its conditions/cooldown, runs before this skill's mechanics)</small>
                    </div>
                    
                    <div class="skill-parameters-info" style="
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, var(--bg-secondary) 100%);
                        border: 1px solid rgba(139, 92, 246, 0.3);
                        border-radius: 0.5rem;
                        padding: 0.75rem 1rem;
                        margin-top: 1rem;
                    ">
                        <h4 style="margin: 0 0 0.5rem 0; color: #a78bfa; font-size: 0.9rem;">
                            <i class="fas fa-gem"></i> Skill Parameters (Premium)
                        </h4>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
                            Pass custom parameters when calling this skill:<br>
                            <code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 3px;">- skill{s=ThisSkill;damage=20;effect=fire}</code><br>
                            Then use <code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 3px;">&lt;skill.damage&gt;</code> in mechanics.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render conditions sections (Conditions, TargetConditions, TriggerConditions)
     */
    renderConditionsSections(skill) {
        const targetObj = this.getConditionStorageObject();
        const conditions = targetObj.Conditions || targetObj.conditions || [];
        const targetConditions = targetObj.TargetConditions || targetObj.targetConditions || [];
        const triggerConditions = targetObj.TriggerConditions || targetObj.triggerConditions || [];
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-filter"></i> Conditions
                        ${conditions.length > 0 ? `<span class="count-badge">${conditions.length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Conditions that evaluate the <strong>caster</strong> of the skill. All must pass for skill to execute.</p>
                    <div class="condition-list-container" id="conditions-list">
                        ${this.renderConditionList(conditions, 'Conditions')}
                    </div>
                    <button class="btn btn-primary btn-sm" id="btnBrowseConditions" style="margin-top: 10px;">
                        <i class="fas fa-search"></i> Browse Conditions
                    </button>
                </div>
            </div>
            
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-crosshairs"></i> Target Conditions
                        ${targetConditions.length > 0 ? `<span class="count-badge">${targetConditions.length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Conditions that evaluate each <strong>inherited target</strong>. Filters targets before mechanics execute.</p>
                    <div class="condition-list-container" id="targetconditions-list">
                        ${this.renderConditionList(targetConditions, 'TargetConditions')}
                    </div>
                    <button class="btn btn-primary btn-sm" id="btnBrowseTargetConditions" style="margin-top: 10px;">
                        <i class="fas fa-search"></i> Browse Conditions
                    </button>
                </div>
            </div>
            
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-bolt"></i> Trigger Conditions
                        ${triggerConditions.length > 0 ? `<span class="count-badge">${triggerConditions.length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <p class="help-text">Conditions that evaluate the <strong>trigger entity</strong> (the one who started the skill tree). Use @Trigger to target them.</p>
                    <div class="condition-list-container" id="triggerconditions-list">
                        ${this.renderConditionList(triggerConditions, 'TriggerConditions')}
                    </div>
                    <button class="btn btn-primary btn-sm" id="btnBrowseTriggerConditions" style="margin-top: 10px;">
                        <i class="fas fa-search"></i> Browse Conditions
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render condition list as interactive cards
     */
    renderConditionList(conditions, sectionType) {
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
            return '<p class="empty-state" style="color: var(--text-secondary); font-style: italic; margin: 10px 0;">No conditions added yet. Click "Browse Conditions" to add.</p>';
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
                    <button class="btn-sm" onclick="window.skillEditor.toggleConditionAction('${sectionType}', ${index})" title="Click to toggle true/false" style="
                        padding: 4px 8px;
                        background: ${action === 'true' ? '#10b98144' : action === 'false' ? '#ef444444' : '#3b82f644'};
                        border: 1px solid ${action === 'true' ? '#10b981' : action === 'false' ? '#ef4444' : '#3b82f6'};
                        border-radius: 4px;
                        font-size: 0.85em;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${this.escapeHtml(actionDisplay)}</button>
                    <button class="btn-icon" onclick="window.skillEditor.editCondition('${sectionType}', ${index})" title="Edit condition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="window.skillEditor.removeCondition('${sectionType}', ${index})" title="Remove condition">
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
        
        // Remove leading "- " if present
        let str = conditionStr.trim();
        if (str.startsWith('- ')) str = str.substring(2);
        
        // Match pattern: "conditionName{params} action param"
        // Actions: true, false, power 2.0, cast SkillName, castinstead SkillName, orElseCast SkillName, cancel
        const actionRegex = /\s+(true|false|power|cast|castinstead|orElseCast|cancel)(?:\s+([\w\.]+))?\s*$/;
        const match = str.match(actionRegex);
        
        if (match) {
            const conditionStr = str.substring(0, match.index);
            const action = match[1];
            const actionParam = match[2] || null;
            return { conditionStr, action, actionParam };
        }
        
        // Default to true if no action specified
        return { conditionStr: str, action: 'true', actionParam: null };
    }
    
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Format conditions array for textarea display (legacy compatibility)
     */
    formatConditionsForDisplay(conditions) {
        if (!conditions || !Array.isArray(conditions)) return '';
        return conditions.map(c => `- ${c}`).join('\n');
    }
    
    /**
     * Open condition browser for a specific section
     */
    openConditionBrowserForSection(sectionType) {
        // Initialize global condition browser if needed
        if (!window.conditionBrowser) {
            if (typeof ConditionBrowser === 'undefined') {
                this.editor.showToast('Condition Browser not loaded', 'error');
                return;
            }
            window.conditionBrowser = new ConditionBrowser();
        }
        
        console.log(`🔍 Opening condition browser for ${sectionType}`);
        
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
                
                console.log(`✅ Adding condition to ${sectionType}:`, conditionEntry);
                
                // Determine where to store conditions
                const targetObj = this.getConditionStorageObject();
                
                // Initialize array if needed
                if (!targetObj[sectionType]) {
                    targetObj[sectionType] = [];
                }
                
                // Add condition
                targetObj[sectionType].push(conditionEntry);
                
                // Re-render the condition list
                this.refreshConditionList(sectionType);
                
                // Mark as dirty and sync
                this.syncToFile();
                this.editor.markDirty();
                
                this.editor.showToast(`Condition added to ${sectionType}`, 'success');
            }
        });
    }
    
    /**
     * Refresh condition list display for a section
     */
    refreshConditionList(sectionType) {
        const containerId = sectionType.toLowerCase() + '-list';
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const targetObj = this.getConditionStorageObject();
        const conditions = targetObj[sectionType] || [];
        container.innerHTML = this.renderConditionList(conditions, sectionType);
        
        // Update count badge
        const card = container.closest('.card');
        if (card) {
            const badge = card.querySelector('.count-badge');
            if (conditions.length > 0) {
                if (badge) {
                    badge.textContent = conditions.length;
                } else {
                    const title = card.querySelector('.card-title');
                    const newBadge = document.createElement('span');
                    newBadge.className = 'count-badge';
                    newBadge.textContent = conditions.length;
                    title.insertBefore(newBadge, title.querySelector('.collapse-icon'));
                }
            } else if (badge) {
                badge.remove();
            }
        }
    }
    
    /**
     * Toggle condition action between true and false
     */
    toggleConditionAction(sectionType, index) {
        const targetObj = this.getConditionStorageObject();
        if (!targetObj[sectionType] || !targetObj[sectionType][index]) return;
        
        const conditionStr = targetObj[sectionType][index];
        const { conditionStr: cond, action, actionParam } = this.parseCondition(conditionStr);
        
        // Toggle between true and false only
        const newAction = action === 'true' ? 'false' : 'true';
        
        // Rebuild condition string with new action
        const newConditionStr = actionParam 
            ? `${cond} ${newAction} ${actionParam}`
            : `${cond} ${newAction}`;
        
        targetObj[sectionType][index] = newConditionStr;
        this.refreshConditionList(sectionType);
        this.syncToFile();
        this.editor.markDirty();
    }
    
    /**
     * Remove condition from a section
     */
    async removeCondition(sectionType, index) {
        const confirmed = await this.editor.showConfirmDialog('Remove Condition', 'Remove this condition?', 'Remove', 'Cancel');
        if (!confirmed) return;
        
        if (!this.currentSkill[sectionType]) return;
        
        this.currentSkill[sectionType].splice(index, 1);
        this.refreshConditionList(sectionType);
        this.syncToFile();
        this.editor.markDirty();
        
        this.editor.showToast('Condition removed', 'success');
    }
    
    /**
     * Edit existing condition
     */
    async editCondition(sectionType, index) {
        const targetObj = this.getConditionStorageObject();
        if (!targetObj[sectionType] || !targetObj[sectionType][index]) return;
        
        const conditionStr = targetObj[sectionType][index];
        const { conditionStr: cond, action, actionParam } = this.parseCondition(conditionStr);
        
        // TODO: Parse condition string to prefill browser form
        // For now, just remove and let user add again
        const confirmed = await this.editor.showConfirmDialog('Edit Condition', 'Edit mode: This will remove the condition. Add it again with new settings.', 'OK', 'Cancel');
        if (confirmed) {
            targetObj[sectionType].splice(index, 1);
            this.refreshConditionList(sectionType);
            this.syncToFile();
            this.editor.markDirty();
            
            // Open browser for re-adding
            this.openConditionBrowserForSection(sectionType);
        }
    }
    
    /**
     * Parse conditions from textarea (legacy compatibility)
     */
    parseConditionsFromText(text) {
        if (!text || !text.trim()) return [];
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.startsWith('- ') ? line.substring(2) : line);
    }
    
    attachEventListeners() {
        // Save button
        document.getElementById('save-skill')?.addEventListener('click', async () => {
            await this.saveSkill();
        });
        
        // New section button (add new skill to current file)
        document.getElementById('new-skill')?.addEventListener('click', () => {
            this.addNewSection();
        });
        
        // Duplicate skill button
        document.getElementById('duplicate-skill')?.addEventListener('click', () => {
            this.duplicateSkill();
        });
        
        // Rename skill button
        document.getElementById('rename-skill')?.addEventListener('click', () => {
            this.renameSkill();
        });
        
        document.getElementById('delete-skill')?.addEventListener('click', () => {
            this.deleteSkill();
        });
        
        document.getElementById('skill-name')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                console.log('✏️ Skill name changed:', e.target.value);
                let newName = e.target.value;
                const oldName = this.currentSkill.name;
                
                // Show sanitization preview if needed
                const sanitizedName = this.editor.sanitizeInternalName(newName);
                const sanitizedHint = document.getElementById('skill-name-sanitized');
                if (sanitizedHint && sanitizedName !== newName && newName.trim()) {
                    sanitizedHint.textContent = `Will be saved as: ${sanitizedName}`;
                    sanitizedHint.style.display = 'block';
                } else if (sanitizedHint) {
                    sanitizedHint.style.display = 'none';
                }
                
                // Apply sanitization
                newName = sanitizedName;
                
                // Update the skill name
                this.currentSkill.name = newName;
                
                // If we have a skills object, also rename the key in the skills object
                if (this.currentSkill.skills && this.skillBuilderEditor && this.skillBuilderEditor.currentSkill) {
                    const currentKey = this.skillBuilderEditor.currentSkill;
                    const skillData = this.currentSkill.skills[currentKey];
                    
                    // Only rename if the current key matches the old name and the new name is different
                    if (currentKey === oldName && newName !== oldName && skillData) {
                        // Create new key with new name
                        this.currentSkill.skills[newName] = skillData;
                        // Delete old key
                        delete this.currentSkill.skills[currentKey];
                        // Update current skill reference
                        this.skillBuilderEditor.currentSkill = newName;
                        this.skillBuilderEditor.skills = this.currentSkill.skills;
                    }
                }
                
                this.syncToFile();
                this.editor.markDirty();
                // Refresh file tree to show updated name
                this.editor.packManager.renderPackTree();
            }
        });
        
        document.getElementById('skill-cooldown')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                console.log('✏️ Skill cooldown changed:', e.target.value);
                const targetObj = this.getConditionStorageObject();
                targetObj.cooldown = parseFloat(e.target.value) || 0;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        // Cancel if no targets
        document.getElementById('skill-cancelifnotargets')?.addEventListener('change', (e) => {
            if (this.currentSkill) {
                const targetObj = this.getConditionStorageObject();
                targetObj.cancelIfNoTargets = e.target.checked;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        // Advanced options
        document.getElementById('skill-oncooldownskill')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                const targetObj = this.getConditionStorageObject();
                targetObj.onCooldownSkill = e.target.value || undefined;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        document.getElementById('skill-failedconditionsskill')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                const targetObj = this.getConditionStorageObject();
                targetObj.failedConditionsSkill = e.target.value || undefined;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        document.getElementById('skill-skillref')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                const targetObj = this.getConditionStorageObject();
                targetObj.skill = e.target.value || undefined;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        // Condition browser buttons
        document.getElementById('btnBrowseConditions')?.addEventListener('click', () => {
            this.openConditionBrowserForSection('Conditions');
        });
        
        document.getElementById('btnBrowseTargetConditions')?.addEventListener('click', () => {
            this.openConditionBrowserForSection('TargetConditions');
        });
        
        document.getElementById('btnBrowseTriggerConditions')?.addEventListener('click', () => {
            this.openConditionBrowserForSection('TriggerConditions');
        });
        
        // Store reference for onclick handlers
        window.skillEditor = this;
    }
    
    /**
     * Get the correct object where conditions should be stored
     * For multi-skill format (skill.skills), store in the individual skill object
     * For single skill format, store on root skill object
     */
    getConditionStorageObject() {
        if (this.currentSkill.skills && this.skillBuilderEditor && this.skillBuilderEditor.currentSkill) {
            // Multi-skill format: store in individual skill
            const skillName = this.skillBuilderEditor.currentSkill;
            if (!this.currentSkill.skills[skillName]) {
                this.currentSkill.skills[skillName] = { lines: [] };
            }
            return this.currentSkill.skills[skillName];
        }
        // Single skill format: store on root
        return this.currentSkill;
    }
    
    syncToFile() {
        // Sync currentSkill data to state.currentFile for live preview
        if (this.currentSkill && this.editor.state.currentFile) {
            if (window.DEBUG_MODE) {
                console.log('🔄 Syncing skill to file:', {
                    skillName: this.currentSkill.name,
                    fileId: this.editor.state.currentFile.id,
                    skillsData: JSON.parse(JSON.stringify(this.currentSkill.skills)),
                    skillsKeys: Object.keys(this.currentSkill.skills),
                    currentFileIdBefore: this.editor.state.currentFile.id
                });
            }
            
            // Deep copy to ensure nested objects are copied
            const skillDataCopy = JSON.parse(JSON.stringify(this.currentSkill));
            Object.assign(this.editor.state.currentFile, skillDataCopy);
            
            if (window.DEBUG_MODE) {
                console.log('✅ Skill synced to file:', {
                    fileSkillsAfterSync: JSON.parse(JSON.stringify(this.editor.state.currentFile.skills)),
                    fileSkillsKeys: Object.keys(this.editor.state.currentFile.skills),
                    fileIdAfterSync: this.editor.state.currentFile.id
                });
            }
            
            // Update YAML preview in side panel
            if (this.editor.updateYAMLPreview) {
                this.editor.updateYAMLPreview();
            }
        } else {
            console.warn('⚠️ Cannot sync - missing currentSkill or currentFile');
        }
    }
    
    async saveSkill() {
        if (!this.currentSkill || !this.currentSkill.name) {
            this.editor.showToast('Please enter a skill name', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('save-skill');
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
     * Add a new skill section to the current file
     */
    async addNewSection() {
        let newName = await this.editor.showPrompt('New Skill', 'Enter name for new skill:');
        if (!newName || newName.trim() === '') return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
        // Find the parent file for the current skill
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A skill with that name already exists in this file', 'error');
            return;
        }
        
        // Create new skill with defaults
        const skillName = newName.trim();
        const newSkill = {
            id: 'skill-' + Date.now(),
            name: skillName,
            skills: {
                [skillName]: { lines: [] }
            }
        };
        
        // Add to parent file's entries
        parentFile.entries.push(newSkill);
        
        // Open the new skill
        newSkill._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(newSkill, 'skill');
        this.editor.showToast(`Created new skill "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Update the file container in the tree (optimized)
        if (this.editor.packManager && typeof this.editor.packManager.updateFileContainer === 'function') {
            this.editor.packManager.updateFileContainer(parentFile.id, 'skill');
        }
    }
    
    /**
     * Duplicate the current skill within the same file
     */
    async duplicateSkill() {
        let newName = await this.editor.showPrompt('Duplicate Skill', 'Enter name for duplicated skill:', this.currentSkill.name + '_copy');
        if (!newName || newName.trim() === '') return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
        // Find the parent file for the current skill
        const parentFile = this.findParentFile();
        if (!parentFile) {
            this.editor.showToast('Could not find parent file', 'error');
            return;
        }
        
        // Check if name already exists in this file
        if (parentFile.entries.some(e => e.name === newName.trim())) {
            this.editor.showToast('A skill with that name already exists in this file', 'error');
            return;
        }
        
        // Create a deep copy of the skill
        const duplicatedSkill = typeof structuredClone !== 'undefined' ? structuredClone(this.currentSkill) : JSON.parse(JSON.stringify(this.currentSkill));
        const trimmedNewName = newName.trim();
        duplicatedSkill.name = trimmedNewName;
        duplicatedSkill.id = 'skill-' + Date.now();
        delete duplicatedSkill._parentFile;
        
        // If the skill has a skills object, rename the keys to match the new name
        if (duplicatedSkill.skills && typeof duplicatedSkill.skills === 'object') {
            const newSkillsObj = {};
            for (const [oldKey, skillData] of Object.entries(duplicatedSkill.skills)) {
                // Use the new name for the first/primary skill, keep other names
                const newKey = oldKey === this.currentSkill.name ? trimmedNewName : oldKey;
                newSkillsObj[newKey] = skillData;
            }
            duplicatedSkill.skills = newSkillsObj;
        }
        
        // Add to parent file's entries
        parentFile.entries.push(duplicatedSkill);
        
        // Open the new skill
        duplicatedSkill._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(duplicatedSkill, 'skill');
        this.editor.showToast(`Duplicated skill as "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh just this file container
        if (this.editor.packManager) {
            this.editor.packManager.updateFileContainer(parentFile.id, 'skill');
        }
    }
    
    /**
     * Find the parent file for the current skill
     */
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.skills) return null;
        
        // Check if _parentFile reference exists
        if (this.currentSkill._parentFile) {
            return pack.skills.find(f => f.id === this.currentSkill._parentFile.id);
        }
        
        // Search all files for this skill
        for (const file of pack.skills) {
            if (file.entries && file.entries.some(e => e.id === this.currentSkill.id)) {
                return file;
            }
        }
        
        return null;
    }
    
    /**
     * Rename the current skill
     */
    async renameSkill() {
        let newName = await this.editor.showPrompt('Rename Skill', 'Enter new name for skill:', this.currentSkill.name);
        if (!newName || newName.trim() === '' || newName.trim() === this.currentSkill.name) return;
        
        // Sanitize the name
        newName = this.editor.sanitizeInternalName(newName);
        
        // Check if name already exists
        const pack = this.editor.state.currentPack;
        if (pack && pack.skills) {
            const existing = pack.skills.find(s => s.name === newName.trim() && s.id !== this.currentSkill.id);
            if (existing) {
                this.editor.showToast('A skill with that name already exists', 'error');
                return;
            }
        }
        
        const oldName = this.currentSkill.name;
        this.currentSkill.name = newName.trim();
        
        // Update the UI
        this.render(this.currentSkill);
        this.attachEventListeners();
        this.editor.showToast(`Renamed skill from "${oldName}" to "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.render();
        }
    }
    
    /**
     * Delete the current skill
     */
    async deleteSkill() {
        const confirmed = await this.editor.showConfirmDialog(
            'Delete Skill',
            `Delete skill "${this.currentSkill.name}"? This cannot be undone.`,
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
        
        const skillName = this.currentSkill.name;
        
        // Remove from entries
        parentFile.entries = parentFile.entries.filter(e => e.id !== this.currentSkill.id);
        
        // Update pack tree
        this.editor.packManager.updateFileContainer(parentFile.id, 'skill');
        
        // Show success message
        this.editor.showToast(`Skill "${skillName}" deleted`, 'success');
        this.editor.markDirty();
        
        // Navigate to appropriate view
        if (parentFile.entries.length > 0) {
            this.editor.openFile(parentFile.entries[0], 'skill');
        } else {
            this.editor.openFile(parentFile, 'skill');
        }
    }
    
    initializeSkillBuilder() {
        console.log('Current browsers before init:', {
            targeterBrowser: this.targeterBrowser,
            mechanicBrowser: this.mechanicBrowser
        });
        
        // Initialize browser components if not already created
        if (!this.targeterBrowser) {
            console.log('Creating new TargeterBrowser');
            this.targeterBrowser = new TargeterBrowser();
        }
        
        // No longer need to initialize condition editor - using global V2 browser
        
        if (!this.mechanicBrowser) {
            console.log('Creating new MechanicBrowser');
            this.mechanicBrowser = new MechanicBrowser(
                this.targeterBrowser,
                null, // No trigger browser for skill files
                null  // Using global conditionBrowserV2 instead
            );
        }
        
        console.log('Browsers after init:', {
            targeterBrowser: !!this.targeterBrowser,
            mechanicBrowser: !!this.mechanicBrowser
        });
        
        // Initialize Skill Builder Editor
        const skillLinesContainer = document.getElementById('skill-lines-editor');
        if (skillLinesContainer) {
            // NEW: Initialize skills object if it doesn't exist
            console.log('📋 Loading skills in render:', {
                skillName: this.currentSkill.name,
                hasSkillsProperty: !!this.currentSkill.skills,
                skillsData: JSON.parse(JSON.stringify(this.currentSkill.skills || {}))
            });
            
            if (!this.currentSkill.skills) {
                this.currentSkill.skills = {};
                // Migrate old Skills array to new format if it exists
                if (this.currentSkill.Skills && Array.isArray(this.currentSkill.Skills) && this.currentSkill.Skills.length > 0) {
                    this.currentSkill.skills[this.currentSkill.name || 'DefaultSkill'] = {
                        lines: this.currentSkill.Skills
                    };
                }
            }
            
            // MIGRATION: Fix numeric keys (0, 1, 2) - replace with actual skill name
            if (this.currentSkill.skills && typeof this.currentSkill.skills === 'object') {
                const keys = Object.keys(this.currentSkill.skills);
                // Check if we have numeric keys that need migration
                const numericKeys = keys.filter(key => !isNaN(key));
                if (numericKeys.length > 0) {
                    console.log('   Before migration keys:', keys);
                    
                    // Remove ALL numeric keys - they shouldn't exist
                    numericKeys.forEach(numericKey => {
                        console.log(`   🗑️ Removing numeric key: "${numericKey}"`);
                        delete this.currentSkill.skills[numericKey];
                    });
                    
                    // Ensure the proper skill name key exists
                    if (!this.currentSkill.skills[this.currentSkill.name]) {
                        this.currentSkill.skills[this.currentSkill.name] = { lines: [] };
                        console.log(`   ✅ Created proper key: "${this.currentSkill.name}"`);
                    }
                    
                    console.log('   After migration keys:', Object.keys(this.currentSkill.skills));
                    
                    // Mark dirty to trigger save
                    this.editor.markDirty();
                }
            }
            
            // Ensure at least one skill exists
            if (Object.keys(this.currentSkill.skills).length === 0) {
                this.currentSkill.skills[this.currentSkill.name || 'DefaultSkill'] = { lines: [] };
            }
            
            if (window.DEBUG_MODE) {
                console.log('✅ Skills loaded for editor:', {
                    skillsObject: JSON.parse(JSON.stringify(this.currentSkill.skills)),
                    totalSkills: Object.keys(this.currentSkill.skills).length
                });
            }
            
            // Always recreate since DOM was recreated on render
            this.skillBuilderEditor = new SkillBuilderEditor(
                skillLinesContainer,
                this.targeterBrowser,
                this.mechanicBrowser,
                null,  // No trigger browser for skill files
                null,  // No condition editor
                window.templateManager,
                window.templateEditor
            );
            
            // Load the skills object into the editor BEFORE setting context
            this.skillBuilderEditor.skills = this.currentSkill.skills;
            this.skillBuilderEditor.currentSkill = Object.keys(this.currentSkill.skills)[0];
            
            // Set context to 'skill' (hides triggers) - do this AFTER loading skills
            this.skillBuilderEditor.setContext('skill');
            
            // Sync to file after migration and editor setup
            this.syncToFile();
            
            // Render with the loaded skills
            this.skillBuilderEditor.render();
            
            // Listen for changes
            this.skillBuilderEditor.onChange((skillLines) => {
                if (window.DEBUG_MODE) {
                    console.log('🎯 SkillEditor onChange triggered:', {
                        currentSkillName: this.skillBuilderEditor.currentSkill,
                        linesCount: skillLines?.length || 0,
                        skillsObjectBefore: JSON.parse(JSON.stringify(this.currentSkill.skills))
                    });
                }
                
                // Update the current skill's lines
                if (this.skillBuilderEditor.currentSkill) {
                    // Ensure the skill object exists
                    if (!this.currentSkill.skills[this.skillBuilderEditor.currentSkill]) {
                        this.currentSkill.skills[this.skillBuilderEditor.currentSkill] = { lines: [] };
                    }
                    this.currentSkill.skills[this.skillBuilderEditor.currentSkill].lines = skillLines;
                    if (window.DEBUG_MODE) {
                        console.log('✅ Updated skill lines:', {
                            skillName: this.skillBuilderEditor.currentSkill,
                            newLinesCount: skillLines?.length || 0,
                            skillsObjectAfter: JSON.parse(JSON.stringify(this.currentSkill.skills))
                        });
                    }
                }
                
                this.syncToFile();
                this.editor.markDirty();
                
                // Update count badge (total lines across all skills)
                const totalLines = Object.values(this.currentSkill.skills)
                    .filter(s => s && s.lines) // Filter out null/undefined skills
                    .reduce((sum, s) => sum + s.lines.length, 0);
                const badge = document.querySelector('.card-title .fas.fa-magic')?.parentElement.querySelector('.count-badge');
                if (badge) badge.textContent = totalLines;
            });
        }
    }
    
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
                        This file contains ${fileContainer._file.entries.length} skill(s)
                    </p>
                </div>
                <div class="file-container-actions">
                    <button class="btn btn-primary btn-large" id="add-skill-to-file">
                        <i class="fas fa-plus"></i> Add New Skill to this File
                    </button>
                </div>
                <div class="file-container-info" style="margin-top: 2rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 0.5rem;">
                    <p style="margin: 0; color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> 
                        Click on a skill in the file tree to edit it, or click the button above to add a new skill to this file.
                    </p>
                </div>
            </div>
        `;
        
        // Attach event listeners
        document.getElementById('add-skill-to-file')?.addEventListener('click', () => {
            this.addNewSection();
        });
    }
    
    findParentFile() {
        const pack = this.editor.state.currentPack;
        if (!pack || !pack.skills) return null;
        
        // If current skill is a file container, return the file directly
        if (this.currentSkill._isFileContainer) {
            return this.currentSkill._file;
        }
        
        // Check if _parentFile reference exists
        if (this.currentSkill._parentFile) {
            return pack.skills.find(f => f.id === this.currentSkill._parentFile.id);
        }
        
        // Search all files for this skill
        for (const file of pack.skills) {
            if (file.entries && file.entries.some(e => e.id === this.currentSkill.id)) {
                return file;
            }
        }
        
        return null;
    }
}

window.SkillEditor = SkillEditor;
