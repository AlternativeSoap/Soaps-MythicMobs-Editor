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
        
        // ═══════════════════════════════════════════════════════════════════
        // PERFORMANCE OPTIMIZATIONS
        // ═══════════════════════════════════════════════════════════════════
        
        // Debounce timers for search inputs
        this._filterDebounceTimer = null;
        this._browserFilterTimer = null;
        this._renderPending = false;
        
        // Cached DOM elements (populated on first use)
        this._cachedElements = {};
        
        // Template render cache
        this._templateCardCache = new Map();
        this._lastFilterKey = null;
        
        // Batch operation tracking
        this._pendingDeletes = [];
        this._deleteDebounceTimer = null;
        
        // Multi-select state for bulk operations
        this._selectedTemplates = new Set();
        
        this.createModal();
        this.attachEventListeners();
    }
    
    /**
     * Get cached DOM element or query and cache it
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    _getElement(id) {
        if (!this._cachedElements[id]) {
            this._cachedElements[id] = document.getElementById(id);
        }
        return this._cachedElements[id];
    }
    
    /**
     * Clear element cache (call when modal is closed/reopened)
     */
    _clearElementCache() {
        this._cachedElements = {};
        this._templateCardCache.clear();
        this._lastFilterKey = null;
    }
    
    /**
     * Debounced filter with configurable delay
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in ms (default 150ms)
     */
    _debounce(fn, delay = 150) {
        clearTimeout(this._filterDebounceTimer);
        this._filterDebounceTimer = setTimeout(fn, delay);
    }
    
    /**
     * Schedule render on next animation frame for smooth updates
     * @param {Function} renderFn - Render function
     */
    _scheduleRender(renderFn) {
        if (this._renderPending) return;
        this._renderPending = true;
        requestAnimationFrame(() => {
            renderFn();
            this._renderPending = false;
        });
    }

    /**
     * Create admin panel modal
     */
    createModal() {
        // Prevent duplicate modal creation
        if (document.getElementById('adminPanelOverlay')) {
            console.log('[AdminPanel] Modal already exists, skipping creation');
            return;
        }

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
                            <i class="fas fa-users"></i>
                            <span>Users</span>
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
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-secondary" id="btnImportYAML" title="Import multiple templates from YAML files">
                                        <i class="fas fa-file-import"></i> Import from YAML
                                    </button>
                                    <button class="btn btn-primary" id="btnCreateOfficialTemplate">
                                        <i class="fas fa-plus"></i> Create Official Template
                                    </button>
                                </div>
                            </div>
                            
                            <div class="admin-templates-filters">
                                <input type="text" id="adminTemplateSearch" class="form-input" placeholder="Search templates...">
                                <select id="adminTemplateSourceFilter" class="form-select">
                                    <option value="all">All Templates</option>
                                    <option value="official">Official Only</option>
                                    <option value="user">User-Made Only</option>
                                </select>
                                <select id="adminTemplateTypeFilter" class="form-select">
                                    <option value="all">All Types</option>
                                    <option value="skill">Skill</option>
                                    <option value="mob">Mob</option>
                                </select>
                                <select id="adminTemplateStructureFilter" class="form-select">
                                    <option value="all">All Structures</option>
                                    <option value="single">Single</option>
                                    <option value="pack">Pack</option>
                                </select>
                                <select id="adminTemplateApprovalFilter" class="form-select">
                                    <option value="all">All Status</option>
                                    <option value="pending">⏳ Pending Approval</option>
                                    <option value="approved">✅ Approved</option>
                                    <option value="rejected">❌ Rejected</option>
                                </select>
                            </div>
                            
                            <!-- Bulk Action Bar -->
                            <div id="adminBulkActionBar" class="admin-bulk-action-bar" style="display: none;">
                                <div class="bulk-action-info">
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" id="adminSelectAllTemplates">
                                        <span class="checkmark"></span>
                                    </label>
                                    <span id="adminSelectedCount">0 selected</span>
                                </div>
                                <div class="bulk-actions">
                                    <button class="btn btn-sm btn-secondary" id="btnSelectAllVisible">
                                        <i class="fas fa-check-double"></i> Select All Visible
                                    </button>
                                    <button class="btn btn-sm btn-secondary" id="btnDeselectAll">
                                        <i class="fas fa-times"></i> Deselect All
                                    </button>
                                    <button class="btn btn-sm btn-danger" id="btnDeleteSelected">
                                        <i class="fas fa-trash"></i> Delete Selected
                                    </button>
                                </div>
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
                                    <h3><i class="fas fa-users"></i> Users</h3>
                                    <p>View all users and manage admin roles</p>
                                </div>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <select id="usersViewFilter" class="form-select" style="width: 180px;">
                                        <option value="all">👥 All Users</option>
                                        <option value="admins">👑 Admin Users</option>
                                    </select>
                                    <button class="btn btn-primary" id="btnGrantRole">
                                        <i class="fas fa-user-plus"></i> Grant Admin Role
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Users Stats Row -->
                            <div class="users-stats-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                                <div class="users-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;" id="statTotalUsers">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">Total Users</div>
                                </div>
                                <div class="users-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #f59e0b;" id="statAdminUsers">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">Admin Users</div>
                                </div>
                                <div class="users-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #10b981;" id="statNewUsers">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">New (7 days)</div>
                                </div>
                                <div class="users-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6;" id="statActiveUsers">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">Active Today</div>
                                </div>
                            </div>
                            
                            <!-- Search Bar -->
                            <div style="margin-bottom: 15px;">
                                <input type="text" id="usersSearchInput" class="form-input" placeholder="Search users by email or username..." style="width: 100%;">
                            </div>
                            
                            <div id="adminUsersList" class="admin-users-list"></div>
                        </div>
                        
                        <!-- Activity Tab -->
                        <div class="admin-tab-content" data-tab-content="activity">
                            <div class="admin-section-header">
                                <div>
                                    <h3><i class="fas fa-stream"></i> Activity Log</h3>
                                    <p>Real-time tracking of user and admin actions</p>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn btn-danger btn-sm" id="btnClearActivityLog" title="Clear all activity logs">
                                        <i class="fas fa-trash-alt"></i> Clear Logs
                                    </button>
                                    <button class="btn btn-secondary" id="btnRefreshActivity">
                                        <i class="fas fa-sync-alt"></i> Refresh
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Activity Stats Summary -->
                            <div class="activity-stats-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                                <div class="activity-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #10b981;" id="activityTodayCount">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">Today</div>
                                </div>
                                <div class="activity-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;" id="activityWeekCount">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">This Week</div>
                                </div>
                                <div class="activity-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #f59e0b;" id="activityUniqueUsers">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">Active Users</div>
                                </div>
                                <div class="activity-stat-card" style="background: var(--bg-secondary); padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6;" id="activityTotalCount">-</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">Total Logs</div>
                                </div>
                            </div>
                            
                            <!-- Activity Filters -->
                            <div class="activity-filters" style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                                <input type="text" id="activitySearchInput" class="form-input" placeholder="Search activities..." style="flex: 1; min-width: 200px;">
                                <select id="activityTypeFilter" class="form-select" style="width: 180px;">
                                    <option value="all">All Activity Types</option>
                                    <option value="login">🔐 Logins</option>
                                    <option value="template">📝 Templates</option>
                                    <option value="pack">📦 Packs</option>
                                    <option value="mob">💀 Mobs</option>
                                    <option value="skill">✨ Skills</option>
                                    <option value="export">📤 Exports</option>
                                    <option value="admin">👑 Admin Actions</option>
                                </select>
                                <select id="activityTimeFilter" class="form-select" style="width: 150px;">
                                    <option value="all">All Time</option>
                                    <option value="1h">Last Hour</option>
                                    <option value="24h">Last 24 Hours</option>
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d">Last 30 Days</option>
                                </select>
                            </div>
                            
                            <div id="adminActivityList" class="admin-activity-list" style="max-height: 500px; overflow-y: auto;"></div>
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
        
        // Import from YAML button
        document.getElementById('btnImportYAML')?.addEventListener('click', () => {
            if (!window.templateImportWizard) {
                window.templateImportWizard = new TemplateImportWizard();
            }
            window.templateImportWizard.open();
        });
        
        // Grant role button
        document.getElementById('btnGrantRole')?.addEventListener('click', () => {
            this.showGrantRoleDialog();
        });
        
        // Refresh activity
        document.getElementById('btnRefreshActivity')?.addEventListener('click', () => {
            this.loadActivityLog();
        });
        
        // Clear activity logs
        document.getElementById('btnClearActivityLog')?.addEventListener('click', () => {
            this.clearActivityLogs();
        });
        
        // Activity search and filters
        document.getElementById('activitySearchInput')?.addEventListener('input', () => {
            this._debounce(() => this.loadActivityLog(), 300);
        });
        
        document.getElementById('activityTypeFilter')?.addEventListener('change', () => {
            this.loadActivityLog();
        });
        
        document.getElementById('activityTimeFilter')?.addEventListener('change', () => {
            this.loadActivityLog();
        });
        
        // ════════════════════════════════════════════════════════════════════════
        // EVENT DELEGATION for template cards - much more efficient than inline onclick
        // ════════════════════════════════════════════════════════════════════════
        document.getElementById('adminTemplatesList')?.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            
            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;
            const name = actionBtn.dataset.name;
            
            switch (action) {
                case 'preview':
                    this.previewTemplate(id);
                    break;
                case 'approve':
                    this.approveTemplate(id, name);
                    break;
                case 'reject':
                    this.rejectTemplate(id, name);
                    break;
                case 'edit':
                    this.editTemplate(id);
                    break;
                case 'delete':
                    this.deleteTemplate(id, name);
                    break;
            }
        });
        
        // Search and filters - WITH DEBOUNCING FOR PERFORMANCE
        document.getElementById('adminTemplateSearch')?.addEventListener('input', (e) => {
            // Debounce search input to avoid excessive filtering on each keystroke
            this._debounce(() => this.filterTemplates(), 200);
        });
        
        document.getElementById('adminTemplateSourceFilter')?.addEventListener('change', () => {
            this.loadTemplates(); // Reload templates based on source filter
        });
        
        document.getElementById('adminTemplateTypeFilter')?.addEventListener('change', () => {
            // Small debounce for filter changes
            this._debounce(() => this.filterTemplates(), 50);
        });
        
        document.getElementById('adminTemplateStructureFilter')?.addEventListener('change', () => {
            this._debounce(() => this.filterTemplates(), 50);
        });

        document.getElementById('adminTemplateApprovalFilter')?.addEventListener('change', () => {
            this._debounce(() => this.filterTemplates(), 50);
        });

        // ════════════════════════════════════════════════════════════════════════
        // BULK ACTION EVENTS - Multi-select for template management
        // ════════════════════════════════════════════════════════════════════════
        
        // Checkbox in template cards (delegated event)
        document.getElementById('adminTemplatesList')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('template-select-checkbox')) {
                const templateId = e.target.dataset.templateId;
                this.toggleTemplateSelection(templateId, e.target.checked);
            }
        });
        
        // Select all checkbox in bulk action bar
        document.getElementById('adminSelectAllTemplates')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectAllVisibleTemplates();
            } else {
                this.deselectAllTemplates();
            }
        });
        
        // Select all visible button
        document.getElementById('btnSelectAllVisible')?.addEventListener('click', () => {
            this.selectAllVisibleTemplates();
        });
        
        // Deselect all button
        document.getElementById('btnDeselectAll')?.addEventListener('click', () => {
            this.deselectAllTemplates();
        });
        
        // Delete selected button
        document.getElementById('btnDeleteSelected')?.addEventListener('click', () => {
            this.deleteSelectedTemplates();
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
            // Debounce browser search for performance
            clearTimeout(this._browserFilterTimer);
            this._browserFilterTimer = setTimeout(() => this.filterBrowserItems('custom'), 200);
        });

        document.getElementById('builtInSearch')?.addEventListener('input', () => {
            // Debounce browser search for performance
            clearTimeout(this._browserFilterTimer);
            this._browserFilterTimer = setTimeout(() => this.filterBrowserItems('builtin'), 200);
        });

        document.getElementById('showHiddenOnly')?.addEventListener('change', (e) => {
            this.showHiddenOnly = e.target.checked;
            this.filterBrowserItems('builtin');
        });

        // Users tab filter and search
        document.getElementById('usersViewFilter')?.addEventListener('change', () => {
            this.loadUsers();
        });
        
        document.getElementById('usersSearchInput')?.addEventListener('input', () => {
            this._debounce(() => this.filterUsersDisplay(), 300);
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
            this.loadUsers();
        } else if (tabName === 'activity') {
            this.loadActivityLog();
        }
    }

    /**
     * Load templates based on source filter
     */
    async loadTemplates() {
        try {
            const sourceFilter = document.getElementById('adminTemplateSourceFilter')?.value || 'all';
            const templates = await this.adminManager.getAllTemplates(sourceFilter);
            this.allTemplates = templates;
            this.renderTemplates(templates);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.showError('Failed to load templates');
        }
    }

    /**
     * Get approval status info
     */
    getApprovalStatusInfo(template) {
        const status = template.approval_status || 'approved'; // Default to approved for existing templates
        switch (status) {
            case 'pending':
                return { label: 'Pending', icon: '⏳', class: 'badge-warning', color: '#f59e0b' };
            case 'approved':
                return { label: 'Approved', icon: '✅', class: 'badge-success', color: '#10b981' };
            case 'rejected':
                return { label: 'Rejected', icon: '❌', class: 'badge-danger', color: '#ef4444' };
            default:
                return { label: 'Unknown', icon: '❓', class: 'badge-secondary', color: '#6b7280' };
        }
    }

    /**
     * Render templates grid - OPTIMIZED with document fragments and virtual rendering
     */
    renderTemplates(templates) {
        const container = this._getElement('adminTemplatesList');
        if (!container) return;

        // Clear selection state when re-rendering templates
        this._selectedTemplates.clear();
        this._updateBulkActionBar();

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

        const canApprove = this.adminManager.hasPermission('approve_template') || this.adminManager.hasPermission('templates.approve');
        const canReject = this.adminManager.hasPermission('approve_template') || this.adminManager.hasPermission('templates.reject');
        
        // PERFORMANCE: Use document fragment for batch DOM insertion
        const fragment = document.createDocumentFragment();
        const tempContainer = document.createElement('div');
        
        // PERFORMANCE: Build HTML in chunks for large lists
        const CHUNK_SIZE = 50;
        const totalTemplates = templates.length;
        
        // For lists under 100, render all at once
        if (totalTemplates <= 100) {
            tempContainer.innerHTML = templates.map(template => this._renderTemplateCard(template, canApprove, canReject)).join('');
            while (tempContainer.firstChild) {
                fragment.appendChild(tempContainer.firstChild);
            }
            container.innerHTML = '';
            container.appendChild(fragment);
        } else {
            // PERFORMANCE: Virtual rendering for large lists - show first 50, lazy load rest
            const initialTemplates = templates.slice(0, CHUNK_SIZE);
            tempContainer.innerHTML = initialTemplates.map(template => this._renderTemplateCard(template, canApprove, canReject)).join('');
            while (tempContainer.firstChild) {
                fragment.appendChild(tempContainer.firstChild);
            }
            container.innerHTML = '';
            container.appendChild(fragment);
            
            // Add "Load More" button if there are more templates
            if (totalTemplates > CHUNK_SIZE) {
                const loadMoreBtn = document.createElement('div');
                loadMoreBtn.className = 'load-more-container';
                loadMoreBtn.innerHTML = `
                    <button class="btn btn-secondary" id="loadMoreTemplatesBtn">
                        <i class="fas fa-plus-circle"></i> Load ${Math.min(CHUNK_SIZE, totalTemplates - CHUNK_SIZE)} more templates (${totalTemplates - CHUNK_SIZE} remaining)
                    </button>
                `;
                container.appendChild(loadMoreBtn);
                
                // Store remaining templates for lazy loading
                this._remainingTemplates = templates.slice(CHUNK_SIZE);
                this._canApprove = canApprove;
                this._canReject = canReject;
                
                loadMoreBtn.addEventListener('click', () => this._loadMoreTemplates());
            }
        }
    }
    
    /**
     * Load more templates (lazy loading for large lists)
     */
    _loadMoreTemplates() {
        if (!this._remainingTemplates || this._remainingTemplates.length === 0) return;
        
        const container = this._getElement('adminTemplatesList');
        const loadMoreContainer = container.querySelector('.load-more-container');
        
        const CHUNK_SIZE = 50;
        const nextBatch = this._remainingTemplates.splice(0, CHUNK_SIZE);
        
        const fragment = document.createDocumentFragment();
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = nextBatch.map(template => 
            this._renderTemplateCard(template, this._canApprove, this._canReject)
        ).join('');
        
        while (tempContainer.firstChild) {
            fragment.appendChild(tempContainer.firstChild);
        }
        
        // Insert before the load more button
        if (loadMoreContainer) {
            container.insertBefore(fragment, loadMoreContainer);
            
            // Update or remove the load more button
            if (this._remainingTemplates.length > 0) {
                loadMoreContainer.innerHTML = `
                    <button class="btn btn-secondary" id="loadMoreTemplatesBtn">
                        <i class="fas fa-plus-circle"></i> Load ${Math.min(CHUNK_SIZE, this._remainingTemplates.length)} more templates (${this._remainingTemplates.length} remaining)
                    </button>
                `;
            } else {
                loadMoreContainer.remove();
            }
        }
    }
    
    /**
     * Render a single template card - extracted for reuse
     */
    _renderTemplateCard(template, canApprove, canReject) {
        const statusInfo = this.getApprovalStatusInfo(template);
        const isPending = (template.approval_status || 'approved') === 'pending';
        const isRejected = (template.approval_status || 'approved') === 'rejected';
        const isOfficial = template.is_official;
        
        // Escape template name for onclick handlers
        const escapedName = template.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        // Check if this template is selected
        const isSelected = this._selectedTemplates.has(template.id);
        
        return `
        <div class="admin-template-card ${isPending ? 'template-pending' : ''} ${isRejected ? 'template-rejected' : ''} ${!isOfficial ? 'template-user' : ''} ${isSelected ? 'template-selected' : ''}" data-template-id="${template.id}">
            <div class="template-card-header">
                <div class="template-select-wrapper">
                    <label class="template-checkbox-label" title="Select for bulk action">
                        <input type="checkbox" class="template-select-checkbox" data-template-id="${template.id}" data-template-name="${escapedName}" ${isSelected ? 'checked' : ''}>
                        <span class="template-checkmark"></span>
                    </label>
                </div>
                <div class="template-title-section">
                    <h4>
                        <span class="template-icon">${this.getStructureIcon(template.structure_type)}</span>
                        ${template.name}
                        ${isOfficial ? '<span class="official-badge" title="Official Template">⭐</span>' : '<span class="user-badge" title="User Template">👤</span>'}
                    </h4>
                    <div class="template-meta">
                        <span class="badge badge-${template.type || 'skill'}">${(template.type || 'skill').toUpperCase()}</span>
                        <span class="badge">${template.structure_type || 'single'}</span>
                        ${template.category ? `<span class="badge">${template.category}</span>` : ''}
                        <span class="badge ${statusInfo.class}" style="background: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.label}</span>
                    </div>
                </div>
                <div class="template-actions">
                    <button class="btn btn-sm btn-info" data-action="preview" data-id="${template.id}" title="Preview YAML">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isPending && canApprove ? `
                        <button class="btn btn-sm btn-success" data-action="approve" data-id="${template.id}" data-name="${escapedName}" title="Approve Template">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    ${isPending && canReject ? `
                        <button class="btn btn-sm btn-warning" data-action="reject" data-id="${template.id}" data-name="${escapedName}" title="Reject Template">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${template.id}" title="Edit Template">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${template.id}" data-name="${escapedName}" title="Delete Template">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="template-card-body">
                <div class="template-info">
                    <div>
                        <small>CREATED BY:</small>
                        <span>${template.created_by_email || 'Unknown'}</span>
                    </div>
                    <div>
                        <small>APPROVED BY:</small>
                        <span>${template.approved_by_email || (isPending ? 'Pending' : 'System')}</span>
                    </div>
                    <div>
                        <small>APPROVED:</small>
                        <span>${isPending ? 'Awaiting approval' : (isRejected ? 'Rejected' : this.formatDate(template.approved_at))}</span>
                    </div>
                </div>
                ${template.rejection_reason ? `
                    <div class="rejection-reason" style="margin-top: 10px; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 4px; border-left: 3px solid #ef4444;">
                        <small style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Rejection reason:</small>
                        <p style="margin: 5px 0 0 0; font-size: 13px;">${template.rejection_reason}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    }

    /**
     * Filter templates - OPTIMIZED with cached elements and early exit
     */
    filterTemplates() {
        if (!this.allTemplates) return;

        // Use cached element references instead of querying DOM each time
        const searchTerm = (this._getElement('adminTemplateSearch')?.value || '').toLowerCase();
        const typeFilter = this._getElement('adminTemplateTypeFilter')?.value || 'all';
        const structureFilter = this._getElement('adminTemplateStructureFilter')?.value || 'all';
        const approvalFilter = this._getElement('adminTemplateApprovalFilter')?.value || 'all';
        
        // Generate cache key to skip re-filtering if nothing changed
        const filterKey = `${searchTerm}|${typeFilter}|${structureFilter}|${approvalFilter}`;
        if (filterKey === this._lastFilterKey) return;
        this._lastFilterKey = filterKey;
        
        // Pre-compute filter conditions for faster iteration
        const hasSearch = searchTerm.length > 0;
        const filterByType = typeFilter !== 'all';
        const filterByStructure = structureFilter !== 'all';
        const filterByApproval = approvalFilter !== 'all';
        
        // Fast path: no filters active
        if (!hasSearch && !filterByType && !filterByStructure && !filterByApproval) {
            this._scheduleRender(() => this.renderTemplates(this.allTemplates));
            return;
        }

        const filtered = this.allTemplates.filter(template => {
            // Early exit on first failed condition (most selective first)
            if (filterByType && template.type !== typeFilter) return false;
            if (filterByStructure && template.structure_type !== structureFilter) return false;
            
            const templateStatus = template.approval_status || 'approved';
            if (filterByApproval && templateStatus !== approvalFilter) return false;
            
            if (hasSearch) {
                const name = template.name.toLowerCase();
                const category = template.category?.toLowerCase() || '';
                if (!name.includes(searchTerm) && !category.includes(searchTerm)) return false;
            }
            
            return true;
        });

        // Schedule render on next frame for smoother UI
        this._scheduleRender(() => this.renderTemplates(filtered));
    }

    /**
     * Approve a pending template
     */
    async approveTemplate(templateId, templateName) {
        if (!this.adminManager.hasPermission('approve_template') && !this.adminManager.hasPermission('templates.approve')) {
            window.notificationModal?.alert(
                'You do not have permission to approve templates.',
                'error',
                'Permission Denied'
            );
            return;
        }

        const confirmed = await window.notificationModal?.confirm(
            `Are you sure you want to approve "${templateName}"? This will make it available to all users.`,
            'Approve Template'
        );

        if (!confirmed) return;

        try {
            const user = await this.authManager.getCurrentUser();
            
            // Get the template to find owner_id
            const { data: template, error: fetchError } = await this.adminManager.supabase
                .from('templates')
                .select('owner_id')
                .eq('id', templateId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Update template status
            const { error } = await this.adminManager.supabase
                .from('templates')
                .update({
                    approval_status: 'approved',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString(),
                    rejection_reason: null
                })
                .eq('id', templateId);

            if (error) throw error;
            
            // Send notification to template owner
            await this.sendUserNotification(template.owner_id, {
                type: 'template_approved',
                title: 'Template Approved! 🎉',
                message: `Your template "${templateName}" has been approved and is now available to all users.`,
                data: { templateId, templateName }
            });

            window.notificationModal?.alert(
                `Template "${templateName}" has been approved successfully!`,
                'success',
                'Template Approved'
            );

            // Log activity
            await this.adminManager.logActivity('approve_template', { templateId, templateName });

            // Refresh templates list
            await this.loadTemplates();
        } catch (error) {
            console.error('Error approving template:', error);
            window.notificationModal?.alert(
                'Failed to approve template. Please try again.',
                'error',
                'Error'
            );
        }
    }

    /**
     * Reject a pending template
     */
    async rejectTemplate(templateId, templateName) {
        if (!this.adminManager.hasPermission('approve_template') && !this.adminManager.hasPermission('templates.reject')) {
            window.notificationModal?.alert(
                'You do not have permission to reject templates.',
                'error',
                'Permission Denied'
            );
            return;
        }

        // Prompt for rejection reason
        const reason = await window.notificationModal?.prompt(
            `Please provide a reason for rejecting "${templateName}":`,
            'Reject Template',
            'Enter rejection reason...'
        );

        if (reason === null) return; // User cancelled

        try {
            const user = await this.authManager.getCurrentUser();
            
            // Get the template to find owner_id
            const { data: template, error: fetchError } = await this.adminManager.supabase
                .from('templates')
                .select('owner_id')
                .eq('id', templateId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Update template status
            const { error } = await this.adminManager.supabase
                .from('templates')
                .update({
                    approval_status: 'rejected',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString(),
                    rejection_reason: reason || 'No reason provided'
                })
                .eq('id', templateId);

            if (error) throw error;
            
            // Send notification to template owner
            await this.sendUserNotification(template.owner_id, {
                type: 'template_rejected',
                title: 'Template Needs Changes',
                message: `Your template "${templateName}" was not approved. Reason: ${reason || 'No reason provided'}`,
                data: { templateId, templateName, rejectionReason: reason }
            });

            window.notificationModal?.alert(
                `Template "${templateName}" has been rejected.`,
                'warning',
                'Template Rejected'
            );

            // Log activity
            await this.adminManager.logActivity('reject_template', { templateId, templateName, reason });

            // Refresh templates list
            await this.loadTemplates();
        } catch (error) {
            console.error('Error rejecting template:', error);
            window.notificationModal?.alert(
                'Failed to reject template. Please try again.',
                'error',
                'Error'
            );
        }
    }
    
    /**
     * Send a notification to a user
     */
    async sendUserNotification(userId, notification) {
        if (!this.adminManager.supabase) return;
        
        try {
            await this.adminManager.supabase
                .from('user_notifications')
                .insert({
                    user_id: userId,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data || {},
                    read: false
                });
        } catch (error) {
            console.error('Failed to send user notification:', error);
            // Don't throw - notification failure shouldn't block the main action
        }
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

        // Hide admin panel temporarily (don't fully close)
        document.getElementById('adminPanelOverlay').style.display = 'none';

        // Open template wizard in admin mode with callback to re-open admin panel
        if (window.templateWizard) {
            const reopenAdminPanel = () => {
                document.getElementById('adminPanelOverlay').style.display = 'flex';
                this.loadTemplates(); // Refresh templates list
            };
            window.templateWizard.open(null, true, reopenAdminPanel); // true = admin mode, reopenAdminPanel = onClose callback
        } else {
            console.error('❌ Template wizard not available');
            // Re-open admin panel on error
            document.getElementById('adminPanelOverlay').style.display = 'flex';
            window.notificationModal?.alert(
                'The Template Wizard component is not available. Please refresh the page.',
                'error',
                'Component Not Available'
            );
        }
    }

    /**
     * Preview template YAML without editing
     */
    async previewTemplate(templateId) {
        try {
            const template = await this.templateManager.getTemplateById(templateId);
            if (!template) {
                window.notificationModal?.alert(
                    'The requested template could not be found.',
                    'error',
                    'Template Not Found'
                );
                return;
            }

            // Use the existing YAML preview modal
            if (window.yamlPreviewModal) {
                window.yamlPreviewModal.open(template);
            } else {
                // Fallback: Show basic alert with template info
                window.notificationModal?.alert(
                    `Template: ${template.name}\nType: ${template.type}\nSections: ${template.sections?.length || 0}`,
                    'info',
                    'Template Preview'
                );
            }
        } catch (error) {
            console.error('Error loading template for preview:', error);
            window.notificationModal?.alert(
                'Failed to load the template for preview. Please try again.',
                'error',
                'Preview Failed'
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
            const template = await this.templateManager.getTemplateById(templateId);
            if (!template) {
                window.notificationModal?.alert(
                    'The requested template could not be found.',
                    'error',
                    'Template Not Found'
                );
                return;
            }

            // Hide admin panel temporarily
            document.getElementById('adminPanelOverlay').style.display = 'none';
            
            // Set up callback to re-open admin panel when editor closes
            const reopenAdminPanel = () => {
                document.getElementById('adminPanelOverlay').style.display = 'flex';
                this.loadTemplates(); // Refresh templates list
            };
            
            // Store callback on template editor
            if (window.templateEditor) {
                window.templateEditor.onCloseCallback = reopenAdminPanel;
            }
            
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

    // ════════════════════════════════════════════════════════════════════════════
    // BULK SELECTION METHODS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Toggle template selection
     */
    toggleTemplateSelection(templateId, isSelected) {
        if (isSelected) {
            this._selectedTemplates.add(templateId);
        } else {
            this._selectedTemplates.delete(templateId);
        }
        
        // Update card visual state
        const card = document.querySelector(`.admin-template-card[data-template-id="${templateId}"]`);
        if (card) {
            card.classList.toggle('template-selected', isSelected);
        }
        
        this._updateBulkActionBar();
    }

    /**
     * Select all visible templates
     */
    selectAllVisibleTemplates() {
        const container = document.getElementById('adminTemplatesList');
        const checkboxes = container.querySelectorAll('.template-select-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const templateId = checkbox.dataset.templateId;
            this._selectedTemplates.add(templateId);
            
            const card = checkbox.closest('.admin-template-card');
            if (card) {
                card.classList.add('template-selected');
            }
        });
        
        this._updateBulkActionBar();
    }

    /**
     * Deselect all templates
     */
    deselectAllTemplates() {
        const container = document.getElementById('adminTemplatesList');
        const checkboxes = container.querySelectorAll('.template-select-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const card = checkbox.closest('.admin-template-card');
            if (card) {
                card.classList.remove('template-selected');
            }
        });
        
        this._selectedTemplates.clear();
        this._updateBulkActionBar();
    }

    /**
     * Update bulk action bar visibility and selected count
     */
    _updateBulkActionBar() {
        const bulkBar = document.getElementById('adminBulkActionBar');
        const selectedCount = document.getElementById('adminSelectedCount');
        const selectAllCheckbox = document.getElementById('adminSelectAllTemplates');
        
        if (!bulkBar) return;
        
        const count = this._selectedTemplates.size;
        
        // Show/hide bulk action bar
        bulkBar.style.display = count > 0 ? 'flex' : 'none';
        
        // Update selected count text
        if (selectedCount) {
            selectedCount.textContent = `${count} selected`;
        }
        
        // Update select all checkbox state
        if (selectAllCheckbox) {
            const totalVisible = document.querySelectorAll('.template-select-checkbox').length;
            selectAllCheckbox.checked = count > 0 && count === totalVisible;
            selectAllCheckbox.indeterminate = count > 0 && count < totalVisible;
        }
    }

    /**
     * Delete all selected templates
     */
    async deleteSelectedTemplates() {
        if (!this.adminManager.hasPermission('delete_official_template')) {
            window.notificationModal?.alert(
                'You do not have permission to delete official templates.',
                'error',
                'Permission Denied'
            );
            return;
        }
        
        const count = this._selectedTemplates.size;
        if (count === 0) {
            window.notificationModal?.alert('No templates selected.', 'warning', 'No Selection');
            return;
        }
        
        // Get template names for confirmation
        const templateNames = [];
        this._selectedTemplates.forEach(id => {
            const checkbox = document.querySelector(`.template-select-checkbox[data-template-id="${id}"]`);
            if (checkbox) {
                templateNames.push(checkbox.dataset.templateName || id);
            }
        });
        
        // Build confirmation message
        let confirmMessage = `Are you sure you want to delete ${count} template${count > 1 ? 's' : ''}?\n\n`;
        if (count <= 10) {
            confirmMessage += 'Templates to delete:\n• ' + templateNames.join('\n• ');
        } else {
            confirmMessage += `First 10 templates:\n• ${templateNames.slice(0, 10).join('\n• ')}\n... and ${count - 10} more`;
        }
        confirmMessage += '\n\nThis action cannot be undone.';
        
        const confirmed = await window.notificationModal?.confirm(
            confirmMessage,
            `Delete ${count} Template${count > 1 ? 's' : ''}?`,
            { confirmText: `Delete ${count} Templates`, confirmButtonClass: 'danger' }
        );
        
        if (!confirmed) {
            return;
        }
        
        // Show progress
        window.notificationModal?.alert(
            `Deleting ${count} templates...`,
            'info',
            'Deleting'
        );
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Delete templates one by one
        for (const templateId of this._selectedTemplates) {
            try {
                await this.templateManager.deleteTemplate(templateId);
                await this.adminManager.logActivity('delete_official_template', 'template', templateId, {
                    bulk_delete: true,
                    batch_size: count
                });
                successCount++;
            } catch (error) {
                console.error(`Error deleting template ${templateId}:`, error);
                errorCount++;
                errors.push(templateId);
            }
        }
        
        // Clear selection
        this._selectedTemplates.clear();
        
        // Show result
        if (errorCount === 0) {
            this.showSuccess(`Successfully deleted ${successCount} template${successCount > 1 ? 's' : ''}`);
        } else {
            window.notificationModal?.alert(
                `Deleted ${successCount} templates.\nFailed to delete ${errorCount} templates.`,
                'warning',
                'Partial Success'
            );
        }
        
        // Reload templates list
        await this.loadTemplates();
    }

    /**
     * Load users based on filter (all users or admin users only)
     */
    async loadUsers() {
        if (!this.adminManager.hasPermission('*')) {
            document.getElementById('adminUsersList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>Super Admin access required</p>
                </div>
            `;
            return;
        }

        const filter = document.getElementById('usersViewFilter')?.value || 'all';
        
        try {
            // Load stats
            await this.loadUsersStats();
            
            if (filter === 'admins') {
                const admins = await this.adminManager.getAllAdmins();
                this._allUsersData = admins.map(a => ({ ...a, isAdmin: true }));
                this.renderAdminUsers(admins);
            } else {
                await this.loadAllUsers();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        }
    }

    /**
     * Load user statistics
     */
    async loadUsersStats() {
        if (!window.supabaseClient) return;
        
        try {
            // Total users
            const { count: totalUsers } = await window.supabaseClient
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });
            
            // Admin users count
            const { data: adminData } = await window.supabaseClient
                .from('admin_roles')
                .select('user_id');
            const uniqueAdmins = new Set(adminData?.map(a => a.user_id) || []).size;
            
            // New users in last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: newUsers } = await window.supabaseClient
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', weekAgo.toISOString());
            
            // Active today (from sessions)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: activeToday } = await window.supabaseClient
                .from('user_sessions')
                .select('user_id', { count: 'exact', head: true })
                .gte('last_seen', today.toISOString());
            
            // Update UI
            document.getElementById('statTotalUsers').textContent = this.formatNumber(totalUsers || 0);
            document.getElementById('statAdminUsers').textContent = this.formatNumber(uniqueAdmins || 0);
            document.getElementById('statNewUsers').textContent = this.formatNumber(newUsers || 0);
            document.getElementById('statActiveUsers').textContent = this.formatNumber(activeToday || 0);
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    /**
     * Load all users from user_profiles
     */
    async loadAllUsers() {
        if (!window.supabaseClient) return;
        
        const container = document.getElementById('adminUsersList');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';
        
        try {
            // Get all users
            const { data: users, error } = await window.supabaseClient
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Get admin roles
            const { data: adminRoles } = await window.supabaseClient
                .from('admin_roles')
                .select('user_id, role');
            
            // Create a map of user_id to roles
            const adminMap = {};
            adminRoles?.forEach(ar => {
                if (!adminMap[ar.user_id]) adminMap[ar.user_id] = [];
                adminMap[ar.user_id].push(ar.role);
            });
            
            // Combine data
            this._allUsersData = users.map(user => ({
                ...user,
                id: user.user_id, // Normalize to 'id' for consistency
                isAdmin: !!adminMap[user.user_id],
                adminRoles: adminMap[user.user_id] || []
            }));
            
            this.renderAllUsers(this._allUsersData);
        } catch (error) {
            console.error('Error loading all users:', error);
            container.innerHTML = '<div class="empty-state"><p>Failed to load users</p></div>';
        }
    }

    /**
     * Render all users list
     */
    renderAllUsers(users) {
        const container = document.getElementById('adminUsersList');
        if (!container) return;
        
        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>No users found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = users.map(user => {
            const isAdmin = user.isAdmin;
            const highestRole = user.adminRoles?.[0];
            const roleInfo = highestRole ? this.adminManager.getRoleInfo(highestRole) : null;
            const createdDate = new Date(user.created_at);
            const isNewUser = (Date.now() - createdDate.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days
            const displayName = user.display_name || user.email?.split('@')[0] || 'Unknown';
            
            return `
                <div class="admin-user-card ${isAdmin ? 'is-admin' : ''}" data-user-id="${user.id}">
                    <div class="admin-user-info">
                        <div class="admin-user-avatar" style="${isAdmin ? `background: ${roleInfo?.color || '#8b5cf6'}22; color: ${roleInfo?.color || '#8b5cf6'};` : ''}">
                            ${isAdmin ? (roleInfo?.icon || '👤') : '<i class="fas fa-user"></i>'}
                        </div>
                        <div>
                            <h4>${displayName}</h4>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${user.email || ''}</div>
                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                ${isAdmin ? `
                                    <span class="admin-role-badge" style="background: ${roleInfo?.color || '#8b5cf6'}22; color: ${roleInfo?.color || '#8b5cf6'};">
                                        ${roleInfo?.label || highestRole}
                                    </span>
                                ` : `
                                    <span class="user-badge" style="background: var(--bg-tertiary); color: var(--text-secondary); padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                                        <i class="fas fa-user"></i> User
                                    </span>
                                `}
                                ${isNewUser ? `
                                    <span class="new-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                                        <i class="fas fa-sparkles"></i> New
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="admin-user-meta">
                        <div><small>User ID:</small> <code style="font-size: 10px; opacity: 0.7;">${user.id.substring(0, 8)}...</code></div>
                        <div><small>Joined:</small> ${this.formatDate(user.created_at)}</div>
                    </div>
                    <div class="user-actions" style="display: flex; gap: 8px;">
                        ${isAdmin ? `
                            <button class="btn btn-sm btn-danger" onclick="window.adminPanel.revokeRole('${user.id}', '${highestRole}', '${user.email}')" title="Revoke admin role">
                                <i class="fas fa-user-minus"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-secondary" onclick="window.adminPanel.quickGrantRole('${user.id}', '${user.email}')" title="Grant admin role">
                                <i class="fas fa-user-shield"></i>
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Filter users display based on search
     */
    filterUsersDisplay() {
        const searchTerm = document.getElementById('usersSearchInput')?.value?.toLowerCase() || '';
        
        if (!this._allUsersData) return;
        
        const filtered = this._allUsersData.filter(user => {
            const email = (user.email || '').toLowerCase();
            const displayName = (user.display_name || '').toLowerCase();
            const id = (user.id || '').toLowerCase();
            return email.includes(searchTerm) || displayName.includes(searchTerm) || id.includes(searchTerm);
        });
        
        const filter = document.getElementById('usersViewFilter')?.value || 'all';
        if (filter === 'admins') {
            this.renderAdminUsers(filtered.filter(u => u.isAdmin));
        } else {
            this.renderAllUsers(filtered);
        }
    }

    /**
     * Quick grant role to a user
     */
    async quickGrantRole(userId, email) {
        const role = await window.editor?.showPrompt('Grant Admin Role', `Grant role to ${email}:\n(super_admin, template_admin, moderator)`);
        if (!role || !this.adminManager.ROLES[role]) {
            if (role) {
                window.notificationModal?.alert(
                    'Invalid role. Valid roles: super_admin, template_admin, moderator',
                    'error',
                    'Invalid Role'
                );
            }
            return;
        }
        
        try {
            await this.adminManager.grantRoleById(userId, role);
            this.showSuccess(`Granted ${role} to ${email}`);
            await this.loadUsers();
        } catch (error) {
            console.error('Error granting role:', error);
            this.showError(error.message || 'Failed to grant role');
        }
    }

    /**
     * Load admin users (legacy - now calls loadUsers)
     */
    async loadAdminUsers() {
        document.getElementById('usersViewFilter').value = 'admins';
        await this.loadUsers();
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
            await this.loadUsers();
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
            await this.loadUsers();
            await this.loadAdminUsers();
        } catch (error) {
            console.error('Error revoking role:', error);
            this.showError('Failed to revoke role');
        }
    }

    /**
     * Load activity log with enhanced filtering
     */
    async loadActivityLog() {
        try {
            // Update activity stats
            await this.loadActivityStats();
            
            // Get filter values
            const search = document.getElementById('activitySearchInput')?.value || '';
            const type = document.getElementById('activityTypeFilter')?.value || 'all';
            const time = document.getElementById('activityTimeFilter')?.value || 'all';
            
            const activities = await this.adminManager.getRecentActivity(100);
            
            // Apply filters
            let filtered = activities;
            
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                filtered = filtered.filter(a => 
                    (a.admin_display_name || '').toLowerCase().includes(searchLower) ||
                    (a.action || '').toLowerCase().includes(searchLower) ||
                    JSON.stringify(a.details || {}).toLowerCase().includes(searchLower)
                );
            }
            
            // Type filter
            if (type !== 'all') {
                filtered = filtered.filter(a => {
                    const action = (a.action || '').toLowerCase();
                    switch(type) {
                        case 'login': return action.includes('login') || action.includes('auth');
                        case 'template': return action.includes('template');
                        case 'pack': return action.includes('pack');
                        case 'mob': return action.includes('mob');
                        case 'skill': return action.includes('skill');
                        case 'export': return action.includes('export');
                        case 'admin': return action.includes('role') || action.includes('admin') || action.includes('permission');
                        default: return true;
                    }
                });
            }
            
            // Time filter
            if (time !== 'all') {
                const now = new Date();
                let since;
                switch(time) {
                    case '1h': since = new Date(now - 60 * 60 * 1000); break;
                    case '24h': since = new Date(now - 24 * 60 * 60 * 1000); break;
                    case '7d': since = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
                    case '30d': since = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
                }
                if (since) {
                    filtered = filtered.filter(a => new Date(a.created_at) > since);
                }
            }
            
            this.renderActivityLog(filtered);
        } catch (error) {
            console.error('Error loading activity log:', error);
            this.showError('Failed to load activity log');
        }
    }

    /**
     * Load activity statistics
     */
    async loadActivityStats() {
        if (!window.supabaseClient) return;
        
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            
            // Today's count
            const { count: todayCount } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', today.toISOString());
            
            // Week's count
            const { count: weekCount } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', weekAgo.toISOString());
            
            // Unique users this week
            const { data: uniqueData } = await window.supabaseClient
                .from('user_activity_logs')
                .select('user_id')
                .gte('timestamp', weekAgo.toISOString());
            const uniqueUsers = new Set(uniqueData?.map(d => d.user_id) || []).size;
            
            // Total count
            const { count: totalCount } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true });
            
            // Update UI
            const todayEl = document.getElementById('activityTodayCount');
            const weekEl = document.getElementById('activityWeekCount');
            const uniqueEl = document.getElementById('activityUniqueUsers');
            const totalEl = document.getElementById('activityTotalCount');
            
            if (todayEl) todayEl.textContent = this.formatNumber(todayCount || 0);
            if (weekEl) weekEl.textContent = this.formatNumber(weekCount || 0);
            if (uniqueEl) uniqueEl.textContent = this.formatNumber(uniqueUsers);
            if (totalEl) totalEl.textContent = this.formatNumber(totalCount || 0);
        } catch (e) {
            console.warn('Could not load activity stats:', e);
        }
    }

    /**
     * Clear activity logs
     */
    async clearActivityLogs() {
        if (!window.supabaseClient) {
            this.showError('Database not available');
            return;
        }
        
        const confirmed = confirm('Are you sure you want to clear ALL activity logs? This cannot be undone.');
        if (!confirmed) return;
        
        try {
            const { error } = await window.supabaseClient
                .from('user_activity_logs')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            
            if (error) throw error;
            
            window.notificationModal?.alert('Activity logs cleared successfully!', 'success', 'Success');
            this.loadActivityLog();
        } catch (error) {
            console.error('Error clearing activity logs:', error);
            this.showError('Failed to clear activity logs');
        }
    }

    /**
     * Render activity log with improved design
     */
    renderActivityLog(activities) {
        const container = document.getElementById('adminActivityList');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-clipboard-list" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                    <p style="font-size: 16px; margin-bottom: 5px;">No activity found</p>
                    <p style="font-size: 13px; color: var(--text-secondary);">Try adjusting your filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-log-item" style="display: flex; gap: 15px; padding: 15px; background: var(--bg-secondary); border-radius: 10px; margin-bottom: 10px; transition: all 0.2s;">
                <div class="activity-icon" style="width: 44px; height: 44px; border-radius: 10px; background: ${this.getActivityColor(activity.action)}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="fas ${this.getActivityIcon(activity.action)}" style="color: white; font-size: 16px;"></i>
                </div>
                <div class="activity-content" style="flex: 1; min-width: 0;">
                    <div class="activity-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                        <div>
                            <strong style="color: var(--text-primary);">${this.escapeHtml(activity.admin_display_name || 'Unknown User')}</strong>
                            <span class="activity-action" style="margin-left: 8px; padding: 3px 8px; background: var(--bg-tertiary); border-radius: 4px; font-size: 12px;">${this.formatAction(activity.action)}</span>
                        </div>
                        <span class="activity-time" style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">${this.formatDate(activity.created_at)}</span>
                    </div>
                    ${activity.target_type ? `
                        <div class="activity-target" style="font-size: 13px; color: var(--text-secondary); margin-bottom: 5px;">
                            <i class="fas fa-crosshairs" style="margin-right: 5px;"></i> Target: <strong>${this.escapeHtml(activity.target_type)}</strong>
                            ${activity.target_id ? ` (${activity.target_id.substring(0, 8)}...)` : ''}
                        </div>
                    ` : ''}
                    ${activity.details && Object.keys(activity.details).length > 0 ? `
                        <details class="activity-details" style="margin-top: 8px;">
                            <summary style="cursor: pointer; color: var(--accent-primary); font-size: 12px;">View Details</summary>
                            <pre style="background: var(--bg-tertiary); padding: 10px; border-radius: 6px; margin-top: 8px; font-size: 11px; overflow-x: auto;">${JSON.stringify(activity.details, null, 2)}</pre>
                        </details>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Get activity color based on action type
     */
    getActivityColor(action) {
        const actionLower = (action || '').toLowerCase();
        if (actionLower.includes('create') || actionLower.includes('add')) return 'linear-gradient(135deg, #10b981, #059669)';
        if (actionLower.includes('delete') || actionLower.includes('remove')) return 'linear-gradient(135deg, #ef4444, #dc2626)';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'linear-gradient(135deg, #f59e0b, #d97706)';
        if (actionLower.includes('login') || actionLower.includes('auth')) return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        if (actionLower.includes('export')) return 'linear-gradient(135deg, #3b82f6, #2563eb)';
        if (actionLower.includes('role') || actionLower.includes('admin')) return 'linear-gradient(135deg, #ec4899, #db2777)';
        return 'linear-gradient(135deg, #6b7280, #4b5563)';
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
     * Filter browser items - OPTIMIZED with cached results and faster filtering
     */
    filterBrowserItems(listType) {
        if (listType === 'custom') {
            const searchInput = this._getElement('customItemSearch');
            const searchValue = (searchInput?.value || '').toLowerCase();
            
            // Fast path: no search term
            if (!searchValue) {
                this.renderCustomItems(this.allCustomItems || []);
                return;
            }
            
            const filtered = (this.allCustomItems || []).filter(item => {
                // Check name first (most likely to match)
                if (item.name.toLowerCase().includes(searchValue)) return true;
                // Then description
                if (item.description.toLowerCase().includes(searchValue)) return true;
                // Finally aliases (array iteration is slower)
                const aliases = item.aliases || [];
                for (let i = 0; i < aliases.length; i++) {
                    if (aliases[i].toLowerCase().includes(searchValue)) return true;
                }
                return false;
            });
            this.renderCustomItems(filtered);
        } else if (listType === 'builtin') {
            const searchInput = this._getElement('builtInSearch');
            const hiddenCheckbox = this._getElement('showHiddenOnly');
            const searchValue = (searchInput?.value || '').toLowerCase();
            const showHiddenOnly = hiddenCheckbox?.checked || false;
            
            const allItems = this.allBuiltInItems || [];
            
            // Fast path: no filters active
            if (!searchValue && !showHiddenOnly) {
                this.renderBuiltInItems(allItems);
                return;
            }
            
            const filtered = allItems.filter(item => {
                // Check hidden filter first (fastest check)
                if (showHiddenOnly && !item.isHidden) return false;
                
                // No search term means all items pass search
                if (!searchValue) return true;
                
                // Check name first (most likely to match)
                if (item.name.toLowerCase().includes(searchValue)) return true;
                // Then description
                if (item.description.toLowerCase().includes(searchValue)) return true;
                // Finally aliases (array iteration is slower)
                const aliases = item.aliases || [];
                for (let i = 0; i < aliases.length; i++) {
                    if (aliases[i].toLowerCase().includes(searchValue)) return true;
                }
                return false;
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
            'delete_user_template': 'fa-trash-alt',
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
     * Format number for display (K, M suffixes)
     * @param {number} num - The number to format
     * @returns {string} - The formatted number string
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
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
