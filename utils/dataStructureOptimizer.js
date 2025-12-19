/**
 * Data Structure Optimizer
 * Converts array-based data to Map/Set for O(1) lookups
 * Pre-computes category counts for performance
 */

class DataStructureOptimizer {
    constructor() {
        this.mechanicsMap = null;
        this.conditionsMap = null;
        this.targetersMap = null;
        this.triggersMap = null;
        
        this.mechanicsCategoryCounts = null;
        this.conditionsCategoryCounts = null;
        this.targetersCategoryCounts = null;
        this.triggersCategoryCounts = null;
    }

    /**
     * Initialize all optimized data structures
     */
    initialize() {
        
        // Convert arrays to Maps
        this.mechanicsMap = this.arrayToMap(window.MECHANICS_DATA?.mechanics || [], 'id');
        this.targetersMap = this.arrayToMap(window.TARGETERS_DATA?.targeters || [], 'id');
        this.triggersMap = this.arrayToMap(window.TRIGGERS_DATA?.triggers || [], 'name');
        this.conditionsMap = this.buildConditionsMap();
        
        // Pre-compute category counts
        this.mechanicsCategoryCounts = this.computeCategoryCounts(
            window.MECHANICS_DATA?.mechanics || [], 'category'
        );
        this.conditionsCategoryCounts = this.computeConditionsCategoryCounts();
        this.targetersCategoryCounts = this.computeCategoryCounts(
            window.TARGETERS_DATA?.targeters || [], 'category'
        );
        this.triggersCategoryCounts = this.computeCategoryCounts(
            window.TRIGGERS_DATA?.triggers || [], 'category'
        );
        
        if (window.DEBUG_MODE) {
        }
    }

    /**
     * Convert array to Map indexed by key
     * @param {Array} array - Source array
     * @param {string} keyField - Field to use as Map key
     * @returns {Map} Indexed Map
     */
    arrayToMap(array, keyField) {
        const map = new Map();
        for (const item of array) {
            const key = item[keyField];
            if (key) {
                map.set(key, item);
            }
        }
        return map;
    }

    /**
     * Build optimized conditions Map from nested structure
     * @returns {Map} Conditions indexed by name
     */
    buildConditionsMap() {
        const map = new Map();
        
        // Try CONDITIONS_DATA first (category-keyed object), fallback to ALL_CONDITIONS (flat array)
        const conditionsData = window.CONDITIONS_DATA || {};
        const allConditions = window.ALL_CONDITIONS || [];
        
        // If CONDITIONS_DATA is available (category-keyed), use it
        if (Object.keys(conditionsData).length > 0) {
            for (const category in conditionsData) {
                const conditions = conditionsData[category];
                if (Array.isArray(conditions)) {
                    for (const condition of conditions) {
                        if (condition.name) {
                            // Category is already set in condition.category
                            map.set(condition.name, condition);
                        }
                    }
                }
            }
        } 
        // Fallback to ALL_CONDITIONS if no CONDITIONS_DATA
        else if (allConditions.length > 0) {
            for (const condition of allConditions) {
                if (condition.name) {
                    map.set(condition.name, condition);
                }
            }
        }
        return map;
    }

    /**
     * Compute category counts for array
     * @param {Array} array - Source array
     * @param {string} categoryField - Field containing category
     * @returns {Map} Category counts
     */
    computeCategoryCounts(array, categoryField) {
        const counts = new Map();
        
        for (const item of array) {
            const category = item[categoryField];
            if (category) {
                counts.set(category, (counts.get(category) || 0) + 1);
            }
        }
        
        return counts;
    }

    /**
     * Compute conditions category counts from nested structure
     * @returns {Map} Category counts
     */
    computeConditionsCategoryCounts() {
        const counts = new Map();
        const conditionsData = window.CONDITIONS_DATA || {};
        
        for (const category in conditionsData) {
            const conditions = conditionsData[category];
            if (Array.isArray(conditions)) {
                counts.set(category, conditions.length);
            }
        }
        
        return counts;
    }

    /**
     * Get item by ID from Map (O(1) lookup)
     * @param {string} type - Data type (mechanics, conditions, targeters, triggers)
     * @param {string} id - Item ID
     * @returns {Object|null} Item or null
     */
    getItem(type, id) {
        const map = this[`${type}Map`];
        return map ? map.get(id) : null;
    }

    /**
     * Get all items from Map as array
     * @param {string} type - Data type
     * @returns {Array} All items
     */
    getAllItems(type) {
        const map = this[`${type}Map`];
        return map ? Array.from(map.values()) : [];
    }

    /**
     * Get items by category
     * @param {string} type - Data type
     * @param {string} category - Category name
     * @returns {Array} Filtered items
     */
    getItemsByCategory(type, category) {
        const items = this.getAllItems(type);
        if (category === 'all') return items;
        
        // For conditions, use the category field we added
        if (type === 'conditions') {
            return items.filter(item => item.category === category);
        }
        
        return items.filter(item => item.category === category);
    }

    /**
     * Get category count (O(1) lookup)
     * @param {string} type - Data type
     * @param {string} category - Category name
     * @returns {number} Count
     */
    getCategoryCount(type, category) {
        const counts = this[`${type}CategoryCounts`];
        if (!counts) return 0;
        
        if (category === 'all') {
            return Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
        }
        
        return counts.get(category) || 0;
    }

    /**
     * Search items (with filtering)
     * @param {string} type - Data type
     * @param {string} query - Search query
     * @param {string} category - Category filter
     * @returns {Array} Matching items
     */
    searchItems(type, query, category = 'all') {
        let items = this.getItemsByCategory(type, category);
        
        if (!query || query.trim() === '') {
            return items;
        }
        
        const lowerQuery = query.toLowerCase();
        
        return items.filter(item => {
            // Search in name
            if (item.name && item.name.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            // Search in aliases
            if (item.aliases && Array.isArray(item.aliases)) {
                if (item.aliases.some(alias => 
                    alias.toLowerCase().includes(lowerQuery)
                )) {
                    return true;
                }
            }
            
            // Search in description
            if (item.description && item.description.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            return false;
        });
    }

    /**
     * Check if item exists (O(1) lookup)
     * @param {string} type - Data type
     * @param {string} id - Item ID
     * @returns {boolean} True if exists
     */
    hasItem(type, id) {
        const map = this[`${type}Map`];
        return map ? map.has(id) : false;
    }

    /**
     * Get Map size
     * @param {string} type - Data type
     * @returns {number} Number of items
     */
    getSize(type) {
        const map = this[`${type}Map`];
        return map ? map.size : 0;
    }
}

// Create singleton instance
const dataOptimizer = new DataStructureOptimizer();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for data files to load
        setTimeout(() => dataOptimizer.initialize(), 100);
    });
} else {
    setTimeout(() => dataOptimizer.initialize(), 100);
}

// Export for use in other modules
window.DataOptimizer = dataOptimizer;
