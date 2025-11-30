/**
 * Creation Mode Selector Component
 * Entry point for 3-mode skill line creation system
 */

class CreationModeSelector {
    constructor() {
        this.context = 'mob';
        this.onSelectCallback = null;
        this.createModal();
        this.attachEventListeners();
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
                            <!-- Option 1: Quick Templates -->
                            <div class="creation-mode-card" data-mode="templates">
                                <div class="mode-icon">🎁</div>
                                <h3 class="mode-title">Quick Templates</h3>
                                <p class="mode-description">Browse and select from pre-made skill line templates</p>
                                <div class="mode-features">
                                    <span class="mode-tag">Fast</span>
                                    <span class="mode-tag">Easy</span>
                                    <span class="mode-tag">Beginner-Friendly</span>
                                    <span class="mode-tag">Favorites</span>
                                </div>
                                <button class="btn btn-primary mode-select-btn" data-mode="templates">
                                    Browse Templates →
                                </button>
                            </div>
                            
                            <!-- Option 2: Skill Line Builder -->
                            <div class="creation-mode-card" data-mode="builder">
                                <div class="mode-icon">🛠️</div>
                                <h3 class="mode-title">Skill Line Builder</h3>
                                <p class="mode-description">Visual builder with Quick Build, Templates & Bulk Import</p>
                                <div class="mode-features">
                                    <span class="mode-tag">Visual</span>
                                    <span class="mode-tag">Component Browser</span>
                                    <span class="mode-tag">Queue System</span>
                                    <span class="mode-tag">Advanced</span>
                                </div>
                                <button class="btn btn-primary mode-select-btn" data-mode="builder">
                                    Open Builder →
                                </button>
                            </div>
                            
                            <!-- Option 3: Manual Entry -->
                            <div class="creation-mode-card" data-mode="manual">
                                <div class="mode-icon">📝</div>
                                <h3 class="mode-title">Manual Entry</h3>
                                <p class="mode-description">Direct YAML/text input with syntax highlighting and validation</p>
                                <div class="mode-features">
                                    <span class="mode-tag">Quick</span>
                                    <span class="mode-tag">Expert</span>
                                    <span class="mode-tag">Copy/Paste</span>
                                    <span class="mode-tag">Power User</span>
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
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        document.getElementById('creationModeClose').addEventListener('click', () => {
            this.close();
        });

        // Cancel button
        document.getElementById('creationModeCancel').addEventListener('click', () => {
            this.close();
        });

        // Click outside to close
        document.getElementById('creationModeSelectorOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'creationModeSelectorOverlay') {
                this.close();
            }
        });

        // Mode selection buttons
        document.querySelectorAll('.mode-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.selectMode(mode);
            });
        });

        // Card click (anywhere on card)
        document.querySelectorAll('.creation-mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking the button directly
                if (!e.target.classList.contains('mode-select-btn')) {
                    const mode = card.dataset.mode;
                    this.selectMode(mode);
                }
            });
        });
    }

    /**
     * Open the creation mode selector
     */
    open(options = {}) {
        console.log('📋 Opening Creation Mode Selector');
        this.context = options.context || 'mob';
        this.onSelectCallback = options.onSelect || null;
        
        // Update subtitle based on context
        const subtitle = document.querySelector('.creation-mode-subtitle');
        if (this.context === 'mob') {
            subtitle.textContent = 'Choose how to create your skill line (Mob Context - Triggers Required):';
        } else {
            subtitle.textContent = 'Choose how to create your skill line (Skill Context - No Triggers):';
        }

        document.getElementById('creationModeSelectorOverlay').classList.add('active');
    }

    /**
     * Close the creation mode selector
     */
    close() {
        document.getElementById('creationModeSelectorOverlay').classList.remove('active');
        this.onSelectCallback = null;
    }

    /**
     * Handle mode selection
     */
    selectMode(mode) {
        console.log('✅ Mode selected:', mode);
        
        if (this.onSelectCallback) {
            this.onSelectCallback(mode);
        }
        
        this.close();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreationModeSelector;
}

console.log('✅ CreationModeSelector component loaded');
