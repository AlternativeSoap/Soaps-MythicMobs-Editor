/**
 * Enhanced Admin Panel Extensions
 * Adds Error Console, Permissions, Analytics, and User Profile features
 */

class AdminPanelEnhanced {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.errorLogger = window.errorLogger;
        this.permissionSystem = window.permissionSystem;
        this.initializeEnhancements();
    }

    initializeEnhancements() {
        // Add new tabs to admin panel
        this.injectNewTabs();
        this.attachEnhancedEventListeners();
        this.reattachTabListeners();
    }

    injectNewTabs() {
        const tabContainer = document.querySelector('.admin-panel-tabs');
        if (!tabContainer) return;

        // Add Error Console tab
        const errorTab = document.createElement('button');
        errorTab.className = 'admin-tab';
        errorTab.setAttribute('data-tab', 'errors');
        errorTab.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Error Console</span>
            <span class="error-count-badge" id="errorCountBadge" style="display: none;"></span>
        `;
        tabContainer.appendChild(errorTab);

        // Add Permissions tab
        const permTab = document.createElement('button');
        permTab.className = 'admin-tab';
        permTab.setAttribute('data-tab', 'permissions');
        permTab.innerHTML = `
            <i class="fas fa-key"></i>
            <span>Permissions</span>
        `;
        tabContainer.appendChild(permTab);

        // Add Analytics tab
        const analyticsTab = document.createElement('button');
        analyticsTab.className = 'admin-tab';
        analyticsTab.setAttribute('data-tab', 'analytics');
        analyticsTab.innerHTML = `
            <i class="fas fa-chart-line"></i>
            <span>Analytics</span>
        `;
        tabContainer.appendChild(analyticsTab);

        // Add Settings tab
        const settingsTab = document.createElement('button');
        settingsTab.className = 'admin-tab';
        settingsTab.setAttribute('data-tab', 'settings');
        settingsTab.innerHTML = `
            <i class="fas fa-cog"></i>
            <span>Settings</span>
        `;
        tabContainer.appendChild(settingsTab);

        // Add tab content sections
        const bodyContainer = document.querySelector('.admin-panel-body');
        if (bodyContainer) {
            bodyContainer.insertAdjacentHTML('beforeend', this.getErrorConsoleHTML());
            bodyContainer.insertAdjacentHTML('beforeend', this.getPermissionsHTML());
            bodyContainer.insertAdjacentHTML('beforeend', this.getAnalyticsHTML());
            bodyContainer.insertAdjacentHTML('beforeend', this.getSettingsHTML());
        }
    }

    getErrorConsoleHTML() {
        return `
            <div class="admin-tab-content" data-tab-content="errors">
                <div class="admin-section-header">
                    <div>
                        <h3>Error Console</h3>
                        <p>Real-time error monitoring and debugging</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary" id="btnClearErrors">
                            <i class="fas fa-trash"></i> Clear All
                        </button>
                        <button class="btn btn-primary" id="btnExportErrors">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <!-- Error Filters -->
                <div class="error-console-filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <input type="text" id="errorSearchInput" class="form-input" placeholder="Search errors..." style="flex: 1;">
                    <select id="errorTypeFilter" class="form-select" style="width: 200px;">
                        <option value="all">All Types</option>
                        <option value="runtime">Runtime Errors</option>
                        <option value="promise">Promise Rejections</option>
                        <option value="console">Console Errors</option>
                    </select>
                    <select id="errorTimeFilter" class="form-select" style="width: 200px;">
                        <option value="all">All Time</option>
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                </div>

                <!-- Error Stats -->
                <div class="error-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div class="stat-card">
                        <div class="stat-value" id="totalErrorsCount">0</div>
                        <div class="stat-label">Total Errors</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="runtimeErrorsCount">0</div>
                        <div class="stat-label">Runtime</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="promiseErrorsCount">0</div>
                        <div class="stat-label">Promises</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="consoleErrorsCount">0</div>
                        <div class="stat-label">Console</div>
                    </div>
                </div>

                <!-- Error List -->
                <div class="error-console-list" id="errorConsoleList" style="max-height: 500px; overflow-y: auto;">
                    <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p style="font-size: 18px; margin-bottom: 5px;">No Errors Detected</p>
                        <p style="font-size: 14px;">All systems running smoothly!</p>
                    </div>
                </div>
            </div>
        `;
    }

    getPermissionsHTML() {
        const roles = Object.keys(this.permissionSystem.DEFAULT_ROLES);
        const permissions = Object.entries(this.permissionSystem.PERMISSIONS);

        return `
            <div class="admin-tab-content" data-tab-content="permissions">
                <div class="admin-section-header">
                    <div>
                        <h3>Role Permissions</h3>
                        <p>Manage permissions for each role</p>
                    </div>
                    <button class="btn btn-primary" id="btnSavePermissions">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>

                <div class="permissions-editor" style="display: flex; gap: 20px;">
                    <!-- Role Selector -->
                    <div class="role-list" style="width: 250px;">
                        <h4 style="margin-bottom: 15px;">Roles</h4>
                        ${roles.map(role => `
                            <div class="role-item ${role === 'super_admin' ? 'active' : ''}" data-role="${role}">
                                <i class="fas fa-${role === 'super_admin' ? 'crown' : role === 'template_admin' ? 'layer-group' : role === 'moderator' ? 'shield-alt' : 'user'}"></i>
                                <span>${role.replace('_', ' ').toUpperCase()}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Permission Checkboxes -->
                    <div class="permission-list" style="flex: 1;">
                        <h4 style="margin-bottom: 15px;">Permissions for <span id="currentRoleLabel">Super Admin</span></h4>
                        <div class="permission-groups">
                            ${Object.entries(this.groupPermissions()).map(([group, perms]) => `
                                <div class="permission-group" style="margin-bottom: 20px;">
                                    <h5 style="margin-bottom: 10px; color: var(--accent-primary); text-transform: capitalize;">${group}</h5>
                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                        ${perms.map(([key, label]) => `
                                            <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px;">
                                                <input type="checkbox" class="permission-checkbox" data-permission="${key}" value="${key}">
                                                <span>${label}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    groupPermissions() {
        const grouped = {};
        for (const [key, label] of Object.entries(this.permissionSystem.PERMISSIONS)) {
            const group = key.split('.')[0];
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push([key, label]);
        }
        return grouped;
    }

    getAnalyticsHTML() {
        return `
            <div class="admin-tab-content" data-tab-content="analytics">
                <div class="admin-section-header">
                    <div>
                        <h3>Analytics Dashboard</h3>
                        <p>Usage statistics and trends</p>
                    </div>
                    <button class="btn btn-secondary" id="btnRefreshAnalytics">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>

                <!-- Key Metrics -->
                <div class="analytics-metrics" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-users"></i></div>
                        <div class="metric-value" id="totalUsersMetric">-</div>
                        <div class="metric-label">Total Users</div>
                        <div class="metric-change positive" id="usersChange">-</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-layer-group"></i></div>
                        <div class="metric-value" id="totalTemplatesMetric">-</div>
                        <div class="metric-label">Templates</div>
                        <div class="metric-change positive" id="templatesChange">-</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-download"></i></div>
                        <div class="metric-value" id="totalDownloadsMetric">-</div>
                        <div class="metric-label">Downloads</div>
                        <div class="metric-change positive" id="downloadsChange">-</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon"><i class="fas fa-clock"></i></div>
                        <div class="metric-value" id="activeUsersMetric">-</div>
                        <div class="metric-label">Active Today</div>
                        <div class="metric-change" id="activeChange">-</div>
                    </div>
                </div>

                <!-- Charts -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div class="chart-container">
                        <h4>User Registration Trend</h4>
                        <canvas id="userRegistrationChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Template Creation Trend</h4>
                        <canvas id="templateCreationChart"></canvas>
                    </div>
                </div>

                <!-- Popular Templates -->
                <div class="popular-templates" style="margin-top: 30px;">
                    <h4 style="margin-bottom: 15px;">Most Popular Templates</h4>
                    <div id="popularTemplatesList"></div>
                </div>
            </div>
        `;
    }

    getSettingsHTML() {
        return `
            <div class="admin-tab-content" data-tab-content="settings">
                <div class="admin-section-header">
                    <div>
                        <h3>System Settings</h3>
                        <p>Configure system-wide settings</p>
                    </div>
                    <button class="btn btn-primary" id="btnSaveSettings">
                        <i class="fas fa-save"></i> Save Settings
                    </button>
                </div>

                <div class="settings-sections">
                    <!-- Feature Flags -->
                    <div class="settings-section">
                        <h4><i class="fas fa-flag"></i> Feature Flags</h4>
                        <div class="setting-item">
                            <label class="toggle-label">
                                <input type="checkbox" id="featureTemplates" checked>
                                <span>Enable Template System</span>
                            </label>
                            <small>Allow users to create and share templates</small>
                        </div>
                        <div class="setting-item">
                            <label class="toggle-label">
                                <input type="checkbox" id="featureSocialSharing" checked>
                                <span>Enable Social Sharing</span>
                            </label>
                            <small>Allow users to share packs publicly</small>
                        </div>
                        <div class="setting-item">
                            <label class="toggle-label">
                                <input type="checkbox" id="featureAnalytics" checked>
                                <span>Enable Analytics</span>
                            </label>
                            <small>Track usage statistics</small>
                        </div>
                    </div>

                    <!-- Maintenance Mode -->
                    <div class="settings-section">
                        <h4><i class="fas fa-tools"></i> Maintenance Mode</h4>
                        <div class="setting-item">
                            <label class="toggle-label">
                                <input type="checkbox" id="maintenanceMode">
                                <span>Enable Maintenance Mode</span>
                            </label>
                            <small>Restrict access to admins only</small>
                        </div>
                        <div class="form-group">
                            <label>Maintenance Message</label>
                            <textarea id="maintenanceMessage" class="form-input" rows="3" placeholder="System maintenance in progress..."></textarea>
                        </div>
                    </div>

                    <!-- Rate Limiting -->
                    <div class="settings-section">
                        <h4><i class="fas fa-tachometer-alt"></i> Rate Limiting</h4>
                        <div class="form-group">
                            <label>API Requests per Minute</label>
                            <input type="number" id="apiRateLimit" class="form-input" value="60" min="10" max="1000">
                        </div>
                        <div class="form-group">
                            <label>Template Submissions per Hour</label>
                            <input type="number" id="templateRateLimit" class="form-input" value="10" min="1" max="100">
                        </div>
                    </div>

                    <!-- Storage Limits -->
                    <div class="settings-section">
                        <h4><i class="fas fa-database"></i> Storage Limits</h4>
                        <div class="form-group">
                            <label>Max Pack Size (MB)</label>
                            <input type="number" id="maxPackSize" class="form-input" value="50" min="1" max="500">
                        </div>
                        <div class="form-group">
                            <label>Max Packs per User</label>
                            <input type="number" id="maxPacksPerUser" class="form-input" value="100" min="1" max="1000">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    reattachTabListeners() {
        // Store original switchTab method
        const originalSwitchTab = this.adminPanel.switchTab.bind(this.adminPanel);
        
        // Override switchTab to handle our new tabs
        this.adminPanel.switchTab = (tabName) => {
            // Call original method
            originalSwitchTab(tabName);
            
            // Handle our new tabs
            if (tabName === 'errors') {
                this.refreshErrorList();
                this.updateErrorCount();
            } else if (tabName === 'permissions') {
                this.loadRolePermissions('super_admin');
            } else if (tabName === 'analytics') {
                this.loadAnalytics();
            } else if (tabName === 'settings') {
                this.loadSettings();
            }
        };
        
        // Reattach tab switching for all tabs (including newly injected ones)
        document.querySelectorAll('.admin-tab').forEach(tab => {
            // Remove old listeners by cloning
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            // Add new listener
            newTab.addEventListener('click', () => {
                this.adminPanel.switchTab(newTab.dataset.tab);
            });
        });
    }

    attachEnhancedEventListeners() {
        // Error Console listeners
        this.setupErrorConsole();
        
        // Permissions listeners
        this.setupPermissionsEditor();
        
        // Analytics listeners
        this.setupAnalytics();
        
        // Settings listeners
        this.setupSettings();
    }

    setupErrorConsole() {
        // Subscribe to new errors
        if (this.errorLogger) {
            this.errorLogger.subscribe((error) => {
                this.updateErrorCount();
                this.refreshErrorList();
            });
        }

        // Clear errors button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnClearErrors')) {
                if (confirm('Clear all error logs?')) {
                    this.errorLogger?.clearErrors();
                    this.refreshErrorList();
                    this.updateErrorCount();
                }
            }
        });

        // Export errors button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnExportErrors')) {
                this.exportErrors();
            }
        });

        // Filter changes
        ['errorSearchInput', 'errorTypeFilter', 'errorTimeFilter'].forEach(id => {
            document.addEventListener('change', (e) => {
                if (e.target.id === id) {
                    this.refreshErrorList();
                }
            });
            document.addEventListener('input', (e) => {
                if (e.target.id === id) {
                    this.refreshErrorList();
                }
            });
        });
    }

    updateErrorCount() {
        const badge = document.getElementById('errorCountBadge');
        if (!badge || !this.errorLogger) return;

        const count = this.errorLogger.errors.length;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    refreshErrorList() {
        const container = document.getElementById('errorConsoleList');
        if (!container || !this.errorLogger) return;

        // Get filters
        const search = document.getElementById('errorSearchInput')?.value || '';
        const type = document.getElementById('errorTypeFilter')?.value || 'all';
        const time = document.getElementById('errorTimeFilter')?.value || 'all';

        // Calculate time filter
        let since = null;
        if (time !== 'all') {
            const now = new Date();
            if (time === '1h') since = new Date(now - 60 * 60 * 1000);
            else if (time === '24h') since = new Date(now - 24 * 60 * 60 * 1000);
            else if (time === '7d') since = new Date(now - 7 * 24 * 60 * 60 * 1000);
        }

        // Get filtered errors
        const errors = this.errorLogger.getErrors({
            type: type === 'all' ? null : type,
            search: search,
            since: since
        });

        // Update stats
        this.updateErrorStats(errors);

        // Render errors
        if (errors.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p style="font-size: 18px; margin-bottom: 5px;">No Errors Found</p>
                    <p style="font-size: 14px;">Adjust filters to see more errors</p>
                </div>
            `;
            return;
        }

        container.innerHTML = errors.map((error, index) => `
            <div class="error-item" data-error-index="${index}">
                <div class="error-header">
                    <span class="error-type-badge ${error.type}">${error.type}</span>
                    <span class="error-time">${this.formatTime(error.timestamp)}</span>
                </div>
                <div class="error-message">${this.escapeHtml(error.message)}</div>
                ${error.source ? `<div class="error-source">${error.source}:${error.line}:${error.column}</div>` : ''}
                ${error.stack ? `
                    <details class="error-stack">
                        <summary>Stack Trace</summary>
                        <pre>${this.escapeHtml(error.stack)}</pre>
                    </details>
                ` : ''}
            </div>
        `).join('');
    }

    updateErrorStats(errors) {
        document.getElementById('totalErrorsCount').textContent = errors.length;
        document.getElementById('runtimeErrorsCount').textContent = errors.filter(e => e.type === 'runtime').length;
        document.getElementById('promiseErrorsCount').textContent = errors.filter(e => e.type === 'promise').length;
        document.getElementById('consoleErrorsCount').textContent = errors.filter(e => e.type === 'console').length;
    }

    exportErrors() {
        if (!this.errorLogger) return;

        const data = this.errorLogger.exportErrors();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    setupPermissionsEditor() {
        // Role selection
        document.addEventListener('click', (e) => {
            const roleItem = e.target.closest('.role-item');
            if (!roleItem) return;

            // Update active state
            document.querySelectorAll('.role-item').forEach(item => item.classList.remove('active'));
            roleItem.classList.add('active');

            // Load permissions for this role
            const role = roleItem.dataset.role;
            this.loadRolePermissions(role);
        });

        // Save permissions
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnSavePermissions')) {
                this.savePermissions();
            }
        });

        // Load initial role
        this.loadRolePermissions('super_admin');
    }

    loadRolePermissions(role) {
        document.getElementById('currentRoleLabel').textContent = role.replace('_', ' ').toUpperCase();
        
        const permissions = this.permissionSystem.getRolePermissions(role);
        
        document.querySelectorAll('.permission-checkbox').forEach(checkbox => {
            checkbox.checked = permissions.includes(checkbox.dataset.permission);
            // Disable checkboxes for super_admin (always has all permissions)
            checkbox.disabled = role === 'super_admin';
        });
    }

    savePermissions() {
        const activeRole = document.querySelector('.role-item.active')?.dataset.role;
        if (!activeRole) return;

        const permissions = Array.from(document.querySelectorAll('.permission-checkbox:checked'))
            .map(cb => cb.dataset.permission);

        this.permissionSystem.setRolePermissions(activeRole, permissions);
        
        window.notificationModal?.alert('Permissions saved successfully!', 'success', 'Success');
    }

    setupAnalytics() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnRefreshAnalytics')) {
                this.loadAnalytics();
            }
        });
    }

    async loadAnalytics() {
        if (!window.supabaseClient) {
            console.warn('Supabase not available for analytics');
            return;
        }

        try {
            // Show loading state
            const metrics = ['totalUsersMetric', 'totalTemplatesMetric', 'totalDownloadsMetric', 'activeUsersMetric'];
            metrics.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '...';
            });

            // Fetch total users from auth.users (using RPC for security)
            const totalUsers = await this.fetchTotalUsers();
            
            // Fetch total templates
            const { count: totalTemplates } = await window.supabaseClient
                .from('templates')
                .select('*', { count: 'exact', head: true })
                .eq('deleted', false);

            // Fetch total admin users
            const { data: adminUsers } = await window.supabaseClient
                .from('admin_roles')
                .select('user_id', { count: 'exact' });
            const uniqueAdmins = new Set(adminUsers?.map(a => a.user_id) || []).size;

            // Fetch recent activity (last 24 hours)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const { count: activeToday } = await window.supabaseClient
                .from('user_activity_logs')
                .select('user_id', { count: 'exact', head: true })
                .gte('timestamp', yesterday.toISOString());

            // Fetch activity for trend calculation (last 7 days)
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const { count: activityLastWeek } = await window.supabaseClient
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', lastWeek.toISOString());

            // Update metrics
            document.getElementById('totalUsersMetric').textContent = this.formatNumber(totalUsers || 0);
            document.getElementById('usersChange').textContent = totalUsers > 0 ? `${uniqueAdmins} admins` : 'No data';
            
            document.getElementById('totalTemplatesMetric').textContent = this.formatNumber(totalTemplates || 0);
            document.getElementById('templatesChange').textContent = totalTemplates > 0 ? 'Active templates' : 'No templates';
            
            document.getElementById('totalDownloadsMetric').textContent = this.formatNumber(activityLastWeek || 0);
            document.getElementById('downloadsChange').textContent = 'Last 7 days';
            
            document.getElementById('activeUsersMetric').textContent = this.formatNumber(activeToday || 0);
            document.getElementById('activeChange').textContent = 'Last 24 hours';

            // Load popular templates
            await this.loadPopularTemplates();

        } catch (error) {
            console.error('Failed to load analytics:', error);
            
            // Show error state
            ['totalUsersMetric', 'totalTemplatesMetric', 'totalDownloadsMetric', 'activeUsersMetric'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = 'Error';
            });
        }
    }

    async fetchTotalUsers() {
        try {
            // Try to count from user_profiles (more reliable)
            const { count } = await window.supabaseClient
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });
            
            if (count !== null) return count;
            
            // Fallback: count from templates owners
            const { data: templates } = await window.supabaseClient
                .from('templates')
                .select('owner_id');
            
            return new Set(templates?.map(t => t.owner_id) || []).size;
        } catch (error) {
            console.warn('Could not fetch user count:', error);
            return 0;
        }
    }

    async loadPopularTemplates() {
        try {
            const { data: templates } = await window.supabaseClient
                .from('templates')
                .select('id, name, type, owner_id, created_at')
                .eq('deleted', false)
                .eq('is_official', true)
                .order('created_at', { ascending: false })
                .limit(5);

            const container = document.getElementById('popularTemplatesList');
            if (!container) return;

            if (!templates || templates.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No official templates yet</p>';
                return;
            }

            container.innerHTML = templates.map(t => `
                <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${this.escapeHtml(t.name)}</strong>
                            <span style="margin-left: 10px; padding: 2px 8px; background: var(--accent-primary); color: white; border-radius: 4px; font-size: 11px;">${t.type}</span>
                        </div>
                        <small style="color: var(--text-secondary);">${new Date(t.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load popular templates:', error);
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    setupSettings() {
        // Load saved settings
        this.loadSettings();

        // Save settings
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnSaveSettings')) {
                this.saveSettings();
            }
        });
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
            
            // Feature flags
            if (settings.featureTemplates !== undefined) {
                document.getElementById('featureTemplates').checked = settings.featureTemplates;
            }
            if (settings.featureSocialSharing !== undefined) {
                document.getElementById('featureSocialSharing').checked = settings.featureSocialSharing;
            }
            if (settings.featureAnalytics !== undefined) {
                document.getElementById('featureAnalytics').checked = settings.featureAnalytics;
            }

            // Maintenance
            if (settings.maintenanceMode !== undefined) {
                document.getElementById('maintenanceMode').checked = settings.maintenanceMode;
            }
            if (settings.maintenanceMessage) {
                document.getElementById('maintenanceMessage').value = settings.maintenanceMessage;
            }

            // Rate limiting
            if (settings.apiRateLimit) {
                document.getElementById('apiRateLimit').value = settings.apiRateLimit;
            }
            if (settings.templateRateLimit) {
                document.getElementById('templateRateLimit').value = settings.templateRateLimit;
            }

            // Storage
            if (settings.maxPackSize) {
                document.getElementById('maxPackSize').value = settings.maxPackSize;
            }
            if (settings.maxPacksPerUser) {
                document.getElementById('maxPacksPerUser').value = settings.maxPacksPerUser;
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    saveSettings() {
        const settings = {
            featureTemplates: document.getElementById('featureTemplates').checked,
            featureSocialSharing: document.getElementById('featureSocialSharing').checked,
            featureAnalytics: document.getElementById('featureAnalytics').checked,
            maintenanceMode: document.getElementById('maintenanceMode').checked,
            maintenanceMessage: document.getElementById('maintenanceMessage').value,
            apiRateLimit: parseInt(document.getElementById('apiRateLimit').value),
            templateRateLimit: parseInt(document.getElementById('templateRateLimit').value),
            maxPackSize: parseInt(document.getElementById('maxPackSize').value),
            maxPacksPerUser: parseInt(document.getElementById('maxPacksPerUser').value)
        };

        localStorage.setItem('admin_settings', JSON.stringify(settings));
        window.notificationModal?.alert('Settings saved successfully!', 'success', 'Success');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' minutes ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
        return date.toLocaleString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when admin panel is created
if (typeof window !== 'undefined') {
}
