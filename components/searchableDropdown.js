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
        this.justOpened = false; // Flag to prevent immediate closing
        
        // Favorites and recent items
        this.storageKey = options.storageKey || 'searchable-dropdown';
        this.favorites = this.loadFavorites();
        this.recentItems = this.loadRecentItems();
        this.maxRecentItems = options.maxRecentItems || 5;
        
        // Category collapse state
        this.collapsedCategories = this.loadCollapsedCategories();
        
        // Category card view state
        this.expandedCategory = null; // null = card grid view, string = expanded category name
        
        // Build flat list from categories if provided
        if (this.categories) {
            this.items = this.buildFlatListFromCategories();
        }
        
        this.filteredItems = [...this.items];
        this.searchQuery = '';
        
        // Performance optimization - cache rendered icons
        this.iconCache = new Map();
        
        this.render();
        this.attachEventListeners();
    }
    
    // Storage helpers
    loadFavorites() {
        try {
            const saved = localStorage.getItem(`${this.storageKey}-favorites`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveFavorites() {
        try {
            localStorage.setItem(`${this.storageKey}-favorites`, JSON.stringify(this.favorites));
        } catch (e) {}
    }
    
    loadRecentItems() {
        try {
            const saved = localStorage.getItem(`${this.storageKey}-recent`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveRecentItems() {
        try {
            localStorage.setItem(`${this.storageKey}-recent`, JSON.stringify(this.recentItems));
        } catch (e) {}
    }
    
    loadCollapsedCategories() {
        try {
            const saved = localStorage.getItem(`${this.storageKey}-collapsed`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveCollapsedCategories() {
        try {
            localStorage.setItem(`${this.storageKey}-collapsed`, JSON.stringify(this.collapsedCategories));
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
                        placeholder="${this.placeholder}"
                        value="${this.currentValue}"
                        autocomplete="off"
                    >
                    <i class="fas fa-chevron-down searchable-dropdown-icon"></i>
                </div>
                <div class="searchable-dropdown-list" style="display: none;">
                    ${this.renderItems()}
                </div>
            </div>
        `;
    }
    
    renderItems() {
        // If searching, show flat filtered results
        if (this.searchQuery) {
            return this.renderFlatList(this.filteredItems);
        }
        
        // If categorized, show category card view
        if (this.categories) {
            // If a category is expanded, show its items
            if (this.expandedCategory) {
                return this.renderExpandedCategory(this.expandedCategory);
            }
            // Otherwise show card grid
            return this.renderCategoryCards();
        }
        
        // Otherwise show flat list
        return this.renderFlatList(this.filteredItems);
    }
    
    renderCategoryCards() {
        let html = '<div class="searchable-dropdown-card-grid">';
        
        // Favorites card (if any)
        if (this.favorites.length > 0) {
            html += `
                <div class="searchable-dropdown-card special-favorites" data-category="__favorites__">
                    <div class="searchable-dropdown-card-icon">⭐</div>
                    <div class="searchable-dropdown-card-title">Favorites</div>
                    <div class="searchable-dropdown-card-count">${this.favorites.length} items</div>
                </div>
            `;
        }
        
        // Recent items card (if any)
        if (this.recentItems.length > 0) {
            html += `
                <div class="searchable-dropdown-card special-recent" data-category="__recent__">
                    <div class="searchable-dropdown-card-icon">🕒</div>
                    <div class="searchable-dropdown-card-title">Recent</div>
                    <div class="searchable-dropdown-card-count">${this.recentItems.length} items</div>
                </div>
            `;
        }
        
        // Category cards
        for (const [categoryName, categoryData] of Object.entries(this.categories)) {
            const iconHtml = categoryData.iconItem && window.createMinecraftIcon
                ? window.createMinecraftIcon(categoryData.iconItem, { size: 32, className: 'mc-category-icon' }).outerHTML
                : `<span class="emoji-icon">${categoryData.icon}</span>`;
            
            html += `
                <div class="searchable-dropdown-card" data-category="${categoryName}" style="--category-color: ${categoryData.color}">
                    <div class="searchable-dropdown-card-icon">${iconHtml}</div>
                    <div class="searchable-dropdown-card-title">${categoryName}</div>
                    <div class="searchable-dropdown-card-count">${categoryData.items.length} items</div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    renderExpandedCategory(categoryName) {
        let html = '';
        let items = [];
        let title = '';
        let icon = '';
        
        // Handle special categories
        let iconHtml = '';
        if (categoryName === '__favorites__') {
            items = this.favorites;
            title = 'Favorites';
            iconHtml = '<span class="emoji-icon">⭐</span>';
        } else if (categoryName === '__recent__') {
            items = this.recentItems;
            title = 'Recently Used';
            iconHtml = '<span class="emoji-icon">🕒</span>';
        } else if (this.categories[categoryName]) {
            items = this.categories[categoryName].items;
            title = categoryName;
            const categoryData = this.categories[categoryName];
            iconHtml = categoryData.iconItem && window.createMinecraftIcon
                ? window.createMinecraftIcon(categoryData.iconItem, { size: 24, className: 'mc-category-icon' }).outerHTML
                : `<span class="emoji-icon">${categoryData.icon}</span>`;
        }
        
        html += `
            <div class="searchable-dropdown-expanded-header">
                <button class="searchable-dropdown-back-btn" type="button">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <div class="searchable-dropdown-expanded-title">
                    <span class="searchable-dropdown-expanded-icon">${iconHtml}</span>
                    <span>${title}</span>
                    <span class="searchable-dropdown-expanded-count">(${items.length})</span>
                </div>
            </div>
            <div class="searchable-dropdown-expanded-items">
                ${this.renderItemsList(items)}
            </div>
        `;
        
        return html;
    }
    
    renderCategorizedList() {
        let html = '';
        
        // Favorites section (if any)
        if (this.favorites.length > 0) {
            html += `
                <div class="searchable-dropdown-special-section">
                    <div class="searchable-dropdown-section-header">
                        <i class="fas fa-star"></i>
                        <span>Favorites</span>
                    </div>
                    ${this.renderItemsList(this.favorites, true)}
                </div>
            `;
        }
        
        // Recent items section (if any)
        if (this.recentItems.length > 0) {
            html += `
                <div class="searchable-dropdown-special-section">
                    <div class="searchable-dropdown-section-header">
                        <i class="fas fa-clock"></i>
                        <span>Recently Used</span>
                    </div>
                    ${this.renderItemsList(this.recentItems, false, true)}
                </div>
            `;
        }
        
        // Categories
        for (const [categoryName, categoryData] of Object.entries(this.categories)) {
            const isCollapsed = this.isCategoryCollapsed(categoryName);
            const visibleItems = categoryData.items;
            const iconHtml = categoryData.iconItem && window.createMinecraftIcon
                ? window.createMinecraftIcon(categoryData.iconItem, { size: 20, className: 'mc-category-icon' }).outerHTML
                : `<span class="emoji-icon">${categoryData.icon}</span>`;
            
            html += `
                <div class="searchable-dropdown-category ${isCollapsed ? 'collapsed' : ''}" data-category="${categoryName}">
                    <span class="searchable-dropdown-category-icon">${iconHtml}</span>
                    <span class="searchable-dropdown-category-name">${categoryName}</span>
                    <span class="searchable-dropdown-category-count">${visibleItems.length}</span>
                    <i class="fas fa-chevron-down searchable-dropdown-category-chevron"></i>
                </div>
                <div class="searchable-dropdown-category-items ${isCollapsed ? 'collapsed' : ''}">
                    ${this.renderItemsList(visibleItems)}
                </div>
            `;
        }
        
        return html || '<div class="searchable-dropdown-item searchable-dropdown-empty">No items available</div>';
    }
    
    renderFlatList(items) {
        if (items.length === 0) {
            return '<div class="searchable-dropdown-item searchable-dropdown-empty">No results found</div>';
        }
        
        return this.renderItemsList(items);
    }
    
    renderItemsList(items, showFavoriteIcon = true, showRecentBadge = false) {
        return items
            .map((item, index) => {
                const isFavorite = this.favorites.includes(item);
                const isRecent = this.recentItems.includes(item);
                
                // Use cached icon if available
                let iconHtml = '';
                if (this.useIcons && window.createMinecraftIcon) {
                    if (!this.iconCache.has(item)) {
                        const iconElement = window.createMinecraftIcon(item, { size: 16, className: 'mc-item-icon' });
                        this.iconCache.set(item, iconElement.outerHTML);
                    }
                    iconHtml = this.iconCache.get(item);
                }
                
                // Check if this item is from a MythicMobs category
                const isMythicMobs = this.categories && 
                    Object.values(this.categories).some(cat => 
                        cat.isMythicMobs && cat.items.includes(item)
                    );
                
                return `
                    <div class="searchable-dropdown-item ${index === this.selectedIndex ? 'selected' : ''}" 
                         data-value="${item}"
                         ${isMythicMobs ? 'data-mythicmobs="true"' : ''}>
                        <div class="searchable-dropdown-item-content">
                            ${iconHtml}
                            <span class="searchable-dropdown-item-name">${item}</span>
                            ${showRecentBadge && isRecent ? '<span class="searchable-dropdown-item-badge recent">Recent</span>' : ''}
                            ${isFavorite && !showRecentBadge ? '<span class="searchable-dropdown-item-badge favorite">★</span>' : ''}
                        </div>
                        ${showFavoriteIcon ? `<i class="fas fa-star searchable-dropdown-item-favorite ${isFavorite ? 'active' : ''}" data-item="${item}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"></i>` : ''}
                    </div>
                `;
            })
            .join('');
    }
    
    attachEventListeners() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const input = container.querySelector('.searchable-dropdown-input');
        const list = container.querySelector('.searchable-dropdown-list');
        const icon = container.querySelector('.searchable-dropdown-icon');
        
        // Prevent input click from bubbling and closing dropdown
        input.addEventListener('mousedown', (e) => {
            if (this.isOpen) {
                e.stopPropagation();
            }
        });
        
        // Input focus - show dropdown
        input.addEventListener('focus', () => {
            this.openDropdown();
        });
        
        // Input typing - filter items with debouncing
        let searchTimeout;
        input.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterItems(e.target.value);
                this.openDropdown();
            }, 150);
        });
        
        // Icon click - toggle dropdown
        icon.addEventListener('click', () => {
            if (this.isOpen) {
                this.closeDropdown();
            } else {
                input.focus();
            }
        });
        
        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (!this.isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                this.openDropdown();
                e.preventDefault();
                return;
            }
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.getVisibleItemCount() - 1);
                    this.updateList();
                    this.scrollToSelected();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                    this.updateList();
                    this.scrollToSelected();
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedItem = this.getItemAtIndex(this.selectedIndex);
                    if (selectedItem) {
                        this.selectItem(selectedItem);
                    }
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
            }
        });
        
        // List click handling
        list.addEventListener('click', (e) => {
            // Back button click
            const backBtn = e.target.closest('.searchable-dropdown-back-btn');
            if (backBtn) {
                e.stopPropagation(); // Prevent event bubbling
                this.expandedCategory = null;
                this.updateList();
                return;
            }
            
            // Category card click
            const card = e.target.closest('.searchable-dropdown-card');
            if (card) {
                e.stopPropagation(); // Prevent event bubbling that might close dropdown
                const categoryName = card.dataset.category;
                this.expandedCategory = categoryName;
                this.updateList();
                return;
            }
            
            // Category toggle (old collapsible header view)
            const category = e.target.closest('.searchable-dropdown-category');
            if (category) {
                const categoryName = category.dataset.category;
                this.toggleCategory(categoryName);
                return;
            }
            
            // Favorite toggle
            const favoriteIcon = e.target.closest('.searchable-dropdown-item-favorite');
            if (favoriteIcon) {
                e.stopPropagation();
                const item = favoriteIcon.dataset.item;
                this.toggleFavorite(item);
                return;
            }
            
            // Item selection
            const item = e.target.closest('.searchable-dropdown-item');
            if (item && !item.classList.contains('searchable-dropdown-empty')) {
                this.selectItem(item.dataset.value);
            }
        });
        
        // Click outside to close
        document.addEventListener('mousedown', (e) => {
            // Don't close if we just opened it
            if (this.justOpened) {
                this.justOpened = false;
                return;
            }
            if (!container.contains(e.target) && this.isOpen) {
                this.closeDropdown();
            }
        });
        
        // Close on scroll (since position is fixed and won't move with content)
        const scrollContainers = [window, document.querySelector('.editor-content'), document.querySelector('.mob-editor-view')];
        scrollContainers.forEach(scrollContainer => {
            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', () => {
                    if (this.isOpen) {
                        this.closeDropdown();
                    }
                }, { passive: true });
            }
        });
    }
    
    filterItems(query) {
        const lowerQuery = query.toLowerCase();
        this.filteredItems = this.items.filter(item => 
            item.toLowerCase().includes(lowerQuery)
        );
        this.selectedIndex = -1;
        this.updateList();
    }
    
    updateList() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        list.innerHTML = this.renderItems();
    }
    
    selectItem(value) {
        this.currentValue = value;
        this.addToRecent(value);
        
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.searchable-dropdown-input');
            input.value = value;
        }
        
        this.searchQuery = '';
        this.closeDropdown();
        this.onSelect(value);
    }
    
    openDropdown() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        const icon = container.querySelector('.searchable-dropdown-icon');
        const inputWrapper = container.querySelector('.searchable-dropdown-input-wrapper');
        
        // Dropdown is now centered via CSS (top: 50%, left: 50%, transform: translate(-50%, -50%))
        // No need to manually position it
        
        list.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
        this.isOpen = true;
        this.justOpened = true;
        
        // Clear flag after a short delay
        setTimeout(() => {
            this.justOpened = false;
        }, 100);
    }
    
    closeDropdown() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        const icon = container.querySelector('.searchable-dropdown-icon');
        
        if (list) list.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
        this.isOpen = false;
        this.selectedIndex = -1;
        this.expandedCategory = null; // Reset expanded state when closing
    }
    
    scrollToSelected() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        const selectedItem = list.querySelector('.searchable-dropdown-item.selected');
        
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
    
    setValue(value) {
        this.currentValue = value;
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.searchable-dropdown-input');
            if (input) input.value = value;
        }
    }
    
    getValue() {
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.searchable-dropdown-input');
            return input ? input.value : this.currentValue;
        }
        return this.currentValue;
    }
    
    // Update items dynamically
    updateItems(items) {
        this.items = items;
        this.filteredItems = [...items];
        if (this.isOpen) {
            this.updateList();
        }
    }
    
    // Update categories dynamically
    updateCategories(categories) {
        this.categories = categories;
        this.items = this.buildFlatListFromCategories();
        this.filteredItems = [...this.items];
        if (this.isOpen) {
            this.updateList();
        }
    }
    
    // Get visible item count for keyboard navigation
    getVisibleItemCount() {
        if (this.searchQuery) {
            return this.filteredItems.length;
        }
        let count = 0;
        count += this.favorites.length;
        count += this.recentItems.length;
        if (this.categories) {
            for (const [categoryName, categoryData] of Object.entries(this.categories)) {
                if (!this.isCategoryCollapsed(categoryName)) {
                    count += categoryData.items.length;
                }
            }
        } else {
            count += this.items.length;
        }
        return count;
    }
    
    // Get item at specific index for keyboard navigation
    getItemAtIndex(index) {
        if (this.searchQuery) {
            return this.filteredItems[index];
        }
        
        const visibleItems = [];
        visibleItems.push(...this.favorites);
        visibleItems.push(...this.recentItems);
        
        if (this.categories) {
            for (const [categoryName, categoryData] of Object.entries(this.categories)) {
                if (!this.isCategoryCollapsed(categoryName)) {
                    visibleItems.push(...categoryData.items);
                }
            }
        } else {
            visibleItems.push(...this.items);
        }
        
        return visibleItems[index];
    }
}

