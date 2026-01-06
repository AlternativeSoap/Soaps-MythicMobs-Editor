/**
 * Template Manager
 * API layer for managing user-created templates in Supabase
 * Handles CRUD operations, caching, validation, and auto-detection
 */

class TemplateManager {
    constructor(supabaseClient, authManager) {
        this.supabase = supabaseClient;
        this.auth = authManager;
        
        // Use IntelligentCacheManager with 5-minute TTL
        this.cache = new IntelligentCacheManager({
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: 100, // Max 100 template entries
            enableAdaptiveTTL: true
        });
    }
    
    // ========================================
    // CACHE MANAGEMENT
    // ========================================
    
    /**
     * Check if cache is valid
     */
    isCacheValid() {
        return this.cache.has('templates');
    }
    
    /**
     * Invalidate cache (force refresh)
     */
    invalidateCache() {
        this.cache.delete('templates');
    }
    
    /**
     * Set cache
     */
    setCache(templates) {
        this.cache.set('templates', templates, {
            tags: ['templates', 'user-content']
        });
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
        
        // Check template limit (skip for admins)
        const isAdmin = window.adminManager?.isAdmin || false;
        if (!isAdmin && !templateData.is_official) {
            const limitCheck = await this.checkTemplateLimit(currentUser.id);
            if (!limitCheck.allowed) {
                throw new Error(limitCheck.message);
            }
        }
        
        // Detect structure type and normalize data
        const structureInfo = this.detectStructureType(templateData);
        const sections = templateData.sections || (templateData.skillLines ? [{
            name: 'DefaultSkill',
            lines: templateData.skillLines
        }] : []);
        
// Get all lines for analysis (flatten sections)
        const allLines = sections.flatMap(s => s.lines || []);
        
        // Check if this is a mob template with mob configurations
        const isMobTemplate = templateData.entity_type === 'mob';
        const hasMobConfigs = templateData.mobConfigs && templateData.mobConfigs.length > 0;
        const sectionMobConfigs = sections.filter(s => s.mobConfig).map(s => s.mobConfig);
        
        // Prepare template object for database
        const template = {
            owner_id: currentUser.id,
            name: templateData.name.trim(),
            description: templateData.description.trim(),
            entity_type: templateData.entity_type || templateData.type || this.detectTemplateType(allLines),
            tags: templateData.tags || [],
            structure_type: structureInfo.type,
            is_official: templateData.is_official || false,
            // Set approval status based on whether admin is creating official template
            approval_status: (templateData.is_official && isAdmin) ? 'approved' : 'pending',
            data: {
                sections: sections,
                // Keep skillLines for backward compatibility
                skillLines: sections.length === 1 ? sections[0].lines : allLines,
                triggers: templateData.triggers || this.extractTriggers(allLines),
                conditions: templateData.conditions || [],
                category: templateData.category || this.suggestCategory(allLines),
                icon: templateData.icon || this.suggestIcon(allLines),
                difficulty: templateData.difficulty || this.calculateDifficulty(allLines),
                // Store mob configurations for mob templates
                mobConfigs: hasMobConfigs ? templateData.mobConfigs : 
                           (sectionMobConfigs.length > 0 ? sectionMobConfigs : null)
            }
        };
        
        // If marked as official by admin, record approval info
        if (templateData.is_official && isAdmin) {
            template.approved_by = currentUser.id;
            template.approved_at = new Date().toISOString();
        }
        
        try {
            const { data, error } = await this.supabase
                .from('templates')
                .insert(template)
                .select()
                .single();
            
            if (error) throw error;
            
            // Track template creation activity
            window.activityTracker?.trackTemplateCreate(data.id, templateData.name);
            
            // Invalidate cache
            this.invalidateCache();
            
            return data;
        } catch (error) {
            console.error('Failed to create template:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    /**
     * Check if user has reached their template limit
     * @param {string} userId - User ID to check
     * @returns {Promise<Object>} { allowed: boolean, message: string, current: number, max: number }
     */
    async checkTemplateLimit(userId) {
        try {
            // Get system settings for limits
            const maxTemplates = await this.getSystemSetting('maxTemplatesPerUser', 10);
            
            // Count user's existing templates
            const { count, error } = await this.supabase
                .from('templates')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', userId)
                .eq('deleted', false);
            
            if (error) {
                console.error('Error checking template count:', error);
                // Allow on error to not block users
                return { allowed: true, message: '', current: 0, max: maxTemplates };
            }
            
            const currentCount = count || 0;
            
            if (currentCount >= maxTemplates) {
                return {
                    allowed: false,
                    message: `You have reached the maximum limit of ${maxTemplates} templates. Please delete some existing templates before creating new ones.`,
                    current: currentCount,
                    max: maxTemplates
                };
            }
            
            return {
                allowed: true,
                message: '',
                current: currentCount,
                max: maxTemplates
            };
        } catch (error) {
            console.error('Error in checkTemplateLimit:', error);
            // Allow on error
            return { allowed: true, message: '', current: 0, max: 10 };
        }
    }
    
    /**
     * Get a system setting value
     * @param {string} key - Setting key
     * @param {any} defaultValue - Default value if not found
     * @returns {Promise<any>} Setting value
     */
    async getSystemSetting(key, defaultValue) {
        try {
            // Check global cache first
            if (window.systemSettings && window.systemSettings[key] !== undefined) {
                return window.systemSettings[key];
            }
            
            // Try database
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', key)
                    .single();
                
                if (!error && data) {
                    return data.value;
                }
            }
            
            // Fall back to localStorage
            const localSettings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
            if (localSettings[key] !== undefined) {
                return localSettings[key];
            }
            
            return defaultValue;
        } catch (error) {
            console.error(`Error getting system setting ${key}:`, error);
            return defaultValue;
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
            const cached = this.cache.get('templates');
            return type ? cached.filter(t => (t.entity_type || t.type) === type) : cached;
        }
        
        try {
            // Get current user to include their own templates regardless of status
            const currentUserId = this.auth?.getCurrentUser()?.id;
            
            // Query templates: approved templates OR user's own templates (any status)
            let query = this.supabase
                .from('templates')
                .select('*')
                .eq('deleted', false)
                .order('created_at', { ascending: false });
            
            if (type) {
                query = query.eq('entity_type', type);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Filter: show approved templates + user's own templates (any status)
            const filteredData = data.filter(t => 
                t.approval_status === 'approved' || 
                t.owner_id === currentUserId
            );
            
            // Process and cache
            const templates = filteredData.map(t => this.processTemplate(t));
            
            if (!type) {
                // Only cache if fetching all templates
                this.setCache(templates);
            }
            
            if (window.DEBUG_MODE) console.log(`Loaded ${templates.length} templates from Supabase (${data.length} total, filtered for approval)`);
            
            return templates;
        } catch (error) {
            console.error('Failed to load templates:', error);
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
            console.error('Failed to load user templates:', error);
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
                .select('*')
                .eq('id', id)
                .eq('deleted', false)
                .single();
            
            if (error) throw error;
            
            return this.processTemplate(data);
        } catch (error) {
            console.error('Failed to load template:', error);
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
            
            // Invalidate cache
            this.invalidateCache();
            
            return this.processTemplate(data);
        } catch (error) {
            console.error('Failed to update template:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    // ========================================
    // DELETE
    // ========================================
    
    /**
     * Delete template (hard delete for user templates, soft delete if is_deleted column exists)
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
        
        const currentUser = this.auth.getCurrentUser();
        const isAdmin = window.adminManager?.isAdmin || false;
        
        try {
            // First, verify the template exists and check ownership
            const { data: template, error: fetchError } = await this.supabase
                .from('templates')
                .select('id, owner_id, name')
                .eq('id', id)
                .single();
            
            if (fetchError) {
                console.error('Error fetching template:', fetchError);
                throw new Error('Template not found');
            }
            
            // Check if user can delete (owner or admin)
            if (template.owner_id !== currentUser.id && !isAdmin) {
                throw new Error('You can only delete your own templates');
            }
            
            // Try hard delete first (permanently remove from database)
            const { error: deleteError } = await this.supabase
                .from('templates')
                .delete()
                .eq('id', id);
            
            if (deleteError) {
                // If hard delete fails due to RLS, try soft delete
                const { error: softDeleteError } = await this.supabase
                    .from('templates')
                    .update({ 
                        is_deleted: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);
                
                if (softDeleteError) {
                    throw softDeleteError;
                }
            }
            
            // Invalidate cache
            this.invalidateCache();
            
            return true;
        } catch (error) {
            console.error('Failed to delete template:', error);
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
            entity_type: original.entity_type || original.type,
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
    // CREATE FROM EDITORS
    // ========================================

    /**
     * Create a template from a skill section
     * @param {Object} skillData - The skill section data from skillEditor
     * @param {Object} metadata - Template metadata (name, description, tags, category)
     * @returns {Promise<Object>} Created template
     */
    async createFromSkillEditor(skillData, metadata = {}) {
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to create templates');
        }

        if (!skillData) {
            throw new Error('No skill data provided');
        }

        // Extract template data from skill section
        const templateData = {
            name: metadata.name || skillData.name || 'Untitled Skill Template',
            description: metadata.description || `Skill template created from ${skillData.name || 'skill section'}`,
            entity_type: 'skill',
            tags: metadata.tags || [],
            category: metadata.category || this.suggestCategory(skillData.skillLines || []),
            icon: metadata.icon || this.suggestIcon(skillData.skillLines || []),
            difficulty: metadata.difficulty || this.calculateDifficulty(skillData.skillLines || []),
            
            // Store the full skill section data
            skillLines: skillData.skillLines || [],
            triggers: skillData.triggers || [],
            conditions: skillData.conditions || [],
            
            // Store full skill section for complete restoration
            fullSection: {
                name: skillData.name,
                cooldown: skillData.cooldown,
                conditions: skillData.conditions,
                targetConditions: skillData.targetConditions,
                triggerConditions: skillData.triggerConditions,
                skills: skillData.skillLines || skillData.skills,
                triggers: skillData.triggers,
                // Include any other skill-specific settings
                cancelIfNoTargets: skillData.cancelIfNoTargets,
                onCooldownSkill: skillData.onCooldownSkill,
                onNoTargetSkill: skillData.onNoTargetSkill
            }
        };

        return await this.createTemplate(templateData);
    }

    /**
     * Create a template from a mob section
     * @param {Object} mobData - The mob section data from mobEditor
     * @param {Object} metadata - Template metadata (name, description, tags, category)
     * @param {Object} options - Options for what sections to include
     * @returns {Promise<Object>} Created template
     */
    async createFromMobEditor(mobData, metadata = {}, options = {}) {
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to create templates');
        }

        if (!mobData) {
            throw new Error('No mob data provided');
        }

        // Default to including all sections
        const includeSections = {
            basic: options.includeBasic !== false,
            stats: options.includeStats !== false,
            equipment: options.includeEquipment !== false,
            skills: options.includeSkills !== false,
            drops: options.includeDrops !== false,
            ai: options.includeAI !== false,
            options: options.includeOptions !== false,
            bossBar: options.includeBossBar !== false,
            disguise: options.includeDisguise !== false,
            model: options.includeModel !== false
        };

        // Build the full section data based on selected sections
        const fullSection = {};

        if (includeSections.basic) {
            fullSection.name = mobData.name;
            fullSection.type = mobData.type;
            fullSection.displayName = mobData.displayName;
            fullSection.health = mobData.health;
            fullSection.damage = mobData.damage;
            fullSection.armor = mobData.armor;
            fullSection.faction = mobData.faction;
            fullSection.level = mobData.level;
        }

        if (includeSections.stats) {
            fullSection.healthScale = mobData.healthScale;
            fullSection.damageScale = mobData.damageScale;
            fullSection.knockbackResistance = mobData.knockbackResistance;
            fullSection.movementSpeed = mobData.movementSpeed;
            fullSection.followRange = mobData.followRange;
            fullSection.attackSpeed = mobData.attackSpeed;
        }

        if (includeSections.equipment) {
            fullSection.equipment = mobData.equipment;
        }

        if (includeSections.skills) {
            fullSection.skills = mobData.skills;
        }

        if (includeSections.drops) {
            fullSection.drops = mobData.drops;
            fullSection.droptables = mobData.droptables;
        }

        if (includeSections.ai) {
            fullSection.aiGoalSelectors = mobData.aiGoalSelectors;
            fullSection.aiTargetSelectors = mobData.aiTargetSelectors;
        }

        if (includeSections.options) {
            fullSection.options = mobData.options;
        }

        if (includeSections.bossBar) {
            fullSection.bossBar = mobData.bossBar;
        }

        if (includeSections.disguise) {
            fullSection.disguise = mobData.disguise;
        }

        if (includeSections.model) {
            fullSection.model = mobData.model;
            fullSection.modelEngine = mobData.modelEngine;
        }

        // Extract template data
        const templateData = {
            name: metadata.name || mobData.name || 'Untitled Mob Template',
            description: metadata.description || `Mob template created from ${mobData.name || 'mob section'}`,
            entity_type: 'mob',
            tags: metadata.tags || [],
            category: metadata.category || this.suggestMobCategory(mobData),
            icon: metadata.icon || this.suggestMobIcon(mobData),
            difficulty: metadata.difficulty || this.calculateMobDifficulty(mobData),
            
            // Store skill lines if present (for compatibility)
            skillLines: this.extractMobSkillLines(mobData),
            triggers: [],
            conditions: [],
            
            // Store full mob section for complete restoration
            fullSection: fullSection,
            
            // Store which sections are included
            includedSections: Object.keys(includeSections).filter(k => includeSections[k])
        };

        return await this.createTemplate(templateData);
    }

    /**
     * Suggest a category for mob templates
     * @param {Object} mobData - Mob data
     * @returns {string} Suggested category
     */
    suggestMobCategory(mobData) {
        const type = (mobData.type || '').toLowerCase();
        const name = (mobData.name || '').toLowerCase();
        const displayName = (mobData.displayName || '').toLowerCase();
        
        // Check for boss indicators
        if (mobData.bossBar || name.includes('boss') || displayName.includes('boss')) {
            return 'boss';
        }
        
        // Check for elite/miniboss
        if (name.includes('elite') || displayName.includes('elite') || 
            name.includes('mini') || displayName.includes('champion')) {
            return 'elite';
        }
        
        // Check by mob type
        if (['zombie', 'skeleton', 'phantom', 'wither', 'zombie_villager'].includes(type)) {
            return 'undead';
        }
        
        if (['wolf', 'spider', 'cave_spider', 'silverfish', 'bee', 'endermite'].includes(type)) {
            return 'creature';
        }
        
        if (['villager', 'iron_golem', 'pillager', 'vindicator', 'witch'].includes(type)) {
            return 'humanoid';
        }
        
        if (['ender_dragon', 'wither', 'elder_guardian', 'warden'].includes(type)) {
            return 'boss';
        }
        
        return 'general';
    }

    /**
     * Suggest an icon for mob templates
     * @param {Object} mobData - Mob data
     * @returns {string} Suggested icon
     */
    suggestMobIcon(mobData) {
        const type = (mobData.type || '').toUpperCase();
        const name = (mobData.name || '').toLowerCase();
        
        // Map mob types to spawn eggs
        const spawnEggMap = {
            'ZOMBIE': 'ZOMBIE_SPAWN_EGG',
            'SKELETON': 'SKELETON_SPAWN_EGG',
            'SPIDER': 'SPIDER_SPAWN_EGG',
            'CREEPER': 'CREEPER_SPAWN_EGG',
            'ENDERMAN': 'ENDERMAN_SPAWN_EGG',
            'BLAZE': 'BLAZE_SPAWN_EGG',
            'WITCH': 'WITCH_SPAWN_EGG',
            'WITHER_SKELETON': 'WITHER_SKELETON_SPAWN_EGG',
            'PIGLIN': 'PIGLIN_SPAWN_EGG',
            'VINDICATOR': 'VINDICATOR_SPAWN_EGG',
            'PILLAGER': 'PILLAGER_SPAWN_EGG'
        };
        
        if (spawnEggMap[type]) {
            return spawnEggMap[type];
        }
        
        // Default icons based on category
        if (name.includes('boss')) return 'WITHER_SKELETON_SKULL';
        if (name.includes('elite')) return 'DIAMOND_SWORD';
        
        return 'SPAWNER';
    }

    /**
     * Calculate difficulty for mob templates
     * @param {Object} mobData - Mob data
     * @returns {string} Difficulty level
     */
    calculateMobDifficulty(mobData) {
        let score = 0;
        
        // Health scoring
        const health = parseFloat(mobData.health) || 20;
        if (health > 200) score += 3;
        else if (health > 100) score += 2;
        else if (health > 50) score += 1;
        
        // Damage scoring
        const damage = parseFloat(mobData.damage) || 0;
        if (damage > 15) score += 3;
        else if (damage > 10) score += 2;
        else if (damage > 5) score += 1;
        
        // Skills scoring
        const skillCount = (mobData.skills || []).length;
        if (skillCount > 10) score += 3;
        else if (skillCount > 5) score += 2;
        else if (skillCount > 0) score += 1;
        
        // Boss bar indicates higher difficulty
        if (mobData.bossBar) score += 2;
        
        // Map score to difficulty
        if (score >= 8) return 'expert';
        if (score >= 5) return 'advanced';
        if (score >= 2) return 'intermediate';
        return 'beginner';
    }

    /**
     * Extract skill lines from mob data
     * @param {Object} mobData - Mob data
     * @returns {Array} Skill lines
     */
    extractMobSkillLines(mobData) {
        const skills = mobData.skills || [];
        return skills.map(skill => {
            if (typeof skill === 'string') {
                return { line: skill };
            }
            return skill;
        });
    }
    
    // ========================================
    // RATINGS
    // ========================================
    
    /**
     * Rate a template (1-5 stars)
     * @param {string} templateId - Template ID
     * @param {number} rating - Rating value (1-5)
     * @returns {Promise<Object>} Rating result
     */
    async rateTemplate(templateId, rating, reviewComment = null) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to rate templates');
        }
        
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            // Upsert rating (insert or update)
            const { data, error } = await this.supabase
                .from('template_ratings')
                .upsert({
                    template_id: templateId,
                    user_id: currentUser.id,
                    rating: rating,
                    review_comment: reviewComment,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'template_id,user_id'
                })
                .select()
                .single();
            
            if (error) throw error;
            
            // Invalidate cache since rating affects template stats
            this.invalidateCache();
            
            return data;
        } catch (error) {
            console.error('Failed to rate template:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    /**
     * Get current user's rating for a template
     * @param {string} templateId - Template ID
     * @returns {Promise<Object|null>} User's rating object or null
     */
    async getUserRating(templateId) {
        if (!this.supabase || !this.auth?.isAuthenticated()) {
            return null;
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            const { data, error } = await this.supabase
                .from('template_ratings')
                .select('rating, review_comment')
                .eq('template_id', templateId)
                .eq('user_id', currentUser.id)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                throw error;
            }
            
            return data?.rating || null;
        } catch (error) {
            console.error('Failed to get user rating:', error);
            return null;
        }
    }
    
    /**
     * Remove user's rating for a template
     * @param {string} templateId - Template ID
     * @returns {Promise<boolean>} Success
     */
    async removeRating(templateId) {
        if (!this.supabase || !this.auth?.isAuthenticated()) {
            return false;
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            const { error } = await this.supabase
                .from('template_ratings')
                .delete()
                .eq('template_id', templateId)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            this.invalidateCache();
            return true;
        } catch (error) {
            console.error('Failed to remove rating:', error);
            return false;
        }
    }
    
    // ========================================
    // CLOUD FAVORITES
    // ========================================
    
    /**
     * Get user's favorite templates from cloud
     * @returns {Promise<string[]>} Array of template IDs
     */
    async getCloudFavorites() {
        if (!this.supabase || !this.auth?.isAuthenticated()) {
            return [];
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            const { data, error } = await this.supabase
                .from('user_favorites')
                .select('template_id')
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            return (data || []).map(f => f.template_id);
        } catch (error) {
            console.error('Failed to get cloud favorites:', error);
            return [];
        }
    }
    
    /**
     * Add template to cloud favorites
     * @param {string} templateId - Template ID
     * @returns {Promise<boolean>} Success
     */
    async addCloudFavorite(templateId) {
        if (!this.supabase || !this.auth?.isAuthenticated()) {
            return false;
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            const { error } = await this.supabase
                .from('user_favorites')
                .insert({
                    user_id: currentUser.id,
                    template_id: templateId
                });
            
            // Ignore duplicate errors
            if (error && error.code !== '23505') {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to add cloud favorite:', error);
            return false;
        }
    }
    
    /**
     * Remove template from cloud favorites
     * @param {string} templateId - Template ID
     * @returns {Promise<boolean>} Success
     */
    async removeCloudFavorite(templateId) {
        if (!this.supabase || !this.auth?.isAuthenticated()) {
            return false;
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            const { error } = await this.supabase
                .from('user_favorites')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('template_id', templateId);
            
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('Failed to remove cloud favorite:', error);
            return false;
        }
    }
    
    /**
     * Sync local favorites to cloud (merge strategy) - OPTIMIZED with batch operations
     * @param {string[]} localFavorites - Local favorite IDs
     * @returns {Promise<string[]>} Merged favorites
     */
    async syncFavorites(localFavorites = []) {
        if (!this.supabase || !this.auth?.isAuthenticated()) {
            return localFavorites;
        }
        
        try {
            // Get cloud favorites
            const cloudFavorites = await this.getCloudFavorites();
            
            // Use Set for O(1) lookups instead of Array.includes()
            const cloudFavoritesSet = new Set(cloudFavorites);
            const localFavoritesSet = new Set(localFavorites);
            
            // Merge: union of both sets
            const merged = [...new Set([...localFavorites, ...cloudFavorites])];
            
            // Find local-only favorites (not in cloud)
            const localOnly = localFavorites.filter(id => !cloudFavoritesSet.has(id));
            
            // PERFORMANCE: Batch insert local-only favorites using Promise.all
            // instead of sequential await for each
            if (localOnly.length > 0) {
                const currentUser = this.auth.getCurrentUser();
                
                // Prepare batch insert data
                const insertData = localOnly.map(templateId => ({
                    user_id: currentUser.id,
                    template_id: templateId
                }));
                
                // Try batch insert (much faster than individual inserts)
                try {
                    await this.supabase
                        .from('user_favorites')
                        .upsert(insertData, { 
                            onConflict: 'user_id,template_id',
                            ignoreDuplicates: true 
                        });
                } catch (batchError) {
                    // Fallback: parallel individual inserts if batch fails
                    console.warn('Batch insert failed, using parallel inserts:', batchError);
                    await Promise.all(
                        localOnly.map(id => this.addCloudFavorite(id).catch(() => false))
                    );
                }
            }
            
            return merged;
        } catch (error) {
            console.error('Failed to sync favorites:', error);
            return localFavorites;
        }
    }
    
    // ========================================
    // STATISTICS TRACKING
    // ========================================
    
    /**
     * Track template view (increments view_count)
     * @param {string} templateId - Template ID
     */
    async trackTemplateView(templateId) {
        if (!this.supabase) return;
        
        try {
            await this.supabase.rpc('increment_template_view', {
                template_id: templateId
            });
        } catch (error) {
            // Silent fail - don't interrupt user flow for analytics
            console.warn('Failed to track view:', error);
        }
    }
    
    /**
     * Track template use (increments use_count)
     * @param {string} templateId - Template ID
     */
    async trackTemplateUse(templateId) {
        if (!this.supabase) return;
        
        try {
            await this.supabase.rpc('increment_template_use', {
                template_id: templateId
            });
        } catch (error) {
            // Silent fail - don't interrupt user flow for analytics
            console.warn('Failed to track use:', error);
        }
    }
    
    // ========================================
    // COMMENTS
    // ========================================
    
    /**
     * Get comments for a template with user profile info
     * @param {string} templateId - Template ID
     * @param {number} limit - Max comments to fetch
     * @param {number} offset - Pagination offset
     * @returns {Promise<Array>} Array of comments with user info
     */
    async getTemplateComments(templateId, limit = 50, offset = 0) {
        if (!this.supabase) {
            console.warn('Supabase not available');
            return [];
        }
        
        try {
            // First, get comments without the FK join (including vote counts)
            const { data: comments, error: commentsError } = await this.supabase
                .from('template_comments')
                .select(`
                    id,
                    content,
                    parent_id,
                    is_edited,
                    created_at,
                    updated_at,
                    user_id,
                    upvotes,
                    downvotes,
                    vote_score
                `)
                .eq('template_id', templateId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (commentsError) throw commentsError;
            if (!comments || comments.length === 0) return [];
            
            // Get unique user IDs
            const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
            
            // Fetch user profiles separately
            let userProfiles = {};
            if (userIds.length > 0) {
                const { data: profiles, error: profilesError } = await this.supabase
                    .from('user_profiles')
                    .select('user_id, display_name, avatar_url, bio, website_url, discord_username, is_public')
                    .in('user_id', userIds);
                
                if (!profilesError && profiles) {
                    userProfiles = profiles.reduce((acc, p) => {
                        acc[p.user_id] = p;
                        return acc;
                    }, {});
                } else if (profilesError) {
                    console.warn('Failed to fetch user profiles:', profilesError);
                }
            }
            
            // Get current user's votes on these comments
            const commentIds = comments.map(c => c.id);
            const userVotes = await this.getUserCommentVotes(commentIds);
            
            // Merge comments with user profiles and votes
            return comments.map(comment => {
                const profile = userProfiles[comment.user_id];
                return {
                    id: comment.id,
                    content: comment.content,
                    parent_id: comment.parent_id,
                    is_edited: comment.is_edited,
                    created_at: comment.created_at,
                    updated_at: comment.updated_at,
                    user_id: comment.user_id,
                    upvotes: comment.upvotes || 0,
                    downvotes: comment.downvotes || 0,
                    vote_score: comment.vote_score || 0,
                    userVote: userVotes[comment.id] || null,
                    user: profile ? {
                        display_name: profile.display_name || 'Anonymous',
                        avatar_url: profile.avatar_url,
                        bio: profile.bio,
                        website_url: profile.website_url,
                        discord_username: profile.discord_username,
                        is_public: profile.is_public
                    } : {
                        display_name: 'Anonymous',
                        avatar_url: null,
                        bio: null,
                        website_url: null,
                        discord_username: null,
                        is_public: false
                    }
                };
            });
        } catch (error) {
            console.error('Failed to load comments:', error);
            return [];
        }
    }
    
    /**
     * Add a comment to a template
     * @param {string} templateId - Template ID
     * @param {string} content - Comment content
     * @param {string|null} parentId - Parent comment ID for replies
     * @returns {Promise<Object>} Created comment
     */
    async addComment(templateId, content, parentId = null) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to comment');
        }
        
        // Validate content
        const trimmedContent = content?.trim();
        if (!trimmedContent || trimmedContent.length < 1) {
            throw new Error('Comment cannot be empty');
        }
        if (trimmedContent.length > 2000) {
            throw new Error('Comment must be 2000 characters or less');
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            // Insert comment without FK join
            const { data: comment, error: insertError } = await this.supabase
                .from('template_comments')
                .insert({
                    template_id: templateId,
                    user_id: currentUser.id,
                    content: trimmedContent,
                    parent_id: parentId
                })
                .select(`
                    id,
                    content,
                    parent_id,
                    is_edited,
                    created_at,
                    updated_at,
                    user_id
                `)
                .single();
            
            if (insertError) throw insertError;
            
            // Fetch user profile separately
            let userProfile = null;
            if (comment.user_id) {
                const { data: profile } = await this.supabase
                    .from('user_profiles')
                    .select('display_name, avatar_url, bio, website_url, discord_username, is_public')
                    .eq('user_id', comment.user_id)
                    .single();
                userProfile = profile;
            }
            
            // Return comment with user profile
            return {
                id: comment.id,
                content: comment.content,
                parent_id: comment.parent_id,
                is_edited: comment.is_edited,
                created_at: comment.created_at,
                updated_at: comment.updated_at,
                user_id: comment.user_id,
                user: userProfile ? {
                    display_name: userProfile.display_name || 'Anonymous',
                    avatar_url: userProfile.avatar_url,
                    bio: userProfile.bio,
                    website_url: userProfile.website_url,
                    discord_username: userProfile.discord_username,
                    is_public: userProfile.is_public
                } : {
                    display_name: 'Anonymous',
                    avatar_url: null
                }
            };
        } catch (error) {
            console.error('Failed to add comment:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    /**
     * Update a comment
     * @param {string} commentId - Comment ID
     * @param {string} content - New content
     * @returns {Promise<Object>} Updated comment
     */
    async updateComment(commentId, content) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to edit comments');
        }
        
        const trimmedContent = content?.trim();
        if (!trimmedContent || trimmedContent.length < 1) {
            throw new Error('Comment cannot be empty');
        }
        if (trimmedContent.length > 2000) {
            throw new Error('Comment must be 2000 characters or less');
        }
        
        try {
            const { data, error } = await this.supabase
                .from('template_comments')
                .update({
                    content: trimmedContent,
                    is_edited: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', commentId)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Failed to update comment:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    /**
     * Delete a comment (soft delete)
     * @param {string} commentId - Comment ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteComment(commentId) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to delete comments');
        }
        
        try {
            const { error } = await this.supabase
                .from('template_comments')
                .update({ is_deleted: true })
                .eq('id', commentId);
            
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('Failed to delete comment:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    // ========================================
    // COMMENT VOTING
    // ========================================
    
    /**
     * Vote on a comment (upvote or downvote)
     * @param {string} commentId - Comment ID
     * @param {number} voteType - 1 for upvote, -1 for downvote
     * @returns {Promise<Object>} Vote result with updated counts
     */
    async voteOnComment(commentId, voteType) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        if (!this.auth?.isAuthenticated()) {
            throw new Error('You must be logged in to vote');
        }
        
        if (voteType !== 1 && voteType !== -1) {
            throw new Error('Invalid vote type');
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            // Check if user already voted
            const { data: existingVote, error: checkError } = await this.supabase
                .from('comment_votes')
                .select('id, vote_type')
                .eq('comment_id', commentId)
                .eq('user_id', currentUser.id)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }
            
            if (existingVote) {
                if (existingVote.vote_type === voteType) {
                    // Same vote - remove it (toggle off)
                    const { error: deleteError } = await this.supabase
                        .from('comment_votes')
                        .delete()
                        .eq('id', existingVote.id);
                    
                    if (deleteError) throw deleteError;
                    
                    return { action: 'removed', voteType: null };
                } else {
                    // Different vote - update it
                    const { error: updateError } = await this.supabase
                        .from('comment_votes')
                        .update({ vote_type: voteType })
                        .eq('id', existingVote.id);
                    
                    if (updateError) throw updateError;
                    
                    return { action: 'changed', voteType };
                }
            } else {
                // No existing vote - insert new
                const { error: insertError } = await this.supabase
                    .from('comment_votes')
                    .insert({
                        comment_id: commentId,
                        user_id: currentUser.id,
                        vote_type: voteType
                    });
                
                if (insertError) throw insertError;
                
                return { action: 'added', voteType };
            }
        } catch (error) {
            console.error('Failed to vote on comment:', error);
            throw new Error(this.formatError(error));
        }
    }
    
    /**
     * Get user's vote on a comment
     * @param {string} commentId - Comment ID
     * @returns {Promise<number|null>} Vote type (1, -1) or null if not voted
     */
    async getUserCommentVote(commentId) {
        if (!this.supabase || !this.auth?.isAuthenticated()) {
            return null;
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            const { data, error } = await this.supabase
                .from('comment_votes')
                .select('vote_type')
                .eq('comment_id', commentId)
                .eq('user_id', currentUser.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            return data?.vote_type || null;
        } catch (error) {
            console.error('Failed to get user vote:', error);
            return null;
        }
    }
    
    /**
     * Get user's votes on multiple comments
     * @param {string[]} commentIds - Array of comment IDs
     * @returns {Promise<Object>} Map of commentId -> voteType
     */
    async getUserCommentVotes(commentIds) {
        if (!this.supabase || !this.auth?.isAuthenticated() || !commentIds.length) {
            return {};
        }
        
        const currentUser = this.auth.getCurrentUser();
        
        try {
            const { data, error } = await this.supabase
                .from('comment_votes')
                .select('comment_id, vote_type')
                .eq('user_id', currentUser.id)
                .in('comment_id', commentIds);
            
            if (error) throw error;
            
            return (data || []).reduce((acc, vote) => {
                acc[vote.comment_id] = vote.vote_type;
                return acc;
            }, {});
        } catch (error) {
            console.error('Failed to get user votes:', error);
            return {};
        }
    }
    
    /**
     * Get public user profile by user ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User profile or null
     */
    async getUserProfile(userId) {
        if (!this.supabase) {
            return null;
        }
        
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('user_id, display_name, avatar_url, bio, website_url, discord_username, is_public, created_at')
                .eq('user_id', userId)
                .single();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Failed to get user profile:', error);
            return null;
        }
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
        
        // Skill lines validation - check both skillLines and sections
        const hasSkillLines = data.skillLines && Array.isArray(data.skillLines) && data.skillLines.length > 0;
        const hasSections = data.sections && Array.isArray(data.sections) && data.sections.length > 0;
        
        // For mob templates, we don't require skill lines (they have full mob config)
        // For skill templates, we need at least one skill line or section with lines
        if (!hasSkillLines && !hasSections && data.entity_type !== 'mob') {
            return { valid: false, error: 'Template must have at least one skill line or section' };
        }
        
        // Count total lines across all sections if using multi-section format
        let totalLines = hasSkillLines ? data.skillLines.length : 0;
        if (hasSections) {
            totalLines += data.sections.reduce((sum, s) => sum + (s.lines?.length || s.skillLines?.length || 0), 0);
        }
        
        // Generous limit for complex templates (500 lines - allows boss mobs and complex skills)
        if (totalLines > 500) {
            return { valid: false, error: `Template has too many lines (${totalLines}). Maximum is 500 lines.` };
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
     * Detect structure type of template
     * @param {Object} templateData - Template data
     * @returns {Object} { type: 'single'|'pack', lineCount, sectionCount }
     * Note: Database constraint only allows 'single' or 'pack' values
     */
    detectStructureType(templateData) {
        const sections = templateData.sections || [];
        const skillLines = templateData.skillLines || [];
        
        // If sections array exists and has multiple sections -> 'pack'
        if (sections.length > 1) {
            const totalLines = sections.reduce((sum, s) => sum + (s.lines?.length || 0), 0);
            return {
                type: 'pack',
                sectionCount: sections.length,
                lineCount: totalLines
            };
        }
        
        // If sections array has one section
        if (sections.length === 1) {
            const lines = sections[0].lines || [];
            return {
                type: 'single',
                sectionCount: 1,
                lineCount: lines.length
            };
        }
        
        // Fallback to skillLines array
        return {
            type: 'single',
            sectionCount: 1,
            lineCount: skillLines.length
        };
    }
    
    /**
     * Validate section names (must be valid YAML keys)
     * @param {string} sectionName - Section name to validate
     * @returns {Object} { valid: boolean, error?: string }
     */
    validateSectionName(sectionName) {
        if (!sectionName || typeof sectionName !== 'string') {
            return { valid: false, error: 'Section name is required' };
        }
        
        // Must start with letter or underscore
        if (!/^[a-zA-Z_]/.test(sectionName)) {
            return { valid: false, error: 'Section name must start with a letter or underscore' };
        }
        
        // Can only contain letters, numbers, underscores, hyphens
        if (!/^[a-zA-Z0-9_-]+$/.test(sectionName)) {
            return { valid: false, error: 'Section name can only contain letters, numbers, underscores, and hyphens' };
        }
        
        // Length check
        if (sectionName.length < 2 || sectionName.length > 50) {
            return { valid: false, error: 'Section name must be 2-50 characters' };
        }
        
        return { valid: true };
    }
    
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
        if (!Array.isArray(skillLines)) return '⚡';
        
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
        // Extract sections (prioritize sections array, fallback to skillLines)
        let sections = dbTemplate.data?.sections || [];
        if (sections.length === 0 && dbTemplate.data?.skillLines) {
            // Convert legacy format
            sections = [{
                name: 'DefaultSkill',
                lines: dbTemplate.data.skillLines
            }];
        }
        
// Calculate structure info
        const structureInfo = this.detectStructureType({ sections });
        
        return {
            id: dbTemplate.id,
            owner_id: dbTemplate.owner_id,
            ownerName: dbTemplate.owner?.email?.split('@')[0] || 'Unknown',
            name: dbTemplate.name,
            description: dbTemplate.description,
            entity_type: dbTemplate.entity_type || dbTemplate.type,
            type: dbTemplate.entity_type || dbTemplate.type, // backward compatibility
            tags: dbTemplate.tags || [],
            structure_type: dbTemplate.structure_type || structureInfo.type,
            is_official: dbTemplate.is_official || false,
            created_at: dbTemplate.created_at,
            updated_at: dbTemplate.updated_at,
            
            // Statistics
            view_count: dbTemplate.view_count || 0,
            use_count: dbTemplate.use_count || 0,
            average_rating: dbTemplate.average_rating || 0,
            rating_count: dbTemplate.rating_count || 0,
            comment_count: dbTemplate.comment_count || 0,
            
            // Structure information
            structureInfo: structureInfo,
            
            // Sections (new format)
            sections: sections,
            
            // Flatten data object for easier access (backward compatibility)
            skillLines: dbTemplate.data?.skillLines || sections.flatMap(s => s.lines || []),
            triggers: dbTemplate.data?.triggers || [],
            conditions: dbTemplate.data?.conditions || [],
            category: dbTemplate.data?.category || 'utility',
            icon: dbTemplate.data?.icon || '📦',
            difficulty: dbTemplate.data?.difficulty || 'easy',
            
            // Keep original data object
            data: dbTemplate.data,
            
            // UI helpers
            isBuiltIn: false,
            isOfficial: dbTemplate.is_official || false,
            requiresMobFile: (dbTemplate.entity_type || dbTemplate.type) === 'mob'
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
