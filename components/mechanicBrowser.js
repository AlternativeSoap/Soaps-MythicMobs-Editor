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
        this.context = 'mob';
        this.onSelectCallback = null;
        this.searchCache = new LRUCache(10);
        this.virtualScroller = null;
        
        // Initialize browser data merger
        if (window.supabase && typeof BrowserDataMerger !== 'undefined') {
            this.browserDataMerger = new BrowserDataMerger(window.supabase);
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
        
        // Performance settings (optimized for grid layout)
        this.performanceSettings = {
            useVirtualScroll: false, // Disabled - incompatible with CSS grid
            initialBatchSize: 36, // Show 36 items initially (3 rows of 12)
            loadMoreBatchSize: 24, // Load 24 more on scroll
            debounceSearch: 300, // ms
            disableTransitions: false, // Disable CSS transitions on slow devices
            lazyLoadImages: true, // Lazy load images and heavy content
            minItemsForVirtualScroll: 999999 // Effectively disabled
        };
        
        // Debounce timer for search
        this.searchDebounceTimer = null;
        
        // Template cache for faster rendering
        this.cardTemplate = null;
        
        // Intersection observer for lazy loading
        this.intersectionObserver = null;
        
        // Apply adaptive settings if available
        this.applyAdaptiveSettings();
        
        // Performance optimizations
        this.eventListeners = [];
        this.domCache = {}; // Cache frequently accessed DOM elements
        this.renderCache = new Map(); // Cache rendered HTML by category/search key
        this.categoryTabsCache = null; // Cache category tabs NodeList
        this.cardTemplateCache = null; // Cache card template for faster rendering
        this.categoryCountCache = null; // Cache category counts to avoid recalculation
        
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
     * Warm cache on idle for instant first open (ONLY when DataOptimizer is ready)
     */
    warmCacheOnIdle() {
        const warmCache = () => {
            const dataOptimizer = window.DataOptimizer;
            if (!dataOptimizer) {
                console.warn('DataOptimizer not ready for cache warming');
                return;
            }
            
            if (this.isInitialized) return;
            
            // Pre-calculate all category counts (with validation)
            const success = this.precalculateCategoryCounts();
            if (!success) {
                console.warn('Failed to calculate category counts - DataOptimizer has no data');
                return;
            }
            
            // Pre-render Recent category (most common first view)
            if (this.recentMechanics.length > 0) {
                this.currentCategory = 'Recent';
                this.searchQuery = '';
                const cacheKey = 'Recent:';
                
                // Only warm if not already cached
                if (!this.renderCache.has(cacheKey)) {
                    const allMechanics = dataOptimizer.getAllItems('mechanics');
                    const mechanics = allMechanics.filter(m => this.recentMechanics.includes(m.id));
                    
                    if (mechanics.length > 0) {
                        // Generate HTML but don't insert into DOM
                        const renderedHTML = mechanics.map(m => this.renderMechanicCard(m)).join('');
                        this.renderCache.set(cacheKey, renderedHTML);
                    }
                }
            }
            
            // Pre-warm All category for likely second click
            const allCacheKey = 'All:';
            if (!this.renderCache.has(allCacheKey)) {
                const allMechanics = dataOptimizer.getAllItems('mechanics');
                const renderedHTML = allMechanics.map(m => this.renderMechanicCard(m)).join('');
                this.renderCache.set(allCacheKey, renderedHTML);
            }
            
            this.isInitialized = true;
            console.log('✅ Mechanic browser cache warmed successfully');
        };
        
        // Use requestIdleCallback for zero impact on main thread
        if (window.requestIdleCallback) {
            requestIdleCallback(warmCache, { timeout: 5000 });
        } else {
            setTimeout(warmCache, 2000);
        }
    }
    
    /**
     * Pre-calculate all category counts and cache them
     */
    precalculateCategoryCounts() {
        console.log('🔵 [COUNT] precalculateCategoryCounts() called');
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) {
            console.warn('⚠️ [COUNT] DataOptimizer not available for count calculation');
            return false;
        }
        
        // Verify DataOptimizer has mechanics data
        const totalCount = dataOptimizer.getCategoryCount('mechanics', 'all');
        console.log(`🔍 [COUNT] Total mechanics from DataOptimizer: ${totalCount}`);
        
        if (totalCount === 0) {
            console.warn('⚠️ [COUNT] DataOptimizer has no mechanics data yet');
            // Check if mechanics exist in MECHANICS_DATA
            if (window.MECHANICS_DATA && window.MECHANICS_DATA.mechanics) {
                console.log(`📊 [COUNT] MECHANICS_DATA has ${window.MECHANICS_DATA.mechanics.length} mechanics`);
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
        
        console.log('✅ [COUNT] Category counts calculated:', this.categoryCountCache);
        return true;
    }
    
    /**
     * Get cached DOM element (performance optimization)
     */
    getElement(id) {
        const start = performance.now();
        if (!this.domCache[id]) {
            const queryStart = performance.now();
            this.domCache[id] = document.getElementById(id);
            const queryTime = performance.now() - queryStart;
            if (queryTime > 1) {
                console.warn(`⚠️ [DOM] Slow query for #${id}: ${queryTime.toFixed(2)}ms`);
            }
        }
        const totalTime = performance.now() - start;
        if (totalTime > 0.5) {
            console.log(`📦 [DOM] getElement(${id}): ${totalTime.toFixed(2)}ms (cached: ${!!this.domCache[id]})`);
        }
        return this.domCache[id];
    }
    
    /**
     * Clear DOM cache (call when modal is hidden)
     */
    clearDOMCache() {
        this.domCache = {};
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
     * Attach event listeners
     */
    attachEventListeners() {
        // Close browser modal (cache will be created on first access)
        const closeBtn = document.getElementById('mechanicBrowserClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }

        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target.id === 'mechanicBrowserOverlay') {
                    this.close();
                }
            });
        }

        // Search input with debouncing (300ms for better performance)
        const debouncedSearch = debounce((query) => {
            this.searchQuery = query;
            this.renderMechanics();
        }, 300);
        
        document.getElementById('mechanicSearchInput').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Category tabs - using event delegation
        document.getElementById('mechanicCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                const overlay = document.getElementById('mechanicBrowserOverlay');
                overlay.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
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
                
                // Invalidate count cache since favorites changed
                if (this.categoryCountCache) {
                    this.categoryCountCache.Favorites = this.favoritesManager.getCount();
                }
                
                // No need to re-render - toggle handles visual update
                this.renderQuickAccess(); // Update quick access counts
                this.updateCategoryCounts(); // Update category counts
            }
        });

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
            });
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
        });
    }

    /**
     * Open the mechanic browser (FULLY OPTIMIZED - instant feedback)
     */
    open(options = {}) {
        const startTime = performance.now();
        console.log('🔵 [PERF] Mechanic Browser open() called');
        
        this.context = options.context || 'mob';
        this.currentValue = options.currentValue || null;
        this.onSelectCallback = options.onSelect || null;

        // Step 1: Show overlay IMMEDIATELY (0ms)
        const overlayStart = performance.now();
        const getElementStart = performance.now();
        const overlay = this.getElement('mechanicBrowserOverlay');
        console.log(`  📦 [PERF] getElement took ${(performance.now() - getElementStart).toFixed(2)}ms`);
        if (overlay) {
            const zIndexStart = performance.now();
            if (options.parentZIndex) {
                overlay.style.zIndex = options.parentZIndex + 100;
            } else {
                overlay.style.zIndex = '';
            }
            console.log(`  🎨 [PERF] Z-index set in ${(performance.now() - zIndexStart).toFixed(2)}ms`);
            
            const displayStart = performance.now();
            overlay.style.display = 'flex';
            console.log(`  🎨 [PERF] Display set in ${(performance.now() - displayStart).toFixed(2)}ms`);
        } else {
            console.error('❌ mechanicBrowserOverlay element not found!');
            return;
        }
        console.log(`⚡ [PERF] Overlay shown in ${(performance.now() - overlayStart).toFixed(2)}ms`);

        // Step 2: Check if cache is warm - if so, render instantly without skeleton/RAF
        const cacheIsWarm = this.isInitialized && window.DataOptimizer && this.categoryCountCache;
        console.log(`🔍 [DEBUG] Cache warm: ${cacheIsWarm}, isInitialized: ${this.isInitialized}, DataOptimizer: ${!!window.DataOptimizer}, countCache: ${!!this.categoryCountCache}`);

        if (cacheIsWarm) {
            // FAST PATH: Instant render without skeleton or RAF
            console.log('⚡ [PERF] Using FAST PATH (warm cache)');
            
            // Reset state
            this.currentMechanic = null;
            this.currentCategory = 'all';
            this.searchQuery = '';
            if (this.currentValue) {
                this.parseSkillLine(this.currentValue);
            }
            
            // Render immediately
            const renderStart = performance.now();
            this.showMechanicSelection();
            console.log(`✅ [PERF] Total open time (FAST PATH): ${(performance.now() - startTime).toFixed(2)}ms`);
            return;
        }

        // SLOW PATH: First render - use skeleton + RAF
        console.log('🐌 [PERF] Using SLOW PATH (cold cache)');

        // Step 2b: Show skeleton loading IMMEDIATELY (<1ms)
        const skeletonStart = performance.now();
        this.showSkeletonLoading();
        console.log(`⚡ [PERF] Skeleton shown in ${(performance.now() - skeletonStart).toFixed(2)}ms`);

        // Step 3: Warm cache if not initialized and DataOptimizer is ready
        console.log(`🔍 [DEBUG] isInitialized: ${this.isInitialized}, DataOptimizer exists: ${!!window.DataOptimizer}`);
        if (!this.isInitialized && window.DataOptimizer) {
            console.log('🔥 [DEBUG] Warming cache...');
            this.warmCacheOnIdle();
        }

        // Step 4: Defer rendering to next frame (single RAF for better performance)
        const rafScheduleStart = performance.now();
        requestAnimationFrame(() => {
            const rafExecuteStart = performance.now();
            console.log(`🕐 [PERF] RAF scheduled in ${(rafExecuteStart - rafScheduleStart).toFixed(2)}ms`);
            const deferredStart = performance.now();
            console.log('🔵 [PERF] Deferred operations starting...');
            
            // Data should already be preloaded
            const dataCheckStart = performance.now();
            if (!this.mechanicsData || !this.mechanicsData.mechanics) {
                console.warn('⚠️ [DEBUG] Mechanics data not preloaded, loading now...');
                this.loadMergedData(); // Fire and forget
            } else {
                console.log(`✅ [DEBUG] Mechanics data ready: ${this.mechanicsData.mechanics?.length || 0} mechanics`);
            }
            console.log(`  📊 [PERF] Data check in ${(performance.now() - dataCheckStart).toFixed(2)}ms`);

            // Reset state
            const stateResetStart = performance.now();
            this.currentMechanic = null;
            this.currentCategory = 'all';
            this.searchQuery = '';
            console.log(`  🔄 [PERF] State reset in ${(performance.now() - stateResetStart).toFixed(2)}ms`);

            // Parse currentValue if editing
            if (this.currentValue) {
                const parseStart = performance.now();
                this.parseSkillLine(this.currentValue);
                console.log(`  📝 [PERF] Parse skill line in ${(performance.now() - parseStart).toFixed(2)}ms`);
            }
            
            console.log(`⚡ [PERF] Deferred prep completed in ${(performance.now() - deferredStart).toFixed(2)}ms`);

            // Render content immediately (no second RAF needed)
            const renderStart = performance.now();
            console.log('🔵 [PERF] Rendering content...');
            this.showMechanicSelection();
            console.log(`⚡ [PERF] Content rendered in ${(performance.now() - renderStart).toFixed(2)}ms`);
            console.log(`✅ [PERF] Total open time: ${(performance.now() - startTime).toFixed(2)}ms`);
        });
    }

    /**
     * Close the mechanic browser
     */
    close() {
        const overlay = this.getElement('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Clear DOM cache when closing to prevent stale references
        this.clearDOMCache();
        
        // Cleanup event listeners
        this.cleanup();
        
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
     * Cleanup event listeners to prevent memory leaks
     */
    cleanup() {
        // Remove all tracked event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler);
            }
        });
        this.eventListeners = [];
        
        // Clear DOM cache
        this.domCache = {};
        this.categoryTabsCache = null;
        
        if (window.DEBUG_MODE) {
        }
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
     * Show mechanic selection step
     */
    /**
     * Show mechanic selection step
     */
    showMechanicSelection() {
        const totalStart = performance.now();
        console.log('🔵 [SHOW] showMechanicSelection() called');
        
        const domStart = performance.now();
        this.getElement('mechanicSelectionStep').classList.add('active');
        this.getElement('mechanicConfigurationStep').classList.remove('active');
        this.getElement('mechanicSearchInput').value = '';
        console.log(`  🎨 [SHOW] DOM updates in ${(performance.now() - domStart).toFixed(2)}ms`);
        
        // Use cached tabs if available for better performance
        const tabStart = performance.now();
        const overlay = document.getElementById('mechanicBrowserOverlay');
        const categoryTabs = this.categoryTabsCache || overlay.querySelectorAll('.category-tab');
        console.log(`  📋 [SHOW] Found ${categoryTabs.length} tabs in ${(performance.now() - tabStart).toFixed(2)}ms`);
        
        const tabUpdateStart = performance.now();
        categoryTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('[data-category="Recent"]').classList.add('active');
        this.currentCategory = 'Recent';
        this.searchQuery = '';
        console.log(`  🏷️ [SHOW] Tab activation in ${(performance.now() - tabUpdateStart).toFixed(2)}ms`);
        
        console.log(`⚡ [SHOW] Total prep in ${(performance.now() - totalStart).toFixed(2)}ms`);
        
        // Render immediately (cache should be warm)
        const renderCallStart = performance.now();
        this.renderMechanics();
        console.log(`⚡ [SHOW] renderMechanics() call returned in ${(performance.now() - renderCallStart).toFixed(2)}ms`);
        console.log(`✅ [SHOW] Total showMechanicSelection in ${(performance.now() - totalStart).toFixed(2)}ms`);
    }
    
    /**
     * Show skeleton loading state (OPTIMIZED)
     */
    showSkeletonLoading() {
        const totalStart = performance.now();
        console.log('🔵 [SKELETON] showSkeletonLoading() called');
        
        const getStart = performance.now();
        const listContainer = this.getElement('mechanicList');
        console.log(`  📦 [SKELETON] getElement in ${(performance.now() - getStart).toFixed(2)}ms`);
        if (!listContainer) return;
        
        // Use fragment for better performance
        const createStart = performance.now();
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        console.log(`  🏭 [SKELETON] Fragment created in ${(performance.now() - createStart).toFixed(2)}ms`);
        
        const htmlStart = performance.now();
        const skeletonHTML = Array(6).fill(0).map(() => `
            <div class="condition-card skeleton">
                <div class="condition-card-header">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-badge"></div>
                </div>
                <div class="condition-card-body">
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text"></div>
                </div>
            </div>
        `).join('');
        console.log(`  🎨 [SKELETON] HTML generated in ${(performance.now() - htmlStart).toFixed(2)}ms (${skeletonHTML.length} chars)`);
        
        const parseStart = performance.now();
        tempDiv.innerHTML = skeletonHTML;
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        console.log(`  📝 [SKELETON] Parsed to DOM in ${(performance.now() - parseStart).toFixed(2)}ms`);
        
        const appendStart = performance.now();
        listContainer.innerHTML = '';
        listContainer.appendChild(fragment);
        console.log(`  🔄 [SKELETON] Appended in ${(performance.now() - appendStart).toFixed(2)}ms`);
        
        console.log(`✅ [SKELETON] Total time: ${(performance.now() - totalStart).toFixed(2)}ms`);
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
     * Apply adaptive performance settings based on device capabilities
     */
    applyAdaptiveSettings() {
        if (typeof DevicePerformanceDetector === 'undefined') return;
        
        try {
            const detector = new DevicePerformanceDetector();
            const profile = detector.profile; // Use profile property, not getProfile()
            
            if (profile && profile.deviceClass) {
                // Adjust settings based on device performance
                switch (profile.deviceClass) {
                    case 'slow':
                        this.performanceSettings.useVirtualScroll = true;
                        this.performanceSettings.batchSize = 20;
                        this.performanceSettings.debounceSearch = 500;
                        this.performanceSettings.disableTransitions = true;
                        this.performanceSettings.minItemsForVirtualScroll = 30;
                        break;
                    case 'medium':
                        this.performanceSettings.useVirtualScroll = false;
                        this.performanceSettings.batchSize = 30;
                        this.performanceSettings.debounceSearch = 300;
                        this.performanceSettings.disableTransitions = false;
                        this.performanceSettings.minItemsForVirtualScroll = 50;
                        break;
                    case 'fast':
                        this.performanceSettings.useVirtualScroll = false;
                        this.performanceSettings.batchSize = 50;
                        this.performanceSettings.debounceSearch = 150;
                        this.performanceSettings.disableTransitions = false;
                        this.performanceSettings.minItemsForVirtualScroll = 100;
                        break;
                }
                
                // Apply CSS class to disable transitions if needed
                if (this.performanceSettings.disableTransitions) {
                    const overlay = document.getElementById('mechanicBrowserOverlay');
                    if (overlay) {
                        overlay.classList.add('disable-transitions');
                    }
                }
                
                console.log(`📊 Mechanic Browser optimized for ${profile.deviceClass} device:`, this.performanceSettings);
            }
        } catch (error) {
            console.warn('Could not apply adaptive settings:', error);
        }
    }
    
    /**
     * Render mechanics list (using DataOptimizer with HTML caching)
     */
    renderMechanics() {
        const startTime = performance.now();
        console.log(`🔵 [RENDER] renderMechanics() - Category: ${this.currentCategory}, Search: "${this.searchQuery}"`);
        
        const listContainer = this.getElement('mechanicList');
        
        // Add CSS optimizations on first render
        if (listContainer && !listContainer.dataset.optimized) {
            listContainer.style.willChange = 'scroll-position';
            listContainer.style.transform = 'translateZ(0)';
            listContainer.style.contain = 'layout style paint';
            listContainer.dataset.optimized = 'true';
        }
        
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) {
            console.warn('⚠️ [RENDER] DataOptimizer not available');
            return;
        }
        
        // Check HTML render cache first
        const cacheKey = `${this.currentCategory}:${this.searchQuery}`;
        console.log(`🔍 [RENDER] Cache key: "${cacheKey}"`);
        const cachedHTML = this.renderCache.get(cacheKey);
        if (cachedHTML) {
            console.log(`✅ [RENDER] Using cached HTML (${cachedHTML.length} chars)`);
            const cacheStart = performance.now();
            listContainer.innerHTML = cachedHTML;
            this.setupMechanicEventDelegation(listContainer);
            console.log(`⚡ [RENDER] Cache render in ${(performance.now() - cacheStart).toFixed(2)}ms`);
            console.log(`✅ [RENDER] Total (cached) in ${(performance.now() - startTime).toFixed(2)}ms`);
            // Counts already up to date when using cache - skip update
            return;
        }
        
        console.log('🔄 [RENDER] Cache miss, rendering fresh...');
        
        // Check data cache
        let mechanics = this.searchCache.get(cacheKey);
        
        if (!mechanics) {
            const filterStart = performance.now();
            console.log(`🔍 [RENDER] No data cache, filtering mechanics...`);
            
            // Use DataOptimizer for filtering
            if (this.currentCategory === 'Recent') {
                // Show recently used mechanics (recentMechanics contains string IDs)
                const allMechanics = dataOptimizer.getAllItems('mechanics');
                console.log(`📊 [RENDER] Recent: ${this.recentMechanics.length} recent IDs, ${allMechanics.length} total mechanics`);
                mechanics = allMechanics.filter(m => this.recentMechanics.includes(m.id));
                // Sort by most recent first
                mechanics.sort((a, b) => {
                    const indexA = this.recentMechanics.indexOf(a.id);
                    const indexB = this.recentMechanics.indexOf(b.id);
                    return indexA - indexB;
                });
            } else if (this.currentCategory === 'Favorites') {
                const allMechanics = dataOptimizer.getAllItems('mechanics');
                console.log(`⭐ [RENDER] Favorites: filtering ${allMechanics.length} mechanics`);
                mechanics = this.favoritesManager.filterFavorites(allMechanics, 'id');
            } else if (this.searchQuery) {
                // Use DataOptimizer's search with category filter
                const category = this.currentCategory === 'All' ? 'all' : this.currentCategory;
                console.log(`🔎 [RENDER] Search: query="${this.searchQuery}", category="${category}"`);
                mechanics = dataOptimizer.searchItems('mechanics', this.searchQuery, category);
                
                // Filter favorites if needed
                if (this.currentCategory === 'Favorites') {
                    mechanics = this.favoritesManager.filterFavorites(mechanics, 'id');
                }
            } else {
                // Get items by category (O(1) for category lookup)
                const category = this.currentCategory === 'All' ? 'all' : this.currentCategory;
                console.log(`📂 [RENDER] Category filter: "${category}"`);
                mechanics = dataOptimizer.getItemsByCategory('mechanics', category);
            }
            
            console.log(`✅ [RENDER] Filtered to ${mechanics.length} mechanics in ${(performance.now() - filterStart).toFixed(2)}ms`);
            
            // Cache the result
            this.searchCache.set(cacheKey, mechanics);
        } else {
            console.log(`✅ [RENDER] Using cached data (${mechanics.length} mechanics)`);
        }
        
        // Update category counts
        const countsStart = performance.now();
        this.updateCategoryCounts();
        console.log(`📊 [RENDER] Updated counts in ${(performance.now() - countsStart).toFixed(2)}ms`);

        if (mechanics.length === 0) {
            const emptyHTML = '<div class="empty-state">No mechanics found matching your search.</div>';
            listContainer.innerHTML = emptyHTML;
            this.renderCache.set(cacheKey, emptyHTML);
            console.log(`⚠️ [RENDER] No mechanics to render - Total time: ${(performance.now() - startTime).toFixed(2)}ms`);
            return;
        }

        // For optimal performance with grid: render all items at once using DocumentFragment
        // This is faster than batching for < 300 items and maintains grid layout
        const renderStart = performance.now();
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        // Render all items as HTML string (fastest approach)
        const htmlStart = performance.now();
        const renderedHTML = mechanics.map(mechanic => 
            this.renderMechanicCard(mechanic)
        ).join('');
        console.log(`🎨 [RENDER] Generated HTML in ${(performance.now() - htmlStart).toFixed(2)}ms`);
        
        // Parse HTML into DOM nodes
        const parseStart = performance.now();
        tempDiv.innerHTML = renderedHTML;
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        console.log(`📄 [RENDER] Parsed to DOM in ${(performance.now() - parseStart).toFixed(2)}ms`);
        
        // Single DOM update (very fast)
        const domStart = performance.now();
        listContainer.innerHTML = '';
        listContainer.appendChild(fragment);
        console.log(`🔄 [RENDER] DOM update in ${(performance.now() - domStart).toFixed(2)}ms`);
        
        // Cache the rendered HTML
        this.renderCache.set(cacheKey, renderedHTML);
        
        // Keep cache size manageable (max 20 entries)
        if (this.renderCache.size > 20) {
            const firstKey = this.renderCache.keys().next().value;
            this.renderCache.delete(firstKey);
        }

        this.setupMechanicEventDelegation(listContainer);
        
        // Update category counts once (using cached values for speed)
        this.updateCategoryCounts();
        
        // Intelligent preloading: preload 'All' category when Recent is shown
        if (this.currentCategory === 'Recent' && !this.hasPreloadedAll && dataOptimizer) {
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    const allMechanics = dataOptimizer.getAllItems('mechanics');
                    this.renderCache.set('all:', allMechanics);
                    this.hasPreloadedAll = true;
                }, { timeout: 3000 });
            }
        }
    }

    /**
     * Initialize virtual scrolling for large lists
     */
    initializeVirtualScroll(container, mechanics) {
        if (!this.virtualScroller) {
            this.virtualScroller = new VirtualScrollManager({
                itemHeight: 180, // Approximate height of mechanic card
                bufferSize: 3,
                minItemsForVirtualization: this.performanceSettings.minItemsForVirtualScroll
            });
        }
        
        const scrollContainer = container.closest('.condition-browser-body') || container;
        
        this.virtualScroller.initialize(
            scrollContainer,
            container,
            mechanics,
            (index, mechanic) => this.renderMechanicCard(mechanic)
        );
        
        this.setupMechanicEventDelegation(container);
        console.log(`🚀 Virtual scrolling enabled for ${mechanics.length} mechanics`);
    }
    
    /**
     * Render mechanics in batches using requestIdleCallback for better performance
     */
    renderInBatches(container, mechanics, batchSize) {
        let currentIndex = 0;
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        // Clear skeleton loaders BEFORE starting batch render
        container.innerHTML = '';
        
        const renderBatch = (deadline) => {
            while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && currentIndex < mechanics.length) {
                const endIndex = Math.min(currentIndex + batchSize, mechanics.length);
                const batch = mechanics.slice(currentIndex, endIndex);
                
                const batchHTML = batch.map(m => this.renderMechanicCard(m)).join('');
                tempDiv.innerHTML = batchHTML;
                
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                
                currentIndex = endIndex;
            }
            
            if (currentIndex === batchSize) {
                // First batch - show immediately (container already cleared)
                container.appendChild(fragment.cloneNode(true));
                this.setupMechanicEventDelegation(container);
            } else if (currentIndex < mechanics.length) {
                // More batches to render
                container.appendChild(fragment.cloneNode(true));
            } else {
                // Final batch - ensure event delegation is set up
                container.appendChild(fragment);
                this.setupMechanicEventDelegation(container);
            }
            
            if (currentIndex < mechanics.length) {
                requestIdleCallback(renderBatch, { timeout: 1000 });
            }
        };
        
        requestIdleCallback(renderBatch, { timeout: 1000 });
    }
    
    /**
     * Render a single mechanic card (optimized with template caching)
     */
    renderMechanicCard(mechanic) {
        const badges = [];
        const isFavorite = this.isFavorite(mechanic.id);
        
        if (mechanic.attributes && mechanic.attributes.length > 0) {
            badges.push(`<span class="mechanic-badge attributes">${mechanic.attributes.length} attributes</span>`);
        }

        // Simplified rendering for better performance
        return `<div class="condition-card" data-mechanic="${mechanic.id}">
    <div class="condition-card-header">
        <h4>${mechanic.name}</h4>
        <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-icon btn-favorite" data-mechanic-id="${mechanic.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                <i class="${isFavorite ? 'fas' : 'far'} fa-star" style="color: ${isFavorite ? '#ffc107' : '#666'};"></i>
            </button>
            <span class="condition-category-badge">${mechanic.category}</span>
        </div>
    </div>
    <div class="condition-card-body">
        <p class="condition-card-description">${mechanic.description}</p>${mechanic.aliases?.length ? `
        <div class="condition-aliases"><strong>Aliases:</strong> ${mechanic.aliases.join(', ')}</div>` : ''}${mechanic.examples?.length ? `
        <div class="condition-example"><code>${mechanic.examples[0]}</code></div>` : ''}
    </div>
    <div class="condition-card-footer">
        <button class="btn btn-primary btn-select-mechanic">Select</button>
    </div>
</div>`;
    }

    /**
     * Setup event delegation for mechanic cards
     */
    setupMechanicEventDelegation(listContainer) {
        // Remove old listener if it exists (prevent duplicates)
        if (this.selectMechanicHandler) {
            listContainer.removeEventListener('click', this.selectMechanicHandler);
            // Remove from tracked listeners
            this.eventListeners = this.eventListeners.filter(
                listener => listener.handler !== this.selectMechanicHandler
            );
        }

        // Create new handler
        this.selectMechanicHandler = (e) => {
            const selectBtn = e.target.closest('.btn-select-mechanic');
            if (selectBtn) {
                const card = selectBtn.closest('.condition-card');
                const mechanicId = card.dataset.mechanic;
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

        // Add new listener
        listContainer.addEventListener('click', this.selectMechanicHandler);
        
        // Track this listener for cleanup
        this.eventListeners.push({
            element: listContainer,
            event: 'click',
            handler: this.selectMechanicHandler
        });
    }

    /**
     * Update category tab counts (OPTIMIZED with fallback)
     */
    updateCategoryCounts() {
        const startTime = performance.now();
        console.log('🔵 [COUNT] updateCategoryCounts() called');
        
        const dataOptimizer = window.DataOptimizer;
        if (!dataOptimizer) {
            console.warn('⚠️ [COUNT] DataOptimizer not available, skipping update');
            return;
        }
        
        // Recalculate if cache is missing or invalid (all zeros)
        console.log('🔍 [COUNT] Current cache:', this.categoryCountCache);
        if (!this.categoryCountCache || this.categoryCountCache.All === 0) {
            console.log('🔄 [COUNT] Cache missing or invalid, recalculating...');
            const success = this.precalculateCategoryCounts();
            if (!success) {
                console.warn('⚠️ [COUNT] Failed to calculate counts, DataOptimizer not ready');
                return;
            }
        } else {
            console.log('✅ [COUNT] Using cached counts');
        }
        
        // Use cached category tabs to avoid repeated DOM queries (scoped to mechanic browser only)
        if (!this.categoryTabsCache) {
            const overlay = document.getElementById('mechanicBrowserOverlay');
            this.categoryTabsCache = overlay.querySelectorAll('.category-tab');
            console.log(`📋 [COUNT] Found ${this.categoryTabsCache.length} category tabs in mechanic browser`);
        }
        const categoryTabs = this.categoryTabsCache;
        
        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;
            const count = this.categoryCountCache[category] || 0;
            
            // Extract the label text (icon + name)
            const textContent = tab.textContent.trim();
            const labelMatch = textContent.match(/^(.+?)(\s*\(\d+\))?$/);
            const label = labelMatch ? labelMatch[1].trim() : textContent;
            
            const newText = `${label} (${count})`;
            console.log(`🏷️ [COUNT] ${category}: ${count} - "${newText}"`);
            tab.textContent = newText;
        });
        
        console.log(`⚡ [COUNT] Update completed in ${(performance.now() - startTime).toFixed(2)}ms`);
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
            } else if (attr.type === 'boolean') {
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
                        <span class="info-icon" title="Click for details">ℹ️</span>
                    </label>
                    ${inputHTML}
                    <small class="attribute-description">${attr.description}${defaultText}</small>
                </div>
            `;
        }).join('');

        // Add inherited particle attributes section if applicable
        if (this.currentMechanic.inheritedParticleAttributes) {
            formContainer.innerHTML += this.renderInheritedParticleAttributes();
        }

        // Attach input listeners
        this.attachAttributeListeners(formContainer);
        
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
        
        // Update YAML preview
        this.updateSkillLinePreview();
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
                inputHTML = `
                    <label class="checkbox-container">
                        <input type="checkbox" 
                               class="mechanic-attribute-input mechanic-attribute-checkbox" 
                               data-attr="${attr.name}"
                               data-modified="false">
                        <span class="checkbox-value">false</span>
                    </label>
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
                        <span class="info-icon" title="Click for details">ℹ️</span>
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
            materialSelect.innerHTML = '<option value="">-- Select Material --</option>';
            window.minecraftBlocks.forEach(block => {
                materialSelect.innerHTML += `<option value="${block}">${block}</option>`;
            });
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
                field.style.display = shouldShow ? 'block' : 'none';
                
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
        
        // Defer non-critical cleanup operations with RAF to prevent blocking
        requestAnimationFrame(() => {
            // Reset to selection step for next time
            this.showMechanicSelection();
            
            // Clear state
            this.currentMechanic = null;
            this.onSelectCallback = null;
        });
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

// Export for global use
window.MechanicBrowser = MechanicBrowser;
// Loaded silently
