/**
 * BrowserDataMerger.js
 * Merges built-in browser data (mechanics, conditions, triggers, targeters) 
 * with custom database entries, handling overrides and hidden items
 */

class BrowserDataMerger {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.cache = {
            mechanics: { data: null, timestamp: null },
            conditions: { data: null, timestamp: null },
            triggers: { data: null, timestamp: null },
            targeters: { data: null, timestamp: null }
        };
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    /**
     * Check if cached data is still valid
     */
    isCacheValid(browserType) {
        const cached = this.cache[browserType];
        if (!cached.data || !cached.timestamp) return false;
        return (Date.now() - cached.timestamp) < this.cacheTTL;
    }

    /**
     * Clear cache for specific browser type or all
     */
    clearCache(browserType = null) {
        if (browserType) {
            this.cache[browserType] = { data: null, timestamp: null };
        } else {
            // Clear all caches
            Object.keys(this.cache).forEach(type => {
                this.cache[type] = { data: null, timestamp: null };
            });
        }
    }

    /**
     * Get merged mechanics data (built-in + custom - hidden + overrides)
     */
    async getMergedMechanics() {
        // Check cache first
        if (this.isCacheValid('mechanics')) {
            return this.cache.mechanics.data;
        }

        try {
            // Load built-in mechanics
            const builtInMechanics = MECHANICS_DATA.mechanics || [];

            // Check if supabase client is valid before attempting database queries
            if (!this.supabase || typeof this.supabase.from !== 'function') {
                console.warn('Supabase client not available, using built-in mechanics only');
                return MECHANICS_DATA;
            }

            // Fetch custom mechanics from database
            const { data: customMechanics, error: customError } = await this.supabase
                .from('custom_mechanics')
                .select('*')
                .order('name');

            if (customError) throw customError;

            // Fetch hidden built-ins
            const { data: hiddenItems, error: hiddenError } = await this.supabase
                .from('hidden_built_ins')
                .select('item_id')
                .eq('item_type', 'mechanic');

            if (hiddenError) throw hiddenError;

            const hiddenIds = new Set((hiddenItems || []).map(item => item.item_id));

            // Filter out hidden built-ins
            const visibleBuiltIns = builtInMechanics.filter(mechanic => 
                !hiddenIds.has(mechanic.id)
            );

            // Convert custom mechanics to match built-in format
            const formattedCustom = (customMechanics || []).map(custom => ({
                id: custom.id,
                name: custom.name,
                aliases: custom.aliases || [],
                category: custom.category,
                description: custom.description,
                attributes: custom.attributes || {},
                examples: custom.examples || [],
                isCustom: true, // Flag to identify custom items
                customData: {
                    createdBy: custom.created_by,
                    createdAt: custom.created_at,
                    updatedAt: custom.updated_at
                }
            }));

            // Merge: custom items + visible built-ins
            const mergedData = [...formattedCustom, ...visibleBuiltIns];

            // Sort by category, then name
            mergedData.sort((a, b) => {
                if (a.category !== b.category) {
                    return a.category.localeCompare(b.category);
                }
                return a.name.localeCompare(b.name);
            });

            // Build final structure matching MECHANICS_DATA format
            const result = {
                categories: this.extractCategories(mergedData),
                mechanics: mergedData
            };

            // Update cache
            this.cache.mechanics = {
                data: result,
                timestamp: Date.now()
            };

            return result;
        } catch (error) {
            console.error('Error merging mechanics data:', error);
            // Fallback to built-in data only
            return MECHANICS_DATA;
        }
    }

    /**
     * Get merged conditions data (built-in + custom - hidden + overrides)
     */
    async getMergedConditions() {
        // Check cache first
        if (this.isCacheValid('conditions')) {
            return this.cache.conditions.data;
        }

        try {
            // Load built-in conditions from utils/conditions.js
            const { CONDITIONS_DATA } = await import('../utils/conditions.js');
            const builtInConditions = CONDITIONS_DATA || [];

            // Check if supabase client is valid before attempting database queries
            if (!this.supabase || typeof this.supabase.from !== 'function') {
                console.warn('Supabase client not available, using built-in conditions only');
                return builtInConditions;
            }

            // Fetch custom conditions from database
            const { data: customConditions, error: customError } = await this.supabase
                .from('custom_conditions')
                .select('*')
                .order('name');

            if (customError) throw customError;

            // Fetch hidden built-ins
            const { data: hiddenItems, error: hiddenError } = await this.supabase
                .from('hidden_built_ins')
                .select('item_id')
                .eq('item_type', 'condition');

            if (hiddenError) throw hiddenError;

            const hiddenIds = new Set((hiddenItems || []).map(item => item.item_id));

            // Filter out hidden built-ins
            const visibleBuiltIns = builtInConditions.filter(condition => 
                !hiddenIds.has(condition.id)
            );

            // Convert custom conditions to match built-in format
            const formattedCustom = (customConditions || []).map(custom => ({
                id: custom.id,
                name: custom.name,
                aliases: custom.aliases || [],
                category: custom.category,
                description: custom.description,
                attributes: custom.attributes || {},
                examples: custom.examples || [],
                isCustom: true,
                customData: {
                    createdBy: custom.created_by,
                    createdAt: custom.created_at,
                    updatedAt: custom.updated_at
                }
            }));

            // Merge and sort
            const mergedData = [...formattedCustom, ...visibleBuiltIns];
            mergedData.sort((a, b) => {
                if (a.category !== b.category) {
                    return a.category.localeCompare(b.category);
                }
                return a.name.localeCompare(b.name);
            });

            // Update cache
            this.cache.conditions = {
                data: mergedData,
                timestamp: Date.now()
            };

            return mergedData;
        } catch (error) {
            console.error('Error merging conditions data:', error);
            // Fallback to built-in data only
            try {
                const { CONDITIONS_DATA } = await import('../utils/conditions.js');
                return CONDITIONS_DATA || [];
            } catch {
                return [];
            }
        }
    }

    /**
     * Get merged triggers data (built-in + custom - hidden + overrides)
     */
    async getMergedTriggers() {
        // Check cache first
        if (this.isCacheValid('triggers')) {
            return this.cache.triggers.data;
        }

        try {
            // Load built-in triggers
            const builtInTriggers = TRIGGERS_DATA.triggers || [];

            // Check if supabase client is valid before attempting database queries
            if (!this.supabase || typeof this.supabase.from !== 'function') {
                console.warn('Supabase client not available, using built-in triggers only');
                return TRIGGERS_DATA;
            }

            // Fetch custom triggers from database
            const { data: customTriggers, error: customError } = await this.supabase
                .from('custom_triggers')
                .select('*')
                .order('name');

            if (customError) throw customError;

            // Fetch hidden built-ins
            const { data: hiddenItems, error: hiddenError } = await this.supabase
                .from('hidden_built_ins')
                .select('item_id')
                .eq('item_type', 'trigger');

            if (hiddenError) throw hiddenError;

            const hiddenIds = new Set((hiddenItems || []).map(item => item.item_id));

            // Filter out hidden built-ins
            const visibleBuiltIns = builtInTriggers.filter(trigger => 
                !hiddenIds.has(trigger.id)
            );

            // Convert custom triggers to match built-in format
            const formattedCustom = (customTriggers || []).map(custom => ({
                id: custom.id,
                name: custom.name,
                aliases: custom.aliases || [],
                category: custom.category,
                description: custom.description,
                attributes: custom.attributes || {},
                examples: custom.examples || [],
                isCustom: true,
                customData: {
                    createdBy: custom.created_by,
                    createdAt: custom.created_at,
                    updatedAt: custom.updated_at
                }
            }));

            // Merge and sort
            const mergedData = [...formattedCustom, ...visibleBuiltIns];
            mergedData.sort((a, b) => {
                if (a.category !== b.category) {
                    return a.category.localeCompare(b.category);
                }
                return a.name.localeCompare(b.name);
            });

            // Build final structure matching TRIGGERS_DATA format
            const result = {
                categories: this.extractCategories(mergedData),
                triggers: mergedData
            };

            // Update cache
            this.cache.triggers = {
                data: result,
                timestamp: Date.now()
            };

            return result;
        } catch (error) {
            console.error('Error merging triggers data:', error);
            // Fallback to built-in data only
            return TRIGGERS_DATA;
        }
    }

    /**
     * Get merged targeters data (built-in + custom - hidden + overrides)
     */
    async getMergedTargeters() {
        // Check cache first
        if (this.isCacheValid('targeters')) {
            return this.cache.targeters.data;
        }

        try {
            // Load built-in targeters
            const builtInTargeters = TARGETERS_DATA.targeters || [];

            // Check if supabase client is valid before attempting database queries
            if (!this.supabase || typeof this.supabase.from !== 'function') {
                console.warn('Supabase client not available, using built-in targeters only');
                return TARGETERS_DATA;
            }

            // Fetch custom targeters from database
            const { data: customTargeters, error: customError } = await this.supabase
                .from('custom_targeters')
                .select('*')
                .order('name');

            if (customError) throw customError;

            // Fetch hidden built-ins
            const { data: hiddenItems, error: hiddenError } = await this.supabase
                .from('hidden_built_ins')
                .select('item_id')
                .eq('item_type', 'targeter');

            if (hiddenError) throw hiddenError;

            const hiddenIds = new Set((hiddenItems || []).map(item => item.item_id));

            // Filter out hidden built-ins
            const visibleBuiltIns = builtInTargeters.filter(targeter => 
                !hiddenIds.has(targeter.id)
            );

            // Convert custom targeters to match built-in format
            const formattedCustom = (customTargeters || []).map(custom => ({
                id: custom.id,
                name: custom.name,
                aliases: custom.aliases || [],
                category: custom.category,
                description: custom.description,
                attributes: custom.attributes || {},
                examples: custom.examples || [],
                isCustom: true,
                customData: {
                    createdBy: custom.created_by,
                    createdAt: custom.created_at,
                    updatedAt: custom.updated_at
                }
            }));

            // Merge and sort
            const mergedData = [...formattedCustom, ...visibleBuiltIns];
            mergedData.sort((a, b) => {
                if (a.category !== b.category) {
                    return a.category.localeCompare(b.category);
                }
                return a.name.localeCompare(b.name);
            });

            // Build final structure matching TARGETERS_DATA format
            const result = {
                categories: this.extractCategories(mergedData),
                targeters: mergedData
            };

            // Update cache
            this.cache.targeters = {
                data: result,
                timestamp: Date.now()
            };

            return result;
        } catch (error) {
            console.error('Error merging targeters data:', error);
            // Fallback to built-in data only
            return TARGETERS_DATA;
        }
    }

    /**
     * Extract unique categories from merged data
     */
    extractCategories(items) {
        const categorySet = new Set();
        items.forEach(item => {
            if (item.category) {
                categorySet.add(item.category);
            }
        });
        return Array.from(categorySet).sort();
    }

    /**
     * Refresh data for specific browser type (invalidate cache and reload)
     */
    async refreshBrowserData(browserType) {
        this.clearCache(browserType);
        
        switch(browserType) {
            case 'mechanics':
                return await this.getMergedMechanics();
            case 'conditions':
                return await this.getMergedConditions();
            case 'triggers':
                return await this.getMergedTriggers();
            case 'targeters':
                return await this.getMergedTargeters();
            default:
                console.warn(`Unknown browser type: ${browserType}`);
                return null;
        }
    }

    /**
     * Get cache statistics (useful for debugging)
     */
    getCacheStats() {
        const stats = {};
        Object.keys(this.cache).forEach(type => {
            const cached = this.cache[type];
            stats[type] = {
                isCached: !!cached.data,
                timestamp: cached.timestamp,
                age: cached.timestamp ? Date.now() - cached.timestamp : null,
                isValid: this.isCacheValid(type)
            };
        });
        return stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserDataMerger;
}
