/**
 * VanillaOverridesEditor Component
 * Allows selection of vanilla mob types to override with this custom mob
 */

class VanillaOverridesEditor {
    constructor(containerId, mob = {}) {
        this.container = document.getElementById(containerId);
        this.selectedTypes = mob.mobTypes || [];
        this.searchQuery = '';
        this.selectedCategory = 'ALL';
        this.changeCallback = null;
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        if (!this.container) return;
        
        const selectedCount = this.selectedTypes.length;
        
        this.container.innerHTML = `
            <div class="vanilla-overrides-editor">
                <div class="override-header">
                    <div class="override-info">
                        <p class="help-text">
                            Select vanilla mob types to replace with this custom mob. 
                            When spawned naturally, these vanilla mobs will become your custom mob.
                        </p>
                        ${selectedCount > 0 ? `
                            <div class="selected-overrides">
                                <strong>Selected (${selectedCount}):</strong>
                                <div class="override-badges">
                                    ${this.selectedTypes.map(type => `
                                        <span class="override-badge" data-type="${type}">
                                            ${type}
                                            <button class="badge-remove" data-type="${type}" title="Remove">×</button>
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="override-search">
                    <input 
                        type="text" 
                        id="override-search-input" 
                        class="form-input" 
                        placeholder="Search mob types..."
                        value="${this.searchQuery}"
                    >
                    <select id="override-category-filter" class="form-select">
                        <option value="ALL">All Categories</option>
                        ${VANILLA_MOB_CATEGORIES.map(cat => `
                            <option value="${cat}" ${this.selectedCategory === cat ? 'selected' : ''}>
                                ${cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="override-list">
                    ${this.renderMobList()}
                </div>
            </div>
        `;
    }
    
    renderMobList() {
        const filteredMobs = this.getFilteredMobs();
        
        if (filteredMobs.length === 0) {
            return '<div class="empty-state">No mob types match your search</div>';
        }
        
        // Group by category
        const grouped = {};
        filteredMobs.forEach(mob => {
            // Find which category this mob belongs to
            let category = 'OTHER';
            for (const [cat, mobs] of Object.entries(VANILLA_MOBS)) {
                if (mobs.find(m => m.type === mob.type)) {
                    category = cat;
                    break;
                }
            }
            
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(mob);
        });
        
        return Object.entries(grouped).map(([category, mobs]) => `
            <div class="override-category">
                <div class="override-category-title">${category.charAt(0) + category.slice(1).toLowerCase()}</div>
                <div class="override-items">
                    ${mobs.map(mob => this.renderMobItem(mob)).join('')}
                </div>
            </div>
        `).join('');
    }
    
    renderMobItem(mob) {
        const isSelected = this.selectedTypes.includes(mob.type);
        
        return `
            <div class="override-item ${isSelected ? 'selected' : ''}" data-type="${mob.type}">
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        class="override-checkbox" 
                        data-type="${mob.type}"
                        ${isSelected ? 'checked' : ''}
                    >
                    <div class="override-item-info">
                        <div class="override-item-name">${mob.name}</div>
                        <div class="override-item-type">${mob.type}</div>
                        <div class="override-item-description">${mob.description}</div>
                    </div>
                </label>
            </div>
        `;
    }
    
    getFilteredMobs() {
        let mobs = ALL_VANILLA_MOBS;
        
        // Filter by category
        if (this.selectedCategory !== 'ALL') {
            mobs = VANILLA_MOBS[this.selectedCategory] || [];
        }
        
        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            mobs = mobs.filter(mob => 
                mob.type.toLowerCase().includes(query) ||
                mob.name.toLowerCase().includes(query) ||
                mob.description.toLowerCase().includes(query)
            );
        }
        
        return mobs;
    }
    
    attachEventListeners() {
        if (!this.container) return;
        
        // Search input
        const searchInput = this.container.querySelector('#override-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.render();
                this.attachEventListeners();
            });
        }
        
        // Category filter
        const categoryFilter = this.container.querySelector('#override-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value;
                this.render();
                this.attachEventListeners();
            });
        }
        
        // Mob checkboxes
        const checkboxes = this.container.querySelectorAll('.override-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const type = e.target.dataset.type;
                if (e.target.checked) {
                    if (!this.selectedTypes.includes(type)) {
                        this.selectedTypes.push(type);
                    }
                } else {
                    this.selectedTypes = this.selectedTypes.filter(t => t !== type);
                }
                this.render();
                this.attachEventListeners();
                this.triggerChange();
            });
        });
        
        // Badge remove buttons
        const badgeRemoves = this.container.querySelectorAll('.badge-remove');
        badgeRemoves.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = e.target.dataset.type;
                this.selectedTypes = this.selectedTypes.filter(t => t !== type);
                this.render();
                this.attachEventListeners();
                this.triggerChange();
            });
        });
    }
    
    getValue() {
        return this.selectedTypes;
    }
    
    setValue(mobTypes) {
        this.selectedTypes = Array.isArray(mobTypes) ? mobTypes : [];
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
