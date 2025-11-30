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
        static hasEffectPrefix(mechanic) {
            // Helper to check if mechanic has effect: alias
            return mechanic.aliases && mechanic.aliases.some(alias => alias.startsWith('effect:') || alias.startsWith('e:'));
        }
    constructor(targeterBrowser, triggerBrowser, conditionEditor) {
        console.log('🏗️ Creating MechanicBrowser instance (Enhanced Version)');
        this.targeterBrowser = targeterBrowser;
        this.triggerBrowser = triggerBrowser;
        this.conditionEditor = conditionEditor;
        this.context = 'mob';
        this.onSelectCallback = null;
        
        // Current configuration state
        this.currentMechanic = null;
        this.currentTargeter = '@Self';
        this.currentTrigger = null;
        this.currentConditions = [];
        this.currentChance = '';
        this.currentHealthModifier = '';
        
        // UI state
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        this.useEffectPrefix = localStorage.getItem('mechanicBrowser_useEffectPrefix') === 'true'; // Load from localStorage
        
        // Smart features
        this.recentMechanics = this.loadRecentMechanics();
        this.favoriteMechanics = this.loadFavoriteMechanics();
        
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
                            
                            <!-- Targeter Selection -->
                            <div class="config-section">
                                <h4>Targeter <span class="optional">(optional, defaults to @Self)</span></h4>
                                <button class="btn btn-secondary btn-select-component" id="selectTargeterBtn">
                                    <i class="fas fa-crosshairs"></i> <span id="targeterDisplay">@Self</span>
                                </button>
                            </div>
                            
                            <!-- Trigger Selection (Only in mob context) -->
                            <div class="config-section" id="triggerSection">
                                <h4>Trigger <span class="trigger-hint" id="triggerRequired">required for mob skills</span></h4>
                                <button class="btn btn-secondary btn-select-component" id="selectTriggerBtn">
                                    <i class="fas fa-bolt"></i> <span id="triggerDisplay">Select Trigger</span>
                                </button>
                                <small class="config-hint">Not needed when adding skills to Skill files</small>
                            </div>
                            
                            <!-- Condition Selection -->
                            <div class="config-section">
                                <h4>Conditions <span class="optional">(optional)</span></h4>
                                <button class="btn btn-secondary btn-select-component" id="selectConditionBtn">
                                    <i class="fas fa-filter"></i> <span id="conditionDisplay">Add Condition</span>
                                </button>
                                <div id="conditionsListPreview"></div>
                            </div>
                            
                            <!-- Chance -->
                            <div class="config-section">
                                <h4>Chance <span class="optional">(optional)</span></h4>
                                <input type="text" 
                                       id="chanceInput" 
                                       class="form-input" 
                                       placeholder="0.5 or 50%"
                                       title="Enter a decimal (0-1) or percentage">
                                <small>Enter a decimal (0-1) or percentage (e.g., 0.5 or 50%)</small>
                            </div>
                            
                            <!-- Health Modifier -->
                            <div class="config-section">
                                <h4>Health Modifier <span class="optional">(optional)</span></h4>
                                <input type="text" 
                                       id="healthModifierInput" 
                                       class="form-input" 
                                       placeholder="<50% or >=75%"
                                       title="Examples: <50%, >=75%, =30%-50%, <2000, >500">
                                <small>Examples: &lt;50%, &gt;=75%, =30%-50%, &lt;2000, &gt;500</small>
                            </div>
                            
                            <!-- Live Preview -->
                            <div class="config-section preview-section">
                                <h4>Preview</h4>
                                <div class="skill-line-preview">
                                    <code id="skillLinePreview">- mechanic{} @Self</code>
                                </div>
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

        // Search input
        document.getElementById('mechanicSearchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderMechanics();
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
                localStorage.removeItem('mechanicBrowser_favorites');
                this.favoriteMechanics = [];
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

        // Component selection buttons
        document.getElementById('selectTargeterBtn').addEventListener('click', () => {
            this.openTargeterBrowser();
        });

        document.getElementById('selectTriggerBtn').addEventListener('click', () => {
            this.openTriggerBrowser();
        });

        document.getElementById('selectConditionBtn').addEventListener('click', () => {
            this.openConditionEditor();
        });

        // Input listeners for live preview
        document.getElementById('chanceInput').addEventListener('input', () => {
            this.updateSkillLinePreview();
        });

        document.getElementById('healthModifierInput').addEventListener('input', () => {
            this.updateSkillLinePreview();
        });

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
            this.close();
        });

        document.getElementById('confirmMechanicConfig').addEventListener('click', () => {
            this.confirmConfiguration();
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            const overlay = document.getElementById('mechanicBrowserOverlay');
            if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') {
                this.close();
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
        this.currentTargeter = '@Self';
        this.currentTrigger = null;
        this.currentConditions = [];
        this.currentChance = '';
        this.currentHealthModifier = '';
        
        this.currentCategory = 'all';
        this.searchQuery = '';
        
        // Show/hide trigger section based on context
        const triggerSection = document.getElementById('triggerSection');
        if (this.context === 'skill') {
            triggerSection.style.display = 'none';
        } else {
            triggerSection.style.display = 'block';
        }

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
        this.updateTargeterDisplay();
        this.updateTriggerDisplay();
        this.updateConditionDisplay();
        this.updateSkillLinePreview();
    }

    /**
     * Render mechanics list
     */
    renderMechanics() {
        const listContainer = document.getElementById('mechanicList');
        
        let mechanics = MECHANICS_DATA.mechanics || [];

        // Filter by category
        if (this.currentCategory === 'Favorites') {
            mechanics = mechanics.filter(m => this.favoriteMechanics.includes(m.id));
        } else if (this.currentCategory && this.currentCategory !== 'All') {
            mechanics = mechanics.filter(m => m.category === this.currentCategory);
        }

        // Filter by search
        if (this.searchQuery) {
            mechanics = MECHANICS_DATA.searchMechanics(this.searchQuery);
            if (this.currentCategory === 'favorites') {
                mechanics = mechanics.filter(m => this.favoriteMechanics.includes(m.id));
            } else if (this.currentCategory !== 'all') {
                mechanics = mechanics.filter(m => m.category === this.currentCategory);
            }
        }
        
        // Update category counts
        this.updateCategoryCounts();

        if (mechanics.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No mechanics found matching your search.</div>';
            return;
        }

        listContainer.innerHTML = mechanics.map(mechanic => {
            const badges = [];
            const isFavorite = this.favoriteMechanics.includes(mechanic.id);
            
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
        }).join('');

        // Attach click handlers using event delegation for Select buttons
        listContainer.querySelectorAll('.btn-select-mechanic').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.condition-card');
                const mechanicId = card.dataset.mechanic;
                const mechanic = MECHANICS_DATA.getMechanic(mechanicId);
                if (mechanic) {
                    this.saveRecentMechanic(mechanicId);
                    this.showMechanicConfiguration(mechanic);
                }
            });
        });
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
            input.addEventListener('input', () => this.updateSkillLinePreview());
            input.addEventListener('change', () => this.updateSkillLinePreview());
        });
    }

    /**
     * Open targeter browser
     */
    openTargeterBrowser() {
        if (!this.targeterBrowser) return;
        
        this.targeterBrowser.open({
            currentValue: this.currentTargeter,
            onSelect: (result) => {
                this.currentTargeter = result.targeterString;
                this.updateTargeterDisplay();
                this.updateSkillLinePreview();
            }
        });
    }

    /**
     * Open trigger browser
     */
    openTriggerBrowser() {
        if (!this.triggerBrowser || this.context !== 'mob') return;
        
        this.triggerBrowser.open({
            mobType: null,
            modules: null,
            onSelect: (result) => {
                const { trigger, parameter } = result;
                this.currentTrigger = parameter ? `~${trigger.name}:${parameter}` : `~${trigger.name}`;
                this.updateTriggerDisplay();
                this.updateSkillLinePreview();
            }
        });
    }

    /**
     * Open condition editor
     */
    openConditionEditor() {
        if (!this.conditionEditor) {
            console.warn('⚠️ ConditionEditor not initialized');
            alert('Condition editor not available. Please initialize ConditionEditor component.');
            return;
        }

        // Create temporary container for condition editor modal
        const modalContainer = document.createElement('div');
        modalContainer.id = 'mechanicConditionEditorModal';
        modalContainer.className = 'condition-editor-modal-overlay';
        modalContainer.innerHTML = `
            <div class="condition-editor-modal-content">
                <div class="condition-editor-modal-header">
                    <h3>Add Conditions</h3>
                    <button class="btn-close-condition-modal">&times;</button>
                </div>
                <div id="mechanicConditionEditorContainer"></div>
                <div class="condition-editor-modal-footer">
                    <button class="btn btn-secondary" id="cancelConditionEdit">Cancel</button>
                    <button class="btn btn-primary" id="confirmConditionEdit">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);

        // Initialize condition editor in the container
        const tempEditor = new ConditionEditor('mechanicConditionEditorContainer', {
            mode: 'Conditions',
            conditions: this.currentConditions || [],
            onChange: (conditions) => {
                console.log('📝 Conditions changed:', conditions);
            }
        });

        // Close modal handler
        const closeModal = () => {
            modalContainer.remove();
        };

        // Cancel button
        document.getElementById('cancelConditionEdit').addEventListener('click', closeModal);
        
        // Close button
        modalContainer.querySelector('.btn-close-condition-modal').addEventListener('click', closeModal);
        
        // Confirm button
        document.getElementById('confirmConditionEdit').addEventListener('click', () => {
            // Get conditions from editor
            const conditions = tempEditor.options.conditions || [];
            this.currentConditions = conditions;
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
     * Update targeter display
     */
    updateTargeterDisplay() {
        document.getElementById('targeterDisplay').textContent = this.currentTargeter || '@Self';
    }

    /**
     * Update trigger display
     */
    updateTriggerDisplay() {
        const display = document.getElementById('triggerDisplay');
        if (this.currentTrigger) {
            display.textContent = this.currentTrigger;
            display.parentElement.classList.add('has-value');
        } else {
            display.textContent = 'Select Trigger';
            display.parentElement.classList.remove('has-value');
        }
    }

    /**
     * Update condition display
     */
    updateConditionDisplay() {
        const display = document.getElementById('conditionDisplay');
        const previewContainer = document.getElementById('conditionsListPreview');
        
        if (this.currentConditions.length > 0) {
            display.textContent = `${this.currentConditions.length} condition(s)`;
            display.parentElement.classList.add('has-value');
            previewContainer.innerHTML = this.currentConditions.map(c => `<code>?${c}</code>`).join(' ');
        } else {
            display.textContent = 'Add Condition';
            display.parentElement.classList.remove('has-value');
            previewContainer.innerHTML = '';
        }
    }

    /**
     * Update skill line preview with validation
     */
    updateSkillLinePreview() {
        const skillLine = this.buildSkillLine();
        const previewElement = document.getElementById('skillLinePreview');
        previewElement.textContent = skillLine;
        
        // Parse and validate
        const parsed = SkillLineParser.parse(skillLine);
        const validation = SkillLineValidator.validate(parsed, this.context);
        
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
        
        validationMsg.textContent = SkillLineValidator.getDisplayMessage(validation);
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
                const value = input.value.trim();
                
                if (value) {
                    const attrDef = this.currentMechanic.attributes.find(a => a.name === attrName);
                    const key = (attrDef?.alias && Array.isArray(attrDef.alias) && attrDef.alias.length > 0) 
                        ? attrDef.alias[0] 
                        : (attrDef?.alias || attrName);
                    components.mechanicArgs[key] = value;
                }
            });
        }

        // Add conditions
        if (this.currentConditions.length > 0) {
            components.conditions = this.currentConditions.map(c => {
                const match = c.match(/(\w+)(?:\{([^}]+)\})?/);
                return match ? { type: match[1], args: match[2] || null } : { type: c };
            });
        }

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
        
        this.close();

        if (this.onSelectCallback) {
            this.onSelectCallback(skillLine);
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
}

// Export for global use
window.MechanicBrowser = MechanicBrowser;
console.log('✅ MechanicBrowser component loaded');
