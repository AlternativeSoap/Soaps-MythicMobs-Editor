/**
 * PerformanceUtils - Utilities for optimizing performance
 * Debouncing, throttling, and other performance helpers
 */
class PerformanceUtils {
    /**
     * Debounce function - delays execution until after wait time has elapsed since last call
     * Perfect for: text input, window resize, search queries
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute on leading edge instead of trailing
     * @returns {Function}
     */
    static debounce(func, wait = 300, immediate = false) {
        let timeout;
        
        return function executedFunction(...args) {
            const context = this;
            
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            
            const callNow = immediate && !timeout;
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func.apply(context, args);
        };
    }
    
    /**
     * Throttle function - ensures function is called at most once per wait period
     * Perfect for: scroll events, mouse movement, window resize
     * @param {Function} func - Function to throttle
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
    static throttle(func, wait = 100) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        
        return function(...args) {
            const context = this;
            
            if (!inThrottle) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= wait) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, Math.max(wait - (Date.now() - lastRan), 0));
            }
        };
    }
    
    /**
     * Request animation frame throttle - limits function calls to animation frame rate
     * Perfect for: animations, visual updates
     * @param {Function} func - Function to throttle
     * @returns {Function}
     */
    static rafThrottle(func) {
        let rafId = null;
        
        return function(...args) {
            if (rafId !== null) return;
            
            rafId = requestAnimationFrame(() => {
                func.apply(this, args);
                rafId = null;
            });
        };
    }
    
    /**
     * Batch DOM reads and writes for better performance
     * @param {Function} readFunc - Function that reads from DOM
     * @param {Function} writeFunc - Function that writes to DOM
     */
    static batchDOMOperations(readFunc, writeFunc) {
        requestAnimationFrame(() => {
            const readResults = readFunc();
            requestAnimationFrame(() => {
                writeFunc(readResults);
            });
        });
    }
    
    /**
     * Memoize function results with cache
     * Perfect for: expensive computations, repetitive calculations
     * @param {Function} func - Function to memoize
     * @param {Function} keyGenerator - Optional function to generate cache key
     * @returns {Function}
     */
    static memoize(func, keyGenerator = null) {
        const cache = new Map();
        
        return function(...args) {
            const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            const result = func.apply(this, args);
            cache.set(key, result);
            
            // Limit cache size to prevent memory leaks
            if (cache.size > 1000) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            
            return result;
        };
    }
    
    /**
     * Create a lazy loader for heavy components
     * @param {Function} loader - Async function that loads the component
     * @returns {Function}
     */
    static lazy(loader) {
        let cached = null;
        let loading = false;
        let promise = null;
        
        return async function() {
            if (cached) {
                return cached;
            }
            
            if (loading) {
                return promise;
            }
            
            loading = true;
            promise = loader();
            
            try {
                cached = await promise;
                return cached;
            } finally {
                loading = false;
            }
        };
    }
    
    /**
     * Measure performance of a function
     * @param {Function} func - Function to measure
     * @param {string} label - Label for console output
     * @returns {Function}
     */
    static measurePerformance(func, label = 'Function') {
        return function(...args) {
            const startTime = performance.now();
            const result = func.apply(this, args);
            const endTime = performance.now();
            
            console.log(`[Performance] ${label}: ${(endTime - startTime).toFixed(2)}ms`);
            
            return result;
        };
    }
    
    /**
     * Create a simple cache with TTL (time to live)
     * @param {number} ttl - Time to live in milliseconds
     * @returns {Object}
     */
    static createCache(ttl = 60000) {
        const cache = new Map();
        
        return {
            get(key) {
                const item = cache.get(key);
                
                if (!item) return null;
                
                if (Date.now() > item.expiry) {
                    cache.delete(key);
                    return null;
                }
                
                return item.value;
            },
            
            set(key, value) {
                cache.set(key, {
                    value: value,
                    expiry: Date.now() + ttl
                });
            },
            
            has(key) {
                return this.get(key) !== null;
            },
            
            delete(key) {
                cache.delete(key);
            },
            
            clear() {
                cache.clear();
            },
            
            size() {
                return cache.size;
            }
        };
    }
    
    /**
     * Chunk array processing to prevent UI blocking
     * @param {Array} array - Array to process
     * @param {Function} processor - Function to process each item
     * @param {number} chunkSize - Items to process per chunk
     * @returns {Promise}
     */
    static async processInChunks(array, processor, chunkSize = 100) {
        const results = [];
        
        for (let i = 0; i < array.length; i += chunkSize) {
            const chunk = array.slice(i, i + chunkSize);
            
            // Process chunk
            const chunkResults = chunk.map(processor);
            results.push(...chunkResults);
            
            // Yield to browser between chunks
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        return results;
    }
    
    /**
     * Detect if user prefers reduced motion
     * @returns {boolean}
     */
    static prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Get optimal animation duration based on user preferences
     * @param {number} defaultDuration - Default duration in ms
     * @returns {number}
     */
    static getAnimationDuration(defaultDuration = 300) {
        return this.prefersReducedMotion() ? 0 : defaultDuration;
    }
    
    /**
     * Observe element visibility for lazy loading
     * @param {HTMLElement} element - Element to observe
     * @param {Function} callback - Callback when element becomes visible
     * @param {Object} options - IntersectionObserver options
     * @returns {IntersectionObserver}
     */
    static observeVisibility(element, callback, options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                }
            });
        }, { ...defaultOptions, ...options });
        
        observer.observe(element);
        
        return observer;
    }
    
    /**
     * Schedule idle callback for low-priority tasks
     * @param {Function} callback - Task to run when idle
     * @param {Object} options - Options for requestIdleCallback
     */
    static scheduleIdleTask(callback, options = {}) {
        if ('requestIdleCallback' in window) {
            return requestIdleCallback(callback, options);
        } else {
            // Fallback for browsers without requestIdleCallback
            return setTimeout(callback, 1);
        }
    }
    
    /**
     * Cancel idle callback
     * @param {number} id - ID returned from scheduleIdleTask
     */
    static cancelIdleTask(id) {
        if ('cancelIdleCallback' in window) {
            cancelIdleCallback(id);
        } else {
            clearTimeout(id);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceUtils;
}
