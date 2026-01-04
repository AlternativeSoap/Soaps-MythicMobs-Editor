/**
 * KeyboardShortcutManager - Manage keyboard shortcuts for the editor
 * 
 * Features:
 * - Register and unregister shortcuts
 * - Handle key combinations (Ctrl, Alt, Shift)
 * - Prevent conflicts with browser shortcuts
 * - Show shortcut hints in UI
 */

class KeyboardShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.activeModifiers = new Set();
        
        // Bind event listener
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Register default shortcuts
        this.registerDefaultShortcuts();
        
        // Start listening
        this.startListening();
    }
    
    /**
     * Register default shortcuts
     * NOTE: Avoid overriding common browser shortcuts (Ctrl+F, Ctrl+V, Ctrl+A, Ctrl+D, Ctrl+G, etc.)
     */
    registerDefaultShortcuts() {
        // File operations
        this.register('Ctrl+S', 'Save changes', () => {
            this.triggerEvent('save');
        });
        
        // Format operations
        this.register('Ctrl+Shift+F', 'Format selected line', () => {
            this.triggerEvent('format-selected');
        });
        
        // Panel toggles - Use Alt combinations to avoid browser conflicts
        this.register('Alt+D', 'Toggle duplicates panel', () => {
            this.triggerEvent('toggle-duplicates');
        });
        
        this.register('Alt+V', 'Toggle validation panel', () => {
            this.triggerEvent('toggle-validation');
        });
        
        this.register('Alt+G', 'Toggle grouped view', () => {
            this.triggerEvent('toggle-groups');
        });
        
        this.register('Alt+A', 'Toggle analysis panel', () => {
            this.triggerEvent('toggle-analysis');
        });
        
        this.register('Ctrl+Shift+D', 'Toggle dependencies panel', () => {
            this.triggerEvent('toggle-dependencies');
        });
        
        // Line operations
        this.register('Ctrl+N', 'Add new line', () => {
            this.triggerEvent('add-line');
        });
        
        this.register('Ctrl+Shift+C', 'Copy selected line', () => {
            this.triggerEvent('copy-line');
        });
        
        this.register('Ctrl+Shift+X', 'Delete selected line', () => {
            this.triggerEvent('delete-line');
        });
        
        // Undo/Redo
        this.register('Ctrl+Z', 'Undo', () => {
            this.triggerEvent('undo');
        });
        
        this.register('Ctrl+Y', 'Redo', () => {
            this.triggerEvent('redo');
        });
        
        this.register('Ctrl+Shift+Z', 'Redo (alternative)', () => {
            this.triggerEvent('redo');
        });
        
        // Search/Find - Use Alt+Shift+F to not conflict with browser
        this.register('Alt+Shift+F', 'Find in lines', () => {
            this.triggerEvent('find');
        });
        
        // Help
        this.register('F1', 'Show help', () => {
            this.triggerEvent('help');
        });
        
        // Escape
        this.register('Escape', 'Close panels/modals', () => {
            this.triggerEvent('escape');
        });
    }
    
    /**
     * Register a keyboard shortcut
     * @param {string} combination - Key combination (e.g., 'Ctrl+S')
     * @param {string} description - Description of the action
     * @param {Function} handler - Function to call
     */
    register(combination, description, handler) {
        const normalized = this.normalizeKeyCombination(combination);
        
        this.shortcuts.set(normalized, {
            combination: combination,
            description: description,
            handler: handler
        });
    }
    
    /**
     * Unregister a shortcut
     * @param {string} combination - Key combination to remove
     */
    unregister(combination) {
        const normalized = this.normalizeKeyCombination(combination);
        this.shortcuts.delete(normalized);
    }
    
    /**
     * Normalize key combination for consistent matching
     * @param {string} combination - Key combination
     * @returns {string} Normalized combination
     */
    normalizeKeyCombination(combination) {
        return combination
            .toLowerCase()
            .split('+')
            .map(k => k.trim())
            .sort()
            .join('+');
    }
    
    /**
     * Handle keydown event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (!this.enabled) return;
        
        // Skip if user is typing in input field
        if (this.isInputField(e.target)) {
            return;
        }
        
        // Build current key combination
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        
        // Add key name
        const keyName = this.getKeyName(e);
        if (keyName) {
            parts.push(keyName);
        }
        
        // Normalize and check for match
        const combination = parts.sort().join('+');
        
        if (this.shortcuts.has(combination)) {
            e.preventDefault();
            e.stopPropagation();
            
            const shortcut = this.shortcuts.get(combination);
            shortcut.handler(e);
            
            // Show visual feedback
            this.showShortcutFeedback(shortcut.combination);
        }
    }
    
    /**
     * Handle keyup event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        // Track modifier keys
        if (e.key === 'Control' || e.key === 'Meta') {
            this.activeModifiers.delete('ctrl');
        }
        if (e.key === 'Alt') {
            this.activeModifiers.delete('alt');
        }
        if (e.key === 'Shift') {
            this.activeModifiers.delete('shift');
        }
    }
    
    /**
     * Get normalized key name from event
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {string} Key name
     */
    getKeyName(e) {
        // Special keys
        const specialKeys = {
            'Escape': 'escape',
            'Enter': 'enter',
            'Tab': 'tab',
            'Backspace': 'backspace',
            'Delete': 'delete',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'Home': 'home',
            'End': 'end',
            'PageUp': 'pageup',
            'PageDown': 'pagedown',
            ' ': 'space'
        };
        
        if (specialKeys[e.key]) {
            return specialKeys[e.key];
        }
        
        // F keys
        if (e.key.startsWith('F') && e.key.length <= 3) {
            return e.key.toLowerCase();
        }
        
        // Regular keys
        if (e.key.length === 1) {
            return e.key.toLowerCase();
        }
        
        return null;
    }
    
    /**
     * Check if element is an input field
     * @param {Element} element - DOM element
     * @returns {boolean} True if input field
     */
    isInputField(element) {
        const tagName = element.tagName.toLowerCase();
        return (
            tagName === 'input' ||
            tagName === 'textarea' ||
            tagName === 'select' ||
            element.isContentEditable
        );
    }
    
    /**
     * Show visual feedback for shortcut
     * @param {string} combination - Key combination
     */
    showShortcutFeedback(combination) {
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.innerHTML = `
            <i class="fas fa-keyboard"></i>
            <span>${combination}</span>
        `;
        
        document.body.appendChild(feedback);
        
        // Auto-remove after animation
        setTimeout(() => {
            feedback.classList.add('fade-out');
            setTimeout(() => feedback.remove(), 300);
        }, 1000);
    }
    
    /**
     * Trigger custom event for shortcut action
     * @param {string} action - Action name
     */
    triggerEvent(action) {
        const event = new CustomEvent('keyboard-shortcut', {
            detail: { action: action }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Start listening for keyboard events
     */
    startListening() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    /**
     * Stop listening for keyboard events
     */
    stopListening() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
    
    /**
     * Enable shortcuts
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Disable shortcuts
     */
    disable() {
        this.enabled = false;
    }
    
    /**
     * Get all registered shortcuts
     * @returns {Array} Array of shortcut objects
     */
    getAllShortcuts() {
        const shortcuts = [];
        this.shortcuts.forEach((value, key) => {
            shortcuts.push({
                combination: value.combination,
                description: value.description,
                normalized: key
            });
        });
        return shortcuts.sort((a, b) => a.combination.localeCompare(b.combination));
    }
    
    /**
     * Show shortcuts help panel
     */
    showHelp() {
        const shortcuts = this.getAllShortcuts();
        
        const modal = document.createElement('div');
        modal.className = 'shortcuts-help-modal';
        modal.innerHTML = `
            <div class="shortcuts-help-overlay"></div>
            <div class="shortcuts-help-content">
                <div class="shortcuts-help-header">
                    <h3>
                        <i class="fas fa-keyboard"></i>
                        Keyboard Shortcuts
                    </h3>
                    <button class="btn-icon close-shortcuts-help-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="shortcuts-help-body">
                    ${this.renderShortcutCategories(shortcuts)}
                </div>
                <div class="shortcuts-help-footer">
                    <button class="btn btn-primary close-shortcuts-help-btn">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelectorAll('.close-shortcuts-help-btn, .shortcuts-help-overlay').forEach(el => {
            el.addEventListener('click', () => {
                modal.classList.add('fade-out');
                setTimeout(() => modal.remove(), 300);
            });
        });
    }
    
    /**
     * Render shortcuts grouped by category
     * @param {Array} shortcuts - All shortcuts
     * @returns {string} HTML
     */
    renderShortcutCategories(shortcuts) {
        const categories = {
            'File': ['save'],
            'Format': ['format'],
            'Panels': ['toggle'],
            'Lines': ['add-line', 'copy-line', 'delete-line'],
            'Edit': ['undo', 'redo'],
            'Other': ['help', 'escape', 'find']
        };
        
        let html = '';
        
        for (const [category, keywords] of Object.entries(categories)) {
            const categoryShortcuts = shortcuts.filter(s =>
                keywords.some(k => s.description.toLowerCase().includes(k))
            );
            
            if (categoryShortcuts.length > 0) {
                html += `
                    <div class="shortcut-category">
                        <h4 class="shortcut-category-title">${category}</h4>
                        <div class="shortcut-list">
                            ${categoryShortcuts.map(s => `
                                <div class="shortcut-item">
                                    <span class="shortcut-keys">${this.formatKeyCombination(s.combination)}</span>
                                    <span class="shortcut-description">${s.description}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        return html;
    }
    
    /**
     * Format key combination for display
     * @param {string} combination - Key combination
     * @returns {string} Formatted HTML
     */
    formatKeyCombination(combination) {
        return combination
            .split('+')
            .map(key => `<kbd>${key}</kbd>`)
            .join(' + ');
    }
}

// Create global instance
window.KeyboardShortcutManager = KeyboardShortcutManager;
