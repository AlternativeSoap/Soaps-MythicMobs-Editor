/**
 * DamageModifierEditor - Component for editing MythicMobs DamageModifiers
 * Manages damage type multipliers, immunities, and healing
 */

class DamageModifierEditor {
    constructor(containerId, mob = null) {
        this.containerId = containerId;
        this.mob = mob || {};
        this.damageModifiers = mob?.damageModifiers || {};
        this.onChangeCallback = null;
        this.searchQuery = '';
        this.selectedCategory = 'All';
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const categories = ['All', ...Object.keys(DAMAGE_TYPE_CATEGORIES)];

        container.innerHTML = `
            <div class="damage-modifier-editor">
                <div class="damage-modifier-header">
                    <div class="form-group" style="flex: 1; margin: 0;">
                        <input type="text" 
                               id="damage-modifier-search" 
                               class="form-input" 
                               placeholder="Search damage types..."
                               value="${this.searchQuery}">
                    </div>
                    <select id="damage-modifier-category" class="form-input" style="width: 150px; margin-left: 0.5rem;">
                        ${categories.map(cat => 
                            `<option value="${cat}" ${this.selectedCategory === cat ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="damage-modifier-hint">
                    <strong>Multiplier Guide:</strong>
                    <span class="damage-hint-item"><span class="damage-indicator damage-vulnerable">▮</span> >1.0 = Take more damage</span>
                    <span class="damage-hint-item"><span class="damage-indicator damage-resistant">▮</span> <1.0 = Take less damage</span>
                    <span class="damage-hint-item"><span class="damage-indicator damage-immune">▮</span> 0 = Immune</span>
                    <span class="damage-hint-item"><span class="damage-indicator damage-healing">▮</span> <0 = Heal from damage</span>
                </div>

                <div class="damage-modifier-list" id="damage-modifier-list">
                    ${this.renderDamageTypes()}
                </div>

                <div class="damage-modifier-summary">
                    <strong>Active Modifiers:</strong> ${Object.keys(this.damageModifiers).length}
                    <button type="button" class="btn btn-secondary btn-sm" id="clear-all-modifiers">
                        <i class="fas fa-eraser"></i> Clear All
                    </button>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderDamageTypes() {
        let types = [...DAMAGE_TYPES];

        // Filter by search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            types = types.filter(t => 
                t.type.toLowerCase().includes(query) || 
                t.description.toLowerCase().includes(query)
            );
        }

        // Filter by category
        if (this.selectedCategory !== 'All') {
            const categoryTypes = DAMAGE_TYPE_CATEGORIES[this.selectedCategory];
            types = types.filter(t => categoryTypes.includes(t.type));
        }

        if (types.length === 0) {
            return '<div class="damage-modifier-empty">No damage types found</div>';
        }

        return types.map(type => {
            const value = this.damageModifiers[type.type];
            const hasModifier = value !== undefined;
            const indicatorClass = this.getIndicatorClass(value);

            return `
                <div class="damage-modifier-item ${hasModifier ? 'active' : ''}" data-type="${type.type}">
                    <div class="damage-modifier-info">
                        <div class="damage-modifier-name">
                            <span class="damage-indicator ${indicatorClass}">▮</span>
                            ${type.type}
                            <span class="damage-category-badge">${type.category}</span>
                        </div>
                        <div class="damage-modifier-description">${type.description}</div>
                    </div>
                    <div class="damage-modifier-controls">
                        <input type="number" 
                               class="form-input damage-modifier-input" 
                               data-type="${type.type}"
                               value="${hasModifier ? value : ''}" 
                               placeholder="1.0"
                               step="0.1">
                        <button type="button" 
                                class="btn btn-icon damage-modifier-remove" 
                                data-type="${type.type}"
                                ${!hasModifier ? 'style="visibility: hidden;"' : ''}>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getIndicatorClass(value) {
        if (value === undefined) return '';
        if (value === 0) return 'damage-immune';
        if (value < 0) return 'damage-healing';
        if (value < 1) return 'damage-resistant';
        if (value > 1) return 'damage-vulnerable';
        return '';
    }

    attachEventListeners() {
        // Search
        document.getElementById('damage-modifier-search')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.render();
        });

        // Category filter
        document.getElementById('damage-modifier-category')?.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.render();
        });

        // Damage modifier inputs
        const inputs = document.querySelectorAll('.damage-modifier-input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const type = e.target.dataset.type;
                const value = e.target.value.trim();

                if (value === '') {
                    delete this.damageModifiers[type];
                } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        this.damageModifiers[type] = numValue;
                    }
                }

                // Update UI
                const item = e.target.closest('.damage-modifier-item');
                const removeBtn = item?.querySelector('.damage-modifier-remove');
                if (item) {
                    item.classList.toggle('active', value !== '');
                }
                if (removeBtn) {
                    removeBtn.style.visibility = value !== '' ? 'visible' : 'hidden';
                }

                // Update indicator
                const indicator = item?.querySelector('.damage-indicator');
                if (indicator) {
                    indicator.className = `damage-indicator ${this.getIndicatorClass(this.damageModifiers[type])}`;
                }

                this.updateSummary();
                this.triggerChange();
            });

            // Number shortcuts
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (e.target.value === '') {
                        const type = e.target.dataset.type;
                        delete this.damageModifiers[type];
                        this.render();
                    }
                }
            });
        });

        // Remove buttons
        const removeButtons = document.querySelectorAll('.damage-modifier-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.closest('button').dataset.type;
                delete this.damageModifiers[type];
                this.render();
                this.triggerChange();
            });
        });

        // Clear all
        document.getElementById('clear-all-modifiers')?.addEventListener('click', async () => {
            if (Object.keys(this.damageModifiers).length === 0) return;
            
            const confirmed = await window.notificationModal?.confirm(
                'Are you sure you want to clear all damage modifiers?',
                'Clear All Modifiers',
                { confirmText: 'Clear', confirmButtonClass: 'danger' }
            );
            
            if (confirmed) {
                this.damageModifiers = {};
                this.render();
                this.triggerChange();
            }
        });
    }

    updateSummary() {
        const summary = document.querySelector('.damage-modifier-summary strong');
        if (summary) {
            summary.textContent = `Active Modifiers: ${Object.keys(this.damageModifiers).length}`;
        }
    }

    getValue() {
        return this.damageModifiers;
    }

    setValue(damageModifiers) {
        this.damageModifiers = damageModifiers || {};
        this.render();
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    triggerChange() {
        if (this.onChangeCallback) {
            this.onChangeCallback(this.damageModifiers);
        }
    }
}
