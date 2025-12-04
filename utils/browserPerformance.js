/**
 * Browser Performance Utilities
 * Debouncing, throttling, virtual scrolling, and modal management
 * @version 1.0.0
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * Perfect for: search inputs, text fields, window resize
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - limits execution to once per wait time
 * Perfect for: scroll events, mouse move, window resize
 */
function throttle(func, wait = 16) {
    let inThrottle;
    let lastFunc;
    let lastRan;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            lastRan = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if ((Date.now() - lastRan) >= wait) {
                    func.apply(this, args);
                    lastRan = Date.now();
                }
            }, Math.max(wait - (Date.now() - lastRan), 0));
        }
    };
}

/**
 * RequestAnimationFrame wrapper for smooth 60fps rendering
 */
function scheduleRender(callback) {
    let rafId = null;
    
    return function(...args) {
        if (rafId !== null) {
            return;
        }
        
        rafId = requestAnimationFrame(() => {
            callback.apply(this, args);
            rafId = null;
        });
    };
}

/**
 * LRU Cache - Least Recently Used cache for search results
 * Stores last N queries to avoid recalculation
 */
class LRUCache {
    constructor(maxSize = 10) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    
    get(key) {
        if (!this.cache.has(key)) return null;
        
        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        
        return value;
    }
    
    set(key, value) {
        // Remove if exists (will re-add at end)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, value);
    }
    
    clear() {
        this.cache.clear();
    }
    
    has(key) {
        return this.cache.has(key);
    }
}

/**
 * Virtual Scroller - Render only visible items for performance
 * Reduces DOM nodes by 80-90% for large lists
 * Enhanced version with grid support and dynamic card heights
 */
class VirtualScroller {
    constructor(options = {}) {
        this.container = options.container;
        this.items = options.items || [];
        this.itemHeight = options.itemHeight || 150; // Increased for browser cards
        this.renderItem = options.renderItem;
        this.bufferSize = options.bufferSize || 10; // Increased buffer
        this.onScroll = options.onScroll || (() => {});
        this.isGrid = options.isGrid || false; // Support grid layouts
        this.itemsPerRow = options.itemsPerRow || 1;
        
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.scrollTop = 0;
        this.isInitialized = false;
        
        if (this.container && this.renderItem) {
            this.init();
        }
    }
    
    init() {
        // Store original display style (e.g., 'grid')
        const originalDisplay = window.getComputedStyle(this.container).display;
        
        // Create wrapper and spacer
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;
        
        this.content = document.createElement('div');
        this.content.style.position = 'absolute';
        this.content.style.top = '0';
        this.content.style.left = '0';
        this.content.style.right = '0';
        
        // Preserve grid layout if container uses it
        if (originalDisplay === 'grid') {
            // Copy grid styles from container to content
            const computedStyle = window.getComputedStyle(this.container);
            this.content.style.display = 'grid';
            this.content.style.gridTemplateColumns = computedStyle.gridTemplateColumns;
            this.content.style.gap = computedStyle.gap;
        }
        
        this.wrapper.appendChild(this.content);
        this.container.innerHTML = '';
        this.container.appendChild(this.wrapper);
        
        // Attach scroll listener with throttle
        this.handleScroll = throttle(() => this.update(), 16);
        this.container.addEventListener('scroll', this.handleScroll);
        
        // Mark as initialized
        this.isInitialized = true;
        
        // Initial render
        this.update();
    }
    
    update() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;
        
        // Calculate visible range
        this.visibleStart = Math.floor(scrollTop / this.itemHeight);
        this.visibleEnd = Math.ceil((scrollTop + containerHeight) / this.itemHeight);
        
        // Add buffer
        const start = Math.max(0, this.visibleStart - this.bufferSize);
        const end = Math.min(this.items.length, this.visibleEnd + this.bufferSize);
        
        // Render visible items
        this.render(start, end);
        
        // Callback
        this.onScroll({
            start: this.visibleStart,
            end: this.visibleEnd,
            total: this.items.length
        });
    }
    
    render(start, end) {
        const visibleItems = this.items.slice(start, end);
        
        // For grid layouts, don't use offset positioning - let CSS grid handle layout
        const useGridLayout = this.content.style.display === 'grid';
        let offsetY;
        
        if (!useGridLayout) {
            // For non-grid layouts, calculate offset
            if (this.isGrid) {
                const startRow = Math.floor(start / this.itemsPerRow);
                offsetY = startRow * this.itemHeight;
            } else {
                offsetY = start * this.itemHeight;
            }
        }
        
        // Update content position with hardware acceleration (only for non-grid)
        if (!useGridLayout && offsetY !== undefined) {
            this.content.style.transform = `translate3d(0, ${offsetY}px, 0)`;
        } else {
            this.content.style.transform = 'none';
        }
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = visibleItems.map((item, index) => 
            this.renderItem(item, start + index)
        ).join('');
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        this.content.innerHTML = '';
        this.content.appendChild(fragment);
    }
    
    setItems(items) {
        this.items = items;
        
        // Calculate total height based on layout
        if (this.isGrid) {
            const totalRows = Math.ceil(this.items.length / this.itemsPerRow);
            this.wrapper.style.height = `${totalRows * this.itemHeight}px`;
        } else {
            this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;
        }
        
        this.update();
    }
    
    scrollToIndex(index) {
        if (this.isGrid) {
            const row = Math.floor(index / this.itemsPerRow);
            this.container.scrollTop = row * this.itemHeight;
        } else {
            this.container.scrollTop = index * this.itemHeight;
        }
    }
    
    refresh() {
        if (this.isInitialized) {
            this.update();
        }
    }
    
    destroy() {
        if (this.container && this.handleScroll) {
            this.container.removeEventListener('scroll', this.handleScroll);
        }
        this.isInitialized = false;
    }
}

/**
 * Modal Manager - Handles nested modals with proper z-index management
 */
class ModalManager {
    constructor() {
        this.stack = [];
        this.baseZIndex = 10000;
        this.zIndexStep = 100;
    }
    
    /**
     * Push modal onto stack
     */
    push(modal) {
        // Minimize all current modals
        this.stack.forEach(m => {
            if (m.minimize) m.minimize();
        });
        
        // Add new modal
        this.stack.push(modal);
        
        // Set z-index
        const zIndex = this.baseZIndex + (this.stack.length * this.zIndexStep);
        if (modal.setZIndex) {
            modal.setZIndex(zIndex);
        } else if (modal.overlay) {
            modal.overlay.style.zIndex = zIndex;
        }
        
        console.log(`📚 Modal stack size: ${this.stack.length}, z-index: ${zIndex}`);
    }
    
    /**
     * Pop modal from stack
     */
    pop() {
        const modal = this.stack.pop();
        
        // Restore previous modal
        if (this.stack.length > 0) {
            const previous = this.stack[this.stack.length - 1];
            if (previous.restore) {
                setTimeout(() => previous.restore(), 100);
            }
        }
        
        console.log(`📚 Modal popped, stack size: ${this.stack.length}`);
        return modal;
    }
    
    /**
     * Clear all modals
     */
    clear() {
        this.stack.forEach(m => {
            if (m.close) m.close();
        });
        this.stack = [];
    }
    
    /**
     * Get current modal
     */
    current() {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }
    
    /**
     * Get z-index for next modal
     */
    getNextZIndex() {
        return this.baseZIndex + ((this.stack.length + 1) * this.zIndexStep);
    }
}

/**
 * Content Lazy Loader - Load content on demand with IntersectionObserver
 * Note: Main LazyLoader class is in utils/lazyLoader.js
 */
class ContentLazyLoader {
    constructor(options = {}) {
        this.rootMargin = options.rootMargin || '100px';
        this.threshold = options.threshold || 0.01;
        this.onLoad = options.onLoad || (() => {});
        
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                rootMargin: this.rootMargin,
                threshold: this.threshold
            }
        );
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.onLoad(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }
    
    observe(element) {
        this.observer.observe(element);
    }
    
    unobserve(element) {
        this.observer.unobserve(element);
    }
    
    disconnect() {
        this.observer.disconnect();
    }
}

/**
 * Event Delegator - Single event listener for multiple elements
 */
class EventDelegator {
    constructor(container) {
        this.container = container;
        this.handlers = new Map();
    }
    
    on(selector, eventType, handler) {
        const key = `${eventType}:${selector}`;
        
        if (!this.handlers.has(key)) {
            const delegatedHandler = (e) => {
                const target = e.target.closest(selector);
                if (target && this.container.contains(target)) {
                    handler.call(target, e, target);
                }
            };
            
            this.container.addEventListener(eventType, delegatedHandler);
            this.handlers.set(key, delegatedHandler);
        }
    }
    
    off(selector, eventType) {
        const key = `${eventType}:${selector}`;
        const handler = this.handlers.get(key);
        
        if (handler) {
            this.container.removeEventListener(eventType, handler);
            this.handlers.delete(key);
        }
    }
    
    clear() {
        this.handlers.forEach((handler, key) => {
            const [eventType] = key.split(':');
            this.container.removeEventListener(eventType, handler);
        });
        this.handlers.clear();
    }
}

// Global modal manager instance
const MODAL_MANAGER = new ModalManager();

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        scheduleRender,
        LRUCache,
        VirtualScroller,
        ModalManager,
        ContentLazyLoader,
        EventDelegator,
        MODAL_MANAGER
    };
}

console.log('✅ Browser Performance Utilities loaded');
