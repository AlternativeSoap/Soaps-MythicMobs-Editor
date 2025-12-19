/**
 * BrowserAdminManager.js
 * Handles CRUD operations for custom browser items (mechanics, conditions, triggers, targeters)
 * and manages hiding/showing built-in items
 */

class BrowserAdminManager {
    constructor(adminManager, browserDataMerger, supabaseClient) {
        this.adminManager = adminManager;
        this.browserDataMerger = browserDataMerger;
        this.supabase = supabaseClient;
    }

    /**
     * Create a new custom item
     */
    async createCustomItem(type, itemData) {
        try {
            // Check permissions
            if (!this.adminManager.hasPermission('manage_templates')) {
                throw new Error('Insufficient permissions to create custom items');
            }

            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Determine table name
            const tableName = this.getTableName(type);
            const idColumnName = this.getIdColumnName(type);

            // Generate item_id if not provided
            const itemId = itemData.itemId || this.generateItemId(itemData.name);

            // Prepare data with enhanced structure
            const insertData = {
                [idColumnName]: itemId,
                name: itemData.name,
                aliases: itemData.aliases || [], // Old attribute-level aliases (keep for backward compatibility)
                item_aliases: itemData.itemAliases || [], // New item-level aliases
                category: itemData.category,
                description: itemData.description,
                attributes: itemData.attributes || [], // Now an array of attribute objects with enhanced structure
                examples: itemData.examples || [],
                tags: itemData.tags || [],
                dropdown_config: itemData.dropdownConfig || {},
                created_by: user.id
            };

            // Add type-specific fields
            if (type === 'mechanics' || type === 'mechanic') {
                insertData.default_targeter = itemData.defaultTargeter || '@Target';
            } else if (type === 'triggers' || type === 'trigger') {
                insertData.has_target = itemData.hasTarget || false;
                insertData.target_description = itemData.targetDescription || '';
                insertData.placeholders = itemData.placeholders || [];
                insertData.parameters = itemData.parameters || {};
            } else if (type === 'targeters' || type === 'targeter') {
                insertData.requirements = itemData.requirements || [];
            }

            // Insert into database
            const { data, error } = await this.supabase
                .from(tableName)
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;

            // Clear cache to reflect changes
            this.browserDataMerger.clearCache(type);

            // Log activity (handled by database trigger)
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating custom item:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update an existing custom item
     */
    async updateCustomItem(type, id, updates) {
        try {
            // Check permissions
            if (!this.adminManager.hasPermission('manage_templates')) {
                throw new Error('Insufficient permissions to update custom items');
            }

            // Get current user for updated_by field
            const { data: { user } } = await this.supabase.auth.getUser();
            if (user) {
                updates.updated_by = user.id;
                updates.updated_at = new Date().toISOString();
            }

            // Determine table name
            const tableName = this.getTableName(type);

            // Ensure attributes is properly formatted if present
            if (updates.attributes && typeof updates.attributes === 'object') {
                updates.attributes = updates.attributes;
            }

            // Update in database
            const { data, error } = await this.supabase
                .from(tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Clear cache to reflect changes
            this.browserDataMerger.clearCache(type);

            return { success: true, data };
        } catch (error) {
            console.error('Error updating custom item:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a custom item
     */
    async deleteCustomItem(type, id) {
        try {
            // Check permissions
            if (!this.adminManager.hasPermission('manage_templates')) {
                throw new Error('Insufficient permissions to delete custom items');
            }

            // Determine table name
            const tableName = this.getTableName(type);

            // Delete from database
            const { error } = await this.supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Clear cache to reflect changes
            this.browserDataMerger.clearCache(type);

            return { success: true };
        } catch (error) {
            console.error('Error deleting custom item:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Hide a built-in item from users
     */
    async hideBuiltIn(type, itemId) {
        try {
            // Check permissions (only super admin can hide built-ins)
            if (!this.adminManager.hasPermission('*')) {
                throw new Error('Only super administrators can hide built-in items');
            }

            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Normalize type to singular form
            const normalizedType = this.normalizeType(type);

            // Check if already hidden
            const { data: existing } = await this.supabase
                .from('hidden_built_ins')
                .select('id')
                .eq('item_type', normalizedType)
                .eq('item_id', itemId)
                .single();

            if (existing) {
                return { success: true, message: 'Item already hidden' };
            }

            // Insert into hidden_built_ins table
            const { error } = await this.supabase
                .from('hidden_built_ins')
                .insert([{
                    item_type: normalizedType,
                    item_id: itemId,
                    hidden_by: user.id
                }]);

            if (error) throw error;

            // Clear cache to reflect changes
            this.browserDataMerger.clearCache(type);

            return { success: true };
        } catch (error) {
            console.error('Error hiding built-in item:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Show a previously hidden built-in item
     */
    async showBuiltIn(type, itemId) {
        try {
            // Check permissions (only super admin can unhide built-ins)
            if (!this.adminManager.hasPermission('*')) {
                throw new Error('Only super administrators can unhide built-in items');
            }

            // Normalize type to singular form
            const normalizedType = this.normalizeType(type);

            // Delete from hidden_built_ins table
            const { error } = await this.supabase
                .from('hidden_built_ins')
                .delete()
                .eq('item_type', normalizedType)
                .eq('item_id', itemId);

            if (error) throw error;

            // Clear cache to reflect changes
            this.browserDataMerger.clearCache(type);

            return { success: true };
        } catch (error) {
            console.error('Error showing built-in item:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all custom items of a specific type
     */
    async getCustomItems(type) {
        try {
            const tableName = this.getTableName(type);

            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .order('name');

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching custom items:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    /**
     * Get all hidden built-in items of a specific type
     */
    async getHiddenBuiltIns(type) {
        try {
            const normalizedType = this.normalizeType(type);
            const { data, error } = await this.supabase
                .from('hidden_built_ins')
                .select('*')
                .eq('item_type', normalizedType)
                .order('hidden_at', { ascending: false });

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching hidden built-ins:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    /**
     * Check if a built-in item is hidden
     */
    async isBuiltInHidden(type, itemId) {
        try {
            const normalizedType = this.normalizeType(type);
            const { data, error } = await this.supabase
                .from('hidden_built_ins')
                .select('id')
                .eq('item_type', normalizedType)
                .eq('item_id', itemId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

            return { success: true, isHidden: !!data };
        } catch (error) {
            console.error('Error checking if built-in is hidden:', error);
            return { success: false, error: error.message, isHidden: false };
        }
    }

    /**
     * Normalize type to singular form for database consistency
     * @param {string} type - The type to normalize (mechanics/mechanic, etc.)
     * @returns {string} - The normalized singular type
     */
    normalizeType(type) {
        const typeMap = {
            'mechanics': 'mechanic',
            'conditions': 'condition',
            'triggers': 'trigger',
            'targeters': 'targeter',
            'mechanic': 'mechanic',
            'condition': 'condition',
            'trigger': 'trigger',
            'targeter': 'targeter'
        };
        return typeMap[type] || type;
    }

    /**
     * Get table name for browser type (always returns plural form with custom_ prefix)
     * @param {string} type - The browser type
     * @returns {string} - The table name (e.g., 'custom_mechanics')
     */
    getTableName(type) {
        // Ensure plural form
        const pluralType = type.endsWith('s') ? type : type + 's';
        return `custom_${pluralType}`;
    }

    /**
     * Get the ID column name for a given type
     * @param {string} type - The browser type
     * @returns {string} - The column name (e.g., 'mechanic_id')
     */
    getIdColumnName(type) {
        const singular = this.normalizeType(type);
        return `${singular}_id`;
    }

    /**
     * Get singular type name for display
     */
    getSingularType(type) {
        return this.normalizeType(type);
    }

    /**
     * Generate unique ID from name
     * @param {string} name - The name to convert to ID
     * @returns {string} - The generated ID
     */
    generateItemId(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 50);
    }

    /**
     * Validate item data before creating/updating
     */
    validateItemData(itemData) {
        const errors = [];

        if (!itemData.name || itemData.name.trim() === '') {
            errors.push('Name is required');
        }

        if (!itemData.category || itemData.category.trim() === '') {
            errors.push('Category is required');
        }

        if (!itemData.description || itemData.description.trim() === '') {
            errors.push('Description is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get browser statistics for dashboard
     */
    async getBrowserStats() {
        try {
            const types = ['mechanics', 'conditions', 'triggers', 'targeters'];
            const stats = {};

            for (const type of types) {
                const [customResult, hiddenResult] = await Promise.all([
                    this.getCustomItems(type),
                    this.getHiddenBuiltIns(type)
                ]);

                stats[type] = {
                    customCount: customResult.data?.length || 0,
                    hiddenCount: hiddenResult.data?.length || 0
                };
            }

            return { success: true, stats };
        } catch (error) {
            console.error('Error getting browser stats:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserAdminManager;
}
