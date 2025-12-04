/**
 * Condition Browser V2.0 - Modern Two-Panel Design
 * Matches Mechanic Browser design with virtual scrolling for performance
 * @version 2.0.0
 */

class ConditionBrowserV2 {
    constructor() {
        this.isOpen = false;
        this.context = 'skill';
        this.currentCondition = null;
        this.currentUsageMode = 'inline'; // 'inline', 'regular', 'targeter'
        this.currentPrefix = '?';
        this.currentAction = 'true';
        this.currentSectionType = 'Conditions';
        this.currentAttributes = {};
        this.searchQuery = '';
        this.currentFilter = 'all';
        this.onSelectCallback = null;
        
        // Performance
        this.virtualScroller = null;
        this.favorites = this.loadFavorites();
        this.recent = this.loadRecent();
        
        this.createModal();
        this.attachEventListeners();
        console.log('✅ ConditionBrowserV2 ready with', this.getConditionCount(), 'conditions');
    }
    
    getConditionCount() {
        return window.ALL_CONDITIONS ? window.ALL_CONDITIONS.length : 0;
    }
    
    loadFavorites() {
        try {
            const stored = localStorage.getItem('conditionBrowser_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveFavorites() {
        try {
            localStorage.setItem('conditionBrowser_favorites', JSON.stringify(this.favorites));
        } catch (e) {
            console.error('Failed to save favorites:', e);
        }
    }
    
    toggleFavorite(conditionId) {
        if (this.favorites.includes(conditionId)) {
            this.favorites = this.favorites.filter(id => id !== conditionId);
        } else {
            this.favorites.push(conditionId);
        }
        this.saveFavorites();
        return this.favorites.includes(conditionId);
    }
    
    loadRecent() {
        try {
            const stored = localStorage.getItem('conditionBrowser_recent');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveRecent(conditionId) {
        try {
            let recent = this.loadRecent();
            recent = recent.filter(id => id !== conditionId);
            recent.unshift(conditionId);
            recent = recent.slice(0, 10);
            localStorage.setItem('conditionBrowser_recent', JSON.stringify(recent));
            this.recent = recent;
        } catch (e) {
            console.error('Failed to save recent:', e);
        }
    }
    
    createModal() {
        const modalHTML = `
            <!-- Condition Browser V2.0 - Modern Two-Panel Design -->
            <div id="conditionBrowserOverlay" style="display: none;">
                <div class="mechanic-browser-modal">
                    <!-- Header -->
                    <div class="mechanic-browser-header">
                        <div class="mechanic-browser-title">
                            <i class="fas fa-question-circle"></i>
                            <h2>Condition Browser</h2>
                            <span class="mechanic-context-badge context-skill" id="conditionContextBadge">SKILL EDITOR</span>
                        </div>
                        <div class="mechanic-browser-actions">
                            <span class="esc-hint">
                                <kbd>ESC</kbd> to close
                            </span>
                            <button class="btn-close" id="conditionBrowserClose">&times;</button>
                        </div>
                    </div>
                    
                    <!-- Two-Panel Body -->
                    <div class="mechanic-browser-body">
                        <!-- LEFT PANEL: Condition Selection -->
                        <div class="mechanic-selection-panel">
                            <div class="mechanic-search-section">
                                <div class="mechanic-search-bar">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="conditionSearchInput" placeholder="Search conditions..." />
                                </div>
                                <div class="mechanic-quick-filters" id="conditionQuickFilters">
                                    <button class="filter-chip active" data-filter="all">All</button>
                                    <button class="filter-chip" data-filter="favorites">
                                        <i class="fas fa-star"></i> Favorites
                                    </button>
                                    <button class="filter-chip" data-filter="recent">
                                        <i class="fas fa-fire"></i> Recent
                                    </button>
                                    <button class="filter-chip" data-filter="entity">📦 Entity</button>
                                    <button class="filter-chip" data-filter="location">📍 Location</button>
                                    <button class="filter-chip" data-filter="compare">⚖️ Compare</button>
                                    <button class="filter-chip" data-filter="meta">🎯 Meta</button>
                                </div>
                            </div>
                            <div class="mechanic-list-container" id="conditionListContainer">
                                <div class="mechanic-grid" id="conditionGrid">
                                    <!-- Conditions will be rendered here with virtual scrolling -->
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT PANEL: Configuration -->
                        <div class="mechanic-config-panel">
                            <!-- Empty State -->
                            <div class="mechanic-config-empty" id="conditionConfigEmpty">
                                <i class="fas fa-hand-pointer"></i>
                                <h3>Select a Condition</h3>
                                <p>Choose a condition from the list to configure</p>
                            </div>

                            <!-- Config Content -->
                            <div id="conditionConfigContent" style="display: none;">
                                <!-- Selected Condition Info -->
                                <div class="mechanic-config-header">
                                    <div class="selected-mechanic-info">
                                        <div class="selected-mechanic-icon">❓</div>
                                        <div class="selected-mechanic-details">
                                            <h3 id="selectedConditionName">condition</h3>
                                            <p id="selectedConditionDesc">Select a condition to see details</p>
                                            <div class="selected-mechanic-tags" id="selectedConditionTags"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Configuration Body -->
                                <div class="mechanic-config-body">
                                    <!-- Usage Mode Card -->
                                    <div class="mb-component-card required">
                                        <div class="mb-component-header">
                                            <div class="mb-component-icon">🔧</div>
                                            <div class="mb-component-info">
                                                <h4>Usage Mode</h4>
                                                <span class="mb-component-badge required">Required</span>
                                            </div>
                                        </div>
                                        <div class="mb-component-body">
                                            <div class="mb-usage-mode-selector">
                                                <button class="mb-mode-btn active" data-mode="inline">
                                                    <i class="fas fa-code"></i>
                                                    <span>Inline</span>
                                                    <small>?condition</small>
                                                </button>
                                                <button class="mb-mode-btn" data-mode="regular">
                                                    <i class="fas fa-list"></i>
                                                    <span>Regular</span>
                                                    <small>Conditions:</small>
                                                </button>
                                                <button class="mb-mode-btn" data-mode="targeter">
                                                    <i class="fas fa-bullseye"></i>
                                                    <span>Targeter</span>
                                                    <small>@Target{...}</small>
                                                </button>
                                            </div>
                                            
                                            <!-- Inline Mode Config -->
                                            <div class="mode-config" id="inlineModeConfig">
                                                <div class="mb-attribute-field">
                                                    <label class="mb-attribute-label">Prefix</label>
                                                    <select class="mb-attribute-input" id="inlinePrefix">
                                                        <option value="?">? (must be true)</option>
                                                        <option value="?~">?~ (must be false)</option>
                                                        <option value="?>">?&gt; (cast on caster)</option>
                                                        <option value="?!">?! (cast on target)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <!-- Regular Mode Config -->
                                            <div class="mode-config" id="regularModeConfig" style="display: none;">
                                                <div class="mb-attribute-field">
                                                    <label class="mb-attribute-label">Section</label>
                                                    <select class="mb-attribute-input" id="regularSection">
                                                        <option value="Conditions">Conditions</option>
                                                        <option value="TargetConditions">TargetConditions</option>
                                                        <option value="TriggerConditions">TriggerConditions</option>
                                                    </select>
                                                </div>
                                                <div class="mb-attribute-field">
                                                    <label class="mb-attribute-label">Action</label>
                                                    <select class="mb-attribute-input" id="regularAction">
                                                        <option value="true">true (required)</option>
                                                        <option value="false">false (inverted)</option>
                                                        <option value="cast">cast (cast skill)</option>
                                                        <option value="cancel">cancel (cancel event)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <!-- Targeter Mode Config -->
                                            <div class="mode-config" id="targeterModeConfig" style="display: none;">
                                                <div class="mb-attribute-hint">
                                                    <i class="fas fa-info-circle"></i>
                                                    Condition will be applied in targeter selector
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Condition Attributes Card -->
                                    <div class="mb-component-card" id="conditionAttributesCard">
                                        <div class="mb-component-header">
                                            <div class="mb-component-icon">⚙️</div>
                                            <div class="mb-component-info">
                                                <h4>Attributes</h4>
                                                <span class="mb-component-badge optional">Optional</span>
                                            </div>
                                        </div>
                                        <div class="mb-component-body" id="conditionAttributesBody">
                                            <p class="mb-attribute-hint">No attributes available</p>
                                        </div>
                                    </div>

                                    <!-- Preview Card -->
                                    <div class="mb-preview-card">
                                        <div class="mb-preview-header">
                                            <h4><i class="fas fa-code"></i> Preview</h4>
                                            <button class="mb-preview-copy" id="btnCopyConditionPreview">
                                                <i class="fas fa-copy"></i> Copy
                                            </button>
                                        </div>
                                        <div class="mb-preview-body">
                                            <div class="mb-preview-code" id="conditionPreviewCode">?condition</div>
                                        </div>
                                        <div class="mb-preview-validation valid" id="conditionPreviewValidation">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Valid condition</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Footer Actions -->
                                <div class="mechanic-browser-footer">
                                    <button class="btn btn-secondary" id="btnCancelCondition">Cancel</button>
                                    <button class="btn btn-primary" id="btnConfirmCondition">Add Condition</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
    }
    
    attachEventListeners() {
        // Close button
        document.getElementById('conditionBrowserClose').addEventListener('click', () => {
            this.close();
        });

        // Close on overlay click
        document.getElementById('conditionBrowserOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'conditionBrowserOverlay') {
                this.close();
            }
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Search with debouncing
        const debouncedSearch = debounce((query) => {
            this.searchQuery = query.toLowerCase();
            this.renderConditionList();
        }, 300);
        
        document.getElementById('conditionSearchInput').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Filter chips
        document.getElementById('conditionQuickFilters').addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (chip) {
                document.querySelectorAll('#conditionQuickFilters .filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter = chip.dataset.filter;
                this.renderConditionList();
            }
        });

        // Condition grid - item selection and favorite toggle
        document.getElementById('conditionGrid').addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.mechanic-item-favorite');
            const conditionItem = e.target.closest('.mechanic-list-item');
            
            if (favoriteBtn) {
                e.stopPropagation();
                const conditionId = favoriteBtn.dataset.conditionId;
                this.toggleFavorite(conditionId);
                this.renderConditionList();
                return;
            }
            
            if (conditionItem) {
                const conditionId = conditionItem.dataset.conditionId;
                this.selectCondition(conditionId);
            }
        });

        // Usage mode selector
        document.querySelector('.mb-usage-mode-selector').addEventListener('click', (e) => {
            const btn = e.target.closest('.mb-mode-btn');
            if (btn) {
                document.querySelectorAll('.mb-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentUsageMode = btn.dataset.mode;
                this.updateModeConfig();
                this.updatePreview();
            }
        });

        // Mode config changes
        document.getElementById('inlinePrefix').addEventListener('change', (e) => {
            this.currentPrefix = e.target.value;
            this.updatePreview();
        });

        document.getElementById('regularSection').addEventListener('change', (e) => {
            this.currentSectionType = e.target.value;
            this.updatePreview();
        });

        document.getElementById('regularAction').addEventListener('change', (e) => {
            this.currentAction = e.target.value;
            this.updatePreview();
        });

        // Footer buttons
        document.getElementById('btnCancelCondition').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('btnConfirmCondition').addEventListener('click', () => {
            this.confirmSelection();
        });

        // Copy preview
        document.getElementById('btnCopyConditionPreview').addEventListener('click', () => {
            this.copyPreview();
        });
    }
    
    open(options = {}) {
        console.log('🎯 ConditionBrowserV2 opening with options:', options);
        
        this.context = options.context || 'skill';
        this.onSelectCallback = options.onSelect || null;
        
        // Reset state
        this.currentCondition = null;
        this.currentUsageMode = 'inline';
        this.currentPrefix = '?';
        this.currentAction = 'true';
        this.currentSectionType = 'Conditions';
        this.currentAttributes = {};
        this.searchQuery = '';
        this.currentFilter = 'all';
        
        // Update context badge
        const badge = document.getElementById('conditionContextBadge');
        if (badge) {
            if (this.context === 'skill') {
                badge.textContent = 'SKILL EDITOR';
                badge.className = 'mechanic-context-badge context-skill';
            } else {
                badge.textContent = 'MOB EDITOR';
                badge.className = 'mechanic-context-badge context-mob';
            }
        }
        
        // Hide config, show empty state
        document.getElementById('conditionConfigEmpty').style.display = 'flex';
        document.getElementById('conditionConfigContent').style.display = 'none';
        
        // Render list
        this.renderConditionList();
        
        // Show overlay with modal manager
        const overlay = document.getElementById('conditionBrowserOverlay');
        if (overlay) {
            if (typeof MODAL_MANAGER !== 'undefined') {
                this.overlay = overlay;
                MODAL_MANAGER.push(this);
                overlay.style.zIndex = MODAL_MANAGER.getNextZIndex() - 100;
            } else if (options.parentZIndex) {
                overlay.style.zIndex = options.parentZIndex + 100;
            }
            overlay.style.display = 'flex';
            this.isOpen = true;
            
            setTimeout(() => {
                document.getElementById('conditionSearchInput')?.focus();
            }, 100);
        }
        
        console.log('✅ Condition browser opened');
    }
    
    close() {
        if (this.isOpen && this.onSelectCallback) {
            this.onSelectCallback(null);
        }
        
        const overlay = document.getElementById('conditionBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        if (typeof MODAL_MANAGER !== 'undefined' && this.isOpen) {
            MODAL_MANAGER.pop();
        }
        
        // Cleanup virtual scroller
        if (this.virtualScroller) {
            this.virtualScroller.destroy();
            this.virtualScroller = null;
        }
        
        this.isOpen = false;
        this.onSelectCallback = null;
    }
    
    renderConditionList() {
        const grid = document.getElementById('conditionGrid');
        if (!grid) return;
        
        // Get filtered conditions
        let conditions = this.getFilteredConditions();
        
        if (conditions.length === 0) {
            grid.innerHTML = `
                <div class="mechanic-list-empty">
                    <i class="fas fa-search"></i>
                    <p>No conditions found</p>
                </div>
            `;
            return;
        }
        
        // Use virtual scrolling for performance
        if (conditions.length > 20) {
            this.initVirtualScroller(conditions);
        } else {
            // Render all items if less than 20
            grid.innerHTML = conditions.map(c => this.createConditionListItem(c)).join('');
        }
    }
    
    initVirtualScroller(conditions) {
        const container = document.getElementById('conditionListContainer');
        
        if (this.virtualScroller) {
            this.virtualScroller.setItems(conditions);
        } else {
            this.virtualScroller = new VirtualScroller({
                container: container,
                items: conditions,
                itemHeight: 110, // Approximate height of condition item
                renderItem: (condition, index) => this.createConditionListItem(condition),
                bufferSize: 5
            });
        }
    }
    
    getFilteredConditions() {
        if (!window.ALL_CONDITIONS) return [];
        
        let conditions = [...window.ALL_CONDITIONS];
        
        // Apply filter
        if (this.currentFilter === 'favorites') {
            conditions = conditions.filter(c => this.favorites.includes(c.id));
        } else if (this.currentFilter === 'recent') {
            conditions = conditions.filter(c => this.recent.includes(c.id));
        } else if (this.currentFilter !== 'all') {
            conditions = conditions.filter(c => 
                c.category && c.category.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }
        
        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            conditions = conditions.filter(c => 
                c.name.toLowerCase().includes(query) ||
                c.id.toLowerCase().includes(query) ||
                (c.description && c.description.toLowerCase().includes(query)) ||
                (c.aliases && c.aliases.some(a => a.toLowerCase().includes(query)))
            );
        }
        
        return conditions;
    }
    
    createConditionListItem(condition) {
        const isFavorite = this.favorites.includes(condition.id);
        const isSelected = this.currentCondition && this.currentCondition.id === condition.id;
        
        return `
            <div class="mechanic-list-item ${isSelected ? 'selected' : ''}" data-condition-id="${condition.id}">
                <div class="mechanic-item-header">
                    <span class="mechanic-item-name">${condition.name}</span>
                    <button class="mechanic-item-favorite ${isFavorite ? 'active' : ''}" 
                            data-condition-id="${condition.id}" 
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="mechanic-item-description">
                    ${condition.description || 'No description available'}
                </div>
                <div class="mechanic-item-tags">
                    ${condition.category ? `<span class="mechanic-tag">${condition.category}</span>` : ''}
                    ${condition.aliases ? condition.aliases.slice(0, 2).map(a => 
                        `<span class="mechanic-tag">${a}</span>`
                    ).join('') : ''}
                </div>
            </div>
        `;
    }
    
    selectCondition(conditionId) {
        const condition = window.ALL_CONDITIONS.find(c => c.id === conditionId);
        if (!condition) return;
        
        console.log('✅ Selected condition:', condition.name);
        this.currentCondition = condition;
        this.currentAttributes = {};
        
        // Save to recent
        this.saveRecent(conditionId);
        
        // Update UI
        this.renderConditionList();
        
        // Show config panel
        document.getElementById('conditionConfigEmpty').style.display = 'none';
        document.getElementById('conditionConfigContent').style.display = 'flex';
        
        // Update header
        document.getElementById('selectedConditionName').textContent = condition.name;
        document.getElementById('selectedConditionDesc').textContent = condition.description || '';
        
        // Render tags
        const tagsContainer = document.getElementById('selectedConditionTags');
        const tags = [condition.category, ...(condition.aliases || []).slice(0, 3)].filter(Boolean);
        tagsContainer.innerHTML = tags.map(tag => 
            `<span class="selected-tag">${tag}</span>`
        ).join('');
        
        // Render attributes
        this.renderAttributes();
        
        // Update preview
        this.updatePreview();
    }
    
    renderAttributes() {
        const body = document.getElementById('conditionAttributesBody');
        if (!body || !this.currentCondition) return;
        
        const attributes = this.currentCondition.attributes || [];
        
        if (attributes.length === 0) {
            body.innerHTML = '<p class="mb-attribute-hint">No attributes required</p>';
            return;
        }
        
        body.innerHTML = attributes.map(attr => {
            const value = this.currentAttributes[attr.name] || attr.default || '';
            
            return `
                <div class="mb-attribute-field">
                    <label class="mb-attribute-label">
                        ${attr.name}
                        ${attr.aliases ? `<code>${attr.aliases[0]}</code>` : ''}
                    </label>
                    <input type="text" 
                           class="mb-attribute-input condition-attr-input" 
                           data-attribute="${attr.name}"
                           value="${value}"
                           placeholder="${attr.default || ''}" />
                    ${attr.description ? `<span class="mb-attribute-hint">${attr.description}</span>` : ''}
                </div>
            `;
        }).join('');
        
        // Attach input listeners
        body.querySelectorAll('.condition-attr-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const attr = e.target.dataset.attribute;
                this.currentAttributes[attr] = e.target.value;
                this.updatePreview();
            });
        });
    }
    
    updateModeConfig() {
        document.getElementById('inlineModeConfig').style.display = 
            this.currentUsageMode === 'inline' ? 'block' : 'none';
        document.getElementById('regularModeConfig').style.display = 
            this.currentUsageMode === 'regular' ? 'block' : 'none';
        document.getElementById('targeterModeConfig').style.display = 
            this.currentUsageMode === 'targeter' ? 'block' : 'none';
    }
    
    updatePreview() {
        if (!this.currentCondition) return;
        
        const previewCode = document.getElementById('conditionPreviewCode');
        if (!previewCode) return;
        
        let preview = '';
        
        // Build condition syntax
        let conditionSyntax = this.currentCondition.id;
        
        // Add attributes
        const attrs = Object.entries(this.currentAttributes)
            .filter(([_, v]) => v && v.toString().trim())
            .map(([k, v]) => `${k}=${v}`)
            .join(';');
        
        if (attrs) {
            conditionSyntax += `{${attrs}}`;
        }
        
        // Format based on usage mode
        if (this.currentUsageMode === 'inline') {
            preview = `${this.currentPrefix}${conditionSyntax}`;
        } else if (this.currentUsageMode === 'regular') {
            preview = `- ${conditionSyntax} ${this.currentAction}`;
        } else {
            preview = `${conditionSyntax}`;
        }
        
        previewCode.textContent = preview;
    }
    
    copyPreview() {
        const previewCode = document.getElementById('conditionPreviewCode');
        if (!previewCode) return;
        
        const text = previewCode.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('btnCopyConditionPreview');
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 2000);
            }
        });
    }
    
    confirmSelection() {
        if (!this.currentCondition) return;
        
        const result = {
            condition: this.currentCondition,
            usageMode: this.currentUsageMode,
            syntax: this.currentCondition.id,
            attributes: this.currentAttributes
        };
        
        // Add mode-specific properties
        if (this.currentUsageMode === 'inline') {
            result.prefix = this.currentPrefix;
        } else if (this.currentUsageMode === 'regular') {
            result.sectionType = this.currentSectionType;
            result.action = this.currentAction;
        }
        
        // Add attributes to syntax
        const attrs = Object.entries(this.currentAttributes)
            .filter(([_, v]) => v && v.toString().trim())
            .map(([k, v]) => `${k}=${v}`)
            .join(';');
        
        if (attrs) {
            result.syntax += `{${attrs}}`;
        }
        
        console.log('✅ Confirmed condition selection:', result);
        
        if (this.onSelectCallback) {
            this.onSelectCallback(result);
        }
        
        // Close without triggering null callback
        const overlay = document.getElementById('conditionBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        if (typeof MODAL_MANAGER !== 'undefined') {
            MODAL_MANAGER.pop();
        }
        
        this.isOpen = false;
        this.onSelectCallback = null;
    }
    
    // Modal manager methods
    minimize() {
        const overlay = document.getElementById('conditionBrowserOverlay');
        if (overlay) {
            overlay.style.opacity = '0.3';
            overlay.style.pointerEvents = 'none';
        }
    }
    
    restore() {
        const overlay = document.getElementById('conditionBrowserOverlay');
        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        }
    }
    
    setZIndex(zIndex) {
        const overlay = document.getElementById('conditionBrowserOverlay');
        if (overlay) {
            overlay.style.zIndex = zIndex;
        }
    }
}

// Export to window for global access
window.ConditionBrowserV2 = ConditionBrowserV2;

// Initialize global instance
window.conditionBrowserV2 = new ConditionBrowserV2();

console.log('✅ ConditionBrowserV2 component loaded and initialized');
