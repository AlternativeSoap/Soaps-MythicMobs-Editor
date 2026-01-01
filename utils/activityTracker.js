/**
 * Activity Tracker
 * Logs user activities to user_activity_logs table for analytics
 */

class ActivityTracker {
    constructor(supabaseClient = null, authManager = null) {
        this.supabase = supabaseClient;
        this.auth = authManager;
        this.enabled = true;
        this.queue = []; // Queue for batching
        this.flushInterval = null;
        this.batchSize = 10;
        this.flushDelay = 30000; // 30 seconds
        
        // Start flush interval
        this.startFlushInterval();
    }
    
    /**
     * Initialize with Supabase client (for late initialization)
     */
    init(supabaseClient, authManager) {
        this.supabase = supabaseClient;
        this.auth = authManager;
    }
    
    /**
     * Start periodic flush
     */
    startFlushInterval() {
        if (this.flushInterval) return;
        
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.flushDelay);
        
        // Also flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flush(true);
        });
    }
    
    /**
     * Track an activity
     * @param {string} activityType - Type of activity
     * @param {Object} details - Additional details
     */
    track(activityType, details = {}) {
        if (!this.enabled) return;
        
        const activity = {
            activity_type: activityType,
            details: {
                ...details,
                url: window.location.href,
                timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        };
        
        this.queue.push(activity);
        
        // Auto-flush if queue is large
        if (this.queue.length >= this.batchSize) {
            this.flush();
        }
    }
    
    /**
     * Flush queued activities to database
     * @param {boolean} sync - Use synchronous beacon API
     */
    async flush(sync = false) {
        if (!this.supabase || this.queue.length === 0) return;
        
        const activities = [...this.queue];
        this.queue = [];
        
        try {
            // Get current user ID
            const { data: { user } } = await this.supabase.auth.getUser();
            
            // Add user_id to all activities
            const withUserId = activities.map(a => ({
                ...a,
                user_id: user?.id || null
            }));
            
            if (sync && navigator.sendBeacon) {
                // Use beacon for page unload
                const blob = new Blob([JSON.stringify(withUserId)], {
                    type: 'application/json'
                });
                // Note: sendBeacon doesn't work directly with Supabase
                // Fall back to regular insert
            }
            
            // Insert batch
            const { error } = await this.supabase
                .from('user_activity_logs')
                .insert(withUserId);
            
            if (error) {
                console.warn('Failed to log activities:', error);
                // Re-queue on failure (limit to prevent infinite growth)
                if (this.queue.length < 100) {
                    this.queue.push(...activities);
                }
            }
        } catch (error) {
            console.warn('Activity tracking error:', error);
        }
    }
    
    /**
     * Convenience methods for common activities
     */
    
    trackLogin(method = 'email') {
        this.track('login', { method });
    }
    
    trackLogout() {
        this.track('logout');
        this.flush(); // Immediate flush
    }
    
    trackTemplateView(templateId, templateName) {
        this.track('template_view', { templateId, templateName });
    }
    
    trackTemplateUse(templateId, templateName, context) {
        this.track('template_use', { templateId, templateName, context });
    }
    
    trackTemplateCreate(templateId, templateName, type) {
        this.track('template_create', { templateId, templateName, type });
    }
    
    trackTemplateRate(templateId, rating) {
        this.track('template_rate', { templateId, rating });
    }
    
    trackSearch(query, resultCount) {
        this.track('search', { query, resultCount });
    }
    
    trackPackCreate(packName) {
        this.track('pack_create', { packName });
    }
    
    trackMobCreate(mobName, packId) {
        this.track('mob_create', { mobName, packId });
    }
    
    trackSkillCreate(skillName, packId) {
        this.track('skill_create', { skillName, packId });
    }
    
    trackExport(format, itemCount) {
        this.track('export', { format, itemCount });
    }
    
    trackImport(format, itemCount) {
        this.track('import', { format, itemCount });
    }
    
    trackFeatureUse(featureName, details = {}) {
        this.track('feature_use', { featureName, ...details });
    }
    
    /**
     * Disable tracking (for privacy)
     */
    disable() {
        this.enabled = false;
        this.queue = [];
    }
    
    /**
     * Enable tracking
     */
    enable() {
        this.enabled = true;
    }
}

// Note: ActivityTracker is instantiated in index.html after Supabase is ready
// window.activityTracker = new ActivityTracker(supabaseClient, authManager);
