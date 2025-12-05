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
        } else if (tab === 'signup') {
            this.signupForm?.classList.add('active');
            this.signupTab?.classList.add('active');
        } else if (tab === 'reset') {
            this.resetForm?.classList.add('active');
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
    }
    
    setupAuthStateListener() {
        this.authManager.onAuthChange((user) => {
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
            this.showSuccess('login', 'Login successful!');
            
            // Close modal after short delay
            setTimeout(() => {
                this.closeModal();
                this.loginForm?.reset();
            }, 1000);
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
            // Migrate anonymous data
            await this.authManager.migrateAnonymousData(this.storageManager);
            
            this.showSuccess('signup', 'Account created! Your data has been migrated.');
            
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
    
    async handleLogout() {
        const result = await this.authManager.logout();
        
        if (result.success) {
            // Generate new anonymous ID
            this.authManager.generateAnonymousId();
            
            // Show notification
            if (window.showNotification) {
                window.showNotification('Logged out successfully', 'success');
            }
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
        } else {
            // Show anonymous state
            if (this.userEmail) this.userEmail.textContent = 'Anonymous User';
            if (this.userType) this.userType.textContent = 'Anonymous';
            if (this.userInfo) this.userInfo.style.display = 'block';
            if (this.loginBtn) this.loginBtn.style.display = 'block';
            if (this.logoutBtn) this.logoutBtn.style.display = 'none';
        }
    }
    
    openModal(tab = 'login') {
        this.modal?.classList.add('show');
        this.switchTab(tab);
        this.clearMessages();
    }
    
    closeModal() {
        this.modal?.classList.remove('show');
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
