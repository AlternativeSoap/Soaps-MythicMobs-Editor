/**
 * Admin Manager
 * Handles admin role checking, permissions, and admin-specific operations
 */

class AdminManager {
    constructor(supabaseClient, authManager) {
        this.supabase = supabaseClient;
        this.authManager = authManager;
        
        // Current user's admin role (cached)
        this.currentRole = null;
        this.isAdmin = false;
        
        // Role hierarchy and permissions
        this.ROLES = {
            super_admin: {
                level: 3,
                permissions: ['*'], // All permissions
                label: 'Super Admin',
                color: '#ff6b6b',
                icon: '👑'
            },
            template_admin: {
                level: 2,
                permissions: [
                    'create_official_template',
                    'edit_official_template',
                    'delete_official_template',
                    'approve_template',
                    'view_admin_panel',
                    'view_all_templates'
                ],
                label: 'Template Admin',
                color: '#4ecdc4',
                icon: '✨'
            },
            moderator: {
                level: 1,
                permissions: [
                    'flag_template',
                    'view_admin_panel',
                    'view_activity_log'
                ],
                label: 'Moderator',
                color: '#95e1d3',
                icon: '🛡️'
            }
        };
    }

    /**
     * Initialize admin status for current user
     */
    async initialize() {
        const user = await this.authManager.getCurrentUser();
        if (!user) {
            this.isAdmin = false;
            this.currentRole = null;
            return false;
        }

        await this.loadAdminRole();
        return this.isAdmin;
    }

    /**
     * Load admin role for current user
     */
    async loadAdminRole() {
        try {
            const user = await this.authManager.getCurrentUser();
            if (!user) {
                this.isAdmin = false;
                this.currentRole = null;
                return;
            }

            const { data, error } = await this.supabase
                .from('admin_roles')
                .select('role')
                .eq('user_id', user.id)
                .order('role', { ascending: false }) // Get highest role
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
                console.error('Error loading admin role:', error);
                this.isAdmin = false;
                this.currentRole = null;
                return;
            }

            if (data) {
                this.currentRole = data.role;
                this.isAdmin = true;
            } else {
                this.isAdmin = false;
                this.currentRole = null;
            }
        } catch (error) {
            console.error('Error in loadAdminRole:', error);
            this.isAdmin = false;
            this.currentRole = null;
        }
    }

    /**
     * Check if current user is an admin
     */
    async checkIsAdmin() {
        if (this.currentRole === null) {
            await this.loadAdminRole();
        }
        return this.isAdmin;
    }

    /**
     * Get current user's role
     */
    getCurrentRole() {
        return this.currentRole;
    }

    /**
     * Get role information
     */
    getRoleInfo(role = null) {
        const targetRole = role || this.currentRole;
        return this.ROLES[targetRole] || null;
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        if (!this.isAdmin || !this.currentRole) {
            return false;
        }

        const roleInfo = this.ROLES[this.currentRole];
        if (!roleInfo) return false;

        // Super admin has all permissions
        if (roleInfo.permissions.includes('*')) {
            return true;
        }

        return roleInfo.permissions.includes(permission);
    }

    /**
     * Check if user has specific role or higher
     */
    hasRoleOrHigher(requiredRole) {
        if (!this.isAdmin || !this.currentRole) {
            return false;
        }

        const currentLevel = this.ROLES[this.currentRole]?.level || 0;
        const requiredLevel = this.ROLES[requiredRole]?.level || 999;

        return currentLevel >= requiredLevel;
    }

    /**
     * Grant admin role to user (super admin only)
     */
    async grantRole(userEmail, role, notes = '') {
        if (!this.hasPermission('*')) {
            throw new Error('Only super admins can grant roles');
        }

        if (!this.ROLES[role]) {
            throw new Error('Invalid role');
        }

        try {
            // Find user by email
            const { data: users, error: userError } = await this.supabase
                .from('auth.users')
                .select('id')
                .eq('email', userEmail)
                .single();

            if (userError) {
                throw new Error('User not found');
            }

            const currentUser = await this.authManager.getCurrentUser();

            // Grant role
            const { data, error } = await this.supabase
                .from('admin_roles')
                .insert({
                    user_id: users.id,
                    role: role,
                    granted_by: currentUser.id,
                    notes: notes
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    throw new Error('User already has this role');
                }
                throw error;
            }

            // Log activity
            await this.logActivity('grant_role', 'user', users.id, {
                role: role,
                target_email: userEmail,
                notes: notes
            });

            return data;
        } catch (error) {
            console.error('Error granting role:', error);
            throw error;
        }
    }

    /**
     * Revoke admin role from user (super admin only)
     */
    async revokeRole(userId, role) {
        if (!this.hasPermission('*')) {
            throw new Error('Only super admins can revoke roles');
        }

        try {
            const { error } = await this.supabase
                .from('admin_roles')
                .delete()
                .eq('user_id', userId)
                .eq('role', role);

            if (error) throw error;

            // Log activity
            await this.logActivity('revoke_role', 'user', userId, {
                role: role
            });

            return true;
        } catch (error) {
            console.error('Error revoking role:', error);
            throw error;
        }
    }

    /**
     * Get all admin users
     */
    async getAllAdmins() {
        if (!this.hasPermission('view_admin_panel')) {
            throw new Error('Permission denied');
        }

        try {
            // Query admin_roles and join with user_profiles for display names
            const { data: adminRoles, error } = await this.supabase
                .from('admin_roles')
                .select('id, user_id, role, granted_by, granted_at, notes')
                .order('granted_at', { ascending: false });

            if (error) throw error;
            
            // Fetch user profiles for display info
            if (adminRoles && adminRoles.length > 0) {
                const userIds = adminRoles.map(a => a.user_id);
                const { data: profiles } = await this.supabase
                    .from('user_profiles')
                    .select('user_id, email, display_name')
                    .in('user_id', userIds);
                
                // Merge profiles with admin roles
                const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
                return adminRoles.map(admin => ({
                    ...admin,
                    email: profileMap.get(admin.user_id)?.email || 'Unknown',
                    display_name: profileMap.get(admin.user_id)?.display_name || null
                }));
            }
            
            return adminRoles || [];
        } catch (error) {
            console.error('Error fetching admins:', error);
            throw error;
        }
    }

    /**
     * Get recent admin activity
     */
    async getRecentActivity(limit = 50) {
        if (!this.hasPermission('view_activity_log')) {
            throw new Error('Permission denied');
        }

        try {
            const { data, error } = await this.supabase
                .from('admin_activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching activity log:', error);
            throw error;
        }
    }

    /**
     * Log admin activity
     */
    async logActivity(action, targetType, targetId, details = {}) {
        try {
            const user = await this.authManager.getCurrentUser();
            if (!user) return;

            const { error } = await this.supabase
                .from('admin_activity_log')
                .insert({
                    admin_user_id: user.id,
                    action: action,
                    target_type: targetType,
                    target_id: targetId,
                    details: details
                });

            if (error) {
                console.error('Error logging activity:', error);
            }
        } catch (error) {
            console.error('Error in logActivity:', error);
        }
    }

    /**
     * Get all official templates
     */
    async getOfficialTemplates() {
        try {
            const { data, error } = await this.supabase
                .from('official_templates_view')
                .select('*')
                .order('approved_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching official templates:', error);
            throw error;
        }
    }

    /**
     * Create admin badge HTML for UI
     */
    createAdminBadge() {
        if (!this.isAdmin || !this.currentRole) return '';

        const roleInfo = this.getRoleInfo();
        return `
            <span class="admin-badge" style="
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.5rem;
                background: ${roleInfo.color}22;
                color: ${roleInfo.color};
                border: 1px solid ${roleInfo.color}44;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                margin-left: 0.5rem;
            ">
                <span>${roleInfo.icon}</span>
                <span>${roleInfo.label}</span>
            </span>
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
}
