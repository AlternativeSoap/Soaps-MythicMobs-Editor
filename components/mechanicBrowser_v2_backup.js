/**
 * ===================================
 * MECHANIC BROWSER V2.0 - COMPLETE OVERHAUL
 * ===================================
 * 
 * Modern component-card based design matching Skill Line Builder
 * Context-aware for mob vs skill editor
 * 
 * Features:
 * - Two-panel layout (selection + configuration)
 * - Component card system matching Skill Line Builder
 * - Context-aware (hides triggers for skill editor)
 * - Real-time preview with validation
 * - Smart defaults and quick actions
 * 
 * @version 2.0.0
 * @date December 2, 2025
 */

class MechanicBrowser {
    static hasEffectPrefix(mechanic) {
        return mechanic.aliases && mechanic.aliases.some(alias => 
            alias.startsWith('effect:') || alias.startsWith('e:')
        );
    }
    
    constructor(targeterBrowser, triggerBrowser) {
        console.log('🏗️ Creating MechanicBrowser v2.0 (Modern Design)');
        
        // Browser references
        this.targeterBrowser = targeterBrowser;
        this.triggerBrowser = triggerBrowser;
        // Note: conditionEditor parameter removed - using global conditionBrowserV2
        
        // State management
        this.context = 'mob'; // 'mob' or 'skill'
        this.onSelectCallback = null;
        this.isOpen = false;
        
        // Current configuration
        this.currentMechanic = null;
        this.currentTargeter = '@Self';
        this.currentTrigger = null;
        this.currentConditions = [];
        this.currentChance = '';
        this.currentHealthModifier = '';
        this.currentAttributes = {};
        
        // UI state
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.filteredMechanics = [];
        
        // Smart features
        this.recentMechanics = this.loadRecentMechanics();
        this.favoriteMechanics = this.loadFavoriteMechanics();
        
        // Create UI
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
     * Load favorite mechanics from localStorage
     */
    loadFavoriteMechanics() {
        try {
            const stored = localStorage.getItem('mechanicBrowser_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Toggle favorite mechanic
     */
    toggleFavorite(mechanicId) {
        try {
            let favorites = this.loadFavoriteMechanics();
            if (favorites.includes(mechanicId)) {
                favorites = favorites.filter(id => id !== mechanicId);
            } else {
                favorites.push(mechanicId);
            }
            localStorage.setItem('mechanicBrowser_favorites', JSON.stringify(favorites));
            this.favoriteMechanics = favorites;
            return favorites.includes(mechanicId);
        } catch (e) {
            console.error('Failed to toggle favorite:', e);
            return false;
        }
    }

    /**
     * Create the mechanic browser modal HTML
     */
    createModal() {
        const modalHTML = `
            <!-- Mechanic Browser V2.0 - Modern Two-Panel Design -->
            <div id="mechanicBrowserOverlay" style="display: none;">
                <div class="mechanic-browser-modal">
                    <!-- Header -->
                    <div class="mechanic-browser-header">
                        <div class="mechanic-browser-title">
                            <i class="fas fa-cogs"></i>
                            <h2>Mechanic Browser</h2>
                            <span class="mechanic-context-badge context-mob" id="mechanicContextBadge">MOB EDITOR</span>
                        </div>
                        <div class="mechanic-browser-actions">
                            <span class="esc-hint">
                                <kbd>ESC</kbd> to close
                            </span>
                            <button class="btn-close" id="mechanicBrowserClose">&times;</button>
                        </div>
                    </div>
                    
                    <!-- Two-Panel Body -->
                    <div class="mechanic-browser-body">
                        <!-- LEFT PANEL: Mechanic Selection -->
                        <div class="mechanic-selection-panel">
                            <div class="mechanic-search-section">
                                <div class="mechanic-search-bar">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="mechanicSearchInput" placeholder="Search mechanics..." />
                                </div>
                                <div class="mechanic-quick-filters" id="mechanicQuickFilters">
                                    <button class="filter-chip active" data-filter="all">
                                        All
                                    </button>
                                    <button class="filter-chip" data-filter="favorites">
                                        <i class="fas fa-star"></i> Favorites
                                    </button>
                                    <button class="filter-chip" data-filter="recent">
                                        <i class="fas fa-fire"></i> Recent
                                    </button>
                                    <button class="filter-chip" data-filter="damage">
                                        ⚔️ Damage
                                    </button>
                                    <button class="filter-chip" data-filter="heal">
                                        ❤️ Heal
                                    </button>
                                    <button class="filter-chip" data-filter="movement">
                                        🏃 Movement
                                    </button>
                                    <button class="filter-chip" data-filter="effects">
                                        ✨ Effects
                                    </button>
                                    <button class="filter-chip" data-filter="control">
                                        🎮 Control
                                    </button>
                                    <button class="filter-chip" data-filter="utility">
                                        🔧 Utility
                                    </button>
                                    <button class="filter-chip" data-filter="aura">
                                        🔮 Auras
                                    </button>
                                    <button class="filter-chip" data-filter="projectile">
                                        🎯 Projectiles
                                    </button>
                                </div>
                            </div>
                            <div class="mechanic-list-container" id="mechanicListContainer">
                                <div class="mechanic-grid" id="mechanicGrid">
                                    <!-- Mechanic items will be rendered here -->
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT PANEL: Configuration -->
                        <div class="mechanic-config-panel">
                            <!-- Empty State -->
                            <div class="mechanic-config-empty" id="mechanicConfigEmpty">
                                <i class="fas fa-hand-pointer"></i>
                                <h3>Select a Mechanic</h3>
                                <p>Choose a mechanic from the list to configure</p>
                            </div>

                            <!-- Config Content (Hidden Initially) -->
                            <div id="mechanicConfigContent" style="display: none; height: 100%; display: flex; flex-direction: column;">
                                <!-- Selected Mechanic Info -->
                                <div class="mechanic-config-header">
                                    <div class="selected-mechanic-info">
                                        <div class="selected-mechanic-icon">📦</div>
                                        <div class="selected-mechanic-details">
                                            <h3 id="selectedMechanicName">mechanic</h3>
                                            <p id="selectedMechanicDesc">Select a mechanic to see details</p>
                                            <div class="selected-mechanic-tags" id="selectedMechanicTags"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Configuration Body -->
                                <div class="mechanic-config-body">
                                    <!-- Mechanic Attributes Card -->
                                    <div class="mb-component-card required" id="mechanicAttributesCard">
                                        <div class="mb-component-header">
                                            <div class="mb-component-icon">⚙️</div>
                                            <div class="mb-component-info">
                                                <h4>Mechanic Attributes</h4>
                                                <span class="mb-component-badge required">Required</span>
                                            </div>
                                        </div>
                                        <div class="mb-component-body" id="mechanicAttributesBody">
                                            <!-- Dynamic attributes will be rendered here -->
                                        </div>
                                    </div>

                                    <!-- Targeter Card -->
                                    <div class="mb-component-card filled">
                                        <div class="mb-component-header">
                                            <div class="mb-component-icon">🎯</div>
                                            <div class="mb-component-info">
                                                <h4>Targeter</h4>
                                                <span class="mb-component-badge optional">Optional</span>
                                            </div>
                                            <div class="mb-component-status">
                                                <i class="fas fa-check-circle"></i>
                                            </div>
                                        </div>
                                        <div class="mb-component-body">
                                            <div class="mb-component-actions">
                                                <button class="btn btn-sm btn-secondary" id="btnBrowseTargeter">
                                                    <i class="fas fa-search"></i> Browse Targeters
                                                </button>
                                                <button class="btn btn-sm btn-icon" id="btnClearTargeter" style="display: none;">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                            <div class="mb-attribute-hint" id="targeterDisplay">@Self</div>
                                        </div>
                                    </div>

                                    <!-- Trigger Card (Context-Aware) -->
                                    <div class="mb-component-card" id="triggerCard" style="display: none;">
                                        <div class="mb-component-header">
                                            <div class="mb-component-icon">⚡</div>
                                            <div class="mb-component-info">
                                                <h4>Trigger</h4>
                                                <span class="mb-component-badge required" id="triggerBadge">Required</span>
                                            </div>
                                            <div class="mb-component-status" id="triggerStatus">
                                                <i class="fas fa-circle"></i>
                                            </div>
                                        </div>
                                        <div class="mb-component-body">
                                            <div class="mb-quick-chips" id="triggerQuickChips">
                                                <button class="mb-chip" data-trigger="~onAttack">
                                                    <i class="fas fa-sword"></i> onAttack
                                                </button>
                                                <button class="mb-chip" data-trigger="~onDamaged">
                                                    <i class="fas fa-heart-broken"></i> onDamaged
                                                </button>
                                                <button class="mb-chip" data-trigger="~onTimer:20">
                                                    <i class="fas fa-clock"></i> onTimer:20
                                                </button>
                                                <button class="mb-chip" data-trigger="~onSpawn">
                                                    <i class="fas fa-star"></i> onSpawn
                                                </button>
                                            </div>
                                            <div class="mb-component-actions">
                                                <button class="btn btn-sm btn-secondary" id="btnBrowseTrigger">
                                                    <i class="fas fa-bolt"></i> Select Trigger
                                                </button>
                                                <button class="btn btn-sm btn-icon" id="btnClearTrigger" style="display: none;">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                            <div class="trigger-warning">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                Required for mob skills
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Conditions Card -->
                                    <div class="mb-component-card">
                                        <div class="mb-component-header">
                                            <div class="mb-component-icon">❓</div>
                                            <div class="mb-component-info">
                                                <h4>Conditions</h4>
                                                <span class="mb-component-badge optional">Optional</span>
                                            </div>
                                            <div class="mb-component-status" id="conditionStatus">
                                                <i class="fas fa-circle"></i>
                                            </div>
                                        </div>
                                        <div class="mb-component-body">
                                            <div class="mb-component-actions">
                                                <button class="btn btn-sm btn-secondary" id="btnAddCondition">
                                                    <i class="fas fa-plus"></i> Add Condition
                                                </button>
                                            </div>
                                            <div id="conditionsListDisplay"></div>
                                        </div>
                                    </div>

                                    <!-- Modifiers Card -->
                                    <div class="mb-component-card">
                                        <div class="mb-component-header">
                                            <div class="mb-component-icon">🎲</div>
                                            <div class="mb-component-info">
                                                <h4>Modifiers</h4>
                                                <span class="mb-component-badge optional">Optional</span>
                                            </div>
                                        </div>
                                        <div class="mb-component-body">
                                            <div class="mb-attribute-field">
                                                <label class="mb-attribute-label">
                                                    <i class="fas fa-dice"></i> Chance
                                                </label>
                                                <input type="text" class="mb-attribute-input" id="chanceInput" 
                                                       placeholder="0.5 or 50%" />
                                                <span class="mb-attribute-hint">Enter decimal (0-1) or percentage</span>
                                            </div>
                                            <div class="mb-attribute-field">
                                                <label class="mb-attribute-label">
                                                    <i class="fas fa-heart"></i> Health Modifier
                                                </label>
                                                <input type="text" class="mb-attribute-input" id="healthModifierInput" 
                                                       placeholder=">50% or <0.5" />
                                                <span class="mb-attribute-hint">Examples: &lt;50%, &gt;=75%, =30%-50%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Preview Card -->
                                    <div class="mb-preview-card">
                                        <div class="mb-preview-header">
                                            <h4><i class="fas fa-code"></i> Preview</h4>
                                            <button class="mb-preview-copy" id="btnCopyPreview">
                                                <i class="fas fa-copy"></i> Copy
                                            </button>
                                        </div>
                                        <div class="mb-preview-body">
                                            <div class="mb-preview-code" id="previewCode">- mechanic{} @Self</div>
                                        </div>
                                        <div class="mb-preview-validation valid" id="previewValidation">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Valid skill line</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Footer Actions -->
                                <div class="mechanic-browser-footer">
                                    <button class="btn btn-secondary" id="btnCancelMechanic">Cancel</button>
                                    <button class="btn btn-primary" id="btnConfirmMechanic">Add to Skill</button>
                                </div>
                            </div>
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
        console.log('📎 Attaching mechanic browser event listeners');
        
        // Close button
        document.getElementById('mechanicBrowserClose').addEventListener('click', () => {
            this.close();
        });

        // Close on overlay click
        document.getElementById('mechanicBrowserOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'mechanicBrowserOverlay') {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Search input with debouncing for better performance
        const debouncedSearch = debounce((query) => {
            this.searchQuery = query.toLowerCase();
            this.renderMechanicList();
        }, 300);
        
        document.getElementById('mechanicSearchInput').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Filter chips
        document.getElementById('mechanicQuickFilters').addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (chip) {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter = chip.dataset.filter;
                this.renderMechanicList();
            }
        });

        // Mechanic grid - item selection and favorite toggle
        document.getElementById('mechanicGrid').addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.mechanic-item-favorite');
            const mechanicItem = e.target.closest('.mechanic-list-item');
            
            if (favoriteBtn) {
                e.stopPropagation();
                const mechanicId = favoriteBtn.dataset.mechanicId;
                this.toggleFavorite(mechanicId);
                this.renderMechanicList();
                return;
            }
            
            if (mechanicItem) {
                const mechanicId = mechanicItem.dataset.mechanicId;
                this.selectMechanic(mechanicId);
            }
        });


        // Component buttons
        const btnBrowseTargeter = document.getElementById('btnBrowseTargeter');
        if (btnBrowseTargeter) {
            btnBrowseTargeter.addEventListener('click', () => this.openTargeterBrowser());
        }

        const btnBrowseTrigger = document.getElementById('btnBrowseTrigger');
        if (btnBrowseTrigger) {
            btnBrowseTrigger.addEventListener('click', () => this.openTriggerBrowser());
        }

        const btnAddCondition = document.getElementById('btnAddCondition');
        if (btnAddCondition) {
            btnAddCondition.addEventListener('click', () => this.openConditionEditor());
        }

        // Quick trigger chips
        document.getElementById('triggerQuickChips').addEventListener('click', (e) => {
            const chip = e.target.closest('.mb-chip');
            if (chip) {
                const trigger = chip.dataset.trigger;
                this.selectTrigger(trigger);
            }
        });

        // Modifiers input
        document.getElementById('chanceInput').addEventListener('input', () => {
            this.currentChance = document.getElementById('chanceInput').value;
            this.updatePreview();
        });

        document.getElementById('healthModifierInput').addEventListener('input', () => {
            this.currentHealthModifier = document.getElementById('healthModifierInput').value;
            this.updatePreview();
        });

        // Copy preview
        document.getElementById('btnCopyPreview').addEventListener('click', () => {
            this.copyPreview();
        });

        // Footer buttons
        document.getElementById('btnCancelMechanic').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('btnConfirmMechanic').addEventListener('click', () => {
            this.confirmSelection();
        });

        console.log('✅ Event listeners attached');
    }

    /**
     * Open the mechanic browser
     */
    open(options = {}) {
        console.log('🎯 MechanicBrowser v2.0 opening with options:', options);
        
        // Set context and callback - properly detect context
        // If not explicitly set, default to 'skill' (most mechanic browser opens are from skill editor)
        this.context = options.context || 'skill';
        this.onSelectCallback = options.onSelect || null;
        
        // Reset state
        this.currentMechanic = null;
        this.currentTargeter = '@Self';
        this.currentTrigger = null;
        this.currentConditions = [];
        this.currentChance = '';
        this.currentHealthModifier = '';
        this.currentAttributes = {};
        this.searchQuery = '';
        this.currentFilter = 'all';
        
        // Update context badge
        const badge = document.getElementById('mechanicContextBadge');
        if (badge) {
            if (this.context === 'skill') {
                badge.textContent = 'SKILL EDITOR';
                badge.className = 'mechanic-context-badge context-skill';
            } else {
                badge.textContent = 'MOB EDITOR';
                badge.className = 'mechanic-context-badge context-mob';
            }
        }
        
        // Show/hide trigger card based on context
        const triggerCard = document.getElementById('triggerCard');
        if (triggerCard) {
            if (this.context === 'skill') {
                triggerCard.style.display = 'none';
            } else {
                triggerCard.style.display = 'block';
            }
        }
        
        // Hide config content, show empty state
        document.getElementById('mechanicConfigEmpty').style.display = 'flex';
        document.getElementById('mechanicConfigContent').style.display = 'none';
        
        // Render mechanic list
        this.renderMechanicList();
        
        // Show overlay with modal manager
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            // Use modal manager for proper z-index management
            if (typeof MODAL_MANAGER !== 'undefined') {
                this.overlay = overlay;
                MODAL_MANAGER.push(this);
                overlay.style.zIndex = MODAL_MANAGER.getNextZIndex() - 100;
            } else if (options.parentZIndex) {
                overlay.style.zIndex = options.parentZIndex + 100;
            }
            overlay.style.display = 'flex';
            this.isOpen = true;
            
            // Focus search
            setTimeout(() => {
                document.getElementById('mechanicSearchInput')?.focus();
            }, 100);
        }
        
        console.log('✅ Mechanic browser opened');
    }

    /**
     * Close the mechanic browser
     */
    close() {
        if (this.isOpen && this.onSelectCallback) {
            this.onSelectCallback(null);
        }
        
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Pop from modal manager
        if (typeof MODAL_MANAGER !== 'undefined' && this.isOpen) {
            MODAL_MANAGER.pop();
        }
        
        this.isOpen = false;
        this.onSelectCallback = null;
    }

    /**
     * Render mechanic list
     */
    renderMechanicList() {
        const grid = document.getElementById('mechanicGrid');
        if (!grid) return;
        
        // Get all mechanics
        let mechanics = MECHANICS_DATA.mechanics || [];
        
        // Apply filter
        if (this.currentFilter === 'favorites') {
            mechanics = mechanics.filter(m => this.favoriteMechanics.includes(m.id));
        } else if (this.currentFilter === 'recent') {
            mechanics = mechanics.filter(m => this.recentMechanics.includes(m.id));
        } else if (this.currentFilter !== 'all') {
            mechanics = mechanics.filter(m => 
                m.category && m.category.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }
        
        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            mechanics = mechanics.filter(m => 
                m.name.toLowerCase().includes(query) ||
                m.id.toLowerCase().includes(query) ||
                (m.description && m.description.toLowerCase().includes(query)) ||
                (m.aliases && m.aliases.some(a => a.toLowerCase().includes(query)))
            );
        }
        
        // Render
        if (mechanics.length === 0) {
            grid.innerHTML = `
                <div class="mechanic-list-empty">
                    <i class="fas fa-search"></i>
                    <p>No mechanics found</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = mechanics.map(m => this.createMechanicListItem(m)).join('');
    }

    /**
     * Create mechanic list item HTML
     */
    createMechanicListItem(mechanic) {
        const isFavorite = this.favoriteMechanics.includes(mechanic.id);
        const isSelected = this.currentMechanic && this.currentMechanic.id === mechanic.id;
        
        return `
            <div class="mechanic-list-item ${isSelected ? 'selected' : ''}" data-mechanic-id="${mechanic.id}">
                <div class="mechanic-item-header">
                    <span class="mechanic-item-name">${mechanic.name}</span>
                    <button class="mechanic-item-favorite ${isFavorite ? 'active' : ''}" 
                            data-mechanic-id="${mechanic.id}" 
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="mechanic-item-description">
                    ${mechanic.description || 'No description available'}
                </div>
                <div class="mechanic-item-tags">
                    ${mechanic.category ? `<span class="mechanic-tag">${mechanic.category}</span>` : ''}
                    ${mechanic.aliases ? mechanic.aliases.slice(0, 2).map(a => 
                        `<span class="mechanic-tag">${a}</span>`
                    ).join('') : ''}
                </div>
            </div>
        `;
    }

    /**
     * Select a mechanic
     */
    selectMechanic(mechanicId) {
        const mechanic = MECHANICS_DATA.mechanics.find(m => m.id === mechanicId);
        if (!mechanic) return;
        
        console.log('✅ Selected mechanic:', mechanic.name);
        this.currentMechanic = mechanic;
        this.currentAttributes = {};
        
        // Save to recent
        this.saveRecentMechanic(mechanicId);
        
        // Update selected UI
        this.renderMechanicList();
        
        // Show config panel
        document.getElementById('mechanicConfigEmpty').style.display = 'none';
        document.getElementById('mechanicConfigContent').style.display = 'flex';
        
        // Update config header
        document.getElementById('selectedMechanicName').textContent = mechanic.name;
        document.getElementById('selectedMechanicDesc').textContent = mechanic.description || '';
        
        // Render tags
        const tagsContainer = document.getElementById('selectedMechanicTags');
        const tags = [mechanic.category, ...(mechanic.aliases || []).slice(0, 3)].filter(Boolean);
        tagsContainer.innerHTML = tags.map(tag => 
            `<span class="selected-tag">${tag}</span>`
        ).join('');
        
        // Render attributes
        this.renderAttributes();
        
        // Update preview
        this.updatePreview();
    }

    /**
     * Render mechanic attributes
     */
    renderAttributes() {
        const body = document.getElementById('mechanicAttributesBody');
        if (!body || !this.currentMechanic) return;
        
        const attributes = this.currentMechanic.attributes || {};
        const attributeKeys = Object.keys(attributes);
        
        if (attributeKeys.length === 0) {
            body.innerHTML = '<p class="mb-attribute-hint">No attributes required</p>';
            return;
        }
        
        body.innerHTML = attributeKeys.map(key => {
            const attr = attributes[key];
            const value = this.currentAttributes[key] || attr.default || '';
            
            return `
                <div class="mb-attribute-field">
                    <label class="mb-attribute-label">
                        ${attr.name || key}
                        ${attr.aliases ? `<code>${attr.aliases[0]}</code>` : ''}
                        ${attr.description ? `<i class="fas fa-info-circle info-icon" title="${attr.description}"></i>` : ''}
                    </label>
                    <input type="text" 
                           class="mb-attribute-input" 
                           data-attribute="${key}"
                           value="${value}"
                           placeholder="${attr.default || ''}" />
                    ${attr.description ? `<span class="mb-attribute-hint">${attr.description}</span>` : ''}
                </div>
            `;
        }).join('');
        
        // Attach input listeners
        body.querySelectorAll('.mb-attribute-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const attr = e.target.dataset.attribute;
                this.currentAttributes[attr] = e.target.value;
                this.updatePreview();
            });
        });
    }

    /**
     * Open targeter browser
     */
    openTargeterBrowser() {
        if (!this.targeterBrowser) return;
        console.log('🎯 Opening targeter browser');
        
        this.targeterBrowser.open({
            context: this.context,
            onSelect: (targeter) => {
                if (targeter) {
                    this.selectTargeter(targeter);
                }
            }
        });
    }

    /**
     * Open trigger browser
     */
    openTriggerBrowser() {
        if (!this.triggerBrowser) return;
        console.log('⚡ Opening trigger browser');
        
        this.triggerBrowser.open({
            context: this.context,
            onSelect: (trigger) => {
                if (trigger) {
                    this.selectTrigger(trigger);
                }
            }
        });
    }

    /**
     * Open condition editor (V2 Browser)
     */
    openConditionEditor() {
        // Use global V2 browser instead of old condition editor
        if (!window.conditionBrowserV2) {
            console.warn('⚠️ ConditionBrowserV2 not available');
            return;
        }
        
        console.log('❓ Opening condition browser V2 from mechanic browser');
        
        // Minimize this modal while condition browser is open
        if (typeof MODAL_MANAGER !== 'undefined') {
            this.minimize();
        }
        
        window.conditionBrowserV2.open({
            context: this.context,
            parentZIndex: this.overlay ? parseInt(this.overlay.style.zIndex || 10100) : 10100,
            onSelect: (result) => {
                // Restore this modal
                if (typeof MODAL_MANAGER !== 'undefined') {
                    this.restore();
                }
                
                if (result) {
                    console.log('✅ Condition selected:', result);
                    // Add the condition to current conditions list
                    if (!this.currentConditions) {
                        this.currentConditions = [];
                    }
                    this.currentConditions.push(result.syntax);
                    this.updateConditionDisplay();
                    this.updatePreview();
                }
            }
        });
    }

    /**
     * Select targeter
     */
    selectTargeter(targeter) {
        this.currentTargeter = targeter;
        document.getElementById('targeterDisplay').textContent = targeter;
        this.updatePreview();
    }

    /**
     * Select trigger
     */
    selectTrigger(trigger) {
        this.currentTrigger = trigger;
        
        // Update status
        const status = document.getElementById('triggerStatus');
        if (status) {
            status.innerHTML = '<i class="fas fa-check-circle"></i>';
        }
        
        // Update chip selection
        document.querySelectorAll('.mb-chip[data-trigger]').forEach(chip => {
            if (chip.dataset.trigger === trigger) {
                chip.classList.add('selected');
            } else {
                chip.classList.remove('selected');
            }
        });
        
        this.updatePreview();
    }

    /**
     * Update condition display
     */
    updateConditionDisplay() {
        const display = document.getElementById('conditionsListDisplay');
        const status = document.getElementById('conditionStatus');
        
        if (!display || !status) return;
        
        if (this.currentConditions.length > 0) {
            status.innerHTML = '<i class="fas fa-check-circle"></i>';
            display.innerHTML = `
                <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 6px; font-size: 0.75rem; font-family: monospace;">
                    ${this.currentConditions.length} condition(s) configured
                </div>
            `;
        } else {
            status.innerHTML = '<i class="fas fa-circle"></i>';
            display.innerHTML = '';
        }
    }

    /**
     * Update preview
     */
    updatePreview() {
        if (!this.currentMechanic) return;
        
        const previewCode = document.getElementById('previewCode');
        const previewValidation = document.getElementById('previewValidation');
        
        if (!previewCode) return;
        
        // Build skill line
        let skillLine = `- ${this.currentMechanic.name}`;
        
        // Add attributes
        const attrs = Object.entries(this.currentAttributes)
            .filter(([_, v]) => v && v.toString().trim())
            .map(([k, v]) => `${k}=${v}`)
            .join(';');
        
        if (attrs) {
            skillLine += `{${attrs}}`;
        } else {
            skillLine += '{}';
        }
        
        // Add targeter
        skillLine += ` ${this.currentTargeter}`;
        
        // Add trigger (if mob context and selected)
        if (this.context === 'mob' && this.currentTrigger) {
            skillLine += ` ${this.currentTrigger}`;
        }
        
        // Add conditions
        if (this.currentConditions.length > 0) {
            skillLine += ` ?${this.currentConditions.join('&')}`;
        }
        
        // Add modifiers
        if (this.currentChance) {
            skillLine += ` ${this.currentChance}`;
        }
        
        if (this.currentHealthModifier) {
            skillLine += ` ${this.currentHealthModifier}`;
        }
        
        previewCode.textContent = skillLine;
        
        // Validate
        const isValid = this.validateConfiguration();
        if (previewValidation) {
            if (isValid) {
                previewValidation.className = 'mb-preview-validation valid';
                previewValidation.innerHTML = '<i class="fas fa-check-circle"></i><span>Valid skill line</span>';
            } else {
                previewValidation.className = 'mb-preview-validation invalid';
                previewValidation.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Trigger required for mob skills</span>';
            }
        }
        
        // Enable/disable confirm button
        const btnConfirm = document.getElementById('btnConfirmMechanic');
        if (btnConfirm) {
            btnConfirm.disabled = !isValid;
        }
    }

    /**
     * Validate configuration
     */
    validateConfiguration() {
        if (!this.currentMechanic) return false;
        
        // Mob context requires trigger
        if (this.context === 'mob' && !this.currentTrigger) {
            return false;
        }
        
        return true;
    }

    /**
     * Copy preview to clipboard
     */
    copyPreview() {
        const previewCode = document.getElementById('previewCode');
        if (!previewCode) return;
        
        const text = previewCode.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('btnCopyPreview');
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 2000);
            }
        });
    }

    /**
     * Minimize browser (for modal manager)
     */
    minimize() {
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.opacity = '0.3';
            overlay.style.pointerEvents = 'none';
        }
    }
    
    /**
     * Restore browser (for modal manager)
     */
    restore() {
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        }
    }
    
    /**
     * Set z-index (for modal manager)
     */
    setZIndex(zIndex) {
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.zIndex = zIndex;
        }
    }
    
    /**
     * Confirm selection
     */
    confirmSelection() {
        if (!this.validateConfiguration()) return;
        
        const previewCode = document.getElementById('previewCode');
        const skillLine = previewCode ? previewCode.textContent : '';
        
        console.log('✅ Confirmed mechanic selection:', skillLine);
        
        if (this.onSelectCallback) {
            this.onSelectCallback(skillLine);
        }
        
        // Close without triggering null callback
        const overlay = document.getElementById('mechanicBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        this.isOpen = false;
        this.onSelectCallback = null;
    }

    /**
     * LEGACY METHOD STUB - Keep for compatibility
     */
    /**
     * LEGACY: Show mechanic configuration (compatibility stub)
     */
    showMechanicConfiguration(mechanic) {
        // Forward to new method
        this.selectMechanic(mechanic.id);
    }

    /**
     * Fuzzy search mechanics by name, aliases, tags, and description
     */
    fuzzySearchMechanics(query, mechanics) {
        if (!query) return mechanics;
        
        const lowerQuery = query.toLowerCase();
        const words = lowerQuery.split(/\s+/).filter(w => w.length > 0);
        
        return mechanics.map(mechanic => {
            let score = 0;
            const searchableText = [
                mechanic.name,
                mechanic.id,
                ...(mechanic.aliases || []),
                mechanic.description,
                mechanic.category
            ].join(' ').toLowerCase();
            
            // Exact name match - highest priority
            if (mechanic.name.toLowerCase() === lowerQuery) {
                score += 1000;
            }
            
            // Name starts with query
            if (mechanic.name.toLowerCase().startsWith(lowerQuery)) {
                score += 500;
            }
            
            // All words present
            const allWordsPresent = words.every(word => searchableText.includes(word));
            if (allWordsPresent) {
                score += 200;
            }
            
            // Count word matches
            words.forEach(word => {
                if (searchableText.includes(word)) {
                    score += 50;
                }
            });
            
            // Alias match
            if (mechanic.aliases?.some(a => a.toLowerCase().includes(lowerQuery))) {
                score += 300;
            }
            
            // Category match
            if (mechanic.category.toLowerCase().includes(lowerQuery)) {
                score += 100;
            }
            
            return { mechanic, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.mechanic);
    }

    /**
     * LEGACY: Render mechanics list (compatibility stub)
     */
    renderMechanics() {
        // Forward to new method
        this.renderMechanicList();
    }

    /**
     * Update category tab counts
     */
    updateCategoryCounts() {
        const mechanics = MECHANICS_DATA.mechanics || [];
        const categoryTabs = document.querySelectorAll('.category-tab');
        
        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;
            let count;
            
            if (category === 'All') {
                count = mechanics.length;
            } else if (category === 'Favorites') {
                count = this.favoriteMechanics.length;
            } else {
                count = mechanics.filter(m => m.category === category).length;
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

        // Get mechanics
        const favoriteMechanics = this.favoriteMechanics
            .map(id => MECHANICS_DATA.getMechanic(id))
            .filter(m => m);
        
        const recentMechanics = this.recentMechanics
            .map(item => MECHANICS_DATA.getMechanic(item.id))
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
     * LEGACY: Show preset configurations (compatibility stub)
     */
    showMechanicPresets() {
        // Presets not implemented in v2.0 - reserved for future
        return;
        
        // Define presets for specific mechanics
        const presets = {
            'damage': [
                { name: 'Light Hit', attrs: { amount: 5 } },
                { name: 'Heavy Hit', attrs: { amount: 20 } },
                { name: 'Critical', attrs: { amount: 50 } }
            ],
            'heal': [
                { name: 'Minor Heal', attrs: { amount: 5 } },
                { name: 'Medium Heal', attrs: { amount: 15 } },
                { name: 'Major Heal', attrs: { amount: 50 } }
            ],
            'effect': [
                { name: 'Particles', attrs: { particle: 'flame', amount: 10 } },
                { name: 'Heart', attrs: { particle: 'heart', amount: 5 } }
            ],
            'potion': [
                { name: 'Speed Boost', attrs: { type: 'SPEED', duration: 100, level: 1 } },
                { name: 'Strength', attrs: { type: 'INCREASE_DAMAGE', duration: 100, level: 1 } }
            ]
        };
        
        const mechanicPresets = presets[this.currentMechanic.id];
        
        if (!mechanicPresets) {
            presetsSection.style.display = 'none';
            return;
        }
        
        presetsSection.style.display = 'block';
        presetsContainer.innerHTML = mechanicPresets.map(preset => `
            <button class="btn-preset" data-preset='${JSON.stringify(preset.attrs)}' style="padding: 6px 12px; font-size: 12px; background: #2a2a2a; border: 1px solid #555; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-bolt" style="font-size: 10px;"></i> ${preset.name}
            </button>
        `).join('');
        
        // Add event handlers for presets
        presetsContainer.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const attrs = JSON.parse(btn.dataset.preset);
                this.applyPreset(attrs);
            });
        });
    }
    
    /**
     * Apply preset values to form
     */
    applyPreset(attrs) {
        Object.keys(attrs).forEach(key => {
            const input = document.querySelector(`[data-attr="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = attrs[key];
                } else {
                    input.value = attrs[key];
                }
            }
        });
        this.updateSkillLinePreview();
    }

    /**
     * LEGACY: Render mechanic attributes (compatibility stub)
     */
    renderMechanicAttributes() {
        // Forward to new method
        this.renderAttributes();
        
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
                // Checkbox for boolean
                const checkedValue = attr.default === true || attr.default === 'true';
                inputHTML = `
                    <label class="checkbox-container">
                        <input type="checkbox" 
                               class="mechanic-attribute-input mechanic-attribute-checkbox" 
                               data-attr="${attr.name}"
                               ${checkedValue ? 'checked' : ''}>
                        <span class="checkbox-label">Enable</span>
                    </label>
                `;
            } else if (attr.type === 'number') {
                // Number input with step detection
                const step = attr.default && attr.default.toString().includes('.') ? '0.01' : '1';
                inputHTML = `
                    <input type="number" 
                           class="mechanic-attribute-input" 
                           data-attr="${attr.name}"
                           step="${step}"
                           placeholder="${attr.default !== undefined ? attr.default : ''}"
                           value="${attr.default !== undefined ? attr.default : ''}">
                `;
            } else {
                // Text input (could be string, list, etc.)
                inputHTML = `
                    <input type="text" 
                           class="mechanic-attribute-input" 
                           data-attr="${attr.name}"
                           placeholder="${attr.default || ''}"
                           value="${attr.default || ''}">
                `;
            }

            const isRequired = attr.required ? 'attribute-required' : 'attribute-optional';
            return `
                <div class="mechanic-attribute-field ${isRequired}" data-tooltip="${tooltipContent.replace(/"/g, '&quot;')}">
                    <div class="attribute-card">
                        <label class="attribute-label">
                            <span class="attribute-name">
                                ${attr.name}${aliasText} ${requiredMark}
                            </span>
                            <span class="info-icon" title="Click for details">ℹ️</span>
                        </label>
                        <div class="attribute-input-wrapper">
                            ${inputHTML}
                        </div>
                        <small class="attribute-description">${attr.description}${defaultText}</small>
                    </div>
                </div>
            `;
        }).join('');

        // Use event delegation with debouncing for better performance
        // Remove old listener if exists
        const oldListener = formContainer._attributeInputListener;
        if (oldListener) {
            formContainer.removeEventListener('input', oldListener);
            formContainer.removeEventListener('change', oldListener);
        }
        
        // Debounce timer
        let debounceTimer = null;
        
        // Create debounced update function
        const debouncedUpdate = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.updateSkillLinePreview();
            }, 150);
        };
        
        // Add delegated listener
        const newListener = (e) => {
            if (e.target.classList.contains('mechanic-attribute-input')) {
                // Checkboxes update immediately, text inputs are debounced
                if (e.target.type === 'checkbox') {
                    this.updateSkillLinePreview();
                } else {
                    debouncedUpdate();
                }
            }
        };
        
        formContainer._attributeInputListener = newListener;
        formContainer.addEventListener('input', newListener);
        formContainer.addEventListener('change', newListener);
    }

    /**
     * Show attribute details in a modal
     */
    showAttributeDetails(field) {
        const attrName = field.querySelector('.attribute-name').textContent.replace(/[\*\s]/g, '').split('(')[0];
        const attr = this.currentMechanic?.attributes.find(a => a.name === attrName);
        
        if (!attr) return;
        
        const modal = document.createElement('div');
        modal.className = 'attribute-detail-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10500; display: flex; align-items: center; justify-content: center;';
        
        const content = document.createElement('div');
        content.style.cssText = 'background: #1a1d2e; padding: 2rem; border-radius: 8px; max-width: 500px; color: #e2e8f0;';
        content.innerHTML = `
            <h3 style="margin: 0 0 1rem 0; color: #7c3aed;">${attr.name}</h3>
            <p style="margin: 0.5rem 0;"><strong>Type:</strong> ${attr.type}</p>
            <p style="margin: 0.5rem 0;"><strong>Required:</strong> ${attr.required ? 'Yes' : 'No'}</p>
            ${attr.default !== undefined ? `<p style="margin: 0.5rem 0;"><strong>Default:</strong> ${attr.default}</p>` : ''}
            <p style="margin: 0.5rem 0;"><strong>Description:</strong> ${attr.description}</p>
            ${attr.aliases ? `<p style="margin: 0.5rem 0;"><strong>Aliases:</strong> ${attr.aliases.join(', ')}</p>` : ''}
            <button class="btn btn-primary" style="margin-top: 1rem;">Close</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const closeModal = () => modal.remove();
        content.querySelector('button').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }

    /**
     * Open trigger browser
     */
    openTriggerBrowser() {
        if (!this.triggerBrowser) {
            console.warn('⚠️ TriggerBrowser not initialized');
            return;
        }
        if (this.context !== 'mob') return;
        
        // Get current z-index of mechanic browser
        const overlay = document.getElementById('mechanicBrowserOverlay');
        const currentZIndex = overlay ? parseInt(window.getComputedStyle(overlay).zIndex) || 9999 : 9999;
        
        this.triggerBrowser.open({
            mobType: null,
            modules: null,
            parentZIndex: currentZIndex,
            onSelect: (result) => {
                const { trigger, parameter } = result;
                this.currentTrigger = parameter ? `~${trigger.name}:${parameter}` : `~${trigger.name}`;
                this.updateTriggerDisplay();
                this.updateSkillLinePreview();
            }
        });
    }

    /**
     * LEGACY: Old openConditionEditor - kept for backwards compatibility
     * Now redirects to V2 browser
     */
    openConditionEditor_LEGACY() {
        console.warn('⚠️ Legacy openConditionEditor called - redirecting to V2');
        this.openConditionEditor();
        
        // Confirm button
        document.getElementById('confirmConditionEdit').addEventListener('click', () => {
            // Get conditions from editor - preserve all metadata
            const conditions = tempEditor.options.conditions || [];
            this.currentConditions = conditions.map(c => {
                if (typeof c === 'string') {
                    // Legacy string format - default to inline mode with ? prefix
                    return { 
                        usageMode: 'inline',
                        prefix: '?', 
                        syntax: c 
                    };
                } else {
                    // Object format with full metadata
                    const usageMode = c.usageMode || 'inline';
                    const normalized = {
                        usageMode: usageMode,
                        syntax: c.syntax || c.condition?.id || ''
                    };
                    
                    // Add mode-specific properties
                    if (usageMode === 'inline') {
                        normalized.prefix = c.prefix || '?';
                    } else if (usageMode === 'regular') {
                        normalized.sectionType = c.sectionType || 'Conditions';
                        normalized.action = c.action || 'true';
                    } else if (usageMode === 'targeter') {
                        normalized.action = c.action || 'true';
                    }
                    
                    return normalized;
                }
            }).filter(c => c.syntax);
            console.log('✅ Normalized conditions:', this.currentConditions);
            this.updateConditionDisplay();
            this.updateSkillLinePreview();
            closeModal();
        });

        // Close on overlay click
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }

    /**
     * Update trigger display and visibility based on context
     */
    /**
     * LEGACY: Update trigger display (compatibility stub)
     */
    updateTriggerDisplay() {
        // Trigger display managed by updatePreview() in v2.0
        this.updatePreview();
        
        // Hide trigger section entirely in skill context
        if (triggerSection) {
            triggerSection.style.display = this.context === 'mob' ? 'block' : 'none';
        }
        
        if (!display) return;
        
        if (this.currentTrigger) {
            display.textContent = this.currentTrigger;
            display.parentElement.classList.add('has-value');
        } else {
            display.textContent = 'Select Trigger';
            display.parentElement.classList.remove('has-value');
        }
    }

    /**
     * Update condition display showing both inline and regular conditions
     */
    updateConditionDisplay() {
        // Use correct DOM elements from new v2.0 layout
        const displayContainer = document.getElementById('conditionsListDisplay');
        const status = document.getElementById('conditionStatus');
        
        // Validate elements exist
        if (!displayContainer || !status) {
            console.warn('⚠️ Condition display elements not found');
            return;
        }
        
        if (this.currentConditions.length > 0) {
            // Update status icon to show conditions are configured
            status.innerHTML = '<i class="fas fa-check-circle"></i>';
            
            // Separate conditions by usage mode
            const inlineConditions = this.currentConditions.filter(c => c.usageMode === 'inline');
            const regularConditions = this.currentConditions.filter(c => c.usageMode === 'regular');
            const targeterConditions = this.currentConditions.filter(c => c.usageMode === 'targeter');
            
            // Build display text
            const parts = [];
            if (inlineConditions.length > 0) parts.push(`${inlineConditions.length} inline`);
            if (regularConditions.length > 0) parts.push(`${regularConditions.length} regular`);
            if (targeterConditions.length > 0) parts.push(`${targeterConditions.length} targeter`);
            
            const summary = parts.length > 0 ? parts.join(', ') : `${this.currentConditions.length} condition(s)`;
            
            // Build preview HTML
            let previewHTML = `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-primary, #0f1219); 
                            border-radius: 6px; border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));">
                    <div style="font-size: 0.75rem; color: var(--text-secondary, #94a3b8); margin-bottom: 0.5rem;">
                        ${this.currentConditions.length} condition(s) configured
                    </div>
            `;
            
            // Show inline conditions
            if (inlineConditions.length > 0) {
                const inlineStr = inlineConditions.map(c => {
                    const prefix = c.prefix || '?';
                    const syntax = c.syntax || c;
                    return `${prefix}${syntax}`;
                }).join(' ');
                previewHTML += `
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="font-size: 0.75rem; color: var(--text-primary, #e2e8f0);">Inline:</strong>
                        <code style="display: block; margin-top: 0.25rem; padding: 0.5rem; background: rgba(230, 192, 123, 0.1); 
                                     border-radius: 4px; color: #e6c07b; font-size: 0.75rem; font-family: monospace;">
                            ${inlineStr}
                        </code>
                    </div>
                `;
            }
            
            // Show regular conditions grouped by section
            if (regularConditions.length > 0) {
                const sections = {
                    'Conditions': regularConditions.filter(c => c.sectionType === 'Conditions'),
                    'TargetConditions': regularConditions.filter(c => c.sectionType === 'TargetConditions'),
                    'TriggerConditions': regularConditions.filter(c => c.sectionType === 'TriggerConditions')
                };
                
                for (const [sectionName, conditions] of Object.entries(sections)) {
                    if (conditions.length > 0) {
                        const condStr = conditions.map(c => `- ${c.syntax} ${c.action}`).join('\n');
                        previewHTML += `
                            <div style="margin-bottom: 0.5rem;">
                                <strong style="font-size: 0.75rem; color: var(--text-primary, #e2e8f0);">${sectionName}:</strong>
                                <code style="display: block; margin-top: 0.25rem; padding: 0.5rem; background: rgba(152, 195, 121, 0.1); 
                                             border-radius: 4px; color: #98c379; font-size: 0.7rem; font-family: monospace; line-height: 1.4;">
                                    ${condStr}
                                </code>
                            </div>
                        `;
                    }
                }
            }
            
            // Show targeter conditions
            if (targeterConditions.length > 0) {
                const targeterStr = targeterConditions.map(c => `- ${c.syntax} ${c.action}`).join('\n');
                previewHTML += `
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="font-size: 0.75rem; color: var(--text-primary, #e2e8f0);">Targeter:</strong>
                        <code style="display: block; margin-top: 0.25rem; padding: 0.5rem; background: rgba(229, 192, 123, 0.1); 
                                     border-radius: 4px; color: #e5c07b; font-size: 0.7rem; font-family: monospace; line-height: 1.4;">
                            ${targeterStr}
                        </code>
                    </div>
                `;
            }
            
            previewHTML += '</div>';
            displayContainer.innerHTML = previewHTML;
        } else {
            // No conditions - reset to empty state
            status.innerHTML = '<i class="fas fa-circle"></i>';
            displayContainer.innerHTML = '';
        }
    }

    /**
     * LEGACY: Update skill line preview (compatibility stub)
     */
    updateSkillLinePreview() {
        // Forward to new method
        this.updatePreview();
        console.log('📝 Updating preview with skill line:', skillLine);
        const previewElement = document.getElementById('skillLinePreview');
        
        // Apply syntax highlighting
        previewElement.innerHTML = this.highlightSkillLine(skillLine);
        
        // Parse and validate
        const parsed = SkillLineParser.parse(skillLine);
        // Use correct context - default to 'skill' if not in mob context
        const validationContext = this.context === 'mob' ? 'mob' : 'skill';
        const validation = SkillLineValidator.validate(parsed, validationContext);
        
        console.log('🔍 Validation context:', this.context, '| Validation context passed to validator:', validationContext);
        console.log('📋 Errors before filter:', JSON.stringify(validation.errors));
        
        // CRITICAL: In skill context, completely filter out ALL trigger-related validation
        if (this.context === 'skill') {
            const beforeFilter = validation.errors.length;
            validation.errors = validation.errors.filter(err => !err.toLowerCase().includes('trigger'));
            validation.warnings = validation.warnings.filter(warn => !warn.toLowerCase().includes('trigger'));
            // Recalculate valid state after filtering
            validation.valid = validation.errors.length === 0;
            console.log(`✅ Filtered for skill context. Removed ${beforeFilter - validation.errors.length} trigger errors.`);
            console.log('📋 Remaining errors:', JSON.stringify(validation.errors));
        }
        
        // Update preview styling based on validation
        const previewSection = previewElement.closest('.preview-section');
        previewSection.classList.remove('valid', 'warning', 'error');
        
        if (validation.valid) {
            previewSection.classList.add('valid');
        } else if (validation.errors.length > 0) {
            previewSection.classList.add('error');
        } else if (validation.warnings.length > 0) {
            previewSection.classList.add('warning');
        }
        
        // Add validation message
        let validationMsg = previewSection.querySelector('.validation-msg');
        if (!validationMsg) {
            validationMsg = document.createElement('div');
            validationMsg.className = 'validation-msg';
            previewSection.appendChild(validationMsg);
        }
        
        console.log('🎯 About to check trigger errors. Context:', this.context);
        console.log('🎯 Has trigger errors?', validation.errors.some(err => err.includes('Trigger is required')));
        
        // Enhanced validation message with quick-fix for trigger (ONLY in mob context)
        // After filtering, check if trigger errors still exist
        if (this.context === 'mob' && validation.errors.some(err => err.includes('Trigger is required'))) {
            console.log('⚠️ SHOWING trigger validation message (mob context)');

            validationMsg.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span><i class="fas fa-exclamation-triangle"></i> Trigger is required for mob skills</span>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn-quick-fix" data-trigger="~onAttack" style="padding: 2px 6px; font-size: 11px; background: #1e88e5; border: none; border-radius: 3px; cursor: pointer; color: white;">
                            + onAttack
                        </button>
                        <button class="btn-quick-fix" data-trigger="~onDamaged" style="padding: 2px 6px; font-size: 11px; background: #1e88e5; border: none; border-radius: 3px; cursor: pointer; color: white;">
                            + onDamaged
                        </button>
                        <button class="btn-quick-fix" data-trigger="~onTimer:20" style="padding: 2px 6px; font-size: 11px; background: #1e88e5; border: none; border-radius: 3px; cursor: pointer; color: white;">
                            + onTimer:20
                        </button>
                    </div>
                </div>
            `;
            // Add click handlers for quick-fix buttons
            validationMsg.querySelectorAll('.btn-quick-fix').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const trigger = btn.dataset.trigger;
                    this.currentTrigger = trigger;
                    document.getElementById('triggerDisplay').textContent = trigger;
                    this.updateSkillLinePreview();
                });
            });
        } else if (this.context === 'skill') {
            console.log('✅ In skill context - filtering validation messages');
            // In skill context, completely filter out ALL trigger-related errors and warnings
            const nonTriggerErrors = validation.errors.filter(err => !err.toLowerCase().includes('trigger'));
            const nonTriggerWarnings = validation.warnings.filter(warn => !warn.toLowerCase().includes('trigger'));
            
            console.log('📋 Non-trigger errors:', nonTriggerErrors);
            console.log('📋 Non-trigger warnings:', nonTriggerWarnings);
            
            if (nonTriggerErrors.length > 0) {
                validationMsg.textContent = nonTriggerErrors.join('; ');
                console.log('⚠️ Showing non-trigger errors');
            } else if (nonTriggerWarnings.length > 0) {
                validationMsg.textContent = nonTriggerWarnings.join('; ');
                console.log('⚠️ Showing non-trigger warnings');
            } else {
                validationMsg.textContent = '';
                validationMsg.style.display = 'none';
                console.log('✅ No validation messages to show');
            }
        } else {
            console.log('⚠️ ELSE branch - context:', this.context);
            validationMsg.textContent = SkillLineValidator.getDisplayMessage(validation);
        }
    }

    /**
     * Highlight skill line with syntax colors
     */
    highlightSkillLine(skillLine) {
        // Parse the skill line components
        const parts = skillLine.match(/^(-\s*)([^{@~?]+)(\{[^}]*\})?\s*(@\w+)?\s*(~[^?]+)?(\?.*)?$/);
        
        if (!parts) return skillLine; // Return plain if can't parse
        
        let html = '<span style="color: #666;">' + parts[1] + '</span>'; // Dash
        html += '<span style="color: #61afef; font-weight: 600;">' + parts[2] + '</span>'; // Mechanic
        
        if (parts[3]) { // Attributes
            html += '<span style="color: #98c379;">' + parts[3] + '</span>';
        }
        
        if (parts[4]) { // Targeter
            html += ' <span style="color: #e5c07b;">' + parts[4] + '</span>';
        }
        
        if (parts[5]) { // Trigger
            html += ' <span style="color: #c678dd;">' + parts[5] + '</span>';
        }
        
        if (parts[6]) { // Conditions
            html += ' <span style="color: #e6c07b;">' + parts[6] + '</span>';
        }
        
        return html;
    }

    /**
     * Build skill line string from current configuration
     */
    buildSkillLine() {
        if (!this.currentMechanic) return '- mechanic{} @Self';

        // Build components object
        let mechanicName = this.currentMechanic.name;
        if (MechanicBrowser.hasEffectPrefix(this.currentMechanic) && this.useEffectPrefix) {
            mechanicName = `effect:${mechanicName}`;
        }
        const components = {
            mechanic: mechanicName,
            mechanicArgs: {},
            targeter: (this.currentTargeter || '@Self').replace('@', ''),
            trigger: this.currentTrigger ? this.currentTrigger.replace('~', '') : null,
            conditions: [],
            chance: null,
            healthModifier: null
        };

        // Add mechanic attributes
        const formContainer = document.getElementById('mechanicAttributesForm');
        if (formContainer) {
            const inputs = formContainer.querySelectorAll('.mechanic-attribute-input');
            
            inputs.forEach(input => {
                const attrName = input.dataset.attr;
                const attrDef = this.currentMechanic.attributes.find(a => a.name === attrName);
                let value;
                
                // Handle checkbox (boolean) inputs
                if (input.type === 'checkbox') {
                    // Only add boolean if it differs from default
                    if (attrDef && attrDef.default !== undefined) {
                        // If checked and default is false, add 'true'
                        if (input.checked && attrDef.default === false) {
                            value = 'true';
                        }
                        // If unchecked and default is true, add 'false'
                        else if (!input.checked && attrDef.default === true) {
                            value = 'false';
                        }
                        // Otherwise skip (matches default)
                        else {
                            return; // Skip this attribute
                        }
                    } else {
                        // No default defined, use checked state
                        value = input.checked ? 'true' : 'false';
                    }
                } else {
                    value = input.value.trim();
                    
                    // Skip if empty
                    if (!value) return;
                    
                    // Skip if matches default value
                    if (attrDef && attrDef.default !== undefined) {
                        // Convert to same type for comparison
                        const defaultStr = String(attrDef.default);
                        if (value === defaultStr) {
                            return; // Skip this attribute
                        }
                    }
                }
                
                if (value) {
                    const key = (attrDef?.alias && Array.isArray(attrDef.alias) && attrDef.alias.length > 0) 
                        ? attrDef.alias[0] 
                        : (attrDef?.alias || attrName);
                    components.mechanicArgs[key] = value;
                }
            });
        }

        // Add conditions - ONLY inline conditions go in skill line
        const inlineConditions = this.currentConditions.filter(c => c.usageMode === 'inline');
        if (inlineConditions.length > 0) {
            components.conditions = inlineConditions.map(c => {
                const prefix = c.prefix || '?';
                const syntax = c.syntax || c;
                
                // Parse condition name and args from syntax
                const match = syntax.match(/(\w+)(?:\{([^}]+)\})?/);
                
                if (match) {
                    return {
                        name: match[1],
                        args: match[2] ? this.parseConditionArgs(match[2]) : {},
                        prefix: prefix
                    };
                } else {
                    return {
                        name: syntax,
                        args: {},
                        prefix: prefix
                    };
                }
            });
        }
        
        // Store regular conditions separately for later YAML section generation
        this.regularConditions = this.currentConditions.filter(c => c.usageMode === 'regular');
        this.targeterConditions = this.currentConditions.filter(c => c.usageMode === 'targeter');

        // Add chance
        const chance = document.getElementById('chanceInput')?.value.trim();
        if (chance) {
            components.chance = chance;
        }

        // Add health modifier
        const healthModifier = document.getElementById('healthModifierInput')?.value.trim();
        if (healthModifier) {
            components.healthModifier = healthModifier;
        }

        // Use SkillLineParser to build the line
        return SkillLineParser.build(components);
    }

    /**
     * Parse condition arguments from string format to object
     * Example: "m=WOODEN_SWORD;amount=1" -> {m: "WOODEN_SWORD", amount: "1"}
     */
    parseConditionArgs(argsStr) {
        const args = {};
        if (!argsStr) return args;
        
        const pairs = argsStr.split(';');
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key && value) {
                args[key.trim()] = value.trim();
            }
        }
        return args;
    }

    /**
     * Get regular conditions for YAML section generation
     */
    getRegularConditions() {
        return this.regularConditions || [];
    }
    
    /**
     * Get targeter conditions for inline targeter usage
     */
    getTargeterConditions() {
        return this.targeterConditions || [];
    }

    /**
     * Confirm configuration and return skill line
     */
    confirmConfiguration() {
        if (!this.currentMechanic) {
            alert('Please select a mechanic');
            return;
        }

        // Build and validate skill line
        const skillLine = this.buildSkillLine();
        const parsed = SkillLineParser.parse(skillLine);
        const validation = SkillLineValidator.validate(parsed, this.context);
        
        // Check for errors
        if (validation.errors.length > 0) {
            alert('Validation Error:\n\n' + validation.errors.join('\n'));
            return;
        }
        
        // Warn about warnings but allow to continue
        if (validation.warnings.length > 0) {
            const proceed = confirm(
                'Validation Warnings:\n\n' + 
                validation.warnings.join('\n') + 
                '\n\nDo you want to continue anyway?'
            );
            if (!proceed) return;
        }
        
        // Invoke callback BEFORE closing to ensure proper restore
        if (this.onSelectCallback) {
            this.onSelectCallback(skillLine);
        }
        
        this.close();
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
        
        // Set conditions - these are inline conditions from skill line
        if (parsed.conditions && parsed.conditions.length > 0) {
            this.currentConditions = parsed.conditions.map(c => {
                const syntax = c.args ? `${c.type}{${c.args}}` : c.type;
                return {
                    usageMode: 'inline',
                    prefix: '?', // Default, can be edited
                    syntax: syntax
                };
            });
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
}

// Export for global use
window.MechanicBrowser = MechanicBrowser;
console.log('✅ MechanicBrowser component loaded');
