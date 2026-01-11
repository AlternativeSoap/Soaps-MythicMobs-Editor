/**
 * Stats Editor Component - Simplified & Fast
 * Designed for speed - create stats as fast as writing YAML
 */
class StatsEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentStat = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // Debounce
        this.syncTimer = null;
        this.DEBOUNCE = 100;
        
        this.initConstants();
        this.initKeyboard();
    }

    initKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!document.querySelector('.stats-editor')) return;
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); this.save(); }
            if (e.ctrlKey && e.key === 'd') { e.preventDefault(); this.duplicate(); }
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); this.undo(); }
            if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) { e.preventDefault(); this.redo(); }
            if (e.key === 'Escape') { document.querySelector('.modal-overlay')?.remove(); }
        });
    }

    initConstants() {
        // Field descriptions for help tooltips
        this.HELP = {
            Display: 'The name shown on items and in-game. Example: "Fire Resistance"',
            InternalID: 'Unique identifier used in configs. Use UPPER_SNAKE_CASE. Example: FIRE_RESISTANCE',
            BaseValue: 'Starting value for this stat. Most stats default to 0.',
            Enabled: 'When disabled, the stat won\'t have any effect in-game.',
            Type: 'STATIC = Just a value for formulas. DEFENSE = Reduces incoming damage. OFFENSE = Adds bonus damage. PROC = Triggers skills on events.',
            Trigger: 'When the stat activates: ATTACK (when hitting), DAMAGED (when hit), KILL (on kill), DEATH (when dying).',
            Execution: 'PRE = Applies before damage calculation. POST = Applies after damage is calculated.',
            DamageType: 'Optional damage type filter. Only activates for this damage type (e.g., BLUNT, SHARP, FIRE).',
            DamageFormula: 'Math formula to modify damage. Use "d" for damage amount and "v" for stat value. Example: d * (1 - v) reduces damage by stat percentage.',
            Conditions: 'Extra conditions that must be true. Example: (damageCause FIRE) only triggers on fire damage.',
            FormulaKey: 'Short alias to reference this stat\'s value in other formulas. Example: SPD for Speed stat.',
            Skills: 'MythicMobs skills to execute when the stat triggers. Format: - skillname{options} @target',
            MinValue: 'Minimum allowed value for this stat (optional).',
            MaxValue: 'Maximum allowed value for this stat (optional, often 1 for percentages).',
            Priority: 'Order of execution when multiple stats trigger. Higher = runs first.',
            AlwaysActive: 'When enabled, the stat is always active regardless of triggers.',
            Formatting: 'How the stat displays on items. Use <value> as placeholder. Additive (+), Multiply (%), Compound (×).'
        };

        // Stat types - simplified
        this.TYPES = {
            STATIC: { icon: '📊', color: '#6366f1', label: 'Static', desc: 'Value for formulas' },
            DAMAGE_MODIFIER: { icon: '🛡️', color: '#10b981', label: 'Defense', desc: 'Reduces damage' },
            DAMAGE_BONUS: { icon: '⚔️', color: '#f59e0b', label: 'Offense', desc: 'Bonus damage' },
            PROC: { icon: '⚡', color: '#ec4899', label: 'Proc', desc: 'Trigger skills' }
        };

        // Quick presets - the most common stat patterns
        this.PRESETS = [
            { id: 'resist_fire', name: 'Fire Resistance', icon: '🔥', type: 'DAMAGE_MODIFIER', formula: 'd * (1 - v)', cond: '(damageCause FIRE || damageCause FIRE_TICK)', trig: 'DAMAGED' },
            { id: 'resist_magic', name: 'Magic Resistance', icon: '✨', type: 'DAMAGE_MODIFIER', formula: 'd * (1 - v)', cond: '(damageCause MAGIC)', trig: 'DAMAGED' },
            { id: 'resist_poison', name: 'Poison Resistance', icon: '☠️', type: 'DAMAGE_MODIFIER', formula: 'd * (1 - v)', cond: '(damageCause POISON)', trig: 'DAMAGED' },
            { id: 'armor_flat', name: 'Flat Armor', icon: '🛡️', type: 'DAMAGE_MODIFIER', formula: 'd - v', trig: 'DAMAGED' },
            { id: 'armor_percent', name: 'Percent Armor', icon: '🛡️', type: 'DAMAGE_MODIFIER', formula: 'd * (1 - v)', trig: 'DAMAGED' },
            { id: 'dmg_blunt', name: 'Blunt Damage', icon: '🔨', type: 'DAMAGE_BONUS', dmgType: 'BLUNT', trig: 'ATTACK' },
            { id: 'dmg_sharp', name: 'Sharp Damage', icon: '🗡️', type: 'DAMAGE_BONUS', dmgType: 'SHARP', trig: 'ATTACK' },
            { id: 'dmg_bonus', name: 'Bonus Damage', icon: '💥', type: 'DAMAGE_BONUS', trig: 'ATTACK' },
            { id: 'static', name: 'Static Value', icon: '📊', type: 'STATIC' },
            { id: 'proc', name: 'Proc Effect', icon: '⚡', type: 'PROC', trig: 'ATTACK' }
        ];

        // Common formulas with practical examples
        this.FORMULAS = [
            { label: '-Flat', formula: 'd - v', desc: 'Flat reduction: Subtract stat value from damage. v=10 → 100 dmg becomes 90 dmg', example: '100 dmg - 10 stat = 90 dmg' },
            { label: '-%', formula: 'd * (1 - v)', desc: 'Percent reduction: v=0.25 means 25% reduction', example: '100 dmg × 0.75 = 75 dmg (25% reduced)' },
            { label: 'Armor', formula: 'd * (100 / (100 + v))', desc: 'Diminishing returns like WoW armor. v=100 = 50% reduction', example: 'v=100 → 50%, v=200 → 66%, v=400 → 80%' }
        ];

        // Damage causes for conditions
        this.DAMAGE_CAUSES = [
            { v: 'FIRE', l: '🔥 Fire' }, { v: 'FIRE_TICK', l: '🔥 Fire Tick' },
            { v: 'LAVA', l: '🌋 Lava' }, { v: 'MAGIC', l: '✨ Magic' },
            { v: 'POISON', l: '☠️ Poison' }, { v: 'WITHER', l: '💀 Wither' },
            { v: 'FREEZE', l: '❄️ Freeze' }, { v: 'LIGHTNING', l: '⚡ Lightning' },
            { v: 'FALL', l: '⬇️ Fall' }, { v: 'DROWNING', l: '💧 Drowning' },
            { v: 'PROJECTILE', l: '🏹 Projectile' }, { v: 'ENTITY_ATTACK', l: '👊 Melee' }
        ];
    }

    // ========== UNDO/REDO ==========
    pushUndo() {
        if (!this.currentStat) return;
        this.undoStack.push(JSON.stringify(this.currentStat));
        if (this.undoStack.length > this.maxUndoSteps) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        if (!this.undoStack.length) return this.editor.showToast('Nothing to undo', 'info');
        this.redoStack.push(JSON.stringify(this.currentStat));
        Object.assign(this.currentStat, JSON.parse(this.undoStack.pop()));
        this.renderStat(this.currentStat);
    }

    redo() {
        if (!this.redoStack.length) return this.editor.showToast('Nothing to redo', 'info');
        this.undoStack.push(JSON.stringify(this.currentStat));
        Object.assign(this.currentStat, JSON.parse(this.redoStack.pop()));
        this.renderStat(this.currentStat);
    }

    // ========== RENDER ==========
    render(data) {
        // Check if this is a file container (stats.yml overview) or a single stat
        if (data && data._isFileContainer) {
            this.fileData = data;
            this.renderFileView(data.entries || []);
        } else if (data && (data.name || data.Display || data.Type)) {
            // It's a stat object
            this.renderStat(data);
        } else {
            // Default to file view with empty stats
            this.fileData = data;
            this.renderFileView([]);
        }
    }

    renderStat(stat) {
        this.currentStat = stat;
        const container = document.getElementById('stats-editor-view');
        if (!container) return;

        // Update editor state for YAML preview
        this.editor.state.currentFile = stat;
        this.editor.state.currentFileType = 'stat';
        
        const isNew = !stat.name;
        const type = this.TYPES[stat.Type] || this.TYPES.STATIC;

        container.innerHTML = `
            <div class="stats-editor simplified">
                ${this.renderHeader(stat, isNew)}
                <div class="se-body">
                    ${isNew ? this.renderPresets() : ''}
                    ${this.renderForm(stat, type)}
                </div>
            </div>
        `;

        this.bindEvents();
        
        // Update YAML preview
        this.updatePreview();
    }

    renderHeader(stat, isNew) {
        const type = this.TYPES[stat.Type] || this.TYPES.STATIC;
        return `
            <div class="se-header">
                <div class="se-header-left">
                    <button class="se-btn se-btn-back" id="btn-back" title="Back to Dashboard">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <span class="se-icon" style="background:${type.color}">${type.icon}</span>
                    <div class="se-title-group">
                        <h2>${isNew ? 'Create New Stat' : this.esc(stat.Display || stat.name)}</h2>
                        ${!isNew ? `<span class="se-id">${this.esc(stat.name)}</span>` : ''}
                    </div>
                </div>
                <div class="se-header-actions">
                    ${!isNew ? `
                        <button class="se-btn se-btn-icon" id="btn-undo" title="Undo (Ctrl+Z)"><i class="fas fa-undo"></i></button>
                        <button class="se-btn se-btn-icon" id="btn-redo" title="Redo (Ctrl+Y)"><i class="fas fa-redo"></i></button>
                        <button class="se-btn se-btn-outline" id="btn-duplicate"><i class="fas fa-copy"></i> Clone</button>
                        <button class="se-btn se-btn-danger" id="btn-delete"><i class="fas fa-trash"></i></button>
                    ` : ''}
                    <button class="se-btn se-btn-primary" id="btn-save"><i class="fas fa-save"></i> Save</button>
                </div>
            </div>
        `;
    }

    renderPresets() {
        return `
            <div class="se-presets">
                <div class="se-presets-label">Quick Start:</div>
                <div class="se-presets-grid">
                    ${this.PRESETS.map(p => `
                        <button class="se-preset" data-preset="${p.id}" title="${p.name}">
                            <span class="se-preset-icon">${p.icon}</span>
                            <span class="se-preset-name">${p.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Help tooltip helper (disabled)
    help(key) {
        return '';
    }

    renderForm(stat, typeInfo) {
        const type = stat.Type || 'STATIC';
        const showDamageOptions = type === 'DAMAGE_MODIFIER' || type === 'DAMAGE_BONUS';
        const showFormula = type === 'DAMAGE_MODIFIER';
        const showSkills = type === 'PROC';
        const showTriggers = type !== 'STATIC';

        return `
            <div class="se-form">
                <!-- ROW 1: Basic Info -->
                <div class="se-row se-row-main">
                    <div class="se-field se-field-grow">
                        <label>Display Name ${this.help('Display')}</label>
                        <input type="text" id="f-display" class="se-input se-input-lg" 
                            value="${this.esc(stat.Display || '')}" 
                            placeholder="Fire Resistance" autofocus>
                    </div>
                    <div class="se-field">
                        <label>Internal ID ${this.help('InternalID')}</label>
                        <input type="text" id="f-name" class="se-input" 
                            value="${this.esc(stat.name || '')}" 
                            placeholder="FIRE_RESISTANCE">
                        <small class="se-hint" id="f-name-hint"></small>
                    </div>
                    <div class="se-field se-field-small">
                        <label>Base Value ${this.help('BaseValue')}</label>
                        <input type="number" id="f-base" class="se-input" 
                            value="${stat.BaseValue ?? 0}" step="any">
                    </div>
                    <div class="se-field se-field-toggle">
                        <label class="se-toggle" title="${this.esc(this.HELP.Enabled)}">
                            <input type="checkbox" id="f-enabled" ${stat.Enabled !== false ? 'checked' : ''}>
                            <span class="se-toggle-slider"></span>
                            <span class="se-toggle-label">Enabled</span>
                        </label>
                    </div>
                </div>

                <!-- ROW 2: Type Selection -->
                <div class="se-row">
                    <div class="se-field se-field-full">
                        <label>Stat Type ${this.help('Type')}</label>
                        <div class="se-type-buttons">
                            ${Object.entries(this.TYPES).map(([k, v]) => `
                                <button class="se-type-btn ${type === k ? 'active' : ''}" data-type="${k}" title="${v.desc}">
                                    <span class="se-type-icon" style="background:${v.color}">${v.icon}</span>
                                    <span class="se-type-name">${v.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- ROW 3: Type-specific options -->
                ${showTriggers ? `
                <div class="se-row">
                    <div class="se-field">
                        <label>Trigger ${this.help('Trigger')}</label>
                        <div class="se-chips">
                            ${['ATTACK', 'DAMAGED', 'KILL', 'DEATH'].map(t => `
                                <label class="se-chip ${(stat.Triggers || []).includes(t) ? 'active' : ''}" title="${t === 'ATTACK' ? 'When this entity hits something' : t === 'DAMAGED' ? 'When this entity takes damage' : t === 'KILL' ? 'When this entity kills something' : 'When this entity dies'}">
                                    <input type="checkbox" value="${t}" ${(stat.Triggers || []).includes(t) ? 'checked' : ''} class="trigger-cb">
                                    ${t === 'ATTACK' ? '⚔️' : t === 'DAMAGED' ? '🛡️' : t === 'KILL' ? '💀' : '☠️'} ${t}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="se-field">
                        <label>Execution ${this.help('Execution')}</label>
                        <div class="se-btn-group">
                            <button class="se-btn-choice ${(stat.ExecutionPoint || 'PRE') === 'PRE' ? 'active' : ''}" data-exec="PRE" title="Applies before final damage is calculated">
                                PRE <small>before damage</small>
                            </button>
                            <button class="se-btn-choice ${stat.ExecutionPoint === 'POST' ? 'active' : ''}" data-exec="POST" title="Applies after damage is calculated">
                                POST <small>after damage</small>
                            </button>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${showDamageOptions ? `
                <div class="se-row">
                    <div class="se-field">
                        <label>Damage Type ${this.help('DamageType')}</label>
                        <input type="text" id="f-dmgtype" class="se-input" 
                            value="${this.esc(stat.DamageType || '')}" 
                            placeholder="BLUNT, SHARP, etc.">
                    </div>
                    ${showFormula ? `
                    <div class="se-field se-field-grow">
                        <label>Damage Formula</label>
                        <div class="se-formula-row">
                            <input type="text" id="f-formula" class="se-input se-input-mono" 
                                value="${this.esc(stat.DamageFormula || '')}" 
                                placeholder="d * (1 - v)">
                        </div>
                        <div class="se-formula-presets">
                            ${this.FORMULAS.map(f => `
                                <button class="se-formula-btn" data-formula="${f.formula}" title="${f.example}">${f.label}</button>
                            `).join('')}
                        </div>
                        <div class="se-formula-example" id="formula-preview">
                            <span class="se-formula-vars">d = incoming damage, v = your stat value</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                ${showFormula ? `
                <div class="se-row">
                    <div class="se-field se-field-full">
                        <label>Conditions ${this.help('Conditions')}</label>
                        <div class="se-conditions">
                            <div class="se-condition-list" id="condition-list">
                                ${(stat.Conditions || []).map((c, i) => `
                                    <div class="se-condition-item" data-idx="${i}">
                                        <input type="text" class="se-input cond-input" value="${this.esc(c)}">
                                        <button class="se-btn-x" data-remove="${i}">×</button>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="se-condition-add">
                                <select id="cond-preset" class="se-select">
                                    <option value="">Add condition...</option>
                                    ${this.DAMAGE_CAUSES.map(c => `<option value="(damageCause ${c.v})">${c.l}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${type === 'STATIC' ? `
                <div class="se-row">
                    <div class="se-field">
                        <label>Formula Key ${this.help('FormulaKey')}</label>
                        <input type="text" id="f-formulakey" class="se-input se-input-mono" 
                            value="${this.esc(stat.FormulaKey || '')}" 
                            placeholder="SPD">
                    </div>
                </div>
                ` : ''}

                ${showSkills ? `
                <div class="se-row">
                    <div class="se-field se-field-full">
                        <label>Skills to Execute ${this.help('Skills')}</label>
                        <div class="se-skills-list" id="skills-list">
                            ${(stat.Skills || []).map((s, i) => `
                                <div class="se-skill-item" data-idx="${i}">
                                    <input type="text" class="se-input skill-input" value="${this.esc(s)}" placeholder="- skill{option=value} @target">
                                    <button class="se-btn-x" data-remove-skill="${i}">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="se-btn se-btn-sm" id="btn-add-skill"><i class="fas fa-plus"></i> Add Skill</button>
                    </div>
                </div>
                ` : ''}

                <!-- ROW: Advanced (collapsed by default) -->
                <details class="se-advanced">
                    <summary><i class="fas fa-cog"></i> Advanced Options</summary>
                    <div class="se-advanced-content">
                        <div class="se-row">
                            <div class="se-field">
                                <label>Min Value ${this.help('MinValue')}</label>
                                <input type="number" id="f-min" class="se-input" value="${stat.MinValue ?? ''}" step="any" placeholder="None">
                            </div>
                            <div class="se-field">
                                <label>Max Value ${this.help('MaxValue')}</label>
                                <input type="number" id="f-max" class="se-input" value="${stat.MaxValue ?? ''}" step="any" placeholder="None">
                            </div>
                            <div class="se-field">
                                <label>Priority ${this.help('Priority')}</label>
                                <input type="number" id="f-priority" class="se-input" value="${stat.Priority ?? ''}" placeholder="0">
                            </div>
                            <div class="se-field se-field-toggle">
                                <label class="se-toggle" title="${this.esc(this.HELP.AlwaysActive)}">
                                    <input type="checkbox" id="f-always" ${stat.AlwaysActive ? 'checked' : ''}>
                                    <span class="se-toggle-slider"></span>
                                    <span class="se-toggle-label">Always Active</span>
                                </label>
                            </div>
                        </div>
                        <div class="se-row">
                            <div class="se-field se-field-full">
                                <label>Formatting ${this.help('Formatting')}</label>
                                <div class="se-formatting-grid">
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Additive: Flat bonus values">+</span>
                                        <input type="text" id="f-fmt-add" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Additive || '')}" 
                                            placeholder="+<value> ${stat.Display || 'Stat'}">
                                    </div>
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Multiply: Percentage bonuses">%</span>
                                        <input type="text" id="f-fmt-mul" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Multiply || '')}" 
                                            placeholder="+<value>% ${stat.Display || 'Stat'}">
                                    </div>
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Compound: Multiplier bonuses">×</span>
                                        <input type="text" id="f-fmt-comp" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Compound || '')}" 
                                            placeholder="x<value> ${stat.Display || 'Stat'}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        `;
    }

    // ========== FILE VIEW (stats.yml overview) ==========
    renderFileView(stats) {
        const container = document.getElementById('stats-editor-view');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-editor simplified file-view">
                <div class="se-header">
                    <div class="se-header-left">
                        <button class="se-btn se-btn-back" id="btn-back" title="Back to Dashboard">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <span class="se-icon" style="background:#6366f1">📊</span>
                        <h2>stats.yml</h2>
                    </div>
                    <div class="se-header-actions">
                        <button class="se-btn se-btn-primary" id="btn-new-stat"><i class="fas fa-plus"></i> New Stat</button>
                    </div>
                </div>
                <div class="se-body">
                    <div class="se-presets">
                        <div class="se-presets-label">Quick Create:</div>
                        <div class="se-presets-grid">
                            ${this.PRESETS.slice(0, 6).map(p => `
                                <button class="se-preset" data-preset="${p.id}" title="${p.name}">
                                    <span class="se-preset-icon">${p.icon}</span>
                                    <span class="se-preset-name">${p.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="se-search-bar">
                        <input type="text" id="stats-search" class="se-input" placeholder="Search stats...">
                        <div class="se-filter-chips">
                            <button class="se-filter active" data-filter="all">All</button>
                            ${Object.entries(this.TYPES).map(([k, v]) => `
                                <button class="se-filter" data-filter="${k}">${v.icon} ${v.label}</button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="se-stats-grid" id="stats-grid">
                        ${stats.length ? stats.map(s => this.renderStatCard(s)).join('') : `
                            <div class="se-empty">
                                <i class="fas fa-chart-line"></i>
                                <p>No custom stats yet</p>
                                <p class="se-empty-hint">Click "New Stat" or use a preset above</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        this.bindFileViewEvents();
    }

    renderStatCard(stat) {
        const type = this.TYPES[stat.Type] || this.TYPES.STATIC;
        return `
            <div class="se-stat-card" data-stat="${this.esc(stat.id)}" data-type="${stat.Type || 'STATIC'}">
                <div class="se-card-header" style="border-color:${type.color}">
                    <span class="se-card-icon" style="background:${type.color}">${type.icon}</span>
                    <span class="se-card-type">${type.label}</span>
                    ${stat.Enabled === false ? '<span class="se-card-disabled">OFF</span>' : ''}
                </div>
                <div class="se-card-body">
                    <h4>${this.esc(stat.Display || stat.name)}</h4>
                    <code>${this.esc(stat.name)}</code>
                </div>
                <div class="se-card-footer">
                    <span>Base: ${stat.BaseValue ?? 0}</span>
                    <button class="se-btn-icon" title="Edit"><i class="fas fa-edit"></i></button>
                </div>
            </div>
        `;
    }

    // ========== EVENTS ==========
    bindEvents() {
        const $ = id => document.getElementById(id);

        // Back button
        $('btn-back')?.addEventListener('click', () => this.goToDashboard());

        // Header buttons
        $('btn-save')?.addEventListener('click', () => this.save());
        $('btn-delete')?.addEventListener('click', () => this.delete());
        $('btn-duplicate')?.addEventListener('click', () => this.duplicate());
        $('btn-undo')?.addEventListener('click', () => this.undo());
        $('btn-redo')?.addEventListener('click', () => this.redo());

        // Display name -> auto ID
        $('f-display')?.addEventListener('input', (e) => {
            const val = e.target.value;
            const nameField = $('f-name');
            const hint = $('f-name-hint');
            if (nameField && !this.currentStat?.name) {
                const autoId = this.toInternalName(val);
                nameField.placeholder = autoId;
                if (hint) hint.textContent = autoId ? `Will use: ${autoId}` : '';
            }
            this.syncField('Display', val);
            this.autoFillFormatting(val);
        });

        // Other fields
        $('f-name')?.addEventListener('input', (e) => this.syncField('name', e.target.value));
        $('f-base')?.addEventListener('input', (e) => this.syncField('BaseValue', parseFloat(e.target.value) || 0));
        $('f-enabled')?.addEventListener('change', (e) => this.syncField('Enabled', e.target.checked));
        $('f-dmgtype')?.addEventListener('input', (e) => this.syncField('DamageType', e.target.value));
        $('f-formula')?.addEventListener('input', (e) => {
            this.syncField('DamageFormula', e.target.value);
            this.updateFormulaPreview(e.target.value);
        });
        $('f-formulakey')?.addEventListener('input', (e) => this.syncField('FormulaKey', e.target.value));
        $('f-min')?.addEventListener('input', (e) => this.syncField('MinValue', e.target.value ? parseFloat(e.target.value) : undefined));
        $('f-max')?.addEventListener('input', (e) => this.syncField('MaxValue', e.target.value ? parseFloat(e.target.value) : undefined));
        $('f-priority')?.addEventListener('input', (e) => this.syncField('Priority', e.target.value ? parseInt(e.target.value) : undefined));
        $('f-always')?.addEventListener('change', (e) => this.syncField('AlwaysActive', e.target.checked || undefined));

        // Formatting
        $('f-fmt-add')?.addEventListener('input', (e) => this.syncFormatting('Additive', e.target.value));
        $('f-fmt-mul')?.addEventListener('input', (e) => this.syncFormatting('Multiply', e.target.value));
        $('f-fmt-comp')?.addEventListener('input', (e) => this.syncFormatting('Compound', e.target.value));

        // Type buttons
        document.querySelectorAll('.se-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pushUndo();
                this.currentStat.Type = btn.dataset.type;
                this.renderStat(this.currentStat);
            });
        });

        // Trigger checkboxes
        document.querySelectorAll('.trigger-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                this.pushUndo();
                // Toggle visual active class on parent chip
                cb.closest('.se-chip').classList.toggle('active', cb.checked);
                const triggers = Array.from(document.querySelectorAll('.trigger-cb:checked')).map(c => c.value);
                this.currentStat.Triggers = triggers.length ? triggers : undefined;
                this.updatePreview();
            });
        });

        // Execution point
        document.querySelectorAll('[data-exec]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pushUndo();
                this.currentStat.ExecutionPoint = btn.dataset.exec;
                document.querySelectorAll('[data-exec]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updatePreview();
            });
        });

        // Formula presets
        document.querySelectorAll('.se-formula-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pushUndo();
                const formula = btn.dataset.formula;
                $('f-formula').value = formula;
                this.currentStat.DamageFormula = formula;
                this.updateFormulaPreview(formula);
                this.updatePreview();
            });
        });

        // Conditions
        $('cond-preset')?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.pushUndo();
                if (!this.currentStat.Conditions) this.currentStat.Conditions = [];
                this.currentStat.Conditions.push(e.target.value);
                e.target.value = '';
                this.renderStat(this.currentStat);
            }
        });

        document.querySelectorAll('.cond-input').forEach((inp, i) => {
            inp.addEventListener('input', (e) => {
                if (this.currentStat.Conditions) {
                    this.currentStat.Conditions[i] = e.target.value;
                }
            });
        });

        document.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pushUndo();
                const idx = parseInt(btn.dataset.remove);
                this.currentStat.Conditions.splice(idx, 1);
                if (!this.currentStat.Conditions.length) delete this.currentStat.Conditions;
                this.renderStat(this.currentStat);
            });
        });

        // Skills
        $('btn-add-skill')?.addEventListener('click', () => {
            this.pushUndo();
            if (!this.currentStat.Skills) this.currentStat.Skills = [];
            this.currentStat.Skills.push('');
            this.renderStat(this.currentStat);
        });

        document.querySelectorAll('.skill-input').forEach((inp, i) => {
            inp.addEventListener('input', (e) => {
                if (this.currentStat.Skills) {
                    this.currentStat.Skills[i] = e.target.value;
                }
            });
        });

        document.querySelectorAll('[data-remove-skill]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pushUndo();
                const idx = parseInt(btn.dataset.removeSkill);
                this.currentStat.Skills.splice(idx, 1);
                if (!this.currentStat.Skills.length) delete this.currentStat.Skills;
                this.renderStat(this.currentStat);
            });
        });

        // Presets
        document.querySelectorAll('.se-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = this.PRESETS.find(p => p.id === btn.dataset.preset);
                if (preset) this.applyPreset(preset);
            });
        });
    }

    bindFileViewEvents() {
        const $ = id => document.getElementById(id);

        // Back button
        $('btn-back')?.addEventListener('click', () => this.goToDashboard());

        $('btn-new-stat')?.addEventListener('click', () => {
            this.renderStat({ Enabled: true, Type: 'STATIC', BaseValue: 0 });
        });

        // Presets
        document.querySelectorAll('.se-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = this.PRESETS.find(p => p.id === btn.dataset.preset);
                if (preset) this.applyPreset(preset);
            });
        });

        // Stat cards
        document.querySelectorAll('.se-stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const statId = card.dataset.stat;
                const stats = this.editor.state?.currentPack?.Stats || [];
                const stat = stats.find(s => s.id === statId);
                if (stat) this.renderStat(stat);
            });
        });

        // Search
        $('stats-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.se-stat-card').forEach(card => {
                const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
                const id = card.querySelector('code')?.textContent.toLowerCase() || '';
                card.style.display = (name.includes(q) || id.includes(q)) ? '' : 'none';
            });
        });

        // Filters
        document.querySelectorAll('.se-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.se-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                document.querySelectorAll('.se-stat-card').forEach(card => {
                    if (filter === 'all' || card.dataset.type === filter) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // ========== HELPERS ==========
    syncField(field, value) {
        clearTimeout(this.syncTimer);
        this.syncTimer = setTimeout(() => {
            this.pushUndo();
            if (value === '' || value === undefined) {
                delete this.currentStat[field];
            } else {
                this.currentStat[field] = value;
            }
            this.updatePreview();
        }, this.DEBOUNCE);
    }

    syncFormatting(key, value) {
        if (!this.currentStat.Formatting) this.currentStat.Formatting = {};
        if (value) {
            this.currentStat.Formatting[key] = value;
        } else {
            delete this.currentStat.Formatting[key];
            if (!Object.keys(this.currentStat.Formatting).length) delete this.currentStat.Formatting;
        }
        this.updatePreview();
    }

    /**
     * Update the YAML preview panel with current stat
     */
    updatePreview() {
        if (!this.currentStat || !this.editor) return;
        
        // Update the editor's current file reference
        this.editor.state.currentFile = this.currentStat;
        this.editor.state.currentFileType = 'stat';
        
        // Call the main app's YAML preview update
        if (this.editor.updateYAMLPreview) {
            this.editor.updateYAMLPreview();
        }
    }

    autoFillFormatting(displayName) {
        if (!displayName || this.currentStat.Formatting) return;
        
        // Auto-fill formatting placeholders
        const fmt = {
            Additive: `+<value> ${displayName}`,
            Multiply: `+<value> ${displayName}`,
            Compound: `x<value> ${displayName}`
        };
        
        const addInput = document.getElementById('f-fmt-add');
        const mulInput = document.getElementById('f-fmt-mul');
        const compInput = document.getElementById('f-fmt-comp');
        
        if (addInput && !addInput.value) addInput.placeholder = fmt.Additive;
        if (mulInput && !mulInput.value) mulInput.placeholder = fmt.Multiply;
        if (compInput && !compInput.value) compInput.placeholder = fmt.Compound;
    }

    updateFormulaPreview(formula) {
        const preview = document.getElementById('formula-preview');
        if (!preview) return;
        
        if (!formula) {
            preview.innerHTML = '<span class="se-formula-vars">d = incoming damage, v = your stat value</span>';
            return;
        }
        
        // Calculate example with d=100 and v from BaseValue (default 0.25 for percentages)
        const d = 100;
        const v = this.currentStat?.BaseValue ?? 0.25;
        
        try {
            // Safe eval with only d and v
            const result = Function('d', 'v', `return ${formula}`)(d, v);
            const reduction = d - result;
            const percent = ((reduction / d) * 100).toFixed(1);
            
            preview.innerHTML = `
                <span class="se-formula-example-calc">
                    <strong>Example:</strong> 
                    ${d} dmg with v=${v} → <strong>${result.toFixed(1)}</strong> dmg 
                    <span class="se-formula-reduction">(${reduction >= 0 ? '-' : '+'}${Math.abs(reduction).toFixed(1)} = ${percent}% ${reduction >= 0 ? 'reduced' : 'increased'})</span>
                </span>
            `;
        } catch (e) {
            preview.innerHTML = '<span class="se-formula-vars">d = incoming damage, v = your stat value</span>';
        }
    }

    toInternalName(display) {
        if (!display) return '';
        return display.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    applyPreset(preset) {
        const stat = {
            Enabled: true,
            Type: preset.type,
            Display: preset.name,
            name: this.toInternalName(preset.name),
            BaseValue: 0,
            Formatting: {
                Additive: `+<value> ${preset.name}`,
                Multiply: `+<value> ${preset.name}`,
                Compound: `x<value> ${preset.name}`
            }
        };

        if (preset.trig) stat.Triggers = [preset.trig];
        if (preset.formula) stat.DamageFormula = preset.formula;
        if (preset.cond) stat.Conditions = [preset.cond];
        if (preset.dmgType) stat.DamageType = preset.dmgType;
        if (preset.type !== 'STATIC') stat.ExecutionPoint = 'PRE';

        this.renderStat(stat);
    }

    esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ========== ACTIONS ==========
    save() {
        if (!this.currentStat) return;

        // Auto-generate name if missing
        if (!this.currentStat.name && this.currentStat.Display) {
            this.currentStat.name = this.toInternalName(this.currentStat.Display);
        }

        // Validate required fields
        if (!this.currentStat.name) {
            this.editor.showToast('Please enter an Internal ID', 'error');
            document.getElementById('f-name')?.focus();
            return;
        }

        // Auto-fill formatting if empty
        if (!this.currentStat.Formatting && this.currentStat.Display) {
            this.currentStat.Formatting = {
                Additive: `+<value> ${this.currentStat.Display}`,
                Multiply: `+<value> ${this.currentStat.Display}`,
                Compound: `x<value> ${this.currentStat.Display}`
            };
        }

        // Clean up undefined values
        Object.keys(this.currentStat).forEach(k => {
            if (this.currentStat[k] === undefined || this.currentStat[k] === '') {
                delete this.currentStat[k];
            }
        });

        // Set ID for storage
        this.currentStat.id = this.currentStat.name;

        // Ensure pack has stats structure
        const pack = this.editor.state.currentPack;
        if (!pack) {
            this.editor.showToast('No active pack', 'error');
            return;
        }
        
        // Initialize stats file structure if not exists
        if (!pack.stats) {
            pack.stats = {
                id: 'stats_' + Date.now(),
                fileName: 'stats.yml',
                entries: [],
                modified: false
            };
        }
        
        // Ensure entries array exists
        if (!pack.stats.entries) {
            pack.stats.entries = [];
        }

        // Find existing or add new
        const idx = pack.stats.entries.findIndex(s => s.id === this.currentStat.id || s.name === this.currentStat.name);
        if (idx >= 0) {
            pack.stats.entries[idx] = this.currentStat;
        } else {
            pack.stats.entries.push(this.currentStat);
        }
        
        // Mark as modified
        pack.stats.modified = true;
        pack.stats.lastModified = new Date().toISOString();

        // Save the pack via packManager
        this.editor.markDirty();
        if (this.editor.packManager) {
            this.editor.packManager.savePacks();
        }
        
        this.editor.showToast(`Stat "${this.currentStat.Display || this.currentStat.name}" saved!`, 'success');
        
        // Update YAML preview
        this.updatePreview();
        
        // Refresh file view to show updated count
        this.renderFileView(pack.stats.entries || []);
        
        // Update pack tree to show stats.yml with new count
        if (this.editor.packManager) {
            this.editor.packManager.renderPackTree();
        }
    }

    delete() {
        if (!this.currentStat?.id) return;

        if (!confirm(`Delete "${this.currentStat.Display || this.currentStat.name}"?`)) return;

        const pack = this.editor.state.currentPack;
        if (!pack?.stats?.entries) return;
        
        const idx = pack.stats.entries.findIndex(s => s.id === this.currentStat.id || s.name === this.currentStat.name);
        if (idx >= 0) {
            pack.stats.entries.splice(idx, 1);
            pack.stats.modified = true;
            pack.stats.lastModified = new Date().toISOString();
            
            // Save via packManager
            this.editor.markDirty();
            if (this.editor.packManager) {
                this.editor.packManager.savePacks();
            }
            
            this.editor.showToast('Stat deleted', 'success');
            this.renderFileView(pack.stats.entries || []);
            
            // Update pack tree
            if (this.editor.packManager) {
                this.editor.packManager.renderPackTree();
            }
        }
    }

    duplicate() {
        if (!this.currentStat) return;
        const copy = JSON.parse(JSON.stringify(this.currentStat));
        copy.name = copy.name + '_COPY';
        copy.Display = (copy.Display || copy.name) + ' (Copy)';
        delete copy.id;
        this.renderStat(copy);
        this.editor.showToast('Duplicated - edit and save', 'info');
    }

    goToDashboard() {
        if (this.editor && this.editor.goToDashboard) {
            this.editor.goToDashboard();
        }
    }

    // ========== PUBLIC API ==========
    show(stat, isFileView = false) {
        if (isFileView) {
            this.renderFileView(this.editor.state?.currentPack?.stats?.entries || []);
        } else if (stat) {
            this.renderStat(stat);
        } else {
            this.renderStat({ Enabled: true, Type: 'STATIC', BaseValue: 0 });
        }
    }

    /**
     * Show create stat dialog (called from app.js)
     * In simplified version, we just show a new stat form
     */
    showCreateStatDialog() {
        this.renderStat({ Enabled: true, Type: 'STATIC', BaseValue: 0 });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsEditor;
}
