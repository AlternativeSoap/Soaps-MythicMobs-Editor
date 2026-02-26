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
            Type: 'STATIC = Just a value for formulas. DAMAGE_MODIFIER = Modifies damage using formula. DAMAGE_BONUS = Adds flat bonus damage. PROC = Triggers skills on events.',
            Trigger: 'When the stat activates. Uses MythicMobs triggers without "on" prefix.',
            Execution: 'PRE = Applies before damage calculation. POST = Applies after damage is calculated.',
            DamageType: 'Optional damage type filter. Only activates for this damage type (e.g., BLUNT, SHARP, FIRE). Use ALL for final total damage.',
            DamageFormula: 'Math formula to modify damage. Use "d" for damage amount and "v" for stat value. Example: d * (1 - v) reduces damage by stat percentage.',
            Conditions: 'Extra conditions that must be true. Example: (damageCause FIRE) only triggers on fire damage.',
            FormulaKey: 'Short alias to reference this stat\'s value in other formulas. Example: SPD for Speed stat.',
            Skills: 'MythicMobs skills to execute when the stat triggers. Format: - skillname{options} @target',
            MinValue: 'Minimum allowed value for this stat (optional).',
            MaxValue: 'Maximum allowed value for this stat (optional, often 1 for percentages).',
            Priority: 'Order of execution when multiple stats trigger. Lower values trigger first.',
            AlwaysActive: 'When enabled, the stat is forcefully applied to every entity.',
            Formatting: 'How the stat displays on items. Use <value> as placeholder. Additive (+), Multiply (%), Compound (×).',
            ParentStats: 'List of other stats this stat relies on for calculations.',
            TriggerStats: 'Stats from triggering entity with their FormulaKey. Format: STAT_NAME KEY',
            Formula: 'Formula for base value calculation when using parent stats.',
            ShowInLore: 'Control which modifier types show in item lore.',
            Rounding: 'Number of decimal places for the stat value in tooltips.'
        };

        // Stat types - all from documentation
        this.TYPES = {
            STATIC: { icon: '📊', color: '#6366f1', label: 'Static', desc: 'Value for formulas, does nothing on its own' },
            DAMAGE_MODIFIER: { icon: '🛡️', color: '#10b981', label: 'Damage Modifier', desc: 'Modifies damage using a formula' },
            DAMAGE_BONUS: { icon: '⚔️', color: '#f59e0b', label: 'Damage Bonus', desc: 'Adds flat bonus damage' },
            PROC: { icon: '⚡', color: '#ec4899', label: 'Proc', desc: 'Chance to execute skills' }
        };

        // All available triggers from MythicMobs (without "on" prefix for stats)
        // These match the triggers in data/triggers.js but formatted for stat usage
        this.TRIGGERS = [
            // Combat triggers
            { v: 'COMBAT', l: '⚔️ Combat', desc: 'Default - on damage, attack, spawn, or death', cat: 'combat' },
            { v: 'ATTACK', l: '⚔️ Attack', desc: 'When the mob attacks an entity', cat: 'combat' },
            { v: 'DAMAGED', l: '🛡️ Damaged', desc: 'When the mob takes damage', cat: 'combat' },
            { v: 'ENTERCOMBAT', l: '🗡️ Enter Combat', desc: 'When entering combat (requires ThreatTable)', cat: 'combat' },
            { v: 'DROPCOMBAT', l: '🕊️ Drop Combat', desc: 'When leaving combat (requires ThreatTable)', cat: 'combat' },
            { v: 'CHANGETARGET', l: '🎯 Change Target', desc: 'When mob changes target', cat: 'combat' },
            { v: 'PLAYERKILL', l: '💀 Player Kill', desc: 'When the mob kills a player', cat: 'combat' },
            { v: 'SKILLDAMAGE', l: '✨ Skill Damage', desc: 'When dealing damage via a mechanic', cat: 'combat' },
            // Lifecycle triggers
            { v: 'SPAWN', l: '🌱 Spawn', desc: 'When the mob spawns', cat: 'lifecycle' },
            { v: 'DESPAWN', l: '💨 Despawn', desc: 'When the mob despawns', cat: 'lifecycle' },
            { v: 'READY', l: '✅ Ready', desc: 'When ready to spawn from spawner', cat: 'lifecycle' },
            { v: 'LOAD', l: '📂 Load', desc: 'When loaded after server restart', cat: 'lifecycle' },
            { v: 'SPAWNORLOAD', l: '🔄 Spawn/Load', desc: 'When spawn or load triggers', cat: 'lifecycle' },
            { v: 'DEATH', l: '☠️ Death', desc: 'When the mob dies', cat: 'lifecycle' },
            { v: 'CHANGEWORLD', l: '🌍 Change World', desc: 'When changing world', cat: 'lifecycle' },
            // Player interaction triggers
            { v: 'INTERACT', l: '👆 Interact', desc: 'When a player right-clicks the mob', cat: 'player' },
            { v: 'TAME', l: '❤️ Tame', desc: 'When the player tames the mob', cat: 'player' },
            { v: 'BREED', l: '💕 Breed', desc: 'When the mob breeds', cat: 'player' },
            { v: 'TRADE', l: '💰 Trade', desc: 'When villager trades with player', cat: 'player' },
            { v: 'BUCKET', l: '🪣 Bucket', desc: 'When milked or bucketed', cat: 'player' },
            // Timed triggers
            { v: 'TIMER', l: '⏱️ Timer', desc: 'Every nth ticks (20 = 1 second)', cat: 'timed' },
            // Projectile triggers
            { v: 'SHOOT', l: '🏹 Shoot', desc: 'When shooting a projectile', cat: 'projectile' },
            { v: 'BOWHIT', l: '🎯 Bow Hit', desc: 'When projectile hits an entity', cat: 'projectile' },
            { v: 'PROJECTILEHIT', l: '🎯 Projectile Hit', desc: 'When special projectile hits entity', cat: 'projectile' },
            { v: 'PROJECTILELAND', l: '📍 Projectile Land', desc: 'When projectile lands on ground', cat: 'projectile' },
            // Special triggers
            { v: 'DISMOUNTED', l: '🐎 Dismounted', desc: 'When dismounted from', cat: 'special' },
            { v: 'EXPLODE', l: '💥 Explode', desc: 'When the mob explodes', cat: 'special' },
            { v: 'PRIME', l: '💣 Prime', desc: 'When creeper is primed', cat: 'special' },
            { v: 'CREEPERCHARGE', l: '⚡ Creeper Charge', desc: 'When creeper is charged by lightning', cat: 'special' },
            { v: 'TELEPORT', l: '🌀 Teleport', desc: 'When the mob teleports', cat: 'special' },
            { v: 'HEAR', l: '👂 Hear', desc: 'When mob hears a sound', cat: 'special' },
            // Communication triggers
            { v: 'SIGNAL', l: '📡 Signal', desc: 'When receiving a signal', cat: 'communication' }
        ];

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
            { id: 'proc', name: 'Proc Effect', icon: '⚡', type: 'PROC', trig: 'ATTACK' },
            { id: 'crit_chance', name: 'Crit Chance', icon: '🎯', type: 'STATIC', formulaKey: 'CRIT' },
            { id: 'lifesteal', name: 'Lifesteal', icon: '❤️', type: 'PROC', trig: 'ATTACK' },
            { id: 'loot_bias', name: 'Loot Bias', icon: '🎲', type: 'STATIC', desc: 'Increases rare drop chances of weighted DropTables. 100 = +100% rare drops.' }
        ];

        // Common formulas with practical examples
        this.FORMULAS = [
            { label: '-Flat', formula: 'd - v', desc: 'Flat reduction: Subtract stat value from damage. v=10 → 100 dmg becomes 90 dmg', example: '100 dmg - 10 stat = 90 dmg' },
            { label: '-%', formula: 'd * (1 - v)', desc: 'Percent reduction: v=0.25 means 25% reduction', example: '100 dmg × 0.75 = 75 dmg (25% reduced)' },
            { label: 'Armor', formula: 'd * (100 / (100 + v))', desc: 'Diminishing returns like WoW armor. v=100 = 50% reduction', example: 'v=100 → 50%, v=200 → 66%, v=400 → 80%' },
            { label: '+Flat', formula: 'd + v', desc: 'Add flat damage bonus', example: '100 dmg + 10 stat = 110 dmg' },
            { label: '+%', formula: 'd * (1 + v)', desc: 'Percent increase: v=0.25 means +25% damage', example: '100 dmg × 1.25 = 125 dmg (+25%)' },
            { label: 'Complex', formula: '1 + d * (v / 100)', desc: 'Complex formula with division', example: 'Custom calculation' }
        ];

        // Damage causes for conditions
        this.DAMAGE_CAUSES = [
            { v: 'FIRE', l: '🔥 Fire' }, { v: 'FIRE_TICK', l: '🔥 Fire Tick' },
            { v: 'LAVA', l: '🌋 Lava' }, { v: 'MAGIC', l: '✨ Magic' },
            { v: 'POISON', l: '☠️ Poison' }, { v: 'WITHER', l: '💀 Wither' },
            { v: 'FREEZE', l: '❄️ Freeze' }, { v: 'LIGHTNING', l: '⚡ Lightning' },
            { v: 'FALL', l: '⬇️ Fall' }, { v: 'DROWNING', l: '💧 Drowning' },
            { v: 'PROJECTILE', l: '🏹 Projectile' }, { v: 'ENTITY_ATTACK', l: '👊 Melee' },
            { v: 'THORNS', l: '🌵 Thorns' }, { v: 'EXPLOSION', l: '💥 Explosion' },
            { v: 'CONTACT', l: '🌵 Contact' }, { v: 'CRAMMING', l: '📦 Cramming' }
        ];

        // Built-in stats reference
        this.BUILTIN_STATS = [
            { name: 'ATTACK_DAMAGE', desc: 'Base Damage Output', icon: '⚔️' },
            { name: 'ATTACK_SPEED', desc: 'Attack cooldown frequency', icon: '⏱️' },
            { name: 'BONUS_DAMAGE', desc: 'Additional damage modifier', icon: '💥' },
            { name: 'CRITICAL_STRIKE_CHANCE', desc: 'Chance to crit', icon: '🎯' },
            { name: 'CRITICAL_STRIKE_DAMAGE', desc: 'Crit damage multiplier', icon: '💢' },
            { name: 'CRITICAL_STRIKE_RESILIENCE', desc: 'Resistance to crits', icon: '🛡️' },
            { name: 'DAMAGE_REDUCTION', desc: 'Generic damage reduction', icon: '🛡️' },
            { name: 'DEFENSE', desc: 'Defense stat', icon: '🛡️' },
            { name: 'DODGE_CHANCE', desc: 'Chance to dodge attacks', icon: '💨' },
            { name: 'DODGE_NEGATION', desc: 'Reduces opponent dodge', icon: '🎯' },
            { name: 'HEALTH', desc: 'Health values', icon: '❤️' },
            { name: 'HEALTH_REGENERATION', desc: 'Health regen rate', icon: '💚' },
            { name: 'LIFESTEAL_CHANCE', desc: 'Chance to lifesteal', icon: '🩸' },
            { name: 'LIFESTEAL_POWER', desc: 'Lifesteal amount', icon: '❤️‍🔥' },
            { name: 'MOVEMENT_SPEED', desc: 'Movement speed', icon: '🏃' },
            { name: 'PARRY_CHANCE', desc: 'Chance to parry', icon: '🛡️' },
            { name: 'PARRY_POWER', desc: 'Parry damage reduction', icon: '⚔️' },
            { name: 'PARRY_COUNTERATTACK', desc: 'Counter damage on parry', icon: '↩️' },
            { name: 'PARRY_NEGATION', desc: 'Reduces opponent parry', icon: '🎯' },
            { name: 'SCALE', desc: 'Entity scale', icon: '📏' },
            { name: 'STEP_HEIGHT', desc: 'Step height attribute', icon: '🪜' },
            { name: 'ARMOR', desc: 'Armor attribute', icon: '🛡️' },
            { name: 'ARMOR_TOUGHNESS', desc: 'Armor toughness', icon: '💪' },
            { name: 'KNOCKBACK_RESISTANCE', desc: 'KB resistance', icon: '🧱' },
            { name: 'JUMP_STRENGTH', desc: 'Jump strength', icon: '⬆️' },
            { name: 'GRAVITY', desc: 'Gravity modifier', icon: '⬇️' },
            { name: 'SAFE_FALL_DISTANCE', desc: 'Safe fall distance', icon: '🪂' },
            { name: 'FALL_DAMAGE_MULTIPLIER', desc: 'Fall damage multiplier', icon: '💀' },
            { name: 'FOLLOW_RANGE', desc: 'Follow range', icon: '👁️' },
            { name: 'FLYING_SPEED', desc: 'Flying speed', icon: '🦅' },
            { name: 'LOOT_BIAS', desc: 'Increases rare drop chances of weighted DropTables. 100 = +100% rare drops', icon: '🎲' }
        ];

        // Stat modifiers reference - detailed from MythicMobs documentation
        this.MODIFIERS = [
            { name: 'ADDITIVE', desc: 'Adds directly to the base stat value. Multiple additives are summed together.', example: '+10 stat → base 8 + 10 = 18', formula: 'base + additive' },
            { name: 'ADDITIVE_MULTIPLIER', desc: 'Multiplies the base stat. Multiple multipliers pool together (add, not multiply). Applied after additives.', example: '5 + 3 = 8x multiplier (not 15x)', formula: '(base + additives) × (sum of multipliers)' },
            { name: 'COMPOUND_MULTIPLIER', desc: 'Multiplies the result after additives and multipliers. Multiple compounds multiply together. Great for debuffs.', example: '2 × 0.4 = 0.8x compound', formula: '... × (product of compounds)' },
            { name: 'SETTER', desc: 'Overrides ALL other modifiers and base values. Forces the stat to the exact specified value.', example: 'Force to 100 (ignores all else)', formula: 'setter value (ignores others)' }
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
                    <div class="se-field se-field-grow">
                        <label>Triggers <small class="se-label-hint">When the stat activates (MythicMobs triggers without "on")</small></label>
                        <div class="se-chips se-chips-wrap">
                            ${this.TRIGGERS.map(t => `
                                <label class="se-chip ${(stat.Triggers || []).includes(t.v) ? 'active' : ''}" title="${t.desc}">
                                    <input type="checkbox" value="${t.v}" ${(stat.Triggers || []).includes(t.v) ? 'checked' : ''} class="trigger-cb">
                                    ${t.l}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="se-field">
                        <label>Execution Point</label>
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
                        <label>Damage Type <small class="se-label-hint">Use ALL for final total damage</small></label>
                        <div class="se-dmgtype-row">
                            <input type="text" id="f-dmgtype" class="se-input" 
                                value="${this.esc(stat.DamageType || '')}" 
                                placeholder="BLUNT, SHARP, FIRE, ALL...">
                            <select id="dmgtype-preset" class="se-select se-select-sm">
                                <option value="">Quick...</option>
                                <option value="ALL">ALL</option>
                                <option value="BLUNT">BLUNT</option>
                                <option value="SHARP">SHARP</option>
                                <option value="FIRE">FIRE</option>
                                <option value="MAGIC">MAGIC</option>
                                <option value="PHYSICAL">PHYSICAL</option>
                            </select>
                        </div>
                    </div>
                    ${showFormula ? `
                    <div class="se-field se-field-grow">
                        <label>Damage Formula <small class="se-label-hint">d = damage, v = stat value</small></label>
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
                        <label>Conditions <small class="se-label-hint">Extra requirements for the stat to activate</small></label>
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
                <details class="se-advanced" ${stat.ParentStats?.length || stat.TriggerStats?.length || stat.Formula ? 'open' : ''}>
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
                                <input type="number" id="f-priority" class="se-input" value="${stat.Priority ?? ''}" placeholder="0 (lower = first)">
                            </div>
                            <div class="se-field se-field-toggle">
                                <label class="se-toggle" title="${this.esc(this.HELP.AlwaysActive)}">
                                    <input type="checkbox" id="f-always" ${stat.AlwaysActive ? 'checked' : ''}>
                                    <span class="se-toggle-slider"></span>
                                    <span class="se-toggle-label">Always Active</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Formula Key for all types -->
                        <div class="se-row">
                            <div class="se-field">
                                <label>Formula Key <small class="se-label-hint">Used in other stat formulas</small></label>
                                <input type="text" id="f-formulakey" class="se-input se-input-mono" 
                                    value="${this.esc(stat.FormulaKey || '')}" 
                                    placeholder="e.g. SPD, DEF, ATK">
                            </div>
                        </div>
                        
                        <!-- Parent Stats Section -->
                        <div class="se-row">
                            <div class="se-field se-field-full">
                                <label>Parent Stats <small class="se-label-hint">Stats this stat relies on for calculations</small></label>
                                <div class="se-list-editor" id="parent-stats-list">
                                    ${(stat.ParentStats || []).map((ps, i) => `
                                        <div class="se-list-item" data-idx="${i}">
                                            <input type="text" class="se-input parent-stat-input" value="${this.esc(ps)}" placeholder="STAT_NAME">
                                            <button class="se-btn-x" data-remove-parent="${i}">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="se-add-row">
                                    <select id="parent-stat-select" class="se-select">
                                        <option value="">Add parent stat...</option>
                                        ${this.BUILTIN_STATS.map(s => `<option value="${s.name}">${s.icon} ${s.name}</option>`).join('')}
                                    </select>
                                    <button class="se-btn se-btn-sm" id="btn-add-parent-stat"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Formula (for parent stats) -->
                        <div class="se-row">
                            <div class="se-field se-field-full">
                                <label>Base Value Formula <small class="se-label-hint">Formula when using parent stats</small></label>
                                <input type="text" id="f-formula-base" class="se-input se-input-mono" 
                                    value="${this.esc(stat.Formula || '')}" 
                                    placeholder="e.g. PARENT_KEY * 2 + 10">
                            </div>
                        </div>
                        
                        <!-- Trigger Stats Section -->
                        <div class="se-row">
                            <div class="se-field se-field-full">
                                <label>Trigger Stats <small class="se-label-hint">Stats from triggering entity (format: STAT_NAME KEY)</small></label>
                                <div class="se-list-editor" id="trigger-stats-list">
                                    ${(stat.TriggerStats || []).map((ts, i) => `
                                        <div class="se-list-item" data-idx="${i}">
                                            <input type="text" class="se-input trigger-stat-input" value="${this.esc(ts)}" placeholder="STAT_NAME KEY">
                                            <button class="se-btn-x" data-remove-trigger="${i}">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button class="se-btn se-btn-sm" id="btn-add-trigger-stat"><i class="fas fa-plus"></i> Add Trigger Stat</button>
                            </div>
                        </div>
                        
                        <!-- Formatting Section (expanded) -->
                        <div class="se-row">
                            <div class="se-field se-field-full">
                                <label>Formatting <small class="se-label-hint">How the stat displays on items (use &lt;value&gt; placeholder)</small></label>
                                <div class="se-formatting-grid se-formatting-expanded">
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Additive: Flat bonus values (+10)">+ Add</span>
                                        <input type="text" id="f-fmt-add" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Additive || '')}" 
                                            placeholder="+<value> ${stat.Display || 'Stat'}">
                                    </div>
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Multiply: Percentage bonuses (+50%)">% Mult</span>
                                        <input type="text" id="f-fmt-mul" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Multiply || '')}" 
                                            placeholder="+<value>% ${stat.Display || 'Stat'}">
                                    </div>
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Compound: Multiplier bonuses (x1.5)">× Comp</span>
                                        <input type="text" id="f-fmt-comp" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Compound || '')}" 
                                            placeholder="x<value> ${stat.Display || 'Stat'}">
                                    </div>
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Setter: Forces exact value">= Set</span>
                                        <input type="text" id="f-fmt-setter" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Setter || '')}" 
                                            placeholder="Force <value> ${stat.Display || 'Stat'}">
                                    </div>
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Static: For STATIC type stats">Static</span>
                                        <input type="text" id="f-fmt-static" class="se-input" 
                                            value="${this.esc(stat.Formatting?.Static || '')}" 
                                            placeholder="<value> ${stat.Display || 'Stat'}">
                                    </div>
                                    <div class="se-format-item">
                                        <span class="se-format-label" title="Decimal places">Rounding</span>
                                        <input type="number" id="f-fmt-rounding" class="se-input" 
                                            value="${stat.Formatting?.Rounding ?? ''}" 
                                            placeholder="2" min="0" max="10">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ShowInItemLore (global toggle in Formatting) -->
                        <div class="se-row">
                            <div class="se-field se-field-full">
                                <label class="se-toggle" title="Whether tooltips should be shown in item lore when {stats-each} is used. Defaults to true.">
                                    <input type="checkbox" id="f-fmt-showinitemlore" ${stat.Formatting?.ShowInItemLore !== false ? 'checked' : ''}>
                                    <span class="se-toggle-slider"></span>
                                    <span class="se-toggle-label">Show In Item Lore <small class="se-label-hint">(global toggle for {stats-each})</small></span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- ShowInLore Section (per-modifier override) -->
                        <div class="se-row">
                            <div class="se-field se-field-full">
                                <label>Show In Lore <small class="se-label-hint">Override visibility per modifier type (unchecked = hidden)</small></label>
                                <div class="se-lore-options">
                                    <label class="se-toggle-inline" title="Show additive modifier (+value) in item lore">
                                        <input type="checkbox" id="f-lore-add" ${stat.ShowInLore?.Additive !== false ? 'checked' : ''}>
                                        <span>+ Additive</span>
                                    </label>
                                    <label class="se-toggle-inline" title="Show multiply modifier (+value%) in item lore">
                                        <input type="checkbox" id="f-lore-mul" ${stat.ShowInLore?.Multiply !== false ? 'checked' : ''}>
                                        <span>% Multiply</span>
                                    </label>
                                    <label class="se-toggle-inline" title="Show compound modifier (x value) in item lore">
                                        <input type="checkbox" id="f-lore-comp" ${stat.ShowInLore?.Compound !== false ? 'checked' : ''}>
                                        <span>× Compound</span>
                                    </label>
                                    <label class="se-toggle-inline" title="Show setter modifier (= value) in item lore">
                                        <input type="checkbox" id="f-lore-setter" ${stat.ShowInLore?.Setter !== false ? 'checked' : ''}>
                                        <span>= Setter</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Built-in Stats Reference -->
                        <details class="se-reference">
                            <summary><i class="fas fa-book"></i> Built-in Stats Reference</summary>
                            <div class="se-reference-grid">
                                ${this.BUILTIN_STATS.map(s => `
                                    <div class="se-ref-item" title="${s.desc}">
                                        <span class="se-ref-icon">${s.icon}</span>
                                        <span class="se-ref-name">${s.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                        
                        <!-- Modifiers Reference -->
                        <details class="se-reference">
                            <summary><i class="fas fa-info-circle"></i> Stat Modifiers Reference</summary>
                            <div class="se-modifier-info">
                                ${this.MODIFIERS.map(m => `
                                    <div class="se-mod-item">
                                        <div class="se-mod-header"><strong>${m.name}</strong></div>
                                        <div class="se-mod-desc">${m.desc}</div>
                                        <div class="se-mod-example"><code>${m.example}</code></div>
                                    </div>
                                `).join('')}
                                <div class="se-mod-formula">
                                    <strong>Full Calculation Example:</strong>
                                    <div class="se-mod-calc">
                                        <span>8 base + 10 add + 2 add = 20</span>
                                        <span>× (5 mult + 3 mult) = × 8 = 160</span>
                                        <span>× (2 comp × 0.4 comp) = × 0.8 = <strong>128</strong></span>
                                    </div>
                                    <code>(base + additives) × (sum of multipliers) × (product of compounds)</code>
                                </div>
                            </div>
                        </details>
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
                    <div class="se-card-actions">
                        <button class="se-btn-icon se-btn-edit" data-stat="${this.esc(stat.id)}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="se-btn-icon se-btn-delete" data-stat="${this.esc(stat.id)}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
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
        $('f-fmt-setter')?.addEventListener('input', (e) => this.syncFormatting('Setter', e.target.value));
        $('f-fmt-static')?.addEventListener('input', (e) => this.syncFormatting('Static', e.target.value));
        $('f-fmt-rounding')?.addEventListener('input', (e) => {
            const val = e.target.value ? parseInt(e.target.value) : undefined;
            this.syncFormatting('Rounding', val);
        });

        // Formula for base value (with parent stats)
        $('f-formula-base')?.addEventListener('input', (e) => this.syncField('Formula', e.target.value));
        $('f-formulakey')?.addEventListener('input', (e) => this.syncField('FormulaKey', e.target.value));

        // ShowInLore checkboxes
        $('f-lore-add')?.addEventListener('change', (e) => this.syncShowInLore('Additive', e.target.checked));
        $('f-lore-mul')?.addEventListener('change', (e) => this.syncShowInLore('Multiply', e.target.checked));
        $('f-lore-comp')?.addEventListener('change', (e) => this.syncShowInLore('Compound', e.target.checked));
        $('f-lore-setter')?.addEventListener('change', (e) => this.syncShowInLore('Setter', e.target.checked));

        // ShowInItemLore global toggle
        $('f-fmt-showinitemlore')?.addEventListener('change', (e) => this.syncFormatting('ShowInItemLore', e.target.checked));

        // Damage type preset
        $('dmgtype-preset')?.addEventListener('change', (e) => {
            if (e.target.value) {
                $('f-dmgtype').value = e.target.value;
                this.syncField('DamageType', e.target.value);
                e.target.value = '';
            }
        });

        // Parent stats
        $('parent-stat-select')?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.pushUndo();
                if (!this.currentStat.ParentStats) this.currentStat.ParentStats = [];
                this.currentStat.ParentStats.push(e.target.value);
                e.target.value = '';
                this.renderStat(this.currentStat);
            }
        });

        $('btn-add-parent-stat')?.addEventListener('click', () => {
            const select = $('parent-stat-select');
            if (select && select.value) {
                this.pushUndo();
                if (!this.currentStat.ParentStats) this.currentStat.ParentStats = [];
                this.currentStat.ParentStats.push(select.value);
                select.value = '';
                this.renderStat(this.currentStat);
            }
        });

        document.querySelectorAll('.parent-stat-input').forEach((inp, i) => {
            inp.addEventListener('input', (e) => {
                if (this.currentStat.ParentStats) {
                    this.currentStat.ParentStats[i] = e.target.value;
                    this.updatePreview();
                }
            });
        });

        document.querySelectorAll('[data-remove-parent]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pushUndo();
                const idx = parseInt(btn.dataset.removeParent);
                this.currentStat.ParentStats.splice(idx, 1);
                if (!this.currentStat.ParentStats.length) delete this.currentStat.ParentStats;
                this.renderStat(this.currentStat);
            });
        });

        // Trigger stats
        $('btn-add-trigger-stat')?.addEventListener('click', () => {
            this.pushUndo();
            if (!this.currentStat.TriggerStats) this.currentStat.TriggerStats = [];
            this.currentStat.TriggerStats.push('');
            this.renderStat(this.currentStat);
        });

        document.querySelectorAll('.trigger-stat-input').forEach((inp, i) => {
            inp.addEventListener('input', (e) => {
                if (this.currentStat.TriggerStats) {
                    this.currentStat.TriggerStats[i] = e.target.value;
                    this.updatePreview();
                }
            });
        });

        document.querySelectorAll('[data-remove-trigger]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pushUndo();
                const idx = parseInt(btn.dataset.removeTrigger);
                this.currentStat.TriggerStats.splice(idx, 1);
                if (!this.currentStat.TriggerStats.length) delete this.currentStat.TriggerStats;
                this.renderStat(this.currentStat);
            });
        });

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

        // Stat cards - click to edit (but not on action buttons)
        document.querySelectorAll('.se-stat-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons or their containers
                if (e.target.closest('.se-btn-edit') || 
                    e.target.closest('.se-btn-delete') || 
                    e.target.closest('.se-card-actions')) {
                    return;
                }
                
                const statId = card.dataset.stat;
                const stats = this.editor.state?.currentPack?.stats?.entries || [];
                const stat = stats.find(s => s.id === statId);
                if (stat) this.renderStat(stat);
            });
        });
        
        // Edit buttons
        const editButtons = document.querySelectorAll('.se-btn-edit');
        console.log(`[StatsEditor] Found ${editButtons.length} edit buttons`);
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('[StatsEditor] Edit button clicked!', e.target);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const statId = btn.dataset.stat;
                console.log('[StatsEditor] Editing stat:', statId);
                const stats = this.editor.state?.currentPack?.stats?.entries || [];
                console.log('[StatsEditor] Available stats:', stats.map(s => ({ id: s.id, name: s.name })));
                const stat = stats.find(s => s.id === statId);
                if (stat) {
                    this.renderStat(stat);
                } else {
                    console.warn('[StatsEditor] Stat not found:', statId);
                }
            });
        });
        
        // Delete buttons
        const deleteButtons = document.querySelectorAll('.se-btn-delete');
        console.log(`[StatsEditor] Found ${deleteButtons.length} delete buttons`);
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                console.log('[StatsEditor] Delete button clicked!', e.target);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const statId = btn.dataset.stat;
                const stats = this.editor.state?.currentPack?.stats?.entries || [];
                const stat = stats.find(s => s.id === statId);
                
                if (stat) {
                    const displayName = stat.Display || stat.name || 'this stat';
                    const confirmed = await this.editor.showConfirmDialog(
                        `Delete "${displayName}"?`,
                        'Are you sure you want to delete this stat? This action cannot be undone.',
                        'Delete',
                        'Cancel'
                    );
                    
                    if (confirmed) {
                        this.deleteStat(statId);
                    }
                }
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
    
    /**
     * Delete a stat from the current pack
     */
    deleteStat(statId) {
        const pack = this.editor.packManager?.activePack;
        if (!pack || !pack.stats || !pack.stats.entries) return;
        
        const index = pack.stats.entries.findIndex(s => s.id === statId);
        if (index >= 0) {
            pack.stats.entries.splice(index, 1);
            pack.stats.modified = true;
            
            // Auto-save if enabled
            if (this.editor?.settings?.autoSave) {
                this.editor.packManager.savePacks();
            } else {
                if (this.editor && typeof this.editor.markDirty === 'function') {
                    this.editor.markDirty();
                }
            }
            
            // Refresh the file view
            this.editor.packManager.renderPackTree();
            this.renderFileView(pack.stats.entries);
            this.editor.showToast('Stat deleted', 'success');
        }
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
        if (value !== undefined && value !== null && value !== '') {
            this.currentStat.Formatting[key] = value;
        } else {
            delete this.currentStat.Formatting[key];
            if (!Object.keys(this.currentStat.Formatting).length) delete this.currentStat.Formatting;
        }
        this.updatePreview();
    }

    syncShowInLore(key, value) {
        // Only track if explicitly set to false (hide)
        if (value === false) {
            if (!this.currentStat.ShowInLore) this.currentStat.ShowInLore = {};
            this.currentStat.ShowInLore[key] = false;
        } else {
            // If true (show), remove from ShowInLore (default is to show)
            if (this.currentStat.ShowInLore) {
                delete this.currentStat.ShowInLore[key];
                if (!Object.keys(this.currentStat.ShowInLore).length) {
                    delete this.currentStat.ShowInLore;
                }
            }
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
