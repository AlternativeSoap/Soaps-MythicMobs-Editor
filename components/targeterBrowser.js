/**
 * Targeter Browser Component
 * Provides a modal interface for browsing and selecting MythicMobs targeters
 */

class TargeterBrowser {
    constructor(editor) {
        this.editor = editor;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.onSelectCallback = null;
        this.currentTargeter = null;
        this.searchCache = new LRUCache(10);
        this.callbackInvoked = false; // Prevent double callback
        
        // Initialize browser data merger
        if (window.supabase && typeof BrowserDataMerger !== 'undefined') {
            this.browserDataMerger = new BrowserDataMerger(window.supabase);
        }
        this.targetersData = TARGETERS_DATA; // Default to built-in
        
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Load merged data from database
     */
    async loadMergedData() {
        if (this.browserDataMerger) {
            try {
                this.targetersData = await this.browserDataMerger.getMergedTargeters();
            } catch (error) {
                console.error('Error loading merged targeters:', error);
                this.targetersData = TARGETERS_DATA; // Fallback
            }
        }
    }

    /**
     * Create the targeter browser modal HTML
     */
    createModal() {
        const modalHTML = `
            <!-- Main Browser Modal -->
            <div id="targeterBrowserOverlay" class="condition-modal" style="display: none;">
                <div class="modal-content condition-browser">
                    <div class="modal-header">
                        <h2>Targeter Browser</h2>
                        <button class="btn-close" id="targeterBrowserClose">&times;</button>
                    </div>
                    
                    <div class="condition-browser-body">
                        <!-- Step 1: Targeter Selection -->
                        <div id="targeterSelectionStep" class="targeter-step active">
                            <!-- Search Bar -->
                            <div class="search-bar">
                                <input type="text" 
                                       id="targeterSearchInput" 
                                       placeholder="Search targeters..." 
                                       class="search-input">
                                <i class="fas fa-search search-icon"></i>
                            </div>
                            
                            <!-- Category Tabs -->
                            <div class="category-tabs" id="targeterCategories">
                                <button class="category-tab active" data-category="all">All (0)</button>
                                <button class="category-tab" data-category="single_entity">👤 Single Entity (0)</button>
                                <button class="category-tab" data-category="multi_entity">👥 Multi Entity (0)</button>
                                <button class="category-tab" data-category="location_single">📍 Single Location (0)</button>
                                <button class="category-tab" data-category="location_multi">🗺️ Multi Location (0)</button>
                                <button class="category-tab" data-category="meta_entity">🔗 Meta Entity (0)</button>
                                <button class="category-tab" data-category="threat_table">⚔️ Threat Table (0)</button>
                                <button class="category-tab" data-category="special">✨ Special (0)</button>
                            </div>
                            
                            <!-- Targeter Grid -->
                            <div class="condition-grid" id="targeterList">
                                <!-- Targeters will be rendered here -->
                            </div>
                        </div>
                        
                        <!-- Step 2: Attribute Configuration -->
                        <div id="targeterConfigurationStep" class="targeter-step">
                            <div class="targeter-config-header">
                                <button class="btn-back" id="targeterAttributeBack">&larr; Back</button>
                                <h3 id="targeterAttributeTitle">Configure Targeter</h3>
                            </div>
                            
                            <div class="targeter-config-body">
                                <!-- Targeter Attributes Section -->
                                <div class="config-section">
                                    <h4>Targeter Attributes <span class="required">*</span></h4>
                                    <div id="targeterAttributeForm" class="targeter-attribute-form">
                                        <!-- Attribute inputs will be rendered here -->
                                    </div>
                                </div>
                                
                                <!-- Live Preview Section -->
                                <div class="config-section preview-section">
                                    <h4>Preview</h4>
                                    <div class="skill-line-preview">
                                        <code id="targeterPreviewCode">@Self</code>
                                    </div>
                                    <small class="config-hint">This targeter will be used in your skill line</small>
                                </div>
                            </div>
                            
                            <div class="targeter-config-footer">
                                <button class="btn btn-secondary" id="targeterAttributeCancel">Cancel</button>
                                <button class="btn btn-primary" id="targeterAttributeConfirm">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modals to document body
        const container = document.createElement('div');
        container.innerHTML = modalHTML;
        document.body.appendChild(container);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close browser modal
        document.getElementById('targeterBrowserClose').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('targeterBrowserOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'targeterBrowserOverlay') {
                this.close();
            }
        });

        // Search input with debouncing (150ms)
        const debouncedSearch = debounce((query) => {
            this.searchQuery = query;
            this.renderTargeters();
        }, 150);
        
        document.getElementById('targeterSearchInput').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Category tabs
        document.getElementById('targeterCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderTargeters();
            }
        });

        // Attribute modal buttons
        document.getElementById('targeterAttributeBack').addEventListener('click', () => {
            this.showTargeterSelection();
        });
        
        document.getElementById('targeterAttributeCancel').addEventListener('click', () => {
            this.showTargeterSelection();
        });

        document.getElementById('targeterAttributeConfirm').addEventListener('click', () => {
            this.confirmAttributeConfiguration();
        });
        
        // Add keyboard support for attribute modal
        document.addEventListener('keydown', (e) => {
            const attrOverlay = document.getElementById('targeterAttributeOverlay');
            if (attrOverlay && attrOverlay.classList.contains('active')) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.confirmAttributeConfiguration();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.showTargeterSelection();
                }
            }
        });

        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            const attrOverlay = document.getElementById('targeterAttributeOverlay');
            const browserOverlay = document.getElementById('targeterBrowserOverlay');
            
            // Escape key handling
            if (e.key === 'Escape') {
                if (attrOverlay && attrOverlay.classList.contains('active')) {
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
                document.getElementById('targeterSearchInput')?.focus();
                return;
            }
            
            // Arrow key navigation
            const cards = Array.from(document.querySelectorAll('#targeterList .condition-card'));
            if (cards.length === 0) return;
            
            const focusedCard = document.activeElement.closest('.condition-card');
            let currentIndex = focusedCard ? cards.indexOf(focusedCard) : -1;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
                cards[currentIndex].querySelector('.btn-select-targeter')?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
                cards[currentIndex].querySelector('.btn-select-targeter')?.focus();
            } else if (e.key === 'Enter' && focusedCard) {
                e.preventDefault();
                const targeterId = focusedCard.dataset.targeter;
                this.handleTargeterSelection(targeterId);
            }
        });
    }

    /**
     * Open the targeter browser
     */
    async open(options = {}) {
        // Load merged data if available
        await this.loadMergedData();
        
        this.currentValue = options.currentValue || '@Self';
        this.onSelectCallback = options.onSelect || null;

        this.currentCategory = 'all';
        this.searchQuery = '';
        document.getElementById('targeterSearchInput').value = '';
        
        // Reset category tabs
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');

        this.renderTargeters();
        this.updateCategoryCounts();
        const overlay = document.getElementById('targeterBrowserOverlay');
        // Apply higher z-index if opened from another modal
        if (options.parentZIndex) {
            overlay.style.zIndex = options.parentZIndex + 100;
        } else {
            overlay.style.zIndex = '';
        }
        overlay.style.display = 'flex';
    }

    /**
     * Close the targeter browser
     */
    close() {
        const overlay = document.getElementById('targeterBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Only notify parent if callback wasn't already called
        if (this.onSelectCallback && !this.callbackInvoked) {
            this.onSelectCallback(null);
        } else if (this.callbackInvoked) {
        }
        
        this.onSelectCallback = null;
        this.callbackInvoked = false; // Reset flag
    }

    /**
     * Update category tab counts
     */
    updateCategoryCounts() {
        const targeters = this.targetersData.targeters || [];
        const categoryTabs = document.querySelectorAll('#targeterCategories .category-tab');
        
        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;
            let count;
            
            if (category === 'all') {
                count = targeters.length;
            } else {
                count = targeters.filter(t => t.category === category).length;
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
     * Render the targeter list based on current filters
     */
    renderTargeters() {
        const listContainer = document.getElementById('targeterList');
        
        // Add CSS optimization for smooth scrolling
        if (listContainer && !listContainer.style.willChange) {
            listContainer.style.willChange = 'scroll-position';
            listContainer.style.transform = 'translateZ(0)';
            listContainer.style.contain = 'layout style paint';
        }
        
        // Get filtered targeters
        let targeters = this.targetersData.targeters;

        // Filter by category
        if (this.currentCategory !== 'all') {
            targeters = targeters.filter(t => t.category === this.currentCategory);
        }

        // Filter by search query
        if (this.searchQuery) {
            targeters = this.targetersData.searchTargeters(this.searchQuery);
            if (this.currentCategory !== 'all') {
                targeters = targeters.filter(t => t.category === this.currentCategory);
            }
        }

        // Render targeters
        if (targeters.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No targeters found matching your search.</div>';
            return;
        }

        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        targeters.forEach(targeter => {
            const card = document.createElement('div');
            card.className = 'condition-card';
            card.dataset.targeter = targeter.id;
            
            const aliasesHTML = targeter.aliases && targeter.aliases.length > 0
                ? `<div class="condition-aliases"><strong>Aliases:</strong> ${targeter.aliases.map(a => '@' + a).join(', ')}</div>`
                : '';

            const examplesHTML = targeter.examples && targeter.examples.length > 0
                ? `<div class="condition-example" style="display: flex; align-items: center; gap: 8px;">
                    <code>${targeter.examples[0]}</code>
                    <button class="btn-copy-example" data-example="${targeter.examples[0]}" title="Copy to clipboard" style="padding: 4px 8px; font-size: 11px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; cursor: pointer;">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>`
                : '';

            card.innerHTML = `
                <div class="condition-card-header">
                    <h4>@${targeter.name}</h4>
                    <span class="condition-category-badge">${targeter.category.replace('_', ' ')}</span>
                </div>
                <div class="condition-card-body">
                    <p class="condition-card-description">${targeter.description}</p>
                    ${aliasesHTML}
                    ${examplesHTML}
                </div>
                <div class="condition-card-footer">
                    <button class="btn btn-primary btn-select-targeter">Select</button>
                </div>
            `;
            
            fragment.appendChild(card);
        });
        
        listContainer.innerHTML = '';
        listContainer.appendChild(fragment);

        // Use event delegation on container instead of attaching to each button
        listContainer.onclick = (e) => {
            const copyBtn = e.target.closest('.btn-copy-example');
            if (copyBtn) {
                e.stopPropagation();
                const example = copyBtn.dataset.example;
                navigator.clipboard.writeText(example).then(() => {
                    const icon = copyBtn.querySelector('i');
                    icon.className = 'fas fa-check';
                    copyBtn.style.background = '#4caf50';
                    setTimeout(() => {
                        icon.className = 'fas fa-copy';
                        copyBtn.style.background = '#2a2a2a';
                    }, 1500);
                });
                return;
            }
            
            const btn = e.target.closest('.btn-select-targeter');
            if (btn) {
                e.stopPropagation();
                const card = btn.closest('.condition-card');
                const targeterId = card.dataset.targeter;
                this.handleTargeterSelection(targeterId);
            }
        };
    }

    /**
     * Handle targeter selection
     */
    handleTargeterSelection(targeterId) {
        const targeter = this.targetersData.getTargeter(targeterId);
        if (!targeter) {
            console.error('❌ Targeter not found:', targeterId);
            return;
        }

        // Check if targeter has attributes
        if (targeter.attributes && targeter.attributes.length > 0) {
            this.showAttributeConfiguration(targeter);
            return;
        }

        // No attributes, directly select (including @Self)
        this.selectTargeter(targeter);
    }

    /**
     * Show attribute configuration modal
     */
    showAttributeConfiguration(targeter) {
        
        this.currentTargeter = targeter;
        
        // Switch steps
        document.getElementById('targeterSelectionStep').classList.remove('active');
        document.getElementById('targeterConfigurationStep').classList.add('active');
        
        document.getElementById('targeterAttributeTitle').textContent = `Configure @${targeter.name}`;
        
        const formContainer = document.getElementById('targeterAttributeForm');
        formContainer.innerHTML = targeter.attributes.map(attr => {
            const aliases = attr.alias && (Array.isArray(attr.alias) ? attr.alias : [attr.alias]);
            const aliasText = aliases && aliases.length > 0 ? 
                `<span class="alias-text">(${aliases.join(', ')})</span>` : '';
            const requiredMark = attr.required ? '<span class="required-mark">*</span>' : '';
            const fieldClass = attr.required ? 'attribute-required' : 'attribute-optional';
            const defaultText = attr.default !== undefined ? ` (Default: ${attr.default})` : '';
            const tooltipContent = `${attr.description}${defaultText}`;
            
            let inputHTML = '';
            // Check if this attribute should use entity picker
            const shouldUseEntityPicker = this.shouldUseEntityPicker(attr, targeter);
            
            if (shouldUseEntityPicker) {
                // Entity type picker for MobsInRadius types attribute
                const inputId = `targeter-entity-${attr.name}-${Math.random().toString(36).substr(2, 9)}`;
                inputHTML = `
                    <input type="hidden" 
                           id="${inputId}"
                           class="targeter-attribute-input mechanic-attribute-input targeter-entity-input" 
                           data-attr="${attr.name}"
                           value="">
                    ${this.createEntityPickerHTML(inputId)}
                `;
            } else if (attr.type === 'boolean') {
                inputHTML = `
                    <select class="targeter-attribute-input mechanic-attribute-input" data-attr="${attr.name}">
                        <option value="true" ${attr.default === true ? 'selected' : ''}>true</option>
                        <option value="false" ${attr.default === false || !attr.default ? 'selected' : ''}>false</option>
                    </select>
                `;
            } else if (attr.type === 'number') {
                inputHTML = `
                    <input type="number" 
                           class="targeter-attribute-input mechanic-attribute-input" 
                           data-attr="${attr.name}"
                           placeholder="${attr.default || ''}"
                           value="${attr.default || ''}">
                `;
            } else {
                inputHTML = `
                    <input type="text" 
                           class="targeter-attribute-input mechanic-attribute-input" 
                           data-attr="${attr.name}"
                           placeholder="${attr.default || ''}"
                           value="${attr.default || ''}">
                `;
            }

            return `
                <div class="mechanic-attribute-field ${fieldClass}" data-tooltip="${tooltipContent.replace(/"/g, '&quot;')}">
                    <div class="attribute-card">
                        <label class="attribute-label">
                            <span class="attribute-name">${attr.name}</span>
                            ${aliasText}
                            ${requiredMark}
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

        // Setup entity pickers for entity-type inputs
        this.setupEntityPickers(formContainer);

        // Update preview initially
        this.updateTargeterPreview();

        // Attach input listeners
        formContainer.querySelectorAll('.targeter-attribute-input').forEach(input => {
            input.addEventListener('input', () => this.updateTargeterPreview());
            input.addEventListener('change', () => this.updateTargeterPreview());
        });
    }

    /**
     * Update targeter preview
     */
    updateTargeterPreview() {
        if (!this.currentTargeter) return;

        const formContainer = document.getElementById('targeterAttributeForm');
        const inputs = formContainer.querySelectorAll('.targeter-attribute-input');
        
        const attributes = [];
        inputs.forEach(input => {
            const attrName = input.dataset.attr;
            const value = input.value.trim();
            
            if (value) {
                // Find the attribute definition to get preferred alias
                const attrDef = this.currentTargeter.attributes.find(a => a.name === attrName);
                const key = (attrDef?.alias && Array.isArray(attrDef.alias) && attrDef.alias.length > 0) 
                    ? attrDef.alias[0] 
                    : (attrDef?.alias || attrName);
                attributes.push(`${key}=${value}`);
            }
        });

        let preview = `@${this.currentTargeter.name}`;
        if (attributes.length > 0) {
            preview += `{${attributes.join(';')}}`;
        }

        document.getElementById('targeterPreviewCode').textContent = preview;
    }

    /**
     * Close attribute modal and return to selection
     */
    closeAttributeModal() {
        this.showTargeterSelection();
        this.currentTargeter = null;
    }

    /**
     * Show targeter selection step (back from configuration)
     */
    showTargeterSelection() {
        document.getElementById('targeterSelectionStep').classList.add('active');
        document.getElementById('targeterConfigurationStep').classList.remove('active');
        
        // Reset search and category
        document.getElementById('targeterSearchInput').value = '';
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');
        this.currentCategory = 'all';
        this.searchQuery = '';
        
        this.renderTargeters();
    }

    /**
     * Confirm attribute configuration and select targeter
     */
    confirmAttributeConfiguration() {
        if (!this.currentTargeter) return;

        const formContainer = document.getElementById('targeterAttributeForm');
        const inputs = formContainer.querySelectorAll('.targeter-attribute-input');
        
        // Validate required fields
        const requiredAttrs = this.currentTargeter.attributes.filter(a => a.required);
        for (const attr of requiredAttrs) {
            const input = formContainer.querySelector(`[data-attr="${attr.name}"]`);
            if (!input || !input.value.trim()) {
                if (window.editor && window.editor.showAlert) {
                    window.editor.showAlert(`${attr.name} is required`, 'warning', 'Required Field');
                }
                return;
            }
        }

        // Build targeter string
        const attributes = [];
        inputs.forEach(input => {
            const attrName = input.dataset.attr;
            const value = input.value.trim();
            
            if (value) {
                const attrDef = this.currentTargeter.attributes.find(a => a.name === attrName);
                const key = (attrDef?.alias && Array.isArray(attrDef.alias) && attrDef.alias.length > 0) 
                    ? attrDef.alias[0] 
                    : (attrDef?.alias || attrName);
                attributes.push(`${key}=${value}`);
            }
        });

        let targeterString = `@${this.currentTargeter.name}`;
        if (attributes.length > 0) {
            targeterString += `{${attributes.join(';')}}`;
        }

        this.closeAttributeModal();
        
        // Store callback before closing (close() sets it to null)
        const callback = this.onSelectCallback;
        
        // Set flag BEFORE calling callback to prevent double callback
        this.callbackInvoked = true;

        if (callback) {
            callback({
                targeter: this.currentTargeter,
                targeterString: targeterString
            });
        }
        
        this.close();
    }

    /**
     * Select targeter without attributes
     */
    selectTargeter(targeter) {
        const targeterString = `@${targeter.name}`;
        
        // console.log('✅ Targeter selected (no attributes):', targeterString);
        
        // Store callback before closing (close() sets it to null)
        const callback = this.onSelectCallback;
        
        // Set flag BEFORE calling callback to prevent double callback
        this.callbackInvoked = true;
        
        if (callback) {
            // console.log('📞 Calling onSelect callback with:', { targeter, targeterString });
            callback({
                targeter: targeter,
                targeterString: targeterString
            });
        }
        
        this.close();
    }

    /**
     * Check if attribute should use entity picker
     */
    shouldUseEntityPicker(attr, targeter) {
        // Check for 'types' attribute in MobsInRadius targeter
        if (attr.name === 'types' && targeter.id === 'MobsInRadius') {
            return true;
        }
        
        return false;
    }

    /**
     * Setup entity pickers for all entity-type inputs
     */
    setupEntityPickers(formContainer) {
        const entityInputs = formContainer.querySelectorAll('.targeter-entity-input');
        entityInputs.forEach(input => {
            const inputId = input.id;
            if (inputId) {
                this.setupEntityPickerHandlers(inputId);
            }
        });
    }

    /**
     * Create entity picker HTML (same as condition/mechanic browser)
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
     * Setup entity picker event handlers (same as condition/mechanic browser)
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
            this.updateTargeterPreview();
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
                    this.updateTargeterPreview();
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
        this.updateTargeterPreview();
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
                    this.updateTargeterPreview();
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
    module.exports = TargeterBrowser;
}

// Make available globally for lazy initialization
window.TargeterBrowser = TargeterBrowser;

// Loaded silently
