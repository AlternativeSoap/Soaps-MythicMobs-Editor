/**
 * Authentication Manager
 * Handles user login, signup, logout, and auth state
 */
class AuthManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentUser = null;
        this.onAuthChangeCallbacks = [];
        
        // Listen for auth state changes
        if (this.supabase) {
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.currentUser = session?.user || null;
                this.notifyAuthChange(event, session);
            });
            
            // Check initial auth state
            this.checkInitialAuth();
        }
    }
    
    /**
     * Check initial authentication state
     */
    async checkInitialAuth() {
        if (!this.supabase) return null;
        
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            this.currentUser = session?.user || null;
            return this.currentUser;
        } catch (error) {
            console.error('Failed to check auth:', error);
            return null;
        }
    }
    
    /**
     * Register callback for auth state changes
     */
    onAuthChange(callback) {
        this.onAuthChangeCallbacks.push(callback);
    }
    
    /**
     * Notify all callbacks of auth change
     */
    notifyAuthChange(event, session) {
        this.onAuthChangeCallbacks.forEach(callback => {
            try {
                callback(event, session);
            } catch (error) {
                console.error('Auth callback error:', error);
            }
        });
    }
    
    /**
     * Sign up new user
     */
    async signup(email, password) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
            });
            
            if (error) throw error;
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Sign in existing user
     */
    async login(email, password) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) throw error;
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Sign out current user
     */
    async logout() {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) throw error;
            
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }
    
    /**
     * Get user ID (authenticated or anonymous)
     */
    getUserId() {
        if (this.currentUser) {
            return this.currentUser.id;
        }
        
        // Return anonymous ID
        let anonId = localStorage.getItem('mythicmobs_anon_id');
        if (!anonId) {
            anonId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('mythicmobs_anon_id', anonId);
        }
        return anonId;
    }
    
    /**
     * Migrate anonymous data to authenticated user
     */
    async migrateAnonymousData(storage) {
        if (!this.isAuthenticated()) {
            console.warn('No authenticated user for migration');
            return false;
        }
        
        const anonId = localStorage.getItem('mythicmobs_anon_id');
        if (!anonId || !anonId.startsWith('anon_')) {
            console.log('No anonymous data to migrate');
            return false;
        }
        
        try {
            
            // Get all anonymous data
            const { data: anonData, error } = await this.supabase
                .from('user_data')
                .select('*')
                .eq('user_id', anonId);
            
            if (error) throw error;
            
            if (!anonData || anonData.length === 0) {
                console.log('No anonymous data found');
                return false;
            }
            
            // Migrate each record to authenticated user
            const newUserId = this.currentUser.id;
            let migrated = 0;
            
            for (const record of anonData) {
                try {
                    await this.supabase
                        .from('user_data')
                        .upsert({
                            user_id: newUserId,
                            key: record.key,
                            value: record.value,
                            updated_at: new Date().toISOString()
                        }, {
                            onConflict: 'user_id,key'
                        });
                    migrated++;
                } catch (err) {
                    console.error(`Failed to migrate ${record.key}:`, err);
                }
            }
            
            // Delete anonymous data
            await this.supabase
                .from('user_data')
                .delete()
                .eq('user_id', anonId);
            
            // Clear anonymous ID
            localStorage.removeItem('mythicmobs_anon_id');
            
            console.log(`✅ Migrated ${migrated} records from anonymous to authenticated user`);
            return true;
        } catch (error) {
            console.error('Migration error:', error);
            return false;
        }
    }
    
    /**
     * Reset password
     */
    async resetPassword(email) {
        if (!this.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }
}

window.AuthManager = AuthManager;
// Loaded silently
