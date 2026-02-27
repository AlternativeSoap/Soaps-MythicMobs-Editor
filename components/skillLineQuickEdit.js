/**
 * Skill Line Quick Edit Popover
 * Inline editing popover for quick attribute changes
 * Shows contextual fields based on mechanic type
 */

class SkillLineQuickEdit {
    constructor() {
        this.popover = null;
        this.currentLine = null;
        this.currentIndex = null;
        this.onSaveCallback = null;
        this.parsed = null;
        
        // Common attribute definitions with metadata (all keys must be unique)
        // Use getAttributeDefForMechanic() for context-sensitive overrides (e.g. 'i' = ignoreArmor vs interval)
        this.attributeDefinitions = {
            // Damage / General
            'a': { label: 'Amount', type: 'number', category: 'damage', description: 'Damage/effect amount' },
            'amount': { label: 'Amount', type: 'number', category: 'general', description: 'Amount/quantity value' },

            // Dual-use: 'i' means Ignore Armor (bool) for damage, Interval (number) for projectiles
            // getAttributeDefForMechanic() returns the correct definition based on mechanic context
            'i': { label: 'Ignore Armor / Interval', type: 'text', category: 'general', description: 'Damage: ignore armor (true/false) — Projectile: tick interval (number)' },

            // Projectile
            'v': { label: 'Velocity', type: 'number', category: 'projectile', description: 'Projectile speed' },
            'velocity': { label: 'Velocity', type: 'number', category: 'projectile', description: 'Projectile speed' },
            'interval': { label: 'Interval', type: 'number', category: 'projectile', description: 'Tick interval between updates' },
            'hR': { label: 'Hit Radius', type: 'number', category: 'projectile', description: 'Hit detection radius' },
            'vR': { label: 'Vertical Radius', type: 'number', category: 'projectile', description: 'Vertical hit radius' },
            'd': { label: 'Duration', type: 'number', category: 'projectile', description: 'Max ticks before expiry' },
            'hnp': { label: 'Hit Non-Players', type: 'boolean', category: 'projectile', description: 'Hit non-player entities' },
            'hp': { label: 'Hit Players', type: 'boolean', category: 'projectile', description: 'Hit player entities' },

            // Effects / Particles
            'p': { label: 'Particle', type: 'text', category: 'effect', description: 'Particle type name' },
            'particle': { label: 'Particle', type: 'text', category: 'effect', description: 'Particle type name' },
            'speed': { label: 'Speed', type: 'number', category: 'effect', description: 'Particle/animation speed' },
            'hS': { label: 'H Spread', type: 'number', category: 'effect', description: 'Horizontal spread' },
            'vS': { label: 'V Spread', type: 'number', category: 'effect', description: 'Vertical spread' },

            // Shared duration (works for projectile, potion, aura — all numeric)
            'duration': { label: 'Duration', type: 'number', category: 'general', description: 'Duration in ticks (or seconds for some mechanics)' },

            // Potion
            'type': { label: 'Type', type: 'text', category: 'potion', description: 'Potion effect type (e.g. SPEED)' },
            'lvl': { label: 'Level', type: 'number', category: 'potion', description: 'Effect level (0-based, 0 = level I)' },
            'level': { label: 'Level', type: 'number', category: 'potion', description: 'Effect level (0-based, 0 = level I)' },

            // Aura
            'charges': { label: 'Charges', type: 'number', category: 'aura', description: 'Number of trigger charges' },
            'auraName': { label: 'Aura Name', type: 'text', category: 'aura', description: 'Unique identifier for the aura' },

            // Sound
            's': { label: 'Sound', type: 'text', category: 'sound', description: 'Sound effect name' },
            'sound': { label: 'Sound', type: 'text', category: 'sound', description: 'Sound effect name' },
            'volume': { label: 'Volume', type: 'number', category: 'sound', description: 'Sound volume (0.0–1.0+)' },
            'pitch': { label: 'Pitch', type: 'number', category: 'sound', description: 'Sound pitch (0.5–2.0)' },

            // Skill / Callbacks
            'skill': { label: 'Skill', type: 'text', category: 'callback', description: 'Metaskill name to cast' },
            'onTick': { label: 'On Tick', type: 'text', category: 'callback', description: 'Skill to run each tick' },
            'onHit': { label: 'On Hit', type: 'text', category: 'callback', description: 'Skill to run on hit' },
            'onEnd': { label: 'On End', type: 'text', category: 'callback', description: 'Skill to run on end' },
            'onStart': { label: 'On Start', type: 'text', category: 'callback', description: 'Skill to run on start' },
            'onBounce': { label: 'On Bounce', type: 'text', category: 'callback', description: 'Skill to run on bounce' }
        };

        // Context-aware overrides — mechanic-specific definitions for ambiguous keys
        this.mechanicAttributeOverrides = {
            damage:     { i: { label: 'Ignore Armor',  type: 'boolean', category: 'damage',     description: 'Bypass the target\'s armor (true/false)' } },
            ignite:     { i: { label: 'Ignore Armor',  type: 'boolean', category: 'damage',     description: 'Bypass the target\'s armor (true/false)' } },
            projectile: { i: { label: 'Interval',      type: 'number',  category: 'projectile', description: 'Tick interval between position updates' },
                          amount: { label: 'Projectile Count', type: 'number', category: 'projectile', description: 'Number of projectiles to fire' } },
            missile:    { i: { label: 'Interval',      type: 'number',  category: 'projectile', description: 'Tick interval between position updates' } },
            particles:  { amount: { label: 'Particle Count', type: 'number', category: 'effect', description: 'Number of particles to spawn' } }
        };
    }

    /**
     * Get the attribute definition for a key, with mechanic-context awareness
     * @param {string} key - Attribute key (e.g. 'i', 'amount')
     * @param {string} mechanic - Mechanic name in lowercase
     * @returns {Object|null} Attribute definition
     */
    getAttributeDefForMechanic(key, mechanic) {
        const mechanicLower = (mechanic || '').toLowerCase();
        // Check mechanic-specific overrides first
        const override = this.mechanicAttributeOverrides[mechanicLower];
        if (override && override[key]) {
            return override[key];
        }
        // Fall back to generic definition
        return this.attributeDefinitions[key] || null;
    }

    /**
     * Open quick edit popover for a skill line
     */
    open(options) {
        const { line, index, anchorElement, onSave } = options;
        
        this.currentLine = line;
        this.currentIndex = index;
        this.onSaveCallback = onSave;
        
        // Parse the skill line
        this.parsed = SkillLineParser.parse(line);
        
        // Create popover
        this.createPopover(anchorElement);
    }

    /**
     * Create and show the popover
     */
    createPopover(anchorElement) {
        // Remove existing popover
        this.close();
        
        // Create popover element
        this.popover = document.createElement('div');
        this.popover.className = 'quick-edit-popover';
        this.popover.innerHTML = this.renderPopoverContent();
        
        // Add to body
        document.body.appendChild(this.popover);
        
        // Position popover
        this.positionPopover(anchorElement);
        
        // Attach event listeners
        this.attachPopoverListeners();
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.popover.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Render popover content
     */
    renderPopoverContent() {
        const mechanic = this.parsed.mechanic || 'unknown';
        const args = this.parsed.mechanicArgs || {};
        
        // Get relevant attributes for this mechanic
        const attributes = this.getRelevantAttributes(mechanic, args);
        
        return `
            <div class="quick-edit-header">
                <span class="quick-edit-title">
                    <i class="fas fa-bolt"></i>
                    Quick Edit: ${this.escapeHtml(mechanic)}
                </span>
                <button class="btn-icon close-popover-btn" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="quick-edit-body">
                ${attributes.length > 0 ? `
                    <div class="quick-edit-fields">
                        ${attributes.map(attr => this.renderField(attr, args[attr.key])).join('')}
                    </div>
                ` : `
                    <div class="quick-edit-empty">
                        <i class="fas fa-info-circle"></i>
                        <p>No quick-editable attributes for this mechanic.</p>
                        <p class="text-muted">Use full editor for advanced editing.</p>
                    </div>
                `}
                ${this.renderTargeterField()}
                ${this.renderPreview()}
            </div>
            <div class="quick-edit-footer">
                <button class="btn btn-sm btn-secondary cancel-btn">Cancel</button>
                <button class="btn btn-sm btn-primary save-btn">
                    <i class="fas fa-check"></i> Save
                </button>
            </div>
        `;
    }

    /**
     * Get relevant attributes for mechanic type
     */
    getRelevantAttributes(mechanic, currentArgs) {
        const mechanicLower = mechanic.toLowerCase();
        const attributes = [];
        
        // Get attributes that exist in current args, using mechanic-context-aware lookup
        Object.keys(currentArgs).forEach(key => {
            const def = this.getAttributeDefForMechanic(key, mechanicLower);
            if (def) {
                attributes.push({ key, ...def });
            }
        });
        
        // Add common attributes for this mechanic type that might not exist yet
        const commonByMechanic = {
            'damage': ['a', 'i'],
            'projectile': ['v', 'i', 'd', 'hR', 'vR', 'hnp'],
            'missile': ['v', 'i', 'd', 'hR', 'vR', 'hnp'],
            'effect': ['p', 'amount', 'speed', 'hS', 'vS'],
            'particles': ['p', 'amount', 'speed', 'hS', 'vS'],
            'potion': ['type', 'duration', 'lvl'],
            'aura': ['duration', 'charges', 'auraName'],
            'sound': ['s', 'volume', 'pitch']
        };
        
        const common = commonByMechanic[mechanicLower] || [];
        common.forEach(key => {
            const def = this.getAttributeDefForMechanic(key, mechanicLower);
            if (!attributes.find(a => a.key === key) && def) {
                attributes.push({ key, ...def, isOptional: true });
            }
        });
        
        return attributes.slice(0, 8); // Limit to 8 fields to keep popover manageable
    }

    /**
     * Render a single field
     */
    renderField(attr, currentValue) {
        const value = currentValue !== undefined ? currentValue : '';
        const isOptional = attr.isOptional && !value;
        
        return `
            <div class="quick-edit-field ${isOptional ? 'optional' : ''}">
                <label for="qe-${attr.key}">
                    ${attr.label}
                    ${isOptional ? '<span class="optional-badge">Optional</span>' : ''}
                </label>
                ${this.renderInput(attr, value)}
                ${attr.description ? `<span class="field-hint">${attr.description}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render input based on attribute type
     */
    renderInput(attr, value) {
        switch (attr.type) {
            case 'boolean':
                return `
                    <label class="checkbox-label">
                        <input type="checkbox" id="qe-${attr.key}" data-key="${attr.key}" 
                               ${value === 'true' || value === true ? 'checked' : ''}>
                        <span>Enable</span>
                    </label>
                `;
            case 'number':
                return `
                    <input type="number" id="qe-${attr.key}" data-key="${attr.key}" 
                           value="${this.escapeHtml(value)}" step="0.1" 
                           placeholder="${attr.label}">
                `;
            case 'text':
            default:
                return `
                    <input type="text" id="qe-${attr.key}" data-key="${attr.key}" 
                           value="${this.escapeHtml(value)}" 
                           placeholder="${attr.label}">
                `;
        }
    }

    /**
     * Render targeter field
     */
    renderTargeterField() {
        const targeter = this.parsed.targeter || '@Self';
        
        return `
            <div class="quick-edit-field targeter-field">
                <label for="qe-targeter">
                    <i class="fas fa-crosshairs"></i> Targeter
                </label>
                <input type="text" id="qe-targeter" value="${this.escapeHtml(targeter)}" 
                       placeholder="@Self" list="targeter-suggestions">
                <datalist id="targeter-suggestions">
                    <option value="@Self">
                    <option value="@Target">
                    <option value="@Trigger">
                    <option value="@Origin">
                    <option value="@EIR{r=5}">
                    <option value="@PIR{r=10}">
                </datalist>
            </div>
        `;
    }

    /**
     * Render live preview
     */
    renderPreview() {
        return `
            <div class="quick-edit-preview">
                <label>Preview:</label>
                <code class="preview-code">${this.escapeHtml(this.currentLine)}</code>
            </div>
        `;
    }

    /**
     * Position popover near anchor element
     */
    positionPopover(anchorElement) {
        const anchorRect = anchorElement.getBoundingClientRect();
        const popoverRect = this.popover.getBoundingClientRect();
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let top = anchorRect.bottom + 10;
        let left = anchorRect.left;
        
        // Adjust if too far right
        if (left + popoverRect.width > viewportWidth - 20) {
            left = viewportWidth - popoverRect.width - 20;
        }
        
        // Adjust if too far down
        if (top + popoverRect.height > viewportHeight - 20) {
            top = anchorRect.top - popoverRect.height - 10;
        }
        
        // Adjust if too far left
        if (left < 20) {
            left = 20;
        }
        
        // Adjust if too far up
        if (top < 20) {
            top = 20;
        }
        
        this.popover.style.top = `${top}px`;
        this.popover.style.left = `${left}px`;
    }

    /**
     * Attach event listeners to popover
     */
    attachPopoverListeners() {
        // Close button
        const closeBtn = this.popover.querySelector('.close-popover-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Cancel button
        const cancelBtn = this.popover.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
        
        // Save button
        const saveBtn = this.popover.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.save());
        }
        
        // Live preview on input change
        const inputs = this.popover.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
            input.addEventListener('change', () => this.updatePreview());
        });
        
        // Close on Escape
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this.escapeHandler);
        
        // Close on outside click
        this.outsideClickHandler = (e) => {
            if (!this.popover.contains(e.target) && !e.target.closest('.skill-line-card')) {
                this.close();
            }
        };
        setTimeout(() => {
            document.addEventListener('click', this.outsideClickHandler);
        }, 100);
    }

    /**
     * Update live preview
     */
    updatePreview() {
        const newLine = this.buildUpdatedLine();
        const previewCode = this.popover.querySelector('.preview-code');
        if (previewCode) {
            previewCode.textContent = newLine;
        }
    }

    /**
     * Build updated skill line from current form values
     */
    buildUpdatedLine() {
        const mechanic = this.parsed.mechanic;
        const args = {};
        
        // Collect all attribute inputs
        const inputs = this.popover.querySelectorAll('input[data-key], select[data-key]');
        inputs.forEach(input => {
            const key = input.dataset.key;
            let value;
            
            if (input.type === 'checkbox') {
                value = input.checked ? 'true' : '';
            } else {
                value = input.value.trim();
            }
            
            if (value) {
                args[key] = value;
            }
        });
        
        // Build mechanic with args
        let mechanicStr = mechanic;
        if (Object.keys(args).length > 0) {
            const argStr = Object.entries(args)
                .map(([k, v]) => `${k}=${v}`)
                .join(';');
            mechanicStr += `{${argStr}}`;
        }
        
        // Add targeter
        const targeterInput = this.popover.querySelector('#qe-targeter');
        if (targeterInput && targeterInput.value.trim()) {
            mechanicStr += ` ${targeterInput.value.trim()}`;
        }
        
        // Add other components (trigger, condition, etc.) from original
        if (this.parsed.trigger) {
            mechanicStr += ` ${this.parsed.trigger}`;
        }
        if (this.parsed.condition) {
            mechanicStr += ` ${this.parsed.condition}`;
        }
        if (this.parsed.healthModifier) {
            mechanicStr += ` ${this.parsed.healthModifier}`;
        }
        
        return mechanicStr;
    }

    /**
     * Save changes
     */
    save() {
        const newLine = this.buildUpdatedLine();
        
        if (this.onSaveCallback) {
            this.onSaveCallback(newLine, this.currentIndex);
        }
        
        this.close();
    }

    /**
     * Close popover
     */
    close() {
        if (this.popover) {
            this.popover.remove();
            this.popover = null;
        }
        
        // Remove event listeners
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillLineQuickEdit;
}

// Loaded silently
