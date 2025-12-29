/**
 * Browser Singleton Manager
 * Manages singleton instances of browser components to prevent duplicate instances
 * and optimize memory usage
 */

class BrowserSingletonManager {
    constructor() {
        this.instances = new Map();
        this.initialized = false;
        this.dataPreloaded = false;
        this.preloadPromise = null;
        
        if (window.DEBUG_MODE) console.log('Browser Singleton Manager initialized');
    }
    
    /**
     * Preload all browser data in parallel (CRITICAL for performance)
     */
    async preloadAllData() {
        if (this.dataPreloaded) {
            return; // Already loaded
        }
        
        if (this.preloadPromise) {
            return this.preloadPromise; // Already loading
        }
        
        if (window.DEBUG_MODE) console.log('⚡ Preloading ALL browser data...');
        const start = performance.now();
        
        this.preloadPromise = (async () => {
            try {
                // Load all data in parallel for maximum speed
                const promises = [];
                
                // Check if BrowserDataMerger exists
                if (window.supabase && typeof BrowserDataMerger !== 'undefined') {
                    const merger = new BrowserDataMerger(window.supabase);
                    
                    // Load everything at once
                    promises.push(
                        merger.getMergedMechanics().catch(e => { console.warn('Mechanics preload failed:', e); return null; }),
                        merger.getMergedTargeters().catch(e => { console.warn('Targeters preload failed:', e); return null; }),
                        merger.getMergedConditions().catch(e => { console.warn('Conditions preload failed:', e); return null; }),
                        merger.getMergedTriggers().catch(e => { console.warn('Triggers preload failed:', e); return null; })
                    );
                    
                    const [mechanics, targeters, conditions, triggers] = await Promise.all(promises);
                    
                    // Cache the data globally for instant access
                    window.__CACHED_MECHANICS_DATA__ = mechanics || window.MECHANICS_DATA;
                    window.__CACHED_TARGETERS_DATA__ = targeters || window.TARGETERS_DATA;
                    window.__CACHED_CONDITIONS_DATA__ = conditions || window.ALL_CONDITIONS || [];
                    window.__CACHED_TRIGGERS_DATA__ = triggers || window.TRIGGERS_DATA;
                } else {
                    // Use built-in data
                    window.__CACHED_MECHANICS_DATA__ = window.MECHANICS_DATA;
                    window.__CACHED_TARGETERS_DATA__ = window.TARGETERS_DATA;
                    window.__CACHED_CONDITIONS_DATA__ = window.ALL_CONDITIONS || [];
                    window.__CACHED_TRIGGERS_DATA__ = window.TRIGGERS_DATA;
                }
                
                this.dataPreloaded = true;
                const duration = performance.now() - start;
                if (window.DEBUG_MODE) console.log(`✅ All browser data preloaded in ${duration.toFixed(2)}ms`);
            } catch (error) {
                console.error('❌ Data preload failed:', error);
                // Fallback to built-in data
                window.__CACHED_MECHANICS_DATA__ = window.MECHANICS_DATA;
                window.__CACHED_TARGETERS_DATA__ = window.TARGETERS_DATA;
                window.__CACHED_CONDITIONS_DATA__ = window.ALL_CONDITIONS || [];
                window.__CACHED_TRIGGERS_DATA__ = window.TRIGGERS_DATA;
                this.dataPreloaded = true;
            }
        })();
        
        return this.preloadPromise;
    }
    
    /**
     * Get or create mechanic browser singleton
     */
    getMechanicBrowser() {
        if (!this.instances.has('mechanic')) {
            if (window.DEBUG_MODE) console.log('🔨 Creating MechanicBrowser singleton...');
            
            // Ensure dependencies exist first
            const targeter = this.getTargeterBrowser();
            const trigger = this.getTriggerBrowser();
            
            if (typeof MechanicBrowser !== 'undefined') {
                this.instances.set('mechanic', new MechanicBrowser(targeter, trigger, null));
                
                // Register with performance monitor
                if (window.performanceMonitor) {
                    window.performanceMonitor.registerModal('mechanicBrowser', this.instances.get('mechanic'));
                }
            } else {
                console.error('❌ MechanicBrowser class not available');
                return null;
            }
        }
        return this.instances.get('mechanic');
    }
    
    /**
     * Get or create targeter browser singleton
     */
    getTargeterBrowser() {
        if (!this.instances.has('targeter')) {
            if (window.DEBUG_MODE) console.log('🎯 Creating TargeterBrowser singleton...');
            
            if (typeof TargeterBrowser !== 'undefined') {
                this.instances.set('targeter', new TargeterBrowser());
                
                // Register with performance monitor
                if (window.performanceMonitor) {
                    window.performanceMonitor.registerModal('targeterBrowser', this.instances.get('targeter'));
                }
            } else {
                console.error('❌ TargeterBrowser class not available');
                return null;
            }
        }
        return this.instances.get('targeter');
    }
    
    /**
     * Get or create condition browser singleton
     */
    getConditionBrowser() {
        if (!this.instances.has('condition')) {
            if (window.DEBUG_MODE) console.log('❓ Creating ConditionBrowser singleton...');
            
            if (typeof ConditionBrowser !== 'undefined') {
                this.instances.set('condition', new ConditionBrowser());
                
                // Set as global for backward compatibility
                window.conditionBrowser = this.instances.get('condition');
                
                // Register with performance monitor
                if (window.performanceMonitor) {
                    window.performanceMonitor.registerModal('conditionBrowser', this.instances.get('condition'));
                }
            } else {
                console.error('❌ ConditionBrowser class not available');
                return null;
            }
        }
        return this.instances.get('condition');
    }
    
    /**
     * Get or create trigger browser singleton
     */
    getTriggerBrowser() {
        if (!this.instances.has('trigger')) {
            if (window.DEBUG_MODE) console.log('⚡ Creating TriggerBrowser singleton...');
            
            if (typeof TriggerBrowser !== 'undefined') {
                this.instances.set('trigger', new TriggerBrowser(window.editor));
                
                // Register with performance monitor
                if (window.performanceMonitor) {
                    window.performanceMonitor.registerModal('triggerBrowser', this.instances.get('trigger'));
                }
            } else {
                console.warn('⚠️ TriggerBrowser class not available (OK for skill context)');
                return null;
            }
        }
        return this.instances.get('trigger');
    }
    
    /**
     * Get or create skill browser singleton
     */
    getSkillBrowser() {
        if (!this.instances.has('skill')) {
            if (window.DEBUG_MODE) console.log('🎪 Creating SkillBrowser singleton...');
            
            if (typeof SkillBrowser !== 'undefined') {
                this.instances.set('skill', new SkillBrowser());
                
                // Register with performance monitor
                if (window.performanceMonitor) {
                    window.performanceMonitor.registerModal('skillBrowser', this.instances.get('skill'));
                }
            } else {
                console.error('❌ SkillBrowser class not available');
                return null;
            }
        }
        return this.instances.get('skill');
    }
    
    /**
     * Initialize all browser singletons (warm cache)
     */
    async initializeAll() {
        if (this.initialized) {
            if (window.DEBUG_MODE) console.log('✅ Browsers already initialized');
            return;
        }
        
        if (window.DEBUG_MODE) console.log('🚀 Initializing all browser singletons...');
        const start = performance.now();
        
        // CRITICAL: Preload data FIRST before creating browsers
        await this.preloadAllData();
        
        // Initialize in dependency order
        this.getTargeterBrowser();
        this.getTriggerBrowser();
        this.getMechanicBrowser();
        this.getConditionBrowser();
        this.getSkillBrowser();
        
        this.initialized = true;
        
        const duration = performance.now() - start;
        if (window.DEBUG_MODE) console.log(`✅ All browsers initialized in ${duration.toFixed(2)}ms`);
        
        return this.instances;
    }
    
    /**
     * Cleanup and destroy a specific browser
     */
    destroyBrowser(type) {
        const instance = this.instances.get(type);
        if (instance) {
            if (window.DEBUG_MODE) console.log(`🗑️ Destroying ${type} browser...`);
            
            // Call destroy method if it exists
            if (typeof instance.destroy === 'function') {
                instance.destroy();
            } else if (typeof instance.cleanup === 'function') {
                instance.cleanup();
            }
            
            // Unregister from performance monitor
            if (window.performanceMonitor) {
                window.performanceMonitor.unregisterModal(`${type}Browser`);
            }
            
            this.instances.delete(type);
        }
    }
    
    /**
     * Cleanup and destroy all browsers
     */
    destroyAll() {
        if (window.DEBUG_MODE) console.log('Destroying all browser singletons...');
        
        for (const [type] of this.instances) {
            this.destroyBrowser(type);
        }
        
        this.initialized = false;
        if (window.DEBUG_MODE) console.log('All browsers destroyed');
    }
    
    /**
     * Get status report
     */
    getStatus() {
        return {
            initialized: this.initialized,
            instances: Array.from(this.instances.keys()),
            count: this.instances.size
        };
    }
    
    /**
     * Log status to console
     */
    logStatus() {
        const status = this.getStatus();
        console.table(status);
        return status;
    }
}

// Create global singleton manager instance
if (typeof window !== 'undefined') {
    window.browserManager = new BrowserSingletonManager();
    
    // SMART: Wait for Supabase to be ready (or timeout after 2s) before preloading
    const initializeBrowsers = async () => {
        // Wait for Supabase client to be available (max 2 seconds)
        let attempts = 0;
        const maxAttempts = 20; // 20 * 100ms = 2 seconds
        
        while (!window.supabase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabase && window.DEBUG_MODE) {
            console.warn('⚠️ Supabase not available after 2s, using built-in data only');
        }
        
        // Now start preloading with Supabase available (or timeout)
        if (window.DEBUG_MODE) console.log('⚡ Starting browser data preload...');
        try {
            await window.browserManager.preloadAllData();
            if (window.DEBUG_MODE) console.log('✅ Browser data ready - initializing singletons...');
            await window.browserManager.initializeAll();
            if (window.DEBUG_MODE) console.log('✅ All browsers ready for instant opening!');
        } catch (error) {
            console.error('❌ Browser initialization error:', error);
        }
    };
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeBrowsers);
    } else {
        // DOM already loaded
        initializeBrowsers();
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserSingletonManager;
}
