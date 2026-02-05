/**
 * Performance Monitor Utility
 * Tracks DOM nodes, event listeners, and memory usage
 * For ongoing performance optimization
 */

class PerformanceMonitor {
    constructor() {
        this.enabled = localStorage.getItem('perf_monitor_enabled') === 'true' || false;
        this.metrics = {
            domNodes: 0,
            eventListeners: 0,
            modalsOpen: 0,
            cacheSize: 0,
            memoryUsage: 0
        };
        this.history = [];
        this.maxHistory = 100;
        
        // Track modal instances
        this.modalRegistry = new Map();
        
        // Track event listeners
        this.listenerRegistry = new WeakMap();
        this.listenerCount = 0;
        
        if (this.enabled) {
            this.startMonitoring();
        }
    }
    
    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('perf_monitor_enabled', enabled.toString());
        
        if (enabled) {
            this.startMonitoring();
        } else {
            this.stopMonitoring();
        }
    }
    
    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval) return;
        
        if (window.DEBUG_MODE) console.log('Performance Monitor enabled');
        
        // Sample metrics every 5 seconds
        this.monitoringInterval = setInterval(() => {
            if (document.hidden) return;
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => this.sample(), { timeout: 1000 });
            } else {
                setTimeout(() => this.sample(), 0);
            }
        }, 5000);
        
        // Initial sample
        this.sample();
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        if (window.DEBUG_MODE) console.log('Performance Monitor disabled');
    }
    
    /**
     * Take a snapshot of current metrics
     */
    sample() {
        const shouldCountDom = window.DEBUG_MODE || localStorage.getItem('perf_monitor_count_dom') === 'true';
        const snapshot = {
            timestamp: Date.now(),
            domNodes: shouldCountDom ? this.countDOMNodes() : this.metrics.domNodes,
            eventListeners: this.listenerCount,
            modalsOpen: this.modalRegistry.size,
            memory: this.getMemoryUsage()
        };
        
        this.history.push(snapshot);
        
        // Keep history size manageable
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        // Update current metrics
        this.metrics = {
            domNodes: snapshot.domNodes,
            eventListeners: snapshot.eventListeners,
            modalsOpen: snapshot.modalsOpen,
            memoryUsage: snapshot.memory
        };
        
        // Log if significant changes
        if (this.history.length > 1) {
            const prev = this.history[this.history.length - 2];
            const changes = {
                domNodes: snapshot.domNodes - prev.domNodes,
                listeners: snapshot.eventListeners - prev.eventListeners,
                modals: snapshot.modalsOpen - prev.modalsOpen
            };
            
            if (Math.abs(changes.domNodes) > 50 || Math.abs(changes.listeners) > 10) {
                if (window.DEBUG_MODE) console.log('Performance change detected:', {
                    'DOM Nodes': `${changes.domNodes > 0 ? '+' : ''}${changes.domNodes}`,
                    'Event Listeners': `${changes.listeners > 0 ? '+' : ''}${changes.listeners}`,
                    'Modals Open': changes.modals
                });
            }
        }
        
        return snapshot;
    }
    
    /**
     * Count total DOM nodes
     */
    countDOMNodes() {
        return document.getElementsByTagName('*').length;
    }
    
    /**
     * Get memory usage (if available)
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return null;
    }
    
    /**
     * Register a modal instance
     */
    registerModal(name, instance) {
        this.modalRegistry.set(name, {
            instance,
            createdAt: Date.now()
        });
    }
    
    /**
     * Unregister a modal instance
     */
    unregisterModal(name) {
        this.modalRegistry.delete(name);
    }
    
    /**
     * Track event listener addition
     */
    trackListener(element, event, handler) {
        this.listenerCount++;
        
        // Store in WeakMap for cleanup tracking
        if (!this.listenerRegistry.has(element)) {
            this.listenerRegistry.set(element, []);
        }
        this.listenerRegistry.get(element).push({ event, handler });
    }
    
    /**
     * Track event listener removal
     */
    untrackListener(element, event, handler) {
        this.listenerCount = Math.max(0, this.listenerCount - 1);
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            modals: Array.from(this.modalRegistry.keys())
        };
    }
    
    /**
     * Get performance report
     */
    getReport() {
        const latest = this.history[this.history.length - 1];
        const oldest = this.history[0];
        
        if (!latest || !oldest) {
            return 'No data available';
        }
        
        const duration = (latest.timestamp - oldest.timestamp) / 1000;
        const avgDOMNodes = this.history.reduce((sum, s) => sum + s.domNodes, 0) / this.history.length;
        const avgListeners = this.history.reduce((sum, s) => sum + s.eventListeners, 0) / this.history.length;
        const maxModals = Math.max(...this.history.map(s => s.modalsOpen));
        
        return {
            duration: `${duration.toFixed(1)}s`,
            samples: this.history.length,
            current: latest,
            averages: {
                domNodes: Math.round(avgDOMNodes),
                eventListeners: Math.round(avgListeners)
            },
            peaks: {
                domNodes: Math.max(...this.history.map(s => s.domNodes)),
                eventListeners: Math.max(...this.history.map(s => s.eventListeners)),
                modalsOpen: maxModals
            },
            memory: latest.memory
        };
    }
    
    /**
     * Log report to console
     */
    logReport() {
        const report = this.getReport();
        console.table(report);
        return report;
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.performanceMonitor = new PerformanceMonitor();
    
    // Expose utility functions
    window.enablePerfMonitor = () => window.performanceMonitor.setEnabled(true);
    window.disablePerfMonitor = () => window.performanceMonitor.setEnabled(false);
    window.perfReport = () => window.performanceMonitor.logReport();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
