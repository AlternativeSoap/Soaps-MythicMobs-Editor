/**
 * ===================================
 * MOBILE SKILL WIZARD
 * ===================================
 * 
 * A step-by-step wizard interface for building skill lines on mobile/tablet.
 * Replaces the complex desktop skill line builder with a guided, touch-friendly experience.
 * 
 * Features:
 * - Touch-optimized UI with large tap targets
 * - Smart suggestions based on usage history
 * - Swipe navigation between steps
 * - Live preview with syntax highlighting
 * - Favorites and recently used items
 * - Auto-complete for common patterns
 * 
 * @version 1.1.0
 * @date January 2026
 */

class MobileSkillWizard {
    constructor() {
        this.currentStep = 0;
        this.steps = ['mechanic', 'targeter', 'trigger', 'conditions', 'modifiers', 'review'];
        this.stepNames = {
            'mechanic': 'Choose Mechanic',
            'targeter': 'Select Target', 
            'trigger': 'Set Trigger',
            'conditions': 'Add Conditions',
            'modifiers': 'Configure',
            'review': 'Review & Add'
        };
        
        this.state = {
            mechanic: null,
            mechanicParams: {},
            targeter: null,
            targeterParams: {},
            trigger: null,
            triggerParams: {},
            conditions: [],
            modifiers: {}
        };
        
        this.isOpen = false;
        this.overlay = null;
        this.container = null;
        this.onComplete = null;
        
        // Cache for browser data
        this.mechanicsData = null;
        this.targetersData = null;
        this.triggersData = null;
        this.conditionsData = null;
        
        // Smart features
        this.favorites = this.loadFavorites();
        this.recentlyUsed = this.loadRecentlyUsed();
        this.usageStats = this.loadUsageStats();
        
        this.init();
    }
    
    /**
     * Initialize the wizard
     */
    init() {
        this.createWizardUI();
        this.loadBrowserData();
    }
    
    /**
     * Load favorites from localStorage
     */
    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('mythicmobs_wizard_favorites') || '{}');
        } catch {
            return { mechanics: [], targeters: [], triggers: [], conditions: [] };
        }
    }
    
    /**
     * Save favorites to localStorage
     */
    saveFavorites() {
        try {
            localStorage.setItem('mythicmobs_wizard_favorites', JSON.stringify(this.favorites));
        } catch (e) {
            console.warn('Failed to save favorites:', e);
        }
    }
    
    /**
     * Load recently used items
     */
    loadRecentlyUsed() {
        try {
            return JSON.parse(localStorage.getItem('mythicmobs_wizard_recent') || '{}');
        } catch {
            return { mechanics: [], targeters: [], triggers: [], conditions: [] };
        }
    }
    
    /**
     * Save recently used items
     */
    saveRecentlyUsed() {
        try {
            localStorage.setItem('mythicmobs_wizard_recent', JSON.stringify(this.recentlyUsed));
        } catch (e) {
            console.warn('Failed to save recent items:', e);
        }
    }
    
    /**
     * Track item usage
     */
    trackUsage(type, name) {
        if (!this.recentlyUsed[type]) {
            this.recentlyUsed[type] = [];
        }
        
        // Remove if already exists
        this.recentlyUsed[type] = this.recentlyUsed[type].filter(n => n !== name);
        
        // Add to front
        this.recentlyUsed[type].unshift(name);
        
        // Keep only last 10
        this.recentlyUsed[type] = this.recentlyUsed[type].slice(0, 10);
        
        this.saveRecentlyUsed();
        
        // Update usage stats
        if (!this.usageStats[type]) {
            this.usageStats[type] = {};
        }
        this.usageStats[type][name] = (this.usageStats[type][name] || 0) + 1;
        this.saveUsageStats();
    }
    
    /**
     * Load usage statistics
     */
    loadUsageStats() {
        try {
            return JSON.parse(localStorage.getItem('mythicmobs_wizard_stats') || '{}');
        } catch {
            return {};
        }
    }
    
    /**
     * Save usage statistics
     */
    saveUsageStats() {
        try {
            localStorage.setItem('mythicmobs_wizard_stats', JSON.stringify(this.usageStats));
        } catch (e) {
            console.warn('Failed to save usage stats:', e);
        }
    }
    
    /**
     * Toggle favorite status
     */
    toggleFavorite(type, name) {
        if (!this.favorites[type]) {
            this.favorites[type] = [];
        }
        
        const index = this.favorites[type].indexOf(name);
        if (index > -1) {
            this.favorites[type].splice(index, 1);
        } else {
            this.favorites[type].push(name);
        }
        
        this.saveFavorites();
        this.renderCurrentStep(); // Re-render to show updated favorite status
        
        // Haptic feedback
        if (window.editor?.mobileManager) {
            window.editor.mobileManager.vibrate('selection');
        }
    }
    
    /**
     * Check if item is favorite
     */
    isFavorite(type, name) {
        return this.favorites[type]?.includes(name) || false;
    }
    
    /**
     * Get smart suggestions based on usage patterns
     */
    getSmartSuggestions(type) {
        const suggestions = [];
        
        // Add favorites first
        if (this.favorites[type]?.length) {
            suggestions.push(...this.favorites[type].map(name => ({
                name,
                reason: 'favorite',
                icon: 'fa-star'
            })));
        }
        
        // Add recently used
        if (this.recentlyUsed[type]?.length) {
            this.recentlyUsed[type].slice(0, 5).forEach(name => {
                if (!suggestions.find(s => s.name === name)) {
                    suggestions.push({
                        name,
                        reason: 'recent',
                        icon: 'fa-clock'
                    });
                }
            });
        }
        
        // Add most used (from stats)
        if (this.usageStats[type]) {
            const sorted = Object.entries(this.usageStats[type])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            sorted.forEach(([name, count]) => {
                if (!suggestions.find(s => s.name === name)) {
                    suggestions.push({
                        name,
                        reason: 'popular',
                        icon: 'fa-fire',
                        count
                    });
                }
            });
        }
        
        return suggestions.slice(0, 8);
    }
    
    /**
     * Load data from browser components
     */
    async loadBrowserData() {
        // Load mechanics
        if (window.mechanicsData) {
            this.mechanicsData = window.mechanicsData;
        }
        
        // Load targeters
        if (window.targetersData) {
            this.targetersData = window.targetersData;
        }
        
        // Load triggers
        if (window.triggersData) {
            this.triggersData = window.triggersData;
        }
        
        // Load conditions
        if (window.conditionsData) {
            this.conditionsData = window.conditionsData;
        }
    }
    
    /**
     * Create the wizard UI structure
     */
    createWizardUI() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-wizard-overlay';
        this.overlay.innerHTML = `
            <div class="mobile-wizard-container">
                <div class="wizard-header">
                    <button class="wizard-close" aria-label="Close wizard">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="wizard-title">
                        <i class="fas fa-magic"></i>
                        <span>Skill Builder</span>
                    </div>
                    <div class="wizard-step-indicator"></div>
                </div>
                
                <div class="wizard-progress">
                    <div class="progress-track">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-steps"></div>
                </div>
                
                <div class="wizard-content">
                    <!-- Step content renders here -->
                </div>
                
                <div class="wizard-preview">
                    <div class="preview-label">
                        <i class="fas fa-code"></i>
                        Preview
                    </div>
                    <div class="preview-code"></div>
                </div>
                
                <div class="wizard-footer">
                    <button class="wizard-btn wizard-btn-back" disabled>
                        <i class="fas fa-chevron-left"></i>
                        Back
                    </button>
                    <button class="wizard-btn wizard-btn-next primary">
                        Next
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        this.container = this.overlay.querySelector('.mobile-wizard-container');
        
        this.bindEvents();
        this.renderProgressSteps();
    }
    
    /**
     * Bind wizard events
     */
    bindEvents() {
        // Close button
        this.overlay.querySelector('.wizard-close').addEventListener('click', () => this.close());
        
        // Backdrop click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Back button
        this.overlay.querySelector('.wizard-btn-back').addEventListener('click', () => this.prevStep());
        
        // Next button
        this.overlay.querySelector('.wizard-btn-next').addEventListener('click', () => this.nextStep());
        
        // Swipe gestures
        this.setupSwipeGestures();
    }
    
    /**
     * Setup swipe gestures for step navigation
     */
    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        const content = this.overlay.querySelector('.wizard-content');
        
        content.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        content.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Only handle horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.prevStep();
                } else {
                    this.nextStep();
                }
            }
        }, { passive: true });
    }
    
    /**
     * Render progress step indicators
     */
    renderProgressSteps() {
        const container = this.overlay.querySelector('.progress-steps');
        container.innerHTML = this.steps.map((step, index) => `
            <div class="progress-step ${index === 0 ? 'active' : ''}" data-step="${index}">
                <div class="step-dot">
                    <i class="fas ${this.getStepIcon(step)}"></i>
                </div>
                <span class="step-label">${this.stepNames[step]}</span>
            </div>
        `).join('');
        
        // Click on step dots
        container.querySelectorAll('.progress-step').forEach((el, index) => {
            el.addEventListener('click', () => {
                if (index <= this.currentStep) {
                    this.goToStep(index);
                }
            });
        });
    }
    
    /**
     * Get icon for each step
     */
    getStepIcon(step) {
        const icons = {
            'mechanic': 'fa-bolt',
            'targeter': 'fa-crosshairs',
            'trigger': 'fa-play',
            'conditions': 'fa-filter',
            'modifiers': 'fa-sliders-h',
            'review': 'fa-check'
        };
        return icons[step] || 'fa-circle';
    }
    
    /**
     * Open the wizard
     */
    open(options = {}) {
        this.reset();
        this.isOpen = true;
        this.onComplete = options.onComplete || null;
        
        // Pre-fill if editing
        if (options.existingLine) {
            this.parseExistingLine(options.existingLine);
        }
        
        this.overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        this.renderCurrentStep();
        this.updatePreview();
    }
    
    /**
     * Close the wizard
     */
    close() {
        this.isOpen = false;
        this.overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
    
    /**
     * Reset wizard state
     */
    reset() {
        this.currentStep = 0;
        this.state = {
            mechanic: null,
            mechanicParams: {},
            targeter: null,
            targeterParams: {},
            trigger: null,
            triggerParams: {},
            conditions: [],
            modifiers: {}
        };
        this.updateProgress();
    }
    
    /**
     * Parse existing skill line for editing
     */
    parseExistingLine(line) {
        // Parse the skill line format: - mechanic{params} @targeter{params} ~trigger{params} ?condition
        const parts = line.match(/^-?\s*(\w+)(\{[^}]*\})?\s*(@\w+(\{[^}]*\})?)?(\s*~\w+(\{[^}]*\})?)?(\s*\?.*)?$/);
        
        if (parts) {
            this.state.mechanic = parts[1];
            if (parts[2]) {
                this.state.mechanicParams = this.parseParams(parts[2]);
            }
            
            if (parts[3]) {
                const targeterMatch = parts[3].match(/@(\w+)(\{[^}]*\})?/);
                if (targeterMatch) {
                    this.state.targeter = targeterMatch[1];
                    if (targeterMatch[2]) {
                        this.state.targeterParams = this.parseParams(targeterMatch[2]);
                    }
                }
            }
            
            if (parts[5]) {
                const triggerMatch = parts[5].match(/~(\w+)(\{[^}]*\})?/);
                if (triggerMatch) {
                    this.state.trigger = triggerMatch[1];
                    if (triggerMatch[2]) {
                        this.state.triggerParams = this.parseParams(triggerMatch[2]);
                    }
                }
            }
        }
    }
    
    /**
     * Parse parameter string into object
     */
    parseParams(paramString) {
        const params = {};
        const content = paramString.slice(1, -1); // Remove { }
        const pairs = content.split(';');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
                params[key.trim()] = value.trim();
            }
        });
        
        return params;
    }
    
    /**
     * Navigate to next step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            // Validate current step
            if (!this.validateStep()) {
                return;
            }
            
            this.currentStep++;
            this.renderCurrentStep();
            this.updateProgress();
            this.updatePreview();
        } else {
            // Final step - complete
            this.complete();
        }
    }
    
    /**
     * Navigate to previous step
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderCurrentStep();
            this.updateProgress();
        }
    }
    
    /**
     * Go to specific step
     */
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex <= this.currentStep) {
            this.currentStep = stepIndex;
            this.renderCurrentStep();
            this.updateProgress();
        }
    }
    
    /**
     * Validate current step
     */
    validateStep() {
        const step = this.steps[this.currentStep];
        
        switch (step) {
            case 'mechanic':
                if (!this.state.mechanic) {
                    this.showStepError('Please select a mechanic');
                    return false;
                }
                break;
            case 'targeter':
                // Targeter is optional, skip validation
                break;
            case 'trigger':
                // Trigger is optional, skip validation
                break;
        }
        
        return true;
    }
    
    /**
     * Show error message
     */
    showStepError(message) {
        const content = this.overlay.querySelector('.wizard-content');
        const existing = content.querySelector('.step-error');
        if (existing) existing.remove();
        
        const error = document.createElement('div');
        error.className = 'step-error';
        error.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        content.insertBefore(error, content.firstChild);
        
        setTimeout(() => error.remove(), 3000);
    }
    
    /**
     * Update progress indicators
     */
    updateProgress() {
        const progress = ((this.currentStep) / (this.steps.length - 1)) * 100;
        this.overlay.querySelector('.progress-fill').style.width = `${progress}%`;
        
        // Update step dots
        const dots = this.overlay.querySelectorAll('.progress-step');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index <= this.currentStep);
            dot.classList.toggle('completed', index < this.currentStep);
        });
        
        // Update step indicator text
        this.overlay.querySelector('.wizard-step-indicator').textContent = 
            `Step ${this.currentStep + 1} of ${this.steps.length}`;
        
        // Update buttons
        const backBtn = this.overlay.querySelector('.wizard-btn-back');
        const nextBtn = this.overlay.querySelector('.wizard-btn-next');
        
        backBtn.disabled = this.currentStep === 0;
        
        if (this.currentStep === this.steps.length - 1) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Add to Skill';
            nextBtn.classList.add('success');
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
            nextBtn.classList.remove('success');
        }
    }
    
    /**
     * Render current step content
     */
    renderCurrentStep() {
        const step = this.steps[this.currentStep];
        const content = this.overlay.querySelector('.wizard-content');
        
        switch (step) {
            case 'mechanic':
                content.innerHTML = this.renderMechanicStep();
                break;
            case 'targeter':
                content.innerHTML = this.renderTargeterStep();
                break;
            case 'trigger':
                content.innerHTML = this.renderTriggerStep();
                break;
            case 'conditions':
                content.innerHTML = this.renderConditionsStep();
                break;
            case 'modifiers':
                content.innerHTML = this.renderModifiersStep();
                break;
            case 'review':
                content.innerHTML = this.renderReviewStep();
                break;
        }
        
        this.bindStepEvents();
    }
    
    /**
     * Render mechanic selection step
     */
    renderMechanicStep() {
        const categories = this.getMechanicCategories();
        const suggestions = this.getSmartSuggestions('mechanics');
        
        return `
            <div class="step-header">
                <h3><i class="fas fa-bolt"></i> Choose a Mechanic</h3>
                <p>Select what action the skill will perform</p>
            </div>
            
            ${suggestions.length > 0 ? `
                <div class="smart-suggestions">
                    <div class="suggestions-header">
                        <i class="fas fa-lightbulb"></i>
                        <span>Quick Pick</span>
                    </div>
                    <div class="suggestions-chips">
                        ${suggestions.map(s => `
                            <button class="suggestion-chip ${this.state.mechanic === s.name ? 'selected' : ''}" 
                                data-value="${s.name}" 
                                data-type="mechanic">
                                <i class="fas ${s.icon}"></i>
                                <span>${s.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="step-search">
                <i class="fas fa-search"></i>
                <input type="text" 
                    class="wizard-search" 
                    placeholder="Search mechanics..." 
                    autocomplete="off"
                    autocapitalize="off">
            </div>
            
            <div class="category-chips">
                <button class="category-chip active" data-category="all">All</button>
                <button class="category-chip" data-category="favorites">
                    <i class="fas fa-star"></i> Favorites
                </button>
                ${categories.map(cat => `
                    <button class="category-chip" data-category="${cat}">${this.formatCategoryName(cat)}</button>
                `).join('')}
            </div>
            
            <div class="wizard-item-grid" data-type="mechanic">
                ${this.renderMechanicItems('all')}
            </div>
        `;
    }
    
    /**
     * Get mechanic categories
     */
    getMechanicCategories() {
        if (!this.mechanicsData) {
            return ['damage', 'effects', 'movement', 'projectiles', 'utility', 'particles'];
        }
        
        const categories = new Set();
        Object.values(this.mechanicsData).forEach(m => {
            if (m.category) categories.add(m.category.toLowerCase());
        });
        return Array.from(categories).sort();
    }
    
    /**
     * Format category name
     */
    formatCategoryName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    /**
     * Render mechanic items
     */
    renderMechanicItems(category, searchTerm = '') {
        // Handle favorites category
        if (category === 'favorites') {
            const favMechanics = (this.favorites.mechanics || []).map(name => {
                const data = this.mechanicsData?.[name] || {};
                return { name, ...data };
            });
            
            if (favMechanics.length === 0) {
                return `
                    <div class="empty-state">
                        <i class="fas fa-star"></i>
                        <p>No favorites yet</p>
                        <span class="empty-hint">Long-press any mechanic to add to favorites</span>
                    </div>
                `;
            }
            
            return favMechanics.map(m => this.renderMechanicItem(m, true)).join('');
        }
        
        const mechanics = this.getFilteredMechanics(category, searchTerm);
        
        if (mechanics.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No mechanics found</p>
                </div>
            `;
        }
        
        return mechanics.map(m => this.renderMechanicItem(m)).join('');
    }
    
    /**
     * Render a single mechanic item
     */
    renderMechanicItem(m, showFavorite = false) {
        const isFav = this.isFavorite('mechanics', m.name);
        
        return `
            <button class="wizard-item ${this.state.mechanic === m.name ? 'selected' : ''}" 
                data-value="${m.name}"
                data-type="mechanic">
                <div class="item-icon">
                    <i class="fas ${m.icon || 'fa-bolt'}"></i>
                </div>
                <div class="item-info">
                    <span class="item-name">${m.name}</span>
                    <span class="item-desc">${m.description || 'No description'}</span>
                </div>
                <div class="item-actions">
                    <button class="favorite-btn ${isFav ? 'active' : ''}" 
                        data-favorite-type="mechanics" 
                        data-favorite-name="${m.name}"
                        aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-star"></i>
                    </button>
                    ${this.state.mechanic === m.name ? '<i class="fas fa-check item-selected"></i>' : ''}
                </div>
            </button>
        `;
    }
    
    /**
     * Get filtered mechanics
     */
    getFilteredMechanics(category, searchTerm) {
        let mechanics = [];
        
        if (this.mechanicsData) {
            mechanics = Object.entries(this.mechanicsData).map(([name, data]) => ({
                name,
                ...data
            }));
        } else {
            // Fallback sample data
            mechanics = [
                { name: 'damage', description: 'Deal damage to target', category: 'damage', icon: 'fa-heart-broken' },
                { name: 'heal', description: 'Heal the target', category: 'effects', icon: 'fa-heart' },
                { name: 'potion', description: 'Apply potion effect', category: 'effects', icon: 'fa-flask' },
                { name: 'message', description: 'Send message to target', category: 'utility', icon: 'fa-comment' },
                { name: 'particle', description: 'Spawn particles', category: 'particles', icon: 'fa-sparkles' },
                { name: 'sound', description: 'Play a sound', category: 'utility', icon: 'fa-volume-up' },
                { name: 'projectile', description: 'Launch a projectile', category: 'projectiles', icon: 'fa-rocket' },
                { name: 'teleport', description: 'Teleport the target', category: 'movement', icon: 'fa-portal-exit' },
                { name: 'velocity', description: 'Modify target velocity', category: 'movement', icon: 'fa-arrows-alt' },
                { name: 'skill', description: 'Execute another skill', category: 'utility', icon: 'fa-wand-magic-sparkles' }
            ];
        }
        
        // Filter by category
        if (category !== 'all') {
            mechanics = mechanics.filter(m => 
                m.category && m.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            mechanics = mechanics.filter(m =>
                m.name.toLowerCase().includes(term) ||
                (m.description && m.description.toLowerCase().includes(term))
            );
        }
        
        return mechanics.slice(0, 50); // Limit for performance
    }
    
    /**
     * Render targeter selection step
     */
    renderTargeterStep() {
        return `
            <div class="step-header">
                <h3><i class="fas fa-crosshairs"></i> Select Target</h3>
                <p>Who or what should this mechanic affect?</p>
            </div>
            
            <div class="step-search">
                <i class="fas fa-search"></i>
                <input type="text" 
                    class="wizard-search" 
                    placeholder="Search targeters..." 
                    autocomplete="off"
                    autocapitalize="off">
            </div>
            
            <div class="quick-targeters">
                <h4>Common Targeters</h4>
                <div class="quick-targeter-grid">
                    ${this.renderQuickTargeters()}
                </div>
            </div>
            
            <div class="wizard-item-grid" data-type="targeter">
                ${this.renderTargeterItems('')}
            </div>
            
            <div class="skip-option">
                <button class="skip-btn" data-skip="targeter">
                    <i class="fas fa-forward"></i>
                    Skip - Use Default Target
                </button>
            </div>
        `;
    }
    
    /**
     * Render quick targeter buttons
     */
    renderQuickTargeters() {
        const quick = [
            { name: 'Self', value: '@self', icon: 'fa-user' },
            { name: 'Target', value: '@target', icon: 'fa-crosshairs' },
            { name: 'Trigger', value: '@trigger', icon: 'fa-bolt' },
            { name: 'Near', value: '@EntitiesNearOrigin', icon: 'fa-circle' }
        ];
        
        return quick.map(t => `
            <button class="quick-targeter ${this.state.targeter === t.value.substring(1) ? 'selected' : ''}"
                data-value="${t.value.substring(1)}">
                <i class="fas ${t.icon}"></i>
                <span>${t.name}</span>
            </button>
        `).join('');
    }
    
    /**
     * Render targeter items
     */
    renderTargeterItems(searchTerm) {
        let targeters = [];
        
        if (this.targetersData) {
            targeters = Object.entries(this.targetersData).map(([name, data]) => ({
                name,
                ...data
            }));
        } else {
            // Fallback sample data
            targeters = [
                { name: 'self', description: 'The caster', icon: 'fa-user' },
                { name: 'target', description: 'The current target', icon: 'fa-crosshairs' },
                { name: 'trigger', description: 'Entity that triggered the skill', icon: 'fa-bolt' },
                { name: 'EntitiesNearOrigin', description: 'Entities near the origin', icon: 'fa-circle' },
                { name: 'PlayersNearOrigin', description: 'Players near the origin', icon: 'fa-users' },
                { name: 'World', description: 'Target the world', icon: 'fa-globe' },
                { name: 'Location', description: 'A specific location', icon: 'fa-map-marker-alt' },
                { name: 'Forward', description: 'Location in front', icon: 'fa-arrow-up' }
            ];
        }
        
        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            targeters = targeters.filter(t =>
                t.name.toLowerCase().includes(term) ||
                (t.description && t.description.toLowerCase().includes(term))
            );
        }
        
        return targeters.map(t => `
            <button class="wizard-item ${this.state.targeter === t.name ? 'selected' : ''}" 
                data-value="${t.name}"
                data-type="targeter">
                <div class="item-icon">
                    <i class="fas ${t.icon || 'fa-crosshairs'}"></i>
                </div>
                <div class="item-info">
                    <span class="item-name">${t.name}</span>
                    <span class="item-desc">${t.description || 'No description'}</span>
                </div>
                ${this.state.targeter === t.name ? '<i class="fas fa-check item-selected"></i>' : ''}
            </button>
        `).join('');
    }
    
    /**
     * Render trigger selection step
     */
    renderTriggerStep() {
        return `
            <div class="step-header">
                <h3><i class="fas fa-play"></i> Set Trigger</h3>
                <p>When should this skill line execute?</p>
            </div>
            
            <div class="step-search">
                <i class="fas fa-search"></i>
                <input type="text" 
                    class="wizard-search" 
                    placeholder="Search triggers..." 
                    autocomplete="off"
                    autocapitalize="off">
            </div>
            
            <div class="wizard-item-grid" data-type="trigger">
                ${this.renderTriggerItems('')}
            </div>
            
            <div class="skip-option">
                <button class="skip-btn" data-skip="trigger">
                    <i class="fas fa-forward"></i>
                    Skip - No Trigger
                </button>
            </div>
        `;
    }
    
    /**
     * Render trigger items
     */
    renderTriggerItems(searchTerm) {
        let triggers = [];
        
        if (this.triggersData) {
            triggers = Object.entries(this.triggersData).map(([name, data]) => ({
                name,
                ...data
            }));
        } else {
            // Fallback sample data
            triggers = [
                { name: 'onTimer', description: 'Execute on a timer interval', icon: 'fa-clock' },
                { name: 'onDamaged', description: 'When the mob takes damage', icon: 'fa-shield-alt' },
                { name: 'onAttack', description: 'When the mob attacks', icon: 'fa-sword' },
                { name: 'onSpawn', description: 'When the mob spawns', icon: 'fa-star' },
                { name: 'onDeath', description: 'When the mob dies', icon: 'fa-skull' },
                { name: 'onInteract', description: 'When a player interacts', icon: 'fa-hand-pointer' },
                { name: 'onCombat', description: 'When entering combat', icon: 'fa-fist-raised' },
                { name: 'onSignal', description: 'When receiving a signal', icon: 'fa-broadcast-tower' }
            ];
        }
        
        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            triggers = triggers.filter(t =>
                t.name.toLowerCase().includes(term) ||
                (t.description && t.description.toLowerCase().includes(term))
            );
        }
        
        return triggers.map(t => `
            <button class="wizard-item ${this.state.trigger === t.name ? 'selected' : ''}" 
                data-value="${t.name}"
                data-type="trigger">
                <div class="item-icon">
                    <i class="fas ${t.icon || 'fa-play'}"></i>
                </div>
                <div class="item-info">
                    <span class="item-name">${t.name}</span>
                    <span class="item-desc">${t.description || 'No description'}</span>
                </div>
                ${this.state.trigger === t.name ? '<i class="fas fa-check item-selected"></i>' : ''}
            </button>
        `).join('');
    }
    
    /**
     * Render conditions step
     */
    renderConditionsStep() {
        return `
            <div class="step-header">
                <h3><i class="fas fa-filter"></i> Add Conditions</h3>
                <p>Optional: Add conditions for when this executes</p>
            </div>
            
            <div class="conditions-list">
                ${this.state.conditions.length > 0 ? 
                    this.state.conditions.map((c, i) => `
                        <div class="condition-item">
                            <span class="condition-text">?${c.name}${c.params ? '{' + c.params + '}' : ''}</span>
                            <button class="condition-remove" data-index="${i}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('') :
                    '<div class="no-conditions">No conditions added yet</div>'
                }
            </div>
            
            <div class="add-condition-section">
                <h4>Add a Condition</h4>
                <div class="step-search">
                    <i class="fas fa-search"></i>
                    <input type="text" 
                        class="wizard-search condition-search" 
                        placeholder="Search conditions..." 
                        autocomplete="off"
                        autocapitalize="off">
                </div>
                
                <div class="wizard-item-grid compact" data-type="condition">
                    ${this.renderConditionItems('')}
                </div>
            </div>
            
            <div class="skip-option">
                <button class="skip-btn continue-btn">
                    <i class="fas fa-check"></i>
                    ${this.state.conditions.length > 0 ? 'Continue with Conditions' : 'Skip - No Conditions'}
                </button>
            </div>
        `;
    }
    
    /**
     * Render condition items
     */
    renderConditionItems(searchTerm) {
        let conditions = [];
        
        if (this.conditionsData) {
            conditions = Object.entries(this.conditionsData).map(([name, data]) => ({
                name,
                ...data
            }));
        } else {
            // Fallback sample data
            conditions = [
                { name: 'health', description: 'Check health percentage', icon: 'fa-heart' },
                { name: 'distance', description: 'Check distance from target', icon: 'fa-ruler' },
                { name: 'hasaura', description: 'Check if has an aura', icon: 'fa-magic' },
                { name: 'isburning', description: 'Check if on fire', icon: 'fa-fire' },
                { name: 'world', description: 'Check current world', icon: 'fa-globe' },
                { name: 'chance', description: 'Random chance', icon: 'fa-dice' },
                { name: 'day', description: 'Check if daytime', icon: 'fa-sun' },
                { name: 'night', description: 'Check if nighttime', icon: 'fa-moon' }
            ];
        }
        
        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            conditions = conditions.filter(c =>
                c.name.toLowerCase().includes(term) ||
                (c.description && c.description.toLowerCase().includes(term))
            );
        }
        
        return conditions.slice(0, 20).map(c => `
            <button class="wizard-item compact" 
                data-value="${c.name}"
                data-type="condition">
                <div class="item-icon small">
                    <i class="fas ${c.icon || 'fa-filter'}"></i>
                </div>
                <div class="item-info">
                    <span class="item-name">${c.name}</span>
                </div>
            </button>
        `).join('');
    }
    
    /**
     * Render modifiers step
     */
    renderModifiersStep() {
        return `
            <div class="step-header">
                <h3><i class="fas fa-sliders-h"></i> Configure Parameters</h3>
                <p>Set values for your selected components</p>
            </div>
            
            <div class="modifiers-sections">
                ${this.state.mechanic ? `
                    <div class="modifier-section">
                        <h4>
                            <i class="fas fa-bolt"></i>
                            Mechanic: ${this.state.mechanic}
                        </h4>
                        <div class="modifier-params">
                            ${this.renderMechanicParams()}
                        </div>
                    </div>
                ` : ''}
                
                ${this.state.targeter ? `
                    <div class="modifier-section">
                        <h4>
                            <i class="fas fa-crosshairs"></i>
                            Targeter: @${this.state.targeter}
                        </h4>
                        <div class="modifier-params">
                            ${this.renderTargeterParams()}
                        </div>
                    </div>
                ` : ''}
                
                ${this.state.trigger ? `
                    <div class="modifier-section">
                        <h4>
                            <i class="fas fa-play"></i>
                            Trigger: ~${this.state.trigger}
                        </h4>
                        <div class="modifier-params">
                            ${this.renderTriggerParams()}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="common-modifiers">
                <h4>Common Modifiers</h4>
                <div class="common-modifier-grid">
                    <div class="modifier-field">
                        <label>Repeat Count</label>
                        <input type="number" 
                            class="modifier-input" 
                            data-modifier="repeat" 
                            placeholder="1"
                            value="${this.state.modifiers.repeat || ''}"
                            min="1">
                    </div>
                    <div class="modifier-field">
                        <label>Repeat Interval (ticks)</label>
                        <input type="number" 
                            class="modifier-input" 
                            data-modifier="repeatInterval" 
                            placeholder="20"
                            value="${this.state.modifiers.repeatInterval || ''}"
                            min="1">
                    </div>
                    <div class="modifier-field">
                        <label>Delay (ticks)</label>
                        <input type="number" 
                            class="modifier-input" 
                            data-modifier="delay" 
                            placeholder="0"
                            value="${this.state.modifiers.delay || ''}"
                            min="0">
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render mechanic-specific parameters
     */
    renderMechanicParams() {
        const mechanic = this.state.mechanic;
        const params = this.getMechanicParams(mechanic);
        
        if (params.length === 0) {
            return '<p class="no-params">No configurable parameters</p>';
        }
        
        return params.map(p => `
            <div class="modifier-field">
                <label>${p.label || p.name}${p.required ? ' *' : ''}</label>
                ${this.renderParamInput(p, 'mechanicParam', this.state.mechanicParams)}
            </div>
        `).join('');
    }
    
    /**
     * Get parameters for a mechanic
     */
    getMechanicParams(mechanic) {
        // Get from mechanicsData if available
        if (this.mechanicsData && this.mechanicsData[mechanic] && this.mechanicsData[mechanic].parameters) {
            return this.mechanicsData[mechanic].parameters;
        }
        
        // Fallback common params
        const commonParams = {
            'damage': [
                { name: 'amount', label: 'Damage Amount', type: 'number', default: 1 },
                { name: 'ignorearmor', label: 'Ignore Armor', type: 'boolean' }
            ],
            'heal': [
                { name: 'amount', label: 'Heal Amount', type: 'number', default: 1 }
            ],
            'potion': [
                { name: 'type', label: 'Potion Type', type: 'text', required: true },
                { name: 'duration', label: 'Duration (ticks)', type: 'number', default: 200 },
                { name: 'level', label: 'Level', type: 'number', default: 0 }
            ],
            'message': [
                { name: 'message', label: 'Message', type: 'text', required: true }
            ],
            'sound': [
                { name: 'sound', label: 'Sound Name', type: 'text', required: true },
                { name: 'volume', label: 'Volume', type: 'number', default: 1 },
                { name: 'pitch', label: 'Pitch', type: 'number', default: 1 }
            ]
        };
        
        return commonParams[mechanic] || [];
    }
    
    /**
     * Render targeter parameters
     */
    renderTargeterParams() {
        const targeter = this.state.targeter;
        const params = this.getTargeterParams(targeter);
        
        if (params.length === 0) {
            return '<p class="no-params">No configurable parameters</p>';
        }
        
        return params.map(p => `
            <div class="modifier-field">
                <label>${p.label || p.name}${p.required ? ' *' : ''}</label>
                ${this.renderParamInput(p, 'targeterParam', this.state.targeterParams)}
            </div>
        `).join('');
    }
    
    /**
     * Get targeter parameters
     */
    getTargeterParams(targeter) {
        const commonParams = {
            'EntitiesNearOrigin': [
                { name: 'radius', label: 'Radius', type: 'number', default: 5 },
                { name: 'limit', label: 'Max Targets', type: 'number' }
            ],
            'PlayersNearOrigin': [
                { name: 'radius', label: 'Radius', type: 'number', default: 5 },
                { name: 'limit', label: 'Max Targets', type: 'number' }
            ],
            'Location': [
                { name: 'x', label: 'X Offset', type: 'number', default: 0 },
                { name: 'y', label: 'Y Offset', type: 'number', default: 0 },
                { name: 'z', label: 'Z Offset', type: 'number', default: 0 }
            ],
            'Forward': [
                { name: 'f', label: 'Forward Distance', type: 'number', default: 1 }
            ]
        };
        
        return commonParams[targeter] || [];
    }
    
    /**
     * Render trigger parameters
     */
    renderTriggerParams() {
        const trigger = this.state.trigger;
        const params = this.getTriggerParams(trigger);
        
        if (params.length === 0) {
            return '<p class="no-params">No configurable parameters</p>';
        }
        
        return params.map(p => `
            <div class="modifier-field">
                <label>${p.label || p.name}${p.required ? ' *' : ''}</label>
                ${this.renderParamInput(p, 'triggerParam', this.state.triggerParams)}
            </div>
        `).join('');
    }
    
    /**
     * Get trigger parameters
     */
    getTriggerParams(trigger) {
        const commonParams = {
            'onTimer': [
                { name: 'interval', label: 'Interval (ticks)', type: 'number', default: 20, required: true }
            ],
            'onDamaged': [
                { name: 'damagecause', label: 'Damage Cause', type: 'text' }
            ],
            'onSignal': [
                { name: 'signal', label: 'Signal Name', type: 'text', required: true }
            ]
        };
        
        return commonParams[trigger] || [];
    }
    
    /**
     * Render a parameter input field
     */
    renderParamInput(param, dataType, currentValues) {
        const value = currentValues[param.name] || param.default || '';
        
        switch (param.type) {
            case 'boolean':
                return `
                    <label class="toggle-switch">
                        <input type="checkbox" 
                            class="param-input" 
                            data-type="${dataType}"
                            data-param="${param.name}"
                            ${value === true || value === 'true' ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                `;
            case 'number':
                return `
                    <input type="number" 
                        class="param-input" 
                        data-type="${dataType}"
                        data-param="${param.name}"
                        placeholder="${param.default || ''}"
                        value="${value}">
                `;
            case 'select':
                return `
                    <select class="param-input" 
                        data-type="${dataType}"
                        data-param="${param.name}">
                        <option value="">Select...</option>
                        ${(param.options || []).map(opt => `
                            <option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>
                        `).join('')}
                    </select>
                `;
            default:
                return `
                    <input type="text" 
                        class="param-input" 
                        data-type="${dataType}"
                        data-param="${param.name}"
                        placeholder="${param.placeholder || ''}"
                        value="${value}">
                `;
        }
    }
    
    /**
     * Render review step
     */
    renderReviewStep() {
        const skillLine = this.buildSkillLine();
        
        return `
            <div class="step-header">
                <h3><i class="fas fa-check-circle"></i> Review Your Skill Line</h3>
                <p>Make sure everything looks correct</p>
            </div>
            
            <div class="review-summary">
                <div class="review-section">
                    <h4><i class="fas fa-bolt"></i> Mechanic</h4>
                    <div class="review-value">${this.state.mechanic || 'None selected'}</div>
                </div>
                
                <div class="review-section">
                    <h4><i class="fas fa-crosshairs"></i> Targeter</h4>
                    <div class="review-value">${this.state.targeter ? '@' + this.state.targeter : 'Default'}</div>
                </div>
                
                <div class="review-section">
                    <h4><i class="fas fa-play"></i> Trigger</h4>
                    <div class="review-value">${this.state.trigger ? '~' + this.state.trigger : 'None'}</div>
                </div>
                
                ${this.state.conditions.length > 0 ? `
                    <div class="review-section">
                        <h4><i class="fas fa-filter"></i> Conditions</h4>
                        <div class="review-value">${this.state.conditions.map(c => '?' + c.name).join(', ')}</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="final-preview">
                <h4>Final Skill Line</h4>
                <div class="final-preview-code">
                    <code>${skillLine}</code>
                    <button class="copy-btn" data-copy="${skillLine}">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind events for current step
     */
    bindStepEvents() {
        const content = this.overlay.querySelector('.wizard-content');
        
        // Search input
        const searchInput = content.querySelector('.wizard-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        // Category chips
        content.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const target = e.target.closest('.category-chip');
                this.handleCategoryChange(target.dataset.category);
            });
        });
        
        // Item selection (avoid triggering on favorite button)
        content.querySelectorAll('.wizard-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger selection if clicking favorite button
                if (e.target.closest('.favorite-btn')) return;
                
                const btn = e.target.closest('.wizard-item');
                if (btn) {
                    this.handleItemSelect(btn.dataset.type, btn.dataset.value);
                }
            });
        });
        
        // Favorite buttons
        content.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent item selection
                const type = btn.dataset.favoriteType;
                const name = btn.dataset.favoriteName;
                this.toggleFavorite(type, name);
            });
        });
        
        // Smart suggestion chips
        content.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const value = chip.dataset.value;
                const type = chip.dataset.type;
                this.handleItemSelect(type, value);
            });
        });
        
        // Quick targeter selection
        content.querySelectorAll('.quick-targeter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleItemSelect('targeter', e.target.closest('.quick-targeter').dataset.value);
            });
        });
        
        // Skip buttons
        content.querySelectorAll('.skip-btn').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });
        
        // Continue button
        const continueBtn = content.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.nextStep());
        }
        
        // Condition remove
        content.querySelectorAll('.condition-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.condition-remove').dataset.index);
                this.removeCondition(index);
            });
        });
        
        // Modifier inputs
        content.querySelectorAll('.modifier-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.state.modifiers[e.target.dataset.modifier] = e.target.value;
                this.updatePreview();
            });
        });
        
        // Parameter inputs
        content.querySelectorAll('.param-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleParamChange(e.target);
            });
        });
        
        // Copy button
        const copyBtn = content.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                navigator.clipboard.writeText(e.target.closest('.copy-btn').dataset.copy);
                e.target.closest('.copy-btn').innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    e.target.closest('.copy-btn').innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        }
    }
    
    /**
     * Handle search input
     */
    handleSearch(term) {
        const step = this.steps[this.currentStep];
        const grid = this.overlay.querySelector('.wizard-item-grid');
        
        switch (step) {
            case 'mechanic':
                grid.innerHTML = this.renderMechanicItems(this.currentCategory || 'all', term);
                break;
            case 'targeter':
                grid.innerHTML = this.renderTargeterItems(term);
                break;
            case 'trigger':
                grid.innerHTML = this.renderTriggerItems(term);
                break;
            case 'conditions':
                grid.innerHTML = this.renderConditionItems(term);
                break;
        }
        
        this.bindStepEvents();
    }
    
    /**
     * Handle category change
     */
    handleCategoryChange(category) {
        this.currentCategory = category;
        
        // Update active chip
        this.overlay.querySelectorAll('.category-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.category === category);
        });
        
        // Re-render items
        const grid = this.overlay.querySelector('.wizard-item-grid');
        const searchTerm = this.overlay.querySelector('.wizard-search')?.value || '';
        grid.innerHTML = this.renderMechanicItems(category, searchTerm);
        
        this.bindStepEvents();
    }
    
    /**
     * Handle item selection
     */
    handleItemSelect(type, value) {
        // Track usage for smart suggestions
        const typeMap = {
            'mechanic': 'mechanics',
            'targeter': 'targeters',
            'trigger': 'triggers',
            'condition': 'conditions'
        };
        this.trackUsage(typeMap[type] || type, value);
        
        // Haptic feedback
        if (window.editor?.mobileManager) {
            window.editor.mobileManager.vibrate('selection');
        }
        
        switch (type) {
            case 'mechanic':
                this.state.mechanic = value;
                break;
            case 'targeter':
                this.state.targeter = value;
                break;
            case 'trigger':
                this.state.trigger = value;
                break;
            case 'condition':
                this.addCondition(value);
                return; // Don't re-render, just update conditions
        }
        
        this.renderCurrentStep();
        this.updatePreview();
    }
    
    /**
     * Add a condition
     */
    addCondition(name) {
        this.state.conditions.push({ name, params: '' });
        this.trackUsage('conditions', name);
        this.renderCurrentStep();
        this.updatePreview();
    }
    
    /**
     * Remove a condition
     */
    removeCondition(index) {
        this.state.conditions.splice(index, 1);
        this.renderCurrentStep();
        this.updatePreview();
    }
    
    /**
     * Handle parameter change
     */
    handleParamChange(input) {
        const type = input.dataset.type;
        const param = input.dataset.param;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        
        switch (type) {
            case 'mechanicParam':
                this.state.mechanicParams[param] = value;
                break;
            case 'targeterParam':
                this.state.targeterParams[param] = value;
                break;
            case 'triggerParam':
                this.state.triggerParams[param] = value;
                break;
        }
        
        this.updatePreview();
    }
    
    /**
     * Update preview
     */
    updatePreview() {
        const preview = this.overlay.querySelector('.preview-code');
        if (preview) {
            const line = this.buildSkillLine();
            preview.innerHTML = `<code>${line || '- ...'}</code>`;
        }
    }
    
    /**
     * Build the skill line from current state
     */
    buildSkillLine() {
        let line = '- ';
        
        if (!this.state.mechanic) {
            return '';
        }
        
        // Mechanic
        line += this.state.mechanic;
        
        // Mechanic params
        const mParams = this.buildParams(this.state.mechanicParams);
        if (mParams) {
            line += `{${mParams}}`;
        }
        
        // Targeter
        if (this.state.targeter) {
            line += ` @${this.state.targeter}`;
            const tParams = this.buildParams(this.state.targeterParams);
            if (tParams) {
                line += `{${tParams}}`;
            }
        }
        
        // Trigger
        if (this.state.trigger) {
            line += ` ~${this.state.trigger}`;
            const trParams = this.buildParams(this.state.triggerParams);
            if (trParams) {
                line += `{${trParams}}`;
            }
        }
        
        // Conditions
        this.state.conditions.forEach(c => {
            line += ` ?${c.name}`;
            if (c.params) {
                line += `{${c.params}}`;
            }
        });
        
        // Common modifiers
        const modParts = [];
        if (this.state.modifiers.repeat) {
            modParts.push(`repeat=${this.state.modifiers.repeat}`);
        }
        if (this.state.modifiers.repeatInterval) {
            modParts.push(`repeatInterval=${this.state.modifiers.repeatInterval}`);
        }
        if (this.state.modifiers.delay) {
            modParts.push(`delay=${this.state.modifiers.delay}`);
        }
        
        if (modParts.length > 0) {
            // Add to mechanic params
            const existingParams = this.buildParams(this.state.mechanicParams);
            if (existingParams) {
                // Already has params, rebuild
            } else {
                line = line.replace(this.state.mechanic, `${this.state.mechanic}{${modParts.join(';')}}`);
            }
        }
        
        return line;
    }
    
    /**
     * Build params string from object
     */
    buildParams(params) {
        const parts = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== '' && value !== null && value !== undefined) {
                parts.push(`${key}=${value}`);
            }
        }
        return parts.join(';');
    }
    
    /**
     * Complete the wizard
     */
    complete() {
        const skillLine = this.buildSkillLine();
        
        if (this.onComplete && skillLine) {
            this.onComplete(skillLine);
        }
        
        // Also try to add to skill builder if open
        if (window.skillLineBuilder && typeof window.skillLineBuilder.addToQueue === 'function') {
            window.skillLineBuilder.addToQueue({
                mechanic: this.state.mechanic,
                targeter: this.state.targeter,
                trigger: this.state.trigger,
                conditions: this.state.conditions,
                params: this.state.mechanicParams,
                preview: skillLine
            });
        }
        
        this.close();
        
        // Show success notification
        if (window.editor && window.editor.showNotification) {
            window.editor.showNotification('Skill line added successfully!', 'success');
        }
    }
    
    /**
     * Destroy the wizard
     */
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileSkillWizard;
}

// Make available globally
window.MobileSkillWizard = MobileSkillWizard;
