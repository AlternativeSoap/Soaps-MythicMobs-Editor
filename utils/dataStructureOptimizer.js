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
     * Build optimized conditions Map from flat array
     * @returns {Map} Conditions indexed by id (primary key)
     */
    buildConditionsMap() {
        const map = new Map();
        
        // Use ALL_CONDITIONS flat array (from data/conditions/index.js)
        const allConditions = window.ALL_CONDITIONS || [];
        
        for (const condition of allConditions) {
            // Use id as primary key (unique identifier)
            const key = condition.id || condition.name;
            if (key) {
                map.set(key, condition);
            }
        }
        
        // Store a separate lookup map for aliases/names (doesn't affect getAllItems)
        this.conditionsLookup = new Map();
        for (const condition of allConditions) {
            if (condition.name) {
                this.conditionsLookup.set(condition.name.toLowerCase(), condition);
            }
            if (condition.id) {
                this.conditionsLookup.set(condition.id.toLowerCase(), condition);
            }
            if (condition.aliases) {
                for (const alias of condition.aliases) {
                    this.conditionsLookup.set(alias.toLowerCase(), condition);
                }
            }
        }
        
        return map;
    }
    
    /**
     * Look up a condition by id, name, or alias
     * @param {string} query - The id, name, or alias to look up
     * @returns {Object|null} The condition or null
     */
    lookupCondition(query) {
        if (!query || !this.conditionsLookup) return null;
        return this.conditionsLookup.get(query.toLowerCase()) || null;
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
     * Compute conditions category counts from flat array
     * @returns {Map} Category counts
     */
    computeConditionsCategoryCounts() {
        const counts = new Map();
        const allConditions = window.ALL_CONDITIONS || [];
        
        for (const condition of allConditions) {
            const category = condition.category;
            if (category) {
                counts.set(category, (counts.get(category) || 0) + 1);
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
