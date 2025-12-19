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
        if (!window.editor) return;

        const displayName = await window.editor.showPrompt(
            'Edit Profile',
            'Display Name:',
            this.currentProfile?.display_name || ''
        );

        if (displayName === null) return; // Cancelled

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
        if (saved) {
            window.notificationModal?.alert('Profile updated successfully!', 'success', 'Success');
        } else {
            window.notificationModal?.alert('Failed to update profile', 'error', 'Error');
        }
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
