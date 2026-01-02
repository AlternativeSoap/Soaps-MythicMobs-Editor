/**
 * User Profile Manager
 * Manages user display names and profiles
 * OPTIMIZED: Cached modal, reduced DOM operations
 */

class UserProfileManager {
    constructor() {
        this.currentProfile = null;
        this._cachedModalHTML = null; // Cache modal template
        this._profileModalElement = null; // Cache modal DOM element
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

        // Batch DOM updates using requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            // Update display name in user menu
            const userEmailElement = document.getElementById('user-email');
            if (userEmailElement) {
                userEmailElement.textContent = this.currentProfile.display_name || this.currentProfile.email;
            }

            // Update avatar in user menu button (header)
            const userAccountBtn = document.getElementById('user-account-btn');
            if (userAccountBtn) {
                const avatarContainer = userAccountBtn.querySelector('.user-avatar');
                if (avatarContainer) {
                    if (this.currentProfile.avatar_url) {
                        avatarContainer.innerHTML = `<img src="${this.currentProfile.avatar_url}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`;
                    } else {
                        // Show default icon or initials
                        const initials = (this.currentProfile.display_name || this.currentProfile.email || 'U').charAt(0).toUpperCase();
                        avatarContainer.innerHTML = `<div style="width: 24px; height: 24px; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${initials}</div>`;
                    }
                }
            }

            // Update any other UI elements showing user info
            document.querySelectorAll('[data-user-display-name]').forEach(el => {
                el.textContent = this.currentProfile.display_name;
            });

            // Update all avatar placeholders (including dropdown)
            document.querySelectorAll('[data-user-avatar]').forEach(el => {
                if (this.currentProfile.avatar_url) {
                    el.innerHTML = `<img src="${this.currentProfile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                } else {
                    // Show default icon or initials based on container size
                    const initials = (this.currentProfile.display_name || this.currentProfile.email || 'U').charAt(0).toUpperCase();
                    const size = el.offsetWidth || 32;
                    el.innerHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${size * 0.5}px;">${initials}</div>`;
                }
            });
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

        // PERFORMANCE: Use cached profile data
        const currentAvatar = this.currentProfile?.avatar_url || '';
        const currentBio = this.currentProfile?.bio || '';
        const currentWebsite = this.currentProfile?.website_url || '';
        const currentDiscord = this.currentProfile?.discord_username || '';
        const isPublic = this.currentProfile?.is_public !== false; // default true
        
        // PERFORMANCE: Reuse modal element if it exists, just update values
        if (this._profileModalElement && document.body.contains(this._profileModalElement)) {
            this._updateModalValues();
            this._profileModalElement.style.display = 'flex';
            return;
        }
        
        // Create modal element
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
                        <div id="avatarPreview" style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 1rem; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 3px solid var(--border-primary); cursor: pointer; position: relative;" title="Click to upload image">
                            ${currentAvatar 
                                ? `<img src="${currentAvatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">` 
                                : `<i class="fas fa-user" style="font-size: 2.5rem; color: var(--text-tertiary);"></i>`
                            }
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); padding: 0.25rem; opacity: 0; transition: opacity 0.2s;" class="avatar-upload-hint">
                                <i class="fas fa-camera" style="color: white; font-size: 0.75rem;"></i>
                            </div>
                        </div>
                        <input 
                            type="file" 
                            id="avatarFileInput" 
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            style="display: none;"
                        />
                        <input 
                            type="hidden" 
                            id="avatarUrlInput" 
                            value="${currentAvatar}"
                        />
                        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.5rem;">
                            <button type="button" id="uploadAvatarBtn" class="btn btn-sm btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;">
                                <i class="fas fa-upload"></i> Upload Image
                            </button>
                            ${currentAvatar ? `
                            <button type="button" id="removeAvatarBtn" class="btn btn-sm btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                            ` : ''}
                        </div>
                        <small style="color: var(--text-tertiary); font-size: 0.7rem; display: block; margin-top: 0.5rem;">
                            Max 256KB • PNG, JPG, GIF or WebP
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
                    <button class="btn btn-secondary" id="cancelProfileBtn">
                        Cancel
                    </button>
                    <button class="btn btn-primary" id="saveProfileBtn">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        `;

        // PERFORMANCE: Cache modal reference
        document.body.appendChild(modal);
        this._profileModalElement = modal;
        
        // Cancel button handler (hide instead of remove for reuse)
        const cancelBtn = modal.querySelector('#cancelProfileBtn');
        cancelBtn?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close button handler
        const closeBtn = modal.querySelector('.btn-close');
        closeBtn?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Avatar file upload handler
        const avatarFileInput = modal.querySelector('#avatarFileInput');
        const avatarUrlInput = modal.querySelector('#avatarUrlInput');
        const avatarPreview = modal.querySelector('#avatarPreview');
        const uploadAvatarBtn = modal.querySelector('#uploadAvatarBtn');
        const removeAvatarBtn = modal.querySelector('#removeAvatarBtn');
        
        // Click on preview or upload button triggers file input
        avatarPreview.addEventListener('click', () => avatarFileInput.click());
        uploadAvatarBtn?.addEventListener('click', () => avatarFileInput.click());
        
        // Hover effect for avatar preview
        avatarPreview.addEventListener('mouseenter', () => {
            const hint = avatarPreview.querySelector('.avatar-upload-hint');
            if (hint) hint.style.opacity = '1';
        });
        avatarPreview.addEventListener('mouseleave', () => {
            const hint = avatarPreview.querySelector('.avatar-upload-hint');
            if (hint) hint.style.opacity = '0';
        });
        
        // Remove avatar handler
        removeAvatarBtn?.addEventListener('click', () => {
            avatarUrlInput.value = '';
            avatarPreview.innerHTML = `
                <i class="fas fa-user" style="font-size: 2.5rem; color: var(--text-tertiary);"></i>
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); padding: 0.25rem; opacity: 0; transition: opacity 0.2s;" class="avatar-upload-hint">
                    <i class="fas fa-camera" style="color: white; font-size: 0.75rem;"></i>
                </div>
            `;
            removeAvatarBtn.style.display = 'none';
        });
        
        // File input change handler
        avatarFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                window.notificationModal?.alert('Please select a PNG, JPG, GIF or WebP image', 'error', 'Invalid File Type');
                return;
            }
            
            // Validate file size (256KB max)
            if (file.size > 256 * 1024) {
                window.notificationModal?.alert('Image must be smaller than 256KB. Please compress or resize your image.', 'error', 'File Too Large');
                return;
            }
            
            // Show loading state
            avatarPreview.innerHTML = `<i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--text-tertiary);"></i>`;
            
            try {
                // Convert to base64 data URL
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    
                    // Create small thumbnail (resize to 128x128 max for storage)
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const maxSize = 128;
                        let width = img.width;
                        let height = img.height;
                        
                        // Scale down maintaining aspect ratio
                        if (width > height) {
                            if (width > maxSize) {
                                height = Math.round(height * maxSize / width);
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width = Math.round(width * maxSize / height);
                                height = maxSize;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to compressed JPEG for smaller size
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        
                        // Update preview and hidden input
                        avatarPreview.innerHTML = `
                            <img src="${compressedDataUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); padding: 0.25rem; opacity: 0; transition: opacity 0.2s;" class="avatar-upload-hint">
                                <i class="fas fa-camera" style="color: white; font-size: 0.75rem;"></i>
                            </div>
                        `;
                        avatarUrlInput.value = compressedDataUrl;
                        
                        // Show remove button
                        if (removeAvatarBtn) {
                            removeAvatarBtn.style.display = 'inline-flex';
                        }
                    };
                    img.onerror = () => {
                        avatarPreview.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--text-warning);"></i>`;
                        window.notificationModal?.alert('Failed to load image', 'error', 'Error');
                    };
                    img.src = dataUrl;
                };
                reader.onerror = () => {
                    avatarPreview.innerHTML = `<i class="fas fa-user" style="font-size: 2.5rem; color: var(--text-tertiary);"></i>`;
                    window.notificationModal?.alert('Failed to read file', 'error', 'Error');
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Avatar upload error:', error);
                avatarPreview.innerHTML = `<i class="fas fa-user" style="font-size: 2.5rem; color: var(--text-tertiary);"></i>`;
                window.notificationModal?.alert('Failed to process image', 'error', 'Error');
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

                // PERFORMANCE: Hide instead of remove for faster reopening
                modal.style.display = 'none';
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

    // PERFORMANCE: Update modal values without recreating DOM
    _updateModalValues() {
        if (!this._profileModalElement) return;
        
        const modal = this._profileModalElement;
        const currentAvatar = this.currentProfile?.avatar_url || '';
        
        // Update form values
        modal.querySelector('#displayNameInput').value = this.currentProfile?.display_name || '';
        modal.querySelector('#avatarUrlInput').value = currentAvatar;
        modal.querySelector('#bioInput').value = this.currentProfile?.bio || '';
        modal.querySelector('#websiteInput').value = this.currentProfile?.website_url || '';
        modal.querySelector('#discordInput').value = this.currentProfile?.discord_username || '';
        modal.querySelector('#isPublicInput').checked = this.currentProfile?.is_public !== false;
        modal.querySelector('#newPasswordInput').value = '';
        modal.querySelector('#confirmPasswordInput').value = '';
        
        // Update avatar preview
        const avatarPreview = modal.querySelector('#avatarPreview');
        if (avatarPreview) {
            avatarPreview.innerHTML = currentAvatar 
                ? `<img src="${currentAvatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                   <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); padding: 0.25rem; opacity: 0; transition: opacity 0.2s;" class="avatar-upload-hint">
                       <i class="fas fa-camera" style="color: white; font-size: 0.75rem;"></i>
                   </div>`
                : `<i class="fas fa-user" style="font-size: 2.5rem; color: var(--text-tertiary);"></i>
                   <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); padding: 0.25rem; opacity: 0; transition: opacity 0.2s;" class="avatar-upload-hint">
                       <i class="fas fa-camera" style="color: white; font-size: 0.75rem;"></i>
                   </div>`;
        }
        
        // Reset save button state
        const saveBtn = modal.querySelector('#saveProfileBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
        
        // Hide password error
        const passwordError = modal.querySelector('#passwordError');
        if (passwordError) {
            passwordError.style.display = 'none';
        }
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
