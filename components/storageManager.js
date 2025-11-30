/**
 * Storage Manager - LocalStorage wrapper
 */
class StorageManager {
    constructor() {
        this.prefix = 'mythicmobs_';
    }
    
    get(key) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Failed to get ${key}:`, error);
            return null;
        }
    }
    
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Failed to set ${key}:`, error);
            return false;
        }
    }
    
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key}:`, error);
            return false;
        }
    }
    
    clear() {
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
}

window.StorageManager = StorageManager;
