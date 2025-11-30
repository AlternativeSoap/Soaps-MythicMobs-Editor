/**
 * Trigger Browser Component
 * Provides a modal interface for browsing and selecting MythicMobs triggers
 */

class TriggerBrowser {
    constructor(editor) {
        this.editor = editor;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.onSelectCallback = null;
        this.currentMobType = null;
        this.currentModules = null;
        
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create the trigger browser modal HTML
     */
    createModal() {
        const modalHTML = `
            <!-- Main Browser Modal -->
            <div id="triggerBrowserOverlay" class="condition-modal" style="display: none;">
                <div class="modal-content condition-browser">
                    <div class="modal-header">
                        <h2>Trigger Browser</h2>
                        <button class="btn-close" id="triggerBrowserClose">&times;</button>
                    </div>
                    
                    <div class="condition-browser-body">
                        <!-- Search Bar -->
                        <div class="search-bar">
                            <input type="text" 
                                   id="triggerSearchInput" 
                                   placeholder="Search triggers..." 
                                   class="search-input">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                        
                        <!-- Category Tabs -->
                        <div class="category-tabs" id="triggerCategories">
                            <button class="category-tab active" data-category="all">All (0)</button>
                            <button class="category-tab" data-category="combat">⚔️ Combat (0)</button>
                            <button class="category-tab" data-category="lifecycle">🌱 Lifecycle (0)</button>
                            <button class="category-tab" data-category="player">👤 Player (0)</button>
                            <button class="category-tab" data-category="timed">⏱️ Timed (0)</button>
                            <button class="category-tab" data-category="projectile">🎯 Projectile (0)</button>
                            <button class="category-tab" data-category="special">✨ Special (0)</button>
                            <button class="category-tab" data-category="communication">📡 Signal (0)</button>
                        </div>
                        
                        <!-- Trigger Grid -->
                        <div class="condition-grid" id="triggerList">
                            <!-- Triggers will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Parameter Input Modal -->
            <div id="triggerParamOverlay" class="trigger-param-overlay">
                <div class="trigger-param-modal">
                    <h3 id="triggerParamTitle">Enter Parameter</h3>
                    <p id="triggerParamDescription"></p>
                    <input type="text" id="triggerParamInput" class="trigger-param-input" placeholder="">
                    <div class="trigger-param-buttons">
                        <button class="trigger-param-btn cancel" id="triggerParamCancel">Cancel</button>
                        <button class="trigger-param-btn confirm" id="triggerParamConfirm">Confirm</button>
                    </div>
                </div>
            </div>

            <!-- Confirmation Modal for Auto-Enable -->
            <div id="triggerConfirmOverlay" class="trigger-confirm-overlay">
                <div class="trigger-confirm-modal">
                    <h3><span class="trigger-confirm-icon">⚠️</span> Module Required</h3>
                    <p id="triggerConfirmMessage"></p>
                    <div class="trigger-confirm-requirement" id="triggerConfirmRequirement"></div>
                    <div class="trigger-confirm-buttons">
                        <button class="trigger-confirm-btn cancel" id="triggerConfirmCancel">Cancel</button>
                        <button class="trigger-confirm-btn confirm" id="triggerConfirmEnable">Enable & Add</button>
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
        document.getElementById('triggerBrowserClose').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('triggerBrowserOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'triggerBrowserOverlay') {
                this.close();
            }
        });

        // Search input
        document.getElementById('triggerSearchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderTriggers();
        });

        // Category tabs
        document.getElementById('triggerCategories').addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderTriggers();
            }
        });

        // Parameter modal buttons
        document.getElementById('triggerParamCancel').addEventListener('click', () => {
            this.closeParamModal();
        });

        document.getElementById('triggerParamConfirm').addEventListener('click', () => {
            this.confirmParameter();
        });

        document.getElementById('triggerParamInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmParameter();
            }
        });

        // Confirmation modal buttons
        document.getElementById('triggerConfirmCancel').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        document.getElementById('triggerConfirmEnable').addEventListener('click', () => {
            this.confirmAutoEnable();
        });

        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const paramOverlay = document.getElementById('triggerParamOverlay');
                const confirmOverlay = document.getElementById('triggerConfirmOverlay');
                const browserOverlay = document.getElementById('triggerBrowserOverlay');
                if (paramOverlay && paramOverlay.classList.contains('active')) {
                    this.closeParamModal();
                } else if (confirmOverlay && confirmOverlay.classList.contains('active')) {
                    this.closeConfirmModal();
                } else if (browserOverlay && browserOverlay.style.display === 'flex') {
                    this.close();
                }
            }
        });
    }

    /**
     * Open the trigger browser
     */
    open(options = {}) {
        this.currentMobType = options.mobType || null;
        this.currentModules = options.modules || null;
        this.onSelectCallback = options.onSelect || null;

        this.currentCategory = 'all';
        this.searchQuery = '';
        document.getElementById('triggerSearchInput').value = '';
        
        // Reset category tabs
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');

        this.renderTriggers();
        this.updateCategoryCounts();
        const overlay = document.getElementById('triggerBrowserOverlay');
        // Apply higher z-index if opened from another modal
        if (options.parentZIndex) {
            overlay.style.zIndex = options.parentZIndex + 100;
        } else {
            overlay.style.zIndex = '';
        }
        overlay.style.display = 'flex';
    }

    /**
     * Close the trigger browser
     */
    close() {
        const overlay = document.getElementById('triggerBrowserOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        this.onSelectCallback = null;
    }

    /**
     * Update category tab counts
     */
    updateCategoryCounts() {
        const triggers = TRIGGERS_DATA.triggers || [];
        const categoryTabs = document.querySelectorAll('#triggerCategories .category-tab');
        
        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;
            let count;
            
            if (category === 'all') {
                count = triggers.length;
            } else {
                count = triggers.filter(t => t.category === category).length;
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
     * Render the trigger list based on current filters
     */
    renderTriggers() {
        const listContainer = document.getElementById('triggerList');
        
        // Get filtered triggers
        let triggers = TRIGGERS_DATA.triggers;

        // Filter by category
        if (this.currentCategory !== 'all') {
            triggers = triggers.filter(t => t.category === this.currentCategory);
        }

        // Filter by search query
        if (this.searchQuery) {
            triggers = TRIGGERS_DATA.searchTriggers(this.searchQuery);
            if (this.currentCategory !== 'all') {
                triggers = triggers.filter(t => t.category === this.currentCategory);
            }
        }

        // Filter by mob type compatibility
        if (this.currentMobType) {
            triggers = triggers.filter(t => 
                t.mobTypeRestrictions.length === 0 || 
                t.mobTypeRestrictions.includes(this.currentMobType.toUpperCase())
            );
        }

        // Render triggers
        if (triggers.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No triggers found matching your search.</div>';
            return;
        }

        listContainer.innerHTML = triggers.map(trigger => {
            const aliasesHTML = trigger.aliases && trigger.aliases.length > 0
                ? `<div class="condition-aliases"><strong>Aliases:</strong> ${trigger.aliases.join(', ')}</div>`
                : '';

            const requirementsHTML = trigger.requirements && trigger.requirements.length > 0
                ? `<div class="condition-example"><strong>Requires:</strong> ${trigger.requirements.join(', ')}</div>`
                : '';

            return `
                <div class="condition-card" data-trigger="${trigger.name}">
                    <div class="condition-card-header">
                        <h4>~${trigger.name}</h4>
                        <span class="condition-category-badge">${trigger.category}</span>
                    </div>
                    <div class="condition-card-body">
                        <p class="condition-card-description">${trigger.description}</p>
                        ${aliasesHTML}
                        ${requirementsHTML}
                    </div>
                    <div class="condition-card-footer">
                        <button class="btn btn-primary btn-select-trigger">Select</button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers to select buttons
        listContainer.querySelectorAll('.btn-select-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.condition-card');
                const triggerName = card.dataset.trigger;
                this.handleTriggerSelection(triggerName);
            });
        });
    }

    /**
     * Handle trigger selection
     */
    handleTriggerSelection(triggerName) {
        const trigger = TRIGGERS_DATA.getTrigger(triggerName);
        if (!trigger) return;

        // Check requirements
        const reqCheck = TRIGGERS_DATA.checkRequirements(trigger, this.currentModules);
        if (!reqCheck.satisfied) {
            this.showAutoEnableConfirmation(trigger, reqCheck.missing);
            return;
        }

        // Check if trigger needs parameters
        if (trigger.parameters) {
            this.showParameterModal(trigger);
            return;
        }

        // No requirements or parameters, directly select
        this.selectTrigger(trigger);
    }

    /**
     * Show auto-enable confirmation modal
     */
    showAutoEnableConfirmation(trigger, missingRequirements) {
        const message = `The trigger <strong>~${trigger.name}</strong> requires the following module(s) to be enabled:`;
        
        const requirementDetails = missingRequirements.map(req => {
            if (req === 'ThreatTable') {
                return `<strong>ThreatTable Module</strong><br>This enables threat/aggro management for the mob.`;
            } else if (req === 'Hearing') {
                return `<strong>Hearing Module</strong><br>This enables the mob to detect and respond to sounds.`;
            }
            return `<strong>${req}</strong>`;
        }).join('<br><br>');

        document.getElementById('triggerConfirmMessage').innerHTML = message;
        document.getElementById('triggerConfirmRequirement').innerHTML = requirementDetails;
        document.getElementById('triggerConfirmOverlay').classList.add('active');

        // Store trigger for later
        this.pendingTrigger = trigger;
        this.pendingRequirements = missingRequirements;
    }

    /**
     * Close confirmation modal
     */
    closeConfirmModal() {
        document.getElementById('triggerConfirmOverlay').classList.remove('active');
        this.pendingTrigger = null;
        this.pendingRequirements = null;
    }

    /**
     * Confirm auto-enable and select trigger
     */
    confirmAutoEnable() {
        if (!this.pendingTrigger) return;

        const trigger = this.pendingTrigger;
        const requirements = this.pendingRequirements;

        this.closeConfirmModal();

        // Check if trigger needs parameters
        if (trigger.parameters) {
            this.showParameterModal(trigger, requirements);
        } else {
            this.selectTrigger(trigger, null, requirements);
        }
    }

    /**
     * Show parameter input modal
     */
    showParameterModal(trigger, autoEnableRequirements = null) {
        const param = trigger.parameters;
        
        document.getElementById('triggerParamTitle').textContent = `Configure ~${trigger.name}`;
        document.getElementById('triggerParamDescription').textContent = param.description;
        document.getElementById('triggerParamInput').placeholder = param.defaultValue || '';
        document.getElementById('triggerParamInput').value = param.defaultValue || '';
        document.getElementById('triggerParamInput').type = param.type === 'number' ? 'number' : 'text';
        
        document.getElementById('triggerParamOverlay').classList.add('active');
        document.getElementById('triggerParamInput').focus();

        // Store trigger and requirements for later
        this.pendingTrigger = trigger;
        this.pendingAutoEnableRequirements = autoEnableRequirements;
    }

    /**
     * Close parameter modal
     */
    closeParamModal() {
        document.getElementById('triggerParamOverlay').classList.remove('active');
        this.pendingTrigger = null;
        this.pendingAutoEnableRequirements = null;
    }

    /**
     * Confirm parameter and select trigger
     */
    confirmParameter() {
        if (!this.pendingTrigger) return;

        const trigger = this.pendingTrigger;
        const param = trigger.parameters;
        const inputValue = document.getElementById('triggerParamInput').value.trim();

        // Validate parameter
        if (param.required && !inputValue) {
            alert('This parameter is required.');
            return;
        }

        if (inputValue && param.validation && !param.validation(inputValue)) {
            if (param.type === 'number') {
                alert('Please enter a valid number greater than 0.');
            } else {
                alert('Invalid parameter value. Must be alphanumeric.');
            }
            return;
        }

        this.closeParamModal();
        this.selectTrigger(trigger, inputValue || null, this.pendingAutoEnableRequirements);
    }

    /**
     * Select trigger and notify callback
     */
    selectTrigger(trigger, parameter = null, autoEnableRequirements = null) {
        this.close();

        if (this.onSelectCallback) {
            this.onSelectCallback({
                trigger: trigger,
                parameter: parameter,
                autoEnableRequirements: autoEnableRequirements
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TriggerBrowser;
}
