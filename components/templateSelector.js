/**
 * Template Selector Component
 * Modern browser-style interface for pre-made skill line templates
 * Matches Mechanic/Condition browser design with unified styling
 */

class TemplateSelector {
    constructor(templateManager = null, templateEditor = null) {
        this.context = 'mob';
        this.currentTab = 'favorites';
        this.searchQuery = '';
        this.onSelectCallback = null;
        this.onBackCallback = null;
        this.favorites = this.loadFavorites();
        this.recentTemplates = this.loadRecent();
        this.selectedTemplate = null;
        
        // NEW: Template management
        this.templateManager = templateManager;
        this.templateEditor = templateEditor;
        this.builtInTemplates = [];
        this.userTemplates = [];
        this.allTemplates = [];
        this.isLoading = false;
        this.currentPage = 1;
        this.pageSize = 50;
        this.hasMore = false;
        
        // View mode and filters
        this.viewMode = localStorage.getItem('templateSelector_viewMode') || 'grid'; // 'grid' or 'list'
        this.filterCategory = 'all';
        this.filterComplexity = 'all';
        this.filterOwner = 'all';
        this.sortBy = localStorage.getItem('templateSelector_sortBy') || 'name'; // 'name', 'date', 'lines'
        this.sortOrder = localStorage.getItem('templateSelector_sortOrder') || 'asc';
        
        // Phase 2: Event listener tracking and performance
        this.eventListeners = [];
        this.searchDebounceTimer = null;
        this.cachedElements = {};
        this.skeletonTimeout = null; // Issue #4: Timeout to force hide skeleton
        
        // Render cache for performance
        this.renderCache = new Map(); // Cache rendered HTML by filter state key
        this.lastRenderKey = null; // Track last render to detect changes
        
        // NEW FEATURES
        // View count tracking (localStorage)
        this.viewCounts = this.loadViewCounts();
        
        // Comparison mode
        this.comparisonMode = false;
        this.selectedForComparison = []; // Max 3 templates
        
        // Search suggestions
        this.searchSuggestions = [];
        this.showSuggestions = false;
        
        // Sub-categories system
        this.subCategories = {
            combat: ['melee', 'ranged', 'aoe', 'combo'],
            effects: ['particles', 'sounds', 'visual'],
            movement: ['teleport', 'dash', 'leap', 'pull'],
            healing: ['regeneration', 'instant', 'lifesteal'],
            damage: ['fire', 'ice', 'lightning', 'physical', 'magic'],
            summons: ['minions', 'clones', 'turrets'],
            buffs: ['speed', 'strength', 'resistance'],
            debuffs: ['slow', 'weakness', 'poison', 'stun']
        };
        this.activeSubCategory = null;
        this.selectedSubCategory = null;
        
        // Virtual scrolling
        this.virtualScrollEnabled = true;
        this.visibleRange = { start: 0, end: 50 };
        this.itemHeight = 300; // Approximate height of a card
        this.scrollContainer = null;
        
        this.createModal();
        this.attachEventListeners();
    }
    
    // ========================================
    // VIEW COUNT TRACKING (localStorage)
    // ========================================
    
    /**
     * Load view counts from localStorage
     */
    loadViewCounts() {
        const saved = localStorage.getItem('templateSelector_viewCounts');
        return saved ? JSON.parse(saved) : {};
    }
    
    /**
     * Save view counts to localStorage
     */
    saveViewCounts() {
        localStorage.setItem('templateSelector_viewCounts', JSON.stringify(this.viewCounts));
    }
    
    /**
     * Increment view count for a template
     */
    incrementViewCount(templateId) {
        // Local tracking
        this.viewCounts[templateId] = (this.viewCounts[templateId] || 0) + 1;
        this.saveViewCounts();
        
        // Cloud tracking (non-blocking)
        if (this.templateManager) {
            this.templateManager.trackTemplateView(templateId).catch(err => {
                console.warn('Failed to track view in cloud:', err);
            });
        }
        
        // Activity tracking
        window.activityTracker?.trackTemplateView(templateId);
    }
    
    /**
     * Get view count for a template
     */
    getViewCount(templateId) {
        return this.viewCounts[templateId] || 0;
    }

    /**
     * Load favorites from localStorage (and sync with cloud if authenticated)
     */
    loadFavorites() {
        const saved = localStorage.getItem('templateSelector_favorites');
        const localFavorites = saved ? JSON.parse(saved) : [];
        
        // Async cloud sync (don't block)
        this.syncFavoritesWithCloud(localFavorites);
        
        return localFavorites;
    }
    
    /**
     * Sync favorites with cloud storage
     */
    async syncFavoritesWithCloud(localFavorites) {
        if (!this.templateManager?.auth?.isAuthenticated()) return;
        
        try {
            const merged = await this.templateManager.syncFavorites(localFavorites);
            if (merged.length !== this.favorites.length || 
                !merged.every(id => this.favorites.includes(id))) {
                this.favorites = merged;
                this.saveFavorites();
                // Re-render if modal is open
                if (document.getElementById('templateSelectorOverlay')?.style.display !== 'none') {
                    this.renderTemplates();
                }
            }
        } catch (error) {
            console.warn('Failed to sync favorites with cloud:', error);
        }
    }

    /**
     * Save favorites to localStorage (and cloud if authenticated)
     */
    saveFavorites() {
        localStorage.setItem('templateSelector_favorites', JSON.stringify(this.favorites));
    }

    /**
     * Load recent templates from localStorage
     */
    loadRecent() {
        const saved = localStorage.getItem('templateSelector_recent');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Save recent templates to localStorage
     */
    saveRecent() {
        localStorage.setItem('templateSelector_recent', JSON.stringify(this.recentTemplates));
    }

    /**
     * Add template to recent list
     */
    addToRecent(templateId) {
        // Remove if already exists
        this.recentTemplates = this.recentTemplates.filter(id => id !== templateId);
        // Add to beginning
        this.recentTemplates.unshift(templateId);
        // Keep only last 10
        this.recentTemplates = this.recentTemplates.slice(0, 10);
        this.saveRecent();
    }

    /**
     * Toggle favorite status (with cloud sync)
     */
    async toggleFavorite(templateId) {
        const index = this.favorites.indexOf(templateId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            // Remove from cloud
            if (this.templateManager?.auth?.isAuthenticated()) {
                this.templateManager.removeCloudFavorite(templateId);
            }
        } else {
            this.favorites.push(templateId);
            // Add to cloud
            if (this.templateManager?.auth?.isAuthenticated()) {
                this.templateManager.addCloudFavorite(templateId);
            }
        }
        this.saveFavorites();
    }

    /**
     * Check if template is favorited
     */
    isFavorite(templateId) {
        return this.favorites.includes(templateId);
    }

    /**
     * Create the template selector modal HTML (unified style)
     */
    createModal() {
        const modalHTML = `
            <div id="templateSelectorOverlay" class="condition-modal" style="display: none; z-index: 9000;">
                <div class="modal-content condition-browser template-browser-content" style="max-width: 1200px; height: 85vh; max-height: 900px;">
                    <!-- Header -->
                    <div class="modal-header" style="display: flex; align-items: center; gap: 0.75rem;">
                        <button class="btn btn-secondary btn-back" id="templateSelectorBack" title="Back to options" style="display: none;">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-layer-group"></i>
                            Quick Templates
                        </h2>
                        <div style="display: flex; gap: 0.5rem; margin-left: auto; align-items: center;">
                            <button class="btn btn-primary btn-sm" id="templateSelectorCreate" title="Create new template" style="display: none;">
                                <i class="fas fa-plus"></i> New
                            </button>
                            <button class="btn btn-secondary btn-icon" id="templateSelectorRefresh" title="Refresh">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button class="btn-close" id="templateSelectorClose" title="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Search Bar with Suggestions -->
                    <div class="search-bar" style="position: relative;">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" 
                               id="templateSearchInput" 
                               class="search-input" 
                               placeholder="Search templates by name, description, or skill..."
                               autocomplete="off">
                        <button class="search-clear" id="templateSearchClear" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                        <!-- Search Suggestions Dropdown -->
                        <div id="searchSuggestionsDropdown" class="search-suggestions-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0 0 8px 8px; max-height: 300px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                        </div>
                    </div>
                    
                    <!-- Filters & View Toggle (Consolidated) -->
                    <div class="template-toolbar" style="padding: 0.75rem 1.5rem; margin-bottom: 0.5rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; background: var(--bg-tertiary); border-radius: 8px; margin: 0 1rem 0.75rem 1rem;">
                        <!-- View Toggle -->
                        <div class="view-toggle" style="display: flex; gap: 0.25rem; background: var(--bg-secondary); border-radius: 6px; padding: 0.25rem;">
                            <button id="viewGrid" class="view-btn active" title="Grid View" style="padding: 0.4rem 0.6rem; border: none; background: var(--primary-color); color: white; border-radius: 4px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
                                <i class="fas fa-th"></i>
                            </button>
                            <button id="viewList" class="view-btn" title="List View" style="padding: 0.4rem 0.6rem; border: none; background: transparent; color: var(--text-secondary); border-radius: 4px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                        
                        <div style="height: 24px; width: 1px; background: var(--border-color);"></div>
                        
                        <!-- Filters -->
                        <select id="filterComplexity" class="form-control form-control-sm" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
                            <option value="all">All Complexity</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        
                        <select id="filterOwner" class="form-control form-control-sm" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
                            <option value="all">All Sources</option>
                            <option value="builtin">Built-in</option>
                            <option value="community">Community</option>
                            <option value="yours">Your Templates</option>
                        </select>
                        
                        <div style="height: 24px; width: 1px; background: var(--border-color);"></div>
                        
                        <!-- Sort -->
                        <select id="sortBy" class="form-control form-control-sm" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
                            <option value="name">Name</option>
                            <option value="rating">Rating</option>
                            <option value="views">Views</option>
                            <option value="uses">Downloads</option>
                            <option value="date">Date</option>
                            <option value="lines">Lines</option>
                        </select>
                        
                        <button id="sortOrder" class="btn btn-secondary btn-icon btn-sm" title="Toggle sort order" style="padding: 0.35rem 0.5rem; font-size: 0.85rem;">
                            <i class="fas fa-sort-alpha-down"></i>
                        </button>
                        
                        <!-- Template Count -->
                        <span id="toolbarTemplateCount" style="margin-left: auto; font-size: 0.8rem; color: var(--text-secondary);"></span>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="category-tabs" id="templateTabs">
                        <!-- Tabs will be rendered here -->
                    </div>
                    
                    <!-- Content Area -->
                    <div class="condition-browser-body" style="position: relative;" id="templateScrollContainer">
                        <div class="condition-list" id="templateList">
                            <!-- Templates will be rendered here -->
                        </div>
                    </div>
                    
                    <!-- Comparison Panel (hidden by default) -->
                    <div id="comparisonPanel" style="display: none; padding: 1rem 1.5rem; background: var(--bg-tertiary); border-top: 2px solid var(--primary-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <span style="font-weight: 600;"><i class="fas fa-balance-scale"></i> Comparing <span id="compareCountText">0</span> templates</span>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-primary btn-sm" id="showComparisonBtn" disabled>
                                    <i class="fas fa-eye"></i> Compare Now
                                </button>
                                <button class="btn btn-secondary btn-sm" id="clearComparisonBtn">
                                    <i class="fas fa-times"></i> Clear
                                </button>
                            </div>
                        </div>
                        <div id="comparisonSelectedList" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <!-- Selected templates will appear here -->
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="modal-footer">
                        <div class="footer-info">
                            <span id="templateCount">0 templates</span>
                        </div>
                        <button class="btn btn-secondary" id="templateSelectorCancel">Close</button>
                    </div>
                </div>
            </div>
            
            <!-- Comparison Modal -->
            <div id="comparisonModal" class="condition-modal" style="display: none; z-index: 9500;">
                <div class="modal-content" style="max-width: 95vw; width: 1400px; max-height: 90vh;">
                    <div class="modal-header">
                        <h2><i class="fas fa-balance-scale"></i> Template Comparison</h2>
                        <button class="btn-close" id="closeComparisonModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="comparisonContent" style="padding: 1.5rem; overflow-y: auto; max-height: calc(90vh - 120px);">
                        <!-- Comparison content will be rendered here -->
                    </div>
                </div>
            </div>
            
            <!-- Batch Import Modal -->
            <div id="batchImportModal" class="condition-modal" style="display: none; z-index: 9500;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-file-import"></i> Batch Import Templates</h2>
                        <button class="btn-close" id="closeBatchImportModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="padding: 1.5rem;">
                        <p style="margin-bottom: 1rem; color: var(--text-secondary);">Import multiple templates from a YAML file or paste YAML content below.</p>
                        <div class="form-group">
                            <label>Upload File</label>
                            <input type="file" id="batchImportFile" accept=".yml,.yaml,.txt" class="form-control">
                        </div>
                        <div style="text-align: center; margin: 1rem 0; color: var(--text-secondary);">— or —</div>
                        <div class="form-group">
                            <label>Paste YAML</label>
                            <textarea id="batchImportText" class="form-control" rows="10" placeholder="Paste YAML content here..." style="font-family: monospace;"></textarea>
                        </div>
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                            <button class="btn btn-secondary" id="cancelBatchImport">Cancel</button>
                            <button class="btn btn-primary" id="doBatchImport">
                                <i class="fas fa-upload"></i> Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        // Append all modals
        while (temp.firstElementChild) {
            document.body.appendChild(temp.firstElementChild);
        }
        
        // Inject grid styles
        this.injectStyles();
    }
    
    /**
     * Inject CSS styles for grid layout and animations
     */
    injectStyles() {
        if (document.getElementById('templateSelectorStyles')) return;
        
        const styles = `
            <style id="templateSelectorStyles">
                /* === Grid & List Layouts === */
                .template-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                    padding: 0.5rem 0;
                    animation: view-fade-in 0.3s ease-out;
                }
                
                .template-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    animation: view-fade-in 0.3s ease-out;
                }
                
                /* === NEW: Redesigned Card Styles === */
                .template-grid-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 1rem;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    transition: all 0.2s ease;
                }
                
                .template-grid-card:hover {
                    border-color: var(--primary-color);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                    transform: translateY(-2px);
                }
                
                .template-grid-card .card-actions {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    display: flex;
                    gap: 0.35rem;
                    opacity: 0;
                    transition: opacity 0.2s;
                    z-index: 5;
                }
                
                .template-grid-card:hover .card-actions {
                    opacity: 1;
                }
                
                /* Always show card-actions when there's a favorited button */
                .template-grid-card .card-actions:has(.favorited) {
                    opacity: 1;
                }
                
                .template-grid-card .action-btn {
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    padding: 0.35rem 0.45rem;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.15s;
                    font-size: 0.85rem;
                }
                
                .template-grid-card .action-btn:hover {
                    background: var(--primary-color);
                    color: white;
                }
                
                .template-grid-card .action-btn.favorited {
                    color: #ffc107;
                    opacity: 1;
                }
                
                .template-grid-card .card-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                }
                
                .template-grid-card .card-icon {
                    font-size: 2rem;
                    flex-shrink: 0;
                }
                
                .template-grid-card .card-title-area {
                    flex: 1;
                    min-width: 0;
                }
                
                .template-grid-card .card-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    margin: 0 0 0.35rem 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .template-grid-card .card-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25rem;
                }
                
                .template-grid-card .badge {
                    font-size: 0.65rem;
                    padding: 0.15rem 0.4rem;
                    border-radius: 10px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                
                .template-grid-card .badge-official {
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #000;
                }
                
                .template-grid-card .badge-builtin {
                    background: var(--info-color, #17a2b8);
                    color: white;
                }
                
                .template-grid-card .badge-yours {
                    background: var(--success-color, #28a745);
                    color: white;
                }
                
                .template-grid-card .badge-category {
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                }
                
                /* === Stats Bar === */
                .template-grid-card .card-stats {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0.75rem;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    gap: 0.5rem;
                }
                
                .template-grid-card .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.15rem;
                    flex: 1;
                }
                
                .template-grid-card .stat-icon {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                
                .template-grid-card .stat-icon.star-rating {
                    color: #ffc107;
                }
                
                .template-grid-card .stat-icon.star-rating i {
                    font-size: 0.65rem;
                }
                
                .template-grid-card .stat-value {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                
                .template-grid-card .card-description {
                    font-size: 0.82rem;
                    color: var(--text-secondary);
                    line-height: 1.4;
                    margin: 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    flex: 1;
                }
                
                .template-grid-card .card-footer {
                    display: flex;
                    gap: 0.4rem;
                    margin-top: auto;
                    padding-top: 0.5rem;
                    border-top: 1px solid var(--border-color);
                }
                
                .template-grid-card .card-footer .btn {
                    font-size: 0.8rem;
                    padding: 0.45rem 0.6rem;
                }
                
                .template-grid-card .card-footer .btn-primary {
                    flex: 1;
                }
                
                .template-grid-card .card-footer .btn-ghost {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                }
                
                .template-grid-card .card-footer .btn-ghost:hover {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                }
                
                /* === List Card Styles === */
                .template-list-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 1rem 1.25rem;
                    position: relative;
                    transition: all 0.2s ease;
                }
                
                .template-list-card:hover {
                    border-color: var(--primary-color);
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                }
                
                .template-list-card .list-card-header {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                }
                
                .template-list-card .list-card-icon {
                    font-size: 2.5rem;
                    flex-shrink: 0;
                }
                
                .template-list-card .list-card-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .template-list-card .list-card-title-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.35rem;
                }
                
                .template-list-card .list-card-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0;
                }
                
                .template-list-card .list-card-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.3rem;
                }
                
                .template-list-card .badge {
                    font-size: 0.65rem;
                    padding: 0.15rem 0.4rem;
                    border-radius: 10px;
                    font-weight: 500;
                }
                
                .template-list-card .badge-official {
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #000;
                }
                
                .template-list-card .badge-builtin {
                    background: var(--info-color, #17a2b8);
                    color: white;
                }
                
                .template-list-card .badge-yours {
                    background: var(--success-color, #28a745);
                    color: white;
                }
                
                .template-list-card .badge-category {
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                }
                
                .template-list-card .badge-mob-only {
                    background: var(--warning-color, #ffc107);
                    color: #000;
                }
                
                .template-list-card .list-card-description {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    margin: 0.25rem 0 0.5rem 0;
                    line-height: 1.4;
                }
                
                .template-list-card .list-card-stats {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                
                .template-list-card .list-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
                
                .template-list-card .list-stat i {
                    font-size: 0.75rem;
                }
                
                .template-list-card .favorite-btn {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 0.25rem;
                    transition: all 0.15s;
                }
                
                .template-list-card .favorite-btn.favorited,
                .template-list-card .favorite-btn:hover {
                    color: #ffc107;
                }
                
                .template-list-card .template-preview {
                    margin: 0.75rem 0;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    padding: 0.75rem;
                    overflow: hidden;
                }
                
                .template-list-card .template-preview pre {
                    margin: 0;
                    font-size: 0.8rem;
                    overflow-x: auto;
                }
                
                .template-list-card .list-card-footer {
                    display: flex;
                    gap: 0.5rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border-color);
                    flex-wrap: wrap;
                }
                
                .template-list-card .list-card-footer .btn {
                    font-size: 0.8rem;
                    padding: 0.4rem 0.6rem;
                }
                
                .template-list-card .list-card-footer .btn-ghost {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                }
                
                .template-list-card .list-card-footer .btn-ghost:hover {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                }
                
                /* Dropdown menu hover */
                .dropdown-item:hover {
                    background: var(--bg-tertiary);
                }
                
                /* === Responsive Grid Breakpoints === */
                @media (max-width: 1200px) {
                    .template-grid {
                        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    }
                }
                
                @media (max-width: 900px) {
                    .template-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    }
                }
                
                /* === Card Micro-Interactions === */
                .template-grid-card {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
                                box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                                border-color 0.2s;
                }
                
                .template-grid-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    border-color: var(--primary-color);
                }
                
                .template-grid-card:active {
                    transform: translateY(0) scale(0.98);
                }
                
                .template-grid-card .btn {
                    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .template-grid-card .btn:hover {
                    transform: scale(1.05);
                }
                
                .template-grid-card .btn:active {
                    transform: scale(0.95);
                }
                
                /* === Badge Animations === */
                .template-badge {
                    animation: badge-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards;
                }
                
                .template-badge:nth-child(1) { animation-delay: 0.05s; }
                .template-badge:nth-child(2) { animation-delay: 0.1s; }
                .template-badge:nth-child(3) { animation-delay: 0.15s; }
                
                @keyframes badge-appear {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                }
                
                /* === Card Appearance Animations === */
                .template-grid-card, .template-list-card {
                    animation: card-appear 0.3s ease-out backwards;
                }
                
                .template-grid-card:nth-child(1) { animation-delay: 0.03s; }
                .template-grid-card:nth-child(2) { animation-delay: 0.06s; }
                .template-grid-card:nth-child(3) { animation-delay: 0.09s; }
                .template-grid-card:nth-child(4) { animation-delay: 0.12s; }
                .template-grid-card:nth-child(5) { animation-delay: 0.15s; }
                .template-grid-card:nth-child(6) { animation-delay: 0.18s; }
                .template-grid-card:nth-child(7) { animation-delay: 0.21s; }
                .template-grid-card:nth-child(8) { animation-delay: 0.24s; }
                .template-grid-card:nth-child(9) { animation-delay: 0.27s; }
                
                @keyframes card-appear {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                }
                
                /* === View Toggle Animation === */
                @keyframes view-fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                }
                
                /* === Enhanced Skeleton Loading === */
                .skeleton-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1rem;
                    height: 280px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .skeleton-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                }
                
                .skeleton-title {
                    width: 80%;
                    height: 20px;
                    border-radius: 4px;
                    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                }
                
                .skeleton-badges {
                    display: flex;
                    gap: 0.5rem;
                    width: 100%;
                    justify-content: center;
                }
                
                .skeleton-badge {
                    width: 60px;
                    height: 22px;
                    border-radius: 12px;
                    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                }
                
                .skeleton-text {
                    width: 100%;
                    height: 14px;
                    border-radius: 4px;
                    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                }
                
                .skeleton-text:last-of-type {
                    width: 70%;
                }
                
                .skeleton-buttons {
                    width: 100%;
                    height: 36px;
                    border-radius: 4px;
                    margin-top: auto;
                    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                }
                
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                
                /* === Enhanced Empty States === */
                .empty-state {
                    animation: empty-appear 0.4s ease-out;
                }
                
                @keyframes empty-appear {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                }
                
                .empty-state i {
                    animation: icon-float 3s ease-in-out infinite;
                }
                
                @keyframes icon-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                
                /* === Favorite Button === */
                .template-grid-card .favorite-btn {
                    opacity: 0;
                    transition: opacity 0.2s, transform 0.15s;
                }
                
                .template-grid-card:hover .favorite-btn,
                .template-grid-card .favorite-btn.favorited {
                    opacity: 1;
                }
                
                .template-grid-card .favorite-btn:hover {
                    transform: scale(1.15);
                }
                
                .template-grid-card .favorite-btn:active {
                    transform: scale(0.9);
                }
                
                /* === Focus States for Accessibility === */
                .template-grid-card:focus-within {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .view-btn:focus,
                .btn:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }
                
                .template-grid-card .btn:focus {
                    outline-offset: -2px;
                }
                
                /* === Quick Copy Button (for list cards only) === */
                .template-list-card .quick-copy-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    opacity: 0;
                    transition: opacity 0.2s, transform 0.15s;
                    z-index: 10;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    padding: 0.4rem 0.6rem;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--text-secondary);
                }
                
                .template-list-card:hover .quick-copy-btn {
                    opacity: 1;
                }
                
                .template-list-card .quick-copy-btn:hover {
                    background: var(--primary-color);
                    color: white;
                    transform: scale(1.1);
                }
                
                .quick-copy-btn.copied {
                    background: var(--success-color, #28a745) !important;
                    color: white !important;
                }
                
                /* === Star Rating Display === */
                .star-rating-display {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.15rem;
                    font-size: 0.75rem;
                }
                
                .star-rating-display .star {
                    color: var(--text-muted, #6c757d);
                }
                
                .star-rating-display .star.filled {
                    color: #ffc107;
                }
                
                .star-rating-display .star.half {
                    background: linear-gradient(90deg, #ffc107 50%, var(--text-muted, #6c757d) 50%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .star-rating-display .rating-count {
                    color: var(--text-muted, #6c757d);
                    font-size: 0.7rem;
                    margin-left: 0.25rem;
                }
                
                /* === Interactive Star Rating (for rating modal) === */
                .star-rating-input {
                    display: flex;
                    gap: 0.25rem;
                    font-size: 1.5rem;
                }
                
                .star-rating-input .star-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-muted, #6c757d);
                    transition: color 0.15s, transform 0.15s;
                    padding: 0.25rem;
                }
                
                .star-rating-input .star-btn:hover,
                .star-rating-input .star-btn.active {
                    color: #ffc107;
                    transform: scale(1.2);
                }
                
                .star-rating-input .star-btn.hovered {
                    color: #ffc107;
                }
                
                /* === View Count Badge === */
                .view-count-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--text-muted, #888);
                    padding: 0.2rem 0.5rem;
                    background: var(--bg-tertiary);
                    border-radius: 10px;
                }
                
                .view-count-badge i {
                    font-size: 0.7rem;
                }
                
                /* === Category Chips === */
                .category-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.35rem 0.75rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-secondary);
                }
                
                .category-chip:hover {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                .category-chip.active {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: white;
                }
                
                .category-chip .chip-count {
                    background: rgba(0,0,0,0.15);
                    padding: 0.1rem 0.4rem;
                    border-radius: 10px;
                    font-size: 0.7rem;
                }
                
                .category-chip.active .chip-count {
                    background: rgba(255,255,255,0.2);
                }
                
                /* === Sub-Category Chips === */
                .sub-category-chip {
                    padding: 0.25rem 0.6rem;
                    font-size: 0.75rem;
                    background: var(--bg-tertiary);
                    border: 1px dashed var(--border-color);
                    border-radius: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-muted);
                }
                
                .sub-category-chip:hover {
                    border-style: solid;
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                .sub-category-chip.active {
                    background: var(--primary-light, rgba(99, 102, 241, 0.2));
                    border-style: solid;
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                /* === Search Suggestions Dropdown === */
                .search-suggestions-dropdown {
                    animation: dropdown-appear 0.2s ease-out;
                }
                
                @keyframes dropdown-appear {
                    from { opacity: 0; transform: translateY(-5px); }
                }
                
                .search-suggestion-item {
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: background 0.15s;
                }
                
                .search-suggestion-item:hover {
                    background: var(--bg-tertiary);
                }
                
                .search-suggestion-item:last-child {
                    border-bottom: none;
                }
                
                .search-suggestion-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    background: var(--bg-tertiary);
                    color: var(--primary-color);
                }
                
                .search-suggestion-text {
                    flex: 1;
                }
                
                .search-suggestion-name {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                
                .search-suggestion-meta {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                
                .search-suggestion-type {
                    font-size: 0.75rem;
                    padding: 0.15rem 0.5rem;
                    background: var(--bg-tertiary);
                    border-radius: 10px;
                    color: var(--text-secondary);
                }
                
                /* === Comparison Mode === */
                .comparison-mode .template-grid-card,
                .comparison-mode .template-list-card {
                    cursor: pointer;
                    position: relative;
                }
                
                .comparison-mode .template-grid-card::before,
                .comparison-mode .template-list-card::before {
                    content: '';
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    width: 22px;
                    height: 22px;
                    border: 2px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-primary);
                    z-index: 5;
                    transition: all 0.2s;
                }
                
                .comparison-mode .template-grid-card.compare-selected::before,
                .comparison-mode .template-list-card.compare-selected::before {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                }
                
                .comparison-mode .template-grid-card.compare-selected::after,
                .comparison-mode .template-list-card.compare-selected::after {
                    content: '✓';
                    position: absolute;
                    top: 10px;
                    left: 13px;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: bold;
                    z-index: 6;
                }
                
                .comparison-mode .template-grid-card.compare-selected {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px var(--primary-light, rgba(99, 102, 241, 0.3));
                }
                
                .compare-count {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: var(--primary-color);
                    color: white;
                    font-size: 0.7rem;
                    padding: 0.1rem 0.4rem;
                    border-radius: 10px;
                    min-width: 18px;
                    text-align: center;
                }
                
                /* === Comparison Selected Tag === */
                .comparison-selected-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.6rem;
                    background: var(--primary-light, rgba(99, 102, 241, 0.15));
                    border: 1px solid var(--primary-color);
                    border-radius: 6px;
                    font-size: 0.85rem;
                    color: var(--primary-color);
                }
                
                .comparison-selected-tag .remove-compare {
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.15s;
                }
                
                .comparison-selected-tag .remove-compare:hover {
                    opacity: 1;
                }
                
                /* === Comparison Modal Content === */
                .comparison-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 1.5rem;
                }
                
                .comparison-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .comparison-card-header {
                    padding: 1rem;
                    background: var(--bg-tertiary);
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .comparison-card-body {
                    padding: 1rem;
                }
                
                .comparison-card-code {
                    background: var(--bg-primary);
                    border-radius: 6px;
                    padding: 0.75rem;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.85rem;
                    max-height: 300px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                
                .comparison-stat {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .comparison-stat:last-child {
                    border-bottom: none;
                }
                
                /* === Virtual Scroll Placeholder === */
                .virtual-scroll-placeholder {
                    background: var(--bg-secondary);
                    border: 1px dashed var(--border-color);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                }
                
                /* === Batch Export/Import Button Styles === */
                #templateBatchExportBtn,
                #templateBatchImportBtn {
                    position: relative;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    /**
     * Destroy the modal and remove from DOM
     */
    destroy() {
        const overlay = document.getElementById('templateSelectorOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        document.getElementById('templateSelectorClose').addEventListener('click', () => {
            this.close();
        });

        // Cancel button
        document.getElementById('templateSelectorCancel').addEventListener('click', () => {
            this.close();
        });
        
        // Back button
        document.getElementById('templateSelectorBack')?.addEventListener('click', () => {
            this.close();
            if (this.onBackCallback) {
                this.onBackCallback();
            }
        });

        // Click outside to close
        document.getElementById('templateSelectorOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'templateSelectorOverlay') {
                e.stopPropagation();
                this.close();
            }
        });
        
        // Create button
        document.getElementById('templateSelectorCreate')?.addEventListener('click', () => {
            this.handleCreateTemplate();
        });
        
        // Refresh button
        document.getElementById('templateSelectorRefresh')?.addEventListener('click', () => {
            this.refresh();
        });
        
        // View toggle
        document.getElementById('viewGrid')?.addEventListener('click', () => {
            this.setViewMode('grid');
        });
        document.getElementById('viewList')?.addEventListener('click', () => {
            this.setViewMode('list');
        });
        
        // Filters
        document.getElementById('filterComplexity')?.addEventListener('change', (e) => {
            this.filterComplexity = e.target.value;
            this.renderTemplates();
        });
        document.getElementById('filterOwner')?.addEventListener('change', (e) => {
            this.filterOwner = e.target.value;
            this.renderTemplates();
        });
        
        // Sort
        document.getElementById('sortBy')?.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            localStorage.setItem('templateSelector_sortBy', this.sortBy);
            this.renderTemplates();
        });
        document.getElementById('sortOrder')?.addEventListener('click', () => {
            this.toggleSortOrder();
        });

        // Search input (Phase 2: Debounced for performance)
        const searchInput = document.getElementById('templateSearchInput');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.getElementById('templateSearchClear').style.display = query ? 'block' : 'none';
            
            // Show/hide search suggestions
            this.updateSearchSuggestions(query);
            
            // Debounce search to avoid excessive re-renders (300ms delay)
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = setTimeout(() => {
                this.searchQuery = query;
                this.renderTemplates();
                
                // Track search activity (only if meaningful search)
                if (query.length >= 3) {
                    window.activityTracker?.trackSearch(query, 'templates');
                }
            }, 300);
        });
        
        // Hide suggestions on blur (with delay to allow click)
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                document.getElementById('searchSuggestionsDropdown').style.display = 'none';
            }, 200);
        });
        
        // Show suggestions on focus if there's a query
        searchInput.addEventListener('focus', (e) => {
            if (e.target.value.length >= 2) {
                this.updateSearchSuggestions(e.target.value.toLowerCase());
            }
        });

        // Clear search
        document.getElementById('templateSearchClear').addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            document.getElementById('templateSearchClear').style.display = 'none';
            document.getElementById('searchSuggestionsDropdown').style.display = 'none';
            this.renderTemplates();
        });
        
        // Comparison mode toggle
        document.getElementById('toggleComparisonMode')?.addEventListener('click', () => {
            this.toggleComparisonMode();
        });
        
        // Show comparison button
        document.getElementById('showComparisonBtn')?.addEventListener('click', () => {
            this.showComparisonModal();
        });
        
        // Clear comparison button
        document.getElementById('clearComparisonBtn')?.addEventListener('click', () => {
            this.clearComparison();
        });
        
        // Close comparison modal
        document.getElementById('closeComparisonModal')?.addEventListener('click', () => {
            document.getElementById('comparisonModal').style.display = 'none';
        });
        
        // Batch import button
        document.getElementById('templateBatchImportBtn')?.addEventListener('click', () => {
            document.getElementById('templateActionsMenu').style.display = 'none';
            document.getElementById('batchImportModal').style.display = 'flex';
        });
        
        // Batch export (close dropdown menu after click)
        document.getElementById('templateBatchExportBtn')?.addEventListener('click', () => {
            document.getElementById('templateActionsMenu').style.display = 'none';
            this.handleBatchExport();
        });
        
        // Actions dropdown toggle
        document.getElementById('templateActionsBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('templateActionsMenu');
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('templateActionsMenu');
            const btn = document.getElementById('templateActionsBtn');
            if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
        
        // Comparison mode from dropdown
        document.getElementById('toggleComparisonModeDropdown')?.addEventListener('click', () => {
            document.getElementById('templateActionsMenu').style.display = 'none';
            this.toggleComparisonMode();
        });
        
        // Batch import modal - cancel
        document.getElementById('cancelBatchImport')?.addEventListener('click', () => {
            document.getElementById('batchImportModal').style.display = 'none';
        });
        
        // Batch import modal - close
        document.getElementById('closeBatchImportModal')?.addEventListener('click', () => {
            document.getElementById('batchImportModal').style.display = 'none';
        });
        
        // Batch import modal - import
        document.getElementById('doBatchImport')?.addEventListener('click', () => {
            this.handleBatchImport();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('templateSelectorOverlay');
            if (!overlay.classList.contains('active')) return;

            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        if (window.editor && typeof window.editor.showToast === 'function') {
            window.editor.showToast(message, type);
        } else if (window.notificationModal) {
            window.notificationModal.alert(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Open the template selector
     */
    async open(options = {}) {
        this.context = options.context || 'mob';
        this.onSelectCallback = options.onSelect || null;
        this.onBackCallback = options.onBack || null;
        this.searchQuery = '';
        this.selectedTemplate = null;
        this.currentPage = 1;
        
        // Default to 'all' tab if favorites is empty
        if (this.favorites.length === 0 && this.currentTab === 'favorites') {
            this.currentTab = 'all';
        }
        
        // Show/hide back button based on callback presence
        const backBtn = document.getElementById('templateSelectorBack');
        if (backBtn) {
            backBtn.style.display = this.onBackCallback ? 'inline-flex' : 'none';
        }
        
        // Show/hide create button based on auth status
        const createBtn = document.getElementById('templateSelectorCreate');
        if (createBtn) {
            const isAuthenticated = window.authManager?.isAuthenticated();
            createBtn.style.display = isAuthenticated ? 'inline-flex' : 'none';
        }
        
        // Reset search input
        document.getElementById('templateSearchInput').value = '';
        document.getElementById('templateSearchClear').style.display = 'none';
        document.getElementById('searchSuggestionsDropdown').style.display = 'none';
        
        // Reset comparison mode
        this.comparisonMode = false;
        this.selectedForComparison = [];
        const panel = document.getElementById('comparisonPanel');
        const compareBtn = document.getElementById('templateCompareBtn');
        const templateList = document.getElementById('templateList');
        if (panel) panel.style.display = 'none';
        if (compareBtn) compareBtn.style.display = 'none';
        if (templateList) templateList.classList.remove('comparison-mode');
        const toggleBtn = document.getElementById('toggleComparisonMode');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.style.background = '';
            toggleBtn.style.color = '';
        }
        const toggleDropdownBtn = document.getElementById('toggleComparisonModeDropdown');
        if (toggleDropdownBtn) {
            toggleDropdownBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Compare Mode';
        }
        
        // Restore view mode UI
        this.setViewMode(this.viewMode);
        
        // Restore sort UI
        document.getElementById('sortBy').value = this.sortBy;
        const sortOrderIcon = document.getElementById('sortOrder').querySelector('i');
        sortOrderIcon.className = this.sortOrder === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
        
        // Show modal
        document.getElementById('templateSelectorOverlay').style.display = 'flex';
        
        // Show loading state
        this.showLoading();
        
        // Issue #4: Safety timeout - force hide skeleton after 5 seconds
        this.skeletonTimeout = setTimeout(() => {
            if (this.isLoading) {
                if (window.DEBUG_MODE) console.warn('Skeleton loading timeout (5s) - forcing hide');
                this.hideLoading();
                this.renderTemplates();
            }
        }, 5000);
        
        // Load templates (hybrid: built-in + remote)
        await this.loadAllTemplates();
        
        // Hide loading BEFORE rendering (fixes empty state infinite loading)
        this.hideLoading();
        
        // Render tabs, category chips, and templates
        this.renderTabs();
        this.renderCategoryChips();
        this.renderSubCategoryChips();
        this.renderTemplates();
        
        // Focus search input
        setTimeout(() => {
            document.getElementById('templateSearchInput').focus();
        }, 100);
    }

    /**
     * Close the template selector
     */
    close() {
        document.getElementById('templateSelectorOverlay').style.display = 'none';
        this.onSelectCallback = null;
        this.selectedTemplate = null;
        
        // Phase 2: Clear any pending debounce timers
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = null;
        }
        
        // Issue #4: Clear skeleton timeout
        if (this.skeletonTimeout) {
            clearTimeout(this.skeletonTimeout);
            this.skeletonTimeout = null;
        }
    }
    
    /**
     * Set view mode (grid or list)
     */
    setViewMode(mode) {
        this.viewMode = mode;
        localStorage.setItem('templateSelector_viewMode', mode);
        
        // Update UI
        const gridBtn = document.getElementById('viewGrid');
        const listBtn = document.getElementById('viewList');
        
        if (mode === 'grid') {
            gridBtn.style.background = 'var(--primary-color)';
            gridBtn.style.color = 'white';
            listBtn.style.background = 'transparent';
            listBtn.style.color = 'var(--text-secondary)';
        } else {
            listBtn.style.background = 'var(--primary-color)';
            listBtn.style.color = 'white';
            gridBtn.style.background = 'transparent';
            gridBtn.style.color = 'var(--text-secondary)';
        }
        
        this.renderTemplates();
    }
    
    /**
     * Toggle sort order
     */
    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        localStorage.setItem('templateSelector_sortOrder', this.sortOrder);
        
        const btn = document.getElementById('sortOrder');
        const icon = btn.querySelector('i');
        icon.className = this.sortOrder === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
        
        this.renderTemplates();
    }
    
    /**
     * Sort templates based on current sort settings
     */
    sortTemplates(templates) {
        const sorted = [...templates];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (this.sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'date':
                    aVal = a.created_at || a.id;
                    bVal = b.created_at || b.id;
                    break;
                case 'lines':
                    aVal = this.getLineCount(a);
                    bVal = this.getLineCount(b);
                    break;
                case 'rating':
                    aVal = a.average_rating || 0;
                    bVal = b.average_rating || 0;
                    break;
                case 'views':
                    aVal = a.view_count || this.getViewCount(a.id) || 0;
                    bVal = b.view_count || this.getViewCount(b.id) || 0;
                    break;
                case 'uses':
                    aVal = a.use_count || 0;
                    bVal = b.use_count || 0;
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    }
    
    /**
     * Get line count for a template
     */
    getLineCount(template) {
        // Check for sections array (new multi-section format)
        if (template.sections && Array.isArray(template.sections)) {
            let totalLines = 0;
            template.sections.forEach(section => {
                if (Array.isArray(section.lines)) {
                    totalLines += section.lines.length;
                }
            });
            return totalLines || 1;
        }
        
        // Fallback to old format
        if (Array.isArray(template.skillLines)) {
            return template.skillLines.length;
        } else if (template.skillLine) {
            return this.extractSkillLines(template.skillLine).length;
        }
        return 1;
    }
    
    /**
     * Apply filters to templates
     */
    applyFilters(templates) {
        let filtered = [...templates];
        
        // Complexity filter
        if (this.filterComplexity !== 'all') {
            filtered = filtered.filter(t => {
                const lineCount = this.getLineCount(t);
                switch (this.filterComplexity) {
                    case 'easy': return lineCount <= 3;
                    case 'medium': return lineCount >= 4 && lineCount <= 8;
                    case 'hard': return lineCount >= 9;
                    default: return true;
                }
            });
        }
        
        // Owner filter
        if (this.filterOwner !== 'all') {
            filtered = filtered.filter(t => {
                switch (this.filterOwner) {
                    case 'builtin': return t.isBuiltIn;
                    case 'community': return !t.isBuiltIn && !this.isOwner(t);
                    case 'yours': return this.isOwner(t);
                    default: return true;
                }
            });
        }
        
        return filtered;
    }

    /**
     * Render tabs
     */
    renderTabs() {
        const container = document.getElementById('templateTabs');
        const contextTemplates = this.allTemplates.filter(t => t.type === this.context);
        const categories = this.getAllCategories();
        
        const favoriteCount = this.getFavoriteTemplates().length;
        const recentCount = this.getRecentTemplates().length;
        
        let html = `
            <button class="category-tab ${this.currentTab === 'favorites' ? 'active' : ''}" data-tab="favorites">
                <i class="fas fa-star"></i>
                <span>Favorites</span>
                <span class="tab-badge">${favoriteCount}</span>
            </button>
            <button class="category-tab ${this.currentTab === 'recent' ? 'active' : ''}" data-tab="recent">
                <i class="fas fa-clock"></i>
                <span>Recent</span>
                <span class="tab-badge">${recentCount}</span>
            </button>
            <button class="category-tab ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">
                <i class="fas fa-th"></i>
                <span>All</span>
                <span class="tab-badge">${this.getTotalTemplateCount()}</span>
            </button>
        `;
        
        // Add category tabs
        categories.forEach(category => {
            const templates = this.getByCategory(category);
            const icon = this.getCategoryIcon(category);
            const name = this.getCategoryDisplayName(category);
            const isActive = this.currentTab === category;
            
            html += `
                <button class="category-tab ${isActive ? 'active' : ''}" data-tab="${category}">
                    ${icon}
                    <span>${name}</span>
                    <span class="tab-badge">${templates.length}</span>
                </button>
            `;
        });
        
        container.innerHTML = html;
        
        // Attach tab click handlers
        container.querySelectorAll('.category-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.selectTab(tab);
            });
        });
    }

    /**
     * Select a tab
     */
    selectTab(tab) {
        this.currentTab = tab;
        this.renderTabs();
        this.renderTemplates();
    }

    /**
     * Get appropriate empty state message based on context
     */
    getEmptyStateMessage() {
        // Search query takes priority
        if (this.searchQuery) {
            return {
                title: 'No templates found matching your search',
                subtitle: 'Try a different search term or clear filters'
            };
        }
        
        // Special tabs
        switch(this.currentTab) {
            case 'favorites':
                return {
                    title: 'No favorite templates yet',
                    subtitle: 'Click the star icon on templates to add them to favorites'
                };
            
            case 'recent':
                return {
                    title: 'No recent templates',
                    subtitle: 'Templates you use will appear here'
                };
            
            case 'all':
                return {
                    title: 'No templates available',
                    subtitle: 'Create your own template to get started'
                };
            
            default:
                // Category tab
                const categoryName = this.getCategoryDisplayName(this.currentTab) || this.currentTab;
                return {
                    title: `No templates in ${categoryName}`,
                    subtitle: 'This category is currently empty'
                };
        }
    }
    
    /**
     * Get total template count for current context
     */
    getTotalTemplateCount() {
        return this.allTemplates.length;
    }

    /**
     * Get favorite templates
     */
    getFavoriteTemplates() {
        return this.allTemplates.filter(t => this.isFavorite(t.id));
    }

    /**
     * Get recent templates
     */
    getRecentTemplates() {
        return this.recentTemplates
            .map(id => this.allTemplates.find(t => t.id === id))
            .filter(t => t !== undefined);
    }

    /**
     * Generate cache key based on current filter state
     */
    getCacheKey() {
        return `${this.currentTab}_${this.context}_${this.searchQuery}_${this.filterCategory}_${this.filterComplexity}_${this.filterOwner}_${this.sortBy}_${this.sortOrder}_${this.viewMode}_${this.favorites.join(',')}_${this.allTemplates?.length || 0}`;
    }
    
    /**
     * Render template list with sections (with caching)
     */
    renderTemplates() {
        const container = document.getElementById('templateList');
        
        // Issue #4: Don't render if still loading or templates not loaded yet
        if (this.isLoading) {
            return;
        }
        
        // Generate cache key based on current filter state
        const cacheKey = this.getCacheKey();
        
        // Check if we can use cached render
        if (this.lastRenderKey === cacheKey && this.renderCache.has(cacheKey)) {
            return; // Already rendered with same state
        }
        
        // PHASE 1 FIX: Clear container to remove skeleton cards before rendering
        container.innerHTML = '';
        
        if (!this.allTemplates || this.allTemplates.length === 0) {
        }
        
        let templates = [];
        
        // Get templates based on current tab
        if (this.currentTab === 'favorites') {
            templates = this.getFavoriteTemplates();
        } else if (this.currentTab === 'recent') {
            templates = this.getRecentTemplates();
        } else if (this.currentTab === 'all') {
            templates = this.allTemplates;
        } else {
            // Specific category
            templates = this.allTemplates.filter(t => t.category === this.currentTab);
        }
        
        // Filter out incompatible templates when in skill context
        if (this.context === 'skill') {
            templates = templates.filter(t => !t.requiresMobFile && !this.hasTriggers(t));
        }
        
        // Filter by search query
        if (this.searchQuery) {
            templates = templates.filter(t => {
                const skillLines = Array.isArray(t.skillLines) ? t.skillLines.join(' ') : (t.skillLine || '');
                return t.name.toLowerCase().includes(this.searchQuery) ||
                    t.description.toLowerCase().includes(this.searchQuery) ||
                    skillLines.toLowerCase().includes(this.searchQuery) ||
                    t.category.toLowerCase().includes(this.searchQuery);
            });
        }
        
        // Apply filters
        templates = this.applyFilters(templates);
        
        // Sort templates
        templates = this.sortTemplates(templates);
        
        // Update count (both footer and toolbar)
        const countText = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;
        document.getElementById('templateCount').textContent = countText;
        const toolbarCount = document.getElementById('toolbarTemplateCount');
        if (toolbarCount) {
            toolbarCount.textContent = countText;
        }
        
        // Render templates with sections
        if (templates.length === 0) {
            const emptyMessage = this.getEmptyStateMessage();
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-layer-group" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>${emptyMessage.title}</p>
                    ${emptyMessage.subtitle ? `<small>${emptyMessage.subtitle}</small>` : ''}
                </div>
            `;
            return;
        }
        
        // Group templates into sections
        const builtIn = templates.filter(t => t.isBuiltIn);
        const yours = templates.filter(t => !t.isBuiltIn && this.isOwner(t));
        const community = templates.filter(t => !t.isBuiltIn && !this.isOwner(t));
        
        let html = '';
        
        // Set container class based on view mode
        const gridClass = this.viewMode === 'grid' ? 'template-grid' : 'template-list';
        
        // Built-in Templates Section
        if (builtIn.length > 0) {
            html += `
                <div class="template-section" style="margin-bottom: 2rem;">
                    <h3 class="section-header" style="font-size: 1.2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color);">📦 Built-in Templates (${builtIn.length})</h3>
                    <div class="${gridClass}">
                        ${this.renderTemplateCards(builtIn)}
                    </div>
                </div>
            `;
        }
        
        // Community Templates Section
        if (community.length > 0) {
            html += `
                <div class="template-section" style="margin-bottom: 2rem;">
                    <h3 class="section-header" style="font-size: 1.2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color);">👥 Community Templates (${community.length})</h3>
                    <div class="${gridClass}">
                        ${this.renderTemplateCards(community)}
                    </div>
                </div>
            `;
        }
        
        // Your Templates Section
        if (yours.length > 0) {
            html += `
                <div class="template-section" style="margin-bottom: 2rem;">
                    <h3 class="section-header" style="font-size: 1.2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color);">✏️ Your Templates (${yours.length})</h3>
                    <div class="${gridClass}">
                        ${this.renderTemplateCards(yours)}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Store cache key to track current render state
        this.lastRenderKey = cacheKey;
        this.renderCache.set(cacheKey, true); // Just store that we've rendered this state
        
        // Limit cache size to prevent memory bloat (keep last 20 states)
        if (this.renderCache.size > 20) {
            const firstKey = this.renderCache.keys().next().value;
            this.renderCache.delete(firstKey);
        }
        
        // Attach event handlers
        this.attachTemplateCardEvents();
    }
    
    /**
     * Get structure type information for badge display
     */
    getStructureInfo(template) {
        // Check if structure_type is explicitly set
        const structureType = template.structure_type || template.data?.structure_type;
        
        if (structureType) {
            // Use explicit structure type
            switch (structureType) {
                case 'single':
                    return {
                        icon: '🎯',
                        label: 'Single Line',
                        color: '#10b981',
                        description: 'Single skill line'
                    };
                case 'multi-section':
                    const sectionCount = template.sections?.length || 0;
                    const totalLines = this.getLineCount(template);
                    return {
                        icon: '📚',
                        label: `${sectionCount} sections`,
                        color: '#8b5cf6',
                        description: `${sectionCount} section${sectionCount !== 1 ? 's' : ''}, ${totalLines} line${totalLines !== 1 ? 's' : ''}`
                    };
                case 'multi-line':
                default:
                    const lineCount = this.getLineCount(template);
                    return {
                        icon: '📋',
                        label: `${lineCount} lines`,
                        color: '#3b82f6',
                        description: `Multiple lines in one section (${lineCount} total)`
                    };
            }
        }
        
        // Fallback: detect from template data
        if (template.sections && template.sections.length > 1) {
            const sectionCount = template.sections.length;
            const totalLines = this.getLineCount(template);
            return {
                icon: '📚',
                label: `${sectionCount} sections`,
                color: '#8b5cf6',
                description: `${sectionCount} sections, ${totalLines} lines`
            };
        }
        
        const lineCount = this.getLineCount(template);
        if (lineCount === 1) {
            return {
                icon: '🎯',
                label: 'Single Line',
                color: '#10b981',
                description: 'Single skill line'
            };
        }
        
        return {
            icon: '📋',
            label: `${lineCount} lines`,
            color: '#3b82f6',
            description: `Multiple lines (${lineCount} total)`
        };
    }
    
    /**
     * Check if template has triggers
     */
    hasTriggers(template) {
        if (template.requiresMobFile) return true;
        if (template.type === 'mob') return true;
        
        const skillLines = Array.isArray(template.skillLines) 
            ? template.skillLines 
            : (template.skillLine ? [template.skillLine] : []);
        
        return skillLines.some(line => typeof line === 'string' && line.includes('~on'));
    }
    
    /**
     * Render template cards based on current view mode
     */
    renderTemplateCards(templates) {
        if (this.viewMode === 'grid') {
            return templates.map(template => this.renderGridCard(template)).join('');
        } else {
            return templates.map(template => this.renderListCard(template)).join('');
        }
    }
    
    /**
     * Render compact grid card
     */
    renderGridCard(template) {
        const isFav = this.isFavorite(template.id);
        const categoryName = template.category ? 
            (this.getCategoryDisplayName(template.category) || template.category) : 'Utility';
        const categoryIcon = template.icon || this.getCategoryIcon(template.category) || '📦';
        const lineCount = this.getLineCount(template);
        
        // Official badge
        const isOfficial = template.is_official || template.data?.is_official || false;
        
        // Stats from database
        const viewCount = template.view_count || this.getViewCount(template.id) || 0;
        const useCount = template.use_count || 0;
        const avgRating = template.average_rating || 0;
        const ratingCount = template.rating_count || 0;
        const commentCount = template.comment_count || 0;
        
        // Check if selected for comparison
        const isSelected = this.selectedForComparison.includes(template.id);
        const compareClass = isSelected ? 'compare-selected' : '';
        
        // Format numbers for display
        const formatCount = (num) => {
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        };
        
        // Render compact star rating
        const renderCompactStars = (rating) => {
            if (rating === 0) return '<span style="color: var(--text-muted);">—</span>';
            const fullStars = Math.floor(rating);
            let stars = '';
            for (let i = 0; i < fullStars; i++) {
                stars += '<i class="fas fa-star"></i>';
            }
            if (rating % 1 >= 0.5) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            }
            return stars;
        };

        return `
            <div class="template-grid-card ${compareClass}" data-template-id="${template.id}">
                <!-- Top Row: Favorite & Copy -->
                <div class="card-actions">
                    <button class="action-btn favorite-btn ${isFav ? 'favorited' : ''}" 
                            data-template-id="${template.id}" 
                            title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="action-btn quick-copy-btn" data-template-id="${template.id}" title="Quick copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                
                <!-- Header: Icon + Name -->
                <div class="card-header">
                    <span class="card-icon">${categoryIcon}</span>
                    <div class="card-title-area">
                        <h4 class="card-title">${this.escapeHtml(template.name)}</h4>
                        <div class="card-badges">
                            ${isOfficial ? '<span class="badge badge-official"><i class="fas fa-crown"></i> Official</span>' : ''}
                            ${template.isBuiltIn ? '<span class="badge badge-builtin">Built-in</span>' : ''}
                            ${this.isOwner(template) ? '<span class="badge badge-yours">Yours</span>' : ''}
                            <span class="badge badge-category">${categoryName}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Bar -->
                <div class="card-stats">
                    <div class="stat" title="${ratingCount} ratings">
                        <span class="stat-icon star-rating">${renderCompactStars(avgRating)}</span>
                        <span class="stat-value">${avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                    </div>
                    <div class="stat" title="${viewCount} views">
                        <i class="fas fa-eye stat-icon"></i>
                        <span class="stat-value">${formatCount(viewCount)}</span>
                    </div>
                    <div class="stat" title="${useCount} downloads">
                        <i class="fas fa-download stat-icon"></i>
                        <span class="stat-value">${formatCount(useCount)}</span>
                    </div>
                    <div class="stat" title="${commentCount} comments">
                        <i class="fas fa-comment stat-icon"></i>
                        <span class="stat-value">${formatCount(commentCount)}</span>
                    </div>
                </div>
                
                <!-- Description -->
                <p class="card-description">${this.escapeHtml(template.description)}</p>
                
                <!-- Actions -->
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm template-use-btn" data-template-id="${template.id}">
                        <i class="fas fa-plus"></i> Use
                    </button>
                    <button class="btn btn-ghost btn-sm template-preview-btn" data-template-id="${template.id}" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm template-rate-btn" data-template-id="${template.id}" title="Rate">
                        <i class="fas fa-star"></i>
                    </button>
                    ${this.canEdit(template) ? `
                        <button class="btn btn-ghost btn-sm template-edit-btn" data-template-id="${template.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render full list card (improved style)
     */
    renderListCard(template) {
        const isFav = this.isFavorite(template.id);
        const categoryName = template.category ? 
            (this.getCategoryDisplayName(template.category) || template.category) : 'Utility';
        const categoryIcon = template.icon || this.getCategoryIcon(template.category) || '📦';
        
        // Get skill lines
        const skillLines = Array.isArray(template.skillLines) 
            ? template.skillLines 
            : (template.skillLine ? this.extractSkillLines(template.skillLine) : []);
        
        const lineCount = Array.isArray(skillLines) ? skillLines.length : 1;
        const displayLines = Array.isArray(skillLines)
            ? skillLines.slice(0, 3).join('\n') + (skillLines.length > 3 ? '\n...' : '')
            : skillLines;
        
        // Check if template requires mob file
        const requiresMobFile = this.hasTriggers(template);
        const isIncompatible = this.context === 'skill' && requiresMobFile;
        
        // Official badge
        const isOfficial = template.is_official || template.data?.is_official || false;
        
        // Stats from database
        const viewCount = template.view_count || this.getViewCount(template.id) || 0;
        const useCount = template.use_count || 0;
        const avgRating = template.average_rating || 0;
        const ratingCount = template.rating_count || 0;
        const commentCount = template.comment_count || 0;
        
        // Check if selected for comparison
        const isSelected = this.selectedForComparison.includes(template.id);
        const compareClass = isSelected ? 'compare-selected' : '';
        
        // Format numbers for display
        const formatCount = (num) => {
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        };
        
        // Render stars inline
        const renderStars = (rating) => {
            if (rating === 0) return '—';
            let stars = '';
            for (let i = 0; i < Math.floor(rating); i++) {
                stars += '<i class="fas fa-star" style="color: #ffc107;"></i>';
            }
            if (rating % 1 >= 0.5) {
                stars += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
            }
            return stars;
        };
        
        return `
            <div class="template-list-card ${isIncompatible ? 'template-incompatible' : ''} ${compareClass}" data-template-id="${template.id}">
                <button class="quick-copy-btn" data-template-id="${template.id}" title="Quick copy to clipboard">
                    <i class="fas fa-copy"></i>
                </button>
                
                <div class="list-card-header">
                    <div class="list-card-icon">${categoryIcon}</div>
                    <div class="list-card-info">
                        <div class="list-card-title-row">
                            <h3 class="list-card-title">${this.escapeHtml(template.name)}</h3>
                            <div class="list-card-badges">
                                ${isOfficial ? '<span class="badge badge-official"><i class="fas fa-crown"></i> Official</span>' : ''}
                                ${template.isBuiltIn ? '<span class="badge badge-builtin">Built-in</span>' : ''}
                                ${this.isOwner(template) ? '<span class="badge badge-yours">Yours</span>' : ''}
                                <span class="badge badge-category">${categoryName}</span>
                                ${requiresMobFile ? '<span class="badge badge-mob-only">🔒 Mob Only</span>' : ''}
                            </div>
                        </div>
                        <p class="list-card-description">${this.escapeHtml(template.description)}</p>
                        
                        <!-- Stats Row -->
                        <div class="list-card-stats">
                            <span class="list-stat" title="${ratingCount} ratings">
                                ${renderStars(avgRating)} ${avgRating > 0 ? avgRating.toFixed(1) : '—'}
                            </span>
                            <span class="list-stat" title="${viewCount} views">
                                <i class="fas fa-eye"></i> ${formatCount(viewCount)}
                            </span>
                            <span class="list-stat" title="${useCount} downloads">
                                <i class="fas fa-download"></i> ${formatCount(useCount)}
                            </span>
                            <span class="list-stat" title="${commentCount} comments">
                                <i class="fas fa-comment"></i> ${formatCount(commentCount)}
                            </span>
                        </div>
                    </div>
                    <button class="favorite-btn ${isFav ? 'favorited' : ''}" 
                            data-template-id="${template.id}" 
                            title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                
                <div class="template-preview">
                    <pre><code>${this.escapeHtml(displayLines)}</code></pre>
                </div>
                
                <div class="list-card-footer">
                    <button class="btn btn-primary btn-sm template-use-btn" data-template-id="${template.id}">
                        <i class="fas fa-plus"></i> Use
                    </button>
                    <button class="btn btn-ghost btn-sm template-preview-btn" data-template-id="${template.id}">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn btn-ghost btn-sm template-rate-btn" data-template-id="${template.id}" title="Rate">
                        <i class="fas fa-star"></i> Rate
                    </button>
                    <button class="btn btn-ghost btn-sm template-duplicate-btn" data-template-id="${template.id}">
                        <i class="fas fa-copy"></i> Duplicate
                    </button>
                    ${this.canEdit(template) ? `
                        <button class="btn btn-ghost btn-sm template-edit-btn" data-template-id="${template.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                    ${this.canDelete(template) ? `
                        <button class="btn btn-danger btn-sm template-delete-btn" data-template-id="${template.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Attach event handlers to template cards using event delegation
     */
    attachTemplateCardEvents() {
        const container = document.getElementById('templateList');
        
        // Remove existing click handler if any
        if (this.templateListClickHandler) {
            container.removeEventListener('click', this.templateListClickHandler);
        }
        
        // Single event delegation handler for all buttons and cards
        this.templateListClickHandler = async (e) => {
            const target = e.target;
            const button = target.closest('button');
            const card = target.closest('.template-grid-card, .template-list-card');
            
            // Handle button clicks
            if (button) {
                e.stopPropagation();
                const templateId = button.dataset.templateId;
                
                // Quick copy button
                if (button.classList.contains('quick-copy-btn')) {
                    await this.handleQuickCopy(templateId, button);
                    return;
                }
                
                // Use button
                if (button.classList.contains('template-use-btn')) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                    button.disabled = true;
                    try {
                        await this.selectTemplate(templateId);
                    } finally {
                        if (button && button.parentElement) {
                            button.innerHTML = originalHTML;
                            button.disabled = false;
                        }
                    }
                }
                // Duplicate button
                else if (button.classList.contains('template-duplicate-btn')) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    button.disabled = true;
                    try {
                        await this.handleDuplicateTemplate(templateId);
                    } finally {
                        if (button && button.parentElement) {
                            button.innerHTML = originalHTML;
                            button.disabled = false;
                        }
                    }
                }
                // Edit button
                else if (button.classList.contains('template-edit-btn')) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    button.disabled = true;
                    try {
                        await this.handleEditTemplate(templateId);
                    } finally {
                        if (button && button.parentElement) {
                            button.innerHTML = originalHTML;
                            button.disabled = false;
                        }
                    }
                }
                // Delete button
                else if (button.classList.contains('template-delete-btn')) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    button.disabled = true;
                    try {
                        await this.handleDeleteTemplate(templateId);
                    } finally {
                        if (button && button.parentElement) {
                            button.innerHTML = originalHTML;
                            button.disabled = false;
                        }
                    }
                }
                // Preview button
                else if (button.classList.contains('template-preview-btn')) {
                    const templateId = button.dataset.templateId;
                    this.showFullPreview(templateId);
                }
                // Favorite button
                else if (button.classList.contains('favorite-btn')) {
                    const templateId = button.dataset.templateId;
                    this.toggleFavorite(templateId);
                    this.renderTabs();
                    this.renderTemplates();
                }
                // Rate button
                else if (button.classList.contains('template-rate-btn')) {
                    const templateId = button.dataset.templateId;
                    this.showRatingModal(templateId);
                }
            }
            // Handle card click
            else if (card && !target.closest('button')) {
                const templateId = card.dataset.templateId;
                
                // If in comparison mode, toggle selection
                if (this.comparisonMode) {
                    this.toggleComparisonSelection(templateId);
                } else {
                    // Normal click - show preview
                    this.showFullPreview(templateId);
                }
            }
        };
        
        // Attach single delegated event handler
        container.addEventListener('click', this.templateListClickHandler);
    }

    /**
     * Get complexity level based on line count and content
     */
    getComplexity(lineCount, lines) {
        if (lineCount === 1) return 'Easy';
        if (lineCount <= 3) return 'Medium';
        return 'Hard';
    }

    /**
     * Show full preview of template with comments section
     */
    async showFullPreview(templateId) {
        const template = this.allTemplates.find(t => t.id === templateId);
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }
        
        // Increment view count
        this.incrementViewCount(templateId);
        
        let extractedLines;
        if (template.skillLine) {
            // Built-in template
            extractedLines = this.extractSkillLines(template.skillLine);
        } else if (template.skillLines) {
            // User template
            extractedLines = template.skillLines;
        } else {
            console.error('Template has no skill lines:', template);
            return;
        }
        
        const displayLines = Array.isArray(extractedLines) ? extractedLines.join('\n') : extractedLines;
        const viewCount = this.getViewCount(templateId);
        const commentCount = template.comment_count || 0;
        const isAuthenticated = this.templateManager?.auth?.isAuthenticated();
        
        const modal = document.createElement('div');
        modal.className = 'condition-modal-overlay active';
        modal.style.cssText = 'display: flex !important; z-index: 10000 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.8) !important; align-items: center !important; justify-content: center !important;';
        modal.innerHTML = `
            <div class="condition-modal" style="max-width: 950px; max-height: 90vh; width: 95%; background: var(--bg-primary); border-radius: 8px; display: flex; flex-direction: column; position: relative;">
                <div class="condition-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        ${template.icon || this.getCategoryIcon(template.category)} ${template.name}
                        <span class="view-count-badge" style="font-size: 0.8rem;"><i class="fas fa-eye"></i> ${viewCount}</span>
                    </h2>
                    <button class="close-modal preview-close" style="background: none; border: none; color: var(--text-primary); font-size: 1.5rem; cursor: pointer; padding: 0.5rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="condition-content" style="padding: 1.5rem; overflow-y: auto; flex: 1;">
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">${template.description}</p>
                    <div class="template-preview" style="margin: 0; position: relative;">
                        <div class="preview-label" style="font-weight: 600; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>Full Template (${Array.isArray(extractedLines) ? extractedLines.length : 1} lines):</span>
                            <button class="btn btn-secondary btn-sm preview-copy-btn" title="Copy to clipboard">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <pre style="max-height: 300px; overflow-y: auto; background: var(--bg-secondary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color);"><code>${this.escapeHtml(displayLines)}</code></pre>
                    </div>
                    
                    <!-- Comments Section -->
                    <div class="template-comments-section" style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-comments"></i> Comments
                                <span class="comment-count-badge" style="background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.75rem; color: var(--text-secondary);">${commentCount}</span>
                            </h3>
                        </div>
                        
                        <!-- Add Comment Form -->
                        ${isAuthenticated ? `
                            <div class="add-comment-form" style="margin-bottom: 1rem; display: flex; gap: 0.75rem; align-items: flex-start;">
                                <div class="comment-avatar" style="width: 36px; height: 36px; flex-shrink: 0;" data-user-avatar>
                                    ${this.renderCurrentUserAvatar(36)}
                                </div>
                                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                                    <textarea 
                                        id="newCommentInput" 
                                        placeholder="Write a comment..." 
                                        rows="2"
                                        maxlength="2000"
                                        style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); resize: vertical; font-family: inherit; font-size: 0.875rem;"
                                    ></textarea>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span class="char-count" style="font-size: 0.75rem; color: var(--text-tertiary);">0/2000</span>
                                        <button class="btn btn-primary btn-sm submit-comment-btn" disabled>
                                            <i class="fas fa-paper-plane"></i> Post Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 6px; text-align: center; margin-bottom: 1rem;">
                                <i class="fas fa-lock" style="color: var(--text-secondary); margin-right: 0.5rem;"></i>
                                <span style="color: var(--text-secondary);">Please <a href="#" class="login-to-comment" style="color: var(--accent-primary);">sign in</a> to post comments</span>
                            </div>
                        `}
                        
                        <!-- Comments List -->
                        <div class="comments-list" id="templateCommentsList" style="max-height: 250px; overflow-y: auto;">
                            <div class="comments-loading" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                <i class="fas fa-spinner fa-spin"></i> Loading comments...
                            </div>
                        </div>
                    </div>
                </div>
                <div class="condition-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button class="btn btn-secondary preview-cancel">Close</button>
                    <button class="btn btn-primary preview-use" data-template-id="${templateId}">
                        <i class="fas fa-plus"></i>
                        Use Template
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Load comments
        this.loadAndRenderComments(templateId, modal);
        
        // Event handlers
        modal.querySelector('.preview-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.preview-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('.preview-use').addEventListener('click', () => {
            modal.remove();
            this.selectTemplate(templateId);
        });
        modal.querySelector('.preview-copy-btn').addEventListener('click', async (e) => {
            try {
                await navigator.clipboard.writeText(displayLines);
                const btn = e.currentTarget;
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.style.background = 'var(--success-color, #28a745)';
                btn.style.color = 'white';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 1500);
                this.showNotification('Copied to clipboard!', 'success');
            } catch (err) {
                this.showNotification('Failed to copy', 'error');
            }
        });
        
        // Login link handler
        modal.querySelector('.login-to-comment')?.addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
            window.authUI?.showAuthModal();
        });
        
        // Comment form handlers
        const commentInput = modal.querySelector('#newCommentInput');
        const charCount = modal.querySelector('.char-count');
        const submitBtn = modal.querySelector('.submit-comment-btn');
        
        if (commentInput && submitBtn) {
            commentInput.addEventListener('input', () => {
                const length = commentInput.value.length;
                charCount.textContent = `${length}/2000`;
                submitBtn.disabled = length === 0 || length > 2000;
            });
            
            submitBtn.addEventListener('click', async () => {
                const content = commentInput.value.trim();
                if (!content) return;
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
                
                try {
                    await this.templateManager.addComment(templateId, content);
                    commentInput.value = '';
                    charCount.textContent = '0/2000';
                    this.showNotification('Comment posted!', 'success');
                    
                    // Reload comments
                    await this.loadAndRenderComments(templateId, modal);
                    
                    // Update comment count badge
                    const countBadge = modal.querySelector('.comment-count-badge');
                    if (countBadge) {
                        const currentCount = parseInt(countBadge.textContent) || 0;
                        countBadge.textContent = currentCount + 1;
                    }
                } catch (error) {
                    this.showNotification(error.message || 'Failed to post comment', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
                }
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    /**
     * Load and render comments for a template
     */
    async loadAndRenderComments(templateId, modal) {
        const commentsList = modal.querySelector('#templateCommentsList');
        if (!commentsList) return;
        
        try {
            const comments = await this.templateManager?.getTemplateComments(templateId) || [];
            
            if (comments.length === 0) {
                commentsList.innerHTML = `
                    <div class="no-comments" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fas fa-comment-slash" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem; display: block;"></i>
                        <p style="margin: 0;">No comments yet. Be the first to share your thoughts!</p>
                    </div>
                `;
                return;
            }
            
            commentsList.innerHTML = comments.map(comment => this.renderComment(comment)).join('');
            
            // Attach click handlers for user profile popups
            commentsList.querySelectorAll('.comment-user-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const userId = link.dataset.userId;
                    if (userId) {
                        this.showUserProfilePopup(userId);
                    }
                });
            });
            
        } catch (error) {
            console.error('Failed to load comments:', error);
            commentsList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-triangle" style="color: var(--warning-color);"></i>
                    Failed to load comments
                </div>
            `;
        }
    }
    
    /**
     * Render a single comment
     */
    renderComment(comment) {
        const user = comment.user || {};
        const displayName = user.display_name || 'Anonymous';
        const avatarUrl = user.avatar_url;
        const timeAgo = this.formatTimeAgo(comment.created_at);
        const isEdited = comment.is_edited;
        
        // Avatar HTML
        const avatarHtml = avatarUrl 
            ? `<img src="${avatarUrl}" alt="${this.escapeHtml(displayName)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
            : `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${displayName.charAt(0).toUpperCase()}</div>`;
        
        return `
            <div class="comment-item" data-comment-id="${comment.id}" style="display: flex; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                <a href="#" class="comment-user-link comment-avatar" data-user-id="${comment.user_id}" style="width: 36px; height: 36px; flex-shrink: 0; cursor: pointer; text-decoration: none;">
                    ${avatarHtml}
                </a>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <a href="#" class="comment-user-link" data-user-id="${comment.user_id}" style="font-weight: 600; color: var(--text-primary); text-decoration: none; cursor: pointer;">
                            ${this.escapeHtml(displayName)}
                        </a>
                        <span style="font-size: 0.75rem; color: var(--text-tertiary);">${timeAgo}</span>
                        ${isEdited ? '<span style="font-size: 0.7rem; color: var(--text-tertiary); font-style: italic;">(edited)</span>' : ''}
                    </div>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem; line-height: 1.4; word-wrap: break-word;">${this.escapeHtml(comment.content)}</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render current user's avatar for the comment form
     */
    renderCurrentUserAvatar(size = 36) {
        const avatar = window.userProfileManager?.getAvatarUrl();
        const displayName = window.userProfileManager?.getDisplayName() || 'User';
        
        if (avatar) {
            return `<img src="${avatar}" alt="${this.escapeHtml(displayName)}" style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;">`;
        }
        
        const initials = displayName.charAt(0).toUpperCase();
        return `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${size * 0.4}px;">${initials}</div>`;
    }
    
    /**
     * Show user profile popup
     */
    async showUserProfilePopup(userId) {
        const profile = await this.templateManager?.getUserProfile(userId);
        
        if (!profile) {
            this.showNotification('Could not load user profile', 'error');
            return;
        }
        
        // If profile is not public and it's not the current user
        const currentUserId = window.userProfileManager?.getUserId();
        if (!profile.is_public && profile.user_id !== currentUserId) {
            this.showNotification('This user has a private profile', 'info');
            return;
        }
        
        const displayName = profile.display_name || 'Anonymous';
        const avatarUrl = profile.avatar_url;
        const bio = profile.bio || 'No bio provided';
        const website = profile.website_url;
        const discord = profile.discord_username;
        const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown';
        
        // Avatar HTML
        const avatarHtml = avatarUrl 
            ? `<img src="${avatarUrl}" alt="${this.escapeHtml(displayName)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
            : `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 32px;">${displayName.charAt(0).toUpperCase()}</div>`;
        
        const popup = document.createElement('div');
        popup.className = 'user-profile-popup-overlay';
        popup.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 11000;';
        popup.innerHTML = `
            <div class="user-profile-popup" style="background: var(--bg-primary); border-radius: 12px; padding: 1.5rem; max-width: 400px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: flex-end; margin-bottom: -0.5rem;">
                    <button class="popup-close" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.5rem; font-size: 1.2rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 1rem;">
                        ${avatarHtml}
                    </div>
                    <h3 style="margin: 0 0 0.25rem 0; font-size: 1.25rem;">${this.escapeHtml(displayName)}</h3>
                    <p style="margin: 0; font-size: 0.8rem; color: var(--text-tertiary);">Member since ${joinDate}</p>
                </div>
                
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fas fa-user"></i> About
                    </h4>
                    <p style="margin: 0; color: var(--text-primary); font-size: 0.9rem; line-height: 1.5;">${this.escapeHtml(bio)}</p>
                </div>
                
                ${website || discord ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center;">
                        ${website ? `
                            <a href="${this.escapeHtml(website)}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--bg-tertiary); border-radius: 6px; color: var(--text-primary); text-decoration: none; font-size: 0.85rem;">
                                <i class="fas fa-globe"></i> Website
                            </a>
                        ` : ''}
                        ${discord ? `
                            <span style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #5865F2; border-radius: 6px; color: white; font-size: 0.85rem;">
                                <i class="fab fa-discord"></i> ${this.escapeHtml(discord)}
                            </span>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Close handlers
        popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.remove();
        });
    }
    
    /**
     * Format timestamp to relative time
     */
    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffWeeks < 4) return `${diffWeeks}w ago`;
        if (diffMonths < 12) return `${diffMonths}mo ago`;
        return date.toLocaleDateString();
    }

    /**
     * Select a template
     */
    selectTemplate(templateId) {
        // Find template in merged list (built-in or user-created)
        const template = this.allTemplates.find(t => t.id === templateId);
        
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }
        
        // Add to recent
        this.addToRecent(templateId);
        
        // Track template use in cloud (non-blocking)
        if (this.templateManager) {
            this.templateManager.trackTemplateUse(templateId).catch(err => {
                console.warn('Failed to track use in cloud:', err);
            });
        }
        
        // Activity tracking
        window.activityTracker?.trackTemplateUse(templateId);
        
        if (this.onSelectCallback) {
            // Pass the full template object so receiving code can access sections, skillLines, etc.
            // This supports both old format (built-in with skillLine string) and new format (with sections array)
            this.onSelectCallback(template);
        }
        
        this.close();
    }
    
    /**
     * Extract only skill lines from template, removing internal skill names
     * Handles both simple single-line templates and complex multi-skill templates
     * Now also applies effect: prefix based on user preference
     */
    extractSkillLines(skillLine) {
        let lines = [];
        
        // If template has multiple lines separated by \n (actual newline)
        if (skillLine.includes('\n')) {
            lines = skillLine.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line.startsWith('- '));
            
            // If no lines found after filtering, return as single line
            if (lines.length === 0) lines = [skillLine];
        }
        // Single line template
        else {
            lines = [skillLine];
        }
        
        // Apply effect: prefix if user has enabled it
        const useEffectPrefix = localStorage.getItem('mechanicBrowser_useEffectPrefix') === 'true';
        if (useEffectPrefix) {
            lines = lines.map(line => this.applyEffectPrefix(line));
        }
        
        return lines;
    }
    
    /**
     * Apply effect: prefix to mechanics that support it
     */
    applyEffectPrefix(line) {
        // Parse mechanic name from line: "- mechanicName{...}"
        const match = line.match(/^-\s+([a-zA-Z_]+)/);
        if (!match) return line;
        
        const mechanicName = match[1];
        
        // Check if already has effect: prefix
        if (mechanicName.toLowerCase().startsWith('effect')) {
            return line;
        }
        
        // List of mechanics that support effect: prefix
        const effectMechanics = [
            'particles', 'particleline', 'particleorbital', 'particlebox', 'particlesphere',
            'sound', 'playsound', 'stopsound',
            'blockmask', 'setblock', 'modifyblock'
        ];
        
        // Check if this mechanic supports effect: prefix
        if (effectMechanics.includes(mechanicName.toLowerCase())) {
            // Replace mechanic name with effect: version
            return line.replace(/^(-\s+)([a-zA-Z_]+)/, `$1effect:$2`);
        }
        
        return line;
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
     * Render star rating display
     * @param {number} rating - Average rating (0-5)
     * @param {number} count - Number of ratings
     * @returns {string} HTML for star rating display
     */
    renderStarRating(rating, count) {
        if (!count || count === 0) {
            return '<div class="star-rating-display" style="justify-content: center; margin-bottom: 0.25rem;"><span style="color: var(--text-muted); font-size: 0.75rem;">No ratings yet</span></div>';
        }
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) {
                starsHtml += '<i class="fas fa-star star filled"></i>';
            } else if (rating >= i - 0.5) {
                starsHtml += '<i class="fas fa-star-half-alt star filled"></i>';
            } else {
                starsHtml += '<i class="far fa-star star"></i>';
            }
        }
        
        return `
            <div class="star-rating-display" style="justify-content: center; margin-bottom: 0.25rem;">
                ${starsHtml}
                <span class="rating-count">(${count})</span>
            </div>
        `;
    }
    
    /**
     * Render interactive star rating for rating modal
     * @param {number} currentRating - User's current rating (0 if none)
     * @param {string} templateId - Template ID
     * @returns {string} HTML for interactive stars
     */
    renderInteractiveStars(currentRating, templateId) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const isActive = currentRating >= i;
            starsHtml += `
                <button class="star-btn ${isActive ? 'active' : ''}" 
                        data-rating="${i}" 
                        data-template-id="${templateId}"
                        title="Rate ${i} star${i > 1 ? 's' : ''}">
                    <i class="${isActive ? 'fas' : 'far'} fa-star"></i>
                </button>
            `;
        }
        
        return `<div class="star-rating-input">${starsHtml}</div>`;
    }
    
    /**
     * Show rating modal for a template
     */
    async showRatingModal(templateId) {
        const template = this.allTemplates.find(t => t.id === templateId);
        if (!template) return;
        
        // Check if user is authenticated
        if (!this.templateManager?.auth?.isAuthenticated()) {
            window.notificationModal?.alert(
                'Please log in to rate templates.',
                'info',
                'Login Required'
            );
            return;
        }
        
        // Get user's current rating
        const userRating = await this.templateManager.getUserRating(templateId);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        modal.innerHTML = `
            <div class="modal-content" style="background: var(--bg-primary); border-radius: 8px; padding: 1.5rem; max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-star" style="color: #ffc107;"></i>
                    Rate Template
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    How would you rate "<strong>${this.escapeHtml(template.name)}</strong>"?
                </p>
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    ${this.renderInteractiveStars(userRating || 0, templateId)}
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    ${userRating ? `
                        <button class="btn btn-secondary" id="removeRatingBtn">
                            <i class="fas fa-times"></i> Remove Rating
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" id="cancelRatingBtn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle star clicks
        modal.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('mouseover', (e) => {
                const rating = parseInt(btn.dataset.rating);
                modal.querySelectorAll('.star-btn').forEach((b, i) => {
                    b.classList.toggle('hovered', i < rating);
                });
            });
            
            btn.addEventListener('mouseout', () => {
                modal.querySelectorAll('.star-btn').forEach(b => {
                    b.classList.remove('hovered');
                });
            });
            
            btn.addEventListener('click', async () => {
                const rating = parseInt(btn.dataset.rating);
                try {
                    await this.templateManager.rateTemplate(templateId, rating);
                    
                    // Track activity
                    window.activityTracker?.trackTemplateRate(templateId, rating);
                    
                    // Update local template data
                    if (template) {
                        // Re-fetch to get updated average
                        const updated = await this.templateManager.getTemplateById(templateId);
                        if (updated) {
                            template.average_rating = updated.average_rating;
                            template.rating_count = updated.rating_count;
                        }
                    }
                    
                    document.body.removeChild(modal);
                    this.renderTemplates(); // Refresh display
                    
                    window.notificationModal?.toast('Rating saved!', 'success');
                } catch (error) {
                    console.error('Failed to rate:', error);
                    window.notificationModal?.toast('Failed to save rating', 'error');
                }
            });
        });
        
        // Cancel button
        modal.querySelector('#cancelRatingBtn')?.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Remove rating button
        modal.querySelector('#removeRatingBtn')?.addEventListener('click', async () => {
            try {
                await this.templateManager.removeRating(templateId);
                document.body.removeChild(modal);
                this.renderTemplates();
                window.notificationModal?.toast('Rating removed', 'info');
            } catch (error) {
                console.error('Failed to remove rating:', error);
            }
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // ========================================
    // NEW: HYBRID LOADING METHODS
    // ========================================
    
    /**
     * Load all templates (built-in + remote)
     */
    async loadAllTemplates() {
        // No built-in templates - database only
        this.builtInTemplates = [];
        
        // Load remote templates (async)
        await this.loadRemoteTemplates();
        
        // Merge templates
        this.mergeTemplates();
    }
    
    /**
     * Load remote templates from Supabase
     */
    async loadRemoteTemplates() {
        if (!this.templateManager) {
            if (window.DEBUG_MODE) console.log('TemplateManager not available, using built-in only');
            this.userTemplates = [];
            return;
        }
        
        try {
            const remote = await this.templateManager.getAllTemplates(this.context);
            this.userTemplates = remote;
            if (window.DEBUG_MODE) console.log(`Loaded ${remote.length} remote templates:`, remote);
        } catch (error) {
            console.error('Failed to load remote templates:', error);
            this.userTemplates = [];
        }
    }
    
    /**
     * Merge built-in and user templates
     */
    mergeTemplates() {
        this.allTemplates = [
            ...this.builtInTemplates,
            ...this.userTemplates
        ];
        
        // Clear render cache when templates change
        this.renderCache.clear();
        this.lastRenderKey = null;
    }
    
    /**
     * Refresh templates (force reload)
     */
    async refresh() {
        
        const refreshBtn = document.getElementById('templateSelectorRefresh');
        const originalHTML = refreshBtn?.innerHTML;
        
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            refreshBtn.disabled = true;
        }
        
        // Invalidate cache
        if (this.templateManager) {
            this.templateManager.invalidateCache();
        }
        
        // Reload
        await this.loadAllTemplates();
        
        // Re-render
        this.renderTabs();
        this.renderTemplates();
        
        if (refreshBtn) {
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
        }
        
        if (window.app) {
            this.showNotification('Templates refreshed!', 'success');
        }
    }
    
    /**
     * Show loading state with skeleton cards
     */
    showLoading() {
        this.isLoading = true;
        const container = document.getElementById('templateList');
        if (container) {
            const skeletonCount = this.viewMode === 'grid' ? 12 : 6;
            const gridClass = this.viewMode === 'grid' ? 'template-grid' : 'template-list';
            
            let html = `<div class="${gridClass}">`;
            for (let i = 0; i < skeletonCount; i++) {
                html += `
                    <div class="skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-title"></div>
                        <div class="skeleton-badges">
                            <div class="skeleton-badge"></div>
                            <div class="skeleton-badge"></div>
                        </div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-buttons"></div>
                    </div>
                `;
            }
            html += '</div>';
            
            container.innerHTML = html;
        }
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        this.isLoading = false;
        
        // Issue #4: Clear skeleton timeout when successfully loaded
        if (this.skeletonTimeout) {
            clearTimeout(this.skeletonTimeout);
            this.skeletonTimeout = null;
        }
    }
    
    /**
     * Check if user owns a template
     */
    isOwner(template) {
        if (template.isBuiltIn) {
            return false;
        }
        
        if (!window.authManager?.isAuthenticated()) {
            return false;
        }
        
        const currentUser = window.authManager.getCurrentUser();
        const isOwner = currentUser && template.owner_id === currentUser.id;
        
        return isOwner;
    }
    
    /**
     * Check if user can edit template
     * Super admins can edit any template, regular users can only edit their own
     */
    canEdit(template) {
        // Built-in templates can't be edited
        if (template.isBuiltIn) {
            return false;
        }
        
        // Check if user is super admin or has edit_any permission
        if (window.adminManager?.isAdmin && window.adminManager.hasPermission('edit_official_template')) {
            return true;
        }
        
        // Regular users can only edit their own templates
        return this.isOwner(template);
    }
    
    /**
     * Check if user can delete template
     * Super admins can delete any template, regular users can only delete their own
     */
    canDelete(template) {
        // Built-in templates can't be deleted
        if (template.isBuiltIn) {
            return false;
        }
        
        // Check if user is super admin or has delete_any permission
        if (window.adminManager?.isAdmin && window.adminManager.hasPermission('delete_official_template')) {
            return true;
        }
        
        // Regular users can only delete their own templates
        return this.isOwner(template);
    }
    
    /**
     * Handle edit template action
     */
    async handleEditTemplate(templateId) {
        if (!this.templateEditor) {
            console.error('TemplateEditor not available');
            return;
        }
        
        try {
            const template = this.allTemplates.find(t => t.id === templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            
            if (!this.canEdit(template)) {
                this.showNotification('You don\'t have permission to edit this template. Try duplicating instead!', 'warning');
                return;
            }
            
            this.templateEditor.open({
                mode: 'edit',
                template: template,
                onSave: async () => {
                    await this.refresh();
                }
            });
            
        } catch (error) {
            console.error('Failed to edit template:', error);
            this.showNotification('Failed to open template editor', 'error');
        }
    }
    
    /**
     * Handle delete template action
     */
    async handleDeleteTemplate(templateId) {
        if (!this.templateManager) return;
        
        const template = this.allTemplates.find(t => t.id === templateId);
        if (!template) return;
        
        if (!this.canDelete(template)) {
            this.showNotification('You don\'t have permission to delete this template', 'warning');
            return;
        }
        
        const confirmed = await window.notificationModal.confirm(
            `Delete template "${template.name}"?\n\nThis action cannot be undone.`,
            'Delete Template',
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                confirmClass: 'danger',
                icon: '🗑️',
                type: 'warning'
            }
        );
        
        if (!confirmed) return;
        
        try {
            await this.templateManager.deleteTemplate(templateId);
            await this.refresh();
            this.showNotification('Template deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete template:', error);
            this.showNotification(error.message || 'Failed to delete template', 'error');
        }
    }
    
    /**
     * Handle duplicate template action
     */
    async handleDuplicateTemplate(templateId) {
        
        if (!window.authManager?.isAuthenticated()) {
            this.showNotification('Sign in to save custom templates', 'warning');
            return;
        }
        
        if (!this.templateManager || !this.templateEditor) {
            console.error('Template manager or editor not available');
            return;
        }
        
        try {
            const template = this.allTemplates.find(t => t.id === templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            
            // Extract skill lines based on format
            let skillLines = [];
            if (template.skillLine) {
                // Built-in template
                skillLines = this.extractSkillLines(template.skillLine);
            } else if (template.skillLines) {
                // User template
                skillLines = template.skillLines;
            }
            
            // Open editor with cloned data
            this.templateEditor.open({
                mode: 'create',
                skillLines: skillLines,
                template: {
                    name: `${template.name} (Copy)`,
                    description: template.description,
                    category: template.category || template.data?.category,
                    icon: template.icon || template.data?.icon,
                    tags: template.tags || []
                },
                onSave: async () => {
                    await this.refresh();
                }
            });
            
        } catch (error) {
            console.error('Failed to duplicate template:', error);
            this.showNotification('Failed to duplicate template', 'error');
        }
    }
    
    /**
     * Handle create new template action
     */
    async handleCreateTemplate() {
        
        if (!window.authManager?.isAuthenticated()) {
            this.showNotification('Please sign in to create templates', 'warning');
            return;
        }
        
        if (!window.templateWizard) {
            console.error('Template wizard not available');
            return;
        }
        
        try {
            // Open new 2-step wizard with callback to refresh
            // Pass context so wizard can auto-select correct type (skill vs mob)
            await window.templateWizard.open(null, false, async (newTemplate) => {
                await this.refresh();
            }, this.context); // Pass context for auto-selection
        } catch (error) {
            console.error('Failed to open template wizard:', error);
            this.showNotification('Failed to open template wizard', 'error');
        }
    }

    /**
     * Get all categories from loaded templates
     */
    getAllCategories() {
        const categories = new Set();
        this.allTemplates
            .filter(t => t.type === this.context)
            .forEach(t => {
                if (t.category) categories.add(t.category);
            });
        return Array.from(categories).sort();
    }

    /**
     * Get templates by category
     */
    getByCategory(category) {
        return this.allTemplates.filter(t => 
            t.type === this.context && t.category === category
        );
    }

    /**
     * Get category icon
     */
    getCategoryIcon(category) {
        const icons = {
            'combat': '⚔️',
            'effects': '✨',
            'movement': '🏃',
            'utility': '🔧',
            'defense': '🛡️',
            'summons': '👥',
            'projectiles': '🏹',
            'auras': '💫',
            'teleport': '🌀'
        };
        return icons[category?.toLowerCase()] || '📦';
    }

    /**
     * Get category display name
     */
    getCategoryDisplayName(category) {
        const names = {
            'combat': 'Combat',
            'effects': 'Effects',
            'movement': 'Movement',
            'utility': 'Utility',
            'defense': 'Defense',
            'summons': 'Summons',
            'projectiles': 'Projectiles',
            'auras': 'Auras',
            'teleport': 'Teleport'
        };
        return names[category?.toLowerCase()] || category;
    }
    
    // ========================================
    // NEW FEATURES - Quick Copy, Comparison Mode, Search Suggestions, etc.
    // ========================================
    
    /**
     * Handle quick copy to clipboard
     */
    async handleQuickCopy(templateId, button) {
        const template = this.allTemplates.find(t => t.id === templateId);
        if (!template) return;
        
        // Get skill lines
        let lines;
        if (template.sections && Array.isArray(template.sections)) {
            lines = template.sections.map(s => s.lines || []).flat();
        } else if (template.skillLines) {
            lines = template.skillLines;
        } else if (template.skillLine) {
            lines = this.extractSkillLines(template.skillLine);
        } else {
            lines = [];
        }
        
        const text = Array.isArray(lines) ? lines.join('\n') : lines;
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('copied');
            
            this.showNotification(`Copied "${template.name}" to clipboard!`, 'success');
            
            // Increment view count
            this.incrementViewCount(templateId);
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 1500);
        } catch (err) {
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }
    
    /**
     * Toggle comparison mode
     */
    toggleComparisonMode() {
        this.comparisonMode = !this.comparisonMode;
        
        const toggleBtn = document.getElementById('toggleComparisonMode');
        const toggleDropdownBtn = document.getElementById('toggleComparisonModeDropdown');
        const compareBtn = document.getElementById('templateCompareBtn');
        const panel = document.getElementById('comparisonPanel');
        const templateList = document.getElementById('templateList');
        
        if (this.comparisonMode) {
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                toggleBtn.style.background = 'var(--primary-color)';
                toggleBtn.style.color = 'white';
            }
            if (toggleDropdownBtn) {
                toggleDropdownBtn.innerHTML = '<i class="fas fa-check"></i> Compare Mode (On)';
            }
            if (compareBtn) compareBtn.style.display = 'inline-flex';
            if (panel) panel.style.display = 'block';
            if (templateList) templateList.classList.add('comparison-mode');
            this.showNotification('Comparison mode enabled. Click templates to select.', 'info');
        } else {
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                toggleBtn.style.background = '';
                toggleBtn.style.color = '';
            }
            if (toggleDropdownBtn) {
                toggleDropdownBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Compare Mode';
            }
            if (compareBtn) compareBtn.style.display = 'none';
            if (panel) panel.style.display = 'none';
            if (templateList) templateList.classList.remove('comparison-mode');
            this.clearComparison();
        }
    }
    
    /**
     * Toggle template selection for comparison
     */
    toggleComparisonSelection(templateId) {
        const index = this.selectedForComparison.indexOf(templateId);
        
        if (index === -1) {
            // Add to comparison (max 4)
            if (this.selectedForComparison.length >= 4) {
                this.showNotification('Maximum 4 templates can be compared at once', 'warning');
                return;
            }
            this.selectedForComparison.push(templateId);
        } else {
            // Remove from comparison
            this.selectedForComparison.splice(index, 1);
        }
        
        this.updateComparisonUI();
        this.renderTemplates();
    }
    
    /**
     * Update comparison UI elements
     */
    updateComparisonUI() {
        const count = this.selectedForComparison.length;
        
        // Update count displays
        document.getElementById('compareCountText').textContent = count;
        const countBadge = document.querySelector('.compare-count');
        if (countBadge) {
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
        
        // Enable/disable compare button
        const showBtn = document.getElementById('showComparisonBtn');
        if (showBtn) {
            showBtn.disabled = count < 2;
        }
        
        // Update selected list
        const listContainer = document.getElementById('comparisonSelectedList');
        if (listContainer) {
            listContainer.innerHTML = this.selectedForComparison.map(id => {
                const template = this.allTemplates.find(t => t.id === id);
                if (!template) return '';
                const icon = template.icon || this.getCategoryIcon(template.category);
                return `
                    <span class="comparison-selected-tag">
                        ${icon} ${this.escapeHtml(template.name)}
                        <span class="remove-compare" data-template-id="${id}">
                            <i class="fas fa-times"></i>
                        </span>
                    </span>
                `;
            }).join('');
            
            // Attach remove handlers
            listContainer.querySelectorAll('.remove-compare').forEach(el => {
                el.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.templateId;
                    this.toggleComparisonSelection(id);
                });
            });
        }
    }
    
    /**
     * Clear comparison selection
     */
    clearComparison() {
        this.selectedForComparison = [];
        this.updateComparisonUI();
        this.renderTemplates();
    }
    
    /**
     * Show comparison modal
     */
    showComparisonModal() {
        if (this.selectedForComparison.length < 2) {
            this.showNotification('Select at least 2 templates to compare', 'warning');
            return;
        }
        
        const templates = this.selectedForComparison.map(id => 
            this.allTemplates.find(t => t.id === id)
        ).filter(Boolean);
        
        const content = document.getElementById('comparisonContent');
        content.innerHTML = `
            <div class="comparison-grid">
                ${templates.map(template => {
                    const icon = template.icon || this.getCategoryIcon(template.category);
                    const lines = this.getTemplateLines(template);
                    const lineCount = lines.length;
                    const complexity = this.getComplexity(lineCount, lines);
                    const structureInfo = this.getStructureInfo(template);
                    
                    return `
                        <div class="comparison-card">
                            <div class="comparison-card-header">
                                <span style="font-size: 1.5rem;">${icon}</span>
                                <div style="flex: 1;">
                                    <h3 style="margin: 0; font-size: 1rem;">${this.escapeHtml(template.name)}</h3>
                                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${this.getCategoryDisplayName(template.category)}</span>
                                </div>
                            </div>
                            <div class="comparison-card-body">
                                <div class="comparison-stat">
                                    <span>Lines</span>
                                    <strong>${lineCount}</strong>
                                </div>
                                <div class="comparison-stat">
                                    <span>Complexity</span>
                                    <strong>${complexity}</strong>
                                </div>
                                <div class="comparison-stat">
                                    <span>Structure</span>
                                    <strong>${structureInfo.label}</strong>
                                </div>
                                <div class="comparison-stat">
                                    <span>Views</span>
                                    <strong>${this.getViewCount(template.id)}</strong>
                                </div>
                                <div style="margin-top: 1rem;">
                                    <strong style="display: block; margin-bottom: 0.5rem;">Code:</strong>
                                    <div class="comparison-card-code">${this.escapeHtml(lines.join('\n'))}</div>
                                </div>
                                <div style="margin-top: 1rem;">
                                    <button class="btn btn-primary btn-sm" onclick="window.templateSelector.selectTemplate('${template.id}'); document.getElementById('comparisonModal').style.display='none';">
                                        <i class="fas fa-plus"></i> Use This
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        document.getElementById('comparisonModal').style.display = 'flex';
    }
    
    /**
     * Get template lines as array
     */
    getTemplateLines(template) {
        if (template.sections && Array.isArray(template.sections)) {
            return template.sections.map(s => s.lines || []).flat();
        } else if (template.skillLines) {
            return Array.isArray(template.skillLines) ? template.skillLines : [template.skillLines];
        } else if (template.skillLine) {
            return this.extractSkillLines(template.skillLine);
        }
        return [];
    }
    
    /**
     * Update search suggestions dropdown
     */
    updateSearchSuggestions(query) {
        const dropdown = document.getElementById('searchSuggestionsDropdown');
        
        if (!query || query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }
        
        // Find matching templates
        const matches = this.allTemplates
            .filter(t => {
                const nameMatch = t.name.toLowerCase().includes(query);
                const descMatch = t.description?.toLowerCase().includes(query);
                const catMatch = t.category?.toLowerCase().includes(query);
                return nameMatch || descMatch || catMatch;
            })
            .slice(0, 8);
        
        if (matches.length === 0) {
            dropdown.style.display = 'none';
            return;
        }
        
        dropdown.innerHTML = matches.map(template => {
            const icon = template.icon || this.getCategoryIcon(template.category);
            const categoryName = this.getCategoryDisplayName(template.category);
            const structureInfo = this.getStructureInfo(template);
            
            return `
                <div class="search-suggestion-item" data-template-id="${template.id}">
                    <div class="search-suggestion-icon">${icon}</div>
                    <div class="search-suggestion-text">
                        <div class="search-suggestion-name">${this.escapeHtml(template.name)}</div>
                        <div class="search-suggestion-meta">${categoryName} • ${this.getLineCount(template)} lines</div>
                    </div>
                    <span class="search-suggestion-type">${structureInfo.label}</span>
                </div>
            `;
        }).join('');
        
        // Attach click handlers
        dropdown.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const templateId = item.dataset.templateId;
                dropdown.style.display = 'none';
                this.showFullPreview(templateId);
            });
        });
        
        dropdown.style.display = 'block';
    }
    
    /**
     * Render category chips
     */
    renderCategoryChips() {
        const container = document.getElementById('categoryChipsContainer');
        if (!container) return;
        
        // Count templates per category
        const categoryCounts = {};
        this.allTemplates.forEach(t => {
            const cat = t.category || 'utility';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        const categories = Object.keys(this.subCategories);
        const chipsHTML = categories.map(cat => {
            const count = categoryCounts[cat] || 0;
            const icon = this.getCategoryIcon(cat);
            const isActive = this.currentTab === cat;
            return `
                <span class="category-chip ${isActive ? 'active' : ''}" data-category="${cat}" title="${this.getCategoryDisplayName(cat)}">
                    ${icon} ${this.getCategoryDisplayName(cat)}
                    <span class="chip-count">${count}</span>
                </span>
            `;
        }).join('');
        
        container.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-secondary); margin-right: 0.25rem;">Quick:</span>` + chipsHTML;
        
        // Attach click handlers
        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const category = chip.dataset.category;
                this.currentTab = category;
                this.selectedSubCategory = null;
                this.renderTabs();
                this.renderTemplates();
                this.renderCategoryChips();
                this.renderSubCategoryChips();
            });
        });
    }
    
    /**
     * Render sub-category chips
     */
    renderSubCategoryChips() {
        const container = document.getElementById('subCategoryChipsContainer');
        if (!container) return;
        
        const subCats = this.subCategories[this.currentTab];
        
        if (!subCats || subCats.length === 0 || this.currentTab === 'all' || this.currentTab === 'favorites' || this.currentTab === 'recent') {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        
        const chipsHTML = subCats.map(sub => {
            const isActive = this.selectedSubCategory === sub;
            return `
                <span class="sub-category-chip ${isActive ? 'active' : ''}" data-subcategory="${sub}">
                    ${sub}
                </span>
            `;
        }).join('');
        
        container.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-secondary); margin-right: 0.25rem;">Sub:</span>` + 
            `<span class="sub-category-chip ${!this.selectedSubCategory ? 'active' : ''}" data-subcategory="">All</span>` + chipsHTML;
        
        // Attach click handlers
        container.querySelectorAll('.sub-category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const subcat = chip.dataset.subcategory;
                this.selectedSubCategory = subcat || null;
                this.renderTemplates();
                this.renderSubCategoryChips();
            });
        });
    }
    
    /**
     * Handle batch export
     */
    handleBatchExport() {
        // Export all visible/filtered templates
        const templates = this.getFilteredTemplates();
        
        if (templates.length === 0) {
            this.showNotification('No templates to export', 'warning');
            return;
        }
        
        // Create YAML export
        const exportData = {
            exported_at: new Date().toISOString(),
            template_count: templates.length,
            templates: templates.map(t => ({
                name: t.name,
                description: t.description,
                category: t.category,
                structure_type: t.structure_type || 'multi-line',
                sections: t.sections || null,
                skillLines: t.skillLines || null,
                skillLine: t.skillLine || null
            }))
        };
        
        const yamlContent = this.objectToYaml(exportData);
        
        // Download file
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `templates-export-${Date.now()}.yml`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Exported ${templates.length} templates`, 'success');
    }
    
    /**
     * Handle batch import
     */
    async handleBatchImport() {
        const fileInput = document.getElementById('batchImportFile');
        const textInput = document.getElementById('batchImportText');
        
        let content = '';
        
        if (fileInput.files.length > 0) {
            content = await fileInput.files[0].text();
        } else if (textInput.value.trim()) {
            content = textInput.value.trim();
        } else {
            this.showNotification('Please select a file or paste YAML content', 'warning');
            return;
        }
        
        try {
            // Parse YAML (basic parsing)
            const parsed = this.parseYaml(content);
            
            if (!parsed || !parsed.templates || !Array.isArray(parsed.templates)) {
                throw new Error('Invalid template format');
            }
            
            let imported = 0;
            for (const template of parsed.templates) {
                if (template.name && (template.skillLines || template.skillLine || template.sections)) {
                    // Add to local templates (would need templateManager integration for persistence)
                    this.allTemplates.push({
                        id: `imported-${Date.now()}-${imported}`,
                        ...template,
                        isBuiltIn: false,
                        created_at: new Date().toISOString()
                    });
                    imported++;
                }
            }
            
            document.getElementById('batchImportModal').style.display = 'none';
            fileInput.value = '';
            textInput.value = '';
            
            this.renderTemplates();
            this.showNotification(`Imported ${imported} templates`, 'success');
            
        } catch (err) {
            this.showNotification('Failed to parse import: ' + err.message, 'error');
        }
    }
    
    /**
     * Simple YAML to object parser (basic)
     */
    parseYaml(content) {
        // This is a very basic parser - in production use js-yaml library
        try {
            // Try JSON first (in case it's JSON formatted)
            return JSON.parse(content);
        } catch {
            // Basic YAML parsing for simple structures
            const result = { templates: [] };
            const lines = content.split('\n');
            let currentTemplate = null;
            let currentKey = null;
            let arrayBuffer = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                
                if (trimmed === 'templates:') {
                    continue;
                }
                
                if (trimmed.startsWith('- name:')) {
                    if (currentTemplate) {
                        result.templates.push(currentTemplate);
                    }
                    currentTemplate = { name: trimmed.substring(7).trim().replace(/^["']|["']$/g, '') };
                    currentKey = null;
                    continue;
                }
                
                if (currentTemplate) {
                    const match = trimmed.match(/^(\w+):\s*(.*)$/);
                    if (match) {
                        const key = match[1];
                        const value = match[2].replace(/^["']|["']$/g, '');
                        if (value) {
                            currentTemplate[key] = value;
                        }
                        currentKey = key;
                    } else if (trimmed.startsWith('- ') && currentKey) {
                        if (!currentTemplate[currentKey]) {
                            currentTemplate[currentKey] = [];
                        }
                        if (Array.isArray(currentTemplate[currentKey])) {
                            currentTemplate[currentKey].push(trimmed.substring(2).replace(/^["']|["']$/g, ''));
                        }
                    }
                }
            }
            
            if (currentTemplate) {
                result.templates.push(currentTemplate);
            }
            
            return result;
        }
    }
    
    /**
     * Simple object to YAML converter
     */
    objectToYaml(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        let yaml = '';
        
        if (Array.isArray(obj)) {
            for (const item of obj) {
                if (typeof item === 'object' && item !== null) {
                    yaml += `${spaces}-\n${this.objectToYaml(item, indent + 1).replace(/^/gm, spaces + '  ').trimStart()}`;
                } else {
                    yaml += `${spaces}- ${JSON.stringify(item)}\n`;
                }
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                if (value === null || value === undefined) continue;
                if (typeof value === 'object') {
                    yaml += `${spaces}${key}:\n${this.objectToYaml(value, indent + 1)}`;
                } else {
                    yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
                }
            }
        }
        
        return yaml;
    }
    
    /**
     * Get filtered templates based on current filters
     */
    getFilteredTemplates() {
        let templates = [...this.allTemplates];
        
        // Tab filter
        if (this.currentTab === 'favorites') {
            templates = templates.filter(t => this.isFavorite(t.id));
        } else if (this.currentTab === 'recent') {
            const recentIds = this.recentTemplates.slice(0, 20);
            templates = templates.filter(t => recentIds.includes(t.id));
        } else if (this.currentTab !== 'all') {
            templates = templates.filter(t => t.category === this.currentTab);
        }
        
        // Sub-category filter
        if (this.selectedSubCategory) {
            templates = templates.filter(t => {
                // Check if template name or description matches sub-category
                const name = t.name.toLowerCase();
                const desc = (t.description || '').toLowerCase();
                const sub = this.selectedSubCategory.toLowerCase();
                return name.includes(sub) || desc.includes(sub);
            });
        }
        
        // Search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            templates = templates.filter(t => {
                const name = t.name.toLowerCase();
                const desc = (t.description || '').toLowerCase();
                const cat = (t.category || '').toLowerCase();
                return name.includes(query) || desc.includes(query) || cat.includes(query);
            });
        }
        
        // Apply other filters
        templates = this.applyFilters(templates);
        
        return templates;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateSelector;
}

// Loaded silently