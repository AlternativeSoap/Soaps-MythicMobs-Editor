/**
 * User Profile Manager
 * Manages user display names and profiles
 */

class UserProfileManager {
    constructor() {
        this.currentProfile = null;
        this.loadProfile();
    }

    async loadProfile() {
        if (!window.supabaseClient) return;

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            // Try to load from database
            const { data, error } = await window.supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                this.currentProfile = data;
            } else {
                // Create default profile
                this.currentProfile = {
                    user_id: user.id,
                    email: user.email,
                    display_name: user.email.split('@')[0], // Default to email username
                    avatar_url: null,
                    created_at: new Date().toISOString()
                };
                await this.saveProfile();
            }

            this.updateUIWithProfile();
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    async saveProfile() {
        if (!window.supabaseClient || !this.currentProfile) return;

        try {
            const { error } = await window.supabaseClient
                .from('user_profiles')
                .upsert(this.currentProfile);

            if (error) throw error;

            this.updateUIWithProfile();
            return true;
        } catch (error) {
            console.error('Failed to save profile:', error);
            return false;
        }
    }

    updateUIWithProfile() {
        if (!this.currentProfile) return;

        // Update display name in user menu
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = this.currentProfile.display_name || this.currentProfile.email;
        }

        // Update any other UI elements showing user info
        document.querySelectorAll('[data-user-display-name]').forEach(el => {
            el.textContent = this.currentProfile.display_name;
        });
    }

    async showProfileEditor() {
        // Check if user is authenticated
        if (!window.authManager?.isAuthenticated()) {
            window.notificationModal?.alert(
                'You must be logged in to edit your profile. Please sign in or create an account.',
                'warning',
                'Authentication Required'
            );
            return;
        }

        if (!window.editor) return;

        // Create comprehensive profile editor modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-edit"></i> Edit Profile</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label for="displayNameInput" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                            <i class="fas fa-user"></i> Display Name
                        </label>
                        <input 
                            type="text" 
                            id="displayNameInput" 
                            class="form-control" 
                            value="${this.currentProfile?.display_name || ''}" 
                            placeholder="Enter your display name"
                            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);"
                        />
                    </div>
                    
                    <div style="border-top: 1px solid var(--border-primary); padding-top: 1.5rem; margin-top: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                            <i class="fas fa-key"></i> Change Password (Optional)
                        </h4>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="newPasswordInput" style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">
                                New Password
                            </label>
                            <input 
                                type="password" 
                                id="newPasswordInput" 
                                class="form-control" 
                                placeholder="Leave blank to keep current password"
                                style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);"
                            />
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="confirmPasswordInput" style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">
                                Confirm New Password
                            </label>
                            <input 
                                type="password" 
                                id="confirmPasswordInput" 
                                class="form-control" 
                                placeholder="Confirm your new password"
                                style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);"
                            />
                        </div>
                        
                        <div id="passwordError" style="display: none; color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem;">
                            <i class="fas fa-exclamation-triangle"></i> <span id="passwordErrorText"></span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" id="saveProfileBtn">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle save button
        const saveBtn = modal.querySelector('#saveProfileBtn');
        const displayNameInput = modal.querySelector('#displayNameInput');
        const newPasswordInput = modal.querySelector('#newPasswordInput');
        const confirmPasswordInput = modal.querySelector('#confirmPasswordInput');
        const passwordError = modal.querySelector('#passwordError');
        const passwordErrorText = modal.querySelector('#passwordErrorText');

        saveBtn.onclick = async () => {
            const displayName = displayNameInput.value.trim();
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validate display name
            if (!displayName) {
                window.notificationModal?.alert('Display name cannot be empty', 'error', 'Validation Error');
                return;
            }

            // Validate password if provided
            if (newPassword || confirmPassword) {
                passwordError.style.display = 'none';
                
                if (newPassword.length < 6) {
                    passwordErrorText.textContent = 'Password must be at least 6 characters';
                    passwordError.style.display = 'block';
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    passwordErrorText.textContent = 'Passwords do not match';
                    passwordError.style.display = 'block';
                    return;
                }
            }

            // Disable button while saving
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                // Update display name
                if (!this.currentProfile) {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    this.currentProfile = {
                        user_id: user.id,
                        email: user.email,
                        display_name: displayName,
                        avatar_url: null,
                        created_at: new Date().toISOString()
                    };
                } else {
                    this.currentProfile.display_name = displayName;
                }

                const saved = await this.saveProfile();
                if (!saved) {
                    throw new Error('Failed to save profile');
                }

                // Update password if provided
                if (newPassword) {
                    const passwordResult = await window.authManager.updatePassword(newPassword);
                    if (!passwordResult.success) {
                        throw new Error(passwordResult.error || 'Failed to update password');
                    }
                }

                modal.remove();
                window.notificationModal?.alert(
                    newPassword ? 'Profile and password updated successfully!' : 'Profile updated successfully!',
                    'success',
                    'Success'
                );
            } catch (error) {
                console.error('Profile update error:', error);
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                window.notificationModal?.alert(
                    error.message || 'Failed to update profile',
                    'error',
                    'Error'
                );
            }
        };
    }

    getDisplayName() {
        return this.currentProfile?.display_name || this.currentProfile?.email || 'User';
    }

    getUserId() {
        return this.currentProfile?.user_id;
    }
}

// Initialize global user profile manager
if (typeof window !== 'undefined') {
    window.userProfileManager = new UserProfileManager();
}
