/**
 * Autocomplete Learning System
 * Tracks user selections and provides intelligent suggestions based on usage patterns
 * 
 * Features:
 * - Tracks selection frequency for mechanics, conditions, targeters, triggers
 * - Learns contextual pairings (e.g., damage + @Target)
 * - Remembers attribute combinations
 * - Boosts frequently-used items in autocomplete rankings
 */
class AutocompleteLearningSystem {
    constructor() {
        this.storageKey = 'autocomplete_learning';
        this.data = this.loadData();
        
        // Thresholds
        this.MIN_USES_FOR_BOOST = 3;      // Minimum uses before boosting
        this.PAIRING_THRESHOLD = 2;        // Minimum co-occurrences to suggest pairing
        this.MAX_HISTORY_ITEMS = 500;      // Prevent unbounded growth
    }
    
    /**
     * Load learning data from localStorage
     */
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load autocomplete learning data:', error);
        }
        
        return {
            // Selection frequency: { itemId: count }
            mechanics: {},
            conditions: {},
            targeters: {},
            triggers: {},
            attributes: {},
            
            // Contextual pairings: { mechanicId: { targeterId: count } }
            mechanicTargeterPairs: {},
            mechanicConditionPairs: {},
            
            // Attribute combinations: { mechanicId: { attrName: { value: count } } }
            attributePairings: {},
            
            // Metadata
            totalSelections: 0,
            lastUpdated: Date.now()
        };
    }
    
    /**
     * Save learning data to localStorage
     */
    saveData() {
        try {
            this.data.lastUpdated = Date.now();
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.warn('Failed to save autocomplete learning data:', error);
            // If storage full, try pruning old data
            this.pruneOldData();
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            } catch (retryError) {
                console.error('Failed to save even after pruning:', retryError);
            }
        }
    }
    
    /**
     * Track a mechanic selection
     */
    trackMechanicSelection(mechanicId, targeterId = null, conditionId = null) {
        // Increment mechanic usage
        this.data.mechanics[mechanicId] = (this.data.mechanics[mechanicId] || 0) + 1;
        
        // Track mechanic-targeter pairing
        if (targeterId) {
            if (!this.data.mechanicTargeterPairs[mechanicId]) {
                this.data.mechanicTargeterPairs[mechanicId] = {};
            }
            this.data.mechanicTargeterPairs[mechanicId][targeterId] = 
                (this.data.mechanicTargeterPairs[mechanicId][targeterId] || 0) + 1;
        }
        
        // Track mechanic-condition pairing
        if (conditionId) {
            if (!this.data.mechanicConditionPairs[mechanicId]) {
                this.data.mechanicConditionPairs[mechanicId] = {};
            }
            this.data.mechanicConditionPairs[mechanicId][conditionId] = 
                (this.data.mechanicConditionPairs[mechanicId][conditionId] || 0) + 1;
        }
        
        this.data.totalSelections++;
        this.saveData();
    }
    
    /**
     * Track a condition selection
     */
    trackConditionSelection(conditionId) {
        this.data.conditions[conditionId] = (this.data.conditions[conditionId] || 0) + 1;
        this.data.totalSelections++;
        this.saveData();
    }
    
    /**
     * Track a targeter selection
     */
    trackTargeterSelection(targeterId) {
        this.data.targeters[targeterId] = (this.data.targeters[targeterId] || 0) + 1;
        this.data.totalSelections++;
        this.saveData();
    }
    
    /**
     * Track a trigger selection
     */
    trackTriggerSelection(triggerId) {
        this.data.triggers[triggerId] = (this.data.triggers[triggerId] || 0) + 1;
        this.data.totalSelections++;
        this.saveData();
    }
    
    /**
     * Track attribute usage with a mechanic
     */
    trackAttributePairing(mechanicId, attributeName, attributeValue) {
        if (!this.data.attributePairings[mechanicId]) {
            this.data.attributePairings[mechanicId] = {};
        }
        if (!this.data.attributePairings[mechanicId][attributeName]) {
            this.data.attributePairings[mechanicId][attributeName] = {};
        }
        
        this.data.attributePairings[mechanicId][attributeName][attributeValue] = 
            (this.data.attributePairings[mechanicId][attributeName][attributeValue] || 0) + 1;
        
        this.saveData();
    }
    
    /**
     * Get frequency boost score for an item (0-1 range)
     */
    getBoostScore(type, itemId) {
        const count = this.data[type]?.[itemId] || 0;
        if (count < this.MIN_USES_FOR_BOOST) {
            return 0;
        }
        
        // Calculate boost based on usage frequency
        // Most used item gets 1.0, others scale down
        const allCounts = Object.values(this.data[type] || {});
        const maxCount = Math.max(...allCounts, 1);
        
        return count / maxCount;
    }
    
    /**
     * Get suggested targeter for a mechanic
     */
    getSuggestedTargeter(mechanicId) {
        const pairings = this.data.mechanicTargeterPairs[mechanicId];
        if (!pairings) return null;
        
        // Find most frequently paired targeter
        let maxCount = 0;
        let suggestedTargeter = null;
        
        for (const [targeterId, count] of Object.entries(pairings)) {
            if (count >= this.PAIRING_THRESHOLD && count > maxCount) {
                maxCount = count;
                suggestedTargeter = targeterId;
            }
        }
        
        return suggestedTargeter;
    }
    
    /**
     * Get suggested condition for a mechanic
     */
    getSuggestedCondition(mechanicId) {
        const pairings = this.data.mechanicConditionPairs[mechanicId];
        if (!pairings) return null;
        
        let maxCount = 0;
        let suggestedCondition = null;
        
        for (const [conditionId, count] of Object.entries(pairings)) {
            if (count >= this.PAIRING_THRESHOLD && count > maxCount) {
                maxCount = count;
                suggestedCondition = conditionId;
            }
        }
        
        return suggestedCondition;
    }
    
    /**
     * Get suggested attribute value for a mechanic + attribute combination
     */
    getSuggestedAttributeValue(mechanicId, attributeName) {
        const attrPairings = this.data.attributePairings[mechanicId]?.[attributeName];
        if (!attrPairings) return null;
        
        // Find most commonly used value
        let maxCount = 0;
        let suggestedValue = null;
        
        for (const [value, count] of Object.entries(attrPairings)) {
            if (count > maxCount) {
                maxCount = count;
                suggestedValue = value;
            }
        }
        
        return suggestedValue;
    }
    
    /**
     * Get top N most used items of a type
     */
    getTopUsed(type, limit = 10) {
        const items = this.data[type] || {};
        return Object.entries(items)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id, count]) => ({ id, count }));
    }
    
    /**
     * Prune old/unused data to save space
     */
    pruneOldData() {
        console.log('Pruning autocomplete learning data...');
        
        // For each category, keep only top MAX_HISTORY_ITEMS by usage
        const categories = ['mechanics', 'conditions', 'targeters', 'triggers'];
        
        for (const category of categories) {
            const items = this.data[category];
            const sorted = Object.entries(items)
                .sort(([, a], [, b]) => b - a)
                .slice(0, this.MAX_HISTORY_ITEMS);
            
            this.data[category] = Object.fromEntries(sorted);
        }
        
        // Prune pairings - keep only for items that still exist
        const validMechanics = new Set(Object.keys(this.data.mechanics));
        
        // Prune mechanic-targeter pairs
        for (const mechanicId of Object.keys(this.data.mechanicTargeterPairs)) {
            if (!validMechanics.has(mechanicId)) {
                delete this.data.mechanicTargeterPairs[mechanicId];
            }
        }
        
        // Prune mechanic-condition pairs
        for (const mechanicId of Object.keys(this.data.mechanicConditionPairs)) {
            if (!validMechanics.has(mechanicId)) {
                delete this.data.mechanicConditionPairs[mechanicId];
            }
        }
        
        // Prune attribute pairings
        for (const mechanicId of Object.keys(this.data.attributePairings)) {
            if (!validMechanics.has(mechanicId)) {
                delete this.data.attributePairings[mechanicId];
            }
        }
        
        console.log('Pruning complete. Remaining items:', {
            mechanics: Object.keys(this.data.mechanics).length,
            conditions: Object.keys(this.data.conditions).length,
            targeters: Object.keys(this.data.targeters).length,
            triggers: Object.keys(this.data.triggers).length
        });
    }
    
    /**
     * Reset all learning data
     */
    reset() {
        this.data = {
            mechanics: {},
            conditions: {},
            targeters: {},
            triggers: {},
            attributes: {},
            mechanicTargeterPairs: {},
            mechanicConditionPairs: {},
            attributePairings: {},
            totalSelections: 0,
            lastUpdated: Date.now()
        };
        this.saveData();
    }
    
    /**
     * Get learning statistics
     */
    getStats() {
        return {
            totalSelections: this.data.totalSelections,
            mechanicsTracked: Object.keys(this.data.mechanics).length,
            conditionsTracked: Object.keys(this.data.conditions).length,
            targetersTracked: Object.keys(this.data.targeters).length,
            triggersTracked: Object.keys(this.data.triggers).length,
            pairingsTracked: Object.keys(this.data.mechanicTargeterPairs).length,
            lastUpdated: new Date(this.data.lastUpdated).toLocaleString()
        };
    }
}

// Loaded silently
