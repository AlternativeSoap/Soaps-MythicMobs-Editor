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
        
        this.createModal();
        this.attachEventListeners();
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
    open(options = {}) {
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
            console.log('🚪 Targeter browser closed without selection, sending null');
            this.onSelectCallback(null);
        } else if (this.callbackInvoked) {
            console.log('🚪 Targeter browser closed after successful selection, skipping null callback');
        }
        
        this.onSelectCallback = null;
        this.callbackInvoked = false; // Reset flag
    }

    /**
     * Update category tab counts
     */
    updateCategoryCounts() {
        const targeters = TARGETERS_DATA.targeters || [];
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
        let targeters = TARGETERS_DATA.targeters;

        // Filter by category
        if (this.currentCategory !== 'all') {
            targeters = targeters.filter(t => t.category === this.currentCategory);
        }

        // Filter by search query
        if (this.searchQuery) {
            targeters = TARGETERS_DATA.searchTargeters(this.searchQuery);
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
        console.log('🎯 handleTargeterSelection called with:', targeterId);
        const targeter = TARGETERS_DATA.getTargeter(targeterId);
        console.log('📦 Targeter data:', targeter);
        if (!targeter) {
            console.error('❌ Targeter not found:', targeterId);
            return;
        }

        // Check if targeter has attributes
        console.log('🔍 Checking attributes:', targeter.attributes);
        if (targeter.attributes && targeter.attributes.length > 0) {
            console.log('✅ Targeter has attributes, showing configuration modal');
            this.showAttributeConfiguration(targeter);
            return;
        }

        // No attributes, directly select (including @Self)
        console.log('✅ Targeter has no attributes, selecting directly');
        this.selectTargeter(targeter);
    }

    /**
     * Show attribute configuration modal
     */
    showAttributeConfiguration(targeter) {
        console.log('🎨 showAttributeConfiguration called for:', targeter.name);
        console.log('🎨 Targeter attributes:', targeter.attributes);
        
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
            if (attr.type === 'boolean') {
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

        // Update preview initially
        this.updateTargeterPreview();

        // Attach input listeners
        formContainer.querySelectorAll('.targeter-attribute-input').forEach(input => {
            input.addEventListener('input', () => this.updateTargeterPreview());
            input.addEventListener('change', () => this.updateTargeterPreview());
        });

        console.log('🎨 Configuration step activated');
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
                alert(`${attr.name} is required`);
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

        console.log('✅ Targeter configured with attributes:', targeterString);

        this.closeAttributeModal();
        
        // Store callback before closing (close() sets it to null)
        const callback = this.onSelectCallback;
        
        // Set flag BEFORE calling callback to prevent double callback
        this.callbackInvoked = true;

        if (callback) {
            console.log('📞 Calling onSelect callback with:', { targeter: this.currentTargeter, targeterString });
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TargeterBrowser;
}

console.log('✅ TargeterBrowser component loaded');
