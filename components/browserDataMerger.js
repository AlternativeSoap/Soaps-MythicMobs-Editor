/**
 * BrowserDataMerger.js
 * Merges built-in browser data (mechanics, conditions, triggers, targeters) 
 * with custom database entries, handling overrides and hidden items
 */

class BrowserDataMerger {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        // Use IntelligentCacheManager with 5-minute TTL
        this.cache = new IntelligentCacheManager({
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: 50, // Max 50 entries
            enableAdaptiveTTL: true
        });
    }

    /**
     * Check if cached data is still valid
     */
    isCacheValid(browserType) {
        return this.cache.has(browserType);
    }

    /**
     * Clear cache for specific browser type or all
     */
    clearCache(browserType = null) {
        if (browserType) {
            this.cache.delete(browserType);
        } else {
            // Clear all caches
            this.cache.clear();
        }
    }

    /**
     * Get merged mechanics data (built-in + custom - hidden + overrides)
     */
    async getMergedMechanics() {
        // Check cache first
        if (this.isCacheValid('mechanics')) {
            return this.cache.get('mechanics');
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
                mechanics: mergedData,
                
                // Add helper method to match MECHANICS_DATA interface
                getMechanic(name) {
                    if (!name) return null;
                    const normalized = name.toLowerCase();
                    return this.mechanics.find(m => {
                        if (!m || !m.name) return false;
                        return m.name.toLowerCase() === normalized || 
                            (m.id && m.id.toLowerCase() === normalized) ||
                            (m.aliases && m.aliases.some(a => a && a.toLowerCase() === normalized));
                    });
                },
                
                // Search mechanics by query
                searchMechanics(query) {
                    if (!query) return this.mechanics;
                    const lowerQuery = query.toLowerCase();
                    return this.mechanics.filter(m => {
                        if (!m || !m.name) return false;
                        return m.name.toLowerCase().includes(lowerQuery) ||
                            (m.description && m.description.toLowerCase().includes(lowerQuery)) ||
                            (m.aliases && m.aliases.some(a => a && a.toLowerCase().includes(lowerQuery)));
                    });
                },
                
                // Get all mechanics in a category
                getMechanicsByCategory(category) {
                    return this.mechanics.filter(m => m && m.category === category);
                }
            };

            // Update cache with tags for invalidation
            this.cache.set('mechanics', result, {
                tags: ['browser-data', 'mechanics', 'custom-content']
            });

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
            return this.cache.get('conditions');
        }

        try {
            // Use the properly structured conditions from data/conditions/index.js
            // NOT from utils/conditions.js which has a different format
            const builtInConditions = window.ALL_CONDITIONS || [];

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

            // Update cache with tags for invalidation
            this.cache.set('conditions', mergedData, {
                tags: ['browser-data', 'conditions', 'custom-content']
            });

            return mergedData;
        } catch (error) {
            console.error('Error merging conditions data:', error);
            // Fallback to built-in data from data/conditions/index.js
            return window.ALL_CONDITIONS || [];
        }
    }

    /**
     * Get merged triggers data (built-in + custom - hidden + overrides)
     */
    async getMergedTriggers() {
        // Check cache first
        if (this.isCacheValid('triggers')) {
            return this.cache.get('triggers');
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
                triggers: mergedData,
                
                // Add helper method to match TRIGGERS_DATA interface
                getTrigger(name) {
                    if (!name) return null;
                    const normalized = name.toLowerCase();
                    return this.triggers.find(t => {
                        if (!t || !t.name) return false;
                        return t.name.toLowerCase() === normalized || 
                            (t.id && t.id.toLowerCase() === normalized) ||
                            (t.aliases && t.aliases.some(a => a && a.toLowerCase() === normalized));
                    });
                },
                
                // Search triggers by query
                searchTriggers(query) {
                    if (!query) return this.triggers;
                    const lowerQuery = query.toLowerCase();
                    return this.triggers.filter(t => {
                        if (!t || !t.name) return false;
                        return t.name.toLowerCase().includes(lowerQuery) ||
                            (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
                            (t.aliases && t.aliases.some(a => a && a.toLowerCase().includes(lowerQuery)));
                    });
                },
                
                // Get all triggers in a category
                getTriggersByCategory(category) {
                    return this.triggers.filter(t => t && t.category === category);
                },
                
                // Get triggers compatible with mob type
                getCompatibleTriggers(mobType) {
                    if (!mobType) return this.triggers;
                    return this.triggers.filter(t => {
                        if (!t) return false;
                        return !t.mobTypeRestrictions || 
                            t.mobTypeRestrictions.length === 0 || 
                            t.mobTypeRestrictions.includes(mobType.toUpperCase());
                    });
                },
                
                // Check if trigger requires specific modules
                checkRequirements(trigger, mobModules) {
                    if (!trigger || !trigger.requirements || trigger.requirements.length === 0) {
                        return { satisfied: true, missing: [] };
                    }
                    const missing = [];
                    for (const req of trigger.requirements) {
                        if (req === 'ThreatTable' && !mobModules?.ThreatTable) {
                            missing.push(req);
                        } else if (req === 'Hearing' && !mobModules?.Hearing?.Enabled) {
                            missing.push(req);
                        }
                    }
                    return { satisfied: missing.length === 0, missing: missing };
                }
            };

            // Update cache with tags for invalidation
            this.cache.set('triggers', result, {
                tags: ['browser-data', 'triggers', 'custom-content']
            });

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
            return this.cache.get('targeters');
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
                targeters: mergedData,
                
                // Add helper method to match TARGETERS_DATA interface
                getTargeter(name) {
                    if (!name) return null;
                    const normalized = name.toLowerCase().replace('@', '');
                    return this.targeters.find(t => {
                        if (!t || !t.name) return false;
                        return t.name.toLowerCase() === normalized || 
                            (t.id && t.id.toLowerCase() === normalized) ||
                            (t.aliases && t.aliases.some(a => a && a.toLowerCase() === normalized));
                    });
                },
                
                // Search targeters by query
                searchTargeters(query) {
                    if (!query) return this.targeters;
                    const lowerQuery = query.toLowerCase();
                    return this.targeters.filter(t => {
                        if (!t || !t.name) return false;
                        return t.name.toLowerCase().includes(lowerQuery) ||
                            (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
                            (t.aliases && t.aliases.some(a => a && a.toLowerCase().includes(lowerQuery)));
                    });
                },
                
                // Get all targeters in a category
                getTargetersByCategory(category) {
                    return this.targeters.filter(t => t && t.category === category);
                },
                
                // Check if targeter requires specific modules
                checkRequirements(targeter, mobModules) {
                    if (!targeter || !targeter.requirements || targeter.requirements.length === 0) {
                        return { satisfied: true, missing: [] };
                    }
                    const missing = [];
                    for (const req of targeter.requirements) {
                        if (req === 'ThreatTable' && !mobModules?.ThreatTable) {
                            missing.push(req);
                        }
                    }
                    return { satisfied: missing.length === 0, missing: missing };
                }
            };

            // Update cache with tags for invalidation
            this.cache.set('targeters', result, {
                tags: ['browser-data', 'targeters', 'custom-content']
            });

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
        return this.cache.getStats();
    }

    /**
     * Legacy method for compatibility
     */
    cacheStats() {
        const stats = this.cache.getStats();
        const cached = {
            mechanics: this.cache.has('mechanics'),
            conditions: this.cache.has('conditions'),
            triggers: this.cache.has('triggers'),
            targeters: this.cache.has('targeters')
        };
        return { ...stats, cached };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserDataMerger;
}
