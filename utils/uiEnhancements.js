/**
 * UI Enhancements Utility
 * Provides skeleton loading, progress bars, animations, and character counters
 */

const UIEnhancements = {
    // ==========================================
    // Skeleton Loading
    // ==========================================
    
    /**
     * Create a skeleton placeholder element
     * @param {string} type - 'text', 'title', 'subtitle', 'input', 'button', 'card', 'avatar'
     * @param {object} options - Additional options like width, height
     * @returns {HTMLElement}
     */
    createSkeleton(type = 'text', options = {}) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        
        switch (type) {
            case 'text':
                skeleton.classList.add('skeleton-text');
                if (options.width) skeleton.style.width = options.width;
                break;
            case 'title':
                skeleton.classList.add('skeleton-text', 'skeleton-title');
                break;
            case 'subtitle':
                skeleton.classList.add('skeleton-text', 'skeleton-subtitle');
                break;
            case 'input':
                skeleton.classList.add('skeleton-input');
                break;
            case 'button':
                skeleton.classList.add('skeleton-button');
                if (options.width) skeleton.style.width = options.width;
                break;
            case 'card':
                skeleton.classList.add('skeleton-card');
                if (options.height) skeleton.style.height = options.height;
                break;
            case 'avatar':
                skeleton.classList.add('skeleton-avatar');
                if (options.size) {
                    skeleton.style.width = options.size;
                    skeleton.style.height = options.size;
                }
                break;
        }
        
        return skeleton;
    },
    
    /**
     * Replace element with skeleton placeholder
     * @param {HTMLElement} element - Element to replace
     * @param {string} type - Skeleton type
     * @returns {HTMLElement} The skeleton element
     */
    showSkeleton(element, type = 'text') {
        const skeleton = this.createSkeleton(type, {
            width: element.offsetWidth + 'px',
            height: element.offsetHeight + 'px'
        });
        skeleton.dataset.originalElement = element.outerHTML;
        element.parentNode.replaceChild(skeleton, element);
        return skeleton;
    },
    
    /**
     * Replace skeleton with original or new content
     * @param {HTMLElement} skeleton - Skeleton element
     * @param {HTMLElement|string} content - New content
     */
    hideSkeleton(skeleton, content = null) {
        if (!skeleton.classList.contains('skeleton')) return;
        
        let newElement;
        if (content) {
            newElement = typeof content === 'string' 
                ? document.createRange().createContextualFragment(content).firstChild
                : content;
        } else if (skeleton.dataset.originalElement) {
            newElement = document.createRange()
                .createContextualFragment(skeleton.dataset.originalElement).firstChild;
        }
        
        if (newElement && skeleton.parentNode) {
            skeleton.parentNode.replaceChild(newElement, skeleton);
        }
    },
    
    // ==========================================
    // Progress Bar
    // ==========================================
    
    /**
     * Create a progress bar component
     * @param {object} options - Progress bar options
     * @returns {object} Progress bar controller
     */
    createProgressBar(options = {}) {
        const {
            label = '',
            showPercentage = true,
            animated = false,
            indeterminate = false
        } = options;
        
        const container = document.createElement('div');
        container.className = 'progress-with-label';
        
        if (label || showPercentage) {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'progress-label';
            
            const labelText = document.createElement('span');
            labelText.textContent = label;
            labelDiv.appendChild(labelText);
            
            if (showPercentage && !indeterminate) {
                const percentage = document.createElement('span');
                percentage.className = 'progress-percentage';
                percentage.textContent = '0%';
                labelDiv.appendChild(percentage);
            }
            
            container.appendChild(labelDiv);
        }
        
        const barContainer = document.createElement('div');
        barContainer.className = 'progress-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        if (animated) bar.classList.add('animated');
        if (indeterminate) bar.classList.add('progress-bar-indeterminate');
        else bar.style.width = '0%';
        
        barContainer.appendChild(bar);
        container.appendChild(barContainer);
        
        return {
            element: container,
            setProgress(value) {
                if (indeterminate) return;
                const percent = Math.max(0, Math.min(100, value));
                bar.style.width = `${percent}%`;
                const percentageEl = container.querySelector('.progress-percentage');
                if (percentageEl) {
                    percentageEl.textContent = `${Math.round(percent)}%`;
                }
            },
            setLabel(text) {
                const labelEl = container.querySelector('.progress-label span:first-child');
                if (labelEl) labelEl.textContent = text;
            },
            complete() {
                this.setProgress(100);
                bar.style.background = 'var(--success)';
            },
            error() {
                bar.style.background = 'var(--error)';
            },
            reset() {
                bar.style.width = '0%';
                bar.style.background = '';
                const percentageEl = container.querySelector('.progress-percentage');
                if (percentageEl) percentageEl.textContent = '0%';
            }
        };
    },
    
    // ==========================================
    // Animations
    // ==========================================
    
    /**
     * Show success animation on element
     * @param {HTMLElement} element - Target element
     * @param {number} duration - Animation duration in ms
     */
    showSuccess(element, duration = 2000) {
        element.classList.add('input-success');
        
        // Add checkmark icon if not already present
        const checkmark = document.createElement('span');
        checkmark.className = 'success-checkmark';
        checkmark.style.marginLeft = '8px';
        element.parentNode.insertBefore(checkmark, element.nextSibling);
        
        setTimeout(() => {
            element.classList.remove('input-success');
            checkmark.remove();
        }, duration);
    },
    
    /**
     * Show error shake animation
     * @param {HTMLElement} element - Target element
     */
    showError(element) {
        element.classList.add('shake-error', 'input-error');
        
        // Remove shake after animation completes
        setTimeout(() => {
            element.classList.remove('shake-error');
        }, 500);
        
        // Keep error state until user interaction
        const removeError = () => {
            element.classList.remove('input-error');
            element.removeEventListener('input', removeError);
            element.removeEventListener('focus', removeError);
        };
        element.addEventListener('input', removeError);
        element.addEventListener('focus', removeError);
    },
    
    /**
     * Pulse highlight effect
     * @param {HTMLElement} element - Target element
     * @param {number} duration - Duration in ms
     */
    pulseHighlight(element, duration = 2000) {
        element.classList.add('pulse-highlight');
        setTimeout(() => {
            element.classList.remove('pulse-highlight');
        }, duration);
    },
    
    // ==========================================
    // Character Counter
    // ==========================================
    
    /**
     * Add character counter to input/textarea
     * @param {HTMLInputElement|HTMLTextAreaElement} input - Input element
     * @param {object} options - Counter options
     */
    addCharCounter(input, options = {}) {
        const {
            maxLength = null,
            warningThreshold = 0.8,
            dangerThreshold = 0.95
        } = options;
        
        // Wrap input if not already wrapped
        let wrapper = input.parentElement;
        if (!wrapper.classList.contains('input-with-counter')) {
            wrapper = document.createElement('div');
            wrapper.className = 'input-with-counter';
            wrapper.style.position = 'relative';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
        }
        
        // Create counter element
        const counter = document.createElement('span');
        counter.className = 'char-counter';
        wrapper.appendChild(counter);
        
        const updateCounter = () => {
            const length = input.value.length;
            const max = maxLength || input.maxLength || 0;
            
            if (max > 0) {
                counter.textContent = `${length}/${max}`;
                const ratio = length / max;
                
                counter.classList.remove('warning', 'danger');
                if (ratio >= dangerThreshold) {
                    counter.classList.add('danger');
                } else if (ratio >= warningThreshold) {
                    counter.classList.add('warning');
                }
            } else {
                counter.textContent = length;
            }
        };
        
        input.addEventListener('input', updateCounter);
        updateCounter();
        
        return {
            update: updateCounter,
            remove() {
                counter.remove();
                input.removeEventListener('input', updateCounter);
            }
        };
    },
    
    // ==========================================
    // Tooltips
    // ==========================================
    
    /**
     * Add tooltip to element
     * @param {HTMLElement} element - Target element
     * @param {string} text - Tooltip text
     * @param {string} position - 'top', 'bottom', 'left', 'right'
     */
    addTooltip(element, text, position = 'top') {
        element.setAttribute('data-tooltip', text);
        if (position !== 'top') {
            element.setAttribute('data-tooltip-position', position);
        }
    },
    
    /**
     * Remove tooltip from element
     * @param {HTMLElement} element - Target element
     */
    removeTooltip(element) {
        element.removeAttribute('data-tooltip');
        element.removeAttribute('data-tooltip-position');
    },
    
    // ==========================================
    // Confirmation Dialog
    // ==========================================
    
    /**
     * Show enhanced confirmation dialog
     * @param {object} options - Dialog options
     * @returns {Promise<boolean>}
     */
    async confirm(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure you want to proceed?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            type = 'warning', // 'warning', 'danger', 'info'
            icon = null
        } = options;
        
        // Use NotificationModal if available
        if (window.showConfirmDialog) {
            return window.showConfirmDialog(message, title);
        }
        
        // Fallback to native confirm
        return window.confirm(`${title}\n\n${message}`);
    },
    
    // ==========================================
    // Modal Animations
    // ==========================================
    
    /**
     * Show modal with animation
     * @param {HTMLElement} modal - Modal element
     */
    showModal(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('overlay-enter');
        const content = modal.querySelector('.modal, .legal-modal, [class*="-modal"]');
        if (content) {
            content.classList.add('modal-enter');
        }
    },
    
    /**
     * Hide modal with animation
     * @param {HTMLElement} modal - Modal element
     * @returns {Promise<void>}
     */
    hideModal(modal) {
        return new Promise(resolve => {
            modal.classList.add('overlay-exit');
            const content = modal.querySelector('.modal, .legal-modal, [class*="-modal"]');
            if (content) {
                content.classList.add('modal-exit');
            }
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('overlay-enter', 'overlay-exit');
                if (content) {
                    content.classList.remove('modal-enter', 'modal-exit');
                }
                resolve();
            }, 200);
        });
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIEnhancements;
}

// Global export
window.UIEnhancements = UIEnhancements;
