/**
 * Device Performance Detector
 * Profiles device performance and provides adaptive settings
 * 
 * Features:
 * - Measures render times, FPS, memory usage
 * - Classifies device as slow/medium/fast
 * - Provides adaptive thresholds for features
 * - Monitors performance over time
 * - Stores profile in localStorage
 */
class DevicePerformanceDetector {
    constructor() {
        this.storageKey = 'device_performance_profile';
        this.profile = this.loadProfile();
        
        // Performance benchmarks
        this.benchmarks = {
            renderSamples: [],
            fpsSamples: [],
            memorySamples: []
        };
        
        // Device classification
        this.deviceClass = this.profile.deviceClass || null;
        
        // Thresholds for classification
        this.thresholds = {
            slow: {
                maxAvgRenderTime: 50,    // >50ms avg render = slow
                minAvgFPS: 30,            // <30 FPS = slow
                maxMemoryMB: 1024         // Low memory devices
            },
            medium: {
                maxAvgRenderTime: 20,    // 20-50ms = medium
                minAvgFPS: 45,            // 30-45 FPS = medium
                maxMemoryMB: 2048
            }
            // Everything else = fast
        };
        
        // Start monitoring if enabled
        if (this.profile.monitoringEnabled) {
            this.startMonitoring();
        }
    }
    
    /**
     * Load performance profile from localStorage
     */
    loadProfile() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load performance profile:', error);
        }
        
        return {
            deviceClass: null,
            avgRenderTime: null,
            avgFPS: null,
            availableMemoryMB: null,
            lastBenchmark: null,
            monitoringEnabled: true,
            adaptiveSettings: {}
        };
    }
    
    /**
     * Save performance profile to localStorage
     */
    saveProfile() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
        } catch (error) {
            console.warn('Failed to save performance profile:', error);
        }
    }
    
    /**
     * Run performance benchmark
     */
    async runBenchmark() {
        if (window.DEBUG_MODE) console.log('Running device performance benchmark...');
        
        const results = {
            renderTime: await this.benchmarkRenderTime(),
            fps: await this.benchmarkFPS(),
            memory: this.getAvailableMemory()
        };
        
        // Update profile
        this.profile.avgRenderTime = results.renderTime;
        this.profile.avgFPS = results.fps;
        this.profile.availableMemoryMB = results.memory;
        this.profile.lastBenchmark = Date.now();
        
        // Classify device
        this.deviceClass = this.classifyDevice(results);
        this.profile.deviceClass = this.deviceClass;
        
        // Generate adaptive settings
        this.profile.adaptiveSettings = this.generateAdaptiveSettings();
        
        this.saveProfile();
        
        if (window.DEBUG_MODE) console.log('Benchmark complete:', {
            deviceClass: this.deviceClass,
            renderTime: results.renderTime + 'ms',
            fps: results.fps,
            memory: results.memory + 'MB'
        });
        
        return this.profile;
    }
    
    /**
     * Benchmark render time
     */
    async benchmarkRenderTime() {
        const iterations = 10;
        const times = [];
        
        // Create a test DOM element
        const testElement = document.createElement('div');
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        document.body.appendChild(testElement);
        
        // Test render performance
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            // Simulate typical DOM update
            testElement.innerHTML = '';
            for (let j = 0; j < 100; j++) {
                const child = document.createElement('div');
                child.textContent = `Item ${j}`;
                child.className = 'test-item';
                testElement.appendChild(child);
            }
            
            // Force reflow
            testElement.offsetHeight;
            
            const end = performance.now();
            times.push(end - start);
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Cleanup
        document.body.removeChild(testElement);
        
        // Calculate average
        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
        return Math.round(avg * 100) / 100;
    }
    
    /**
     * Benchmark FPS
     */
    async benchmarkFPS() {
        return new Promise((resolve) => {
            let frameCount = 0;
            let lastTime = performance.now();
            const duration = 1000; // 1 second test
            
            function countFrame() {
                frameCount++;
                const currentTime = performance.now();
                
                if (currentTime - lastTime >= duration) {
                    resolve(frameCount);
                } else {
                    requestAnimationFrame(countFrame);
                }
            }
            
            requestAnimationFrame(countFrame);
        });
    }
    
    /**
     * Get available memory (estimate)
     */
    getAvailableMemory() {
        // Try to get actual memory info
        if (performance.memory) {
            // Chrome/Edge only
            const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            const totalMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
            return Math.round(totalMB - usedMB);
        }
        
        // Fallback: estimate based on device type
        if (navigator.deviceMemory) {
            // Device Memory API (Chrome)
            return navigator.deviceMemory * 1024; // Convert GB to MB
        }
        
        // Final fallback: assume medium device
        return 2048;
    }
    
    /**
     * Classify device based on benchmark results
     */
    classifyDevice(results) {
        const { renderTime, fps, memory } = results;
        
        // Check if slow
        if (renderTime > this.thresholds.slow.maxAvgRenderTime ||
            fps < this.thresholds.slow.minAvgFPS ||
            memory < this.thresholds.slow.maxMemoryMB) {
            return 'slow';
        }
        
        // Check if medium
        if (renderTime > this.thresholds.medium.maxAvgRenderTime ||
            fps < this.thresholds.medium.minAvgFPS ||
            memory < this.thresholds.medium.maxMemoryMB) {
            return 'medium';
        }
        
        // Otherwise fast
        return 'fast';
    }
    
    /**
     * Generate adaptive settings based on device class
     */
    generateAdaptiveSettings() {
        const settings = {
            // Chunk sizes for processing
            chunkSize: 100,
            
            // Debounce times (ms)
            debounceTime: {
                typing: 300,
                validation: 500,
                analysis: 1000
            },
            
            // Virtual scrolling
            virtualScrollThreshold: 200,
            
            // Features
            enableAnimations: true,
            enableSyntaxHighlighting: true,
            enableLivePreview: true,
            enableAutoSave: true,
            
            // Cache
            cacheMaxItems: 1000,
            cacheTTL: 5 * 60 * 1000
        };
        
        switch (this.deviceClass) {
            case 'slow':
                settings.chunkSize = 50;
                settings.debounceTime.typing = 500;
                settings.debounceTime.validation = 1000;
                settings.debounceTime.analysis = 2000;
                settings.virtualScrollThreshold = 50;
                settings.enableAnimations = false;
                settings.enableSyntaxHighlighting = false;
                settings.enableLivePreview = false;
                settings.cacheMaxItems = 100;
                settings.cacheTTL = 10 * 60 * 1000; // Longer cache on slow devices
                break;
                
            case 'medium':
                settings.chunkSize = 75;
                settings.debounceTime.typing = 400;
                settings.debounceTime.validation = 700;
                settings.debounceTime.analysis = 1500;
                settings.virtualScrollThreshold = 100;
                settings.enableAnimations = true;
                settings.enableSyntaxHighlighting = true;
                settings.enableLivePreview = true;
                settings.cacheMaxItems = 500;
                break;
                
            case 'fast':
                // Use defaults (already set above)
                settings.chunkSize = 150;
                settings.debounceTime.typing = 200;
                settings.debounceTime.validation = 300;
                settings.debounceTime.analysis = 500;
                break;
        }
        
        return settings;
    }
    
    /**
     * Get current device class
     */
    getDeviceClass() {
        return this.deviceClass || this.profile.deviceClass || 'medium';
    }
    
    /**
     * Get adaptive settings
     */
    getAdaptiveSettings() {
        if (!this.profile.adaptiveSettings || Object.keys(this.profile.adaptiveSettings).length === 0) {
            return this.generateAdaptiveSettings();
        }
        return this.profile.adaptiveSettings;
    }
    
    /**
     * Track render time
     */
    trackRenderTime(time) {
        this.benchmarks.renderSamples.push(time);
        
        // Keep only last 100 samples
        if (this.benchmarks.renderSamples.length > 100) {
            this.benchmarks.renderSamples.shift();
        }
    }
    
    /**
     * Start performance monitoring
     */
    startMonitoring() {
        // Monitor FPS
        let lastTime = performance.now();
        let frameCount = 0;
        
        const monitorFrame = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.benchmarks.fpsSamples.push(frameCount);
                
                if (this.benchmarks.fpsSamples.length > 60) {
                    this.benchmarks.fpsSamples.shift();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (this.profile.monitoringEnabled) {
                requestAnimationFrame(monitorFrame);
            }
        };
        
        requestAnimationFrame(monitorFrame);
    }
    
    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        this.profile.monitoringEnabled = false;
        this.saveProfile();
    }
    
    /**
     * Get performance stats
     */
    getStats() {
        const avgRender = this.benchmarks.renderSamples.length > 0
            ? this.benchmarks.renderSamples.reduce((a, b) => a + b, 0) / this.benchmarks.renderSamples.length
            : this.profile.avgRenderTime;
            
        const avgFPS = this.benchmarks.fpsSamples.length > 0
            ? this.benchmarks.fpsSamples.reduce((a, b) => a + b, 0) / this.benchmarks.fpsSamples.length
            : this.profile.avgFPS;
        
        return {
            deviceClass: this.getDeviceClass(),
            avgRenderTime: avgRender ? Math.round(avgRender * 100) / 100 : null,
            avgFPS: avgFPS ? Math.round(avgFPS) : null,
            memoryMB: this.profile.availableMemoryMB,
            lastBenchmark: this.profile.lastBenchmark ? new Date(this.profile.lastBenchmark).toLocaleString() : 'Never',
            settings: this.getAdaptiveSettings()
        };
    }
    
    /**
     * Force re-benchmark
     */
    async forceBenchmark() {
        return await this.runBenchmark();
    }
    
    /**
     * Reset profile
     */
    reset() {
        this.profile = {
            deviceClass: null,
            avgRenderTime: null,
            avgFPS: null,
            availableMemoryMB: null,
            lastBenchmark: null,
            monitoringEnabled: true,
            adaptiveSettings: {}
        };
        this.deviceClass = null;
        this.benchmarks = {
            renderSamples: [],
            fpsSamples: [],
            memorySamples: []
        };
        this.saveProfile();
    }
}

// Loaded silently
