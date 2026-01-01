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
        // Initialized silently
    } else {
        console.error('Supabase library not loaded');
    }
} catch (error) {
    console.error('Failed to initialize Supabase:', error);
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
        if (!this.supabase) {
            this.useCloud = false;
            this.userId = this.getOrCreateAnonymousId();
            return;
        }
        
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session && session.user) {
                // User is actually authenticated
                this.userId = session.user.id;
                this.useCloud = true;
                if (window.DEBUG_MODE) console.log('Authenticated user, cloud storage enabled');
            } else {
                // No authenticated session - use localStorage only
                this.userId = this.getOrCreateAnonymousId();
                this.useCloud = false;
                if (window.DEBUG_MODE) console.log('Anonymous user, using localStorage only');
            }
        } catch (error) {
            if (window.DEBUG_MODE) console.warn('Auth check failed, using localStorage only:', error);
            this.userId = this.getOrCreateAnonymousId();
            this.useCloud = false;
        }
    }
    
    /**
     * Get or create anonymous user ID
     */
    getOrCreateAnonymousId() {
        let anonId = localStorage.getItem('mythicmobs_anon_id');
        
        // Validate if existing ID is a valid UUID
        if (anonId && !this.isValidUUID(anonId)) {
            if (window.DEBUG_MODE) console.warn('Invalid anonymous ID detected, regenerating...');
            anonId = null; // Force regeneration
        }
        
        if (!anonId) {
            // Generate a valid UUID v4 for anonymous users
            anonId = this.generateUUID();
            localStorage.setItem('mythicmobs_anon_id', anonId);
            if (window.DEBUG_MODE) console.log('Generated new anonymous UUID:', anonId);
        }
        return anonId;
    }
    
    /**
     * Check if a string is a valid UUID
     */
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    
    /**
     * Generate a valid UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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
                    .maybeSingle(); // Use maybeSingle() to avoid 406 error when no rows exist
                
                if (error) {
                    // Handle any actual errors
                    throw error;
                }
                // maybeSingle returns null if no rows found (instead of throwing 406)
                return data?.value || null;
            } catch (error) {
                if (window.DEBUG_MODE) console.warn(`Cloud get failed for ${key}, using localStorage:`, error);
            }
        }
        
        // Fallback to localStorage
        try {
            const value = localStorage.getItem(this.prefix + key);
            if (!value) return null;
            
            // Try to parse as JSON
            try {
                const parsed = JSON.parse(value);
                return parsed;
            } catch (parseError) {
                // If it's not JSON, return the raw value
                return value;
            }
        } catch (error) {
            console.error(`Failed to get ${key}:`, error);
            return null;
        }
    }
    
    /**
     * Set data to cloud and localStorage
     */
    async set(key, value) {
        if (window.DEBUG_MODE) {
            console.log(`Storage SET: ${key}`, { 
                userId: this.userId, 
                useCloud: this.useCloud,
                dataSize: JSON.stringify(value).length 
            });
        }
        
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
                return true;
            } catch (error) {
                if (window.DEBUG_MODE) console.warn(`Cloud save failed for ${key}:`, error);
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
                
                if (window.DEBUG_MODE) console.log(`Removed from cloud: ${key}`);
            } catch (error) {
                if (window.DEBUG_MODE) console.warn(`Cloud remove failed for ${key}:`, error);
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
            if (window.DEBUG_MODE) console.warn('Cloud storage not available:', { useCloud: this.useCloud, userId: this.userId });
            return;
        }
        
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        if (window.DEBUG_MODE) console.log(`Found ${keys.length} items to sync:`, keys.map(k => k.replace(this.prefix, '')));
        
        let synced = 0;
        let failed = 0;
        
        for (const fullKey of keys) {
            const key = fullKey.replace(this.prefix, '');
            try {
                const rawValue = localStorage.getItem(fullKey);
                let value;
                
                // Try to parse as JSON, if it fails, use as-is
                try {
                    value = JSON.parse(rawValue);
                } catch (parseError) {
                    // If it's not JSON, store the raw string
                    value = rawValue;
                }
                
                if (window.DEBUG_MODE) console.log(`Syncing ${key}...`);
                await this.set(key, value);
                synced++;
            } catch (error) {
                console.error(`Failed to sync ${key}:`, error);
                failed++;
            }
        }
        
        if (window.DEBUG_MODE) console.log(`Cloud sync complete: ${synced} synced, ${failed} failed`);
    }
    
    /**
     * Update user ID (called when auth state changes)
     */
    async updateUserId(userId) {
        this.userId = userId;
        if (userId) {
        }
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
            
            if (window.DEBUG_MODE) console.log(`Synced ${synced} items from cloud`);
        } catch (error) {
            console.error('Failed to sync from cloud:', error);
        }
    }
}

window.DatabaseStorageManager = DatabaseStorageManager;
// Loaded silently
