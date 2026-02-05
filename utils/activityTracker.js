/**
 * Activity Tracker
 * Enhanced user activity tracking for analytics dashboard
 * Tracks: sessions, page views, user actions, online presence
 */

class ActivityTracker {
    constructor(supabaseClient = null, authManager = null) {
        this.supabase = supabaseClient;
        this.auth = authManager;
        this.enabled = true;
        this.queue = []; // Queue for batching activity logs
        this.detailedQueue = []; // Queue for detailed activity
        this.flushInterval = null;
        this.heartbeatInterval = null;
        this.batchSize = 10;
        this.flushDelay = 30000; // 30 seconds
        this.heartbeatDelay = 60000; // 1 minute heartbeat
        
        // Session tracking
        this.sessionToken = null;
        this.sessionId = null;
        this.pageLoadTime = Date.now();
        this.currentPage = window.location.pathname;
        
        // Generate or retrieve session token
        this.initSession();
        
        // Start intervals
        this.startFlushInterval();
        this.startHeartbeat();
        
        // Track page visibility changes
        this.setupVisibilityTracking();
        
        // Track page unload for duration
        this.setupUnloadTracking();
    }
    
    /**
     * Initialize with Supabase client (for late initialization)
     */
    init(supabaseClient, authManager) {
        this.supabase = supabaseClient;
        this.auth = authManager;
        
        // Re-initialize session with Supabase
        this.initSession();
    }
    
    /**
     * Initialize or restore session
     */
    async initSession() {
        // Get or create session token
        this.sessionToken = sessionStorage.getItem('activity_session_token');
        if (!this.sessionToken) {
            this.sessionToken = this.generateSessionToken();
            sessionStorage.setItem('activity_session_token', this.sessionToken);
        }
        
        // Create session record in database if supabase is ready
        if (this.supabase) {
            await this.createOrUpdateSession();
        }
    }
    
    /**
     * Generate unique session token
     */
    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Create or update session in database
     */
    async createOrUpdateSession() {
        if (!this.supabase || !this.sessionToken) return;
        
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            // Check if session exists
            const { data: existingSession, error: sessionLookupError } = await this.supabase
                .from('user_sessions')
                .select('id')
                .eq('session_token', this.sessionToken)
                .maybeSingle();
            
            // If lookup failed for reasons other than no rows, log and continue
            if (sessionLookupError && window.DEBUG_MODE) {
                console.warn('Session lookup error:', sessionLookupError);
            }
            
            if (existingSession) {
                // Update existing session
                this.sessionId = existingSession.id;
                await this.updateSessionHeartbeat();
            } else {
                // Create new session
                const { data: newSession, error } = await this.supabase
                    .from('user_sessions')
                    .insert({
                        user_id: user?.id || null,
                        session_token: this.sessionToken,
                        user_agent: navigator.userAgent,
                        current_page: window.location.pathname,
                        referrer: document.referrer || null,
                        is_active: true
                    })
                    .select('id')
                    .single();
                
                if (!error && newSession) {
                    this.sessionId = newSession.id;
                    
                    // Track initial page view
                    this.trackPageView();
                }
            }
        } catch (error) {
            console.warn('Failed to create/update session:', error);
        }
    }
    
    /**
     * Update session heartbeat (called every minute)
     */
    async updateSessionHeartbeat() {
        if (!this.supabase || !this.sessionToken) return;
        
        try {
            await this.supabase
                .from('user_sessions')
                .update({
                    last_seen_at: new Date().toISOString(),
                    current_page: window.location.pathname,
                    is_active: true
                })
                .eq('session_token', this.sessionToken);
        } catch (error) {
            console.warn('Failed to update session heartbeat:', error);
        }
    }
    
    /**
     * Start heartbeat interval
     */
    startHeartbeat() {
        if (this.heartbeatInterval) return;
        
        this.heartbeatInterval = setInterval(() => {
            this.updateSessionHeartbeat();
        }, this.heartbeatDelay);
    }
    
    /**
     * Setup visibility change tracking
     */
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateSessionHeartbeat();
            }
        });
    }
    
    /**
     * Setup page unload tracking
     */
    setupUnloadTracking() {
        window.addEventListener('beforeunload', () => {
            // Calculate page duration
            const duration = Math.floor((Date.now() - this.pageLoadTime) / 1000);
            
            // Update page view duration (best effort)
            if (this.supabase && this.currentPageViewId) {
                // Use sendBeacon for reliability
                const updateData = { view_duration: duration };
                navigator.sendBeacon && navigator.sendBeacon(
                    `${this.supabase.supabaseUrl}/rest/v1/page_views?id=eq.${this.currentPageViewId}`,
                    JSON.stringify(updateData)
                );
            }
            
            // Flush remaining queues
            this.flush(true);
        });
    }
    
    /**
     * Track page view
     */
    async trackPageView() {
        if (!this.supabase) return;
        
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            const { data, error } = await this.supabase
                .from('page_views')
                .insert({
                    user_id: user?.id || null,
                    session_id: this.sessionId,
                    page_path: window.location.pathname,
                    page_title: document.title,
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent,
                    screen_width: window.screen.width,
                    screen_height: window.screen.height
                })
                .select('id')
                .single();
            
            if (!error && data) {
                this.currentPageViewId = data.id;
            }
            
            // Update page load time for duration tracking
            this.pageLoadTime = Date.now();
            this.currentPage = window.location.pathname;
        } catch (error) {
            console.warn('Failed to track page view:', error);
        }
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
     * Track an activity (basic - goes to user_activity_logs)
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
     * Track detailed activity (goes to user_activity_detailed)
     * @param {string} actionType - Category of action
     * @param {string} actionName - Specific action
     * @param {Object} options - Additional options
     */
    trackDetailed(actionType, actionName, options = {}) {
        if (!this.enabled) return;
        
        const activity = {
            action_type: actionType,
            action_name: actionName,
            target_type: options.targetType || null,
            target_id: options.targetId || null,
            target_name: options.targetName || null,
            metadata: options.metadata || {},
            page_path: window.location.pathname,
            session_id: this.sessionId
        };
        
        this.detailedQueue.push(activity);
        
        // Auto-flush if queue is large
        if (this.detailedQueue.length >= this.batchSize) {
            this.flushDetailed();
        }
    }
    
    /**
     * Flush queued activities to user_activity_logs
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
        
        // Also flush detailed queue
        await this.flushDetailed();
    }
    
    /**
     * Flush detailed activity queue to user_activity_detailed
     */
    async flushDetailed() {
        if (!this.supabase || this.detailedQueue.length === 0) return;
        
        const activities = [...this.detailedQueue];
        this.detailedQueue = [];
        
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            const withUserId = activities.map(a => ({
                ...a,
                user_id: user?.id || null,
                session_id: this.sessionId
            }));
            
            const { error } = await this.supabase
                .from('user_activity_detailed')
                .insert(withUserId);
            
            if (error) {
                console.warn('Failed to log detailed activities:', error);
                if (this.detailedQueue.length < 100) {
                    this.detailedQueue.push(...activities);
                }
            }
        } catch (error) {
            console.warn('Detailed activity tracking error:', error);
        }
    }
    
    /**
     * Convenience methods for common activities
     */
    
    trackLogin(method = 'email') {
        this.track('login', { method });
        this.trackDetailed('auth', 'login', { metadata: { method } });
    }
    
    trackLogout() {
        this.track('logout');
        this.trackDetailed('auth', 'logout');
        this.flush(); // Immediate flush
    }
    
    trackTemplateView(templateId, templateName) {
        this.track('template_view', { templateId, templateName });
        this.trackDetailed('template', 'view', {
            targetType: 'template',
            targetId: templateId,
            targetName: templateName
        });
    }
    
    trackTemplateUse(templateId, templateName, context) {
        this.track('template_use', { templateId, templateName, context });
        this.trackDetailed('template', 'use', {
            targetType: 'template',
            targetId: templateId,
            targetName: templateName,
            metadata: { context }
        });
    }
    
    trackTemplateCreate(templateId, templateName, type) {
        this.track('template_create', { templateId, templateName, type });
        this.trackDetailed('template', 'create', {
            targetType: 'template',
            targetId: templateId,
            targetName: templateName,
            metadata: { type }
        });
    }
    
    trackTemplateRate(templateId, rating) {
        this.track('template_rate', { templateId, rating });
        this.trackDetailed('template', 'rate', {
            targetType: 'template',
            targetId: templateId,
            metadata: { rating }
        });
    }
    
    trackSearch(query, resultCount) {
        this.track('search', { query, resultCount });
        this.trackDetailed('search', 'execute', {
            metadata: { query, resultCount }
        });
    }
    
    trackPackCreate(packName) {
        this.track('pack_create', { packName });
        this.trackDetailed('pack', 'create', {
            targetType: 'pack',
            targetName: packName
        });
    }
    
    trackMobCreate(mobName, packId) {
        this.track('mob_create', { mobName, packId });
        this.trackDetailed('mob', 'create', {
            targetType: 'mob',
            targetName: mobName,
            metadata: { packId }
        });
    }
    
    trackSkillCreate(skillName, packId) {
        this.track('skill_create', { skillName, packId });
        this.trackDetailed('skill', 'create', {
            targetType: 'skill',
            targetName: skillName,
            metadata: { packId }
        });
    }
    
    trackItemCreate(itemName, packId) {
        this.track('item_create', { itemName, packId });
        this.trackDetailed('item', 'create', {
            targetType: 'item',
            targetName: itemName,
            metadata: { packId }
        });
    }
    
    trackExport(format, itemCount) {
        this.track('export', { format, itemCount });
        this.trackDetailed('export', format, {
            metadata: { itemCount }
        });
    }
    
    trackImport(format, itemCount) {
        this.track('import', { format, itemCount });
        this.trackDetailed('import', format, {
            metadata: { itemCount }
        });
    }
    
    trackFeatureUse(featureName, details = {}) {
        this.track('feature_use', { featureName, ...details });
        this.trackDetailed('feature', featureName, {
            metadata: details
        });
    }
    
    // New tracking methods for enhanced analytics
    
    trackNavigation(fromPage, toPage) {
        this.trackDetailed('navigation', 'page_change', {
            metadata: { fromPage, toPage }
        });
        
        // Track new page view
        this.trackPageView();
    }
    
    trackButtonClick(buttonName, context = '') {
        this.trackDetailed('ui', 'button_click', {
            targetType: 'button',
            targetName: buttonName,
            metadata: { context }
        });
    }
    
    trackEditorAction(editorType, action, details = {}) {
        this.trackDetailed('editor', action, {
            targetType: editorType,
            metadata: details
        });
    }
    
    trackError(errorType, message, source = '') {
        this.trackDetailed('error', errorType, {
            metadata: { message, source }
        });
    }
    
    /**
     * Disable tracking (for privacy)
     */
    disable() {
        this.enabled = false;
        this.queue = [];
        this.detailedQueue = [];
    }
    
    /**
     * Enable tracking
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Get current session info
     */
    getSessionInfo() {
        return {
            sessionToken: this.sessionToken,
            sessionId: this.sessionId,
            pageLoadTime: this.pageLoadTime,
            currentPage: this.currentPage
        };
    }
}

// Note: ActivityTracker is instantiated in index.html after Supabase is ready
// window.activityTracker = new ActivityTracker(supabaseClient, authManager);
