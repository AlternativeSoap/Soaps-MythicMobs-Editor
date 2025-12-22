/**
 * Pack Validator Tool
 * Validates MythicMobs pack for errors and provides quick fixes
 */
class PackValidator {
    constructor(editor) {
        this.editor = editor;
    }
    
    /**
     * Validate pack and show results
     * @param {Object} pack - The pack to validate
     */
    validate(pack) {
        const issues = {
            errors: [],
            warnings: []
        };
        
        this._validateReferences(pack, issues);
        this._validateSyntax(pack, issues);
        this._validateFields(pack, issues);
        
        this._currentIssues = issues;
        this._currentPack = pack;
        this.renderModal(issues);
    }
    
    /**
     * Validate references between elements
     */
    _validateReferences(pack, issues) {
        const skillNames = new Set(Object.keys(pack.skills || {}));
        const itemNames = new Set(Object.keys(pack.items || {}));
        const mobNames = new Set(Object.keys(pack.mobs || {}));
        
        // Check mob skill references
        Object.entries(pack.mobs || {}).forEach(([mobName, mob]) => {
            if (mob.Skills) {
                mob.Skills.forEach((skillRef, index) => {
                    const match = skillRef.match(/@skill{s=([\w-]+)}/);
                    if (match) {
                        const skillName = match[1];
                        if (!skillNames.has(skillName)) {
                            issues.errors.push({
                                type: 'reference',
                                severity: 'error',
                                category: 'Mob',
                                elementName: mobName,
                                message: `Skill '${skillName}' not found`,
                                fixable: false
                            });
                        }
                    }
                });
            }
        });
        
        // Check skill-to-skill references
        Object.entries(pack.skills || {}).forEach(([skillName, skill]) => {
            if (skill.Skills) {
                const skillContent = Array.isArray(skill.Skills)
                    ? skill.Skills.join('\n')
                    : skill.Skills;
                
                const matches = skillContent.matchAll(/@skill{s=([\w-]+)}/g);
                for (const match of matches) {
                    const referencedSkill = match[1];
                    if (!skillNames.has(referencedSkill)) {
                        issues.errors.push({
                            type: 'reference',
                            severity: 'error',
                            category: 'Skill',
                            elementName: skillName,
                            message: `Skill '${referencedSkill}' not found`,
                            fixable: false
                        });
                    }
                }
            }
        });
        
        // Check droptable item references
        Object.entries(pack.droptables || {}).forEach(([tableName, table]) => {
            if (table.Items) {
                table.Items.forEach((itemRef, index) => {
                    // Extract item name from various formats
                    const itemMatch = itemRef.match(/(\w+)\s/);
                    if (itemMatch) {
                        const itemName = itemMatch[1];
                        if (!itemNames.has(itemName) && itemName !== 'AIR') {
                            issues.warnings.push({
                                type: 'reference',
                                severity: 'warning',
                                category: 'DropTable',
                                elementName: tableName,
                                message: `Item '${itemName}' not found (may be vanilla)`,
                                fixable: false
                            });
                        }
                    }
                });
            }
        });
        
        // Check random spawn mob references
        Object.entries(pack.randomspawns || {}).forEach(([spawnName, spawn]) => {
            if (spawn.Mobs) {
                spawn.Mobs.forEach(mobRef => {
                    const mobMatch = mobRef.match(/([\w-]+)/);
                    if (mobMatch) {
                        const mobName = mobMatch[1];
                        if (!mobNames.has(mobName)) {
                            issues.errors.push({
                                type: 'reference',
                                severity: 'error',
                                category: 'RandomSpawn',
                                elementName: spawnName,
                                message: `Mob '${mobName}' not found`,
                                fixable: false
                            });
                        }
                    }
                });
            }
        });
    }
    
    /**
     * Validate YAML syntax and structure
     */
    _validateSyntax(pack, issues) {
        // Check for empty names
        Object.entries(pack.mobs || {}).forEach(([name, mob]) => {
            if (!name || name.trim() === '') {
                issues.errors.push({
                    type: 'syntax',
                    severity: 'error',
                    category: 'Mob',
                    elementName: '(empty)',
                    message: 'Empty mob name detected',
                    fixable: true,
                    fix: 'remove-empty'
                });
            }
        });
        
        Object.entries(pack.skills || {}).forEach(([name, skill]) => {
            if (!name || name.trim() === '') {
                issues.errors.push({
                    type: 'syntax',
                    severity: 'error',
                    category: 'Skill',
                    elementName: '(empty)',
                    message: 'Empty skill name detected',
                    fixable: true,
                    fix: 'remove-empty'
                });
            }
        });
        
        Object.entries(pack.items || {}).forEach(([name, item]) => {
            if (!name || name.trim() === '') {
                issues.errors.push({
                    type: 'syntax',
                    severity: 'error',
                    category: 'Item',
                    elementName: '(empty)',
                    message: 'Empty item name detected',
                    fixable: true,
                    fix: 'remove-empty'
                });
            }
        });
    }
    
    /**
     * Validate field values
     */
    _validateFields(pack, issues) {
        // Validate mob health values
        Object.entries(pack.mobs || {}).forEach(([name, mob]) => {
            if (mob.Health !== undefined) {
                const health = parseFloat(mob.Health);
                if (isNaN(health) || health <= 0) {
                    issues.warnings.push({
                        type: 'field',
                        severity: 'warning',
                        category: 'Mob',
                        elementName: name,
                        message: `Invalid health value: ${mob.Health}`,
                        fixable: true,
                        fix: 'default-health',
                        fixValue: 20
                    });
                }
                
                if (health > 2048) {
                    issues.warnings.push({
                        type: 'field',
                        severity: 'warning',
                        category: 'Mob',
                        elementName: name,
                        message: `Very high health value (${health}), may cause client issues`,
                        fixable: false
                    });
                }
            }
        });
        
        // Validate mob damage values
        Object.entries(pack.mobs || {}).forEach(([name, mob]) => {
            if (mob.Damage !== undefined) {
                const damage = parseFloat(mob.Damage);
                if (isNaN(damage) || damage < 0) {
                    issues.warnings.push({
                        type: 'field',
                        severity: 'warning',
                        category: 'Mob',
                        elementName: name,
                        message: `Invalid damage value: ${mob.Damage}`,
                        fixable: true,
                        fix: 'default-damage',
                        fixValue: 1
                    });
                }
            }
        });
        
        // Check for missing Type in mobs
        Object.entries(pack.mobs || {}).forEach(([name, mob]) => {
            if (!mob.Type) {
                issues.warnings.push({
                    type: 'field',
                    severity: 'warning',
                    category: 'Mob',
                    elementName: name,
                    message: 'Missing Type field',
                    fixable: true,
                    fix: 'default-type',
                    fixValue: 'ZOMBIE'
                });
            }
        });
    }
    
    /**
     * Render validation modal
     */
    renderModal(issues) {
        const totalIssues = issues.errors.length + issues.warnings.length;
        const fixableCount = [...issues.errors, ...issues.warnings].filter(i => i.fixable).length;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'pack-validator-modal';
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-check-circle"></i>
                        Pack Validator
                    </h2>
                    <button class="btn-close" onclick="document.getElementById('pack-validator-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    ${totalIssues === 0 ? `
                        <div class="validator-clean">
                            <i class="fas fa-check-circle"></i>
                            <h3>Pack is Valid!</h3>
                            <p>No errors or warnings found. Your pack is ready to use.</p>
                        </div>
                    ` : `
                        <!-- Summary -->
                        <div class="validator-summary">
                            <div class="summary-stat ${issues.errors.length > 0 ? 'error' : ''}">
                                <i class="fas fa-times-circle"></i>
                                <div>
                                    <strong>${issues.errors.length}</strong>
                                    <span>Errors</span>
                                </div>
                            </div>
                            <div class="summary-stat ${issues.warnings.length > 0 ? 'warning' : ''}">
                                <i class="fas fa-exclamation-triangle"></i>
                                <div>
                                    <strong>${issues.warnings.length}</strong>
                                    <span>Warnings</span>
                                </div>
                            </div>
                            <div class="summary-stat">
                                <i class="fas fa-tools"></i>
                                <div>
                                    <strong>${fixableCount}</strong>
                                    <span>Auto-fixable</span>
                                </div>
                            </div>
                        </div>
                        
                        ${fixableCount > 0 ? `
                            <div class="validator-actions">
                                <button class="btn btn-primary" onclick="window.packValidatorInstance.fixAllSelected()">
                                    <i class="fas fa-magic"></i> Fix Selected Issues
                                </button>
                                <button class="btn btn-secondary" onclick="window.packValidatorInstance.selectAllFixable()">
                                    Select All Auto-fixable
                                </button>
                            </div>
                        ` : ''}
                        
                        <!-- Issues List -->
                        ${issues.errors.length > 0 ? `
                            <div class="validator-section">
                                <h3><i class="fas fa-times-circle error-icon"></i> Errors</h3>
                                <div class="issues-list">
                                    ${issues.errors.map((issue, index) => this._renderIssue(issue, index, 'error')).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${issues.warnings.length > 0 ? `
                            <div class="validator-section">
                                <h3><i class="fas fa-exclamation-triangle warning-icon"></i> Warnings</h3>
                                <div class="issues-list">
                                    ${issues.warnings.map((issue, index) => this._renderIssue(issue, index + issues.errors.length, 'warning')).join('')}
                                </div>
                            </div>
                        ` : ''}
                    `}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('pack-validator-modal').remove()">
                        Close
                    </button>
                    ${totalIssues > 0 ? `
                        <button class="btn btn-primary" onclick="window.packValidatorInstance.exportReport()">
                            <i class="fas fa-download"></i> Export Report
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store instance for fixes
        window.packValidatorInstance = this;
    }
    
    /**
     * Render a single issue
     */
    _renderIssue(issue, index, severity) {
        return `
            <div class="issue-item ${severity}">
                ${issue.fixable ? `
                    <label class="issue-checkbox">
                        <input type="checkbox" data-issue-index="${index}" />
                    </label>
                ` : ''}
                <div class="issue-content">
                    <div class="issue-header">
                        <span class="issue-badge">${issue.category}</span>
                        <strong>${issue.elementName}</strong>
                    </div>
                    <div class="issue-message">${issue.message}</div>
                    ${issue.fixable ? `
                        <div class="issue-fix">
                            <i class="fas fa-magic"></i>
                            Can be auto-fixed
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Select all fixable issues
     */
    selectAllFixable() {
        const checkboxes = document.querySelectorAll('#pack-validator-modal input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    }
    
    /**
     * Fix all selected issues
     */
    fixAllSelected() {
        const checkboxes = document.querySelectorAll('#pack-validator-modal input[type="checkbox"]:checked');
        const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.issueIndex));
        
        if (selectedIndices.length === 0) {
            this.editor.showToast('No issues selected', 'warning');
            return;
        }
        
        let fixedCount = 0;
        const allIssues = [...this._currentIssues.errors, ...this._currentIssues.warnings];
        
        selectedIndices.forEach(index => {
            const issue = allIssues[index];
            if (issue && issue.fixable) {
                this._applyFix(issue);
                fixedCount++;
            }
        });
        
        // Save changes
        if (fixedCount > 0) {
            this.editor.saveCurrentPack();
            this.editor.showToast(`Fixed ${fixedCount} issue(s)`, 'success');
            
            // Close and re-validate
            document.getElementById('pack-validator-modal').remove();
            setTimeout(() => this.validate(this._currentPack), 300);
        }
    }
    
    /**
     * Apply a fix to an issue
     */
    _applyFix(issue) {
        const pack = this._currentPack;
        
        switch (issue.fix) {
            case 'remove-empty':
                // Remove empty entries
                if (issue.category === 'Mob' && pack.mobs) {
                    delete pack.mobs[''];
                } else if (issue.category === 'Skill' && pack.skills) {
                    delete pack.skills[''];
                } else if (issue.category === 'Item' && pack.items) {
                    delete pack.items[''];
                }
                break;
                
            case 'default-health':
                if (pack.mobs && pack.mobs[issue.elementName]) {
                    pack.mobs[issue.elementName].Health = issue.fixValue;
                }
                break;
                
            case 'default-damage':
                if (pack.mobs && pack.mobs[issue.elementName]) {
                    pack.mobs[issue.elementName].Damage = issue.fixValue;
                }
                break;
                
            case 'default-type':
                if (pack.mobs && pack.mobs[issue.elementName]) {
                    pack.mobs[issue.elementName].Type = issue.fixValue;
                }
                break;
        }
    }
    
    /**
     * Export validation report
     */
    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            packName: this._currentPack.name || 'Unknown Pack',
            issues: this._currentIssues
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.editor.showToast('Validation report exported', 'success');
    }
}
