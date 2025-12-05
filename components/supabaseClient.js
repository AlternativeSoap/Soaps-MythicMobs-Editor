/**
 * Supabase Client Configuration
 * Handles database connection for cloud storage
 */

// Initialize Supabase client
const SUPABASE_URL = 'https://yzsbvxuciuvmvoswtjkl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6c2J2eHVjaXV2bXZvc3d0amtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTUzNDIsImV4cCI6MjA4MDQ5MTM0Mn0.TOVuR7PyJxUqwVUlHMhdKIYD7JVLPCBJjStqAbM3ZbI';

let supabaseClient = null;

try {
    // Initialize using the global supabase object from CDN
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    } else {
        console.error('❌ Supabase library not loaded');
    }
} catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
}

// Export for use in other modules
window.supabaseClient = supabaseClient;

/**
 * Database Storage Manager - Uses Supabase for cloud storage
 * Falls back to localStorage if offline or if Supabase fails
 */
class DatabaseStorageManager {
    constructor() {
        this.prefix = 'mythicmobs_';
        this.supabase = supabaseClient;
        this.useCloud = !!this.supabase;
        this.userId = null; // Will be set after authentication
        
        // Check if user is already logged in
        this.checkAuth();
    }
    
    /**
     * Check authentication status
     */
    async checkAuth() {
        if (!this.supabase) return;
        
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.userId = session.user.id;
                console.log('✅ User authenticated:', this.userId);
            } else {
                console.log('ℹ️ No active session, using anonymous mode');
                // Generate a unique anonymous ID
                this.userId = this.getOrCreateAnonymousId();
            }
        } catch (error) {
            console.error('Failed to check auth:', error);
            this.userId = this.getOrCreateAnonymousId();
        }
    }
    
    /**
     * Get or create anonymous user ID
     */
    getOrCreateAnonymousId() {
        let anonId = localStorage.getItem('mythicmobs_anon_id');
        if (!anonId) {
            anonId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('mythicmobs_anon_id', anonId);
        }
        return anonId;
    }
    
    /**
     * Get data from cloud or localStorage
     */
    async get(key) {
        // Try cloud storage first
        if (this.useCloud && this.userId) {
            try {
                const { data, error } = await this.supabase
                    .from('user_data')
                    .select('value')
                    .eq('user_id', this.userId)
                    .eq('key', key)
                    .single();
                
                if (error) {
                    if (error.code === 'PGRST116') {
                        // No rows returned, key doesn't exist
                        return null;
                    }
                    throw error;
                }
                
                return data?.value || null;
            } catch (error) {
                console.warn(`Cloud get failed for ${key}, using localStorage:`, error);
            }
        }
        
        // Fallback to localStorage
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Failed to get ${key}:`, error);
            return null;
        }
    }
    
    /**
     * Set data to cloud and localStorage
     */
    async set(key, value) {
        // Save to localStorage first (always available)
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save to localStorage:`, error);
        }
        
        // Try cloud storage
        if (this.useCloud && this.userId) {
            try {
                const { error } = await this.supabase
                    .from('user_data')
                    .upsert({
                        user_id: this.userId,
                        key: key,
                        value: value,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,key'
                    });
                
                if (error) throw error;
                
                console.log(`✅ Saved to cloud: ${key}`);
                return true;
            } catch (error) {
                console.warn(`Cloud save failed for ${key}:`, error);
                return true; // Still return true since localStorage succeeded
            }
        }
        
        return true;
    }
    
    /**
     * Remove data from cloud and localStorage
     */
    async remove(key) {
        // Remove from localStorage
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.error(`Failed to remove from localStorage:`, error);
        }
        
        // Try cloud storage
        if (this.useCloud && this.userId) {
            try {
                const { error } = await this.supabase
                    .from('user_data')
                    .delete()
                    .eq('user_id', this.userId)
                    .eq('key', key);
                
                if (error) throw error;
                
                console.log(`✅ Removed from cloud: ${key}`);
            } catch (error) {
                console.warn(`Cloud remove failed for ${key}:`, error);
            }
        }
        
        return true;
    }
    
    /**
     * Clear all data for current user
     */
    async clear() {
        // Clear localStorage
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
        
        // Try cloud storage
        if (this.useCloud && this.userId) {
            try {
                const { error } = await this.supabase
                    .from('user_data')
                    .delete()
                    .eq('user_id', this.userId);
                
                if (error) throw error;
                
                console.log('✅ Cleared cloud data');
            } catch (error) {
                console.warn('Cloud clear failed:', error);
            }
        }
        
        return true;
    }
    
    /**
     * Get all keys for current user
     */
    async getAllKeys() {
        if (this.useCloud && this.userId) {
            try {
                const { data, error } = await this.supabase
                    .from('user_data')
                    .select('key')
                    .eq('user_id', this.userId);
                
                if (error) throw error;
                
                return data.map(row => row.key);
            } catch (error) {
                console.warn('Cloud getAllKeys failed:', error);
            }
        }
        
        // Fallback to localStorage
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.replace(this.prefix, ''));
    }
    
    /**
     * Sync localStorage to cloud
     */
    async syncToCloud() {
        if (!this.useCloud || !this.userId) {
            console.warn('Cloud storage not available');
            return;
        }
        
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        let synced = 0;
        let failed = 0;
        
        for (const fullKey of keys) {
            const key = fullKey.replace(this.prefix, '');
            try {
                const value = JSON.parse(localStorage.getItem(fullKey));
                await this.set(key, value);
                synced++;
            } catch (error) {
                console.error(`Failed to sync ${key}:`, error);
                failed++;
            }
        }
        
        console.log(`✅ Synced ${synced} items to cloud (${failed} failed)`);
    }
    
    /**
     * Sync cloud to localStorage
     */
    async syncFromCloud() {
        if (!this.useCloud || !this.userId) {
            console.warn('Cloud storage not available');
            return;
        }
        
        try {
            const { data, error } = await this.supabase
                .from('user_data')
                .select('*')
                .eq('user_id', this.userId);
            
            if (error) throw error;
            
            let synced = 0;
            for (const row of data) {
                try {
                    localStorage.setItem(this.prefix + row.key, JSON.stringify(row.value));
                    synced++;
                } catch (error) {
                    console.error(`Failed to sync ${row.key} from cloud:`, error);
                }
            }
            
            console.log(`✅ Synced ${synced} items from cloud`);
        } catch (error) {
            console.error('Failed to sync from cloud:', error);
        }
    }
}

window.DatabaseStorageManager = DatabaseStorageManager;
console.log('✅ Supabase storage manager loaded');
