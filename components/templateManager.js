/**
 * Template Manager
 * API layer for managing user-created templates in Supabase
 * Handles CRUD operations, caching, validation, and auto-detection
 */

class TemplateManager {
    constructor(supabaseClient, authManager) {
        this.supabase = supabaseClient;
        this.auth = authManager;
        
        // Cache management (5-minute TTL)
        this.cache = {
            templates: null,
            timestamp: null,
            ttl: 5 * 60 * 1000 // 5 minutes
        };
        
        console.log('📦 TemplateManager initialized');
    }
    
    // ========================================
    // CACHE MANAGEMENT
    // ========================================
    
    /**
     * Check if cache is valid
     */
    isCacheValid() {
        if (!this.cache.templates || !this.cache.timestamp) return false;
        const age = Date.now() - this.cache.timestamp;
        return age < this.cache.ttl;
    }
    
    /**
     * Invalidate cache (force refresh)
     */
    invalidateCache() {
        this.cache.templates = null;
        this.cache.timestamp = null;
        console.log('🔄 Template cache invalidated');
    }
    
    /**
     * Set cache
     */
    setCache(templates) {
        this.cache.templates = templates;
        this.cache.timestamp = Date.now();
    }
    
    // ========================================
    // CREATE
    // ========================================
    
    /**
     * Create a new template
     * @param {Object} templateData - Template data
     * @returns {Promise<Object>} Created template
     */
    async createTemplate(templateData) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to create templates');
        }
        
        // Validate template data
        const validation = this.validateTemplate(templateData);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        // Prepare template object for database
        const template = {
            owner_id: currentUser.id,
            name: templateData.name.trim(),
            description: templateData.description.trim(),
            type: templateData.type || this.detectTemplateType(templateData.skillLines),
            tags: templateData.tags || [],
            data: {
                skillLines: templateData.skillLines,
                triggers: templateData.triggers || this.extractTriggers(templateData.skillLines),
                conditions: templateData.conditions || [],
                category: templateData.category || this.suggestCategory(templateData.skillLines),
                icon: templateData.icon || this.suggestIcon(templateData.skillLines),
                difficulty: templateData.difficulty || this.calculateDifficulty(templateData.skillLines)
            }
        };
        
        try {
            const { data, error } = await this.supabase
                .from('templates')
                .insert(template)
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Template created:', data.name);
            
            // Invalidate cache
            this.invalidateCache();
            
            return data;
        } catch (error) {
            console.error('❌ Failed to create template:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    // ========================================
    // READ
    // ========================================
    
    /**
     * Get all public templates (with caching)
     * @param {string} type - Filter by type ('mob' or 'skill'), or null for all
     * @returns {Promise<Array>} Array of templates
     */
    async getAllTemplates(type = null) {
        if (!this.supabase) {
            console.warn('Supabase not available, returning empty array');
            return [];
        }
        
        // Check cache first
        if (this.isCacheValid()) {
            console.log('📦 Using cached templates');
            const cached = this.cache.templates;
            return type ? cached.filter(t => t.type === type) : cached;
        }
        
        try {
            let query = this.supabase
                .from('templates')
                .select('*')
                .eq('deleted', false)
                .order('created_at', { ascending: false });
            
            if (type) {
                query = query.eq('type', type);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Process and cache
            const templates = data.map(t => this.processTemplate(t));
            
            if (!type) {
                // Only cache if fetching all templates
                this.setCache(templates);
            }
            
            console.log(`✅ Loaded ${templates.length} templates from Supabase`);
            
            return templates;
        } catch (error) {
            console.error('❌ Failed to load templates:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return [];
        }
    }
    
    /**
     * Get templates owned by specific user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of user's templates
     */
    async getUserTemplates(userId) {
        if (!this.supabase) return [];
        
        try {
            const { data, error } = await this.supabase
                .from('templates')
                .select('*')
                .eq('owner_id', userId)
                .eq('deleted', false)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return data.map(t => this.processTemplate(t));
        } catch (error) {
            console.error('❌ Failed to load user templates:', error);
            return [];
        }
    }
    
    /**
     * Get single template by ID
     * @param {string} id - Template ID
     * @returns {Promise<Object>} Template object
     */
    async getTemplateById(id) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        try {
            const { data, error } = await this.supabase
                .from('templates')
                .select('*, owner:owner_id(email)')
                .eq('id', id)
                .eq('deleted', false)
                .single();
            
            if (error) throw error;
            
            return this.processTemplate(data);
        } catch (error) {
            console.error('❌ Failed to load template:', error);
            throw new Error('Template not found');
        }
    }
    
    // ========================================
    // UPDATE
    // ========================================
    
    /**
     * Update existing template
     * @param {string} id - Template ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated template
     */
    async updateTemplate(id, updates) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to update templates');
        }
        
        // Validate updates
        if (updates.name !== undefined) {
            if (updates.name.length < 3 || updates.name.length > 50) {
                throw new Error('Template name must be 3-50 characters');
            }
        }
        
        if (updates.description !== undefined) {
            if (updates.description.length < 10 || updates.description.length > 500) {
                throw new Error('Template description must be 10-500 characters');
            }
        }
        
        try {
            const { data, error } = await this.supabase
                .from('templates')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Template updated:', data.name);
            
            // Invalidate cache
            this.invalidateCache();
            
            return this.processTemplate(data);
        } catch (error) {
            console.error('❌ Failed to update template:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    // ========================================
    // DELETE
    // ========================================
    
    /**
     * Soft delete template
     * @param {string} id - Template ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteTemplate(id) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to delete templates');
        }
        
        try {
            // Call the secure database function instead of direct update
            const { data, error } = await this.supabase
                .rpc('delete_template', { template_id: id });
            
            if (error) {
                console.error('Delete function error:', error);
                throw error;
            }
            
            // Check the function's response
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete template');
            }
            
            console.log('✅ Template deleted successfully');
            
            // Invalidate cache
            this.invalidateCache();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to delete template:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    // ========================================
    // DUPLICATE
    // ========================================
    
    /**
     * Duplicate a template (create copy with current user as owner)
     * @param {string} id - Template ID to duplicate
     * @returns {Promise<Object>} New template
     */
    async duplicateTemplate(id) {
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to duplicate templates');
        }
        
        // Get original template
        const original = await this.getTemplateById(id);
        
        // Create new template data
        const duplicateData = {
            name: `${original.name} (Copy)`,
            description: original.description,
            type: original.type,
            tags: original.tags || [],
            skillLines: original.data.skillLines,
            triggers: original.data.triggers,
            conditions: original.data.conditions,
            category: original.data.category,
            icon: original.data.icon,
            difficulty: original.data.difficulty
        };
        
        return await this.createTemplate(duplicateData);
    }
    
    // ========================================
    // VALIDATION
    // ========================================
    
    /**
     * Validate template data
     * @param {Object} data - Template data to validate
     * @returns {Object} Validation result
     */
    validateTemplate(data) {
        // Name validation
        if (!data.name || typeof data.name !== 'string') {
            return { valid: false, error: 'Template name is required' };
        }
        
        const name = data.name.trim();
        if (name.length < 3) {
            return { valid: false, error: 'Template name must be at least 3 characters' };
        }
        if (name.length > 50) {
            return { valid: false, error: 'Template name must be 50 characters or less' };
        }
        
        // Description validation
        if (!data.description || typeof data.description !== 'string') {
            return { valid: false, error: 'Template description is required' };
        }
        
        const description = data.description.trim();
        if (description.length < 10) {
            return { valid: false, error: 'Template description must be at least 10 characters' };
        }
        if (description.length > 500) {
            return { valid: false, error: 'Template description must be 500 characters or less' };
        }
        
        // Skill lines validation
        if (!data.skillLines || !Array.isArray(data.skillLines) || data.skillLines.length === 0) {
            return { valid: false, error: 'Template must have at least one skill line' };
        }
        
        if (data.skillLines.length > 50) {
            return { valid: false, error: 'Template cannot have more than 50 skill lines' };
        }
        
        // Tags validation (optional)
        if (data.tags && Array.isArray(data.tags)) {
            if (data.tags.length > 10) {
                return { valid: false, error: 'Template cannot have more than 10 tags' };
            }
            
            for (const tag of data.tags) {
                if (tag.length < 2 || tag.length > 20) {
                    return { valid: false, error: 'Each tag must be 2-20 characters' };
                }
            }
        }
        
        return { valid: true };
    }
    
    // ========================================
    // AUTO-DETECTION UTILITIES
    // ========================================
    
    /**
     * Detect template type based on triggers
     * @param {Array} skillLines - Array of skill line strings
     * @returns {string} 'mob' or 'skill'
     */
    detectTemplateType(skillLines) {
        if (!Array.isArray(skillLines)) return 'skill';
        
        const hasTriggers = skillLines.some(line => 
            typeof line === 'string' && line.includes('~on')
        );
        
        return hasTriggers ? 'mob' : 'skill';
    }
    
    /**
     * Extract triggers from skill lines
     * @param {Array} skillLines - Array of skill line strings
     * @returns {Array} Array of trigger strings
     */
    extractTriggers(skillLines) {
        if (!Array.isArray(skillLines)) return [];
        
        const triggers = [];
        const triggerPattern = /~on[A-Za-z]+(?::\d+)?/g;
        
        skillLines.forEach(line => {
            if (typeof line === 'string') {
                const matches = line.match(triggerPattern);
                if (matches) {
                    triggers.push(...matches);
                }
            }
        });
        
        return [...new Set(triggers)]; // Remove duplicates
    }
    
    /**
     * Suggest category based on mechanics used
     * @param {Array} skillLines - Array of skill line strings
     * @returns {string} Suggested category
     */
    suggestCategory(skillLines) {
        if (!Array.isArray(skillLines)) return 'utility';
        
        const text = skillLines.join(' ').toLowerCase();
        
        if (text.includes('damage') || text.includes('attack') || text.includes('strike')) return 'combat';
        if (text.includes('heal') || text.includes('regenerate') || text.includes('restore')) return 'healing';
        if (text.includes('summon') || text.includes('spawn')) return 'summons';
        if (text.includes('projectile') || text.includes('shoot') || text.includes('arrow')) return 'projectiles';
        if (text.includes('particle') || text.includes('sound') || text.includes('effect')) return 'effects';
        if (text.includes('teleport') || text.includes('leap') || text.includes('jump') || text.includes('dash')) return 'movement';
        if (text.includes('potion') || text.includes('buff') || text.includes('speed') || text.includes('strength')) return 'buffs';
        if (text.includes('slow') || text.includes('weak') || text.includes('poison') || text.includes('wither')) return 'debuffs';
        if (text.includes('aura') || text.includes('radius') || text.includes('nearby')) return 'auras';
        
        return 'utility';
    }
    
    /**
     * Suggest icon based on category or content
     * @param {Array} skillLines - Array of skill line strings
     * @returns {string} Emoji icon
     */
    suggestIcon(skillLines) {
        const category = this.suggestCategory(skillLines);
        const text = skillLines.join(' ').toLowerCase();
        
        // Specific icons based on content
        if (text.includes('fire') || text.includes('ignite') || text.includes('burn')) return '🔥';
        if (text.includes('ice') || text.includes('frost') || text.includes('freeze')) return '❄️';
        if (text.includes('lightning') || text.includes('thunder') || text.includes('shock')) return '⚡';
        if (text.includes('poison') || text.includes('toxic')) return '🧪';
        if (text.includes('blood') || text.includes('vampire')) return '🩸';
        if (text.includes('dark') || text.includes('shadow')) return '🌑';
        if (text.includes('light') || text.includes('holy')) return '✨';
        if (text.includes('explosion') || text.includes('blast')) return '💥';
        
        // Category-based icons
        const categoryIcons = {
            combat: '⚔️',
            healing: '💚',
            summons: '👾',
            projectiles: '🎯',
            effects: '✨',
            movement: '🏃',
            buffs: '💪',
            debuffs: '🐌',
            auras: '🌟',
            utility: '🔧'
        };
        
        return categoryIcons[category] || '📦';
    }
    
    /**
     * Calculate difficulty based on complexity
     * @param {Array} skillLines - Array of skill line strings
     * @returns {string} 'easy', 'intermediate', or 'advanced'
     */
    calculateDifficulty(skillLines) {
        if (!Array.isArray(skillLines)) return 'easy';
        
        const lineCount = skillLines.length;
        
        if (lineCount === 1) return 'easy';
        if (lineCount <= 3) return 'intermediate';
        return 'advanced';
    }
    
    // ========================================
    // HELPER METHODS
    // ========================================
    
    /**
     * Process template from database format to UI format
     * @param {Object} dbTemplate - Template from database
     * @returns {Object} Processed template
     */
    processTemplate(dbTemplate) {
        return {
            id: dbTemplate.id,
            owner_id: dbTemplate.owner_id,
            ownerName: dbTemplate.owner?.email?.split('@')[0] || 'Unknown',
            name: dbTemplate.name,
            description: dbTemplate.description,
            type: dbTemplate.type,
            tags: dbTemplate.tags || [],
            created_at: dbTemplate.created_at,
            updated_at: dbTemplate.updated_at,
            
            // Flatten data object for easier access
            skillLines: dbTemplate.data?.skillLines || [],
            triggers: dbTemplate.data?.triggers || [],
            conditions: dbTemplate.data?.conditions || [],
            category: dbTemplate.data?.category || 'utility',
            icon: dbTemplate.data?.icon || '📦',
            difficulty: dbTemplate.data?.difficulty || 'easy',
            
            // Keep original data object
            data: dbTemplate.data,
            
            // UI helpers
            isBuiltIn: false,
            requiresMobFile: dbTemplate.type === 'mob'
        };
    }
    
    /**
     * Format error message for user display
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message
     */
    formatError(error) {
        if (error.message?.includes('JWT')) {
            return 'Session expired. Please log in again.';
        }
        if (error.message?.includes('permission')) {
            return 'You do not have permission to perform this action.';
        }
        if (error.message?.includes('duplicate')) {
            return 'A template with this name already exists.';
        }
        
        return error.message || 'An unexpected error occurred';
    }
}

// Export for use in other modules
window.TemplateManager = TemplateManager;

console.log('✅ TemplateManager loaded');
