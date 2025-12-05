/**
 * Storage Manager - Wrapper for DatabaseStorageManager
 * Provides backward compatibility while using Supabase cloud storage
 */
class StorageManager {
    constructor() {
        // Use DatabaseStorageManager if available, otherwise fallback to basic localStorage
        if (typeof DatabaseStorageManager !== 'undefined') {
            this.db = new DatabaseStorageManager();
            console.log('✅ Using cloud storage (Supabase)');
        } else {
            // Fallback to basic localStorage implementation
            this.db = null;
            this.prefix = 'mythicmobs_';
            console.warn('⚠️ Using localStorage fallback');
        }
    }
    
    async get(key) {
        if (this.db) {
            return await this.db.get(key);
        }
        
        // Fallback
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Failed to get ${key}:`, error);
            return null;
        }
    }
    
    async set(key, value) {
        if (this.db) {
            return await this.db.set(key, value);
        }
        
        // Fallback
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Failed to set ${key}:`, error);
            return false;
        }
    }
    
    async remove(key) {
        if (this.db) {
            return await this.db.remove(key);
        }
        
        // Fallback
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key}:`, error);
            return false;
        }
    }
    
    async clear() {
        if (this.db) {
            return await this.db.clear();
        }
        
        // Fallback
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }
    
    // Additional methods for cloud sync
    async syncToCloud() {
        if (this.db && this.db.syncToCloud) {
            return await this.db.syncToCloud();
        }
    }
    
    async syncFromCloud() {
        if (this.db && this.db.syncFromCloud) {
            return await this.db.syncFromCloud();
        }
    }
    
    async getAllKeys() {
        if (this.db && this.db.getAllKeys) {
            return await this.db.getAllKeys();
        }
        
        // Fallback
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.replace(this.prefix, ''));
    }
}

window.StorageManager = StorageManager;
