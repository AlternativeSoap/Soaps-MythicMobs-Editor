/**
 * Mechanic Browser Component - COMPLETE OVERHAUL
 * Smart guided mechanic configuration with full integration
 * Context-aware for mob vs skill files
 * 
 * Features:
 * - Uses all 139 mechanics from validator's MECHANICS_DATA
 * - Smart attribute form rendering with type detection
 * - Full targeter/trigger/condition integration
 * - Real-time validation and preview
 * - Professional UX with loading states and animations
 */

class MechanicBrowser {
    constructor(targeterBrowser, triggerBrowser, conditionEditor) {
        console.log('🏗️ Creating MechanicBrowser instance (Enhanced Version)');
        this.targeterBrowser = targeterBrowser;
        this.triggerBrowser = triggerBrowser;
        this.conditionEditor = conditionEditor;
        this.context = 'mob';
        this.onSelectCallback = null;
        this.searchCache = new LRUCache(10);
        this.virtualScroller = null;
        
        // Current configuration state
        this.currentMechanic = null;
        
        // UI state
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        this.useEffectPrefix = localStorage.getItem('mechanicBrowser_useEffectPrefix') === 'true'; // Load from localStorage
        
        // Smart features
        this.recentMechanics = this.loadRecentMechanics();
        this.favoritesManager = new FavoritesManager('mechanicBrowser_favorites');
        
        this.createModal();
        this.attachEventListeners();
        console.log('✅ MechanicBrowser (Enhanced) ready with', this.getMechanicsCount(), 'mechanics');
    }
    
    /**
     * Get total mechanics count
     */
    getMechanicsCount() {
        return MECHANICS_DATA.mechanics ? MECHANICS_DATA.mechanics.length : 0;
    }
    
    /**
     * Load recent mechanics from localStorage
     */
    loadRecentMechanics() {
        try {
            const stored = localStorage.getItem('mechanicBrowser_recent');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Save recent mechanic
     */
    saveRecentMechanic(mechanicId) {
        try {
            let recent = this.loadRecentMechanics();
            recent = recent.filter(id => id !== mechanicId);
            recent.unshift(mechanicId);
            recent = recent.slice(0, 10); // Keep last 10
            localStorage.setItem('mechanicBrowser_recent', JSON.stringify(recent));
            this.recentMechanics = recent;
        } catch (e) {
            console.error('Failed to save recent mechanic:', e);
        }
    }
    
    /**
     * Toggle favorite mechanic (O(1))
     */
    toggleFavorite(mechanicId) {
        return this.favoritesManager.toggle(mechanicId);
    }
    
    /**
     * Check if mechanic is favorited (O(1))
     */
    isFavorite(mechanicId) {
        return this.favoritesManager.has(mechanicId);
    }

    /**
     * Create the mechanic browser modal HTML
     */
    createModal() {
        const modalHTML = `
            <!-- Main Mechanic Browser Modal (Condition Browser Style) -->
            <div id="mechanicBrowserOverlay" class="condition-modal" style="display: none;">
                <div class="modal-content condition-browser">
                    <div class="modal-header">
                        <h2>Mechanic Browser</h2>
                        <button class="btn-close" id="mechanicBrowserClose">&times;</button>
                    </div>
                    
                    <!-- Step 1: Select Mechanic -->
                    <div id="mechanicSelectionStep" class="mechanic-step active">
                        <div class="condition-browser-body">
                            <!-- Search Bar -->
                            <div class="search-bar">
                                <input type="text" 
                                       id="mechanicSearchInput" 
                                       placeholder="Search mechanics..." 
                                       class="search-input">
                                <i class="fas fa-search search-icon"></i>
                            </div>
                            
                            <!-- Category Tabs -->
                            <div class="category-tabs" id="mechanicCategories">
                                <button class="category-tab" data-category="Favorites">
                                    <i class="fas fa-star"></i> Favorites (0)
                                </button>
                                <button class="category-tab active" data-category="All">
                                    All (0)
                                </button>
                                <button class="category-tab" data-category="damage">
                                    ⚔️ Damage (0)
                                </button>
                                <button class="category-tab" data-category="heal">
                                    ❤️ Heal (0)
                                </button>
                                <button class="category-tab" data-category="movement">
                                    🏃 Movement (0)
                                </button>
                                <button class="category-tab" data-category="effects">
                                    ✨ Effects (0)
                                </button>
                                <button class="category-tab" data-category="control">
                                    🎮 Control (0)
                                </button>
                                <button class="category-tab" data-category="utility">
                                    🔧 Utility (0)
                                </button>
                                <button class="category-tab" data-category="aura">
                                    🔮 Aura (0)
                                </button>
                                <button class="category-tab" data-category="projectile">
                                    🎯 Projectile (0)
                                </button>
                            </div>
                            
                            <!-- Mechanic Grid -->
                            <div class="condition-grid" id="mechanicList">
                                <!-- Mechanics will be rendered here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 2: Configure Mechanic -->
                    <div id="mechanicConfigurationStep" class="mechanic-step">
                        <div class="mechanic-config-header">
                            <button class="btn-back" id="backToMechanics">&larr; Back</button>
                            <h3 id="mechanicConfigTitle">Configure Mechanic</h3>
                        </div>
                        
                        <div class="mechanic-config-body">
                            <!-- Mechanic Attributes -->
                            <div class="config-section">
                                <h4>Mechanic Attributes <span class="required">*</span></h4>
                                <div id="mechanicAttributesForm">
                                    <!-- Attributes will be rendered here -->
                                </div>
                            </div>
                            
                            <!-- Live Preview -->
                            <div class="config-section preview-section">
                                <h4>Preview</h4>
                                <div class="skill-line-preview">
                                    <code id="skillLinePreview">- mechanic{}</code>
                                </div>
                                <small class="config-hint">Targeters, triggers, conditions, and other modifiers can be added in the Skill Line Builder</small>
                            </div>
                        </div>
                        
                        <div class="mechanic-config-footer">
                            <button class="btn btn-secondary" id="cancelMechanicConfig">Cancel</button>
                            <button class="btn btn-primary" id="confirmMechanicConfig">Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal directly to document body
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close browser modal
        document.getElementById('mechanicBrowserClose').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('mechanicBrowserOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'mechanicBrowserOverlay') {
                this.close();
            }
        });

        // Search input with debouncing (150ms)
        const debouncedSearch = debounce((query) => {
            this.searchQuery = query;
            this.renderMechanics();
        }, 150);
        
        document.getElementById('mechanicSearchInput').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Category tabs - using event delegation
        document.getElementById('mechanicCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderMechanics();
            }
        });

        // Favorite toggle buttons - using event delegation
        document.getElementById('mechanicList').addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.btn-favorite');
            if (favoriteBtn) {
                e.stopPropagation();
                const mechanicId = favoriteBtn.dataset.mechanicId;
                this.toggleFavorite(mechanicId);
                this.renderMechanics();
                this.renderQuickAccess();
                this.updateCategoryCounts();
            }
        });

        // Clear favorites button
        const clearFavBtn = document.getElementById('clearFavoritesBtn');
        if (clearFavBtn) {
            clearFavBtn.addEventListener('click', () => {
                this.favoritesManager.clear();
                this.renderMechanics();
                this.renderQuickAccess();
            });
        }

        // Clear recent button
        const clearRecentBtn = document.getElementById('clearRecentBtn');
        if (clearRecentBtn) {
            clearRecentBtn.addEventListener('click', () => {
                localStorage.removeItem('mechanicBrowser_recent');
                this.recentMechanics = [];
                this.renderQuickAccess();
            });
        }

        // Back button
        document.getElementById('backToMechanics').addEventListener('click', () => {
            this.showMechanicSelection();
        });

        // (Component selection buttons removed - handled in Skill Line Builder)

        // Effect prefix toggle - using event delegation since checkbox is created dynamically
        document.addEventListener('change', (e) => {
            if (e.target.id === 'effectPrefixCheckbox') {
                this.useEffectPrefix = e.target.checked;
                this.updateSkillLinePreview();
                // Save preference to localStorage
                localStorage.setItem('mechanicBrowser_useEffectPrefix', e.target.checked);
            }
        });

        // Config buttons
        document.getElementById('cancelMechanicConfig').addEventListener('click', () => {
            this.close(true); // Pass true to indicate cancelled
        });

        document.getElementById('confirmMechanicConfig').addEventListener('click', () => {
            this.confirmConfiguration();
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('mechanicBrowserOverlay');
            if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') {
                this.close(true); // Pass true to indicate cancelled
            }
        });
    }

    /**
     * Open the mechanic browser
     */
    open(options = {}) {
        console.log('🎯 MechanicBrowser.open called with:', options);
        this.context = options.context || 'mob';
        this.currentValue = options.currentValue || null;
        this.onSelectCallback = options.onSelect || null;

        // Reset state
        this.currentMechanic = null;
        
        this.currentCategory = 'all';
        this.searchQuery = '';

        // Parse currentValue if editing
        if (this.currentValue) {
            this.parseSkillLine(this.currentValue);
        }

        this.showMechanicSelection();
        this.updateCategoryCounts();
        const overlay = document.getElementById('mechanicBrowserOverlay');
        console.log('🎭 Showing overlay, element found:', !!overlay);
        if (overlay) {
            // Apply higher z-index if opened from another modal
            if (options.parentZIndex) {
                overlay.style.zIndex = options.parentZIndex + 100;
            } else {
                overlay.style.zIndex = '';
            }
            overlay.style.display = 'flex';
        } else {
            console.error('❌ mechanicBrowserOverlay element not found!');
        }
    }

    /**
     * Close the mechanic browser
     */
    close() {
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Notify parent that browser was closed without selection
        if (this.onSelectCallback) {
            this.onSelectCallback(null);
        }
        
        // Reset to selection step for next time
        this.showMechanicSelection();
        
        // Clear state
        this.currentMechanic = null;
        
        this.onSelectCallback = null;
    }

    /**
     * Show mechanic selection step
     */
    showMechanicSelection() {
        document.getElementById('mechanicSelectionStep').classList.add('active');
        document.getElementById('mechanicConfigurationStep').classList.remove('active');
        
        document.getElementById('mechanicSearchInput').value = '';
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-category="All"]').classList.add('active');
        this.currentCategory = 'All';
        this.searchQuery = '';
        
        this.renderMechanics();
    }

    /**
     * Show mechanic configuration step
     */
    showMechanicConfiguration(mechanic) {
        this.currentMechanic = mechanic;
        
        document.getElementById('mechanicSelectionStep').classList.remove('active');
        document.getElementById('mechanicConfigurationStep').classList.add('active');
        
        document.getElementById('mechanicConfigTitle').textContent = `Configure ${mechanic.name}`;
        // Show effect prefix toggle if mechanic has effect: alias
        let effectToggleContainer = document.getElementById('effectPrefixToggleContainer');
        if (!effectToggleContainer) {
            effectToggleContainer = document.createElement('div');
            effectToggleContainer.id = 'effectPrefixToggleContainer';
            effectToggleContainer.className = 'effect-prefix-toggle';
            effectToggleContainer.style.display = 'none';
            effectToggleContainer.innerHTML = `
                <label class="effect-prefix-label">
                    <input type="checkbox" id="effectPrefixCheckbox" class="effect-prefix-checkbox">
                    <span class="effect-prefix-text">Use <code>effect:</code> prefix</span>
                </label>
            `;
            const configBody = document.querySelector('.mechanic-config-body');
            if (configBody) configBody.insertBefore(effectToggleContainer, configBody.firstChild);
        }
        if (MechanicBrowser.hasEffectPrefix(mechanic)) {
            effectToggleContainer.style.display = 'block';
            document.getElementById('effectPrefixCheckbox').checked = this.useEffectPrefix;
        } else {
            effectToggleContainer.style.display = 'none';
            this.useEffectPrefix = false;
        }
        
        // Render mechanic attributes
        this.renderMechanicAttributes();
        
        // Update UI
        this.updateSkillLinePreview();
    }

    /**
     * Render mechanics list (using DataOptimizer)
     */
    renderMechanics() {
        const listContainer = document.getElementById('mechanicList');
        
        // Add CSS optimizations on first render
        if (listContainer && !listContainer.dataset.optimized) {
            listContainer.style.willChange = 'scroll-position';
            listContainer.style.transform = 'translateZ(0)';
            listContainer.style.contain = 'layout style paint';
            listContainer.dataset.optimized = 'true';
        }
        
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) {
            console.warn('DataOptimizer not available');
            return;
        }
        
        // Check cache first
        const cacheKey = `${this.currentCategory}:${this.searchQuery}`;
        let mechanics = this.searchCache.get(cacheKey);
        
        if (!mechanics) {
            // Use DataOptimizer for filtering
            if (this.currentCategory === 'Favorites') {
                const allMechanics = dataOptimizer.getAllItems('mechanics');
                mechanics = this.favoritesManager.filterFavorites(allMechanics, 'id');
            } else if (this.searchQuery) {
                // Use DataOptimizer's search with category filter
                const category = this.currentCategory === 'All' ? 'all' : this.currentCategory;
                mechanics = dataOptimizer.searchItems('mechanics', this.searchQuery, category);
                
                // Filter favorites if needed
                if (this.currentCategory === 'Favorites') {
                    mechanics = this.favoritesManager.filterFavorites(mechanics, 'id');
                }
            } else {
                // Get items by category (O(1) for category lookup)
                const category = this.currentCategory === 'All' ? 'all' : this.currentCategory;
                mechanics = dataOptimizer.getItemsByCategory('mechanics', category);
            }
            
            // Cache the result
            this.searchCache.set(cacheKey, mechanics);
        }
        
        // Update category counts
        this.updateCategoryCounts();

        if (mechanics.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No mechanics found matching your search.</div>';
            return;
        }

        // Note: Virtual scrolling disabled for grid layouts to preserve multi-column CSS grid
        // The grid layout is more important for UX than virtual scrolling performance

        listContainer.innerHTML = mechanics.map(mechanic => 
            this.renderMechanicCard(mechanic)
        ).join('');

        this.setupMechanicEventDelegation(listContainer);
    }

    /**
     * Render a single mechanic card
     */
    renderMechanicCard(mechanic) {
        const badges = [];
        const isFavorite = this.isFavorite(mechanic.id);
        
        if (mechanic.attributes && mechanic.attributes.length > 0) {
            badges.push(`<span class="mechanic-badge attributes">${mechanic.attributes.length} attributes</span>`);
        }

        const aliasesHTML = mechanic.aliases && mechanic.aliases.length > 0
            ? `<div class="mechanic-aliases"><strong>Aliases:</strong> ${mechanic.aliases.join(', ')}</div>`
            : '';

        const examplesHTML = mechanic.examples && mechanic.examples.length > 0
            ? `<div class="mechanic-examples"><code>${mechanic.examples[0]}</code></div>`
            : '';

        return `
            <div class="condition-card" data-mechanic="${mechanic.id}">
                    <div class="condition-card-header">
                        <h4>${mechanic.name}</h4>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button class="btn-icon btn-favorite" data-mechanic-id="${mechanic.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                <i class="${isFavorite ? 'fas' : 'far'} fa-star" style="color: ${isFavorite ? '#ffc107' : '#666'}; ${isFavorite ? 'animation: starGlow 1.5s ease-in-out infinite;' : ''}"></i>
                            </button>
                            <span class="condition-category-badge">${mechanic.category}</span>
                        </div>
                    </div>
                    <div class="condition-card-body">
                        <p class="condition-card-description">${mechanic.description}</p>
                        ${mechanic.aliases && mechanic.aliases.length > 0 ? `
                            <div class="condition-aliases">
                                <strong>Aliases:</strong> ${mechanic.aliases.join(', ')}
                            </div>
                    ` : ''}
                    ${mechanic.examples && mechanic.examples.length > 0 ? `
                        <div class="condition-example">
                            <code>${mechanic.examples[0]}</code>
                        </div>
                    ` : ''}
                </div>
                <div class="condition-card-footer">
                    <button class="btn btn-primary btn-select-mechanic">Select</button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event delegation for mechanic cards
     */
    setupMechanicEventDelegation(listContainer) {
        // Event delegation - single listener for select buttons (favorites already delegated)
        if (this.selectMechanicHandler) {
            listContainer.removeEventListener('click', this.selectMechanicHandler);
        }

        this.selectMechanicHandler = (e) => {
            const selectBtn = e.target.closest('.btn-select-mechanic');
            if (selectBtn) {
                const card = selectBtn.closest('.condition-card');
                const mechanicId = card.dataset.mechanic;
                const mechanic = MECHANICS_DATA.getMechanic(mechanicId);
                if (mechanic) {
                    this.saveRecentMechanic(mechanicId);
                    this.showMechanicConfiguration(mechanic);
                }
            }
        };

        listContainer.addEventListener('click', this.selectMechanicHandler);
    }

    /**
     * Update category tab counts (using pre-computed counts - O(1))
     */
    updateCategoryCounts() {
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) return;
        
        const categoryTabs = document.querySelectorAll('.category-tab');
        
        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;
            let count;
            
            if (category === 'All') {
                count = dataOptimizer.getCategoryCount('mechanics', 'all');
            } else if (category === 'Favorites') {
                count = this.favoritesManager.getCount();
            } else {
                count = dataOptimizer.getCategoryCount('mechanics', category);
            }
            
            // Extract the label text (icon + name)
            const textContent = tab.textContent.trim();
            const labelMatch = textContent.match(/^(.+?)(\s*\(\d+\))?$/);
            const label = labelMatch ? labelMatch[1].trim() : textContent;
            
            // Update with count
            tab.textContent = `${label} (${count})`;
        });
    }

    /**
     * Render quick access panel (favorites and recent)
     */
    renderQuickAccess() {
        const quickAccessContainer = document.getElementById('mechanicQuickAccess');
        const favoritesSection = document.getElementById('favoritesSection');
        const recentSection = document.getElementById('recentSection');
        const favoritesList = document.getElementById('favoritesList');
        const recentList = document.getElementById('recentList');

        // Get mechanics using DataOptimizer for O(1) lookup
        const dataOptimizer = window.DataOptimizer;
        const favoriteIds = this.favoritesManager.getAll();
        const favoriteMechanics = favoriteIds
            .map(id => dataOptimizer ? dataOptimizer.getItem('mechanics', id) : MECHANICS_DATA.getMechanic(id))
            .filter(m => m);
        
        const recentMechanics = this.recentMechanics
            .map(item => dataOptimizer ? dataOptimizer.getItem('mechanics', item.id) : MECHANICS_DATA.getMechanic(item.id))
            .filter(m => m)
            .slice(0, 5); // Show last 5

        // Render favorites
        if (favoritesSection && favoritesList) {
            if (favoriteMechanics.length > 0) {
                favoritesSection.style.display = 'block';
                favoritesList.innerHTML = favoriteMechanics.map(mechanic => `
                    <button class="quick-mechanic-item ${mechanic.category}" data-mechanic="${mechanic.id}">
                        <span class="quick-mechanic-name">${mechanic.name}</span>
                        <span class="quick-mechanic-category">${MECHANICS_DATA.categories[mechanic.category].icon}</span>
                    </button>
                `).join('');

                // Attach click handlers
                favoritesList.querySelectorAll('.quick-mechanic-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const mechanicId = item.dataset.mechanic;
                        const mechanic = MECHANICS_DATA.getMechanic(mechanicId);
                        if (mechanic) {
                            this.showMechanicConfiguration(mechanic);
                        }
                    });
                });
            } else {
                favoritesSection.style.display = 'none';
                favoritesList.innerHTML = '';
            }
        }

        // Render recent
        if (recentSection && recentList) {
            if (recentMechanics.length > 0) {
                recentSection.style.display = 'block';
                recentList.innerHTML = recentMechanics.map(mechanic => `
                    <button class="quick-mechanic-item ${mechanic.category}" data-mechanic="${mechanic.id}">
                        <span class="quick-mechanic-name">${mechanic.name}</span>
                        <span class="quick-mechanic-category">${MECHANICS_DATA.categories[mechanic.category].icon}</span>
                    </button>
                `).join('');

                // Attach click handlers
                recentList.querySelectorAll('.quick-mechanic-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const mechanicId = item.dataset.mechanic;
                        const mechanic = MECHANICS_DATA.getMechanic(mechanicId);
                        if (mechanic) {
                            this.showMechanicConfiguration(mechanic);
                        }
                    });
                });
            } else {
                recentSection.style.display = 'none';
                recentList.innerHTML = '';
            }
        }

        // Show/hide entire quick access panel
        if (quickAccessContainer) {
            if ((favoritesSection && favoriteMechanics.length > 0) || (recentSection && recentMechanics.length > 0)) {
                quickAccessContainer.style.display = 'block';
            } else {
                quickAccessContainer.style.display = 'none';
            }
        }
    }

    /**
     * Render mechanic attributes form
     */
    renderMechanicAttributes() {
        const formContainer = document.getElementById('mechanicAttributesForm');
        
        if (!this.currentMechanic || !this.currentMechanic.attributes || this.currentMechanic.attributes.length === 0) {
            formContainer.innerHTML = '<p class="no-attributes">This mechanic has no configurable attributes.</p>';
            return;
        }

        formContainer.innerHTML = this.currentMechanic.attributes.map(attr => {
            const aliases = attr.alias && (Array.isArray(attr.alias) ? attr.alias : [attr.alias]);
            const aliasText = aliases && aliases.length > 0 ? ` (${aliases.join(', ')})` : '';
            const requiredMark = attr.required ? '<span class="required">*</span>' : '';
            const defaultText = attr.default !== undefined && attr.default !== '' ? ` [default: ${attr.default}]` : '';
            
            // Build tooltip content
            const tooltipContent = `
                <div class="attribute-tooltip-content">
                    <strong>${attr.name}</strong>
                    ${aliases && aliases.length > 0 ? `<div class="tooltip-aliases">Aliases: ${aliases.join(', ')}</div>` : ''}
                    <div class="tooltip-type">Type: ${attr.type || 'string'}</div>
                    ${attr.default !== undefined ? `<div class="tooltip-default">Default: ${attr.default}</div>` : ''}
                    <div class="tooltip-description">${attr.description}</div>
                </div>
            `.trim();
            
            let inputHTML = '';
            if (attr.type === 'boolean') {
                // Checkbox for boolean with dynamic true/false label
                const defaultChecked = attr.default === true || attr.default === 'true';
                inputHTML = `
                    <label class="checkbox-container">
                        <input type="checkbox" 
                               class="mechanic-attribute-input mechanic-attribute-checkbox" 
                               data-attr="${attr.name}"
                               data-modified="false"
                               ${defaultChecked ? 'checked' : ''}>
                        <span class="checkbox-value">${defaultChecked ? 'true' : 'false'}</span>
                    </label>
                `;
            } else if (attr.type === 'number') {
                // Number input with step detection (don't pre-fill, only placeholder)
                const step = attr.default && attr.default.toString().includes('.') ? '0.01' : '1';
                inputHTML = `
                    <input type="number" 
                           class="mechanic-attribute-input" 
                           data-attr="${attr.name}"
                           data-default="${attr.default !== undefined ? attr.default : ''}"
                           data-modified="false"
                           step="${step}"
                           placeholder="${attr.default !== undefined ? attr.default : ''}">
                `;
            } else {
                // Text input (could be string, list, etc.) - don't pre-fill, only placeholder
                inputHTML = `
                    <input type="text" 
                           class="mechanic-attribute-input" 
                           data-attr="${attr.name}"
                           data-default="${attr.default || ''}"
                           data-modified="false"
                           placeholder="${attr.default || ''}">
                `;
            }

            return `
                <div class="mechanic-attribute-field" data-tooltip="${tooltipContent.replace(/"/g, '&quot;')}">
                    <label class="attribute-label">
                        ${attr.name}${aliasText} ${requiredMark}
                        <span class="info-icon" title="Click for details">ℹ️</span>
                    </label>
                    ${inputHTML}
                    <small class="attribute-description">${attr.description}${defaultText}</small>
                </div>
            `;
        }).join('');

        // Attach input listeners
        formContainer.querySelectorAll('.mechanic-attribute-input').forEach(input => {
            if (input.type === 'checkbox') {
                // For checkboxes: update label and mark as modified
                input.addEventListener('change', (e) => {
                    const label = e.target.nextElementSibling;
                    if (label && label.classList.contains('checkbox-value')) {
                        label.textContent = e.target.checked ? 'true' : 'false';
                    }
                    e.target.dataset.modified = 'true';
                    this.updateSkillLinePreview();
                });
            } else {
                // For text/number inputs: mark as modified and update preview
                input.addEventListener('input', (e) => {
                    e.target.dataset.modified = 'true';
                    this.updateSkillLinePreview();
                });
            }
        });
    }

    // (Browser methods for targeter/trigger/condition removed - handled in Skill Line Builder)

    /**
     * Update targeter display
     */
    /**
     * Update skill line preview with validation
     */
    updateSkillLinePreview() {
        const skillLine = this.buildSkillLine();
        const previewElement = document.getElementById('skillLinePreview');
        if (previewElement) {
            previewElement.textContent = skillLine;
        }
    }

    /**
     * Build skill line string from current configuration
     */
    buildSkillLine() {
        if (!this.currentMechanic) return '- mechanic{}';

        // Build mechanic name
        let mechanicName = this.currentMechanic.name;
        if (MechanicBrowser.hasEffectPrefix(this.currentMechanic) && this.useEffectPrefix) {
            mechanicName = `effect:${mechanicName}`;
        }

        // Collect mechanic attributes (only include modified values)
        const mechanicArgs = {};
        const formContainer = document.getElementById('mechanicAttributesForm');
        if (formContainer) {
            const inputs = formContainer.querySelectorAll('.mechanic-attribute-input');
            
            inputs.forEach(input => {
                const attrName = input.dataset.attr;
                const isModified = input.dataset.modified === 'true';
                let value;
                
                if (input.type === 'checkbox') {
                    // For checkboxes: only include if checked (user wants true)
                    if (input.checked) {
                        value = 'true';
                    }
                } else {
                    // For text/number: only include if modified and not empty
                    value = input.value.trim();
                    if (!isModified || !value) {
                        return; // Skip unmodified or empty values
                    }
                }
                
                if (value) {
                    const attrDef = this.currentMechanic.attributes.find(a => a.name === attrName);
                    const key = (attrDef?.alias && Array.isArray(attrDef.alias) && attrDef.alias.length > 0) 
                        ? attrDef.alias[0] 
                        : (attrDef?.alias || attrName);
                    mechanicArgs[key] = value;
                }
            });
        }

        // Build simple mechanic string with attributes only
        let skillLine = mechanicName;
        
        const argsStr = Object.entries(mechanicArgs)
            .map(([key, value]) => `${key}=${value}`)
            .join(';');
        
        if (argsStr) {
            skillLine += `{${argsStr}}`;
        }

        return skillLine;
    }

    /**
     * Confirm configuration and return skill line
     */
    confirmConfiguration() {
        if (!this.currentMechanic) {
            // Silently return if no mechanic selected
            return;
        }

        // Build the mechanic string (just the mechanic part, not complete skill line)
        const skillLine = this.buildSkillLine();
        const parsed = SkillLineParser.parse(skillLine);
        
        // Only validate the mechanic itself, not the complete skill line
        // The Skill Line Builder will validate the complete line (including trigger requirements)
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check if mechanic exists
        if (!parsed.mechanic) {
            result.errors.push('Mechanic is required');
            result.valid = false;
        }

        // Validate mechanic arguments (if MECHANICS_DATA is available)
        if (typeof MECHANICS_DATA !== 'undefined' && parsed.mechanic) {
            const mechanicDef = MECHANICS_DATA.getMechanic(parsed.mechanic);
            if (!mechanicDef) {
                result.warnings.push(`Unknown mechanic: ${parsed.mechanic}`);
            } else {
                // Check for required attributes
                const requiredAttrs = mechanicDef.attributes.filter(attr => attr.required);
                for (const attr of requiredAttrs) {
                    const aliases = [attr.name, ...(attr.aliases || [])];
                    const hasAttr = aliases.some(alias => parsed.mechanicArgs.hasOwnProperty(alias));
                    if (!hasAttr) {
                        result.warnings.push(`Mechanic '${parsed.mechanic}' missing required attribute: ${attr.name}`);
                    }
                }
            }
        }
        
        // Check for errors
        if (result.errors.length > 0) {
            alert('Validation Error:\n\n' + result.errors.join('\n'));
            return;
        }
        
        // Warn about warnings but allow to continue
        if (result.warnings.length > 0) {
            const proceed = confirm(
                'Validation Warnings:\n\n' + 
                result.warnings.join('\n') + 
                '\n\nDo you want to continue anyway?'
            );
            if (!proceed) return;
        }
        
        // Hide overlay and reset state manually (don't call close which would trigger null callback)
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Reset to selection step for next time
        this.showMechanicSelection();
        
        // Clear state
        this.currentMechanic = null;
        
        // Call callback with the successful skill line
        const callback = this.onSelectCallback;
        this.onSelectCallback = null;
        
        if (callback) {
            callback(skillLine);
        }
    }

    /**
     * Parse skill line string (for editing)
     */
    parseSkillLine(line) {
        // Use SkillLineParser for consistent parsing
        const parsed = SkillLineParser.parse(line);
        
        if (!parsed.valid) {
            console.warn('Failed to parse skill line:', line);
            return;
        }
        
        // Set mechanic
        if (parsed.mechanic) {
            this.currentMechanic = MECHANICS_DATA.getMechanic(parsed.mechanic);
        }
        
        // Set targeter
        if (parsed.targeter) {
            this.currentTargeter = `@${parsed.targeter}`;
        }
        
        // Set trigger
        if (parsed.trigger) {
            this.currentTrigger = `~${parsed.trigger}`;
        }
        
        // Set conditions
        if (parsed.conditions && parsed.conditions.length > 0) {
            this.currentConditions = parsed.conditions.map(c => 
                c.args ? `${c.type}{${c.args}}` : c.type
            );
        }
        
        // Set chance and health modifier
        this.currentChance = parsed.chance || '';
        this.currentHealthModifier = parsed.healthModifier || '';
        
        // Populate form when rendered
        if (parsed.mechanicArgs) {
            setTimeout(() => {
                const formContainer = document.getElementById('mechanicAttributesForm');
                if (formContainer) {
                    Object.entries(parsed.mechanicArgs).forEach(([key, value]) => {
                        const input = formContainer.querySelector(`[data-attr="${key}"]`);
                        if (input) {
                            input.value = value;
                        }
                    });
                    this.updateSkillLinePreview();
                }
            }, 100);
        }
    }
    
    /**
     * Static helper to check if mechanic has effect: alias
     */
    static hasEffectPrefix(mechanic) {
        return mechanic && mechanic.aliases && mechanic.aliases.some(alias => alias.startsWith('effect:') || alias.startsWith('e:'));
    }
}

// Export for global use
window.MechanicBrowser = MechanicBrowser;
console.log('✅ MechanicBrowser component loaded');
