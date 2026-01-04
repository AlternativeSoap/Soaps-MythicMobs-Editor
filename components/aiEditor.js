/**
 * AIEditor - Component for editing MythicMobs AI (Goals and Targets)
 * Manages AIGoalSelectors and AITargetSelectors with presets and visual tree
 */

class AIEditor {
    constructor(containerId, type, mob = null) {
        this.containerId = containerId;
        this.type = type; // 'goals' or 'targets'
        this.mob = mob || {};
        this.items = type === 'goals' ? (mob?.aiGoalSelectors || []) : (mob?.aiTargetSelectors || []);
        this.onChangeCallback = null;
        this.searchQuery = '';
        this.selectedCategory = 'All';
        this.draggedIndex = null;
        this.showPresets = true;
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const isGoals = this.type === 'goals';
        const dataSource = isGoals ? ALL_AI_GOALS : ALL_AI_TARGETS;
        const categories = ['All', ...(isGoals ? AI_GOAL_CATEGORIES : AI_TARGET_CATEGORIES)];
        const presets = isGoals ? AI_GOAL_PRESETS : AI_TARGET_PRESETS;

        container.innerHTML = `
            <div class="ai-editor-v2">
                <!-- Presets Section -->
                <div class="ai-presets-section">
                    <div class="ai-presets-header" data-toggle="ai-presets-${this.type}">
                        <i class="fas fa-magic"></i>
                        <span>Quick Presets</span>
                        <i class="fas fa-chevron-down ai-presets-toggle ${this.showPresets ? '' : 'rotated'}"></i>
                    </div>
                    <div class="ai-presets-grid ${this.showPresets ? '' : 'collapsed'}" id="ai-presets-grid-${this.type}">
                        ${Object.entries(presets).map(([key, preset]) => `
                            <button class="ai-preset-card" data-preset="${key}" title="${preset.description}">
                                <div class="ai-preset-icon">
                                    <i class="fas fa-${preset.icon || 'cog'}"></i>
                                </div>
                                <div class="ai-preset-info">
                                    <div class="ai-preset-name">${preset.name}</div>
                                    <div class="ai-preset-count">${preset[isGoals ? 'goals' : 'targets'].length} ${isGoals ? 'goals' : 'targets'}</div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Current Items Section -->
                <div class="ai-current-section">
                    <div class="ai-section-header">
                        <div class="ai-section-title">
                            <i class="fas fa-${isGoals ? 'brain' : 'crosshairs'}"></i>
                            <span>Active ${isGoals ? 'Goals' : 'Targets'}</span>
                            <span class="ai-count-badge">${this.items.length}</span>
                        </div>
                        <div class="ai-section-actions">
                            <label class="mini-toggle" title="Show numbering in YAML output (e.g., '0 clear' vs 'clear')">
                                <input type="checkbox" class="ai-priority-toggle" data-type="${this.type}" ${window.editor?.settings?.showAIPriority !== false ? 'checked' : ''}>
                                <span class="mini-toggle-slider"></span>
                                <span class="mini-toggle-label">Numbering</span>
                            </label>
                            <button class="btn btn-sm btn-secondary ai-clear-all" ${this.items.length === 0 ? 'disabled' : ''}>
                                <i class="fas fa-trash-alt"></i> Clear All
                            </button>
                        </div>
                    </div>
                    <div class="ai-current-list" id="ai-current-${this.type}">
                        ${this.renderCurrentItems()}
                    </div>
                </div>

                <!-- Add New Section -->
                <div class="ai-add-section">
                    <div class="ai-section-header">
                        <div class="ai-section-title">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add ${isGoals ? 'Goal' : 'Target'}</span>
                        </div>
                    </div>
                    
                    <!-- Search and Filter -->
                    <div class="ai-search-bar">
                        <div class="ai-search-input-wrapper">
                            <i class="fas fa-search"></i>
                            <input type="text" 
                                   id="ai-search-${this.type}" 
                                   class="ai-search-input" 
                                   placeholder="Search ${isGoals ? 'goals' : 'targets'}..."
                                   value="${this.searchQuery}">
                        </div>
                        <div class="ai-category-chips">
                            ${categories.map(cat => `
                                <button class="ai-category-chip ${this.selectedCategory === cat ? 'active' : ''}" 
                                        data-category="${cat}">
                                    ${cat}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Available Items -->
                    <div class="ai-available-list">
                        ${this.renderAvailableItems(dataSource)}
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderCurrentItems() {
        if (this.items.length === 0) {
            return `
                <div class="ai-empty-state">
                    <div class="ai-empty-icon">
                        <i class="fas fa-${this.type === 'goals' ? 'brain' : 'crosshairs'}"></i>
                    </div>
                    <h4>No ${this.type === 'goals' ? 'Goals' : 'Targets'} Configured</h4>
                    <p>Use a preset above or add from the list below</p>
                </div>
            `;
        }

        return `
            <div class="ai-items-tree">
                ${this.items.map((item, index) => this.renderCurrentItem(item, index)).join('')}
            </div>
        `;
    }

    renderCurrentItem(item, index) {
        const isGoal = this.type === 'goals';
        const itemData = isGoal 
            ? ALL_AI_GOALS.find(g => g.goal.toLowerCase() === item.name.toLowerCase())
            : ALL_AI_TARGETS.find(t => t.target.toLowerCase() === item.name.toLowerCase());

        const isFirst = index === 0;
        const isClear = item.name.toLowerCase() === 'clear';

        return `
            <div class="ai-tree-item ${isClear ? 'is-clear' : ''} ${isFirst ? 'first' : ''}" 
                 data-index="${index}" 
                 draggable="true">
                <div class="ai-tree-drag">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="ai-tree-badge ${isClear ? 'badge-clear' : itemData?.important ? 'badge-important' : ''}">
                    <i class="fas fa-${itemData?.icon || (isGoal ? 'cog' : 'crosshairs')}"></i>
                </div>
                <div class="ai-tree-content">
                    <div class="ai-tree-name">
                        ${item.name}
                        ${item.params ? `<span class="ai-tree-params">${item.params}</span>` : ''}
                        ${itemData?.premium ? '<span class="premium-tag">Premium</span>' : ''}
                    </div>
                    <div class="ai-tree-desc">${itemData?.description || 'Custom selector'}</div>
                </div>
                <div class="ai-tree-actions">
                    ${!isClear ? `
                        <button class="ai-tree-btn ai-move-up" data-index="${index}" ${index === 0 || (index === 1 && this.items[0]?.name.toLowerCase() === 'clear') ? 'disabled' : ''}>
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="ai-tree-btn ai-move-down" data-index="${index}" ${index === this.items.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    ` : ''}
                    <button class="ai-tree-btn ai-remove-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderAvailableItems(dataSource) {
        let filtered = [...dataSource];

        // Filter by search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const name = this.type === 'goals' ? item.goal : item.target;
                return name.toLowerCase().includes(query) ||
                       item.description.toLowerCase().includes(query) ||
                       item.aliases.some(a => a.toLowerCase().includes(query));
            });
        }

        // Filter by category
        if (this.selectedCategory !== 'All') {
            filtered = filtered.filter(item => item.category === this.selectedCategory);
        }

        if (filtered.length === 0) {
            return `<div class="ai-no-results"><i class="fas fa-search"></i> No matches found</div>`;
        }

        // Group by category for better organization
        const grouped = {};
        filtered.forEach(item => {
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push(item);
        });

        let html = '';
        for (const [category, items] of Object.entries(grouped)) {
            if (this.selectedCategory === 'All') {
                html += `<div class="ai-category-label">${category}</div>`;
            }
            html += items.map(item => this.renderAvailableItem(item)).join('');
        }

        return html;
    }

    renderAvailableItem(item) {
        const name = this.type === 'goals' ? item.goal : item.target;
        const isAdded = this.items.some(i => i.name.toLowerCase() === name.toLowerCase());

        return `
            <div class="ai-available-item ${isAdded ? 'is-added' : ''} ${item.important ? 'is-important' : ''}" data-name="${name}">
                <div class="ai-item-badge ${item.important ? 'badge-important' : ''}">
                    <i class="fas fa-${item.icon || 'cog'}"></i>
                </div>
                <div class="ai-item-content">
                    <div class="ai-item-header">
                        <span class="ai-item-name">${name}</span>
                        ${item.aliases.length > 0 ? `<span class="ai-item-aliases">(${item.aliases.slice(0, 2).join(', ')}${item.aliases.length > 2 ? '...' : ''})</span>` : ''}
                        ${item.premium ? '<span class="premium-tag">Premium</span>' : ''}
                    </div>
                    <div class="ai-item-desc">${item.description}</div>
                    ${item.params ? `<div class="ai-item-params"><i class="fas fa-sliders-h"></i> ${item.params.join(', ')}</div>` : ''}
                </div>
                <button class="btn btn-sm ${isAdded ? 'btn-added' : 'btn-add'}" 
                        data-name="${name}"
                        data-has-params="${item.params ? 'true' : 'false'}"
                        ${isAdded ? 'disabled' : ''}>
                    <i class="fas fa-${isAdded ? 'check' : 'plus'}"></i>
                </button>
            </div>
        `;
    }

    generateYAMLPreview() {
        const isGoals = this.type === 'goals';
        const key = isGoals ? 'AIGoalSelectors' : 'AITargetSelectors';
        
        let yaml = `${key}:\n`;
        this.items.forEach(item => {
            const value = item.params ? `${item.name} ${item.params}` : item.name;
            yaml += `  - ${value}\n`;
        });
        
        return yaml;
    }

    attachEventListeners() {
        // Presets toggle
        const presetsHeader = document.querySelector(`[data-toggle="ai-presets-${this.type}"]`);
        if (presetsHeader) {
            presetsHeader.addEventListener('click', () => {
                this.showPresets = !this.showPresets;
                const grid = document.getElementById(`ai-presets-grid-${this.type}`);
                const toggle = presetsHeader.querySelector('.ai-presets-toggle');
                grid?.classList.toggle('collapsed');
                toggle?.classList.toggle('rotated');
            });
        }

        // Preset cards
        document.querySelectorAll(`#${this.containerId} .ai-preset-card`).forEach(card => {
            card.addEventListener('click', (e) => {
                const presetKey = e.currentTarget.dataset.preset;
                this.applyPreset(presetKey);
            });
        });

        // Clear all button
        document.querySelector(`#${this.containerId} .ai-clear-all`)?.addEventListener('click', async () => {
            const typeLabel = this.type === 'goals' ? 'AI Goals' : 'AI Targets';
            const confirmed = await window.notificationModal?.confirm(
                `This will remove all ${this.items.length} ${typeLabel.toLowerCase()} from this mob. This action cannot be undone.`,
                `Clear All ${typeLabel}?`,
                {
                    confirmText: 'Clear All',
                    cancelText: 'Cancel',
                    confirmClass: 'danger',
                    icon: '🗑️',
                    type: 'warning'
                }
            );
            
            if (confirmed) {
                this.items = [];
                this.render();
                this.triggerChange();
            }
        });

        // Numbering toggle - directly update preview
        const toggleEl = document.querySelector(`#${this.containerId} .ai-priority-toggle`);
        if (toggleEl) {
            toggleEl.addEventListener('change', (e) => {
                // Update setting
                if (!window.editor.settings) window.editor.settings = {};
                window.editor.settings.showAIPriority = e.target.checked;
                window.editor.saveSettings();
                
                // Sync all toggles on page
                document.querySelectorAll('.ai-priority-toggle').forEach(t => {
                    t.checked = e.target.checked;
                });
                
                // Trigger preview update via the onChange callback
                this.triggerChange();
            });
        }

        // Search
        document.getElementById(`ai-search-${this.type}`)?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.render();
        });

        // Category chips
        document.querySelectorAll(`#${this.containerId} .ai-category-chip`).forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.selectedCategory = e.target.dataset.category;
                this.render();
            });
        });

        // Add buttons
        document.querySelectorAll(`#${this.containerId} .btn-add`).forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = e.currentTarget.dataset.name;
                const hasParams = e.currentTarget.dataset.hasParams === 'true';
                
                if (hasParams) {
                    this.showParamsModal(name);
                } else {
                    this.addItem(name);
                }
            });
        });

        // Remove buttons
        document.querySelectorAll(`#${this.containerId} .ai-remove-btn`).forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.currentTarget.dataset.index);
                this.removeItem(index);
            });
        });

        // Move up/down buttons
        document.querySelectorAll(`#${this.containerId} .ai-move-up`).forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.currentTarget.dataset.index);
                if (index > 0) {
                    // Don't move above clear
                    const targetIndex = this.items[0]?.name.toLowerCase() === 'clear' && index === 1 ? 1 : index - 1;
                    if (targetIndex !== index) {
                        this.reorderItems(index, targetIndex);
                    }
                }
            });
        });

        document.querySelectorAll(`#${this.containerId} .ai-move-down`).forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.currentTarget.dataset.index);
                if (index < this.items.length - 1) {
                    this.reorderItems(index, index + 1);
                }
            });
        });

        // Drag and drop
        this.attachDragListeners();
    }

    applyPreset(presetKey) {
        const isGoals = this.type === 'goals';
        const presets = isGoals ? AI_GOAL_PRESETS : AI_TARGET_PRESETS;
        const preset = presets[presetKey];
        
        if (!preset) return;

        const itemsKey = isGoals ? 'goals' : 'targets';
        this.items = preset[itemsKey].map((name, index) => ({
            name: name,
            priority: index
        }));

        this.render();
        this.triggerChange();
    }

    attachDragListeners() {
        const items = document.querySelectorAll(`#${this.containerId} .ai-tree-item`);
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedIndex = parseInt(item.dataset.index);
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedIndex = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const dropIndex = parseInt(item.dataset.index);
                if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
                    // Don't allow dropping before clear
                    if (this.items[0]?.name.toLowerCase() === 'clear' && dropIndex === 0 && this.draggedIndex !== 0) {
                        return;
                    }
                    this.reorderItems(this.draggedIndex, dropIndex);
                }
            });
        });
    }

    reorderItems(fromIndex, toIndex) {
        const [item] = this.items.splice(fromIndex, 1);
        this.items.splice(toIndex, 0, item);
        this.render();
        this.triggerChange();
    }

    addItem(name, params = '') {
        // Check if already exists
        if (this.items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
            return;
        }

        const newItem = {
            name: name,
            priority: this.items.length,
            params: params || undefined
        };

        // If it's clear, add at the beginning
        if (name.toLowerCase() === 'clear') {
            this.items.unshift(newItem);
        } else {
            this.items.push(newItem);
        }

        this.render();
        this.triggerChange();
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.render();
        this.triggerChange();
    }

    showParamsModal(name) {
        const isGoal = this.type === 'goals';
        const itemData = isGoal 
            ? ALL_AI_GOALS.find(g => g.goal === name)
            : ALL_AI_TARGETS.find(t => t.target === name);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 450px;">
                <div class="modal-header">
                    <h3><i class="fas fa-${itemData?.icon || 'cog'}"></i> Configure: ${name}</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p class="modal-desc">${itemData?.description || ''}</p>
                    <div class="form-group">
                        <label class="form-label">Parameters</label>
                        <input type="text" id="ai-params-input" class="form-input" 
                               placeholder="${itemData?.params?.join(', ') || 'Enter parameters'}">
                        <small class="form-hint">
                            ${itemData?.params ? `Expected: ${itemData.params.join(', ')}` : 'Enter required parameters'}
                        </small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-save"><i class="fas fa-plus"></i> Add</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = document.getElementById('ai-params-input');
        setTimeout(() => input?.focus(), 100);

        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel')?.addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-save')?.addEventListener('click', () => {
            const params = input?.value.trim();
            this.addItem(name, params);
            modal.remove();
        });

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const params = input.value.trim();
                this.addItem(name, params);
                modal.remove();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getValue() {
        return this.items;
    }

    setValue(items) {
        this.items = items || [];
        this.render();
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    triggerChange() {
        if (this.onChangeCallback) {
            this.onChangeCallback(this.items);
        }
    }
}
