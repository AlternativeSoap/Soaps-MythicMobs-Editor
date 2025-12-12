/**
 * OnboardingTour - Interactive guided tour for new users
 * Provides step-by-step introduction to editor features
 */
class OnboardingTour {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.tooltip = null;
        this.isActive = false;
        this.hasCompleted = false;
        
        // Check if tour has been completed before
        this.hasCompleted = localStorage.getItem('onboarding-completed') === 'true';
        
        this.initializeSteps();
    }
    
    /**
     * Initialize tour steps
     */
    initializeSteps() {
        this.steps = [
            {
                title: 'Welcome to MythicMobs Editor! 👋',
                description: 'Let\'s take a quick tour to help you get started. This will only take a minute.',
                target: null, // No specific target, center screen
                position: 'center',
                showSkip: true,
                icon: 'fa-wand-magic-sparkles'
            },
            {
                title: 'File Browser',
                description: 'Browse and manage your MythicMobs configuration files here. You can create, edit, and organize mobs, skills, items, and more.',
                target: '.file-browser',
                position: 'right',
                icon: 'fa-folder-tree'
            },
            {
                title: 'Editor Area',
                description: 'This is where the magic happens! Edit your YAML files with syntax highlighting, autocomplete, and real-time validation.',
                target: '.editor-container',
                position: 'left',
                icon: 'fa-code'
            },
            {
                title: 'Skill Lines',
                description: 'For skills, you can add mechanics line by line. Each line gets syntax highlighting, validation, and quick-edit capabilities.',
                target: '.skill-lines-section',
                position: 'top',
                icon: 'fa-list-check',
                condition: () => document.querySelector('.skill-lines-section') !== null
            },
            {
                title: 'Smart Autocomplete',
                description: 'Start typing and get intelligent suggestions for mechanics, attributes, targeters, and more. Press Tab or Enter to accept.',
                target: '.skill-line-input',
                position: 'bottom',
                icon: 'fa-lightbulb',
                condition: () => document.querySelector('.skill-line-input') !== null
            },
            {
                title: 'Quick Actions',
                description: 'Use these buttons to format, validate, and analyze your skill lines. Hover over any line to see quick-edit options.',
                target: '.skill-actions',
                position: 'bottom',
                icon: 'fa-bolt',
                condition: () => document.querySelector('.skill-actions') !== null
            },
            {
                title: 'Analysis Panel',
                description: 'Get insights about your skills with pattern recognition, optimization suggestions, and complexity analysis.',
                target: '.toggle-analysis-btn',
                position: 'left',
                icon: 'fa-chart-line',
                condition: () => document.querySelector('.toggle-analysis-btn') !== null
            },
            {
                title: 'Validation Panel',
                description: 'Check for errors and warnings in your configuration. The editor validates your code in real-time.',
                target: '.toggle-validation-btn',
                position: 'left',
                icon: 'fa-circle-check',
                condition: () => document.querySelector('.toggle-validation-btn') !== null
            },
            {
                title: 'Keyboard Shortcuts',
                description: 'Power users rejoice! Use Ctrl+S to save, Ctrl+F to format, and many more. Press F1 anytime to see all shortcuts.',
                target: null,
                position: 'center',
                icon: 'fa-keyboard',
                highlight: 'F1'
            },
            {
                title: 'All Set! 🎉',
                description: 'You\'re ready to create amazing MythicMobs content! You can restart this tour anytime from the Help menu.',
                target: null,
                position: 'center',
                showDontShowAgain: true,
                icon: 'fa-trophy'
            }
        ];
    }
    
    /**
     * Start the tour
     * @param {boolean} force - Force start even if completed before
     */
    start(force = false) {
        if (this.hasCompleted && !force) {
            return;
        }
        
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(0);
    }
    
    /**
     * Create overlay elements
     */
    createOverlay() {
        // Create overlay backdrop
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        document.body.appendChild(this.overlay);
        
        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        document.body.appendChild(this.tooltip);
        
        // Add click handler to overlay to advance or close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.skip();
            }
        });
    }
    
    /**
     * Show a specific step
     * @param {number} index - Step index
     */
    showStep(index) {
        // Check if step index is valid
        if (index < 0 || index >= this.steps.length) {
            this.end();
            return;
        }
        
        const step = this.steps[index];
        
        // Check step condition
        if (step.condition && !step.condition()) {
            // Skip this step if condition is not met
            if (index < this.currentStep) {
                this.showStep(index - 1);
            } else {
                this.showStep(index + 1);
            }
            return;
        }
        
        this.currentStep = index;
        
        // Update spotlight
        this.updateSpotlight(step.target);
        
        // Update tooltip
        this.updateTooltip(step);
        
        // Scroll target into view if needed
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    /**
     * Update spotlight to highlight target element
     * @param {string} targetSelector - CSS selector for target element
     */
    updateSpotlight(targetSelector) {
        // Remove existing spotlight
        const existingSpotlight = document.querySelector('.onboarding-spotlight');
        if (existingSpotlight) {
            existingSpotlight.remove();
        }
        
        if (!targetSelector) {
            this.overlay.style.background = 'rgba(0, 0, 0, 0.85)';
            return;
        }
        
        const targetEl = document.querySelector(targetSelector);
        if (!targetEl) {
            this.overlay.style.background = 'rgba(0, 0, 0, 0.85)';
            return;
        }
        
        // Create spotlight element
        const spotlight = document.createElement('div');
        spotlight.className = 'onboarding-spotlight';
        document.body.appendChild(spotlight);
        
        // Position spotlight over target
        const rect = targetEl.getBoundingClientRect();
        const padding = 10;
        
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;
        
        // Update overlay with cutout
        this.overlay.style.background = 'rgba(0, 0, 0, 0.85)';
    }
    
    /**
     * Update tooltip content and position
     * @param {Object} step - Step configuration
     */
    updateTooltip(step) {
        // Build tooltip HTML
        const progressDots = this.steps
            .map((_, i) => `<span class="progress-dot ${i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : ''}"></span>`)
            .join('');
        
        const navigationHTML = `
            <div class="tooltip-navigation">
                <button class="nav-btn prev-btn" ${this.currentStep === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <div class="progress-dots">${progressDots}</div>
                <button class="nav-btn next-btn">
                    ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'} <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        const skipHTML = step.showSkip ? `
            <button class="skip-btn">
                <i class="fas fa-times"></i> Skip Tour
            </button>
        ` : '';
        
        const dontShowAgainHTML = step.showDontShowAgain ? `
            <label class="dont-show-again">
                <input type="checkbox" id="dont-show-again-checkbox">
                <span>Don't show this again</span>
            </label>
        ` : '';
        
        const highlightHTML = step.highlight ? `
            <div class="tooltip-highlight">
                <kbd>${step.highlight}</kbd>
            </div>
        ` : '';
        
        this.tooltip.innerHTML = `
            ${skipHTML}
            <div class="tooltip-header">
                <div class="tooltip-icon">
                    <i class="fas ${step.icon}"></i>
                </div>
                <h3>${step.title}</h3>
            </div>
            <div class="tooltip-body">
                <p>${step.description}</p>
                ${highlightHTML}
                ${dontShowAgainHTML}
            </div>
            ${navigationHTML}
        `;
        
        // Position tooltip
        this.positionTooltip(step.target, step.position);
        
        // Add event listeners
        this.attachTooltipListeners();
        
        // Animate tooltip in
        this.tooltip.classList.remove('fade-in');
        void this.tooltip.offsetWidth; // Trigger reflow
        this.tooltip.classList.add('fade-in');
    }
    
    /**
     * Position tooltip relative to target
     * @param {string} targetSelector - CSS selector for target element
     * @param {string} position - Position relative to target (top, bottom, left, right, center)
     */
    positionTooltip(targetSelector, position) {
        if (!targetSelector || position === 'center') {
            // Center on screen
            this.tooltip.style.left = '50%';
            this.tooltip.style.top = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const targetEl = document.querySelector(targetSelector);
        if (!targetEl) {
            // Fallback to center
            this.tooltip.style.left = '50%';
            this.tooltip.style.top = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const gap = 20;
        
        let left, top, transform;
        
        switch (position) {
            case 'top':
                left = rect.left + rect.width / 2;
                top = rect.top - gap;
                transform = 'translate(-50%, -100%)';
                break;
                
            case 'bottom':
                left = rect.left + rect.width / 2;
                top = rect.bottom + gap;
                transform = 'translate(-50%, 0)';
                break;
                
            case 'left':
                left = rect.left - gap;
                top = rect.top + rect.height / 2;
                transform = 'translate(-100%, -50%)';
                break;
                
            case 'right':
                left = rect.right + gap;
                top = rect.top + rect.height / 2;
                transform = 'translate(0, -50%)';
                break;
                
            default:
                left = rect.left + rect.width / 2;
                top = rect.bottom + gap;
                transform = 'translate(-50%, 0)';
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.transform = transform;
        
        // Add position class for arrow
        this.tooltip.className = `onboarding-tooltip position-${position}`;
    }
    
    /**
     * Attach event listeners to tooltip buttons
     */
    attachTooltipListeners() {
        const prevBtn = this.tooltip.querySelector('.prev-btn');
        const nextBtn = this.tooltip.querySelector('.next-btn');
        const skipBtn = this.tooltip.querySelector('.skip-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }
    }
    
    /**
     * Go to next step
     */
    next() {
        // Check if this is the last step
        if (this.currentStep === this.steps.length - 1) {
            // Check "don't show again" checkbox
            const checkbox = document.getElementById('dont-show-again-checkbox');
            if (checkbox && checkbox.checked) {
                this.markCompleted();
            }
            this.end();
        } else {
            this.showStep(this.currentStep + 1);
        }
    }
    
    /**
     * Go to previous step
     */
    previous() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    /**
     * Skip tour
     */
    async skip() {
        const confirmed = await window.editor.showConfirmDialog('Skip Tour', 'Are you sure you want to skip the tour? You can restart it anytime from the Help menu.', 'Skip', 'Continue Tour');
        if (confirmed) {
            this.end();
        }
    }
    
    /**
     * Mark tour as completed
     */
    markCompleted() {
        this.hasCompleted = true;
        localStorage.setItem('onboarding-completed', 'true');
    }
    
    /**
     * Reset tour completion status
     */
    reset() {
        this.hasCompleted = false;
        localStorage.removeItem('onboarding-completed');
    }
    
    /**
     * End tour
     */
    end() {
        this.isActive = false;
        
        // Remove overlay and tooltip with animation
        if (this.overlay) {
            this.overlay.classList.add('fade-out');
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.remove();
                }
                this.overlay = null;
            }, 300);
        }
        
        if (this.tooltip) {
            this.tooltip.classList.add('fade-out');
            setTimeout(() => {
                if (this.tooltip && this.tooltip.parentNode) {
                    this.tooltip.remove();
                }
                this.tooltip = null;
            }, 300);
        }
        
        // Remove spotlight
        const spotlight = document.querySelector('.onboarding-spotlight');
        if (spotlight) {
            spotlight.classList.add('fade-out');
            setTimeout(() => {
                if (spotlight && spotlight.parentNode) {
                    spotlight.remove();
                }
            }, 300);
        }
    }
    
    /**
     * Check if tour should auto-start
     * @returns {boolean}
     */
    shouldAutoStart() {
        return false; // Disabled auto-start to prevent UI overlap issues
    }
}
