/**
 * AIEditor - Component for editing MythicMobs AI (Goals and Targets)
 * Manages AIGoalSelectors and AITargetSelectors with priority ordering
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
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const isGoals = this.type === 'goals';
        const dataSource = isGoals ? ALL_AI_GOALS : ALL_AI_TARGETS;
        const categories = ['All', ...(isGoals ? AI_GOAL_CATEGORIES : AI_TARGET_CATEGORIES)];

        container.innerHTML = `
            <div class="ai-editor">
                <div class="ai-editor-header">
                    <div class="form-group" style="flex: 1; margin: 0;">
                        <input type="text" 
                               id="ai-search-${this.type}" 
                               class="form-input" 
                               placeholder="Search ${isGoals ? 'goals' : 'targets'}..."
                               value="${this.searchQuery}">
                    </div>
                    <select id="ai-category-${this.type}" class="form-input" style="width: 180px; margin-left: 0.5rem;">
                        ${categories.map(cat => 
                            `<option value="${cat}" ${this.selectedCategory === cat ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="ai-current-list" id="ai-current-${this.type}">
                    <h4 class="ai-list-title">
                        Current ${isGoals ? 'Goals' : 'Targets'} 
                        <span class="count-badge">${this.items.length}</span>
                    </h4>
                    ${this.renderCurrentItems()}
                </div>

                <div class="ai-available-list">
                    <h4 class="ai-list-title">Available ${isGoals ? 'Goals' : 'Targets'}</h4>
                    ${this.renderAvailableItems(dataSource)}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderCurrentItems() {
        if (this.items.length === 0) {
            return `<div class="empty-state">No ${this.type === 'goals' ? 'goals' : 'targets'} configured. Add from the list below.</div>`;
        }

        return `
            <div class="ai-items-container">
                ${this.items.map((item, index) => this.renderCurrentItem(item, index)).join('')}
            </div>
        `;
    }

    renderCurrentItem(item, index) {
        const isGoal = this.type === 'goals';
        const itemData = isGoal 
            ? ALL_AI_GOALS.find(g => g.goal === item.name)
            : ALL_AI_TARGETS.find(t => t.target === item.name);

        return `
            <div class="ai-item current-ai-item" 
                 data-index="${index}" 
                 draggable="true">
                <div class="ai-item-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="ai-item-priority">
                    <input type="number" 
                           class="form-input ai-priority-input" 
                           data-index="${index}"
                           value="${item.priority || 0}" 
                           min="0" 
                           max="99">
                </div>
                <div class="ai-item-info">
                    <div class="ai-item-name">
                        ${item.name}
                        ${item.params ? `<span class="ai-params">{${item.params}}</span>` : ''}
                        ${itemData?.premium ? '<span class="premium-badge">Premium</span>' : ''}
                    </div>
                    <div class="ai-item-description">
                        ${itemData?.description || 'No description available'}
                    </div>
                </div>
                <button class="btn btn-icon ai-item-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
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
            return '<div class="empty-state">No items found</div>';
        }

        return `
            <div class="ai-available-items">
                ${filtered.map(item => this.renderAvailableItem(item)).join('')}
            </div>
        `;
    }

    renderAvailableItem(item) {
        const name = this.type === 'goals' ? item.goal : item.target;
        const isAdded = this.items.some(i => i.name === name);

        return `
            <div class="ai-available-item ${isAdded ? 'added' : ''}" data-name="${name}">
                <div class="ai-item-info">
                    <div class="ai-item-name">
                        ${name}
                        ${item.aliases.length > 0 ? `<span class="ai-aliases">(${item.aliases.join(', ')})</span>` : ''}
                        ${item.premium ? '<span class="premium-badge">Premium</span>' : ''}
                    </div>
                    <div class="ai-item-description">${item.description}</div>
                    ${item.params ? `<div class="ai-item-params">Parameters: ${item.params.join(', ')}</div>` : ''}
                </div>
                <button class="btn btn-sm ${isAdded ? 'btn-secondary' : 'btn-primary'} ai-add-btn" 
                        data-name="${name}"
                        data-params="${item.params ? 'true' : 'false'}"
                        ${isAdded ? 'disabled' : ''}>
                    <i class="fas fa-${isAdded ? 'check' : 'plus'}"></i>
                    ${isAdded ? 'Added' : 'Add'}
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // Search
        document.getElementById(`ai-search-${this.type}`)?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.render();
        });

        // Category filter
        document.getElementById(`ai-category-${this.type}`)?.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.render();
        });

        // Add buttons
        document.querySelectorAll('.ai-add-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.closest('button').dataset.name;
                const hasParams = e.target.closest('button').dataset.params === 'true';
                
                if (hasParams) {
                    this.showParamsModal(name);
                } else {
                    this.addItem(name);
                }
            });
        });

        // Remove buttons
        document.querySelectorAll('.ai-item-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.removeItem(index);
            });
        });

        // Priority inputs
        document.querySelectorAll('.ai-priority-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const priority = parseInt(e.target.value) || 0;
                if (this.items[index]) {
                    this.items[index].priority = priority;
                    this.triggerChange();
                }
            });
        });

        // Drag and drop
        this.attachDragListeners();
    }

    attachDragListeners() {
        const items = document.querySelectorAll('.current-ai-item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedIndex = parseInt(item.dataset.index);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
                this.draggedIndex = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(e.clientY);
                const container = document.querySelector('.ai-items-container');
                if (afterElement == null) {
                    container.appendChild(item);
                } else {
                    container.insertBefore(item, afterElement);
                }
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const dropIndex = parseInt(item.dataset.index);
                if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
                    this.reorderItems(this.draggedIndex, dropIndex);
                }
            });
        });
    }

    getDragAfterElement(y) {
        const draggableElements = [...document.querySelectorAll('.current-ai-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    reorderItems(fromIndex, toIndex) {
        const [item] = this.items.splice(fromIndex, 1);
        this.items.splice(toIndex, 0, item);
        this.render();
        this.triggerChange();
    }

    addItem(name, params = '') {
        // Check if already exists
        if (this.items.some(i => i.name === name)) {
            return;
        }

        const newItem = {
            name: name,
            priority: this.items.length,
            params: params || undefined
        };

        this.items.push(newItem);
        this.render();
        this.triggerChange();
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.render();
        this.triggerChange();
    }

    showParamsModal(name) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Configure: ${name}</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Parameters</label>
                        <input type="text" id="ai-params-input" class="form-input" 
                               placeholder="e.g., faction_name or x,y,z">
                        <small class="form-hint">Enter required parameters for this AI selector</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-save">Add</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel')?.addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-save')?.addEventListener('click', () => {
            const params = document.getElementById('ai-params-input')?.value.trim();
            this.addItem(name, params);
            modal.remove();
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
