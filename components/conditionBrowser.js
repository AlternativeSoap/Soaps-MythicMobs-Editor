/**
 * Condition Browser Component
 * Provides a modal interface for browsing and selecting MythicMobs conditions
 * Matches the design of mechanic/targeter/trigger browsers
 */

class ConditionBrowser {
    constructor(editor) {
        this.editor = editor;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.onSelectCallback = null;
        this.callbackInvoked = false;  // Track if callback was already called
        this.favoritesManager = new FavoritesManager('conditionBrowserFavorites');
        this.searchCache = new LRUCache(10);
        this.virtualScroller = null;
        this.usageMode = 'yaml';  // 'inline' or 'yaml'
        this.conditionType = 'caster';  // for inline: 'caster' or 'trigger'
        
        // Initialize browser data merger
        if (window.supabase && typeof BrowserDataMerger !== 'undefined') {
            this.browserDataMerger = new BrowserDataMerger(window.supabase);
        }
        this.conditionsData = window.CONDITIONS_DATA || []; // Default to built-in
        
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Load merged data from database
     */
    async loadMergedData() {
        if (this.browserDataMerger) {
            try {
                this.conditionsData = await this.browserDataMerger.getMergedConditions();
            } catch (error) {
                console.error('Error loading merged conditions:', error);
                this.conditionsData = window.CONDITIONS_DATA || []; // Fallback
            }
        }
    }

    /**
     * Toggle favorite condition (O(1))
     */
    toggleFavorite(conditionId) {
        this.favoritesManager.toggle(conditionId);
        this.renderConditions();
    }

    /**
     * Check if condition is favorited (O(1))
     */
    isFavorite(conditionId) {
        return this.favoritesManager.has(conditionId);
    }

    /**
     * Create the condition browser modal HTML
     */
    createModal() {
        const modalHTML = `
            <!-- Main Browser Modal -->
            <div id="conditionBrowserOverlay" class="condition-modal" style="display: none;">
                <div class="modal-content condition-browser">
                    <div class="modal-header">
                        <h2>Condition Browser</h2>
                        <button class="btn-close" id="conditionBrowserClose">&times;</button>
                    </div>
                    
                    <div class="condition-browser-body">
                        <!-- Search Bar -->
                        <div class="search-bar">
                            <input type="text" 
                                   id="conditionSearchInput" 
                                   placeholder="Search conditions..." 
                                   class="search-input">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                        
                        <!-- Category Tabs -->
                        <div class="category-tabs" id="conditionCategories">
                            <button class="category-tab" data-category="favorites">
                                <i class="fas fa-star"></i> Favorites (0)
                            </button>
                            <button class="category-tab active" data-category="all">All (0)</button>
                            <button class="category-tab" data-category="Entity State">💚 Entity State (0)</button>
                            <button class="category-tab" data-category="Entity Type">🔍 Entity Type (0)</button>
                            <button class="category-tab" data-category="Player">👤 Player (0)</button>
                            <button class="category-tab" data-category="Location">📍 Location (0)</button>
                            <button class="category-tab" data-category="Time & Weather">🌤️ Time & Weather (0)</button>
                            <button class="category-tab" data-category="Combat">⚔️ Combat (0)</button>
                            <button class="category-tab" data-category="Variables & Data">📊 Variables & Data (0)</button>
                            <button class="category-tab" data-category="Server & World">🌍 Server & World (0)</button>
                            <button class="category-tab" data-category="Logic & Meta">🎲 Logic & Meta (0)</button>
                        </div>
                        
                        <!-- Condition Grid -->
                        <div class="condition-grid" id="conditionList">
                            <!-- Conditions will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Attribute Configuration Modal -->
            <div id="conditionAttributeOverlay" class="condition-attribute-overlay">
                <div class="condition-attribute-modal">
                    <h3 id="conditionAttributeTitle">Configure Condition</h3>
                    <p id="conditionAttributeDescription"></p>
                    <div id="conditionAttributeForm" class="condition-attribute-form">
                        <!-- Attribute inputs will be rendered here -->
                    </div>
                    <div class="condition-action-section" id="yamlActionSection">
                        <label>Condition Action:</label>
                        <select id="conditionActionSelect" class="form-select">
                            <option value="true">true - Run if condition met</option>
                            <option value="false">false - Run if condition NOT met</option>
                            <option value="power">power - Multiply skill power</option>
                            <option value="cast">cast - Cast additional skill</option>
                            <option value="castinstead">castinstead - Cast different skill</option>
                            <option value="orElseCast">orElseCast - Cast if condition fails</option>
                            <option value="cancel">cancel - Cancel skill tree</option>
                        </select>
                        <input type="text" id="conditionActionParam" class="form-input" placeholder="Parameter (for power/cast/etc)" style="display: none; margin-top: 10px;">
                    </div>
                    <div class="inline-prefix-section" id="inlinePrefixSection" style="display: none;">
                        <label>Condition Type:</label>
                        <select id="inlinePrefixSelect" class="form-select">
                            <option value="?">? - Check Caster (true)</option>
                            <option value="?!">?! - Check Caster (false/negated)</option>
                            <option value="?~">?~ - Check Trigger (true)</option>
                            <option value="?~!">?~! - Check Trigger (false/negated)</option>
                        </select>
                    </div>
                    <div class="condition-preview">
                        <label>Preview:</label>
                        <code id="conditionPreviewCode">condition true</code>
                    </div>
                    <div class="condition-attribute-buttons">
                        <button class="condition-attribute-btn cancel" id="conditionAttributeCancel">Cancel</button>
                        <button class="condition-attribute-btn confirm" id="conditionAttributeConfirm">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        // Add modals to document body
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = modalHTML;
        
        // Append each child element directly to body (not the wrapper)
        while (tempContainer.firstChild) {
            document.body.appendChild(tempContainer.firstChild);
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close browser modal
        document.getElementById('conditionBrowserClose').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('conditionBrowserOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'conditionBrowserOverlay') {
                this.close();
            }
        });

        // Search input with debouncing (150ms)
        const debouncedSearch = debounce((query) => {
            this.searchQuery = query;
            this.renderConditions();
        }, 150);
        
        document.getElementById('conditionSearchInput').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Category tabs
        document.getElementById('conditionCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderConditions();
            }
        });

        // Attribute modal buttons
        document.getElementById('conditionAttributeCancel').addEventListener('click', () => {
            this.closeAttributeModal();
        });

        document.getElementById('conditionAttributeConfirm').addEventListener('click', () => {
            this.confirmConfiguration();
        });
        
        // Add keyboard support for attribute modal
        document.addEventListener('keydown', (e) => {
            const attrOverlay = document.getElementById('conditionAttributeOverlay');
            if (attrOverlay && attrOverlay.classList.contains('active')) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.confirmConfiguration();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeAttributeModal();
                }
            }
        });

        // Condition action selector
        const actionSelect = document.getElementById('conditionActionSelect');
        const actionParam = document.getElementById('conditionActionParam');
        actionSelect.addEventListener('change', () => {
            const action = actionSelect.value;
            if (action === 'power' || action === 'cast' || action === 'castinstead' || action === 'orElseCast') {
                actionParam.style.display = 'block';
                actionParam.placeholder = action === 'power' ? 'e.g., 2.0' : 'e.g., SkillName';
            } else {
                actionParam.style.display = 'none';
            }
            this.updateConditionPreview();
        });

        actionParam.addEventListener('input', () => {
            this.updateConditionPreview();
        });

        // Inline prefix selector
        const inlinePrefixSelect = document.getElementById('inlinePrefixSelect');
        if (inlinePrefixSelect) {
            inlinePrefixSelect.addEventListener('change', () => {
                this.updateConditionPreview();
            });
        }

        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            const attributeOverlay = document.getElementById('conditionAttributeOverlay');
            const browserOverlay = document.getElementById('conditionBrowserOverlay');
            
            // Escape key handling
            if (e.key === 'Escape') {
                if (attributeOverlay && attributeOverlay.classList.contains('active')) {
                    this.closeAttributeModal();
                } else if (browserOverlay && browserOverlay.style.display === 'flex') {
                    this.close();
                }
                return;
            }
            
            // Only handle navigation in browser overlay
            if (!browserOverlay || browserOverlay.style.display !== 'flex') return;
            
            // Ctrl+F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('conditionSearchInput')?.focus();
                return;
            }
            
            // Arrow key navigation
            const cards = Array.from(document.querySelectorAll('#conditionList .condition-card'));
            if (cards.length === 0) return;
            
            const focusedCard = document.activeElement.closest('.condition-card');
            let currentIndex = focusedCard ? cards.indexOf(focusedCard) : -1;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
                cards[currentIndex].querySelector('.btn-select-condition')?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
                cards[currentIndex].querySelector('.btn-select-condition')?.focus();
            } else if (e.key === 'Enter' && focusedCard) {
                e.preventDefault();
                const conditionId = focusedCard.dataset.condition;
                this.handleConditionSelection(conditionId);
            }
        });
    }

    /**
     * Open the condition browser
     */
    async open(options = {}) {
        // Load merged data if available
        await this.loadMergedData();
        
        this.currentValue = options.currentValue || null;
        this.onSelectCallback = options.onSelect || null;
        this.callbackInvoked = false;  // Reset flag
        
        // CRITICAL: Set usage mode and condition type from options
        this.usageMode = options.usageMode || 'yaml';
        this.conditionType = options.conditionType || 'caster';
        
        console.log('🎯 ConditionBrowser.open() - Mode:', this.usageMode, 'Type:', this.conditionType);

        this.currentCategory = 'all';
        this.searchQuery = '';
        document.getElementById('conditionSearchInput').value = '';
        
        // Reset category tabs
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');
        
        // Update modal title to show mode
        const modalTitle = document.querySelector('#conditionBrowserOverlay .modal-header h2');
        if (modalTitle) {
            const modeText = this.usageMode === 'inline' ? ' - Inline Mode' : ' - YAML Mode';
            const modeColor = this.usageMode === 'inline' ? '#4CAF50' : '#2196F3';
            modalTitle.innerHTML = `Condition Browser<span style="color: ${modeColor}; font-size: 0.9em;">${modeText}</span>`;
        }

        this.renderConditions();
        this.updateCategoryCounts();
        const overlay = document.getElementById('conditionBrowserOverlay');
        // Apply higher z-index if opened from another modal
        if (options.parentZIndex) {
            overlay.style.zIndex = options.parentZIndex + 100;
        } else {
            overlay.style.zIndex = '';
        }
        overlay.style.display = 'flex';
    }

    /**
     * Close the condition browser
     */
    close() {
        // Close attribute modal if open
        const attributeOverlay = document.getElementById('conditionAttributeOverlay');
        if (attributeOverlay) {
            attributeOverlay.style.display = 'none';
        }
        
        // Close main browser
        const overlay = document.getElementById('conditionBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.style.zIndex = '';
        }
        
        // Only notify parent if callback wasn't already called
        if (this.onSelectCallback && !this.callbackInvoked) {
            this.onSelectCallback(null);
        } else if (this.callbackInvoked) {
        }
        
        this.onSelectCallback = null;
        this.callbackInvoked = false;
    }

    /**
     * Update category tab counts (using pre-computed counts - O(1) with fallback)
     */
    updateCategoryCounts() {
        const dataOptimizer = window.DataOptimizer;
        const categoryTabs = document.querySelectorAll('#conditionCategories .category-tab');
        
        let counts;
        
        if (dataOptimizer && dataOptimizer.conditionsMap && dataOptimizer.conditionsMap.size > 0) {
            // Get pre-computed counts (O(1) per category)
            counts = {
                all: dataOptimizer.getCategoryCount('conditions', 'all'),
                favorites: this.favoritesManager.getCount(),
                'Entity State': dataOptimizer.getCategoryCount('conditions', 'Entity State'),
                'Entity Type': dataOptimizer.getCategoryCount('conditions', 'Entity Type'),
                'Player': dataOptimizer.getCategoryCount('conditions', 'Player'),
                'Location': dataOptimizer.getCategoryCount('conditions', 'Location'),
                'Time & Weather': dataOptimizer.getCategoryCount('conditions', 'Time & Weather'),
                'Combat': dataOptimizer.getCategoryCount('conditions', 'Combat'),
                'Variables & Data': dataOptimizer.getCategoryCount('conditions', 'Variables & Data'),
                'Server & World': dataOptimizer.getCategoryCount('conditions', 'Server & World'),
                'Logic & Meta': dataOptimizer.getCategoryCount('conditions', 'Logic & Meta')
            };
        } else {
            // Fallback: manually count from window.ALL_CONDITIONS
            const allConditions = window.ALL_CONDITIONS || [];
            counts = {
                all: allConditions.length,
                favorites: this.favoritesManager.getCount(),
                'Entity State': allConditions.filter(c => c.category === 'Entity State').length,
                'Entity Type': allConditions.filter(c => c.category === 'Entity Type').length,
                'Player': allConditions.filter(c => c.category === 'Player').length,
                'Location': allConditions.filter(c => c.category === 'Location').length,
                'Time & Weather': allConditions.filter(c => c.category === 'Time & Weather').length,
                'Combat': allConditions.filter(c => c.category === 'Combat').length,
                'Variables & Data': allConditions.filter(c => c.category === 'Variables & Data').length,
                'Server & World': allConditions.filter(c => c.category === 'Server & World').length,
                'Logic & Meta': allConditions.filter(c => c.category === 'Logic & Meta').length
            };
        }

        // Update tab labels
        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;
            const count = counts[category] || 0;
            const icon = tab.querySelector('i');
            const text = tab.textContent.split('(')[0].trim();
            if (icon) {
                tab.innerHTML = `<i class="${icon.className}"></i> ${text} (${count})`;
            } else {
                tab.textContent = `${text} (${count})`;
            }
        });
    }

    /**
     * Render the condition list based on current filters (using DataOptimizer with fallback)
     */
    renderConditions() {
        const listContainer = document.getElementById('conditionList');
        if (!listContainer) {
            console.error('❌ conditionList container not found');
            return;
        }

        // Add CSS optimizations on first render
        if (!listContainer.dataset.optimized) {
            listContainer.style.willChange = 'scroll-position';
            listContainer.style.transform = 'translateZ(0)';
            listContainer.style.contain = 'layout style paint';
            listContainer.dataset.optimized = 'true';
        }

        const dataOptimizer = window.DataOptimizer;
        const useOptimizer = dataOptimizer && dataOptimizer.conditionsMap && dataOptimizer.conditionsMap.size > 0;
        
        console.log('📊 Data source:', useOptimizer ? 'DataOptimizer' : 'Fallback (window.ALL_CONDITIONS)');
        
        // Check cache first
        const cacheKey = `${this.currentCategory}:${this.searchQuery}`;
        let filteredConditions = this.searchCache.get(cacheKey);
        
        if (!filteredConditions) {
            if (useOptimizer) {
                // Use DataOptimizer for filtering (O(1) category access)
                if (this.currentCategory === 'favorites') {
                    const allConditions = dataOptimizer.getAllItems('conditions');
                    filteredConditions = this.favoritesManager.filterFavorites(allConditions, 'name');
                } else if (this.searchQuery) {
                    // Use DataOptimizer's search with category filter
                    filteredConditions = dataOptimizer.searchItems(
                        'conditions', 
                        this.searchQuery, 
                        this.currentCategory === 'all' ? 'all' : this.currentCategory
                    );
                } else {
                    // Get items by category (O(1) for category lookup)
                    filteredConditions = dataOptimizer.getItemsByCategory('conditions', this.currentCategory);
                }
            } else {
                // Fallback to window.ALL_CONDITIONS
                console.warn('⚠️ Using fallback data source');
                const allConditions = window.ALL_CONDITIONS || [];
                
                filteredConditions = allConditions;
                
                // Filter by category
                if (this.currentCategory === 'favorites') {
                    filteredConditions = allConditions.filter(c => this.favoritesManager.has(c.name));
                } else if (this.currentCategory && this.currentCategory !== 'all') {
                    filteredConditions = allConditions.filter(c => c.category === this.currentCategory);
                }
                
                // Filter by search query
                if (this.searchQuery) {
                    const query = this.searchQuery.toLowerCase();
                    filteredConditions = filteredConditions.filter(c =>
                        c.name.toLowerCase().includes(query) ||
                        c.description.toLowerCase().includes(query) ||
                        (c.aliases && c.aliases.some(a => a.toLowerCase().includes(query)))
                    );
                }
            }
            
            // Cache the result
            this.searchCache.set(cacheKey, filteredConditions);
        }

        // Render cards
        if (filteredConditions.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No conditions found matching your search.</div>';
            return;
        }

        // Note: Virtual scrolling disabled for grid layouts to preserve multi-column CSS grid
        // The grid layout provides better UX for browsing mechanics/conditions

        // Clear any existing event listeners by storing reference
        if (this.containerClickHandler) {
            listContainer.removeEventListener('click', this.containerClickHandler);
        }

        listContainer.innerHTML = filteredConditions.map(condition => 
            this.renderConditionCard(condition)
        ).join('');

        this.setupEventDelegation(listContainer);
    }

    /**
     * Render a single condition card (reusable for both modes)
     */
    renderConditionCard(condition) {
            const aliasesHTML = condition.aliases && condition.aliases.length > 0 
                ? `<div class="condition-aliases"><strong>Aliases:</strong> ${condition.aliases.join(', ')}</div>`
                : '';
            
            const examplesHTML = condition.examples && condition.examples.length > 0
                ? `<div class="condition-example"><code>${condition.examples[0]}</code></div>`
                : '';

            const isFav = this.isFavorite(condition.name);

            return `
                <div class="condition-card" data-condition="${condition.name}">
                    <div class="condition-card-header">
                        <h4>${condition.name}</h4>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-icon btn-favorite-condition" data-condition-id="${condition.name}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                                <i class="${isFav ? 'fas' : 'far'} fa-star" style="color: ${isFav ? '#ffc107' : '#666'};"></i>
                            </button>
                            <span class="condition-category-badge">${condition.category}</span>
                        </div>
                    </div>
                    <div class="condition-card-body">
                        <p class="condition-card-description">${condition.description}</p>
                        ${aliasesHTML}
                        ${examplesHTML}
                    </div>
                    <div class="condition-card-footer">
                        <button class="btn btn-primary btn-select-condition">Select</button>
                    </div>
                </div>
            `;
    }

    /**
     * Setup event delegation for condition cards
     */
    setupEventDelegation(listContainer) {
        // Event delegation - single listener for all buttons
        this.containerClickHandler = (e) => {
            // Handle select button
            const selectBtn = e.target.closest('.btn-select-condition');
            if (selectBtn) {
                const card = selectBtn.closest('.condition-card');
                const conditionId = card.dataset.condition;
                this.handleConditionSelection(conditionId);
                return;
            }

            // Handle favorite button
            const favoriteBtn = e.target.closest('.btn-favorite-condition');
            if (favoriteBtn) {
                e.stopPropagation();
                const conditionId = favoriteBtn.dataset.conditionId;
                this.toggleFavorite(conditionId);
                return;
            }
        };

        listContainer.addEventListener('click', this.containerClickHandler);
    }

    /**
     * Handle condition selection
     */
    handleConditionSelection(conditionId) {
        const condition = window.ConditionHelpers.findCondition(conditionId);
        if (!condition) return;

        // Store current condition
        this.currentCondition = condition;

        // If condition has attributes, show configuration modal
        if (condition.attributes && condition.attributes.length > 0) {
            this.showAttributeConfiguration(condition);
        } else {
            // No attributes, show action selector only
            this.showAttributeConfiguration(condition);
        }
    }

    /**
     * Show attribute configuration modal
     */
    showAttributeConfiguration(condition) {
        const modal = document.getElementById('conditionAttributeOverlay');
        const title = document.getElementById('conditionAttributeTitle');
        const description = document.getElementById('conditionAttributeDescription');
        const form = document.getElementById('conditionAttributeForm');
        
        title.textContent = `Configure ${condition.name}`;
        description.textContent = condition.description;

        // Render attribute inputs
        if (condition.attributes && condition.attributes.length > 0) {
            form.innerHTML = condition.attributes.map(attr => {
                const inputId = `attr_${attr.name}`;
                let inputHTML = '';

                if (attr.type === 'boolean') {
                    inputHTML = `
                        <select id="${inputId}" class="form-select" data-attr="${attr.name}">
                            <option value="true">true</option>
                            <option value="false">false</option>
                        </select>
                    `;
                } else if (attr.options && attr.options.length > 0) {
                    inputHTML = `
                        <select id="${inputId}" class="form-select" data-attr="${attr.name}">
                            <option value="">Select ${attr.name}...</option>
                            ${attr.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    `;
                } else {
                    inputHTML = `
                        <input type="text" 
                               id="${inputId}" 
                               class="form-input" 
                               data-attr="${attr.name}"
                               placeholder="${attr.placeholder || attr.name}"
                               ${attr.default ? `value="${attr.default}"` : ''}>
                    `;
                }

                // Add entity picker for entity_type validation
                let entityPickerHTML = '';
                if (attr.validation === 'entity_type') {
                    entityPickerHTML = this.createEntityPickerHTML(inputId);
                }

                return `
                    <div class="form-group">
                        <label for="${inputId}">
                            ${attr.name}${attr.required ? '<span style="color: #e74c3c;">*</span>' : ''}
                            ${attr.aliases && attr.aliases.length > 0 ? `<span style="color: #7f8c8d; font-size: 0.9em;"> (${attr.aliases.join(', ')})</span>` : ''}
                        </label>
                        ${inputHTML}
                        <small style="color: #95a5a6; display: block; margin-top: 5px;">${attr.description}</small>
                        ${entityPickerHTML}
                    </div>
                `;
            }).join('');

            // Attach input listeners for preview
            form.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input', () => this.updateConditionPreview());
                input.addEventListener('change', () => this.updateConditionPreview());
            });

            // Setup entity pickers for entity_type validation
            condition.attributes.forEach(attr => {
                if (attr.validation === 'entity_type') {
                    const inputId = `attr_${attr.name}`;
                    // Use setTimeout to ensure DOM is fully rendered
                    setTimeout(() => this.setupEntityPickerHandlers(inputId), 0);
                }
            });
        } else {
            form.innerHTML = '<p style="color: #95a5a6;">No attributes required for this condition.</p>';
        }

        // Configure UI based on usage mode
        const yamlActionSection = document.getElementById('yamlActionSection');
        const inlinePrefixSection = document.getElementById('inlinePrefixSection');
        
        if (this.usageMode === 'inline') {
            // Inline mode: show prefix selector, hide action selector
            if (yamlActionSection) yamlActionSection.style.display = 'none';
            if (inlinePrefixSection) inlinePrefixSection.style.display = 'block';
            
            // Set default prefix based on condition type
            const prefixSelect = document.getElementById('inlinePrefixSelect');
            if (prefixSelect) {
                prefixSelect.value = this.conditionType === 'trigger' ? '?~' : '?';
            }
        } else {
            // YAML mode: show action selector, hide prefix selector
            if (yamlActionSection) yamlActionSection.style.display = 'block';
            if (inlinePrefixSection) inlinePrefixSection.style.display = 'none';
            
            // Reset action selector
            document.getElementById('conditionActionSelect').value = 'true';
            document.getElementById('conditionActionParam').value = '';
            document.getElementById('conditionActionParam').style.display = 'none';
        }

        this.updateConditionPreview();
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    /**
     * Update condition preview
     */
    updateConditionPreview() {
        const preview = document.getElementById('conditionPreviewCode');
        if (!this.currentCondition) return;

        let syntax = '';
        let conditionName = this.currentCondition.name;

        // Collect attributes
        const form = document.getElementById('conditionAttributeForm');
        const attributes = [];
        
        form.querySelectorAll('[data-attr]').forEach(input => {
            const value = input.value.trim();
            if (value) {
                const attrName = input.dataset.attr;
                const attrDef = this.currentCondition.attributes?.find(a => a.name === attrName);
                const key = (attrDef?.aliases && attrDef.aliases.length > 0) ? attrDef.aliases[0] : attrName;
                attributes.push(`${key}=${value}`);
            }
        });

        if (attributes.length > 0) {
            conditionName += `{${attributes.join(';')}}`;
        }

        if (this.usageMode === 'inline') {
            // Inline format: prefix + condition (no action)
            const prefix = document.getElementById('inlinePrefixSelect').value;
            syntax = `${prefix}${conditionName}`;
        } else {
            // YAML format: condition + action
            syntax = conditionName;
            
            const action = document.getElementById('conditionActionSelect').value;
            const actionParam = document.getElementById('conditionActionParam').value.trim();

            if (action === 'power' || action === 'cast' || action === 'castinstead' || action === 'orElseCast') {
                syntax += actionParam ? ` ${action} ${actionParam}` : ` ${action}`;
            } else {
                syntax += ` ${action}`;
            }
        }

        preview.textContent = syntax;
    }

    /**
     * Close attribute modal
     */
    closeAttributeModal() {
        const modal = document.getElementById('conditionAttributeOverlay');
        modal.classList.remove('active');
        modal.style.display = 'none';
        this.currentCondition = null;
    }

    /**
     * Confirm configuration and return condition string
     */
    confirmConfiguration() {
        if (!this.currentCondition) return;

        // Build condition string (name + attributes)
        let conditionString = this.currentCondition.name;

        // Collect attributes
        const form = document.getElementById('conditionAttributeForm');
        const attributes = [];
        
        form.querySelectorAll('[data-attr]').forEach(input => {
            const value = input.value.trim();
            if (value) {
                const attrName = input.dataset.attr;
                const attrDef = this.currentCondition.attributes?.find(a => a.name === attrName);
                const key = (attrDef?.aliases && attrDef.aliases.length > 0) ? attrDef.aliases[0] : attrName;
                attributes.push(`${key}=${value}`);
            }
        });

        if (attributes.length > 0) {
            conditionString += `{${attributes.join(';')}}`;
        }

        // Callback with result based on usage mode (BEFORE closing!)
        if (this.onSelectCallback) {
            if (this.usageMode === 'inline') {
                // Inline mode: return full inline format with prefix
                const prefixSelect = document.getElementById('inlinePrefixSelect');
                const prefix = prefixSelect ? prefixSelect.value : '?';
                const fullInlineCondition = `${prefix}${conditionString}`;
                
                const result = {
                    conditionString: fullInlineCondition,
                    prefix: prefix,
                    conditionType: prefix.includes('~') ? 'trigger' : 'caster',
                    usageMode: 'inline',
                    condition: this.currentCondition
                };
                
                this.callbackInvoked = true;  // Mark as invoked
                this.onSelectCallback(result);
            } else {
                // YAML mode: return condition + action separately
                const actionSelect = document.getElementById('conditionActionSelect');
                const actionParamInput = document.getElementById('conditionActionParam');
                const action = actionSelect ? actionSelect.value : 'true';
                const actionParam = actionParamInput && actionParamInput.style.display !== 'none' 
                    ? actionParamInput.value.trim() 
                    : '';
                
                this.callbackInvoked = true;  // Mark as invoked
                this.onSelectCallback({
                    conditionString: conditionString,
                    action: action,
                    actionParam: actionParam,
                    usageMode: 'yaml',
                    condition: this.currentCondition
                });
            }
        }
        
        // Close modals AFTER callback
        this.closeAttributeModal();
        this.close();
    }

    /**
     * Create entity picker HTML
     */
    createEntityPickerHTML(inputId) {
        // Get entity types from DataValidatorHelpers
        const entityTypes = window.DataValidator?.prototype?.VALID_ENTITY_TYPES || [];
        
        // Get custom MythicMobs from mob editor
        const customMobs = this.getCustomMythicMobs();
        
        // Categorize entities
        const categories = {
            'Hostile': ['ZOMBIE', 'SKELETON', 'SPIDER', 'CAVE_SPIDER', 'CREEPER', 'ENDERMAN', 'WITCH', 'SLIME', 
                       'MAGMA_CUBE', 'BLAZE', 'GHAST', 'ZOMBIFIED_PIGLIN', 'HOGLIN', 'PIGLIN', 'PIGLIN_BRUTE',
                       'WITHER_SKELETON', 'STRAY', 'HUSK', 'DROWNED', 'PHANTOM', 'SILVERFISH', 'ENDERMITE',
                       'VINDICATOR', 'EVOKER', 'VEX', 'PILLAGER', 'RAVAGER', 'GUARDIAN', 'ELDER_GUARDIAN',
                       'SHULKER', 'ZOGLIN', 'WARDEN', 'BOGGED', 'BREEZE'],
            'Passive': ['PIG', 'COW', 'SHEEP', 'CHICKEN', 'RABBIT', 'HORSE', 'DONKEY', 'MULE', 'LLAMA',
                       'TRADER_LLAMA', 'CAT', 'OCELOT', 'WOLF', 'PARROT', 'BAT', 'VILLAGER', 'WANDERING_TRADER',
                       'COD', 'SALMON', 'TROPICAL_FISH', 'PUFFERFISH', 'SQUID', 'GLOW_SQUID', 'DOLPHIN',
                       'TURTLE', 'POLAR_BEAR', 'PANDA', 'FOX', 'BEE', 'MOOSHROOM', 'STRIDER', 'AXOLOTL',
                       'GOAT', 'FROG', 'TADPOLE', 'CAMEL', 'SNIFFER', 'ARMADILLO', 'ALLAY'],
            'Utility': ['IRON_GOLEM', 'SNOW_GOLEM', 'ARMOR_STAND', 'ITEM_DISPLAY', 'BLOCK_DISPLAY',
                       'TEXT_DISPLAY', 'INTERACTION', 'MARKER'],
            'Bosses': ['ENDER_DRAGON', 'WITHER']
        };
        
        // Add MythicMobs category if we have custom mobs
        if (customMobs.length > 0) {
            categories['MythicMobs'] = customMobs;
        }

        return `
            <div class="entity-picker-container" data-input-id="${inputId}">
                <!-- Selected Entities Chips -->
                <div class="entity-chips-container" style="display: none;">
                    <div class="entity-chips"></div>
                    <button type="button" class="btn-clear-entities">
                        Clear All
                    </button>
                </div>

                <!-- Entity Search -->
                <div class="entity-search-container">
                    <input type="text" 
                           class="entity-search-input" 
                           placeholder="🔍 Search vanilla entities or type custom mob name and press Enter...">
                    <small class="entity-search-hint">Type any entity name and press <kbd>Enter</kbd> to add</small>
                </div>

                <!-- Entity Browser -->
                <div class="entity-browser">
                    ${Object.entries(categories).map(([category, entities]) => `
                        <div class="entity-category" data-category="${category}">
                            <div class="entity-category-header">
                                ${category === 'MythicMobs' ? '🔮 ' : ''}${category} (${entities.length})
                            </div>
                            <div class="entity-grid">
                                ${entities.map(entity => `
                                    <button type="button" 
                                            class="entity-item ${category === 'MythicMobs' ? 'mythicmob-item' : ''}" 
                                            data-entity="${entity}">
                                        ${entity}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Setup entity picker event handlers
     */
    setupEntityPickerHandlers(inputId) {
        const container = document.querySelector(`.entity-picker-container[data-input-id="${inputId}"]`);
        if (!container) return;

        const input = document.getElementById(inputId);
        const searchInput = container.querySelector('.entity-search-input');
        const entityBrowser = container.querySelector('.entity-browser');
        const chipsContainer = container.querySelector('.entity-chips');
        const chipsWrapper = container.querySelector('.entity-chips-container');
        const clearBtn = container.querySelector('.btn-clear-entities');

        // Track selected entities
        let selectedEntities = [];

        // Initialize from existing input value
        const initValue = input.value.trim();
        if (initValue) {
            selectedEntities = initValue.split(',').map(e => e.trim()).filter(e => e);
            this.updateEntityChips(chipsContainer, chipsWrapper, selectedEntities, input);
        }

        // Entity item click handler
        container.addEventListener('click', (e) => {
            const entityBtn = e.target.closest('.entity-item');
            if (entityBtn) {
                const entity = entityBtn.dataset.entity;
                this.toggleEntity(entity, selectedEntities, input, chipsContainer, chipsWrapper);
                this.updateEntityChips(chipsContainer, chipsWrapper, selectedEntities, input);
            }
        });

        // Clear all button
        clearBtn.addEventListener('click', () => {
            selectedEntities = [];
            input.value = '';
            this.updateEntityChips(chipsContainer, chipsWrapper, selectedEntities, input);
            this.updateConditionPreview();
        });

        // Enter key to add custom entity
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const customName = searchInput.value.trim();
                if (customName && !selectedEntities.includes(customName)) {
                    selectedEntities.push(customName);
                    input.value = selectedEntities.join(',');
                    this.updateEntityChips(chipsContainer, chipsWrapper, selectedEntities, input);
                    searchInput.value = '';
                    // Reset search filter
                    const categories = container.querySelectorAll('.entity-category');
                    categories.forEach(cat => cat.style.display = '');
                    container.querySelectorAll('.entity-item').forEach(item => item.style.display = '');
                    this.updateConditionPreview();
                }
            }
        });

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const categories = container.querySelectorAll('.entity-category');
            
            categories.forEach(category => {
                const items = category.querySelectorAll('.entity-item');
                let visibleCount = 0;
                
                items.forEach(item => {
                    const entityName = item.dataset.entity.toLowerCase();
                    if (entityName.includes(query)) {
                        item.style.display = '';
                        visibleCount++;
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Hide category if no visible items
                category.style.display = visibleCount > 0 ? '' : 'none';
            });
        });

        // Sync input changes back to chips
        input.addEventListener('input', () => {
            const value = input.value.trim();
            selectedEntities = value ? value.split(',').map(e => e.trim()).filter(e => e) : [];
            this.updateEntityChips(chipsContainer, chipsWrapper, selectedEntities, input);
        });
    }

    /**
     * Toggle entity selection
     */
    toggleEntity(entity, selectedEntities, input, chipsContainer, chipsWrapper) {
        const index = selectedEntities.indexOf(entity);
        if (index > -1) {
            selectedEntities.splice(index, 1);
        } else {
            selectedEntities.push(entity);
        }
        
        input.value = selectedEntities.join(',');
        this.updateConditionPreview();
    }

    /**
     * Update entity chips display
     */
    updateEntityChips(chipsContainer, chipsWrapper, selectedEntities, input) {
        // Show/hide chips container
        if (selectedEntities.length > 0) {
            chipsWrapper.style.display = 'block';
        } else {
            chipsWrapper.style.display = 'none';
            return;
        }

        // Check if entities are vanilla or custom
        const vanillaTypes = window.DataValidator?.prototype?.VALID_ENTITY_TYPES || [];
        
        // Render chips
        chipsContainer.innerHTML = selectedEntities.map(entity => {
            const isVanilla = vanillaTypes.includes(entity.toUpperCase());
            
            return `
                <div class="entity-chip ${isVanilla ? 'vanilla' : 'custom'}" data-entity="${entity}">
                    <span class="entity-chip-name">${entity}</span>
                    ${!isVanilla ? '<span class="entity-chip-badge">(custom)</span>' : ''}
                    <button type="button" class="btn-remove-chip" data-entity="${entity}">
                        ×
                    </button>
                </div>
            `;
        }).join('');

        // Add remove handlers
        chipsContainer.querySelectorAll('.btn-remove-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entity = btn.dataset.entity;
                const index = selectedEntities.indexOf(entity);
                if (index > -1) {
                    selectedEntities.splice(index, 1);
                    input.value = selectedEntities.join(',');
                    this.updateEntityChips(chipsContainer, chipsWrapper, selectedEntities, input);
                    this.updateConditionPreview();
                }
            });
        });

        // Highlight selected entities in browser
        const container = chipsContainer.closest('.entity-picker-container');
        container.querySelectorAll('.entity-item').forEach(item => {
            const entity = item.dataset.entity;
            if (selectedEntities.includes(entity)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * Get custom MythicMobs from the current pack
     */
    getCustomMythicMobs() {
        try {
            
            // Try multiple paths to access packManager
            let packManager = null;
            
            // Path 1: this.editor.packManager (when browser is created with editor reference)
            if (this.editor?.packManager) {
                packManager = this.editor.packManager;
            }
            // Path 2: window.editor.packManager (global editor instance)
            else if (window.editor?.packManager) {
                packManager = window.editor.packManager;
            }
            // Path 3: window.app.packManager (fallback)
            else if (window.app?.packManager) {
                packManager = window.app.packManager;
            }
            
            if (!packManager) {
                console.log('❌ No packManager found through any path');
                return [];
            }
            
            const activePack = packManager.activePack;
            console.log('Active pack:', activePack ? activePack.name : 'None');
            
            if (!activePack || !activePack.mobs) {
                console.log('❌ No activePack or mobs array');
                return [];
            }
            
            console.log('Mobs array length:', activePack.mobs.length);
            
            const customMobs = [];
            
            // Check if using new file-based structure
            if (Array.isArray(activePack.mobs) && activePack.mobs.length > 0) {
                console.log('First mob structure check:', activePack.mobs[0].entries !== undefined ? 'File-based' : 'Legacy');
                
                if (activePack.mobs[0].entries !== undefined) {
                    // New structure: iterate through files and their entries
                    activePack.mobs.forEach(file => {
                        if (file.entries && Array.isArray(file.entries)) {
                            console.log(`File: ${file.fileName}, entries: ${file.entries.length}`);
                            file.entries.forEach(mob => {
                                if (mob.internalName || mob.name) {
                                    customMobs.push(mob.internalName || mob.name);
                                }
                            });
                        }
                    });
                } else {
                    // Legacy flat structure
                    activePack.mobs.forEach(mob => {
                        if (mob.internalName || mob.name) {
                            customMobs.push(mob.internalName || mob.name);
                        }
                    });
                }
            }
            
            console.log(`✅ Returning ${customMobs.length} custom mobs:`, customMobs);
            // Sort alphabetically and remove duplicates
            return [...new Set(customMobs)].sort((a, b) => a.localeCompare(b));
        } catch (error) {
            console.warn('Could not load custom MythicMobs:', error);
            return [];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConditionBrowser;
}

// Loaded silently
