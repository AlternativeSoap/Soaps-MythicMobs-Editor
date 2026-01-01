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

        // Update avatar in user menu button
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn && this.currentProfile.avatar_url) {
            // Replace the icon with avatar if available
            const avatarContainer = userMenuBtn.querySelector('.user-avatar');
            if (avatarContainer) {
                avatarContainer.innerHTML = `<img src="${this.currentProfile.avatar_url}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`;
            }
        }

        // Update any other UI elements showing user info
        document.querySelectorAll('[data-user-display-name]').forEach(el => {
            el.textContent = this.currentProfile.display_name;
        });

        document.querySelectorAll('[data-user-avatar]').forEach(el => {
            if (this.currentProfile.avatar_url) {
                el.innerHTML = `<img src="${this.currentProfile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
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
        const currentAvatar = this.currentProfile?.avatar_url || '';
        const currentBio = this.currentProfile?.bio || '';
        const currentWebsite = this.currentProfile?.website_url || '';
        const currentDiscord = this.currentProfile?.discord_username || '';
        const isPublic = this.currentProfile?.is_public !== false; // default true
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 550px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-edit"></i> Edit Profile</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <!-- Avatar Section -->
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div id="avatarPreview" style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 1rem; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 3px solid var(--border-primary);">
                            ${currentAvatar 
                                ? `<img src="${currentAvatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">` 
                                : `<i class="fas fa-user" style="font-size: 2.5rem; color: var(--text-tertiary);"></i>`
                            }
                        </div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">
                            <i class="fas fa-image"></i> Profile Picture URL
                        </label>
                        <input 
                            type="url" 
                            id="avatarUrlInput" 
                            class="form-control" 
                            value="${currentAvatar}" 
                            placeholder="https://example.com/your-image.png"
                            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);"
                        />
                        <small style="color: var(--text-tertiary); font-size: 0.75rem; display: block; margin-top: 0.25rem;">
                            Use an image URL from Imgur, Discord, or any image hosting service
                        </small>
                    </div>

                    <div class="form-group" style="margin-bottom: 1rem;">
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

                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label for="bioInput" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                            <i class="fas fa-info-circle"></i> Bio
                        </label>
                        <textarea 
                            id="bioInput" 
                            class="form-control" 
                            placeholder="Tell us a bit about yourself..."
                            rows="3"
                            maxlength="500"
                            style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary); resize: vertical;"
                        >${currentBio}</textarea>
                        <small style="color: var(--text-tertiary); font-size: 0.75rem;">Max 500 characters</small>
                    </div>

                    <!-- Social Links Section -->
                    <div style="border-top: 1px solid var(--border-primary); padding-top: 1rem; margin-top: 1rem;">
                        <h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                            <i class="fas fa-link"></i> Social Links
                        </h4>

                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="websiteInput" style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">
                                <i class="fas fa-globe"></i> Website
                            </label>
                            <input 
                                type="url" 
                                id="websiteInput" 
                                class="form-control" 
                                value="${currentWebsite}" 
                                placeholder="https://your-website.com"
                                style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);"
                            />
                        </div>

                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="discordInput" style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;">
                                <i class="fab fa-discord"></i> Discord Username
                            </label>
                            <input 
                                type="text" 
                                id="discordInput" 
                                class="form-control" 
                                value="${currentDiscord}" 
                                placeholder="username or username#1234"
                                maxlength="100"
                                style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);"
                            />
                        </div>
                    </div>

                    <!-- Privacy Section -->
                    <div style="border-top: 1px solid var(--border-primary); padding-top: 1rem; margin-top: 1rem;">
                        <h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                            <i class="fas fa-shield-alt"></i> Privacy
                        </h4>

                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input 
                                type="checkbox" 
                                id="isPublicInput" 
                                ${isPublic ? 'checked' : ''}
                                style="width: 18px; height: 18px; accent-color: var(--accent-primary);"
                            />
                            <span style="font-size: 0.875rem;">
                                <strong>Public Profile</strong> - Allow others to see your profile, bio, and social links
                            </span>
                        </label>
                    </div>
                    
                    <div style="border-top: 1px solid var(--border-primary); padding-top: 1rem; margin-top: 1rem;">
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

        // Avatar URL preview handler
        const avatarUrlInput = modal.querySelector('#avatarUrlInput');
        const avatarPreview = modal.querySelector('#avatarPreview');
        
        avatarUrlInput.addEventListener('input', () => {
            const url = avatarUrlInput.value.trim();
            if (url) {
                // Test if URL is valid image
                const img = new Image();
                img.onload = () => {
                    avatarPreview.innerHTML = `<img src="${url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                img.onerror = () => {
                    avatarPreview.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--text-warning);"></i>`;
                };
                img.src = url;
            } else {
                avatarPreview.innerHTML = `<i class="fas fa-user" style="font-size: 2.5rem; color: var(--text-tertiary);"></i>`;
            }
        });

        // Handle save button
        const saveBtn = modal.querySelector('#saveProfileBtn');
        const displayNameInput = modal.querySelector('#displayNameInput');
        const bioInput = modal.querySelector('#bioInput');
        const websiteInput = modal.querySelector('#websiteInput');
        const discordInput = modal.querySelector('#discordInput');
        const isPublicInput = modal.querySelector('#isPublicInput');
        const newPasswordInput = modal.querySelector('#newPasswordInput');
        const confirmPasswordInput = modal.querySelector('#confirmPasswordInput');
        const passwordError = modal.querySelector('#passwordError');
        const passwordErrorText = modal.querySelector('#passwordErrorText');

        saveBtn.onclick = async () => {
            const displayName = displayNameInput.value.trim();
            const avatarUrl = avatarUrlInput.value.trim() || null;
            const bio = bioInput.value.trim() || null;
            const websiteUrl = websiteInput.value.trim() || null;
            const discordUsername = discordInput.value.trim() || null;
            const isPublicProfile = isPublicInput.checked;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validate display name
            if (!displayName) {
                window.notificationModal?.alert('Display name cannot be empty', 'error', 'Validation Error');
                return;
            }

            // Validate website URL format if provided
            if (websiteUrl && !websiteUrl.match(/^https?:\/\/.+/)) {
                window.notificationModal?.alert('Website URL must start with http:// or https://', 'error', 'Validation Error');
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
                // Update profile fields
                if (!this.currentProfile) {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    this.currentProfile = {
                        user_id: user.id,
                        email: user.email,
                        display_name: displayName,
                        avatar_url: avatarUrl,
                        bio: bio,
                        website_url: websiteUrl,
                        discord_username: discordUsername,
                        is_public: isPublicProfile,
                        created_at: new Date().toISOString()
                    };
                } else {
                    this.currentProfile.display_name = displayName;
                    this.currentProfile.avatar_url = avatarUrl;
                    this.currentProfile.bio = bio;
                    this.currentProfile.website_url = websiteUrl;
                    this.currentProfile.discord_username = discordUsername;
                    this.currentProfile.is_public = isPublicProfile;
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

    getAvatarUrl() {
        return this.currentProfile?.avatar_url || null;
    }

    getUserId() {
        return this.currentProfile?.user_id;
    }

    // Generate avatar HTML for use in comments, templates, etc.
    getAvatarHTML(size = 32) {
        const avatar = this.getAvatarUrl();
        const displayName = this.getDisplayName();
        if (avatar) {
            return `<img src="${avatar}" alt="${displayName}" style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;">`;
        }
        // Default avatar with initials
        const initials = displayName.charAt(0).toUpperCase();
        return `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${size * 0.4}px;">${initials}</div>`;
    }
}

// Initialize global user profile manager
if (typeof window !== 'undefined') {
    window.userProfileManager = new UserProfileManager();
}
