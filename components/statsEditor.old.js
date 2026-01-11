/**
 * Stats Editor Component
 * Handles editing of MythicMobs custom stats in stats.yml
 * Features: Visual type selector, creation wizard, templates, formula builder
 */
class StatsEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentStat = null;
        this.isWizardMode = false;
        this.wizardStep = 1;
        this.wizardData = {};
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        this.isDragging = false;
        this.validationErrors = [];
        
        // Performance: Debounce timers
        this.syncDebounceTimer = null;
        this.validationDebounceTimer = null;
        this.searchDebounceTimer = null;
        this.DEBOUNCE_DELAY = 150; // ms
        
        // Performance: Cache DOM elements
        this.cachedElements = {};
        
        this.initializeConstants();
        this.initializeKeyboardShortcuts();
    }

    /**
     * Get cached DOM element (performance optimization)
     */
    getCachedElement(id) {
        if (!this.cachedElements[id]) {
            this.cachedElements[id] = document.getElementById(id);
        }
        return this.cachedElements[id];
    }

    /**
     * Clear element cache (call after re-render)
     */
    clearElementCache() {
        this.cachedElements = {};
    }

    /**
     * Initialize keyboard shortcuts
     */
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only if stats editor is active
            if (!document.querySelector('.stats-editor')) return;
            
            // Ctrl+S: Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.save();
            }
            // Ctrl+D: Duplicate
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.duplicateStat();
            }
            // Ctrl+Z: Undo
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Shift+Z or Ctrl+Y: Redo
            if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
            // Escape: Close wizard/dialog
            if (e.key === 'Escape') {
                document.querySelector('.wizard-overlay')?.remove();
                document.querySelector('.modal-overlay')?.remove();
            }
        });
    }

    /**
     * Push state to undo stack
     */
    pushUndoState() {
        if (!this.currentStat) return;
        const state = JSON.stringify(this.currentStat);
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        this.redoStack = []; // Clear redo on new change
    }

    /**
     * Undo last change
     */
    undo() {
        if (this.undoStack.length === 0) {
            this.editor.showToast('Nothing to undo', 'info');
            return;
        }
        // Save current state to redo
        this.redoStack.push(JSON.stringify(this.currentStat));
        // Restore previous state
        const prevState = JSON.parse(this.undoStack.pop());
        Object.assign(this.currentStat, prevState);
        this.render(this.currentStat);
        this.editor.showToast('Undone', 'info');
    }

    /**
     * Redo last undone change
     */
    redo() {
        if (this.redoStack.length === 0) {
            this.editor.showToast('Nothing to redo', 'info');
            return;
        }
        // Save current state to undo
        this.undoStack.push(JSON.stringify(this.currentStat));
        // Restore redo state
        const redoState = JSON.parse(this.redoStack.pop());
        Object.assign(this.currentStat, redoState);
        this.render(this.currentStat);
        this.editor.showToast('Redone', 'info');
    }

    initializeConstants() {
        // Stat types with descriptions
        this.STAT_TYPES = [
            {
                value: 'STATIC',
                label: 'Static Value',
                icon: 'fa-chart-bar',
                color: '#6366f1',
                description: 'A value used in formulas or by other stats',
                example: 'SPEED stat that affects MOVEMENT_SPEED'
            },
            {
                value: 'DAMAGE_MODIFIER',
                label: 'Damage Modifier',
                icon: 'fa-shield-alt',
                color: '#10b981',
                description: 'Modifies incoming or outgoing damage using a formula',
                example: 'Fire Resistance that reduces fire damage'
            },
            {
                value: 'DAMAGE_BONUS',
                label: 'Damage Bonus',
                icon: 'fa-sword',
                color: '#f59e0b',
                description: 'Adds flat bonus damage to attacks',
                example: 'Blunt Damage bonus for maces'
            },
            {
                value: 'PROC',
                label: 'Proc Effect',
                icon: 'fa-bolt',
                color: '#ec4899',
                description: 'Chance to trigger skills or effects',
                example: 'Critical Strike chance to execute skills'
            }
        ];

        // Available triggers
        this.TRIGGERS = {
            combat: [
                { value: 'ATTACK', label: 'Attack', description: 'When dealing damage' },
                { value: 'DAMAGED', label: 'Damaged', description: 'When taking damage' },
                { value: 'KILL', label: 'Kill', description: 'When killing an entity' },
                { value: 'DEATH', label: 'Death', description: 'When dying' }
            ],
            movement: [
                { value: 'JUMP', label: 'Jump', description: 'When jumping' },
                { value: 'SPRINT', label: 'Sprint', description: 'When sprinting' },
                { value: 'SNEAK', label: 'Sneak', description: 'When sneaking' }
            ],
            other: [
                { value: 'SPAWN', label: 'Spawn', description: 'When spawning' },
                { value: 'TIMER', label: 'Timer', description: 'Every X ticks' },
                { value: 'LOAD', label: 'Load', description: 'When world loads' }
            ]
        };

        // Preset templates
        this.TEMPLATES = {
            defensive: [
                {
                    id: 'fire_resistance',
                    name: 'Fire Resistance',
                    icon: '🔥',
                    color: '#ef4444',
                    data: {
                        Type: 'DAMAGE_MODIFIER',
                        Display: 'Fire Resistance',
                        Triggers: ['DAMAGED'],
                        ExecutionPoint: 'PRE',
                        Conditions: ['(damageCause FIRE || damageCause FIRE_TICK)'],
                        DamageFormula: 'd * (1 - v)',
                        MaxValue: 1,
                        MinValue: 0,
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Fire Resistance',
                            Multiply: '+<value> Fire Resistance',
                            Compound: 'x<value> Fire Resistance'
                        }
                    }
                },
                {
                    id: 'frost_resistance',
                    name: 'Frost Resistance',
                    icon: '❄️',
                    color: '#3b82f6',
                    data: {
                        Type: 'DAMAGE_MODIFIER',
                        Display: 'Frost Resistance',
                        Triggers: ['DAMAGED'],
                        ExecutionPoint: 'PRE',
                        Conditions: ['(damageCause FREEZE)'],
                        DamageFormula: 'd * (1 - v)',
                        MaxValue: 1,
                        MinValue: 0,
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Frost Resistance',
                            Multiply: '+<value> Frost Resistance',
                            Compound: 'x<value> Frost Resistance'
                        }
                    }
                },
                {
                    id: 'magic_resistance',
                    name: 'Magic Resistance',
                    icon: '⚡',
                    color: '#8b5cf6',
                    data: {
                        Type: 'DAMAGE_MODIFIER',
                        Display: 'Magic Resistance',
                        Triggers: ['DAMAGED'],
                        ExecutionPoint: 'PRE',
                        Conditions: ['(damageCause MAGIC)'],
                        DamageFormula: 'd * (1 - v)',
                        MaxValue: 1,
                        MinValue: 0,
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Magic Resistance',
                            Multiply: '+<value> Magic Resistance',
                            Compound: 'x<value> Magic Resistance'
                        }
                    }
                },
                {
                    id: 'generic_armor',
                    name: 'Generic Armor',
                    icon: '🛡️',
                    color: '#6b7280',
                    data: {
                        Type: 'DAMAGE_MODIFIER',
                        Display: 'Generic Armor',
                        Triggers: ['DAMAGED'],
                        ExecutionPoint: 'PRE',
                        DamageFormula: 'd - v',
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Generic Armor',
                            Multiply: '+<value> Generic Armor',
                            Compound: 'x<value> Generic Armor'
                        }
                    }
                }
            ],
            offensive: [
                {
                    id: 'blunt_damage',
                    name: 'Blunt Damage',
                    icon: '🔨',
                    color: '#78716c',
                    data: {
                        Type: 'DAMAGE_BONUS',
                        Display: 'Blunt Damage',
                        DamageType: 'BLUNT',
                        Triggers: ['ATTACK'],
                        ExecutionPoint: 'PRE',
                        Priority: 1,
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Blunt Damage',
                            Multiply: '+<value> Blunt Damage',
                            Compound: 'x<value> Blunt Damage'
                        }
                    }
                },
                {
                    id: 'sharp_damage',
                    name: 'Sharp Damage',
                    icon: '🗡️',
                    color: '#dc2626',
                    data: {
                        Type: 'DAMAGE_BONUS',
                        Display: 'Sharp Damage',
                        DamageType: 'SHARP',
                        Triggers: ['ATTACK'],
                        ExecutionPoint: 'PRE',
                        Priority: 2,
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Sharp Damage',
                            Multiply: '+<value> Sharp Damage',
                            Compound: 'x<value> Sharp Damage'
                        }
                    }
                },
                {
                    id: 'bonus_damage',
                    name: 'Bonus Damage',
                    icon: '⚔️',
                    color: '#f59e0b',
                    data: {
                        Type: 'DAMAGE_BONUS',
                        Display: 'Bonus Damage',
                        Triggers: ['ATTACK'],
                        ExecutionPoint: 'PRE',
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Bonus Damage',
                            Multiply: '+<value> Bonus Damage',
                            Compound: 'x<value> Bonus Damage'
                        }
                    }
                }
            ],
            special: [
                {
                    id: 'lifesteal',
                    name: 'Lifesteal',
                    icon: '❤️',
                    color: '#ef4444',
                    data: {
                        Type: 'PROC',
                        Display: 'Lifesteal',
                        Triggers: ['ATTACK'],
                        ExecutionPoint: 'POST',
                        BaseValue: 0,
                        Skills: ['- heal{a=<caster.stat.LIFESTEAL_POWER>*<skill.var.damage>} @self'],
                        Formatting: {
                            Additive: '+<value> Lifesteal',
                            Multiply: '+<value> Lifesteal',
                            Compound: 'x<value> Lifesteal'
                        }
                    }
                },
                {
                    id: 'speed_stat',
                    name: 'Speed',
                    icon: '🏃',
                    color: '#06b6d4',
                    data: {
                        Type: 'STATIC',
                        Display: 'Speed',
                        FormulaKey: 'SPD',
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Speed',
                            Multiply: '+<value>% Speed',
                            Compound: 'x<value>% Speed'
                        }
                    }
                },
                {
                    id: 'custom_blank',
                    name: 'Custom (Blank)',
                    icon: '⭐',
                    color: '#6366f1',
                    data: {
                        Type: 'STATIC',
                        Display: 'Custom Stat',
                        BaseValue: 0,
                        Formatting: {
                            Additive: '+<value> Custom Stat',
                            Multiply: '+<value> Custom Stat',
                            Compound: 'x<value> Custom Stat'
                        }
                    }
                }
            ]
        };

        // Common damage causes for conditions (grouped for better UX)
        this.DAMAGE_CAUSES = {
            fire: [
                { value: 'FIRE', label: 'Fire', icon: '🔥' },
                { value: 'FIRE_TICK', label: 'Fire Tick', icon: '🔥' },
                { value: 'LAVA', label: 'Lava', icon: '🌋' },
                { value: 'HOT_FLOOR', label: 'Hot Floor', icon: '♨️' }
            ],
            environmental: [
                { value: 'FREEZE', label: 'Freeze', icon: '❄️' },
                { value: 'DROWNING', label: 'Drowning', icon: '🌊' },
                { value: 'SUFFOCATION', label: 'Suffocation', icon: '💨' },
                { value: 'FALL', label: 'Fall', icon: '⬇️' },
                { value: 'VOID', label: 'Void', icon: '🕳️' },
                { value: 'LIGHTNING', label: 'Lightning', icon: '⚡' },
                { value: 'FLY_INTO_WALL', label: 'Fly Into Wall', icon: '💥' },
                { value: 'CRAMMING', label: 'Cramming', icon: '📦' },
                { value: 'DRYOUT', label: 'Dryout', icon: '🏜️' }
            ],
            status: [
                { value: 'STARVATION', label: 'Starvation', icon: '🍖' },
                { value: 'POISON', label: 'Poison', icon: '☠️' },
                { value: 'MAGIC', label: 'Magic', icon: '✨' },
                { value: 'WITHER', label: 'Wither', icon: '💀' }
            ],
            combat: [
                { value: 'ENTITY_ATTACK', label: 'Entity Attack', icon: '⚔️' },
                { value: 'ENTITY_SWEEP_ATTACK', label: 'Sweep Attack', icon: '🗡️' },
                { value: 'PROJECTILE', label: 'Projectile', icon: '🏹' },
                { value: 'THORNS', label: 'Thorns', icon: '🌹' }
            ],
            explosion: [
                { value: 'ENTITY_EXPLOSION', label: 'Entity Explosion', icon: '💣' },
                { value: 'BLOCK_EXPLOSION', label: 'Block Explosion', icon: '🧨' },
                { value: 'SONIC_BOOM', label: 'Sonic Boom', icon: '📢' }
            ],
            other: [
                { value: 'FALLING_BLOCK', label: 'Falling Block', icon: '🧱' },
                { value: 'DRAGON_BREATH', label: 'Dragon Breath', icon: '🐉' }
            ]
        };

        // Flat array for backwards compatibility
        this.DAMAGE_CAUSES_FLAT = Object.values(this.DAMAGE_CAUSES).flat().map(c => c.value);

        // Formula building blocks
        this.FORMULA_BLOCKS = [
            { symbol: 'd', label: 'Damage', description: 'Original damage value' },
            { symbol: 'v', label: 'Stat Value', description: 'Current stat value' },
            { symbol: '+', label: 'Add', description: 'Addition' },
            { symbol: '-', label: 'Subtract', description: 'Subtraction' },
            { symbol: '*', label: 'Multiply', description: 'Multiplication' },
            { symbol: '/', label: 'Divide', description: 'Division' },
            { symbol: '(', label: '(', description: 'Open group' },
            { symbol: ')', label: ')', description: 'Close group' }
        ];

        // Common formula patterns
        this.FORMULA_PATTERNS = [
            { formula: 'd - v', label: 'Flat Reduction', description: 'Subtract stat from damage' },
            { formula: 'd * (1 - v)', label: 'Percent Reduction', description: 'Reduce by percentage' },
            { formula: 'd + v', label: 'Flat Bonus', description: 'Add stat to damage' },
            { formula: 'd * v', label: 'Damage Multiplier', description: 'Multiply damage by stat' },
            { formula: 'd * (1 + v)', label: 'Percent Bonus', description: 'Increase by percentage' }
        ];

        // Color presets for formatting
        this.COLOR_PRESETS = [
            { code: '&c', name: 'Red', color: '#FF5555' },
            { code: '&6', name: 'Gold', color: '#FFAA00' },
            { code: '&e', name: 'Yellow', color: '#FFFF55' },
            { code: '&a', name: 'Green', color: '#55FF55' },
            { code: '&b', name: 'Aqua', color: '#55FFFF' },
            { code: '&9', name: 'Blue', color: '#5555FF' },
            { code: '&d', name: 'Pink', color: '#FF55FF' },
            { code: '&f', name: 'White', color: '#FFFFFF' },
            { code: '&7', name: 'Gray', color: '#AAAAAA' }
        ];
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Convert display name to internal name format
     */
    toInternalName(displayName) {
        if (!displayName) return '';
        return displayName
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Get stat type info
     */
    getStatTypeInfo(type) {
        return this.STAT_TYPES.find(t => t.value === type) || this.STAT_TYPES[0];
    }

    /**
     * Validate stat configuration
     * Returns array of validation errors
     */
    validateStat(stat) {
        const errors = [];
        
        // Required fields
        if (!stat.name || stat.name.trim() === '') {
            errors.push({ field: 'name', message: 'Stat name is required' });
        } else if (!/^[A-Z][A-Z0-9_]*$/.test(stat.name)) {
            errors.push({ field: 'name', message: 'Name must be UPPER_SNAKE_CASE (letters, numbers, underscores)' });
        }
        
        if (!stat.Display || stat.Display.trim() === '') {
            errors.push({ field: 'display', message: 'Display name is required' });
        }
        
        // Type-specific validation
        if (stat.Type === 'DAMAGE_MODIFIER') {
            if (!stat.DamageFormula || stat.DamageFormula.trim() === '') {
                errors.push({ field: 'formula', message: 'Damage formula is required for DAMAGE_MODIFIER type' });
            } else {
                // Validate formula syntax (basic check)
                const validVars = ['d', 'v'];
                const formula = stat.DamageFormula.replace(/[0-9.+\-*/()\s]/g, '');
                const unknownVars = formula.split('').filter(c => !validVars.includes(c) && c.match(/[a-zA-Z]/));
                if (unknownVars.length > 0) {
                    errors.push({ field: 'formula', message: `Unknown variables in formula: ${[...new Set(unknownVars)].join(', ')}`, severity: 'warning' });
                }
            }
            
            if (!stat.Triggers || stat.Triggers.length === 0) {
                errors.push({ field: 'triggers', message: 'At least one trigger is required for DAMAGE_MODIFIER' });
            }
        }
        
        if (stat.Type === 'DAMAGE_BONUS') {
            if (!stat.Triggers || stat.Triggers.length === 0) {
                errors.push({ field: 'triggers', message: 'At least one trigger is required for DAMAGE_BONUS' });
            }
        }
        
        if (stat.Type === 'PROC') {
            if (!stat.Skills || stat.Skills.length === 0) {
                errors.push({ field: 'skills', message: 'At least one skill is required for PROC type', severity: 'warning' });
            }
        }
        
        // Value validation
        if (stat.MinValue !== undefined && stat.MaxValue !== undefined) {
            if (stat.MinValue > stat.MaxValue) {
                errors.push({ field: 'values', message: 'MinValue cannot be greater than MaxValue' });
            }
        }
        
        // Parent stats validation
        if (stat.ParentStats && stat.ParentStats.length > 0 && !stat.Formula) {
            errors.push({ field: 'formula', message: 'Formula is required when using Parent Stats', severity: 'warning' });
        }
        
        return errors;
    }

    /**
     * Show validation errors in UI
     */
    showValidationErrors(errors) {
        // Clear existing error states
        document.querySelectorAll('.form-input.error, .form-input.warning').forEach(el => {
            el.classList.remove('error', 'warning');
        });
        document.querySelectorAll('.validation-error').forEach(el => el.remove());
        
        if (errors.length === 0) return true;
        
        errors.forEach(err => {
            const fieldMap = {
                'name': 'stat-internal-name',
                'display': 'stat-display-name',
                'formula': 'stat-damage-formula',
                'triggers': 'triggers-section',
                'skills': 'stat-skills-list',
                'values': 'stat-min-value'
            };
            
            const inputId = fieldMap[err.field];
            const input = document.getElementById(inputId);
            if (input) {
                input.classList.add(err.severity === 'warning' ? 'warning' : 'error');
                const errorDiv = document.createElement('div');
                errorDiv.className = `validation-error ${err.severity || 'error'}`;
                errorDiv.innerHTML = `<i class="fas fa-${err.severity === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i> ${err.message}`;
                input.parentNode.appendChild(errorDiv);
            }
        });
        
        // Scroll to first error
        const firstError = document.querySelector('.validation-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return errors.filter(e => e.severity !== 'warning').length === 0;
    }

    /**
     * Update validation status indicator in status bar
     */
    updateValidationStatus() {
        const statusEl = document.getElementById('validation-status');
        if (!statusEl || !this.currentStat) return;
        
        this.syncToFile(true); // Sync without pushing undo
        const errors = this.validateStat(this.currentStat);
        const hardErrors = errors.filter(e => e.severity !== 'warning');
        const warnings = errors.filter(e => e.severity === 'warning');
        
        if (hardErrors.length > 0) {
            statusEl.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <span>${hardErrors.length} error${hardErrors.length > 1 ? 's' : ''}</span>
            `;
            statusEl.className = 'status-item validation-status error';
        } else if (warnings.length > 0) {
            statusEl.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>${warnings.length} warning${warnings.length > 1 ? 's' : ''}</span>
            `;
            statusEl.className = 'status-item validation-status warning';
        } else {
            statusEl.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Valid</span>
            `;
            statusEl.className = 'status-item validation-status valid';
        }
        
        // Also update undo count
        this.updateUndoButtons();
    }

    /**
     * Update undo/redo button states
     */
    updateUndoButtons() {
        const undoBtn = document.getElementById('undo-stat');
        const redoBtn = document.getElementById('redo-stat');
        const undoCount = document.getElementById('undo-count');
        
        if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
        if (undoCount) undoCount.textContent = `${this.undoStack.length} undo step${this.undoStack.length !== 1 ? 's' : ''}`;
    }

    /**
     * Update stat type indicator in status bar
     */
    updateStatTypeIndicator(type) {
        const indicator = document.getElementById('stat-type-indicator');
        if (!indicator) return;
        
        const typeInfo = this.getStatTypeInfo(type);
        indicator.innerHTML = `
            <span class="type-dot" style="background: ${typeInfo.color}"></span>
            <span>${typeInfo.label}</span>
        `;
    }

    /**
     * Render the stats editor
     */
    render(stat) {
        this.currentStat = stat;
        this.clearElementCache(); // Clear cache on re-render
        
        const container = document.getElementById('stats-editor-view');
        if (!container) {
            console.error('Stats editor container not found');
            return;
        }

        // Check if this is a file container (showing list of stats)
        if (stat._isFileContainer) {
            this.renderFileContainer(stat, container);
            return;
        }

        // Ensure parent file reference
        if (!stat._parentFile && this.editor?.state?.currentPack) {
            stat._parentFile = { id: 'stats', fileName: 'stats.yml' };
        }

        const isAdvanced = this.editor.state.currentMode === 'advanced';

        // Use DocumentFragment for better performance
        container.innerHTML = `
            <div class="stats-editor">
                ${this.renderEditorHeader(stat, isAdvanced)}
                <div class="editor-content stats-editor-content">
                    ${this.renderBasicInfoSection(stat)}
                    ${this.renderTypeConfigSection(stat)}
                    ${this.renderValuesSection(stat)}
                    ${this.renderTriggersSection(stat)}
                    ${this.renderFormattingSection(stat)}
                    ${isAdvanced ? this.renderAdvancedSection(stat) : ''}
                    ${this.renderTestCalculator(stat)}
                    ${this.renderItemPreview(stat)}
                </div>
            </div>
        `;

        this.attachEventHandlers(stat);
        window.collapsibleManager?.initializeCollapsible();
        window.collapsibleManager?.restoreStates();
        this.updateTypeSpecificVisibility(stat.Type || 'STATIC');
    }

    /**
     * Render editor header
     */
    renderEditorHeader(stat, isAdvanced) {
        return `
            <div class="editor-header">
                <h2>
                    <i class="fas fa-chart-line"></i>
                    Stats Editor
                    <span class="item-name">${this.escapeHtml(stat.name || 'New Stat')}</span>
                    <span class="mode-badge ${isAdvanced ? 'advanced' : 'beginner'}">${isAdvanced ? 'Advanced' : 'Beginner'} Mode</span>
                </h2>
                <div class="editor-actions">
                    <div class="action-group secondary-actions">
                        <button class="btn btn-outline" id="undo-stat" title="Undo last change (Ctrl+Z)" ${this.undoStack.length === 0 ? 'disabled' : ''}>
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn btn-outline" id="redo-stat" title="Redo (Ctrl+Y)" ${this.redoStack.length === 0 ? 'disabled' : ''}>
                            <i class="fas fa-redo"></i>
                        </button>
                        <span class="action-divider"></span>
                        <button class="btn btn-outline" id="duplicate-stat" title="Create a copy of this stat (Ctrl+D)">
                            <i class="fas fa-copy"></i> Duplicate
                        </button>
                        <button class="btn btn-outline btn-danger" id="delete-stat" title="Delete this stat">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="btn btn-secondary" id="new-stat" title="Add a new stat">
                            <i class="fas fa-plus"></i> New Stat
                        </button>
                    </div>
                    <button class="btn btn-primary" id="save-stat">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            <!-- Status Bar -->
            <div class="stats-editor-status-bar" id="stats-status-bar">
                <div class="status-item validation-status" id="validation-status">
                    <i class="fas fa-check-circle"></i>
                    <span>Valid</span>
                </div>
                <div class="status-item">
                    <i class="fas fa-history"></i>
                    <span id="undo-count">${this.undoStack.length} undo steps</span>
                </div>
                <div class="status-item stat-type-indicator" id="stat-type-indicator">
                    <span class="type-dot" style="background: ${this.getStatTypeInfo(stat.Type || 'STATIC').color}"></span>
                    <span>${this.getStatTypeInfo(stat.Type || 'STATIC').label}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render file container view (list of stats)
     */
    renderFileContainer(file, container) {
        const stats = file.entries || [];
        
        container.innerHTML = `
            <div class="stats-editor file-container-view">
                <div class="editor-header">
                    <h2>
                        <i class="fas fa-chart-line"></i>
                        Stats Editor
                        <span class="item-name">stats.yml</span>
                    </h2>
                    <div class="editor-actions">
                        <button class="btn btn-primary" id="create-new-stat-btn">
                            <i class="fas fa-plus"></i> Create New Stat
                        </button>
                    </div>
                </div>
                
                <div class="editor-content">
                    <!-- Template Selection -->
                    <div class="stats-templates-section">
                        <h3 class="section-title">
                            <i class="fas fa-magic"></i> Quick Create from Template
                        </h3>
                        <p class="section-description">Click a template to instantly create a pre-configured stat</p>
                        
                        <div class="template-categories">
                            ${this.renderTemplateCategory('defensive', '🛡️ Defensive', this.TEMPLATES.defensive)}
                            ${this.renderTemplateCategory('offensive', '⚔️ Offensive', this.TEMPLATES.offensive)}
                            ${this.renderTemplateCategory('special', '✨ Special', this.TEMPLATES.special)}
                        </div>
                    </div>
                    
                    <!-- Existing Stats List -->
                    <div class="stats-list-section">
                        <h3 class="section-title">
                            <i class="fas fa-list"></i> Your Custom Stats
                            <span class="count-badge">${stats.length}</span>
                        </h3>
                        
                        <div class="stats-filter-bar">
                            <input type="text" class="form-input" id="stats-search" placeholder="Search stats...">
                            <div class="filter-buttons">
                                <button class="filter-btn active" data-filter="all">All</button>
                                <button class="filter-btn" data-filter="DAMAGE_MODIFIER">🛡️ Modifier</button>
                                <button class="filter-btn" data-filter="DAMAGE_BONUS">⚔️ Bonus</button>
                                <button class="filter-btn" data-filter="PROC">⚡ Proc</button>
                                <button class="filter-btn" data-filter="STATIC">📊 Static</button>
                            </div>
                        </div>
                        
                        <div class="stats-grid" id="stats-list">
                            ${stats.length > 0 ? stats.map(stat => this.renderStatCard(stat)).join('') : `
                                <div class="empty-stats-message">
                                    <i class="fas fa-chart-line"></i>
                                    <h4>No Custom Stats Yet</h4>
                                    <p>Create your first custom stat using the templates above or click "Create New Stat"</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachFileContainerHandlers(file);
    }

    /**
     * Render template category
     */
    renderTemplateCategory(id, title, templates) {
        return `
            <div class="template-category" data-category="${id}">
                <h4 class="category-title">${title}</h4>
                <div class="template-grid">
                    ${templates.map(t => `
                        <button class="template-card" data-template="${t.id}" style="--template-color: ${t.color}">
                            <span class="template-icon">${t.icon}</span>
                            <span class="template-name">${t.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render stat card for list view
     */
    renderStatCard(stat) {
        const typeInfo = this.getStatTypeInfo(stat.Type);
        return `
            <div class="stat-card" data-stat-id="${stat.id}" data-type="${stat.Type || 'STATIC'}">
                <div class="stat-card-header" style="--type-color: ${typeInfo.color}">
                    <i class="fas ${typeInfo.icon}"></i>
                    <span class="stat-type-label">${typeInfo.label}</span>
                </div>
                <div class="stat-card-body">
                    <h4 class="stat-name">${this.escapeHtml(stat.name)}</h4>
                    <p class="stat-display">${this.escapeHtml(stat.Display || stat.name)}</p>
                    ${stat.Enabled === false ? '<span class="stat-disabled-badge">Disabled</span>' : ''}
                </div>
                <div class="stat-card-footer">
                    <span class="stat-base-value">Base: ${stat.BaseValue ?? 0}</span>
                    <button class="btn-icon edit-stat-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render Basic Info Section
     */
    renderBasicInfoSection(stat) {
        return `
            <div class="card collapsible-card">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-info-circle"></i> Basic Information
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Display Name <span class="required">*</span></label>
                            <input type="text" id="stat-display-name" class="form-input" 
                                value="${this.escapeHtml(stat.Display || '')}"
                                placeholder="Fire Resistance">
                            <small class="form-hint">How the stat appears in-game</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Internal Name <span class="required">*</span></label>
                            <input type="text" id="stat-internal-name" class="form-input" 
                                value="${this.escapeHtml(stat.name || '')}"
                                placeholder="FIRE_RESISTANCE">
                            <small class="form-hint">UPPERCASE_WITH_UNDERSCORES format</small>
                            <small class="form-hint auto-generated-hint" id="auto-name-hint" style="color: var(--accent-primary); display: none;"></small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="stat-enabled" ${stat.Enabled !== false ? 'checked' : ''}>
                            <span class="toggle-text">Enabled</span>
                        </label>
                        <small class="form-hint">Disable to temporarily turn off this stat without deleting it</small>
                    </div>
                    
                    <!-- Visual Type Selector -->
                    <div class="form-group">
                        <label class="form-label">Stat Type <span class="required">*</span></label>
                        <div class="stat-type-selector" id="stat-type-selector">
                            ${this.STAT_TYPES.map(type => `
                                <button type="button" class="stat-type-card ${stat.Type === type.value ? 'selected' : ''}" 
                                    data-type="${type.value}" style="--type-color: ${type.color}">
                                    <div class="type-card-icon">
                                        <i class="fas ${type.icon}"></i>
                                    </div>
                                    <div class="type-card-content">
                                        <strong>${type.label}</strong>
                                        <small>${type.description}</small>
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="stat-type" value="${stat.Type || 'STATIC'}">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Type Configuration Section
     */
    renderTypeConfigSection(stat) {
        return `
            <div class="card collapsible-card" id="type-config-section">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-cogs"></i> Type Configuration
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <!-- STATIC type options -->
                    <div class="type-specific-options" data-for-type="STATIC">
                        <div class="form-group">
                            <label class="form-label">Formula Key</label>
                            <input type="text" id="stat-formula-key" class="form-input" 
                                value="${this.escapeHtml(stat.FormulaKey || '')}"
                                placeholder="SPD">
                            <small class="form-hint">Short key used in other stat formulas (e.g., SPD for Speed)</small>
                        </div>
                    </div>
                    
                    <!-- DAMAGE_MODIFIER type options -->
                    <div class="type-specific-options" data-for-type="DAMAGE_MODIFIER">
                        <div class="form-group">
                            <label class="form-label">Damage Type</label>
                            <input type="text" id="stat-damage-type-modifier" class="form-input" 
                                value="${this.escapeHtml(stat.DamageType || '')}"
                                placeholder="BLUNT, SHARP, ALL, or leave empty">
                            <small class="form-hint">Specific damage type to modify, or leave empty for all damage</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Damage Formula <span class="required">*</span></label>
                            <div class="formula-builder">
                                <input type="text" id="stat-damage-formula" class="form-input formula-input" 
                                    value="${this.escapeHtml(stat.DamageFormula || '')}"
                                    placeholder="d * (1 - v)">
                                <div class="formula-blocks">
                                    ${this.FORMULA_BLOCKS.map(b => `
                                        <button type="button" class="formula-block" data-symbol="${b.symbol}" title="${b.description}">
                                            ${b.symbol === '*' ? '×' : b.symbol === '/' ? '÷' : b.symbol}
                                        </button>
                                    `).join('')}
                                </div>
                                <div class="formula-patterns">
                                    <label class="form-label-small">Common Patterns:</label>
                                    <div class="pattern-buttons">
                                        ${this.FORMULA_PATTERNS.map(p => `
                                            <button type="button" class="pattern-btn" data-formula="${p.formula}" title="${p.description}">
                                                ${p.label}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            <small class="form-hint">d = damage, v = stat value. Example: d * (1 - v) reduces damage by percentage</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Conditions (Optional)</label>
                            <div class="conditions-builder" id="conditions-builder">
                                <div class="conditions-list" id="stat-conditions-list">
                                    ${(stat.Conditions || []).map((cond, i) => `
                                        <div class="condition-item" data-index="${i}">
                                            <input type="text" class="form-input condition-input" value="${this.escapeHtml(cond)}">
                                            <button type="button" class="btn-icon btn-danger remove-condition-btn">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="condition-presets">
                                    <label class="form-label-small">Quick Add:</label>
                                    <select id="condition-preset-select" class="form-select">
                                        <option value="">Select damage cause...</option>
                                        ${Object.entries(this.DAMAGE_CAUSES).map(([category, causes]) => `
                                            <optgroup label="${category.charAt(0).toUpperCase() + category.slice(1)}">
                                                ${causes.map(cause => `
                                                    <option value="(damageCause ${cause.value})">${cause.icon} ${cause.label}</option>
                                                `).join('')}
                                            </optgroup>
                                        `).join('')}
                                    </select>
                                    <button type="button" class="btn btn-sm btn-secondary" id="add-condition-btn">
                                        <i class="fas fa-plus"></i> Add Condition
                                    </button>
                                </div>
                            </div>
                            <small class="form-hint">Conditions that must be met for this stat to apply</small>
                        </div>
                    </div>
                    
                    <!-- DAMAGE_BONUS type options -->
                    <div class="type-specific-options" data-for-type="DAMAGE_BONUS">
                        <div class="form-group">
                            <label class="form-label">Damage Type</label>
                            <input type="text" id="stat-damage-type-bonus" class="form-input" 
                                value="${this.escapeHtml(stat.DamageType || '')}"
                                placeholder="BLUNT, SHARP, or leave empty">
                            <small class="form-hint">Custom damage type this bonus applies to</small>
                        </div>
                    </div>
                    
                    <!-- PROC type options -->
                    <div class="type-specific-options" data-for-type="PROC">
                        <div class="form-group">
                            <label class="form-label">Skills to Execute</label>
                            <div class="skills-list" id="proc-skills-list">
                                ${(stat.Skills || []).map((skill, i) => `
                                    <div class="skill-item" data-index="${i}">
                                        <input type="text" class="form-input skill-input" value="${this.escapeHtml(skill)}">
                                        <button type="button" class="btn-icon btn-danger remove-skill-btn">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="btn btn-sm btn-secondary" id="add-proc-skill-btn">
                                <i class="fas fa-plus"></i> Add Skill Line
                            </button>
                            <small class="form-hint">MythicMobs skill lines to execute when proc triggers</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Values Section
     */
    renderValuesSection(stat) {
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-sliders-h"></i> Values
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Base Value</label>
                            <input type="number" id="stat-base-value" class="form-input" 
                                value="${stat.BaseValue ?? 0}" step="any">
                            <small class="form-hint">Default value if no modifiers are applied</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Priority</label>
                            <input type="number" id="stat-priority" class="form-input" 
                                value="${stat.Priority ?? 0}">
                            <small class="form-hint">Lower = evaluated first</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Min Value</label>
                            <input type="number" id="stat-min-value" class="form-input" 
                                value="${stat.MinValue ?? ''}" step="any" placeholder="No minimum">
                            <small class="form-hint">Optional minimum cap</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Max Value</label>
                            <input type="number" id="stat-max-value" class="form-input" 
                                value="${stat.MaxValue ?? ''}" step="any" placeholder="No maximum">
                            <small class="form-hint">Optional maximum cap</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Triggers Section
     */
    renderTriggersSection(stat) {
        const currentTriggers = stat.Triggers || [];
        
        return `
            <div class="card collapsible-card collapsed" id="triggers-section">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-bolt"></i> Triggers & Execution
                        ${currentTriggers.length > 0 ? `<span class="count-badge">${currentTriggers.length}</span>` : ''}
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="form-group">
                        <label class="form-label">When should this stat activate?</label>
                        <div class="triggers-selector">
                            ${Object.entries(this.TRIGGERS).map(([category, triggers]) => `
                                <div class="trigger-category">
                                    <h4 class="trigger-category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                                    <div class="trigger-checkboxes">
                                        ${triggers.map(t => `
                                            <label class="trigger-checkbox">
                                                <input type="checkbox" value="${t.value}" 
                                                    ${currentTriggers.includes(t.value) ? 'checked' : ''}>
                                                <span class="trigger-label">
                                                    <strong>${t.label}</strong>
                                                    <small>${t.description}</small>
                                                </span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Execution Point</label>
                        <div class="execution-point-selector">
                            <label class="radio-card ${(stat.ExecutionPoint || 'PRE') === 'PRE' ? 'selected' : ''}">
                                <input type="radio" name="execution-point" value="PRE" 
                                    ${(stat.ExecutionPoint || 'PRE') === 'PRE' ? 'checked' : ''}>
                                <div class="radio-card-content">
                                    <strong>PRE</strong>
                                    <small>Calculate before damage is applied</small>
                                    <span class="radio-hint">Best for: damage reduction, armor, resistances</span>
                                </div>
                            </label>
                            <label class="radio-card ${stat.ExecutionPoint === 'POST' ? 'selected' : ''}">
                                <input type="radio" name="execution-point" value="POST" 
                                    ${stat.ExecutionPoint === 'POST' ? 'checked' : ''}>
                                <div class="radio-card-content">
                                    <strong>POST</strong>
                                    <small>Calculate after damage is applied</small>
                                    <span class="radio-hint">Best for: lifesteal, damage reflection, procs</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Formatting Section
     */
    renderFormattingSection(stat) {
        const formatting = stat.Formatting || {};
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-palette"></i> Formatting
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="formatting-quick-style">
                        <label class="form-label">Color Prefix</label>
                        <div class="color-preset-selector">
                            ${this.COLOR_PRESETS.map(c => `
                                <button type="button" class="color-preset-btn" data-code="${c.code}" 
                                    style="background: ${c.color}" title="${c.name}">
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="grid-1">
                        <div class="form-group">
                            <label class="form-label">Additive Format</label>
                            <input type="text" id="stat-format-additive" class="form-input" 
                                value="${this.escapeHtml(formatting.Additive || '+<value> ' + (stat.Display || 'Stat'))}"
                                placeholder="+<value> Stat Name">
                            <small class="form-hint">Format for flat value additions</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Multiply Format</label>
                            <input type="text" id="stat-format-multiply" class="form-input" 
                                value="${this.escapeHtml(formatting.Multiply || '+<value> ' + (stat.Display || 'Stat'))}"
                                placeholder="+<value>% Stat Name">
                            <small class="form-hint">Format for percentage multipliers</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Compound Format</label>
                            <input type="text" id="stat-format-compound" class="form-input" 
                                value="${this.escapeHtml(formatting.Compound || 'x<value> ' + (stat.Display || 'Stat'))}"
                                placeholder="x<value> Stat Name">
                            <small class="form-hint">Format for compound multipliers</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Setter Format</label>
                            <input type="text" id="stat-format-setter" class="form-input" 
                                value="${this.escapeHtml(formatting.Setter || 'Force <value> ' + (stat.Display || 'Stat'))}"
                                placeholder="Force <value> Stat Name">
                            <small class="form-hint">Format for setter modifiers (overrides all other modifiers)</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Rounding</label>
                            <input type="number" id="stat-format-rounding" class="form-input" 
                                value="${formatting.Rounding ?? 2}" min="0" max="10">
                            <small class="form-hint">Decimal places for displayed values</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="show-in-item-lore" ${stat.ShowInItemLore !== false ? 'checked' : ''}>
                            <span class="toggle-text">Show In Item Lore</span>
                        </label>
                        <small class="form-hint">Whether tooltips show in item lore when using {stats-each}</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Show in Lore</label>
                        <div class="show-in-lore-options">
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-lore-additive" 
                                    ${stat.ShowInLore?.Additive !== false ? 'checked' : ''}>
                                <span>Additive</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-lore-multiply" 
                                    ${stat.ShowInLore?.Multiply !== false ? 'checked' : ''}>
                                <span>Multiply</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-lore-compound" 
                                    ${stat.ShowInLore?.Compound !== false ? 'checked' : ''}>
                                <span>Compound</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-lore-setter" 
                                    ${stat.ShowInLore?.Setter !== false ? 'checked' : ''}>
                                <span>Setter</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Advanced Section
     */
    renderAdvancedSection(stat) {
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-cog"></i> Advanced Options
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="stat-always-active" ${stat.AlwaysActive ? 'checked' : ''}>
                            <span class="toggle-text">Always Active</span>
                        </label>
                        <small class="form-hint">Force apply this stat to all entities</small>
                    </div>
                    
                    <!-- Special Options (stat-specific) -->
                    <div class="special-options-section">
                        <div class="form-group">
                            <label class="form-label">Frequency</label>
                            <input type="number" id="stat-frequency" class="form-input" 
                                value="${stat.Frequency ?? ''}" min="1" placeholder="60">
                            <small class="form-hint">Tick interval for regeneration stats (e.g., HEALTH_REGENERATION). 60 = every 3 seconds</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Front Angle</label>
                            <input type="number" id="stat-front-angle" class="form-input" 
                                value="${stat.FrontAngle ?? ''}" min="0" max="360" placeholder="180">
                            <small class="form-hint">Angle for frontal detection (e.g., PARRY_CHANCE). 180 = 180° cone in front</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Usable Materials</label>
                            <div class="materials-list" id="usable-materials-list">
                                ${(stat.UsableMaterials || []).map((mat, i) => `
                                    <div class="material-item" data-index="${i}">
                                        <input type="text" class="form-input material-input" value="${this.escapeHtml(mat)}" placeholder="DIAMOND_SWORD">
                                        <button type="button" class="btn-icon btn-danger remove-material-btn">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="btn btn-sm btn-secondary" id="add-material-btn">
                                <i class="fas fa-plus"></i> Add Material
                            </button>
                            <small class="form-hint">Items that can use this stat (e.g., PARRY_CHANCE requires swords)</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Parent Stats</label>
                        <div class="tags-input-container" id="parent-stats-container">
                            <div class="tags-list" id="parent-stats-list">
                                ${(stat.ParentStats || []).map(ps => `
                                    <span class="tag">${this.escapeHtml(ps)} <button type="button" class="tag-remove">&times;</button></span>
                                `).join('')}
                            </div>
                            <input type="text" class="tags-input" id="parent-stats-input" placeholder="Add parent stat...">
                        </div>
                        <small class="form-hint">Other stats this stat depends on</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Formula (for parent stats)</label>
                        <input type="text" id="stat-formula" class="form-input" 
                            value="${this.escapeHtml(stat.Formula || '')}"
                            placeholder="0.2 + (0.2 / (1 + e^(-0.005 * (SPD - 1000))))">
                        <small class="form-hint">Math formula using parent stat FormulaKeys</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Trigger Stats</label>
                        <div class="trigger-stats-list" id="trigger-stats-list">
                            ${(stat.TriggerStats || []).map((ts, i) => `
                                <div class="trigger-stat-item" data-index="${i}">
                                    <input type="text" class="form-input" value="${this.escapeHtml(ts)}">
                                    <button type="button" class="btn-icon btn-danger remove-trigger-stat-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-sm btn-secondary" id="add-trigger-stat-btn">
                            <i class="fas fa-plus"></i> Add Trigger Stat
                        </button>
                        <small class="form-hint">Stats from triggering entity. Format: STAT_NAME KEY</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Skills</label>
                        <div class="skills-list" id="stat-skills-list">
                            ${(stat.Skills || []).map((skill, i) => `
                                <div class="skill-item" data-index="${i}">
                                    <input type="text" class="form-input skill-input" value="${this.escapeHtml(skill)}">
                                    <button type="button" class="btn-icon btn-danger remove-stat-skill-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-sm btn-secondary" id="add-stat-skill-btn">
                            <i class="fas fa-plus"></i> Add Skill
                        </button>
                        <small class="form-hint">Skills executed when stat activates</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Test Calculator
     */
    renderTestCalculator(stat) {
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-calculator"></i> Test Calculator
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="test-calculator">
                        <div class="calc-inputs">
                            <div class="form-group">
                                <label class="form-label">Input Damage (d)</label>
                                <input type="number" id="calc-damage" class="form-input" value="100" min="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Stat Value (v)</label>
                                <input type="number" id="calc-stat-value" class="form-input" value="25" step="any">
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary" id="calc-test-btn">
                            <i class="fas fa-play"></i> Calculate
                        </button>
                        <div class="calc-result" id="calc-result">
                            <div class="calc-formula"></div>
                            <div class="calc-steps"></div>
                            <div class="calc-final"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Item Preview
     */
    renderItemPreview(stat) {
        const formatting = stat.Formatting || {};
        const displayValue = '25';
        
        return `
            <div class="card collapsible-card collapsed">
                <div class="card-header collapsible-header">
                    <h3 class="card-title">
                        <i class="fas fa-eye"></i> Item Lore Preview
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </h3>
                </div>
                <div class="card-body collapsible-card-body">
                    <div class="item-preview-container">
                        <div class="minecraft-item-tooltip">
                            <div class="item-name">⚔️ Example Sword</div>
                            <div class="item-divider"></div>
                            <div class="item-stats">
                                <div class="item-stat">+10 Attack Damage</div>
                                <div class="item-stat">+5% Attack Speed</div>
                            </div>
                            <div class="item-divider"></div>
                            <div class="item-custom-stat" id="preview-stat-line">
                                ${this.formatPreviewStat(formatting.Additive || '+<value> ' + (stat.Display || 'Stat'), displayValue)}
                            </div>
                            <div class="item-divider"></div>
                            <div class="item-footer">When equipped:</div>
                            <div class="item-effect" id="preview-effect-line">
                                ${this.getEffectDescription(stat)}
                            </div>
                        </div>
                        <p class="preview-hint"><i class="fas fa-sync-alt"></i> Preview updates as you type</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format preview stat line with color codes
     */
    formatPreviewStat(format, value) {
        if (!format) return '';
        let result = format.replace('<value>', value);
        // Convert Minecraft color codes to HTML
        result = result
            .replace(/&c/g, '<span style="color: #FF5555">')
            .replace(/&6/g, '<span style="color: #FFAA00">')
            .replace(/&e/g, '<span style="color: #FFFF55">')
            .replace(/&a/g, '<span style="color: #55FF55">')
            .replace(/&b/g, '<span style="color: #55FFFF">')
            .replace(/&9/g, '<span style="color: #5555FF">')
            .replace(/&d/g, '<span style="color: #FF55FF">')
            .replace(/&f/g, '<span style="color: #FFFFFF">')
            .replace(/&7/g, '<span style="color: #AAAAAA">')
            .replace(/&l/g, '<span style="font-weight: bold">')
            .replace(/&o/g, '<span style="font-style: italic">')
            .replace(/&r/g, '</span>');
        return result;
    }

    /**
     * Get effect description based on stat type
     */
    getEffectDescription(stat) {
        switch (stat.Type) {
            case 'DAMAGE_MODIFIER':
                if (stat.DamageFormula?.includes('1 - v')) {
                    return 'Reduces damage by stat percentage';
                } else if (stat.DamageFormula?.includes('d - v')) {
                    return 'Reduces damage by flat amount';
                }
                return 'Modifies damage received';
            case 'DAMAGE_BONUS':
                return `Adds ${stat.DamageType || 'bonus'} damage to attacks`;
            case 'PROC':
                return 'Chance to trigger special effects';
            case 'STATIC':
                return 'Provides a passive bonus';
            default:
                return 'Custom effect';
        }
    }

    /**
     * Attach event handlers for main editor
     */
    attachEventHandlers(stat) {
        // Save button
        document.getElementById('save-stat')?.addEventListener('click', () => this.save());
        
        // Undo/Redo buttons
        document.getElementById('undo-stat')?.addEventListener('click', () => this.undo());
        document.getElementById('redo-stat')?.addEventListener('click', () => this.redo());
        
        // Duplicate button
        document.getElementById('duplicate-stat')?.addEventListener('click', () => this.duplicateStat());
        
        // Delete button
        document.getElementById('delete-stat')?.addEventListener('click', () => this.deleteStat());
        
        // New stat button
        document.getElementById('new-stat')?.addEventListener('click', () => this.showCreateStatDialog());
        
        // Display name auto-generates internal name (debounced for performance)
        document.getElementById('stat-display-name')?.addEventListener('input', (e) => {
            const displayName = e.target.value;
            const internalName = this.toInternalName(displayName);
            const internalInput = document.getElementById('stat-internal-name');
            const hint = document.getElementById('auto-name-hint');
            
            if (internalInput && !internalInput.dataset.userModified) {
                internalInput.value = internalName;
            }
            
            if (hint && internalName) {
                hint.textContent = `Will be saved as: ${internalName}`;
                hint.style.display = 'block';
            }
            
            this.updateItemPreview();
            this.debouncedSync();
            this.debouncedValidation();
        });
        
        // Track if user manually modifies internal name (debounced)
        document.getElementById('stat-internal-name')?.addEventListener('input', (e) => {
            e.target.dataset.userModified = 'true';
            this.debouncedSync();
            this.debouncedValidation();
        });
        
        // Type selector cards (immediate sync - infrequent user action)
        document.querySelectorAll('.stat-type-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.stat-type-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const type = card.dataset.type;
                document.getElementById('stat-type').value = type;
                this.updateTypeSpecificVisibility(type);
                this.syncToFile();
                this.updateStatTypeIndicator(type);
            });
        });
        
        // Formula blocks
        document.querySelectorAll('.formula-block').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('stat-damage-formula');
                if (input) {
                    const symbol = btn.dataset.symbol;
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    const value = input.value;
                    input.value = value.slice(0, start) + symbol + value.slice(end);
                    input.focus();
                    input.setSelectionRange(start + symbol.length, start + symbol.length);
                    this.debouncedSync();
                }
            });
        });
        
        // Formula patterns (immediate sync - infrequent)
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('stat-damage-formula');
                if (input) {
                    input.value = btn.dataset.formula;
                    this.syncToFile();
                    this.updateTestCalculator();
                }
            });
        });
        
        // Condition preset selector
        document.getElementById('condition-preset-select')?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.addCondition(e.target.value);
                e.target.value = '';
            }
        });
        
        // Add condition button
        document.getElementById('add-condition-btn')?.addEventListener('click', () => {
            const select = document.getElementById('condition-preset-select');
            if (select && select.value) {
                this.addCondition(select.value);
                select.value = '';
            } else {
                this.addCondition('');
            }
        });
        
        // Remove condition buttons
        document.querySelectorAll('.remove-condition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.condition-item')?.remove();
                this.syncToFile();
            });
        });
        
        // Add proc skill button
        document.getElementById('add-proc-skill-btn')?.addEventListener('click', () => {
            this.addSkillLine('proc-skills-list');
        });
        
        // Remove proc skill buttons
        document.querySelectorAll('#proc-skills-list .remove-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.skill-item')?.remove();
                this.syncToFile();
            });
        });
        
        // Trigger checkboxes
        document.querySelectorAll('.trigger-checkbox input').forEach(cb => {
            cb.addEventListener('change', () => this.syncToFile());
        });
        
        // Execution point radios
        document.querySelectorAll('input[name="execution-point"]').forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('.radio-card').forEach(card => card.classList.remove('selected'));
                radio.closest('.radio-card')?.classList.add('selected');
                this.syncToFile();
            });
        });
        
        // Color preset buttons
        document.querySelectorAll('.color-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                const additiveInput = document.getElementById('stat-format-additive');
                if (additiveInput) {
                    // Prepend color code if not already there
                    if (!additiveInput.value.startsWith('&')) {
                        additiveInput.value = code + additiveInput.value;
                    } else {
                        additiveInput.value = code + additiveInput.value.substring(2);
                    }
                }
                // Apply to all format inputs
                ['stat-format-multiply', 'stat-format-compound', 'stat-format-setter'].forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        if (!input.value.startsWith('&')) {
                            input.value = code + input.value;
                        } else {
                            input.value = code + input.value.substring(2);
                        }
                    }
                });
                this.updateItemPreview();
                this.syncToFile();
            });
        });
        
        // Test calculator
        document.getElementById('calc-test-btn')?.addEventListener('click', () => this.runTestCalculation());
        document.getElementById('calc-damage')?.addEventListener('input', () => this.runTestCalculation());
        document.getElementById('calc-stat-value')?.addEventListener('input', () => this.runTestCalculation());
        
        // All form inputs sync to file
        document.querySelectorAll('.stats-editor input, .stats-editor select, .stats-editor textarea').forEach(input => {
            if (!input.closest('.test-calculator')) {
                input.addEventListener('change', () => this.syncToFile());
                input.addEventListener('input', () => {
                    this.updateItemPreview();
                    // Debounced sync
                    clearTimeout(this.syncTimeout);
                    this.syncTimeout = setTimeout(() => this.syncToFile(), 300);
                });
            }
        });
        
        // Advanced section handlers
        this.attachAdvancedHandlers(stat);
    }

    /**
     * Attach handlers for advanced section
     */
    attachAdvancedHandlers(stat) {
        // Add material button
        document.getElementById('add-material-btn')?.addEventListener('click', () => {
            const list = document.getElementById('usable-materials-list');
            if (list) {
                const index = list.children.length;
                const div = document.createElement('div');
                div.className = 'material-item';
                div.dataset.index = index;
                div.innerHTML = `
                    <input type="text" class="form-input material-input" placeholder="DIAMOND_SWORD">
                    <button type="button" class="btn-icon btn-danger remove-material-btn">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                list.appendChild(div);
                div.querySelector('.remove-material-btn').addEventListener('click', () => {
                    div.remove();
                    this.syncToFile();
                });
                div.querySelector('input').addEventListener('change', () => this.syncToFile());
            }
        });
        
        // Remove material buttons
        document.querySelectorAll('.remove-material-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.material-item')?.remove();
                this.syncToFile();
            });
        });
        
        // Add trigger stat button
        document.getElementById('add-trigger-stat-btn')?.addEventListener('click', () => {
            const list = document.getElementById('trigger-stats-list');
            if (list) {
                const index = list.children.length;
                const div = document.createElement('div');
                div.className = 'trigger-stat-item';
                div.dataset.index = index;
                div.innerHTML = `
                    <input type="text" class="form-input" placeholder="STAT_NAME KEY">
                    <button type="button" class="btn-icon btn-danger remove-trigger-stat-btn">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                list.appendChild(div);
                div.querySelector('.remove-trigger-stat-btn').addEventListener('click', () => {
                    div.remove();
                    this.syncToFile();
                });
                div.querySelector('input').addEventListener('change', () => this.syncToFile());
            }
        });
        
        // Remove trigger stat buttons
        document.querySelectorAll('.remove-trigger-stat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.trigger-stat-item')?.remove();
                this.syncToFile();
            });
        });
        
        // Add stat skill button
        document.getElementById('add-stat-skill-btn')?.addEventListener('click', () => {
            this.addSkillLine('stat-skills-list');
        });
        
        // Remove stat skill buttons
        document.querySelectorAll('#stat-skills-list .remove-stat-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.skill-item')?.remove();
                this.syncToFile();
            });
        });
        
        // Parent stats tag input
        const parentInput = document.getElementById('parent-stats-input');
        if (parentInput) {
            parentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && parentInput.value.trim()) {
                    e.preventDefault();
                    this.addParentStatTag(parentInput.value.trim());
                    parentInput.value = '';
                }
            });
        }
        
        // Parent stat tag removal
        document.querySelectorAll('#parent-stats-list .tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.tag')?.remove();
                this.syncToFile();
            });
        });
    }

    /**
     * Attach handlers for file container view
     */
    attachFileContainerHandlers(file) {
        // Create new stat button
        document.getElementById('create-new-stat-btn')?.addEventListener('click', () => {
            this.showCreateStatDialog();
        });
        
        // Template cards
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.template;
                this.createFromTemplate(templateId);
            });
        });
        
        // Stat cards (edit)
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.edit-stat-btn')) {
                    const statId = card.dataset.statId;
                    this.openStat(statId);
                }
            });
            
            card.querySelector('.edit-stat-btn')?.addEventListener('click', () => {
                const statId = card.dataset.statId;
                this.openStat(statId);
            });
        });
        
        // Search filter
        document.getElementById('stats-search')?.addEventListener('input', (e) => {
            this.filterStats(e.target.value);
        });
        
        // Type filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterStatsByType(btn.dataset.filter);
            });
        });
    }

    /**
     * Update type-specific field visibility
     */
    updateTypeSpecificVisibility(type) {
        // Hide all type-specific sections
        document.querySelectorAll('.type-specific-options').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show relevant section
        const section = document.querySelector(`.type-specific-options[data-for-type="${type}"]`);
        if (section) {
            section.style.display = 'block';
        }
        
        // Show/hide triggers section based on type
        const triggersSection = document.getElementById('triggers-section');
        if (triggersSection) {
            if (type === 'STATIC') {
                triggersSection.style.display = 'none';
            } else {
                triggersSection.style.display = 'block';
            }
        }
    }

    /**
     * Add a condition to the list
     */
    addCondition(value) {
        const list = document.getElementById('stat-conditions-list');
        if (!list) return;
        
        const index = list.children.length;
        const div = document.createElement('div');
        div.className = 'condition-item';
        div.dataset.index = index;
        div.innerHTML = `
            <input type="text" class="form-input condition-input" value="${this.escapeHtml(value)}">
            <button type="button" class="btn-icon btn-danger remove-condition-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(div);
        
        div.querySelector('.remove-condition-btn').addEventListener('click', () => {
            div.remove();
            this.syncToFile();
        });
        div.querySelector('input').addEventListener('change', () => this.syncToFile());
        div.querySelector('input').focus();
        this.syncToFile();
    }

    /**
     * Add a skill line to a list
     */
    addSkillLine(listId) {
        const list = document.getElementById(listId);
        if (!list) return;
        
        const index = list.children.length;
        const div = document.createElement('div');
        div.className = 'skill-item';
        div.dataset.index = index;
        div.innerHTML = `
            <input type="text" class="form-input skill-input" placeholder="- mechanic{options} @target">
            <button type="button" class="btn-icon btn-danger remove-skill-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(div);
        
        div.querySelector('.remove-skill-btn').addEventListener('click', () => {
            div.remove();
            this.syncToFile();
        });
        div.querySelector('input').addEventListener('change', () => this.syncToFile());
        div.querySelector('input').focus();
        this.syncToFile();
    }

    /**
     * Add parent stat tag
     */
    addParentStatTag(value) {
        const list = document.getElementById('parent-stats-list');
        if (!list) return;
        
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `${this.escapeHtml(value)} <button type="button" class="tag-remove">&times;</button>`;
        list.appendChild(tag);
        
        tag.querySelector('.tag-remove').addEventListener('click', () => {
            tag.remove();
            this.syncToFile();
        });
        this.syncToFile();
    }

    /**
     * Run test calculation
     */
    runTestCalculation() {
        const damageInput = document.getElementById('calc-damage');
        const statInput = document.getElementById('calc-stat-value');
        const formulaInput = document.getElementById('stat-damage-formula');
        const resultDiv = document.getElementById('calc-result');
        
        if (!damageInput || !statInput || !resultDiv) return;
        
        const d = parseFloat(damageInput.value) || 0;
        const v = parseFloat(statInput.value) || 0;
        const formula = formulaInput?.value || 'd';
        
        try {
            // Safe evaluation of formula
            const safeFormula = formula
                .replace(/d/g, d.toString())
                .replace(/v/g, v.toString());
            
            // Only allow safe math operations
            if (!/^[\d\s+\-*/().e^]+$/i.test(safeFormula)) {
                throw new Error('Invalid formula');
            }
            
            const result = Function('"use strict"; return (' + safeFormula + ')')();
            
            resultDiv.innerHTML = `
                <div class="calc-formula">
                    <strong>Formula:</strong> ${this.escapeHtml(formula)}
                </div>
                <div class="calc-steps">
                    <strong>Calculation:</strong> ${this.escapeHtml(safeFormula)} = ${result.toFixed(2)}
                </div>
                <div class="calc-final ${result < d ? 'reduction' : result > d ? 'increase' : ''}">
                    <strong>Result:</strong> ${result.toFixed(2)} damage
                    ${result < d ? `<span class="calc-diff">(${((1 - result/d) * 100).toFixed(1)}% reduced)</span>` : ''}
                    ${result > d ? `<span class="calc-diff">(${((result/d - 1) * 100).toFixed(1)}% increased)</span>` : ''}
                </div>
            `;
        } catch (e) {
            resultDiv.innerHTML = `
                <div class="calc-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Invalid formula. Use d for damage, v for stat value.
                </div>
            `;
        }
    }

    /**
     * Update item preview
     */
    updateItemPreview() {
        const additiveFormat = document.getElementById('stat-format-additive')?.value || '+<value> Stat';
        const previewLine = document.getElementById('preview-stat-line');
        const effectLine = document.getElementById('preview-effect-line');
        
        if (previewLine) {
            previewLine.innerHTML = this.formatPreviewStat(additiveFormat, '25');
        }
        
        if (effectLine && this.currentStat) {
            effectLine.textContent = this.getEffectDescription(this.collectFormData());
        }
    }

    /**
     * Update test calculator with current formula
     */
    updateTestCalculator() {
        this.runTestCalculation();
    }

    /**
     * Filter stats by search term
     */
    filterStats(term) {
        const cards = document.querySelectorAll('.stat-card');
        const lowerTerm = term.toLowerCase();
        
        cards.forEach(card => {
            const name = card.querySelector('.stat-name')?.textContent.toLowerCase() || '';
            const display = card.querySelector('.stat-display')?.textContent.toLowerCase() || '';
            
            if (name.includes(lowerTerm) || display.includes(lowerTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Filter stats by type
     */
    filterStatsByType(type) {
        const cards = document.querySelectorAll('.stat-card');
        
        cards.forEach(card => {
            if (type === 'all' || card.dataset.type === type) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Open a specific stat for editing
     */
    openStat(statId) {
        if (!this.editor?.state?.currentPack) return;
        
        // Find the stat
        const statsFile = this.editor.state.currentPack.stats;
        if (statsFile?.entries) {
            const stat = statsFile.entries.find(s => s.id === statId);
            if (stat) {
                this.editor.openFile(stat, 'stat');
            }
        }
    }

    /**
     * Create stat from template
     */
    createFromTemplate(templateId) {
        // Find template
        let template = null;
        for (const category of Object.values(this.TEMPLATES)) {
            template = category.find(t => t.id === templateId);
            if (template) break;
        }
        
        if (!template) {
            this.editor.showToast('Template not found', 'error');
            return;
        }
        
        // Show name dialog
        this.showNameDialogForTemplate(template);
    }

    /**
     * Show name dialog for template creation
     */
    async showNameDialogForTemplate(template) {
        const displayName = await this.editor.showPrompt(
            'Create from Template',
            `Enter a display name for your ${template.name} stat:`,
            template.data.Display || template.name
        );
        
        if (!displayName) return;
        
        const internalName = this.toInternalName(displayName);
        
        // Create new stat from template
        const newStat = {
            id: 'stat_' + Date.now(),
            name: internalName,
            Enabled: true,
            ...JSON.parse(JSON.stringify(template.data)),
            Display: displayName
        };
        
        // Update formatting with new name
        if (newStat.Formatting) {
            newStat.Formatting.Additive = newStat.Formatting.Additive?.replace(template.data.Display, displayName);
            newStat.Formatting.Multiply = newStat.Formatting.Multiply?.replace(template.data.Display, displayName);
            newStat.Formatting.Compound = newStat.Formatting.Compound?.replace(template.data.Display, displayName);
        }
        
        // Add to pack
        this.addStatToPack(newStat);
    }

    /**
     * Add stat to current pack
     */
    addStatToPack(stat) {
        if (!this.editor?.state?.currentPack) {
            this.editor.showToast('No pack selected', 'error');
            return;
        }
        
        const pack = this.editor.state.currentPack;
        
        // Ensure stats file exists
        if (!pack.stats) {
            pack.stats = {
                id: 'stats_' + Date.now(),
                fileName: 'stats.yml',
                entries: [],
                modified: true,
                isNew: true
            };
        }
        
        // Add stat to entries
        pack.stats.entries.push(stat);
        pack.stats.modified = true;
        
        // Open the new stat
        this.editor.openFile(stat, 'stat');
        this.editor.markDirty();
        this.editor.showToast(`Created stat "${stat.Display || stat.name}"`, 'success');
    }

    /**
     * Show create stat dialog
     */
    showCreateStatDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay stats-creation-overlay';
        overlay.innerHTML = `
            <div class="modal stats-creation-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-line"></i> Create New Stat</h3>
                    <button class="modal-close" id="close-stat-dialog">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="creation-choice-section">
                        <p class="creation-subtitle">How would you like to create your stat?</p>
                        
                        <div class="creation-type-options">
                            <button type="button" class="creation-choice-btn choice-template" data-choice="template">
                                <div class="choice-icon">
                                    <i class="fas fa-magic"></i>
                                </div>
                                <strong>From Template</strong>
                                <small>Pre-configured stat patterns</small>
                            </button>
                            <button type="button" class="creation-choice-btn choice-wizard" data-choice="wizard">
                                <div class="choice-icon">
                                    <i class="fas fa-hat-wizard"></i>
                                </div>
                                <strong>Step-by-Step</strong>
                                <small>Guided creation wizard</small>
                            </button>
                            <button type="button" class="creation-choice-btn choice-blank" data-choice="blank">
                                <div class="choice-icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <strong>Blank Stat</strong>
                                <small>Start from scratch</small>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-stat-dialog">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        
        const cleanup = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 150);
        };
        
        overlay.querySelector('#close-stat-dialog').addEventListener('click', cleanup);
        overlay.querySelector('#cancel-stat-dialog').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });
        
        // Choice handlers
        overlay.querySelectorAll('.creation-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.dataset.choice;
                cleanup();
                
                switch (choice) {
                    case 'template':
                        this.showTemplateSelector();
                        break;
                    case 'wizard':
                        this.startCreationWizard();
                        break;
                    case 'blank':
                        this.createBlankStat();
                        break;
                }
            });
        });
    }

    /**
     * Show template selector dialog
     */
    showTemplateSelector() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay template-selector-overlay';
        overlay.innerHTML = `
            <div class="modal template-selector-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-magic"></i> Choose a Template</h3>
                    <button class="modal-close" id="close-template-dialog">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="template-categories-full">
                        ${Object.entries(this.TEMPLATES).map(([category, templates]) => `
                            <div class="template-category-section">
                                <h4>${category === 'defensive' ? '🛡️ Defensive' : category === 'offensive' ? '⚔️ Offensive' : '✨ Special'}</h4>
                                <div class="template-grid-full">
                                    ${templates.map(t => `
                                        <button class="template-card-full" data-template="${t.id}" style="--template-color: ${t.color}">
                                            <span class="template-icon-large">${t.icon}</span>
                                            <span class="template-name">${t.name}</span>
                                            <span class="template-type">${t.data.Type}</span>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-template-dialog">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        
        const cleanup = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 150);
        };
        
        overlay.querySelector('#close-template-dialog').addEventListener('click', cleanup);
        overlay.querySelector('#cancel-template-dialog').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });
        
        overlay.querySelectorAll('.template-card-full').forEach(card => {
            card.addEventListener('click', () => {
                cleanup();
                this.createFromTemplate(card.dataset.template);
            });
        });
    }

    /**
     * Create a blank stat
     */
    async createBlankStat() {
        const displayName = await this.editor.showPrompt(
            'Create Blank Stat',
            'Enter a display name for your stat:',
            'My Custom Stat'
        );
        
        if (!displayName) return;
        
        const internalName = this.toInternalName(displayName);
        
        const newStat = {
            id: 'stat_' + Date.now(),
            name: internalName,
            Enabled: true,
            Type: 'STATIC',
            Display: displayName,
            BaseValue: 0,
            Formatting: {
                Additive: `+<value> ${displayName}`,
                Multiply: `+<value> ${displayName}`,
                Compound: `x<value> ${displayName}`
            }
        };
        
        this.addStatToPack(newStat);
    }

    /**
     * Start creation wizard
     */
    startCreationWizard() {
        this.wizardStep = 1;
        this.wizardData = {
            displayName: '',
            internalName: '',
            type: 'STATIC',
            enabled: true
        };
        this.showWizardStep(1);
    }

    /**
     * Show wizard step
     */
    showWizardStep(step) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay wizard-overlay';
        overlay.id = 'wizard-overlay';
        
        let content = '';
        
        switch (step) {
            case 1:
                content = this.getWizardStep1();
                break;
            case 2:
                content = this.getWizardStep2();
                break;
            case 3:
                content = this.getWizardStep3();
                break;
            case 4:
                content = this.getWizardStep4();
                break;
        }
        
        overlay.innerHTML = `
            <div class="modal wizard-modal">
                <div class="wizard-header">
                    <h3><i class="fas fa-hat-wizard"></i> Create Custom Stat - Step ${step} of 4</h3>
                    <button class="modal-close" id="close-wizard">&times;</button>
                </div>
                <div class="wizard-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${step * 25}%"></div>
                    </div>
                    <div class="progress-steps">
                        <span class="${step >= 1 ? 'active' : ''}">Name</span>
                        <span class="${step >= 2 ? 'active' : ''}">Type</span>
                        <span class="${step >= 3 ? 'active' : ''}">Configure</span>
                        <span class="${step >= 4 ? 'active' : ''}">Format</span>
                    </div>
                </div>
                <div class="wizard-body">
                    ${content}
                </div>
                <div class="wizard-footer">
                    ${step > 1 ? '<button class="btn btn-secondary" id="wizard-back"><i class="fas fa-arrow-left"></i> Back</button>' : '<button class="btn btn-secondary" id="wizard-cancel">Cancel</button>'}
                    ${step < 4 ? '<button class="btn btn-primary" id="wizard-next">Next <i class="fas fa-arrow-right"></i></button>' : '<button class="btn btn-success" id="wizard-finish"><i class="fas fa-check"></i> Create Stat</button>'}
                </div>
            </div>
        `;
        
        // Remove existing wizard if present
        document.getElementById('wizard-overlay')?.remove();
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        
        this.attachWizardHandlers(step, overlay);
    }

    /**
     * Wizard Step 1: Name
     */
    getWizardStep1() {
        return `
            <div class="wizard-step-content">
                <div class="wizard-question">
                    <h4>What should this stat be called?</h4>
                    <p>Enter a name that describes what this stat does.</p>
                </div>
                
                <div class="form-group wizard-input-group">
                    <input type="text" id="wizard-display-name" class="form-input form-input-large" 
                        value="${this.escapeHtml(this.wizardData.displayName)}"
                        placeholder="e.g., Fire Resistance" autofocus>
                </div>
                
                <div class="wizard-preview" id="wizard-name-preview">
                    ${this.wizardData.displayName ? `
                        <div class="preview-item">
                            <i class="fas fa-lightbulb"></i>
                            <span>Internal Name: <code>${this.toInternalName(this.wizardData.displayName)}</code></span>
                        </div>
                        <div class="preview-item">
                            <i class="fas fa-tag"></i>
                            <span>Display: "${this.wizardData.displayName}"</span>
                        </div>
                    ` : '<p class="hint">Start typing to see preview...</p>'}
                </div>
            </div>
        `;
    }

    /**
     * Wizard Step 2: Type
     */
    getWizardStep2() {
        return `
            <div class="wizard-step-content">
                <div class="wizard-question">
                    <h4>What does this stat do?</h4>
                    <p>Select the type that best describes your stat's function.</p>
                </div>
                
                <div class="wizard-type-grid">
                    ${this.STAT_TYPES.map(type => `
                        <button class="wizard-type-card ${this.wizardData.type === type.value ? 'selected' : ''}" 
                            data-type="${type.value}" style="--type-color: ${type.color}">
                            <div class="type-icon">
                                <i class="fas ${type.icon}"></i>
                            </div>
                            <div class="type-info">
                                <strong>${type.label}</strong>
                                <p>${type.description}</p>
                                <small class="type-example"><i class="fas fa-info-circle"></i> ${type.example}</small>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Wizard Step 3: Configure
     */
    getWizardStep3() {
        const type = this.wizardData.type;
        let configContent = '';
        
        if (type === 'DAMAGE_MODIFIER') {
            configContent = `
                <div class="form-group">
                    <label class="form-label">What damage should this affect?</label>
                    <select id="wizard-damage-type" class="form-select">
                        <option value="">All Damage</option>
                        <option value="BLUNT" ${this.wizardData.damageType === 'BLUNT' ? 'selected' : ''}>Blunt Damage</option>
                        <option value="SHARP" ${this.wizardData.damageType === 'SHARP' ? 'selected' : ''}>Sharp Damage</option>
                        <option value="FIRE" ${this.wizardData.damageType === 'FIRE' ? 'selected' : ''}>Fire Damage</option>
                        <option value="CUSTOM">Custom Type...</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">How should damage be modified?</label>
                    <div class="wizard-formula-options">
                        <label class="formula-option ${(this.wizardData.formula || 'd * (1 - v)') === 'd * (1 - v)' ? 'selected' : ''}">
                            <input type="radio" name="wizard-formula" value="d * (1 - v)" checked>
                            <div class="formula-option-content">
                                <strong>Percentage Reduction</strong>
                                <code>d * (1 - v)</code>
                                <small>e.g., 25% stat = 25% less damage</small>
                            </div>
                        </label>
                        <label class="formula-option ${this.wizardData.formula === 'd - v' ? 'selected' : ''}">
                            <input type="radio" name="wizard-formula" value="d - v">
                            <div class="formula-option-content">
                                <strong>Flat Reduction</strong>
                                <code>d - v</code>
                                <small>e.g., 25 stat = 25 less damage</small>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">When does this trigger?</label>
                    <div class="wizard-trigger-options">
                        <label class="trigger-option">
                            <input type="checkbox" value="DAMAGED" ${(this.wizardData.triggers || ['DAMAGED']).includes('DAMAGED') ? 'checked' : ''}>
                            <span>When taking damage</span>
                        </label>
                    </div>
                </div>
            `;
        } else if (type === 'DAMAGE_BONUS') {
            configContent = `
                <div class="form-group">
                    <label class="form-label">What type of damage bonus?</label>
                    <select id="wizard-damage-type" class="form-select">
                        <option value="">Generic Bonus</option>
                        <option value="BLUNT" ${this.wizardData.damageType === 'BLUNT' ? 'selected' : ''}>Blunt Damage</option>
                        <option value="SHARP" ${this.wizardData.damageType === 'SHARP' ? 'selected' : ''}>Sharp Damage</option>
                        <option value="CUSTOM">Custom Type...</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Base Value</label>
                    <input type="number" id="wizard-base-value" class="form-input" 
                        value="${this.wizardData.baseValue || 0}" placeholder="0">
                    <small class="form-hint">Default bonus damage amount</small>
                </div>
            `;
        } else if (type === 'PROC') {
            configContent = `
                <div class="form-group">
                    <label class="form-label">What triggers the proc?</label>
                    <div class="wizard-trigger-options">
                        <label class="trigger-option">
                            <input type="checkbox" value="ATTACK" ${(this.wizardData.triggers || ['ATTACK']).includes('ATTACK') ? 'checked' : ''}>
                            <span>On Attack</span>
                        </label>
                        <label class="trigger-option">
                            <input type="checkbox" value="DAMAGED" ${(this.wizardData.triggers || []).includes('DAMAGED') ? 'checked' : ''}>
                            <span>When Damaged</span>
                        </label>
                        <label class="trigger-option">
                            <input type="checkbox" value="KILL" ${(this.wizardData.triggers || []).includes('KILL') ? 'checked' : ''}>
                            <span>On Kill</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Skill to execute (optional)</label>
                    <input type="text" id="wizard-skill" class="form-input" 
                        value="${this.escapeHtml(this.wizardData.skill || '')}"
                        placeholder="- mechanic{options} @target">
                    <small class="form-hint">MythicMobs skill line to run when proc triggers</small>
                </div>
            `;
        } else { // STATIC
            configContent = `
                <div class="form-group">
                    <label class="form-label">Formula Key (optional)</label>
                    <input type="text" id="wizard-formula-key" class="form-input" 
                        value="${this.escapeHtml(this.wizardData.formulaKey || '')}"
                        placeholder="e.g., SPD">
                    <small class="form-hint">Short key used in other stat formulas</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Base Value</label>
                    <input type="number" id="wizard-base-value" class="form-input" 
                        value="${this.wizardData.baseValue || 0}" placeholder="0">
                </div>
            `;
        }
        
        return `
            <div class="wizard-step-content">
                <div class="wizard-question">
                    <h4>Configure your ${this.getStatTypeInfo(type).label}</h4>
                    <p>Set up the specific options for this stat type.</p>
                </div>
                ${configContent}
            </div>
        `;
    }

    /**
     * Wizard Step 4: Format
     */
    getWizardStep4() {
        const displayName = this.wizardData.displayName || 'Stat';
        
        return `
            <div class="wizard-step-content">
                <div class="wizard-question">
                    <h4>How should this stat appear on items?</h4>
                    <p>Customize how players see this stat.</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="wizard-color-selector">
                        ${this.COLOR_PRESETS.map(c => `
                            <button type="button" class="color-btn ${this.wizardData.colorCode === c.code ? 'selected' : ''}" 
                                data-code="${c.code}" style="background: ${c.color}" title="${c.name}">
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="wizard-format-preview">
                    <h5>Preview:</h5>
                    <div class="minecraft-tooltip-mini">
                        <div class="format-line" id="wizard-format-preview">
                            ${this.formatPreviewStat((this.wizardData.colorCode || '&a') + '+<value> ' + displayName, '25')}
                        </div>
                    </div>
                </div>
                
                <div class="wizard-summary">
                    <h5><i class="fas fa-clipboard-check"></i> Summary</h5>
                    <ul>
                        <li><strong>Name:</strong> ${this.escapeHtml(displayName)}</li>
                        <li><strong>Internal:</strong> <code>${this.toInternalName(displayName)}</code></li>
                        <li><strong>Type:</strong> ${this.getStatTypeInfo(this.wizardData.type).label}</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Attach wizard event handlers
     */
    attachWizardHandlers(step, overlay) {
        const cleanup = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 150);
        };
        
        overlay.querySelector('#close-wizard')?.addEventListener('click', cleanup);
        overlay.querySelector('#wizard-cancel')?.addEventListener('click', cleanup);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });
        
        // Back button
        overlay.querySelector('#wizard-back')?.addEventListener('click', () => {
            cleanup();
            this.showWizardStep(step - 1);
        });
        
        // Next/Finish buttons
        overlay.querySelector('#wizard-next')?.addEventListener('click', () => {
            if (this.validateWizardStep(step, overlay)) {
                this.saveWizardStep(step, overlay);
                cleanup();
                this.showWizardStep(step + 1);
            }
        });
        
        overlay.querySelector('#wizard-finish')?.addEventListener('click', () => {
            this.saveWizardStep(step, overlay);
            cleanup();
            this.createStatFromWizard();
        });
        
        // Step-specific handlers
        if (step === 1) {
            const nameInput = overlay.querySelector('#wizard-display-name');
            nameInput?.addEventListener('input', (e) => {
                const preview = overlay.querySelector('#wizard-name-preview');
                const name = e.target.value;
                if (preview && name) {
                    preview.innerHTML = `
                        <div class="preview-item">
                            <i class="fas fa-lightbulb"></i>
                            <span>Internal Name: <code>${this.toInternalName(name)}</code></span>
                        </div>
                        <div class="preview-item">
                            <i class="fas fa-tag"></i>
                            <span>Display: "${name}"</span>
                        </div>
                    `;
                }
            });
            nameInput?.focus();
        }
        
        if (step === 2) {
            overlay.querySelectorAll('.wizard-type-card').forEach(card => {
                card.addEventListener('click', () => {
                    overlay.querySelectorAll('.wizard-type-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.wizardData.type = card.dataset.type;
                });
            });
        }
        
        if (step === 3) {
            overlay.querySelectorAll('.formula-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    overlay.querySelectorAll('.formula-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                });
            });
        }
        
        if (step === 4) {
            overlay.querySelectorAll('.color-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    overlay.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.wizardData.colorCode = btn.dataset.code;
                    
                    const preview = overlay.querySelector('#wizard-format-preview');
                    if (preview) {
                        preview.innerHTML = this.formatPreviewStat(
                            btn.dataset.code + '+<value> ' + (this.wizardData.displayName || 'Stat'),
                            '25'
                        );
                    }
                });
            });
        }
    }

    /**
     * Validate wizard step
     */
    validateWizardStep(step, overlay) {
        if (step === 1) {
            const name = overlay.querySelector('#wizard-display-name')?.value?.trim();
            if (!name) {
                this.editor.showToast('Please enter a stat name', 'warning');
                return false;
            }
        }
        return true;
    }

    /**
     * Save wizard step data
     */
    saveWizardStep(step, overlay) {
        switch (step) {
            case 1:
                this.wizardData.displayName = overlay.querySelector('#wizard-display-name')?.value?.trim() || '';
                this.wizardData.internalName = this.toInternalName(this.wizardData.displayName);
                break;
            case 2:
                const selectedType = overlay.querySelector('.wizard-type-card.selected');
                this.wizardData.type = selectedType?.dataset.type || 'STATIC';
                break;
            case 3:
                this.wizardData.damageType = overlay.querySelector('#wizard-damage-type')?.value || '';
                this.wizardData.formula = overlay.querySelector('input[name="wizard-formula"]:checked')?.value || 'd * (1 - v)';
                this.wizardData.formulaKey = overlay.querySelector('#wizard-formula-key')?.value || '';
                this.wizardData.baseValue = parseFloat(overlay.querySelector('#wizard-base-value')?.value) || 0;
                this.wizardData.skill = overlay.querySelector('#wizard-skill')?.value || '';
                this.wizardData.triggers = [];
                overlay.querySelectorAll('.wizard-trigger-options input:checked').forEach(cb => {
                    this.wizardData.triggers.push(cb.value);
                });
                break;
            case 4:
                const selectedColor = overlay.querySelector('.color-btn.selected');
                this.wizardData.colorCode = selectedColor?.dataset.code || '&a';
                break;
        }
    }

    /**
     * Create stat from wizard data
     */
    createStatFromWizard() {
        const data = this.wizardData;
        const colorCode = data.colorCode || '&a';
        
        const newStat = {
            id: 'stat_' + Date.now(),
            name: data.internalName,
            Enabled: true,
            Type: data.type,
            Display: data.displayName,
            BaseValue: data.baseValue || 0,
            Formatting: {
                Additive: `${colorCode}+<value> ${data.displayName}`,
                Multiply: `${colorCode}+<value> ${data.displayName}`,
                Compound: `${colorCode}x<value> ${data.displayName}`
            }
        };
        
        // Type-specific properties
        if (data.type === 'DAMAGE_MODIFIER') {
            newStat.Triggers = data.triggers?.length ? data.triggers : ['DAMAGED'];
            newStat.ExecutionPoint = 'PRE';
            newStat.DamageFormula = data.formula || 'd * (1 - v)';
            if (data.damageType) {
                newStat.DamageType = data.damageType;
            }
        } else if (data.type === 'DAMAGE_BONUS') {
            newStat.Triggers = ['ATTACK'];
            newStat.ExecutionPoint = 'PRE';
            if (data.damageType) {
                newStat.DamageType = data.damageType;
            }
        } else if (data.type === 'PROC') {
            newStat.Triggers = data.triggers?.length ? data.triggers : ['ATTACK'];
            if (data.skill) {
                newStat.Skills = [data.skill];
            }
        } else if (data.type === 'STATIC') {
            if (data.formulaKey) {
                newStat.FormulaKey = data.formulaKey;
            }
        }
        
        this.addStatToPack(newStat);
    }

    /**
     * Collect form data from editor
     */
    collectFormData() {
        const data = {
            name: document.getElementById('stat-internal-name')?.value?.trim() || '',
            Enabled: document.getElementById('stat-enabled')?.checked !== false,
            Type: document.getElementById('stat-type')?.value || 'STATIC',
            Display: document.getElementById('stat-display-name')?.value?.trim() || '',
            BaseValue: parseFloat(document.getElementById('stat-base-value')?.value) || 0,
            Priority: parseInt(document.getElementById('stat-priority')?.value) || 0
        };
        
        // Optional values
        const minVal = document.getElementById('stat-min-value')?.value;
        if (minVal !== '' && minVal !== undefined) {
            data.MinValue = parseFloat(minVal);
        }
        
        const maxVal = document.getElementById('stat-max-value')?.value;
        if (maxVal !== '' && maxVal !== undefined) {
            data.MaxValue = parseFloat(maxVal);
        }
        
        // Type-specific data
        if (data.Type === 'STATIC') {
            const formulaKey = document.getElementById('stat-formula-key')?.value?.trim();
            if (formulaKey) data.FormulaKey = formulaKey;
        } else if (data.Type === 'DAMAGE_MODIFIER') {
            const damageType = document.getElementById('stat-damage-type-modifier')?.value?.trim();
            if (damageType) data.DamageType = damageType;
            
            const formula = document.getElementById('stat-damage-formula')?.value?.trim();
            if (formula) data.DamageFormula = formula;
            
            // Collect conditions
            const conditions = [];
            document.querySelectorAll('#stat-conditions-list .condition-input').forEach(input => {
                const val = input.value?.trim();
                if (val) conditions.push(val);
            });
            if (conditions.length) data.Conditions = conditions;
        } else if (data.Type === 'DAMAGE_BONUS') {
            const damageType = document.getElementById('stat-damage-type-bonus')?.value?.trim();
            if (damageType) data.DamageType = damageType;
        } else if (data.Type === 'PROC') {
            const skills = [];
            document.querySelectorAll('#proc-skills-list .skill-input').forEach(input => {
                const val = input.value?.trim();
                if (val) skills.push(val);
            });
            if (skills.length) data.Skills = skills;
        }
        
        // Triggers (for non-STATIC types)
        if (data.Type !== 'STATIC') {
            const triggers = [];
            document.querySelectorAll('.trigger-checkbox input:checked').forEach(cb => {
                triggers.push(cb.value);
            });
            if (triggers.length) data.Triggers = triggers;
            
            const execPoint = document.querySelector('input[name="execution-point"]:checked')?.value;
            if (execPoint) data.ExecutionPoint = execPoint;
        }
        
        // Formatting
        data.Formatting = {
            Additive: document.getElementById('stat-format-additive')?.value || '',
            Multiply: document.getElementById('stat-format-multiply')?.value || '',
            Compound: document.getElementById('stat-format-compound')?.value || '',
            Setter: document.getElementById('stat-format-setter')?.value || ''
        };
        
        const rounding = document.getElementById('stat-format-rounding')?.value;
        if (rounding !== '' && rounding !== undefined) {
            data.Formatting.Rounding = parseInt(rounding);
        }
        
        // ShowInItemLore (global toggle)
        const showInItemLore = document.getElementById('show-in-item-lore')?.checked;
        if (showInItemLore === false) {
            data.ShowInItemLore = false;
        }
        
        // ShowInLore
        const showAdditive = document.getElementById('show-lore-additive')?.checked;
        const showMultiply = document.getElementById('show-lore-multiply')?.checked;
        const showCompound = document.getElementById('show-lore-compound')?.checked;
        const showSetter = document.getElementById('show-lore-setter')?.checked;
        
        if (showAdditive === false || showMultiply === false || showCompound === false || showSetter === false) {
            data.ShowInLore = {};
            if (showAdditive === false) data.ShowInLore.Additive = false;
            if (showMultiply === false) data.ShowInLore.Multiply = false;
            if (showCompound === false) data.ShowInLore.Compound = false;
            if (showSetter === false) data.ShowInLore.Setter = false;
        }
        
        // Advanced options
        const alwaysActive = document.getElementById('stat-always-active')?.checked;
        if (alwaysActive) data.AlwaysActive = true;
        
        // Special stat-specific options
        const frequency = document.getElementById('stat-frequency')?.value;
        if (frequency !== '' && frequency !== undefined) {
            data.Frequency = parseInt(frequency);
        }
        
        const frontAngle = document.getElementById('stat-front-angle')?.value;
        if (frontAngle !== '' && frontAngle !== undefined) {
            data.FrontAngle = parseInt(frontAngle);
        }
        
        const usableMaterials = [];
        document.querySelectorAll('#usable-materials-list .material-input').forEach(input => {
            const val = input.value?.trim();
            if (val) usableMaterials.push(val);
        });
        if (usableMaterials.length) data.UsableMaterials = usableMaterials;
        
        const parentStats = [];
        document.querySelectorAll('#parent-stats-list .tag').forEach(tag => {
            const text = tag.textContent.replace('×', '').trim();
            if (text) parentStats.push(text);
        });
        if (parentStats.length) data.ParentStats = parentStats;
        
        const formula = document.getElementById('stat-formula')?.value?.trim();
        if (formula) data.Formula = formula;
        
        const triggerStats = [];
        document.querySelectorAll('#trigger-stats-list input').forEach(input => {
            const val = input.value?.trim();
            if (val) triggerStats.push(val);
        });
        if (triggerStats.length) data.TriggerStats = triggerStats;
        
        const advancedSkills = [];
        document.querySelectorAll('#stat-skills-list .skill-input').forEach(input => {
            const val = input.value?.trim();
            if (val) advancedSkills.push(val);
        });
        if (advancedSkills.length && data.Type !== 'PROC') {
            data.Skills = advancedSkills;
        }
        
        return data;
    }

    /**
     * Debounced sync - call this from input handlers for performance
     */
    debouncedSync() {
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
        }
        this.syncDebounceTimer = setTimeout(() => {
            this.syncToFile();
        }, this.DEBOUNCE_DELAY);
    }

    /**
     * Debounced validation update
     */
    debouncedValidation() {
        if (this.validationDebounceTimer) {
            clearTimeout(this.validationDebounceTimer);
        }
        this.validationDebounceTimer = setTimeout(() => {
            this.updateValidationStatus();
        }, this.DEBOUNCE_DELAY);
    }

    /**
     * Sync form data to current stat object
     */
    syncToFile(skipUndo = false) {
        if (!this.currentStat) return;
        
        // Push undo state before changes (unless skipped)
        if (!skipUndo) {
            this.pushUndoState();
        }
        
        const data = this.collectFormData();
        
        // Update current stat with collected data
        Object.assign(this.currentStat, data);
        this.currentStat.modified = true;
        
        // Update pack's stats file
        if (this.editor?.state?.currentPack?.stats) {
            this.editor.state.currentPack.stats.modified = true;
        }
        
        // Mark editor dirty
        this.editor?.markDirty();
        
        // Update YAML preview (debounced internally by the editor)
        this.editor?.updateYAMLPreview();
    }

    /**
     * Save the current stat with validation
     */
    async save() {
        if (!this.currentStat) {
            this.editor.showToast('No stat to save', 'error');
            return;
        }
        
        // Sync before validation
        this.syncToFile(true);
        
        // Validate
        const errors = this.validateStat(this.currentStat);
        const isValid = this.showValidationErrors(errors);
        
        if (!isValid) {
            const hardErrors = errors.filter(e => e.severity !== 'warning');
            this.editor.showToast(`Cannot save: ${hardErrors.length} validation error(s)`, 'error');
            return;
        }
        
        // Show warnings but continue
        const warnings = errors.filter(e => e.severity === 'warning');
        if (warnings.length > 0) {
            this.editor.showToast(`Saved with ${warnings.length} warning(s)`, 'warning');
        }
        
        try {
            await this.editor.saveCurrentFile();
            this.editor.showToast(`Saved stat "${this.currentStat.Display || this.currentStat.name}"`, 'success');
        } catch (error) {
            console.error('Failed to save stat:', error);
            this.editor.showToast('Failed to save stat', 'error');
        }
    }

    /**
     * Duplicate current stat
     */
    async duplicateStat() {
        if (!this.currentStat) return;
        
        const newName = await this.editor.showPrompt(
            'Duplicate Stat',
            'Enter a name for the duplicated stat:',
            this.currentStat.Display + ' Copy'
        );
        
        if (!newName) return;
        
        const newStat = JSON.parse(JSON.stringify(this.currentStat));
        newStat.id = 'stat_' + Date.now();
        newStat.name = this.toInternalName(newName);
        newStat.Display = newName;
        
        // Update formatting with new name
        if (newStat.Formatting) {
            const oldName = this.currentStat.Display || this.currentStat.name;
            newStat.Formatting.Additive = newStat.Formatting.Additive?.replace(oldName, newName);
            newStat.Formatting.Multiply = newStat.Formatting.Multiply?.replace(oldName, newName);
            newStat.Formatting.Compound = newStat.Formatting.Compound?.replace(oldName, newName);
        }
        
        this.addStatToPack(newStat);
    }

    /**
     * Delete current stat
     */
    async deleteStat() {
        if (!this.currentStat) return;
        
        const confirmed = await this.editor.showConfirm(
            'Delete Stat',
            `Are you sure you want to delete "${this.currentStat.Display || this.currentStat.name}"?`
        );
        
        if (!confirmed) return;
        
        const pack = this.editor?.state?.currentPack;
        if (pack?.stats?.entries) {
            const index = pack.stats.entries.findIndex(s => s.id === this.currentStat.id);
            if (index > -1) {
                pack.stats.entries.splice(index, 1);
                pack.stats.modified = true;
                this.editor.markDirty();
                
                // Go back to file container view
                const fileContainer = {
                    id: 'stats_container',
                    _isFileContainer: true,
                    _fileId: pack.stats.id,
                    _fileName: 'stats.yml',
                    _file: pack.stats,
                    name: 'stats.yml',
                    fileName: 'stats.yml',
                    entries: pack.stats.entries
                };
                
                this.editor.openFile(fileContainer, 'stat');
                this.editor.showToast('Stat deleted', 'success');
            }
        }
    }
}

// Make globally available
window.StatsEditor = StatsEditor;
