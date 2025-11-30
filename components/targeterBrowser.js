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
                </div>
            </div>

            <!-- Attribute Configuration Modal -->
            <div id="targeterAttributeOverlay" class="targeter-attribute-overlay">
                <div class="targeter-attribute-modal">
                    <h3 id="targeterAttributeTitle">Configure Targeter</h3>
                    <div id="targeterAttributeForm" class="targeter-attribute-form">
                        <!-- Attribute inputs will be rendered here -->
                    </div>
                    <div class="targeter-preview">
                        <label>Preview:</label>
                        <code id="targeterPreviewCode">@Self</code>
                    </div>
                    <div class="targeter-attribute-buttons">
                        <button class="targeter-attribute-btn cancel" id="targeterAttributeCancel">Cancel</button>
                        <button class="targeter-attribute-btn confirm" id="targeterAttributeConfirm">Confirm</button>
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

        // Search input
        document.getElementById('targeterSearchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderTargeters();
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
        document.getElementById('targeterAttributeCancel').addEventListener('click', () => {
            this.closeAttributeModal();
        });

        document.getElementById('targeterAttributeConfirm').addEventListener('click', () => {
            this.confirmAttributeConfiguration();
        });

        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const attrOverlay = document.getElementById('targeterAttributeOverlay');
                const browserOverlay = document.getElementById('targeterBrowserOverlay');
                if (attrOverlay && attrOverlay.classList.contains('active')) {
                    this.closeAttributeModal();
                } else if (browserOverlay && browserOverlay.style.display === 'flex') {
                    this.close();
                }
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
        this.onSelectCallback = null;
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

        listContainer.innerHTML = targeters.map(targeter => {
            const aliasesHTML = targeter.aliases && targeter.aliases.length > 0
                ? `<div class="condition-aliases"><strong>Aliases:</strong> ${targeter.aliases.map(a => '@' + a).join(', ')}</div>`
                : '';

            const examplesHTML = targeter.examples && targeter.examples.length > 0
                ? `<div class="condition-example"><strong>Example:</strong> <code>${targeter.examples[0]}</code></div>`
                : '';

            return `
                <div class="condition-card" data-targeter="${targeter.id}">
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
                </div>
            `;
        }).join('');

        // Attach click handlers to select buttons
        listContainer.querySelectorAll('.btn-select-targeter').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.condition-card');
                const targeterId = card.dataset.targeter;
                this.handleTargeterSelection(targeterId);
            });
        });
    }

    /**
     * Handle targeter selection
     */
    handleTargeterSelection(targeterId) {
        const targeter = TARGETERS_DATA.getTargeter(targeterId);
        if (!targeter) return;

        // Check if targeter has attributes
        if (targeter.attributes && targeter.attributes.length > 0) {
            this.showAttributeConfiguration(targeter);
            return;
        }

        // No attributes, directly select
        this.selectTargeter(targeter);
    }

    /**
     * Show attribute configuration modal
     */
    showAttributeConfiguration(targeter) {
        this.currentTargeter = targeter;
        
        document.getElementById('targeterAttributeTitle').textContent = `Configure @${targeter.name}`;
        
        const formContainer = document.getElementById('targeterAttributeForm');
        formContainer.innerHTML = targeter.attributes.map(attr => {
            const aliases = attr.alias && (Array.isArray(attr.alias) ? attr.alias : [attr.alias]);
            const aliasText = aliases && aliases.length > 0 ? ` (${aliases.join(', ')})` : '';
            const requiredMark = attr.required ? '<span class="required">*</span>' : '';
            
            let inputHTML = '';
            if (attr.type === 'boolean') {
                inputHTML = `
                    <select class="targeter-attribute-input" data-attr="${attr.name}">
                        <option value="true" ${attr.default === true ? 'selected' : ''}>true</option>
                        <option value="false" ${attr.default === false || !attr.default ? 'selected' : ''}>false</option>
                    </select>
                `;
            } else if (attr.type === 'number') {
                inputHTML = `
                    <input type="number" 
                           class="targeter-attribute-input" 
                           data-attr="${attr.name}"
                           placeholder="${attr.default || ''}"
                           value="${attr.default || ''}">
                `;
            } else {
                inputHTML = `
                    <input type="text" 
                           class="targeter-attribute-input" 
                           data-attr="${attr.name}"
                           placeholder="${attr.default || ''}"
                           value="${attr.default || ''}">
                `;
            }

            return `
                <div class="targeter-attribute-field">
                    <label>${attr.name}${aliasText} ${requiredMark}</label>
                    ${inputHTML}
                    <small>${attr.description}</small>
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

        document.getElementById('targeterAttributeOverlay').classList.add('active');
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
     * Close attribute modal
     */
    closeAttributeModal() {
        document.getElementById('targeterAttributeOverlay').classList.remove('active');
        this.currentTargeter = null;
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

        this.closeAttributeModal();
        this.close();

        if (this.onSelectCallback) {
            this.onSelectCallback({
                targeter: this.currentTargeter,
                targeterString: targeterString
            });
        }
    }

    /**
     * Select targeter without attributes
     */
    selectTargeter(targeter) {
        const targeterString = `@${targeter.name}`;
        
        this.close();

        if (this.onSelectCallback) {
            this.onSelectCallback({
                targeter: targeter,
                targeterString: targeterString
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TargeterBrowser;
}

console.log('✅ TargeterBrowser component loaded');
