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
        // DON'T clone - it breaks event handler timing!
        document.querySelectorAll('.collapsible-header').forEach(header => {
            // Remove old listeners if exist
            if (header._collapsibleListener) {
                header.removeEventListener('click', header._collapsibleListener);
            }
            if (header._collapsibleTouchListener) {
                header.removeEventListener('touchstart', header._collapsibleTouchListener);
            }
            
            // Create shared toggle function
            const toggleCollapsible = (e) => {
                const target = e.target;
                
                // Check if ANY element in the click path has data-interactive attribute
                const path = e.composedPath ? e.composedPath() : [target];
                const hasInteractive = path.some(el => {
                    return el.dataset?.interactive === 'true' ||
                           el.tagName === 'BUTTON' ||
                           el.tagName === 'INPUT' ||
                           el.tagName === 'SELECT' ||
                           el.tagName === 'TEXTAREA' ||
                           el.tagName === 'A' ||
                           (el.classList && (
                               el.classList.contains('btn') ||
                               el.classList.contains('btn-icon') ||
                               el.classList.contains('add-item-btn') ||
                               el.classList.contains('remove-potion-effect')
                           ));
                });
                
                if (hasInteractive) {
                    return; // Don't collapse if interactive element clicked
                }
                
                // Also ignore if not clicking on header or card-title
                if (target.closest('button, input, select, textarea, a')) {
                    return;
                }
                
                // Only toggle if clicking on header itself or card-title
                if (target !== header && !target.classList.contains('card-title') && !target.closest('.card-title')) {
                    return;
                }
                
                const card = header.closest('.collapsible-card');
                if (card.classList.contains('collapsed')) {
                    card.classList.remove('collapsed');
                } else {
                    card.classList.add('collapsed');
                }
            };
            
            // Track touch for mobile
            let touchHandled = false;
            
            // Touch handler for mobile
            header._collapsibleTouchListener = (e) => {
                touchHandled = true;
                toggleCollapsible(e);
                setTimeout(() => { touchHandled = false; }, 500);
            };
            
            // Click handler (skips if touch was handled)
            header._collapsibleListener = (e) => {
                if (touchHandled) return;
                toggleCollapsible(e);
            };
            
            header.addEventListener('touchstart', header._collapsibleTouchListener, { passive: true });
            header.addEventListener('click', header._collapsibleListener);
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
