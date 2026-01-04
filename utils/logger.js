/**
 * Centralized Logging Utility
 * Controls logging verbosity based on environment
 */

// Enable verbose logging by setting localStorage item 'debugMode' = 'true'
// Or by appending ?debug=true to URL
const isDebugMode = () => {
    if (typeof window === 'undefined') return false;
    
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') return true;
    
    // Check localStorage
    return localStorage.getItem('debugMode') === 'true';
};

const DEBUG = isDebugMode();

/**
 * Logger class with different log levels
 */
class Logger {
    constructor(context = '') {
        this.context = context;
    }

    /**
     * Always logs - for critical info
     */
    info(...args) {
        if (this.context) {
            console.log(`%c[${this.context}]`, 'color: #3498db', ...args);
        } else {
            console.log(...args);
        }
    }

    /**
     * Always logs - for warnings
     */
    warn(...args) {
        if (this.context) {
            console.warn(`[${this.context}]`, ...args);
        } else {
            console.warn(...args);
        }
    }

    /**
     * Always logs - for errors
     */
    error(...args) {
        if (this.context) {
            console.error(`[${this.context}]`, ...args);
        } else {
            console.error(...args);
        }
    }

    /**
     * Only logs in debug mode - for verbose debugging
     */
    debug(...args) {
        if (!DEBUG) return;
        
        if (this.context) {
            console.log(`%c[DEBUG: ${this.context}]`, 'color: #95a5a6', ...args);
        } else {
            console.log('%c[DEBUG]', 'color: #95a5a6', ...args);
        }
    }

    /**
     * Only logs in debug mode - for success messages
     */
    success(...args) {
        if (!DEBUG) return;
        
        if (this.context) {
            console.log(`%c✅ [${this.context}]`, 'color: #27ae60', ...args);
        } else {
            console.log('%c✅', 'color: #27ae60', ...args);
        }
    }

    /**
     * Only logs in debug mode - for operation tracking
     */
    trace(...args) {
        if (!DEBUG) return;
        
        if (this.context) {
            console.log(`%c🔍 [${this.context}]`, 'color: #f39c12', ...args);
        } else {
            console.log('%c🔍', 'color: #f39c12', ...args);
        }
    }
}

/**
 * Create logger instance for a specific context
 */
const createLogger = (context) => new Logger(context);

/**
 * Global logger (no context)
 */
const logger = new Logger();

// Show debug mode status on load
if (DEBUG) {
    console.log('%c🐛 Debug Mode Enabled', 'color: #e74c3c; font-weight: bold; font-size: 14px;');
    console.log('%cVerbose logging is active. To disable, run: localStorage.removeItem("debugMode")', 'color: #95a5a6;');
} else {
    // One-time hint about debug mode (only show once per session)
    if (!sessionStorage.getItem('debugHintShown')) {
                sessionStorage.setItem('debugHintShown', 'true');
    }
}

// Export for use in other modules
window.Logger = Logger;
window.createLogger = createLogger;
window.logger = logger;
window.DEBUG_MODE = DEBUG;
