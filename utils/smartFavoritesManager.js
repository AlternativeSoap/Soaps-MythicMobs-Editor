/**
 * Smart Favorites Manager
 * Intelligent favorites system with auto-promotion, usage tracking, and cleanup suggestions
 * 
 * Features:
 * - Auto-favorite items used 5+ times
 * - Track usage count and last used timestamp
 * - Suggest removing favorites unused for 30+ days
 * - Smart ordering by recency
 * - Context-based favorites (separate for mobs vs skills)
 */
class SmartFavoritesManager {
    constructor(storageKey, options = {}) {
        this.storageKey = storageKey;
        this.context = options.context || 'default'; // 'mob', 'skill', 'item', etc.
        
        // Thresholds
        this.autoFavoriteThreshold = options.autoFavoriteThreshold || 5;
        this.unusedDaysThreshold = options.unusedDaysThreshold || 30;
        
        // Data structure:
        // {
        //   favorites: Set of favorited IDs
        //   usage: { id: { count, lastUsed, autoFavorited, context } }
        //   metadata: { totalUses, lastCleanup }
        // }
        this.data = this.load();
    }
    
    /**
     * Load favorites data from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert favorites array back to Set
                parsed.favorites = new Set(parsed.favorites || []);
                return parsed;
            }
        } catch (error) {
            console.warn('Failed to load smart favorites:', error);
        }
        
        return {
            favorites: new Set(),
            usage: {},
            metadata: {
                totalUses: 0,
                lastCleanup: Date.now()
            }
        };
    }
    
    /**
     * Save favorites data to localStorage
     */
    save() {
        try {
            const toSave = {
                ...this.data,
                favorites: Array.from(this.data.favorites) // Convert Set to array
            };
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
        } catch (error) {
            console.warn('Failed to save smart favorites:', error);
        }
    }
    
    /**
     * Track item usage
     */
    trackUsage(itemId) {
        if (!this.data.usage[itemId]) {
            this.data.usage[itemId] = {
                count: 0,
                lastUsed: null,
                autoFavorited: false,
                context: this.context
            };
        }
        
        this.data.usage[itemId].count++;
        this.data.usage[itemId].lastUsed = Date.now();
        this.data.metadata.totalUses++;
        
        // Auto-favorite if threshold reached
        if (this.data.usage[itemId].count >= this.autoFavoriteThreshold && 
            !this.data.favorites.has(itemId)) {
            this.autoFavorite(itemId);
        }
        
        this.save();
    }
    
    /**
     * Auto-favorite an item
     */
    autoFavorite(itemId) {
        this.data.favorites.add(itemId);
        if (this.data.usage[itemId]) {
            this.data.usage[itemId].autoFavorited = true;
        }
        console.log(`⭐ Auto-favorited: ${itemId} (used ${this.data.usage[itemId]?.count || 0} times)`);
        this.save();
    }
    
    /**
     * Manually toggle favorite
     */
    toggle(itemId) {
        if (this.data.favorites.has(itemId)) {
            this.data.favorites.delete(itemId);
            // Mark as not auto-favorited if it was
            if (this.data.usage[itemId]) {
                this.data.usage[itemId].autoFavorited = false;
            }
        } else {
            this.data.favorites.add(itemId);
            // Initialize usage if not exists
            if (!this.data.usage[itemId]) {
                this.data.usage[itemId] = {
                    count: 0,
                    lastUsed: Date.now(),
                    autoFavorited: false,
                    context: this.context
                };
            }
        }
        this.save();
    }
    
    /**
     * Check if item is favorited
     */
    has(itemId) {
        return this.data.favorites.has(itemId);
    }
    
    /**
     * Get all favorited items
     */
    getAll() {
        return Array.from(this.data.favorites);
    }
    
    /**
     * Get favorites count (for compatibility with FavoritesManager)
     */
    getCount() {
        return this.data.favorites.size;
    }
    
    /**
     * Clear all favorites (for compatibility with FavoritesManager)
     */
    clear() {
        this.data.favorites.clear();
        // Optionally reset usage tracking
        // this.data.usage = {};
        this.save();
    }
    
    /**
     * Filter items to only favorites (for compatibility with FavoritesManager)
     */
    filterFavorites(items, idField = 'id') {
        return items.filter(item => this.has(item[idField]));
    }
    
    /**
     * Get favorites sorted by recency (most recently used first)
     */
    getSortedByRecency() {
        return Array.from(this.data.favorites).sort((a, b) => {
            const aUsage = this.data.usage[a];
            const bUsage = this.data.usage[b];
            
            const aTime = aUsage?.lastUsed || 0;
            const bTime = bUsage?.lastUsed || 0;
            
            return bTime - aTime;
        });
    }
    
    /**
     * Get favorites sorted by usage count
     */
    getSortedByUsage() {
        return Array.from(this.data.favorites).sort((a, b) => {
            const aCount = this.data.usage[a]?.count || 0;
            const bCount = this.data.usage[b]?.count || 0;
            
            return bCount - aCount;
        });
    }
    
    /**
     * Get favorites for specific context
     */
    getByContext(context) {
        return Array.from(this.data.favorites).filter(itemId => {
            const usage = this.data.usage[itemId];
            return usage && usage.context === context;
        });
    }
    
    /**
     * Get usage stats for an item
     */
    getUsageStats(itemId) {
        return this.data.usage[itemId] || {
            count: 0,
            lastUsed: null,
            autoFavorited: false,
            context: this.context
        };
    }
    
    /**
     * Get cleanup suggestions (unused favorites)
     */
    getCleanupSuggestions() {
        const now = Date.now();
        const thresholdMs = this.unusedDaysThreshold * 24 * 60 * 60 * 1000;
        const suggestions = [];
        
        for (const itemId of this.data.favorites) {
            const usage = this.data.usage[itemId];
            
            if (!usage || !usage.lastUsed) {
                // Never used - suggest removal
                suggestions.push({
                    itemId,
                    reason: 'Never used',
                    daysSinceUse: Infinity,
                    autoFavorited: usage?.autoFavorited || false
                });
            } else {
                const daysSinceUse = Math.floor((now - usage.lastUsed) / (24 * 60 * 60 * 1000));
                
                if (daysSinceUse >= this.unusedDaysThreshold) {
                    suggestions.push({
                        itemId,
                        reason: `Not used for ${daysSinceUse} days`,
                        daysSinceUse,
                        autoFavorited: usage.autoFavorited
                    });
                }
            }
        }
        
        return suggestions;
    }
    
    /**
     * Remove unused favorites based on threshold
     */
    cleanupUnused() {
        const suggestions = this.getCleanupSuggestions();
        let removed = 0;
        
        for (const suggestion of suggestions) {
            // Only auto-remove if it was auto-favorited and very old
            if (suggestion.autoFavorited && suggestion.daysSinceUse > this.unusedDaysThreshold * 2) {
                this.data.favorites.delete(suggestion.itemId);
                removed++;
            }
        }
        
        if (removed > 0) {
            this.data.metadata.lastCleanup = Date.now();
            this.save();
            console.log(`🧹 Cleaned up ${removed} unused favorites`);
        }
        
        return removed;
    }
    
    /**
     * Get top N most used items (whether favorited or not)
     */
    getTopUsed(limit = 10) {
        return Object.entries(this.data.usage)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, limit)
            .map(([itemId, stats]) => ({
                itemId,
                ...stats,
                isFavorited: this.data.favorites.has(itemId)
            }));
    }
    
    /**
     * Get items approaching auto-favorite threshold
     */
    getApproachingAutoFavorite() {
        const approaching = [];
        
        for (const [itemId, stats] of Object.entries(this.data.usage)) {
            if (!this.data.favorites.has(itemId) && 
                stats.count >= this.autoFavoriteThreshold - 2 && 
                stats.count < this.autoFavoriteThreshold) {
                approaching.push({
                    itemId,
                    count: stats.count,
                    remaining: this.autoFavoriteThreshold - stats.count
                });
            }
        }
        
        return approaching;
    }
    
    /**
     * Check if item was auto-favorited
     */
    isAutoFavorited(itemId) {
        return this.data.usage[itemId]?.autoFavorited || false;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const suggestions = this.getCleanupSuggestions();
        const autoFavorited = Array.from(this.data.favorites).filter(id => 
            this.data.usage[id]?.autoFavorited
        );
        
        return {
            totalFavorites: this.data.favorites.size,
            autoFavorited: autoFavorited.length,
            manualFavorites: this.data.favorites.size - autoFavorited.length,
            totalUses: this.data.metadata.totalUses,
            cleanupSuggestions: suggestions.length,
            lastCleanup: this.data.metadata.lastCleanup ? 
                new Date(this.data.metadata.lastCleanup).toLocaleString() : 'Never',
            topUsed: this.getTopUsed(5)
        };
    }
    
    /**
     * Export favorites data
     */
    export() {
        return {
            favorites: Array.from(this.data.favorites),
            usage: this.data.usage,
            metadata: this.data.metadata
        };
    }
    
    /**
     * Import favorites data
     */
    import(data) {
        if (data.favorites) {
            this.data.favorites = new Set(data.favorites);
        }
        if (data.usage) {
            this.data.usage = data.usage;
        }
        if (data.metadata) {
            this.data.metadata = data.metadata;
        }
        this.save();
    }
    
    /**
     * Reset all data
     */
    reset() {
        this.data = {
            favorites: new Set(),
            usage: {},
            metadata: {
                totalUses: 0,
                lastCleanup: Date.now()
            }
        };
        this.save();
    }
}

// Loaded silently
