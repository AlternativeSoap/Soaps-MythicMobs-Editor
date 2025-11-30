/**
 * VirtualScrollManager - Efficient rendering for large lists
 * Only renders visible items plus a buffer, dramatically improving performance
 */
class VirtualScrollManager {
    constructor(options = {}) {
        this.itemHeight = options.itemHeight || 60; // Height of each item in pixels
        this.bufferSize = options.bufferSize || 5; // Extra items to render above/below
        this.container = null;
        this.scrollContainer = null;
        this.items = [];
        this.renderCallback = null;
        
        this.visibleRange = { start: 0, end: 0 };
        this.scrollTop = 0;
        this.containerHeight = 0;
        
        this.isEnabled = true;
        this.minItemsForVirtualization = options.minItemsForVirtualization || 50;
    }
    
    /**
     * Initialize virtual scrolling
     * @param {HTMLElement} scrollContainer - Container that handles scrolling
     * @param {HTMLElement} itemContainer - Container where items are rendered
     * @param {Array} items - Array of items to render
     * @param {Function} renderCallback - Function to render each item (index, item) => HTML
     */
    initialize(scrollContainer, itemContainer, items, renderCallback) {
        this.scrollContainer = scrollContainer;
        this.container = itemContainer;
        this.items = items;
        this.renderCallback = renderCallback;
        
        // Only enable virtual scrolling if there are enough items
        if (items.length < this.minItemsForVirtualization) {
            this.isEnabled = false;
            this.renderAllItems();
            return;
        }
        
        this.isEnabled = true;
        this.setupScrollListener();
        this.updateContainerHeight();
        this.calculateVisibleRange();
        this.render();
    }
    
    /**
     * Setup scroll event listener with throttling
     */
    setupScrollListener() {
        if (!this.scrollContainer) return;
        
        let ticking = false;
        
        this.scrollContainer.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', this.throttle(() => {
            this.handleResize();
        }, 200));
    }
    
    /**
     * Handle scroll event
     */
    handleScroll() {
        if (!this.isEnabled) return;
        
        const newScrollTop = this.scrollContainer.scrollTop;
        
        // Only re-render if scroll position changed significantly
        if (Math.abs(newScrollTop - this.scrollTop) > this.itemHeight) {
            this.scrollTop = newScrollTop;
            this.calculateVisibleRange();
            this.render();
        }
    }
    
    /**
     * Handle resize event
     */
    handleResize() {
        if (!this.isEnabled) return;
        
        this.containerHeight = this.scrollContainer.clientHeight;
        this.calculateVisibleRange();
        this.render();
    }
    
    /**
     * Calculate which items are visible
     */
    calculateVisibleRange() {
        this.containerHeight = this.scrollContainer.clientHeight;
        this.scrollTop = this.scrollContainer.scrollTop;
        
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
        
        // Add buffer to prevent flickering during scroll
        this.visibleRange = {
            start: Math.max(0, startIndex - this.bufferSize),
            end: Math.min(this.items.length, startIndex + visibleCount + this.bufferSize)
        };
    }
    
    /**
     * Update container height to enable scrolling
     */
    updateContainerHeight() {
        if (!this.container) return;
        
        const totalHeight = this.items.length * this.itemHeight;
        this.container.style.height = `${totalHeight}px`;
        this.container.style.position = 'relative';
    }
    
    /**
     * Render visible items
     */
    render() {
        if (!this.isEnabled || !this.container || !this.renderCallback) {
            return;
        }
        
        const { start, end } = this.visibleRange;
        const fragment = document.createDocumentFragment();
        
        // Render only visible items
        for (let i = start; i < end; i++) {
            const item = this.items[i];
            const itemElement = this.createItemElement(i, item);
            fragment.appendChild(itemElement);
        }
        
        // Clear and append new items
        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }
    
    /**
     * Create item element with proper positioning
     * @param {number} index - Item index
     * @param {*} item - Item data
     * @returns {HTMLElement}
     */
    createItemElement(index, item) {
        const wrapper = document.createElement('div');
        wrapper.className = 'virtual-scroll-item';
        wrapper.style.position = 'absolute';
        wrapper.style.top = `${index * this.itemHeight}px`;
        wrapper.style.left = '0';
        wrapper.style.right = '0';
        wrapper.style.height = `${this.itemHeight}px`;
        wrapper.dataset.index = index;
        
        // Call render callback to get item content
        const content = this.renderCallback(index, item);
        
        if (typeof content === 'string') {
            wrapper.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            wrapper.appendChild(content);
        }
        
        return wrapper;
    }
    
    /**
     * Render all items (fallback for small lists)
     */
    renderAllItems() {
        if (!this.container || !this.renderCallback) return;
        
        const fragment = document.createDocumentFragment();
        
        this.items.forEach((item, index) => {
            const content = this.renderCallback(index, item);
            
            if (typeof content === 'string') {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = content;
                fragment.appendChild(wrapper.firstChild);
            } else if (content instanceof HTMLElement) {
                fragment.appendChild(content);
            }
        });
        
        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }
    
    /**
     * Update items and re-render
     * @param {Array} newItems - New items array
     */
    updateItems(newItems) {
        this.items = newItems;
        
        // Check if virtualization should be enabled/disabled
        const shouldEnable = newItems.length >= this.minItemsForVirtualization;
        
        if (shouldEnable !== this.isEnabled) {
            this.isEnabled = shouldEnable;
        }
        
        if (this.isEnabled) {
            this.updateContainerHeight();
            this.calculateVisibleRange();
            this.render();
        } else {
            this.renderAllItems();
        }
    }
    
    /**
     * Scroll to specific item
     * @param {number} index - Item index
     * @param {string} behavior - Scroll behavior ('smooth' or 'auto')
     */
    scrollToItem(index, behavior = 'smooth') {
        if (!this.scrollContainer) return;
        
        const targetScrollTop = index * this.itemHeight;
        
        this.scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: behavior
        });
    }
    
    /**
     * Get item at index
     * @param {number} index - Item index
     * @returns {*}
     */
    getItem(index) {
        return this.items[index];
    }
    
    /**
     * Get total item count
     * @returns {number}
     */
    getItemCount() {
        return this.items.length;
    }
    
    /**
     * Check if virtualization is active
     * @returns {boolean}
     */
    isVirtualized() {
        return this.isEnabled;
    }
    
    /**
     * Destroy virtual scroll manager
     */
    destroy() {
        if (this.container) {
            this.container.style.height = '';
            this.container.style.position = '';
        }
        
        this.container = null;
        this.scrollContainer = null;
        this.items = [];
        this.renderCallback = null;
    }
    
    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function}
     */
    throttle(func, delay) {
        let timeoutId;
        let lastRan;
        
        return function(...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if ((Date.now() - lastRan) >= delay) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, delay - (Date.now() - lastRan));
            }
        };
    }
}
