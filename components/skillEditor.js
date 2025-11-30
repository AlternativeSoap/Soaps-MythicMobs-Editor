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
        this.conditionEditor = null;
    }
    
    render(skill) {
        this.currentSkill = skill;
        const container = document.getElementById('skill-editor-view');
        if (!container) return;
        
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
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cooldown (seconds)</label>
                                <input type="number" class="form-input" id="skill-cooldown" value="${skill.cooldown || ''}" min="0" step="0.1" placeholder="0">
                                <small class="form-hint">Time between executions for the same caster</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="skill-cancelifnotargets" ${skill.cancelIfNoTargets !== false ? 'checked' : ''}>
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
                            <input type="text" class="form-input" id="skill-oncooldownskill" value="${skill.onCooldownSkill || ''}" placeholder="SkillName">
                            <small class="form-hint">Skill to execute if this one is on cooldown</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Failed Conditions Skill</label>
                            <input type="text" class="form-input" id="skill-failedconditionsskill" value="${skill.failedConditionsSkill || skill.onFailSkill || ''}" placeholder="SkillName">
                            <small class="form-hint">Skill to execute if conditions fail (alias: OnFailSkill)</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Skill (Async Execute)</label>
                        <input type="text" class="form-input" id="skill-skillref" value="${skill.skill || ''}" placeholder="AnotherSkillName">
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
        const conditions = skill.Conditions || skill.conditions || [];
        const targetConditions = skill.TargetConditions || skill.targetConditions || [];
        const triggerConditions = skill.TriggerConditions || skill.triggerConditions || [];
        
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
                    <div id="skill-conditions-editor">
                        <textarea class="form-input" id="skill-conditions" rows="4" placeholder="- condition1 true&#10;- condition2 false">${this.formatConditionsForDisplay(conditions)}</textarea>
                    </div>
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
                    <div id="skill-targetconditions-editor">
                        <textarea class="form-input" id="skill-targetconditions" rows="4" placeholder="- distance{d=<5} true&#10;- isPlayer true">${this.formatConditionsForDisplay(targetConditions)}</textarea>
                    </div>
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
                    <div id="skill-triggerconditions-editor">
                        <textarea class="form-input" id="skill-triggerconditions" rows="4" placeholder="- isPlayer true">${this.formatConditionsForDisplay(triggerConditions)}</textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format conditions array for textarea display
     */
    formatConditionsForDisplay(conditions) {
        if (!conditions || !Array.isArray(conditions)) return '';
        return conditions.map(c => `- ${c}`).join('\n');
    }
    
    /**
     * Parse conditions from textarea
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
        document.getElementById('save-skill')?.addEventListener('click', () => {
            this.saveSkill();
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
        
        document.getElementById('skill-name')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.name = e.target.value;
                this.syncToFile();
                this.editor.markDirty();
                // Refresh file tree to show updated name
                this.editor.packManager.renderPackTree();
            }
        });
        
        document.getElementById('skill-cooldown')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.cooldown = parseFloat(e.target.value) || 0;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        // Cancel if no targets
        document.getElementById('skill-cancelifnotargets')?.addEventListener('change', (e) => {
            if (this.currentSkill) {
                this.currentSkill.cancelIfNoTargets = e.target.checked;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        // Advanced options
        document.getElementById('skill-oncooldownskill')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.onCooldownSkill = e.target.value || undefined;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        document.getElementById('skill-failedconditionsskill')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.failedConditionsSkill = e.target.value || undefined;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        document.getElementById('skill-skillref')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.skill = e.target.value || undefined;
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        // Conditions textareas
        document.getElementById('skill-conditions')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.Conditions = this.parseConditionsFromText(e.target.value);
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        document.getElementById('skill-targetconditions')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.TargetConditions = this.parseConditionsFromText(e.target.value);
                this.syncToFile();
                this.editor.markDirty();
            }
        });
        
        document.getElementById('skill-triggerconditions')?.addEventListener('input', (e) => {
            if (this.currentSkill) {
                this.currentSkill.TriggerConditions = this.parseConditionsFromText(e.target.value);
                this.syncToFile();
                this.editor.markDirty();
            }
        });
    }
    
    syncToFile() {
        // Sync currentSkill data to state.currentFile for live preview
        if (this.currentSkill && this.editor.state.currentFile) {
            Object.assign(this.editor.state.currentFile, this.currentSkill);
            // Update YAML preview in side panel
            if (this.editor.updateYAMLPreview) {
                this.editor.updateYAMLPreview();
            }
        }
    }
    
    saveSkill() {
        if (!this.currentSkill || !this.currentSkill.name) {
            this.editor.showToast('Please enter a skill name', 'error');
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
     * Add a new skill section to the current file
     */
    addNewSection() {
        const newName = prompt('Enter name for new skill:');
        if (!newName || newName.trim() === '') return;
        
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
        const newSkill = {
            id: 'skill-' + Date.now(),
            name: newName.trim(),
            skills: []
        };
        
        // Add to parent file's entries
        parentFile.entries.push(newSkill);
        
        // Open the new skill
        newSkill._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(newSkill, 'skill');
        this.editor.showToast(`Created new skill "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.renderPackTree();
        }
    }
    
    /**
     * Duplicate the current skill within the same file
     */
    duplicateSkill() {
        const newName = prompt('Enter name for duplicated skill:', this.currentSkill.name + '_copy');
        if (!newName || newName.trim() === '') return;
        
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
        duplicatedSkill.name = newName.trim();
        duplicatedSkill.id = 'skill-' + Date.now();
        delete duplicatedSkill._parentFile;
        
        // Add to parent file's entries
        parentFile.entries.push(duplicatedSkill);
        
        // Open the new skill
        duplicatedSkill._parentFile = { id: parentFile.id, fileName: parentFile.fileName };
        this.editor.openFile(duplicatedSkill, 'skill');
        this.editor.showToast(`Duplicated skill as "${newName}"`, 'success');
        this.editor.markDirty();
        
        // Refresh the file tree
        if (this.editor.packManager) {
            this.editor.packManager.renderPackTree();
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
    renameSkill() {
        const newName = prompt('Enter new name for skill:', this.currentSkill.name);
        if (!newName || newName.trim() === '' || newName.trim() === this.currentSkill.name) return;
        
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
    
    initializeSkillBuilder() {
        // Initialize browser components if not already created
        if (!this.targeterBrowser) {
            this.targeterBrowser = new TargeterBrowser();
        }
        
        if (!this.conditionEditor) {
            this.conditionEditor = new ConditionEditor('inline');
        }
        
        if (!this.mechanicBrowser) {
            this.mechanicBrowser = new MechanicBrowser(
                this.targeterBrowser,
                null, // No trigger browser for skill files
                this.conditionEditor
            );
        }
        
        // Initialize Skill Builder Editor
        const skillLinesContainer = document.getElementById('skill-lines-editor');
        if (skillLinesContainer) {
            // NEW: Initialize skills object if it doesn't exist
            if (!this.currentSkill.skills) {
                this.currentSkill.skills = {};
                // Migrate old Skills array to new format if it exists
                if (this.currentSkill.Skills && Array.isArray(this.currentSkill.Skills) && this.currentSkill.Skills.length > 0) {
                    this.currentSkill.skills[this.currentSkill.name || 'DefaultSkill'] = {
                        lines: this.currentSkill.Skills
                    };
                }
            }
            
            // Ensure at least one skill exists
            if (Object.keys(this.currentSkill.skills).length === 0) {
                this.currentSkill.skills[this.currentSkill.name || 'DefaultSkill'] = { lines: [] };
            }
            
            // Always recreate since DOM was recreated on render
            this.skillBuilderEditor = new SkillBuilderEditor(
                skillLinesContainer,
                this.targeterBrowser,
                this.mechanicBrowser
            );
            
            // Set context to 'skill' (hides triggers)
            this.skillBuilderEditor.setContext('skill');
            
            // Load the skills object into the editor
            this.skillBuilderEditor.skills = this.currentSkill.skills;
            this.skillBuilderEditor.currentSkill = Object.keys(this.currentSkill.skills)[0];
            
            // Render with the loaded skills
            this.skillBuilderEditor.render();
            
            // Listen for changes
            this.skillBuilderEditor.onChange((skillLines) => {
                // Update the current skill's lines
                if (this.skillBuilderEditor.currentSkill) {
                    this.currentSkill.skills[this.skillBuilderEditor.currentSkill].lines = skillLines;
                }
                this.syncToFile();
                this.editor.markDirty();
                
                // Update count badge (total lines across all skills)
                const totalLines = Object.values(this.currentSkill.skills)
                    .reduce((sum, s) => sum + (s.lines ? s.lines.length : 0), 0);
                const badge = document.querySelector('.card-title .fas.fa-magic')?.parentElement.querySelector('.count-badge');
                if (badge) badge.textContent = totalLines;
            });
        }
    }
}

window.SkillEditor = SkillEditor;
