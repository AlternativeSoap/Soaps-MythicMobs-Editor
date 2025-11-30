/**
 * PowerSystemEditor Component
 * Configures mob power level for stat scaling
 */

class PowerSystemEditor {
    constructor(containerId, mob = {}) {
        this.container = document.getElementById(containerId);
        this.enabled = mob.power?.enabled || false;
        this.value = mob.power?.value || POWER_CONFIG.default;
        this.changeCallback = null;
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="power-system-editor">
                <div class="power-header">
                    <label class="checkbox-label">
                        <input type="checkbox" id="power-enabled" ${this.enabled ? 'checked' : ''}>
                        <span>Set Power Level</span>
                    </label>
                    <p class="help-text">${POWER_CONFIG.description}</p>
                    <div class="alert alert-info" style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 0.25rem;">
                        <strong>Important:</strong> Power affects <strong>skill mechanics only</strong>, not base Health/Damage. 
                        Base mob attributes are NOT affected by power levels. Combine with <strong>Level Modifiers</strong> for dynamic scaling.
                    </div>
                </div>
                
                ${this.enabled ? `
                    <div class="power-controls">
                        <div class="form-row">
                            <label class="form-label">
                                Power Level
                                <span class="help-text">Used in skill mechanic calculations</span>
                            </label>
                            <div class="power-input-group">
                                <input 
                                    type="range" 
                                    id="power-slider" 
                                    min="${POWER_CONFIG.min}" 
                                    max="${POWER_CONFIG.max}" 
                                    value="${this.value}"
                                    class="power-slider"
                                >
                                <input 
                                    type="number" 
                                    id="power-value" 
                                    min="${POWER_CONFIG.min}" 
                                    max="${POWER_CONFIG.max}" 
                                    value="${this.value}"
                                    class="form-input power-value-input"
                                >
                            </div>
                        </div>
                        
                        
                        <div class="power-scaling-info">
                            <div class="scaling-title">Skill Mechanics Affected by Power</div>
                            <p class="help-text" style="margin-bottom: 1rem;">These mechanics multiply their attributes by power level:</p>
                            ${Object.entries(POWER_SCALING).map(([key, config]) => `
                                <div class="scaling-item">
                                    <div class="scaling-stat">
                                        <strong>${config.mechanic}</strong>
                                        <span style="color: var(--text-tertiary); font-size: 0.85rem;"> - ${config.attribute}</span>
                                    </div>
                                    <div class="scaling-formula">
                                        <code>${config.formula}</code>
                                    </div>
                                    <div class="scaling-description">${config.description}</div>
                                </div>
                            `).join('')}
                            <div class="alert" style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 0.25rem;">
                                <strong>Example:</strong> A skill with <code>damage{amount=5}</code> at Power 2 deals <strong>10 damage</strong> (5 × 2)
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="power-disabled-message">
                        <p>Set a power level to enable skill mechanic scaling.</p>
                        <p class="help-text">Power multiplies certain skill mechanics like damage, leap velocity, and projectile attributes.</p>
                    </div>
                `}
            </div>
        `;
    }
    

    
    attachEventListeners() {
        if (!this.container) return;
        
        const enabledCheckbox = this.container.querySelector('#power-enabled');
        if (enabledCheckbox) {
            enabledCheckbox.addEventListener('change', (e) => {
                this.enabled = e.target.checked;
                this.render();
                this.attachEventListeners();
                this.triggerChange();
            });
        }
        
        const slider = this.container.querySelector('#power-slider');
        const valueInput = this.container.querySelector('#power-value');
        
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.value = parseInt(e.target.value);
                if (valueInput) valueInput.value = this.value;
                this.updateScalingDisplay();
            });
            
            slider.addEventListener('change', () => {
                this.triggerChange();
            });
        }
        
        if (valueInput) {
            valueInput.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = POWER_CONFIG.default;
                if (val < POWER_CONFIG.min) val = POWER_CONFIG.min;
                if (val > POWER_CONFIG.max) val = POWER_CONFIG.max;
                
                this.value = val;
                if (slider) slider.value = this.value;
                this.updateScalingDisplay();
            });
            
            valueInput.addEventListener('change', () => {
                this.triggerChange();
            });
        }
    }
    
    updateScalingDisplay() {
        // Update warning
        const warning = this.container.querySelector('.power-warning');
        if (this.value > 20) {
            if (!warning) {
                const controls = this.container.querySelector('.power-controls');
                const warningDiv = document.createElement('div');
                warningDiv.className = 'power-warning';
                warningDiv.innerHTML = `<strong>⚠️ Warning:</strong> ${POWER_CONFIG.warning}`;
                controls.insertBefore(warningDiv, controls.querySelector('.power-scaling-info'));
            }
        } else if (warning) {
            warning.remove();
        }
        
        // Update scaling examples
        const examples = this.container.querySelectorAll('.scaling-example');
        Object.keys(POWER_SCALING).forEach((stat, index) => {
            if (examples[index]) {
                const config = POWER_SCALING[stat];
                examples[index].innerHTML = this.calculateScalingExample(stat, config);
            }
        });
    }
    
    getValue() {
        if (!this.enabled) {
            return null;
        }
        
        return {
            enabled: this.enabled,
            value: this.value
        };
    }
    
    setValue(power) {
        if (!power) {
            this.enabled = false;
            this.value = POWER_CONFIG.default;
        } else {
            this.enabled = power.enabled || false;
            this.value = power.value || POWER_CONFIG.default;
        }
        this.render();
        this.attachEventListeners();
    }
    
    onChange(callback) {
        this.changeCallback = callback;
    }
    
    triggerChange() {
        if (this.changeCallback) {
            this.changeCallback(this.getValue());
        }
    }
}
