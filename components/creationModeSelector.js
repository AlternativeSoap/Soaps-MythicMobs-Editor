/**
 * Creation Mode Selector Component
 * Entry point for 3-mode skill line creation system
 * 
 * Uses singleton pattern - multiple instances share the same modal
 * The ACTIVE callback is stored globally to handle multiple instances
 */

// Global storage for the active callback (shared across all instances)
window._creationModeSelectorActiveCallback = null;

class CreationModeSelector {
    constructor() {
        this.context = 'mob';
        this.modal = null;
        this.ensureModal();
        this.attachEventListeners();
    }

    /**
     * Ensure the modal exists in DOM (create if missing, reuse if exists)
     */
    ensureModal() {
        // Check if modal already exists
        this.modal = document.getElementById('creationModeSelectorOverlay');
        if (this.modal) {
            console.log('✅ CreationModeSelector: Reusing existing modal');
            return;
        }
        
        // Create new modal
        console.log('🆕 CreationModeSelector: Creating modal');
        this.createModal();
        this.modal = document.getElementById('creationModeSelectorOverlay');
    }

    /**
     * Create the creation mode selector modal HTML
     */
    createModal() {
        const modalHTML = `
            <div id="creationModeSelectorOverlay" class="creation-mode-selector-overlay">
                <div class="creation-mode-selector-modal">
                    <div class="creation-mode-header">
                        <h2>➕ Add Skill Line</h2>
                        <button class="creation-mode-close" id="creationModeClose">&times;</button>
                    </div>
                    
                    <div class="creation-mode-body">
                        <p class="creation-mode-subtitle">Choose how to create your skill line:</p>
                        
                        <div class="creation-mode-options">
                            <!-- Option 1: Skill Line Builder -->
                            <div class="creation-mode-card" data-mode="builder">
                                <div class="mode-icon">🛠️</div>
                                <h3 class="mode-title">Skill Line Builder</h3>
                                <p class="mode-description">Visual builder with mechanics, conditions, targeters & more</p>
                                <div class="mode-features">
                                    <span class="mode-tag">Visual</span>
                                    <span class="mode-tag">Component Browser</span>
                                    <span class="mode-tag">Recommended</span>
                                </div>
                                <button class="btn btn-primary mode-select-btn" data-mode="builder">
                                    Open Builder →
                                </button>
                            </div>
                            
                            <!-- Option 2: Manual Entry -->
                            <div class="creation-mode-card" data-mode="manual">
                                <div class="mode-icon">📝</div>
                                <h3 class="mode-title">Manual Entry</h3>
                                <p class="mode-description">Direct YAML/text input with syntax highlighting</p>
                                <div class="mode-features">
                                    <span class="mode-tag">Quick</span>
                                    <span class="mode-tag">Expert</span>
                                    <span class="mode-tag">Copy/Paste</span>
                                </div>
                                <button class="btn btn-primary mode-select-btn" data-mode="manual">
                                    Manual Editor →
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="creation-mode-footer">
                        <button class="btn btn-secondary" id="creationModeCancel">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        document.body.appendChild(temp.firstElementChild);
    }

    /**
     * Attach event listeners (only if not already attached)
     * Uses event delegation so ANY CreationModeSelector instance can handle the callback
     */
    attachEventListeners() {
        const modal = this.modal || document.getElementById('creationModeSelectorOverlay');
        if (!modal) {
            console.error('❌ CreationModeSelector: Cannot attach listeners - modal not found');
            return;
        }
        
        // Check if already attached
        if (modal.dataset.listenersAttached) {
            console.log('✅ CreationModeSelector: Listeners already attached');
            return;
        }
        modal.dataset.listenersAttached = 'true';
        
        // Close button
        const closeBtn = document.getElementById('creationModeClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Cancel button
        const cancelBtn = document.getElementById('creationModeCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'creationModeSelectorOverlay') {
                this.close();
            }
        });

        // Mode selection - use GLOBAL callback to handle any instance
        document.querySelectorAll('.mode-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = e.target.dataset.mode;
                console.log('🎯 Mode button clicked:', mode);
                this.selectModeGlobal(mode);
            });
        });

        // Card click (anywhere on card)
        document.querySelectorAll('.creation-mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking the button directly
                if (!e.target.classList.contains('mode-select-btn')) {
                    const mode = card.dataset.mode;
                    console.log('🎯 Card clicked:', mode);
                    this.selectModeGlobal(mode);
                }
            });
        });
        
        console.log('✅ CreationModeSelector: Listeners attached');
    }

    /**
     * Select mode using the GLOBAL callback (handles multiple instances)
     */
    selectModeGlobal(mode) {
        console.log('📤 selectModeGlobal called with mode:', mode);
        
        const callback = window._creationModeSelectorActiveCallback;
        if (callback) {
            console.log('✅ Executing global callback');
            callback(mode);
        } else {
            console.warn('⚠️ No active callback registered for mode selection');
        }
        
        // Close and cleanup
        this.close();
    }

    /**
     * Open the creation mode selector
     */
    open(options = {}) {
        // Ensure modal exists
        this.ensureModal();
        
        this.context = options.context || 'mob';
        
        // Store callback GLOBALLY so any instance can access it
        window._creationModeSelectorActiveCallback = options.onSelect || null;
        console.log('📂 CreationModeSelector: Callback registered:', !!options.onSelect);
        
        // Get modal reference
        const modal = this.modal || document.getElementById('creationModeSelectorOverlay');
        if (!modal) {
            console.error('❌ CreationModeSelector modal not found in DOM');
            return;
        }
        
        const subtitle = modal.querySelector('.creation-mode-subtitle');
        if (subtitle) {
            if (this.context === 'mob') {
                subtitle.textContent = 'Choose how to create your skill line (Mob Context - Triggers Required):';
            } else {
                subtitle.textContent = 'Choose how to create your skill line (Skill Context - No Triggers):';
            }
        }

        modal.classList.add('active');
        console.log('📂 CreationModeSelector opened');
    }

    /**
     * Close the creation mode selector
     */
    close() {
        const modal = this.modal || document.getElementById('creationModeSelectorOverlay');
        if (modal) {
            modal.classList.remove('active');
        }
        // Clear global callback on close
        window._creationModeSelectorActiveCallback = null;
        console.log('📕 CreationModeSelector closed');
    }

    /**
     * Destroy the modal and clean up resources
     */
    destroy() {
        const overlay = document.getElementById('creationModeSelectorOverlay');
        if (overlay) {
            overlay.remove();
        }
        window._creationModeSelectorActiveCallback = null;
    }

    /**
     * Handle mode selection (deprecated - use selectModeGlobal)
     */
    selectMode(mode) {
        this.selectModeGlobal(mode);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreationModeSelector;
}

// Loaded silently
