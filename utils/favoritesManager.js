/**
 * Favorites Manager
 * Optimized favorites storage using Sets for O(1) operations
 */

class FavoritesManager {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.favorites = new Set();
        this.load();
    }

    /**
     * Load favorites from localStorage into Set
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const array = JSON.parse(saved);
                this.favorites = new Set(array);
            }
        } catch (e) {
            console.error('Failed to load favorites:', e);
            this.favorites = new Set();
        }
    }

    /**
     * Save favorites Set to localStorage
     */
    save() {
        try {
            const array = Array.from(this.favorites);
            localStorage.setItem(this.storageKey, JSON.stringify(array));
        } catch (e) {
            console.error('Failed to save favorites:', e);
        }
    }

    /**
     * Add item to favorites (O(1))
     * @param {string} id - Item ID
     * @returns {boolean} True if added, false if already existed
     */
    add(id) {
        const sizeBefore = this.favorites.size;
        this.favorites.add(id);
        const added = this.favorites.size > sizeBefore;
        if (added) {
            this.save();
        }
        return added;
    }

    /**
     * Remove item from favorites (O(1))
     * @param {string} id - Item ID
     * @returns {boolean} True if removed, false if didn't exist
     */
    remove(id) {
        const removed = this.favorites.delete(id);
        if (removed) {
            this.save();
        }
        return removed;
    }

    /**
     * Toggle favorite status (O(1))
     * @param {string} id - Item ID
     * @returns {boolean} True if now favorited, false if unfavorited
     */
    toggle(id) {
        if (this.has(id)) {
            this.remove(id);
            return false;
        } else {
            this.add(id);
            return true;
        }
    }

    /**
     * Check if item is favorited (O(1))
     * @param {string} id - Item ID
     * @returns {boolean} True if favorited
     */
    has(id) {
        return this.favorites.has(id);
    }

    /**
     * Get all favorites as array
     * @returns {Array} Array of favorite IDs
     */
    getAll() {
        return Array.from(this.favorites);
    }

    /**
     * Get favorites count
     * @returns {number} Number of favorites
     */
    getCount() {
        return this.favorites.size;
    }

    /**
     * Clear all favorites
     */
    clear() {
        this.favorites.clear();
        this.save();
    }

    /**
     * Check if has any favorites
     * @returns {boolean} True if has favorites
     */
    isEmpty() {
        return this.favorites.size === 0;
    }

    /**
     * Filter items to only favorites
     * @param {Array} items - Items to filter
     * @param {string} idField - Field containing item ID
     * @returns {Array} Filtered items
     */
    filterFavorites(items, idField = 'id') {
        return items.filter(item => this.has(item[idField]));
    }

    /**
     * Sort items with favorites first
     * @param {Array} items - Items to sort
     * @param {string} idField - Field containing item ID
     * @returns {Array} Sorted items
     */
    sortWithFavoritesFirst(items, idField = 'id') {
        return items.sort((a, b) => {
            const aFav = this.has(a[idField]);
            const bFav = this.has(b[idField]);
            
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });
    }

    /**
     * Import favorites from array
     * @param {Array} ids - Array of IDs to import
     */
    import(ids) {
        if (!Array.isArray(ids)) return;
        
        this.favorites = new Set(ids);
        this.save();
    }

    /**
     * Export favorites as array
     * @returns {Array} Array of favorite IDs
     */
    export() {
        return this.getAll();
    }
}

// Export for use in other modules
window.FavoritesManager = FavoritesManager;
