/**
 * MythicMobs Variable Browser
 * Visual modal for browsing, searching, and selecting variables from the pack
 * Integrates with VariableManager for data and provides quick-insert functionality
 */

class VariableBrowser {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.onSelectCallback = null;
        this.filters = {
            scope: 'all',
            type: 'all',
            search: ''
        };
        this.favorites = this.loadFavorites();
        this.recentlyUsed = this.loadRecentlyUsed();
        
        this.init();
    }
    
    /**
     * Initialize the browser
     */
    init() {
        this.createModal();
        this.bindEvents();
    }
    
    /**
     * Create the modal HTML structure
     */
    createModal() {
        // Remove existing modal if present
        const existing = document.getElementById('variable-browser-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'variable-browser-modal';
        modal.className = 'modal variable-browser-modal';
        modal.innerHTML = `
            <div class="modal-content variable-browser-content">
                <div class="modal-header">
                    <h2><i class="fas fa-database"></i> Variable Browser</h2>
                    <button class="modal-close-btn" id="variable-browser-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="variable-browser-toolbar">
                    <div class="variable-search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" id="variable-search" placeholder="Search variables..." />
                    </div>
                    <button class="btn btn-primary" id="variable-browser-new">
                        <i class="fas fa-plus"></i> New Variable
                    </button>
                </div>
                
                <div class="variable-browser-filters">
                    <div class="filter-group">
                        <label>Scope:</label>
                        <div class="filter-buttons" id="scope-filters">
                            <button class="filter-btn active" data-scope="all">All</button>
                            <button class="filter-btn" data-scope="SKILL" title="Temporary, current skill only">
                                <i class="fas fa-bolt"></i> Skill
                            </button>
                            <button class="filter-btn" data-scope="CASTER" title="Stored on the casting mob">
                                <i class="fas fa-skull"></i> Caster
                            </button>
                            <button class="filter-btn" data-scope="TARGET" title="Stored on the target">
                                <i class="fas fa-crosshairs"></i> Target
                            </button>
                            <button class="filter-btn" data-scope="WORLD" title="Per-world storage">
                                <i class="fas fa-globe"></i> World
                            </button>
                            <button class="filter-btn" data-scope="GLOBAL" title="Server-wide storage">
                                <i class="fas fa-server"></i> Global
                            </button>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <label>Type:</label>
                        <div class="filter-buttons type-filter-buttons" id="type-filters">
                            <button class="filter-btn active" data-type="all">All</button>
                            <button class="filter-btn" data-type="INTEGER" title="Whole numbers">
                                <i class="fas fa-hashtag"></i>
                            </button>
                            <button class="filter-btn" data-type="FLOAT" title="Decimal numbers">
                                <i class="fas fa-percentage"></i>
                            </button>
                            <button class="filter-btn" data-type="STRING" title="Text values">
                                <i class="fas fa-font"></i>
                            </button>
                            <button class="filter-btn" data-type="BOOLEAN" title="True/False">
                                <i class="fas fa-toggle-on"></i>
                            </button>
                            <button class="filter-btn" data-type="LIST" title="Ordered list">
                                <i class="fas fa-list"></i>
                            </button>
                            <button class="filter-btn" data-type="LOCATION" title="World location">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="variable-browser-body">
                    <div class="variable-list-container" id="variable-list">
                        <!-- Variables will be populated here -->
                    </div>
                    
                    <div class="variable-preview-panel" id="variable-preview">
                        <div class="preview-empty">
                            <i class="fas fa-mouse-pointer"></i>
                            <p>Select a variable to see details</p>
                        </div>
                    </div>
                </div>
                
                <div class="variable-browser-footer">
                    <div class="selected-info" id="selected-variable-info">
                        <span class="selected-placeholder"></span>
                    </div>
                    <div class="footer-buttons">
                        <button class="btn btn-secondary" id="variable-browser-cancel">Cancel</button>
                        <button class="btn btn-primary" id="variable-browser-insert-placeholder" disabled>
                            <i class="fas fa-code"></i> Insert Placeholder
                        </button>
                        <button class="btn btn-primary" id="variable-browser-insert-mechanic" disabled>
                            <i class="fas fa-cog"></i> Insert setVariable
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        document.getElementById('variable-browser-close').addEventListener('click', () => this.close());
        document.getElementById('variable-browser-cancel').addEventListener('click', () => this.close());
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
        
        // Search input
        const searchInput = document.getElementById('variable-search');
        searchInput.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.renderVariables();
        });
        
        // Scope filter buttons
        document.getElementById('scope-filters').addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            
            // Update active state
            document.querySelectorAll('#scope-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            this.filters.scope = btn.dataset.scope;
            this.renderVariables();
        });
        
        // Type filter buttons
        document.getElementById('type-filters').addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            
            // Update active state
            document.querySelectorAll('#type-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            this.filters.type = btn.dataset.type;
            this.renderVariables();
        });
        
        // New variable button
        document.getElementById('variable-browser-new').addEventListener('click', () => {
            this.close();
            // Open Variable Builder if available
            if (window.variableBuilder) {
                window.variableBuilder.open();
            }
        });
        
        // Insert buttons
        document.getElementById('variable-browser-insert-placeholder').addEventListener('click', () => {
            this.insertSelected('placeholder');
        });
        
        document.getElementById('variable-browser-insert-mechanic').addEventListener('click', () => {
            this.insertSelected('mechanic');
        });
    }
    
    /**
     * Open the browser modal
     * @param {Object} options - Configuration options
     * @param {string} options.mode - Mode: 'select', 'browse'
     * @param {string} options.insertMode - Insert mode: 'placeholder', 'reference'
     * @param {string} options.context - Context: 'mob', 'skill'
     * @param {string} options.suggestScope - Suggested scope to pre-filter
     * @param {number} options.parentZIndex - Z-index of parent modal (to ensure this opens above)
     * @param {Function} options.onSelect - Callback when variable is selected
     */
    open(options = {}) {
        this.onSelectCallback = options.onSelect || null;
        this.selectedVariable = null;
        this.currentMode = options.mode || 'select';
        this.currentInsertMode = options.insertMode || 'placeholder';
        this.currentContext = options.context || 'mob';
        
        // Handle z-index to ensure modal appears above parent
        if (options.parentZIndex) {
            this.modal.style.zIndex = options.parentZIndex + 100;
        } else {
            this.modal.style.zIndex = '10200';
        }
        
        // Reset filters
        this.filters = { scope: 'all', type: 'all', search: '' };
        document.getElementById('variable-search').value = '';
        
        // Apply suggested scope filter if provided
        if (options.suggestScope) {
            this.filters.scope = options.suggestScope;
        }
        
        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.scope) {
                btn.classList.toggle('active', btn.dataset.scope === this.filters.scope);
            } else if (btn.dataset.type) {
                btn.classList.toggle('active', btn.dataset.type === 'all');
            }
        });
        
        // Update scope recommendations based on context
        this.updateScopeRecommendations();
        
        // Refresh variable list
        if (window.variableManager) {
            window.variableManager.scanPack();
        }
        
        this.renderVariables();
        this.updatePreview(null);
        this.updateInsertButtons();
        
        this.modal.classList.add('show');
        this.isOpen = true;
        
        // Focus search input
        setTimeout(() => {
            document.getElementById('variable-search').focus();
        }, 100);
    }
    
    /**
     * Update scope button recommendations based on context
     */
    updateScopeRecommendations() {
        const recommendedScope = this.currentContext === 'mob' ? 'CASTER' : 'SKILL';
        
        document.querySelectorAll('#scope-filters .filter-btn').forEach(btn => {
            // Remove existing recommendation badges
            const existingBadge = btn.querySelector('.recommended-badge');
            if (existingBadge) existingBadge.remove();
            
            // Add recommendation badge to the appropriate scope
            if (btn.dataset.scope === recommendedScope) {
                const badge = document.createElement('span');
                badge.className = 'recommended-badge';
                badge.innerHTML = '<i class="fas fa-star"></i>';
                badge.title = `Recommended for ${this.currentContext} context`;
                btn.appendChild(badge);
            }
        });
    }
    
    /**
     * Close the browser modal
     */
    close() {
        this.modal.classList.remove('show');
        this.isOpen = false;
        this.selectedVariable = null;
    }
    
    /**
     * Render the variable list
     */
    renderVariables() {
        const container = document.getElementById('variable-list');
        
        if (!window.variableManager) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Variable Manager not available</p>
                </div>
            `;
            return;
        }
        
        let variables = window.variableManager.getAll();
        
        // Apply filters
        if (this.filters.scope !== 'all') {
            variables = variables.filter(v => v.scope === this.filters.scope);
        }
        if (this.filters.type !== 'all') {
            variables = variables.filter(v => v.type === this.filters.type);
        }
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            variables = variables.filter(v => 
                v.name.toLowerCase().includes(search) ||
                v.scope.toLowerCase().includes(search) ||
                v.type.toLowerCase().includes(search)
            );
        }
        
        if (variables.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-database"></i>
                    <p>No variables found</p>
                    <small>${this.filters.search || this.filters.scope !== 'all' || this.filters.type !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Variables will appear here when detected in your pack'}</small>
                </div>
            `;
            return;
        }
        
        // Group by scope
        const grouped = this.groupByScope(variables);
        
        let html = '';
        for (const [scope, vars] of Object.entries(grouped)) {
            const scopeInfo = this.getScopeInfo(scope);
            html += `
                <div class="variable-group">
                    <div class="variable-group-header" style="border-left-color: ${scopeInfo.color}">
                        <i class="fas ${scopeInfo.icon}"></i>
                        <span>${scopeInfo.name} Variables (${vars.length})</span>
                    </div>
                    <div class="variable-group-items">
                        ${vars.map(v => this.renderVariableItem(v)).join('')}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Bind click events
        container.querySelectorAll('.variable-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectVariable(item.dataset.scope, item.dataset.name);
            });
            
            item.addEventListener('dblclick', () => {
                this.selectVariable(item.dataset.scope, item.dataset.name);
                this.insertSelected('placeholder');
            });
        });
        
        // Bind favorite buttons
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.scope, btn.dataset.name);
            });
        });
    }
    
    /**
     * Render a single variable item
     */
    renderVariableItem(variable) {
        const typeInfo = this.getTypeInfo(variable.type);
        const scopeInfo = this.getScopeInfo(variable.scope);
        const isFavorite = this.isFavorite(variable.scope, variable.name);
        const usages = window.variableManager?.getUsages(variable.scope, variable.name) || [];
        
        return `
            <div class="variable-item" data-scope="${variable.scope}" data-name="${variable.name}">
                <div class="variable-item-icon" style="background: ${typeInfo.color}20; color: ${typeInfo.color}">
                    <i class="fas ${typeInfo.icon}"></i>
                </div>
                <div class="variable-item-info">
                    <div class="variable-item-name">${variable.name}</div>
                    <div class="variable-item-meta">
                        <span class="scope-badge" style="background: ${scopeInfo.color}20; color: ${scopeInfo.color}">
                            ${variable.scope}
                        </span>
                        <span class="type-badge">${variable.type}</span>
                        ${variable.value ? `<span class="value-preview">${this.truncate(variable.value, 20)}</span>` : ''}
                    </div>
                </div>
                <div class="variable-item-actions">
                    ${usages.length > 0 ? `<span class="usage-count" title="${usages.length} usages">${usages.length}</span>` : ''}
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            data-scope="${variable.scope}" data-name="${variable.name}"
                            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas ${isFavorite ? 'fa-star' : 'fa-star'}"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Select a variable
     */
    selectVariable(scope, name) {
        // Remove previous selection
        document.querySelectorAll('.variable-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection to new item
        const item = document.querySelector(`.variable-item[data-scope="${scope}"][data-name="${name}"]`);
        if (item) {
            item.classList.add('selected');
        }
        
        this.selectedVariable = window.variableManager?.get(scope, name);
        this.updatePreview(this.selectedVariable);
        this.updateInsertButtons();
        
        // Update selected info
        const placeholder = `<${scope.toLowerCase()}.var.${name}>`;
        document.querySelector('#selected-variable-info .selected-placeholder').textContent = placeholder;
        
        // Add to recently used
        this.addToRecentlyUsed(scope, name);
    }
    
    /**
     * Update the preview panel
     */
    updatePreview(variable) {
        const panel = document.getElementById('variable-preview');
        
        if (!variable) {
            panel.innerHTML = `
                <div class="preview-empty">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Select a variable to see details</p>
                </div>
            `;
            return;
        }
        
        const typeInfo = this.getTypeInfo(variable.type);
        const scopeInfo = this.getScopeInfo(variable.scope);
        const usages = window.variableManager?.getUsages(variable.scope, variable.name) || [];
        const placeholder = `<${variable.scope.toLowerCase()}.var.${variable.name}>`;
        
        panel.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <div class="preview-icon" style="background: ${typeInfo.color}20; color: ${typeInfo.color}">
                        <i class="fas ${typeInfo.icon}"></i>
                    </div>
                    <div class="preview-title">
                        <h3>${variable.name}</h3>
                        <div class="preview-badges">
                            <span class="scope-badge" style="background: ${scopeInfo.color}20; color: ${scopeInfo.color}">
                                <i class="fas ${scopeInfo.icon}"></i> ${variable.scope}
                            </span>
                            <span class="type-badge" style="background: ${typeInfo.color}20; color: ${typeInfo.color}">
                                ${variable.type}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="preview-section">
                    <label>Placeholder</label>
                    <div class="preview-code">
                        <code>${placeholder}</code>
                        <button class="copy-btn" data-copy="${placeholder}" title="Copy to clipboard">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                ${variable.value ? `
                <div class="preview-section">
                    <label>Value</label>
                    <div class="preview-value">${variable.value}</div>
                </div>
                ` : ''}
                
                ${variable.save || variable.duration ? `
                <div class="preview-section">
                    <label>Options</label>
                    <div class="preview-options">
                        ${variable.save ? '<span class="option-badge"><i class="fas fa-save"></i> Persistent</span>' : ''}
                        ${variable.duration ? `<span class="option-badge"><i class="fas fa-clock"></i> ${variable.duration} ticks</span>` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${usages.length > 0 ? `
                <div class="preview-section">
                    <label>Usages (${usages.length})</label>
                    <div class="preview-usages">
                        ${usages.slice(0, 5).map(u => `
                            <div class="usage-item">
                                <i class="fas ${u.type === 'skill' ? 'fa-magic' : 'fa-skull'}"></i>
                                <span>${u.name}</span>
                                <span class="usage-type">${u.usageType || 'reference'}</span>
                            </div>
                        `).join('')}
                        ${usages.length > 5 ? `<div class="usage-more">... and ${usages.length - 5} more</div>` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${this.renderMetaKeywordsSection(variable)}
                
                <div class="preview-section">
                    <label>Quick Actions</label>
                    <div class="preview-actions">
                        <button class="btn btn-sm" data-action="copy-placeholder">
                            <i class="fas fa-code"></i> Copy Placeholder
                        </button>
                        <button class="btn btn-sm" data-action="copy-mechanic">
                            <i class="fas fa-cog"></i> Copy setVariable
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Bind copy buttons
        panel.querySelectorAll('.copy-btn, [data-action="copy-placeholder"]').forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(placeholder);
                this.showToast('Copied to clipboard!');
            });
        });
        
        panel.querySelector('[data-action="copy-mechanic"]')?.addEventListener('click', () => {
            const mechanic = window.variableManager?.generateSetVariable(variable) || '';
            navigator.clipboard.writeText(mechanic);
            this.showToast('Copied setVariable to clipboard!');
        });
        
        // Bind meta keyword chips
        this.attachMetaKeywordListeners();
    }
    
    /**
     * Update insert button states
     */
    updateInsertButtons() {
        const hasSelection = !!this.selectedVariable;
        document.getElementById('variable-browser-insert-placeholder').disabled = !hasSelection;
        document.getElementById('variable-browser-insert-mechanic').disabled = !hasSelection;
    }
    
    /**
     * Insert the selected variable
     */
    insertSelected(type) {
        if (!this.selectedVariable) return;
        
        let text = '';
        if (type === 'placeholder') {
            text = `<${this.selectedVariable.scope.toLowerCase()}.var.${this.selectedVariable.name}>`;
        } else if (type === 'mechanic') {
            text = window.variableManager?.generateSetVariable(this.selectedVariable) || '';
        }
        
        if (this.onSelectCallback) {
            this.onSelectCallback(text, this.selectedVariable, type);
        } else {
            // Copy to clipboard as fallback
            navigator.clipboard.writeText(text);
            this.showToast(`Copied to clipboard: ${text}`);
        }
        
        this.close();
    }
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    
    groupByScope(variables) {
        const grouped = {};
        const scopeOrder = ['CASTER', 'TARGET', 'SKILL', 'WORLD', 'GLOBAL'];
        
        for (const scope of scopeOrder) {
            const vars = variables.filter(v => v.scope === scope);
            if (vars.length > 0) {
                grouped[scope] = vars.sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        
        return grouped;
    }
    
    getScopeInfo(scope) {
        const scopes = {
            SKILL: { name: 'Skill', icon: 'fa-bolt', color: '#f59e0b' },
            CASTER: { name: 'Caster', icon: 'fa-skull', color: '#ef4444' },
            TARGET: { name: 'Target', icon: 'fa-crosshairs', color: '#10b981' },
            WORLD: { name: 'World', icon: 'fa-globe', color: '#3b82f6' },
            GLOBAL: { name: 'Global', icon: 'fa-server', color: '#9333ea' }
        };
        return scopes[scope] || { name: scope, icon: 'fa-question', color: '#6b7280' };
    }
    
    getTypeInfo(type) {
        const types = {
            INTEGER: { icon: 'fa-hashtag', color: '#3b82f6' },
            FLOAT: { icon: 'fa-percentage', color: '#8b5cf6' },
            LONG: { icon: 'fa-clock', color: '#06b6d4' },
            DOUBLE: { icon: 'fa-calculator', color: '#14b8a6' },
            STRING: { icon: 'fa-font', color: '#f59e0b' },
            BOOLEAN: { icon: 'fa-toggle-on', color: '#10b981' },
            SET: { icon: 'fa-tags', color: '#ec4899' },
            LIST: { icon: 'fa-list', color: '#f97316' },
            MAP: { icon: 'fa-database', color: '#a855f7' },
            LOCATION: { icon: 'fa-map-marker-alt', color: '#ef4444' },
            VECTOR: { icon: 'fa-arrows-alt', color: '#6366f1' },
            TIME: { icon: 'fa-hourglass-half', color: '#84cc16' },
            METASKILL: { icon: 'fa-bolt', color: '#9333ea' },
            ITEM: { icon: 'fa-cube', color: '#78716c' }
        };
        return types[type] || { icon: 'fa-question', color: '#6b7280' };
    }
    
    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }
    
    showToast(message) {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            console.log('[VariableBrowser]', message);
        }
    }
    
    // =========================================================================
    // FAVORITES & RECENTLY USED
    // =========================================================================
    
    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('variable-browser-favorites') || '[]');
        } catch {
            return [];
        }
    }
    
    saveFavorites() {
        localStorage.setItem('variable-browser-favorites', JSON.stringify(this.favorites));
    }
    
    isFavorite(scope, name) {
        return this.favorites.some(f => f.scope === scope && f.name === name);
    }
    
    toggleFavorite(scope, name) {
        const idx = this.favorites.findIndex(f => f.scope === scope && f.name === name);
        if (idx >= 0) {
            this.favorites.splice(idx, 1);
        } else {
            this.favorites.push({ scope, name });
        }
        this.saveFavorites();
        this.renderVariables();
    }
    
    loadRecentlyUsed() {
        try {
            return JSON.parse(localStorage.getItem('variable-browser-recent') || '[]');
        } catch {
            return [];
        }
    }
    
    saveRecentlyUsed() {
        localStorage.setItem('variable-browser-recent', JSON.stringify(this.recentlyUsed.slice(0, 10)));
    }
    
    addToRecentlyUsed(scope, name) {
        // Remove if exists
        this.recentlyUsed = this.recentlyUsed.filter(r => !(r.scope === scope && r.name === name));
        // Add to front
        this.recentlyUsed.unshift({ scope, name });
        // Keep max 10
        this.recentlyUsed = this.recentlyUsed.slice(0, 10);
        this.saveRecentlyUsed();
    }
    
    /**
     * Render Meta Keywords section for a variable type
     */
    renderMetaKeywordsSection(variable) {
        // Get meta keywords from PLACEHOLDERS_DATA
        const metaKeywords = window.PLACEHOLDERS_DATA?.metaKeywords;
        if (!metaKeywords) return '';
        
        // Get type-specific keywords
        const typeKey = variable.type.toLowerCase();
        const typeKeywords = metaKeywords[typeKey] || [];
        const universalKeywords = metaKeywords.universal || [];
        
        if (typeKeywords.length === 0 && universalKeywords.length === 0) return '';
        
        const placeholder = `${variable.scope.toLowerCase()}.var.${variable.name}`;
        
        return `
            <div class="preview-section meta-keywords-section">
                <label>
                    <i class="fas fa-magic"></i> Meta Keywords
                    <span class="keyword-count">${typeKeywords.length + universalKeywords.length}</span>
                </label>
                <div class="meta-keywords-container">
                    ${typeKeywords.length > 0 ? `
                        <div class="keyword-group">
                            <div class="keyword-group-title">${variable.type} Operations</div>
                            <div class="keywords-list">
                                ${typeKeywords.slice(0, 8).map(kw => `
                                    <button class="keyword-chip" 
                                        data-keyword="${kw.keyword}" 
                                        data-placeholder="<${placeholder}${kw.keyword.replace('{n}', '1').replace('{text}', 'value')}>"
                                        title="${kw.description}${kw.example ? '\nExample: ' + kw.example : ''}">
                                        <span class="keyword-text">${kw.keyword}</span>
                                    </button>
                                `).join('')}
                                ${typeKeywords.length > 8 ? `<span class="more-keywords">+${typeKeywords.length - 8} more</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${universalKeywords.length > 0 ? `
                        <div class="keyword-group">
                            <div class="keyword-group-title">Conversions</div>
                            <div class="keywords-list">
                                ${universalKeywords.slice(0, 6).map(kw => `
                                    <button class="keyword-chip conversion" 
                                        data-keyword="${kw.keyword}" 
                                        data-placeholder="<${placeholder}${kw.keyword}>"
                                        data-output="${kw.output}"
                                        title="${kw.description} → ${kw.output}">
                                        <span class="keyword-text">${kw.keyword}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="keyword-preview" id="meta-keyword-preview">
                        <small>Click a keyword to copy placeholder with it</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Attach meta keyword event listeners
     */
    attachMetaKeywordListeners() {
        const panel = document.getElementById('variable-preview');
        if (!panel) return;
        
        panel.querySelectorAll('.keyword-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const fullPlaceholder = chip.dataset.placeholder;
                navigator.clipboard.writeText(fullPlaceholder);
                this.showToast(`Copied: ${fullPlaceholder}`);
                
                // Update preview
                const previewEl = document.getElementById('meta-keyword-preview');
                if (previewEl) {
                    previewEl.innerHTML = `<code class="copied">${fullPlaceholder}</code>`;
                    setTimeout(() => {
                        previewEl.innerHTML = `<small>Click a keyword to copy placeholder with it</small>`;
                    }, 2000);
                }
            });
            
            chip.addEventListener('mouseenter', () => {
                const previewEl = document.getElementById('meta-keyword-preview');
                if (previewEl) {
                    previewEl.innerHTML = `<code>${chip.dataset.placeholder}</code>`;
                }
            });
            
            chip.addEventListener('mouseleave', () => {
                const previewEl = document.getElementById('meta-keyword-preview');
                if (previewEl) {
                    previewEl.innerHTML = `<small>Click a keyword to copy placeholder with it</small>`;
                }
            });
        });
    }
}

// Create singleton instance
const variableBrowser = new VariableBrowser();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.variableBrowser = variableBrowser;
}
