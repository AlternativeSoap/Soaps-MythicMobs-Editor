/**
 * Template Migration Script
 * Migrates hardcoded templates from skillTemplates.js to Supabase database
 * Run this script once to populate the database with official templates
 */

class TemplateMigration {
    constructor(supabaseClient, authManager, templateManager) {
        this.supabase = supabaseClient;
        this.auth = authManager;
        this.templateManager = templateManager;
        this.results = {
            success: 0,
            failed: 0,
            errors: []
        };
    }
    
    /**
     * Convert built-in template to new format
     * @param {Object} builtInTemplate - Template from skillTemplates.js
     * @param {string} context - 'mob' or 'skill'
     * @returns {Object} Converted template data
     */
    convertBuiltInTemplate(builtInTemplate, context) {
        // Parse skill lines (may contain \n for multiple lines)
        const skillLineString = builtInTemplate.skillLine || '';
        const lines = skillLineString.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && l.startsWith('-'));
        
        // Detect if this should be multi-section
        // (Currently all built-in templates are single-section, but structure varies)
        const sections = [{
            name: builtInTemplate.name.replace(/[^a-zA-Z0-9]/g, ''),
            lines: lines
        }];
        
        // Detect structure type (database only allows 'single' or 'pack')
        // Single section = 'single', multiple sections would be 'pack'
        let structure_type = 'single';
        
        return {
            name: builtInTemplate.name,
            description: builtInTemplate.description,
            type: context,
            structure_type: structure_type,
            is_official: true,
            sections: sections,
            skillLines: lines, // Backward compatibility
            tags: ['official', context, builtInTemplate.category, builtInTemplate.difficulty],
            category: builtInTemplate.category,
            icon: builtInTemplate.icon,
            difficulty: builtInTemplate.difficulty
        };
    }
    
    /**
     * Migrate all templates from skillTemplates.js
     * @param {string} systemUserId - User ID to assign as owner (should be admin/system account)
     * @returns {Promise<Object>} Migration results
     */
    async migrateAll(systemUserId) {
        
        if (!systemUserId) {
            throw new Error('System user ID is required for migration');
        }
        
        if (!window.SKILL_TEMPLATES) {
            throw new Error('SKILL_TEMPLATES not found. Make sure skillTemplates.js is loaded.');
        }
        
        this.results = { success: 0, failed: 0, errors: [] };
        const templatesToMigrate = [];
        
        // Collect all templates
        ['mob', 'skill'].forEach(context => {
            const contextTemplates = window.SKILL_TEMPLATES[context] || {};
            
            Object.keys(contextTemplates).forEach(category => {
                const templates = contextTemplates[category] || [];
                
                templates.forEach(template => {
                    const converted = this.convertBuiltInTemplate(template, context);
                    converted.id = template.id;
                    converted.owner_id = systemUserId;
                    templatesToMigrate.push(converted);
                });
            });
        });
        
        if (window.DEBUG_MODE) console.log(`Found ${templatesToMigrate.length} templates to migrate`);
        
        // Migrate in batches
        const batchSize = 10;
        for (let i = 0; i < templatesToMigrate.length; i += batchSize) {
            const batch = templatesToMigrate.slice(i, i + batchSize);
            await this.migrateBatch(batch);
            
            // Progress update
            if (window.DEBUG_MODE) console.log(`Progress: ${Math.min(i + batchSize, templatesToMigrate.length)}/${templatesToMigrate.length}`);
        }
        if (window.DEBUG_MODE) console.log(`Success: ${this.results.success}`);
        if (window.DEBUG_MODE) console.log(`Failed: ${this.results.failed}`);
        
        if (this.results.errors.length > 0 && window.DEBUG_MODE) {
            console.log('Errors:', this.results.errors);
        }
        
        return this.results;
    }
    
    /**
     * Migrate a batch of templates
     * @param {Array} batch - Array of template data
     */
    async migrateBatch(batch) {
        for (const templateData of batch) {
            try {
                // Prepare for database insertion
                const dbTemplate = {
                    owner_id: templateData.owner_id,
                    name: templateData.name,
                    description: templateData.description,
                    type: templateData.type,
                    structure_type: templateData.structure_type,
                    is_official: true,
                    tags: templateData.tags,
                    data: {
                        sections: templateData.sections,
                        skillLines: templateData.skillLines,
                        triggers: this.templateManager.extractTriggers(templateData.skillLines),
                        conditions: [],
                        category: templateData.category,
                        icon: templateData.icon,
                        difficulty: templateData.difficulty
                    }
                };
                
                const { error } = await this.supabase
                    .from('templates')
                    .insert(dbTemplate);
                
                if (error) {
                    throw error;
                }
                
                this.results.success++;
                if (window.DEBUG_MODE) console.log(`Migrated: ${templateData.name}`);
                
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({
                    template: templateData.name,
                    error: error.message
                });
                console.error(`Failed to migrate ${templateData.name}:`, error);
            }
        }
    }
    
    /**
     * Verify migration - check if templates exist in database
     * @returns {Promise<Object>} Verification results
     */
    async verify() {
        
        try {
            const { data, error } = await this.supabase
                .from('templates')
                .select('id, name, is_official, structure_type')
                .eq('is_official', true);
            
            if (error) throw error;
            
            if (window.DEBUG_MODE) console.log(`Found ${data.length} official templates in database`);
            
            // Group by structure type
            const byStructure = data.reduce((acc, t) => {
                acc[t.structure_type] = (acc[t.structure_type] || 0) + 1;
                return acc;
            }, {});
            
            if (window.DEBUG_MODE) console.log('By structure type:', byStructure);
            
            return {
                total: data.length,
                byStructure: byStructure,
                templates: data
            };
            
        } catch (error) {
            console.error('Verification failed:', error);
            throw error;
        }
    }
    
    /**
     * Rollback migration - delete all official templates
     * WARNING: This will permanently delete all official templates
     * @returns {Promise<number>} Number of templates deleted
     */
    async rollback() {
        console.warn('Rolling back migration - deleting all official templates...');
        
        try {
            const { data, error } = await this.supabase
                .from('templates')
                .delete()
                .eq('is_official', true)
                .select();
            
            if (error) throw error;
            
            if (window.DEBUG_MODE) console.log(`Deleted ${data.length} official templates`);
            return data.length;
            
        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }
}

// Export for use
window.TemplateMigration = TemplateMigration;

/**
 * Usage example:
 * 
 * // 1. Make sure you're logged in as admin
 * await window.authManager.signIn('admin@example.com', 'password');
 * 
 * // 2. Get your user ID (this will be the owner of official templates)
 * const userId = window.authManager.getCurrentUser().id;
 * 
 * // 3. Create migration instance
 * const migration = new TemplateMigration(
 *   window.supabaseClient, 
 *   window.authManager,
 *   window.templateManager
 * );
 * 
 * // 4. Run migration
 * const results = await migration.migrateAll(userId);
 * 
 * // 5. Verify
 * await migration.verify();
 * 
 * // 6. If needed, rollback
 * // await migration.rollback();
 */
