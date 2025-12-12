/**
 * SearchableDropdown Component V2
 * Enhanced dropdown with categories, icons, favorites, and recent items
 */
class SearchableDropdown {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        
        // Support both flat items and categorized items
        this.items = options.items || [];
        this.categories = options.categories || null;
        this.useIcons = options.useIcons !== false;
        
        this.placeholder = options.placeholder || 'Search...';
        this.onSelect = options.onSelect || (() => {});
        this.currentValue = options.value || '';
        this.isOpen = false;
        this.selectedIndex = -1;
        
        // Favorites and recent items
        this.storageKey = options.storageKey || 'searchable-dropdown';
        this.favorites = this.loadFavorites();
        this.recentItems = this.loadRecentItems();
        this.maxRecentItems = options.maxRecentItems || 5;
        
        // Category collapse state
        this.collapsedCategories = this.loadCollapsedCategories();
        
        // Build flat list from categories if provided
        if (this.categories) {
            this.items = this.buildFlatListFromCategories();
        }
        
        this.filteredItems = [...this.items];
        this.searchQuery = '';
        
        this.render();
        this.attachEventListeners();
    }
    
    // Storage helpers
    loadFavorites() {
        try {
            const saved = localStorage.getItem(${this.storageKey}-favorites);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveFavorites() {
        try {
            localStorage.setItem(${this.storageKey}-favorites, JSON.stringify(this.favorites));
        } catch (e) {}
    }
    
    loadRecentItems() {
        try {
            const saved = localStorage.getItem(${this.storageKey}-recent);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveRecentItems() {
        try {
            localStorage.setItem(${this.storageKey}-recent, JSON.stringify(this.recentItems));
        } catch (e) {}
    }
    
    loadCollapsedCategories() {
        try {
            const saved = localStorage.getItem(${this.storageKey}-collapsed);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveCollapsedCategories() {
        try {
            localStorage.setItem(${this.storageKey}-collapsed, JSON.stringify(this.collapsedCategories));
        } catch (e) {}
    }
    
    toggleFavorite(item) {
        const index = this.favorites.indexOf(item);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(item);
        }
        this.saveFavorites();
        this.updateList();
    }
    
    addToRecent(item) {
        // Remove if already exists
        const index = this.recentItems.indexOf(item);
        if (index > -1) {
            this.recentItems.splice(index, 1);
        }
        
        // Add to front
        this.recentItems.unshift(item);
        
        // Limit size
        if (this.recentItems.length > this.maxRecentItems) {
            this.recentItems = this.recentItems.slice(0, this.maxRecentItems);
        }
        
        this.saveRecentItems();
    }
    
    buildFlatListFromCategories() {
        const flatList = [];
        for (const [categoryName, categoryData] of Object.entries(this.categories)) {
            flatList.push(...categoryData.items);
        }
        return flatList;
    }
    
    toggleCategory(categoryName) {
        const index = this.collapsedCategories.indexOf(categoryName);
        if (index > -1) {
            this.collapsedCategories.splice(index, 1);
        } else {
            this.collapsedCategories.push(categoryName);
        }
        this.saveCollapsedCategories();
        this.updateList();
    }
    
    isCategoryCollapsed(categoryName) {
        return this.collapsedCategories.includes(categoryName);
    }
    
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="searchable-dropdown">
                <div class="searchable-dropdown-input-wrapper">
                    <input 
                        type="text" 
                        class="form-input searchable-dropdown-input" 
                        placeholder=""
                        value=""
                        autocomplete="off"
                    >
                    <i class="fas fa-chevron-down searchable-dropdown-icon"></i>
                </div>
                <div class="searchable-dropdown-list" style="display: none;">
                    
                </div>
            </div>
        `;
    }
