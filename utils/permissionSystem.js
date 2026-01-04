/**
 * Permission System
 * Manages role-based permissions
 */

class PermissionSystem {
    constructor() {
        // Define all available permissions
        this.PERMISSIONS = {
            // Template permissions
            'templates.view': 'View templates',
            'templates.create': 'Create templates',
            'templates.edit_own': 'Edit own templates',
            'templates.edit_any': 'Edit any template',
            'templates.delete_own': 'Delete own templates',
            'templates.delete_any': 'Delete any template',
            'templates.submit_official': 'Submit templates for approval',
            'templates.approve': 'Approve pending templates',
            'templates.reject': 'Reject pending templates',
            'templates.feature': 'Feature templates',
            
            // User permissions
            'users.view': 'View users',
            'users.edit': 'Edit users',
            'users.ban': 'Ban users',
            'users.grant_roles': 'Grant roles to users',
            
            // Admin permissions
            'admin.panel': 'Access admin panel',
            'admin.settings': 'Change system settings',
            'admin.logs': 'View error logs',
            'admin.analytics': 'View analytics',
            'admin.maintenance': 'Enable maintenance mode',
            
            // Pack permissions
            'packs.create': 'Create packs',
            'packs.edit_own': 'Edit own packs',
            'packs.edit_any': 'Edit any pack',
            'packs.delete_own': 'Delete own packs',
            'packs.delete_any': 'Delete any pack',
        };

        // Default role permissions
        this.DEFAULT_ROLES = {
            'user': [
                'templates.view',
                'templates.create',
                'templates.edit_own',
                'templates.delete_own',
                'templates.submit_official',
                'packs.create',
                'packs.edit_own',
                'packs.delete_own'
            ],
            'moderator': [
                'templates.view',
                'templates.create',
                'templates.edit_own',
                'templates.edit_any',
                'templates.delete_own',
                'templates.submit_official',
                'templates.approve',
                'templates.reject',
                'users.view',
                'users.ban',
                'admin.panel',
                'admin.logs',
                'packs.create',
                'packs.edit_own',
                'packs.edit_any'
            ],
            'template_admin': [
                'templates.view',
                'templates.create',
                'templates.edit_own',
                'templates.edit_any',
                'templates.delete_own',
                'templates.delete_any',
                'templates.submit_official',
                'templates.approve',
                'templates.reject',
                'templates.feature',
                'users.view',
                'admin.panel',
                'admin.analytics',
                'packs.create',
                'packs.edit_own',
                'packs.edit_any'
            ],
            'super_admin': Object.keys(this.PERMISSIONS) // All permissions
        };

        this.loadCustomPermissions();
    }

    loadCustomPermissions() {
        try {
            const saved = localStorage.getItem('custom_role_permissions');
            if (saved) {
                this.customPermissions = JSON.parse(saved);
            } else {
                this.customPermissions = {};
            }
        } catch (e) {
            this.customPermissions = {};
        }
    }

    saveCustomPermissions() {
        try {
            localStorage.setItem('custom_role_permissions', JSON.stringify(this.customPermissions));
        } catch (e) {
            console.error('Failed to save custom permissions:', e);
        }
    }

    getRolePermissions(role) {
        // Check custom permissions first
        if (this.customPermissions[role]) {
            return this.customPermissions[role];
        }
        // Fall back to defaults
        return this.DEFAULT_ROLES[role] || this.DEFAULT_ROLES['user'];
    }

    setRolePermissions(role, permissions) {
        this.customPermissions[role] = permissions;
        this.saveCustomPermissions();
    }

    hasPermission(userRoles, permission) {
        if (!userRoles || userRoles.length === 0) {
            userRoles = ['user'];
        }

        // Check each role
        for (const role of userRoles) {
            const rolePerms = this.getRolePermissions(role);
            if (rolePerms.includes(permission)) {
                return true;
            }
        }

        return false;
    }

    canEditTemplate(userRoles, templateAuthorId, userId) {
        // Can edit own templates
        if (templateAuthorId === userId && this.hasPermission(userRoles, 'templates.edit_own')) {
            return true;
        }
        // Can edit any template
        if (this.hasPermission(userRoles, 'templates.edit_any')) {
            return true;
        }
        return false;
    }

    canDeleteTemplate(userRoles, templateAuthorId, userId) {
        // Can delete own templates
        if (templateAuthorId === userId && this.hasPermission(userRoles, 'templates.delete_own')) {
            return true;
        }
        // Can delete any template
        if (this.hasPermission(userRoles, 'templates.delete_any')) {
            return true;
        }
        return false;
    }
}

// Initialize global permission system
if (typeof window !== 'undefined') {
    window.permissionSystem = new PermissionSystem();
}
