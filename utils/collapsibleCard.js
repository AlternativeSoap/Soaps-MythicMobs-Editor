/**
 * Collapsible Card Utility
 * Manages expand/collapse state with localStorage persistence
 */
class CollapsibleCardManager {
    constructor() {
        this.storageKey = 'mythicmobs_collapsed_cards';
        this.collapsedCards = this.loadState();
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }
    
    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.collapsedCards));
        } catch (e) {
            console.warn('Failed to save collapsed card state:', e);
        }
    }
    
    isCollapsed(cardId) {
        return this.collapsedCards[cardId] === true;
    }
    
    toggle(cardId) {
        this.collapsedCards[cardId] = !this.collapsedCards[cardId];
        this.saveState();
        return this.collapsedCards[cardId];
    }
    
    setCollapsed(cardId, collapsed) {
        this.collapsedCards[cardId] = collapsed;
        this.saveState();
    }
    
    expandAll() {
        this.collapsedCards = {};
        this.saveState();
    }
    
    collapseAll(cardIds) {
        cardIds.forEach(id => {
            this.collapsedCards[id] = true;
        });
        this.saveState();
    }
    
    /**
     * Initialize card collapse/expand functionality after DOM render
     */
    initializeCards() {
        document.querySelectorAll('.collapsible-card-header').forEach(header => {
            const card = header.closest('.collapsible-card');
            const cardId = card?.dataset.cardId;
            
            if (!cardId) return;
            
            // Apply saved state
            if (this.isCollapsed(cardId)) {
                card.classList.add('collapsed');
            }
            
            // Add click handler
            header.addEventListener('click', (e) => {
                // Don't collapse if clicking on input elements inside header
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                    return;
                }
                
                const isCollapsed = this.toggle(cardId);
                card.classList.toggle('collapsed', isCollapsed);
            });
        });
    }
    
    /**
     * Generate HTML for a collapsible card
     */
    generateCard(options) {
        const {
            id,
            title,
            icon = 'fas fa-cog',
            defaultCollapsed = false,
            dataMobField = null,
            badge = null,
            content = '',
            className = ''
        } = options;
        
        const isCollapsed = this.isCollapsed(id) || defaultCollapsed;
        const collapsedClass = isCollapsed ? 'collapsed' : '';
        const dataAttr = dataMobField ? `data-mob-field="${dataMobField}"` : '';
        
        return `
            <div class="collapsible-card card ${collapsedClass} ${className}" data-card-id="${id}" ${dataAttr}>
                <div class="collapsible-card-header card-header">
                    <div class="card-header-left">
                        <i class="${icon}"></i>
                        <h3 class="card-title">${title}</h3>
                        ${badge ? `<span class="card-badge">${badge}</span>` : ''}
                    </div>
                    <i class="collapse-icon fas fa-chevron-down"></i>
                </div>
                <div class="collapsible-card-body card-body">
                    ${content}
                </div>
            </div>
        `;
    }
}

window.CollapsibleCardManager = CollapsibleCardManager;
