/**
 * Admin Panel
 * Main admin interface for managing templates, users, and system settings
 */

class AdminPanel {
    constructor(adminManager, templateManager, authManager) {
        this.adminManager = adminManager;
        this.templateManager = templateManager;
        this.authManager = authManager;
        
        // Initialize browser data merger and browser admin manager
        if (window.supabaseClient) {
            this.browserDataMerger = new BrowserDataMerger(window.supabaseClient);
            this.browserAdminManager = new BrowserAdminManager(adminManager, this.browserDataMerger, window.supabaseClient);
        }
        
        this.currentTab = 'templates';
        this.currentBrowserType = 'mechanics'; // Default browser type
        this.showHiddenOnly = false; // Track show hidden filter state
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create admin panel modal
     */
    createModal() {
        const modalHTML = `
            <div id="adminPanelOverlay" class="modal-overlay" style="display: none; z-index: 10000;">
                <div class="modal-content admin-panel-modal" style="max-width: 1400px; height: 90vh; max-height: 1000px;">
                    <!-- Header -->
                    <div class="modal-header">
                        <h2>
                            <i class="fas fa-shield-alt"></i>
                            Admin Panel
                            <span id="adminPanelRoleBadge"></span>
                        </h2>
                        <button class="btn-close" id="adminPanelClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="admin-panel-tabs">
                        <button class="admin-tab active" data-tab="templates">
                            <i class="fas fa-layer-group"></i>
                            <span>Official Templates</span>
                        </button>
                        <button class="admin-tab" data-tab="browsers" id="adminTabBrowsers">
                            <i class="fas fa-database"></i>
                            <span>Browser Management</span>
                        </button>
                        <button class="admin-tab" data-tab="users" id="adminTabUsers">
                            <i class="fas fa-users-cog"></i>
                            <span>Admin Users</span>
                        </button>
                        <button class="admin-tab" data-tab="activity">
                            <i class="fas fa-history"></i>
                            <span>Activity Log</span>
                        </button>
                    </div>
                    
                    <!-- Tab Contents -->
                    <div class="admin-panel-body">
                        <!-- Templates Tab -->
                        <div class="admin-tab-content active" data-tab-content="templates">
                            <div class="admin-section-header">
                                <div>
                                    <h3>Official Templates</h3>
                                    <p>Create and manage official skill templates</p>
                                </div>
                                <button class="btn btn-primary" id="btnCreateOfficialTemplate">
                                    <i class="fas fa-plus"></i> Create Official Template
                                </button>
                            </div>
                            
                            <div class="admin-templates-filters">
                                <input type="text" id="adminTemplateSearch" class="form-input" placeholder="Search official templates...">
                                <select id="adminTemplateTypeFilter" class="form-select">
                                    <option value="all">All Types</option>
                                    <option value="skill">Skill</option>
                                    <option value="mob">Mob</option>
                                </select>
                                <select id="adminTemplateStructureFilter" class="form-select">
                                    <option value="all">All Structures</option>
                                    <option value="single">Single Line</option>
                                    <option value="multi-line">Multi-Line</option>
                                    <option value="multi-section">Multi-Section</option>
                                </select>
                            </div>
                            
                            <div id="adminTemplatesList" class="admin-templates-grid"></div>
                        </div>
                        
                        <!-- Browser Management Tab -->
                        <div class="admin-tab-content" data-tab-content="browsers">
                            <div class="admin-section-header">
                                <div>
                                    <h3>Browser Management</h3>
                                    <p>Manage custom mechanics, conditions, triggers, and targeters</p>
                                </div>
                                <div class="browser-type-selector">
                                    <select id="browserTypeSelect" class="form-select browser-type-selector">
                                        <option value="mechanics">⚙️ Mechanics (180+)</option>
                                        <option value="conditions">🔍 Conditions (100+)</option>
                                        <option value="triggers">⚡ Triggers (32)</option>
                                        <option value="targeters">🎯 Targeters (50+)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="browser-management-container">
                                <!-- Custom Items Section -->
                                <div class="browser-section">
                                    <div class="section-header">
                                        <h4>Custom Items</h4>
                                        <button class="btn btn-primary btn-sm" id="btnAddCustomItem">
                                            <i class="fas fa-plus"></i> <span id="btnAddCustomItemText">Add Custom</span>
                                        </button>
                                    </div>
                                    <div class="browser-filters">
                                        <input type="text" id="customItemSearch" class="form-input" placeholder="Search custom items...">
                                    </div>
                                    <div id="customItemsList" class="browser-items-list"></div>
                                </div>

                                <!-- Built-in Items Section -->
                                <div class="browser-section" id="builtInSection">
                                    <div class="section-header">
                                        <h4>Built-in Items</h4>
                                        <span class="badge" id="hiddenCountBadge">0 hidden</span>
                                    </div>
                                    <div class="browser-filters">
                                        <input type="text" id="builtInSearch" class="form-input" placeholder="Search built-in items...">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="showHiddenOnly">
                                            <span>Show hidden only</span>
                                        </label>
                                    </div>
                                    <div id="builtInItemsList" class="browser-items-list"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Users Tab (Super Admin Only) -->
                        <div class="admin-tab-content" data-tab-content="users">
                            <div class="admin-section-header">
                                <div>
                                    <h3>Admin Users</h3>
                                    <p>Manage admin roles and permissions</p>
                                </div>
                                <button class="btn btn-primary" id="btnGrantRole">
                                    <i class="fas fa-user-plus"></i> Grant Admin Role
                                </button>
                            </div>
                            
                            <div id="adminUsersList" class="admin-users-list"></div>
                        </div>
                        
                        <!-- Activity Tab -->
                        <div class="admin-tab-content" data-tab-content="activity">
                            <div class="admin-section-header">
                                <div>
                                    <h3>Activity Log</h3>
                                    <p>Recent admin actions and changes</p>
                                </div>
                                <button class="btn btn-secondary" id="btnRefreshActivity">
                                    <i class="fas fa-sync-alt"></i> Refresh
                                </button>
                            </div>
                            
                            <div id="adminActivityList" class="admin-activity-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add Custom Item Form Modal
        const customItemModalHTML = `
            <!-- Custom Item Form Modal -->
            <div id="customItemFormOverlay" class="modal-overlay" style="display: none; z-index: 10100;">
                <div class="modal-content custom-item-dialog custom-item-form-modal">
                    <div class="modal-header">
                        <h2 id="customItemFormTitle">Add Custom Item</h2>
                        <button class="btn-close" id="customItemFormClose">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="customItemForm" class="custom-item-form">
                            <!-- Dynamic form fields rendered here -->
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="customItemFormCancel">Cancel</button>
                        <button class="btn btn-primary" id="customItemFormSubmit">Create</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', customItemModalHTML);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        document.getElementById('adminPanelClose')?.addEventListener('click', () => this.close());
        
        // Overlay click to close
        document.getElementById('adminPanelOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'adminPanelOverlay') this.close();
        });
        
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Create official template
        document.getElementById('btnCreateOfficialTemplate')?.addEventListener('click', () => {
            this.createOfficialTemplate();
        });
        
        // Grant role button
        document.getElementById('btnGrantRole')?.addEventListener('click', () => {
            this.showGrantRoleDialog();
        });
        
        // Refresh activity
        document.getElementById('btnRefreshActivity')?.addEventListener('click', () => {
            this.loadActivityLog();
        });
        
        // Search and filters
        document.getElementById('adminTemplateSearch')?.addEventListener('input', (e) => {
            this.filterTemplates();
        });
        
        document.getElementById('adminTemplateTypeFilter')?.addEventListener('change', () => {
            this.filterTemplates();
        });
        
        document.getElementById('adminTemplateStructureFilter')?.addEventListener('change', () => {
            this.filterTemplates();
        });

        // Browser management events
        document.getElementById('browserTypeSelect')?.addEventListener('change', (e) => {
            this.currentBrowserType = e.target.value;
            this.loadBrowserManagement();
        });

        document.getElementById('btnAddCustomItem')?.addEventListener('click', () => {
            this.showAddCustomItemDialog();
        });

        document.getElementById('customItemSearch')?.addEventListener('input', () => {
            this.filterBrowserItems('custom');
        });

        document.getElementById('builtInSearch')?.addEventListener('input', () => {
            this.filterBrowserItems('builtin');
        });

        document.getElementById('showHiddenOnly')?.addEventListener('change', (e) => {
            this.showHiddenOnly = e.target.checked;
            this.filterBrowserItems('builtin');
        });
    }

    /**
     * Open admin panel
     */
    async open() {
        // Check permissions
        const isAdmin = await this.adminManager.checkIsAdmin();
        if (!isAdmin) {
            window.notificationModal?.alert(
                'You do not have administrator privileges to access this panel.',
                'error',
                'Access Denied'
            );
            return;
        }

        // Show role badge
        const roleBadge = document.getElementById('adminPanelRoleBadge');
        if (roleBadge) {
            roleBadge.innerHTML = this.adminManager.createAdminBadge();
        }

        // Show/hide Users tab based on permissions
        const usersTab = document.getElementById('adminTabUsers');
        if (usersTab) {
            usersTab.style.display = this.adminManager.hasPermission('*') ? 'flex' : 'none';
        }

        // Show modal
        document.getElementById('adminPanelOverlay').style.display = 'flex';
        
        // Load initial data
        await this.loadTemplates();
    }

    /**
     * Close admin panel
     */
    close() {
        document.getElementById('adminPanelOverlay').style.display = 'none';
    }

    /**
     * Switch tabs
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tabName);
        });
        
        // Load tab data
        if (tabName === 'templates') {
            this.loadTemplates();
        } else if (tabName === 'browsers') {
            this.loadBrowserManagement();
        } else if (tabName === 'users') {
            this.loadAdminUsers();
        } else if (tabName === 'activity') {
            this.loadActivityLog();
        }
    }

    /**
     * Load official templates
     */
    async loadTemplates() {
        try {
            const templates = await this.adminManager.getOfficialTemplates();
            this.allTemplates = templates;
            this.renderTemplates(templates);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.showError('Failed to load templates');
        }
    }

    /**
     * Render templates grid
     */
    renderTemplates(templates) {
        const container = document.getElementById('adminTemplatesList');
        if (!container) return;

        if (templates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>No official templates yet</p>
                    <button class="btn btn-primary" onclick="window.adminPanel.createOfficialTemplate()">
                        <i class="fas fa-plus"></i> Create First Template
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map(template => `
            <div class="admin-template-card">
                <div class="template-card-header">
                    <div>
                        <h4>
                            <span class="template-icon">${this.getStructureIcon(template.structure_type)}</span>
                            ${template.name}
                        </h4>
                        <div class="template-meta">
                            <span class="badge badge-${template.type}">${template.type}</span>
                            <span class="badge">${template.structure_type || 'multi-line'}</span>
                            ${template.category ? `<span class="badge">${template.category}</span>` : ''}
                        </div>
                    </div>
                    <div class="template-actions">
                        <button class="btn btn-sm btn-secondary" onclick="window.adminPanel.editTemplate('${template.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.adminPanel.deleteTemplate('${template.id}', '${template.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="template-card-body">
                    <div class="template-info">
                        <div>
                            <small>Created by:</small>
                            <span>${template.created_by_email || 'Unknown'}</span>
                        </div>
                        <div>
                            <small>Approved by:</small>
                            <span>${template.approved_by_email || 'System'}</span>
                        </div>
                        <div>
                            <small>Approved:</small>
                            <span>${this.formatDate(template.approved_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Filter templates
     */
    filterTemplates() {
        if (!this.allTemplates) return;

        const searchTerm = document.getElementById('adminTemplateSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('adminTemplateTypeFilter')?.value || 'all';
        const structureFilter = document.getElementById('adminTemplateStructureFilter')?.value || 'all';

        const filtered = this.allTemplates.filter(template => {
            const matchesSearch = !searchTerm || 
                template.name.toLowerCase().includes(searchTerm) ||
                template.category?.toLowerCase().includes(searchTerm);
            
            const matchesType = typeFilter === 'all' || template.type === typeFilter;
            const matchesStructure = structureFilter === 'all' || template.structure_type === structureFilter;

            return matchesSearch && matchesType && matchesStructure;
        });

        this.renderTemplates(filtered);
    }

    /**
     * Create official template
     */
    createOfficialTemplate() {
        if (!this.adminManager.hasPermission('create_official_template')) {
            window.notificationModal?.alert(
                'You do not have permission to create official templates.',
                'error',
                'Permission Denied'
            );
            return;
        }

        // Close admin panel
        this.close();

        // Open template wizard in admin mode
        if (window.templateWizard) {
            window.templateWizard.open(null, true); // true = admin mode (auto-checks is_official)
        } else {
            console.error('❌ Template wizard not available');
            window.notificationModal?.alert(
                'The Template Wizard component is not available. Please refresh the page.',
                'error',
                'Component Not Available'
            );
        }
    }

    /**
     * Edit template
     */
    async editTemplate(templateId) {
        if (!this.adminManager.hasPermission('edit_official_template')) {
            window.notificationModal?.alert(
                'You do not have permission to edit official templates.',
                'error',
                'Permission Denied'
            );
            return;
        }

        try {
            const template = await this.templateManager.getTemplate(templateId);
            if (!template) {
                window.notificationModal?.alert(
                    'The requested template could not be found.',
                    'error',
                    'Template Not Found'
                );
                return;
            }

            this.close();
            window.templateEditor?.open(template, true); // true = admin mode
        } catch (error) {
            console.error('Error loading template:', error);
            window.notificationModal?.alert(
                'Failed to load the template. Please try again.',
                'error',
                'Load Failed'
            );
        }
    }

    /**
     * Delete template
     */
    async deleteTemplate(templateId, templateName) {
        if (!this.adminManager.hasPermission('delete_official_template')) {
            window.notificationModal?.alert(
                'You do not have permission to delete official templates.',
                'error',
                'Permission Denied'
            );
            return;
        }

        const confirmed = await window.notificationModal?.confirm(
            `Are you sure you want to delete the official template "${templateName}"? This action cannot be undone.`,
            'Confirm Deletion',
            { confirmText: 'Delete', confirmButtonClass: 'danger' }
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await this.templateManager.deleteTemplate(templateId);
            await this.adminManager.logActivity('delete_official_template', 'template', templateId, {
                template_name: templateName
            });
            
            this.showSuccess('Template deleted successfully');
            await this.loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            this.showError('Failed to delete template');
        }
    }

    /**
     * Load admin users
     */
    async loadAdminUsers() {
        if (!this.adminManager.hasPermission('*')) {
            document.getElementById('adminUsersList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>Super Admin access required</p>
                </div>
            `;
            return;
        }

        try {
            const admins = await this.adminManager.getAllAdmins();
            this.renderAdminUsers(admins);
        } catch (error) {
            console.error('Error loading admins:', error);
            this.showError('Failed to load admin users');
        }
    }

    /**
     * Render admin users
     */
    renderAdminUsers(admins) {
        const container = document.getElementById('adminUsersList');
        if (!container) return;

        if (admins.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No admin users found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = admins.map(admin => {
            const roleInfo = this.adminManager.getRoleInfo(admin.role);
            return `
                <div class="admin-user-card">
                    <div class="admin-user-info">
                        <div class="admin-user-avatar">${roleInfo.icon}</div>
                        <div>
                            <h4>${admin.email}</h4>
                            <span class="admin-role-badge" style="background: ${roleInfo.color}22; color: ${roleInfo.color};">
                                ${roleInfo.label}
                            </span>
                        </div>
                    </div>
                    <div class="admin-user-meta">
                        <div><small>Granted by:</small> ${admin.granted_by_email || 'System'}</div>
                        <div><small>Granted:</small> ${this.formatDate(admin.granted_at)}</div>
                        ${admin.notes ? `<div><small>Notes:</small> ${admin.notes}</div>` : ''}
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="window.adminPanel.revokeRole('${admin.user_id}', '${admin.role}', '${admin.email}')">
                        <i class="fas fa-user-minus"></i> Revoke
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * Show grant role dialog
     */
    async showGrantRoleDialog() {
        const email = await window.editor?.showPrompt('Grant Admin Role', 'Enter user email:');
        if (!email) return;

        const role = await window.editor?.showPrompt('Grant Admin Role', 'Enter role (super_admin, template_admin, moderator):');
        if (!role || !this.adminManager.ROLES[role]) {
            window.notificationModal?.alert(
                'Invalid role specified. Valid roles are: super_admin, template_admin, moderator',
                'error',
                'Invalid Role'
            );
            return;
        }

        const notes = await window.editor?.showPrompt('Grant Admin Role', 'Notes (optional):') || '';

        this.grantRole(email, role, notes);
    }

    /**
     * Grant admin role
     */
    async grantRole(email, role, notes) {
        try {
            await this.adminManager.grantRole(email, role, notes);
            this.showSuccess('Role granted successfully');
            await this.loadAdminUsers();
        } catch (error) {
            console.error('Error granting role:', error);
            this.showError(error.message || 'Failed to grant role');
        }
    }

    /**
     * Revoke admin role
     */
    async revokeRole(userId, role, email) {
        const confirmed = await window.editor?.showConfirmDialog(
            'Revoke Admin Role',
            `Revoke ${role} from ${email}?`,
            'Revoke',
            'Cancel'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await this.adminManager.revokeRole(userId, role);
            this.showSuccess('Role revoked successfully');
            await this.loadAdminUsers();
        } catch (error) {
            console.error('Error revoking role:', error);
            this.showError('Failed to revoke role');
        }
    }

    /**
     * Load activity log
     */
    async loadActivityLog() {
        try {
            const activities = await this.adminManager.getRecentActivity();
            this.renderActivityLog(activities);
        } catch (error) {
            console.error('Error loading activity log:', error);
            this.showError('Failed to load activity log');
        }
    }

    /**
     * Render activity log
     */
    renderActivityLog(activities) {
        const container = document.getElementById('adminActivityList');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-log-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.action)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <strong>${activity.admin_email}</strong>
                        <span class="activity-action">${this.formatAction(activity.action)}</span>
                    </div>
                    <div class="activity-meta">
                        <span>${this.formatDate(activity.created_at)}</span>
                        ${activity.target_type ? `<span>Target: ${activity.target_type}</span>` : ''}
                    </div>
                    ${activity.details ? `
                        <div class="activity-details">
                            ${JSON.stringify(activity.details, null, 2)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Load browser management data
     */
    async loadBrowserManagement() {
        try {
            const type = this.currentBrowserType;
            const typeInfo = this.getBrowserTypeInfo(type);

            // Load custom items
            const customResult = await this.browserAdminManager.getCustomItems(type);
            const customItems = customResult.data || [];
            
            // Store for counting
            this.currentCustomItems = customItems;

            // Render custom items
            this.renderCustomItems(customItems);

            // Load built-in items with hidden status
            await this.loadBuiltInItems(type);

        } catch (error) {
            console.error('Error loading browser management:', error);
            this.showError('Failed to load browser data');
        }
    }

    /**
     * Load and render built-in items
     */
    async loadBuiltInItems(type) {
        try {
            // Get hidden items
            const hiddenResult = await this.browserAdminManager.getHiddenBuiltIns(type);
            const hiddenIds = new Set((hiddenResult.data || []).map(item => item.item_id));

            // Update hidden count badge
            const badge = document.getElementById('hiddenCountBadge');
            if (badge) {
                badge.textContent = `${hiddenIds.size} hidden`;
            }

            // Load built-in data directly from global scope
            let builtInItems = [];
            if (type === 'mechanics') {
                builtInItems = window.MECHANICS_DATA?.mechanics || [];
            } else if (type === 'conditions') {
                // Use ALL_CONDITIONS array from conditions/index.js
                builtInItems = window.ALL_CONDITIONS || [];
            } else if (type === 'triggers') {
                builtInItems = window.TRIGGERS_DATA?.triggers || [];
            } else if (type === 'targeters') {
                builtInItems = window.TARGETERS_DATA?.targeters || [];
            }

            // Mark hidden items using correct identifier
            builtInItems.forEach(item => {
                const itemId = this.getItemIdentifier(item, type);
                item.isHidden = hiddenIds.has(itemId);
            });

            this.allBuiltInItems = builtInItems;
            
            // Apply saved filter state
            const checkbox = document.getElementById('showHiddenOnly');
            if (checkbox) {
                checkbox.checked = this.showHiddenOnly;
            }
            
            // Filter items based on saved state
            if (this.showHiddenOnly) {
                this.filterBrowserItems('builtin');
            } else {
                this.renderBuiltInItems(builtInItems);
            }

        } catch (error) {
            console.error('Error loading built-in items:', error);
        }
    }

    /**
     * Render custom items list
     */
    renderCustomItems(items) {
        const container = document.getElementById('customItemsList');
        if (!container) return;

        const type = this.currentBrowserType;
        const typeInfo = this.getBrowserTypeInfo(type);

        // Update section header with count
        const customHeader = document.querySelector('.browser-section:nth-child(1) .section-header h4');
        if (customHeader) {
            customHeader.innerHTML = `Custom ${typeInfo.plural} <span class="item-count">(${items.length})</span>`;
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.3;"></i>
                    <p>No custom ${typeInfo.plural.toLowerCase()} yet</p>
                    <p class="text-muted">Click "Add Custom" to create one</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            const itemAliases = item.item_aliases || item.aliases || [];
            const attributes = Array.isArray(item.attributes) ? item.attributes : [];
            
            return `
                <div class="custom-item-card" data-item-id="${item.id}">
                    <div class="item-header">
                        <div class="item-title-section">
                            <h5 class="item-name">${this.escapeHtml(item.name)}</h5>
                            <div class="item-badges">
                                <span class="badge badge-custom">Custom</span>
                                <span class="badge badge-category">${this.escapeHtml(item.category)}</span>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-icon btn-edit" onclick="window.adminPanel.editCustomItem('${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="window.adminPanel.deleteCustomItem('${item.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <p class="item-description">${this.escapeHtml(item.description)}</p>
                    
                    ${itemAliases.length > 0 ? `
                        <div class="item-meta">
                            <strong>Aliases:</strong> ${itemAliases.map(a => `<code>${this.escapeHtml(a)}</code>`).join(', ')}
                        </div>
                    ` : ''}
                    
                    ${attributes.length > 0 ? `
                        <div class="item-meta">
                            <strong>Attributes:</strong> ${attributes.map(a => `<code>${this.escapeHtml(a.name)}</code>`).join(', ')}
                        </div>
                    ` : ''}
                    
                    ${item.tags && item.tags.length > 0 ? `
                        <div class="item-tags">
                            ${item.tags.map(tag => `<span class="tag-small">${this.escapeHtml(tag)}</span>`).join(' ')}
                        </div>
                    ` : ''}
                    
                    <div class="item-footer">
                        <small class="text-muted">
                            ${item.creator && item.creator.email ? `Created by ${this.escapeHtml(item.creator.email)}` : 'Custom item'}
                            ${item.created_at ? ` • ${new Date(item.created_at).toLocaleDateString()}` : ''}
                        </small>
                    </div>
                </div>
            `;
        }).join('');

        this.allCustomItems = items;
    }

    /**
     * Render built-in items list
     */
    renderBuiltInItems(items) {
        const container = document.getElementById('builtInItemsList');
        if (!container) return;

        const type = this.currentBrowserType;
        const typeInfo = this.getBrowserTypeInfo(type);
        const isSuperAdmin = this.adminManager.hasPermission('*');

        // Calculate visible/total counts
        const totalCount = this.allBuiltInItems?.length || 0;
        const visibleCount = items.filter(item => !item.isHidden).length;
        const hiddenCount = totalCount - visibleCount;

        // Update section header with count
        const builtInHeader = document.querySelector('.browser-section:nth-child(2) .section-header h4');
        if (builtInHeader) {
            builtInHeader.innerHTML = `${typeInfo.icon} Built-in ${typeInfo.plural} <span class="item-count">(${visibleCount}/${totalCount})</span>`;
        }

        // Update hidden count badge
        const hiddenBadge = document.getElementById('hiddenCountBadge');
        if (hiddenBadge) {
            hiddenBadge.textContent = `${hiddenCount} hidden`;
            hiddenBadge.style.display = hiddenCount > 0 ? 'inline-block' : 'none';
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <p>No ${typeInfo.plural.toLowerCase()} found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            const itemId = this.getItemIdentifier(item, type);
            
            return `
            <div class="browser-item-card builtin-item ${item.isHidden ? 'hidden-item' : ''}" data-browser-type="${type}" style="border-left-color: ${typeInfo.color};">
                <div class="item-header">
                    <div class="item-info">
                        <span class="type-badge" style="background: ${typeInfo.color};">${typeInfo.icon}</span>
                        <h5>${item.name} ${item.isHidden ? '<span class="hidden-badge">Hidden</span>' : ''}</h5>
                        <span class="badge">${item.category}</span>
                    </div>
                    ${isSuperAdmin ? `
                        <div class="item-actions">
                            <button class="btn btn-sm btn-icon btn-edit" onclick="window.adminPanel.editBuiltInItem('${itemId}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${item.isHidden ? `
                                <button class="btn btn-sm btn-success" onclick="window.adminPanel.showBuiltInItem('${itemId}')" title="Show">
                                    <i class="fas fa-eye"></i> Show
                                </button>
                            ` : `
                                <button class="btn btn-sm btn-warning" onclick="window.adminPanel.hideBuiltInItem('${itemId}')" title="Hide">
                                    <i class="fas fa-eye-slash"></i> Hide
                                </button>
                            `}
                        </div>
                    ` : ''}
                </div>
                <p class="item-description">${item.description}</p>
                ${item.aliases && item.aliases.length > 0 ? `<div class="item-aliases">Aliases: ${item.aliases.join(', ')}</div>` : ''}
            </div>
        `;
        }).join('');
    }

    /**
     * Filter browser items
     */
    filterBrowserItems(listType) {
        if (listType === 'custom') {
            const searchValue = document.getElementById('customItemSearch')?.value.toLowerCase() || '';
            const filtered = (this.allCustomItems || []).filter(item => 
                item.name.toLowerCase().includes(searchValue) ||
                item.description.toLowerCase().includes(searchValue) ||
                (item.aliases || []).some(alias => alias.toLowerCase().includes(searchValue))
            );
            this.renderCustomItems(filtered);
        } else if (listType === 'builtin') {
            const searchValue = document.getElementById('builtInSearch')?.value.toLowerCase() || '';
            const showHiddenOnly = document.getElementById('showHiddenOnly')?.checked || false;
            
            const filtered = (this.allBuiltInItems || []).filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchValue) ||
                    item.description.toLowerCase().includes(searchValue) ||
                    (item.aliases || []).some(alias => alias.toLowerCase().includes(searchValue));
                
                const matchesFilter = !showHiddenOnly || item.isHidden;
                
                return matchesSearch && matchesFilter;
            });
            this.renderBuiltInItems(filtered);
        }
    }

    /**
     * Show add custom item dialog
     */
    async showAddCustomItemDialog(itemData = null) {
        const type = this.currentBrowserType;
        const typeInfo = this.getBrowserTypeInfo(type);
        const isEdit = !!itemData;
        
        // Update modal title
        document.getElementById('customItemFormTitle').textContent = 
            isEdit ? `Edit ${typeInfo.singular}` : `Add Custom ${typeInfo.singular}`;
        
        // Update submit button
        document.getElementById('customItemFormSubmit').textContent = isEdit ? 'Update' : 'Create';
        document.getElementById('customItemFormSubmit').onclick = () => this.handleCustomItemFormSubmit(isEdit, itemData?.id);
        
        // Get category suggestions
        const categorySuggestions = this.getCategorySuggestions(type);
        const exampleSuggestions = this.getExampleSuggestions(type);
        
        // Render enhanced form with tabs
        document.getElementById('customItemForm').innerHTML = `
            <!-- Tab Navigation -->
            <div class="custom-item-tabs">
                <button type="button" class="tab-btn active" data-tab="basic">
                    <i class="fas fa-info-circle"></i> Basic Info
                </button>
                <button type="button" class="tab-btn" data-tab="attributes">
                    <i class="fas fa-sliders-h"></i> Attributes
                </button>
                <button type="button" class="tab-btn" data-tab="examples">
                    <i class="fas fa-code"></i> Examples & Tags
                </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Basic Info Tab -->
                <div class="tab-pane active" id="tab-basic">
                    <div class="form-section">
                        <div class="form-group">
                            <label>Name *</label>
                            <input type="text" id="customItemName" class="form-input" 
                                   placeholder="Enter ${typeInfo.singular.toLowerCase()} name" 
                                   value="${itemData ? this.escapeHtml(itemData.name) : ''}" required>
                        </div>

                        <div class="form-group">
                            <label>Item ID</label>
                            <div class="input-with-btn">
                                <input type="text" id="customItemId" class="form-input" 
                                       placeholder="Auto-generated from name" 
                                       value="${itemData ? this.escapeHtml(itemData[typeInfo.idColumn] || '') : ''}">
                                <button type="button" class="btn btn-sm btn-secondary" id="btnGenerateId">
                                    Generate
                                </button>
                            </div>
                            <small class="form-hint">Lowercase alphanumeric ID used for referencing</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Category *</label>
                            <div class="category-input-wrapper">
                                <input type="text" id="customItemCategory" class="form-input" 
                                       placeholder="Select or enter category" 
                                       value="${itemData ? this.escapeHtml(itemData.category) : ''}" 
                                       list="categorySuggestions" required>
                                <datalist id="categorySuggestions">
                                    ${categorySuggestions.map(c => `<option value="${c}">`).join('')}
                                </datalist>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Description *</label>
                            <textarea id="customItemDescription" class="form-textarea" rows="3" 
                                      placeholder="Describe what this ${typeInfo.singular.toLowerCase()} does" required>${itemData ? this.escapeHtml(itemData.description) : ''}</textarea>
                        </div>

                        <!-- Item-Level Aliases -->
                        <div class="form-group" style="margin-top: 2rem;">
                            <label>Item Aliases</label>
                            <p class="section-description">Alternative names for this ${typeInfo.singular.toLowerCase()}</p>
                            
                            <div class="alias-tags" id="itemAliasTags">
                                <!-- Item alias tags will be added here -->
                            </div>
                            <div class="input-with-btn">
                                <input type="text" id="itemAliasInput" class="form-input" 
                                       placeholder="Add alias (e.g., RLNT, quickdmg)">
                                <button type="button" class="btn btn-sm btn-secondary" id="btnAddItemAlias">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Attributes Tab -->
                <div class="tab-pane" id="tab-attributes">
                    <div class="form-section">
                        <p class="section-description">Define attributes with aliases and default values</p>
                        <div id="attributeBuilderContainer"></div>
                    </div>
                </div>

                <!-- Examples & Tags Tab -->
                <div class="tab-pane" id="tab-examples">
                    <!-- Examples Section -->
                    <div class="form-section">
                        <h3>Examples</h3>
                        <p class="section-description">Usage examples for documentation</p>
                        
                        <div class="form-group">
                            <div class="examples-suggestions">
                                ${exampleSuggestions.map(ex => `
                                    <button type="button" class="suggestion-tag" data-example="${this.escapeHtml(ex)}">
                                        ${this.escapeHtml(ex)}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="examples-list" id="examplesList">
                                <!-- Examples will be added here -->
                            </div>
                            <div class="input-with-btn">
                                <textarea id="exampleInput" class="form-textarea" rows="2" 
                                          placeholder="Type example usage..."></textarea>
                                <button type="button" class="btn btn-sm btn-secondary" id="btnAddExample">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Tags Section -->
                    <div class="form-section">
                        <h3>Tags</h3>
                        <p class="section-description">Tags for categorization and search</p>
                        
                        <div class="form-group">
                            <div class="tag-container" id="tagContainer">
                                <!-- Tags will be added here -->
                            </div>
                            <div class="input-with-btn">
                                <input type="text" id="tagInput" class="form-input" 
                                       placeholder="Add tag">
                                <button type="button" class="btn btn-sm btn-secondary" id="btnAddTag">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize attribute builder
        this.currentAttributeBuilder = new AttributeBuilder();
        if (itemData && itemData.attributes) {
            this.currentAttributeBuilder.fromJSON(itemData.attributes);
        }
        const attrContainer = document.getElementById('attributeBuilderContainer');
        this.currentAttributeBuilder.render(attrContainer);
        
        // Initialize item aliases
        this.currentItemAliases = itemData?.item_aliases || itemData?.aliases || [];
        this.renderItemAliases();
        
        // Initialize examples
        this.currentExamples = itemData?.examples || [];
        this.renderExamples();
        
        // Initialize tags
        this.currentTags = itemData?.tags || [];
        this.renderTags();
        
        // Set up event listeners
        this.setupCustomItemFormEvents();
        
        // Show modal
        const overlay = document.getElementById('customItemFormOverlay');
        overlay.style.display = 'flex';
        
        // Set up close handlers
        const closeModal = () => {
            overlay.style.display = 'none';
            this.currentAttributeBuilder = null;
            this.currentItemAliases = [];
            this.currentExamples = [];
            this.currentTags = [];
        };
        
        document.getElementById('customItemFormClose').onclick = closeModal;
        document.getElementById('customItemFormCancel').onclick = closeModal;
        
        // Prevent modal close when selecting text and dragging outside
        let mouseDownInsideModal = false;
        const modalContent = overlay.querySelector('.modal-content');
        
        modalContent.addEventListener('mousedown', () => {
            mouseDownInsideModal = true;
        });
        
        document.addEventListener('mouseup', () => {
            mouseDownInsideModal = false;
        });
        
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) {
                mouseDownInsideModal = false;
            }
        });
        
        // Close on overlay click (but not during text selection drag)
        overlay.onclick = (e) => {
            if (e.target === overlay && !mouseDownInsideModal) {
                closeModal();
            }
        };
    }

    /**
     * Set up event listeners for custom item form
     */
    setupCustomItemFormEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Remove active from all tabs and panes
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active to clicked tab and corresponding pane
                btn.classList.add('active');
                document.getElementById(`tab-${targetTab}`)?.classList.add('active');
            });
        });

        // Generate ID button
        document.getElementById('btnGenerateId')?.addEventListener('click', () => {
            const name = document.getElementById('customItemName')?.value;
            if (name) {
                document.getElementById('customItemId').value = this.generateItemId(name);
            }
        });

        // Item alias events
        document.getElementById('btnAddItemAlias')?.addEventListener('click', () => {
            const input = document.getElementById('itemAliasInput');
            if (input && input.value.trim()) {
                this.addItemAlias(input.value.trim());
                input.value = '';
            }
        });

        document.getElementById('itemAliasInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target;
                if (input.value.trim()) {
                    this.addItemAlias(input.value.trim());
                    input.value = '';
                }
            }
        });

        // Example events
        document.getElementById('btnAddExample')?.addEventListener('click', () => {
            const input = document.getElementById('exampleInput');
            if (input && input.value.trim()) {
                this.addExample(input.value.trim());
                input.value = '';
            }
        });

        document.getElementById('exampleInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                const input = e.target;
                if (input.value.trim()) {
                    this.addExample(input.value.trim());
                    input.value = '';
                }
            }
        });

        // Example suggestions
        document.querySelectorAll('.suggestion-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addExample(btn.dataset.example);
            });
        });

        // Tag events
        document.getElementById('btnAddTag')?.addEventListener('click', () => {
            const input = document.getElementById('tagInput');
            if (input && input.value.trim()) {
                this.addTag(input.value.trim());
                input.value = '';
            }
        });

        document.getElementById('tagInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target;
                if (input.value.trim()) {
                    this.addTag(input.value.trim());
                    input.value = '';
                }
            }
        });
    }

    /**
     * Add item alias
     */
    addItemAlias(alias) {
        if (!alias || this.currentItemAliases.includes(alias)) return;
        this.currentItemAliases.push(alias);
        this.renderItemAliases();
    }

    /**
     * Remove item alias
     */
    removeItemAlias(alias) {
        this.currentItemAliases = this.currentItemAliases.filter(a => a !== alias);
        this.renderItemAliases();
    }

    /**
     * Render item aliases
     */
    renderItemAliases() {
        const container = document.getElementById('itemAliasTags');
        if (!container) return;

        container.innerHTML = this.currentItemAliases.map(alias => `
            <span class="tag">
                ${this.escapeHtml(alias)}
                <button type="button" class="tag-remove" data-alias="${this.escapeHtml(alias)}">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');

        // Attach remove handlers
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeItemAlias(btn.dataset.alias);
            });
        });
    }

    /**
     * Add example
     */
    addExample(example) {
        if (!example || this.currentExamples.includes(example)) return;
        this.currentExamples.push(example);
        this.renderExamples();
    }

    /**
     * Remove example
     */
    removeExample(index) {
        this.currentExamples.splice(index, 1);
        this.renderExamples();
    }

    /**
     * Render examples
     */
    renderExamples() {
        const container = document.getElementById('examplesList');
        if (!container) return;

        container.innerHTML = this.currentExamples.map((example, index) => `
            <div class="example-item">
                <pre>${this.escapeHtml(example)}</pre>
                <button type="button" class="btn-icon btn-danger" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // Attach remove handlers
        container.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeExample(parseInt(btn.dataset.index));
            });
        });
    }

    /**
     * Add tag
     */
    addTag(tag) {
        if (!tag || this.currentTags.includes(tag)) return;
        this.currentTags.push(tag);
        this.renderTags();
    }

    /**
     * Remove tag
     */
    removeTag(tag) {
        this.currentTags = this.currentTags.filter(t => t !== tag);
        this.renderTags();
    }

    /**
     * Render tags
     */
    renderTags() {
        const container = document.getElementById('tagContainer');
        if (!container) return;

        container.innerHTML = this.currentTags.map(tag => `
            <span class="tag">
                ${this.escapeHtml(tag)}
                <button type="button" class="tag-remove" data-tag="${this.escapeHtml(tag)}">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');

        // Attach remove handlers
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeTag(btn.dataset.tag);
            });
        });
    }

    /**
     * Get category suggestions based on type
     */
    getCategorySuggestions(type) {
        const suggestions = {
            mechanics: ['DAMAGE', 'HEAL', 'MOVEMENT', 'EFFECTS', 'CONTROL', 'UTILITY', 'AURA', 'PROJECTILE'],
            conditions: ['ENTITY', 'LOCATION', 'WORLD', 'PLAYER', 'FACTION', 'SCORE', 'CUSTOM'],
            triggers: ['COMBAT', 'LIFECYCLE', 'PLAYER', 'TIMED', 'PROJECTILE', 'SPECIAL', 'COMMUNICATION', 'CUSTOM'],
            targeters: ['SINGLE_ENTITY', 'MULTI_ENTITY', 'LOCATION_SINGLE', 'LOCATION_MULTI', 'META_ENTITY', 'META_LOCATION', 'THREAT_TABLE', 'SPECIAL', 'CUSTOM']
        };
        return suggestions[type] || [];
    }

    /**
     * Get example suggestions based on type
     */
    getExampleSuggestions(type) {
        const suggestions = {
            mechanics: ['- mechanic{param=value} @Target', '- mechanic{param=value} @Self'],
            conditions: ['- condition{param=value} true', '- condition{param=value} false'],
            triggers: ['~onTimer:100', '~onSpawn', '~onDeath'],
            targeters: ['@targeter{param=value}', '@targeter{radius=10}']
        };
        return suggestions[type] || [];
    }

    /**
     * Get browser type info
     */
    getBrowserTypeInfo(type) {
        const info = {
            mechanics: { singular: 'Mechanic', plural: 'Mechanics', idColumn: 'mechanic_id' },
            conditions: { singular: 'Condition', plural: 'Conditions', idColumn: 'condition_id' },
            triggers: { singular: 'Trigger', plural: 'Triggers', idColumn: 'trigger_id' },
            targeters: { singular: 'Targeter', plural: 'Targeters', idColumn: 'targeter_id' }
        };
        return info[type] || { singular: 'Item', plural: 'Items', idColumn: 'id' };
    }

    /**
     * Handle custom item form submission
     */
    async handleCustomItemFormSubmit(isEdit = false, itemId = null) {
        try {
            // Gather form data
            const name = document.getElementById('customItemName')?.value.trim();
            const itemId = document.getElementById('customItemId')?.value.trim();
            const category = document.getElementById('customItemCategory')?.value.trim();
            const description = document.getElementById('customItemDescription')?.value.trim();

            // Validate required fields
            if (!name) {
                this.showError('Name is required');
                return;
            }
            if (!category) {
                this.showError('Category is required');
                return;
            }
            if (!description) {
                this.showError('Description is required');
                return;
            }

            // Get attributes from AttributeBuilder
            const attributes = this.currentAttributeBuilder ? this.currentAttributeBuilder.toJSON() : [];

            // Validate attributes
            if (this.currentAttributeBuilder) {
                const validation = this.currentAttributeBuilder.validate();
                if (!validation.isValid) {
                    this.showError(validation.errors.join('<br>'));
                    return;
                }
            }

            // Build item data
            const itemData = {
                name,
                itemId: itemId || this.generateItemId(name),
                itemAliases: this.currentItemAliases || [],
                category,
                description,
                attributes,
                examples: this.currentExamples || [],
                tags: this.currentTags || []
            };

            // Create or update
            let result;
            if (isEdit && itemId) {
                result = await this.browserAdminManager.updateCustomItem(this.currentBrowserType, itemId, itemData);
            } else {
                result = await this.browserAdminManager.createCustomItem(this.currentBrowserType, itemData);
            }

            if (result.success) {
                const typeInfo = this.getBrowserTypeInfo(this.currentBrowserType);
                this.showSuccess(`Custom ${typeInfo.singular.toLowerCase()} ${isEdit ? 'updated' : 'created'} successfully`);
                document.getElementById('customItemFormOverlay').style.display = 'none';
                await this.loadBrowserManagement();
            } else {
                this.showError(result.error || `Failed to ${isEdit ? 'update' : 'create'} custom item`);
            }

        } catch (error) {
            console.error('Error submitting custom item form:', error);
            this.showError('Failed to save custom item');
        }
    }

    /**
     * Edit custom item
     */
    async editCustomItem(id) {
        // Find item
        const item = (this.allCustomItems || []).find(i => i.id === id);
        if (!item) {
            this.showError('Item not found');
            return;
        }

        // Open dialog with item data
        await this.showAddCustomItemDialog(item);
    }

    /**
     * Edit built-in item (creates a custom override)
     */
    async editBuiltInItem(itemId) {
        // Find built-in item
        const item = (this.allBuiltInItems || []).find(i => {
            const id = this.getItemIdentifier(i, this.currentBrowserType);
            return id === itemId;
        });
        
        if (!item) {
            this.showError('Built-in item not found');
            return;
        }

        // Convert built-in item to custom item structure
        const customItemData = {
            name: item.name,
            itemAliases: item.aliases || [],
            category: item.category || 'Custom',
            description: item.description || '',
            attributes: item.attributes || [],
            examples: item.examples || [],
            tags: item.tags || [],
            overrides_builtin_id: itemId,
            isBuiltInEdit: true
        };

        // Open dialog with built-in item data
        await this.showAddCustomItemDialog(customItemData);
    }

    /**
     * Delete custom item with confirmation
     */
    async deleteCustomItem(id) {
        // Find item
        const item = (this.allCustomItems || []).find(i => i.id === id);
        if (!item) {
            this.showError('Item not found');
            return;
        }

        const typeInfo = this.getBrowserTypeInfo(this.currentBrowserType);
        
        // Show confirmation with modal
        const confirmed = await this.showConfirmation(
            `Delete ${typeInfo.singular}`,
            `Are you sure you want to permanently delete "${item.name}"?\n\nThis action cannot be undone and will remove all data associated with this ${typeInfo.singular.toLowerCase()}.`,
            { confirmText: 'Delete', confirmButtonClass: 'danger' }
        );
        
        if (!confirmed) {
            return;
        }

        try {
            const result = await this.browserAdminManager.deleteCustomItem(this.currentBrowserType, id);
            
            if (result.success) {
                this.showSuccess(`${typeInfo.singular} deleted successfully`);
                await this.loadBrowserManagement();
            } else {
                this.showError(result.error || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting custom item:', error);
            this.showError('Failed to delete item');
        }
    }

    /**
     * Hide built-in item
     */
    async hideBuiltInItem(itemId) {
        const typeInfo = this.getBrowserTypeInfo(this.currentBrowserType);
        const result = await this.browserAdminManager.hideBuiltIn(this.currentBrowserType, itemId);

        if (result.success) {
            this.showSuccess(`${typeInfo.singular} hidden successfully`);
            await this.loadBrowserManagement();
        } else {
            this.showError(result.error || 'Failed to hide item');
        }
    }

    /**
     * Show built-in item
     */
    async showBuiltInItem(itemId) {
        const typeInfo = this.getBrowserTypeInfo(this.currentBrowserType);
        const result = await this.browserAdminManager.showBuiltIn(this.currentBrowserType, itemId);

        if (result.success) {
            this.showSuccess(`${typeInfo.singular} restored successfully`);
            await this.loadBrowserManagement();
        } else {
            this.showError(result.error || 'Failed to restore item');
        }
    }

    /**
     * Add attribute row to builder
     */
    addAttributeRow(key = '', value = '') {
        const container = document.getElementById('attributesBuilder');
        if (!container) return;
        
        const rowId = `attr-${Date.now()}`;
        const row = document.createElement('div');
        row.className = 'attribute-row';
        row.id = rowId;
        row.innerHTML = `
            <input type="text" class="form-input attr-key" placeholder="Key" value="${this.escapeHtml(key)}">
            <input type="text" class="form-input attr-value" placeholder="Value" value="${this.escapeHtml(value)}">
            <button type="button" class="btn btn-sm btn-danger" onclick="window.adminPanel.removeAttributeRow('${rowId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(row);
    }

    /**
     * Remove attribute row
     */
    removeAttributeRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) row.remove();
    }

    /**
     * Add example tag
     */
    addExampleTag(example) {
        if (!example || this.currentExamples.includes(example)) return;
        
        this.currentExamples.push(example);
        this.renderExampleTags();
    }

    /**
     * Remove example tag
     */
    removeExampleTag(index) {
        this.currentExamples.splice(index, 1);
        this.renderExampleTags();
    }

    /**
     * Render example tags
     */
    renderExampleTags() {
        const container = document.getElementById('examplesTags');
        if (!container) return;
        
        container.innerHTML = this.currentExamples.map((ex, idx) => `
            <div class="example-tag">
                <span>${this.escapeHtml(ex)}</span>
                <button type="button" class="tag-remove" onclick="window.adminPanel.removeExampleTag(${idx})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * Get attribute templates for browser type
     */
    getAttributeTemplates(type) {
        const templates = {
            mechanics: [
                { name: 'Amount', key: 'amount', type: 'number', default: '1', desc: 'Numeric amount value' },
                { name: 'Duration', key: 'duration', type: 'number', default: '20', desc: 'Duration in ticks (20 = 1 second)' },
                { name: 'Repeat', key: 'repeat', type: 'number', default: '1', desc: 'Number of times to repeat' },
                { name: 'Repeat Interval', key: 'repeatInterval', type: 'number', default: '20', desc: 'Ticks between repeats' },
                { name: 'Delay', key: 'delay', type: 'number', default: '0', desc: 'Delay before execution in ticks' },
                { name: 'Async', key: 'async', type: 'boolean', default: 'true', desc: 'Run asynchronously' },
                { name: 'Force Sync', key: 'forceSync', type: 'boolean', default: 'false', desc: 'Force synchronous execution' },
                { name: 'Chance', key: 'chance', type: 'number', default: '1.0', desc: 'Chance to execute (0.0-1.0)' }
            ],
            conditions: [
                { name: 'Amount', key: 'amount', type: 'number', default: '1', desc: 'Numeric comparison value' },
                { name: 'Percent', key: 'percent', type: 'number', default: '100', desc: 'Percentage value' },
                { name: 'Mode', key: 'mode', type: 'text', default: 'EQUALS', desc: 'Comparison mode' },
                { name: 'Value', key: 'value', type: 'text', default: '', desc: 'Value to check' }
            ],
            triggers: [
                { name: 'Health', key: 'health', type: 'number', default: '50', desc: 'Health threshold' },
                { name: 'Chance', key: 'chance', type: 'number', default: '1.0', desc: 'Trigger chance (0.0-1.0)' },
                { name: 'Cooldown', key: 'cooldown', type: 'number', default: '20', desc: 'Cooldown in ticks' }
            ],
            targeters: [
                { name: 'Radius', key: 'radius', type: 'number', default: '10', desc: 'Search radius in blocks' },
                { name: 'Amount', key: 'amount', type: 'number', default: '1', desc: 'Number of targets' },
                { name: 'Sort', key: 'sort', type: 'text', default: 'NEAREST', desc: 'Sorting method' },
                { name: 'Max Distance', key: 'maxDistance', type: 'number', default: '32', desc: 'Maximum distance' }
            ]
        };
        return templates[type] || [];
    }

    /**
     * Get example suggestions for browser type
     */
    getExampleSuggestions(type) {
        const suggestions = {
            mechanics: [
                'damage{amount=10}',
                'message{m="<red>Hello!"}',
                'heal{amount=5}',
                'effect:particles{particle=flame;amount=10}',
                'sound{sound=ENTITY_PLAYER_LEVELUP;volume=1;pitch=1}',
                'teleport{location=0,100,0}',
                'setHealth{amount=20}'
            ],
            conditions: [
                'inblock{type=WATER}',
                'health{amount=>50}',
                'stance{stance=aggressive}',
                'time{time=day}',
                'distance{distance=<10}',
                'entitytype{type=PLAYER}'
            ],
            triggers: [
                'onAttack',
                'onDamaged',
                'onTimer:100',
                'onSpawn',
                'onDeath',
                'onInteract'
            ],
            targeters: [
                '@Self',
                '@Target',
                '@PlayersInRadius{r=10}',
                '@MobsInRadius{r=20;amount=5}',
                '@NearestPlayer{r=32}',
                '@ThreatTable'
            ]
        };
        return suggestions[type] || [];
    }

    /**
     * Helper functions
     */
    getStructureIcon(type) {
        const icons = {
            'single': '🎯',
            'multi-line': '📋',
            'multi-section': '📚'
        };
        return icons[type] || '📋';
    }

    getActivityIcon(action) {
        const icons = {
            'grant_role': 'fa-user-plus',
            'revoke_role': 'fa-user-minus',
            'create_official_template': 'fa-plus',
            'edit_official_template': 'fa-edit',
            'delete_official_template': 'fa-trash',
            'approve_template': 'fa-check'
        };
        return icons[action] || 'fa-circle';
    }

    formatAction(action) {
        return action.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get browser type information (icon, color, labels)
     */
    getBrowserTypeInfo(type) {
        const typeMap = {
            mechanics: {
                singular: 'Mechanic',
                plural: 'Mechanics',
                icon: '⚙️',
                color: '#4a9eff',
                description: 'Actions and effects that mobs can perform'
            },
            conditions: {
                singular: 'Condition',
                plural: 'Conditions',
                icon: '🔍',
                color: '#10b981',
                description: 'Requirements that must be met'
            },
            triggers: {
                singular: 'Trigger',
                plural: 'Triggers',
                icon: '⚡',
                color: '#f59e0b',
                description: 'Events that activate skills'
            },
            targeters: {
                singular: 'Targeter',
                plural: 'Targeters',
                icon: '🎯',
                color: '#ec4899',
                description: 'Define who or what is affected'
            }
        };
        
        return typeMap[type] || typeMap.mechanics;
    }

    /**
     * Get correct identifier property for item based on type
     * Different data types use different identifier properties:
     * - conditions: use 'id' (e.g., 'altitude', 'blocking')
     * - targeters: use 'id' (e.g., 'Self', 'Target')
     * - mechanics: use 'name' (e.g., 'damage', 'heal')
     * - triggers: use 'name' (e.g., 'onCombat', 'onDeath')
     */
    getItemIdentifier(item, type) {
        if (!item) return null;
        
        // Conditions and Targeters use 'id'
        if (type === 'conditions' || type === 'targeters') {
            return item.id || item.name;
        }
        
        // Mechanics and Triggers use 'name'
        return item.name || item.id;
    }

    showSuccess(message) {
        // Use notificationModal for consistent UI
        if (window.notificationModal) {
            window.notificationModal.alert(message, 'success');
        } else if (window.showNotification) {
            window.showNotification(message, 'success');
        }
    }

    showError(message) {
        // Use notificationModal for consistent UI
        if (window.notificationModal) {
            window.notificationModal.alert(message, 'error');
        } else if (window.showNotification) {
            window.showNotification(message, 'error');
        }
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {any} unsafe - The unsafe string to escape
     * @returns {string} - The escaped HTML string
     */
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Generate unique ID from name (lowercase, alphanumeric only)
     * @param {string} name - The name to convert to ID
     * @returns {string} - The generated ID
     */
    generateItemId(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 50);
    }

    /**
     * Validate item data before saving
     * @param {object} itemData - The item data to validate
     * @returns {object} - Validation result with isValid flag and errors array
     */
    validateItemData(itemData) {
        const errors = [];

        if (!itemData.name || itemData.name.trim() === '') {
            errors.push('Name is required');
        }

        if (!itemData.category || itemData.category.trim() === '') {
            errors.push('Category is required');
        }

        if (!itemData.description || itemData.description.trim() === '') {
            errors.push('Description is required');
        }

        // Validate attributes if present
        if (itemData.attributes && Array.isArray(itemData.attributes)) {
            itemData.attributes.forEach((attr, index) => {
                if (!attr.name || attr.name.trim() === '') {
                    errors.push(`Attribute at position ${index + 1} is missing a name`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
}
