/**
 * Mechanic Reference Modal
 * Read-only reference for viewing mechanic, targeter, trigger, and condition documentation
 */

class MechanicReference {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.currentTab = 'mechanics';
        this.searchQuery = '';
        this.selectedCategory = 'all';
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        const overlay = document.createElement('div');
        overlay.className = 'mechanic-reference-overlay';
        overlay.innerHTML = `
            <div class="mechanic-reference-modal">
                <div class="mechanic-reference-header">
                    <h2>📚 Skill Component Reference</h2>
                    <button class="mechanic-reference-close" title="Close">&times;</button>
                </div>
                
                <!-- Tabs -->
                <div class="mechanic-reference-tabs">
                    <button class="reference-tab active" data-tab="mechanics">
                        <span class="tab-icon">⚙️</span>
                        <span>Mechanics</span>
                        <span class="tab-count">${Object.keys(MECHANICS_DATA).length}</span>
                    </button>
                    <button class="reference-tab" data-tab="targeters">
                        <span class="tab-icon">🎯</span>
                        <span>Targeters</span>
                        <span class="tab-count">${Object.keys(TARGETERS_DATA).length}</span>
                    </button>
                    <button class="reference-tab" data-tab="triggers">
                        <span class="tab-icon">⚡</span>
                        <span>Triggers</span>
                        <span class="tab-count">${Object.keys(TRIGGERS_DATA).length}</span>
                    </button>
                    <button class="reference-tab" data-tab="conditions">
                        <span class="tab-icon">❓</span>
                        <span>Conditions</span>
                        <span class="tab-count">${window.ALL_CONDITIONS?.length || 0}</span>
                    </button>
                </div>
                
                <!-- Search -->
                <div class="mechanic-reference-search">
                    <input 
                        type="text" 
                        class="reference-search-input" 
                        placeholder="Search by name or description..."
                    >
                    <span class="reference-search-icon">🔍</span>
                </div>
                
                <!-- Content Area -->
                <div class="mechanic-reference-body">
                    <!-- Category Filter (for mechanics) -->
                    <div class="reference-categories">
                        <div class="reference-category-title">Categories</div>
                        <button class="reference-category-btn active" data-category="all">
                            All
                        </button>
                    </div>
                    
                    <!-- Items List -->
                    <div class="reference-items">
                        <!-- Dynamic content -->
                    </div>
                </div>
                
                <div class="mechanic-reference-footer">
                    <button class="btn btn-secondary mechanic-reference-done">Done</button>
                </div>
            </div>
        `;
        
        return overlay;
    }

    /**
     * Open the reference modal
     */
    open() {
        if (!this.overlay) {
            this.overlay = this.createModal();
            document.body.appendChild(this.overlay);
            
            // Cache DOM elements
            this.modal = this.overlay.querySelector('.mechanic-reference-modal');
            this.searchInput = this.overlay.querySelector('.reference-search-input');
            this.categoriesPanel = this.overlay.querySelector('.reference-categories');
            this.itemsPanel = this.overlay.querySelector('.reference-items');
            
            this.attachEventListeners();
        }
        
        // Reset state
        this.currentTab = 'mechanics';
        this.searchQuery = '';
        this.selectedCategory = 'all';
        this.searchInput.value = '';
        
        // Render
        this.updateActiveTab();
        this.renderCategories();
        this.renderItems();
        
        // Show modal
        this.overlay.classList.add('active');
        setTimeout(() => this.searchInput.focus(), 100);
    }

    /**
     * Close the modal
     */
    close() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Tab switching
        const tabs = this.overlay.querySelectorAll('.reference-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.selectedCategory = 'all';
                this.updateActiveTab();
                this.renderCategories();
                this.renderItems();
            });
        });
        
        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderItems();
        });
        
        // Done button
        const doneBtn = this.overlay.querySelector('.mechanic-reference-done');
        doneBtn.addEventListener('click', () => this.close());
        
        // Close button
        const closeBtn = this.overlay.querySelector('.mechanic-reference-close');
        closeBtn.addEventListener('click', () => this.close());
        
        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    }

    /**
     * Update active tab styling
     */
    updateActiveTab() {
        const tabs = this.overlay.querySelectorAll('.reference-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === this.currentTab) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    /**
     * Render category filters
     */
    renderCategories() {
        // Only show categories for mechanics
        if (this.currentTab !== 'mechanics') {
            this.categoriesPanel.style.display = 'none';
            return;
        }
        
        this.categoriesPanel.style.display = 'block';
        
        // Get unique categories
        const categories = new Set();
        Object.values(MECHANICS_DATA).forEach(mechanic => {
            if (mechanic.category) {
                categories.add(mechanic.category);
            }
        });
        
        const sortedCategories = ['all', ...Array.from(categories).sort()];
        
        // Build category buttons HTML
        const categoryButtons = sortedCategories.map(category => {
            const count = category === 'all' 
                ? Object.keys(MECHANICS_DATA).length
                : Object.values(MECHANICS_DATA).filter(m => m.category === category).length;
            
            const displayName = category === 'all' ? 'All' : category;
            const activeClass = category === this.selectedCategory ? 'active' : '';
            
            return `
                <button class="reference-category-btn ${activeClass}" data-category="${category}">
                    ${displayName}
                    <span class="category-count">${count}</span>
                </button>
            `;
        }).join('');
        
        // Update DOM (keep title)
        const title = this.categoriesPanel.querySelector('.reference-category-title');
        this.categoriesPanel.innerHTML = '';
        this.categoriesPanel.appendChild(title);
        this.categoriesPanel.insertAdjacentHTML('beforeend', categoryButtons);
        
        // Attach category click listeners
        const categoryBtns = this.categoriesPanel.querySelectorAll('.reference-category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedCategory = btn.dataset.category;
                this.renderCategories();
                this.renderItems();
            });
        });
    }

    /**
     * Render items list
     */
    renderItems() {
        const data = this.getCurrentData();
        let items = Object.entries(data);
        
        // Filter by category (mechanics only)
        if (this.currentTab === 'mechanics' && this.selectedCategory !== 'all') {
            items = items.filter(([_, item]) => item.category === this.selectedCategory);
        }
        
        // Filter by search
        if (this.searchQuery) {
            items = items.filter(([key, item]) => {
                const searchText = `${key} ${item.description || ''}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }
        
        // Sort alphabetically
        items.sort((a, b) => a[0].localeCompare(b[0]));
        
        if (items.length === 0) {
            this.itemsPanel.innerHTML = `
                <div class="reference-empty-state">
                    <p>No items found</p>
                    <small>Try adjusting your search or category filter</small>
                </div>
            `;
            return;
        }
        
        // Build HTML
        const itemsHTML = items.map(([key, item]) => this.renderItem(key, item)).join('');
        this.itemsPanel.innerHTML = itemsHTML;
    }

    /**
     * Render a single item
     */
    renderItem(key, item) {
        const icon = this.getIconForTab();
        const attributes = this.getItemAttributes(item);
        const examples = this.getItemExamples(item);
        
        return `
            <div class="reference-item">
                <div class="reference-item-header">
                    <span class="reference-item-icon">${icon}</span>
                    <h3 class="reference-item-name">${key}</h3>
                    ${item.category ? `<span class="reference-item-category">${item.category}</span>` : ''}
                </div>
                
                ${item.description ? `
                    <p class="reference-item-description">${item.description}</p>
                ` : ''}
                
                ${attributes ? `
                    <div class="reference-item-attributes">
                        <strong>Attributes:</strong>
                        <div class="attributes-list">${attributes}</div>
                    </div>
                ` : ''}
                
                ${examples ? `
                    <div class="reference-item-examples">
                        <strong>Examples:</strong>
                        ${examples}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get current data based on active tab
     */
    getCurrentData() {
        switch (this.currentTab) {
            case 'mechanics':
                return MECHANICS_DATA;
            case 'targeters':
                return TARGETERS_DATA;
            case 'triggers':
                return TRIGGERS_DATA;
            case 'conditions':
                return window.ALL_CONDITIONS || [];
            default:
                return {};
        }
    }

    /**
     * Get icon for current tab
     */
    getIconForTab() {
        switch (this.currentTab) {
            case 'mechanics':
                return '⚙️';
            case 'targeters':
                return '🎯';
            case 'triggers':
                return '⚡';
            case 'conditions':
                return '❓';
            default:
                return '📄';
        }
    }

    /**
     * Get formatted attributes
     */
    getItemAttributes(item) {
        if (!item.attributes || Object.keys(item.attributes).length === 0) {
            return null;
        }
        
        return Object.entries(item.attributes)
            .map(([key, attr]) => {
                const required = attr.required ? '<span class="attr-required">Required</span>' : '';
                const defaultVal = attr.default !== undefined ? `<span class="attr-default">Default: ${attr.default}</span>` : '';
                
                return `
                    <div class="attribute-item">
                        <code class="attr-name">${key}</code>
                        <span class="attr-description">${attr.description || ''}</span>
                        ${required}
                        ${defaultVal}
                    </div>
                `;
            })
            .join('');
    }

    /**
     * Get formatted examples
     */
    getItemExamples(item) {
        if (!item.examples || item.examples.length === 0) {
            return null;
        }
        
        return item.examples
            .map(example => `<code class="example-code">${example}</code>`)
            .join('');
    }
}
