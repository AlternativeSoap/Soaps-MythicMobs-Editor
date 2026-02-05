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
        
        // Don't add global close handler - mobileManager handles this
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
        // MobileManager handles ALL user account button interactions (touch + click)
        // We only set up the dropdown content buttons here
        
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
            // Check if error is due to unconfirmed email
            const isUnconfirmedError = result.error?.toLowerCase().includes('email not confirmed') || 
                                       result.error?.toLowerCase().includes('not confirmed') ||
                                       result.error?.toLowerCase().includes('verify your email');
            
            if (isUnconfirmedError) {
                this.showUnconfirmedEmailError('login', email);
            } else {
                this.showError('login', result.error || 'Login failed');
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }
    
    /**
     * Show unconfirmed email error with resend option
     */
    showUnconfirmedEmailError(formType, email) {
        const errorContainer = document.getElementById(`${formType}Error`);
        if (!errorContainer) return;
        
        errorContainer.innerHTML = `
            <div class="unconfirmed-email-notice">
                <div style="margin-bottom: 10px;">
                    <i class="fas fa-envelope-circle-exclamation" style="color: #f59e0b;"></i>
                    <strong>Email not verified</strong>
                </div>
                <p style="margin: 0 0 10px; font-size: 13px;">
                    Please check your inbox (and spam folder) for the verification email.
                </p>
                <button type="button" class="btn btn-sm btn-secondary resend-verification-login-btn" id="resendVerificationBtn">
                    <i class="fas fa-paper-plane"></i> Resend Verification Email
                </button>
                <div class="email-help-tips" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: var(--text-secondary);">
                    <p style="margin: 0 0 4px;"><i class="fas fa-lightbulb"></i> <strong>Tips:</strong></p>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Check your spam/junk folder</li>
                        <li>Add <code style="font-size: 10px;">noreply@mail.app.supabase.io</code> to contacts</li>
                        <li>Wait a few minutes for the email to arrive</li>
                    </ul>
                </div>
            </div>
        `;
        errorContainer.style.display = 'block';
        
        // Add click handler for resend button
        const resendBtn = document.getElementById('resendVerificationBtn');
        resendBtn?.addEventListener('click', () => this.handleResendVerification(email, resendBtn));
    }
    
    /**
     * Handle resend verification email request
     */
    async handleResendVerification(email, btn) {
        if (!email || !btn) return;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        try {
            // Call the Edge Function
            const response = await fetch(`${window.supabaseClient.supabaseUrl}/functions/v1/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const result = await response.json();
            
            if (result.success) {
                btn.innerHTML = '<i class="fas fa-check"></i> Email Sent!';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-success');
                
                // Show success message
                if (result.already_confirmed) {
                    // Email already confirmed, allow login
                    this.showSuccess('login', 'Your email is already verified. Please try signing in again.');
                    btn.innerHTML = '<i class="fas fa-check"></i> Already Verified';
                } else {
                    // Re-enable after 15 seconds
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Resend Again';
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-secondary');
                    }, 15000);
                }
            } else {
                // Handle rate limiting
                if (result.retry_after_seconds) {
                    let countdown = result.retry_after_seconds;
                    btn.innerHTML = `<i class="fas fa-clock"></i> Wait ${countdown}s`;
                    
                    const interval = setInterval(() => {
                        countdown--;
                        if (countdown <= 0) {
                            clearInterval(interval);
                            btn.disabled = false;
                            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Resend Email';
                        } else {
                            btn.innerHTML = `<i class="fas fa-clock"></i> Wait ${countdown}s`;
                        }
                    }, 1000);
                } else {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Resend Email';
                    this.showError('login', result.message || 'Failed to send email');
                }
            }
        } catch (error) {
            console.error('Error resending verification:', error);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Resend Email';
            this.showError('login', 'Failed to send verification email. Please try again.');
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
            await this.storageManager.db.syncToCloud();
        }
        
        const result = await this.authManager.logout();
        
        if (result.success) {
            
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
        
        // Re-setup mobile touch handlers after UI update (ensures dropdown content is ready)
        if (window.mobileManager && typeof window.mobileManager.setupUserAccountButton === 'function') {
            console.log('📱 Re-attaching mobile handlers to user dropdown after UI update');
            window.mobileManager.setupUserAccountButton();
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
    
    // Sync Status Methods - Updates both old sync-status and new sync-indicator
    setSyncStatus(status) {
        // Update legacy sync status if it exists
        if (this.syncStatus) {
            this.syncStatus.classList.remove('synced', 'syncing', 'error', 'offline');
            this.syncStatus.classList.add(status);
            
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
        
        // Update new sync indicator
        const syncIndicator = document.getElementById('sync-indicator');
        if (syncIndicator) {
            syncIndicator.classList.remove('synced', 'syncing', 'error', 'offline');
            syncIndicator.classList.add(status);
            
            const icon = syncIndicator.querySelector('i');
            if (icon) {
                if (status === 'syncing') {
                    icon.className = 'fas fa-sync fa-spin';
                } else if (status === 'error') {
                    icon.className = 'fas fa-exclamation-triangle';
                } else {
                    icon.className = 'fas fa-cloud';
                }
            }
        }
        
        // Update sync badge in dropdown
        const syncBadge = document.getElementById('sync-badge');
        if (syncBadge) {
            syncBadge.classList.remove('synced', 'syncing', 'error', 'offline');
            syncBadge.classList.add(status);
            
            const badgeIcon = syncBadge.querySelector('i');
            const badgeText = syncBadge.querySelector('span');
            
            if (badgeIcon) {
                if (status === 'syncing') {
                    badgeIcon.className = 'fas fa-sync fa-spin';
                } else if (status === 'error') {
                    badgeIcon.className = 'fas fa-exclamation-triangle';
                } else {
                    badgeIcon.className = 'fas fa-cloud';
                }
            }
            
            if (badgeText) {
                const texts = {
                    synced: 'Cloud Sync',
                    syncing: 'Syncing...',
                    error: 'Sync Error',
                    offline: 'Offline'
                };
                badgeText.textContent = texts[status] || 'Unknown';
            }
        }
    }
    
    showSyncSuccess() {
        this.setSyncStatus('syncing');
        setTimeout(() => {
            this.setSyncStatus('synced');
            // Also update the main save status indicator
            if (window.editor && typeof window.editor.updateSaveStatusIndicator === 'function') {
                window.editor.updateSaveStatusIndicator();
            }
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
