/**
 * CollapsibleManager - Shared utility for managing collapsible card states
 * Handles initialization, state saving, and restoration for all editors
 */
class CollapsibleManager {
    constructor() {
        this.states = {};
    }

    /**
     * Initialize collapsible functionality for all cards in the container
     * Purely CSS-driven - no inline styles
     */
    initializeCollapsible() {
        // Attach click handlers to all collapsible headers
        document.querySelectorAll('.collapsible-header').forEach(header => {
            // Remove any existing listeners by cloning
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', () => {
                const card = newHeader.closest('.collapsible-card');
                
                if (card.classList.contains('collapsed')) {
                    card.classList.remove('collapsed');
                } else {
                    card.classList.add('collapsed');
                }
            });
        });
    }

    /**
     * Save current state of all collapsible cards
     */
    saveStates() {
        const states = {};
        document.querySelectorAll('.collapsible-card').forEach((card, index) => {
            const title = card.querySelector('.card-title')?.textContent?.trim() || `section-${index}`;
            states[title] = !card.classList.contains('collapsed');
        });
        this.states = states;
        return states;
    }

    /**
     * Restore previously saved states
     */
    restoreStates() {
        if (!this.states || Object.keys(this.states).length === 0) return;
        
        document.querySelectorAll('.collapsible-card').forEach((card, index) => {
            const title = card.querySelector('.card-title')?.textContent?.trim() || `section-${index}`;
            const shouldBeExpanded = this.states[title];
            
            if (shouldBeExpanded !== undefined) {
                if (shouldBeExpanded) {
                    card.classList.remove('collapsed');
                } else {
                    card.classList.add('collapsed');
                }
            }
        });
    }

    /**
     * Clear saved states
     */
    clearStates() {
        this.states = {};
    }
}

// Create global instance
window.collapsibleManager = new CollapsibleManager();
