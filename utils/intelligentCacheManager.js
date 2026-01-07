/**
 * Intelligent Cache Manager
 * Advanced caching with granular invalidation, memory management, and adaptive TTL
 * 
 * Features:
 * - Granular invalidation by key patterns or tags
 * - Memory size tracking and limits
 * - Adaptive TTL based on access frequency
 * - LRU eviction when memory limit reached
 * - Performance metrics tracking
 */
class IntelligentCacheManager {
    constructor(options = {}) {
        this.maxMemoryBytes = options.maxMemoryBytes || 5 * 1024 * 1024; // 5MB default
        this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
        this.minTTL = options.minTTL || 60 * 1000; // 1 minute
        this.maxTTL = options.maxTTL || 30 * 60 * 1000; // 30 minutes
        this.accessCountForLongerTTL = options.accessCountForLongerTTL || 5;
        
        // Cache storage
        this.cache = new Map();
        
        // Metadata for each cache entry
        this.metadata = new Map();
        
        // Tags for grouping related cache entries
        this.tags = new Map(); // tag -> Set of keys
        
        // Memory tracking
        this.currentMemoryBytes = 0;
        
        // Performance metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            invalidations: 0,
            memoryPeakBytes: 0
        };
    }
    
    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.metrics.misses++;
            return null;
        }
        
        const meta = this.metadata.get(key);
        
        // Check if expired
        if (Date.now() > meta.expiry) {
            this.delete(key);
            this.metrics.misses++;
            return null;
        }
        
        // Update access metadata
        meta.lastAccessed = Date.now();
        meta.accessCount++;
        
        // Adaptive TTL - frequently accessed items get longer TTL
        if (meta.accessCount >= this.accessCountForLongerTTL) {
            const newTTL = Math.min(meta.ttl * 1.5, this.maxTTL);
            meta.ttl = newTTL;
            meta.expiry = Date.now() + newTTL;
        }
        
        this.metrics.hits++;
        return entry.value;
    }
    
    /**
     * Set value in cache
     */
    set(key, value, options = {}) {
        const ttl = options.ttl || this.defaultTTL;
        const tags = options.tags || [];
        
        // Estimate memory size
        const estimatedSize = this.estimateSize(value);
        
        // Check if we need to evict entries
        while (this.currentMemoryBytes + estimatedSize > this.maxMemoryBytes && this.cache.size > 0) {
            this.evictLRU();
        }
        
        // If still over limit after eviction, don't cache
        if (this.currentMemoryBytes + estimatedSize > this.maxMemoryBytes) {
            if (window.DEBUG_MODE) console.warn('Cache full, cannot store new entry');
            return false;
        }
        
        // Remove old entry if exists
        if (this.cache.has(key)) {
            this.delete(key);
        }
        
        // Store entry
        this.cache.set(key, {
            value,
            size: estimatedSize
        });
        
        // Store metadata
        this.metadata.set(key, {
            created: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0,
            expiry: Date.now() + ttl,
            ttl: ttl,
            size: estimatedSize,
            tags: tags
        });
        
        // Update memory tracking
        this.currentMemoryBytes += estimatedSize;
        if (this.currentMemoryBytes > this.metrics.memoryPeakBytes) {
            this.metrics.memoryPeakBytes = this.currentMemoryBytes;
        }
        
        // Register tags
        for (const tag of tags) {
            if (!this.tags.has(tag)) {
                this.tags.set(tag, new Set());
            }
            this.tags.get(tag).add(key);
        }
        
        return true;
    }
    
    /**
     * Check if key exists in cache (without updating access)
     */
    has(key) {
        if (!this.cache.has(key)) {
            return false;
        }
        
        const meta = this.metadata.get(key);
        return Date.now() <= meta.expiry;
    }
    
    /**
     * Delete a specific key
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        const meta = this.metadata.get(key);
        
        // Update memory tracking
        this.currentMemoryBytes -= entry.size;
        
        // Remove from tags
        if (meta && meta.tags) {
            for (const tag of meta.tags) {
                const tagSet = this.tags.get(tag);
                if (tagSet) {
                    tagSet.delete(key);
                    if (tagSet.size === 0) {
                        this.tags.delete(tag);
                    }
                }
            }
        }
        
        this.cache.delete(key);
        this.metadata.delete(key);
        
        return true;
    }
    
    /**
     * Invalidate cache entries by tag
     */
    invalidateByTag(tag) {
        const keys = this.tags.get(tag);
        if (!keys) return 0;
        
        let count = 0;
        for (const key of [...keys]) {
            this.delete(key);
            count++;
        }
        
        this.metrics.invalidations += count;
        return count;
    }
    
    /**
     * Invalidate cache entries by key pattern (regex)
     */
    invalidateByPattern(pattern) {
        const regex = new RegExp(pattern);
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.delete(key);
        }
        
        this.metrics.invalidations += keysToDelete.length;
        return keysToDelete.length;
    }
    
    /**
     * Invalidate cache entries by prefix
     */
    invalidateByPrefix(prefix) {
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.delete(key);
        }
        
        this.metrics.invalidations += keysToDelete.length;
        return keysToDelete.length;
    }
    
    /**
     * Clear entire cache
     */
    clear() {
        const count = this.cache.size;
        this.cache.clear();
        this.metadata.clear();
        this.tags.clear();
        this.currentMemoryBytes = 0;
        this.metrics.invalidations += count;
    }
    
    /**
     * Evict least recently used entry
     */
    evictLRU() {
        let lruKey = null;
        let lruTime = Infinity;
        
        for (const [key, meta] of this.metadata.entries()) {
            if (meta.lastAccessed < lruTime) {
                lruTime = meta.lastAccessed;
                lruKey = key;
            }
        }
        
        if (lruKey) {
            this.delete(lruKey);
            this.metrics.evictions++;
        }
    }
    
    /**
     * Estimate memory size of a value
     */
    estimateSize(value) {
        if (value === null || value === undefined) return 0;
        
        const type = typeof value;
        
        switch (type) {
            case 'string':
                return value.length * 2; // 2 bytes per char
            case 'number':
                return 8;
            case 'boolean':
                return 4;
            case 'object':
                if (Array.isArray(value)) {
                    return value.reduce((sum, item) => sum + this.estimateSize(item), 0);
                }
                // Rough estimate for objects
                const str = JSON.stringify(value);
                return str.length * 2;
            default:
                return 0;
        }
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.metrics.hits + this.metrics.misses;
        const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
        
        return {
            entries: this.cache.size,
            memoryUsedBytes: this.currentMemoryBytes,
            memoryUsedMB: (this.currentMemoryBytes / (1024 * 1024)).toFixed(2),
            memoryLimitMB: (this.maxMemoryBytes / (1024 * 1024)).toFixed(2),
            memoryUtilization: ((this.currentMemoryBytes / this.maxMemoryBytes) * 100).toFixed(1) + '%',
            hits: this.metrics.hits,
            misses: this.metrics.misses,
            hitRate: hitRate.toFixed(1) + '%',
            evictions: this.metrics.evictions,
            invalidations: this.metrics.invalidations,
            tags: this.tags.size
        };
    }
    
    /**
     * Get all cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        
        for (const [key, meta] of this.metadata.entries()) {
            if (now > meta.expiry) {
                expiredKeys.push(key);
            }
        }
        
        for (const key of expiredKeys) {
            this.delete(key);
        }
        
        return expiredKeys.length;
    }
    
    /**
     * Auto cleanup on interval
     */
    startAutoCleanup(intervalMs = 60000) {
        this.cleanupInterval = setInterval(() => {
            const cleaned = this.cleanup();
            if (cleaned > 0 && window.DEBUG_MODE) {
                console.log(`[Cache] Auto-cleaned ${cleaned} expired entries`);
            }
        }, intervalMs);
    }
    
    /**
     * Stop auto cleanup
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Loaded silently
