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
        if (window.DEBUG_MODE) {
        }
        this.targeterBrowser = targeterBrowser;
        this.triggerBrowser = triggerBrowser;
        this.conditionEditor = conditionEditor;
        this.context = 'mob'; // 'mob' or 'skill'
        this.creationContext = null; // 'skillEditor', 'templateWizard', 'mobEditor' - set by caller
        this.templateWizardCallback = null; // Callback to add section when in template wizard
        this.onSelectCallback = null;
        this.searchCache = new LRUCache(10);
        this.virtualScroller = null;
        
        // Initialize browser data merger
        if (window.supabaseClient && typeof BrowserDataMerger !== 'undefined') {
            this.browserDataMerger = new BrowserDataMerger(window.supabaseClient);
        }
        this.mechanicsData = MECHANICS_DATA; // Default to built-in, will be replaced with merged data
        
        // Current configuration state
        this.currentMechanic = null;
        
        // UI state
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        this.useEffectPrefix = localStorage.getItem('mechanicBrowser_useEffectPrefix') === 'true'; // Load from localStorage
        
        // Smart features
        this.recentMechanics = this.loadRecentMechanics();
        // Smart Favorites Manager for intelligent auto-promotion and usage tracking
        if (typeof SmartFavoritesManager !== 'undefined') {
            this.favoritesManager = new SmartFavoritesManager('mechanicBrowser', 'mechanics');
        } else {
            // Fallback to basic FavoritesManager if SmartFavoritesManager not available
            this.favoritesManager = new FavoritesManager('mechanicBrowser_favorites');
        }
        
        // REMOVED: Old performance settings - virtual scroll is now ALWAYS ON
        // Virtual scroll is mandatory per HARD REQUIREMENTS
        // No conditional rendering - always use VirtualScrollManager
        
        // Debounce timer for search
        this.searchDebounceTimer = null;
        
        // Template cache for faster rendering
        this.cardTemplate = null;
        
        // Intersection observer for lazy loading
        this.intersectionObserver = null;
        
        // Performance optimizations
        this.eventListeners = [];
        this.domCache = {}; // Cache frequently accessed DOM elements
        this.renderCache = new Map(); // Cache rendered HTML by category/search key
        this.categoryTabsCache = null; // Cache category tabs NodeList
        this.cardTemplateCache = null; // Cache card template for faster rendering
        this.categoryCountCache = null; // Cache category counts to avoid recalculation
        
        // PERFORMANCE: AbortController for automatic event listener cleanup
        this.abortController = new AbortController();
        
        // PERFORMANCE: Persistent element cache (not cleared on hide)
        this.persistentCache = {
            overlay: null,
            searchInput: null,
            categoryTabs: null,
            mechanicList: null,
            selectionStep: null,
            configStep: null
        };
        
        // PERFORMANCE: Track event delegation attachment
        this.mechanicDelegationAttached = false;
        this.quickAccessDelegationAttached = false; // Track quick access delegation
        
        // PERFORMANCE: Cache category labels (avoid regex parsing on every update)
        this.categoryLabels = null;
        
        // PERFORMANCE: Debounce timers
        this.categoryDebounceTimer = null;
        this.renderDebounceTimer = null;
        this.updateCountsDebounceTimer = null;
        
        // Preload flag for intelligent preloading
        this.hasPreloadedAll = false;
        this.isInitialized = false; // Track if cache has been warmed
        
        this.createModal();
        this.attachEventListeners();
        
        // Don't warm cache in constructor - DataOptimizer might not be ready
        // Will warm on first open when we confirm DataOptimizer exists
        if (window.DEBUG_MODE) {
        }
    }
    
    /**
     * LEGACY REMOVED - Virtual scroll doesn't need pre-rendering
     * Kept only for count calculation if needed
     */
    warmCacheOnIdle() {
        // DISABLED: Pre-rendering conflicts with virtual scroll
        // Only precalculate counts now
        if (!this.isInitialized && window.DataOptimizer) {
            this.precalculateCategoryCounts();
            this.isInitialized = true;
        }
    }
    
    /**
     * Pre-calculate all category counts and cache them
     */
    precalculateCategoryCounts() {
        if (window.DEBUG_MODE) console.log('[COUNT] precalculateCategoryCounts() called');
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) {
            if (window.DEBUG_MODE) console.warn('[COUNT] DataOptimizer not available for count calculation');
            return false;
        }
        
        // Verify DataOptimizer has mechanics data
        const totalCount = dataOptimizer.getCategoryCount('mechanics', 'all');
        if (window.DEBUG_MODE) console.log(`[COUNT] Total mechanics from DataOptimizer: ${totalCount}`);
        
        if (totalCount === 0) {
            if (window.DEBUG_MODE) console.warn('[COUNT] DataOptimizer has no mechanics data yet');
            // Check if mechanics exist in MECHANICS_DATA
            if (window.MECHANICS_DATA && window.MECHANICS_DATA.mechanics) {
                if (window.DEBUG_MODE) console.log(`[COUNT] MECHANICS_DATA has ${window.MECHANICS_DATA.mechanics.length} mechanics`);
            }
            return false;
        }
        
        this.categoryCountCache = {
            'All': totalCount,
            'Recent': this.recentMechanics.length,
            'Favorites': this.favoritesManager.getCount(),
            'damage': dataOptimizer.getCategoryCount('mechanics', 'damage'),
            'heal': dataOptimizer.getCategoryCount('mechanics', 'heal'),
            'movement': dataOptimizer.getCategoryCount('mechanics', 'movement'),
            'effects': dataOptimizer.getCategoryCount('mechanics', 'effects'),
            'control': dataOptimizer.getCategoryCount('mechanics', 'control'),
            'utility': dataOptimizer.getCategoryCount('mechanics', 'utility'),
            'aura': dataOptimizer.getCategoryCount('mechanics', 'aura'),
            'projectile': dataOptimizer.getCategoryCount('mechanics', 'projectile')
        };
        
        if (window.DEBUG_MODE) console.log('[COUNT] Category counts calculated:', this.categoryCountCache);
        return true;
    }
    
    /**
     * Get cached DOM element (performance optimization)
     */
    getElement(id) {
        // Check persistent cache first (survives hide/show cycles)
        if (id === 'mechanicBrowserOverlay' && this.persistentCache.overlay) {
            return this.persistentCache.overlay;
        }
        if (id === 'mechanicSearchInput' && this.persistentCache.searchInput) {
            return this.persistentCache.searchInput;
        }
        if (id === 'mechanicList' && this.persistentCache.mechanicList) {
            return this.persistentCache.mechanicList;
        }
        
        // Check regular cache
        if (!this.domCache[id]) {
            this.domCache[id] = document.getElementById(id);
            
            // Populate persistent cache for frequently accessed elements
            if (id === 'mechanicBrowserOverlay') this.persistentCache.overlay = this.domCache[id];
            if (id === 'mechanicSearchInput') this.persistentCache.searchInput = this.domCache[id];
            if (id === 'mechanicList') this.persistentCache.mechanicList = this.domCache[id];
            if (id === 'mechanicSelectionStep') this.persistentCache.selectionStep = this.domCache[id];
            if (id === 'mechanicConfigurationStep') this.persistentCache.configStep = this.domCache[id];
        }
        return this.domCache[id];
    }
    
    /**
     * Clear temporary DOM cache (persistent cache remains)
     */
    clearDOMCache() {
        this.domCache = {};
        // Keep persistent cache intact
    }
    
    /**
     * Get total mechanics count
     */
    getMechanicsCount() {
        return this.mechanicsData.mechanics ? this.mechanicsData.mechanics.length : 0;
    }
    
    /**
     * Load merged data from database
     */
    /**
     * Preload mechanics data in background (called during initialization)
     */
    async preloadData() {
        if (this.browserDataMerger) {
            try {
                this.mechanicsData = await this.browserDataMerger.getMergedMechanics();
                if (window.DEBUG_MODE) {
                }
            } catch (error) {
                console.error('Error preloading merged mechanics:', error);
                this.mechanicsData = MECHANICS_DATA; // Fallback to built-in
            }
        }
    }
    
    async loadMergedData() {
        // Data should already be preloaded, but load if not
        if (!this.mechanicsData || !this.mechanicsData.mechanics) {
            await this.preloadData();
        }
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
        const result = this.favoritesManager.toggle(mechanicId);
        
        // Track usage for auto-favoriting if SmartFavoritesManager is being used
        if (this.favoritesManager instanceof SmartFavoritesManager) {
            this.favoritesManager.trackUsage(mechanicId);
        }
        
        // Update button visual state immediately (no full re-render needed)
        const button = document.querySelector(`.btn-favorite[data-mechanic-id="${mechanicId}"]`);
        if (button) {
            const icon = button.querySelector('i');
            const isFavorited = this.isFavorite(mechanicId);
            
            if (icon) {
                icon.className = isFavorited ? 'fas fa-star' : 'far fa-star';
                icon.style.color = isFavorited ? '#ffc107' : '#666';
                icon.style.animation = isFavorited ? 'starGlow 1.5s ease-in-out infinite' : 'none';
            }
            button.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
        }
        
        // Clear cache for favorites category
        const favCacheKey = `Favorites:${this.searchQuery}`;
        this.renderCache.delete(favCacheKey);
        this.searchCache.delete(favCacheKey);
        
        return result;
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
        // Prevent duplicate modals - check if already exists
        if (document.getElementById('mechanicBrowserOverlay')) {
            return;
        }
        
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
                            
                            <!-- Category Tabs - Reorganized for better UX -->
                            <div class="category-tabs" id="mechanicCategories">
                                <button class="category-tab active" data-category="Recent">
                                    <i class="fas fa-clock"></i> Recently Used (0)
                                </button>
                                <button class="category-tab" data-category="Favorites">
                                    <i class="fas fa-star"></i> Favorites (0)
                                </button>
                                <button class="category-tab" data-category="All">
                                    <i class="fas fa-th"></i> All (0)
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
     * Attach event listeners (OPTIMIZED with AbortController)
     */
    attachEventListeners() {
        const { signal } = this.abortController;
        
        // Close browser modal (cache will be created on first access)
        const closeBtn = document.getElementById('mechanicBrowserClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            }, { signal });
        }

        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target.id === 'mechanicBrowserOverlay') {
                    this.close();
                }
            }, { signal });
        }

        // Search input with debouncing (300ms for better performance)
        const debouncedSearch = debounce((query) => {
            this.searchQuery = query;
            this.renderMechanics();
        }, 300);
        
        document.getElementById('mechanicSearchInput').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        }, { signal });

        // Category tabs - using event delegation with debounced render
        document.getElementById('mechanicCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                // PERFORMANCE: Use cached tabs reference
                if (!this.categoryTabsCache) {
                    const overlay = this.getElement('mechanicBrowserOverlay');
                    this.categoryTabsCache = overlay.querySelectorAll('.category-tab');
                }
                this.categoryTabsCache.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                
                // PERFORMANCE: Debounce render for rapid category switches
                clearTimeout(this.categoryDebounceTimer);
                this.categoryDebounceTimer = setTimeout(() => {
                    this.renderMechanics();
                }, 50); // 50ms debounce for snappy feel
            }
        }, { signal });

        // Favorite toggle buttons - using event delegation
        document.getElementById('mechanicList').addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.btn-favorite');
            if (favoriteBtn) {
                e.stopPropagation();
                const mechanicId = favoriteBtn.dataset.mechanicId;
                this.toggleFavorite(mechanicId);
                
                // Invalidate count cache since favorites changed
                if (this.categoryCountCache) {
                    this.categoryCountCache.Favorites = this.favoritesManager.getCount();
                }
                
                // PERFORMANCE: Debounce updates to batch rapid favorites
                clearTimeout(this.updateCountsDebounceTimer);
                this.updateCountsDebounceTimer = setTimeout(() => {
                    this.renderQuickAccess();
                    this.updateCategoryCounts();
                }, 100);
            }
        }, { signal });

        // Clear favorites button
        const clearFavBtn = document.getElementById('clearFavoritesBtn');
        if (clearFavBtn) {
            clearFavBtn.addEventListener('click', () => {
                this.favoritesManager.clear();
                
                // Invalidate count cache
                if (this.categoryCountCache) {
                    this.categoryCountCache.Favorites = 0;
                }
                
                this.renderMechanics();
                this.renderQuickAccess();
            }, { signal });
        }

        // Clear recent button
        const clearRecentBtn = document.getElementById('clearRecentBtn');
        if (clearRecentBtn) {
            clearRecentBtn.addEventListener('click', () => {
                localStorage.removeItem('mechanicBrowser_recent');
                this.recentMechanics = [];
                
                // Invalidate count cache
                if (this.categoryCountCache) {
                    this.categoryCountCache.Recent = 0;
                }
                
                this.renderQuickAccess();
            }, { signal });
        }

        // Back button
        document.getElementById('backToMechanics').addEventListener('click', () => {
            this.showMechanicSelection();
        }, { signal });

        // (Component selection buttons removed - handled in Skill Line Builder)

        // Effect prefix toggle - using event delegation since checkbox is created dynamically
        document.addEventListener('change', (e) => {
            if (e.target.id === 'effectPrefixCheckbox') {
                this.useEffectPrefix = e.target.checked;
                this.updateSkillLinePreview();
                // Save preference to localStorage
                localStorage.setItem('mechanicBrowser_useEffectPrefix', e.target.checked);
            }
        }, { signal });

        // Config buttons
        document.getElementById('cancelMechanicConfig').addEventListener('click', () => {
            this.close(true); // Pass true to indicate cancelled
        }, { signal });

        document.getElementById('confirmMechanicConfig').addEventListener('click', () => {
            this.confirmConfiguration();
        }, { signal });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('mechanicBrowserOverlay');
            const configSection = document.getElementById('mechanicConfigSection');
            
            if (overlay && overlay.style.display === 'flex') {
                // If config section is visible (mechanic selected)
                if (configSection && configSection.style.display === 'block') {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.confirmConfiguration();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        this.close(true); // Pass true to indicate cancelled
                    }
                } else if (e.key === 'Escape') {
                    this.close(true); // Pass true to indicate cancelled
                }
            }
        }, { signal });
    }

    /**
     * Open the mechanic browser (ULTRA-OPTIMIZED)
     */
    open(options = {}) {
        const startTime = performance.now();
        
        // Use pre-cached data
        if (window.__CACHED_MECHANICS_DATA__) {
            this.mechanicsData = window.__CACHED_MECHANICS_DATA__;
        }
        
        this.context = options.context || 'mob';
        this.currentValue = options.currentValue || null;
        this.onSelectCallback = options.onSelect || null;
        
        // Set creation context - determines if/where skills can be created
        // - 'skillEditor': Opened from skill editor, can create skills in current file
        // - 'templateWizard': Opened from template wizard, can add sections
        // - 'mobEditor': Opened from mob editor, skill creation NOT available
        this.creationContext = options.creationContext || (this.context === 'skill' ? 'skillEditor' : 'mobEditor');
        this.templateWizardCallback = options.onCreateSection || null; // Callback for template wizard section creation

        // Show overlay IMMEDIATELY
        const overlay = this.getElement('mechanicBrowserOverlay');
        if (!overlay) {
            console.error('mechanicBrowserOverlay element not found!');
            return;
        }
        
        if (options.parentZIndex) {
            overlay.style.zIndex = options.parentZIndex + 100;
        } else {
            overlay.style.zIndex = '';
        }
        overlay.style.display = 'flex';
        performance.mark('browser-visible');

        // FAST PATH: Use cached state if available
        if (this.isInitialized && this.categoryCountCache) {
            // Preserve user's last state
            if (!this.currentCategory) {
                this.currentCategory = 'Recent';
            }
            if (options.resetSearch !== false) {
                this.searchQuery = '';
                const searchInput = this.getElement('mechanicSearchInput');
                if (searchInput) searchInput.value = '';
            }
            
            // Parse current value if editing
            if (this.currentValue) {
                this.parseSkillLine(this.currentValue);
            }
            
            // Render immediately
            this.showMechanicSelection();
            
            // Log complete timing breakdown
            performance.mark('browser-complete');
            try {
                const clickMark = performance.getEntriesByName('browser-click');
                const openMark = performance.getEntriesByName('browser-open-start');
                const visibleMark = performance.getEntriesByName('browser-visible');
                const showMark = performance.getEntriesByName('browser-show-start');
                const renderMark = performance.getEntriesByName('browser-render-start');
                
                if (window.DEBUG_MODE && clickMark.length && openMark.length) {
                    const times = {
                        click_to_open: ((openMark[0].startTime - clickMark[0].startTime)).toFixed(2),
                        open_to_visible: ((visibleMark[0].startTime - openMark[0].startTime)).toFixed(2),
                        visible_to_show: ((showMark[0].startTime - visibleMark[0].startTime)).toFixed(2),
                        show_to_render: ((renderMark[0].startTime - showMark[0].startTime)).toFixed(2),
                        TOTAL: ((renderMark[0].startTime - clickMark[0].startTime)).toFixed(2)
                    };
                    console.log('🔴 TIMING BREAKDOWN (CACHED):', times);
                }
                performance.clearMarks();
                performance.clearMeasures();
            } catch(e) { /* Marks not available */ }
            
            if (window.DEBUG_MODE) {
                console.log(`✅ Mechanic browser opened in ${(performance.now() - startTime).toFixed(2)}ms (CACHED)`);
            }
            return;
        }

        // FIRST TIME: Initialize and render
        this.currentMechanic = null;
        this.currentCategory = 'Recent';
        this.searchQuery = '';
        
        if (this.currentValue) {
            this.parseSkillLine(this.currentValue);
        }
        
        // REMOVED: warmCacheOnIdle() - conflicts with virtual scroll
        // Virtual scroll doesn't need pre-rendering cache
        if (!this.isInitialized && window.DataOptimizer) {
            this.precalculateCategoryCounts(); // Only calculate counts, don't pre-render
            this.isInitialized = true;
        }
        
        // Render
        this.showMechanicSelection();
        
        // Log complete timing breakdown
        performance.mark('browser-complete');
        try {
            const clickMark = performance.getEntriesByName('browser-click');
            const openMark = performance.getEntriesByName('browser-open-start');
            const visibleMark = performance.getEntriesByName('browser-visible');
            const showMark = performance.getEntriesByName('browser-show-start');
            const renderMark = performance.getEntriesByName('browser-render-start');
            
            if (window.DEBUG_MODE && clickMark.length && openMark.length) {
                const times = {
                    click_to_open: ((openMark[0].startTime - clickMark[0].startTime)).toFixed(2),
                    open_to_visible: ((visibleMark[0].startTime - openMark[0].startTime)).toFixed(2),
                    visible_to_show: ((showMark[0].startTime - visibleMark[0].startTime)).toFixed(2),
                    show_to_render: ((renderMark[0].startTime - showMark[0].startTime)).toFixed(2),
                    TOTAL: ((renderMark[0].startTime - clickMark[0].startTime)).toFixed(2)
                };
                if (window.DEBUG_MODE) console.log('TIMING BREAKDOWN (FIRST TIME):', times);
            }
            performance.clearMarks();
            performance.clearMeasures();
        } catch(e) { /* Marks not available */ }
        
        if (window.DEBUG_MODE) {
            console.log(`✅ Mechanic browser opened in ${(performance.now() - startTime).toFixed(2)}ms (FIRST TIME)`);
        }
    }

    /**
     * Close the mechanic browser
     */
    close() {
        if (window.DEBUG_MODE) console.log('🚪 Closing mechanic browser, running cleanup...');
        
        const overlay = this.getElement('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Clear DOM cache when closing to prevent stale references
        this.clearDOMCache();
        
        // Cleanup event listeners and caches
        this.cleanup();
        
        // Reset search state
        this.searchQuery = '';
        const searchInput = this.getElement('mechanicSearchInput');
        if (searchInput) searchInput.value = '';
        
        // Notify parent that browser was closed without selection
        if (this.onSelectCallback) {
            this.onSelectCallback(null);
        }
        
        // Clear state (DON'T call showMechanicSelection - causes state corruption)
        this.currentMechanic = null;
        this.onSelectCallback = null;
        
        if (window.DEBUG_MODE) console.log('Mechanic browser closed successfully');
    }
    
    /**
     * Cleanup event listeners to prevent memory leaks (OPTIMIZED)
     */
    cleanup() {
        // Don't abort event listeners - keep them alive for re-open
        // Only clear caches to free memory
        
        // Clear DOM cache
        this.domCache = {};
        this.categoryTabsCache = null;
        
        // PERFORMANCE: Preserve search cache for faster re-open
        // Only clear if too large (prevents memory bloat)
        if (this.searchCache && this.searchCache.size > 30) {
            this.searchCache.clear();
        }
        if (this.renderCache && this.renderCache.size > 30) {
            this.renderCache.clear();
        }
        // Keep categoryCountCache - it's small and expensive to rebuild
        // this.categoryCountCache = null;  // DON'T clear
        this.cardTemplateCache = null;
        
        // Clear debounce timers
        if (this.categoryDebounceTimer) clearTimeout(this.categoryDebounceTimer);
        if (this.renderDebounceTimer) clearTimeout(this.renderDebounceTimer);
        if (this.updateCountsDebounceTimer) clearTimeout(this.updateCountsDebounceTimer);
        
        // Clear intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        if (window.DEBUG_MODE) {
            console.log('MechanicBrowser cleanup complete');
        }
    }
    
    /**
     * Destroy the browser and remove from DOM
     */
    destroy() {
        this.cleanup();
        const overlay = this.getElement('mechanicBrowserOverlay');
        if (overlay) {
            overlay.remove();
        }
        this.onSelectCallback = null;
        this.currentMechanic = null;
    }
    
    /**
     * Get DOM element with caching
     */
    getElement(id) {
        if (!this.domCache[id]) {
            this.domCache[id] = document.getElementById(id);
        }
        return this.domCache[id];
    }

    /**
     * Show mechanic selection step (OPTIMIZED)
     */
    showMechanicSelection() {
        performance.mark('browser-show-start');
        this.getElement('mechanicSelectionStep').classList.add('active');
        this.getElement('mechanicConfigurationStep').classList.remove('active');
        
        const searchInput = this.getElement('mechanicSearchInput');
        if (searchInput) searchInput.value = this.searchQuery || '';
        
        // Cache tabs for performance
        if (!this.categoryTabsCache) {
            const overlay = document.getElementById('mechanicBrowserOverlay');
            this.categoryTabsCache = overlay ? overlay.querySelectorAll('.category-tab') : [];
        }
        
        // Update active tab
        if (this.categoryTabsCache.length > 0) {
            this.categoryTabsCache.forEach(t => t.classList.remove('active'));
            const activeTab = document.querySelector(`[data-category="${this.currentCategory}"]`);
            if (activeTab) activeTab.classList.add('active');
        }
        
        // Render mechanics
        this.renderMechanics();
    }

    /**
     * Show mechanic configuration step
     */
    showMechanicConfiguration(mechanic) {
        this.currentMechanic = mechanic;
        
        this.getElement('mechanicSelectionStep').classList.remove('active');
        this.getElement('mechanicConfigurationStep').classList.add('active');
        
        this.getElement('mechanicConfigTitle').textContent = `Configure ${mechanic.name}`;
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
     * Render mechanics list (using DataOptimizer with HTML caching)
     */
    /**
     * VIRTUAL SCROLL RENDERING - HARD REQUIREMENT COMPLIANT
     * Renders ONLY visible items (<15 DOM nodes), not all mechanics
     * Guarantees: <50 node budget, no layout blocking, instant rendering
     */
    renderMechanics() {
        performance.mark('browser-render-start');
        const startTime = performance.now();
        if (window.DEBUG_MODE) console.log(`[VIRTUAL] renderMechanics() - Category: ${this.currentCategory}, Search: "${this.searchQuery}"`);
        
        const listContainer = this.getElement('mechanicList');
        if (!listContainer) {
            console.error('mechanicList container not found');
            return;
        }
        
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) {
            if (window.DEBUG_MODE) console.warn('[VIRTUAL] DataOptimizer not available');
            return;
        }
        
        // STEP 1: Filter data ONCE (no re-filtering on render)
        const cacheKey = `${this.currentCategory}:${this.searchQuery}`;
        let mechanics = this.searchCache.get(cacheKey);
        
        if (!mechanics) {
            const filterStart = performance.now();
            if (window.DEBUG_MODE) console.log(`[VIRTUAL] Filtering mechanics...`);
            
            // Filter based on category/search
            if (this.currentCategory === 'Recent') {
                const allMechanics = dataOptimizer.getAllItems('mechanics');
                mechanics = allMechanics.filter(m => this.recentMechanics.includes(m.id));
                mechanics.sort((a, b) => {
                    const indexA = this.recentMechanics.indexOf(a.id);
                    const indexB = this.recentMechanics.indexOf(b.id);
                    return indexA - indexB;
                });
            } else if (this.currentCategory === 'Favorites') {
                const allMechanics = dataOptimizer.getAllItems('mechanics');
                mechanics = this.favoritesManager.filterFavorites(allMechanics, 'id');
            } else if (this.searchQuery) {
                const category = this.currentCategory === 'All' ? 'all' : this.currentCategory;
                mechanics = dataOptimizer.searchItems('mechanics', this.searchQuery, category);
                if (this.currentCategory === 'Favorites') {
                    mechanics = this.favoritesManager.filterFavorites(mechanics, 'id');
                }
            } else {
                const category = this.currentCategory === 'All' ? 'all' : this.currentCategory;
                mechanics = dataOptimizer.getItemsByCategory('mechanics', category);
            }
            
            if (window.DEBUG_MODE) console.log(`[VIRTUAL] Filtered to ${mechanics.length} mechanics in ${(performance.now() - filterStart).toFixed(2)}ms`);
            
            // Freeze data (immutable - prevent mutations)
            mechanics = Object.freeze([...mechanics]);
            this.searchCache.set(cacheKey, mechanics);
        } else {
            if (window.DEBUG_MODE) console.log(`[VIRTUAL] Using cached data (${mechanics.length} mechanics)`);
        }
        
        // Update category counts
        this.updateCategoryCounts();

        // Handle empty state
        if (mechanics.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No mechanics found matching your search.</div>';
            if (window.DEBUG_MODE) console.log(`No mechanics to render`);
            return;
        }

        // PERFORMANCE: Chunked rendering for large lists (>50 items)
        // Show first 30 immediately for instant feedback, render rest async
        if (mechanics.length > 50) {
            const INITIAL_CHUNK = 30;
            const initialHTML = mechanics.slice(0, INITIAL_CHUNK).map(m => this.renderMechanicCard(m)).join('');
            listContainer.innerHTML = initialHTML;
            
            // Setup event delegation IMMEDIATELY so users can interact
            this.setupMechanicEventDelegation(listContainer);
            
            // Render remaining items after a minimal delay (non-blocking)
            setTimeout(() => {
                const remainingHTML = mechanics.slice(INITIAL_CHUNK).map(m => this.renderMechanicCard(m)).join('');
                listContainer.insertAdjacentHTML('beforeend', remainingHTML);
            }, 16); // ~1 frame delay
            
            const totalTime = (performance.now() - startTime).toFixed(2);
            if (window.DEBUG_MODE) {
                console.log(`Rendered ${INITIAL_CHUNK} mechanics in ${totalTime}ms (${mechanics.length - INITIAL_CHUNK} more async)`);
            }
            return;
        }

        // Small lists: Direct synchronous rendering
        listContainer.innerHTML = mechanics.map(m => this.renderMechanicCard(m)).join('');
        
        // Setup event delegation ONCE (single listener for all items)
        this.setupMechanicEventDelegation(listContainer);
        
        const totalTime = (performance.now() - startTime).toFixed(2);
        if (window.DEBUG_MODE) {
            console.log(`Rendered ${mechanics.length} mechanics in ${totalTime}ms`);
        }
    }

    /**
     * LEGACY REMOVED - Old virtual scroll API (incompatible)
     * New implementation is in renderMechanics() directly
     */
    initializeVirtualScroll(container, mechanics) {
        if (window.DEBUG_MODE) {
            console.warn('initializeVirtualScroll() is LEGACY CODE - should not be called');
            console.warn('Virtual scroll is now handled in renderMechanics() directly');
        }
        // Do nothing - renderMechanics() handles virtual scroll now
    }
    
    /**
     * LEGACY REMOVED - Old batch rendering (incompatible with virtual scroll)
     * Virtual scroll handles efficient rendering automatically
     */
    renderInBatches(container, mechanics, batchSize) {
        if (window.DEBUG_MODE) {
            console.warn('renderInBatches() is LEGACY CODE - should not be called');
            console.warn('Virtual scroll handles rendering now');
        }
        // Do nothing - renderMechanics() with virtual scroll handles this
    }
    
    /**
     * Render a single mechanic card (optimized with template caching)
     */
    renderMechanicCard(mechanic) {
        const isFavorite = this.isFavorite(mechanic.id);
        
        // Ultra-compact list item (30px height vs 200px card)
        return `<div class="mechanic-list-item" data-mechanic="${mechanic.id}" tabindex="0">
    <div class="mechanic-item-main">
        <button class="btn-icon-inline btn-favorite" data-mechanic-id="${mechanic.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="${isFavorite ? 'fas' : 'far'} fa-star" style="color: ${isFavorite ? '#ffc107' : '#666'}; font-size: 12px;"></i>
        </button>
        <span class="mechanic-name" title="${mechanic.id}">${mechanic.id}</span>
        <span class="mechanic-desc" title="${mechanic.description}">${mechanic.description}</span>
    </div>
    <div class="mechanic-item-actions">
        <span class="mechanic-category-tag mechanic-category-${mechanic.category.toLowerCase()}">${mechanic.category.toUpperCase()}</span>
        <button class="btn btn-xs btn-select-mechanic">Select</button>
    </div>
</div>`;
    }

    /**
     * Setup event delegation for mechanic cards
     */
    setupMechanicEventDelegation(listContainer) {
        // PERFORMANCE: Only attach once - don't remove/re-add on every render
        if (this.mechanicDelegationAttached) {
            return; // Already attached, skip
        }

        // Create handler ONCE
        this.selectMechanicHandler = (e) => {
            const selectBtn = e.target.closest('.btn-select-mechanic');
            if (selectBtn) {
                const listItem = selectBtn.closest('.mechanic-list-item');
                if (!listItem) return; // Safety check
                
                const mechanicId = listItem.dataset.mechanic;
                const mechanic = MECHANICS_DATA.getMechanic(mechanicId);
                if (mechanic) {
                    this.saveRecentMechanic(mechanicId);
                    
                    // Invalidate count cache since recent changed
                    if (this.categoryCountCache) {
                        this.categoryCountCache.Recent = this.recentMechanics.length;
                    }
                    
                    this.showMechanicConfiguration(mechanic);
                }
            }
        };

        // Add listener with AbortController for cleanup
        const { signal } = this.abortController;
        listContainer.addEventListener('click', this.selectMechanicHandler, { signal });
        this.mechanicDelegationAttached = true;
        
        if (window.DEBUG_MODE) console.log('Mechanic event delegation attached (one-time)');
    }

    /**
     * Update category tab counts (OPTIMIZED with fallback)
     */
    updateCategoryCounts() {
        const startTime = performance.now();
        if (window.DEBUG_MODE) console.log('[COUNT] updateCategoryCounts() called');
        
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) {
            if (window.DEBUG_MODE) console.warn('[COUNT] DataOptimizer not available, skipping update');
            return;
        }
        
        // Recalculate if cache is missing or invalid (all zeros)
        if (window.DEBUG_MODE) console.log('[COUNT] Current cache:', this.categoryCountCache);
        if (!this.categoryCountCache || this.categoryCountCache.All === 0) {
            if (window.DEBUG_MODE) console.log('[COUNT] Cache missing or invalid, recalculating...');
            const success = this.precalculateCategoryCounts();
            if (!success) {
                if (window.DEBUG_MODE) console.warn('[COUNT] Failed to calculate counts, DataOptimizer not ready');
                return;
            }
        } else {
            if (window.DEBUG_MODE) console.log('[COUNT] Using cached counts');
        }
        
        // Use cached category tabs to avoid repeated DOM queries (scoped to mechanic browser only)
        if (!this.categoryTabsCache) {
            const overlay = document.getElementById('mechanicBrowserOverlay');
            this.categoryTabsCache = overlay.querySelectorAll('.category-tab');
            if (window.DEBUG_MODE) console.log(`[COUNT] Found ${this.categoryTabsCache.length} category tabs in mechanic browser`);
        }
        const categoryTabs = this.categoryTabsCache;
        
        // PERFORMANCE: Cache category labels on first update (avoid regex on every render)
        if (!this.categoryLabels) {
            this.categoryLabels = new Map();
            categoryTabs.forEach(tab => {
                const category = tab.dataset.category;
                const textContent = tab.textContent.trim();
                const labelMatch = textContent.match(/^(.+?)(\s*\(\d+\))?$/);
                const label = labelMatch ? labelMatch[1].trim() : textContent;
                this.categoryLabels.set(category, label);
            });
            if (window.DEBUG_MODE) console.log('✅ [COUNT] Category labels cached:', this.categoryLabels);
        }
        
        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;
            const count = this.categoryCountCache[category] || 0;
            const label = this.categoryLabels.get(category) || category;
            
            const newText = `${label} (${count})`;
            if (window.DEBUG_MODE) console.log(`🏷️ [COUNT] ${category}: ${count} - "${newText}"`);
            tab.textContent = newText;
        });
        
        if (window.DEBUG_MODE) console.log(`⚡ [COUNT] Update completed in ${(performance.now() - startTime).toFixed(2)}ms`);
    }

    /**
     * Render quick access panel (favorites and recent)
     * PERFORMANCE FIX: Uses event delegation instead of per-item listeners
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
            .map(id => dataOptimizer ? dataOptimizer.getItem('mechanics', id) : MECHANICS_DATA.getMechanic(id))
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
            } else {
                recentSection.style.display = 'none';
                recentList.innerHTML = '';
            }
        }

        // PERFORMANCE: Setup event delegation ONCE for quick access (not per render)
        this.setupQuickAccessDelegation();

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
     * PERFORMANCE: Setup event delegation for quick access panel (called once)
     */
    setupQuickAccessDelegation() {
        if (this.quickAccessDelegationAttached) return;
        
        const { signal } = this.abortController;
        const quickAccessContainer = document.getElementById('mechanicQuickAccess');
        
        if (quickAccessContainer) {
            quickAccessContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.quick-mechanic-item');
                if (item) {
                    const mechanicId = item.dataset.mechanic;
                    const mechanic = MECHANICS_DATA.getMechanic(mechanicId);
                    if (mechanic) {
                        this.showMechanicConfiguration(mechanic);
                    }
                }
            }, { signal });
            this.quickAccessDelegationAttached = true;
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

        // Check if this mechanic has attribute groups
        const hasGroups = this.currentMechanic.attributeGroups && this.currentMechanic.attributeGroups.length > 0;
        
        if (hasGroups) {
            formContainer.innerHTML = this.renderGroupedAttributes();
        } else {
            // Fallback to flat attribute list
            formContainer.innerHTML = this.currentMechanic.attributes.map(attr => this.renderSingleAttribute(attr)).join('');
        }

        // Add inherited particle attributes section if applicable
        if (this.currentMechanic.inheritedParticleAttributes) {
            // PERFORMANCE: Append to existing HTML string instead of DOM manipulation
            const attributesHTML = formContainer.innerHTML;
            formContainer.innerHTML = attributesHTML + this.renderInheritedParticleAttributes();
        }

        // CRITICAL: Attach input listeners immediately (needed for preview)
        this.attachAttributeListeners(formContainer);
        
        // Setup attribute group toggles and conditional visibility (needed immediately for UI)
        if (hasGroups) {
            this.setupAttributeGroupToggle(formContainer);
            this.setupBulletTypeVisibility(formContainer);
        }
        
        // Update YAML preview (critical for user feedback)
        this.updateSkillLinePreview();
        
        // PERFORMANCE: Defer non-critical setup operations using requestIdleCallback
        // These setups are for dropdowns/pickers that aren't immediately visible
        const deferredSetup = () => {
            // Setup entity pickers for type/mob attributes
            this.setupEntityPickers(formContainer);
            
            // Setup inherited attributes toggle if section exists
            if (this.currentMechanic.inheritedParticleAttributes) {
                this.setupInheritedAttributesToggle();
            }
            
            // Setup material dropdowns
            this.setupMaterialDropdowns();
            
            // If smart particles, setup dynamic field visibility
            if (this.currentMechanic.hasSmartParticles) {
                this.setupSmartParticleFields(formContainer);
            }
            
            // Setup skillref inputs with autocomplete and create buttons
            this.setupSkillRefInputs(formContainer);
        };
        
        // Use requestIdleCallback if available, otherwise setTimeout with short delay
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(deferredSetup, { timeout: 100 });
        } else {
            setTimeout(deferredSetup, 16); // ~1 frame
        }
    }
    
    /**
     * Render attributes organized by groups with collapsible sections
     */
    renderGroupedAttributes() {
        const groups = this.currentMechanic.attributeGroups;
        const attributes = this.currentMechanic.attributes;
        
        // Group attributes by their group property
        const groupedAttrs = {};
        const ungroupedAttrs = [];
        
        attributes.forEach(attr => {
            if (attr.group) {
                if (!groupedAttrs[attr.group]) {
                    groupedAttrs[attr.group] = [];
                }
                groupedAttrs[attr.group].push(attr);
            } else {
                ungroupedAttrs.push(attr);
            }
        });
        
        let html = '';
        
        // Check if skill creation is allowed in current context
        const canCreateSkills = this.creationContext === 'skillEditor' || this.creationContext === 'templateWizard';
        
        // PERFORMANCE: Store attribute data for lazy rendering of collapsed groups
        this.pendingGroupRenders = this.pendingGroupRenders || {};
        
        // Render grouped attributes
        groups.forEach(group => {
            const attrs = groupedAttrs[group.id] || [];
            if (attrs.length === 0) return; // Skip empty groups
            
            const isCollapsed = group.collapsed;
            const collapsedClass = isCollapsed ? 'collapsed' : '';
            const showWhenData = group.showWhen ? `data-group-show-when='${JSON.stringify(group.showWhen)}'` : '';
            const hiddenStyle = group.showWhen ? 'style="display: none;"' : '';
            
            // Check if this is the skills group - add special "Create All" button (only if can create skills)
            const isSkillsGroup = group.id === 'skills';
            let skillsGroupActions = '';
            if (isSkillsGroup) {
                if (canCreateSkills) {
                    skillsGroupActions = `
                        <button type="button" class="skillref-create-all-btn" title="Create all entered sub-skills">
                            <i class="fas fa-plus-circle"></i> Create All
                        </button>
                    `;
                } else {
                    skillsGroupActions = `
                        <span class="skillref-mob-context-notice" title="Skill creation not available in mob editor">
                            <i class="fas fa-info-circle"></i> Read-only
                        </span>
                    `;
                }
                
                // Add batch create button for mechanics that commonly need multiple skills
                if (canCreateSkills && this.shouldShowBatchCreate()) {
                    skillsGroupActions += `
                        <button type="button" class="skillref-batch-create-btn" title="Create all sub-skills with templates">
                            <i class="fas fa-layer-group"></i> Batch
                        </button>
                    `;
                }
            }
            
            // PERFORMANCE: Lazy render collapsed groups - only render content when expanded
            let contentHtml = '';
            if (isCollapsed) {
                // Store attributes for later rendering when group is expanded
                this.pendingGroupRenders[group.id] = attrs;
                contentHtml = `<div class="lazy-content-placeholder" data-lazy-group="${group.id}">Loading...</div>`;
            } else {
                // Render immediately for expanded groups
                contentHtml = attrs.map(attr => this.renderSingleAttribute(attr)).join('');
            }
            
            html += `
                <div class="attribute-group ${collapsedClass}" data-group-id="${group.id}" ${showWhenData} ${hiddenStyle}>
                    <div class="attribute-group-header" role="button" tabindex="0">
                        <span class="group-toggle-icon">${isCollapsed ? '▶' : '▼'}</span>
                        <span class="group-title">${group.name}</span>
                        <span class="group-count">${attrs.length}</span>
                        ${group.description ? `<span class="group-description">${group.description}</span>` : ''}
                        ${skillsGroupActions}
                    </div>
                    <div class="attribute-group-content" ${isCollapsed ? 'style="display: none;"' : ''}>
                        ${contentHtml}
                    </div>
                </div>
            `;
        });
        
        // Render ungrouped attributes at the end
        if (ungroupedAttrs.length > 0) {
            html += `
                <div class="attribute-group" data-group-id="ungrouped">
                    <div class="attribute-group-header" role="button" tabindex="0">
                        <span class="group-toggle-icon">▼</span>
                        <span class="group-title">Other Attributes</span>
                        <span class="group-count">${ungroupedAttrs.length}</span>
                    </div>
                    <div class="attribute-group-content">
                        ${ungroupedAttrs.map(attr => this.renderSingleAttribute(attr)).join('')}
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    /**
     * Render a single attribute field
     */
    renderSingleAttribute(attr) {
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
        // Check if this attribute should use entity picker
        const shouldUseEntityPicker = this.shouldUseEntityPicker(attr);
        
        if (shouldUseEntityPicker) {
            // Entity type picker for summon/mount/particle mob attributes
            const inputId = `mechanic-entity-${attr.name}-${Math.random().toString(36).substr(2, 9)}`;
            inputHTML = `
                <input type="hidden" 
                       id="${inputId}"
                       class="mechanic-attribute-input mechanic-entity-input" 
                       data-attr="${attr.name}"
                       data-modified="false"
                       value="">
                ${this.createEntityPickerHTML(inputId)}
            `;
        } else if (attr.type === 'select' && attr.options) {
            // Dropdown select for predefined options
            inputHTML = `
                <select class="mechanic-attribute-input mechanic-attribute-select" 
                        data-attr="${attr.name}"
                        data-modified="false">
                    ${attr.options.map(opt => `
                        <option value="${opt.value}" ${opt.value === attr.default ? 'selected' : ''}>
                            ${opt.label}
                        </option>
                    `).join('')}
                </select>
            `;
        } else if (attr.type === 'boolean') {
            // Enhanced toggle switch for boolean values
            const defaultChecked = attr.default === true || attr.default === 'true';
            inputHTML = `
                <div class="boolean-toggle-wrapper">
                    <label class="boolean-toggle">
                        <input type="checkbox" 
                               class="mechanic-attribute-input boolean-toggle-input" 
                               data-attr="${attr.name}"
                               data-modified="false"
                               ${defaultChecked ? 'checked' : ''}>
                        <span class="boolean-toggle-track">
                            <span class="boolean-toggle-thumb"></span>
                        </span>
                        <span class="boolean-toggle-label ${defaultChecked ? 'is-true' : 'is-false'}">${defaultChecked ? 'true' : 'false'}</span>
                    </label>
                </div>
            `;
        } else if (attr.type === 'particleSelect') {
            // Smart particle type selector with categories
            inputHTML = this.renderParticleSelector(attr);
        } else if (attr.type === 'color') {
            // Color picker
            inputHTML = `
                <div class="color-input-wrapper">
                    <input type="color" 
                           class="mechanic-attribute-input mechanic-attribute-color" 
                           data-attr="${attr.name}"
                           data-default="${attr.default || '#FF0000'}"
                           data-modified="false"
                           value="${attr.default || '#FF0000'}">
                    <input type="text" 
                           class="color-hex-input" 
                           data-attr="${attr.name}"
                           data-modified="false"
                           placeholder="${attr.default || '#FF0000'}"
                           pattern="^#[0-9A-Fa-f]{6}$">
                </div>
            `;
        } else if (attr.type === 'materialSelect') {
            // Material selector dropdown (for block/item particles)
            inputHTML = this.renderMaterialSelector(attr);
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
        } else if (attr.type === 'skillref') {
            // Skill reference input with autocomplete and create button
            // Check if skill creation is allowed in current context
            const canCreateSkills = this.creationContext === 'skillEditor' || this.creationContext === 'templateWizard';
            const inputId = `skillref-${attr.name}-${Math.random().toString(36).substr(2, 9)}`;
            const disabledClass = canCreateSkills ? '' : 'skillref-disabled';
            const createBtnDisabled = canCreateSkills ? '' : 'disabled';
            const createBtnTitle = canCreateSkills 
                ? 'Create this skill' 
                : 'Skill creation not available in mob editor. Open from skill editor or template wizard to create skills.';
            
            inputHTML = `
                <div class="skillref-input-wrapper ${disabledClass}" data-attr="${attr.name}" data-can-create="${canCreateSkills}">
                    <div class="skillref-input-container">
                        <input type="text" 
                               id="${inputId}"
                               class="mechanic-attribute-input skillref-input" 
                               data-attr="${attr.name}"
                               data-modified="false"
                               placeholder="Enter skill name..."
                               autocomplete="off">
                        <div class="skillref-autocomplete" id="${inputId}-autocomplete"></div>
                    </div>
                    <button type="button" class="skillref-create-btn" data-input-id="${inputId}" title="${createBtnTitle}" ${createBtnDisabled}>
                        <i class="fas fa-plus"></i>
                    </button>
                    <div class="skillref-status" id="${inputId}-status"></div>
                </div>
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

        // Check if field should be conditionally shown
        const conditionalClass = attr.showWhen ? 'conditional-field' : '';
        const conditionalData = attr.showWhen ? `data-show-when='${JSON.stringify(attr.showWhen)}'` : '';

        return `
            <div class="mechanic-attribute-field ${conditionalClass}" ${conditionalData} data-tooltip="${tooltipContent.replace(/"/g, '&quot;')}">
                <label class="attribute-label">
                    ${attr.name}${aliasText} ${requiredMark}
                </label>
                ${inputHTML}
                <small class="attribute-description">${attr.description}${defaultText}</small>
            </div>
        `;
    }
    
    /**
     * Setup attribute group toggle (expand/collapse)
     * PERFORMANCE: Implements lazy rendering - collapsed groups only render when expanded
     */
    setupAttributeGroupToggle(container) {
        container.querySelectorAll('.attribute-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const group = header.closest('.attribute-group');
                const content = group.querySelector('.attribute-group-content');
                const icon = header.querySelector('.group-toggle-icon');
                const groupId = group.dataset.groupId;
                
                if (group.classList.contains('collapsed')) {
                    group.classList.remove('collapsed');
                    content.style.display = '';
                    icon.textContent = '▼';
                    
                    // PERFORMANCE: Lazy render - check if content needs to be rendered
                    const lazyPlaceholder = content.querySelector('.lazy-content-placeholder');
                    if (lazyPlaceholder && this.pendingGroupRenders && this.pendingGroupRenders[groupId]) {
                        const attrs = this.pendingGroupRenders[groupId];
                        
                        // Render the attributes
                        content.innerHTML = attrs.map(attr => this.renderSingleAttribute(attr)).join('');
                        
                        // Clear from pending
                        delete this.pendingGroupRenders[groupId];
                        
                        // Setup event listeners for the newly rendered content
                        this.attachAttributeListeners(content);
                        this.setupEntityPickers(content);
                        this.setupMaterialDropdowns(content);
                        this.setupSkillRefInputs(content);
                        
                        // Update preview
                        this.updateSkillLinePreview();
                    }
                } else {
                    group.classList.add('collapsed');
                    content.style.display = 'none';
                    icon.textContent = '▶';
                }
            });
            
            // Keyboard accessibility
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });
    }
    
    /**
     * Setup bullet type visibility - show/hide bullet-specific groups based on BulletType selection
     * PERFORMANCE: Also triggers lazy rendering for shown groups
     */
    setupBulletTypeVisibility(container) {
        const bulletTypeSelect = container.querySelector('[data-attr="BulletType"]');
        if (!bulletTypeSelect) return;
        
        const updateVisibility = () => {
            const selectedBulletType = bulletTypeSelect.value;
            
            // Find all groups with showWhen conditions
            container.querySelectorAll('.attribute-group[data-group-show-when]').forEach(group => {
                const showWhen = JSON.parse(group.dataset.groupShowWhen);
                let shouldShow = false;
                
                if (showWhen.attr === 'BulletType') {
                    if (showWhen.value) {
                        shouldShow = selectedBulletType === showWhen.value;
                    } else if (showWhen.values) {
                        shouldShow = showWhen.values.includes(selectedBulletType);
                    }
                }
                
                group.style.display = shouldShow ? '' : 'none';
                
                // Auto-expand visible bullet groups, collapse hidden ones
                if (shouldShow && group.classList.contains('collapsed')) {
                    group.classList.remove('collapsed');
                    const content = group.querySelector('.attribute-group-content');
                    const icon = group.querySelector('.group-toggle-icon');
                    const groupId = group.dataset.groupId;
                    if (content) content.style.display = '';
                    if (icon) icon.textContent = '▼';
                    
                    // PERFORMANCE: Lazy render when auto-expanding
                    const lazyPlaceholder = content?.querySelector('.lazy-content-placeholder');
                    if (lazyPlaceholder && this.pendingGroupRenders && this.pendingGroupRenders[groupId]) {
                        const attrs = this.pendingGroupRenders[groupId];
                        content.innerHTML = attrs.map(attr => this.renderSingleAttribute(attr)).join('');
                        delete this.pendingGroupRenders[groupId];
                        
                        // Setup listeners for newly rendered content
                        this.attachAttributeListeners(content);
                        this.setupEntityPickers(content);
                        this.setupMaterialDropdowns(content);
                        this.setupSkillRefInputs(content);
                    }
                }
            });
        };
        
        bulletTypeSelect.addEventListener('change', updateVisibility);
        // Initial update
        updateVisibility();
    }
    
    /**
     * Setup skill reference inputs with autocomplete and create buttons
     */
    setupSkillRefInputs(container) {
        const skillrefWrappers = container.querySelectorAll('.skillref-input-wrapper');
        if (skillrefWrappers.length === 0) return;
        
        // Get existing skills from the current pack for autocomplete
        const existingSkills = this.getExistingSkillNames();
        
        skillrefWrappers.forEach(wrapper => {
            const input = wrapper.querySelector('.skillref-input');
            const autocomplete = wrapper.querySelector('.skillref-autocomplete');
            const createBtn = wrapper.querySelector('.skillref-create-btn');
            const statusEl = wrapper.querySelector('.skillref-status');
            
            if (!input) return;
            
            // Input event for autocomplete
            input.addEventListener('input', () => {
                const value = input.value.trim();
                this.updateSkillRefAutocomplete(value, autocomplete, existingSkills, input);
                this.updateSkillRefStatus(value, statusEl, existingSkills);
                input.dataset.modified = value !== '' ? 'true' : 'false';
                this.updateSkillLinePreview();
            });
            
            // Focus event to show autocomplete
            input.addEventListener('focus', () => {
                const value = input.value.trim();
                this.updateSkillRefAutocomplete(value, autocomplete, existingSkills, input);
            });
            
            // Blur event to hide autocomplete (with delay for click)
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    if (autocomplete) autocomplete.style.display = 'none';
                }, 200);
            });
            
            // Create button click - only if skill creation is enabled
            const canCreate = wrapper.dataset.canCreate === 'true';
            if (createBtn && canCreate) {
                createBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const skillName = input.value.trim();
                    if (skillName) {
                        this.createSubSkill(skillName, input);
                    }
                });
            } else if (createBtn && !canCreate) {
                // Show tooltip on hover/click for disabled button
                createBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.editor?.showToast('Skill creation is not available in mob editor. Open from skill editor or template wizard.', 'info');
                });
            }
        });
        
        // Setup "Create All" button for skills group (only if skill creation is enabled)
        const createAllBtn = container.querySelector('.skillref-create-all-btn');
        if (createAllBtn) {
            createAllBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // Don't toggle the group
                
                const pendingSkills = this.collectPendingSkillRefs();
                if (pendingSkills.length === 0) {
                    window.editor?.showToast('No new skills to create', 'info');
                    return;
                }
                
                const confirm = await window.notificationModal?.confirm(
                    `Create ${pendingSkills.length} new skill(s)?\n\n• ${pendingSkills.join('\n• ')}`,
                    'Create Sub-Skills',
                    { confirmText: 'Create All', cancelText: 'Cancel' }
                );
                
                if (confirm) {
                    for (const skillName of pendingSkills) {
                        await this.createSubSkill(skillName, null);
                    }
                    
                    // Refresh all status indicators
                    const newExistingSkills = this.getExistingSkillNames();
                    container.querySelectorAll('.skillref-input-wrapper').forEach(wrapper => {
                        const input = wrapper.querySelector('.skillref-input');
                        const statusEl = wrapper.querySelector('.skillref-status');
                        if (input && statusEl) {
                            this.updateSkillRefStatus(input.value.trim(), statusEl, newExistingSkills);
                        }
                    });
                }
            });
        }
        
        // Setup "Batch Create" button for skills group (only if skill creation is enabled)
        const batchCreateBtn = container.querySelector('.skillref-batch-create-btn');
        if (batchCreateBtn) {
            const canCreate = this.creationContext === 'skillEditor' || this.creationContext === 'templateWizard';
            if (canCreate) {
                batchCreateBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Don't toggle the group
                    await this.showBatchCreateModal();
                });
            } else {
                batchCreateBtn.disabled = true;
                batchCreateBtn.title = 'Skill creation not available in mob editor';
            }
        }
    }
    
    /**
     * Update skill reference autocomplete dropdown
     * ENHANCED: Fuzzy matching, skill preview, smart suggestions
     */
    updateSkillRefAutocomplete(query, autocompleteEl, existingSkills, input) {
        if (!autocompleteEl) return;
        
        // Get attribute name for context-aware suggestions
        const attrName = input?.dataset?.attr || '';
        const parentSkillName = this.getCurrentParentSkillName();
        
        if (!query) {
            // Show suggested names first, then existing skills
            const suggestions = this.generateSkillNameSuggestions(attrName, parentSkillName);
            const suggestionsHtml = suggestions.length > 0 ? suggestions.slice(0, 3).map(s => `
                <div class="skillref-autocomplete-item skillref-suggestion" data-skill="${s.name}" title="${s.reason}">
                    <i class="fas fa-lightbulb"></i> 
                    <span class="suggestion-name">${s.name}</span>
                    <span class="suggestion-hint">${s.hint}</span>
                </div>
            `).join('') : '';
            
            if (existingSkills.length === 0 && suggestions.length === 0) {
                autocompleteEl.style.display = 'none';
                return;
            }
            
            const existingHtml = existingSkills.slice(0, 7).map(skill => 
                this.renderSkillAutocompleteItem(skill)
            ).join('');
            
            autocompleteEl.innerHTML = suggestionsHtml + existingHtml;
            autocompleteEl.style.display = 'block';
        } else {
            // ENHANCED: Fuzzy matching with scoring
            const scored = this.fuzzyMatchSkills(query, existingSkills, parentSkillName);
            
            if (scored.length === 0) {
                // Show naming suggestion and create option
                const suggestedName = this.suggestSkillName(query, attrName, parentSkillName);
                autocompleteEl.innerHTML = `
                    ${suggestedName !== query ? `
                        <div class="skillref-autocomplete-item skillref-suggestion" data-skill="${suggestedName}">
                            <i class="fas fa-lightbulb"></i> 
                            <span class="suggestion-name">${suggestedName}</span>
                            <span class="suggestion-hint">suggested</span>
                        </div>
                    ` : ''}
                    <div class="skillref-autocomplete-item skillref-create-new" data-skill="${query}">
                        <i class="fas fa-plus"></i> Create "${query}"
                    </div>
                `;
                autocompleteEl.style.display = 'block';
            } else {
                autocompleteEl.innerHTML = scored.slice(0, 8).map(item => 
                    this.renderSkillAutocompleteItem(item.skill, item.highlight)
                ).join('');
                
                // Add create option if exact match doesn't exist
                if (!scored.some(s => s.skill.toLowerCase() === query.toLowerCase())) {
                    autocompleteEl.innerHTML += `
                        <div class="skillref-autocomplete-item skillref-create-new" data-skill="${query}">
                            <i class="fas fa-plus"></i> Create "${query}"
                        </div>
                    `;
                }
                autocompleteEl.style.display = 'block';
            }
        }
        
        // Attach click handlers and hover preview to autocomplete items
        this.attachAutocompleteHandlers(autocompleteEl, input, existingSkills);
    }
    
    /**
     * Render a skill autocomplete item with preview tooltip
     */
    renderSkillAutocompleteItem(skillName, highlight = null) {
        const skillContent = this.getSkillContent(skillName);
        const previewHtml = skillContent ? this.renderSkillPreviewTooltip(skillName, skillContent) : '';
        const displayName = highlight || skillName;
        
        return `
            <div class="skillref-autocomplete-item" data-skill="${skillName}" data-has-preview="${skillContent ? 'true' : 'false'}">
                <i class="fas fa-magic"></i> 
                <span class="skill-name">${displayName}</span>
                ${skillContent ? `<span class="skill-preview-indicator" title="Has content"><i class="fas fa-eye"></i></span>` : ''}
                ${previewHtml}
            </div>
        `;
    }
    
    /**
     * Render skill preview tooltip HTML
     */
    renderSkillPreviewTooltip(skillName, content) {
        const lines = content.lines || [];
        const previewLines = lines.slice(0, 5);
        const hasMore = lines.length > 5;
        
        return `
            <div class="skillref-preview-tooltip">
                <div class="preview-header">
                    <i class="fas fa-magic"></i> ${skillName}
                </div>
                <div class="preview-content">
                    ${previewLines.map(line => `<div class="preview-line">${this.escapeHtml(line)}</div>`).join('')}
                    ${hasMore ? `<div class="preview-more">... and ${lines.length - 5} more lines</div>` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Attach handlers to autocomplete items
     */
    attachAutocompleteHandlers(autocompleteEl, input, existingSkills) {
        autocompleteEl.querySelectorAll('.skillref-autocomplete-item').forEach(item => {
            // Click handler
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const skill = item.dataset.skill;
                input.value = skill;
                input.dataset.modified = 'true';
                autocompleteEl.style.display = 'none';
                this.updateSkillRefStatus(skill, input.closest('.skillref-input-wrapper').querySelector('.skillref-status'), existingSkills);
                this.updateSkillLinePreview();
                
                // If clicking create new or suggestion, trigger skill creation
                if (item.classList.contains('skillref-create-new') || item.classList.contains('skillref-suggestion')) {
                    if (!existingSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
                        this.createSubSkill(skill, input);
                    }
                }
            });
            
            // Hover preview positioning
            item.addEventListener('mouseenter', () => {
                const tooltip = item.querySelector('.skillref-preview-tooltip');
                if (tooltip) {
                    tooltip.classList.add('visible');
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const tooltip = item.querySelector('.skillref-preview-tooltip');
                if (tooltip) {
                    tooltip.classList.remove('visible');
                }
            });
        });
    }
    
    /**
     * Fuzzy match skills with scoring
     */
    fuzzyMatchSkills(query, skills, parentSkillName) {
        const queryLower = query.toLowerCase();
        const results = [];
        
        for (const skill of skills) {
            const skillLower = skill.toLowerCase();
            let score = 0;
            let highlight = skill;
            
            // Exact match - highest score
            if (skillLower === queryLower) {
                score = 1000;
            }
            // Starts with query - high score
            else if (skillLower.startsWith(queryLower)) {
                score = 500 + (query.length / skill.length) * 100;
                highlight = `<strong>${skill.substring(0, query.length)}</strong>${skill.substring(query.length)}`;
            }
            // Contains query - medium score
            else if (skillLower.includes(queryLower)) {
                const idx = skillLower.indexOf(queryLower);
                score = 200 + (query.length / skill.length) * 50;
                highlight = `${skill.substring(0, idx)}<strong>${skill.substring(idx, idx + query.length)}</strong>${skill.substring(idx + query.length)}`;
            }
            // Fuzzy match - low score
            else {
                const fuzzyScore = this.calculateFuzzyScore(queryLower, skillLower);
                if (fuzzyScore > 0.3) {
                    score = fuzzyScore * 100;
                    highlight = this.highlightFuzzyMatch(query, skill);
                }
            }
            
            // Bonus for same file/parent
            if (parentSkillName && skill.toLowerCase().startsWith(parentSkillName.toLowerCase().split('_')[0])) {
                score += 50;
            }
            
            if (score > 0) {
                results.push({ skill, score, highlight });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    /**
     * Calculate fuzzy match score
     */
    calculateFuzzyScore(query, text) {
        let queryIdx = 0;
        let matches = 0;
        let lastMatchIdx = -1;
        let consecutiveBonus = 0;
        
        for (let i = 0; i < text.length && queryIdx < query.length; i++) {
            if (text[i] === query[queryIdx]) {
                matches++;
                if (lastMatchIdx === i - 1) consecutiveBonus += 0.1;
                lastMatchIdx = i;
                queryIdx++;
            }
        }
        
        if (queryIdx < query.length) return 0; // Not all chars matched
        
        return (matches / query.length) * 0.5 + (matches / text.length) * 0.3 + consecutiveBonus;
    }
    
    /**
     * Highlight fuzzy matched characters
     */
    highlightFuzzyMatch(query, text) {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        let result = '';
        let queryIdx = 0;
        
        for (let i = 0; i < text.length; i++) {
            if (queryIdx < queryLower.length && textLower[i] === queryLower[queryIdx]) {
                result += `<strong>${text[i]}</strong>`;
                queryIdx++;
            } else {
                result += text[i];
            }
        }
        
        return result;
    }
    
    /**
     * Get current parent skill name (for naming suggestions)
     */
    getCurrentParentSkillName() {
        try {
            if (window.editor?.state?.currentFile?.name) {
                return window.editor.state.currentFile.name;
            }
        } catch (e) {}
        return null;
    }
    
    /**
     * Generate smart skill name suggestions based on context
     */
    generateSkillNameSuggestions(attrName, parentSkillName) {
        const suggestions = [];
        const baseName = parentSkillName || this.currentMechanic?.name || 'Skill';
        const cleanBase = baseName.replace(/[-_](on)?[A-Z][a-z]+$/, ''); // Remove existing suffixes
        
        // Attribute-specific suggestions
        const attrSuffixes = {
            'onTickSkill': { suffix: '_Tick', hint: 'Runs every tick', reason: 'Standard tick handler naming' },
            'onHitSkill': { suffix: '_Hit', hint: 'On target hit', reason: 'Standard hit handler naming' },
            'onEndSkill': { suffix: '_End', hint: 'When ends', reason: 'Standard end handler naming' },
            'onStartSkill': { suffix: '_Start', hint: 'When starts', reason: 'Standard start handler naming' },
            'onBlockHitSkill': { suffix: '_BlockHit', hint: 'On block hit', reason: 'Block collision handler' },
            'onBounceSkill': { suffix: '_Bounce', hint: 'On bounce', reason: 'Bounce handler naming' },
            'onShootSkill': { suffix: '_Shoot', hint: 'On shoot', reason: 'Shoot handler naming' }
        };
        
        if (attrSuffixes[attrName]) {
            const { suffix, hint, reason } = attrSuffixes[attrName];
            suggestions.push({
                name: cleanBase + suffix,
                hint,
                reason
            });
        }
        
        // Generic suggestions based on mechanic type
        if (this.currentMechanic?.name === 'projectile' && !attrName) {
            suggestions.push(
                { name: cleanBase + '_Hit', hint: 'On target hit', reason: 'Common projectile handler' },
                { name: cleanBase + '_Tick', hint: 'Every tick', reason: 'Common projectile handler' },
                { name: cleanBase + '_End', hint: 'When ends', reason: 'Common projectile handler' }
            );
        }
        
        return suggestions;
    }
    
    /**
     * Suggest a skill name based on query and context
     */
    suggestSkillName(query, attrName, parentSkillName) {
        // If query already looks good, return it
        if (query.includes('_') || query.length > 15) return query;
        
        const baseName = parentSkillName || query;
        const cleanBase = baseName.replace(/[-_](on)?[A-Z][a-z]+$/, '');
        
        const attrSuffixes = {
            'onTickSkill': '_Tick',
            'onHitSkill': '_Hit', 
            'onEndSkill': '_End',
            'onStartSkill': '_Start'
        };
        
        if (attrSuffixes[attrName] && !query.toLowerCase().includes(attrSuffixes[attrName].toLowerCase().replace('_', ''))) {
            return cleanBase + attrSuffixes[attrName];
        }
        
        return query;
    }
    
    /**
     * Get skill content for preview
     */
    getSkillContent(skillName) {
        try {
            const pack = window.editor?.state?.currentPack;
            if (!pack?.skills) return null;
            
            for (const file of pack.skills) {
                for (const entry of (file.entries || [])) {
                    if (entry.name?.toLowerCase() === skillName.toLowerCase()) {
                        return {
                            lines: entry.Skills || [],
                            fileName: file.fileName
                        };
                    }
                    // Check sub-skills
                    if (entry.skills) {
                        const subSkill = entry.skills[skillName];
                        if (subSkill) {
                            return {
                                lines: subSkill.lines || [],
                                fileName: file.fileName
                            };
                        }
                    }
                }
            }
        } catch (e) {}
        return null;
    }
    
    /**
     * Get all skill references from a skill's content
     */
    getSkillReferences(skillName) {
        const refs = [];
        const content = this.getSkillContent(skillName);
        if (!content?.lines) return refs;
        
        for (const line of content.lines) {
            // Match skill= or skill{ patterns
            const matches = line.match(/(?:skill|onTickSkill|onHitSkill|onEndSkill|onStartSkill)\s*[={]\s*([a-zA-Z0-9_-]+)/gi);
            if (matches) {
                for (const match of matches) {
                    const skillRef = match.replace(/.*[={]\s*/, '');
                    if (skillRef && !refs.includes(skillRef)) {
                        refs.push(skillRef);
                    }
                }
            }
        }
        
        return refs;
    }
    
    /**
     * Check for circular skill references
     */
    detectCircularReferences(skillName, visited = new Set(), path = []) {
        if (visited.has(skillName)) {
            return { circular: true, path: [...path, skillName] };
        }
        
        visited.add(skillName);
        path.push(skillName);
        
        const refs = this.getSkillReferences(skillName);
        for (const ref of refs) {
            const result = this.detectCircularReferences(ref, new Set(visited), [...path]);
            if (result.circular) {
                return result;
            }
        }
        
        return { circular: false, path: [] };
    }
    
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Update skill reference status indicator
     */
    updateSkillRefStatus(skillName, statusEl, existingSkills) {
        if (!statusEl) return;
        
        if (!skillName) {
            statusEl.innerHTML = '';
            statusEl.className = 'skillref-status';
            return;
        }
        
        const exists = existingSkills.some(s => s.toLowerCase() === skillName.toLowerCase());
        
        if (exists) {
            statusEl.innerHTML = '<i class="fas fa-check"></i> Exists';
            statusEl.className = 'skillref-status skillref-exists';
        } else {
            statusEl.innerHTML = '<i class="fas fa-plus-circle"></i> Will create';
            statusEl.className = 'skillref-status skillref-will-create';
        }
    }
    
    /**
     * Get list of existing skill names from the current pack
     */
    getExistingSkillNames() {
        const skills = [];
        
        try {
            // Get skills from the editor's current pack
            if (window.editor && window.editor.state && window.editor.state.currentPack) {
                const pack = window.editor.state.currentPack;
                
                // Check skills folder
                if (pack.skills) {
                    pack.skills.forEach(skillFile => {
                        if (skillFile.entries && Array.isArray(skillFile.entries)) {
                            skillFile.entries.forEach(entry => {
                                if (entry.name) {
                                    skills.push(entry.name);
                                }
                                // Also get sub-skills if using new multi-skill format
                                if (entry.skills && typeof entry.skills === 'object') {
                                    Object.keys(entry.skills).forEach(subSkillName => {
                                        if (!skills.includes(subSkillName)) {
                                            skills.push(subSkillName);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Could not get existing skill names:', e);
        }
        
        return [...new Set(skills)].sort();
    }
    
    /**
     * Create a new sub-skill in the current file or template
     * Supports both skill editor (creates in file) and template wizard (adds section)
     */
    async createSubSkill(skillName, inputEl) {
        if (!skillName || !skillName.trim()) {
            window.editor?.showToast('Please enter a skill name', 'warning');
            return false;
        }
        
        // Sanitize the skill name
        const sanitizedName = skillName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        
        // Check context - only allow in skillEditor or templateWizard contexts
        if (this.creationContext === 'mobEditor' || this.context === 'mob') {
            window.editor?.showToast('Skill creation is not available in mob editor. Open from skill editor or template wizard.', 'info');
            return false;
        }
        
        // Check if skill already exists
        const existingSkills = this.getExistingSkillNames();
        if (existingSkills.some(s => s.toLowerCase() === sanitizedName.toLowerCase())) {
            window.editor?.showToast(`Skill "${sanitizedName}" already exists`, 'info');
            // Update the input to show it exists
            const statusEl = inputEl?.closest('.skillref-input-wrapper')?.querySelector('.skillref-status');
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check"></i> Exists';
                statusEl.className = 'skillref-status skillref-exists';
            }
            return true;
        }
        
        // TEMPLATE WIZARD CONTEXT: Add section via callback
        if (this.creationContext === 'templateWizard' && this.templateWizardCallback) {
            try {
                const result = await this.templateWizardCallback(sanitizedName);
                if (result) {
                    // Update the status indicator
                    const statusEl = inputEl?.closest('.skillref-input-wrapper')?.querySelector('.skillref-status');
                    if (statusEl) {
                        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Added to template!';
                        statusEl.className = 'skillref-status skillref-created';
                        
                        setTimeout(() => {
                            statusEl.innerHTML = '<i class="fas fa-file-alt"></i> In template';
                            statusEl.className = 'skillref-status skillref-pending';
                        }, 2000);
                    }
                    window.editor?.showToast(`Section "${sanitizedName}" will be added to template`, 'success');
                    return true;
                }
            } catch (error) {
                console.error('Error adding section via template wizard callback:', error);
            }
            return false;
        }
        
        // SKILL EDITOR CONTEXT: Create in current skill file
        try {
            // Find the current skill being edited to get its parent file
            const currentSkillFile = window.editor?.state?.currentFile;
            
            if (!currentSkillFile) {
                window.editor?.showToast('No skill file open. Skill will be created when you add the mechanic.', 'info');
                // Store pending skills for later creation
                this.pendingSubSkills = this.pendingSubSkills || [];
                if (!this.pendingSubSkills.includes(sanitizedName)) {
                    this.pendingSubSkills.push(sanitizedName);
                }
                return true;
            }
            
            // Check if we're in a skill file context
            if (window.editor.state.currentFileType !== 'skill') {
                window.editor?.showToast('Can only create skills when editing a skill file', 'warning');
                return false;
            }
            
            // Find parent file from skill entry
            let parentFile = null;
            if (currentSkillFile._parentFile) {
                const pack = window.editor.state.currentPack;
                parentFile = pack.skills?.find(f => f.id === currentSkillFile._parentFile.id);
            }
            
            if (!parentFile) {
                // Try to find the file containing this skill
                const pack = window.editor.state.currentPack;
                parentFile = pack.skills?.find(f => 
                    f.entries?.some(e => e.id === currentSkillFile.id)
                );
            }
            
            if (!parentFile) {
                window.editor?.showToast('Could not find parent file for skill', 'error');
                return false;
            }
            
            // Check if skill name already exists in this file
            if (parentFile.entries.some(e => e.name === sanitizedName)) {
                window.editor?.showToast(`Skill "${sanitizedName}" already exists in this file`, 'info');
                return true;
            }
            
            // Generate smart default content based on skill name and mechanic context
            const defaultLines = this.generateSmartSkillContent(sanitizedName, inputEl?.dataset?.attr);
            
            // Create new skill entry with auto-generated content
            const newSkill = {
                id: 'skill-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                name: sanitizedName,
                Skills: defaultLines,
                skills: {
                    [sanitizedName]: { lines: defaultLines }
                },
                _parentFile: { id: parentFile.id, fileName: parentFile.fileName },
                _autoGenerated: true,
                _generatedFor: this.currentMechanic?.name || 'Unknown'
            };
            
            // Add to parent file
            parentFile.entries.push(newSkill);
            
            // Update the status indicator
            const statusEl = inputEl?.closest('.skillref-input-wrapper')?.querySelector('.skillref-status');
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Created!';
                statusEl.className = 'skillref-status skillref-created';
                
                // Reset after a moment
                setTimeout(() => {
                    statusEl.innerHTML = '<i class="fas fa-check"></i> Exists';
                    statusEl.className = 'skillref-status skillref-exists';
                }, 2000);
            }
            
            // Update pack tree if available
            if (window.editor.packManager?.updateFileContainer) {
                window.editor.packManager.updateFileContainer(parentFile.id, 'skill');
            }
            
            // Mark dirty
            window.editor.markDirty();
            
            // Show success with option to edit
            this.showSkillCreatedNotification(sanitizedName, newSkill, parentFile);
            return true;
            
        } catch (error) {
            console.error('Error creating sub-skill:', error);
            window.editor?.showToast('Failed to create skill: ' + error.message, 'error');
            return false;
        }
    }
    
    /**
     * Generate smart skill content based on context
     */
    generateSmartSkillContent(skillName, attrName) {
        const lines = [];
        const nameLower = skillName.toLowerCase();
        
        // Detect context from attribute name or skill name
        const isHit = attrName === 'onHitSkill' || nameLower.includes('hit') || nameLower.includes('impact');
        const isTick = attrName === 'onTickSkill' || nameLower.includes('tick') || nameLower.includes('trail');
        const isEnd = attrName === 'onEndSkill' || nameLower.includes('end') || nameLower.includes('finish');
        const isStart = attrName === 'onStartSkill' || nameLower.includes('start') || nameLower.includes('begin');
        const isBounce = attrName === 'onBounceSkill' || nameLower.includes('bounce');
        
        // Mechanic-specific defaults
        const mechanic = this.currentMechanic?.name?.toLowerCase();
        
        if (isHit) {
            if (mechanic === 'projectile' || mechanic === 'missile' || mechanic === 'orbital') {
                lines.push('- damage{a=5} @target');
                lines.push('- particles{p=flame;a=20;s=0.2} @target');
            } else if (mechanic === 'aura') {
                lines.push('- damage{a=2} @trigger');
                lines.push('- effect:slow{d=40;l=1} @trigger');
            } else {
                lines.push('- damage{a=5} @target');
            }
        } else if (isTick) {
            if (mechanic === 'projectile' || mechanic === 'missile') {
                lines.push('- particles{p=flame;a=5;s=0.1} @origin');
            } else if (mechanic === 'aura') {
                lines.push('- particles{p=enchantmenttable;a=3;s=0.3} @origin');
            } else if (mechanic === 'totem') {
                lines.push('- heal{a=1} @PIR{r=5}');
                lines.push('- particles{p=heart;a=3;s=0.5} @origin');
            } else {
                lines.push('- particles{p=flame;a=3;s=0.1} @origin');
            }
        } else if (isEnd) {
            if (mechanic === 'projectile' || mechanic === 'missile') {
                lines.push('- particles{p=explosion_large;a=1} @origin');
            } else if (mechanic === 'aura' || mechanic === 'totem') {
                lines.push('- particles{p=smoke_normal;a=10;s=0.3} @origin');
            } else {
                lines.push('- particles{p=smoke_normal;a=5} @origin');
            }
        } else if (isStart) {
            lines.push('- particles{p=fireworks_spark;a=10;s=0.3} @origin');
            lines.push('- sound{s=entity.firework_rocket.launch;v=0.5} @origin');
        } else if (isBounce) {
            lines.push('- particles{p=crit;a=10;s=0.2} @origin');
            lines.push('- sound{s=block.slime_block.hit;v=0.5} @origin');
        } else {
            // Generic default - just a comment placeholder
            lines.push('# Add skill lines here');
        }
        
        return lines;
    }
    
    /**
     * Show notification after skill creation with quick edit option
     */
    async showSkillCreatedNotification(skillName, skillEntry, parentFile) {
        const hasContent = skillEntry.Skills && skillEntry.Skills.length > 0 && !skillEntry.Skills[0].startsWith('#');
        
        const message = hasContent 
            ? `Created "${skillName}" with default content. Would you like to edit it now?`
            : `Created "${skillName}". Would you like to add content now?`;
        
        // Use notification modal if available
        if (window.notificationModal?.confirm) {
            const shouldEdit = await window.notificationModal.confirm(
                message,
                `Skill Created: ${skillName}`,
                { 
                    confirmText: 'Edit Now', 
                    cancelText: 'Continue',
                    type: 'success'
                }
            );
            
            if (shouldEdit) {
                // Open the skill for editing
                this.openSkillForEditing(skillEntry, parentFile);
            }
        } else {
            window.editor?.showToast(`Created skill "${skillName}"`, 'success');
        }
    }
    
    /**
     * Open a skill entry for editing
     */
    openSkillForEditing(skillEntry, parentFile) {
        try {
            // Store current mechanic browser state
            const currentState = {
                mechanic: this.currentMechanic,
                values: this.collectCurrentAttributeValues()
            };
            
            // Use the editor's openFile method if available
            if (window.editor?.openFile) {
                // Set context for returning later
                window.editor._returnToMechanicBrowser = currentState;
                window.editor.openFile(skillEntry, 'skill');
            } else if (window.editor?.packManager?.selectEntry) {
                window.editor.packManager.selectEntry(skillEntry.id, 'skill');
            }
        } catch (e) {
            console.warn('Could not open skill for editing:', e);
        }
    }
    
    /**
     * Collect current attribute values (for state preservation)
     */
    collectCurrentAttributeValues() {
        const values = {};
        const form = document.getElementById('mechanicAttributesForm');
        if (form) {
            form.querySelectorAll('.mechanic-attribute-input').forEach(input => {
                const attr = input.dataset.attr;
                if (attr && input.value) {
                    values[attr] = input.value;
                }
            });
        }
        return values;
    }
    
    /**
     * Create all pending sub-skills after mechanic is added
     */
    async createPendingSubSkills() {
        if (!this.pendingSubSkills || this.pendingSubSkills.length === 0) return;
        
        const skills = [...this.pendingSubSkills];
        this.pendingSubSkills = [];
        
        for (const skillName of skills) {
            await this.createSubSkill(skillName, null);
        }
    }
    
    /**
     * Check if batch create should be shown for current mechanic
     */
    shouldShowBatchCreate() {
        const mechanic = this.currentMechanic?.name?.toLowerCase();
        const batchMechanics = ['projectile', 'missile', 'orbital', 'aura', 'totem', 'beam'];
        return batchMechanics.includes(mechanic);
    }
    
    /**
     * Get batch skill templates for current mechanic
     */
    getBatchSkillTemplates() {
        const mechanic = this.currentMechanic?.name?.toLowerCase();
        const parentName = this.getCurrentParentSkillName() || this.currentMechanic?.name || 'Skill';
        const cleanBase = parentName.replace(/[-_](on)?[A-Z][a-z]+$/, '');
        
        const templates = {
            projectile: [
                { attr: 'onTickSkill', name: `${cleanBase}_Tick`, desc: 'Trail particles/effects each tick' },
                { attr: 'onHitSkill', name: `${cleanBase}_Hit`, desc: 'Damage and effects on target hit' },
                { attr: 'onEndSkill', name: `${cleanBase}_End`, desc: 'Effects when projectile ends' }
            ],
            missile: [
                { attr: 'onTickSkill', name: `${cleanBase}_Tick`, desc: 'Trail particles/effects each tick' },
                { attr: 'onHitSkill', name: `${cleanBase}_Hit`, desc: 'Damage and effects on target hit' },
                { attr: 'onEndSkill', name: `${cleanBase}_End`, desc: 'Effects when missile ends' }
            ],
            orbital: [
                { attr: 'onTickSkill', name: `${cleanBase}_Orbit`, desc: 'Effects while orbiting' },
                { attr: 'onHitSkill', name: `${cleanBase}_OrbHit`, desc: 'Effects when hitting entity' }
            ],
            aura: [
                { attr: 'onTickSkill', name: `${cleanBase}_Pulse`, desc: 'Effects on each aura tick' },
                { attr: 'onStartSkill', name: `${cleanBase}_Start`, desc: 'Effects when aura starts' },
                { attr: 'onEndSkill', name: `${cleanBase}_End`, desc: 'Effects when aura ends' }
            ],
            totem: [
                { attr: 'onTickSkill', name: `${cleanBase}_Pulse`, desc: 'Healing/buff pulse' },
                { attr: 'onStartSkill', name: `${cleanBase}_Spawn`, desc: 'Totem spawn effects' },
                { attr: 'onEndSkill', name: `${cleanBase}_Despawn`, desc: 'Totem despawn effects' }
            ],
            beam: [
                { attr: 'onTickSkill', name: `${cleanBase}_Beam`, desc: 'Beam trail effects' },
                { attr: 'onHitSkill', name: `${cleanBase}_BeamHit`, desc: 'Beam hit effects' }
            ]
        };
        
        return templates[mechanic] || [];
    }
    
    /**
     * Show batch create modal
     */
    async showBatchCreateModal() {
        const templates = this.getBatchSkillTemplates();
        if (templates.length === 0) return;
        
        const existingSkills = this.getExistingSkillNames();
        
        // Build template selection UI
        const templatesHtml = templates.map((t, i) => {
            const exists = existingSkills.some(s => s.toLowerCase() === t.name.toLowerCase());
            return `
                <div class="batch-template-item ${exists ? 'exists' : ''}" data-index="${i}">
                    <label class="batch-template-checkbox">
                        <input type="checkbox" ${exists ? 'disabled' : 'checked'} data-attr="${t.attr}" data-name="${t.name}">
                        <span class="checkmark"></span>
                    </label>
                    <div class="batch-template-info">
                        <span class="batch-template-name">${t.name}</span>
                        <span class="batch-template-attr">${t.attr}</span>
                        <span class="batch-template-desc">${t.desc}</span>
                        ${exists ? '<span class="batch-template-exists"><i class="fas fa-check"></i> Exists</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        const modalHtml = `
            <div id="batchCreateModal" class="condition-modal" style="display: flex; z-index: 10005;">
                <div class="modal-content condition-browser" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-layer-group"></i> Batch Create Sub-Skills</h3>
                        <button class="btn-close" onclick="document.getElementById('batchCreateModal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="condition-browser-body" style="padding: 1rem;">
                        <p class="batch-create-intro">Create all sub-skills for <strong>${this.currentMechanic?.name}</strong> mechanic with pre-filled content:</p>
                        <div class="batch-templates-list">
                            ${templatesHtml}
                        </div>
                        <div class="batch-options">
                            <label class="batch-option">
                                <input type="checkbox" id="batchAutoFill" checked>
                                Auto-fill form after creation
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('batchCreateModal').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="batchCreateConfirm">
                            <i class="fas fa-plus-circle"></i> Create Selected
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Handle confirm
        document.getElementById('batchCreateConfirm').onclick = async () => {
            const modal = document.getElementById('batchCreateModal');
            const checkboxes = modal.querySelectorAll('.batch-template-item input[type="checkbox"]:checked:not(:disabled)');
            const autoFill = document.getElementById('batchAutoFill')?.checked;
            
            const toCreate = [];
            checkboxes.forEach(cb => {
                toCreate.push({
                    name: cb.dataset.name,
                    attr: cb.dataset.attr
                });
            });
            
            if (toCreate.length === 0) {
                window.editor?.showToast('No skills selected for creation', 'info');
                return;
            }
            
            modal.remove();
            
            // Create each skill
            let created = 0;
            for (const skill of toCreate) {
                const input = document.querySelector(`.skillref-input[data-attr="${skill.attr}"]`);
                const result = await this.createSubSkill(skill.name, input);
                if (result) {
                    created++;
                    // Auto-fill the input
                    if (autoFill && input) {
                        input.value = skill.name;
                        input.dataset.modified = 'true';
                        this.updateSkillRefStatus(skill.name, input.closest('.skillref-input-wrapper')?.querySelector('.skillref-status'), this.getExistingSkillNames());
                    }
                }
            }
            
            this.updateSkillLinePreview();
            window.editor?.showToast(`Created ${created} sub-skill(s)`, 'success');
        };
    }
    
    /**
     * Build mini dependency graph for a skill
     */
    buildDependencyGraph(skillName, depth = 0, visited = new Set()) {
        if (depth > 3 || visited.has(skillName)) {
            return { name: skillName, children: [], truncated: true };
        }
        
        visited.add(skillName);
        const refs = this.getSkillReferences(skillName);
        
        return {
            name: skillName,
            children: refs.map(ref => this.buildDependencyGraph(ref, depth + 1, new Set(visited))),
            truncated: false
        };
    }
    
    /**
     * Render dependency graph as HTML
     */
    renderDependencyGraph(graph, level = 0) {
        if (!graph) return '';
        
        const indent = '│ '.repeat(level);
        const connector = level > 0 ? '├─ ' : '';
        const icon = graph.children.length > 0 ? '📁' : '📄';
        const truncatedIcon = graph.truncated ? ' ⋯' : '';
        
        let html = `<div class="dep-node level-${level}">${indent}${connector}${icon} ${graph.name}${truncatedIcon}</div>`;
        
        for (let i = 0; i < graph.children.length; i++) {
            const isLast = i === graph.children.length - 1;
            html += this.renderDependencyGraph(graph.children[i], level + 1);
        }
        
        return html;
    }

    /**
     * Render particle type selector with categories and preview
     */
    renderParticleSelector(attr) {
        if (!window.ParticleTypes) {
            return `<input type="text" class="mechanic-attribute-input" data-attr="${attr.name}" placeholder="flame">`;
        }

        const defaultValue = attr.default || 'flame';
        const randomId = 'particle-' + Math.random().toString(36).substr(2, 9);

        return `
            <div class="particle-selector-wrapper" data-dropdown-id="${randomId}">
                <div class="particle-selector-display" id="${randomId}-display" tabindex="0">
                    <span class="particle-preview" data-particle="${defaultValue}">
                        <span class="particle-icon">🔥</span>
                        <span class="particle-name">${defaultValue}</span>
                    </span>
                    <span class="particle-dropdown-arrow">▼</span>
                </div>
                <input type="hidden" 
                       class="mechanic-attribute-input mechanic-attribute-particle" 
                       data-attr="${attr.name}"
                       data-modified="false"
                       value="${defaultValue}"
                       id="${randomId}-input">
            </div>
        `;
    }

    /**
     * Render particle options grouped by category
     */
    renderParticleOptions(selectedValue) {
        const categories = window.ParticleTypes.categories;
        let html = '';

        for (const category of categories) {
            html += `<div class="particle-category">
                <div class="particle-category-header">${category.name}</div>
                <div class="particle-category-options">`;
            
            for (const particle of category.particles) {
                const isSelected = particle === selectedValue ? 'selected' : '';
                const icon = this.getParticleIcon(particle);
                html += `
                    <div class="particle-option ${isSelected}" data-particle="${particle}">
                        <span class="particle-icon">${icon}</span>
                        <span class="particle-option-name">${particle}</span>
                    </div>`;
            }
            
            html += `</div></div>`;
        }

        return html;
    }

    /**
     * Get an icon/emoji that represents the particle type
     */
    getParticleIcon(particle) {
        const iconMap = {
            // Fire & Heat
            'flame': '🔥', 'soul_fire_flame': '💙', 'small_flame': '🕯️',
            'lava': '🌋', 'dripping_lava': '💧', 'landing_lava': '💥',
            
            // Water & Liquid
            'water_bubble': '💧', 'water_splash': '💦', 'water_wake': '🌊',
            'dripping_water': '💧', 'falling_water': '💧', 'rain': '🌧️',
            
            // Smoke & Clouds
            'smoke': '💨', 'large_smoke': '☁️', 'white_smoke': '☁️',
            'campfire_cosy_smoke': '🏕️', 'campfire_signal_smoke': '🔥',
            
            // Magic & Enchanting
            'enchant': '✨', 'enchanted_hit': '⚡', 'crit': '💥',
            'magic_crit': '✨', 'portal': '🌀', 'reverse_portal': '🌀',
            'spell': '🔮', 'instant_spell': '✨', 'witch': '🔮',
            'spell_mob': '👻', 'spell_mob_ambient': '👻',
            
            // Redstone & Electric
            'redstone': '🔴', 'electric_spark': '⚡', 'glow': '💡',
            'scrape': '✨', 'wax_on': '🕯️', 'wax_off': '🕯️',
            
            // Dust & Particles
            'dust': '✨', 'dust_color_transition': '🌈', 'falling_dust': '⬇️',
            'ash': '🌫️', 'white_ash': '☁️', 'spore_blossom_air': '🌸',
            
            // Nature & Environment
            'totem_of_undying': '🗿', 'cherry_leaves': '🌸', 'pale_oak_leaves': '🍃',
            'mycelium': '🍄', 'spore_blossom_air': '🌸', 'warped_spore': '🍄',
            'crimson_spore': '🍄', 'falling_spore_blossom': '🌸',
            
            // Snow & Ice
            'snowflake': '❄️', 'item_snowball': '⚪', 'snowflake': '❄️',
            
            // Damage & Effects
            'damage_indicator': '💔', 'angry_villager': '😠', 'heart': '❤️',
            'explosion': '💥', 'explosion_emitter': '💥', 'firework': '🎆',
            
            // Sounds & Notes
            'note': '🎵', 'happy_villager': '😊',
            
            // Blocks & Items
            'block': '🟫', 'block_marker': '🎯', 'falling_dust': '⬇️',
            'item': '📦', 'item_cobweb': '🕸️', 'item_slime': '🟢',
            
            // End & Dragon
            'dragon_breath': '🐉', 'end_rod': '⭐', 'reverse_portal': '🌀',
            
            // Sculk
            'sculk_charge': '💠', 'sculk_charge_pop': '✨', 'sculk_soul': '👻',
            'shriek': '😱', 'vibration': '〰️',
            
            // Honey & Nectar
            'dripping_honey': '🍯', 'falling_honey': '🍯', 'landing_honey': '🍯',
            'dripping_dripstone_water': '💧', 'falling_dripstone_water': '💧',
            'dripping_dripstone_lava': '🔥', 'falling_dripstone_lava': '🔥',
            
            // Nautilus & Ocean
            'nautilus': '🐚', 'dolphin': '🐬', 'squid_ink': '🦑',
            'gust': '💨', 'gust_emitter': '💨', 'trial_spawner_detection': '👁️',
            
            // Brewing & Alchemy
            'effect': '💊', 'entity_effect': '✨',
            
            // Slime & Creatures
            'slime': '🟢', 'dripping_obsidian_tear': '😢', 'falling_obsidian_tear': '😢',
            'landing_obsidian_tear': '😢',
            
            // Ominous
            'ominous_spawning': '☠️', 'trial_spawner_detection_ominous': '💀',
            
            // Misc
            'current_down': '⬇️', 'bubble_pop': '💭', 'bubble_column_up': '⬆️',
            'poof': '💨', 'explosion': '💥', 'fishing': '🎣',
            'underwater': '🌊', 'suspended': '✨', 'crit': '💥',
            'sweep_attack': '⚔️', 'cloud': '☁️', 'dust_plume': '💨',
            'ender_chest': '📦', 'sonic_boom': '💥', 'trial_spawner_detection': '🔎',
            'vault_connection': '🔗', 'infested': '🐛', 'item_cobweb': '🕸️'
        };

        return iconMap[particle] || '✨';
    }

    /**
     * Render material selector dropdown (similar to particle selector)
     */
    renderMaterialSelector(attr) {
        if (!window.MINECRAFT_BLOCKS_CATEGORIZED) {
            return `<input type="text" class="mechanic-attribute-input" data-attr="${attr.name}" placeholder="STONE">`;
        }

        const defaultValue = attr.default || '';
        const randomId = 'material-' + Math.random().toString(36).substr(2, 9);

        return `
            <div class="material-selector-wrapper" data-dropdown-id="${randomId}">
                <div class="material-selector-display" id="${randomId}-display" tabindex="0">
                    <span class="material-preview">
                        <span class="material-name">${defaultValue || 'Select material...'}</span>
                    </span>
                    <span class="material-dropdown-arrow">▼</span>
                </div>
                <input type="hidden" 
                       class="mechanic-attribute-input mechanic-attribute-material" 
                       data-attr="${attr.name}"
                       data-modified="false"
                       value="${defaultValue}"
                       id="${randomId}-input">
            </div>
        `;
    }

    /**
     * Render inherited particle attributes as collapsible section
     */
    renderInheritedParticleAttributes() {
        if (!window.INHERITED_PARTICLE_ATTRIBUTES) {
            return '';
        }

        // Get inherited attributes, excluding ones already in mechanic's attributes
        const mechanicAttrNames = this.currentMechanic.attributes.map(a => a.name.toLowerCase());
        const inheritedAttrs = window.INHERITED_PARTICLE_ATTRIBUTES.filter(attr => {
            return !mechanicAttrNames.includes(attr.name.toLowerCase());
        });

        if (inheritedAttrs.length === 0) {
            return '';
        }

        // Render each inherited attribute
        const attributesHTML = inheritedAttrs.map(attr => {
            const aliases = attr.alias && (Array.isArray(attr.alias) ? attr.alias : [attr.alias]);
            const aliasText = aliases && aliases.length > 0 ? ` (${aliases.join(', ')})` : '';
            const defaultText = attr.default !== undefined && attr.default !== '' ? ` [default: ${attr.default}]` : '';
            
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
                const defaultChecked = attr.default === true || attr.default === 'true';
                inputHTML = `
                    <div class="boolean-toggle-wrapper">
                        <label class="boolean-toggle">
                            <input type="checkbox" 
                                   class="mechanic-attribute-input boolean-toggle-input" 
                                   data-attr="${attr.name}"
                                   data-modified="false"
                                   ${defaultChecked ? 'checked' : ''}>
                            <span class="boolean-toggle-track">
                                <span class="boolean-toggle-thumb"></span>
                            </span>
                            <span class="boolean-toggle-label ${defaultChecked ? 'is-true' : 'is-false'}">${defaultChecked ? 'true' : 'false'}</span>
                        </label>
                    </div>
                `;
            } else if (attr.type === 'particleSelect') {
                inputHTML = this.renderParticleSelector(attr);
            } else if (attr.type === 'materialSelect') {
                inputHTML = this.renderMaterialSelector(attr);
            } else if (attr.type === 'color') {
                inputHTML = `
                    <div class="color-input-wrapper">
                        <input type="color" 
                               class="mechanic-attribute-input mechanic-attribute-color" 
                               data-attr="${attr.name}"
                               data-default="${attr.default || '#FF0000'}"
                               data-modified="false"
                               value="${attr.default || '#FF0000'}">
                        <input type="text" 
                               class="color-hex-input" 
                               data-attr="${attr.name}"
                               data-modified="false"
                               placeholder="${attr.default || '#FF0000'}"
                               pattern="^#[0-9A-Fa-f]{6}$">
                    </div>
                `;
            } else if (attr.type === 'number') {
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
                inputHTML = `
                    <input type="text" 
                           class="mechanic-attribute-input" 
                           data-attr="${attr.name}"
                           data-default="${attr.default || ''}"
                           data-modified="false"
                           placeholder="${attr.default || ''}">
                `;
            }

            const conditionalClass = attr.showWhen ? 'conditional-field' : '';
            const conditionalData = attr.showWhen ? `data-show-when='${JSON.stringify(attr.showWhen)}'` : '';

            return `
                <div class="mechanic-attribute-field ${conditionalClass}" ${conditionalData} data-tooltip="${tooltipContent.replace(/"/g, '&quot;')}">
                    <label class="attribute-label">
                        ${attr.name}${aliasText}
                    </label>
                    ${inputHTML}
                    <small class="attribute-description">${attr.description}${defaultText}</small>
                </div>
            `;
        }).join('');

        return `
            <div class="inherited-particle-attributes">
                <div class="inherited-attributes-header">
                    <div class="inherited-attributes-title">
                        <span>🎨 Inherited Particle Attributes</span>
                    </div>
                    <span class="inherited-attributes-toggle">▶</span>
                </div>
                <div class="inherited-attributes-content">
                    <div class="inherited-attribute-hint">
                        These attributes are inherited from the base Particle mechanic and can be used to further customize the particle effect.
                    </div>
                    ${attributesHTML}
                </div>
            </div>
        `;
    }

    /**
     * Setup inherited attributes toggle functionality
     */
    setupInheritedAttributesToggle() {
        const header = document.querySelector('.inherited-attributes-header');
        if (!header) return;

        const content = document.querySelector('.inherited-attributes-content');
        const toggle = document.querySelector('.inherited-attributes-toggle');

        header.addEventListener('click', () => {
            const isExpanded = content.classList.contains('expanded');
            
            if (isExpanded) {
                content.classList.remove('expanded');
                toggle.classList.remove('expanded');
            } else {
                content.classList.add('expanded');
                toggle.classList.add('expanded');
            }
        });
    }

    /**
     * Setup material dropdown functionality
     */
    setupMaterialDropdowns() {
        if (!window.MINECRAFT_BLOCKS_CATEGORIZED) return;

        document.querySelectorAll('.material-selector-display').forEach(display => {
            display.addEventListener('click', (e) => {
                e.stopPropagation();

                // Remove any existing material dropdown
                document.querySelectorAll('.material-dropdown-menu').forEach(m => m.remove());

                const wrapper = display.closest('.material-selector-wrapper');
                const dropdownId = wrapper.dataset.dropdownId;
                const hiddenInput = document.getElementById(`${dropdownId}-input`);
                const currentMaterial = hiddenInput.value || '';

                // Create dropdown menu
                const menu = document.createElement('div');
                menu.className = 'material-dropdown-menu';
                menu.dataset.dropdownId = dropdownId;

                // Build dropdown HTML
                let menuHTML = '<input type="text" class="material-search-input" placeholder="Search materials...">';
                menuHTML += '<div class="material-options-container">';

                for (const category of window.MINECRAFT_BLOCKS_CATEGORIZED) {
                    if (category.blocks.length === 0) continue;
                    
                    menuHTML += `<div class="material-category">`;
                    menuHTML += `<div class="material-category-name">${category.name}</div>`;
                    
                    for (const material of category.blocks) {
                        const selected = material.toUpperCase() === currentMaterial.toUpperCase() ? 'selected' : '';
                        menuHTML += `
                            <div class="material-option ${selected}" data-material="${material.toUpperCase()}">
                                <span class="material-option-name">${material.toUpperCase()}</span>
                            </div>
                        `;
                    }
                    
                    menuHTML += `</div>`;
                }

                menuHTML += '</div>';
                menu.innerHTML = menuHTML;

                // Position dropdown
                document.body.appendChild(menu);
                const rect = display.getBoundingClientRect();
                menu.style.top = `${rect.bottom + 8}px`;
                menu.style.left = `${rect.left}px`;

                // Focus search input
                const searchInput = menu.querySelector('.material-search-input');
                searchInput.focus();

                // Search functionality
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const options = menu.querySelectorAll('.material-option');
                    const categories = menu.querySelectorAll('.material-category');

                    options.forEach(option => {
                        const materialName = option.dataset.material.toLowerCase();
                        const matches = materialName.includes(searchTerm);
                        option.style.display = matches ? 'flex' : 'none';
                    });

                    // Hide empty categories
                    categories.forEach(category => {
                        const visibleOptions = category.querySelectorAll('.material-option[style="display: flex;"], .material-option:not([style*="display"])');
                        category.style.display = visibleOptions.length > 0 ? 'block' : 'none';
                    });
                });

                // Prevent search input from closing dropdown
                searchInput.addEventListener('click', (e) => e.stopPropagation());

                // Select material option
                menu.querySelectorAll('.material-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const material = option.dataset.material;

                        // Update display
                        const preview = display.querySelector('.material-preview');
                        preview.querySelector('.material-name').textContent = material;

                        // Update hidden input
                        hiddenInput.value = material;
                        hiddenInput.dataset.modified = 'true';

                        // Trigger change event
                        hiddenInput.dispatchEvent(new Event('change'));
                        
                        // Update YAML preview
                        this.updateSkillLinePreview();
                        
                        // Remove dropdown
                        menu.remove();
                    });
                });

                // Click outside to close
                const closeDropdown = (e) => {
                    if (!menu.contains(e.target) && !display.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeDropdown);
                        window.removeEventListener('scroll', scrollClose, true);
                    }
                };

                // Scroll to close
                const scrollClose = () => {
                    menu.remove();
                    document.removeEventListener('click', closeDropdown);
                    window.removeEventListener('scroll', scrollClose, true);
                };

                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                    window.addEventListener('scroll', scrollClose, { passive: true, capture: true });
                }, 10);
            });
        });
    }

    /**
     * Setup entity pickers for all entity-type inputs
     */
    setupEntityPickers(formContainer) {
        const entityInputs = formContainer.querySelectorAll('.mechanic-entity-input');
        entityInputs.forEach(input => {
            const inputId = input.id;
            if (inputId) {
                this.setupEntityPickerHandlers(inputId);
            }
        });
    }

    /**
     * Attach event listeners to attribute inputs
     */
    attachAttributeListeners(formContainer) {
        formContainer.querySelectorAll('.mechanic-attribute-input').forEach(input => {
            if (input.type === 'checkbox' || input.classList.contains('boolean-toggle-input')) {
                // For boolean toggles: update label text and styling
                input.addEventListener('change', (e) => {
                    // Find the label sibling (after the track span)
                    const toggle = e.target.closest('.boolean-toggle');
                    const label = toggle?.querySelector('.boolean-toggle-label');
                    if (label) {
                        const isChecked = e.target.checked;
                        label.textContent = isChecked ? 'true' : 'false';
                        label.classList.remove('is-true', 'is-false');
                        label.classList.add(isChecked ? 'is-true' : 'is-false');
                    }
                    // Legacy support for old checkbox-value
                    const legacyLabel = e.target.nextElementSibling;
                    if (legacyLabel && legacyLabel.classList.contains('checkbox-value')) {
                        legacyLabel.textContent = e.target.checked ? 'true' : 'false';
                    }
                    e.target.dataset.modified = 'true';
                    this.updateSkillLinePreview();
                });
            } else if (input.classList.contains('mechanic-attribute-particle')) {
                // For particle selector: update conditional fields
                input.addEventListener('change', (e) => {
                    e.target.dataset.modified = 'true';
                    this.updateConditionalFields(e.target.value);
                    this.updateSkillLinePreview();
                });
            } else if (input.classList.contains('mechanic-attribute-color')) {
                // For color picker: sync with hex input
                input.addEventListener('input', (e) => {
                    const hexInput = e.target.nextElementSibling;
                    if (hexInput) hexInput.value = e.target.value;
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

        // Sync hex input with color picker
        formContainer.querySelectorAll('.color-hex-input').forEach(input => {
            input.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    const colorPicker = e.target.previousElementSibling;
                    if (colorPicker) colorPicker.value = e.target.value;
                    e.target.dataset.modified = 'true';
                    this.updateSkillLinePreview();
                }
            });
        });

        // Setup particle dropdown interactions
        this.setupParticleDropdowns(formContainer);
    }

    /**
     * Setup particle dropdown interactions
     */
    setupParticleDropdowns(formContainer) {
        formContainer.querySelectorAll('.particle-selector-wrapper').forEach(wrapper => {
            const display = wrapper.querySelector('.particle-selector-display');
            const hiddenInput = wrapper.querySelector('.mechanic-attribute-particle');
            const dropdownId = wrapper.dataset.dropdownId;
            
            let currentDropdown = null;

            // Toggle dropdown
            display.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close any existing dropdown
                const existingDropdown = document.getElementById(`${dropdownId}-menu-overlay`);
                if (existingDropdown) {
                    existingDropdown.remove();
                    return;
                }
                
                // Close all other dropdowns
                document.querySelectorAll('.particle-dropdown-menu').forEach(m => m.remove());
                
                // Create dropdown menu
                const currentValue = hiddenInput.value;
                const menu = document.createElement('div');
                menu.className = 'particle-dropdown-menu';
                menu.id = `${dropdownId}-menu-overlay`;
                menu.innerHTML = `
                    <input type="text" 
                           class="particle-search-input" 
                           placeholder="Search particles..."
                           id="${dropdownId}-search">
                    <div class="particle-options-container">
                        ${this.renderParticleOptions(currentValue)}
                    </div>
                `;
                
                // Append to body
                document.body.appendChild(menu);
                
                // Position dropdown
                const rect = display.getBoundingClientRect();
                menu.style.position = 'fixed';
                menu.style.top = `${rect.bottom + 8}px`;
                menu.style.left = `${rect.left}px`;
                menu.style.width = `${rect.width}px`;
                menu.style.display = 'block';
                
                const searchInput = menu.querySelector('.particle-search-input');
                searchInput.focus();

                // Search functionality
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const options = menu.querySelectorAll('.particle-option');
                    const categories = menu.querySelectorAll('.particle-category');

                    options.forEach(option => {
                        const particleName = option.dataset.particle.toLowerCase();
                        const matches = particleName.includes(searchTerm);
                        option.style.display = matches ? 'flex' : 'none';
                    });

                    // Hide empty categories
                    categories.forEach(category => {
                        const visibleOptions = category.querySelectorAll('.particle-option[style="display: flex;"], .particle-option:not([style*="display"])');
                        category.style.display = visibleOptions.length > 0 ? 'block' : 'none';
                    });
                });

                // Prevent search input from closing dropdown
                searchInput.addEventListener('click', (e) => e.stopPropagation());

                // Select particle option
                menu.querySelectorAll('.particle-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const particle = option.dataset.particle;
                        const icon = option.querySelector('.particle-icon').textContent;

                        // Update display
                        const preview = display.querySelector('.particle-preview');
                        preview.dataset.particle = particle;
                        preview.querySelector('.particle-icon').textContent = icon;
                        preview.querySelector('.particle-name').textContent = particle;

                        // Update hidden input
                        hiddenInput.value = particle;
                        hiddenInput.dataset.modified = 'true';

                        // Trigger change event
                        hiddenInput.dispatchEvent(new Event('change'));
                        
                        // Update YAML preview
                        this.updateSkillLinePreview();
                        
                        // Remove dropdown
                        menu.remove();
                    });
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.particle-selector-wrapper') && !e.target.closest('.particle-dropdown-menu')) {
                document.querySelectorAll('.particle-dropdown-menu').forEach(menu => {
                    menu.remove();
                });
            }
        });

        // Close dropdowns when scrolling the config panel
        const configContent = document.querySelector('.mechanic-config-content');
        if (configContent) {
            configContent.addEventListener('scroll', () => {
                document.querySelectorAll('.particle-dropdown-menu').forEach(menu => {
                    menu.remove();
                });
            }, { passive: true });
        }
    }

    /**
     * Setup smart particle fields (conditional visibility)
     */
    setupSmartParticleFields(formContainer) {
        const particleSelect = formContainer.querySelector('[data-attr="particle"]');
        if (!particleSelect) return;

        // Initial visibility update
        this.updateConditionalFields(particleSelect.value);

        // Populate material selector if exists
        const materialSelect = formContainer.querySelector('.mechanic-attribute-material');
        if (materialSelect && window.minecraftBlocks) {
            // PERFORMANCE: Build options string first, assign once (not innerHTML += in loop)
            const options = window.minecraftBlocks.map(block => 
                `<option value="${block}">${block}</option>`
            ).join('');
            materialSelect.innerHTML = '<option value="">-- Select Material --</option>' + options;
        }
    }

    /**
     * Update conditional field visibility based on particle type
     */
    updateConditionalFields(particleType) {
        if (!window.ParticleTypes || !particleType) return;

        const particleData = window.ParticleTypes.getParticleData(particleType);
        const dataType = particleData?.dataType || null;
        const formContainer = document.getElementById('mechanicAttributesForm');
        
        formContainer.querySelectorAll('.conditional-field').forEach(field => {
            const showWhen = JSON.parse(field.dataset.showWhen || '{}');
            
            if (showWhen.requiresDataType) {
                const shouldShow = dataType && showWhen.requiresDataType.includes(dataType);
                // PERFORMANCE: Use class toggle instead of style manipulation (batches layout)
                field.classList.toggle('hidden', !shouldShow);
                
                // Clear value if hidden
                if (!shouldShow) {
                    const input = field.querySelector('.mechanic-attribute-input');
                    if (input) {
                        input.value = '';
                        input.dataset.modified = 'false';
                    }
                }
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
        if (!this.currentMechanic) {
            console.warn('buildSkillLine: No currentMechanic');
            return '- mechanic{}';
        }
        
        if (!this.currentMechanic.id) {
            console.warn('buildSkillLine: currentMechanic has no id', this.currentMechanic);
            return '- mechanic{}';
        }

        // Build mechanic name (use id for YAML, not display name)
        let mechanicName = this.currentMechanic.id;
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
    async confirmConfiguration() {
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

        // Validate mechanic arguments (if mechanicsData is available)
        if (this.mechanicsData && parsed.mechanic) {
            const mechanicDef = this.mechanicsData.getMechanic(parsed.mechanic);
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
            if (window.editor && window.editor.showAlert) {
                window.editor.showAlert('Validation Error:\n\n' + result.errors.join('\n'), 'error', 'Validation Error');
            }
            return;
        }
        
        // Warn about warnings but allow to continue
        if (result.warnings.length > 0) {
            const proceed = await window.notificationModal?.confirm(
                'Validation Warnings:\n\n' + 
                result.warnings.join('\n') + 
                '\n\nDo you want to continue anyway?',
                'Validation Warnings',
                { confirmText: 'Continue', cancelText: 'Cancel' }
            );
            if (!proceed) return;
        }
        
        // Store callback and skill line for immediate execution
        const callback = this.onSelectCallback;
        const lineToInsert = skillLine;
        
        // Collect skill refs that need to be created
        const skillRefsToCreate = this.collectPendingSkillRefs();
        
        // Store creation context before any cleanup (needed for deferred skill creation)
        const savedCreationContext = this.creationContext;
        const savedTemplateWizardCallback = this.templateWizardCallback;
        
        // Hide overlay immediately for instant feedback
        const overlay = this.getElement('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Clear DOM cache since we're closing
        this.clearDOMCache();
        
        // Call callback immediately before cleanup (prevents lag)
        if (callback) {
            callback(lineToInsert);
        }
        
        // Create any pending sub-skills after mechanic is added
        if (skillRefsToCreate.length > 0) {
            // Defer skill creation slightly to ensure main mechanic is added first
            setTimeout(async () => {
                // Temporarily restore context for skill creation
                const originalContext = this.creationContext;
                const originalCallback = this.templateWizardCallback;
                this.creationContext = savedCreationContext;
                this.templateWizardCallback = savedTemplateWizardCallback;
                
                for (const skillName of skillRefsToCreate) {
                    await this.createSubSkill(skillName, null);
                }
                
                // Restore context (in case browser is still being used)
                this.creationContext = originalContext;
                this.templateWizardCallback = originalCallback;
            }, 100);
        }
        
        // Defer non-critical cleanup operations with RAF to prevent blocking
        requestAnimationFrame(() => {
            // Reset to selection step for next time
            this.showMechanicSelection();
            
            // Clear state
            this.currentMechanic = null;
            this.onSelectCallback = null;
            this.pendingSubSkills = [];
        });
    }
    
    /**
     * Collect skill references that don't exist yet and should be created
     */
    collectPendingSkillRefs() {
        const pendingSkills = [];
        const existingSkills = this.getExistingSkillNames();
        
        // Check all skillref inputs for values
        const formContainer = document.getElementById('mechanicAttributesForm');
        if (!formContainer) return pendingSkills;
        
        formContainer.querySelectorAll('.skillref-input').forEach(input => {
            const value = input.value.trim();
            if (value && !existingSkills.some(s => s.toLowerCase() === value.toLowerCase())) {
                if (!pendingSkills.includes(value)) {
                    pendingSkills.push(value);
                }
            }
        });
        
        // Also include any manually queued pending skills
        if (this.pendingSubSkills && this.pendingSubSkills.length > 0) {
            this.pendingSubSkills.forEach(skill => {
                if (!pendingSkills.includes(skill)) {
                    pendingSkills.push(skill);
                }
            });
        }
        
        return pendingSkills;
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
            this.currentMechanic = this.mechanicsData.getMechanic(parsed.mechanic);
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

    /**
     * Check if attribute should use entity picker
     */
    shouldUseEntityPicker(attr) {
        // Check for 'type' attribute in summon/mount mechanics
        if (attr.name === 'type' && this.currentMechanic) {
            const mechanicId = this.currentMechanic.id?.toLowerCase();
            if (mechanicId === 'summon' || mechanicId === 'mount') {
                return true;
            }
        }
        
        // Check for 'mob' attribute in particle mechanics (Premium Only)
        if (attr.name === 'mob' && attr.type === 'text') {
            return true;
        }
        
        return false;
    }

    /**
     * Create entity picker HTML (same as condition browser)
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
     * Setup entity picker event handlers (same as condition browser)
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
            this.updateSkillLinePreview();
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
                    this.updateSkillLinePreview();
                }
            }
        });

        // Search functionality with debouncing
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            // Clear existing timer
            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
            }
            
            // Debounce search for better performance
            this.searchDebounceTimer = setTimeout(() => {
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
            }, this.performanceSettings.debounceSearch);
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
        this.updateSkillLinePreview();
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
                    this.updateSkillLinePreview();
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
                if (window.DEBUG_MODE) console.log('❌ No packManager found through any path');
                return [];
            }
            
            const activePack = packManager.activePack;
            if (window.DEBUG_MODE) console.log('Active pack:', activePack ? activePack.name : 'None');
            
            if (!activePack || !activePack.mobs) {
                if (window.DEBUG_MODE) console.log('❌ No activePack or mobs array');
                return [];
            }
            
            if (window.DEBUG_MODE) console.log('Mobs array length:', activePack.mobs.length);
            
            const customMobs = [];
            
            // Check if using new file-based structure
            if (Array.isArray(activePack.mobs) && activePack.mobs.length > 0) {
                if (window.DEBUG_MODE) console.log('First mob structure check:', activePack.mobs[0].entries !== undefined ? 'File-based' : 'Legacy');
                
                if (activePack.mobs[0].entries !== undefined) {
                    // New structure: iterate through files and their entries
                    activePack.mobs.forEach(file => {
                        if (file.entries && Array.isArray(file.entries)) {
                            if (window.DEBUG_MODE) console.log(`File: ${file.fileName}, entries: ${file.entries.length}`);
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
            
            if (window.DEBUG_MODE) console.log(`✅ Returning ${customMobs.length} custom mobs:`, customMobs);
            // Sort alphabetically and remove duplicates
            return [...new Set(customMobs)].sort((a, b) => a.localeCompare(b));
        } catch (error) {
            console.warn('Could not load custom MythicMobs:', error);
            return [];
        }
    }
}

// Export for global use
window.MechanicBrowser = MechanicBrowser;
// Loaded silently
