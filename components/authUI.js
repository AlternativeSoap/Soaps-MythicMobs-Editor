/**
 * Authentication UI Controller
 * Handles all UI interactions for authentication (modal, forms, dropdowns)
 */

class AuthUI {
    constructor(authManager, storageManager) {
        this.authManager = authManager;
        this.storageManager = storageManager;
        
        // UI Elements
        this.modal = document.getElementById('authModal');
        this.loginTab = document.getElementById('loginTab');
        this.signupTab = document.getElementById('signupTab');
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.resetForm = document.getElementById('resetPasswordForm');
        
        // User Account Elements
        this.userAccountBtn = document.querySelector('.user-account-btn');
        this.userDropdown = document.querySelector('.user-dropdown');
        this.userEmail = document.querySelector('.user-email');
        this.userType = document.querySelector('.user-type');
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.syncToCloudBtn = document.getElementById('syncToCloudBtn');
        this.userInfo = document.querySelector('.user-info');
        
        // Sync Status
        this.syncStatus = document.querySelector('.sync-status');
        this.syncText = this.syncStatus?.querySelector('.sync-text');
        
        this.init();
    }
    
    init() {
        this.setupTabSwitching();
        this.setupFormHandlers();
        this.setupUserDropdown();
        this.setupAuthStateListener();
        
        // Update UI based on initial auth state
        this.updateUI();
        
        // Close modal on X button click
        const closeBtn = document.getElementById('auth-modal-close');
        closeBtn?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal on overlay click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userDropdown && !e.target.closest('.user-account')) {
                this.userDropdown.classList.remove('show');
            }
        });
    }
    
    setupTabSwitching() {
        this.loginTab?.addEventListener('click', () => {
            this.switchTab('login');
        });
        
        this.signupTab?.addEventListener('click', () => {
            this.switchTab('signup');
        });
        
        // Forgot password link
        document.getElementById('forgotPasswordBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('reset');
        });
        
        // Back to login
        document.getElementById('backToLoginBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('login');
        });
    }
    
    switchTab(tab) {
        const authTabs = document.getElementById('authTabs');
        
        // Hide all forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected form and tab
        if (tab === 'login') {
            this.loginForm?.classList.add('active');
            this.loginTab?.classList.add('active');
            if (authTabs) authTabs.style.display = 'flex';
        } else if (tab === 'signup') {
            this.signupForm?.classList.add('active');
            this.signupTab?.classList.add('active');
            if (authTabs) authTabs.style.display = 'flex';
        } else if (tab === 'reset') {
            this.resetForm?.classList.add('active');
            if (authTabs) authTabs.style.display = 'none';
        }
        
        // Clear any error/success messages
        this.clearMessages();
    }
    
    setupFormHandlers() {
        // Login form
        this.loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        // Signup form
        this.signupForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSignup();
        });
        
        // Reset password form
        this.resetForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleResetPassword();
        });
    }
    
    setupUserDropdown() {
        this.userAccountBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.userDropdown?.classList.toggle('show');
        });
        
        this.loginBtn?.addEventListener('click', () => {
            this.openModal('login');
            this.userDropdown?.classList.remove('show');
        });
        
        this.logoutBtn?.addEventListener('click', async () => {
            await this.handleLogout();
            this.userDropdown?.classList.remove('show');
        });
        
        this.syncToCloudBtn?.addEventListener('click', async () => {
            await this.handleManualSync();
            this.userDropdown?.classList.remove('show');
        });
    }
    
    setupAuthStateListener() {
        this.authManager.onAuthChange((event, session) => {
            // Update storage manager with new user ID
            if (this.storageManager?.db?.updateUserId) {
                const userId = session?.user?.id || null;
                this.storageManager.db.updateUserId(userId);
            }
            
            this.updateUI();
        });
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        const submitBtn = this.loginForm?.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            this.showError('login', 'Please fill in all fields');
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        const result = await this.authManager.login(email, password);
        
        if (result.success) {
            // IMPORTANT: Update user ID FIRST
            if (this.storageManager?.db?.updateUserId && result.user) {
                await this.storageManager.db.updateUserId(result.user.id);
            }
            
            // Clear localStorage and load authenticated user data
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading your data...';
            
            // Clear local storage (keep anonymous ID for later)
            const anonId = localStorage.getItem('mythicmobs_anon_id');
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('mythicmobs_') && key !== 'mythicmobs_anon_id') {
                    localStorage.removeItem(key);
                }
            });
            
            // Load authenticated user data from cloud (DO NOT sync TO cloud - that would overwrite)
            if (this.storageManager?.db?.syncFromCloud) {
                await this.storageManager.db.syncFromCloud();
            }
            
            // Reload the page to refresh all data
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Success! Reloading...';
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            this.showError('login', result.error || 'Login failed');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }
    
    async handleSignup() {
        const email = document.getElementById('signupEmail')?.value;
        const password = document.getElementById('signupPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const submitBtn = this.signupForm?.querySelector('button[type="submit"]');
        
        if (!email || !password || !confirmPassword) {
            this.showError('signup', 'Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('signup', 'Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            this.showError('signup', 'Password must be at least 6 characters');
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        
        const result = await this.authManager.signup(email, password);
        
        if (result.success) {
            // Update storage with new user ID immediately
            if (this.storageManager?.db?.updateUserId && result.user) {
                await this.storageManager.db.updateUserId(result.user.id);
            }
            
            // Migrate anonymous data to new account
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Migrating data...';
            await this.authManager.migrateAnonymousData(this.storageManager);
            
            // Clear localStorage and load from cloud
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading your data...';
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('mythicmobs_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // Load the migrated data from cloud
            if (this.storageManager?.db?.syncFromCloud) {
                await this.storageManager.db.syncFromCloud();
            }
            
            this.showSuccess('signup', 'Account created! Your data has been migrated.');
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            
            // Close modal after short delay
            setTimeout(() => {
                this.closeModal();
                this.signupForm?.reset();
            }, 1500);
        } else {
            this.showError('signup', result.error || 'Signup failed');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }
    
    async handleResetPassword() {
        const email = document.getElementById('resetEmail')?.value;
        const submitBtn = this.resetForm?.querySelector('button[type="submit"]');
        
        if (!email) {
            this.showError('reset', 'Please enter your email');
            return;
        }
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        const result = await this.authManager.resetPassword(email);
        
        if (result.success) {
            this.showSuccess('reset', 'Password reset email sent! Check your inbox.');
            this.resetForm?.reset();
        } else {
            this.showError('reset', result.error || 'Failed to send reset email');
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
    }
    
    async handleManualSync() {
        console.log('🔄 Manual sync triggered...');
        this.setSyncStatus('syncing');
        
        // Show a loading message
        const originalBtn = this.syncToCloudBtn;
        if (originalBtn) {
            originalBtn.disabled = true;
            originalBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
        }
        
        try {
            if (this.storageManager?.db?.syncToCloud) {
                await this.storageManager.db.syncToCloud();
                this.showSyncSuccess();
                console.log('✅ Manual sync completed');
                
                // Show success message
                if (window.editor && window.editor.showToast) {
                    window.editor.showToast('Data synced to cloud successfully!', 'success');
                }
            }
        } catch (error) {
            console.error('❌ Manual sync failed:', error);
            this.showSyncError();
            
            // Show error message
            if (window.editor && window.editor.showToast) {
                window.editor.showToast('Failed to sync to cloud', 'error');
            }
        } finally {
            // Restore button
            if (originalBtn) {
                originalBtn.disabled = false;
                originalBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Sync to Cloud';
            }
        }
    }
    
    async handleLogout() {
        // Save any pending changes to cloud before logging out
        if (this.storageManager?.db?.syncToCloud) {
            console.log('💾 Saving data before logout...');
            await this.storageManager.db.syncToCloud();
        }
        
        const result = await this.authManager.logout();
        
        if (result.success) {
            console.log('🔓 Logged out successfully');
            
            // Clear localStorage to separate user data
            const keysToKeep = ['mythicmobs_anon_id']; // Keep old anonymous ID if it exists
            const oldAnonId = localStorage.getItem('mythicmobs_anon_id');
            
            // Clear all mythicmobs data
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('mythicmobs_') && !keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            
            // Generate new anonymous ID if none exists
            if (!oldAnonId) {
                const newAnonId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('mythicmobs_anon_id', newAnonId);
            }
            
            // Update storage manager to use anonymous ID
            if (this.storageManager?.db) {
                const anonId = localStorage.getItem('mythicmobs_anon_id');
                await this.storageManager.db.updateUserId(anonId);
                
                // Try to load old anonymous data from cloud if it exists
                console.log('🔄 Loading anonymous user data...');
                await this.storageManager.db.syncFromCloud();
            }
            
            // Reload the page to reset the UI completely
            console.log('♻️ Reloading page to reset state...');
            window.location.reload();
        }
    }
    
    updateUI() {
        const user = this.authManager.getCurrentUser();
        const isAuthenticated = this.authManager.isAuthenticated();
        
        if (isAuthenticated && user) {
            // Show user info
            if (this.userEmail) this.userEmail.textContent = user.email;
            if (this.userType) this.userType.textContent = 'Authenticated';
            if (this.userInfo) this.userInfo.style.display = 'block';
            if (this.loginBtn) this.loginBtn.style.display = 'none';
            if (this.logoutBtn) this.logoutBtn.style.display = 'block';
            if (this.syncToCloudBtn) this.syncToCloudBtn.style.display = 'block';
        } else {
            // Show anonymous state
            if (this.userEmail) this.userEmail.textContent = 'Anonymous User';
            if (this.userType) this.userType.textContent = 'Anonymous';
            if (this.userInfo) this.userInfo.style.display = 'block';
            if (this.loginBtn) this.loginBtn.style.display = 'block';
            if (this.logoutBtn) this.logoutBtn.style.display = 'none';
            if (this.syncToCloudBtn) this.syncToCloudBtn.style.display = 'none';
        }
    }
    
    openModal(tab = 'login') {
        this.modal?.classList.remove('hidden');
        this.switchTab(tab);
        this.clearMessages();
    }
    
    closeModal() {
        this.modal?.classList.add('hidden');
        this.clearMessages();
        
        // Reset all forms
        this.loginForm?.reset();
        this.signupForm?.reset();
        this.resetForm?.reset();
        
        // Re-enable buttons
        document.querySelectorAll('.auth-form button[type="submit"]').forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        });
    }
    
    showError(form, message) {
        const errorDiv = document.getElementById(`${form}Error`);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }
    }
    
    showSuccess(form, message) {
        const successDiv = document.getElementById(`${form}Success`);
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.add('show');
        }
    }
    
    clearMessages() {
        document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
    }
    
    // Sync Status Methods
    setSyncStatus(status) {
        if (!this.syncStatus) return;
        
        // Remove all status classes
        this.syncStatus.classList.remove('synced', 'syncing', 'error', 'offline');
        
        // Add current status
        this.syncStatus.classList.add(status);
        
        // Update text
        const statusText = {
            synced: 'Synced',
            syncing: 'Syncing...',
            error: 'Sync Error',
            offline: 'Offline'
        };
        
        if (this.syncText) {
            this.syncText.textContent = statusText[status] || 'Unknown';
        }
    }
    
    showSyncSuccess() {
        this.setSyncStatus('syncing');
        setTimeout(() => {
            this.setSyncStatus('synced');
        }, 500);
    }
    
    showSyncError() {
        this.setSyncStatus('error');
        setTimeout(() => {
            this.setSyncStatus('synced');
        }, 3000);
    }
}

// Export for use in app.js
window.AuthUI = AuthUI;
