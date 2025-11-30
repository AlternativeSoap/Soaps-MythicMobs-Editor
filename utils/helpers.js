// Helper functions
const Helpers = {
    sanitizeName(name) {
        return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    },
    
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

window.Helpers = Helpers;
