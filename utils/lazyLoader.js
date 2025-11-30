/**
 * LazyLoader - Lazy load components and resources on demand
 * Reduces initial load time by deferring non-critical resources
 */
class LazyLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.observers = new Map();
    }
    
    /**
     * Lazy load a JavaScript module
     * @param {string} modulePath - Path to the module
     * @param {string} moduleName - Name of the module (for caching)
     * @returns {Promise}
     */
    async loadModule(modulePath, moduleName) {
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }
        
        // Return existing promise if currently loading
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }
        
        // Create loading promise
        const loadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = modulePath;
            script.async = true;
            
            script.onload = () => {
                const module = window[moduleName];
                this.loadedModules.set(moduleName, module);
                this.loadingPromises.delete(moduleName);
                resolve(module);
            };
            
            script.onerror = () => {
                this.loadingPromises.delete(moduleName);
                reject(new Error(`Failed to load module: ${modulePath}`));
            };
            
            document.head.appendChild(script);
        });
        
        this.loadingPromises.set(moduleName, loadingPromise);
        return loadingPromise;
    }
    
    /**
     * Lazy load CSS file
     * @param {string} cssPath - Path to the CSS file
     * @returns {Promise}
     */
    async loadCSS(cssPath) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Lazy load an image
     * @param {string} imagePath - Path to the image
     * @returns {Promise<HTMLImageElement>}
     */
    async loadImage(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
            img.src = imagePath;
        });
    }
    
    /**
     * Lazy load component when element becomes visible
     * @param {HTMLElement} element - Element to observe
     * @param {Function} loader - Async function to load component
     * @param {Object} options - IntersectionObserver options
     * @returns {Promise}
     */
    lazyLoadOnVisible(element, loader, options = {}) {
        return new Promise((resolve) => {
            const defaultOptions = {
                root: null,
                rootMargin: '50px',
                threshold: 0.01
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(async (entry) => {
                    if (entry.isIntersecting) {
                        observer.disconnect();
                        const component = await loader();
                        resolve(component);
                    }
                });
            }, { ...defaultOptions, ...options });
            
            observer.observe(element);
            this.observers.set(element, observer);
        });
    }
    
    /**
     * Lazy load component on user interaction
     * @param {HTMLElement} element - Element that triggers loading
     * @param {string} event - Event type (click, hover, focus, etc.)
     * @param {Function} loader - Async function to load component
     * @returns {Promise}
     */
    lazyLoadOnInteraction(element, event, loader) {
        return new Promise((resolve) => {
            const handler = async () => {
                element.removeEventListener(event, handler);
                const component = await loader();
                resolve(component);
            };
            
            element.addEventListener(event, handler, { once: true });
        });
    }
    
    /**
     * Lazy load component after a delay
     * @param {Function} loader - Async function to load component
     * @param {number} delay - Delay in milliseconds
     * @returns {Promise}
     */
    lazyLoadDelayed(loader, delay = 1000) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                const component = await loader();
                resolve(component);
            }, delay);
        });
    }
    
    /**
     * Lazy load component when browser is idle
     * @param {Function} loader - Async function to load component
     * @param {Object} options - Options for requestIdleCallback
     * @returns {Promise}
     */
    lazyLoadOnIdle(loader, options = {}) {
        return new Promise((resolve) => {
            const loadWhenIdle = async () => {
                const component = await loader();
                resolve(component);
            };
            
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadWhenIdle, options);
            } else {
                setTimeout(loadWhenIdle, 1);
            }
        });
    }
    
    /**
     * Preload resources for faster access later
     * @param {Array} resources - Array of resource objects { type, path }
     */
    preload(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.path;
            
            if (resource.type === 'script') {
                link.as = 'script';
            } else if (resource.type === 'style') {
                link.as = 'style';
            } else if (resource.type === 'image') {
                link.as = 'image';
            } else if (resource.type === 'font') {
                link.as = 'font';
                link.crossOrigin = 'anonymous';
            }
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Prefetch resources for potential future use
     * @param {Array} resources - Array of resource paths
     */
    prefetch(resources) {
        resources.forEach(path => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = path;
            document.head.appendChild(link);
        });
    }
    
    /**
     * Create a lazy-loaded placeholder element
     * @param {string} componentName - Name of component to load
     * @param {Function} loader - Async function to load component
     * @param {string} placeholderHTML - HTML to show while loading
     * @returns {HTMLElement}
     */
    createLazyPlaceholder(componentName, loader, placeholderHTML = '') {
        const wrapper = document.createElement('div');
        wrapper.className = 'lazy-component-wrapper';
        wrapper.dataset.component = componentName;
        wrapper.innerHTML = placeholderHTML || `
            <div class="lazy-loading-placeholder">
                <div class="spinner"></div>
                <span>Loading ${componentName}...</span>
            </div>
        `;
        
        // Load component when visible
        this.lazyLoadOnVisible(wrapper, async () => {
            const component = await loader();
            wrapper.innerHTML = '';
            
            if (typeof component === 'string') {
                wrapper.innerHTML = component;
            } else if (component instanceof HTMLElement) {
                wrapper.appendChild(component);
            } else if (typeof component === 'function') {
                const result = component();
                if (typeof result === 'string') {
                    wrapper.innerHTML = result;
                } else if (result instanceof HTMLElement) {
                    wrapper.appendChild(result);
                }
            }
            
            return component;
        });
        
        return wrapper;
    }
    
    /**
     * Check if module is loaded
     * @param {string} moduleName - Module name
     * @returns {boolean}
     */
    isLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }
    
    /**
     * Get loaded module
     * @param {string} moduleName - Module name
     * @returns {*}
     */
    getModule(moduleName) {
        return this.loadedModules.get(moduleName);
    }
    
    /**
     * Unload module (useful for memory management)
     * @param {string} moduleName - Module name
     */
    unloadModule(moduleName) {
        this.loadedModules.delete(moduleName);
    }
    
    /**
     * Disconnect all observers
     */
    disconnectAllObservers() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
    
    /**
     * Clear all loaded modules and observers
     */
    clear() {
        this.loadedModules.clear();
        this.loadingPromises.clear();
        this.disconnectAllObservers();
    }
}

// Create global instance
window.lazyLoader = window.lazyLoader || new LazyLoader();
