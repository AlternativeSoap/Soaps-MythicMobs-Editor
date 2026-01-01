/**
 * Global Error Logger
 * Captures and logs all errors occurring in the application
 */

class ErrorLogger {
    constructor() {
        this.errors = [];
        this.maxErrors = 1000; // Keep last 1000 errors
        this.listeners = [];
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Capture uncaught errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'runtime',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'promise',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Capture console errors
        const originalError = console.error;
        console.error = (...args) => {
            this.logError({
                type: 'console',
                message: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '),
                timestamp: new Date().toISOString()
            });
            originalError.apply(console, args);
        };
    }

    logError(error) {
        // Add error to buffer
        this.errors.unshift(error);
        
        // Trim to max size
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // Store in localStorage for persistence
        try {
            localStorage.setItem('error_log', JSON.stringify(this.errors.slice(0, 100)));
        } catch (e) {
            // Ignore storage errors
        }

        // Send to server if user is admin
        if (window.supabaseClient && window.adminManager?.isAdmin) {
            this.sendErrorToServer(error);
        }

        // Notify listeners
        this.notifyListeners(error);
    }

    async sendErrorToServer(error) {
        try {
            if (!window.supabaseClient) return;
            
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            await window.supabaseClient.from('error_logs').insert({
                user_id: user.id,
                error_type: error.type,
                message: error.message,
                source: error.source,
                line: error.line,
                column: error.column,
                stack: error.stack,
                user_agent: navigator.userAgent,
                timestamp: error.timestamp
            });
        } catch (e) {
            console.warn('Failed to send error to server:', e);
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners(error) {
        this.listeners.forEach(callback => {
            try {
                callback(error);
            } catch (e) {
                // Ignore listener errors
            }
        });
    }

    getErrors(filter = {}) {
        let filtered = [...this.errors];

        if (filter.type) {
            filtered = filtered.filter(e => e.type === filter.type);
        }

        if (filter.search) {
            const search = filter.search.toLowerCase();
            filtered = filtered.filter(e => 
                e.message.toLowerCase().includes(search) ||
                e.source?.toLowerCase().includes(search)
            );
        }

        if (filter.since) {
            filtered = filtered.filter(e => new Date(e.timestamp) >= filter.since);
        }

        return filtered;
    }

    clearErrors() {
        this.errors = [];
        try {
            localStorage.removeItem('error_log');
        } catch (e) {
            // Ignore
        }
    }

    exportErrors() {
        return JSON.stringify(this.errors, null, 2);
    }
}

// Initialize global error logger
if (typeof window !== 'undefined') {
    window.errorLogger = new ErrorLogger();
}
