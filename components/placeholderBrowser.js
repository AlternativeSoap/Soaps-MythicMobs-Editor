/**
 * Placeholder Browser Component
 * Visual picker for MythicMobs placeholders with search and categories
 * Allows users to browse, search, and insert placeholders
 */

class PlaceholderBrowser {
    constructor() {
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.onSelectCallback = null;
        this.isOpen = false;
        
        // Favorites management
        this.favorites = this.loadFavorites();
        this.recentlyUsed = this.loadRecentlyUsed();
        
        // Create modal on initialization
        this.createModal();
        this.attachEventListeners();
    }
    
    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('placeholderBrowser_favorites') || '[]');
        } catch {
            return [];
        }
    }
    
    saveFavorites() {
        localStorage.setItem('placeholderBrowser_favorites', JSON.stringify(this.favorites));
    }
    
    loadRecentlyUsed() {
        try {
            return JSON.parse(localStorage.getItem('placeholderBrowser_recent') || '[]');
        } catch {
            return [];
        }
    }
    
    saveRecentlyUsed() {
        localStorage.setItem('placeholderBrowser_recent', JSON.stringify(this.recentlyUsed.slice(0, 20)));
    }
    
    addToRecent(placeholder) {
        // Remove if already exists
        this.recentlyUsed = this.recentlyUsed.filter(p => p !== placeholder);
        // Add to front
        this.recentlyUsed.unshift(placeholder);
        // Keep only last 20
        this.recentlyUsed = this.recentlyUsed.slice(0, 20);
        this.saveRecentlyUsed();
    }
    
    toggleFavorite(placeholder) {
        const index = this.favorites.indexOf(placeholder);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(placeholder);
        }
        this.saveFavorites();
        this.renderPlaceholders();
    }
    
    createModal() {
        // Remove existing modal if present
        const existing = document.getElementById('placeholderBrowserOverlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'placeholderBrowserOverlay';
        overlay.className = 'browser-overlay placeholder-browser-overlay hidden';
        
        overlay.innerHTML = `
            <div class="browser-modal placeholder-browser-modal">
                <div class="browser-header">
                    <div class="browser-title">
                        <i class="fas fa-code"></i>
                        <span>Placeholder Browser</span>
                    </div>
                    <button class="browser-close" id="closePlaceholderBrowser">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="browser-search">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="placeholderSearchInput" placeholder="Search placeholders... (e.g., caster.hp, target.name)">
                    <button class="clear-search hidden" id="clearPlaceholderSearch">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="browser-categories" id="placeholderCategories">
                    <button class="category-tab active" data-category="all">
                        <i class="fas fa-globe"></i> All
                    </button>
                    <button class="category-tab" data-category="recent">
                        <i class="fas fa-clock"></i> Recent
                    </button>
                    <button class="category-tab" data-category="favorites">
                        <i class="fas fa-star"></i> Favorites
                    </button>
                    <button class="category-tab" data-category="caster">
                        <i class="fas fa-skull"></i> Caster
                    </button>
                    <button class="category-tab" data-category="target">
                        <i class="fas fa-crosshairs"></i> Target
                    </button>
                    <button class="category-tab" data-category="trigger">
                        <i class="fas fa-bolt"></i> Trigger
                    </button>
                    <button class="category-tab" data-category="variable">
                        <i class="fas fa-database"></i> Variables
                    </button>
                    <button class="category-tab" data-category="skill">
                        <i class="fas fa-magic"></i> Skill Vars
                    </button>
                    <button class="category-tab" data-category="misc">
                        <i class="fas fa-wrench"></i> Misc
                    </button>
                    <button class="category-tab" data-category="special">
                        <i class="fas fa-keyboard"></i> Special
                    </button>
                    <button class="category-tab" data-category="color">
                        <i class="fas fa-palette"></i> Colors
                    </button>
                    <button class="category-tab" data-category="minimessage">
                        <i class="fas fa-paint-brush"></i> MiniMessage
                    </button>
                    <button class="category-tab" data-category="item">
                        <i class="fas fa-gem"></i> Item
                    </button>
                    <button class="category-tab" data-category="score">
                        <i class="fas fa-trophy"></i> Scores
                    </button>
                    <button class="category-tab" data-category="papi">
                        <i class="fas fa-plug"></i> PAPI
                    </button>
                    <button class="category-tab" data-category="meta">
                        <i class="fas fa-cogs"></i> Meta Keywords
                    </button>
                </div>
                
                <div class="browser-content" id="placeholderList">
                    <!-- Placeholders will be rendered here -->
                </div>
                
                <div class="browser-footer">
                    <div class="browser-info">
                        <i class="fas fa-info-circle"></i>
                        <span>Click a placeholder to copy it. Double-click to insert directly.</span>
                    </div>
                    <div class="browser-stats" id="placeholderStats">
                        <!-- Stats will be rendered here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    attachEventListeners() {
        // Close button
        document.getElementById('closePlaceholderBrowser')?.addEventListener('click', () => this.hide());
        
        // Overlay click to close
        document.getElementById('placeholderBrowserOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'placeholderBrowserOverlay') {
                this.hide();
            }
        });
        
        // Search input
        const searchInput = document.getElementById('placeholderSearchInput');
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.updateClearButton();
            this.renderPlaceholders();
        });
        
        // Clear search button
        document.getElementById('clearPlaceholderSearch')?.addEventListener('click', () => {
            const searchInput = document.getElementById('placeholderSearchInput');
            if (searchInput) {
                searchInput.value = '';
                this.searchQuery = '';
                this.updateClearButton();
                this.renderPlaceholders();
                searchInput.focus();
            }
        });
        
        // Category tabs
        document.getElementById('placeholderCategories')?.addEventListener('click', (e) => {
            const tab = e.target.closest('.category-tab');
            if (tab) {
                document.querySelectorAll('#placeholderCategories .category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.category;
                this.renderPlaceholders();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    }
    
    updateClearButton() {
        const clearBtn = document.getElementById('clearPlaceholderSearch');
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', !this.searchQuery);
        }
    }
    
    show(callback, options = {}) {
        this.onSelectCallback = callback;
        const overlay = document.getElementById('placeholderBrowserOverlay');
        if (overlay) {
            // Handle z-index to ensure modal appears above parent
            if (options.parentZIndex) {
                overlay.style.zIndex = options.parentZIndex + 100;
            } else {
                overlay.style.zIndex = '10200';
            }
            
            overlay.classList.remove('hidden');
            this.isOpen = true;
            this.renderPlaceholders();
            
            // Focus search input
            setTimeout(() => {
                document.getElementById('placeholderSearchInput')?.focus();
            }, 100);
        }
    }
    
    /**
     * Alias for show() for compatibility with other browsers
     * @param {Object} options - Configuration options
     * @param {Function} options.onSelect - Callback when placeholder is selected
     * @param {number} options.parentZIndex - Z-index of parent modal
     */
    open(options = {}) {
        this.show(options.onSelect, options);
    }
    
    hide() {
        const overlay = document.getElementById('placeholderBrowserOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            this.isOpen = false;
        }
    }
    
    getPlaceholders() {
        if (!window.PLACEHOLDERS_DATA) return [];
        
        const data = window.PLACEHOLDERS_DATA;
        let placeholders = [];
        
        // Handle special categories
        if (this.currentCategory === 'recent') {
            return this.recentlyUsed.map(p => ({
                placeholder: p,
                description: this.findDescription(p),
                category: 'recent'
            }));
        }
        
        if (this.currentCategory === 'favorites') {
            return this.favorites.map(p => ({
                placeholder: p,
                description: this.findDescription(p),
                category: 'favorites'
            }));
        }
        
        if (this.currentCategory === 'meta') {
            // Return meta keywords
            const meta = data.metaKeywords;
            const categories = ['universal', 'integer', 'float', 'string', 'boolean', 'list', 'location', 'vector', 'map', 'time', 'item'];
            
            categories.forEach(cat => {
                if (meta[cat]) {
                    meta[cat].forEach(item => {
                        placeholders.push({
                            placeholder: item.keyword,
                            description: item.description,
                            example: item.example,
                            output: item.output,
                            category: 'meta',
                            metaType: cat
                        });
                    });
                }
            });
            
            return this.filterPlaceholders(placeholders);
        }
        
        // Regular categories
        const categories = ['special', 'caster', 'target', 'trigger', 'misc', 'item', 'score', 'variable', 'skill', 'color', 'minimessage', 'papi'];
        
        categories.forEach(cat => {
            if (data[cat] && (this.currentCategory === 'all' || this.currentCategory === cat)) {
                data[cat].forEach(item => {
                    placeholders.push({
                        ...item,
                        category: cat
                    });
                });
            }
        });
        
        return this.filterPlaceholders(placeholders);
    }
    
    findDescription(placeholder) {
        if (!window.PLACEHOLDERS_DATA) return '';
        
        const data = window.PLACEHOLDERS_DATA;
        const categories = ['special', 'caster', 'target', 'trigger', 'misc', 'item', 'score', 'variable', 'skill', 'color', 'minimessage', 'papi'];
        
        for (const cat of categories) {
            if (data[cat]) {
                const found = data[cat].find(p => p.placeholder === placeholder);
                if (found) return found.description;
            }
        }
        return '';
    }
    
    filterPlaceholders(placeholders) {
        if (!this.searchQuery) return placeholders;
        
        return placeholders.filter(p => {
            const searchText = `${p.placeholder} ${p.description || ''} ${p.example || ''}`.toLowerCase();
            return searchText.includes(this.searchQuery);
        });
    }
    
    renderPlaceholders() {
        const container = document.getElementById('placeholderList');
        if (!container) return;
        
        const placeholders = this.getPlaceholders();
        
        if (placeholders.length === 0) {
            container.innerHTML = `
                <div class="browser-empty">
                    <i class="fas fa-search"></i>
                    <p>No placeholders found</p>
                    <span>Try a different search or category</span>
                </div>
            `;
            this.updateStats(0);
            return;
        }
        
        // Group by category for "all" view
        if (this.currentCategory === 'all' && !this.searchQuery) {
            container.innerHTML = this.renderGroupedPlaceholders(placeholders);
        } else if (this.currentCategory === 'meta') {
            container.innerHTML = this.renderMetaKeywords(placeholders);
        } else {
            container.innerHTML = this.renderFlatPlaceholders(placeholders);
        }
        
        this.attachPlaceholderListeners(container);
        this.updateStats(placeholders.length);
    }
    
    renderGroupedPlaceholders(placeholders) {
        const groups = {};
        placeholders.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        
        const categoryOrder = ['caster', 'target', 'trigger', 'variable', 'skill', 'misc', 'special', 'color', 'minimessage', 'item', 'score', 'papi'];
        const categoryNames = {
            caster: 'Caster Placeholders',
            target: 'Target Placeholders',
            trigger: 'Trigger Placeholders',
            variable: 'Variable Placeholders',
            skill: 'Skill Variables',
            misc: 'Misc / Utility',
            special: 'Special Characters',
            color: 'Color Codes',
            minimessage: 'MiniMessage Tags',
            item: 'Item Placeholders',
            score: 'Scoreboard',
            papi: 'PlaceholderAPI'
        };
        
        let html = '';
        categoryOrder.forEach(cat => {
            if (groups[cat] && groups[cat].length > 0) {
                html += `
                    <div class="placeholder-group">
                        <div class="placeholder-group-header">
                            <i class="${this.getCategoryIcon(cat)}"></i>
                            ${categoryNames[cat] || cat}
                            <span class="count">(${groups[cat].length})</span>
                        </div>
                        <div class="placeholder-group-items">
                            ${groups[cat].map(p => this.renderPlaceholderCard(p)).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        return html;
    }
    
    renderFlatPlaceholders(placeholders) {
        return `
            <div class="placeholder-grid">
                ${placeholders.map(p => this.renderPlaceholderCard(p)).join('')}
            </div>
        `;
    }
    
    renderMetaKeywords(placeholders) {
        const groups = {};
        placeholders.forEach(p => {
            if (!groups[p.metaType]) groups[p.metaType] = [];
            groups[p.metaType].push(p);
        });
        
        const typeNames = {
            universal: 'Universal (All Types)',
            integer: 'Integer',
            float: 'Float',
            string: 'String',
            boolean: 'Boolean',
            list: 'List',
            location: 'Location',
            vector: 'Vector',
            map: 'Map',
            time: 'Time',
            item: 'Item'
        };
        
        let html = `
            <div class="meta-keywords-info">
                <i class="fas fa-info-circle"></i>
                <span>Meta keywords can be chained: <code>&lt;var.name.uppercase.size&gt;</code></span>
            </div>
        `;
        
        Object.keys(groups).forEach(type => {
            if (groups[type].length > 0) {
                html += `
                    <div class="placeholder-group meta-group">
                        <div class="placeholder-group-header meta-header">
                            <i class="fas fa-cog"></i>
                            ${typeNames[type] || type} Keywords
                            <span class="count">(${groups[type].length})</span>
                        </div>
                        <div class="placeholder-group-items">
                            ${groups[type].map(p => this.renderMetaKeywordCard(p)).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        return html;
    }
    
    renderPlaceholderCard(p) {
        const isFavorite = this.favorites.includes(p.placeholder);
        const isColor = p.category === 'color';
        const colorStyle = p.color ? `style="--placeholder-color: ${p.color}"` : '';
        
        return `
            <div class="placeholder-card ${isColor ? 'color-card' : ''}" 
                 data-placeholder="${this.escapeHtml(p.placeholder)}"
                 ${colorStyle}>
                <div class="placeholder-card-header">
                    <code class="placeholder-code">${this.escapeHtml(p.placeholder)}</code>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            data-placeholder="${this.escapeHtml(p.placeholder)}"
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="placeholder-description">${this.escapeHtml(p.description || '')}</div>
                ${p.output ? `<div class="placeholder-output">Output: <code>${this.escapeHtml(p.output)}</code></div>` : ''}
                ${p.example ? `<div class="placeholder-example"><code>${this.escapeHtml(p.example)}</code></div>` : ''}
                ${p.context ? `<div class="placeholder-context"><i class="fas fa-info-circle"></i> ${this.escapeHtml(p.context)}</div>` : ''}
                ${p.premium ? `<div class="placeholder-premium"><i class="fas fa-crown"></i> Premium</div>` : ''}
                ${p.requires ? `<div class="placeholder-requires"><i class="fas fa-plug"></i> Requires: ${this.escapeHtml(p.requires)}</div>` : ''}
                ${isColor && p.color ? `<div class="color-preview" style="background-color: ${p.color}"></div>` : ''}
            </div>
        `;
    }
    
    renderMetaKeywordCard(p) {
        return `
            <div class="placeholder-card meta-card" data-placeholder="${this.escapeHtml(p.placeholder)}">
                <div class="placeholder-card-header">
                    <code class="placeholder-code meta-keyword">${this.escapeHtml(p.placeholder)}</code>
                    ${p.output ? `<span class="meta-output-type">${p.output}</span>` : ''}
                </div>
                <div class="placeholder-description">${this.escapeHtml(p.description || '')}</div>
                ${p.example ? `<div class="placeholder-example"><code>${this.escapeHtml(p.example)}</code></div>` : ''}
            </div>
        `;
    }
    
    getCategoryIcon(category) {
        const icons = {
            special: 'fas fa-keyboard',
            caster: 'fas fa-skull',
            target: 'fas fa-crosshairs',
            trigger: 'fas fa-bolt',
            misc: 'fas fa-wrench',
            item: 'fas fa-gem',
            score: 'fas fa-trophy',
            variable: 'fas fa-database',
            skill: 'fas fa-magic',
            color: 'fas fa-palette',
            minimessage: 'fas fa-paint-brush',
            papi: 'fas fa-plug',
            meta: 'fas fa-cogs'
        };
        return icons[category] || 'fas fa-code';
    }
    
    attachPlaceholderListeners(container) {
        // Click to copy
        container.querySelectorAll('.placeholder-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.favorite-btn')) return;
                
                const placeholder = card.dataset.placeholder;
                this.copyToClipboard(placeholder);
                this.addToRecent(placeholder);
                
                // Visual feedback
                card.classList.add('copied');
                setTimeout(() => card.classList.remove('copied'), 300);
            });
            
            // Double-click to insert and close
            card.addEventListener('dblclick', (e) => {
                if (e.target.closest('.favorite-btn')) return;
                
                const placeholder = card.dataset.placeholder;
                this.addToRecent(placeholder);
                
                if (this.onSelectCallback) {
                    this.onSelectCallback(placeholder);
                }
                this.hide();
            });
        });
        
        // Favorite buttons
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const placeholder = btn.dataset.placeholder;
                this.toggleFavorite(placeholder);
            });
        });
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(`Copied: ${text}`);
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast(`Copied: ${text}`);
        });
    }
    
    showToast(message) {
        // Use existing toast system if available
        if (window.showToast) {
            window.showToast(message, 'success');
        } else if (window.editor?.showToast) {
            window.editor.showToast(message, 'success');
        } else {
            // Simple fallback toast
            const toast = document.createElement('div');
            toast.className = 'simple-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-tertiary, #333);
                color: var(--text-primary, #fff);
                padding: 10px 20px;
                border-radius: 8px;
                z-index: 10001;
                animation: fadeInOut 2s ease;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    }
    
    updateStats(count) {
        const stats = document.getElementById('placeholderStats');
        if (stats) {
            stats.innerHTML = `
                <span>${count} placeholder${count !== 1 ? 's' : ''}</span>
                ${this.favorites.length > 0 ? `<span>• ${this.favorites.length} favorited</span>` : ''}
            `;
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.placeholderBrowser = new PlaceholderBrowser();
        });
    } else {
        window.placeholderBrowser = new PlaceholderBrowser();
    }
}
