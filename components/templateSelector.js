/**
 * Template Selector Component
 * Modern browser-style interface for pre-made skill line templates
 * Matches Mechanic/Condition browser design with unified styling
 */

class TemplateSelector {
    constructor() {
        this.context = 'mob';
        this.currentTab = 'favorites';
        this.searchQuery = '';
        this.onSelectCallback = null;
        this.onBackCallback = null;
        this.favorites = this.loadFavorites();
        this.recentTemplates = this.loadRecent();
        this.selectedTemplate = null;
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Load favorites from localStorage
     */
    loadFavorites() {
        const saved = localStorage.getItem('templateSelector_favorites');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Save favorites to localStorage
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
     * Toggle favorite status
     */
    toggleFavorite(templateId) {
        const index = this.favorites.indexOf(templateId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(templateId);
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
            <div id="templateSelectorOverlay" class="condition-modal" style="display: none;">
                <div class="modal-content condition-browser template-browser-content">
                    <!-- Header -->
                    <div class="modal-header">
                        <button class="btn btn-secondary btn-back" id="templateSelectorBack" title="Back to options" style="display: none;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <h2>
                            <i class="fas fa-layer-group"></i>
                            Skill Templates
                        </h2>
                        <button class="btn-close" id="templateSelectorClose" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Search Bar -->
                    <div class="search-bar">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" 
                               id="templateSearchInput" 
                               class="search-input" 
                               placeholder="Search templates by name, description, or skill...">
                        <button class="search-clear" id="templateSearchClear" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="category-tabs" id="templateTabs">
                        <!-- Tabs will be rendered here -->
                    </div>
                    
                    <!-- Content Area -->
                    <div class="condition-browser-body">
                        <div class="condition-list" id="templateList">
                            <!-- Templates will be rendered here -->
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
        `;

        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
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

        // Search input
        const searchInput = document.getElementById('templateSearchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            document.getElementById('templateSearchClear').style.display = this.searchQuery ? 'block' : 'none';
            this.renderTemplates();
        });

        // Clear search
        document.getElementById('templateSearchClear').addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            document.getElementById('templateSearchClear').style.display = 'none';
            this.renderTemplates();
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
     * Open the template selector
     */
    open(options = {}) {
        console.log('🎁 Opening Template Selector (Modern Design)');
        this.context = options.context || 'mob';
        this.onSelectCallback = options.onSelect || null;
        this.onBackCallback = options.onBack || null;
        this.searchQuery = '';
        this.selectedTemplate = null;
        
        // Show/hide back button based on callback presence
        const backBtn = document.getElementById('templateSelectorBack');
        if (backBtn) {
            backBtn.style.display = this.onBackCallback ? 'inline-flex' : 'none';
        }
        
        // Reset search input
        document.getElementById('templateSearchInput').value = '';
        document.getElementById('templateSearchClear').style.display = 'none';
        
        // Render tabs and templates
        this.renderTabs();
        this.renderTemplates();

        document.getElementById('templateSelectorOverlay').style.display = 'flex';
        
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
    }

    /**
     * Render tabs
     */
    renderTabs() {
        const container = document.getElementById('templateTabs');
        const contextTemplates = SKILL_TEMPLATES.getAll(this.context);
        const categories = SKILL_TEMPLATES.getAllCategories(this.context);
        
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
            const templates = SKILL_TEMPLATES.getByCategory(this.context, category);
            const icon = SKILL_TEMPLATES.getCategoryIcon(category);
            const name = SKILL_TEMPLATES.getCategoryDisplayName(category);
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
     * Get total template count for current context
     */
    getTotalTemplateCount() {
        const contextTemplates = SKILL_TEMPLATES.getAll(this.context);
        return contextTemplates.length;
    }

    /**
     * Get favorite templates
     */
    getFavoriteTemplates() {
        const allTemplates = SKILL_TEMPLATES.getAll(this.context);
        return allTemplates.filter(t => this.isFavorite(t.id));
    }

    /**
     * Get recent templates
     */
    getRecentTemplates() {
        const allTemplates = SKILL_TEMPLATES.getAll(this.context);
        return this.recentTemplates
            .map(id => allTemplates.find(t => t.id === id))
            .filter(t => t !== undefined);
    }

    /**
     * Render template list
     */
    renderTemplates() {
        const container = document.getElementById('templateList');
        let templates = [];
        
        // Get templates based on current tab
        if (this.currentTab === 'favorites') {
            templates = this.getFavoriteTemplates();
        } else if (this.currentTab === 'recent') {
            templates = this.getRecentTemplates();
        } else if (this.currentTab === 'all') {
            templates = SKILL_TEMPLATES.getAll(this.context);
        } else {
            // Specific category
            templates = SKILL_TEMPLATES.getByCategory(this.context, this.currentTab);
        }
        
        // Filter by search query
        if (this.searchQuery) {
            templates = templates.filter(t => 
                t.name.toLowerCase().includes(this.searchQuery) ||
                t.description.toLowerCase().includes(this.searchQuery) ||
                t.skillLine.toLowerCase().includes(this.searchQuery) ||
                t.category.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Update count
        document.getElementById('templateCount').textContent = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;
        
        // Render templates
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-layer-group" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>${this.searchQuery ? 'No templates found matching your search' : this.currentTab === 'favorites' ? 'No favorite templates yet' : this.currentTab === 'recent' ? 'No recent templates' : 'No templates available'}</p>
                    ${this.searchQuery ? '<small>Try a different search term</small>' : this.currentTab === 'favorites' ? '<small>Click the star icon on templates to add them to favorites</small>' : ''}
                </div>
            `;
            return;
        }
        
        let html = '';
        templates.forEach(template => {
            const isFav = this.isFavorite(template.id);
            const categoryName = SKILL_TEMPLATES.getCategoryDisplayName(template.category);
            const categoryIcon = SKILL_TEMPLATES.getCategoryIcon(template.category);
            
            // Extract skill lines for display
            const extractedLines = this.extractSkillLines(template.skillLine);
            const lineCount = Array.isArray(extractedLines) ? extractedLines.length : 1;
            const displayLines = Array.isArray(extractedLines) 
                ? extractedLines.slice(0, 3).join('\n') + (extractedLines.length > 3 ? '\n...' : '')
                : extractedLines;
            
            // Get complexity badge
            const complexity = this.getComplexity(lineCount, extractedLines);
            const complexityClass = complexity === 'Easy' ? 'success' : complexity === 'Medium' ? 'warning' : 'danger';
            
            html += `
                <div class="condition-item template-card" data-template-id="${template.id}">
                    <div class="condition-item-header">
                        <div class="condition-item-icon">${template.icon}</div>
                        <div class="condition-item-title">
                            <h3>${template.name}</h3>
                            <div class="template-meta">
                                <span class="template-badge category-badge">${categoryIcon} ${categoryName}</span>
                                <span class="template-badge complexity-badge badge-${complexityClass}">${complexity}</span>
                                ${lineCount > 1 ? `<span class="template-badge lines-badge">${lineCount} lines</span>` : ''}
                            </div>
                        </div>
                        <button class="favorite-btn ${isFav ? 'favorited' : ''}" 
                                data-template-id="${template.id}" 
                                title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                    <div class="condition-item-description">${template.description}</div>
                    <div class="template-preview">
                        <div class="preview-label">Preview:</div>
                        <pre><code>${this.escapeHtml(displayLines)}</code></pre>
                    </div>
                    <div class="condition-item-footer">
                        <button class="btn btn-primary btn-sm template-use-btn" data-template-id="${template.id}">
                            <i class="fas fa-plus"></i>
                            Use Template
                        </button>
                        ${lineCount > 3 ? `<button class="btn btn-secondary btn-sm template-preview-btn" data-template-id="${template.id}">
                            <i class="fas fa-eye"></i>
                            View All Lines
                        </button>` : ''}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Attach event handlers
        container.querySelectorAll('.template-use-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const templateId = e.currentTarget.dataset.templateId;
                this.selectTemplate(templateId);
            });
        });
        
        container.querySelectorAll('.template-preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = e.currentTarget.dataset.templateId;
                this.showFullPreview(templateId);
            });
        });
        
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = e.currentTarget.dataset.templateId;
                this.toggleFavorite(templateId);
                this.renderTabs();
                this.renderTemplates();
            });
        });
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
     * Show full preview of template
     */
    showFullPreview(templateId) {
        const template = SKILL_TEMPLATES.getById(templateId);
        if (!template) return;
        
        const extractedLines = this.extractSkillLines(template.skillLine);
        const displayLines = Array.isArray(extractedLines) ? extractedLines.join('\n') : extractedLines;
        
        const modal = document.createElement('div');
        modal.className = 'condition-modal-overlay active';
        modal.innerHTML = `
            <div class="condition-modal" style="max-width: 800px;">
                <div class="condition-header">
                    <h2>${template.icon} ${template.name}</h2>
                    <button class="close-modal preview-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="condition-content" style="padding: 1.5rem;">
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">${template.description}</p>
                    <div class="template-preview" style="margin: 0;">
                        <div class="preview-label">Full Template (${Array.isArray(extractedLines) ? extractedLines.length : 1} lines):</div>
                        <pre style="max-height: 400px; overflow-y: auto;"><code>${this.escapeHtml(displayLines)}</code></pre>
                    </div>
                </div>
                <div class="condition-footer">
                    <button class="btn btn-secondary preview-cancel">Close</button>
                    <button class="btn btn-primary preview-use" data-template-id="${templateId}">
                        <i class="fas fa-plus"></i>
                        Use Template
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event handlers
        modal.querySelector('.preview-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.preview-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('.preview-use').addEventListener('click', () => {
            modal.remove();
            this.selectTemplate(templateId);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Select a template
     */
    selectTemplate(templateId) {
        const template = SKILL_TEMPLATES.getById(templateId);
        
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }
        
        console.log('✅ Template selected:', template.name);
        
        // Add to recent
        this.addToRecent(templateId);
        
        if (this.onSelectCallback) {
            // Extract skill lines without internal names
            const skillLines = this.extractSkillLines(template.skillLine);
            
            // Pass the extracted lines (array or single string)
            this.onSelectCallback(skillLines);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateSelector;
}

// Loaded silently
